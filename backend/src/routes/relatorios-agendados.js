const Joi = require('joi');
const db = require('../db');
const redis = require('../redis');
const { CronJob } = require('cron');
const nodemailer = require('nodemailer');

// Configurar transportador de email (usar variáveis de ambiente)
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Map para manter jobs na memória
const agendosAtivos = {};

// Schemas
const agendarRelatórioSchema = Joi.object({
  loja_id: Joi.string().required(),
  tipo: Joi.string()
    .valid('diario', 'semanal', 'mensal')
    .required(),
  hora: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required(),
  dia_semana: Joi.number().min(0).max(6).optional(), // 0=domingo, 6=sábado
  dia_mes: Joi.number().min(1).max(31).optional(),
  destinatarios: Joi.array()
    .items(Joi.string().email())
    .required(),
  incluir_analise_impacto: Joi.boolean().default(true),
});

module.exports = async function (fastify, opts) {
  // POST /relatorios-agendados - Agendar novo relatório
  fastify.post('/relatorios-agendados', async (request, reply) => {
    const { error, value } = agendarRelatórioSchema.validate(request.body);
    if (error) return reply.status(400).send({ error: error.details[0].message });

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

      reply.status(201).send({
        relatorio_id: relatorioId,
        status: 'agendado',
        proximamente: `Próximo envio: ${obterProximaDataEnvio(tipo, hora, dia_semana, dia_mes)}`,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao agendar relatório' });
    }
  });

  // GET /relatorios-agendados/:loja_id - Listar agendamentos
  fastify.get('/relatorios-agendados/:loja_id', async (request, reply) => {
    const { loja_id } = request.params;

    try {
      const result = await db.query(
        'SELECT * FROM relatorios_agendados WHERE loja_id = $1 AND ativo = true ORDER BY tipo ASC',
        [loja_id]
      );

      const relatorios = result.rows.map((r) => ({
        ...r,
        destinatarios: typeof r.destinatarios === 'string' ? JSON.parse(r.destinatarios) : r.destinatarios,
      }));

      reply.send(relatorios);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao listar agendamentos' });
    }
  });

  // DELETE /relatorios-agendados/:id - Desativar agendamento
  fastify.delete('/relatorios-agendados/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      await db.query(
        'UPDATE relatorios_agendados SET ativo = false WHERE id = $1',
        [id]
      );

      // Parar o job
      await cancelarJob(id);

      reply.send({ status: 'agendamento cancelado' });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao cancelar agendamento' });
    }
  });

  // Ao inicializar, recarregar agendamentos ativos
  fastify.addHook('onReady', async () => {
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

      fastify.log.info(`${result.rows.length} relatórios agendados foram carregados`);
    } catch (err) {
      fastify.log.error('Erro ao carregar relatórios agendados:', err);
    }
  });

  // POST /relatorios-agendados/enviar-agora - Testar envio
  fastify.post('/relatorios-agendados/:id/enviar-agora', async (request, reply) => {
    const { id } = request.params;

    try {
      const result = await db.query(
        'SELECT * FROM relatorios_agendados WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Agendamento não encontrado' });
      }

      const agendamento = result.rows[0];
      const dados = await gerarRelatorio(
        agendamento.loja_id,
        agendamento.tipo,
        agendamento.incluir_analise_impacto
      );

      // TODO: Enviar por email
      reply.send({
        status: 'relatório gerado',
        preview: dados,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao enviar relatório' });
    }
  });

  // GET /relatorios-agendados/:loja_id/proximos - Próximos envios
  fastify.get('/relatorios-agendados/:loja_id/proximos', async (request, reply) => {
    const { loja_id } = request.params;

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

      reply.send(proximos);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao obter próximos envios' });
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
          } catch (err) {
            console.error(`Erro ao enviar email para ${email}:`, err.message);
          }
        }

        // Log do envio
        await db.query(
          `INSERT INTO relatorios_logs (relatorio_agendado_id, data_envio, status)
           VALUES ($1, $2, $3)`,
          [relatorioId, agora, 'enviado']
        );
      } catch (err) {
        console.error(`Erro ao executar relatório agendado ${relatorioId}:`, err.message);
      }
    },
    null,
    true // Iniciar imediatamente
  );

  agendosAtivos[relatorioId] = job;
}

