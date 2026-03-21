/**
 * Serviço de Otimização de Compras
 * Calcula quantidade ótima de pedidos considerando:
 * - Taxa de consumo (demanda média)
 * - Lead time do fornecedor
 * - Sazonalidade
 * - Taxa de segurança/gordura (buffer para não faltar)
 * - Custo de estoque vs custo de falta
 * 
 * "Gordura" = Taxa extra do pedido exato para não faltar estoque
 * Ex: Precisa 100 unidades → Ordena 110 (gordura 10%)
 */

const { pool } = require('../config/database');

class OtimizacaoCompras {
  /**
   * Calcula quantidade ótima de pedido (EOQ - Economic Order Quantity)
   * Considerar demanda, lead time, custo, variabilidade
   */
  static async calcularQuantidadeOtimaPedido(lojaId, produtoId, opcoes = {}) {
    try {
      // Opcões com defaults
      const {
        gordura = 0.15, // 15% de buffer default
        leadTimeDias = 7,
        custoManuticaoPercentual = 0.20, // 20% ao ano
        custoFaltaPercentual = 0.50 // 50% (caro demais faltar)
      } = opcoes;

      // Extrair dados do produto
      const queryProduto = `
        SELECT 
          p.id as produto_id,
          p.nome,
          p.preco,
          p.loja_id,
          COALESCE(estoque_minimo, 10) as estoque_minimo,
          COALESCE(estoque_maximo, 1000) as estoque_maximo
        FROM produtos p
        WHERE p.id = $1 AND p.loja_id = $2
      `;
      const resProduto = await pool.query(queryProduto, [produtoId, lojaId]);
      if (resProduto.rows.length === 0) {
        throw new Error(`Produto ${produtoId} não encontrado na loja ${lojaId}`);
      }
      const produto = resProduto.rows[0];

      // Calcular demanda média (últimos 30 dias)
      const queryDemanda = `
        SELECT 
          COALESCE(AVG(quantidade), 0) as media_diaria,
          COALESCE(STDDEV(quantidade), 0) as desvio_padrao_diaria,
          MAX(quantidade) as pico,
          MIN(quantidade) as minima
        FROM (
          SELECT DATE_TRUNC('day', data_venda) as dia, SUM(quantidade) as quantidade
          FROM vendas
          WHERE produto_id = $1 AND loja_id = $2 AND data_venda >= NOW() - INTERVAL '30 days'
          GROUP BY DATE_TRUNC('day', data_venda)
        ) daily_sales
      `;
      const resDemanda = await pool.query(queryDemanda, [produtoId, lojaId]);
      const demanda = resDemanda.rows[0] || {
        media_diaria: 5, // fallback
        desvio_padrao_diaria: 2,
        pico: 10,
        minima: 1
      };

      // Calcular estoque de segurança (safety stock)
      // Safety Stock = Z-score * σ * sqrt(L)
      // Z-score = 1.65 (95% confiança para não faltar)
      const zScore = 1.65;
      const leadTimeRaizQuadrada = Math.sqrt(leadTimeDias);
      const estoqueSegurana = zScore * demanda.desvio_padrao_diaria * leadTimeRaizQuadrada;

      // Demanda durante lead time
      const demandaDuranteLeadTime = demanda.media_diaria * leadTimeDias;

      // Ponto de reposição (quando pedir)
      const pontoReposicao = demandaDuranteLeadTime + estoqueSegurana;

      // Quantidade económica de pedido (EOQ)
      // EOQ = sqrt(2 * D * S / H)
      // D = demanda anual, S = custo de pedido, H = custo de manutenção
      const demandaAnual = demanda.media_diaria * 365;
      const custoManuticaoAnual = produto.preco * custoManuticaoPercentual;
      const custoPedidoFixo = 50; // valor fixo por pedido em R$

      const eoq = Math.sqrt((2 * demandaAnual * custoPedidoFixo) / custoManuticaoAnual);

      // Aplicar gordura (taxa de segurança extra)
      const quantidadeComGordura = Math.round(eoq * (1 + gordura));

      // Garantir que não ultrapassa estoque máximo
      const quantidadeRecomendada = Math.min(
        quantidadeComGordura,
        produto.estoque_maximo
      );

      // Garantir que atende estoque mínimo
      const quantidadeFinal = Math.max(
        quantidadeRecomendada,
        produto.estoque_minimo
      );

      return {
        produto_id: produtoId,
        nome: produto.nome,
        preco_unitario: produto.preco,
        
        // Dados de demanda
        demanda: {
          media_diaria: Math.round(demanda.media_diaria * 100) / 100,
          desvio_padrao: Math.round(demanda.desvio_padrao_diaria * 100) / 100,
          pico_diario: demanda.pico,
          minima_diaria: demanda.minima,
          demanda_anual: Math.round(demandaAnual)
        },

        // Cálculos de estoque
        estoque_seguranca: Math.round(estoqueSegurana * 100) / 100,
        demanda_durante_leadtime: Math.round(demandaDuranteLeadTime),
        ponto_reposicao: Math.round(pontoReposicao),

        // EOQ e optimizações
        quantidade_economica_pedido: Math.round(eoq),
        gordura_percentual: Math.round(gordura * 100),
        quantidade_sem_gordura: Math.round(eoq),
        quantidade_com_gordura: quantidadeComGordura,
        quantidade_recomendada: quantidadeFinal,

        // Custos estimados
        custos: {
          custo_manuticao_anual_unitario: custoManuticaoAnual,
          custo_pedido_fixo: custoPedidoFixo,
          custo_manutencao_total_ano: Math.round(custoManuticaoAnual * (quantidadeFinal / 2) * 100) / 100,
          custo_pedidos_ano: Math.round((demandaAnual / quantidadeFinal) * custoPedidoFixo * 100) / 100
        },

        // Recomendação
        recomendacao: {
          ordenar: quantidadeFinal,
          quando: `Quando estoque <= ${Math.round(pontoReposicao)} unidades`,
          frequencia_dias: Math.round(quantidadeFinal / demanda.media_diaria),
          dias_de_cobertura: Math.round(quantidadeFinal / demanda.media_diaria)
        },

        // Metadata
        lead_time_dias: leadTimeDias,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Erro ao calcular quantidade ótima: ${error.message}`);
    }
  }

  /**
   * Analisa todos os produtos da loja e recomenda otimizações de compra
   * Retorna lista de produtos com maior risco de falta
   */
  static async analisarOtimizacaoComprasPorLoja(lojaId, gordura = 0.15) {
    try {
      const queryProdutos = `
        SELECT DISTINCT p.id as produto_id
        FROM produtos p
        WHERE p.loja_id = $1
        ORDER BY p.id
        LIMIT 100
      `;
      const resProdutos = await pool.query(queryProdutos, [lojaId]);

      const recomendacoes = [];

      for (const { produto_id } of resProdutos.rows) {
        try {
          const otimizacao = await this.calcularQuantidadeOtimaPedido(
            lojaId,
            produto_id,
            { gordura }
          );
          recomendacoes.push(otimizacao);
        } catch (e) {
          // Skip produtos com erro
        }
      }

      // Ordenar por risco: produtos com maior desvio padrão (variabilidade)
      recomendacoes.sort((a, b) => {
        const riscoA = b.demanda.desvio_padrao;
        const riscoB = a.demanda.desvio_padrao;
        return riscoA - riscoB;
      });

      return recomendacoes;
    } catch (error) {
      throw new Error(`Erro ao analisar otimização de compras: ${error.message}`);
    }
  }

  /**
   * Simula diferentes cenários de gordura (buffer)
   * Ajuda a escolher a taxa ideal entre custo vs segurança
   */
  static async simularCenariosGordura(lojaId, produtoId) {
    try {
      const cenarios = [];
      const gorduras = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]; // 5%, 10%, 15%, 20%, 25%, 30%

      for (const gordura of gorduras) {
        const resultado = await this.calcularQuantidadeOtimaPedido(
          lojaId,
          produtoId,
          { gordura }
        );
        
        cenarios.push({
          gordura_percentual: Math.round(gordura * 100),
          quantidade_pedido: resultado.quantidade_recomendada,
          custo_anual: resultado.custos.custo_manutencao_total_ano + resultado.custos.custo_pedidos_ano,
          risco_falta: 100 - (gordura * 100), // Indicador de risco
          dias_cobertura: resultado.recomendacao.dias_de_cobertura
        });
      }

      // Identificar cenário ótimo (menor custo total)
      const melhorCenario = cenarios.reduce((a, b) => 
        a.custo_anual < b.custo_anual ? a : b
      );

      return {
        produto_id: produtoId,
        cenarios,
        recomendacao_otima: melhorCenario,
        analise: {
          tradeoff: "Mais gordura = menos risco de falta, mas custo maior",
          sugestao: `Gordura ${melhorCenario.gordura_percentual}% oferece melhor relação custo-benefício`
        }
      };
    } catch (error) {
      throw new Error(`Erro ao simular cenários: ${error.message}`);
    }
  }

  /**
   * Identifica produtos com risco de falta de estoque
   * Baseado em variabilidade de demanda vs estoque atual
   */
  static async identificarProdutosComRiscoFalta(lojaId) {
    try {
      const query = `
        SELECT 
          p.id as produto_id,
          p.nome,
          p.categoria,
          COALESCE(p.estoque_atual, 0) as estoque_atual,
          COALESCE(p.estoque_minimo, 10) as estoque_minimo,
          
          -- Demanda últimos 7 dias
          COALESCE(SUM(v.quantidade), 0) as vendas_7dias,
          COALESCE(AVG(v.quantidade), 0) as media_diaria,
          
          -- Risco: se estoque_atual < (demanda_7dias / 7 * 3) = risco de faltar em 3 dias
          CASE 
            WHEN COALESCE(p.estoque_atual, 0) < (COALESCE(SUM(v.quantidade), 0) / 7) THEN 'CRÍTICO'
            WHEN COALESCE(p.estoque_atual, 0) < (COALESCE(SUM(v.quantidade), 0) / 7 * 2) THEN 'ALTO'
            WHEN COALESCE(p.estoque_atual, 0) < (COALESCE(SUM(v.quantidade), 0) / 7 * 3) THEN 'MÉDIO'
            ELSE 'BAIXO'
          END as nivel_risco
          
        FROM produtos p
        LEFT JOIN vendas v ON p.id = v.produto_id 
          AND v.loja_id = $1 
          AND v.data_venda >= NOW() - INTERVAL '7 days'
        WHERE p.loja_id = $1
        GROUP BY p.id, p.nome, p.categoria, p.estoque_atual, p.estoque_minimo
        HAVING COALESCE(p.estoque_atual, 0) < (COALESCE(SUM(v.quantidade), 0) / 7 * 2) OR 
               COALESCE(p.estoque_atual, 0) < p.estoque_minimo
        ORDER BY 
          CASE 
            WHEN COALESCE(p.estoque_atual, 0) < (COALESCE(SUM(v.quantidade), 0) / 7) THEN 1
            WHEN COALESCE(p.estoque_atual, 0) < (COALESCE(SUM(v.quantidade), 0) / 7 * 2) THEN 2
            ELSE 3
          END
      `;

      const resultado = await pool.query(query, [lojaId]);

      return resultado.rows.map(r => ({
        produto_id: r.produto_id,
        nome: r.nome,
        categoria: r.categoria,
        estoque_atual: r.estoque_atual,
        estoque_minimo: r.estoque_minimo,
        vendas_7dias: r.vendas_7dias,
        media_diaria: Math.round(r.media_diaria * 100) / 100,
        nivel_risco: r.nivel_risco,
        dias_para_faltar: Math.round(r.estoque_atual / (r.media_diaria || 1) * 10) / 10,
        acao_urgente: r.nivel_risco === 'CRÍTICO' ? 'PEDIR HOJE' : 
                      r.nivel_risco === 'ALTO' ? 'PEDIR AMANHÃ' : 'MONITORAR'
      }));
    } catch (error) {
      throw new Error(`Erro ao identificar produtos em risco: ${error.message}`);
    }
  }

  /**
   * Recomenda ajustes de gordura por categoria
   * Alguns produtos precisam mais segurança que outros
   */
  static async recomendarGorduraPorCategoria(lojaId) {
    try {
      const query = `
        SELECT 
          p.categoria,
          COUNT(p.id) as total_produtos,
          
          -- Métricas de variabilidade
          AVG(STDDEV(COALESCE(v.quantidade, 0))) as variabilidade_media,
          MAX(STDDEV(COALESCE(v.quantidade, 0))) as variabilidade_maxima,
          
          -- Perda (indica risco de obsolescência)
          COALESCE(SUM(pp.quantidade_perdida), 0) as total_perdas,
          
          -- Velocidade de venda
          COALESCE(SUM(v.quantidade), 0) as total_vendido
          
        FROM produtos p
        LEFT JOIN vendas v ON p.id = v.produto_id AND v.loja_id = $1
          AND v.data_venda >= NOW() - INTERVAL '30 days'
        LEFT JOIN perdas_produtos pp ON p.id = pp.produto_id AND pp.loja_id = $1
          AND pp.data_registro >= NOW() - INTERVAL '30 days'
        WHERE p.loja_id = $1
        GROUP BY p.categoria
        ORDER BY variabilidade_media DESC
      `;

      const resultado = await pool.query(query, [lojaId]);

      return resultado.rows.map(r => {
        // Lógica para determinar gordura ideal por categoria
        let gorduraRecomendada;
        
        if (r.variabilidade_maxima > 50) {
          gorduraRecomendada = 0.25; // 25% - alta variabilidade
        } else if (r.variabilidade_maxima > 30) {
          gorduraRecomendada = 0.20; // 20% - variabilidade moderada
        } else if (r.total_perdas > 0) {
          gorduraRecomendada = 0.10; // 10% - risco de obsolescência
        } else if (r.total_vendido < 100) {
          gorduraRecomendada = 0.15; // 15% - baixo volume, precisa segurança
        } else {
          gorduraRecomendada = 0.12; // 12% - padrão
        }

        return {
          categoria: r.categoria,
          total_produtos: r.total_produtos,
          variabilidade_media: Math.round(r.variabilidade_media * 100) / 100,
          variabilidade_maxima: r.variabilidade_maxima,
          total_perdas: r.total_perdas,
          total_vendido: r.total_vendido,
          gordura_recomendada_percentual: Math.round(gorduraRecomendada * 100),
          justificativa: 
            r.variabilidade_maxima > 50 ? 'Alta variabilidade - aumentar segurança' :
            r.variabilidade_maxima > 30 ? 'Variabilidade moderada' :
            r.total_perdas > 0 ? 'Produtos perecíveis - reduzir segurança' :
            r.total_vendido < 100 ? 'Baixo volume - aumentar segurança' :
            'Padrão'
        };
      });
    } catch (error) {
      throw new Error(`Erro ao recomendar gordura por categoria: ${error.message}`);
    }
  }

  /**
   * Calcula impacto financeiro de diferentes níveis de gordura
   * Mostra: custo de manutenção vs custo de falta de estoque
   */
  static async calcularImpactoFinanceiro(lojaId, produtoId, gorduras = [0.10, 0.15, 0.20]) {
    try {
      const impactos = [];

      for (const gordura of gorduras) {
        const otimizacao = await this.calcularQuantidadeOtimaPedido(
          lojaId,
          produtoId,
          { gordura }
        );

        // Estimar custo de falta (valor de venda que deixa de ganhar)
        const demandaMensal = otimizacao.demanda.media_diaria * 30;
        const margemMedia = 0.30; // 30% de margem
        const custoPotencialFalta = demandaMensal * otimizacao.preco_unitario * margemMedia * 0.05; // 5% de probabilidade falta

        const custoTotal = 
          otimizacao.custos.custo_manutencao_total_ano / 12 + 
          otimizacao.custos.custo_pedidos_ano / 12 + 
          custoPotencialFalta;

        impactos.push({
          gordura_percentual: Math.round(gordura * 100),
          quantidade_pedido: otimizacao.quantidade_recomendada,
          
          custos_mensais: {
            manutencao: Math.round(otimizacao.custos.custo_manutencao_total_ano / 12 * 100) / 100,
            pedidos: Math.round(otimizacao.custos.custo_pedidos_ano / 12 * 100) / 100,
            potencial_falta: Math.round(custoPotencialFalta * 100) / 100,
            total: Math.round(custoTotal * 100) / 100
          },

          beneficios: {
            reducao_falta_percentual: Math.round(gordura * 100),
            valor_evitado_falta: Math.round(custoPotencialFalta * 100) / 100
          }
        });
      }

      // Ordenar por custo total (melhor opção)
      const melhorOpcao = impactos.reduce((a, b) => 
        a.custos_mensais.total < b.custos_mensais.total ? a : b
      );

      return {
        produto_id: produtoId,
        impactos,
        recomendacao: melhorOpcao,
        analise_risco_retorno: {
          menor_custo: impactos[0],
          melhor_balance: melhorOpcao,
          mais_seguro: impactos[impactos.length - 1]
        }
      };
    } catch (error) {
      throw new Error(`Erro ao calcular impacto financeiro: ${error.message}`);
    }
  }
}

module.exports = OtimizacaoCompras;
