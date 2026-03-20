const { pool } = require('../config/database');
const redis = require('../config/redis');
const logger = require('../config/logger');
const Joi = require('joi');

// Validation schema
const alertaSchema = Joi.object({
  loja_id: Joi.string().required(),
  sku: Joi.string(),
  categoria: Joi.string(),
  tipo: Joi.string().valid('desperdicio', 'falta_estoque', 'preco_anormal', 'vencimento_proximo').required(),
  urgencia: Joi.string().valid('alta', 'média', 'baixa').default('média'),
  titulo: Joi.string().required(),
  mensagem: Joi.string(),
  dados_json: Joi.object().default({})
});

async function routes(fastify, options) {

  // POST /api/v1/alertas - Create alert
  fastify.post('/', async (request, reply) => {
    try {
      const { error, value } = alertaSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          error: 'validation_error',
          details: error.details
        });
      }

      const {
        loja_id,
        sku,
        categoria,
        tipo,
        urgencia,
        titulo,
        mensagem,
        dados_json
      } = value;

      // Verify loja exists
      const lojaResult = await pool.query('SELECT * FROM lojas WHERE loja_id = $1', [loja_id]);
      if (lojaResult.rows.length === 0) {
        return reply.code(404).send({ error: 'loja_not_found' });
      }

      // Calculate ROI estimate based on alert type
      let roiEstimado = 0;
      if (tipo === 'desperdicio') {
        roiEstimado = dados_json.quantidade_comprometida * dados_json.preco_unitario || 0;
      } else if (tipo === 'falta_estoque') {
        roiEstimado = dados_json.dias_sem_estoque * dados_json.faturamento_diario || 0;
      }

      const insertResult = await pool.query(
        `INSERT INTO alertas (
          loja_id, sku, categoria, tipo, urgencia, titulo, mensagem,
          dados_json, roi_estimado, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'aberto')
        RETURNING *`,
        [
          loja_id,
          sku || null,
          categoria || null,
          tipo,
          urgencia,
          titulo,
          mensagem || null,
          JSON.stringify(dados_json),
          roiEstimado
        ]
      );

      // Invalidate cache
      await redis.del(`alertas:${loja_id}`);

      logger.info(`Alert created: ${tipo} for ${loja_id}`);

      return reply.code(201).send(insertResult.rows[0]);

    } catch (err) {
      logger.error('Error creating alert:', err);
      return reply.code(500).send({
        error: 'internal_server_error',
        message: err.message
      });
    }
  });

  // GET /api/v1/alertas/:loja_id - Get alerts for store
  fastify.get('/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { status = 'aberto', tipo, limit = 50, offset = 0 } = request.query;

      // Try cache first
      const cacheKey = `alertas:${loja_id}:${status}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return reply.send(JSON.parse(cached));
      }

      let query = `
        SELECT *
        FROM alertas
        WHERE loja_id = $1
      `;
      const params = [loja_id];

      if (status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      if (tipo) {
        query += ` AND tipo = $${params.length + 1}`;
        params.push(tipo);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      const response = {
        loja_id,
        total: result.rows.length,
        alertas: result.rows
      };

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(response));

      return reply.send(response);

    } catch (err) {
      logger.error('Error fetching alerts:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/alertas/:loja_id/criticos - Critical alerts
  fastify.get('/:loja_id/criticos', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      const result = await pool.query(
        `SELECT *
         FROM alertas
         WHERE loja_id = $1
         AND urgencia IN ('alta', 'média')
         AND status IN ('aberto', 'em_acao')
         ORDER BY urgencia = 'alta' DESC, created_at DESC
         LIMIT 10`,
        [loja_id]
      );

      return reply.send({
        loja_id,
        criticos: result.rows
      });

    } catch (err) {
      logger.error('Error fetching critical alerts:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // PUT /api/v1/alertas/:id - Update alert status
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { status, resolucao_sugerida } = request.body;

      if (!['aberto', 'em_acao', 'resolvido'].includes(status)) {
        return reply.code(400).send({
          error: 'invalid_status'
        });
      }

      const result = await pool.query(
        `UPDATE alertas
         SET status = $1, resolucao_sugerida = $2, resolved_at = CASE
           WHEN $1 = 'resolvido' THEN NOW()
           ELSE resolved_at
         END
         WHERE id = $3
         RETURNING *`,
        [status, resolucao_sugerida || null, id]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'alert_not_found' });
      }

      // Invalidate cache
      const alert = result.rows[0];
      await redis.del(`alertas:${alert.loja_id}`);

      logger.info(`Alert ${id} updated to status: ${status}`);

      return reply.send(result.rows[0]);

    } catch (err) {
      logger.error('Error updating alert:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/alertas/:loja_id/resumo - Alert summary dashboard
  fastify.get('/:loja_id/resumo', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      const result = await pool.query(
        `SELECT
          tipo,
          status,
          COUNT(*) as total,
          SUM(roi_estimado) as roi_total
         FROM alertas
         WHERE loja_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY tipo, status`,
        [loja_id]
      );

      return reply.send({
        loja_id,
        resumo: result.rows
      });

    } catch (err) {
      logger.error('Error fetching alert summary:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

}

module.exports = routes;
