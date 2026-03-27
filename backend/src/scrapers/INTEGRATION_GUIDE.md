# Store Flow Scraper Integration Guide

## Quick Start

### 1. Add to Backend Routes

Edit `backend/src/index.js` and add scraper to expressRoutes:

```javascript
const expressRoutes = [
  { path: '/api/v1/rfm',       file: './routes/rfm',       name: 'RFM'      },
  { path: '/api/v1/anomalias', file: './routes/anomalias', name: 'Anomalias'},
  { path: '/api/v1/alertas',   file: './routes/alertas',   name: 'Alertas'  },
  { path: '/api/v1/perdas',    file: './routes/perdas',    name: 'Perdas'   },
  { path: '/api/v1/scraper',   file: './routes/scraper',   name: 'Scraper'  }, // ← ADD THIS
];
```

### 2. Initialize Scheduler (Optional but Recommended)

Add to `backend/src/index.js` after Supabase initialization:

```javascript
// ── Scheduler for automatic variable collection ─────────────────
let scheduler = null;
if (supabase) {
  const ScraperScheduler = require('./scrapers/scheduler');
  scheduler = new ScraperScheduler(supabase);
  
  // Start collecting every 60 minutes for loja_001
  scheduler.start(['loja_001'], 60);
  
  console.log('[SmartMarket] ✅ Store Flow Variables Scheduler started');
}
```

### 3. Run Database Migration

Execute the SQL to create tables:

```bash
# Option 1: Via Supabase UI
# Copy/paste content of backend/src/scrapers/migrations.sql 
# into Supabase SQL Editor

# Option 2: Via Node.js script
node scripts/apply-scraper-migration.js
```

### 4. Set Environment Variables (Optional)

Create/update `.env` in backend:

```
OPENWEATHER_API_KEY=your_key_here  # Free tier available at openweathermap.org
TWITTER_API_KEY=your_key_here      # For social media monitoring
GOOGLE_TRENDS_API=your_key_here    # For search trends
```

### 5. Test the Scraper

```bash
# Manual trigger
curl -X POST http://localhost:3000/api/v1/scraper/collect \
  -H "Content-Type: application/json" \
  -d '{"loja_id": "loja_001"}'

# View collected variables
curl http://localhost:3000/api/v1/scraper/variables/loja_001?days=1

# View summary
curl http://localhost:3000/api/v1/scraper/summary/loja_001

# View impact analysis
curl http://localhost:3000/api/v1/scraper/impact/loja_001
```

---

## API Endpoints

### POST /api/v1/scraper/collect
Manually trigger variable collection for a store

**Request:**
```json
{
  "loja_id": "loja_001"
}
```

**Response:**
```json
{
  "sucesso": true,
  "mensagem": "Variáveis coletadas e armazenadas",
  "stored": 50,
  "loja_id": "loja_001",
  "timestamp": "2026-03-22T10:30:00.000Z"
}
```

---

### GET /api/v1/scraper/variables/:loja_id
Retrieve collected variables with history

**Query Parameters:**
- `limit`: Number of readings per variable (default: 50)
- `days`: Look back period in days (default: 1)

**Response:**
```json
{
  "sucesso": true,
  "loja_id": "loja_001",
  "variables": {
    "WEATHER_TEMPERATURE": [
      {
        "variable_code": "WEATHER_TEMPERATURE",
        "variable_value": 75.5,
        "raw_value": 25,
        "unit": "°C",
        "source": "openweather",
        "collected_at": "2026-03-22T10:00:00.000Z"
      }
    ]
  },
  "unique_variables": 48,
  "total_readings": 2400
}
```

---

### GET /api/v1/scraper/summary/:loja_id
Get summary of all variables categorized

**Response:**
```json
{
  "sucesso": true,
  "loja_id": "loja_001",
  "categories": {
    "traffic_footfall": [
      {
        "code": "CURRENT_TIME_HOUR",
        "variable_value": 14,
        "impact_weight": 0.92
      }
    ],
    "weather_climate": [
      {
        "code": "WEATHER_TEMPERATURE",
        "variable_value": 75.5,
        "impact_weight": 0.75
      }
    ]
  },
  "total_variables": 50,
  "tracked_variables": 48
}
```

---

### GET /api/v1/scraper/impact/:loja_id
Get variable importance weights for predictive model

