-- Tabela para armazenar configurações de notificação por loja
CREATE TABLE IF NOT EXISTS notificacao_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  email VARCHAR(255),
  alertas_criticos BOOLEAN DEFAULT TRUE,
  alertas_email BOOLEAN DEFAULT FALSE,
  alertas_whatsapp BOOLEAN DEFAULT FALSE,
  alertas_sms BOOLEAN DEFAULT FALSE,
  relatorios_diarios BOOLEAN DEFAULT FALSE,
  relatorios_semanais BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(loja_id)
);

-- Tabela para múltiplos contatos WhatsApp/SMS por loja
CREATE TABLE IF NOT EXISTS notificacao_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(255), -- Gerente, Encarregado, Proprietário, etc
  setores TEXT[], -- Categorias/setores responsáveis (ex: ['Bebidas', 'Alimentos'])
  telefone_whatsapp VARCHAR(20),
  telefone_sms VARCHAR(20),
  email VARCHAR(255),
  ativo BOOLEAN DEFAULT TRUE,

  -- Preferências individuais
  receber_alertas_criticos BOOLEAN DEFAULT TRUE,
  receber_alertas_email BOOLEAN DEFAULT FALSE,
  receber_alertas_whatsapp BOOLEAN DEFAULT FALSE,
  receber_alertas_sms BOOLEAN DEFAULT FALSE,
  receber_relatorios BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT telefone_obrigatorio CHECK (
    telefone_whatsapp IS NOT NULL OR telefone_sms IS NOT NULL OR email IS NOT NULL
  )
);

-- Tabela para histórico de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- alerta_critico, vencimento, falta_estoque, desperdicio, relatório
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  urgencia VARCHAR(20) DEFAULT 'media', -- alta, media, baixa
  status VARCHAR(20) DEFAULT 'criada', -- criada, enviada, lida, deletada
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_leitura TIMESTAMP,
  dados_adicionais JSONB
);

-- Tabela para logs de envio por canal
CREATE TABLE IF NOT EXISTS notificacao_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notificacao_id UUID NOT NULL REFERENCES notificacoes(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES notificacao_contatos(id) ON DELETE SET NULL,
  canal VARCHAR(50) NOT NULL, -- whatsapp, sms, email, push
  status VARCHAR(50) NOT NULL, -- enviado, pendente, erro
  referencia_externa VARCHAR(255), -- Twilio SID, SendGrid ID, etc
  erro_msg TEXT,
  data_envio TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_loja_id ON notificacoes(loja_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON notificacoes(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_notificacao_contatos_loja_id ON notificacao_contatos(loja_id);
CREATE INDEX IF NOT EXISTS idx_notificacao_contatos_ativo ON notificacao_contatos(ativo);
CREATE INDEX IF NOT EXISTS idx_notificacao_logs_notificacao ON notificacao_logs(notificacao_id);
CREATE INDEX IF NOT EXISTS idx_notificacao_logs_contato ON notificacao_logs(contato_id);