function gerarHTMLRelatorio(dados, tipo) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Relatório ${tipo} - Easy Market</h2>

        <h3>📊 Vendas</h3>
        <p>
          <strong>Faturamento Total:</strong> R$ ${dados.vendas.total_faturamento.toLocaleString('pt-BR')}<br>
          <strong>Quantidade Vendida:</strong> ${dados.vendas.total_quantidade} unidades<br>
          <strong>Total de Transações:</strong> ${dados.vendas.total_transacoes}<br>
          <strong>Ticket Médio:</strong> R$ ${dados.vendas.ticket_medio.toLocaleString('pt-BR')}
        </p>

        <h3>📦 Estoque</h3>
        <p>
          <strong>Total de Produtos:</strong> ${dados.estoque.total_produtos}<br>
          <strong>Produtos em Estoque Crítico:</strong> ${dados.estoque.produtos_criticos}<br>
          <strong>Saúde do Estoque:</strong> ${dados.estoque.saude}
        </p>

        <h3>⚠️ Alertas</h3>
        <p>
          <strong>Total de Alertas:</strong> ${dados.alertas.total_alertas}<br>
          <strong>Alertas Resolvidos:</strong> ${dados.alertas.alertas_resolvidos}<br>
          <strong>ROI Total Estimado:</strong> R$ ${dados.alertas.roi_total.toLocaleString('pt-BR')}
        </p>

        ${dados.analise_impacto ? `
          <h3>📈 Análise de Impacto</h3>
          <p>
            <strong>Crescimento:</strong> ${dados.analise_impacto.crescimento_percentual}<br>
            <strong>Aumento de Receita:</strong> ${dados.analise_impacto.aumento_receita}<br>
            <strong>Redução de Perdas:</strong> ${dados.analise_impacto.reducao_perdas}<br>
            <strong>Economia Estimada:</strong> ${dados.analise_impacto.economia_estimada}
          </p>
        ` : ''}

        <hr>
        <p style="color: #999; font-size: 12px;">
          Este é um relatório automático do Easy Market.
          Gerado em ${new Date().toLocaleString('pt-BR')}
        </p>
      </body>
    </html>
  `;
}

async function cancelarJob(relatorioId) {
  if (agendosAtivos[relatorioId]) {
    agendosAtivos[relatorioId].stop();
    delete agendosAtivos[relatorioId];
  }
}

async function gerarRelatorio(loja_id, tipo, incluirAnalise) {
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

  // Buscar dados de vendas no período
  const vendas = await db.query(
    `SELECT
      SUM(faturamento) as total_faturamento,
      SUM(quantidade) as total_quantidade,
      COUNT(*) as total_transacoes,
      AVG(faturamento) as ticket_medio
     FROM vendas
     WHERE loja_id = $1
     AND data_venda BETWEEN $2 AND $3`,
    [loja_id, dataInicio, dataFim]
  );

  const dadosVendas = vendas.rows[0];

  // Buscar dados de estoque
  const estoque = await db.query(
    `SELECT
      COUNT(*) as total_produtos,
      SUM(CASE WHEN status_estoque = 'critico' THEN 1 ELSE 0 END) as produtos_criticos
     FROM inventario
     WHERE loja_id = $1`,
    [loja_id]
  );

  const dadosEstoque = estoque.rows[0];

  // Buscar alertas
  const alertas = await db.query(
    `SELECT
      COUNT(*) as total_alertas,
      SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as alertas_resolvidos,
      SUM(valor_roi_estimado) as roi_total
     FROM alertas
     WHERE loja_id = $1
     AND data_criacao BETWEEN $2 AND $3`,
    [loja_id, dataInicio, dataFim]
  );

  const dadosAlertas = alertas.rows[0];

  const relatorio = {
    periodo: tipo,
    data_inicio: dataInicio.toLocaleDateString('pt-BR'),
    data_fim: dataFim.toLocaleDateString('pt-BR'),

    vendas: {
      total_faturamento: Math.round(dadosVendas.total_faturamento || 0),
      total_quantidade: Math.round(dadosVendas.total_quantidade || 0),
      total_transacoes: dadosVendas.total_transacoes || 0,
      ticket_medio: Math.round(dadosVendas.ticket_medio || 0),
    },

    estoque: {
      total_produtos: dadosEstoque.total_produtos || 0,
      produtos_criticos: dadosEstoque.produtos_criticos || 0,
      saude: `${Math.round(((dadosEstoque.total_produtos - dadosEstoque.produtos_criticos) / dadosEstoque.total_produtos) * 100)}% saudável`,
    },

    alertas: {
      total_alertas: dadosAlertas.total_alertas || 0,
      alertas_resolvidos: dadosAlertas.alertas_resolvidos || 0,
      roi_total: Math.round(dadosAlertas.roi_total || 0),
    },
  };

  // Se solicitado, incluir análise de impacto
  if (incluirAnalise) {
    relatorio.analise_impacto = await gerarAnaliseImpacto(loja_id, dataInicio, dataFim);
  }

  return relatorio;
}

async function gerarAnaliseImpacto(loja_id, dataInicio, dataFim) {
  const dataInicioAnterior = new Date(dataInicio);
  dataInicioAnterior.setDate(dataInicioAnterior.getDate() - 30);
  const dataFimAnterior = new Date(dataFim);
  dataFimAnterior.setDate(dataFimAnterior.getDate() - 30);

  // Dados do período atual
  const vendaAtual = await db.query(
    `SELECT
      SUM(faturamento) as faturamento_atual,
      SUM(quantidade) as quantidade_atual,
      COUNT(*) as transacoes_atual
     FROM vendas
     WHERE loja_id = $1
     AND data_venda BETWEEN $2 AND $3`,
    [loja_id, dataInicio, dataFim]
  );

  // Dados do período anterior
  const vendaAnterior = await db.query(
    `SELECT
      SUM(faturamento) as faturamento_anterior,
      SUM(quantidade) as quantidade_anterior,
      COUNT(*) as transacoes_anterior
     FROM vendas
     WHERE loja_id = $1
     AND data_venda BETWEEN $2 AND $3`,
    [loja_id, dataInicioAnterior, dataFimAnterior]
  );

  // Análise de perdas (produtos vencidos/descartados)
  const perdas = await db.query(
    `SELECT
      SUM(quantidade * preco_unitario) as total_perdas
     FROM inventario
     WHERE loja_id = $1
     AND status_estoque = 'critico'
     AND data_atualizacao BETWEEN $2 AND $3`,
    [loja_id, dataInicio, dataFim]
  );

  const perdaAtual = perdas.rows[0]?.total_perdas || 0;

  // Análise de alertas resolvidos (redução de problemas)
  const alertasResolvidos = await db.query(
    `SELECT SUM(valor_roi_estimado) as economia_alertas
     FROM alertas
     WHERE loja_id = $1
     AND status = 'resolvido'
     AND data_criacao BETWEEN $2 AND $3`,
    [loja_id, dataInicio, dataFim]
  );

  const faturamentoAtual = vendaAtual.rows[0]?.faturamento_atual || 0;
  const faturamentoAnterior = vendaAnterior.rows[0]?.faturamento_anterior || 0;
  const quantidadeAtual = vendaAtual.rows[0]?.quantidade_atual || 0;
  const quantidadeAnterior = vendaAnterior.rows[0]?.quantidade_anterior || 0;
  const economiaAlertas = alertasResolvidos.rows[0]?.economia_alertas || 0;

  const crescimento = faturamentoAnterior > 0
    ? Math.round(((faturamentoAtual - faturamentoAnterior) / faturamentoAnterior) * 100)
    : 0;

  // Cálculos de impacto
  const aumentoReceita = Math.round(faturamentoAtual - faturamentoAnterior);
  const reducaoPerdas = Math.round(perdaAtual * 0.15); // Estimado 15% de redução por gestão melhor
  const economiaTotal = Math.round(reducaoPerdas + economiaAlertas);

  return {
    faturamento_anterior: Math.round(faturamentoAnterior),
    faturamento_atual: Math.round(faturamentoAtual),
    crescimento_percentual: `${crescimento > 0 ? '+' : ''}${crescimento}%`,
    crescimento_absoluto: aumentoReceita,
    economia_estimada: `R$ ${economiaTotal.toLocaleString('pt-BR')}`,
    reducao_perdas: `R$ ${reducaoPerdas.toLocaleString('pt-BR')}`,
    aumento_receita: `R$ ${aumentoReceita.toLocaleString('pt-BR')}`,
    quantidade_vendida: quantidadeAtual,
    ticket_medio: faturamentoAtual > 0 ? Math.round(faturamentoAtual / (vendaAtual.rows[0]?.transacoes_atual || 1)) : 0,
  };
}
