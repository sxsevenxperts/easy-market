const express = require('express');
const router = express.Router();

/**
 * GET / - List inventory
 */
router.get('/', async (req, res) => {
  try {
    const { loja_id } = req.query;
    const supabase = req.supabase;

    if (!supabase) {
      return res.json({ sucesso: true, inventario: mockInventario(), mock: true });
    }

    try {
      let query = supabase.from('inventario').select('*');
      if (loja_id) query = query.eq('loja_id', loja_id);
      const { data, error } = await query.limit(100);

      if (error) {
        return res.json({ sucesso: true, inventario: mockInventario(), mock: true });
      }

      res.json({ sucesso: true, inventario: data || mockInventario() });
    } catch (e) {
      res.json({ sucesso: true, inventario: mockInventario(), mock: true });
    }
  } catch (error) {
    console.error('[Inventario] GET error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao listar inventário' });
  }
});

/**
 * POST / - Create inventory item
 */
router.post('/', async (req, res) => {
  try {
    const { loja_id, sku, nome, quantidade } = req.body;

    if (!loja_id || !sku || !nome) {
      return res.status(400).json({ sucesso: false, erro: 'Dados incompletos' });
    }

    const supabase = req.supabase;
    if (!supabase) {
      return res.status(201).json({ sucesso: true, item: { sku, nome }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('inventario')
        .insert({ loja_id, sku, nome, quantidade: quantidade || 0 })
        .select();

      if (error) {
        return res.status(201).json({ sucesso: true, item: { sku, nome }, mock: true });
      }

      res.status(201).json({ sucesso: true, item: data?.[0] });
    } catch (e) {
      res.status(201).json({ sucesso: true, item: { sku, nome }, mock: true });
    }
  } catch (error) {
    console.error('[Inventario] POST error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao criar item' });
  }
});

/**
 * GET /:id - Get specific inventory item
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase;

    if (!supabase) {
      return res.json({ sucesso: true, item: { id, sku: 'SKU-001', nome: 'Item Mock' }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return res.status(404).json({ sucesso: false, erro: 'Item não encontrado' });
      }

      res.json({ sucesso: true, item: data });
    } catch (e) {
      res.status(404).json({ sucesso: false, erro: 'Item não encontrado' });
    }
  } catch (error) {
    console.error('[Inventario] GET :id error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao recuperar item' });
  }
});

/**
 * PUT /:id - Update inventory item
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade, preco_unitario } = req.body;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, item: { id }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('inventario')
        .update({ quantidade, preco_unitario })
        .eq('id', id)
        .select();

      if (error) {
        return res.status(404).json({ sucesso: false, erro: 'Item não encontrado' });
      }

      res.json({ sucesso: true, item: data?.[0] });
    } catch (e) {
      res.status(404).json({ sucesso: false, erro: 'Item não encontrado' });
    }
  } catch (error) {
    console.error('[Inventario] PUT error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar item' });
  }
});

function mockInventario() {
  return [
    { id: 1, sku: 'SKU-001', nome: 'Produto A', quantidade: 150, preco_unitario: 10.00, loja_id: 'loja_001' },
    { id: 2, sku: 'SKU-002', nome: 'Produto B', quantidade: 80, preco_unitario: 25.00, loja_id: 'loja_001' },
    { id: 3, sku: 'SKU-003', nome: 'Produto C', quantidade: 200, preco_unitario: 15.50, loja_id: 'loja_002' }
  ];
}

module.exports = router;
