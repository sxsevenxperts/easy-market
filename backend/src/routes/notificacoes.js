const fastify = require('fastify');
const Joi = require('joi');
const twilio = require('twilio');
const db = require('../db');
const redis = require('../redis');

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Schemas
const createNotificationSchema = Joi.object({
  tipo: Joi.string()
    .valid('alerta_critico', 'vencimento', 'falta_estoque', 'desperdicio', 'relatório')
    .required(),
  titulo: Joi.string().required(),
  mensagem: Joi.string().required(),
  loja_id: Joi.string().required(),
  setor: Joi.string().optional(), // Categoria/setor para roteamento inteligente
  canais: Joi.array()
    .items(Joi.string().valid('email', 'whatsapp', 'sms', 'push'))
    .required(),
  dados_adicionais: Joi.object().optional(),
  urgencia: Joi.string()
    .valid('alta', 'media', 'baixa')
    .default('media'),
  agendado_para: Joi.date().optional(),
});

const updateNotificationSettingsSchema = Joi.object({
  loja_id: Joi.string().required(),
  email: Joi.string().email().optional(),
  telefone_whatsapp: Joi.string().optional(),
  telefone_sms: Joi.string().optional(),
  alertas_criticos: Joi.boolean().default(true),
  alertas_email: Joi.boolean().default(false),
  alertas_whatsapp: Joi.boolean().default(false),
  alertas_sms: Joi.boolean().default(false),
  relatorios_diarios: Joi.boolean().default(false),
  relatorios_semanais: Joi.boolean().default(false),
});

