const redis = require('redis');
const logger = require('./logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('End of retry');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

client.on('connect', () => {
  logger.info('Redis Client Connected');
});

client.on('ready', () => {
  logger.info('Redis Client Ready');
});

client.on('reconnecting', () => {
  logger.warn('Redis Client Reconnecting');
});

module.exports = client;
