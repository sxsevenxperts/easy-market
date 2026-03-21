'use strict';

const express = require('express');
const router = express.Router();
const RFMScoringService = require('../services/rfm-scoring');

// ─── GET /loja/:loja_id/segmentos ─────────────────────────────────────────
// Retorna todos os segmentos de clientes da loja com resumo
router.get('/loja/:loja_id/segmentos', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const service = new RFMScoringService(req.supabase);
    const resultado = await service.segmentarTodosClientes(loja_id);
    return res.status(200).json({ ok: true, data: resultado });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
});

// ─── GET /loja/:loja_id/cliente/:cliente_id ───────────────────────────────
// Retorna score RFM detalhado de um cliente específico
router.get('/loja/:loja_id/cliente/:cliente_id', async (req, res) => {
  try {
    const { loja_id, cliente_id } = req.params;
    const service = new RFMScoringService(req.supabase);
    const resultado = await service.calcularRFMCliente(loja_id, cliente_id);
    return res.status(200).json({ ok: true, data: resultado });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
});


// ─── GET /loja/:loja_id/top-clientes ─────────────────────────────────────
// Retorna os melhores clientes ordenados por score (limite via query ?limite=N)
router.get('/loja/:loja_id/top-clientes', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const limite = parseInt(req.query.limite, 10) || 10;
    if (limite < 1 || limite > 200) {
      return res.status(400).json({ ok: false, erro: 'Parâmetro "limite" deve estar entre 1 e 200.' });
    }
    const service = new RFMScoringService(req.supabase);
    const resultado = await service.obterTopClientes(loja_id, limite);
    return res.status(200).json({ ok: true, total: resultado.length, data: resultado });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
});

// ─── GET /loja/:loja_id/clientes-risco ───────────────────────────────────
// Retorna clientes em risco de churn (At Risk, Cant Lose Them, About To Sleep, Lost)
router.get('/loja/:loja_id/clientes-risco', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const service = new RFMScoringService(req.supabase);
    const resultado = await service.obterClientesRisco(loja_id);
    return res.status(200).json({ ok: true, total: resultado.length, data: resultado });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
});

// ─── GET /loja/:loja_id/recomendacoes/:segmento ───────────────────────────
// Retorna ações recomendadas para um segmento específico
router.get('/loja/:loja_id/recomendacoes/:segmento', (req, res) => {
  try {
    const { loja_id, segmento } = req.params;
    const segmentoDecoded = decodeURIComponent(segmento);
    const service = new RFMScoringService(req.supabase);
    const resultado = service.obterRecomendacoesPorSegmento(segmentoDecoded);
    return res.status(200).json({ ok: true, loja_id, segmento: segmentoDecoded, data: resultado });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
});


// ─── GET /loja/:loja_id/dashboard ────────────────────────────────────────
// Dashboard completo RFM: segmentos, top clientes e clientes em risco
router.get('/loja/:loja_id/dashboard', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const service = new RFMScoringService(req.supabase);

    const [segmentacao, topClientes, clientesRisco] = await Promise.all([
      service.segmentarTodosClientes(loja_id),
      service.obterTopClientes(loja_id, 10),
      service.obterClientesRisco(loja_id),
    ]);

    const todos = Object.values(segmentacao.segmentos).flat();
    const scoreGeral = todos.length
      ? parseFloat((todos.reduce((a, c) => a + c.score, 0) / todos.length).toFixed(2))
      : 0;

    return res.status(200).json({
      ok: true,
      loja_id,
      geradoEm: new Date().toISOString(),
      data: {
        resumo: {
          totalClientes: segmentacao.total,
          scoreMediaGeral: scoreGeral,
          totalEmRisco: clientesRisco.length,
          segmentosAtivos: segmentacao.resumo.length,
        },
        segmentos: segmentacao.resumo,
        topClientes,
        clientesRisco,
        pesos: {
          recencia: '30%',
          frequencia: '25%',
          monetario: '20%',
          fidelidade: '15%',
          engajamento: '10%',
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
});

module.exports = router;
