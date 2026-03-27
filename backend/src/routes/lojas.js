
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

router.post('/', async (req, res) => {
    try {
      const { error, value } = lojaSchema.validate(req.body);
      if (error) {
        return res.code(400).send({
          error: 'validation_error',
          details: error.details
        });
      }

      const lojaId = `loja-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const apiKey = uuidv4();

      const result = await pool.query(
        `INSERT INTO lojas (
          loja_id, nome, municipio, estado, latitude, longitude, fuso_horario, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ativo')
        RETURNING *`,
        [lojaId, value.nome, value.municipio, value.estado, value.latitude, value.longitude, value.fuso_horario]
      );

      // Create default configuration
      await pool.query(
        `INSERT INTO configuracoes_loja (loja_id, api_key)
        VALUES ($1, $2)`,
        [lojaId, apiKey]
      );

      logger.info(`New store created: ${lojaId}`);

      return res.code(201).send({
        loja_id: lojaId,
        status: 'criada',
        api_key: apiKey,
        created_at: new Date().toISOString()
      });

    } catch (err) {
      logger.error('Error creating store:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/lojas/:loja_id - Get store details
  router.get('/:loja_id', async (req, res) => {
    try {
      const { loja_id } = req.params;

      const result = await pool.query(
        'SELECT * FROM lojas WHERE loja_id = $1',
        [loja_id]
      );

      if (result.rows.length === 0) {
        return res.code(404).send({ error: 'loja_not_found' });
      }

      const loja = result.rows[0];

      // Get configuration
      const configResult = await pool.query(
        'SELECT * FROM configuracoes_loja WHERE loja_id = $1',
        [loja_id]
      );

      return res.send({
        ...loja,
        configuracao: configResult.rows[0] || {}
      });

    } catch (err) {
      logger.error('Error fetching store:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // PUT /api/v1/lojas/:loja_id - Update store
  router.put('/:loja_id', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const updates = req.body;

      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.nome) {
        fields.push(`nome = $${paramCount++}`);
        values.push(updates.nome);
      }
      if (updates.latitude) {
        fields.push(`latitude = $${paramCount++}`);
        values.push(updates.latitude);
      }
      if (updates.longitude) {
        fields.push(`longitude = $${paramCount++}`);
        values.push(updates.longitude);
      }
      if (updates.fuso_horario) {
        fields.push(`fuso_horario = $${paramCount++}`);
        values.push(updates.fuso_horario);
      }

      if (fields.length === 0) {
        return res.code(400).send({
          error: 'no_updates'
        });
      }

      fields.push(`updated_at = NOW()`);
      values.push(loja_id);

      const result = await pool.query(
        `UPDATE lojas SET ${fields.join(', ')} WHERE loja_id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.code(404).send({ error: 'loja_not_found' });
      }

      logger.info(`Store updated: ${loja_id}`);

      return res.send(result.rows[0]);

    } catch (err) {
      logger.error('Error updating store:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/lojas - List all stores
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM lojas ORDER BY created_at DESC LIMIT 100'
      );

      return res.send({
        total: result.rows.length,
        lojas: result.rows
      });

    } catch (err) {
      logger.error('Error listing stores:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

module.exports = router;
