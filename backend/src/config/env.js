/**
 * Carregador de variáveis de ambiente com defaults seguros
 * Garante que o aplicativo funcione mesmo se variáveis não estejam definidas
 */

require('dotenv').config();

const env = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || 3000,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // API configuration
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(',').map(s => s.trim()),
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'postgres',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_SSL: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  
  // Fallback untuk variáveis antigas (SUPABASE_*)
  get SUPABASE_HOST() {
    return process.env.SUPABASE_HOST || this.DB_HOST;
  },
  get SUPABASE_PORT() {
    return process.env.SUPABASE_PORT || this.DB_PORT;
  },
  get SUPABASE_USER() {
    return process.env.SUPABASE_USER || this.DB_USER;
  },
  get SUPABASE_PASSWORD() {
    return process.env.SUPABASE_PASSWORD || this.DB_PASSWORD;
  },
  get SUPABASE_DB() {
    return process.env.SUPABASE_DB || this.DB_NAME;
  }
};

// Log startup info (without sensitive data)
console.log('[CONFIG] Loaded environment:');
console.log(`  NODE_ENV: ${env.NODE_ENV}`);
console.log(`  PORT: ${env.PORT}`);
console.log(`  API_PREFIX: ${env.API_PREFIX}`);
console.log(`  Database: ${env.DB_USER}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);

module.exports = env;
