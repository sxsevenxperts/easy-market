const express = require('express');
const router = express.Router();

/**
 * GET / - Debug info
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      sucesso: true,
      debug: {
        ambiente: process.env.NODE_ENV || 'development',
        porta: process.env.PORT || 3000,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memoria: process.memoryUsage(),
        supabase: !!req.supabase ? 'conectado' : 'não configurado'
      }
    });
  } catch (error) {
    console.error('[Debug] GET error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao obter info de debug' });
  }
});

/**
 * GET /health - Health check
 */
router.get('/health', async (req, res) => {
  try {
    res.json({
      sucesso: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: 'Serviço indisponível' });
  }
});

/**
 * GET /logs - Get logs
 */
router.get('/logs', async (req, res) => {
  try {
    res.json({
      sucesso: true,
      logs: [],
      message: 'Logs não disponíveis em produção'
    });
  } catch (error) {
    console.error('[Debug] GET logs error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao recuperar logs' });
  }
});

/**
 * POST /test - Test endpoint
 */
router.post('/test', async (req, res) => {
  try {
    const { mensagem } = req.body;

    res.json({
      sucesso: true,
      teste: {
        echo: mensagem || 'nenhuma mensagem',
        timestamp: new Date().toISOString(),
        supabase: !!req.supabase
      }
    });
  } catch (error) {
    console.error('[Debug] POST test error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro no teste' });
  }
});

module.exports = router;
