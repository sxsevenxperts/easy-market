/**
 * Serviço de Configuração de Taxa de Segurança
 * Permite que cada supermercado configure suas próprias taxas de segurança
 * - Taxa padrão da loja
 * - Taxa customizada por produto
 * - Taxa por categoria
 * - Política de risco (conservador, balanceado, agressivo)
 */

const { pool } = require('../config/database');

class ConfiguracaoSeguranca {
  /**
   * Obter configuração de segurança da loja
   */
  static async obterConfiguracaoLoja(lojaId) {
    try {
      const query = `
        SELECT 
          id,
          loja_id,
          taxa_seguranca_padrao,
          taxa_bebidas,
          taxa_alimentos_pereciveis,
          taxa_alimentos_nao_pereciveis,
          taxa_higiene_limpeza,
          taxa_eletronicos,
          taxa_outros,
          politica_risco_aceitavel,
          considerar_sazonalidade,
          considerar_perecibilidade,
          criada_em,
          atualizada_em,
          atualizada_por
        FROM configuracao_seguranca_loja
        WHERE loja_id = $1
      `;

      const resultado = await pool.query(query, [lojaId]);
      
      if (resultado.rows.length === 0) {
        // Criar configuração padrão se não existir
        const insertQuery = `
          INSERT INTO configuracao_seguranca_loja (loja_id, taxa_seguranca_padrao, politica_risco_aceitavel)
          VALUES ($1, 0.15, 'BALANCEADO')
          RETURNING *
        `;
        const insertResult = await pool.query(insertQuery, [lojaId]);
        return insertResult.rows[0];
      }

      return resultado.rows[0];
    } catch (error) {
      throw new Error(`Erro ao obter configuração da loja: ${error.message}`);
    }
  }

  /**
   * Atualizar configuração de taxa padrão da loja
   */
  static async atualizarTaxaPadrao(lojaId, taxaPadrao, usuarioId) {
    try {
      // Validar taxa (5% a 30%)
      if (taxaPadrao < 0.05 || taxaPadrao > 0.30) {
        throw new Error('Taxa deve estar entre 0.05 (5%) e 0.30 (30%)');
      }

      const query = `
        UPDATE configuracao_seguranca_loja
        SET taxa_seguranca_padrao = $1, atualizada_em = NOW(), atualizada_por = $2
        WHERE loja_id = $3
        RETURNING *
      `;

      const resultado = await pool.query(query, [taxaPadrao, usuarioId, lojaId]);
      
      if (resultado.rows.length === 0) {
        throw new Error('Configuração não encontrada');
      }

      return resultado.rows[0];
    } catch (error) {
      throw new Error(`Erro ao atualizar taxa padrão: ${error.message}`);
    }
  }

  /**
   * Atualizar taxa de segurança por categoria
   */
  static async atualizarTaxaPorCategoria(lojaId, categoria, taxa, usuarioId) {
    try {
      // Validar taxa
      if (taxa < 0.05 || taxa > 0.30) {
        throw new Error('Taxa deve estar entre 5% e 30%');
      }

      // Validar categoria
      const categoriaValida = [
        'bebidas',
        'alimentos_pereciveis',
        'alimentos_nao_pereciveis',
        'higiene_limpeza',
        'eletronicos',
        'outros'
      ];

      if (!categoriaValida.includes(categoria)) {
        throw new Error(`Categoria inválida. Válidas: ${categoriaValida.join(', ')}`);
      }

      const colunaNome = `taxa_${categoria}`;
      const query = `
        UPDATE configuracao_seguranca_loja
        SET ${colunaNome} = $1, atualizada_em = NOW(), atualizada_por = $2
        WHERE loja_id = $3
        RETURNING *
      `;

      const resultado = await pool.query(query, [taxa, usuarioId, lojaId]);
      
      if (resultado.rows.length === 0) {
        throw new Error('Configuração não encontrada');
      }

      return resultado.rows[0];
    } catch (error) {
      throw new Error(`Erro ao atualizar taxa por categoria: ${error.message}`);
    }
  }

  /**
   * Definir taxa customizada para um produto específico
   */
  static async definirTaxaCustomizadaProduto(lojaId, produtoId, taxa, observacoes = '') {
    try {
      // Validar taxa
      if (taxa < 0.05 || taxa > 0.30) {
        throw new Error('Taxa deve estar entre 5% e 30%');
      }

      // Verificar se produto existe na loja
      const queryProduto = `
        SELECT id FROM produtos WHERE id = $1 AND loja_id = $2
      `;
      const resProduto = await pool.query(queryProduto, [produtoId, lojaId]);
      
      if (resProduto.rows.length === 0) {
        throw new Error('Produto não encontrado nesta loja');
      }

      const query = `
        UPDATE produtos
        SET taxa_seguranca_customizada = $1, observacoes_seguranca = $2
        WHERE id = $3 AND loja_id = $4
        RETURNING id, nome, taxa_seguranca_customizada, observacoes_seguranca
      `;

      const resultado = await pool.query(query, [taxa, observacoes, produtoId, lojaId]);
      
      return resultado.rows[0];
    } catch (error) {
      throw new Error(`Erro ao definir taxa customizada: ${error.message}`);
    }
  }