**Response:**
```json
{
  "sucesso": true,
  "loja_id": "loja_001",
  "top_variables": [
    {
      "variable_code": "CURRENT_TIME_HOUR",
      "impact_weight": 0.92
    },
    {
      "variable_code": "DAY_OF_WEEK",
      "impact_weight": 0.88
    }
  ],
  "note": "Pesos calculados via MAPE de backtest"
}
```

---

### POST /api/v1/scraper/schedule
Configure automated collection schedule

**Request:**
```json
{
  "interval_minutes": 60,
  "enabled": true
}
```

---

## Data Categories (50 Variables)

| Category | Count | Variables |
|----------|-------|-----------|
| **Traffic & Footfall** | 6 | Hour, Day, Holiday, Payday, Temperature, Precipitation |
| **Weather & Climate** | 6 | Humidity, UV Index, Forecast, Alerts, Cloudiness, Sunrise/Sunset |
| **Seasonality & Events** | 7 | Month, Holiday Distance, School Status, Local Events, Carnival, Black Friday, Professional Events |
| **Economic Indicators** | 7 | Consumer Confidence, Unemployment, Inflation, Interest Rate, Exchange, Stock Market, Fuel Price |
| **Competitor & Market** | 5 | Promotions, Price Index, Market Share, Regional Sales, Social Buzz |
| **Product & Inventory** | 7 | Stockouts, New Launches, Recalls, Expired Stock, High Margin, Seasonal, Delivery Delay |
| **Social & Digital Trends** | 6 | Mentions, Sentiment, Google Trend, TikTok Viral, Influencer, Reviews |
| **Operational & Staffing** | 4 | Staff %, Wait Time, Shelf Stock, Temperature |
| **External Data** | 2 | News Sentiment, Traffic Congestion |

---

## Integration with Predictive AI

### 1. Normalize Variables

All variables are normalized to 0-100 scale in the scraper:

```javascript
// Temperature: -10°C to +50°C → 0-100
normalizedValue = ((rawValue + 10) / 60) * 100;
```

### 2. Weight Variables in Forecast

Use impact_weight to influence predictions:

```javascript
// In your forecast model
const forecast = baselineForcast * (1 + weightedVariables);

weightedVariables = topVariables.reduce((sum, v) => {
  return sum + (v.impact_weight * v.normalized_change);
}, 0);
```

### 3. Track Correlations

The system stores discovered correlations:

```sql
SELECT * FROM variable_correlations
WHERE loja_id = 'loja_001'
ORDER BY confidence_score DESC;
```

---

## Scheduler Behavior

### Default Schedule
- **Frequency**: Every 60 minutes
- **Stores**: loja_001, loja_002, loja_003
- **Variables**: All 50 collected per cycle
- **Storage**: Timestamped entries with uniqueness constraint per hour

### Execution Flow
1. **Data Collection** (~5-10 seconds)
   - Weather APIs (3s)
   - Economic data (2s)
   - Internal systems (2s)
   - Social/competitor data (3s)

2. **Normalization** (< 1 second)
   - Convert all to 0-100 scale
   - Apply unit conversions

3. **Storage** (~2 seconds)
   - Insert into Supabase
   - Log execution

4. **Analysis** (Optional)
   - Calculate correlations
   - Update impact weights

### Monitoring

View scheduler status:
```bash
GET /api/v1/scraper/status
```

View collection logs:
```bash
curl http://localhost:3000/api/v1/scraper/logs?days=7
```

---

## Common Issues & Solutions

### Issue: API Rate Limits
**Solution**: Use mock data for development, add request caching, implement backoff logic

### Issue: Missing Weather Data
**Solution**: System falls back to mock weather when API unavailable

### Issue: Database Full
**Solution**: Implement data retention policy (e.g., keep last 90 days)

```sql
DELETE FROM store_flow_variables 
WHERE collected_at < NOW() - INTERVAL '90 days';
```

### Issue: Slow Predictions
**Solution**: Only use top 10 impactful variables instead of all 50

```javascript
const topVars = variables.sort((a,b) => b.impact_weight - a.impact_weight).slice(0,10);
```

---

## Next Steps

1. ✅ Implement scraper with 50 variables
2. ✅ Create API endpoints for variable access
3. ✅ Build scheduler for automated collection
4. **→ Create frontend dashboard to visualize variables**
5. **→ Integrate variables into predictive AI model**
6. **→ Calculate variable importance via MAPE**
7. **→ Set up automated correlation discovery**
8. **→ Create alerts when variables exceed thresholds**
