/**
 * Tests for /api/v1/perdas
 * Easy Market — Análise de Perdas de Produtos
 */

const request = require('supertest');
const express = require('express');

// ── Mock the perdas service before requiring the router ───────────────────────
jest.mock('../../src/services/perdas', () => ({
  calcularTaxaPerda: jest.fn(),
  calcularReducaoPerda: jest.fn(),
  listarProdutosComMaiorPerda: jest.fn(),
  registrarPerda: jest.fn(),
  analisarPerdasPorCategoria: jest.fn(),
  analisarMotivosPerdas: jest.fn(),
}));

const perdasService = require('../../src/services/perdas');
const perdasRouter  = require('../../src/routes/perdas');

// ── Helper: build a minimal Express app with the router ───────────────────────
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/perdas', perdasRouter);
  return app;
}
// ── Default mock return values ────────────────────────────────────────────────
const mockTaxaData = {
  taxa_perda_percentual: 2.5,
  valor_total_perdido: 1500.00,
  produtos_afetados: 12,
  classificacao: 'normal',
};

const mockReducaoData = {
  tendencia: 'melhora',
  reducao_percentual: 15.3,
  periodo_atual: { total: 1500 },
  periodo_anterior: { total: 1770 },
};

const mockProdutosData = [
  { produto_id: 'P001', nome: 'Frango Inteiro', quantidade_perdida: 45, valor_perdido: 675.00 },
  { produto_id: 'P002', nome: 'Banana Prata',   quantidade_perdida: 30, valor_perdido: 90.00 },
];

const mockCategoriasData = [
  { categoria: 'Hortifruti', total_perdas: 80, valor: 240.00 },
  { categoria: 'Carnes',     total_perdas: 45, valor: 900.00 },
];

const mockMotivosData = [
  { motivo: 'vencimento',   quantidade: 60, percentual: 45 },
  { motivo: 'avaria',       quantidade: 35, percentual: 26 },
];

// ── Test suites ───────────────────────────────────────────────────────────────

