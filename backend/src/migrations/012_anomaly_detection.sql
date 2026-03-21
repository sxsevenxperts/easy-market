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
