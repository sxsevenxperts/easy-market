# 🎯 Configuração Final do EasyPanel - Easy Market

**Status:** ✅ Sistema pronto, aguardando configuração no EasyPanel

**Data:** 21 de Março de 2026

---

## 📍 PASSO 1: Acessar EasyPanel Dashboard

Acesse: https://easypanel.io (ou seu domínio)

Vá para: **Projetos > diversos > easymarket**

---

## ⚙️ PASSO 2: Configurar Variáveis de Ambiente

### No EasyPanel: vá em **Settings > Environment Variables**

Adicione EXATAMENTE estas variáveis (substitua com seus valores reais):

```env
# Banco de Dados (Supabase)
DATABASE_URL=postgresql://postgres:[sua_senha]@db.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://[seu_project].supabase.co
SUPABASE_API_KEY=[sua_chave_publica_anon]
SUPABASE_SECRET_KEY=[sua_chave_secreta]

# API
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# CORS (domínio do frontend)
CORS_ORIGIN=https://easymarket.sevenxperts.solutions,http://localhost:3001

# JWT (gere uma senha FORTE!)
JWT_SECRET=seu-secret-super-seguro-mude-isso-123456789
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
```

### ⚠️ IMPORTANTE: Obter Credenciais Supabase

1. Vá em https://app.supabase.com
2. Selecione seu projeto
3. Clique em **Settings > API**
4. Copie:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_API_KEY`
   - `service_role secret` → `SUPABASE_SECRET_KEY`
5. Copie `database.new` password para `DATABASE_URL`

---

## 🔄 PASSO 3: Rebuild e Deploy

No EasyPanel:

1. Clique em **Rebuild**
2. Aguarde 3-5 minutos
3. Veja o log em **Logs** para confirmar sucesso

Esperado no log:
```
✅ Server running on port 3000
✅ Database connected successfully
✅ API routes loaded
```

---

## ✅ PASSO 4: Testar

Abra seu terminal e execute:

```bash
# Teste 1: Health check
curl https://easymarket.sevenxperts.solutions/api/v1/health

# Deve responder:
# {"status":"ok"}
```

```bash
# Teste 2: Endpoint de previsões
curl https://easymarket.sevenxperts.solutions/api/v1/predicoes/churn?cliente_id=1&loja_id=1

# Deve responder com JSON de churn prediction
```

```bash
# Teste 3: Listar relatórios
curl https://easymarket.sevenxperts.solutions/api/v1/relatorios/listar

# Deve responder com lista de relatórios gerados
```

---

## 🌐 PASSO 5: Frontend

Se o frontend também está no EasyPanel:

1. Vá em **Settings > Environment Variables** do dashboard
2. Configure:
```env
NEXT_PUBLIC_API_URL=https://easymarket.sevenxperts.solutions/api/v1
NEXT_PUBLIC_API_BASE=https://easymarket.sevenxperts.solutions
```

3. Clique **Rebuild**
4. Acesse o frontend em https://easymarket.sevenxperts.solutions

---

## 🆘 Se Ainda Não Funcionar

### ❌ Erro: "Cannot connect to database"

**Solução:**
1. Verifique `DATABASE_URL` está correto
2. No Supabase, vá em **Settings > Network**
3. Adicione IP do EasyPanel à whitelist (ou deixe aberto para testar)
4. Teste conexão localmente: `psql $DATABASE_URL`

### ❌ Erro: "JWT_SECRET is missing"

**Solução:**
1. Verifique `JWT_SECRET` está configurado
2. Clique **Save**
3. Faça **Rebuild**

### ❌ Erro: "CORS policy violation"

**Solução:**
1. Verifique `CORS_ORIGIN` inclui seu domínio frontend
2. Limpe cache do navegador (Ctrl+Shift+Delete)
3. Faça **Rebuild**

### ❌ Erro: "Module not found: dotenv"

**Solução:**
1. No EasyPanel, clique **Rebuild from Scratch**
2. Aguarde completar
3. Verifique logs

---

## 📊 Verificação de Status

### Após configuração, verifique:

- [ ] Variáveis de ambiente configuradas (6+ variáveis)
- [ ] Build completou sem erros
- [ ] Logs mostram "Server running on port 3000"
- [ ] Health check responde com {"status":"ok"}
- [ ] Endpoints respondem com dados JSON
- [ ] Domínio https://easymarket.sevenxperts.solutions está acessível

---

## 🚀 Checklist Final

- [ ] Supabase credenciais obtidas
- [ ] Variáveis de ambiente configuradas no EasyPanel
- [ ] Rebuild completado
- [ ] Health check testado
- [ ] Endpoints respondendo
- [ ] Logs sem erros
- [ ] Domínio funcionando

---

## 📞 Proximos Passos Após Ativar

1. **Seed de dados:** `npm run db:seed`
2. **Executar E2E tests:** `npm run test:e2e`
3. **Gerar primeiro relatório:** POST /relatorios/gerar-completo
4. **Monitorar logs:** EasyPanel > Logs
5. **Configurar alertas:** EasyPanel > Monitoring

---

## 💾 Backup de Configuração

Salve em um lugar seguro:

```
SUPABASE_URL: [seu_url]
SUPABASE_API_KEY: [sua_chave]
SUPABASE_SECRET_KEY: [sua_secret]
DATABASE_URL: [sua_db_url]
JWT_SECRET: [seu_secret]
```

---

**Tudo pronto! Siga os passos acima e o Easy Market estará rodando em produção! 🎉**
