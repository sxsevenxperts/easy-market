-- Migração: Criar tabela de rastreamento de perdas de produtos
-- Easy Market - Análise de Desperdício e Redução de Perdas

CREATE TABLE IF NOT EXISTS perdas_produtos (
  perda_id SERIAL PRIMARY KEY,
  loja_id VARCHAR(50) NOT NULL,
  produto_id VARCHAR(100) NOT NULL,
  quantidade_perdida INTEGER NOT NULL,
  valor_perdido DECIMAL(12, 2) NOT NULL,
  motivo VARCHAR(100) NOT NULL DEFAULT 'indefinido',
  observacoes TEXT,
  data_registro TIMESTAMP DEFAULT NOW(),
  
  -- Índices para performance
  FOREIGN KEY (loja_id) REFERENCES lojas(loja_id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(produto_id) ON DELETE CASCADE
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_perdas_loja_data ON perdas_produtos(loja_id, data_registro DESC);
CREATE INDEX IF NOT EXISTS idx_perdas_produto ON perdas_produtos(produto_id);
CREATE INDEX IF NOT EXISTS idx_perdas_motivo ON perdas_produtos(motivo);
CREATE INDEX IF NOT EXISTS idx_perdas_data ON perdas_produtos(data_registro DESC);

-- Comentários de documentação
COMMENT ON TABLE perdas_produtos IS 'Registro de perdas e desperdícios de produtos por loja';
COMMENT ON COLUMN perdas_produtos.quantidade_perdida IS 'Quantidade de unidades perdidas';
COMMENT ON COLUMN perdas_produtos.valor_perdido IS 'Valor monetário da perda (quantidade × preço de venda)';
COMMENT ON COLUMN perdas_produtos.motivo IS 'Razão da perda (vencimento, dano, roubo, etc)';
COMMENT ON COLUMN perdas_produtos.observacoes IS 'Anotações adicionais sobre o incidente';

-- Trigger para auditoria (opcional, se houver tabela de auditoria)
-- CREATE TRIGGER tr_perdas_auditoria 
-- AFTER INSERT ON perdas_produtos
-- FOR EACH ROW
-- EXECUTE FUNCTION registrar_auditoria('perdas_produtos', 'INSERT');
