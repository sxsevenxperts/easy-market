#!/usr/bin/env node

/**
 * 🔍 Debug Script: Mostrar Variáveis de Ambiente
 * Use: node backend/src/debug-env.js
 * 
 * Este script mostra EXATAMENTE quais variáveis o backend está recebendo
 * Ajuda a diagnosticar problemas de configuração
 */

require('dotenv').config();

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         🔍 DEBUG: Variáveis de Ambiente Detectadas         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const requiredVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_SSL',
  'NODE_ENV',
  'PORT',
  'API_PREFIX',
  'CORS_ORIGIN',
  'JWT_SECRET',
  'JWT_EXPIRES_IN'
];

const alternativeVars = [
  'SUPABASE_HOST',
  'SUPABASE_PORT',
  'SUPABASE_USER',
  'SUPABASE_PASSWORD',
  'SUPABASE_DB',
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME'
];

console.log('📋 VARIÁVEIS ESPERADAS (DB_*):\n');
let hasDbVars = false;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName.includes('PASSWORD') ? '***hidden***' : value) : 'NÃO DEFINIDA';
  console.log(`  ${status} ${varName.padEnd(20)} = ${display}`);
  if (varName.startsWith('DB_') && value) hasDbVars = true;
});

console.log('\n📋 VARIÁVEIS ALTERNATIVAS (SUPABASE_* / DATABASE_*):\n');
let hasAltVars = false;
alternativeVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    hasAltVars = true;
    const display = varName.includes('PASSWORD') ? '***hidden***' : value;
    console.log(`  ✅ ${varName.padEnd(25)} = ${display}`);
  }
});

if (!hasAltVars) {
  console.log('  (Nenhuma variável SUPABASE_* ou DATABASE_* encontrada)\n');
}

console.log('\n═══════════════════════════════════════════════════════════\n');

if (hasDbVars || hasAltVars) {
  console.log('✅ VARIÁVEIS DE BANCO DE DADOS DETECTADAS\n');
  
  // Try to parse DB connection
  const dbHost = process.env.DB_HOST || process.env.SUPABASE_HOST || process.env.DATABASE_HOST;
  const dbPort = process.env.DB_PORT || process.env.SUPABASE_PORT || process.env.DATABASE_PORT;
  const dbUser = process.env.DB_USER || process.env.SUPABASE_USER || process.env.DATABASE_USER;
  
  console.log('🔗 Tentará conectar a:');
  console.log(`   Host: ${dbHost || 'LOCALHOST (PADRÃO)'}`);
  console.log(`   Port: ${dbPort || '5432 (PADRÃO)'}`);
  console.log(`   User: ${dbUser || 'postgres (PADRÃO)'}`);
  console.log(`   Pass: ${process.env.DB_PASSWORD ? '***configurada***' : 'NÃO CONFIGURADA'}`);
  
} else {
  console.log('❌ NENHUMA VARIÁVEL DE BANCO DE DADOS ENCONTRADA!\n');
  console.log('O backend tentará conectar a: 127.0.0.1:5432 (LOCALHOST)\n');
  console.log('⚠️  ISSO VAI FALHAR EM PRODUÇÃO\n');
}

console.log('═══════════════════════════════════════════════════════════\n');

console.log('🎯 PRÓXIMAS AÇÕES:\n');

if (!hasDbVars && !hasAltVars) {
  console.log('1. Abra: https://console.easypanel.io');
  console.log('2. Selecione: Projeto "easymarket"');
  console.log('3. Vá em: Environment → Variables');
  console.log('4. Adicione: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL');
  console.log('5. Clique: Save');
  console.log('6. Aguarde: Redeploy (2-3 min)');
  console.log('7. Execute: node backend/src/debug-env.js novamente');
} else {
  console.log('✅ Variáveis configuradas corretamente!');
  console.log('   Execute: npm start');
  console.log('   Teste: curl https://diversos-easymarket.yuhqmc.easypanel.host/health');
}

console.log('\n');
