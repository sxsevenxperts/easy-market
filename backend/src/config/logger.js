/**
 * Logger simples - compatível com Fastify
 * Não usa dependências externas (pino será adicionado depois via package.json)
 * Por enquanto usa console.log para evitar dependências faltando no EasyPanel
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
const currentLevel = LOG_LEVELS[LOG_LEVEL] || 1;

const logger = {
  debug: (msg, meta = {}) => {
    if (currentLevel <= 0) {
      console.log(`[DEBUG] ${msg}`, meta);
    }
  },
  info: (msg, meta = {}) => {
    if (currentLevel <= 1) {
      console.log(`[INFO] ${msg}`, typeof meta === 'string' ? meta : JSON.stringify(meta));
    }
  },
  warn: (msg, meta = {}) => {
    if (currentLevel <= 2) {
      console.warn(`[WARN] ${msg}`, typeof meta === 'string' ? meta : JSON.stringify(meta));
    }
  },
  error: (msg, err = null) => {
    if (currentLevel <= 3) {
      if (err && err.message) {
        console.error(`[ERROR] ${msg}:`, err.message);
        if (err.stack && process.env.NODE_ENV !== 'production') {
          console.error(err.stack);
        }
      } else {
        console.error(`[ERROR] ${msg}`, typeof err === 'string' ? err : JSON.stringify(err));
      }
    }
  },
  fatal: (msg, err = null) => {
    console.error(`[FATAL] ${msg}`, err);
    process.exit(1);
  }
};

module.exports = logger;
