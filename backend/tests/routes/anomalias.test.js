/**
 * Tests for /api/v1/anomalias
 * Easy Market — Anomaly Detection
 */

const request = require('supertest');
const express = require('express');

// ── Mock AnomalyDetectionService before requiring the router ──────────────────
jest.mock('../../src/services/anomaly-detection');
const AnomalyDetectionService = require('../../src/services/anomaly-detection');

const anomaliasRouter = require('../../src/routes/anomalias');

// ── Mock return data ──────────────────────────────────────────────────────────
const mockPesoResult = {
  conforme: true,
  peso_detectado: 10.5,
  quantidade_esperada: 10,
  desvio_percentual: 5.0,
  status: 'dentro_do_limite',
};

const mockVendasResult = {
  anomalia_detectada: false,
  vendas_hoje: 850,
  media_historica: 900,
  desvio_percentual: -5.5,
  nivel_alerta: 'normal',
};

const mockEstoqueResult = {
  produtos_abaixo_minimo: [
    { id: 'P010', nome: 'Arroz 5kg', estoqueAtual: 3, estoqueMinimo: 10 },
  ],
  total_criticos: 1,
};

const mockVencendoResult = {
  produtos_vencendo: [
    { id: 'P020', nome: 'Iogurte', dias_para_vencer: 3, quantidade: 24 },
  ],
  total: 1,
};

const mockRelatorioResult = {
  periodo_horas: 24,
  total_anomalias: 4,
  por_tipo: { peso_discrepante: 2, estoque_minimo: 2 },
  criticas: 1,
};

const mockDashboardAnomalias = {
  total: 6,
  por_tipo: { peso_discrepante: 2, estoque_minimo: 1 },
  por_severidade: { critica: 2, alta: 1, media: 2, baixa: 1 },
};

// ── Helper: build Express app injecting mock supabase ─────────────────────────
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.supabase = null; // no real DB; routes fall back to simulation
    next();
  });
  app.use('/api/v1/anomalias', anomaliasRouter);
  return app;
}

// ── Setup mock instance ───────────────────────────────────────────────────────
let mockInstance;
beforeEach(() => {
  mockInstance = {
    verificarDiscrepanciaEstoque: jest.fn().mockResolvedValue(mockPesoResult),
    detectarAnomaliaVendas:       jest.fn().mockResolvedValue(mockVendasResult),
    monitorarEstoqueMinimo:       jest.fn().mockResolvedValue(mockEstoqueResult),
    detectarProdutosVencendoEm:   jest.fn().mockResolvedValue(mockVencendoResult),
    gerarRelatorioAnomalias:      jest.fn().mockResolvedValue(mockRelatorioResult),
    registrarAnomalia:            jest.fn().mockResolvedValue({ id: 'anom-1', status: 'pendente' }),
  };
  AnomalyDetectionService.mockImplementation(() => mockInstance);
});

// ── Test suites ───────────────────────────────────────────────────────────────

describe('POST /api/v1/anomalias/verificar-peso', () => {
  const validBody = {
    loja_id: 'loja-01',
    produto_id: 'P001',
    peso_detectado: 10.5,
    quantidade_esperada: 10,
  };

  it('should return 200 with conformity result when body is valid', async () => {
    const res = await request(buildApp())
      .post('/api/v1/anomalias/verificar-peso')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.resultado).toBeDefined();
    expect(res.body.resultado.conforme).toBe(true);
  });

  it('should return 400 when loja_id is missing', async () => {
    const { loja_id, ...body } = validBody;
    const res = await request(buildApp())
      .post('/api/v1/anomalias/verificar-peso').send(body);
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/);
  });

  it('should return 400 when peso_detectado is missing', async () => {
    const { peso_detectado, ...body } = validBody;
    const res = await request(buildApp())
      .post('/api/v1/anomalias/verificar-peso').send(body);
    expect(res.status).toBe(400);
  });

  it('should return 400 when quantidade_esperada is missing', async () => {
    const { quantidade_esperada, ...body } = validBody;
    const res = await request(buildApp())
      .post('/api/v1/anomalias/verificar-peso').send(body);
    expect(res.status).toBe(400);
  });

  it('should default unidade_peso to "kg"', async () => {
    await request(buildApp())
      .post('/api/v1/anomalias/verificar-peso').send(validBody);
    expect(mockInstance.verificarDiscrepanciaEstoque)
      .toHaveBeenCalledWith('loja-01', 'P001', 10.5, 10, 'kg');
  });
});

