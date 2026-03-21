/**
 * Rotas de Configuração de Taxa de Segurança
 * Permite que cada supermercado configure suas próprias taxas de segurança
 * - Por loja (taxa padrão)
 * - Por categoria
 * - Por produto específico
 */

module.exports = async function (fastify, opts) {
  const { supabase } = fastify;
  const ConfiguracaoSeguranca = require('../services/configuracao-seguranca');

  /**
   * GET /loja/:loja_id
   * Obter toda a configuração de segurança da loja
   */
  fastify.get('/loja/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      if (!loja_id || isNaN(loja_id)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid loja_id'
        });
      }

      const config = await ConfiguracaoSeguranca.obterConfiguracaoLoja(loja_id);

      return reply.code(200).send({
        success: true,
        data: config,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PUT /loja/:loja_id/taxa-padrao
   * Atualizar taxa padrão de segurança da loja
   * Body: { taxa_padrao: 0.15 }
   */
  fastify.put('/loja/:loja_id/taxa-padrao', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { taxa_padrao } = request.body;
      const usuario_id = request.user?.sub || 'sistema';

      if (!loja_id || isNaN(loja_id)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid loja_id'
        });
      }

      if (!taxa_padrao || taxa_padrao < 0.05 || taxa_padrao > 0.30) {
        return reply.code(400).send({
          success: false,
          error: 'Taxa deve estar entre 0.05 (5%) e 0.30 (30%)'
        });
      }

      const resultado = await ConfiguracaoSeguranca.atualizarTaxaPadrao(
        loja_id,
        taxa_padrao,
        usuario_id
      );

      return reply.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Taxa padrão atualizada para ${Math.round(taxa_padrao * 100)}%`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PUT /loja/:loja_id/taxa-categoria
   * Atualizar taxa de segurança por categoria
   * Body: { categoria: "bebidas", taxa: 0.20 }
   */
  fastify.put('/loja/:loja_id/taxa-categoria', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { categoria, taxa } = request.body;
      const usuario_id = request.user?.sub || 'sistema';

      if (!categoria || !taxa) {
        return reply.code(400).send({
          success: false,
          error: 'Categoria e taxa são obrigatórios'
        });
      }

      const resultado = await ConfiguracaoSeguranca.atualizarTaxaPorCategoria(
        loja_id,
        categoria,
        taxa,
        usuario_id
      );

      return reply.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Taxa da categoria ${categoria} atualizada para ${Math.round(taxa * 100)}%`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PUT /loja/:loja_id/produto/:produto_id/taxa-customizada
   * Definir taxa de segurança customizada para um produto específico
   * Body: { taxa: 0.25, observacoes: "Produto crítico para venda" }
   */
  fastify.put('/loja/:loja_id/produto/:produto_id/taxa-customizada', async (request, reply) => {
    try {
      const { loja_id, produto_id } = request.params;
      const { taxa, observacoes = '' } = request.body;

      if (!taxa || taxa < 0.05 || taxa > 0.30) {
        return reply.code(400).send({
          success: false,
          error: 'Taxa deve estar entre 5% e 30%'
        });
      }

      const resultado = await ConfiguracaoSeguranca.definirTaxaCustomizadaProduto(
        loja_id,
        produto_id,
        taxa,
        observacoes
      );

      return reply.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Taxa customizada para ${resultado.nome} definida em ${Math.round(taxa * 100)}%`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /loja/:loja_id/produto/:produto_id/taxa-customizada
   * Remover taxa customizada (voltar ao padrão)
   */
  fastify.delete('/loja/:loja_id/produto/:produto_id/taxa-customizada', async (request, reply) => {
    try {
      const { loja_id, produto_id } = request.params;

      const resultado = await ConfiguracaoSeguranca.removerTaxaCustomizada(loja_id, produto_id);

      return reply.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Taxa customizada removida. ${resultado.nome} voltará ao padrão da loja`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /loja/:loja_id/produto/:produto_id/taxa
   * Obter taxa que será aplicada a um produto específico
   * (Considera: customizada > categoria > padrão)
   */
  fastify.get('/loja/:loja_id/produto/:produto_id/taxa', async (request, reply) => {
    try {
      const { loja_id, produto_id } = request.params;

      const resultado = await ConfiguracaoSeguranca.obterTaxaParaProduto(loja_id, produto_id);

      return reply.code(200).send({
        success: true,
        data: resultado,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * PUT /loja/:loja_id/politica-risco
   * Definir política de risco da loja
   * Body: { politica: "BALANCEADO" } (CONSERVADOR, BALANCEADO, AGRESSIVO)
   */
  fastify.put('/loja/:loja_id/politica-risco', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { politica } = request.body;
      const usuario_id = request.user?.sub || 'sistema';

      if (!politica) {
        return reply.code(400).send({
          success: false,
          error: 'Política é obrigatória'
        });
      }

      const resultado = await ConfiguracaoSeguranca.definirPoliticaRisco(
        loja_id,
        politica,
        usuario_id
      );

      return reply.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Política de risco alterada para ${politica}`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /loja/:loja_id/taxas-customizadas
   * Listar todos os produtos com taxa customizada
   */
  fastify.get('/loja/:loja_id/taxas-customizadas', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      const resultado = await ConfiguracaoSeguranca.listarTaxasCustomizadas(loja_id);

      return reply.code(200).send({
        success: true,
        data: {
          total: resultado.length,
          produtos: resultado
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /loja/:loja_id/produto/:produto_id/taxa-recomendada
   * Obter taxa recomendada considerando contexto do produto
   * Query params: variabilidade (ALTA|MEDIA|BAIXA), perecivel, essencial, sazonalidade
   */
  fastify.get('/loja/:loja_id/produto/:produto_id/taxa-recomendada', async (request, reply) => {
    try {
      const { loja_id, produto_id } = request.params;
      const { variabilidade = 'MEDIA', perecivel = false, essencial = false, sazonalidade = 'BAIXA' } = request.query;

      const resultado = await ConfiguracaoSeguranca.obterTaxaRecomendada(
        loja_id,
        produto_id,
        {
          demanda_variabilidade: variabilidade,
          eh_perecivel: perecivel === 'true',
          eh_essencial: essencial === 'true',
          sazonalidade
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
      return reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });
};
