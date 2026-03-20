-- Easy Market Database Initialization
-- TimescaleDB for time-series data

-- ============================================
-- Enable Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" CASCADE;

-- ============================================
-- 1. LOJAS (Stores)
-- ============================================
CREATE TABLE lojas (
  loja_id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  municipio TEXT NOT NULL,
  estado TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  fuso_horario TEXT DEFAULT 'America/Fortaleza',
  
  -- Integração
  integrado_pdv BOOLEAN DEFAULT FALSE,
  pdv_tipo TEXT, -- 'linx', 'totvs', 'nex'
  pdv_api_key TEXT,
  
  integrado_balanca BOOLEAN DEFAULT FALSE,
  balanca_tipo TEXT, -- 'toledo', 'filizola'
  balanca_ip TEXT,
  balanca_porta INT,
  
  -- Status
  status TEXT DEFAULT 'ativo', -- 'ativo', 'inativo', 'trial'
  data_inicio TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lojas_municipio ON lojas(municipio, estado);
CREATE INDEX idx_lojas_status ON lojas(status);

-- ============================================
-- 2. PRODUTOS (Products)
-- ============================================
CREATE TABLE produtos (
  sku TEXT NOT NULL,
  loja_id TEXT NOT NULL REFERENCES lojas(loja_id) ON DELETE CASCADE,
  
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  
  -- Preços e margens
  preco_custo NUMERIC(10, 2),
  preco_venda NUMERIC(10, 2),
  margem_lucro NUMERIC(5, 2), -- percentual
  
  -- Estoque
  estoque_atual INT DEFAULT 0,
  estoque_minimo INT DEFAULT 5,
  estoque_maximo INT DEFAULT 100,
  
  -- Perecíveis
  eh_perecivel BOOLEAN DEFAULT FALSE,
  data_vencimento DATE,
  velocidade_media_saida NUMERIC(10, 2), -- unidades/dia (calculado)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (sku, loja_id)
);

CREATE INDEX idx_produtos_loja_categoria ON produtos(loja_id, categoria);
CREATE INDEX idx_produtos_vencimento ON produtos(loja_id, data_vencimento) 
  WHERE eh_perecivel = TRUE;

-- ============================================
-- 3. VENDAS (Sales) - HYPERTABLE
-- ============================================
CREATE TABLE vendas (
  time TIMESTAMPTZ NOT NULL,
  loja_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  
  -- Produto info
  categoria TEXT,
  subcategoria TEXT,
  nome_produto TEXT,
  
  -- Transação
  quantidade INT NOT NULL,
  preco_unitario NUMERIC(10, 2),
  preco_total NUMERIC(12, 2),
  desconto_percentual NUMERIC(5, 2),
  
  -- Contexto climático
  temperatura NUMERIC(5, 2),
  umidade_relativa NUMERIC(5, 2),
  precipitacao NUMERIC(10, 2),
  condicao_clima TEXT, -- 'ensolarado', 'nublado', 'chuva', 'tempestade'
  
  -- Contexto temporal
  is_feriado BOOLEAN DEFAULT FALSE,
  tipo_feriado TEXT, -- 'nacional', 'estadual', 'municipal'
  evento_local TEXT,
  evento_esportivo TEXT,
  eh_fim_de_semana BOOLEAN,
  
  PRIMARY KEY (time, loja_id, sku)
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable(
  'vendas', 
  'time',
  if_not_exists => TRUE,
  time_column_name => 'time'
);

-- Compression policy (compress chunks > 1 week old)
ALTER TABLE vendas SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'loja_id,categoria',
  timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('vendas', INTERVAL '1 week', if_not_exists => TRUE);

-- Retention policy (keep 2 years of data)
SELECT add_retention_policy('vendas', INTERVAL '2 years', if_not_exists => TRUE);

-- Indexes
CREATE INDEX idx_vendas_loja_time ON vendas (loja_id, time DESC);
CREATE INDEX idx_vendas_categoria_time ON vendas (categoria, time DESC);
CREATE INDEX idx_vendas_sku_time ON vendas (sku, time DESC);
CREATE INDEX idx_vendas_feriado ON vendas (is_feriado, time DESC);

-- ============================================
-- 4. EVENTOS E FESTIVIDADES
-- ============================================
CREATE TABLE calendario_eventos (
  id SERIAL PRIMARY KEY,
  
  -- Localização
  loja_id TEXT REFERENCES lojas(loja_id) ON DELETE CASCADE,
  municipio TEXT NOT NULL,
  estado TEXT NOT NULL,
  
  -- Evento
  data_inicio DATE NOT NULL,
  data_fim DATE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL, -- 'feriado_nacional', 'festa_junina', 'santo_padroeiro', etc
  
  -- Impacto
  nivel_impacto TEXT, -- 'alto', 'médio', 'baixo'
  impacto_percentual INT DEFAULT 0,
  categorias_afetadas JSONB DEFAULT '{}', -- {"Bebidas": 50, "Carnes": -20}
  
  -- Configurações
  is_feriado_ponto BOOLEAN DEFAULT FALSE,
  fecha_loja BOOLEAN DEFAULT FALSE,
  horario_funcionamento_especial TEXT,
  
  -- Rastreabilidade
  fonte TEXT, -- 'ibge', 'google_calendar', 'wikipedia', 'manual'
  url_fonte TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX idx_calendario_loja_data ON calendario_eventos(loja_id, data_inicio);
CREATE INDEX idx_calendario_municipio ON calendario_eventos(municipio, estado);
CREATE INDEX idx_calendario_tipo ON calendario_eventos(tipo);

-- ============================================
-- 5. ALERTAS (Desperdício Zero + Previsão)
-- ============================================
CREATE TABLE alertas (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL REFERENCES lojas(loja_id) ON DELETE CASCADE,
  sku TEXT,
  categoria TEXT,
  
  -- Tipo de alerta
  tipo TEXT NOT NULL, -- 'desperdicio', 'falta_estoque', 'preco_anormal', 'falta_previsao'
  urgencia TEXT, -- 'alta', 'média', 'baixa'
  
  -- Conteúdo
  titulo TEXT NOT NULL,
  mensagem TEXT,
  dados_json JSONB, -- dados adicionais para contexto
  
  -- Status
  status TEXT DEFAULT 'aberto', -- 'aberto', 'em_acao', 'resolvido'
  resolucao_sugerida TEXT,
  
  -- Recomendação automática
  recomendacao_acao TEXT, -- 'aumentar_estoque_20%', 'promo_25%', etc
  roi_estimado NUMERIC(12, 2), -- valor economizado em R$
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_alertas_loja_status ON alertas(loja_id, status);
CREATE INDEX idx_alertas_created ON alertas(created_at DESC);
CREATE INDEX idx_alertas_urgencia ON alertas(urgencia, status);

-- ============================================
-- 6. PREVISÕES (Forecast Cache)
-- ============================================
CREATE TABLE previsoes (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL REFERENCES lojas(loja_id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  
  -- Período de previsão
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  
  -- Dados da previsão
  modelo TEXT NOT NULL, -- 'prophet', 'xgboost', 'ensemble', etc
  quantidade_esperada NUMERIC(10, 2),
  quantidade_lower NUMERIC(10, 2),
  quantidade_upper NUMERIC(10, 2),
  confianca_percentual INT,
  
  -- Metadados
  accuracy_rmse NUMERIC(10, 4),
  accuracy_mape NUMERIC(5, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_previsoes_loja_categoria ON previsoes(loja_id, categoria);
CREATE INDEX idx_previsoes_data ON previsoes(data_inicio, data_fim);

-- ============================================
-- 7. CONFIGURAÇÕES DO SISTEMA
-- ============================================
CREATE TABLE configuracoes_loja (
  id SERIAL PRIMARY KEY,
  loja_id TEXT NOT NULL UNIQUE REFERENCES lojas(loja_id) ON DELETE CASCADE,
  
  -- Motor preditivo
  dias_historico_minimo INT DEFAULT 30,
  confianca_minima_previsao INT DEFAULT 80,
  
  -- Alertas
  habilitar_alertas_desperdicio BOOLEAN DEFAULT TRUE,
  dias_antes_vencimento_alerta INT DEFAULT 3,
  margem_estoque_seguro NUMERIC(5, 2) DEFAULT 1.5, -- 50% acima da média
  
  -- Notificações
  canal_notificacao TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'sms'
  telefone_gerente TEXT,
  email_gerente TEXT,
  
  -- Integração
  webhook_url TEXT,
  api_key TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_config_loja ON configuracoes_loja(loja_id);

-- ============================================
-- 8. HISTÓRICO DE AÇÕES (Audit)
-- ============================================
CREATE TABLE historico_acoes (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT REFERENCES lojas(loja_id) ON DELETE CASCADE,
  usuario_id TEXT,
  
  acao TEXT NOT NULL, -- 'aplicou_promo', 'aumentou_estoque', 'criou_alerta'
  categoria TEXT,
  sku TEXT,
  
  detalhes_json JSONB,
  resultado TEXT, -- 'sucesso', 'erro', 'pendente'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historico_loja_data ON historico_acoes(loja_id, created_at DESC);
CREATE INDEX idx_historico_acao ON historico_acoes(acao);

-- ============================================
-- 9. CORRELAÇÕES CLIMA-DEMANDA (Análise)
-- ============================================
CREATE TABLE correlacao_clima_demanda (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL REFERENCES lojas(loja_id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  
  -- Correlações calculadas
  corr_temperatura NUMERIC(5, 3),
  corr_precipitacao NUMERIC(5, 3),
  corr_umidade NUMERIC(5, 3),
  
  -- Padrões descobertos
  padroes_json JSONB, -- {"chuva_sabado": +25, "calor_sorvete": +40}
  
  -- Qualidade da análise
  amostras_usadas INT,
  data_calculo DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_corr_loja_categoria ON correlacao_clima_demanda(loja_id, categoria);

-- ============================================
-- 10. MATRIZ DE CALOR (Consumo por Hora/Dia)
-- ============================================
CREATE TABLE matriz_calor (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL REFERENCES lojas(loja_id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  
  hora INT NOT NULL (0-23),
  dia_semana INT NOT NULL (0-6), -- 0=segunda, 6=domingo
  
  -- Consumo médio
  quantidade_media NUMERIC(10, 2),
  quantidade_p25 NUMERIC(10, 2),
  quantidade_p50 NUMERIC(10, 2),
  quantidade_p75 NUMERIC(10, 2),
  quantidade_p95 NUMERIC(10, 2),
  
  amostras INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (loja_id, categoria, hora, dia_semana)
);

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Alertas Críticos
CREATE VIEW alertas_criticos AS
SELECT 
  a.id,
  a.loja_id,
  a.tipo,
  a.titulo,
  a.mensagem,
  a.urgencia,
  a.roi_estimado,
  l.nome as loja_nome,
  l.municipio,
  a.created_at
FROM alertas a
JOIN lojas l ON a.loja_id = l.loja_id
WHERE a.status = 'aberto' 
  AND a.urgencia IN ('alta', 'média')
ORDER BY a.created_at DESC;

-- View: Previsões para Próximas 24h
CREATE VIEW previsoes_24h AS
SELECT 
  p.loja_id,
  p.categoria,
  p.quantidade_esperada,
  p.quantidade_lower,
  p.quantidade_upper,
  p.confianca_percentual,
  p.data_inicio,
  l.nome as loja_nome
FROM previsoes p
JOIN lojas l ON p.loja_id = l.loja_id
WHERE p.data_inicio >= NOW()
  AND p.data_inicio <= NOW() + INTERVAL '24 hours'
  AND p.confianca_percentual >= 80
ORDER BY p.data_inicio;

-- View: Produtos em Risco de Desperdício
CREATE VIEW produtos_risco_desperdicio AS
SELECT 
  p.sku,
  p.loja_id,
  p.nome,
  p.categoria,
  p.estoque_atual,
  p.data_vencimento,
  p.velocidade_media_saida,
  (p.data_vencimento - NOW()::DATE) as dias_para_vencer,
  CASE 
    WHEN (p.data_vencimento - NOW()::DATE) <= 0 THEN 'EXPIRADO'
    WHEN (p.data_vencimento - NOW()::DATE) <= 2 THEN 'CRÍTICO'
    WHEN (p.data_vencimento - NOW()::DATE) <= 5 THEN 'ALTO'
    ELSE 'NORMAL'
  END as risco,
  ROUND(p.estoque_atual / NULLIF(p.velocidade_media_saida, 0), 1) as dias_estoque
FROM produtos p
WHERE p.eh_perecivel = TRUE
  AND p.estoque_atual > 0
  AND p.data_vencimento IS NOT NULL
ORDER BY p.data_vencimento;

-- ============================================
-- Grants (se necessário)
-- ============================================
-- GRANT CONNECT ON DATABASE easy_market TO app_user;
-- GRANT USAGE ON SCHEMA public TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
