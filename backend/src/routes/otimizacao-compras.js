/**
 * Rotas de Otimização de Compras
 * Calcula quantidade ótima de pedidos com taxa de segurança (gordura)
 * para evitar faltas de estoque sem excessos
 */

module.exports = async function (fastify, opts) {
  const { supabase } = fastify;
  const OtimizacaoCompras = require('../services/otimizacao-compras');

  /**
   * GET /quantidade-otima/:loja_id/:produto_id
   * Calcula quantidade ótima de pedido com buffer de segurança
   * Parâmetros query: gordura (0.05-0.30), lead_time_dias
   */
  fastify.get('/quantidade-otima/:loja_id/:produto_id', async (request, reply) => {
    try {
      const { loja_id, produto_id } = request.params;
      const { gordura = 0.15, lead_time_dias = 7 } = request.query;

      if (!loja_id || isNaN(loja_id) || !produto_id || isNaN(produto_id)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid loja_id or produto_id parameters'
        });
      }

      // Validar gordura (5% a 30%)
      const gorduraNum = parseFloat(gordura);
      if (gorduraNum < 0.05 || gorduraNum > 0.30) {
        return reply.code(400).send({
          success: false,
          error: 'Gordura deve estar entre 0.05 (5%) e 0.30 (30%)'
        });
      }

      const { data: lojaExists } = await supabase
        .from('lojas')
        .select('id')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Loja não encontrada'
        });
      }

      const resultado = await OtimizacaoCompras.calcularQuantidadeOtimaPedido(
        loja_id,
        produto_id,
        { 
          gordura: gorduraNum,
          leadTimeDias: parseInt(lead_time_dias)
        }
      );

      return reply.code(200).send({
        success: true,
        data: resultado,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Erro ao calcular quantidade ótima',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /analise-loja/:loja_id
   * Analisa todos os produtos da loja e recomenda compras
   * Query: gordura=0.15 (default 15%)
   */
  fastify.get('/analise-loja/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { gordura = 0.15 } = request.query;

      if (!loja_id || isNaN(loja_id)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid loja_id parameter'
        });
      }

      const gorduraNum = parseFloat(gordura);
      if (gorduraNum < 0.05 || gorduraNum > 0.30) {
        return reply.code(400).send({
          success: false,
          error: 'Gordura deve estar entre 5% e 30%'
        });
      }

      const { data: lojaExists } = await supabase
        .from('lojas')
        .select('id, nome')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Loja não encontrada'
        });
      }

      const recomendacoes = await OtimizacaoCompras.analisarOtimizacaoComprasPorLoja(
        loja_id,
        gorduraNum
      );

      // Categorizar por risco
      const porRisco = {
        critico: recomendacoes.filter(r => r.demanda.desvio_padrao > 50),
        alto: recomendacoes.filter(r => r.demanda.desvio_padrao > 30 && r.demanda.desvio_padrao <= 50),
        normal: recomendacoes.filter(r => r.demanda.desvio_padrao <= 30)
      };

      return reply.code(200).send({
        success: true,
        data: {
          loja: {
            id: lojaExists.id,
            nome: lojaExists.nome
          },
          total_produtos_analisados: recomendacoes.length,
          
          resumo_por_risco: {
            critico: porRisco.critico.length,
            alto: porRisco.alto.length,
            normal: porRisco.normal.length
          },

          produtos_alto_risco: porRisco.critico.slice(0, 10),
          produtos_risco_medio: porRisco.alto.slice(0, 10),
          todos_produtos: recomendacoes,

          gordura_utilizada: Math.round(gorduraNum * 100) + '%',
          economia_estimada: `R$ ${Math.round(recomendacoes.reduce((sum, r) => sum + (r.custos.custo_manutencao_total_ano + r.custos.custo_pedidos_ano), 0) / 12)}  ao mês`
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Erro ao analisar otimização de compras',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /cenarios/:loja_id/:produto_id
   * Simula diferentes cenários de gordura (5%, 10%, 15%, 20%, 25%, 30%)
   * Ajuda a escolher taxa ótima entre custo vs segurança
   */
  fastify.get('/cenarios/:loja_id/:produto_id', async (request, reply) => {
    try {
      const { loja_id, produto_id } = request.params;

      if (!loja_id || isNaN(loja_id) || !produto_id || isNaN(produto_id)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid loja_id or produto_id parameters'
        });
      }

      const { data: lojaExists } = await supabase
        .from('lojas')
        .select('id')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Loja não encontrada'
        });
      }

      const simulacao = await OtimizacaoCompras.simularCenariosGordura(loja_id, produto_id);

      return reply.code(200).send({
        success: true,
        data: simulacao,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Erro ao simular cenários',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /risco-falta/:loja_id
   * Identifica produtos com risco de falta de estoque
   * Baseado em estoque atual vs demanda recente
   */
  fastify.get('/risco-falta/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      if (!loja_id || isNaN(loja_id)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid loja_id parameter'
        });
      }

      const { data: lojaExists } = await supabase
        .from('lojas')
        .select('id, nome')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Loja não encontrada'
        });
      }

      const riscos = await OtimizacaoCompras.identificarProdutosComRiscoFalta(loja_id);

      // Agrupar por nível de risco
      const porRisco = {
        critico: riscos.filter(r => r.nivel_risco === 'CRÍTICO'),
        alto: riscos.filter(r => r.nivel_risco === 'ALTO'),
        medio: riscos.filter(r => r.nivel_risco === 'MÉDIO')
      };

      return reply.code(200).send({
        success: true,
        data: {
          loja: {
            id: lojaExists.id,
            nome: lojaExists.nome
          },
          total_produtos_em_risco: riscos.length,
          
          resumo: {
            critico: porRisco.critico.length,
            alto: porRisco.alto.length,
            medio: porRisco.medio.length
          },

          alertas_criticos: porRisco.critico,
          alertas_altos: porRisco.alto,
          monitorar: porRisco.medio,

          acoes_recomendadas: {
            fazer_hoje: porRisco.critico.map(p => `Pedir ${p.nome} (${p.dias_para_faltar} dias de estoque)`),
            fazer_amanha: porRisco.alto.map(p => `Pedir ${p.nome}`)
          }
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Erro ao identificar risco de falta',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /gordura-por-categoria/:loja_id
   * Recomenda nível de gordura (buffer) ideal por categoria
   * Baseado em variabilidade de demanda e histórico de perdas
   */
  fastify.get('/gordura-por-categoria/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      if (!loja_id || isNaN(loja_id)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid loja_id parameter'
        });
      }

      const { data: lojaExists } = await supabase
        .from('lojas')
        .select('id, nome')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Loja não encontrada'
        });
      }

      const recomendacoes = await OtimizacaoCompras.recomendarGorduraPorCategoria(loja_id);

      return reply.code(200).send({
        success: true,
        data: {
          loja: {
            id: lojaExists.id,
            nome: lojaExists.nome
          },
          total_categorias: recomendacoes.length,
          categorias: recomendacoes,
          
          resumo_gorduras: {
            muito_alta: recomendacoes.filter(r => r.gordura_recomendada_percentual >= 25).map(r => r.categoria),
            alta: recomendacoes.filter(r => r.gordura_recomendada_percentual >= 20 && r.gordura_recomendada_percentual < 25).map(r => r.categoria),
            media: recomendacoes.filter(r => r.gordura_recomendada_percentual >= 15 && r.gordura_recomendada_percentual < 20).map(r => r.categoria),
            baixa: recomendacoes.filter(r => r.gordura_recomendada_percentual < 15).map(r => r.categoria)
          },

          explicacao: {
            muito_alta: 'Alta variabilidade - aumentar segurança',
            alta: 'Variabilidade moderada',
            media: 'Padrão recomendado',
            baixa: 'Produtos estáveis ou com histórico de perda'
          }
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Erro ao recomendar gordura por categoria',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /impacto-financeiro/:loja_id/:produto_id
   * Calcula impacto financeiro de diferentes níveis de gordura
   * Mostra trade-off: custo de manutenção vs risco de falta
   */
  fastify.get('/impacto-financeiro/:loja_id/:produto_id', async (request, reply) => {
    try {
      const { loja_id, produto_id } = request.params;

      if (!loja_id || isNaN(loja_id) || !produto_id || isNaN(produto_id)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid loja_id or produto_id parameters'
        });
      }

      const { data: lojaExists } = await supabase
        .from('lojas')
        .select('id')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Loja não encontrada'
        });
      }

      const impacto = await OtimizacaoCompras.calcularImpactoFinanceiro(
        loja_id,
        produto_id,
        [0.10, 0.15, 0.20]
      );

      return reply.code(200).send({
        success: true,
        data: impacto,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Erro ao calcular impacto financeiro',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
};
