const { pool } = require('../config/database');
const redis = require('../config/redis');
const logger = require('../config/logger');

async function routes(fastify, options) {

  // GET /api/v1/dashboard/:loja_id - Main dashboard
  fastify.get('/:loja_id', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { periodo = 'hoje' } = request.query;

      // Define date range
      let dateRange = "AND time >= NOW() - INTERVAL '1 day'";
      if (periodo === 'semana') dateRange = "AND time >= NOW() - INTERVAL '7 days'";
      if (periodo === 'mes') dateRange = "AND time >= NOW() - INTERVAL '30 days'";

      // Get loja info
      const lojaResult = await pool.query(
        'SELECT * FROM lojas WHERE loja_id = $1',
        [loja_id]
      );

      if (lojaResult.rows.length === 0) {
        return reply.code(404).send({ error: 'loja_not_found' });
      }

      const loja = lojaResult.rows[0];

      // Get today's sales summary
      const summaryResult = await pool.query(
        `SELECT 
          SUM(quantidade) as itens_vendidos,
          COUNT(DISTINCT sku) as categorias_vendidas,
          SUM(preco_unitario * quantidade * (1 - COALESCE(desconto_percentual, 0)/100)) as faturamento,
          COUNT(*) as transacoes,
          AVG(preco_unitario * quantidade * (1 - COALESCE(desconto_percentual, 0)/100)) as ticket_medio
        FROM vendas
        WHERE loja_id = $1 ${dateRange}`,
        [loja_id]
      );

      const summary = summaryResult.rows[0];

      // Get critical alerts
      const alertasResult = await pool.query(
        `SELECT id, tipo, titulo, mensagem, urgencia, created_at, roi_estimado
        FROM alertas
        WHERE loja_id = $1 AND status = 'aberto'
        ORDER BY urgencia DESC, created_at DESC
        LIMIT 5`,
        [loja_id]
      );

      // Get 24h forecasts
      let forecastsResult = { rows: [] };
      try {
        const cached = await redis.get(`forecast:${loja_id}:24h`);
        if (cached) {
          forecastsResult.rows = JSON.parse(cached);
        } else {
          forecastsResult = await pool.query(
            `SELECT categoria, quantidade_esperada, quantidade_lower, quantidade_upper, confianca_percentual
            FROM previsoes
            WHERE loja_id = $1
            AND data_inicio >= NOW()
            AND data_inicio <= NOW() + INTERVAL '24 hours'
            AND confianca_percentual >= 80`,
            [loja_id]
          );
        }
      } catch (err) {
        logger.warn('Error fetching forecasts:', err);
      }

      // Get heat matrix (sales by hour/day)
      const matrizResult = await pool.query(
        `SELECT
          EXTRACT(HOUR FROM time)::INT as hora,
          EXTRACT(DOW FROM time)::INT as dia_semana,
          AVG(quantidade) as quantidade_media
        FROM vendas
        WHERE loja_id = $1 ${dateRange}
        GROUP BY hora, dia_semana
        ORDER BY dia_semana, hora`,
        [loja_id]
      );

      // Get customer loyalty metrics
      const fidelidadeResult = await pool.query(
        `SELECT
          COUNT(*) as total_clientes,
          COUNT(CASE WHEN status = 'ativo' THEN 1 END) as clientes_ativos,
          COUNT(CASE WHEN status = 'inativo' THEN 1 END) as clientes_inativos,
          COUNT(CASE WHEN status = 'churn' THEN 1 END) as clientes_churn,
          COUNT(CASE WHEN categoria_cliente = 'VIP' THEN 1 END) as clientes_vip,
          ROUND(AVG(taxa_fidelidade_percentual)::NUMERIC, 2) as taxa_fidelidade_media,
          SUM(ltv_estimado) as ltv_total,
          ROUND(AVG(ltv_estimado)::NUMERIC, 2) as ltv_medio
        FROM clientes
        WHERE loja_id = $1`,
        [loja_id]
      );

      // Get new vs churn customers (last period)
      const movimentoClientesResult = await pool.query(
        `SELECT
          COUNT(CASE WHEN primeira_compra::DATE > NOW()::DATE - INTERVAL '${periodo === 'semana' ? '7 days' : periodo === 'mes' ? '30 days' : '1 day'}'::INTERVAL THEN 1 END) as novos_clientes,
          COUNT(CASE WHEN status = 'churn' AND ultima_compra::DATE > NOW()::DATE - INTERVAL '${periodo === 'semana' ? '7 days' : periodo === 'mes' ? '30 days' : '1 day'}'::INTERVAL THEN 1 END) as churn_clientes,
          ROUND((COUNT(CASE WHEN primeira_compra::DATE > NOW()::DATE - INTERVAL '${periodo === 'semana' ? '7 days' : periodo === 'mes' ? '30 days' : '1 day'}'::INTERVAL THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100)::NUMERIC, 2) as taxa_novos_percentual,
          ROUND((COUNT(CASE WHEN status = 'churn' AND ultima_compra::DATE > NOW()::DATE - INTERVAL '${periodo === 'semana' ? '7 days' : periodo === 'mes' ? '30 days' : '1 day'}'::INTERVAL THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100)::NUMERIC, 2) as taxa_churn_percentual
        FROM clientes
        WHERE loja_id = $1`,
        [loja_id]
      );

      // Get upcoming events
      const eventosResult = await pool.query(
        `SELECT nome, data_inicio, data_fim, tipo, nivel_impacto, impacto_percentual, categorias_afetadas
        FROM calendario_eventos
        WHERE municipio = $1
        AND data_inicio >= NOW()::DATE
        AND data_inicio <= NOW()::DATE + INTERVAL '30 days'
        ORDER BY data_inicio`,
        [loja.municipio]
      );

      return reply.send({
        loja: {
          id: loja.loja_id,
          nome: loja.nome,
          municipio: loja.municipio,
          estado: loja.estado
        },
        periodo_selecionado: periodo,
        resumo: {
          faturamento: parseFloat(summary.faturamento || 0),
          transacoes: parseInt(summary.transacoes || 0),
          itens_vendidos: parseInt(summary.itens_vendidos || 0),
          ticket_medio: parseFloat(summary.ticket_medio || 0),
          categorias: parseInt(summary.categorias_vendidas || 0)
        },
        fidelidade: {
          total_clientes: parseInt(fidelidadeResult.rows[0].total_clientes || 0),
          clientes_ativos: parseInt(fidelidadeResult.rows[0].clientes_ativos || 0),
          clientes_inativos: parseInt(fidelidadeResult.rows[0].clientes_inativos || 0),
          clientes_churn: parseInt(fidelidadeResult.rows[0].clientes_churn || 0),
          clientes_vip: parseInt(fidelidadeResult.rows[0].clientes_vip || 0),
          taxa_fidelidade_media_percentual: parseFloat(fidelidadeResult.rows[0].taxa_fidelidade_media || 0),
          ltv_total: parseFloat(fidelidadeResult.rows[0].ltv_total || 0),
          ltv_medio: parseFloat(fidelidadeResult.rows[0].ltv_medio || 0)
        },
        movimento_clientes: {
          novos_clientes: parseInt(movimentoClientesResult.rows[0].novos_clientes || 0),
          churn_clientes: parseInt(movimentoClientesResult.rows[0].churn_clientes || 0),
          taxa_novos_percentual: parseFloat(movimentoClientesResult.rows[0].taxa_novos_percentual || 0),
          taxa_churn_percentual: parseFloat(movimentoClientesResult.rows[0].taxa_churn_percentual || 0)
        },
        alertas: alertasResult.rows.map(a => ({
          id: a.id,
          tipo: a.tipo,
          titulo: a.titulo,
          mensagem: a.mensagem,
          urgencia: a.urgencia,
          roi_economizado: parseFloat(a.roi_estimado || 0),
          created_at: a.created_at
        })),
        previsoes_24h: forecastsResult.rows.map(p => ({
          categoria: p.categoria,
          quantidade_esperada: parseFloat(p.quantidade_esperada),
          intervalo: [parseFloat(p.quantidade_lower), parseFloat(p.quantidade_upper)],
          confianca: parseInt(p.confianca_percentual)
        })),
        matriz_calor: matrizResult.rows,
        proximos_eventos: eventosResult.rows.map(e => ({
          nome: e.nome,
          data_inicio: e.data_inicio,
          data_fim: e.data_fim,
          tipo: e.tipo,
          impacto_esperado: `${e.impacto_percentual}%`,
          categorias_afetadas: e.categorias_afetadas
        }))
      });

    } catch (err) {
      logger.error('Error fetching dashboard:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/dashboard/:loja_id/categoria/:categoria - Category-specific dashboard
  fastify.get('/:loja_id/categoria/:categoria', async (request, reply) => {
    try {
      const { loja_id, categoria } = request.params;

      // Category sales trend
      const trendResult = await pool.query(
        `SELECT 
          DATE_TRUNC('hour', time)::TIMESTAMP as periodo,
          SUM(quantidade) as quantidade,
          AVG(preco_unitario) as preco_medio,
          COUNT(*) as transacoes
        FROM vendas
        WHERE loja_id = $1 AND categoria = $2
        AND time >= NOW() - INTERVAL '7 days'
        GROUP BY periodo
        ORDER BY periodo DESC`,
        [loja_id, categoria]
      );

      // Correlation with climate
      const corrResult = await pool.query(
        `SELECT 
          corr_temperatura,
          corr_precipitacao,
          corr_umidade,
          padroes_json
        FROM correlacao_clima_demanda
        WHERE loja_id = $1 AND categoria = $2`,
        [loja_id, categoria]
      );

      // Current forecast
      const forecastResult = await pool.query(
        `SELECT 
          quantidade_esperada,
          quantidade_lower,
          quantidade_upper,
          confianca_percentual,
          data_inicio,
          data_fim
        FROM previsoes
        WHERE loja_id = $1 AND categoria = $2
        AND data_inicio >= NOW()
        ORDER BY data_inicio
        LIMIT 24`,
        [loja_id, categoria]
      );

      return reply.send({
        loja_id,
        categoria,
        trend: trendResult.rows,
        correlacoes: corrResult.rows[0] || {},
        forecast_24h: forecastResult.rows
      });

    } catch (err) {
      logger.error('Error fetching category dashboard:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

}

module.exports = routes;
