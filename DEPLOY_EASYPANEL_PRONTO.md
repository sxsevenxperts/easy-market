# 🚀 Deploy Smart Market no EasyPanel — Guia Completo

**Tempo estimado:** 15-20 minutos  
**Requisitos:** Conta no EasyPanel + GitHub ou arquivo local

---

## 📋 Pré-Requisitos

- [x] Código pronto em `/tmp/smart-market/`
- [x] npm install completo
- [x] .env com variáveis Supabase
- [x] Migrations SQL prontas
- [x] Docker configurado

---

## 🔧 Opção 1: Deploy via GitHub (Recomendado)

### Passo 1: Push para GitHub

```bash
cd /tmp/smart-market

# Inicializar git
git init
git add .
git commit -m "Initial commit: Smart Market v3.0 - Production Ready"

# Criar repositório no GitHub
# https://github.com/new → smart-market

# Fazer push
git remote add origin https://github.com/SEU_USER/smart-market.git
git branch -M main
git push -u origin main
```

---

### Passo 2: Conectar GitHub ao EasyPanel

**No EasyPanel Dashboard:**

1. **New App** (ou "Create App")
2. **Source:** GitHub
3. **Connect GitHub** (se primeira vez)
   - Autorizar EasyPanel no GitHub
   - Selecionar apenas repositório "smart-market"
4. **Select Repository:** smart-market
5. **Branch:** main
6. **Clique Next**

---

### Passo 3: Configurar Build

**Build Settings:**

- **Build Command:** `npm install && npm run build` (ou deixar vazio)
- **Start Command:** `npm start`
- **Root Directory:** `backend/` (raiz do backend)
- **Port:** 3000

**Clique Next**

---

### Passo 4: Variáveis de Ambiente

**Copie todas do `.env`:**

```env
# Database
DB_HOST=irzfpzroxwhufnmr.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Jacyara.10davimaria

# Supabase
SUPABASE_URL=https://irzfpzroxwhufnmr.supabase.co
SUPABASE_API_KEY=REMOVED...
SUPABASE_SERVICE_KEY=REMOVED...

# Server
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# JWT
JWT_SECRET=smart-market-secret-2026-super-seguro
JWT_EXPIRES_IN=7d

# CORS (IMPORTANTE: adicionar seu domínio)
CORS_ORIGIN=https://seu-dominio.com,https://app.seu-dominio.com

# Logging
LOG_LEVEL=info
```

**Clique Next**

---

### Passo 5: Resources & Settings

**Recomendado para produção:**

| Configuração | Valor |
|---|---|
| RAM | 512 MB (mínimo) |
| CPU | 0.5 cores |
| Storage | 1 GB |
| Réplicas | 1 (scale after) |
| Auto-restart | ✅ Ativado |
| Health check | `/health` |
| Timeout | 30s |

---

### Passo 6: Deploy

1. **Review** tudo
2. **Deploy Now**
3. Aguarde logs:
   ```
   ✓ Building Docker image...
   ✓ Pushing to registry...
   ✓ Deploying container...
   ✓ Health check: OK
   🚀 App is running!
   ```

---

## 📦 Opção 2: Upload de Arquivo Local

### Passo 1: Preparar Arquivo ZIP

```bash
cd /tmp/smart-market
zip -r smart-market.zip backend/ frontend/ Dockerfile docker-compose.yml .env -x "backend/node_modules/*"
```

---

### Passo 2: No EasyPanel

1. **New App** → **Upload File**
2. Selecione `smart-market.zip`
3. **Extract**
4. Configure igual à Opção 1 (passos 3-6)

---

## 🗞️ Passo Crítico: Criar Tabelas no Supabase

**Antes de iniciar o app no EasyPanel:**

1. Abra **Supabase Dashboard**
   - https://app.supabase.com → Seu projeto
2. **SQL Editor** → **New Query**
3. Cole o conteúdo de:
   ```
   /tmp/smart-market/backend/src/migrations/000_run_all_migrations.sql
   ```
4. **Execute**
5. Aguarde "Success"

**⚠️ SEM ISSO, O APP CRASCA NA INICIALIZAÇÃO**

---

## ✅ Verificações Pós-Deploy

### 1. Health Check

```bash
curl https://seu-app.easypanel.app/health
# Esperado: {"status":"ok"}
```

### 2. Endpoints Principais

```bash
# Previsão
curl -X POST https://seu-app.easypanel.app/api/v1/predicoes/forecast-tamanho-loja \
  -H "Content-Type: application/json" \
  -d '{"categoria_id":"alimentos","dias_historico":90,"tamanho_loja":"media"}'

# RFM
curl https://seu-app.easypanel.app/api/v1/rfm/loja/loja_001/dashboard

# Anomalias  
curl https://seu-app.easypanel.app/api/v1/anomalias/dashboard/loja_001
```

### 3. Logs no EasyPanel

