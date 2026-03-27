
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const redis = require('../config/redis');
const logger = require('../config/logger');
const Joi = require('joi');

router.get('/:loja_id', async (req, res) => {
    try {
      const { loja_id } = req.params;

      const result = await pool.query(
        `SELECT
          COUNT(*) as total_produtos,
          SUM(estoque_atual) as total_unidades,
          SUM(estoque_atual * preco_custo) as valor_total_estoque,
          SUM(CASE WHEN estoque_atual < estoque_minimo THEN 1 ELSE 0 END) as produtos_estoque_baixo,
          SUM(CASE WHEN eh_perecivel AND data_vencimento IS NOT NULL THEN 1 ELSE 0 END) as produtos_pereciveis
         FROM produtos
         WHERE loja_id = $1`,
        [loja_id]
      );

      return res.send({
        loja_id,
        resumo_estoque: result.rows[0]
      });

    } catch (err) {
      logger.error('Error fetching inventory summary:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/inventario/:loja_id/produtos - List all products
  router.get('/:loja_id/produtos', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const { categoria, status, limit = 100, offset = 0 } = req.query;

      let query = `
        SELECT
          sku, nome, categoria, subcategoria,
          preco_venda, estoque_atual, estoque_minimo, estoque_maximo,
          eh_perecivel, data_vencimento,
          CASE
            WHEN estoque_atual = 0 THEN 'sem_estoque'
            WHEN estoque_atual < estoque_minimo THEN 'critico'
            WHEN estoque_atual >= estoque_maximo THEN 'excesso'
            ELSE 'normal'
          END as status_estoque,
          CASE
            WHEN eh_perecivel AND data_vencimento IS NOT NULL THEN
              EXTRACT(DAY FROM data_vencimento - NOW())
            ELSE NULL
          END as dias_para_vencer
         FROM produtos
         WHERE loja_id = $1
      `;
      const params = [loja_id];

      if (categoria) {
        query += ` AND categoria = $${params.length + 1}`;
        params.push(categoria);
      }

      if (status) {
        const statusCondition = {
          'sem_estoque': 'estoque_atual = 0',
          'critico': 'estoque_atual < estoque_minimo',
          'excesso': 'estoque_atual >= estoque_maximo',
          'normal': 'estoque_atual BETWEEN estoque_minimo AND estoque_maximo'
        };
        query += ` AND ${statusCondition[status]}`;
      }

      query += ` ORDER BY nome ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return res.send({
        loja_id,
        total: result.rows.length,
        produtos: result.rows
      });

    } catch (err) {
      logger.error('Error fetching products:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // POST /api/v1/inventario/:loja_id/produtos - Create/Update product
  router.post('/:loja_id/produtos', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const { error, value } = produtoSchema.validate({
        ...req.body,
        loja_id
      });

      if (error) {
        return res.code(400).send({
          error: 'validation_error',
          details: error.details
        });
      }

      const {
        sku,
        nome,
        categoria,
        subcategoria,
        preco_custo,
        preco_venda,
        estoque_atual,
        estoque_minimo,
        estoque_maximo,
        eh_perecivel,
        data_vencimento
      } = value;

      // Upsert
      const result = await pool.query(
        `INSERT INTO produtos (
          sku, loja_id, nome, categoria, subcategoria,
          preco_custo, preco_venda, estoque_atual,
          estoque_minimo, estoque_maximo, eh_perecivel, data_vencimento
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (sku, loja_id) DO UPDATE SET
          nome = $3,
          categoria = $4,
          subcategoria = $5,
          preco_custo = $6,
          preco_venda = $7,
          estoque_atual = $8,
          estoque_minimo = $9,
          estoque_maximo = $10,
          eh_perecivel = $11,
          data_vencimento = $12,
          updated_at = NOW()
        RETURNING *`,
        [
          sku, loja_id, nome, categoria, subcategoria,
          preco_custo || null, preco_venda || null, estoque_atual,
          estoque_minimo, estoque_maximo, eh_perecivel, data_vencimento || null
        ]
      );

      // Invalidate cache
      await redis.del(`inventario:${loja_id}`);

      logger.info(`Product ${sku} created/updated in store ${loja_id}`);

      return res.code(201).send(result.rows[0]);

    } catch (err) {
      logger.error('Error creating product:', err);
      return res.code(500).send({
        error: 'internal_server_error',
        message: err.message
      });
    }
  });

  // PUT /api/v1/inventario/:loja_id/movimento - Update inventory
  router.put('/:loja_id/movimento', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const { error, value } = atualizarEstoqueSchema.validate({
        ...req.body,
        loja_id
      });

      if (error) {
        return res.code(400).send({
          error: 'validation_error',
          details: error.details
        });
      }

      const { sku, quantidade, tipo_movimento, motivo } = value;

      // Get current stock
      const produtoResult = await pool.query(
        'SELECT * FROM produtos WHERE loja_id = $1 AND sku = $2',
        [loja_id, sku]
      );

      if (produtoResult.rows.length === 0) {
        return res.code(404).send({ error: 'product_not_found' });
      }

      const produto = produtoResult.rows[0];
      const novo_estoque = produto.estoque_atual + (tipo_movimento === 'saida' ? -quantidade : quantidade);

      if (novo_estoque < 0) {
        return res.code(400).send({
          error: 'insufficient_stock',
          estoque_atual: produto.estoque_atual
        });
      }

      // Update stock
      const updateResult = await pool.query(
        `UPDATE produtos
         SET estoque_atual = $1, updated_at = NOW()
         WHERE loja_id = $2 AND sku = $3
         RETURNING *`,
        [novo_estoque, loja_id, sku]
      );

      // Log movement
      await pool.query(
        `INSERT INTO historico_acoes (
          loja_id, acao, sku, categoria, detalhes_json, resultado
        ) VALUES ($1, $2, $3, $4, $5, 'sucesso')`,
        [
          loja_id,
          `movimento_estoque_${tipo_movimento}`,
          sku,
          produto.categoria,
          JSON.stringify({
            tipo_movimento,
            quantidade,
            motivo,
            estoque_anterior: produto.estoque_atual,
            estoque_novo: novo_estoque
          })
        ]
      );

      // Check if need to create alert
      if (novo_estoque < produto.estoque_minimo) {
        await pool.query(
          `INSERT INTO alertas (
            loja_id, sku, categoria, tipo, urgencia, titulo, mensagem,
            dados_json, status
          ) VALUES ($1, $2, $3, 'falta_estoque', 'alta',
            'Estoque crítico: ' || $4,
            'Produto ' || $4 || ' atingiu estoque mínimo',
            $5, 'aberto')`,
          [
            loja_id,
            sku,
            produto.categoria,
            produto.nome,
            JSON.stringify({
              estoque_atual: novo_estoque,
              estoque_minimo: produto.estoque_minimo,
              deficit: produto.estoque_minimo - novo_estoque
            })
          ]
        );
      }

      // Invalidate cache
      await redis.del(`inventario:${loja_id}`);

      return res.send(updateResult.rows[0]);

    } catch (err) {
      logger.error('Error updating inventory:', err);
      return res.code(500).send({
        error: 'internal_server_error',
        message: err.message
      });
    }
  });

  // GET /api/v1/inventario/:loja_id/vencimentos - Products expiring soon
  router.get('/:loja_id/vencimentos', async (req, res) => {
    try {
      const { loja_id } = req.params;
      const diasRaw = req.query.dias ?? 7;
      const dias = Math.max(1, Math.min(365, parseInt(diasRaw, 10) || 7));

      const result = await pool.query(
        `SELECT
          sku, nome, categoria, data_vencimento, estoque_atual,
          EXTRACT(DAY FROM data_vencimento - NOW()) as dias_para_vencer,
          CASE
            WHEN data_vencimento < NOW() THEN 'EXPIRADO'
            WHEN data_vencimento < NOW() + INTERVAL '1 day' THEN 'CRÍTICO'
            WHEN data_vencimento < NOW() + INTERVAL '3 days' THEN 'ALTO'
            ELSE 'NORMAL'
          END as nivel_risco
         FROM produtos
         WHERE loja_id = $1
         AND eh_perecivel = TRUE
         AND data_vencimento IS NOT NULL
         AND data_vencimento <= NOW() + ($2 * INTERVAL '1 day')
         ORDER BY data_vencimento ASC`,
        [loja_id, dias]
      );

      return res.send({
        loja_id,
        dias_verificacao: dias,
        total_risco: result.rows.length,
        produtos: result.rows
      });

    } catch (err) {
      logger.error('Error fetching expiring products:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/inventario/:loja_id/estoque-baixo - Low stock products
  router.get('/:loja_id/estoque-baixo', async (req, res) => {
    try {
      const { loja_id } = req.params;

      const result = await pool.query(
        `SELECT
          sku, nome, categoria,
          estoque_atual, estoque_minimo, estoque_maximo,
          (estoque_minimo - estoque_atual) as quantidade_para_repor,
          preco_custo,
          (estoque_minimo - estoque_atual) * preco_custo as valor_para_repor
         FROM produtos
         WHERE loja_id = $1
         AND estoque_atual < estoque_minimo
         ORDER BY quantidade_para_repor DESC`,
        [loja_id]
      );

      return res.send({
        loja_id,
        total_produtos_baixo: result.rows.length,
        valor_total_repor: result.rows.reduce((sum, p) => sum + (p.valor_para_repor || 0), 0),
        produtos: result.rows
      });

    } catch (err) {
      logger.error('Error fetching low stock products:', err);
      return res.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

module.exports = router;
