/**
 * Rotas de Alertas
 * Easy Market - Gestão de Alertas de Loja
 */

const express = require('express');
const router = express.Router();

// ============================================
// POST /
// Criar novo alerta
// ============================================
router.post('/', async (req, res) => {
  try {
    const {
      loja_id,
      sku,
      categoria,
      tipo,
      urgencia = 'média',
      titulo,
      mensagem,
      dados_json = {}
    } = req.body;

    // Manual validation
    if (!loja_id) {
      return res.status(400).json({ error: 'validation_error', details: 'loja_id é obrigatório' });
    }
    if (!tipo || !['desperdicio', 'falta_estoque', 'preco_anormal', 'vencimento_proximo'].includes(tipo)) {
      return res.status(400).json({
        error: 'validation_error',
        details: 'tipo inválido. Use: desperdicio, falta_estoque, preco_anormal, vencimento_proximo'
      });
    }
    if (!titulo) {
      return res.status(400).json({ error: 'validation_error', details: 'titulo é obrigatório' });
    }
    if (!['alta', 'média', 'baixa'].includes(urgencia)) {
      return res.status(400).json({
        error: 'validation_error',
        details: 'urgencia inválida. Use: alta, média, baixa'
      });
    }

    const supabase = req.supabase;

    // Verify loja exists
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('loja_id')
      .eq('loja_id', loja_id)
      .single();

    if (lojaError || !loja) {
      return res.status(404).json({ error: 'loja_not_found' });
    }

    // Calculate ROI estimate based on alert type
    let roiEstimado = 0;
    if (tipo === 'desperdicio') {
      roiEstimado = (dados_json.quantidade_comprometida * dados_json.preco_unitario) || 0;
    } else if (tipo === 'falta_estoque') {
      roiEstimado = (dados_json.dias_sem_estoque * dados_json.faturamento_diario) || 0;
    }

    const { data: novoAlerta, error: insertError } = await supabase
      .from('alertas')
      .insert({
        loja_id,
        sku: sku || null,
        categoria: categoria || null,
        tipo,
        urgencia,
        titulo,
        mensagem: mensagem || null,
        dados_json,
        roi_estimado: roiEstimado,
        status: 'aberto'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting alert:', insertError);
      return res.status(500).json({ error: 'internal_server_error', message: insertError.message });
    }

    console.log(`Alert created: ${tipo} for ${loja_id}`);

    return res.status(201).json(novoAlerta);

  } catch (err) {
    console.error('Error creating alert:', err);
    return res.status(500).json({
      error: 'internal_server_error',
      message: err.message
    });
  }
});

// ============================================
// GET /:loja_id
// Listar alertas da loja
// ============================================
router.get('/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const { status = 'aberto', tipo, limit = 50, offset = 0 } = req.query;

    const supabase = req.supabase;

    let query = supabase
      .from('alertas')
      .select('*')
      .eq('loja_id', loja_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data: alertas, error } = await query;

    if (error) {
      console.error('Error fetching alerts:', error);
      return res.status(500).json({ error: 'internal_server_error' });
    }

    return res.status(200).json({
      loja_id,
      total: alertas.length,
      alertas
    });

  } catch (err) {
    console.error('Error fetching alerts:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

// ============================================
// GET /:loja_id/criticos
// Alertas críticos da loja
// ============================================
router.get('/:loja_id/criticos', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const supabase = req.supabase;

    const { data: criticos, error } = await supabase
      .from('alertas')
      .select('*')
      .eq('loja_id', loja_id)
      .in('urgencia', ['alta', 'média'])
      .in('status', ['aberto', 'em_acao'])
      .order('urgencia', { ascending: true }) // 'alta' comes before 'média' alphabetically — secondary sort by date
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching critical alerts:', error);
      return res.status(500).json({ error: 'internal_server_error' });
    }

    return res.status(200).json({
      loja_id,
      criticos
    });

  } catch (err) {
    console.error('Error fetching critical alerts:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

// ============================================
// PUT /:id
// Atualizar status do alerta
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolucao_sugerida } = req.body;

    if (!['aberto', 'em_acao', 'resolvido'].includes(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }

    const supabase = req.supabase;

    const updateData = {
      status,
      resolucao_sugerida: resolucao_sugerida || null
    };

    if (status === 'resolvido') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: alerta, error } = await supabase
      .from('alertas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !alerta) {
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({ error: 'alert_not_found' });
      }
      console.error('Error updating alert:', error);
      return res.status(500).json({ error: 'internal_server_error' });
    }

    console.log(`Alert ${id} updated to status: ${status}`);

    return res.status(200).json(alerta);

  } catch (err) {
    console.error('Error updating alert:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

// ============================================
// GET /:loja_id/resumo
// Resumo de alertas para o dashboard
// ============================================
router.get('/:loja_id/resumo', async (req, res) => {
  try {
    const { loja_id } = req.params;

    const supabase = req.supabase;

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: alertas, error } = await supabase
      .from('alertas')
      .select('tipo, status, roi_estimado')
      .eq('loja_id', loja_id)
      .gte('created_at', since);

    if (error) {
      console.error('Error fetching alert summary:', error);
      return res.status(500).json({ error: 'internal_server_error' });
    }

    // Group by tipo + status manually (replicating the SQL GROUP BY)
    const grupos = {};
    for (const row of alertas) {
      const key = `${row.tipo}__${row.status}`;
      if (!grupos[key]) {
        grupos[key] = { tipo: row.tipo, status: row.status, total: 0, roi_total: 0 };
      }
      grupos[key].total += 1;
      grupos[key].roi_total += parseFloat(row.roi_estimado) || 0;
    }

    const resumo = Object.values(grupos);

    return res.status(200).json({
      loja_id,
      resumo
    });

  } catch (err) {
    console.error('Error fetching alert summary:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

module.exports = router;
