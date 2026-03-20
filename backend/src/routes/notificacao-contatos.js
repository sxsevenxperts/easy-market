const Joi = require('joi');
const db = require('../db');
const twilio = require('twilio');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Schemas
const createContatoSchema = Joi.object({
  loja_id: Joi.string().required(),
  nome: Joi.string().min(3).required(),
  cargo: Joi.string().optional(),
  setores: Joi.array()
    .items(Joi.string())
    .default(['Bebidas', 'Alimentos', 'Higiene', 'Limpeza', 'Perecíveis']), // Todos por padrão
  telefone_whatsapp: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  telefone_sms: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  email: Joi.string().email().optional(),
  receber_alertas_criticos: Joi.boolean().default(true),
  receber_alertas_whatsapp: Joi.boolean().default(false),
  receber_alertas_sms: Joi.boolean().default(false),
  receber_alertas_email: Joi.boolean().default(false),
  receber_relatorios: Joi.boolean().default(false),
});

const updateContatoSchema = Joi.object({
  nome: Joi.string().min(3).optional(),
  cargo: Joi.string().optional(),
  telefone_whatsapp: Joi.string().optional(),
  telefone_sms: Joi.string().optional(),
  email: Joi.string().email().optional(),
  ativo: Joi.boolean().optional(),
  receber_alertas_criticos: Joi.boolean().optional(),
  receber_alertas_whatsapp: Joi.boolean().optional(),
  receber_alertas_sms: Joi.boolean().optional(),
  receber_alertas_email: Joi.boolean().optional(),
  receber_relatorios: Joi.boolean().optional(),
});

