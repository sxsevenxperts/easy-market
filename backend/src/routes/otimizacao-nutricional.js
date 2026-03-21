/**
 * Rotas de Otimização Nutricional
 * Integra dados nutricionais (% gordura, calorias, proteína, sódio, açúcar)
 * com estratégias de posicionamento, preço e cross-sell
 */

module.exports = async function (fastify, opts) {
  const { supabase } = fastify;
  const OtimizacaoNutricional = require('../services/otimizacao-nutricional');

  /**
   * GET /perfil/:loja_id
   * Extrai perfil nutricional completo de todos os produtos
   * Inclui: % gordura, proteína, calorias, sódio, açúcar, etc
   */
  fastify.get('/perfil/:loja_id', async (request, reply) => {
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
        .select('id')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Store not found'
        });
      }

      const perfil = await OtimizacaoNutricional.extrairPerfilNutricional(loja_id);

      return reply.code(200).send({
        success: true,
        data: {
          total_produtos: perfil.length,
          produtos: perfil,
          distribuicao_gordura: {
            muito_baixa: perfil.filter(p => p.percentual_gordura < 5).length,
            baixa: perfil.filter(p => p.percentual_gordura >= 5 && p.percentual_gordura < 15).length,
            moderada: perfil.filter(p => p.percentual_gordura >= 15 && p.percentual_gordura < 25).length,
            alta: perfil.filter(p => p.percentual_gordura >= 25 && p.percentual_gordura < 35).length,
            muito_alta: perfil.filter(p => p.percentual_gordura >= 35).length
          }
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error extracting nutritional profile',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /classificacao/:loja_id
   * Classifica produtos por perfil de consumidor
   * Health-Conscious, Indulgence, Balanced, Senior, Diabetic, etc
   */
  fastify.get('/classificacao/:loja_id', async (request, reply) => {
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
        .select('id')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Store not found'
        });
      }

      const classificacao = await OtimizacaoNutricional.classificarPorPerfilConsumidor(loja_id);

      return reply.code(200).send({
        success: true,
        data: {
          health_conscious: {
            total: classificacao.healthConscious.length,
            produtos: classificacao.healthConscious.slice(0, 10)
          },
          indulgence: {
            total: classificacao.indulgence.length,
            produtos: classificacao.indulgence.slice(0, 10)
          },
          balanced: {
            total: classificacao.balanced.length,
            produtos: classificacao.balanced.slice(0, 10)
          },
          low_sodium: {
            total: classificacao.lowSodium.length,
            produtos: classificacao.lowSodium.slice(0, 10)
          },
          no_sugar: {
            total: classificacao.noSugar.length,
            produtos: classificacao.noSugar.slice(0, 10)
          }
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error classifying products by consumer profile',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /complementaridade/:loja_id
   * Matriz de complementaridade nutricional
   * Identifica produtos que se combinam bem nutricionalmente
   * Ex: produto gordo + produto magro = combo saudável
   */
  fastify.get('/complementaridade/:loja_id', async (request, reply) => {
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
        .select('id')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Store not found'
        });
      }

      const complementaridade = await OtimizacaoNutricional.gerarMatrizComplementaridade(loja_id);

      return reply.code(200).send({
        success: true,
        data: {
          total_combos: complementaridade.length,
          combos_premium: complementaridade.filter(c => c.estrategia === 'COMBO_PREMIUM'),
          combos_frequent_crosssell: complementaridade.filter(c => c.estrategia === 'CROSS_SELL_FREQUENTE'),
          top_10: complementaridade.slice(0, 10),
          todas_combinacoes: complementaridade
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error generating nutritional complementarity matrix',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /posicionamento/:loja_id
   * Estratégia de posicionamento baseada em:
   * - Perfil nutricional
   * - Tendências de consumo
   * - % gordura e outros nutrientes
   * - Oportunidades de cross-sell
   */
  fastify.get('/posicionamento/:loja_id', async (request, reply) => {
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
        .select('id')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Store not found'
        });
      }

      const posicionamento = await OtimizacaoNutricional.calcularPosicionamentoNutricional(loja_id);

      return reply.code(200).send({
        success: true,
        data: posicionamento,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error calculating nutritional positioning',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /precos/:loja_id
   * Recomendações de ajuste de preço baseado em:
   * - Perfil nutricional
   * - Elasticidade de preço por tipo de produto
   * - Demanda por produto saúde vs indulgência
   */
  fastify.get('/precos/:loja_id', async (request, reply) => {
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
        .select('id')
        .eq('id', loja_id)
        .single();

      if (!lojaExists) {
        return reply.code(404).send({
          success: false,
          error: 'Store not found'
        });
      }

      const ajustes = await OtimizacaoNutricional.recomendarAjustesPrecoPorNutricao(loja_id);

      return reply.code(200).send({
        success: true,
        data: {
          aumentar_preco: {
            total: ajustes.aumentar_preco.length,
            produtos: ajustes.aumentar_preco,
            motivo: 'Premium health products - elasticidade preço baixa',
            impacto_estimado: '+8-12% margem'
          },
          reduzir_preco: {
            total: ajustes.reduzir_preco.length,
            produtos: ajustes.reduzir_preco,
            motivo: 'Promover movimento de estoque',
            impacto_estimado: '+40-50% volume'
          },
          promover_combo: {
            total: ajustes.promover.length,
            produtos: ajustes.promover,
            motivo: 'Aumentar ticket médio',
            impacto_estimado: '+15-20% ticket'
          }
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error recommending price adjustments',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /relatorio-completo/:loja_id
   * Relatório integrado com:
   * - Perfil nutricional
   * - Classificação de consumidor
   * - Matriz de complementaridade
   * - Posicionamento estratégico
   * - Recomendações de preço
   * - Impacto estimado em receita e margem
   */
  fastify.get('/relatorio-completo/:loja_id', async (request, reply) => {
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
          error: 'Store not found'
        });
      }

      const relatorio = await OtimizacaoNutricional.gerarRelatoriCompleto(loja_id);

      return reply.code(200).send({
        success: true,
        data: {
          loja: {
            id: lojaExists.id,
            nome: lojaExists.nome
          },
          ...relatorio
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error generating complete nutritional optimization report',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
};