  /**
   * Obter taxa de segurança a usar para um produto
   * Ordem de prioridade:
   * 1. Taxa customizada do produto
   * 2. Taxa da categoria (se configurada)
   * 3. Taxa padrão da loja
   */
  static async obterTaxaParaProduto(lojaId, produtoId) {
    try {
      const query = `
        SELECT 
          p.id,
          p.nome,
          p.categoria,
          p.taxa_seguranca_customizada,
          p.observacoes_seguranca,
          csl.taxa_seguranca_padrao,
          csl.taxa_bebidas,
          csl.taxa_alimentos_pereciveis,
          csl.taxa_alimentos_nao_pereciveis,
          csl.taxa_higiene_limpeza,
          csl.taxa_eletronicos,
          csl.taxa_outros,
          
          -- Determinar taxa a usar
          COALESCE(
            p.taxa_seguranca_customizada,
            CASE 
              WHEN LOWER(p.categoria) LIKE '%bebida%' THEN csl.taxa_bebidas
              WHEN LOWER(p.categoria) LIKE '%latic%' OR LOWER(p.categoria) LIKE '%fresco%' THEN csl.taxa_alimentos_pereciveis
              WHEN LOWER(p.categoria) LIKE '%grão%' OR LOWER(p.categoria) LIKE '%arroz%' THEN csl.taxa_alimentos_nao_pereciveis
              WHEN LOWER(p.categoria) LIKE '%higien%' OR LOWER(p.categoria) LIKE '%limpeza%' THEN csl.taxa_higiene_limpeza
              WHEN LOWER(p.categoria) LIKE '%eletron%' THEN csl.taxa_eletronicos
              ELSE csl.taxa_outros
            END,
            csl.taxa_seguranca_padrao
          ) as taxa_final
          
        FROM produtos p
        JOIN configuracao_seguranca_loja csl ON csl.loja_id = p.loja_id
        WHERE p.id = $1 AND p.loja_id = $2
      `;

      const resultado = await pool.query(query, [produtoId, lojaId]);
      
      if (resultado.rows.length === 0) {
        throw new Error('Produto não encontrado');
      }

      const row = resultado.rows[0];

      return {
        produto_id: row.id,
        nome: row.nome,
        categoria: row.categoria,
        taxa_final: row.taxa_final,
        origem_taxa: row.taxa_seguranca_customizada ? 'CUSTOMIZADA_PRODUTO' :
                    'CUSTOMIZADA_CATEGORIA' ?
                    'PADRÃO_LOJA',
        detalhes: {
          taxa_customizada_produto: row.taxa_seguranca_customizada,
          taxa_categoria_configurada: this.getTaxaCategoria(row),
          taxa_padrao_loja: row.taxa_seguranca_padrao
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter taxa para produto: ${error.message}`);
    }
  }

  /**
   * Helper: obter taxa da categoria baseado no row
   */
  static getTaxaCategoria(row) {
    if (row.categoria.toLowerCase().includes('bebida')) return row.taxa_bebidas;
    if (row.categoria.toLowerCase().includes('latic') || row.categoria.toLowerCase().includes('fresco')) return row.taxa_alimentos_pereciveis;
    if (row.categoria.toLowerCase().includes('grão') || row.categoria.toLowerCase().includes('arroz')) return row.taxa_alimentos_nao_pereciveis;
    if (row.categoria.toLowerCase().includes('higien') || row.categoria.toLowerCase().includes('limpeza')) return row.taxa_higiene_limpeza;
    if (row.categoria.toLowerCase().includes('eletron')) return row.taxa_eletronicos;
    return row.taxa_outros;
  }

  /**
   * Definir política de risco da loja
   * CONSERVADOR (25-30%): Evitar stockout a todo custo
   * BALANCEADO (15%): Equilíbrio custo-segurança
   * AGRESSIVO (10%): Minimizar estoque, aceitar risco
   */
  static async definirPoliticaRisco(lojaId, politica, usuarioId) {
    try {
      const politicasValidas = ['CONSERVADOR', 'BALANCEADO', 'AGRESSIVO'];
      
      if (!politicasValidas.includes(politica.toUpperCase())) {
        throw new Error(`Política inválida. Válidas: ${politicasValidas.join(', ')}`);
      }

      // Definir taxa padrão baseado na política
      let taxaPadrao;
      switch (politica.toUpperCase()) {
        case 'CONSERVADOR':
          taxaPadrao = 0.25;
          break;
        case 'BALANCEADO':
          taxaPadrao = 0.15;
          break;
        case 'AGRESSIVO':
          taxaPadrao = 0.10;
          break;
      }

      const query = `
        UPDATE configuracao_seguranca_loja
        SET politica_risco_aceitavel = $1, taxa_seguranca_padrao = $2, atualizada_em = NOW(), atualizada_por = $3
        WHERE loja_id = $4
        RETURNING *
      `;

      const resultado = await pool.query(query, [politica.toUpperCase(), taxaPadrao, usuarioId, lojaId]);
      
      if (resultado.rows.length === 0) {
        throw new Error('Configuração não encontrada');
      }

      return {
        ...resultado.rows[0],
        descricao_politica: this.descreverPolitica(politica)
      };
    } catch (error) {
      throw new Error(`Erro ao definir política de risco: ${error.message}`);
    }
  }

  /**
   * Helper: descrever política
   */
  static descreverPolitica(politica) {
    const descricoes = {
      'CONSERVADOR': 'Taxa alta (25-30%) - evita stockout a todo custo, mas mantém mais estoque',
      'BALANCEADO': 'Taxa média (15%) - equilibra custo de estoque vs risco de falta',
      'AGRESSIVO': 'Taxa baixa (10%) - minimiza estoque, aceita maior risco de falta'
    };
    return descricoes[politica.toUpperCase()] || 'Desconhecida';
  }

  /**
   * Obter taxa recomendada por contexto
   */
  static async obterTaxaRecomendada(lojaId, produtoId, contexto = {}) {
    try {
      const { demanda_variabilidade, eh_perecivel, eh_essencial, sazonalidade } = contexto;

      const config = await this.obterConfiguracaoLoja(lojaId);
      let taxaRecomendada = config.taxa_seguranca_padrao;

      // Ajustar baseado em contexto
      if (demanda_variabilidade === 'ALTA') {
        taxaRecomendada = Math.min(0.30, taxaRecomendada + 0.10);
      }
      
      if (eh_perecivel) {
        taxaRecomendada = Math.max(0.10, taxaRecomendada - 0.05);
      }
      
      if (eh_essencial) {
        taxaRecomendada = Math.min(0.30, taxaRecomendada + 0.05);
      }

      if (sazonalidade === 'ALTA') {
        taxaRecomendada = Math.min(0.30, taxaRecomendada + 0.08);
      }

      return {
        taxa_recomendada: taxaRecomendada,
        baseado_em: config.politica_risco_aceitavel,
        contexto_aplicado: {
          variabilidade_demanda: demanda_variabilidade,
          eh_perecivel,
          eh_essencial,
          sazonalidade
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter taxa recomendada: ${error.message}`);
    }
  }

  /**
   * Listar todas as taxas customizadas de uma loja
   */
  static async listarTaxasCustomizadas(lojaId) {
    try {
      const query = `
        SELECT 
          p.id,
          p.nome,
          p.categoria,
          p.taxa_seguranca_customizada as taxa_customizada,
          p.observacoes_seguranca,
          csl.taxa_seguranca_padrao as taxa_padrao_comparacao
        FROM produtos p
        LEFT JOIN configuracao_seguranca_loja csl ON csl.loja_id = p.loja_id
        WHERE p.loja_id = $1 AND p.taxa_seguranca_customizada IS NOT NULL
        ORDER BY p.categoria, p.nome
      `;

      const resultado = await pool.query(query, [lojaId]);
      
      return resultado.rows;
    } catch (error) {
      throw new Error(`Erro ao listar taxas customizadas: ${error.message}`);
    }
  }

  /**
   * Remover taxa customizada de um produto (voltar ao padrão)
   */
  static async removerTaxaCustomizada(lojaId, produtoId) {
    try {
      const query = `
        UPDATE produtos
        SET taxa_seguranca_customizada = NULL, observacoes_seguranca = NULL
        WHERE id = $1 AND loja_id = $2
        RETURNING id, nome, taxa_seguranca_customizada
      `;

      const resultado = await pool.query(query, [produtoId, lojaId]);
      
      if (resultado.rows.length === 0) {
        throw new Error('Produto não encontrado');
      }

      return resultado.rows[0];
    } catch (error) {
      throw new Error(`Erro ao remover taxa customizada: ${error.message}`);
    }
  }
}

module.exports = ConfiguracaoSeguranca;
