# 🚀 DEPLOY EASY MARKET NO EASYPANEL

## 📋 Pré-requisitos

- ✅ EasyPanel instalado no servidor (http://187.77.32.172:3000)
- ✅ Acesso SSH ao servidor
- ✅ Git instalado
- ✅ Node.js 18+ instalado
- ✅ Supabase account configurado
- ✅ Claude API Key (para revisor)

---

## 🎯 PASSO A PASSO

### **1️⃣ Clonar Repositório no Servidor**

```bash
# SSH no servidor
ssh root@187.77.32.172

# Ir para pasta de apps do EasyPanel
cd /var/www/apps  # ou o caminho do seu EasyPanel

# Clonar repositório
git clone https://github.com/seu-usuario/easy-market.git
cd easy-market

# Instalar dependências do backend
cd backend
npm install
cd ..
```

---

### **2️⃣ Criar App no EasyPanel**

Acesse: **http://187.77.32.172:3000** (seu EasyPanel)

**Opção A: UI do EasyPanel**
1. Clique em **"+ New App"** ou **"Applications"**
2. Escolha **"Node.js"** ou **"Docker"**
3. Preencha:
   - **Name**: `easy-market`
   - **Port**: `3000`
   - **Repository**: `https://github.com/seu-usuario/easy-market`
   - **Branch**: `main`
4. Clique **"Deploy"**

**Opção B: Docker (Recomendado)**
1. Clique **"+ New App"** → **"Docker"**
2. Cole o conteúdo de `docker-compose.yml`
3. Clique **"Deploy"**

---

### **3️⃣ Configurar Variáveis de Ambiente**

No EasyPanel, vá para **App → Settings → Environment Variables**

Adicione:

```bash
# Supabase
SUPABASE_URL=https://qfkwqfrnemqregjqxkcr.supabase.co
SUPABASE_KEY=sb_publishable_vBAVB5lBnPY18GbnJxRlkA_fxMYrUmQ
SUPABASE_HOST=qfkwqfrnemqregjqxkcr.supabase.co
SUPABASE_DB=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=sua-senha-super-secreta
SUPABASE_PORT=5432

# Node
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# JWT (gerar algo seguro)
JWT_SECRET=seu-jwt-super-secreto-aleatorio-12345
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*

# Claude (Revisor de Predições)
ANTHROPIC_API_KEY=sk-ant-v1-seu-key-aqui

# Twilio (opcional, para WhatsApp/SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_WHATSAPP_NUMBER=+55xxxx
TWILIO_SMS_NUMBER=+55xxxx

# Email (opcional, para relatórios)
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=seu-app-password
```

**Clique SAVE**

---

### **4️⃣ Executar Setup do Banco**

```bash
# Via SSH
ssh root@187.77.32.172

# Entrar no diretório
cd /var/www/apps/easy-market

# Executar SQL no Supabase
# 1. Copie o conteúdo de SUPABASE_FULL_SETUP.sql
# 2. Acesse: Supabase Dashboard → SQL Editor
# 3. Cole e execute

# OU via Node (se quiser)
npm run db:setup:supabase
```

---

### **5️⃣ Iniciar o App**

No EasyPanel:
1. Vá para **App → easy-market**
2. Clique **"Start"** ou **"Deploy"**

Ou via SSH:
```bash
# Dentro da pasta do app
npm start

# Você verá:
# ✓ Database connected
# ✓ Redis connected
# 🚀 Iniciando scheduler de automação...
# ✅ Scheduler inicializado com sucesso
# ✓ Server running on http://0.0.0.0:3000
```

---

### **6️⃣ Validar se Está Rodando**

```bash
# Testar saúde
curl http://187.77.32.172:3000/api/v1/health

# Resposta esperada:
{
  "status": "ok",
  "scheduler": "rodando",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

---

## 🔌 **INTEGRAÇÃO COM SEU PDV**

Agora configure seu PDV para enviar vendas:

### **No seu PDV (Linx, Totvs, Nex):**

Adicione integração webhook para chamar:

```
POST http://187.77.32.172:3000/api/v1/integracao-pdv/configurar

Body:
{
  "loja_id": "uuid-da-sua-loja",
  "pdv_tipo": "linx",  // ou "totvs", "nex"
  "pdv_api_key": "sua-chave-do-pdv",
  "pdv_host": "192.168.1.100",  // IP do seu PDV
  "pdv_porta": 8080
}
```

### **Ou via SSH:**

```bash
curl -X POST http://187.77.32.172:3000/api/v1/integracao-pdv/configurar \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "uuid-da-loja",
    "pdv_tipo": "linx",
    "pdv_api_key": "sua-chave",
    "pdv_host": "192.168.1.100",
    "pdv_porta": 8080
  }'
