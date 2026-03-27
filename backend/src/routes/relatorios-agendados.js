
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');
const redis = require('../redis');
const { CronJob } = require('cron');
const nodemailer = require('nodemailer');

router.post('/relatorios-agendados', async (req, res) => {
    const { error, value } = agendarRelatórioSchema.validate(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    const {
      loja_id,
      tipo,
      hora,
      dia_semana,
      dia_mes,
      destinatarios,
      incluir_analise_impacto,
    } = value;

    try {
      const relatorioId = require('crypto').randomUUID();

      await db.query(
        `INSERT INTO relatorios_agendados
         (id, loja_id, tipo, hora, dia_semana, dia_mes, destinatarios, incluir_analise_impacto, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [relatorioId, loja_id, tipo, hora, dia_semana, dia_mes, JSON.stringify(destinatarios), incluir_analise_impacto, true]
      );

      // Agendar o cron job
      agendarCronJob(relatorioId, loja_id, tipo, hora, dia_semana, dia_mes, destinatarios, incluir_analise_impacto);

      res.status(201).send({
        relatorio_id: relatorioId,
        status: 'agendado',
        proximamente: `Próximo envio: ${obterProximaDataEnvio(tipo, hora, dia_semana, dia_mes)}`,
      });
    } catch (err) {
      router.log.error(err);
      res.status(500).send({ error: 'Erro ao agendar relatório' });
    }
  });

  // GET /relatorios-agendados/:loja_id - Listar agendamentos
  router.get('/relatorios-agendados/:loja_id', async (req, res) => {
    const { loja_id } = req.params;

    try {
      const result = await db.query(
        'SELECT * FROM relatorios_agendados WHERE loja_id = $1 AND ativo = true ORDER BY tipo ASC',
        [loja_id]
      );

      const relatorios = result.rows.map((r) => ({
        ...r,
        destinatarios: typeof r.destinatarios === 'string' ? JSON.parse(r.destinatarios) : r.destinatarios,
      }));

      res.send(relatorios);
    } catch (err) {
      router.log.error(err);
      res.status(500).send({ error: 'Erro ao listar agendamentos' });
    }
  });

  // DELETE /relatorios-agendados/:id - Desativar agendamento
  router.delete('/relatorios-agendados/:id', async (req, res) => {
    const { id } = req.params;

    try {
      await db.query(
        'UPDATE relatorios_agendados SET ativo = false WHERE id = $1',
        [id]
      );

      // Parar o job
      await cancelarJob(id);

      res.send({ status: 'agendamento cancelado' });
    } catch (err) {
      router.log.error(err);
      res.status(500).send({ error: 'Erro ao cancelar agendamento' });
    }
  });

  // Ao inicializar, recarregar agendamentos ativos
  router.addHook('onReady', async () => {
    try {
      const result = await db.query(
        'SELECT id, loja_id, tipo, hora, dia_semana, dia_mes, destinatarios, incluir_analise_impacto FROM relatorios_agendados WHERE ativo = true'
      );

      for (const relatorio of result.rows) {
        const destinatarios = typeof relatorio.destinatarios === 'string'
          ? JSON.parse(relatorio.destinatarios)
          : relatorio.destinatarios;

        agendarCronJob(
          relatorio.id,
          relatorio.loja_id,
          relatorio.tipo,
          relatorio.hora,
          relatorio.dia_semana,
          relatorio.dia_mes,
          destinatarios,
          relatorio.incluir_analise_impacto
        );
      }

      router.log.info(`${result.rows.length} relatórios agendados foram carregados`);
    } catch (err) {
      router.log.error('Erro ao carregar relatórios agendados:', err);
    }
  });

  // POST /relatorios-agendados/enviar-agora - Testar envio
  router.post('/relatorios-agendados/:id/enviar-agora', async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        'SELECT * FROM relatorios_agendados WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).send({ error: 'Agendamento não encontrado' });
      }

      const agendamento = result.rows[0];
      const dados = await gerarRelatorio(
        agendamento.loja_id,
        agendamento.tipo,
        agendamento.incluir_analise_impacto
      );

      // TODO: Enviar por email
      res.send({
        status: 'relatório gerado',
        preview: dados,
      });
    } catch (err) {
      router.log.error(err);
      res.status(500).send({ error: 'Erro ao enviar relatório' });
    }
  });

  // GET /relatorios-agendados/:loja_id/proximos - Próximos envios
  router.get('/relatorios-agendados/:loja_id/proximos', async (req, res) => {
    const { loja_id } = req.params;

    try {
      const result = await db.query(
        'SELECT * FROM relatorios_agendados WHERE loja_id = $1 AND ativo = true',
        [loja_id]
      );

      const proximos = result.rows.map((r) => ({
        tipo: r.tipo,
        proxima_data: obterProximaDataEnvio(r.tipo, r.hora, r.dia_semana, r.dia_mes),
        hora: r.hora,
      }));

      res.send(proximos);
    } catch (err) {
      router.log.error(err);
      res.status(500).send({ error: 'Erro ao obter próximos envios' });
    }
  });
};

// ==================== FUNÇÕES AUXILIARES ====================

function obterProximaDataEnvio(tipo, hora, dia_semana, dia_mes) {
  const agora = new Date();
  const [hours, minutes] = hora.split(':').map(Number);

  let proxima = new Date(agora);
  proxima.setHours(hours, minutes, 0, 0);

  switch (tipo) {
    case 'diario':
      if (proxima <= agora) {
        proxima.setDate(proxima.getDate() + 1);
      }
      break;

    case 'semanal':
      while (proxima.getDay() !== dia_semana || proxima <= agora) {
        proxima.setDate(proxima.getDate() + 1);
      }
      break;

    case 'mensal':
      if (proxima.getDate() < dia_mes || proxima <= agora) {
        proxima.setMonth(proxima.getMonth() + 1);
        proxima.setDate(dia_mes);
      } else if (proxima.getDate() > dia_mes) {
        proxima.setMonth(proxima.getMonth() + 1);
        proxima.setDate(dia_mes);
      }
      break;
  }

  return proxima.toLocaleString('pt-BR');
}

function agendarCronJob(relatorioId, loja_id, tipo, hora, dia_semana, dia_mes, destinatarios, incluirAnalise) {
  let cronExpression;

  // Converter hora HH:MM para minuto e hora do cron
  const [hours, minutes] = hora.split(':').map(Number);

  switch (tipo) {
    case 'diario':
      cronExpression = `${minutes} ${hours} * * *`; // Todos os dias
      break;
    case 'semanal':
      cronExpression = `${minutes} ${hours} * * ${dia_semana}`; // Dia específico da semana
      break;
    case 'mensal':
      cronExpression = `${minutes} ${hours} ${dia_mes} * *`; // Dia específico do mês
      break;
    default:
      return;
  }

  // Criar e iniciar job
  const job = new CronJob(
    cronExpression,
    async () => {
      try {
        const agora = new Date();
        let dataInicio, dataFim;

        // Determinar período
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

        // Gerar relatório
        const dados = await gerarRelatorio(loja_id, tipo, incluirAnalise);

        // Enviar por email
        const assunto = `Relatório ${tipo} - Easy Market`;
        const html = gerarHTMLRelatorio(dados, tipo);

        for (const email of destinatarios) {
          try {
            await emailTransporter.sendMail({
              from: process.env.EMAIL_USER,
              to: email,
              subject: assunto,
              html: html,
            });

module.exports = router;