describe('POST /api/v1/anomalias/verificar-vendas', () => {
  const validBody = {
    loja_id: 'loja-01',
    categoria_id: 'cat-bebidas',
    vendas_hoje: 850,
    media_historica: 900,
  };

  it('should return 200 with anomaly check result when body is valid', async () => {
    const res = await request(buildApp())
      .post('/api/v1/anomalias/verificar-vendas')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.resultado).toBeDefined();
    expect(res.body.resultado.anomalia_detectada).toBe(false);
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(buildApp())
      .post('/api/v1/anomalias/verificar-vendas')
      .send({ loja_id: 'loja-01' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/);
  });
});

describe('GET /api/v1/anomalias/estoque-minimo/:loja_id', () => {
  it('should return 200 with a products list', async () => {
    const res = await request(buildApp())
      .get('/api/v1/anomalias/estoque-minimo/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.resultado).toBeDefined();
    expect(mockInstance.monitorarEstoqueMinimo).toHaveBeenCalledWith('loja-01', expect.any(Array));
  });

  it('should return 400 when produtos query param is invalid JSON', async () => {
    const res = await request(buildApp())
      .get('/api/v1/anomalias/estoque-minimo/loja-01?produtos=not-json');
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/JSON/);
  });
});

describe('GET /api/v1/anomalias/vencendo/:loja_id', () => {
  it('should return 200 with expiring products', async () => {
    const res = await request(buildApp())
      .get('/api/v1/anomalias/vencendo/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.resultado.produtos_vencendo).toBeInstanceOf(Array);
  });

  it('should default dias_alerta to 7', async () => {
    await request(buildApp()).get('/api/v1/anomalias/vencendo/loja-01');
    expect(mockInstance.detectarProdutosVencendoEm)
      .toHaveBeenCalledWith('loja-01', 7);
  });

  it('should accept a custom dias_alerta param', async () => {
    await request(buildApp()).get('/api/v1/anomalias/vencendo/loja-01?dias_alerta=3');
    expect(mockInstance.detectarProdutosVencendoEm)
      .toHaveBeenCalledWith('loja-01', 3);
  });

  it('should return 400 for invalid dias_alerta', async () => {
    const res = await request(buildApp())
      .get('/api/v1/anomalias/vencendo/loja-01?dias_alerta=0');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/anomalias/relatorio/:loja_id', () => {
  it('should return 200 with a 24h anomaly report', async () => {
    const res = await request(buildApp())
      .get('/api/v1/anomalias/relatorio/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.resultado.total_anomalias).toBe(4);
    expect(res.body.resultado.por_tipo).toBeDefined();
  });

  it('should default periodo_horas to 24', async () => {
    await request(buildApp()).get('/api/v1/anomalias/relatorio/loja-01');
    expect(mockInstance.gerarRelatorioAnomalias)
      .toHaveBeenCalledWith('loja-01', 24);
  });

  it('should return 400 for invalid periodo_horas', async () => {
    const res = await request(buildApp())
      .get('/api/v1/anomalias/relatorio/loja-01?periodo_horas=0');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/anomalias/dashboard/:loja_id', () => {
  it('should return 200 with summary counts', async () => {
    const res = await request(buildApp())
      .get('/api/v1/anomalias/dashboard/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.lojaId).toBe('loja-01');
    expect(res.body.total).toBeGreaterThanOrEqual(0);
    expect(res.body.porTipo).toBeDefined();
    expect(res.body.porSeveridade).toBeDefined();
    expect(res.body.porStatus).toBeDefined();
    expect(res.body.periodo).toBe('últimas 24h');
    expect(res.body.geradoEm).toBeDefined();
  });

  it('should return 500 when service throws', async () => {
    // Force an error by making supabase throw on query
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.supabase = {
        from: jest.fn(() => { throw new Error('DB crash'); }),
      };
      next();
    });
    app.use('/api/v1/anomalias', anomaliasRouter);

    const res = await request(app).get('/api/v1/anomalias/dashboard/loja-01');
    expect(res.status).toBe(500);
  });
});
