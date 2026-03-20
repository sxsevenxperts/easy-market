#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfkwqfrnemqregjqxkcr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vBAVB5lBnPY18GbnJxRlkA_fxMYrUmQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log('🔍 Testando tabelas no Supabase...\n');

  try {
    // Teste 1: Tentar listar tabelas
    console.log('1️⃣ Verificando tabela "lojas"...');
    const { data: lojas, error: erroLojas } = await supabase
      .from('lojas')
      .select('count()', { count: 'exact' })
      .limit(1);

    if (erroLojas) {
      console.log(`❌ Erro: ${erroLojas.message}\n`);

      // Tentar criar manualmente
      console.log('2️⃣ Tentando criar tabela "lojas" manualmente...\n');

      const sqlLoja = `
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
      `;

      console.log('SQL a executar:');
      console.log(sqlLoja);
      console.log('\n⚠️ IMPORTANTE:');
      console.log('A tabela "lojas" NÃO foi criada pelo SQL anterior.');
      console.log('Você precisa executar este SQL no Supabase SQL Editor:');
      console.log('\n' + sqlLoja);
      console.log('\nDepois disso, execute:');
      console.log('npm run db:seed:year');

    } else {
      console.log('✅ Tabela "lojas" existe!\n');
      console.log('3️⃣ Agora é seguro executar: npm run db:seed:year');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

test();