// Routes
module.exports = async function (fastify, opts) {
  // POST /notificacoes - Criar notificação
  fastify.post('/notificacoes', async (request, reply) => {
    const { error, value } = createNotificationSchema.validate(request.body);
    if (error) return reply.status(400).send({ error: error.details[0].message });

    const {
      tipo,
      titulo,
      mensagem,
      loja_id,
      setor,
      canais,
      dados_adicionais,
      urgencia,
      agendado_para,
    } = value;

    try {
      // Buscar contatos que devem receber a notificação (por setor se fornecido)
      let contatosQuery = `
        SELECT * FROM notificacao_contatos
        WHERE loja_id = $1 AND ativo = true
      `;
      const contatosParams = [loja_id];

      // Filtrar por setor se fornecido
      if (setor) {
        contatosQuery += ` AND $${contatosParams.length + 1} = ANY(setores)`;
        contatosParams.push(setor);
      }

      // Filtrar por preferência de alerta crítico
      if (urgencia === 'alta') {
        contatosQuery += ` AND receber_alertas_criticos = true`;
      }

      const contatosResult = await db.query(contatosQuery, contatosParams);
      const contatos = contatosResult.rows;

      const notificacaoId = require('crypto').randomUUID();
      const agora = new Date();

      // Inserir notificação no banco
      await db.query(
        `INSERT INTO notificacoes (id, tipo, titulo, mensagem, loja_id, urgencia, status, data_criacao, dados_adicionais)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [notificacaoId, tipo, titulo, mensagem, loja_id, urgencia, 'criada', agora, JSON.stringify({ setor })]
      );

      // Enviar para cada contato com base em suas preferências
      const resultados = {
        total_contatos: contatos.length,
        whatsapp_enviadas: 0,
        sms_enviadas: 0,
        email_enviadas: 0,
        erros: [],
      };

      // Iterar sobre cada contato e enviar para seus canais preferidos
      for (const contato of contatos) {
        // WhatsApp
        if (
          canais.includes('whatsapp') &&
          contato.receber_alertas_whatsapp &&
          contato.telefone_whatsapp
        ) {
          try {
            const messageResult = await twilioClient.messages.create({
              from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
              to: `whatsapp:${contato.telefone_whatsapp}`,
              body: `🚨 *${titulo}*\n\n${mensagem}\n\n📱 Abra o Dashboard para mais detalhes`,
            });
            resultados.whatsapp_enviadas++;

            // Log
            await db.query(
              `INSERT INTO notificacao_logs (notificacao_id, contato_id, canal, status, referencia_externa)
               VALUES ($1, $2, $3, $4, $5)`,
              [notificacaoId, contato.id, 'whatsapp', 'enviado', messageResult.sid]
            );
          } catch (err) {
            resultados.erros.push({
              contato: contato.nome,
              canal: 'whatsapp',
              erro: err.message,
            });
          }
        }

        // SMS
        if (
          canais.includes('sms') &&
          contato.receber_alertas_sms &&
          contato.telefone_sms
        ) {
          try {
            const messageResult = await twilioClient.messages.create({
              from: process.env.TWILIO_SMS_NUMBER,
              to: contato.telefone_sms,
              body: `${titulo}: ${mensagem}. Setor: ${setor || 'Geral'}.`,
            });
            resultados.sms_enviadas++;

            await db.query(
              `INSERT INTO notificacao_logs (notificacao_id, contato_id, canal, status, referencia_externa)
               VALUES ($1, $2, $3, $4, $5)`,
              [notificacaoId, contato.id, 'sms', 'enviado', messageResult.sid]
            );
          } catch (err) {
            resultados.erros.push({
              contato: contato.nome,
              canal: 'sms',
              erro: err.message,
            });
          }
        }

        // Email (quando implementado)
        if (
          canais.includes('email') &&
          contato.receber_alertas_email &&
          contato.email
        ) {
          // TODO: Integrar com SendGrid/AWS SES
          resultados.email_enviadas++;
        }
      }

      // Push notification (será enviado via SSE para o dashboard)
      if (canais.includes('push')) {
        await redis.lpush(
          `push-notifications:${loja_id}`,
          JSON.stringify({
            id: notificacaoId,
            titulo,
            mensagem,
            urgencia,
            tipo,
            setor,
            timestamp: agora,
          })
        );
        await redis.expire(`push-notifications:${loja_id}`, 86400); // 24h TTL
      }

      // Invalidar cache
      await redis.del(`alertas-criticos:${loja_id}`);

      reply.status(201).send({
        notificacao_id: notificacaoId,
        resultados,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao enviar notificação' });
    }
  });

  // GET /notificacoes/:loja_id - Listar notificações
  fastify.get('/notificacoes/:loja_id', async (request, reply) => {
    const { loja_id } = request.params;
    const { limite = 50, offset = 0, tipo, status } = request.query;

    try {
      let query = 'SELECT * FROM notificacoes WHERE loja_id = $1';
      let params = [loja_id];

      if (tipo) {
        query += ` AND tipo = $${params.length + 1}`;
        params.push(tipo);
      }

      if (status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      query += ` ORDER BY data_criacao DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limite, offset);

      const result = await db.query(query, params);

      reply.send({
        notificacoes: result.rows,
        total: result.rows.length,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao listar notificações' });
    }
  });

  // GET /notificacoes/:loja_id/config - Obter configurações
  fastify.get('/notificacoes/:loja_id/config', async (request, reply) => {
    const { loja_id } = request.params;

    try {
      const result = await db.query(
        'SELECT * FROM notificacao_config WHERE loja_id = $1',
        [loja_id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Configuração não encontrada' });
      }

      reply.send(result.rows[0]);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao obter configuração' });
    }
  });

  // PUT /notificacoes/:loja_id/config - Atualizar configurações
  fastify.put('/notificacoes/:loja_id/config', async (request, reply) => {
    const { loja_id } = request.params;
    const { error, value } = updateNotificationSettingsSchema.validate({
      loja_id,
      ...request.body,
    });

    if (error) return reply.status(400).send({ error: error.details[0].message });

    const {
      email,
      telefone_whatsapp,
      telefone_sms,
      alertas_criticos,
      alertas_email,
      alertas_whatsapp,
      alertas_sms,
      relatorios_diarios,
      relatorios_semanais,
    } = value;

    try {
      // Verificar se config existe
      const existsResult = await db.query(
        'SELECT id FROM notificacao_config WHERE loja_id = $1',
        [loja_id]
      );

      if (existsResult.rows.length === 0) {
        // Criar nova
        await db.query(
          `INSERT INTO notificacao_config
           (loja_id, email, telefone_whatsapp, telefone_sms, alertas_criticos,
            alertas_email, alertas_whatsapp, alertas_sms, relatorios_diarios, relatorios_semanais)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            loja_id,
            email,
            telefone_whatsapp,
            telefone_sms,
            alertas_criticos,
            alertas_email,
            alertas_whatsapp,
            alertas_sms,
            relatorios_diarios,
            relatorios_semanais,
          ]
        );
      } else {
        // Atualizar existente
        await db.query(
          `UPDATE notificacao_config SET
           email = $2, telefone_whatsapp = $3, telefone_sms = $4,
           alertas_criticos = $5, alertas_email = $6, alertas_whatsapp = $7,
           alertas_sms = $8, relatorios_diarios = $9, relatorios_semanais = $10
           WHERE loja_id = $1`,
          [
            loja_id,
            email,
            telefone_whatsapp,
            telefone_sms,
            alertas_criticos,
            alertas_email,
            alertas_whatsapp,
            alertas_sms,
            relatorios_diarios,
            relatorios_semanais,
          ]
        );
      }

      reply.send({ status: 'configuração atualizada' });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao atualizar configuração' });
    }
  });

  // POST /notificacoes/whatsapp/qrcode - WhatsApp sem API (QR Code)
  fastify.post('/notificacoes/whatsapp/qrcode', async (request, reply) => {
    const { loja_id } = request.body;

    try {
      // Gerar link para WhatsApp Web
      const codigoQR = `https://web.whatsapp.com/send?phone=${process.env.WHATSAPP_BUSINESS_NUMBER}&text=Olá%20Easy%20Market!`;

      reply.send({
        qrcode_url: codigoQR,
        instrucoes: 'Escanear QR com WhatsApp para conectar',
        alternativa: 'Enviar mensagem manual para +55 (XX) XXXXX-XXXX',
      });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao gerar QR Code' });
    }
  });

  // GET /notificacoes/:loja_id/push - Obter notificações push pendentes (SSE)
  fastify.get('/notificacoes/:loja_id/push', async (request, reply) => {
    const { loja_id } = request.params;

    try {
      // Server-Sent Events para push notifications
      reply.header('Content-Type', 'text/event-stream');
      reply.header('Cache-Control', 'no-cache');
      reply.header('Connection', 'keep-alive');

      // Buscar notificações pendentes
      const notificacoes = await redis.lrange(`push-notifications:${loja_id}`, 0, -1);

      if (notificacoes.length > 0) {
        notificacoes.forEach((notif) => {
          reply.raw.write(`data: ${notif}\n\n`);
        });

        // Limpar depois de enviar
        await redis.del(`push-notifications:${loja_id}`);
      }

      // Keep connection open para futuras notificações (SSE)
      const interval = setInterval(async () => {
        const newNotif = await redis.rpop(`push-notifications:${loja_id}`);
        if (newNotif) {
          reply.raw.write(`data: ${newNotif}\n\n`);
        }
      }, 1000);

      request.raw.on('close', () => {
        clearInterval(interval);
        reply.raw.end();
      });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao conectar SSE' });
    }
  });

  // PUT /notificacoes/:id/marcar-lida - Marcar como lida
  fastify.put('/notificacoes/:id/marcar-lida', async (request, reply) => {
    const { id } = request.params;

    try {
      await db.query(
        'UPDATE notificacoes SET status = $1, data_leitura = NOW() WHERE id = $2',
        ['lida', id]
      );

      reply.send({ status: 'marcada como lida' });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao marcar como lida' });
    }
  });

  // DELETE /notificacoes/:id - Deletar notificação
  fastify.delete('/notificacoes/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      await db.query('DELETE FROM notificacoes WHERE id = $1', [id]);
      reply.send({ status: 'notificação deletada' });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao deletar notificação' });
    }
  });
};
