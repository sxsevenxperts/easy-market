-- Adicionar coluna de taxa de segurança customizável por produto
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS taxa_seguranca_customizada DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS observacoes_seguranca TEXT;

-- Criar tabela de configuração de segurança por loja
CREATE TABLE IF NOT EXISTS configuracao_seguranca_loja (
  id SERIAL PRIMARY KEY,
  loja_id INTEGER NOT NULL UNIQUE REFERENCES lojas(id) ON DELETE CASCADE,
  
  -- Taxa de segurança padrão para a loja (será usada se produto não tiver customização)
  taxa_seguranca_padrao DECIMAL(4,2) DEFAULT 0.15,
  
  -- Customizações por categoria (override do padrão)
  taxa_bebidas DECIMAL(4,2),
  taxa_alimentos_pereciveis DECIMAL(4,2),
  taxa_alimentos_nao_pereciveis DECIMAL(4,2),
  taxa_higiene_limpeza DECIMAL(4,2),
  taxa_eletronicos DECIMAL(4,2),
  taxa_outros DECIMAL(4,2),
  
  -- Politica de segurança
  politica_risco_aceitavel VARCHAR(50) DEFAULT 'BALANCEADO', -- CONSERVADOR, BALANCEADO, AGRESSIVO
  considerar_sazonalidade BOOLEAN DEFAULT TRUE,
  considerar_perecibilidade BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  criada_em TIMESTAMP DEFAULT NOW(),
  atualizada_em TIMESTAMP DEFAULT NOW(),
  atualizada_por VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_config_seguranca_loja_id ON configuracao_seguranca_loja(loja_id);

-- Criar tabela de histórico de taxas aplicadas (auditoria)
CREATE TABLE IF NOT EXISTS historico_taxa_seguranca (
  id SERIAL PRIMARY KEY,
  loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
  
  taxa_aplicada DECIMAL(4,2) NOT NULL,
  quantidade_pedida INTEGER,
  data_pedido TIMESTAMP DEFAULT NOW(),
  
  -- Resultado
  quantidade_recebida INTEGER,
  quantidade_perdida INTEGER,
  receita_gerada DECIMAL(12,2),
  
  -- Feedback
  resultado_esperado_vs_real TEXT,
  
  criada_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_loja_produto ON historico_taxa_seguranca(loja_id, produto_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_taxa_seguranca(data_pedido);

-- Criar view para análise de efetividade de taxas
CREATE OR REPLACE VIEW analise_taxa_seguranca AS
SELECT 
  hts.loja_id,
  hts.produto_id,
  p.nome as produto_nome,
  p.categoria,
  ROUND(AVG(hts.taxa_aplicada) * 100, 1) as taxa_media_aplicada,
  COUNT(hts.id) as quantidade_pedidos,
  
  -- Análise de efetividade
  CASE 
    WHEN COUNT(CASE WHEN hts.quantidade_perdida > 0 THEN 1 END)::FLOAT / COUNT(*) > 0.3 THEN 'TAXA_BAIXA'
    WHEN COUNT(CASE WHEN hts.quantidade_recebida > hts.quantidade_pedida * 1.3 THEN 1 END)::FLOAT / COUNT(*) > 0.4 THEN 'TAXA_MUITO_ALTA'
    ELSE 'OTIMA'
  END as efetividade,
  
  -- Métricas
  ROUND(AVG(hts.quantidade_perdida), 1) as perda_media_unidades,
  ROUND(AVG(hts.receita_gerada), 2) as receita_media,
  
  MAX(hts.data_pedido) as ultimo_pedido
  
FROM historico_taxa_seguranca hts
LEFT JOIN produtos p ON hts.produto_id = p.id
GROUP BY hts.loja_id, hts.produto_id, p.nome, p.categoria;

-- Inserir configuração padrão para novas lojas (se não existir)
INSERT INTO configuracao_seguranca_loja (loja_id, taxa_seguranca_padrao, politica_risco_aceitavel)
SELECT l.id, 0.15, 'BALANCEADO'
FROM lojas l
WHERE NOT EXISTS (
  SELECT 1 FROM configuracao_seguranca_loja csl WHERE csl.loja_id = l.id
);
