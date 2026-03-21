#!/usr/bin/env node
/**
 * Script para aplicar a migração 008_add_customer_analytics.sql no Supabase
 * Uso: node apply-migration.js
 * 
 * Configure o arquivo .env antes de rodar:
 * DB_HOST=db.xxxxx.supabase.co
 * DB_PORT=5432
 * DB_NAME=postgres
 * DB_USER=postgres
 * DB_PASSWORD=seu_senha
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  let pool;
  
  try {
    // Configuração do banco
    const dbHost = process.env.DB_HOST || 'db.YOUR_SUPABASE_ID.supabase.co';
    
    // Auto-prefixar "db." para hosts do Supabase
    const host = dbHost.includes('.supabase.co') && !dbHost.startsWith('db.') 
      ? 'db.' + dbHost 
      : dbHost;
    
    const config = {
      host,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    };
    
    console.log(`\n📡 Conectando ao banco: ${config.host}:${config.port}/${config.database}`);
    
    // Criar pool de conexões
    pool = new Pool(config);
    
    // Testar conexão
    const client = await pool.connect();
    console.log('✓ Conectado ao banco de dados\n');
    
    // Ler arquivo de migração
    const migrationFile = path.join(__dirname, 'backend/src/migrations/008_add_customer_analytics.sql');
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationFile}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');
    
    console.log('📝 Executando migração: 008_add_customer_analytics.sql\n');
    
    // Executar migração
    await client.query(migrationSQL);
    console.log('✓ Migração aplicada com sucesso!\n');
    
    // Verificar tabela criada
    const result = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='clientes'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('✓ Tabela "clientes" criada com sucesso!');
    } else {
      console.log('✗ Erro: tabela "clientes" não foi criada');
      process.exit(1);
    }
    
    // Listar colunas da tabela
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='clientes'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Colunas da tabela clientes:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Listar índices
    const indexesResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename='clientes';
    `);
    
    console.log('\n🔍 Índices criados:');
    indexesResult.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
    // Verificar view
    const viewResult = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.views 
        WHERE table_name='v_resumo_fidelidade'
      );
    `);
    
    if (viewResult.rows[0].exists) {
      console.log('\n✓ View "v_resumo_fidelidade" criada com sucesso!');
    }
    
    console.log('\n✅ Migração completada com sucesso!\n');
    
    client.release();
    
  } catch (error) {
    console.error('\n✗ Erro ao aplicar migração:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Executar
applyMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
