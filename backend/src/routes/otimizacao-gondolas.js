/**
 * Rotas de Otimização de Gôndolas
 * Endpoints para análise e recomendações de posicionamento estratégico
 * com base em padrões de perda, consumo temporal e análise preditiva
 */

module.exports = async function (fastify, opts) {
  const { supabase } = fastify;
  const OtimizacaoGondolas = require('../services/otimizacao-gondolas');

  /**
   * GET /analise/:loja_id
   * Extrai análise completa de otimização de gôndolas
   * Inclui: produtos com maior perda, padrões de venda por dia/hora,
   * produtos top, categorias top
   */
  fastify.get('/analise/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      // Validar loja_id
      if (!loja_id || isNaN(loja_id)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid loja_id parameter'
        });
      }

      // Verificar se loja existe
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

      // Executar análise
      const analise = await OtimizacaoGondolas.analisarOtimizacaoGondolas(loja_id);

      return reply.code(200).send({
        success: true,
        data: analise,
        timestamp: new Date().toISOString(),
        loja_id: loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error analyzing gondola optimization',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /recomendacoes/:loja_id
   * Gera recomendações contextualizadas para otimização de gôndolas
   * Inclui 5 tipos: reposicionamento urgente, otimização semanal, horária,
   * expansão de categoria e redução de perdas
   */
  fastify.get('/recomendacoes/:loja_id', async (request, reply) => {
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

      const recomendacoes = await OtimizacaoGondolas.gerarRecomendacoesGondola(loja_id);

      return reply.code(200).send({
        success: true,
        data: recomendacoes,
        timestamp: new Date().toISOString(),
        loja_id: loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error generating gondola recommendations',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /layout/:loja_id
   * Sugere layout otimizado completo da loja
   * Inclui: posicionamento de seções, cronograma de reposicionamento,
   * KPIs alvo para reduçao de perdas e aumento de receita
   */
  fastify.get('/layout/:loja_id', async (request, reply) => {
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

      const layout = await OtimizacaoGondolas.sugerirLayoutOtimizado(loja_id);

      return reply.code(200).send({
        success: true,
        data: layout,
        timestamp: new Date().toISOString(),
        loja_id: loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error generating store layout',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * GET /completo/:loja_id
   * Retorna relatório completo integrando análise, recomendações e layout
   * Ideal para dashboard ou download de relatório executivo
   */
  fastify.get('/completo/:loja_id', async (request, reply) => {
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

      // Executar todos os 3 tipos de análise em paralelo
      const [analise, recomendacoes, layout] = await Promise.all([
        OtimizacaoGondolas.analisarOtimizacaoGondolas(loja_id),
        OtimizacaoGondolas.gerarRecomendacoesGondola(loja_id),
        OtimizacaoGondolas.sugerirLayoutOtimizado(loja_id)
      ]);

      return reply.code(200).send({
        success: true,
        data: {
          loja: {
            id: lojaExists.id,
            nome: lojaExists.nome
          },
          analise,
          recomendacoes,
          layout,
          gerado_em: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        loja_id: loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Error generating complete gondola optimization report',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
};
