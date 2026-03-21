/**
 * Rotas de Análise de Perdas de Produtos
 * Easy Market - Rastreamento de Desperdício
 */

const express = require('express');
const router = express.Router();

const {
  calcularTaxaPerda,
  calcularReducaoPerda,
  listarProdutosComMaiorPerda,
  registrarPerda,
  analisarPerdasPorCategoria,
  analisarMotivosPerdas
} = require('../services/perdas');

// ============================================
// GET /taxa-atual/:loja_id
// Calcular taxa de perda atual
// ============================================
router.get('/taxa-atual/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const { periodo = '30' } = req.query;

    const resultado = await calcularTaxaPerda(loja_id, periodo);

    return res.status(200).json({
      sucesso: true,
      data: resultado,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro em GET /taxa-atual:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// ============================================
// GET /reducao/:loja_id
// Comparar redução de perdas entre períodos
// ============================================
router.get('/reducao/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const resultado = await calcularReducaoPerda(loja_id);

    return res.status(200).json({
      sucesso: true,
      data: resultado,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro em GET /reducao:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// ============================================
// GET /produtos-maior-perda/:loja_id
// Listar produtos com maior perda
// ============================================
router.get('/produtos-maior-perda/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const { limite = 10 } = req.query;

    const resultado = await listarProdutosComMaiorPerda(loja_id, parseInt(limite));

    return res.status(200).json({
      sucesso: true,
      data: resultado,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro em GET /produtos-maior-perda:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// ============================================
// GET /por-categoria/:loja_id
// Análise de perdas por categoria
// ============================================
router.get('/por-categoria/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const resultado = await analisarPerdasPorCategoria(loja_id);

    return res.status(200).json({
      sucesso: true,
      data: resultado,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro em GET /por-categoria:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// ============================================
// GET /motivos/:loja_id
// Análise de motivos de perdas
// ============================================
router.get('/motivos/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const resultado = await analisarMotivosPerdas(loja_id);

    return res.status(200).json({
      sucesso: true,
      data: resultado,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro em GET /motivos:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// ============================================
// POST /registrar
// Registrar nova perda de produto
// ============================================
router.post('/registrar', async (req, res) => {
  try {
    const { loja_id, produto_id, quantidade_perdida, motivo, observacoes } = req.body;

    if (!loja_id || !produto_id || !quantidade_perdida || !motivo) {
      return res.status(400).json({
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

    return res.status(201).json({
      sucesso: true,
      data: resultado,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro em POST /registrar:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// ============================================
// GET /relatorio-completo/:loja_id
// Relatório completo de perdas da loja
// ============================================
router.get('/relatorio-completo/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const [taxaAtual, reducao, produtosPerda, categorias, motivos] = await Promise.all([
      calcularTaxaPerda(loja_id, '30'),
      calcularReducaoPerda(loja_id),
      listarProdutosComMaiorPerda(loja_id, 5),
      analisarPerdasPorCategoria(loja_id),
      analisarMotivosPerdas(loja_id)
    ]);

    return res.status(200).json({
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
    console.error('Erro em GET /relatorio-completo:', error);
    return res.status(500).json({ erro: error.message });
  }
});

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

module.exports = router;
