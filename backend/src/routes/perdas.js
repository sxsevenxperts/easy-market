/**
 * Rotas de Análise de Perdas de Produtos
 * Easy Market - Rastreamento de Desperdício
 */

const {
  calcularTaxaPerda,
  calcularReducaoPerda,
  listarProdutosComMaiorPerda,
  registrarPerda,
  analisarPerdasPorCategoria,
  analisarMotivosPerdas
} = require('../services/perdas');

const logger = require('../config/logger');

module.exports = function (fastify, opts, done) {

  // ============================================
  // GET /taxa-atual
  // Calcular taxa de perda atual
  // ============================================
  fastify.get('/taxa-atual/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { periodo = '30' } = request.query;

      const resultado = await calcularTaxaPerda(loja_id, periodo);

      return reply.code(200).send({
        sucesso: true,
        data: resultado,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erro em GET /taxa-atual:', error);
      return reply.code(500).send({ erro: error.message });
    }
  });

  // ============================================
  // GET /reducao
  // Comparar redução de perdas entre períodos
  // ============================================
  fastify.get('/reducao/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      const resultado = await calcularReducaoPerda(loja_id);

      return reply.code(200).send({
        sucesso: true,
        data: resultado,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erro em GET /reducao:', error);
      return reply.code(500).send({ erro: error.message });
    }
  });

  // ============================================
  // GET /produtos-maior-perda
  // Listar produtos com maior perda
  // ============================================
  fastify.get('/produtos-maior-perda/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { limite = 10 } = request.query;

      const resultado = await listarProdutosComMaiorPerda(loja_id, parseInt(limite));

      return reply.code(200).send({
        sucesso: true,
        data: resultado,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erro em GET /produtos-maior-perda:', error);
      return reply.code(500).send({ erro: error.message });
    }
  });

  // ============================================
  // GET /por-categoria
  // Análise de perdas por categoria
  // ============================================
  fastify.get('/por-categoria/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      const resultado = await analisarPerdasPorCategoria(loja_id);

      return reply.code(200).send({
        sucesso: true,
        data: resultado,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erro em GET /por-categoria:', error);
      return reply.code(500).send({ erro: error.message });
    }
  });

  // ============================================
  // GET /motivos
  // Análise de motivos de perdas
  // ============================================
  fastify.get('/motivos/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      const resultado = await analisarMotivosPerdas(loja_id);

      return reply.code(200).send({
        sucesso: true,
        data: resultado,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erro em GET /motivos:', error);
      return reply.code(500).send({ erro: error.message });
    }
  });

  // ============================================
  // POST /registrar
  // Registrar nova perda de produto
  // ============================================
  fastify.post('/registrar', async (request, reply) => {
    try {
      const { loja_id, produto_id, quantidade_perdida, motivo, observacoes } = request.body;

      if (!loja_id || !produto_id || !quantidade_perdida || !motivo) {
        return reply.code(400).send({
          erro: 'Campos obrigatórios: loja_id, produto_id, quantidade_perdida, motivo'
        });
      }

      const resultado = await registrarPerda(
        loja_id,
        produto_id,
        parseInt(quantidade_perdida),
        motivo,
        observacoes || ''
      );

      return reply.code(201).send({
        sucesso: true,
        data: resultado,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erro em POST /registrar:', error);
      return reply.code(500).send({ erro: error.message });
    }
  });

  // ============================================
  // GET /relatorio-completo
  // Relatório completo de perdas da loja
  // ============================================
  fastify.get('/relatorio-completo/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      const [taxaAtual, reducao, produtosPerda, categorias, motivos] = await Promise.all([
        calcularTaxaPerda(loja_id, '30'),
        calcularReducaoPerda(loja_id),
        listarProdutosComMaiorPerda(loja_id, 5),
        analisarPerdasPorCategoria(loja_id),
        analisarMotivosPerdas(loja_id)
      ]);

      return reply.code(200).send({
        sucesso: true,
        loja_id: loja_id,
        data: {
          taxa_atual: taxaAtual,
          reducao_comparativa: reducao,
          top_produtos_perda: produtosPerda,
          perdas_por_categoria: categorias,
          perdas_por_motivo: motivos,
          resumo_executivo: {
            taxa_perda_pct: taxaAtual.taxa_perda_percentual,
            valor_perdido_30d: taxaAtual.valor_total_perdido,
            tendencia: reducao.tendencia,
            reducao_pct: reducao.reducao_percentual,
            produtos_afetados: taxaAtual.produtos_afetados,
            status_geral: determinarStatusGeral(taxaAtual, reducao)
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erro em GET /relatorio-completo:', error);
      return reply.code(500).send({ erro: error.message });
    }
  });

  done();
};

// ============================================
// FUNÇÃO AUXILIAR
// ============================================
function determinarStatusGeral(taxa, reducao) {
  if (taxa.classificacao === 'crítico' && reducao.tendencia !== 'melhora') {
    return 'CRÍTICO - Ação urgente necessária';
  } else if (taxa.classificacao === 'alto' && reducao.tendencia !== 'melhora') {
    return 'ATENÇÃO - Revisar controles';
  } else if (reducao.tendencia === 'melhora') {
    return 'BOM - Redução em progresso';
  } else {
    return 'NORMAL - Sob monitoramento';
  }
}
