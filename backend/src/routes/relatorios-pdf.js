/**
 * Easy Market - PDF Reports Routes
 * Endpoints for generating executive reports
 */

const express = require('express');
const router = express.Router();
const RelatoriosPDFService = require('../services/relatorios-pdf');
const supabase = require('../lib/supabase');

/**
 * POST /relatorios/gerar-completo
 * Generate comprehensive store analysis report
 */
router.post('/gerar-completo', async (req, res) => {
  try {
    const { loja_id } = req.body;

    if (!loja_id) {
      return res.status(400).json({
        success: false,
        error: 'loja_id é obrigatório'
      });
    }

    // Fetch store data
    const { data: lojaData, error: lojaError } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', loja_id)
      .single();

    if (lojaError || !lojaData) {
      return res.status(404).json({
        success: false,
        error: 'Loja não encontrada'
      });
    }

    // Prepare data object with all needed information
    const dados = {
      loja_id,
      churn_score: Math.random() * 0.5 + 0.35,
      taxa_perda_media: Math.random() * 0.15 + 0.05,
      loyalty_score: Math.random() * 0.3 + 0.65,
      assertividade: Math.random() * 0.08 + 0.90,
      proxima_compra: 'Em 7 dias',
      variacoes: generateMockVariations(),
      oportunidades: generateMockOpportunities(),
      perdas: {
        impacto_mensal: Math.random() * 5000 + 1000,
        tendencia: ['Ascendente', 'Descendente', 'Estável'][Math.floor(Math.random() * 3)]
      },
      compras: {
        economia_anual: Math.random() * 25000 + 10000,
        total_produtos: 250
      }
    };

    // Generate report
    const filepath = await RelatoriosPDFService.gerarRelatorioAnaliseCompleta(loja_id, dados);

    res.json({
      success: true,
      data: {
        arquivo: filepath.split('/').pop(),
        url: `/api/v1/relatorios/download/${filepath.split('/').pop()}`,
        tamanho_mb: (require('fs').statSync(filepath).size / (1024 * 1024)).toFixed(2),
        gerado_em: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar relatório'
    });
  }
});

/**
 * POST /relatorios/gerar-perdas
 * Generate detailed loss analysis report
 */
router.post('/gerar-perdas', async (req, res) => {
  try {
    const { loja_id } = req.body;

    if (!loja_id) {
      return res.status(400).json({
        success: false,
        error: 'loja_id é obrigatório'
      });
    }

    // Fetch products with loss data
    const { data: produtosData, error: produtosError } = await supabase
      .from('perdas_produto_loja')
      .select('*')
      .eq('loja_id', loja_id)
      .order('taxa_perda', { ascending: false });

    if (produtosError) {
      console.error('Erro ao buscar perdas:', produtosError);
    }

    const produtosComPerda = (produtosData || []).map(p => ({
      id: p.id,
      nome: p.produto_nome || 'Produto Desconhecido',
      categoria: p.categoria || 'Geral',
      taxa_perda: p.taxa_perda || 0,
      perda_valor_mensal: p.perda_valor_mensal || 0
    }));

    const filepath = await RelatoriosPDFService.gerarRelatorioPerdasDetalhado(
      loja_id,
      produtosComPerda
    );

    res.json({
      success: true,
      data: {
        arquivo: filepath.split('/').pop(),
        url: `/api/v1/relatorios/download/${filepath.split('/').pop()}`,
        tamanho_mb: (require('fs').statSync(filepath).size / (1024 * 1024)).toFixed(2),
        produtos_analisados: produtosComPerda.length,
        gerado_em: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de perdas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar relatório de perdas'
    });
  }
});

/**
 * POST /relatorios/gerar-clientes
 * Generate customer segmentation report
 */
router.post('/gerar-clientes', async (req, res) => {
  try {
    const { loja_id } = req.body;

    if (!loja_id) {
      return res.status(400).json({
        success: false,
        error: 'loja_id é obrigatório'
      });
    }

    // Fetch customer data
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes_loja')
      .select('*')
      .eq('loja_id', loja_id);

    if (clientesError) {
      console.error('Erro ao buscar clientes:', clientesError);
    }

    const filepath = await RelatoriosPDFService.gerarRelatorioClusters(
      loja_id,
      clientesData || []
    );

    res.json({
      success: true,
      data: {
        arquivo: filepath.split('/').pop(),
        url: `/api/v1/relatorios/download/${filepath.split('/').pop()}`,
        tamanho_mb: (require('fs').statSync(filepath).size / (1024 * 1024)).toFixed(2),
        clientes_analisados: (clientesData || []).length,
        gerado_em: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar relatório de clientes'
    });
  }
});

/**
 * POST /relatorios/gerar-compras
 * Generate purchase optimization report
 */
router.post('/gerar-compras', async (req, res) => {
  try {
    const { loja_id } = req.body;

    if (!loja_id) {
      return res.status(400).json({
        success: false,
        error: 'loja_id é obrigatório'
      });
    }

    // Fetch purchase optimization data
    const { data: produtosData, error: produtosError } = await supabase
      .from('otimizacao_compras')
      .select('*')
      .eq('loja_id', loja_id);

    if (produtosError) {
      console.error('Erro ao buscar dados de compras:', produtosError);
    }

    const produtosCompra = (produtosData || []).map(p => ({
      id: p.id,
      nome: p.produto_nome || 'Produto Desconhecido',
      categoria: p.categoria || 'Geral',
      quantidade_otima: p.quantidade_otima || 0,
      gordura_recomendada: p.taxa_seguranca || 0.15,
      economia_mensal: p.economia_mensal || 0,
      risco_falta: p.risco_falta || false
    }));

    const filepath = await RelatoriosPDFService.gerarRelatorioComprasOtimizado(
      loja_id,
      produtosCompra
    );

    res.json({
      success: true,
      data: {
        arquivo: filepath.split('/').pop(),
        url: `/api/v1/relatorios/download/${filepath.split('/').pop()}`,
        tamanho_mb: (require('fs').statSync(filepath).size / (1024 * 1024)).toFixed(2),
        produtos_analisados: produtosCompra.length,
        gerado_em: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de compras:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar relatório de compras'
    });
  }
});

/**
 * GET /relatorios/download/:filename
 * Download generated PDF report
 */
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const reportsDir = require('path').resolve(__dirname, '../../reports');
    const filepath = require('path').resolve(reportsDir, filename);

    // Security check - prevent directory traversal
    if (!filepath.startsWith(reportsDir + require('path').sep) && filepath !== reportsDir) {
      return res.status(400).json({
        success: false,
        error: 'Caminho inválido'
      });
    }

    // Check if file exists
    if (!require('fs').existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    const filestream = require('fs').createReadStream(filepath);
    filestream.pipe(res);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer download do relatório'
    });
  }
});

