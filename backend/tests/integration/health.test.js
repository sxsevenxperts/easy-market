/**
 * Integration Tests — Health & Status endpoints
 * Easy Market Backend
 */

const request = require('supertest');

// ── Import the Express app (index.js) ─────────────────────────────────────────
// We require the app module directly so no real listen() is needed.
let app;

beforeAll(() => {
  // Suppress the startup console banner
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  app = require('../../src/index');
});

afterAll(() => {
  jest.restoreAllMocks();
});

// ── GET /health ───────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('should return 200 with expected structure', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.servico).toBe('easy-market-backend');
    expect(res.body.status).toBe('online');
    expect(res.body.versao).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.endpoints).toBeDefined();
  });

  it('should include endpoint counts in the response', async () => {
    const res = await request(app).get('/health');

    expect(res.body.endpoints.rfm).toBeGreaterThan(0);
    expect(res.body.endpoints.alertas).toBeGreaterThan(0);
    expect(res.body.endpoints.anomalias).toBeGreaterThan(0);
    expect(res.body.endpoints.perdas).toBeGreaterThan(0);
    expect(res.body.totalEndpoints).toBeGreaterThan(0);
  });
});

// ── GET /status ───────────────────────────────────────────────────────────────
describe('GET /status', () => {
  it('should return 200 with uptime and memory info', async () => {
    const res = await request(app).get('/status');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.memory).toBeDefined();
    expect(res.body.memory.heapUsed).toBeGreaterThan(0);
    expect(res.body.memory.rss).toBeGreaterThan(0);
    expect(res.body.cpu).toBeDefined();
  });
});

// ── Route modules load without errors ─────────────────────────────────────────
describe('Route module loading', () => {
  it('loads perdas router without errors', () => {
    expect(() => require('../../src/routes/perdas')).not.toThrow();
  });

  it('loads rfm router without errors', () => {
    expect(() => require('../../src/routes/rfm')).not.toThrow();
  });

  it('loads anomalias router without errors', () => {
    expect(() => require('../../src/routes/anomalias')).not.toThrow();
  });

  it('loads alertas router without errors', () => {
    expect(() => require('../../src/routes/alertas')).not.toThrow();
  });

  it('loads dashboard router without errors', () => {
    expect(() => require('../../src/routes/dashboard')).not.toThrow();
  });

  it('loads vendas router without errors', () => {
    expect(() => require('../../src/routes/vendas')).not.toThrow();
  });

  it('loads clientes router without errors', () => {
    expect(() => require('../../src/routes/clientes')).not.toThrow();
  });
});

// ── 404 for unknown routes ────────────────────────────────────────────────────
describe('404 handling', () => {
  it('should return 404 with an error message for unknown routes', async () => {
    const res = await request(app).get('/api/v1/rota-que-nao-existe');

    expect(res.status).toBe(404);
    expect(res.body.sucesso).toBe(false);
    expect(res.body.erro).toMatch(/não encontrada/);
  });
});
