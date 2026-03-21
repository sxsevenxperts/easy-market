/**
 * Serviço de Rastreamento de Perdas de Produtos
 * Easy Market - Redução de Desperdício e Análise de Eficiência
 */

const { pool } = require('../config/database');
const logger = require('../config/logger');

// ============================================
// 1. CALCULAR TAXA DE PERDA ATUAL
// ============================================
async function calcularTaxaPerda(lojaId, periodo = '30') {
  try {
    const resultado = await pool.query(`
      WITH perdas_periodo AS (
        SELECT
          p.loja_id,
          p.produto_id,
          pr.nome as nome_produto,
          pr.categoria,
          SUM(p.quantidade_perdida) as total_perdido,
          SUM(p.valor_perdido) as valor_total_perdido,
          COUNT(*) as numero_registros,
          MAX(p.data_registro) as ultima_perda
        FROM perdas_produtos p
        LEFT JOIN produtos pr ON p.produto_id = pr.produto_id
        WHERE p.loja_id = $1
          AND p.data_registro > NOW() - INTERVAL '1 day' * $2::int
        GROUP BY p.loja_id, p.produto_id, pr.nome, pr.categoria
      ),
      vendas_periodo AS (
        SELECT
          v.loja_id,
          v.produto_id,
          SUM(p.quantidade) as quantidade_vendida,
          SUM(v.valor_total) as valor_vendido
        FROM vendas v
        LEFT JOIN produtos p ON v.produto_id = p.produto_id
        WHERE v.loja_id = $1
          AND v.data_venda > NOW() - INTERVAL '1 day' * $2::int
        GROUP BY v.loja_id, v.produto_id
      ),
      estoque_info AS (
        SELECT
          loja_id,
          SUM(quantidade_atual) as quantidade_total_estoque,
          SUM(valor_total) as valor_total_estoque
        FROM inventario
        WHERE loja_id = $1
      )
      SELECT
        'taxa_perda' as metrica,
        ROUND(
          (COALESCE(SUM(pp.total_perdido), 0) / 
           NULLIF(COALESCE(SUM(vp.quantidade_vendida), 0) + COALESCE(SUM(pp.total_perdido), 0), 0)
          ) * 100, 2
        ) as percentual_perda,
        COALESCE(SUM(pp.total_perdido), 0)::int as quantidade_total_perdida,
        COALESCE(SUM(pp.valor_total_perdido), 0)::numeric as valor_total_perdido,
        COALESCE(SUM(vp.quantidade_vendida), 0)::int as quantidade_vendida,
        COALESCE(SUM(vp.valor_vendido), 0)::numeric as valor_vendido,
        (SELECT quantidade_total_estoque FROM estoque_info) as quantidade_estoque,
        (SELECT valor_total_estoque FROM estoque_info) as valor_estoque,
        COUNT(DISTINCT pp.produto_id) as produtos_com_perda
      FROM perdas_periodo pp
      LEFT JOIN vendas_periodo vp ON pp.produto_id = vp.produto_id
    `, [lojaId, periodo]);

    const stats = resultado.rows[0];
    
    return {
      loja_id: lojaId,
      periodo_dias: parseInt(periodo),
      taxa_perda_percentual: parseFloat(stats.percentual_perda) || 0,
      quantidade_total_perdida: stats.quantidade_total_perdida || 0,
      valor_total_perdido: Math.round(parseFloat(stats.valor_total_perdido) || 0),
      quantidade_vendida: stats.quantidade_vendida || 0,
      valor_vendido: Math.round(parseFloat(stats.valor_vendido) || 0),
      quantidade_estoque: stats.quantidade_estoque || 0,
      valor_estoque: Math.round(parseFloat(stats.valor_estoque) || 0),
      produtos_afetados: stats.produtos_com_perda || 0,
      classificacao: stats.percentual_perda > 10 ? 'crítico' : stats.percentual_perda > 5 ? 'alto' : 'normal',
      recomendacoes: geradorRecomendacoes(stats.percentual_perda)
    };

  } catch (error) {
    logger.error('Erro ao calcular taxa de perda:', error);
    throw error;
  }
}

