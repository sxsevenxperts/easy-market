/**
 * Configurações da Loja
 * GET/PUT /api/v1/config-loja/:loja_id
 */

const express = require('express');
const router = express.Router();

// Função para garantir que as tabelas existem
async function ensureTables(supabase) {
  try {
    // Verificar se tabelas existem
    const { error } = await supabase
      .from('loja_configuracoes')
      .select('id')
      .limit(1);

    // Se tabela não existe, será erro - criar tabelas
    if (error && error.code === 'PGRST100') {
      console.warn('Criando tabelas de configuração...');
      // As tabelas serão criadas manualmente via Supabase SQL editor
      // ou via migration
    }
  } catch (err) {
    console.error('Erro ao verificar tabelas:', err.message);
  }
}

// GET configurações
router.get('/:loja_id', async (req, res) => {
  const { loja_id } = req.params;
  const supabase = req.supabase;

  if (!supabase) return res.status(503).json({ erro: 'BD indisponível' });

  try {
    const { data: config, error } = await supabase
      .from('loja_configuracoes')
      .select('*')
      .eq('loja_id', loja_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Se não existe, retornar defaults
    if (!config) {
      return res.json({
        sucesso: true,
        config: {
          loja_id,
          email_alertas: '',
          notificacoes_ativas: ['whatsapp', 'email'],
          alerta_estoque_minimo: true,
          alerta_falta: true,
          alerta_perdas: true,
          alerta_anomalia: true,
          alerta_expiracao: true,
          taxa_perda_tolerancia: 2.5,
          estoque_minimo_padrao: 20,
          hora_relatorio: '07:00',
          timezone: 'America/Sao_Paulo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }

    res.json({ sucesso: true, config });
  } catch (err) {
    console.error('Erro ao buscar config:', err);
    res.status(500).json({ erro: 'Erro ao buscar configurações' });
  }
});

// PUT atualizar configurações
router.put('/:loja_id', async (req, res) => {
  const { loja_id } = req.params;
  const supabase = req.supabase;

  if (!supabase) return res.status(503).json({ erro: 'BD indisponível' });

  try {
    const { data: existing } = await supabase
      .from('loja_configuracoes')
      .select('id')
      .eq('loja_id', loja_id)
      .single();

    const configData = {
      loja_id,
      ...req.body,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existing) {
      result = await supabase
        .from('loja_configuracoes')
        .update(configData)
        .eq('loja_id', loja_id)
        .select()
        .single();
    } else {
      configData.created_at = new Date().toISOString();
      result = await supabase
        .from('loja_configuracoes')
        .insert([configData])
        .select()
        .single();
    }

    if (result.error) throw result.error;

    res.json({ sucesso: true, config: result.data });
  } catch (err) {
    console.error('Erro ao salvar config:', err);
    res.status(500).json({ erro: 'Erro ao salvar configurações' });
  }
});

// GET histórico de mudanças
router.get('/:loja_id/historico', async (req, res) => {
  const { loja_id } = req.params;
  const supabase = req.supabase;

  if (!supabase) return res.status(503).json({ erro: 'BD indisponível' });

  try {
    const { data: historico } = await supabase
      .from('loja_config_historico')
      .select('*')
      .eq('loja_id', loja_id)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ sucesso: true, historico: historico || [] });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ erro: 'Erro ao buscar histórico' });
  }
});

module.exports = router;
