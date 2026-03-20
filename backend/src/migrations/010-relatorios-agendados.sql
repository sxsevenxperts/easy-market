-- Tabela para relatórios agendados
CREATE TABLE IF NOT EXISTS relatorios_agendados (
  id UUID PRIMARY KEY,
  loja_id UUID NOT NULL REFERENCES lojas(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('diario', 'semanal', 'mensal')),
  hora VARCHAR(5) NOT NULL, -- HH:MM
  dia_semana INT CHECK (dia_semana IS NULL OR (dia_semana >= 0 AND dia_semana <= 6)), -- 0=domingo, 6=sábado
  dia_mes INT CHECK (dia_mes IS NULL OR (dia_mes >= 1 AND dia_mes <= 31)),
  destinatarios TEXT[] NOT NULL, -- Array de emails
  incluir_analise_impacto BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_relatorios_agendados_loja_id ON relatorios_agendados(loja_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_agendados_ativo ON relatorios_agendados(ativo);

-- Tabela para logs de envio de relatórios
CREATE TABLE IF NOT EXISTS relatorios_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_agendado_id UUID NOT NULL REFERENCES relatorios_agendados(id) ON DELETE CASCADE,
  data_envio TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('enviado', 'erro', 'pendente')),
  mensagem_erro TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_relatorios_logs_relatorio_id ON relatorios_logs(relatorio_agendado_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_logs_data_envio ON relatorios_logs(data_envio DESC);