// ============================================
// 2. REDUÇÃO DE PERDAS (Comparativo)
// ============================================
async function calcularReducaoPerda(lojaId) {
  try {
    // Período 1: 60-31 dias atrás
    const resultado30_60 = await pool.query(`
      SELECT
        ROUND(
          (SUM(quantidade_perdida) / NULLIF(
            (SELECT COUNT(DISTINCT DATE(data_venda)) FROM vendas 
             WHERE loja_id = $1 AND data_venda > NOW() - INTERVAL '60 days' 
             AND data_venda <= NOW() - INTERVAL '30 days'), 0
          )), 2
        ) as perda_media_diaria
      FROM perdas_produtos
      WHERE loja_id = $1
        AND data_registro > NOW() - INTERVAL '60 days'
        AND data_registro <= NOW() - INTERVAL '30 days'
    `, [lojaId]);

    // Período 2: Últimos 30 dias
    const resultado0_30 = await pool.query(`
      SELECT
        ROUND(
          (SUM(quantidade_perdida) / NULLIF(
            (SELECT COUNT(DISTINCT DATE(data_venda)) FROM vendas 
             WHERE loja_id = $1 AND data_venda > NOW() - INTERVAL '30 days'), 0
          )), 2
        ) as perda_media_diaria
      FROM perdas_produtos
      WHERE loja_id = $1
        AND data_registro > NOW() - INTERVAL '30 days'
    `, [lojaId]);

    const perda60_30 = parseFloat(resultado30_60.rows[0]?.perda_media_diaria) || 0;
    const perda0_30 = parseFloat(resultado0_30.rows[0]?.perda_media_diaria) || 0;
    
    const reducao = perda60_30 > 0 
      ? ((perda60_30 - perda0_30) / perda60_30) * 100 
      : 0;

    return {
      loja_id: lojaId,
      periodo_anterior: {
        nome: 'Últimos 30-60 dias',
        perda_media_diaria: perda60_30
      },
      periodo_atual: {
        nome: 'Últimos 30 dias',
        perda_media_diaria: perda0_30
      },
      reducao_percentual: Math.round(reducao * 100) / 100,
      reducao_alcancada: reducao > 0 ? 'sim' : 'não',
      tendencia: reducao > 0 ? 'melhora' : reducao < 0 ? 'piora' : 'estavel',
      delta_unidades: Math.round((perda60_30 - perda0_30) * 100) / 100,
      recomendacao: gerarRecomendacaoReducao(reducao)
    };

  } catch (error) {
    logger.error('Erro ao calcular redução de perda:', error);
    throw error;
  }
}

// ============================================
// 3. PRODUTOS COM MAIOR PERDA
// ============================================
async function listarProdutosComMaiorPerda(lojaId, limite = 10) {
  try {
    const resultado = await pool.query(`
      WITH perdas_30d AS (
        SELECT
          p.produto_id,
          pr.nome,
          pr.categoria,
          pr.preco_venda,
          SUM(p.quantidade_perdida) as total_perdido,
          SUM(p.valor_perdido) as valor_perdido,
          COUNT(*) as numero_perdas,
          MAX(p.data_registro) as ultima_perda,
          ROW_NUMBER() OVER (ORDER BY SUM(p.quantidade_perdida) DESC) as rank
        FROM perdas_produtos p
        LEFT JOIN produtos pr ON p.produto_id = pr.produto_id
        WHERE p.loja_id = $1
          AND p.data_registro > NOW() - INTERVAL '30 days'
        GROUP BY p.produto_id, pr.nome, pr.categoria, pr.preco_venda
      ),
      vendas_30d AS (
        SELECT
          produto_id,
          COUNT(*) as vezes_vendido,
          SUM(p.quantidade) as quantidade_vendida
        FROM vendas v
        LEFT JOIN produtos p ON v.produto_id = p.produto_id
        WHERE v.loja_id = $1
          AND v.data_venda > NOW() - INTERVAL '30 days'
        GROUP BY v.produto_id
      )
      SELECT
        rank,
        produto_id,
        nome,
        categoria,
        total_perdido as quantidade_perdida,
        valor_perdido,
        numero_perdas,
        COALESCE(v.quantidade_vendida, 0) as quantidade_vendida,
        ROUND(
          (total_perdido / NULLIF(COALESCE(v.quantidade_vendida, 0) + total_perdido, 0)) * 100, 2
        ) as taxa_perda_pct,
        ultima_perda,
        CASE 
          WHEN (total_perdido / NULLIF(COALESCE(v.quantidade_vendida, 0) + total_perdido, 0)) > 0.10 THEN 'crítico'
          WHEN (total_perdido / NULLIF(COALESCE(v.quantidade_vendida, 0) + total_perdido, 0)) > 0.05 THEN 'alto'
          ELSE 'médio'
        END as nivel_risco
      FROM perdas_30d
      LEFT JOIN vendas_30d v ON perdas_30d.produto_id = v.produto_id
      ORDER BY rank
      LIMIT $2
    `, [lojaId, limite]);

    return {
      loja_id: lojaId,
      periodo_dias: 30,
      total_produtos_afetados: resultado.rowCount,
      produtos: resultado.rows.map(p => ({
        rank: p.rank,
        produto_id: p.produto_id,
        nome: p.nome,
        categoria: p.categoria,
        quantidade_perdida: p.quantidade_perdida,
        valor_perdido: Math.round(parseFloat(p.valor_perdido) || 0),
        numero_perdas: p.numero_perdas,
        quantidade_vendida: p.quantidade_vendida,
        taxa_perda_pct: parseFloat(p.taxa_perda_pct),
        nivel_risco: p.nivel_risco,
        ultima_perda: p.ultima_perda,
        acao_recomendada: gerarAcaoPerda(p.taxa_perda_pct, p.nivel_risco)
      }))
    };

  } catch (error) {
    logger.error('Erro ao listar produtos com maior perda:', error);
    throw error;
  }
}

