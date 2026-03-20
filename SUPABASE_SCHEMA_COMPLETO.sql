-- ============================================
-- SCHEMA COMPLETO PARA ANÁLISE PREDITIVA
-- ============================================

-- Tabelas Base (já existem)
-- lojas, inventario, vendas, alertas, notificacoes, etc

-- ============================================
-- NOVAS TABELAS PARA ANÁLISE PREDITIVA
-- ============================================

-- 1. VARIÁVEIS CLIMÁTICAS
CREATE TABLE IF NOT EXISTS clima (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  data_hora TIMESTAMP NOT NULL,
  temperatura DECIMAL(5, 2),        -- Graus Celsius
  chuva BOOLEAN DEFAULT false,      -- Chovendo?
  umidade DECIMAL(5, 2),            -- % Umidade
  pressao DECIMAL(7, 2),            -- mb
  indice_uv DECIMAL(3, 1),          -- 0-11+
  vento_velocidade DECIMAL(5, 2),   -- km/h
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 2. VARIÁVEIS DE LOJA (Operacional)
CREATE TABLE IF NOT EXISTS operacional_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  data_hora TIMESTAMP NOT NULL,
  num_caixas_abertos INT,           -- Quantos caixas funcionando
  tempo_medio_fila INT,             -- segundos
  temperatura_loja DECIMAL(5, 2),   -- Temperatura interna
  musica_ativa BOOLEAN,             -- Música tocando?
  fluxo_pessoas INT,                -- Pessoas dentro da loja
  tempo_medio_compra INT,           -- segundos
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 3. CAMPANHA/MARKETING
CREATE TABLE IF NOT EXISTS campanhas_ativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  tipo_campanha VARCHAR(50),        -- 'black_friday', 'promocao', 'email', 'redes_sociais'
  desconto_percentual DECIMAL(5, 2),
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,
  impacto_estimado DECIMAL(5, 2),   -- % de aumento de vendas
  ativa BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 4. EVENTOS EXTERNOS
CREATE TABLE IF NOT EXISTS eventos_externos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  data TIMESTAMP NOT NULL,
  tipo_evento VARCHAR(100),         -- 'feriado', 'evento_local', 'campeonato', 'data_comemorativa'
  descricao VARCHAR(500),
  impacto_esperado VARCHAR(20),     -- 'positivo', 'negativo', 'neutro'
  multiplicador_vendas DECIMAL(3, 2), -- 0.5 = 50% menos, 2.0 = 100% mais
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 5. PREÇOS E CONCORRÊNCIA
CREATE TABLE IF NOT EXISTS concorrencia_preco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data TIMESTAMP NOT NULL,
  preco_nosso DECIMAL(10, 2),
  preco_concorrente_a DECIMAL(10, 2),
  preco_concorrente_b DECIMAL(10, 2),
  concorrentes_abertos INT,         -- Quantos concorrentes estão abertos
  elasticidade DECIMAL(3, 2),       -- Sensibilidade ao preço (1.0 = normal)
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 6. PREVISÕES DO ML
CREATE TABLE IF NOT EXISTS previsoes_ml (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data_previsao DATE NOT NULL,      -- Qual dia está prevendo
  hora INT,                         -- 0-23
  quantidade_prevista INT,
  intervalo_min INT,                -- Intervalo de confiança
  intervalo_max INT,
  confianca DECIMAL(3, 2),          -- 0.0 - 1.0
  modelo_escolhido VARCHAR(50),     -- 'prophet', 'xgboost', 'ensemble'
  variaveis_importantes JSONB,      -- {temperatura: 0.35, dia_semana: 0.25, ...}
  recomendacoes TEXT[],             -- Array de recomendações
  realizado INT,                    -- Depois preenchido com vendas reais
  erro_percentual DECIMAL(5, 2),    -- |previsto - realizado| / realizado
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- 7. HISTÓRICO DE PROMOÇÕES
CREATE TABLE IF NOT EXISTS historico_descontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data TIMESTAMP NOT NULL,
  desconto_percentual DECIMAL(5, 2),
  preco_original DECIMAL(10, 2),
  preco_com_desconto DECIMAL(10, 2),
  quantidade_vendida INT,
  motivo VARCHAR(100),              -- 'promo', 'vencimento', 'estoque_alto'
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 8. ANÁLISE DE COMPORTAMENTO
CREATE TABLE IF NOT EXISTS comportamento_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  data TIMESTAMP NOT NULL,
  ticket_medio DECIMAL(10, 2),      -- Gasto médio por cliente
  num_transacoes INT,               -- Quantas pessoas compraram
  tempo_medio_na_loja INT,          -- segundos
  taxa_abandono_carrinho DECIMAL(5, 2), -- %
  compra_impulso_percentual DECIMAL(5, 2), -- % de impulso vs planejado
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 9. DADOS DE REPOSIÇÃO/ESTOQUE
CREATE TABLE IF NOT EXISTS reposicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data_reposicao TIMESTAMP NOT NULL,
  quantidade_reposto INT,
  dias_para_vencimento INT,         -- Quantos dias até vencer
  custo_estoque DECIMAL(10, 2),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 10. IMPACTO FINANCEIRO (Resultado da Análise)
CREATE TABLE IF NOT EXISTS impacto_financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data DATE NOT NULL,
  receita_realizada DECIMAL(12, 2),
  receita_potencial DECIMAL(12, 2), -- Se não tivesse faltado estoque
  perda_por_falta DECIMAL(12, 2),   -- Receita não gerada por falta de estoque
  desperdicio DECIMAL(12, 2),       -- Valor perdido por vencimento
  economia_por_prevencao DECIMAL(12, 2), -- O que foi economizado por ação
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_clima_loja_data ON clima(loja_id, data_hora DESC);
CREATE INDEX idx_operacional_loja_data ON operacional_loja(loja_id, data_hora DESC);
CREATE INDEX idx_campanhas_ativas ON campanhas_ativas(loja_id, ativa);
CREATE INDEX idx_eventos_data ON eventos_externos(loja_id, data);
CREATE INDEX idx_previsoes_produto_data ON previsoes_ml(loja_id, produto_id, data_previsao);
CREATE INDEX idx_historico_desconto_data ON historico_descontos(loja_id, data DESC);
CREATE INDEX idx_impacto_data ON impacto_financeiro(loja_id, data DESC);

-- ============================================
-- VIEWS PARA ANÁLISE RÁPIDA
-- ============================================

-- View: Previsão vs Realizado (para validação do ML)
CREATE OR REPLACE VIEW vw_previsao_vs_realizado AS
SELECT
  p.data_previsao,
  p.produto_id,
  p.quantidade_prevista,
  p.realizado,
  (p.realizado - p.quantidade_prevista) as diferenca,
  ROUND(
    ABS(p.realizado - p.quantidade_prevista)::NUMERIC /
    NULLIF(p.quantidade_prevista, 0) * 100, 2
  ) as erro_percentual,
  p.modelo_escolhido,
  p.confianca
FROM previsoes_ml p
WHERE p.realizado IS NOT NULL
ORDER BY p.data_previsao DESC;

-- View: Impacto Diário Total
CREATE OR REPLACE VIEW vw_impacto_diario AS
SELECT
  data,
  loja_id,
  SUM(receita_realizada) as receita_dia,
  SUM(receita_potencial) as receita_potencial_dia,
  SUM(perda_por_falta) as perda_dia,
  SUM(desperdicio) as desperdicio_dia,
  SUM(economia_por_prevencao) as economia_dia,
  ROUND(
    SUM(economia_por_prevencao)::NUMERIC /
    NULLIF(SUM(receita_realizada), 0) * 100, 2
  ) as margem_economia_percentual
FROM impacto_financeiro
GROUP BY data, loja_id
ORDER BY data DESC;

-- View: Produtos Críticos (alto risco de perda)
CREATE OR REPLACE VIEW vw_produtos_criticos AS
SELECT
  i.id,
  i.nome_produto,
  i.categoria,
  COUNT(p.id) as num_previsoes_falta,
  SUM(im.perda_por_falta) as perda_total_mes,
  SUM(im.desperdicio) as desperdicio_total_mes,
  AVG(p.confianca) as confianca_media
FROM inventario i
LEFT JOIN previsoes_ml p ON i.id = p.produto_id AND p.realizado < p.intervalo_min
LEFT JOIN impacto_financeiro im ON i.id = im.produto_id
  AND im.data >= CURRENT_DATE - INTERVAL '30 days'
WHERE p.id IS NOT NULL OR im.id IS NOT NULL
GROUP BY i.id, i.nome_produto, i.categoria
ORDER BY perda_total_mes DESC NULLS LAST;

-- ============================================
-- TRIGGER: Calcular erro de previsão quando realizado é inserido
-- ============================================

CREATE OR REPLACE FUNCTION atualizar_erro_previsao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.realizado IS NOT NULL AND OLD.realizado IS NULL THEN
    NEW.erro_percentual := ROUND(
      ABS(NEW.realizado - NEW.quantidade_prevista)::NUMERIC /
      NULLIF(NEW.quantidade_prevista, 0) * 100, 2
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_erro_previsao ON previsoes_ml;
CREATE TRIGGER trigger_erro_previsao
BEFORE UPDATE ON previsoes_ml
FOR EACH ROW
EXECUTE FUNCTION atualizar_erro_previsao();

-- ============================================
-- FUNÇÃO: Registrar impacto financeiro
-- ============================================

CREATE OR REPLACE FUNCTION registrar_impacto(
  p_loja_id UUID,
  p_produto_id UUID,
  p_data DATE,
  p_receita_realizada DECIMAL,
  p_receita_potencial DECIMAL,
  p_desperdicio DECIMAL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO impacto_financeiro (
    loja_id, produto_id, data,
    receita_realizada, receita_potencial, desperdicio,
    perda_por_falta, economia_por_prevencao
  ) VALUES (
    p_loja_id, p_produto_id, p_data,
    p_receita_realizada, p_receita_potencial, p_desperdicio,
    (p_receita_potencial - p_receita_realizada),
    GREATEST(0, p_receita_potencial - p_receita_realizada - p_desperdicio)
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DADOS DE EXEMPLO (comentado)
-- ============================================

-- INSERT INTO eventos_externos (loja_id, data, tipo_evento, descricao, impacto_esperado, multiplicador_vendas)
-- VALUES
--   (current_setting('app.loja_id')::uuid, '2026-03-21', 'feriado', 'Corpus Christi', 'negativo', 0.5),
--   (current_setting('app.loja_id')::uuid, '2026-04-13', 'data_comemorativa', 'Páscoa', 'positivo', 1.5),
--   (current_setting('app.loja_id')::uuid, '2026-06-12', 'festa_junina', 'Festa de Santo Antônio', 'positivo', 1.3);