**Acesse:** App → Logs
- Procure por: `🚀 Server running`
- Procure por: `✓ Supabase connected`
- Se houver erro: verifique variáveis de ambiente

---

## 🎯 Configurar Domínio Customizado

**No EasyPanel:**

1. Vá para **App Settings** → **Domains**
2. **Add Domain**
   - Digite: `api.seu-dominio.com`
3. **Seguir instruções DNS** (CNAME)
4. Aguarde propagação (5-30 min)
5. **Atualizar CORS_ORIGIN** no .env:
   ```
   CORS_ORIGIN=https://api.seu-dominio.com,https://seu-dominio.com
   ```
6. **Redeploy** (push novo commit ou manual)

---

## 🔐 SSL/TLS

**EasyPanel fornece HTTPS automaticamente:**
- Certificado Let's Encrypt (gratuito)
- Renovação automática
- Redirect HTTP → HTTPS (automático)

---

## 📊 Monitoramento no EasyPanel

**Acesse App → Monitoring:**

| Métrica | Target |
|---------|--------|
| CPU Usage | < 50% |
| Memory | < 400 MB |
| Uptime | 99.9%+ |
| Response Time | < 200ms |
| Error Rate | < 0.1% |

---

## 🚨 Troubleshooting

### Erro: "Container exited"

```
❌ Solução: Verificar logs
1. Acesse App → Logs
2. Procure por erro específico
3. Comum: SUPABASE_URL faltando
```

### Erro: "Health check failed"

```
❌ Solução:
1. Verificar se /health endpoint está respondendo
2. npm start está iniciando?
3. Port está correta (3000)?
```

### Erro: "Database connection refused"

```
❌ Solução:
1. Migrations foram executadas?
2. SUPABASE_URL está correto?
3. DB_PASSWORD está correto?
```

### Erro: "CORS blocked"

```
❌ Solução:
1. Adicionar domínio em CORS_ORIGIN
2. Fazer redeploy
3. Esperar cache limpar (~5 min)
```

---

## 🔄 CI/CD Automático (Opcional)

**EasyPanel com GitHub redeploy automaticamente:**

1. Push para main branch
2. GitHub webhook ativa
3. EasyPanel puxa código novo
4. Build automático
5. Deploy automático

**Sem fazer nada — tudo automático!**

---

## 📈 Scaling (Quando Crescer)

**No EasyPanel:**

1. App → Settings → Resources
2. Aumentar RAM/CPU
3. Aumentar Réplicas (load balancer automático)

**Quando:**
- Erro Rate > 1%
- CPU > 80%
- Response Time > 500ms

---

## 💾 Backups

**Supabase faz backups automáticos:**

1. Acesse **Supabase** → Seu projeto
2. **Settings** → **Backups**
3. Backups automáticos: 7 dias
4. Backups manuais: ilimitados

**Para restaurar:**
1. **Restore from backup**
2. Escolher data
3. Confirmar (⚠️ Irrevorsível)

---

## 🔐 Segurança em Produção

### Checklist Segurança

- [x] HTTPS ativado (automático)
- [ ] JWT_SECRET é forte (32+ caracteres)
- [ ] Database password não está em código
- [ ] API keys não estão em logs
- [ ] Rate limiting ativado
- [ ] CORS restrito apenas a domínios conhecidos
- [ ] Backup automático configurado
- [ ] Monitoring ativado

---

## 📞 Suporte EasyPanel

**Se tiver problemas:**

1. **Docs:** https://easypanel.io/docs
2. **Community:** https://discord.gg/easypanel
3. **Email:** support@easypanel.io
4. **Status:** https://status.easypanel.io

---

## ✨ Próximos Passos

1. **Deploy no EasyPanel** ← Você está aqui
2. Configurar domínio customizado
3. Setup SSL/TLS
4. Monitoramento (Sentry, New Relic)
5. Analytics (Mixpanel, Amplitude)
6. Backup strategy (3-2-1 rule)
7. Disaster recovery plan

---

## 🎉 Deploy Checklist

- [ ] Código no GitHub/arquivo pronto
- [ ] Migrations SQL executadas no Supabase
- [ ] .env com todas as variáveis
- [ ] npm install completo
- [ ] Docker pronto (opcional)
- [ ] EasyPanel app criado
- [ ] Variáveis de ambiente configuradas
- [ ] Health check retorna OK
- [ ] Endpoints respondendo
- [ ] Logs sem erros
- [ ] Domínio configurado (opcional)
- [ ] SSL/TLS ativado
- [ ] Monitoramento ativado

---

**Status:** 🟢 PRONTO PARA DEPLOY  
**Tempo de deploy:** 15-20 minutos  
**Downtime:** 0 (não há migração, novo deploy)  
**Versão:** 3.0.0  

**Uma vez deployado, o EasyPanel cuida de:**
- Auto-restart se cair
- Load balancing
- SSL/TLS
- Logs
- Monitoring
- Backups

Quer que eu revise algo específico sobre o EasyPanel? 🚀