// ============================================
// 4. REGISTRAR PERDA DE PRODUTO
// ============================================
async function registrarPerda(lojaId, produtoId, quantidadePerdida, motivo, observacoes = '') {
  try {
    // Obter preço do produto
    const produtoResult = await pool.query(
      'SELECT preco_venda FROM produtos WHERE produto_id = $1',
      [produtoId]
    );

    if (produtoResult.rows.length === 0) {
      throw new Error('Produto não encontrado');
    }

    const precoProduto = parseFloat(produtoResult.rows[0].preco_venda);
    const valorPerdido = quantidadePerdida * precoProduto;

    const resultado = await pool.query(`
      INSERT INTO perdas_produtos 
      (loja_id, produto_id, quantidade_perdida, valor_perdido, motivo, observacoes, data_registro)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [lojaId, produtoId, quantidadePerdida, valorPerdido, motivo, observacoes]);

    logger.info(`Perda registrada: ${quantidadePerdida} unidades de produto ${produtoId}`);

    return {
      sucesso: true,
      perda_id: resultado.rows[0].perda_id,
      quantidade: quantidadePerdida,
      valor: Math.round(valorPerdido),
      motivo: motivo,
      data_registro: resultado.rows[0].data_registro
    };

  } catch (error) {
    logger.error('Erro ao registrar perda:', error);
    throw error;
  }
}

// ============================================
// 5. ANÁLISE DE PERDAS POR CATEGORIA
// ============================================
async function analisarPerdasPorCategoria(lojaId) {
  try {
    const resultado = await pool.query(`
      WITH perdas_categoria AS (
        SELECT
          pr.categoria,
          COUNT(*) as numero_perdas,
          SUM(p.quantidade_perdida) as quantidade_total,
          SUM(p.valor_perdido) as valor_total,
          AVG(p.quantidade_perdida) as quantidade_media,
          ROW_NUMBER() OVER (ORDER BY SUM(p.quantidade_perdida) DESC) as rank
        FROM perdas_produtos p
        LEFT JOIN produtos pr ON p.produto_id = pr.produto_id
        WHERE p.loja_id = $1
          AND p.data_registro > NOW() - INTERVAL '30 days'
        GROUP BY pr.categoria
      )
      SELECT
        rank,
        categoria,
        numero_perdas,
        quantidade_total,
        valor_total,
        ROUND(quantidade_media, 2) as quantidade_media,
        ROUND((valor_total / (SELECT SUM(valor_perdido) FROM perdas_produtos 
                             WHERE loja_id = $1 AND data_registro > NOW() - INTERVAL '30 days')) * 100, 2) as percentual_do_total
      FROM perdas_categoria
      ORDER BY rank
    `, [lojaId]);

    return {
      loja_id: lojaId,
      periodo_dias: 30,
      total_categorias_afetadas: resultado.rowCount,
      categorias: resultado.rows.map(c => ({
        rank: c.rank,
        categoria: c.categoria,
        numero_perdas: c.numero_perdas,
        quantidade_total: c.quantidade_total,
        valor_total: Math.round(parseFloat(c.valor_total) || 0),
        quantidade_media: parseFloat(c.quantidade_media),
        percentual_do_total: parseFloat(c.percentual_do_total)
      }))
    };

  } catch (error) {
    logger.error('Erro ao analisar perdas por categoria:', error);
    throw error;
  }
}

// ============================================
// 6. MOTIVOS DE PERDA (Análise)
// ============================================
async function analisarMotivosPerdas(lojaId) {
  try {
    const resultado = await pool.query(`
      SELECT
        motivo,
        COUNT(*) as numero_registros,
        SUM(quantidade_perdida) as quantidade_total,
        SUM(valor_perdido) as valor_total,
        ROUND(AVG(quantidade_perdida), 2) as quantidade_media,
        ROUND((SUM(quantidade_perdida) / (SELECT SUM(quantidade_perdida) FROM perdas_produtos 
                                          WHERE loja_id = $1 AND data_registro > NOW() - INTERVAL '30 days')) * 100, 2) as percentual
      FROM perdas_produtos
      WHERE loja_id = $1
        AND data_registro > NOW() - INTERVAL '30 days'
      GROUP BY motivo
      ORDER BY quantidade_total DESC
    `, [lojaId]);

    return {
      loja_id: lojaId,
      periodo_dias: 30,
      total_motivos: resultado.rowCount,
      motivos: resultado.rows.map(m => ({
        motivo: m.motivo,
        numero_registros: m.numero_registros,
        quantidade_total: m.quantidade_total,
        valor_total: Math.round(parseFloat(m.valor_total) || 0),
        quantidade_media: parseFloat(m.quantidade_media),
        percentual: parseFloat(m.percentual),
        prioridade: m.percentual > 30 ? 'alta' : m.percentual > 15 ? 'média' : 'baixa'
      }))
    };

  } catch (error) {
    logger.error('Erro ao analisar motivos de perdas:', error);
    throw error;
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function geradorRecomendacoes(taxaPerda) {
  const recomendacoes = [];

  if (taxaPerda > 15) {
    recomendacoes.push('🚨 CRÍTICO: Taxa de perda muito alta. Revisar processos de armazenamento e manuseio');
  } else if (taxaPerda > 10) {
    recomendacoes.push('⚠️ ALTO: Taxa de perda acima do esperado. Investigar causas principais');
  } else if (taxaPerda > 5) {
    recomendacoes.push('📊 MÉDIO: Taxa de perda moderada. Continue monitorando');
  } else {
    recomendacoes.push('✅ BOM: Taxa de perda sob controle. Manter procedimentos');
  }

  recomendacoes.push('💡 Implemente sistema de rastreamento de produtos em tempo real');
  recomendacoes.push('📋 Revise frequência de auditorias de estoque');

  return recomendacoes;
}

function gerarRecomendacaoReducao(reducao) {
  if (reducao > 20) {
    return '🎉 Excelente redução de perdas! Continue com os procedimentos atuais';
  } else if (reducao > 10) {
    return '👍 Boa melhora na redução de perdas. Mantenha os esforços';
  } else if (reducao > 0) {
    return '📈 Leve melhora. Intensifique os controles';
  } else if (reducao === 0) {
    return '➡️ Perdas estáveis. Revise estratégia de redução';
  } else {
    return '⚠️ Perdas aumentaram. Ação imediata necessária';
  }
}

function gerarAcaoPerda(taxaPerda, nivelRisco) {
  if (nivelRisco === 'crítico') {
    return 'Investigar imediatamente + Implementar controle diário';
  } else if (nivelRisco === 'alto') {
    return 'Revisar procedimentos + Aumentar frequência de auditoria';
  } else {
    return 'Monitorar + Manter procedimentos atuais';
  }
}

module.exports = {
  calcularTaxaPerda,
  calcularReducaoPerda,
  listarProdutosComMaiorPerda,
  registrarPerda,
  analisarPerdasPorCategoria,
  analisarMotivosPerdas
};
