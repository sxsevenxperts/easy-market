const express = require('express');
const router = express.Router();

/**
 * GET / - List all reports
 */
router.get('/', async (req, res) => {
  try {
    const { loja_id, tipo } = req.query;
    const supabase = req.supabase;

    if (!supabase) {
      return res.json({ sucesso: true, relatorios: mockRelatorios(), mock: true });
    }

    try {
      let query = supabase.from('relatorios').select('*');
      if (loja_id) query = query.eq('loja_id', loja_id);
      if (tipo) query = query.eq('tipo', tipo);
      const { data, error } = await query.limit(100);

      if (error) {
        return res.json({ sucesso: true, relatorios: mockRelatorios(), mock: true });
      }

      res.json({ sucesso: true, relatorios: data || mockRelatorios() });
    } catch (e) {
      res.json({ sucesso: true, relatorios: mockRelatorios(), mock: true });
    }
  } catch (error) {
    console.error('[Relatorios] GET error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao listar relatórios' });
  }
});

/**
 * POST / - Create a new report
 */
router.post('/', async (req, res) => {
  try {
    const { loja_id, tipo, titulo } = req.body;

    if (!loja_id || !tipo || !titulo) {
      return res.status(400).json({ sucesso: false, erro: 'Dados incompletos' });
    }

    const supabase = req.supabase;
    if (!supabase) {
      return res.status(201).json({ sucesso: true, relatorio: { titulo }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('relatorios')
        .insert({ loja_id, tipo, titulo, criado_em: new Date().toISOString() })
        .select();

      if (error) {
        return res.status(201).json({ sucesso: true, relatorio: { titulo }, mock: true });
      }

      res.status(201).json({ sucesso: true, relatorio: data?.[0] });
    } catch (e) {
      res.status(201).json({ sucesso: true, relatorio: { titulo }, mock: true });
    }
  } catch (error) {
    console.error('[Relatorios] POST error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao criar relatório' });
  }
});

/**
 * GET /:id - Get a specific report
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase;

    if (!supabase) {
      return res.json({ sucesso: true, relatorio: { id, titulo: 'Relatório Mock' }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('relatorios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return res.status(404).json({ sucesso: false, erro: 'Relatório não encontrado' });
      }

      res.json({ sucesso: true, relatorio: data });
    } catch (e) {
      res.status(404).json({ sucesso: false, erro: 'Relatório não encontrado' });
    }
  } catch (error) {
    console.error('[Relatorios] GET :id error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao recuperar relatório' });
  }
});

function mockRelatorios() {
  return [
    { id: 1, loja_id: 'loja_001', tipo: 'vendas', titulo: 'Relatório de Vendas Diário' },
    { id: 2, loja_id: 'loja_001', tipo: 'estoque', titulo: 'Relatório de Estoque' },
    { id: 3, loja_id: 'loja_002', tipo: 'predicoes', titulo: 'Previsões de Demanda' }
  ];
}

module.exports = router;
