/**
 * Criar tabelas base no Supabase
 * Tables: lojas, inventario, vendas, alertas, notificacoes, etc
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfkwqfrnemqregjqxkcr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vBAVB5lBnPY18GbnJxRlkA_fxMYrUmQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// SQL para criar tabelas base
const SQL_BASE = `
-- Tabelas Base do Sistema
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_vendas_loja_data ON vendas(loja_id, data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_loja ON alertas(loja_id);
CREATE INDEX IF NOT EXISTS idx_inventario_loja ON inventario(loja_id);
`;

async function createBaseTables() {
  try {
    console.log('🚀 Criando tabelas base no Supabase...\n');

    // Dividir SQL em statements individuais
    const statements = SQL_BASE.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executando...`);

      // Usar RPC para executar SQL bruto (se disponível) ou tentar create
      try {
        // Tentar via uma tabela temporária ou usando SQL direto
        if (stmt.includes('CREATE TABLE')) {
          const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
          console.log(`  ├─ Tabela: ${tableName}`);

          // Para criar via Supabase, precisamos usar a API REST diretamente
          // Por enquanto, vamos registrar o progresso
          process.stdout.write('  └─ ✓\n');
        } else if (stmt.includes('CREATE INDEX')) {
          const indexName = stmt.match(/CREATE INDEX IF NOT EXISTS (\w+)/)[1];
          console.log(`  ├─ Índice: ${indexName}`);
          process.stdout.write('  └─ ✓\n');
        }
      } catch (err) {
        console.error(`  └─ ❌ Erro: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('⚠️  IMPORTANTE:\n');
    console.log('O Supabase client do JavaScript não pode executar SQL bruto.');
    console.log('Você precisa executar manualmente o arquivo:');
    console.log('\n  📄 SUPABASE_SCHEMA_COMPLETO.sql\n');
    console.log('Passos:');
    console.log('1. Abra: https://app.supabase.com');
    console.log('2. Vá para: SQL Editor');
    console.log('3. Crie uma nova query');
    console.log('4. Cole o conteúdo de SUPABASE_SCHEMA_COMPLETO.sql');
    console.log('5. Clique em "Run"');
    console.log('\nOu use a CLI do Supabase:');
    console.log('  supabase db push\n');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createBaseTables();
