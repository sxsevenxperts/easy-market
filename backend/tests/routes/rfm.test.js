/**
 * Tests for /api/v1/rfm
 * Easy Market — RFM Scoring
 */

const request = require('supertest');
const express = require('express');

// ── Mock RFMScoringService before requiring the router ────────────────────────
jest.mock('../../src/services/rfm-scoring');
const RFMScoringService = require('../../src/services/rfm-scoring');

const rfmRouter = require('../../src/routes/rfm');

// ── Mock return data ──────────────────────────────────────────────────────────
const mockSegmentacao = {
  total: 150,
  segmentos: {
    'Campeões':        [{ cliente_id: 'c1', score: 95 }, { cliente_id: 'c2', score: 92 }],
    'Clientes Fiéis':  [{ cliente_id: 'c3', score: 78 }],
  },
  resumo: [
    { segmento: 'Campeões',       total: 2, percentual: 1.3 },
    { segmento: 'Clientes Fiéis', total: 1, percentual: 0.7 },
  ],
};

const mockTopClientes = [
  { cliente_id: 'c1', nome: 'Ana Silva',   score: 95, segmento: 'Campeões' },
  { cliente_id: 'c2', nome: 'Bruno Costa', score: 92, segmento: 'Campeões' },
];

const mockClientesRisco = [
  { cliente_id: 'c10', nome: 'Carlos Lima',  score: 30, segmento: 'Em Risco' },
  { cliente_id: 'c11', nome: 'Diana Melo',   score: 25, segmento: 'Perdidos' },
];

const mockClienteRFM = {
  cliente_id: 'c1',
  recencia:   1,
  frequencia: 12,
  monetario:  4500.00,
  score:      95,
  segmento:   'Campeões',
};

// ── Helper: build a minimal Express app injecting a mock supabase ─────────────
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.supabase = {};   // injected — RFMScoringService receives it via constructor
    next();
  });
  app.use('/api/v1/rfm', rfmRouter);
  return app;
}

// ── Setup mock instance before each test ──────────────────────────────────────
let mockInstance;
beforeEach(() => {
  mockInstance = {
    segmentarTodosClientes: jest.fn().mockResolvedValue(mockSegmentacao),
    obterTopClientes:       jest.fn().mockResolvedValue(mockTopClientes),
    obterClientesRisco:     jest.fn().mockResolvedValue(mockClientesRisco),
    calcularRFMCliente:     jest.fn().mockResolvedValue(mockClienteRFM),
    obterRecomendacoesPorSegmento: jest.fn().mockReturnValue([]),
  };
  RFMScoringService.mockImplementation(() => mockInstance);
});

// ── Test suites ───────────────────────────────────────────────────────────────

describe('GET /api/v1/rfm/loja/:loja_id/segmentos', () => {
  it('should return 200 with a segments object and summary', async () => {
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/segmentos');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.total).toBe(150);
    expect(res.body.data.resumo).toBeInstanceOf(Array);
    expect(res.body.data.segmentos).toBeDefined();
  });

  it('should return 500 when service throws', async () => {
    mockInstance.segmentarTodosClientes.mockRejectedValue(new Error('DB fail'));
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/segmentos');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.erro).toBeDefined();
  });
});

describe('GET /api/v1/rfm/loja/:loja_id/top-clientes', () => {
  it('should return 200 with an array of clients and total count', async () => {
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/top-clientes');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(2);
    expect(res.body.data[0].cliente_id).toBe('c1');
  });

  it('should return 400 when limite is out of range', async () => {
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/top-clientes?limite=500');
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('should pass custom limite to the service', async () => {
    await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/top-clientes?limite=5');
    expect(mockInstance.obterTopClientes).toHaveBeenCalledWith('loja-01', 5);
  });
});

describe('GET /api/v1/rfm/loja/:loja_id/clientes-risco', () => {
  it('should return 200 with at-risk clients array and total', async () => {
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/clientes-risco');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(2);
    expect(res.body.data[0].segmento).toBe('Em Risco');
  });

  it('should return 500 when service throws', async () => {
    mockInstance.obterClientesRisco.mockRejectedValue(new Error('timeout'));
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/clientes-risco');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/v1/rfm/loja/:loja_id/dashboard', () => {
  it('should return 200 with complete dashboard structure', async () => {
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.loja_id).toBe('loja-01');
    expect(res.body.geradoEm).toBeDefined();
    expect(res.body.data.resumo).toBeDefined();
    expect(res.body.data.resumo.totalClientes).toBe(150);
    expect(res.body.data.resumo.totalEmRisco).toBe(2);
    expect(res.body.data.topClientes).toBeInstanceOf(Array);
    expect(res.body.data.clientesRisco).toBeInstanceOf(Array);
    expect(res.body.data.pesos).toBeDefined();
  });

  it('should return 500 when any service call fails', async () => {
    mockInstance.obterTopClientes.mockRejectedValue(new Error('fail'));
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/dashboard');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

describe('GET /api/v1/rfm/loja/:loja_id/cliente/:cliente_id', () => {
  it('should return 200 with a single client RFM score', async () => {
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/cliente/c1');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.cliente_id).toBe('c1');
    expect(res.body.data.score).toBe(95);
    expect(res.body.data.segmento).toBe('Campeões');
  });

  it('should call the service with correct loja_id and cliente_id', async () => {
    await request(buildApp())
      .get('/api/v1/rfm/loja/loja-99/cliente/c42');
    expect(mockInstance.calcularRFMCliente)
      .toHaveBeenCalledWith('loja-99', 'c42');
  });

  it('should return 500 when service throws', async () => {
    mockInstance.calcularRFMCliente.mockRejectedValue(new Error('not found'));
    const res = await request(buildApp())
      .get('/api/v1/rfm/loja/loja-01/cliente/c99');
    expect(res.status).toBe(500);
  });
});
