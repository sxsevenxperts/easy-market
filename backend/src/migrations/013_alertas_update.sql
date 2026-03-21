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
