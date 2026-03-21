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
