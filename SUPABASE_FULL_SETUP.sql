-- ============================================
-- SCHEMA COMPLETO - BASE + ANÁLISE PREDITIVA
-- ============================================

-- ============================================
-- 1. TABELAS BASE
-- ============================================

CREATE TABLE IF NOT EXISTS lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  endereco VARCHAR(500),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  telefone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ativa',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  nome_produto VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  preco_unitario DECIMAL(10, 2),
  quantidade INT DEFAULT 0,
  dias_vencimento INT DEFAULT 30,
  status_estoque VARCHAR(50) DEFAULT 'saudavel',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  data_venda TIMESTAMP NOT NULL,
  faturamento DECIMAL(12, 2),
  quantidade INT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  tipo VARCHAR(50),
  urgencia VARCHAR(50) DEFAULT 'media',
  valor_roi_estimado DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pendente',
  data_criacao TIMESTAMP DEFAULT NOW(),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notificacao_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  nome VARCHAR(255),
  cargo VARCHAR(100),
  setores TEXT[],
  telefone_whatsapp VARCHAR(20),
  email VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  receber_alertas_criticos BOOLEAN DEFAULT true,
  receber_alertas_whatsapp BOOLEAN DEFAULT true,
  receber_alertas_email BOOLEAN DEFAULT true,
  receber_relatorios BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relatorios_agendados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  tipo VARCHAR(50),
  hora VARCHAR(5),
  dia_semana VARCHAR(50),
  dia_mes INT,
  destinatarios TEXT[],
  incluir_analise_impacto BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. TABELAS DE ANÁLISE PREDITIVA
-- ============================================

CREATE TABLE IF NOT EXISTS clima (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  data_hora TIMESTAMP NOT NULL,
  temperatura DECIMAL(5, 2),
  chuva BOOLEAN DEFAULT false,
  umidade DECIMAL(5, 2),
  pressao DECIMAL(7, 2),
  indice_uv DECIMAL(3, 1),
  vento_velocidade DECIMAL(5, 2),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operacional_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  data_hora TIMESTAMP NOT NULL,
  num_caixas_abertos INT,
  tempo_medio_fila INT,
  temperatura_loja DECIMAL(5, 2),
  musica_ativa BOOLEAN,
  fluxo_pessoas INT,
  tempo_medio_compra INT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campanhas_ativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  tipo_campanha VARCHAR(50),
  desconto_percentual DECIMAL(5, 2),
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,
  impacto_estimado DECIMAL(5, 2),
  ativa BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eventos_externos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  data TIMESTAMP NOT NULL,
  tipo_evento VARCHAR(100),
  descricao VARCHAR(500),
  impacto_esperado VARCHAR(20),
  multiplicador_vendas DECIMAL(3, 2),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS concorrencia_preco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data TIMESTAMP NOT NULL,
  preco_nosso DECIMAL(10, 2),
  preco_concorrente_a DECIMAL(10, 2),
  preco_concorrente_b DECIMAL(10, 2),
  concorrentes_abertos INT,
  elasticidade DECIMAL(3, 2),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS previsoes_ml (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data_previsao DATE NOT NULL,
  hora INT,
  quantidade_prevista INT,
  intervalo_min INT,
  intervalo_max INT,
  confianca DECIMAL(3, 2),
  modelo_escolhido VARCHAR(50),
  variaveis_importantes JSONB,
  recomendacoes TEXT[],
  realizado INT,
  erro_percentual DECIMAL(5, 2),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historico_descontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data TIMESTAMP NOT NULL,
  desconto_percentual DECIMAL(5, 2),
  preco_original DECIMAL(10, 2),
  preco_com_desconto DECIMAL(10, 2),
  quantidade_vendida INT,
  motivo VARCHAR(100),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comportamento_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  data TIMESTAMP NOT NULL,
  ticket_medio DECIMAL(10, 2),
  num_transacoes INT,
  tempo_medio_na_loja INT,
  taxa_abandono_carrinho DECIMAL(5, 2),
  compra_impulso_percentual DECIMAL(5, 2),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reposicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data_reposicao TIMESTAMP NOT NULL,
  quantidade_reposto INT,
  dias_para_vencimento INT,
  custo_estoque DECIMAL(10, 2),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS impacto_financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id),
  produto_id UUID REFERENCES inventario(id),
  data DATE NOT NULL,
  receita_realizada DECIMAL(12, 2),
  receita_potencial DECIMAL(12, 2),
  perda_por_falta DECIMAL(12, 2),
  desperdicio DECIMAL(12, 2),
  economia_por_prevencao DECIMAL(12, 2),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_vendas_loja_data ON vendas(loja_id, data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_loja ON alertas(loja_id);
CREATE INDEX IF NOT EXISTS idx_inventario_loja ON inventario(loja_id);
CREATE INDEX IF NOT EXISTS idx_clima_loja_data ON clima(loja_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_operacional_loja_data ON operacional_loja(loja_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_campanhas_ativas ON campanhas_ativas(loja_id, ativa);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos_externos(loja_id, data);
CREATE INDEX IF NOT EXISTS idx_previsoes_produto_data ON previsoes_ml(loja_id, produto_id, data_previsao);
CREATE INDEX IF NOT EXISTS idx_historico_desconto_data ON historico_descontos(loja_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_impacto_data ON impacto_financeiro(loja_id, data DESC);

-- ============================================
-- 4. VIEWS
-- ============================================

CREATE OR REPLACE VIEW vw_previsao_vs_realizado AS
SELECT
  p.data_previsao,
  p.produto_id,
  p.quantidade_prevista,
  p.realizado,
  (p.realizado - p.quantidade_prevista) as diferenca,
  ROUND(ABS(p.realizado - p.quantidade_prevista)::NUMERIC / NULLIF(p.quantidade_prevista, 0) * 100, 2) as erro_percentual,
  p.modelo_escolhido,
  p.confianca
FROM previsoes_ml p
WHERE p.realizado IS NOT NULL
ORDER BY p.data_previsao DESC;

CREATE OR REPLACE VIEW vw_impacto_diario AS
SELECT
  data,
  loja_id,
  SUM(receita_realizada) as receita_dia,
  SUM(receita_potencial) as receita_potencial_dia,
  SUM(perda_por_falta) as perda_dia,
  SUM(desperdicio) as desperdicio_dia,
  SUM(economia_por_prevencao) as economia_dia,
  ROUND(SUM(economia_por_prevencao)::NUMERIC / NULLIF(SUM(receita_realizada), 0) * 100, 2) as margem_economia_percentual
FROM impacto_financeiro
GROUP BY data, loja_id
ORDER BY data DESC;

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
LEFT JOIN impacto_financeiro im ON i.id = im.produto_id AND im.data >= CURRENT_DATE - INTERVAL '30 days'
WHERE p.id IS NOT NULL OR im.id IS NOT NULL
GROUP BY i.id, i.nome_produto, i.categoria
ORDER BY perda_total_mes DESC NULLS LAST;

-- ============================================
-- 5. TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION atualizar_erro_previsao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.realizado IS NOT NULL AND OLD.realizado IS NULL THEN
    NEW.erro_percentual := ROUND(ABS(NEW.realizado - NEW.quantidade_prevista)::NUMERIC / NULLIF(NEW.quantidade_prevista, 0) * 100, 2);
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
-- 6. FUNÇÃO
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
