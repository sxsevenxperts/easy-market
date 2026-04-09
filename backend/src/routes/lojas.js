const express = require('express');
const router = express.Router();

/**
 * POST / - Create a new store
 */
router.post('/', async (req, res) => {
  try {
    const { nome, endereco, cidade, estado, telefone } = req.body;

    if (!nome) {
      return res.status(400).json({ sucesso: false, erro: 'nome é obrigatório' });
    }

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, loja: { id: Math.random().toString(36), nome }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('lojas')
        .insert({ nome, endereco, cidade, estado, telefone, ativo: true })
        .select();

      if (error) {
        console.warn('[Lojas] Insert error:', error.message);
        return res.json({ sucesso: true, loja: { nome }, mock: true });
      }

      res.status(201).json({ sucesso: true, loja: data?.[0] });
    } catch (e) {
      res.json({ sucesso: true, loja: { nome }, mock: true });
    }
  } catch (error) {
    console.error('[Lojas] POST error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao criar loja' });
  }
});

/**
 * GET / - List all stores
 */
router.get('/', async (req, res) => {
  try {
    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, lojas: mockLojas(), mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .eq('ativo', true);

      if (error) {
        console.warn('[Lojas] Fetch error:', error.message);
        return res.json({ sucesso: true, lojas: mockLojas(), mock: true });
      }

      res.json({ sucesso: true, lojas: data || mockLojas() });
    } catch (e) {
      res.json({ sucesso: true, lojas: mockLojas(), mock: true });
    }
  } catch (error) {
    console.error('[Lojas] GET error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao listar lojas' });
  }
});

/**
 * GET /:loja_id - Get a specific store
 */
router.get('/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, loja: { id: loja_id, nome: loja_id, ativo: true }, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .eq('id', loja_id)
        .single();

      if (error) {
        console.warn('[Lojas] Fetch single error:', error.message);
        return res.status(404).json({ sucesso: false, erro: 'Loja não encontrada' });
      }

      res.json({ sucesso: true, loja: data });
    } catch (e) {
      res.status(404).json({ sucesso: false, erro: 'Loja não encontrada' });
    }
  } catch (error) {
    console.error('[Lojas] GET :id error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao buscar loja' });
  }
});

/**
 * PUT /:loja_id - Update a store
 */
async function updateLoja(req, res) {
  try {
    const { loja_id } = req.params;
    const { nome, endereco, cidade, estado, telefone, ativo, cep, latitude, longitude } = req.body;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, loja: { id: loja_id, nome }, mock: true });
    }

    const updateData = { nome, endereco, cidade, estado, telefone, ativo };
    if (cep       !== undefined) updateData.cep       = cep;
    if (latitude  !== undefined) updateData.latitude  = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    try {
      const { data, error } = await supabase
        .from('lojas')
        .upsert({ id: loja_id, ...updateData }, { onConflict: 'id' })
        .select();

      if (error) {
        console.warn('[Lojas] Upsert error:', error.message);
        return res.status(500).json({ sucesso: false, erro: error.message });
      }

      console.log(`[Lojas] Loja ${loja_id} atualizada: ${updateData.cidade}/${updateData.estado} CEP:${updateData.cep} lat:${updateData.latitude}`);
      res.json({ sucesso: true, loja: data?.[0] });
    } catch (e) {
      res.status(404).json({ sucesso: false, erro: 'Loja não encontrada' });
    }
  } catch (error) {
    console.error('[Lojas] PUT error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar loja' });
  }
}

router.put('/:loja_id', updateLoja);
router.patch('/:loja_id', updateLoja);

/**
 * DELETE /:loja_id - Delete a store
 */
router.delete('/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, id: loja_id, mock: true });
    }

    try {
      const { error } = await supabase
        .from('lojas')
        .delete()
        .eq('id', loja_id);

      if (error) {
        console.warn('[Lojas] Delete error:', error.message);
        return res.status(404).json({ sucesso: false, erro: 'Loja não encontrada' });
      }

      res.json({ sucesso: true, id: loja_id, message: 'Loja deletada' });
    } catch (e) {
      res.status(404).json({ sucesso: false, erro: 'Loja não encontrada' });
    }
  } catch (error) {
    console.error('[Lojas] DELETE error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao deletar loja' });
  }
});

// Mock data for development
function mockLojas() {
  return [
    { id: 'loja_001', nome: 'Loja Centro', cidade: 'São Paulo', estado: 'SP', ativo: true },
    { id: 'loja_002', nome: 'Loja Vila', cidade: 'São Paulo', estado: 'SP', ativo: true },
    { id: 'loja_003', nome: 'Loja Zona Leste', cidade: 'São Paulo', estado: 'SP', ativo: true }
  ];
}

module.exports = router;
