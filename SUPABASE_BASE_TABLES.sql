-- Tabelas Base (lojas, inventario, vendas, alertas, etc)

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

CREATE INDEX IF NOT EXISTS idx_vendas_loja_data ON vendas(loja_id, data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_loja ON alertas(loja_id);
CREATE INDEX IF NOT EXISTS idx_inventario_loja ON inventario(loja_id);