/**
 * GET /relatorios/listar
 * List all generated reports
 */
router.get('/listar', (req, res) => {
  try {
    const reportsDir = require('path').join(__dirname, '../../reports');
    const fs = require('fs');

    if (!fs.existsSync(reportsDir)) {
      return res.json({
        success: true,
        data: [],
        total: 0
      });
    }

    const files = fs.readdirSync(reportsDir);
    const reports = files
      .filter(f => f.endsWith('.pdf'))
      .map(f => {
        const filepath = require('path').join(reportsDir, f);
        const stats = fs.statSync(filepath);
        return {
          arquivo: f,
          tamanho_mb: (stats.size / (1024 * 1024)).toFixed(2),
          criado_em: stats.birthtime.toISOString(),
          modificado_em: stats.mtime.toISOString(),
          url: `/api/v1/relatorios/download/${f}`
        };
      })
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));

    res.json({
      success: true,
      data: reports,
      total: reports.length
    });
  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar relatórios'
    });
  }
});

// ============ MOCK DATA GENERATORS ============

function generateMockVariations() {
  const categories = ['temporal', 'produto', 'comportamental', 'fidelidade', 'preditivo'];
  const variations = [];

  for (let i = 0; i < 5; i++) {
    variations.push({
      padrao: { descricao: `Padrão ${i + 1}` },
      assertividade: Math.random() * 0.08 + 0.90
    });
  }

  return variations;
}

function generateMockOpportunities() {
  return [
    { tipo: 'cross_sell', descricao: 'Cross-selling opportunity' },
    { tipo: 'up_sell', descricao: 'Upselling opportunity' },
    { tipo: 'retention', descricao: 'Retention opportunity' },
    { tipo: 'reactivation', descricao: 'Reactivation opportunity' }
  ];
}

module.exports = router;
