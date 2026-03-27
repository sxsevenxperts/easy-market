/**
 * Relatórios Agendados — Express Router
 * Usa req.supabase injetado via middleware (sem pg pool)
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

// ==================== ROTAS ====================

// GET - Listar relatórios agendados
router.get('/', async (req, res) => {
  try {
    if (!req.supabase) {
      return res.json({ sucesso: true, relatorios: [], total: 0, mock: true });
    }

    const { data, error } = await req.supabase
      .from('relatorios_agendados')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.json({
      sucesso: true,
      total: data?.length || 0,
      relatorios: data || [],
    });
  } catch (error) {
    logger.error('Erro ao listar relatórios agendados:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// POST - Agendar novo relatório
router.post('/agendar', async (req, res) => {
  const { loja_id, tipo, horario, dia_semana, dia_mes, destinatarios, ativo } = req.body;

  try {
    if (!loja_id || !tipo || !horario || !destinatarios?.length) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: loja_id, tipo, horario, destinatarios',
      });
    }

    if (!req.supabase) {
      return res.json({ sucesso: true, mock: true, mensagem: 'Relatório agendado (mock)' });
    }

    const { data, error } = await req.supabase
      .from('relatorios_agendados')
      .insert({
        loja_id,
        tipo,
        horario,
        dia_semana: dia_semana || null,
        dia_mes: dia_mes || null,
        destinatarios,
        ativo: ativo !== false,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info(`Relatório agendado: ${tipo} para ${loja_id}`);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Relatório agendado com sucesso',
      relatorio: data,
    });
  } catch (error) {
    logger.error('Erro ao agendar relatório:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// PUT - Atualizar agendamento
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { horario, destinatarios, ativo } = req.body;

  try {
    if (!req.supabase) {
      return res.json({ sucesso: true, mock: true });
    }

    const updates = {};
    if (horario !== undefined) updates.horario = horario;
    if (destinatarios !== undefined) updates.destinatarios = destinatarios;
    if (ativo !== undefined) updates.ativo = ativo;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhum campo para atualizar' });
    }

    const { data, error } = await req.supabase
      .from('relatorios_agendados')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      sucesso: true,
      mensagem: 'Relatório atualizado',
      relatorio: data,
    });
  } catch (error) {
    logger.error('Erro ao atualizar relatório:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// DELETE - Remover agendamento
router.delete('/:id', async (req, res) => {
  try {
    if (!req.supabase) {
      return res.json({ sucesso: true, mock: true });
    }

    const { error } = await req.supabase
      .from('relatorios_agendados')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    return res.json({ sucesso: true, mensagem: 'Relatório removido' });
  } catch (error) {
    logger.error('Erro ao remover relatório:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
});

module.exports = router;
