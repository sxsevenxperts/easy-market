/**
 * Smart Market - Backend Principal v3.0
 * Inicialização resiliente — imports com try/catch para garantir startup
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const dotenv  = require('dotenv');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware global ────────────────────────────────────────────────────────
const origins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.CORS_ORIGIN     ||
  'http://localhost:3001'
).split(',').map(o => o.trim());

app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Supabase (injetado em req.supabase) ─────────────────────────────────────
let supabase = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(
    process.env.SUPABASE_URL     || '',
    process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_KEY || ''
  );
  console.log('[SmartMarket] ✅ Supabase conectado');
} catch (e) {
  console.warn('[SmartMarket] ⚠️  Supabase indisponível:', e.message);
}

app.use((req, _res, next) => {
  req.supabase = supabase;
  if (supabase) global.supabaseClient = supabase;
  next();
});

// ── Helper: registrar rota com segurança ─────────────────────────────────────
function safeRoute(mountPath, modulePath, label) {
  try {
    const router = require(modulePath);
    // store-size-forecast exporta factory function
    if (typeof router === 'function' && router.length > 1) {
      const StoreSizeOptimizerService = require('./services/store-size-optimizer');
      app.use(mountPath, router(StoreSizeOptimizerService));
    } else {
      app.use(mountPath, router);
    }
    console.log(`[SmartMarket] ✅ ${label} → ${mountPath}`);
  } catch (e) {
    console.warn(`[SmartMarket] ⚠️  Rota ${label} ignorada:`, e.message);
  }
}

// ── Registro de rotas ────────────────────────────────────────────────────────
safeRoute('/api/v1/predicoes',            './routes/predicoes',               'Predições');
safeRoute('/api/v1/predicoes',            './routes/predictive-forecast',     'Predictive Forecast');
safeRoute('/api/v1/predicoes',            './routes/store-size-forecast',     'Store Size Forecast');
safeRoute('/api/v1/perdas',               './routes/perdas',                  'Perdas');
safeRoute('/api/v1/gondolas',             './routes/otimizacao-gondolas',     'Gôndolas');
safeRoute('/api/v1/compras',              './routes/otimizacao-compras',      'Compras');
safeRoute('/api/v1/seguranca',            './routes/configuracao-seguranca',  'Segurança');
safeRoute('/api/v1/relatorios-pdf',       './routes/relatorios-pdf',          'Relatórios PDF');
safeRoute('/api/v1/relatorios',           './routes/relatorios',              'Relatórios');
safeRoute('/api/v1/integracao/pdv',       './routes/integracao-pdv',          'PDV');
safeRoute('/api/v1/integracao/balancas',  './routes/integracao-balancas',     'Balanças');
safeRoute('/api/v1/cross-sell',           './routes/cross-sell',              'Cross-Sell');
safeRoute('/api/v1/rfm',                  './routes/rfm',                     'RFM');
safeRoute('/api/v1/anomalias',            './routes/anomalias',               'Anomalias');
safeRoute('/api/v1/alertas',              './routes/alertas',                 'Alertas');
safeRoute('/api/v1/dashboard',            './routes/dashboard',               'Dashboard');
safeRoute('/api/v1/vendas',               './routes/vendas',                  'Vendas');
safeRoute('/api/v1/clientes',             './routes/clientes',                'Clientes');
safeRoute('/api/v1/inventario',           './routes/inventario',              'Inventário');
safeRoute('/api/v1/lojas',                './routes/lojas',                   'Lojas');
safeRoute('/api/v1/notificacoes',         './routes/notificacoes',            'Notificações');

// ── Servir frontend estático ──────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// ── Rota raiz ─────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  const indexFile = path.join(frontendPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.json({
        sucesso: true,
        servico: 'smart-market-backend',
        status:  'online',
        versao:  '3.0',
        api:     `http://localhost:${PORT}/api/v1`,
        health:  `http://localhost:${PORT}/health`,
        by:      'Seven Xperts'
      });
    }
  });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    sucesso:     true,
    servico:     'smart-market-backend',
    status:      'online',
    versao:      '3.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
    supabase:    supabase ? 'conectado' : 'indisponível',
    uptime:      process.uptime(),
    totalEndpoints: 115
  });
});

app.get('/status', (_req, res) => {
  res.json({
    sucesso:   true,
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    memory:    process.memoryUsage(),
    cpu:       process.cpuUsage()
  });
});

// ── Erro genérico ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[SmartMarket] Erro:', err.message || err);
  res.status(500).json({ sucesso: false, erro: err.message || 'Erro interno' });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    erro:    `Rota não encontrada: ${req.method} ${req.originalUrl}`
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              SMART MARKET v3.0  🚀                          ║
║         By Seven Xperts — 115 Endpoints Ativos              ║
╠══════════════════════════════════════════════════════════════╣
║  URL:    http://0.0.0.0:${PORT}                             ║
║  API:    http://0.0.0.0:${PORT}/api/v1                      ║
║  Health: http://0.0.0.0:${PORT}/health                      ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
