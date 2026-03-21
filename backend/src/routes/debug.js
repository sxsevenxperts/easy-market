/**
 * Debug Routes - apenas para desenvolvimento/diagnostics
 * Remove em produção
 */

async function routes(fastify, options) {
  // GET /debug/env - Mostrar variáveis carregadas
  fastify.get('/env', async (request, reply) => {
    try {
      const env = require('../config/env');
      return {
        status: 'ok',
        env: {
          NODE_ENV: env.NODE_ENV,
          PORT: env.PORT,
          API_PREFIX: env.API_PREFIX,
          DB_HOST: env.DB_HOST,
          DB_PORT: env.DB_PORT,
          DB_NAME: env.DB_NAME,
          LOG_LEVEL: env.LOG_LEVEL
        },
        raw_process_env: {
          API_PREFIX: process.env.API_PREFIX,
          PORT: process.env.PORT,
          NODE_ENV: process.env.NODE_ENV
        }
      };
    } catch (err) {
      return { error: err.message, stack: err.stack };
    }
  });
}

module.exports = routes;
