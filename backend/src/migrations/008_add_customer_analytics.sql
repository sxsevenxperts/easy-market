-- Tabela de clientes com análise de fidelidade e LTV
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  cliente_id VARCHAR(255) NOT NULL,
  nome VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),

  -- Fidelidade
  total_compras INT DEFAULT 0,
  primeira_compra TIMESTAMP,
  ultima_compra TIMESTAMP,
  dias_desde_ultima_compra INT,
  frequencia_compras_dias DECIMAL(5, 2),
  taxa_fidelidade_percentual DECIMAL(5, 2) DEFAULT 0,

  -- LTV (Lifetime Value)
  valor_total_gasto DECIMAL(12, 2) DEFAULT 0,
  ticket_medio DECIMAL(10, 2) DEFAULT 0,
  ltv_estimado DECIMAL(12, 2) DEFAULT 0,

  -- Segmentação
  status VARCHAR(50) DEFAULT 'ativo', -- ativo, inativo, churn
  categoria_cliente VARCHAR(50), -- VIP, regular, novo

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(loja_id, cliente_id)
);

-- Índices para performance
CREATE INDEX idx_clientes_loja ON clientes(loja_id);
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_categoria ON clientes(categoria_cliente);

-- View para resumo de fidelidade por loja
CREATE OR REPLACE VIEW v_resumo_fidelidade AS
SELECT
  loja_id,
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) as clientes_ativos,
  COUNT(CASE WHEN status = 'inativo' THEN 1 END) as clientes_inativos,
  COUNT(CASE WHEN status = 'churn' THEN 1 END) as clientes_churn,
  COUNT(CASE WHEN categoria_cliente = 'VIP' THEN 1 END) as clientes_vip,
  ROUND(AVG(taxa_fidelidade_percentual)::NUMERIC, 2) as taxa_fidelidade_media,
  SUM(ltv_estimado) as ltv_total,
  ROUND(AVG(ltv_estimado)::NUMERIC, 2) as ltv_medio
FROM clientes
GROUP BY loja_id;
