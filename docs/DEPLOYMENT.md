# Easy Market — Deployment Guide

## Arquitetura de Produção

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js PWA)                 │
│  Railway/Vercel | CDN: Cloudflare | Cache: Redis            │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Fastify)                   │
│  Railway | Auto-scale (2-10 instâncias) | Rate limiting     │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  Queue (Redis Streams) | Cache Layer | Session Storage      │
│  Railway Redis | Replicação automática | Backup 30 dias     │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  TimescaleDB (Postgres) | Backup automático                 │
│  Supabase ou Timescale Cloud | WAL para disaster recovery   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  Workers (Python + Prophet) | Scheduled jobs                │
│  Railway Job Services | Escalável conforme carga            │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Infraestrutura na Railway

### Pré-requisitos
- Conta Railway (https://railway.app)
- GitHub conectado
- Docker (local)

### Deploy Backend

```bash
# 1. Clone o repositório
git clone https://github.com/sxsevenxperts/easy-market.git
cd easy-market/backend

# 2. Crie Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
EOF

# 3. Deploy no Railway
railway link  # conecta ao projeto
railway deploy
```

**Variáveis de ambiente (.env.production):**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@timescaledb:5432/easy_market
REDIS_URL=redis://user:pass@redis:6379
JWT_SECRET=seu_secret_super_seguro_aqui
OPEN_METEO_API=https://api.open-meteo.com
LOG_LEVEL=info
```

### Deploy Frontend

```bash
cd frontend

# Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next .next
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
EOF

railway deploy
```

### Database Setup

```bash
# 1. Criar banco no Supabase/Timescale Cloud
# 2. Rodar migrations
psql postgresql://user:pass@host:5432/easy_market < migrations/001_init.sql
psql postgresql://user:pass@host:5432/easy_market < migrations/002_hypertable.sql
```

---

## 2. Configuração de Banco de Dados

### migrations/001_init.sql

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Table: lojas
CREATE TABLE lojas (
  loja_id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  municipio TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  fuso_horario TEXT,
  integrado_pdv BOOLEAN DEFAULT FALSE,
  integrado_balanca BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lojas_municipio ON lojas(municipio);

-- Table: produtos
CREATE TABLE produtos (
  sku TEXT PRIMARY KEY,
  loja_id TEXT NOT NULL REFERENCES lojas(loja_id),
  nome TEXT NOT NULL,
  categoria TEXT,
  data_vencimento DATE,
  estoque_atual INT DEFAULT 0,
  velocidade_media_saida NUMERIC,
  margem_lucro NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_produtos_loja ON produtos(loja_id);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_vencimento ON produtos(data_vencimento);

-- Hypertable: vendas
CREATE TABLE vendas (
  time TIMESTAMPTZ NOT NULL,
  loja_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  categoria TEXT,
  peso NUMERIC,
  preco NUMERIC,
  quantidade INT,
  temperatura NUMERIC,
  umidade NUMERIC,
  is_feriado BOOLEAN DEFAULT FALSE,
  evento_esportivo TEXT,
  PRIMARY KEY (time, loja_id, sku)
);

SELECT create_hypertable('vendas', 'time', if_not_exists => TRUE);

CREATE INDEX ON vendas (loja_id, time DESC);
CREATE INDEX ON vendas (categoria, time DESC);
CREATE INDEX ON vendas (sku, time DESC);

-- Compress old chunks (> 1 week)
ALTER TABLE vendas SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'loja_id,categoria'
);

SELECT add_compression_policy('vendas', INTERVAL '1 week');

-- Table: alertas
CREATE TABLE alertas (
  id SERIAL PRIMARY KEY,
  loja_id TEXT NOT NULL REFERENCES lojas(loja_id),
  sku TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'desperdicio', 'falta', etc
  urgencia TEXT, -- 'alta', 'media', 'baixa'
  status TEXT DEFAULT 'aberto', -- 'aberto', 'resolvido'
  mensagem TEXT,
  dados_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_alertas_loja_status ON alertas(loja_id, status);
CREATE INDEX idx_alertas_created ON alertas(created_at DESC);
```

---

## 3. Variables & Secrets

### Railway Project Settings

| Variável | Valor | Tipo |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Database |
| `REDIS_URL` | `redis://...` | Redis |
| `JWT_SECRET` | Gerado automaticamente | Secret |
| `API_KEY_OPEN_METEO` | Gratuito | Config |
| `SENTRY_DSN` | Para monitoramento | Secret |
| `STRIPE_SECRET_KEY` | Para pagamentos futuros | Secret |

---

## 4. Monitoramento & Logging

### Sentry Integration

```bash
npm install @sentry/node @sentry/tracing
```

**backend/src/config/sentry.js:**
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

module.exports = Sentry;
```

### Logs Estruturados

```bash
npm install pino pino-pretty
```

---

## 5. Backup & Disaster Recovery

### Backup Automático (Supabase/Timescale Cloud)

- Daily backups
- 30 dias de retenção
- PITR (Point-In-Time Recovery)

### Restore Manual

```bash
# Fazer dump
pg_dump postgresql://user:pass@host/easy_market > backup_2026_03_20.sql

# Restaurar
psql postgresql://user:pass@newhost/easy_market < backup_2026_03_20.sql
```

---

## 6. Performance & Caching

### Redis Cache Strategy

```javascript
// Cache previsões por 1 hora
await redis.setex(
  `forecast:${loja_id}:${categoria}`,
  3600,
  JSON.stringify(forecast)
);

// Invalidar ao processar nova venda crítica
await redis.del(`forecast:${loja_id}:*`);
```

### CDN for Static Assets

```bash
# Cloudflare Pages (gratuito)
# Aponta para frontend.railway.app
# TTL: 1 hora para HTML, 30 dias para JS/CSS
```

---

## 7. Escalabilidade Automática

### Railway Auto-scaling

**backend/railway.toml:**
```toml
[services.api]
builder = "dockerfile"
start_command = "npm start"
watch_paths = ["src"]
port = 3000

[services.api.deploy]
startCommand = "npm start"
restartPolicyType = "always"
restartPolicyMaxRetries = 3

# Autoscale: 2 a 10 instâncias
[services.api.scale]
min = 2
max = 10
```

---

## 8. CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy backend
        run: |
          npm ci
          npm run build
          railway deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 9. Health Checks

### Endpoint de Health Check

```javascript
// backend/src/api/health.js
app.get('/health', async (req, res) => {
  const checks = {
    db: await checkDatabase(),
    redis: await checkRedis(),
    api: 'ok'
  };

  const isHealthy = Object.values(checks).every(v => v === 'ok');
  res.status(isHealthy ? 200 : 503).json(checks);
});
```

### Railway Health Check Config

Aponta para: `GET /health`
Intervalo: 30s
Timeout: 5s

---

## 10. Cost Estimation

| Serviço | Custo | Notas |
|---|---|---|
| Railway API (2-10 vCPU) | ~$50/mês | Auto-scaling |
| Railway Database | ~$50/mês | Postgres + backups |
| Railway Redis | ~$20/mês | Cache + fila |
| Sentry (10k errors/mês) | Gratuito | Tier free |
| Cloudflare CDN | Gratuito | Traffic grátis |
| Open-Meteo API | Gratuito | Sem chave necessária |
| **TOTAL** | **~R$350/mês** | Para MVP |

---

## Checklist de Deploy

- [ ] Database migrations rodadas
- [ ] Variáveis de ambiente configuradas
- [ ] Sentry conectado para monitoramento
- [ ] GitHub Actions pipeline testado
- [ ] Health checks validados
- [ ] SSL/TLS ativado (automático no Railway)
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Backup schedule confirmado
- [ ] Alertas de erro configurados