module.exports = async function (fastify, opts) {
  // POST /notificacao-contatos - Criar novo contato
  fastify.post('/notificacao-contatos', async (request, reply) => {
    const { error, value } = createContatoSchema.validate(request.body);
    if (error) return reply.status(400).send({ error: error.details[0].message });

    const {
      loja_id,
      nome,
      cargo,
      telefone_whatsapp,
      telefone_sms,
      email,
      receber_alertas_criticos,
      receber_alertas_whatsapp,
      receber_alertas_sms,
      receber_alertas_email,
      receber_relatorios,
    } = value;

    try {
      // Validar Twilio (se WhatsApp/SMS configurados)
      if (telefone_whatsapp) {
        try {
          await twilioClient.lookups.v2.phoneNumbers(telefone_whatsapp).fetch({
            fields: 'line_type_intelligence',
          });
        } catch (err) {
          return reply.status(400).send({ error: 'Número WhatsApp inválido' });
        }
      }

      const result = await db.query(
        `INSERT INTO notificacao_contatos
         (loja_id, nome, cargo, setores, telefone_whatsapp, telefone_sms, email,
          receber_alertas_criticos, receber_alertas_whatsapp, receber_alertas_sms,
          receber_alertas_email, receber_relatorios)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          loja_id,
          nome,
          cargo,
          value.setores,
          telefone_whatsapp,
          telefone_sms,
          email,
          receber_alertas_criticos,
          receber_alertas_whatsapp,
          receber_alertas_sms,
          receber_alertas_email,
          receber_relatorios,
        ]
      );

      reply.status(201).send(result.rows[0]);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao criar contato' });
    }
  });

  // GET /notificacao-contatos/:loja_id - Listar contatos
  fastify.get('/notificacao-contatos/:loja_id', async (request, reply) => {
    const { loja_id } = request.params;
    const { apenas_ativos = true } = request.query;

    try {
      let query = 'SELECT * FROM notificacao_contatos WHERE loja_id = $1';
      const params = [loja_id];

      if (apenas_ativos === 'true' || apenas_ativos === true) {
        query += ' AND ativo = true';
      }

      query += ' ORDER BY cargo DESC, nome ASC';

      const result = await db.query(query, params);
      reply.send(result.rows);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao listar contatos' });
    }
  });

  // GET /notificacao-contatos/:id - Obter contato específico
  fastify.get('/notificacao-contatos/:id/detalhes', async (request, reply) => {
    const { id } = request.params;

    try {
      const result = await db.query(
        'SELECT * FROM notificacao_contatos WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Contato não encontrado' });
      }

      reply.send(result.rows[0]);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao obter contato' });
    }
  });

  // PUT /notificacao-contatos/:id - Atualizar contato
  fastify.put('/notificacao-contatos/:id', async (request, reply) => {
    const { id } = request.params;
    const { error, value } = updateContatoSchema.validate(request.body);

    if (error) return reply.status(400).send({ error: error.details[0].message });

    try {
      const campos = [];
      const valores = [id];
      let paramIndex = 2;

      Object.entries(value).forEach(([key, val]) => {
        campos.push(`${key} = $${paramIndex}`);
        valores.push(val);
        paramIndex++;
      });

      if (campos.length === 0) {
        return reply.status(400).send({ error: 'Nenhum campo para atualizar' });
      }

      campos.push(`updated_at = NOW()`);

      const result = await db.query(
        `UPDATE notificacao_contatos SET ${campos.join(', ')} WHERE id = $1 RETURNING *`,
        valores
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Contato não encontrado' });
      }

      reply.send(result.rows[0]);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao atualizar contato' });
    }
  });

  // DELETE /notificacao-contatos/:id - Deletar contato
  fastify.delete('/notificacao-contatos/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const result = await db.query(
        'DELETE FROM notificacao_contatos WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Contato não encontrado' });
      }

      reply.send({ status: 'contato deletado' });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao deletar contato' });
    }
  });

  // POST /notificacao-contatos/:id/teste - Testar envio
  fastify.post('/notificacao-contatos/:id/teste', async (request, reply) => {
    const { id } = request.params;

    try {
      const contato = await db.query(
        'SELECT * FROM notificacao_contatos WHERE id = $1',
        [id]
      );

      if (contato.rows.length === 0) {
        return reply.status(404).send({ error: 'Contato não encontrado' });
      }

      const contact = contato.rows[0];
      const resultados = {};

      // Testar WhatsApp
      if (contact.telefone_whatsapp) {
        try {
          const messageResult = await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${contact.telefone_whatsapp}`,
            body: `🧪 *Teste Easy Market*\n\nEste é um mensagem de teste do sistema Easy Market. Se você recebeu, está funcionando!`,
          });
          resultados.whatsapp = { status: 'enviado', sid: messageResult.sid };
        } catch (err) {
          resultados.whatsapp = { status: 'erro', erro: err.message };
        }
      }

      // Testar SMS
      if (contact.telefone_sms) {
        try {
          const messageResult = await twilioClient.messages.create({
            from: process.env.TWILIO_SMS_NUMBER,
            to: contact.telefone_sms,
            body: 'Teste Easy Market: Sistema funcionando corretamente!',
          });
          resultados.sms = { status: 'enviado', sid: messageResult.sid };
        } catch (err) {
          resultados.sms = { status: 'erro', erro: err.message };
        }
      }

      reply.send({
        contato: {
          id: contact.id,
          nome: contact.nome,
          cargo: contact.cargo,
        },
        resultados,
      });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao testar envio' });
    }
  });

  // GET /notificacao-contatos/:loja_id/por-canal - Agrupar por canal preferido
  fastify.get('/notificacao-contatos/:loja_id/por-canal', async (request, reply) => {
    const { loja_id } = request.params;

    try {
      const result = await db.query(
        `SELECT
          COUNT(*) FILTER (WHERE receber_alertas_whatsapp = true) as whatsapp_count,
          COUNT(*) FILTER (WHERE receber_alertas_sms = true) as sms_count,
          COUNT(*) FILTER (WHERE receber_alertas_email = true) as email_count,
          COUNT(*) as total
         FROM notificacao_contatos
         WHERE loja_id = $1 AND ativo = true`,
        [loja_id]
      );

      reply.send(result.rows[0]);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao obter estatísticas' });
    }
  });

  // GET /notificacao-contatos/:loja_id/setor/:setor - Contatos de um setor específico
  fastify.get('/notificacao-contatos/:loja_id/setor/:setor', async (request, reply) => {
    const { loja_id, setor } = request.params;

    try {
      const result = await db.query(
        `SELECT * FROM notificacao_contatos
         WHERE loja_id = $1
         AND ativo = true
         AND $2 = ANY(setores)
         ORDER BY cargo DESC, nome ASC`,
        [loja_id, setor]
      );

      reply.send(result.rows);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao obter contatos do setor' });
    }
  });

  // Helper: Obter contatos para notificação (com filtragem de setor)
  fastify.get('/notificacao-contatos/:loja_id/para-notificar', async (request, reply) => {
    const { loja_id } = request.params;
    const { setor, tipo_alerta } = request.query;

    try {
      let query = `
        SELECT * FROM notificacao_contatos
        WHERE loja_id = $1 AND ativo = true
      `;
      const params = [loja_id];

      // Filtrar por setor se fornecido
      if (setor) {
        query += ` AND $${params.length + 1} = ANY(setores)`;
        params.push(setor);
      }

      // Filtrar por preferência de alerta
      if (tipo_alerta === 'critico') {
        query += ` AND receber_alertas_criticos = true`;
      }

      query += ` ORDER BY cargo DESC, nome ASC`;

      const result = await db.query(query, params);
      reply.send(result.rows);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao obter contatos' });
    }
  });
};
