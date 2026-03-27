
const express = require('express');
const router = express.Router();
const ConfiguracaoSeguranca = require('../services/configuracao-seguranca');

router.get('/loja/:loja_id', async (req, res) => {
    try {
      const { loja_id } = req.params;

      if (!loja_id || isNaN(loja_id)) {
        return res.code(400).send({
          success: false,
          error: 'Invalid loja_id'
        });
      }

      const config = await ConfiguracaoSeguranca.obterConfiguracaoLoja(loja_id);

      return res.code(200).send({
        success: true,
        data: config,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      router.log.error(error);
      return res.code(500).send({
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
  router.put('/loja/:loja_id/taxa-padrao', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const { taxa_padrao } = req.body;
      const usuario_id = req.user?.sub || 'sistema';

      if (!loja_id || isNaN(loja_id)) {
        return res.code(400).send({
          success: false,
          error: 'Invalid loja_id'
        });
      }

      if (!taxa_padrao || taxa_padrao < 0.05 || taxa_padrao > 0.30) {
        return res.code(400).send({
          success: false,
          error: 'Taxa deve estar entre 0.05 (5%) e 0.30 (30%)'
        });
      }

      const resultado = await ConfiguracaoSeguranca.atualizarTaxaPadrao(
        loja_id,
        taxa_padrao,
        usuario_id
      );

      return res.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Taxa padrão atualizada para ${Math.round(taxa_padrao * 100)}%`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      router.log.error(error);
      return res.code(500).send({
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
  router.put('/loja/:loja_id/taxa-categoria', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const { categoria, taxa } = req.body;
      const usuario_id = req.user?.sub || 'sistema';

      if (!categoria || !taxa) {
        return res.code(400).send({
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

      return res.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Taxa da categoria ${categoria} atualizada para ${Math.round(taxa * 100)}%`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      router.log.error(error);
      return res.code(400).send({
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
  router.put('/loja/:loja_id/produto/:produto_id/taxa-customizada', async (req, res) => {
    try {
      const { loja_id, produto_id } = req.params;
      const { taxa, observacoes = '' } = req.body;

      if (!taxa || taxa < 0.05 || taxa > 0.30) {
        return res.code(400).send({
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

      return res.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Taxa customizada para ${resultado.nome} definida em ${Math.round(taxa * 100)}%`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      router.log.error(error);
      return res.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /loja/:loja_id/produto/:produto_id/taxa-customizada
   * Remover taxa customizada (voltar ao padrão)
   */
  router.delete('/loja/:loja_id/produto/:produto_id/taxa-customizada', async (req, res) => {
    try {
      const { loja_id, produto_id } = req.params;

      const resultado = await ConfiguracaoSeguranca.removerTaxaCustomizada(loja_id, produto_id);

      return res.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Taxa customizada removida. ${resultado.nome} voltará ao padrão da loja`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      router.log.error(error);
      return res.code(400).send({
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
  router.get('/loja/:loja_id/produto/:produto_id/taxa', async (req, res) => {
    try {
      const { loja_id, produto_id } = req.params;

      const resultado = await ConfiguracaoSeguranca.obterTaxaParaProduto(loja_id, produto_id);

      return res.code(200).send({
        success: true,
        data: resultado,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      router.log.error(error);
      return res.code(400).send({
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
  router.put('/loja/:loja_id/politica-risco', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const { politica } = req.body;
      const usuario_id = req.user?.sub || 'sistema';

      if (!politica) {
        return res.code(400).send({
          success: false,
          error: 'Política é obrigatória'
        });
      }

      const resultado = await ConfiguracaoSeguranca.definirPoliticaRisco(
        loja_id,
        politica,
        usuario_id
      );

      return res.code(200).send({
        success: true,
        data: resultado,
        mensagem: `Política de risco alterada para ${politica}`,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      router.log.error(error);
      return res.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /loja/:loja_id/taxas-customizadas
   * Listar todos os produtos com taxa customizada
   */
  router.get('/loja/:loja_id/taxas-customizadas', async (req, res) => {
    try {
      const { loja_id } = req.params;

      const resultado = await ConfiguracaoSeguranca.listarTaxasCustomizadas(loja_id);

      return res.code(200).send({
        success: true,
        data: {
          total: resultado.length,
          produtos: resultado
        },
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      router.log.error(error);
      return res.code(400).send({
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
  router.get('/loja/:loja_id/produto/:produto_id/taxa-recomendada', async (req, res) => {
    try {
      const { loja_id, produto_id } = req.params;
      const { variabilidade = 'MEDIA', perecivel = false, essencial = false, sazonalidade = 'BAIXA' } = req.query;

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

      return res.code(200).send({
        success: true,
        data: resultado,
        timestamp: new Date().toISOString(),
        loja_id
      });
    } catch (error) {
      router.log.error(error);
      return res.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

module.exports = router;
