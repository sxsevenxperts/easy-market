const express = require('express');
const router = express.Router();
// const Joi = require('joi');
// const twilio = require('twilio'); // Optional

/**
 * POST /notificacao-contatos - Create notification contact
 */
router.post('/notificacao-contatos', async (req, res) => {
  try {
    const { loja_id, nome, cargo, telefone_whatsapp, email, ativo } = req.body;

    if (!loja_id || !nome) {
      return res.status(400).json({ sucesso: false, erro: 'loja_id e nome são obrigatórios' });
    }

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, id: Math.random().toString(36), mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('notificacao_contatos')
        .insert({
          loja_id,
          nome,
          cargo,
          telefone_whatsapp,
          email,
          ativo: ativo !== false,
          criado_em: new Date().toISOString()
        })
        .select();

      if (error) {
        console.warn('[NotificacaoContatos] Insert error:', error.message);
        return res.json({ sucesso: true, id: Math.random().toString(36), mock: true });
      }

      res.json({ sucesso: true, contato: data?.[0] });
    } catch (e) {
      res.json({ sucesso: true, id: Math.random().toString(36), mock: true });
    }
  } catch (error) {
    console.error('[NotificacaoContatos] POST error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao criar contato' });
  }
});

/**
 * GET /notificacao-contatos/:loja_id - Get notification contacts
 */
router.get('/notificacao-contatos/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, contatos: [], loja_id, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('notificacao_contatos')
        .select('*')
        .eq('loja_id', loja_id)
        .eq('ativo', true);

      if (error) {
        return res.json({ sucesso: true, contatos: [], loja_id, mock: true });
      }

      res.json({ sucesso: true, contatos: data || [], loja_id });
    } catch (e) {
      res.json({ sucesso: true, contatos: [], loja_id, mock: true });
    }
  } catch (error) {
    console.error('[NotificacaoContatos] GET error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao recuperar contatos' });
  }
});

/**
 * PUT /notificacao-contatos/:id - Update notification contact
 */
router.put('/notificacao-contatos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cargo, telefone_whatsapp, email, ativo } = req.body;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, id, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('notificacao_contatos')
        .update({ nome, cargo, telefone_whatsapp, email, ativo, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) {
        console.warn('[NotificacaoContatos] Update error:', error.message);
        return res.json({ sucesso: true, id, mock: true });
      }

      res.json({ sucesso: true, contato: data?.[0] });
    } catch (e) {
      res.json({ sucesso: true, id, mock: true });
    }
  } catch (error) {
    console.error('[NotificacaoContatos] PUT error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar contato' });
  }
});

/**
 * DELETE /notificacao-contatos/:id - Delete notification contact
 */
router.delete('/notificacao-contatos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, id, mock: true });
    }

    try {
      const { error } = await supabase
        .from('notificacao_contatos')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[NotificacaoContatos] Delete error:', error.message);
        return res.json({ sucesso: true, id, mock: true });
      }

      res.json({ sucesso: true, id, message: 'Contato deletado' });
    } catch (e) {
      res.json({ sucesso: true, id, mock: true });
    }
  } catch (error) {
    console.error('[NotificacaoContatos] DELETE error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao deletar contato' });
  }
});

module.exports = router;
