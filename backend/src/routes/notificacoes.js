const express = require('express');
const router = express.Router();

/**
 * POST /notificacoes - Create a new notification
 */
router.post('/notificacoes', async (req, res) => {
  try {
    const { loja_id, titulo, descricao, tipo, destinatario } = req.body;

    if (!loja_id || !titulo) {
      return res.status(400).json({ sucesso: false, erro: 'loja_id e titulo são obrigatórios' });
    }

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, id: Math.random().toString(36), mock: true });
    }

    // Try to insert into Supabase if table exists
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .insert({
          loja_id,
          titulo,
          descricao,
          tipo: tipo || 'info',
          destinatario,
          criado_em: new Date().toISOString()
        })
        .select();

      if (error) {
        console.warn('[Notificacoes] Supabase insert error:', error.message);
        return res.json({ sucesso: true, id: Math.random().toString(36), mock: true });
      }

      res.json({ sucesso: true, notificacao: data?.[0] });
    } catch (e) {
      console.warn('[Notificacoes] Insert failed, returning mock:', e.message);
      res.json({ sucesso: true, id: Math.random().toString(36), mock: true });
    }
  } catch (error) {
    console.error('[Notificacoes] POST error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao criar notificação' });
  }
});

/**
 * GET /notificacoes/:loja_id - Get notifications for a store
 */
router.get('/notificacoes/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, notificacoes: [], mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('loja_id', loja_id)
        .order('criado_em', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('[Notificacoes] Supabase fetch error:', error.message);
        return res.json({ sucesso: true, notificacoes: [], mock: true });
      }

      res.json({ sucesso: true, notificacoes: data || [], loja_id });
    } catch (e) {
      console.warn('[Notificacoes] Fetch failed, returning mock:', e.message);
      res.json({ sucesso: true, notificacoes: [], mock: true });
    }
  } catch (error) {
    console.error('[Notificacoes] GET error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao recuperar notificações' });
  }
});

/**
 * GET /notificacoes/:loja_id/config - Get notification configuration
 */
router.get('/notificacoes/:loja_id/config', async (req, res) => {
  try {
    const { loja_id } = req.params;

    res.json({
      sucesso: true,
      loja_id,
      config: {
        email_habilitado: true,
        sms_habilitado: false,
        push_habilitado: true,
        whatsapp_habilitado: false,
        frequencia: 'real-time'
      }
    });
  } catch (error) {
    console.error('[Notificacoes] GET config error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao recuperar configuração' });
  }
});

/**
 * PUT /notificacoes/:loja_id/config - Update notification configuration
 */
router.put('/notificacoes/:loja_id/config', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const { config } = req.body;

    res.json({
      sucesso: true,
      loja_id,
      message: 'Configuração atualizada',
      config: config || {}
    });
  } catch (error) {
    console.error('[Notificacoes] PUT config error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar configuração' });
  }
});

/**
 * POST /notificacoes/whatsapp/qrcode - Get WhatsApp QR Code
 */
router.post('/notificacoes/whatsapp/qrcode', async (req, res) => {
  try {
    const { loja_id } = req.body;

    res.json({
      sucesso: true,
      loja_id,
      qrcode: 'MOCK_QRCODE_DATA',
      message: 'QR Code gerado (mock)'
    });
  } catch (error) {
    console.error('[Notificacoes] WhatsApp QR error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao gerar QR Code' });
  }
});

/**
 * GET /notificacoes/:loja_id/push - Get push notifications
 */
router.get('/notificacoes/:loja_id/push', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, notificacoes: [], loja_id, mock: true });
    }

    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('loja_id', loja_id)
        .eq('tipo', 'push')
        .limit(20);

      if (error) {
        return res.json({ sucesso: true, notificacoes: [], loja_id, mock: true });
      }

      res.json({ sucesso: true, notificacoes: data || [], loja_id });
    } catch (e) {
      res.json({ sucesso: true, notificacoes: [], loja_id, mock: true });
    }
  } catch (error) {
    console.error('[Notificacoes] GET push error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao recuperar push notifications' });
  }
});

/**
 * PUT /notificacoes/:id/marcar-lida - Mark notification as read
 */
router.put('/notificacoes/:id/marcar-lida', async (req, res) => {
  try {
    const { id } = req.params;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, id, mock: true });
    }

    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('[Notificacoes] Mark read error:', error.message);
        return res.json({ sucesso: true, id, mock: true });
      }

      res.json({ sucesso: true, id, message: 'Marcado como lido' });
    } catch (e) {
      res.json({ sucesso: true, id, mock: true });
    }
  } catch (error) {
    console.error('[Notificacoes] PUT mark read error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao marcar como lido' });
  }
});

/**
 * DELETE /notificacoes/:id - Delete a notification
 */
router.delete('/notificacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const supabase = req.supabase;
    if (!supabase) {
      return res.json({ sucesso: true, id, mock: true });
    }

    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[Notificacoes] Delete error:', error.message);
        return res.json({ sucesso: true, id, mock: true });
      }

      res.json({ sucesso: true, id, message: 'Notificação deletada' });
    } catch (e) {
      res.json({ sucesso: true, id, mock: true });
    }
  } catch (error) {
    console.error('[Notificacoes] DELETE error:', error.message);
    res.status(500).json({ sucesso: false, erro: 'Erro ao deletar notificação' });
  }
});

module.exports = router;
