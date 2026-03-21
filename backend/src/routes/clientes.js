const { pool } = require('../config/database');
const logger = require('../config/logger');

async function routes(fastify, options) {

  // GET /clientes/:loja_id - Resumo de fidelidade
  fastify.get('/:loja_id/resumo', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      const result = await pool.query(
        `SELECT
          COUNT(*) as total_clientes,
          COUNT(CASE WHEN status = 'ativo' THEN 1 END) as clientes_ativos,
          COUNT(CASE WHEN status = 'inativo' THEN 1 END) as clientes_inativos,
          COUNT(CASE WHEN status = 'churn' THEN 1 END) as clientes_churn,
          COUNT(CASE WHEN categoria_cliente = 'VIP' THEN 1 END) as clientes_vip,
          ROUND(AVG(taxa_fidelidade_percentual)::NUMERIC, 2) as taxa_fidelidade_media,
          SUM(ltv_estimado) as ltv_total,
          ROUND(AVG(ltv_estimado)::NUMERIC, 2) as ltv_medio,
          ROUND(MAX(ltv_estimado)::NUMERIC, 2) as ltv_maximo,
          ROUND(MIN(ltv_estimado)::NUMERIC, 2) as ltv_minimo
        FROM clientes
        WHERE loja_id = $1`,
        [loja_id]
      );

      const resumo = result.rows[0];

      return reply.send({
        resumo,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Erro ao buscar resumo de fidelidade:', err);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // GET /clientes/:loja_id - Listar clientes com filtros
  fastify.get('/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { status, categoria, limit = 50, offset = 0 } = request.query;

      let query = 'SELECT * FROM clientes WHERE loja_id = $1';
      const params = [loja_id];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (categoria) {
        paramCount++;
        query += ` AND categoria_cliente = $${paramCount}`;
        params.push(categoria);
      }

      query += ' ORDER BY ltv_estimado DESC LIMIT $' + (++paramCount) + ' OFFSET $' + (++paramCount);
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return reply.send({
        clientes: result.rows,
        total: result.rows.length,
        limit,
        offset
      });
    } catch (err) {
      logger.error('Erro ao listar clientes:', err);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // POST /clientes/:loja_id/sincronizar - Calcular fidelidade a partir de vendas
  fastify.post('/:loja_id/sincronizar', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      // Agregar dados de vendas por cliente
      const result = await pool.query(
        `WITH vendas_cliente AS (
          SELECT
            loja_id,
            cliente_id,
            COUNT(*) as total_compras,
            MIN(time) as primeira_compra,
            MAX(time) as ultima_compra,
            SUM(quantidade) as total_itens,
            ROUND(SUM(preco_unitario * quantidade * (1 - COALESCE(desconto_percentual, 0)/100))::NUMERIC, 2) as valor_total,
            ROUND((SUM(preco_unitario * quantidade * (1 - COALESCE(desconto_percentual, 0)/100)) / COUNT(*))::NUMERIC, 2) as ticket_medio,
            EXTRACT(DAY FROM NOW() - MAX(time))::INT as dias_desde_ultima_compra
          FROM vendas
          WHERE loja_id = $1 AND cliente_id IS NOT NULL
          GROUP BY loja_id, cliente_id
        )
        INSERT INTO clientes (
          loja_id, cliente_id, total_compras, primeira_compra, ultima_compra,
          dias_desde_ultima_compra, frequencia_compras_dias, valor_total_gasto,
          ticket_medio, ltv_estimado, taxa_fidelidade_percentual,
          status, categoria_cliente
        )
        SELECT
          loja_id, cliente_id, total_compras, primeira_compra, ultima_compra,
          dias_desde_ultima_compra,
          ROUND((EXTRACT(DAY FROM (ultima_compra - primeira_compra))::NUMERIC / NULLIF(total_compras - 1, 0))::NUMERIC, 2) as frequencia,
          valor_total,
          ticket_medio,
          valor_total * (1 + (total_compras * 0.05)) as ltv_estimado,
          ROUND((100.0 - (dias_desde_ultima_compra / 365.0 * 50))::NUMERIC, 2) as taxa_fidelidade,
          CASE
            WHEN dias_desde_ultima_compra > 180 THEN 'churn'
            WHEN dias_desde_ultima_compra > 90 THEN 'inativo'
            ELSE 'ativo'
          END as status,
          CASE
            WHEN valor_total > 5000 THEN 'VIP'
            WHEN valor_total > 1000 THEN 'regular'
            ELSE 'novo'
          END as categoria
        FROM vendas_cliente
        ON CONFLICT (loja_id, cliente_id) DO UPDATE SET
          total_compras = EXCLUDED.total_compras,
          ultima_compra = EXCLUDED.ultima_compra,
          dias_desde_ultima_compra = EXCLUDED.dias_desde_ultima_compra,
          frequencia_compras_dias = EXCLUDED.frequencia_compras_dias,
          valor_total_gasto = EXCLUDED.valor_total_gasto,
          ticket_medio = EXCLUDED.ticket_medio,
          ltv_estimado = EXCLUDED.ltv_estimado,
          taxa_fidelidade_percentual = EXCLUDED.taxa_fidelidade_percentual,
          status = EXCLUDED.status,
          categoria_cliente = EXCLUDED.categoria_cliente,
          updated_at = NOW()
        RETURNING *`,
        [loja_id]
      );

      return reply.send({
        sincronizado: true,
        clientes_atualizados: result.rowCount,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Erro ao sincronizar fidelidade:', err);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

}

module.exports = routes;
