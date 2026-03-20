#!/usr/bin/env node

/**
 * Setup direto do Supabase - Criar tabelas via SQL RPC
 * Não funciona com publishable key, mas mostra o processo
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://qfkwqfrnemqregjqxkcr.supabase.co';

async function main() {
  console.log('🚀 Easy Market - Setup via SQL\n');
  console.log('='.repeat(50));

  // Ler arquivo SQL
  const sqlPath = path.join(__dirname, '..', 'SUPABASE_SCHEMA_COMPLETO.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

  console.log('\n📋 Situação Atual:\n');
  console.log('✅ Arquivo SQL: SUPABASE_SCHEMA_COMPLETO.sql (285 linhas)');
  console.log('✅ Contém: 10 tabelas, 3 views, 1 trigger, 1 função');
  console.log('❌ Status: Não executado (precisa de password)');

  console.log('\n' + '='.repeat(50));
  console.log('\n⚡ OPÇÃO 1: SQL Editor (Recomendado - 2 min)\n');

  console.log('1. Abra no navegador:');
  console.log('   👉 https://qfkwqfrnemqregjqxkcr.supabase.co/project/default/sql/new\n');

  console.log('2. Cole este SQL (com Cmd+A, Cmd+V):');
  console.log('   ' + sqlContent.substring(0, 100).replace(/\n/g, '\n   ') + '...\n');

  console.log('3. Clique em "Run" (botão azul)\n');

  console.log('4. Aguarde 30-60 segundos...\n');

  console.log('='.repeat(50));
  console.log('\n⚡ OPÇÃO 2: Via CLI do Supabase\n');

  console.log('1. npm install -g supabase');
  console.log('2. supabase login');
  console.log('3. supabase db push\n');

  console.log('='.repeat(50));
  console.log('\n⚡ OPÇÃO 3: Python + psycopg2\n');

  console.log('1. pip install psycopg2-binary');
  console.log('2. export SUPABASE_PASSWORD=sua_senha_postgres');
  console.log('3. python3 scripts/setup-supabase-tables.py\n');

  console.log('='.repeat(50));
  console.log('\n✅ Depois que as tabelas forem criadas:\n');

  console.log('npm run db:seed:year');
  console.log('  ├─ Cria 1 loja');
  console.log('  ├─ Cria 24 produtos');
  console.log('  ├─ Gera 365 dias de vendas (5.400+ transações)');
  console.log('  ├─ Gera ~540 alertas');
  console.log('  └─ Tempo: 2-3 minutos\n');

  console.log('='.repeat(50));
  console.log('\n🎯 Resumo do SQL:\n');

  // Contar elementos no SQL
  const tables = (sqlContent.match(/CREATE TABLE IF NOT EXISTS/g) || []).length;
  const views = (sqlContent.match(/CREATE OR REPLACE VIEW/g) || []).length;
  const indexes = (sqlContent.match(/CREATE INDEX/g) || []).length;
  const triggers = (sqlContent.match(/CREATE TRIGGER/g) || []).length;
  const functions = (sqlContent.match(/CREATE OR REPLACE FUNCTION/g) || []).length;

  console.log(`📊 Tabelas: ${tables}`);
  console.log(`📊 Views: ${views}`);
  console.log(`📊 Índices: ${indexes}`);
  console.log(`📊 Triggers: ${triggers}`);
  console.log(`📊 Funções: ${functions}`);
  console.log(`📊 Total: ${tables + views + indexes + triggers + functions} objetos\n`);

  console.log('='.repeat(50));

  // Oferecer abrir navegador
  if (process.platform !== 'win32') {
    console.log('\n🌐 Abrindo SQL Editor no navegador...\n');

    const { exec } = require('child_process');
    const url = 'https://qfkwqfrnemqregjqxkcr.supabase.co/project/default/sql/new';

    if (process.platform === 'darwin') {
      exec(`open "${url}"`);
    } else if (process.platform === 'linux') {
      exec(`xdg-open "${url}"`);
    }

    console.log('✅ Aberto em seu navegador padrão');
  }

  console.log('\n💡 Dica: Copie o arquivo SQL inteiro para evitar erros');
  console.log('   Arquivo: SUPABASE_SCHEMA_COMPLETO.sql\n');
}

main().catch(console.error);
