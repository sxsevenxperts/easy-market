-- Adicionar colunas nutricionais à tabela produtos
-- Suporta otimização estratégica baseada em perfil nutricional

ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS percentual_gordura DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentual_proteina DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentual_carboidrato DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS calorias_por_100g DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sodio_mg_por_100g DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS acucar_por_100g DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fibra_por_100g DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS colesterol_mg_por_100g DECIMAL(8,2) DEFAULT 0;

-- Criar índices para queries de otimização nutricional
CREATE INDEX IF NOT EXISTS idx_produtos_percentual_gordura ON produtos(percentual_gordura);
CREATE INDEX IF NOT EXISTS idx_produtos_percentual_proteina ON produtos(percentual_proteina);
CREATE INDEX IF NOT EXISTS idx_produtos_calorias ON produtos(calorias_por_100g);
CREATE INDEX IF NOT EXISTS idx_produtos_sodio ON produtos(sodio_mg_por_100g);
CREATE INDEX IF NOT EXISTS idx_produtos_acucar ON produtos(acucar_por_100g);

-- Criar tabela de perfil nutricional da loja (cache)
-- Evita recalcular constantemente
CREATE TABLE IF NOT EXISTS perfil_nutricional_loja (
  id SERIAL PRIMARY KEY,
  loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  data_calculo TIMESTAMP DEFAULT NOW(),
  
  -- Contadores por categoria gordura
  produtos_muito_baixa_gordura INTEGER DEFAULT 0,
  produtos_baixa_gordura INTEGER DEFAULT 0,
  produtos_gordura_moderada INTEGER DEFAULT 0,
  produtos_alta_gordura INTEGER DEFAULT 0,
  produtos_muito_alta_gordura INTEGER DEFAULT 0,
  
  -- Estatísticas
  receita_health_conscious DECIMAL(12,2) DEFAULT 0,
  receita_indulgence DECIMAL(12,2) DEFAULT 0,
  receita_balanced DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(loja_id, DATE(data_calculo))
);

CREATE INDEX IF NOT EXISTS idx_perfil_nutricional_loja_id ON perfil_nutricional_loja(loja_id);
CREATE INDEX IF NOT EXISTS idx_perfil_nutricional_data ON perfil_nutricional_loja(data_calculo);

-- Criar tabela de recomendações de posicionamento nutricional
CREATE TABLE IF NOT EXISTS recomendacoes_nutricional (
  id SERIAL PRIMARY KEY,
  loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  
  tipo_recomendacao VARCHAR(50) NOT NULL, -- 'AUMENTAR_PRECO', 'REDUZIR_PRECO', 'COMBO', 'REPOSICIONAR'
  localizacao_sugerida VARCHAR(100),
  motivo TEXT,
  impacto_estimado VARCHAR(100),
  
  -- Nutricionais
  categoria_gordura VARCHAR(50),
  categoria_caloria VARCHAR(50),
  perfil_consumidor VARCHAR(50), -- 'HEALTH_CONSCIOUS', 'INDULGENCE', 'BALANCED', etc
  
  -- Implementação
  data_recomendacao TIMESTAMP DEFAULT NOW(),
  implementada BOOLEAN DEFAULT FALSE,
  data_implementacao TIMESTAMP,
  feedback_resultado TEXT,
  
  UNIQUE(loja_id, produto_id, tipo_recomendacao)
);

CREATE INDEX IF NOT EXISTS idx_recomendacoes_loja_id ON recomendacoes_nutricional(loja_id);
CREATE INDEX IF NOT EXISTS idx_recomendacoes_produto_id ON recomendacoes_nutricional(produto_id);
CREATE INDEX IF NOT EXISTS idx_recomendacoes_perfil ON recomendacoes_nutricional(perfil_consumidor);
