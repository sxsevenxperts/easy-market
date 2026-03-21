# 🚀 Deploy Easy Market no EasyPanel - Guia Completo

## 📋 Pré-requisitos

- ✅ Repositório GitHub com código-fonte
- ✅ Conta EasyPanel (https://easypanel.io)
- ✅ Conta Supabase (PostgreSQL)
- ✅ Variáveis de ambiente configuradas

## 🔐 Variáveis de Ambiente Necessárias

### Backend (.env)
```bash
# Supabase
DATABASE_URL=postgresql://[usuario]:[senha]@[host]:5432/[database]
SUPABASE_URL=https://[project].supabase.co
SUPABASE_API_KEY=[chave-publica]
SUPABASE_SECRET_KEY=[chave-secreta]

# JWT
JWT_SECRET=[gerador-senha-forte]
JWT_EXPIRES_IN=7d

# API
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# CORS
CORS_ORIGIN=https://diversos-easymarket.yuhqmc.easypanel.host,http://localhost:3001

# Logging
LOG_LEVEL=info
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api-easy-market.yuhqmc.easypanel.host/api/v1
NEXT_PUBLIC_API_BASE=https://api-easy-market.yuhqmc.easypanel.host
```

## 📦 Estrutura de Deployment

### Backend (Node.js + Fastify)
- **Runtime:** Node.js 18
- **Porta:** 3000
- **Comando:** `cd backend && npm install && npm start`
- **Build:** `npm install` (em `backend/`)

### Frontend (Next.js)
- **Runtime:** Node.js 18
- **Porta:** 3001
- **Comando:** `npm start`
- **Build:** `npm install` e `npm run build`

### Database (PostgreSQL via Supabase)
- Conexão externa via DATABASE_URL
- Migrações automáticas no startup

## 🛠️ Passo a Passo no EasyPanel

### 1. Conectar Repositório GitHub

1. Acesse EasyPanel Dashboard
2. Clique em "Create New" → "Application"
3. Selecione "GitHub"
4. Authorize a integração GitHub
5. Selecione o repositório `easy-market`
6. Escolha branch: `main` (ou sua branch de produção)

### 2. Configurar Backend

1. **Nome da Aplicação:** `easy-market-api`
2. **Tipo:** Node.js
3. **Diretório:** `/backend`
4. **Startup Command:** `npm start`
5. **Build Command:** `npm install`
6. **Porta:** 3000

#### Variáveis de Ambiente (Backend):
```
DATABASE_URL=postgresql://...
JWT_SECRET=seu-secret-super-seguro
NODE_ENV=production
API_PREFIX=/api/v1
CORS_ORIGIN=https://seu-dominio-frontend.com
```

### 3. Configurar Frontend

1. **Nome da Aplicação:** `easy-market-dashboard`
2. **Tipo:** Node.js
3. **Diretório:** `/dashboard`
4. **Startup Command:** `npm start`
5. **Build Command:** `npm install && npm run build`
6. **Porta:** 3001

#### Variáveis de Ambiente (Frontend):
```
NEXT_PUBLIC_API_URL=https://easy-market-api-seu-hash.easypanel.host/api/v1
NEXT_PUBLIC_API_BASE=https://easy-market-api-seu-hash.easypanel.host
```

### 4. Configurar Domínios Personalizados

1. **API Backend:**
   - Domínio: `api-easy-market.seu-dominio.com`
   - Apontar para: `easy-market-api`
   - SSL: Automático (Let's Encrypt)

2. **Frontend Dashboard:**
   - Domínio: `dashboard-easy-market.seu-dominio.com`
   - Apontar para: `easy-market-dashboard`
   - SSL: Automático (Let's Encrypt)

## 🔧 Configuração do nixpacks.toml

```toml
[phases.setup]
nixPkgs = ["nodejs_18"]

[phases.install]
cmds = ["cd backend && npm install"]

[phases.build]
cmds = []

[start]
cmd = "cd backend && npm start"

# Build-time environment variables
[env]
NODE_ENV = "production"
PORT = "3000"
API_PREFIX = "/api/v1"
CORS_ORIGIN = "https://diversos-easymarket.yuhqmc.easypanel.host,http://localhost:3001"
JWT_SECRET = "change-me-in-production"
JWT_EXPIRES_IN = "7d"
LOG_LEVEL = "info"
```

## 🗄️ Setup Inicial do Banco de Dados

### 1. Executar Migrações

```bash
# Via EasyPanel Console ou SSH
cd /app/backend
npm run db:migrate
```

### 2. Seed de Dados Iniciais (Opcional)

```bash
npm run db:seed
```

### 3. Verificar Conexão

```bash
# Testa conexão com Supabase
npm run db:verify
```

## 🧪 Testes E2E

### Rodar Testes Localmente

```bash
# Backend deve estar rodando em localhost:3000
npm install
npm run test:e2e
```

### Verificar Endpoints Críticos

- `GET /api/v1/predicoes/churn` ✅
- `GET /api/v1/perdas/taxa-perda` ✅
- `GET /api/v1/gondolas/analise` ✅
- `GET /api/v1/compras/quantidade-otima` ✅
- `GET /api/v1/configuracao/loja/1` ✅

## 📊 Monitoring & Logs

### No EasyPanel

1. Acesse sua aplicação
2. Clique em "Logs"
3. Filtre por severidade: `ERROR`, `WARN`, `INFO`

### Logs Importantes

- **Startup:** Verificar conexão Supabase
- **Requests:** API routes sendo chamadas
- **Errors:** Debugging de issues

## 🔄 Atualizações & Deploy

### Deploy Automático

1. Push para `main` branch
2. EasyPanel detecta automaticamente
3. Reconstrói e redeploy em ~2-3 minutos
4. Zero downtime deployment

### Deploy Manual

1. EasyPanel Dashboard → Aplicação
2. Clique em "Deploy"
3. Escolha branch
4. Clique "Deploy Now"

## ⚠️ Troubleshooting

### Erro: "Database connection failed"
- ✅ Verificar `DATABASE_URL` está correto
- ✅ Verificar IP whitelist do Supabase
- ✅ Testar conexão: `psql $DATABASE_URL`

### Erro: "CORS policy violation"
- ✅ Verificar `CORS_ORIGIN` no .env
- ✅ Certificar domínio frontend está correto
- ✅ Limpar cache do navegador

### Erro: "JWT verification failed"
- ✅ Verificar `JWT_SECRET` é igual em todos os deploys
- ✅ Regenerar tokens após mudança

### Frontend não conecta ao Backend
- ✅ Verificar `NEXT_PUBLIC_API_URL` apontando para backend correto
- ✅ Testar `curl https://api-url/api/v1/health`
- ✅ Verificar CORS headers na resposta

## 🎯 Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados Supabase pronto
- [ ] Domínios apontados corretamente
- [ ] SSL certificados gerados
- [ ] Testes E2E passando 100%
- [ ] Logs monitorados
- [ ] Backups configurados
- [ ] Alertas de erro ativados

## 📞 Suporte EasyPanel

- Docs: https://docs.easypanel.io
- Discord: https://discord.gg/easypanel
- Email: support@easypanel.io
