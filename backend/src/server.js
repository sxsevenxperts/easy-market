require('dotenv').config();

const fastify = require('fastify');
const cors = require('fastify-cors');
const jwt = require('fastify-jwt');
const logger = require('./config/logger');
const { pool } = require('./config/database');
const redis = require('./config/redis');
const schedulerService = require('./services/scheduler');

// Initialize Fastify
const app = fastify({
  logger: logger,
  trustProxy: true
});

// ============================================
// Plugins
// ============================================
app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: true
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'change-me-in-production',
  sign: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
});

// ============================================
// Middleware
// ============================================

// Health Check
app.get('/health', async (request, reply) => {
  try {
    const dbCheck = await pool.query('SELECT NOW()');
    const redisCheck = await redis.ping();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      scheduler: Object.keys(schedulerService.jobs).length > 0 ? 'rodando' : 'parado',
      checks: {
        database: dbCheck ? 'ok' : 'error',
        redis: redisCheck === 'PONG' ? 'ok' : 'error',
        uptime: process.uptime()
      }
    };
  } catch (err) {
    logger.error('Health check failed:', err);
    return reply.code(503).send({
      status: 'error',
      scheduler: 'error',
      checks: {
        database: 'error',
        redis: 'error'
      }
    });
  }
});

// Request logging
app.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
  logger.info({
    method: request.method,
    url: request.url,
    ip: request.ip
  });
});

app.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - request.startTime;
  logger.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${duration}ms`
  });
});

// ============================================
// Routes
// ============================================

// Auth Routes
app.register(require('./routes/auth'), { prefix: `${process.env.API_PREFIX}/auth` });

// Lojas Routes
app.register(require('./routes/lojas'), { prefix: `${process.env.API_PREFIX}/lojas` });

// Vendas Routes (Ingestão de dados)
app.register(require('./routes/vendas'), { prefix: `${process.env.API_PREFIX}/vendas` });

// Dashboard Routes
app.register(require('./routes/dashboard'), { prefix: `${process.env.API_PREFIX}/dashboard` });

// Previsões Routes
app.register(require('./routes/previsoes'), { prefix: `${process.env.API_PREFIX}/previsoes` });

// Eventos Routes
app.register(require('./routes/eventos'), { prefix: `${process.env.API_PREFIX}/eventos` });

// Alertas Routes
app.register(require('./routes/alertas'), { prefix: `${process.env.API_PREFIX}/alertas` });

// Produtos Routes
app.register(require('./routes/produtos'), { prefix: `${process.env.API_PREFIX}/produtos` });

// Inventario Routes
app.register(require('./routes/inventario'), { prefix: `${process.env.API_PREFIX}/inventario` });

// Relatorios Routes
app.register(require('./routes/relatorios'), { prefix: `${process.env.API_PREFIX}/relatorios` });

// PDV Integration Routes
app.register(require('./routes/integracao-pdv'), { prefix: `${process.env.API_PREFIX}/integracao-pdv` });

// ============================================
// Error Handling
// ============================================
app.setErrorHandler((error, request, reply) => {
  logger.error(error);

  if (error.statusCode === 401) {
    return reply.code(401).send({
      error: 'unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }

  if (error.statusCode === 403) {
    return reply.code(403).send({
      error: 'forbidden',
      message: 'You do not have permission to access this resource'
    });
  }

  if (error.statusCode === 404) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'Resource not found'
    });
  }

  if (error.validation) {
    return reply.code(400).send({
      error: 'validation_error',
      message: error.message,
      details: error.validation
    });
  }

  // Internal Server Error
  return reply.code(500).send({
    error: 'internal_server_error',
    message: 'An unexpected error occurred',
    requestId: request.id
  });
});

// ============================================
// Graceful Shutdown
// ============================================
const signals = ['SIGTERM', 'SIGINT'];

signals.forEach(signal => {
  process.on(signal, async () => {
    logger.info(`${signal} received, shutting down gracefully...`);

    schedulerService.stop();
    await app.close();
    await pool.end();
    await redis.quit();

    process.exit(0);
  });
});

// ============================================
// Start Server
// ============================================
const start = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('✓ Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('✓ Redis connected');

    // Initialize 4-Block Automation Scheduler
    schedulerService.init();
    logger.info('✓ 4-Block Scheduler initialized');

    // Start server
    await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    logger.info(`✓ Server running on http://0.0.0.0:${process.env.PORT || 3000}`);

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

module.exports = app;
