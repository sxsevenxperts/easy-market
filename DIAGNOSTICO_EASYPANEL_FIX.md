# 🔧 Diagnóstico e Fix - EasyPanel Deploy

**Status:** 🔴 Erro no deploy - aplicação não está respondendo

---

## ⚠️ PROBLEMA IDENTIFICADO

A aplicação está com erro de deploy no EasyPanel. Possíveis causas:

1. ❌ Variáveis de ambiente não configuradas
2. ❌ Banco de dados não conectando
3. ❌ Módulo env faltando
4. ❌ Porta não exposta corretamente

---

## ✅ SOLUÇÃO - PASSO A PASSO

### PASSO 1: Verificar Variáveis de Ambiente no EasyPanel

No EasyPanel Dashboard → easymarket → Environment:

```
DATABASE_URL=postgresql://postgres:senha@localhost:5432/easy_market
SUPABASE_URL=https://seu-project.supabase.co
SUPABASE_API_KEY=sua-chave-publica
SUPABASE_SECRET_KEY=sua-chave-secreta
JWT_SECRET=seu-secret-jwt-super-seguro-123
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1
CORS_ORIGIN=https://easymarket.sevenxperts.solutions,http://localhost:3001
LOG_LEVEL=info
```

### PASSO 2: Corrigir Arquivo de Configuração

O erro "env module loading" significa que o arquivo .env ou o módulo está faltando.

**Solução:** Editar `/backend/src/server.js` para adicionar fallback:

```javascript
// No início do arquivo, após requires
try {
  require('dotenv').config();
} catch (err) {
  console.log('dotenv não carregado, usando variáveis de ambiente do sistema');
}

// Variáveis com defaults
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
```

### PASSO 3: Verificar package.json

Certifique-se que `dotenv` está no `backend/package.json`:

```json
{
  "dependencies": {
    "dotenv": "^16.3.1",
    "fastify": "^4.25.0",
    ...
  }
}
```

### PASSO 4: Reconstruir e Redeploy

No EasyPanel:
1. Clique em `Deploy` → `Rebuild`
2. Aguarde ~3-5 minutos
3. Verifique logs em `Logs`

### PASSO 5: Testar Conectividade

Após deploy sucesso, teste:

```bash
# Terminal local
curl https://easymarket.sevenxperts.solutions/api/v1/health

# Deve responder:
{"status": "ok"}
```

---

## 🔍 VERIFICAÇÃO DE LOGS

No EasyPanel, vá em **Logs** e procure por:

✅ Esperado:
```
Server running on port 3000
Database connected successfully
```

❌ Problema:
```
Cannot find module 'dotenv'
Cannot connect to database
```

---

## 🚀 CHECKLIST DE FIX

- [ ] Variáveis de ambiente configuradas
- [ ] dotenv adicionado ao package.json
- [ ] Fallback env implementado
- [ ] Backend rebuild no EasyPanel
- [ ] Health check respondendo
- [ ] Domínio acessível
- [ ] Logs sem erros

---

## 📝 Se Ainda Não Funcionar

1. **Verifique o domínio:**
   - Vá em EasyPanel → Domínios
   - Confirme que `easymarket.sevenxperts.solutions` está apontado para o serviço `easymarket`

2. **Verifique a porta:**
   - EasyPanel → easymarket → Port
   - Deve estar 3000

3. **Verifique SSL:**
   - EasyPanel → Certificados
   - SSL deve estar ativo e válido

4. **Reconstrua tudo:**
   - EasyPanel → Rebuild from scratch
   - Remove tudo e constrói novo

---

## 💡 ALTERNATIVA: Deploy Local para Testar

Se o EasyPanel continuar com erro, teste localmente primeiro:

```bash
cd /tmp/easy-market/backend
npm install
PORT=3000 npm start
```

Então acesse: http://localhost:3000/api/v1/health

Isso ajuda a identificar se o problema é do código ou do deploy.
