const { Pool } = require('pg');
const logger = require('./logger');
const env = require('./env');

const pool = new Pool({
  host: (() => {
    const h = env.DB_HOST || env.SUPABASE_HOST || process.env.DATABASE_HOST || 'localhost';
    // Supabase direct PostgreSQL requires db. prefix
    if (h.includes('.supabase.co') && !h.startsWith('db.')) return 'db.' + h;
    return h;
  })(),
  port: parseInt(env.DB_PORT || env.SUPABASE_PORT || process.env.DATABASE_PORT || '5432'),
  user: env.DB_USER || env.SUPABASE_USER || process.env.DATABASE_USER || 'postgres',
  password: env.DB_PASSWORD || env.SUPABASE_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
  database: env.DB_NAME || env.SUPABASE_DB || process.env.DATABASE_NAME || 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  // Don't exit — Supabase idle connections expire and the pool recovers automatically
});

pool.on('connect', () => {
  logger.info('New database connection established');
});

pool.on('remove', () => {
  logger.info('Client removed from pool');
});

module.exports = { pool };
