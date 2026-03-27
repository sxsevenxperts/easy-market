const { pool } = require('../config/database');
const redis = require('../config/redis');
const logger = require('../config/logger');

async function routes(fastify, options) {

  // GET /api/v1/relatorios/:loja_id/vendas - Sales report
  fastify.get('/:loja_id/vendas', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const {
        periodo = 'diario', // diario, semanal, quinzenal, mensal, 90dias, 6meses, 1ano
        data_inicio,
        data_fim,
        categoria,
        setor
      } = request.query;

      // Calculate date range based on period
      let dateRange;
      switch(periodo) {
        case 'diario':
          dateRange = 1;
          break;
        case 'semanal':
          dateRange = 7;
          break;
        case 'quinzenal':
          dateRange = 15;
          break;
        case 'mensal':
          dateRange = 30;
          break;
        case '90dias':
          dateRange = 90;
          break;
        case '6meses':
          dateRange = 180;
          break;
        case '1ano':
          dateRange = 365;
          break;
        default:
          dateRange = 30;
      }

      let query = `
        SELECT
          DATE_TRUNC('day', time)::DATE as data,
          EXTRACT(HOUR FROM time) as hora,
          categoria,
          subcategoria,
          SUM(quantidade) as total_quantidade,
          SUM(preco_total) as total_faturamento,
          COUNT(DISTINCT sku) as quantidade_produtos_unicos,
          COUNT(*) as total_transacoes,
          AVG(preco_unitario) as preco_medio,
          MAX(preco_unitario) as preco_maximo,
          MIN(preco_unitario) as preco_minimo
         FROM vendas
         WHERE loja_id = $1
         AND time >= NOW() - ($2 * INTERVAL '1 day')
      `;
      const params = [loja_id, dateRange];

      if (categoria) {
        query += ` AND categoria = $${params.length + 1}`;
        params.push(categoria);
      }

      if (data_inicio && data_fim) {
        query += ` AND time BETWEEN $${params.length + 1} AND $${params.length + 2}`;
        params.push(new Date(data_inicio), new Date(data_fim));
      }

      query += ` GROUP BY DATE_TRUNC('day', time), EXTRACT(HOUR FROM time), categoria, subcategoria
                 ORDER BY data DESC, hora DESC`;

      const result = await pool.query(query, params);

      // Calculate summary stats
      const totalFaturamento = result.rows.reduce((sum, r) => sum + parseFloat(r.total_faturamento || 0), 0);
      const totalQuantidade = result.rows.reduce((sum, r) => sum + parseInt(r.total_quantidade || 0), 0);

      return reply.send({
        loja_id,
        periodo,
        dias_analisados: dateRange,
        resumo: {
          total_faturamento: totalFaturamento,
          total_quantidade: totalQuantidade,
          total_transacoes: result.rows.length,
          ticket_medio: totalQuantidade > 0 ? totalFaturamento / totalQuantidade : 0
        },
        dados: result.rows
      });

    } catch (err) {
      logger.error('Error generating sales report:', err);
      return reply.code(500).send({
        error: 'internal_server_error',
        message: err.message
      });
    }
  });

  // GET /api/v1/relatorios/:loja_id/memorial - Item history/memorial
  fastify.get('/:loja_id/memorial', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const {
        sku,
        categoria,
        data_inicio,
        data_fim,
        segmentar_por = 'dia', // dia, hora, setor, produto
        limit = 1000,
        offset = 0
      } = request.query;

      let query = `
        SELECT
          v.time,
          EXTRACT(DAY FROM v.time) as dia,
          EXTRACT(HOUR FROM v.time) as hora,
          EXTRACT(DOW FROM v.time) as dia_semana,
          v.sku,
          v.nome_produto,
          v.categoria,
          v.subcategoria,
          v.quantidade,
          v.preco_unitario,
          v.preco_total,
          v.desconto_percentual,
          v.is_feriado,
          v.evento_local,
          p.estoque_anterior,
          p.estoque_posterior
         FROM vendas v
         LEFT JOIN (
           SELECT * FROM produtos
           WHERE loja_id = $1
         ) p ON v.sku = p.sku
         WHERE v.loja_id = $1
      `;
      const params = [loja_id];

      if (sku) {
        query += ` AND v.sku = $${params.length + 1}`;
        params.push(sku);
      }

      if (categoria) {
        query += ` AND v.categoria = $${params.length + 1}`;
        params.push(categoria);
      }

      if (data_inicio && data_fim) {
        query += ` AND v.time BETWEEN $${params.length + 1} AND $${params.length + 2}`;
        params.push(new Date(data_inicio), new Date(data_fim));
      }

      // Group by segment
      let groupBy = '';
      if (segmentar_por === 'hora') {
        groupBy = ` GROUP BY v.time, EXTRACT(HOUR FROM v.time), v.sku, v.nome_produto, v.categoria, v.subcategoria`;
      } else if (segmentar_por === 'produto') {
        groupBy = ` GROUP BY v.sku, v.nome_produto, v.categoria, v.subcategoria`;
      }

      query += groupBy + ` ORDER BY v.time DESC
                          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return reply.send({
        loja_id,
        segmentacao: segmentar_por,
        total_registros: result.rows.length,
        memorial: result.rows
      });

    } catch (err) {
      logger.error('Error generating memorial report:', err);
      return reply.code(500).send({
        error: 'internal_server_error',
        message: err.message
      });
    }
  });

  // GET /api/v1/relatorios/:loja_id/categoria/:categoria - Category analysis
  fastify.get('/:loja_id/categoria/:categoria', async (request, reply) => {
    try {
      const { loja_id, categoria } = request.params;
      const { periodo = 'mensal' } = request.query;

      const dateRange = {
        'diario': 1,
        'semanal': 7,
        'mensal': 30,
        '90dias': 90,
        '6meses': 180,
        '1ano': 365
      }[periodo] || 30;

      const result = await pool.query(
        `SELECT
          DATE_TRUNC('day', time)::DATE as data,
          categoria,
          SUM(quantidade) as total_quantidade,
          SUM(preco_total) as total_faturamento,
          COUNT(*) as transacoes,
          AVG(preco_unitario) as preco_medio
         FROM vendas
         WHERE loja_id = $1
         AND categoria = $2
         AND time >= NOW() - ($3 * INTERVAL '1 day')
         GROUP BY DATE_TRUNC('day', time), categoria
         ORDER BY data DESC`,
        [loja_id, categoria, dateRange]
      );

      // Calculate trends
      const trend = result.rows.length > 1 ?
        ((result.rows[0].total_faturamento - result.rows[result.rows.length - 1].total_faturamento) /
         result.rows[result.rows.length - 1].total_faturamento * 100).toFixed(2)
        : 0;

      return reply.send({
        loja_id,
        categoria,
        periodo,
        trend_percentual: trend,
        dados: result.rows
      });

    } catch (err) {
      logger.error('Error generating category report:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/relatorios/:loja_id/horarios - Hourly analysis
  fastify.get('/:loja_id/horarios', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const { periodo = 'semanal' } = request.query;

      const dateRange = periodo === 'semanal' ? 7 : 30;

      const result = await pool.query(
        `SELECT
          EXTRACT(HOUR FROM time) as hora,
          EXTRACT(DOW FROM time) as dia_semana,
          SUM(quantidade) as total_quantidade,
          SUM(preco_total) as total_faturamento,
          COUNT(*) as transacoes,
          AVG(preco_unitario) as ticket_medio
         FROM vendas
         WHERE loja_id = $1
         AND time >= NOW() - ($2 * INTERVAL '1 day')
         GROUP BY EXTRACT(HOUR FROM time), EXTRACT(DOW FROM time)
         ORDER BY hora ASC`,
        [loja_id, dateRange]
      );

      // Identify peak hours
      const peakHours = result.rows
        .sort((a, b) => b.total_faturamento - a.total_faturamento)
        .slice(0, 5);

      return reply.send({
        loja_id,
        periodo,
        horas_pico: peakHours,
        matriz_vendas: result.rows
      });

    } catch (err) {
      logger.error('Error generating hourly report:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/relatorios/:loja_id/desperdicio - Waste analysis
  fastify.get('/:loja_id/desperdicio', async (request, reply) => {
    try {
      const { loja_id } = request.params;
      const diasRaw = request.query.dias ?? 30;
      const dias = Math.max(1, Math.min(365, parseInt(diasRaw, 10) || 30));

      const result = await pool.query(
        `SELECT
          a.tipo,
          a.categoria,
          COUNT(*) as total_alertas,
          SUM((a.dados_json->>'quantidade_comprometida')::NUMERIC) as quantidade_afetada,
          SUM(a.roi_estimado) as economia_potencial
         FROM alertas a
         WHERE a.loja_id = $1
         AND a.tipo IN ('desperdicio', 'vencimento_proximo')
         AND a.created_at >= NOW() - ($2 * INTERVAL '1 day')
         GROUP BY a.tipo, a.categoria
         ORDER BY economia_potencial DESC`,
        [loja_id, dias]
      );

      return reply.send({
        loja_id,
        periodo_dias: dias,
        analise_desperdicio: result.rows,
        total_economia_potencial: result.rows.reduce((sum, r) => sum + (r.economia_potencial || 0), 0)
      });

    } catch (err) {
      logger.error('Error generating waste report:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

  // GET /api/v1/relatorios/:loja_id/comparativo - Comparative analysis
  fastify.get('/:loja_id/comparativo', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      // Compare this week vs last week, this month vs last month
      const result = await pool.query(
        `SELECT
          (SUM(CASE WHEN time >= NOW() - INTERVAL '7 days' THEN quantidade ELSE 0 END)) as semana_atual,
          (SUM(CASE WHEN time < NOW() - INTERVAL '7 days' AND time >= NOW() - INTERVAL '14 days' THEN quantidade ELSE 0 END)) as semana_passada,
          (SUM(CASE WHEN time >= NOW() - INTERVAL '30 days' THEN quantidade ELSE 0 END)) as mes_atual,
          (SUM(CASE WHEN time < NOW() - INTERVAL '30 days' AND time >= NOW() - INTERVAL '60 days' THEN quantidade ELSE 0 END)) as mes_passado,
          (SUM(CASE WHEN time >= NOW() - INTERVAL '7 days' THEN preco_total ELSE 0 END)) as faturamento_semana_atual,
          (SUM(CASE WHEN time < NOW() - INTERVAL '7 days' AND time >= NOW() - INTERVAL '14 days' THEN preco_total ELSE 0 END)) as faturamento_semana_passada
         FROM vendas
         WHERE loja_id = $1`,
        [loja_id]
      );

      const data = result.rows[0];
      const semana_passada = parseFloat(data.semana_passada) || 0;
      const mes_passado = parseFloat(data.mes_passado) || 0;
      const variacao_semana = semana_passada !== 0
        ? ((data.semana_atual - semana_passada) / semana_passada * 100).toFixed(2)
        : '0.00';
      const variacao_mes = mes_passado !== 0
        ? ((data.mes_atual - mes_passado) / mes_passado * 100).toFixed(2)
        : '0.00';

      return reply.send({
        loja_id,
        comparativo: {
          semana: {
            atual: data.semana_atual,
            passada: data.semana_passada,
            variacao_percentual: variacao_semana
          },
          mes: {
            atual: data.mes_atual,
            passada: data.mes_passado,
            variacao_percentual: variacao_mes
          },
          faturamento: {
            semana_atual: data.faturamento_semana_atual,
            semana_passada: data.faturamento_semana_passada
          }
        }
      });

    } catch (err) {
      logger.error('Error generating comparative report:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

}

module.exports = routes;