describe('GET /api/v1/perdas/taxa-atual/:loja_id', () => {
  beforeEach(() => {
    perdasService.calcularTaxaPerda.mockResolvedValue(mockTaxaData);
  });

  it('should return 200 with loss rate data', async () => {
    const res = await request(buildApp())
      .get('/api/v1/perdas/taxa-atual/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.taxa_perda_percentual).toBe(2.5);
    expect(res.body.timestamp).toBeDefined();
  });

  it('should pass the loja_id to the service', async () => {
    await request(buildApp()).get('/api/v1/perdas/taxa-atual/loja-42');
    expect(perdasService.calcularTaxaPerda).toHaveBeenCalledWith('loja-42', '30');
  });

  it('should accept a custom periodo query param', async () => {
    await request(buildApp()).get('/api/v1/perdas/taxa-atual/loja-01?periodo=7');
    expect(perdasService.calcularTaxaPerda).toHaveBeenCalledWith('loja-01', '7');
  });

  it('should return 500 when service throws', async () => {
    perdasService.calcularTaxaPerda.mockRejectedValue(new Error('DB error'));
    const res = await request(buildApp()).get('/api/v1/perdas/taxa-atual/loja-01');
    expect(res.status).toBe(500);
    expect(res.body.erro).toBeDefined();
  });
});

describe('GET /api/v1/perdas/reducao/:loja_id', () => {
  beforeEach(() => {
    perdasService.calcularReducaoPerda.mockResolvedValue(mockReducaoData);
  });

  it('should return 200 with comparative reduction data', async () => {
    const res = await request(buildApp()).get('/api/v1/perdas/reducao/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.data.tendencia).toBe('melhora');
    expect(res.body.data.reducao_percentual).toBe(15.3);
  });

  it('should return 500 when service throws', async () => {
    perdasService.calcularReducaoPerda.mockRejectedValue(new Error('fail'));
    const res = await request(buildApp()).get('/api/v1/perdas/reducao/loja-01');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/v1/perdas/produtos-maior-perda/:loja_id', () => {
  beforeEach(() => {
    perdasService.listarProdutosComMaiorPerda.mockResolvedValue(mockProdutosData);
  });

  it('should return 200 with an array of top-loss products', async () => {
    const res = await request(buildApp())
      .get('/api/v1/perdas/produtos-maior-perda/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].produto_id).toBe('P001');
  });

  it('should default to limite 10', async () => {
    await request(buildApp()).get('/api/v1/perdas/produtos-maior-perda/loja-01');
    expect(perdasService.listarProdutosComMaiorPerda).toHaveBeenCalledWith('loja-01', 10);
  });

  it('should accept a custom limite query param', async () => {
    await request(buildApp())
      .get('/api/v1/perdas/produtos-maior-perda/loja-01?limite=5');
    expect(perdasService.listarProdutosComMaiorPerda).toHaveBeenCalledWith('loja-01', 5);
  });
});

describe('GET /api/v1/perdas/por-categoria/:loja_id', () => {
  beforeEach(() => {
    perdasService.analisarPerdasPorCategoria.mockResolvedValue(mockCategoriasData);
  });

  it('should return 200 with categories array', async () => {
    const res = await request(buildApp()).get('/api/v1/perdas/por-categoria/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].categoria).toBe('Hortifruti');
  });
});

describe('GET /api/v1/perdas/motivos/:loja_id', () => {
  beforeEach(() => {
    perdasService.analisarMotivosPerdas.mockResolvedValue(mockMotivosData);
  });

  it('should return 200 with motivos array', async () => {
    const res = await request(buildApp()).get('/api/v1/perdas/motivos/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].motivo).toBe('vencimento');
  });
});

describe('POST /api/v1/perdas/registrar', () => {
  const validBody = {
    loja_id: 'loja-01',
    produto_id: 'P001',
    quantidade_perdida: 5,
    motivo: 'vencimento',
    observacoes: 'Caixa aberta',
  };

  beforeEach(() => {
    perdasService.registrarPerda.mockResolvedValue({ id: 'perda-uuid-1', ...validBody });
  });

  it('should return 201 when all required fields are provided', async () => {
    const res = await request(buildApp())
      .post('/api/v1/perdas/registrar')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('should return 400 when loja_id is missing', async () => {
    const { loja_id, ...body } = validBody;
    const res = await request(buildApp())
      .post('/api/v1/perdas/registrar').send(body);
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/);
  });

  it('should return 400 when produto_id is missing', async () => {
    const { produto_id, ...body } = validBody;
    const res = await request(buildApp())
      .post('/api/v1/perdas/registrar').send(body);
    expect(res.status).toBe(400);
  });

  it('should return 400 when quantidade_perdida is missing', async () => {
    const { quantidade_perdida, ...body } = validBody;
    const res = await request(buildApp())
      .post('/api/v1/perdas/registrar').send(body);
    expect(res.status).toBe(400);
  });

  it('should return 400 when motivo is missing', async () => {
    const { motivo, ...body } = validBody;
    const res = await request(buildApp())
      .post('/api/v1/perdas/registrar').send(body);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/perdas/relatorio-completo/:loja_id', () => {
  beforeEach(() => {
    perdasService.calcularTaxaPerda.mockResolvedValue(mockTaxaData);
    perdasService.calcularReducaoPerda.mockResolvedValue(mockReducaoData);
    perdasService.listarProdutosComMaiorPerda.mockResolvedValue(mockProdutosData);
    perdasService.analisarPerdasPorCategoria.mockResolvedValue(mockCategoriasData);
    perdasService.analisarMotivosPerdas.mockResolvedValue(mockMotivosData);
  });

  it('should return 200 with a full report structure', async () => {
    const res = await request(buildApp())
      .get('/api/v1/perdas/relatorio-completo/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.loja_id).toBe('loja-01');
    expect(res.body.data).toHaveProperty('taxa_atual');
    expect(res.body.data).toHaveProperty('reducao_comparativa');
    expect(res.body.data).toHaveProperty('top_produtos_perda');
    expect(res.body.data).toHaveProperty('perdas_por_categoria');
    expect(res.body.data).toHaveProperty('perdas_por_motivo');
    expect(res.body.data).toHaveProperty('resumo_executivo');
    expect(res.body.data.resumo_executivo.status_geral).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('should return 500 when any service throws', async () => {
    perdasService.calcularTaxaPerda.mockRejectedValue(new Error('timeout'));
    const res = await request(buildApp())
      .get('/api/v1/perdas/relatorio-completo/loja-01');
    expect(res.status).toBe(500);
  });
});
