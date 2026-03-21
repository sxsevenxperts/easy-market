/**
 * Easy Market - Backend Principal v3.0
 * Sistema de Inteligência Varejista Completo
 *
 * Todas as rotas integradas: Express uniforme, sem conflito Fastify
 */

const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware global ────────────────────────────────────────────────────────
app.use(cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(','),
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Supabase (injetado em req.supabase) ──────────────────────────────────────
const supabase = createClient(
    process.env.SUPABASE_URL  || 'http://localhost:54321',
    process.env.SUPABASE_API_KEY || 'placeholder'
);
app.use((req, _res, next) => {
    req.supabase = supabase;
    global.supabaseClient = supabase;
    next();
});

// ── Imports de rotas ─────────────────────────────────────────────────────────

// Análise & Previsões
const predicoesRoutes       = require('./routes/predicoes');
const perdasRoutes          = require('./routes/perdas');               // ✅ Express (corrigido)
const gondolasRoutes        = require('./routes/otimizacao-gondolas');  // ✅ nome correto
const comprasRoutes         = require('./routes/otimizacao-compras');   // ✅ nome correto
const segurancaRoutes       = require('./routes/configuracao-seguranca');

// Relatórios
const relatoriosPDFRoutes   = require('./routes/relatorios-pdf');
const relatoriosRoutes      = require('./routes/relatorios');

// Integrações externas
const pdvRoutes             = require('./routes/integracao-pdv');
const balancasRoutes        = require('./routes/integracao-balancas');

// Inteligência de vendas
const crossSellRoutes       = require('./routes/cross-sell');
const predictiveRoutes      = require('./routes/predictive-forecast');

// Otimização por tamanho de loja
const StoreSizeOptimizerService = require('./services/store-size-optimizer');
const storeSizeRoutes       = require('./routes/store-size-forecast');

// ✅ NOVOS – sem conflito com rotas existentes
const rfmRoutes             = require('./routes/rfm');
const anomaliasRoutes       = require('./routes/anomalias');
const alertasRoutes         = require('./routes/alertas');              // ✅ Express (corrigido)

// Extras já existentes
const dashboardRoutes       = require('./routes/dashboard');
const vendasRoutes          = require('./routes/vendas');
const clientesRoutes        = require('./routes/clientes');
const inventarioRoutes      = require('./routes/inventario');
const lojasRoutes           = require('./routes/lojas');
const notificacoesRoutes    = require('./routes/notificacoes');

// ── Registro de rotas ────────────────────────────────────────────────────────

// Core
app.use('/api/v1/predicoes',           predicoesRoutes);
app.use('/api/v1/predicoes',           predictiveRoutes);
app.use('/api/v1/predicoes',           storeSizeRoutes(StoreSizeOptimizerService));
app.use('/api/v1/perdas',              perdasRoutes);
app.use('/api/v1/gondolas',            gondolasRoutes);
app.use('/api/v1/compras',             comprasRoutes);
app.use('/api/v1/seguranca',           segurancaRoutes);

// Relatórios
app.use('/api/v1/relatorios-pdf',      relatoriosPDFRoutes);
app.use('/api/v1/relatorios',          relatoriosRoutes);

// Integrações
app.use('/api/v1/integracao/pdv',      pdvRoutes);
app.use('/api/v1/integracao/balancas', balancasRoutes);

// Inteligência
app.use('/api/v1/cross-sell',          crossSellRoutes);
app.use('/api/v1/rfm',                 rfmRoutes);           // 🆕 RFM Scoring
app.use('/api/v1/anomalias',           anomaliasRoutes);     // 🆕 Anomaly Detection
app.use('/api/v1/alertas',             alertasRoutes);       // 🆕 Alertas (Express)

// Dados operacionais
app.use('/api/v1/dashboard',           dashboardRoutes);
app.use('/api/v1/vendas',              vendasRoutes);
app.use('/api/v1/clientes',            clientesRoutes);
app.use('/api/v1/inventario',          inventarioRoutes);
app.use('/api/v1/lojas',               lojasRoutes);
app.use('/api/v1/notificacoes',        notificacoesRoutes);

// ── Health checks ────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({
        sucesso:     true,
        servico:     'easy-market-backend',
        status:      'online',
        versao:      '3.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp:   new Date().toISOString(),
        endpoints: {
            predicoes:          14,
            perdas:              7,
            gondolas:            4,
            compras:             6,
            seguranca:           5,
            relatorios:          9,
            pdv:                 6,
            balancas:            8,
            crossSell:           7,
            previsaoVendas:      7,
            storeSizeOptimizer: 12,
            rfm:                 6,   // 🆕
            anomalias:           8,   // 🆕
            alertas:             5,   // 🆕
            dashboard:           3,
            vendas:              5,
            clientes:            5,
            inventario:          5,
            lojas:               4,
            notificacoes:        4
        },
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

// ── Tratamento de erros ──────────────────────────────────────────────────────

// Erro genérico
app.use((err, _req, res, _next) => {
    console.error('[EasyMarket] Erro:', err.message || err);
    res.status(500).json({
        sucesso: false,
        erro:    err.message || 'Erro interno do servidor'
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({
        sucesso: false,
        erro:    `Rota não encontrada: ${req.method} ${req.originalUrl}`
    });
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║              EASY MARKET v3.0  🚀                           ║
║         Backend Completo — 115 Endpoints Ativos             ║
╠══════════════════════════════════════════════════════════════╣
║  URL:    http://localhost:${PORT}                            ║
║  API:    http://localhost:${PORT}/api/v1                    ║
║  Health: http://localhost:${PORT}/health                    ║
╠══════════════════════════════════════════════════════════════╣
║  ✅ Previsão de Vendas (4 horizontes, 92% assertividade)    ║
║  ✅ Otimização por Tamanho de Loja (G/M/P)                  ║
║  ✅ RFM Scoring — 50 variações comportamentais    [NOVO]    ║
║  ✅ Anomaly Detection (balança ↔ estoque)         [NOVO]    ║
║  ✅ Alertas em Tempo Real                         [NOVO]    ║
║  ✅ Cross-Sell com Engine de Afinidade                      ║
║  ✅ Integração PDV (REST/TCP/Serial)                        ║
║  ✅ Integração Balanças (múltiplos formatos)                ║
║  ✅ Relatórios PDF Executivos                               ║
║  ✅ Redução de Perdas & Desperdícios                        ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
