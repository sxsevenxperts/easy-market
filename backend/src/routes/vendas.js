
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const redis = require('../config/redis');
const logger = require('../config/logger');
const Joi = require('joi');

router.post('/', async (req, res) => {
    try {
      // Validate
      const { error, value } = vendaSchema.validate(req.body);
      if (error) {
        return res.code(400).send({
          error: 'validation_error',
          details: error.details
        });
      }

      const {
        loja_id,
        sku,
        categoria,
        quantidade,
        preco_unitario,
        timestamp,
        desconto_percentual
      } = value;

      // Verify loja exists
      const lojaResult = await pool.query('SELECT * FROM lojas WHERE loja_id = $1', [loja_id]);
      if (lojaResult.rows.length === 0) {
        return res.code(404).send({ error: 'loja_not_found' });
      }

      // Get climate data from cache (usually cached by weather job)
      const climaKey = `clima:${loja_id}:${new Date(timestamp).toISOString().split('T')[0]}`;
      const climaData = await redis.get(climaKey);
      const clima = climaData ? JSON.parse(climaData) : {};

      // Check if it's holiday
      const dataStr = new Date(timestamp).toISOString().split('T')[0];
      const eventoResult = await pool.query(
        `SELECT * FROM calendario_eventos 
         WHERE municipio = $1 
         AND data_inicio <= $2 
         AND (data_fim IS NULL OR data_fim >= $2)`,
        [lojaResult.rows[0].municipio, dataStr]
      );

      const evento = eventoResult.rows[0] || {};

      // Insert sale
      const insertResult = await pool.query(
        `INSERT INTO vendas (
          time, loja_id, sku, categoria, quantidade, preco_unitario,
          temperatura, umidade_relativa, precipitacao, condicao_clima,
          is_feriado, tipo_feriado, evento_local
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          timestamp,
          loja_id,
          sku,
          categoria,
          quantidade,
          preco_unitario,
          clima.temperatura || null,
          clima.umidade || null,
          clima.precipitacao || null,
          clima.condicao || null,
          evento.is_feriado || false,
          evento.tipo_feriado || null,
          evento.nome || null
        ]
      );

      // Invalidate forecast cache for this category
      await redis.del(`forecast:${loja_id}:${categoria}:24h`);

      logger.info(`Sale recorded: ${loja_id}/${sku} - ${quantidade} units`);

      return res.code(201).send({
        event_id: `evt_${Date.now()}`,
        status: 'enqueued',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('Error recording sale:', err);
      return res.code(500).send({
        error: 'internal_server_error',
        message: err.message
      });
    }
  });

  // GET /api/v1/vendas/:loja_id - Get sales history
  router.get('/:loja_id', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const {
        categoria,
        data_inicio,
        data_fim,
        limit = 100,
        offset = 0
      } = req.query;

      let query = `
        SELECT 
          time, sku, categoria, quantidade, preco_unitario,
          temperatura, umidade_relativa, precipitacao,
          is_feriado, evento_local
        FROM vendas
        WHERE loja_id = $1
      `;
      const params = [loja_id];

      if (categoria) {
        query += ` AND categoria = $${params.length + 1}`;
        params.push(categoria);
      }

      if (data_inicio) {
        query += ` AND time >= $${params.length + 1}`;
        params.push(new Date(data_inicio));
      }

      if (data_fim) {
        query += ` AND time <= $${params.length + 1}`;
        params.push(new Date(data_fim));
      }

      query += ` ORDER BY time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return res.send({
        loja_id,
        total: result.rows.length,
        dados: result.rows
      });

    } catch (err) {
      logger.error('Error fetching sales:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/vendas/:loja_id/summary - Sales summary
  router.get('/:loja_id/summary', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const diasRaw = req.query.dias ?? 7;
      const dias = Math.max(1, Math.min(365, parseInt(diasRaw, 10) || 7));

      const result = await pool.query(
        `SELECT
          categoria,
          SUM(quantidade) as total_quantidade,
          SUM(preco_unitario * quantidade * (1 - desconto_percentual/100)) as faturamento,
          AVG(quantidade) as media_quantidade,
          COUNT(*) as transacoes,
          DATE_TRUNC('day', time) as data
        FROM vendas
        WHERE loja_id = $1
        AND time >= NOW() - ($2 * INTERVAL '1 day')
        GROUP BY categoria, DATE_TRUNC('day', time)
        ORDER BY data DESC`,
        [loja_id, dias]
      );

      return res.send({
        loja_id,
        periodo_dias: dias,
        resumo: result.rows
      });

    } catch (err) {
      logger.error('Error fetching sales summary:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

module.exports = router;