```

---

## 📱 **CONFIGURAR NOTIFICAÇÕES**

### **Criar Contato para WhatsApp/Email:**

```bash
curl -X POST http://187.77.32.172:3000/api/v1/notificacao-contatos \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "uuid-da-loja",
    "nome": "João Gerente",
    "cargo": "Gerente Geral",
    "telefone_whatsapp": "+5585988776655",
    "email": "joao@loja.com",
    "receber_alertas_whatsapp": true,
    "receber_alertas_email": true,
    "receber_relatorios": true
  }'
```

---

## 🤖 **CLAUDE REVISOR JÁ ATIVO**

O sistema agora funciona com:

```
PDV envia venda
  ↓
Backend faz predição (Prophet + XGBoost)
  ↓
Claude revisa a predição (IA inteligente)
  ↓
Ensemble combina as 2 análises
  ↓
Envia recomendação mais precisa
```

**Exemplo da resposta:**
```json
{
  "quantidade_prevista": 455,
  "confianca_final": 93.5,
  "metodo": "ensemble_local_claude",
  "detalhes": {
    "predicao_local": 450,
    "ajuste_claude": 460,
    "diferenca_percentual": "2.2%"
  },
  "validacao": {
    "alertas": ["Estoque baixo"],
    "recomendacoes": ["REPOR 400 UNIDADES"]
  }
}
```

---

## 📊 **TIMELINE AUTOMÁTICA FUNCIONANDO**

```
00:00 → Treina modelo ✓
06:00 → Faz predições com Claude revisor ✓
07:00 → Envia WhatsApp ✓
20:00 → Sincroniza com PDV ✓
23:00 → Calcula assertividade ✓
```

---

## 🔍 **MONITORAR SISTEMA**

### **Logs do EasyPanel:**
```bash
# Ver logs em tempo real
docker logs -f easy-market-backend

# Ou no EasyPanel UI → App → Logs
```

### **Verificar Assertividade:**
```bash
curl "http://187.77.32.172:3000/api/v1/predicoes/loja/{loja_id}/assertividade?dias=7"

Resposta:
{
  "assertividade_media": 93.5,
  "previsoes_validadas": 168,
  "status_modelo": "excelente"
}
```

---

## 🐛 **TROUBLESHOOTING**

### **App não inicia:**
```bash
# SSH e verificar
docker logs easy-market-backend

# Se erro de banco:
# 1. Verificar SUPABASE_PASSWORD em .env
# 2. Verificar se SQL foi executado no Supabase
# 3. Reiniciar: docker restart easy-market-backend
```

### **Claude não funciona:**
```bash
# Se ANTHROPIC_API_KEY vazia:
# 1. Gerar key em: https://console.anthropic.com
# 2. Adicionar em EasyPanel → Settings → Environment Variables
# 3. Reimplantar app
# Sem Claude = sistema continua funcionando (fallback matemático)
```

### **WhatsApp não envia:**
```bash
# Verificar credenciais Twilio:
# 1. TWILIO_ACCOUNT_SID
# 2. TWILIO_AUTH_TOKEN
# 3. TWILIO_WHATSAPP_NUMBER
# Se vazio = não envia (mas registra log)
```

---

## ✅ **CHECKLIST FINAL**

- [ ] App rodando no EasyPanel
- [ ] Database conectado (check /api/v1/health)
- [ ] Scheduler rodando (00:00, 06:00, 07:00, 20:00, 23:00)
- [ ] Claude revisor integrado
- [ ] PDV configurado e enviando vendas
- [ ] Contatos criados (WhatsApp/Email)
- [ ] Primeira predição gerada (06:00)
- [ ] WhatsApp/Email enviado (07:00)

---

## 🎯 **Próximos Passos**

1. **Testar com dados reais do PDV** (mínimo 7 dias)
2. **Validar assertividade** (objetivo: >85%)
3. **Otimizar variáveis** (adicionar clima, eventos)
4. **Atingir 95%+** de assertividade (após 30-60 dias)

---

**🚀 Easy Market no EasyPanel - PRONTO PARA PRODUÇÃO!**

Qualquer dúvida, chame! 📞
