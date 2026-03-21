/**
 * Jest Setup File — Easy Market Backend Tests
 * Mocks Supabase client and configures test environment variables.
 */

// ── Environment variables ─────────────────────────────────────────────────────
process.env.NODE_ENV         = 'test';
process.env.PORT             = '3001';
process.env.SUPABASE_URL     = 'http://localhost:54321';
process.env.SUPABASE_API_KEY = 'test-key-placeholder';
process.env.JWT_SECRET       = 'test-jwt-secret-placeholder';
process.env.DATABASE_URL     = 'postgresql://test:test@localhost:5432/test';
process.env.CORS_ORIGIN      = 'http://localhost:3001';
process.env.API_PREFIX       = '/api/v1';

// ── Suppress console noise ────────────────────────────────────────────────────
global.console.error = jest.fn();
global.console.warn  = jest.fn();
global.console.log   = jest.fn();

// ── Mock @supabase/supabase-js ────────────────────────────────────────────────
jest.mock('@supabase/supabase-js', () => {
  const mockQuery = {
    select:  jest.fn().mockReturnThis(),
    insert:  jest.fn().mockReturnThis(),
    update:  jest.fn().mockReturnThis(),
    delete:  jest.fn().mockReturnThis(),
    eq:      jest.fn().mockReturnThis(),
    neq:     jest.fn().mockReturnThis(),
    in:      jest.fn().mockReturnThis(),
    gte:     jest.fn().mockReturnThis(),
    lte:     jest.fn().mockReturnThis(),
    lt:      jest.fn().mockReturnThis(),
    gt:      jest.fn().mockReturnThis(),
    order:   jest.fn().mockReturnThis(),
    limit:   jest.fn().mockReturnThis(),
    range:   jest.fn().mockReturnThis(),
    single:  jest.fn().mockResolvedValue({ data: null, error: null }),
    count:   jest.fn().mockReturnThis(),
  };

  const mockFrom = jest.fn(() => mockQuery);

  const mockClient = {
    from: mockFrom,
    auth: {
      signIn:  jest.fn().mockResolvedValue({ user: null, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    createClient: jest.fn(() => mockClient),
    _mockClient:  mockClient,
    _mockQuery:   mockQuery,
  };
});
// ── Mock pg pool ──────────────────────────────────────────────────────────────
jest.mock('pg', () => {
  const mPool = {
    query:   jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn().mockResolvedValue({
      query:   jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    end: jest.fn().mockResolvedValue(undefined),
  };
  return { Pool: jest.fn(() => mPool) };
});

// ── Mock redis ────────────────────────────────────────────────────────────────
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect:  jest.fn().mockResolvedValue(undefined),
    ping:     jest.fn().mockResolvedValue('PONG'),
    get:      jest.fn().mockResolvedValue(null),
    set:      jest.fn().mockResolvedValue('OK'),
    del:      jest.fn().mockResolvedValue(1),
    quit:     jest.fn().mockResolvedValue(undefined),
    on:       jest.fn(),
    isReady:  true,
  })),
}));
