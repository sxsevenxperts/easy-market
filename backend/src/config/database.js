const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  host: process.env.SUPABASE_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.SUPABASE_PORT || process.env.DATABASE_PORT || '5432'),
  user: process.env.SUPABASE_USER || process.env.DATABASE_USER || 'postgres',
  password: process.env.SUPABASE_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.SUPABASE_DB || process.env.DATABASE_NAME || 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  logger.info('New database connection established');
});

pool.on('remove', () => {
  logger.info('Client removed from pool');
});

module.exports = { pool };
