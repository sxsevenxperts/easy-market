'use strict';

const express = require('express');
const router = express.Router();
const AnomalyDetectionService = require('../services/anomaly-detection');

// ── POST /verificar-peso ─────────────────────────────────────────────────────
// Check scale weight vs expected stock quantity.
// Body: { loja_id, produto_id, peso_detectado, quantidade_esperada, unidade_peso? }
router.post('/verificar-peso', async (req, res) => {
  try {
    const { loja_id, produto_id, peso_detectado, quantidade_esperada, unidade_peso } = req.body;

    if (!loja_id || !produto_id || peso_detectado == null || quantidade_esperada == null) {
      return res.status(400).json({ erro: 'Campos obrigatórios: loja_id, produto_id, peso_detectado, quantidade_esperada.' });
    }

    const service = new AnomalyDetectionService(req.supabase);
    const resultado = await service.verificarDiscrepanciaEstoque(
      loja_id, produto_id,
      Number(peso_detectado), Number(quantidade_esperada),
      unidade_peso || 'kg'
    );

    return res.json({ sucesso: true, resultado });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});


// ── POST /verificar-vendas ───────────────────────────────────────────────────
// Check today's sales vs historical average for anomalies.
// Body: { loja_id, categoria_id, vendas_hoje, media_historica }
router.post('/verificar-vendas', async (req, res) => {
  try {
    const { loja_id, categoria_id, vendas_hoje, media_historica } = req.body;

    if (!loja_id || !categoria_id || vendas_hoje == null || media_historica == null) {
      return res.status(400).json({ erro: 'Campos obrigatórios: loja_id, categoria_id, vendas_hoje, media_historica.' });
    }

    const service = new AnomalyDetectionService(req.supabase);
    const resultado = await service.detectarAnomaliaVendas(
      loja_id, categoria_id,
      Number(vendas_hoje), Number(media_historica)
    );

    return res.json({ sucesso: true, resultado });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// ── GET /estoque-minimo/:loja_id ─────────────────────────────────────────────
// Returns products below minimum stock level for a given store.
// Query: produtos (JSON array) can be passed; otherwise uses DB data.
router.get('/estoque-minimo/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;
    let produtos = [];

    if (req.query.produtos) {
      try {
        produtos = JSON.parse(req.query.produtos);
      } catch {
        return res.status(400).json({ erro: 'Parâmetro "produtos" deve ser um JSON array válido.' });
      }
    }


    // If no produtos passed and supabase available, fetch from DB
    if (produtos.length === 0 && req.supabase) {
      const { data, error } = await req.supabase
        .from('estoque')
        .select('produto_id as id, nome_produto as nome, estoque_atual as estoqueAtual, estoque_minimo as estoqueMinimo, venda_diaria as vendaDiaria')
        .eq('loja_id', loja_id);

      if (!error && data) produtos = data;
    }

    // Fallback simulation
    if (produtos.length === 0) {
      produtos = [
        { id: 'P010', nome: 'Arroz 5kg', estoqueAtual: 3, estoqueMinimo: 10, vendaDiaria: 4 },
        { id: 'P011', nome: 'Feijão 1kg', estoqueAtual: 8, estoqueMinimo: 15, vendaDiaria: 5 },
        { id: 'P012', nome: 'Açúcar 1kg', estoqueAtual: 25, estoqueMinimo: 10, vendaDiaria: 6 },
      ];
    }

    const service = new AnomalyDetectionService(req.supabase);
    const resultado = await service.monitorarEstoqueMinimo(loja_id, produtos);

    return res.json({ sucesso: true, resultado });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// ── GET /vencendo/:loja_id ───────────────────────────────────────────────────
// Returns products expiring soon for a given store.
// Query: dias_alerta (default 7)
router.get('/vencendo/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const diasAlerta = req.query.dias_alerta ? Number(req.query.dias_alerta) : 7;

    if (isNaN(diasAlerta) || diasAlerta < 1) {
      return res.status(400).json({ erro: 'dias_alerta deve ser um número positivo.' });
    }

    const service = new AnomalyDetectionService(req.supabase);
    const resultado = await service.detectarProdutosVencendoEm(loja_id, diasAlerta);

    return res.json({ sucesso: true, resultado });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});


// ── GET /relatorio/:loja_id ──────────────────────────────────────────────────
// Full anomaly report for the last 24h (or custom period).
// Query: periodo_horas (default 24)
router.get('/relatorio/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const periodoHoras = req.query.periodo_horas ? Number(req.query.periodo_horas) : 24;

    if (isNaN(periodoHoras) || periodoHoras < 1) {
      return res.status(400).json({ erro: 'periodo_horas deve ser um número positivo.' });
    }

    const service = new AnomalyDetectionService(req.supabase);
    const resultado = await service.gerarRelatorioAnomalias(loja_id, periodoHoras);

    return res.json({ sucesso: true, resultado });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// ── POST /registrar ──────────────────────────────────────────────────────────
// Manually register an anomaly.
// Body: { loja_id, tipo, severidade, dados }
router.post('/registrar', async (req, res) => {
  try {
    const { loja_id, tipo, severidade, dados } = req.body;

    if (!loja_id || !tipo || !severidade) {
      return res.status(400).json({ erro: 'Campos obrigatórios: loja_id, tipo, severidade.' });
    }

    const service = new AnomalyDetectionService(req.supabase);
    const resultado = await service.registrarAnomalia(loja_id, tipo, severidade, dados || {});

    return res.status(201).json(resultado);
  } catch (err) {
    const status = err.message.includes('inválid') ? 400 : 500;
    return res.status(status).json({ erro: err.message });
  }
});


// ── GET /historico/:loja_id ──────────────────────────────────────────────────
// Anomaly history with optional filters.
// Query: tipo, severidade, status, limit (default 50), offset (default 0)
router.get('/historico/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const { tipo, severidade, status, limit = 50, offset = 0 } = req.query;

    if (req.supabase) {
      let query = req.supabase
        .from('anomalias')
        .select('*')
        .eq('loja_id', loja_id)
        .order('criado_em', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (tipo) query = query.eq('tipo', tipo);
      if (severidade) query = query.eq('severidade', severidade);
      if (status) query = query.eq('status', status);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return res.json({ sucesso: true, total: count, anomalias: data, limit: Number(limit), offset: Number(offset) });
    }

    // Simulated history when no DB
    const simuladas = [
      { id: 'SIM-001', loja_id, tipo: 'peso_discrepante', severidade: 'alta', status: 'pendente', criado_em: new Date(Date.now() - 3600000).toISOString() },
      { id: 'SIM-002', loja_id, tipo: 'estoque_minimo', severidade: 'critica', status: 'pendente', criado_em: new Date(Date.now() - 7200000).toISOString() },
      { id: 'SIM-003', loja_id, tipo: 'produto_vencendo', severidade: 'media', status: 'resolvida', criado_em: new Date(Date.now() - 10800000).toISOString() },
      { id: 'SIM-004', loja_id, tipo: 'venda_anomala', severidade: 'baixa', status: 'ignorada', criado_em: new Date(Date.now() - 14400000).toISOString() },
    ].filter((a) => {
      if (tipo && a.tipo !== tipo) return false;
      if (severidade && a.severidade !== severidade) return false;
      if (status && a.status !== status) return false;
      return true;
    });

    return res.json({ sucesso: true, total: simuladas.length, anomalias: simuladas.slice(Number(offset), Number(offset) + Number(limit)), limit: Number(limit), offset: Number(offset), simulado: true });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});


// ── GET /dashboard/:loja_id ──────────────────────────────────────────────────
// Anomaly dashboard with summary counts by type and severity.
router.get('/dashboard/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;

    let anomalias = [];

    if (req.supabase) {
      const inicio = new Date(Date.now() - 24 * 3600000).toISOString();
      const { data, error } = await req.supabase
        .from('anomalias')
        .select('tipo, severidade, status, criado_em')
        .eq('loja_id', loja_id)
        .gte('criado_em', inicio)
        .order('criado_em', { ascending: false });

      if (!error && data) anomalias = data;
    }

    // Simulate when no DB
    if (anomalias.length === 0) {
      anomalias = [
        { tipo: 'peso_discrepante', severidade: 'alta', status: 'pendente' },
        { tipo: 'estoque_minimo', severidade: 'critica', status: 'pendente' },
        { tipo: 'produto_vencendo', severidade: 'media', status: 'resolvida' },
        { tipo: 'venda_anomala', severidade: 'baixa', status: 'ignorada' },
        { tipo: 'peso_discrepante', severidade: 'media', status: 'pendente' },
        { tipo: 'perda_suspeita', severidade: 'critica', status: 'pendente' },
      ];
    }

    const porTipo = {};
    const porSeveridade = { critica: 0, alta: 0, media: 0, baixa: 0 };
    const porStatus = { pendente: 0, resolvida: 0, ignorada: 0 };

    for (const a of anomalias) {
      porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
      if (porSeveridade[a.severidade] !== undefined) porSeveridade[a.severidade]++;
      if (porStatus[a.status] !== undefined) porStatus[a.status]++;
    }

    return res.json({
      sucesso: true,
      lojaId: loja_id,
      periodo: 'últimas 24h',
      total: anomalias.length,
      porTipo,
      porSeveridade,
      porStatus,
      geradoEm: new Date().toISOString(),
      simulado: !req.supabase || anomalias.length === 0,
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
