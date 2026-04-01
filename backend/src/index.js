/**
 * Smart Market - Backend v3.0
 * Servidor Express limpo — compatível com EasyPanel
 * Usa Supabase como única fonte de dados
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
const origins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '*')
  .split(',').map(o => o.trim());

app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Supabase ─────────────────────────────────────────────────────────────────
let supabase = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY;
  if (url && key) {
    supabase = createClient(url, key);
    console.log('[SmartMarket] ✅ Supabase conectado:', url);
  }
} catch (e) {
  console.warn('[SmartMarket] ⚠️  Supabase indisponível:', e.message);
}

// Injeta supabase em todas as requests
app.use((req, _res, next) => { req.supabase = supabase; next(); });

// ── Auth route (pública — antes do verifyToken) ───────────────────────────────
app.use('/api/v1/auth', require('./routes/auth'));

// ── Authentication Middleware ──────────────────────────────────────────────────
const { verifyToken } = require('./middleware/auth');
app.use(verifyToken);

// ── Mount Express Routers ──────────────────────────────────────────────────────
const routerClientes = require('./routes/clientes');
const routerDashboard = require('./routes/dashboard');
const routerDebug = require('./routes/debug');
const routerInventario = require('./routes/inventario');
const routerLojas = require('./routes/lojas');
const routerVendas = require('./routes/vendas');
const routerRelatorios = require('./routes/relatorios');
const routerRelatoriosAgendados = require('./routes/relatorios-agendados');
const routerConfiguracaoSeguranca = require('./routes/configuracao-seguranca');
const routerConfiguracaoLoja = require('./routes/config-loja');
const routerNotificacoes = require('./routes/notificacoes');
const routerNotificacaoContatos = require('./routes/notificacao-contatos');
const routerOtimizacaoCompras = require('./routes/otimizacao-compras');
const routerOtimizacaoGondolas = require('./routes/otimizacao-gondolas');
const routerOtimizacaoNutricional = require('./routes/otimizacao-nutricional');

app.use('/api/v1/clientes', routerClientes);
app.use('/api/v1/dashboard', routerDashboard);
app.use('/api/v1/debug', routerDebug);
app.use('/api/v1/inventario', routerInventario);
app.use('/api/v1/lojas', routerLojas);
app.use('/api/v1/vendas', routerVendas);
app.use('/api/v1/relatorios', routerRelatorios);
app.use('/api/v1/relatorios-agendados', routerRelatoriosAgendados);
app.use('/api/v1/configuracao-seguranca', routerConfiguracaoSeguranca);
app.use('/api/v1/config-loja', routerConfiguracaoLoja);
app.use('/api/v1/notificacoes', routerNotificacoes);
app.use('/api/v1/notificacao-contatos', routerNotificacaoContatos);
app.use('/api/v1/otimizacao-compras', routerOtimizacaoCompras);
app.use('/api/v1/otimizacao-gondolas', routerOtimizacaoGondolas);
app.use('/api/v1/otimizacao-nutricional', routerOtimizacaoNutricional);

// ── Rotas Express Router ────────────────────────────────────────────────────
const expressRoutes = [
  { path: '/api/v1/rfm',                  file: './routes/rfm',                  name: 'RFM'               },
  { path: '/api/v1/anomalias',            file: './routes/anomalias',            name: 'Anomalias'         },
  { path: '/api/v1/alertas',              file: './routes/alertas',              name: 'Alertas'           },
  { path: '/api/v1/perdas',               file: './routes/perdas',               name: 'Perdas'            },
  { path: '/api/v1/predicoes',            file: './routes/predictive-forecast',  name: 'Predicoes (forecast)' },
  { path: '/api/v1/analise-clientes',     file: './routes/predicoes',            name: 'Predicoes (clientes)' },
  { path: '/api/v1/cross-sell',           file: './routes/cross-sell',           name: 'Cross-Sell'        },
  { path: '/api/v1/store-forecast',       file: './routes/store-size-forecast',  name: 'StoreForecast'     },
  { path: '/api/v1/relatorios-pdf',       file: './routes/relatorios-pdf',       name: 'RelatoriosPDF'     },
  { path: '/api/v1/integracao-pdv',       file: './routes/integracao-pdv',       name: 'IntegracaoPDV'     },
  { path: '/api/v1/integracao-balancas',  file: './routes/integracao-balancas',  name: 'IntegracaoBalancas'},
  { path: '/api/v1/scraper',              file: './routes/scraper',              name: 'Scraper'           },
];

for (const r of expressRoutes) {
  try {
    const router = require(r.file);
    // Accept: Express Router (function) but NOT Fastify plugin (named 'routes' with 3 params)
    const isFastify = typeof router === 'function' && router.name === 'routes' && router.length === 3;
    if (typeof router === 'function' && !isFastify) {
      app.use(r.path, router);
      console.log(`[SmartMarket] ✅ ${r.name} → ${r.path}`);
    } else {
      console.warn(`[SmartMarket] ⚠️  ${r.name} ignorado (Fastify plugin — não compatível com Express)`);
    }
  } catch (e) {
    console.warn(`[SmartMarket] ⚠️  ${r.name} ignorado:`, e.message);
  }
}

// ── Health / Status ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    sucesso:     true,
    servico:     'smart-market-backend',
    status:      'online',
    versao:      '3.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp:   new Date().toISOString(),
    supabase:    supabase ? 'conectado' : 'não configurado',
    uptime:      Math.floor(process.uptime()),
    by:          'Seven Xperts'
  });
});

app.get('/status', (_req, res) => {
  res.json({
    online:    true,
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    memory:    process.memoryUsage()
  });
});

// ── API endpoints com dados do Supabase ──────────────────────────────────────
app.get('/api/v1/dashboard/:loja_id?', async (req, res) => {
  try {
    const loja_id = req.params.loja_id || 'loja_001';
    if (!supabase) return res.json({ sucesso: true, dados: mockDashboard(loja_id) });

    const { data: vendas } = await supabase
      .from('vendas').select('*').eq('loja_id', loja_id).limit(100);

    res.json({ sucesso: true, loja_id, vendas: vendas || [], mock: !vendas });
  } catch (e) {
    res.json({ sucesso: true, dados: mockDashboard(req.params.loja_id) });
  }
});

app.get('/api/v1/lojas', async (_req, res) => {
  try {
    if (!supabase) return res.json({ sucesso: true, lojas: mockLojas() });
    const { data } = await supabase.from('lojas').select('*').limit(50);
    res.json({ sucesso: true, lojas: data || mockLojas() });
  } catch (e) {
    res.json({ sucesso: true, lojas: mockLojas() });
  }
});

app.get('/api/v1/vendas', async (req, res) => {
  try {
    if (!supabase) return res.json({ sucesso: true, vendas: [] });
    const { loja_id } = req.query;
    let q = supabase.from('vendas').select('*').limit(100);
    if (loja_id) q = q.eq('loja_id', loja_id);
    const { data } = await q;
    res.json({ sucesso: true, vendas: data || [] });
  } catch (e) {
    res.json({ sucesso: true, vendas: [] });
  }
});

app.get('/api/v1/clientes', async (req, res) => {
  try {
    if (!supabase) return res.json({ sucesso: true, clientes: [] });
    const { data } = await supabase.from('clientes').select('*').limit(50);
    res.json({ sucesso: true, clientes: data || [] });
  } catch (e) {
    res.json({ sucesso: true, clientes: [] });
  }
});

app.get('/api/v1/inventario', async (req, res) => {
  try {
    if (!supabase) return res.json({ sucesso: true, inventario: [] });
    const { data } = await supabase.from('inventario').select('*').limit(100);
    res.json({ sucesso: true, inventario: data || [] });
  } catch (e) {
    res.json({ sucesso: true, inventario: [] });
  }
});

// Catch-all para outras rotas da API
app.all('/api/*', (req, res) => {
  res.json({
    sucesso:  true,
    endpoint: req.path,
    metodo:   req.method,
    message:  'Endpoint Smart Market — Em produção',
    timestamp: new Date().toISOString()
  });
});

// ── Frontend estático ─────────────────────────────────────────────────────────
const frontendPath = path.resolve(__dirname, '../../frontend');
const loginPath    = path.join(frontendPath, 'login');

// Login SPA (React)
app.use('/login', express.static(loginPath));
app.get('/login', (_req, res) => res.sendFile(path.join(loginPath, 'index.html')));
app.get('/login/*', (_req, res) => res.sendFile(path.join(loginPath, 'index.html')));

// Smart Market frontend
app.use(express.static(frontendPath));

app.get('*', (_req, res) => {
  const indexFile = path.join(frontendPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.json({
        name:   'Smart Market API',
        status: 'online',
        health: '/health',
        api:    '/api/v1',
        by:     'Seven Xperts'
      });
    }
  });
});

// ── Mock helpers ──────────────────────────────────────────────────────────────
function mockDashboard(loja_id) {
  return {
    loja_id,
    receita_hoje: 12847.50,
    margem_media: 28.4,
    taxa_perdas:  1.8,
    alertas_ativos: 3,
    timestamp: new Date().toISOString()
  };
}

function mockLojas() {
  return [
    { loja_id: 'loja_001', nome: 'Loja 001 — Centro',  cidade: 'São Paulo' },
    { loja_id: 'loja_002', nome: 'Loja 002 — Norte',   cidade: 'São Paulo' },
    { loja_id: 'loja_003', nome: 'Loja 003 — Sul',     cidade: 'São Paulo' }
  ];
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[SmartMarket] Erro:', err.message);
  res.status(500).json({ sucesso: false, erro: err.message });
});

// ── Scheduler Status Route ─────────────────────────────────────────────────────
let scraperScheduler = null;

app.get('/api/v1/scheduler/status', (req, res) => {
  if (!scraperScheduler) {
    return res.json({ sucesso: false, erro: 'Scheduler não inicializado' });
  }
  const status = scraperScheduler.getStatus();
  res.json({ sucesso: true, scheduler: status });
});

app.post('/api/v1/scheduler/start', async (req, res) => {
  if (!supabase) {
    return res.json({ sucesso: false, erro: 'Supabase não conectado' });
  }
  if (scraperScheduler && scraperScheduler.isRunning) {
    return res.json({ sucesso: false, erro: 'Scheduler já está rodando' });
  }
  
  const ScraperScheduler = require('./scrapers/scheduler');
  scraperScheduler = new ScraperScheduler(supabase);
  const lojaIds = req.body?.lojaIds || ['loja_001'];
  const intervalMinutes = req.body?.intervalMinutes || 60;
  
  scraperScheduler.start(lojaIds, intervalMinutes);
  res.json({ sucesso: true, message: 'Scheduler iniciado', lojaIds, intervalMinutes });
});

app.post('/api/v1/scheduler/stop', (req, res) => {
  if (!scraperScheduler) {
    return res.json({ sucesso: false, erro: 'Scheduler não inicializado' });
  }
  scraperScheduler.stop();
  res.json({ sucesso: true, message: 'Scheduler parado' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         SMART MARKET v3.0 — By Seven Xperts     ║
╠══════════════════════════════════════════════════╣
║  URL:    http://0.0.0.0:${PORT}                  ║
║  Health: http://0.0.0.0:${PORT}/health           ║
║  API:    http://0.0.0.0:${PORT}/api/v1           ║
╚══════════════════════════════════════════════════╝
  `);

  // ── Initialize Scraper Scheduler ────────────────────────────────────────────
  if (supabase && process.env.NODE_ENV !== 'test') {
    try {
      const ScraperScheduler = require('./scrapers/scheduler');
      scraperScheduler = new ScraperScheduler(supabase);
      
      // Get store IDs from env or use defaults
      const lojaIds = (process.env.LOJA_IDS || 'loja_001,loja_002,loja_003')
        .split(',')
        .map(id => id.trim());
      
      const intervalMinutes = parseInt(process.env.SCRAPER_INTERVAL || '60', 10);
      
      scraperScheduler.start(lojaIds, intervalMinutes);
      console.log(`[SmartMarket] ✅ Scraper Scheduler iniciado: ${lojaIds.join(', ')} a cada ${intervalMinutes}min`);
    } catch (error) {
      console.error('[SmartMarket] ❌ Erro ao iniciar Scheduler:', error.message);
    }
  } else {
    console.warn('[SmartMarket] ⚠️  Scheduler desativado (Supabase não conectado ou teste)');
  }
});

module.exports = app;
