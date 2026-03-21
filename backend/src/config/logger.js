/**
 * Logger usando Pino (nativo do Fastify)
 * Compatível com Fastify logger nativo
 */

const pino = require('pino');

const logLevel = process.env.LOG_LEVEL || 'info';

// Logger Pino com pretty-print em desenvolvimento
const logger = pino(
  {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      }
    }
  },
  process.env.NODE_ENV === 'production'
    ? pino.destination() // Escreve em stdout em produção
    : pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      })
);

module.exports = logger;
