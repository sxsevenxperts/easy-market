-- =============================================================================
-- EASY MARKET - MASTER MIGRATION FILE
-- =============================================================================
-- Execute este arquivo no Supabase SQL Editor para rodar todas as migrations.
-- As migrations devem ser executadas NA ORDEM listada abaixo.
-- Cada migration é idempotente (usa IF NOT EXISTS / CREATE OR REPLACE),
-- portanto pode ser re-executada com segurança.
--
-- Ordem de execução:
--   1. 001 a 010 — migrations base (executadas anteriormente)
--   2. 011_rfm_scoring        — tabelas de score RFM de clientes
--   3. 012_anomaly_detection  — tabelas de anomalias e controle de vencimento
--   4. 013_alertas_update     — tabela de alertas e triggers de updated_at
-- =============================================================================


-- =============================================================================
-- MIGRATION 011: RFM SCORING
-- Cria as tabelas rfm_scores e rfm_historico para segmentação de clientes
-- com base em Recência, Frequência, Monetário, Fidelidade e Engajamento.
-- =============================================================================

-- RFM Scores table
CREATE TABLE IF NOT EXISTS rfm_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id VARCHAR(50) NOT NULL,
  cliente_id VARCHAR(50) NOT NULL,
  score_recencia INTEGER NOT NULL CHECK (score_recencia BETWEEN 1 AND 5),
  score_frequencia INTEGER NOT NULL CHECK (score_frequencia BETWEEN 1 AND 5),
  score_monetario INTEGER NOT NULL CHECK (score_monetario BETWEEN 1 AND 5),
  score_fidelidade INTEGER NOT NULL CHECK (score_fidelidade BETWEEN 1 AND 5),
  score_engajamento INTEGER NOT NULL CHECK (score_engajamento BETWEEN 1 AND 5),
  score_final DECIMAL(5,2) NOT NULL,
  segmento VARCHAR(50) NOT NULL,
  dias_desde_ultima_compra INTEGER,
  total_compras INTEGER,
  ticket_medio DECIMAL(10,2),
  meses_como_cliente INTEGER,
  categorias_distintas INTEGER,
  calculado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfm_loja ON rfm_scores(loja_id);
CREATE INDEX IF NOT EXISTS idx_rfm_cliente ON rfm_scores(cliente_id);
CREATE INDEX IF NOT EXISTS idx_rfm_segmento ON rfm_scores(segmento);
CREATE INDEX IF NOT EXISTS idx_rfm_score ON rfm_scores(score_final DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rfm_loja_cliente ON rfm_scores(loja_id, cliente_id);

-- RFM History (track changes over time)
CREATE TABLE IF NOT EXISTS rfm_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfm_score_id UUID REFERENCES rfm_scores(id),
  loja_id VARCHAR(50) NOT NULL,
  cliente_id VARCHAR(50) NOT NULL,
  segmento_anterior VARCHAR(50),
  segmento_novo VARCHAR(50) NOT NULL,
  score_anterior DECIMAL(5,2),
  score_novo DECIMAL(5,2) NOT NULL,
  mudou_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfm_hist_cliente ON rfm_historico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_rfm_hist_loja ON rfm_historico(loja_id);


-- =============================================================================
-- MIGRATION 012: ANOMALY DETECTION
-- Cria a tabela anomalias para registro de anomalias detectadas automaticamente
-- (peso discrepante, venda anômala, estoque mínimo, etc.) e a tabela
-- estoque_vencimento para rastreamento de produtos com data de validade.
-- =============================================================================

-- Anomalies table
CREATE TABLE IF NOT EXISTS anomalias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id VARCHAR(50) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('peso_discrepante','venda_anomala','estoque_minimo','produto_vencendo','perda_suspeita')),
  severidade VARCHAR(20) NOT NULL CHECK (severidade IN ('critica','alta','media','baixa')),
  produto_id VARCHAR(50),
  categoria VARCHAR(100),
  descricao TEXT,
  dados_json JSONB DEFAULT '{}',
  valor_esperado DECIMAL(10,3),
  valor_detectado DECIMAL(10,3),
  diferenca_percentual DECIMAL(6,2),
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta','em_analise','resolvida','falso_positivo')),
  resolvido_por VARCHAR(100),
  resolvido_em TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalias_loja ON anomalias(loja_id);
CREATE INDEX IF NOT EXISTS idx_anomalias_tipo ON anomalias(tipo);
CREATE INDEX IF NOT EXISTS idx_anomalias_severidade ON anomalias(severidade);
CREATE INDEX IF NOT EXISTS idx_anomalias_status ON anomalias(status);
CREATE INDEX IF NOT EXISTS idx_anomalias_created ON anomalias(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalias_produto ON anomalias(produto_id);

-- Products with expiry tracking
CREATE TABLE IF NOT EXISTS estoque_vencimento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id VARCHAR(50) NOT NULL,
  produto_id VARCHAR(50) NOT NULL,
  nome_produto VARCHAR(200),
  quantidade INTEGER NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  lote VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venc_loja ON estoque_vencimento(loja_id);
CREATE INDEX IF NOT EXISTS idx_venc_data ON estoque_vencimento(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_venc_produto ON estoque_vencimento(produto_id);


-- =============================================================================
-- MIGRATION 013: ALERTAS UPDATE
-- Cria a tabela alertas (versão completa com campos de ROI e resolução)
-- e os triggers de auto-atualização do campo updated_at para rfm_scores,
-- anomalias e alertas.
-- =============================================================================

-- Alertas table (full version)
CREATE TABLE IF NOT EXISTS alertas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id VARCHAR(50) NOT NULL,
  sku VARCHAR(50),
  categoria VARCHAR(100),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('desperdicio','falta_estoque','preco_anormal','vencimento_proximo','anomalia_peso','rfm_alerta')),
  urgencia VARCHAR(20) DEFAULT 'media' CHECK (urgencia IN ('alta','media','baixa')),
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT,
  dados_json JSONB DEFAULT '{}',
  roi_estimado DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto','em_acao','resolvido')),
  resolucao_sugerida TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_loja ON alertas(loja_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_urgencia ON alertas(urgencia);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas(status);
CREATE INDEX IF NOT EXISTS idx_alertas_created ON alertas(created_at DESC);

-- Triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_rfm_scores_updated_at ON rfm_scores;
CREATE TRIGGER update_rfm_scores_updated_at
  BEFORE UPDATE ON rfm_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_anomalias_updated_at ON anomalias;
CREATE TRIGGER update_anomalias_updated_at
  BEFORE UPDATE ON anomalias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alertas_updated_at ON alertas;
CREATE TRIGGER update_alertas_updated_at
  BEFORE UPDATE ON alertas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- END OF MIGRATIONS
-- =============================================================================
