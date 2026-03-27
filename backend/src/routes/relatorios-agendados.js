const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { CronJob } = require('cron');
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Email transporter (configurar variáveis de ambiente)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'seu-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'sua-senha',
  },
});

// ==================== ROTAS ====================

// GET - Listar relatórios agendados
router.get('/', async (req, res) => {
  try {
    const { data } = await pool.query(
      'SELECT * FROM relatorios_agendados ORDER BY created_at DESC LIMIT 50'
    );
    return res.json({
      sucesso: true,
      total: data.length,
      relatorios: data,
    });
  } catch (error) {
    logger.error('Erro ao listar relatórios agendados:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// POST - Agendar novo relatório
router.post('/agendar', async (req, res) => {
  const { loja_id, tipo, horario, dia_semana, dia_mes, destinatarios, ativo } = req.body;

  try {
    if (!loja_id || !tipo || !horario || !destinatarios?.length) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: loja_id, tipo, horario, destinatarios',
      });
    }

    const { data: resultado, error } = await pool.query(
      `INSERT INTO relatorios_agendados 
       (loja_id, tipo, horario, dia_semana, dia_mes, destinatarios, ativo, criado_em) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING *`,
      [loja_id, tipo, horario, dia_semana || null, dia_mes || null, JSON.stringify(destinatarios), ativo !== false]
    );

    if (error) throw error;

    logger.info(`Relatório agendado: ${tipo} para ${loja_id}`);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Relatório agendado com sucesso',
      relatorio: resultado[0],
    });
  } catch (error) {
    logger.error('Erro ao agendar relatório:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// PUT - Atualizar agendamento
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { horario, destinatarios, ativo } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (horario) {
      updates.push(`horario = $${paramCount++}`);
      values.push(horario);
    }
    if (destinatarios) {
      updates.push(`destinatarios = $${paramCount++}`);
      values.push(JSON.stringify(destinatarios));
    }
    if (ativo !== undefined) {
      updates.push(`ativo = $${paramCount++}`);
      values.push(ativo);
    }

    if (!updates.length) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    }

    values.push(id);

    const { data } = await pool.query(
      `UPDATE relatorios_agendados SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return res.json({
      sucesso: true,
      mensagem: 'Relatório atualizado',
      relatorio: data[0],
    });
  } catch (error) {
    logger.error('Erro ao atualizar relatório:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// DELETE - Remover agendamento
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM relatorios_agendados WHERE id = $1', [req.params.id]);
    return res.json({
      sucesso: true,
      mensagem: 'Relatório removido',
    });
  } catch (error) {
    logger.error('Erro ao remover relatório:', error);
    return res.status(500).json({ erro: error.message });
  }
});

// ==================== FUNÇÕES AUXILIARES ====================

async function iniciarSchedulerRelatorios() {
  try {
    const { data: relatorios } = await pool.query(
      'SELECT * FROM relatorios_agendados WHERE ativo = true'
    );

    for (const relatorio of relatorios) {
      agendarRelatorio(relatorio);
    }

    logger.info(`Scheduler iniciado: ${relatorios.length} relatórios agendados`);
  } catch (error) {
    logger.error('Erro ao iniciar scheduler de relatórios:', error);
  }
}

function agendarRelatorio(relatorio) {
  const { id, loja_id, tipo, horario, dia_semana, dia_mes, destinatarios, incluirAnalise } = relatorio;

  let cronExpression;
  const [horas, minutos] = horario.split(':');

  switch (tipo) {
    case 'diario':
      cronExpression = `${minutos} ${horas} * * *`;
      break;
    case 'semanal':
      cronExpression = `${minutos} ${horas} * * ${dia_semana}`;
      break;
    case 'mensal':
      cronExpression = `${minutos} ${horas} ${dia_mes} * *`;
      break;
    default:
      return;
  }

  const job = new CronJob(cronExpression, async () => {
    try {
      const agora = new Date();
      let dataInicio, dataFim;

      switch (tipo) {
        case 'diario':
          dataInicio = new Date(agora);
          dataInicio.setHours(0, 0, 0, 0);
          dataFim = new Date(agora);
          dataFim.setHours(23, 59, 59, 999);
          break;
        case 'semanal':
          dataInicio = new Date(agora);
          dataInicio.setDate(agora.getDate() - agora.getDay());
          dataInicio.setHours(0, 0, 0, 0);
          dataFim = new Date(agora);
          dataFim.setHours(23, 59, 59, 999);
          break;
        case 'mensal':
          dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
          dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
          dataFim.setHours(23, 59, 59, 999);
          break;
      }

      const dados = { tipo, dataInicio, dataFim, loja_id };
      const assunto = `Relatório ${tipo} - Smart Market`;
      const html = `<h2>Relatório ${tipo}</h2><pre>${JSON.stringify(dados, null, 2)}</pre>`;

      for (const email of JSON.parse(destinatarios)) {
        try {
          await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: assunto,
            html: html,
          });
          logger.info(`Email enviado para ${email}`);
        } catch (erro) {
          logger.warn(`Erro ao enviar email para ${email}:`, erro.message);
        }
      }
    } catch (erro) {
      logger.error(`Erro ao executar relatório agendado ${id}:`, erro);
    }
  });

  job.start();
  logger.info(`Job agendado: ${tipo} às ${horario}`);
}

module.exports = router;
