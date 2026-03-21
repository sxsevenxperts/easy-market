/**
 * Tests for /api/v1/alertas
 * Easy Market — Gestão de Alertas de Loja
 */

const request = require('supertest');
const express = require('express');

const alertasRouter = require('../../src/routes/alertas');

// ── Shared mock Supabase builder ──────────────────────────────────────────────
function makeSupabaseMock(overrides = {}) {
  const defaultQuery = {
    select:  jest.fn().mockReturnThis(),
    insert:  jest.fn().mockReturnThis(),
    update:  jest.fn().mockReturnThis(),
    eq:      jest.fn().mockReturnThis(),
    in:      jest.fn().mockReturnThis(),
    gte:     jest.fn().mockReturnThis(),
    order:   jest.fn().mockReturnThis(),
    limit:   jest.fn().mockReturnThis(),
    range:   jest.fn().mockReturnThis(),
    single:  jest.fn().mockResolvedValue({ data: { loja_id: 'loja-01' }, error: null }),
  };

  return {
    from: jest.fn(() => ({ ...defaultQuery, ...overrides })),
  };
}

// ── Helper app factory ────────────────────────────────────────────────────────
function buildApp(supabaseMock) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.supabase = supabaseMock || makeSupabaseMock();
    next();
  });
  app.use('/api/v1/alertas', alertasRouter);
  return app;
}

// ── Mock alert data ───────────────────────────────────────────────────────────
const mockAlerta = {
  id: 'alert-uuid-1',
  loja_id: 'loja-01',
  tipo: 'falta_estoque',
  urgencia: 'alta',
  titulo: 'Ruptura de estoque: Arroz',
  mensagem: 'Produto abaixo do mínimo',
  status: 'aberto',
  roi_estimado: 250.00,
  created_at: new Date().toISOString(),
};

const mockAlertasList = [mockAlerta, { ...mockAlerta, id: 'alert-uuid-2', tipo: 'vencimento_proximo' }];

// ── Test suites ───────────────────────────────────────────────────────────────

describe('POST /api/v1/alertas', () => {
  const validBody = {
    loja_id: 'loja-01',
    tipo: 'falta_estoque',
    urgencia: 'alta',
    titulo: 'Ruptura de estoque: Arroz',
    mensagem: 'Produto abaixo do mínimo',
    dados_json: { dias_sem_estoque: 2, faturamento_diario: 125 },
  };

  it('should create an alert and return 201', async () => {
    const supabase = makeSupabaseMock();
    // lojas lookup
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { loja_id: 'loja-01' }, error: null }),
    }));
    // alertas insert
    supabase.from.mockImplementationOnce(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockAlerta, error: null }),
    }));

    const res = await request(buildApp(supabase))
      .post('/api/v1/alertas')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.tipo).toBe('falta_estoque');
  });

  it('should return 400 when loja_id is missing', async () => {
    const { loja_id, ...body } = validBody;
    const res = await request(buildApp())
      .post('/api/v1/alertas').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });

  it('should return 400 when tipo is invalid', async () => {
    const res = await request(buildApp())
      .post('/api/v1/alertas')
      .send({ ...validBody, tipo: 'tipo_invalido' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });

  it('should return 400 when titulo is missing', async () => {
    const { titulo, ...body } = validBody;
    const res = await request(buildApp())
      .post('/api/v1/alertas').send(body);
    expect(res.status).toBe(400);
  });

  it('should return 400 when urgencia is invalid', async () => {
    const res = await request(buildApp())
      .post('/api/v1/alertas')
      .send({ ...validBody, urgencia: 'urgentissimo' });
    expect(res.status).toBe(400);
  });

  it('should return 404 when loja does not exist', async () => {
    const supabase = makeSupabaseMock();
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    }));

    const res = await request(buildApp(supabase))
      .post('/api/v1/alertas').send(validBody);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('loja_not_found');
  });
});

describe('GET /api/v1/alertas/:loja_id', () => {
  it('should return 200 with an alerts array', async () => {
    const supabase = makeSupabaseMock();
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      range:  jest.fn().mockResolvedValue({ data: mockAlertasList, error: null }),
    }));

    const res = await request(buildApp(supabase))
      .get('/api/v1/alertas/loja-01');

    expect(res.status).toBe(200);
    expect(res.body.loja_id).toBe('loja-01');
    expect(Array.isArray(res.body.alertas)).toBe(true);
    expect(res.body.total).toBe(2);
  });

  it('should return 500 when supabase returns an error', async () => {
    const supabase = makeSupabaseMock();
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      range:  jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }));

    const res = await request(buildApp(supabase))
      .get('/api/v1/alertas/loja-01');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/v1/alertas/:loja_id/criticos', () => {
  it('should return 200 with critical alerts array', async () => {
    const supabase = makeSupabaseMock();
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      in:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      limit:  jest.fn().mockResolvedValue({ data: [mockAlerta], error: null }),
    }));

    const res = await request(buildApp(supabase))
      .get('/api/v1/alertas/loja-01/criticos');

    expect(res.status).toBe(200);
    expect(res.body.loja_id).toBe('loja-01');
    expect(Array.isArray(res.body.criticos)).toBe(true);
  });
});

describe('GET /api/v1/alertas/:loja_id/resumo', () => {
  it('should return 200 with a summary grouped by tipo and status', async () => {
    const rawAlertas = [
      { tipo: 'falta_estoque',     status: 'aberto',    roi_estimado: 250 },
      { tipo: 'vencimento_proximo', status: 'resolvido', roi_estimado: 100 },
      { tipo: 'falta_estoque',     status: 'aberto',    roi_estimado: 300 },
    ];

    const supabase = makeSupabaseMock();
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      gte:    jest.fn().mockResolvedValue({ data: rawAlertas, error: null }),
    }));

    const res = await request(buildApp(supabase))
      .get('/api/v1/alertas/loja-01/resumo');

    expect(res.status).toBe(200);
    expect(res.body.loja_id).toBe('loja-01');
    expect(Array.isArray(res.body.resumo)).toBe(true);

    const fataltaAberto = res.body.resumo.find(
      r => r.tipo === 'falta_estoque' && r.status === 'aberto'
    );
    expect(fataltaAberto).toBeDefined();
    expect(fataltaAberto.total).toBe(2);
    expect(fataltaAberto.roi_total).toBe(550);
  });
});
