-- Store Flow Variables Table
-- Stores all 50 real-time variables that impact retail store operations

CREATE TABLE IF NOT EXISTS store_flow_variables (
  id BIGSERIAL PRIMARY KEY,
  loja_id TEXT NOT NULL,
  variable_code TEXT NOT NULL,
  variable_value NUMERIC(10,3),         -- Normalized 0-100
  raw_value NUMERIC(15,6),               -- Original measurement
  unit TEXT,                             -- °C, %, mm, etc.
  source TEXT,                           -- API/source name
  collected_at TIMESTAMP NOT NULL,
  impact_weight NUMERIC(5,4) DEFAULT 0,  -- Importance in model
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure uniqueness per store per variable per hour
  UNIQUE(loja_id, variable_code, DATE_TRUNC('hour', collected_at))
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_store_flow_loja 
  ON store_flow_variables(loja_id);

CREATE INDEX IF NOT EXISTS idx_store_flow_code 
  ON store_flow_variables(variable_code);

CREATE INDEX IF NOT EXISTS idx_store_flow_time 
  ON store_flow_variables(collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_store_flow_impact 
  ON store_flow_variables(impact_weight DESC);

-- Variable Metadata Table
-- Stores information about each variable and its calibration

CREATE TABLE IF NOT EXISTS variable_metadata (
  id BIGSERIAL PRIMARY KEY,
  variable_code TEXT UNIQUE NOT NULL,
  variable_name TEXT,
  description TEXT,
  category TEXT,                        -- traffic, weather, economic, etc.
  min_range NUMERIC(15,6),
  max_range NUMERIC(15,6),
  unit_original TEXT,
  unit_normalized TEXT DEFAULT '0-100',
  source_type TEXT,                     -- api, scraper, database, manual
  refresh_interval_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_var_meta_category (category)
);

-- Populate Variable Metadata
INSERT INTO variable_metadata 
  (variable_code, variable_name, description, category, min_range, max_range, unit_original, source_type, refresh_interval_minutes)
VALUES
  -- Traffic & Footfall
  ('CURRENT_TIME_HOUR', 'Current Hour', 'Hour of day 0-23', 'traffic', 0, 23, 'hour', 'system', 60),
  ('DAY_OF_WEEK', 'Day of Week', '1=Monday, 7=Sunday', 'traffic', 1, 7, '1-7', 'system', 1440),
  ('IS_HOLIDAY', 'Is Holiday', 'National or local holiday flag', 'traffic', 0, 1, 'binary', 'calendar', 1440),
  ('DAYS_TO_PAYDAY', 'Days to Payday', 'Days until next payday', 'traffic', 0, 30, 'days', 'calendar', 1440),
  ('WEATHER_TEMPERATURE', 'Temperature', 'Current temperature celsius', 'weather', -10, 50, '°C', 'api', 30),
  ('WEATHER_PRECIPITATION', 'Precipitation', 'Rainfall in last hour', 'weather', 0, 100, 'mm', 'api', 30),
  
  -- Weather & Climate
  ('WEATHER_HUMIDITY', 'Humidity', 'Air humidity percentage', 'weather', 0, 100, '%', 'api', 30),
  ('WEATHER_UV_INDEX', 'UV Index', 'UV radiation intensity', 'weather', 0, 16, '0-16', 'api', 60),
  ('WEATHER_FORECAST_24H', 'Rain Forecast 24h', 'Probability of rain next 24h', 'weather', 0, 100, '%', 'api', 60),
  ('WEATHER_EXTREME_ALERT', 'Extreme Weather', 'Alert for extreme conditions', 'weather', 0, 1, 'binary', 'api', 30),
  ('WEATHER_CLOUDINESS', 'Cloud Cover', 'Cloud coverage percentage', 'weather', 0, 100, '%', 'api', 30),
  ('SUNRISE_SUNSET_TIME', 'Sunrise/Sunset', 'Minutes to/from sunrise/sunset', 'weather', -720, 720, 'minutes', 'calendar', 1440),
  
  -- Seasonality & Events
  ('MONTH_NUMBER', 'Month', 'Month 1-12', 'seasonal', 1, 12, 'month', 'system', 1440),
  ('DAYS_TO_CHRISTMAS', 'Days to Christmas', 'Days until Christmas', 'seasonal', 0, 365, 'days', 'calendar', 1440),
  ('SCHOOL_HOLIDAY_STATUS', 'School Holidays', '0=School, 1=Holiday, 2=Vacation', 'seasonal', 0, 2, '0-2', 'calendar', 1440),
  ('LOCAL_EVENTS_TODAY', 'Local Events', 'Count of local events', 'seasonal', 0, 10, 'count', 'api', 1440),
  ('CARNIVAL_DAYS', 'Carnival Days', 'Days to/from Carnival', 'seasonal', -90, 275, 'days', 'calendar', 1440),
  ('BLACK_FRIDAY_STATUS', 'Black Friday', 'Days to/from Black Friday', 'seasonal', 0, 365, 'days', 'calendar', 1440),
  ('PROFESSIONAL_EVENT_STATUS', 'Professional Events', 'B2B events affecting area', 'seasonal', 0, 5, 'count', 'api', 1440),
  
  -- Economic
  ('CONSUMER_CONFIDENCE_INDEX', 'Consumer Confidence', 'National sentiment index', 'economic', 0, 200, '0-200', 'api', 1440),
  ('UNEMPLOYMENT_RATE', 'Unemployment Rate', 'Regional unemployment percentage', 'economic', 0, 30, '%', 'api', 10080),
  ('INFLATION_RATE', 'Inflation Rate', 'Monthly inflation percentage', 'economic', 0, 10, '%', 'api', 10080),
  ('INTEREST_RATE', 'Interest Rate', 'Central bank interest rate', 'economic', 0, 30, '%', 'api', 10080),
  ('CURRENCY_EXCHANGE', 'BRL/USD Rate', 'Currency exchange rate', 'economic', 1, 10, 'BRL/USD', 'api', 60),
  ('STOCK_MARKET_PERFORMANCE', 'IBOVESPA Change', 'Stock market % change', 'economic', -10, 10, '%', 'api', 60),
  ('FUEL_PRICE_INDEX', 'Fuel Price Index', 'Gasoline price change', 'economic', -10, 20, '%', 'api', 1440),
  
  -- Competitor & Market
  ('NEAREST_COMPETITOR_PROMOTION', 'Competitor Promo', 'Competitor running promotion', 'competitor', 0, 1, 'binary', 'scraper', 120),
  ('COMPETITOR_PRICE_INDEX', 'Competitor Prices', 'Price difference vs competitors', 'competitor', -20, 20, '%', 'scraper', 120),
  ('MARKET_SHARE_TREND', 'Market Share', 'Our market share trend', 'competitor', 0, 100, '%', 'analysis', 1440),
  ('REGIONAL_SALES_TREND', 'Regional Sales', 'Total retail sales trend', 'competitor', -20, 20, '%', 'analysis', 1440),
  ('COMPETITOR_SOCIAL_BUZZ', 'Competitor Mentions', 'Social media mentions of competitors', 'competitor', 0, 500, 'count', 'api', 240),
  
  -- Product & Inventory
  ('OUT_OF_STOCK_ITEMS', 'Stockouts', 'Count of out-of-stock high-demand items', 'inventory', 0, 100, 'count', 'database', 30),
  ('NEW_PRODUCT_LAUNCHES', 'New SKUs', 'New products this week', 'inventory', 0, 20, 'count', 'database', 1440),
  ('PRODUCT_RECALL_ACTIVE', 'Product Recall', 'Active product recall', 'inventory', 0, 1, 'binary', 'database', 1440),
  ('EXPIRED_STOCK_PERCENTAGE', 'Expired Stock', 'Stock expiring within 7 days', 'inventory', 0, 100, '%', 'database', 240),
  ('HIGH_MARGIN_ITEMS_STOCK', 'High Margin Stock', 'High margin items in stock', 'inventory', 0, 1, 'binary', 'database', 120),
  ('SEASONAL_PRODUCT_AVAILABILITY', 'Seasonal Items', 'Seasonal product availability', 'inventory', 0, 100, '%', 'database', 240),
  ('SUPPLIER_DELIVERY_DELAY', 'Delivery Delay', 'Days delayed vs expected', 'inventory', 0, 30, 'days', 'database', 1440),
  
  -- Social & Digital
  ('SOCIAL_MEDIA_MENTIONS', 'Social Mentions', 'Daily social media mentions', 'social', 0, 1000, 'count', 'api', 240),
  ('SENTIMENT_SCORE', 'Sentiment', 'Social sentiment score', 'social', -100, 100, 'points', 'nlp', 240),
  ('GOOGLE_SEARCH_TREND', 'Google Trend', 'Search volume trend', 'social', -100, 500, '%', 'api', 240),
  ('TIKTOK_VIRAL_PRODUCT', 'TikTok Viral', 'Trending product on TikTok', 'social', 0, 1, 'binary', 'api', 60),
  ('INFLUENCER_MENTIONS', 'Influencer Posts', 'Influencer mentions of store', 'social', 0, 50, 'count', 'api', 120),
  ('REVIEW_SCORE_CHANGE', 'Review Change', 'Net new review sentiment', 'social', -100, 100, 'points', 'api', 240),
  
  -- Operational & Staffing
  ('STAFF_AVAILABILITY', 'Staff %', 'Percentage of staff present', 'operations', 0, 100, '%', 'database', 60),
  ('REGISTER_WAIT_TIME', 'Wait Time', 'Checkout queue length', 'operations', 0, 30, 'minutes', 'database', 15),
  ('SHELF_RESTOCKING_STATUS', 'Shelf Stock', 'Shelves fully stocked', 'operations', 0, 100, '%', 'audit', 120),
  ('STORE_TEMPERATURE_CONTROL', 'Temp Control', 'HVAC temperature variance', 'operations', 0, 10, '°C', 'database', 30),
  
  -- External
  ('NEWS_SENTIMENT', 'News Sentiment', 'News about retail/economy', 'external', -100, 100, 'points', 'api', 1440),
  ('TRAFFIC_CONGESTION_INDEX', 'Traffic Index', 'Road congestion affecting access', 'external', 0, 100, '0-100', 'api', 30);

-- Variable Correlations Table
-- Tracks discovered relationships between variables and sales

CREATE TABLE IF NOT EXISTS variable_correlations (
  id BIGSERIAL PRIMARY KEY,
  loja_id TEXT NOT NULL,
  variable1_code TEXT NOT NULL,
  variable2_code TEXT,                   -- NULL if correlation with sales
  correlation_coefficient NUMERIC(5,4),  -- Pearson correlation
  lag_hours INTEGER,                     -- Hours of lag
  confidence_score NUMERIC(5,4),         -- 0-1 confidence
  observations_count INTEGER,
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (variable1_code) REFERENCES variable_metadata(variable_code),
  INDEX idx_corr_loja (loja_id),
  INDEX idx_corr_score (confidence_score DESC)
);

-- Scraper Logs Table
-- Track scraper execution and errors

CREATE TABLE IF NOT EXISTS scraper_logs (
  id BIGSERIAL PRIMARY KEY,
  scraper_name TEXT,
  source_api TEXT,
  status TEXT,                          -- success, partial, error
  variables_collected INTEGER,
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_scraper_logs_time (executed_at DESC),
  INDEX idx_scraper_logs_status (status)
);
