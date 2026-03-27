const express = require('express');
const router = express.Router();

/**
 * GET / - List all customers
 */
router.get('/', async (req, res) => {
  try {
    const { loja_id } = req.query;
    const supabase = req.supabase;

    if (!supabase) {
      return res.json({ sucesso: true, clientes: mockClientes(), mock: true });
    }

    try {
      let query = supabase.from('clientes').select('*');
      if (loja_id) query = query.eq('loja_id', loja_id);
      const { data, error } = await query.limit(100);

      if (error) {
        return res.json({ sucesso: true, clientes: mockClientes(), mock: true });
      }

      res.json({ sucesso: true, clientes: data || mockClientes() });
    } catch (e) {
      res.json({ sucesso: true, clientes: mockClientes(), mock: true });
    }
  } catch (error) {
    console.error('[Clientes] GET error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao listar clientes' });
  }
});

/**
 * POST / - Create a new customer
 */
router.post('/', async (req, res) => {
  try {
    const { nome, email, telefone, loja_id } = req.body;

    if (!nome || !loja_id) {
      return res.status(400).json({ sucesso: false, erro: 'nome e loja_id são obrigatórios' });
    }

    const supabase = req.supabase;
    if (!supabase) {
      return res.status(201).json({ sucesso: true, cliente: { nome }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({ nome, email, telefone, loja_id })
        .select();

      if (error) {
        return res.status(201).json({ sucesso: true, cliente: { nome }, mock: true });
      }

      res.status(201).json({ sucesso: true, cliente: data?.[0] });
    } catch (e) {
      res.status(201).json({ sucesso: true, cliente: { nome }, mock: true });
    }
  } catch (error) {
    console.error('[Clientes] POST error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao criar cliente' });
  }
});

/**
 * GET /:id - Get a specific customer
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase;

    if (!supabase) {
      return res.json({ sucesso: true, cliente: { id, nome: 'Cliente Mock' }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });
      }

      res.json({ sucesso: true, cliente: data });
    } catch (e) {
      res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });
    }
  } catch (error) {
    console.error('[Clientes] GET :id error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao recuperar cliente' });
  }
});

/**
 * PUT /:id - Update a customer
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone } = req.body;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, cliente: { id, nome }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({ nome, email, telefone })
        .eq('id', id)
        .select();

      if (error) {
        return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });
      }

      res.json({ sucesso: true, cliente: data?.[0] });
    } catch (e) {
      res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });
    }
  } catch (error) {
    console.error('[Clientes] PUT error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar cliente' });
  }
});

/**
 * DELETE /:id - Delete a customer
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase;

    if (!supabase) {
      return res.json({ sucesso: true, id, mock: true });
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });
      }

      res.json({ sucesso: true, id, message: 'Cliente deletado' });
    } catch (e) {
      res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });
    }
  } catch (error) {
    console.error('[Clientes] DELETE error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao deletar cliente' });
  }
});

function mockClientes() {
  return [
    { id: 1, nome: 'João Silva', email: 'joao@example.com', loja_id: 'loja_001' },
    { id: 2, nome: 'Maria Santos', email: 'maria@example.com', loja_id: 'loja_001' },
    { id: 3, nome: 'Pedro Costa', email: 'pedro@example.com', loja_id: 'loja_002' }
  ];
}

module.exports = router;
