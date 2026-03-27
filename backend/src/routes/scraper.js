/**
 * Scraper Route
 * Endpoints for managing store flow variable collection
 */

const express = require('express');
const StoreFlowScraper = require('../scrapers');

const router = express.Router();

/**
 * POST /api/v1/scraper/collect
 * Manually trigger variable collection for a store
 */
router.post('/collect', async (req, res) => {
  const { loja_id = 'loja_001' } = req.body;

  if (!req.supabase) {
    return res.json({
      sucesso: true,
      mensaje: 'Coleta de variáveis iniciada (modo mock)',
      loja_id,
      mock: true,
      variables_count: 50,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const scraper = new StoreFlowScraper(req.supabase);
    const result = await scraper.scrapeAll(loja_id);

    res.json({
      sucesso: true,
      mensagem: 'Variáveis coletadas e armazenadas',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });
  }
});

/**
 * GET /api/v1/scraper/variables/:loja_id
 * Retrieve latest collected variables for a store
 */
router.get('/variables/:loja_id', async (req, res) => {
  const { loja_id } = req.params;
  const { limit = 50, days = 1 } = req.query;

  if (!req.supabase) {
    return res.json({
      sucesso: true,
      variables: generateMockVariables(50),
      loja_id,
      mock: true,
      count: 50,
      period_days: parseInt(days),
    });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const { data, error } = await req.supabase
      .from('store_flow_variables')
      .select('*')
      .eq('loja_id', loja_id)
      .gte('collected_at', since.toISOString())
      .order('collected_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Group by variable code
    const grouped = {};
    data?.forEach(row => {
      if (!grouped[row.variable_code]) {
        grouped[row.variable_code] = [];
      }
      grouped[row.variable_code].push(row);
    });

    res.json({
      sucesso: true,
      loja_id,
      variables: grouped,
      unique_variables: Object.keys(grouped).length,
      total_readings: data?.length || 0,
      period_days: parseInt(days),
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });
  }
});

/**
 * GET /api/v1/scraper/summary/:loja_id
 * Get summary of all variables with latest values and impact weights
 */
router.get('/summary/:loja_id', async (req, res) => {
  const { loja_id } = req.params;

  if (!req.supabase) {
    return res.json({
      sucesso: true,
      loja_id,
      variables_monitored: 50,
      categories: {
        traffic_footfall: 6,
        weather_climate: 6,
        seasonality_events: 7,
        economic: 7,
        competitor: 5,
        product_inventory: 7,
        social_digital: 6,
        operational_staffing: 4,
        external: 2,
      },
      last_collection: new Date().toISOString(),
      next_collection: new Date(Date.now() + 3600000).toISOString(),
      mock: true,
    });
  }

  try {
    const { data, error } = await req.supabase
      .from('store_flow_variables')
      .select('variable_code, variable_value, impact_weight, collected_at')
      .eq('loja_id', loja_id)
      .order('collected_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Get latest value for each variable
    const latest = {};
    data?.forEach(row => {
      if (!latest[row.variable_code]) {
        latest[row.variable_code] = row;
      }
    });

    // Categorize variables
    const categories = {
      traffic_footfall: ['CURRENT_TIME_HOUR', 'DAY_OF_WEEK', 'IS_HOLIDAY', 'DAYS_TO_PAYDAY', 'WEATHER_TEMPERATURE', 'WEATHER_PRECIPITATION'],
      weather_climate: ['WEATHER_HUMIDITY', 'WEATHER_UV_INDEX', 'WEATHER_FORECAST_24H', 'WEATHER_EXTREME_ALERT', 'WEATHER_CLOUDINESS', 'SUNRISE_SUNSET_TIME'],
      seasonality_events: ['MONTH_NUMBER', 'DAYS_TO_CHRISTMAS', 'SCHOOL_HOLIDAY_STATUS', 'LOCAL_EVENTS_TODAY', 'CARNIVAL_DAYS', 'BLACK_FRIDAY_STATUS', 'PROFESSIONAL_EVENT_STATUS'],
      economic: ['CONSUMER_CONFIDENCE_INDEX', 'UNEMPLOYMENT_RATE', 'INFLATION_RATE', 'INTEREST_RATE', 'CURRENCY_EXCHANGE', 'STOCK_MARKET_PERFORMANCE', 'FUEL_PRICE_INDEX'],
      competitor: ['NEAREST_COMPETITOR_PROMOTION', 'COMPETITOR_PRICE_INDEX', 'MARKET_SHARE_TREND', 'REGIONAL_SALES_TREND', 'COMPETITOR_SOCIAL_BUZZ'],
      product_inventory: ['OUT_OF_STOCK_ITEMS', 'NEW_PRODUCT_LAUNCHES', 'PRODUCT_RECALL_ACTIVE', 'EXPIRED_STOCK_PERCENTAGE', 'HIGH_MARGIN_ITEMS_STOCK', 'SEASONAL_PRODUCT_AVAILABILITY', 'SUPPLIER_DELIVERY_DELAY'],
      social_digital: ['SOCIAL_MEDIA_MENTIONS', 'SENTIMENT_SCORE', 'GOOGLE_SEARCH_TREND', 'TIKTOK_VIRAL_PRODUCT', 'INFLUENCER_MENTIONS', 'REVIEW_SCORE_CHANGE'],
      operational_staffing: ['STAFF_AVAILABILITY', 'REGISTER_WAIT_TIME', 'SHELF_RESTOCKING_STATUS', 'STORE_TEMPERATURE_CONTROL'],
      external: ['NEWS_SENTIMENT', 'TRAFFIC_CONGESTION_INDEX'],
    };

    const summary = {};
    Object.entries(categories).forEach(([cat, vars]) => {
      summary[cat] = vars.map(code => ({
        code,
        ...latest[code] || { variable_value: null, impact_weight: 0 },
      }));
    });

    res.json({
      sucesso: true,
      loja_id,
      categories: summary,
      total_variables: 50,
      tracked_variables: Object.keys(latest).length,
      last_update: latest[Object.keys(latest)[0]]?.collected_at,
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });
  }
});

/**
 * GET /api/v1/scraper/impact/:loja_id
 * Get variable importance for predictive model
 */
router.get('/impact/:loja_id', async (req, res) => {
  const { loja_id } = req.params;

  if (!req.supabase) {
    return res.json({
      sucesso: true,
      loja_id,
      top_impactful_variables: [
        { variable: 'CURRENT_TIME_HOUR', impact_score: 0.92 },
        { variable: 'DAY_OF_WEEK', impact_score: 0.88 },
        { variable: 'WEATHER_TEMPERATURE', impact_score: 0.75 },
        { variable: 'IS_HOLIDAY', impact_score: 0.82 },
        { variable: 'CONSUMER_CONFIDENCE_INDEX', impact_score: 0.68 },
      ],
      recommendation: 'Usa model.weightVariables() com esses impactos para refinar previsões',
    });
  }

  try {
    const { data, error } = await req.supabase
      .from('store_flow_variables')
      .select('variable_code, impact_weight')
      .eq('loja_id', loja_id)
      .not('impact_weight', 'is', null)
      .order('impact_weight', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({
      sucesso: true,
      loja_id,
      top_variables: data || [],
      note: 'Pesos calculados via MAPE (Mean Absolute Percentage Error) de backtest',
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });
  }
});

/**
 * POST /api/v1/scraper/schedule
 * Set up automated collection schedule
 */
router.post('/schedule', (req, res) => {
  const { interval_minutes = 60, enabled = true } = req.body;

  res.json({
    sucesso: true,
    mensagem: 'Schedule configurado',
    interval: `${interval_minutes} minutos`,
    enabled,
    next_collection: new Date(Date.now() + interval_minutes * 60000).toISOString(),
    note: 'Em produção, usar node-schedule ou similar para automação',
  });
});

// ─ Helper Function ─────────────────────────────────────────────────
function generateMockVariables(count) {
  const variables = {};
  const codes = [
    'CURRENT_TIME_HOUR', 'DAY_OF_WEEK', 'IS_HOLIDAY', 'DAYS_TO_PAYDAY',
    'WEATHER_TEMPERATURE', 'WEATHER_PRECIPITATION', 'WEATHER_HUMIDITY',
    'WEATHER_UV_INDEX', 'WEATHER_FORECAST_24H', 'WEATHER_EXTREME_ALERT',
    'MONTH_NUMBER', 'DAYS_TO_CHRISTMAS', 'SCHOOL_HOLIDAY_STATUS',
    'CONSUMER_CONFIDENCE_INDEX', 'UNEMPLOYMENT_RATE', 'INFLATION_RATE',
    'INTEREST_RATE', 'CURRENCY_EXCHANGE', 'STOCK_MARKET_PERFORMANCE',
    'FUEL_PRICE_INDEX', 'NEAREST_COMPETITOR_PROMOTION', 'COMPETITOR_PRICE_INDEX',
    'MARKET_SHARE_TREND', 'REGIONAL_SALES_TREND', 'COMPETITOR_SOCIAL_BUZZ',
    'OUT_OF_STOCK_ITEMS', 'NEW_PRODUCT_LAUNCHES', 'EXPIRED_STOCK_PERCENTAGE',
    'HIGH_MARGIN_ITEMS_STOCK', 'SEASONAL_PRODUCT_AVAILABILITY',
    'SUPPLIER_DELIVERY_DELAY', 'SOCIAL_MEDIA_MENTIONS', 'SENTIMENT_SCORE',
    'GOOGLE_SEARCH_TREND', 'TIKTOK_VIRAL_PRODUCT', 'INFLUENCER_MENTIONS',
    'REVIEW_SCORE_CHANGE', 'STAFF_AVAILABILITY', 'REGISTER_WAIT_TIME',
    'SHELF_RESTOCKING_STATUS', 'STORE_TEMPERATURE_CONTROL', 'NEWS_SENTIMENT',
    'TRAFFIC_CONGESTION_INDEX', 'WEATHER_CLOUDINESS', 'CARNIVAL_DAYS',
    'BLACK_FRIDAY_STATUS', 'PRODUCT_RECALL_ACTIVE'
  ];

  for (let i = 0; i < Math.min(count, codes.length); i++) {
    variables[codes[i]] = {
      value: Math.random() * 100,
      unit: 'normalized',
      source: 'mock',
    };
  }

  return variables;
}

module.exports = router;
