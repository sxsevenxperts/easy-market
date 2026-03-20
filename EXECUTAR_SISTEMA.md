# ▶️ EXECUTAR SISTEMA EASY MARKET - FLUXO 4 BLOCOS

## 🚀 Início Rápido (30 minutos)

### Pré-requisitos
- Node.js 18+
- Supabase account + credenciais
- Python 3.8+ (para ML Engine)
- npm install

### 1. Setup Base de Dados

```bash
# Criar arquivo .env na raiz
cat > /tmp/easy-market/.env << 'EOF'
# Supabase
SUPABASE_URL=https://qfkwqfrnemqregjqxkcr.supabase.co
SUPABASE_KEY=sb_publishable_vBAVB5lBnPY18GbnJxRlkA_fxMYrUmQ
SUPABASE_HOST=qfkwqfrnemqregjqxkcr.supabase.co
SUPABASE_DB=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=sua-senha-do-supabase

# Notificações
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=+55xxxx
EMAIL_USER=seu@gmail.com
EMAIL_PASS=sua-senha-de-app

# Sistema
NODE_ENV=production
PORT=3000
JWT_SECRET=sua-chave-secreta
REDIS_URL=redis://localhost:6379
EOF

# Executar SQL no Supabase
# Copiar conteúdo de SUPABASE_FULL_SETUP.sql
# Cole em: Supabase → SQL Editor → Execute
```

### 2. Instalar Dependências

```bash
# Backend
cd /tmp/easy-market/backend
npm install

# ML Engine
cd /tmp/easy-market/ml_engine
pip install -r requirements.txt
```

### 3. Iniciar Backend (Automação + Predicções)

```bash
cd /tmp/easy-market/backend
npm start
# ✅ Server iniciado em http://localhost:3000
# ✅ Scheduler inicializado automaticamente
```

**Você verá no console:**
```
🚀 Iniciando servidor...
✅ Conectado ao Supabase
🚀 Iniciando scheduler de automação...
✅ Scheduler inicializado com sucesso
  [Job] 00:00 - Treinar modelo
  [Job] 06:00 - Gerar predições
  [Job] 07:00 - Enviar relatórios
  [Job] 20:00 - Registrar vendas
  [Job] 23:00 - Calcular assertividade
🎯 Server rodando em porta 3000
```

### 4. Iniciar ML Engine (Predictor)

```bash
cd /tmp/easy-market/ml_engine
python api.py
# ✅ ML Engine iniciado em http://localhost:5000
```

### 5. Testar Sistema

```bash
# Verificar status do backend
curl http://localhost:3000/api/v1/health
# Resposta: { "status": "ok", "scheduler": "rodando" }

# Criar loja de teste
curl -X POST http://localhost:3000/api/v1/lojas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Loja Teste",
    "cidade": "Recife",
    "estado": "PE"
  }'

# Gerar predições (manual, agora)
curl -X POST http://localhost:3000/api/v1/predicoes/loja/{loja_id}/diaria

# Ver assertividade
curl http://localhost:3000/api/v1/predicoes/loja/{loja_id}/assertividade?dias=7
```

---

## 📊 FLUXO DE DADOS COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  BLOCO 1: COLETA (Stock/Validade)                              │
│  ├─ PDV envia vendas via webhook (tempo real)                  │
│  ├─ Balança envia pesos/codes                                  │
│  └─ Easy Market coleta dados via sincronização (cada hora)    │
│                 │                                               │
│                 ▼                                               │
│  BLOCO 2: PROCESSAMENTO (50+ Variáveis)                        │
│  ├─ Temporal (hora, dia, feriado, sazonalidade)               │
│  ├─ Clima (temperatura, chuva, umidade)                        │
│  ├─ Histórico (vendas anteriores, padrões)                    │
│  ├─ Econômico (preços, promoções, concorrência)               │
│  ├─ Operacional (caixas, fluxo, fila)                         │
│  └─ Eventos (Copa, Natal, eventos locais)                      │
│                 │                                               │
│                 ▼                                               │
│  BLOCO 3: IA PREDITIVA (Prophet + XGBoost + Ensemble)        │
│  ├─ Treina com 90+ dias de histórico                          │
│  ├─ Gera predição com intervalo de confiança                  │
│  ├─ Confiança: 85-95%                                          │
│  └─ Recomendações automáticas                                  │
│                 │                                               │
│                 ▼                                               │
│  BLOCO 4: ENVIO + ASSERTIVIDADE + APERFEIÇOAMENTO              │
│  ├─ WhatsApp (alertas críticos)                                │
│  ├─ Email (relatórios completos)                               │
│  ├─ SMS (urgência alta)                                        │
│  ├─ Registra vendas reais                                      │
│  ├─ Calcula erro % (assertividade)                             │
│  └─ Aperfeiçoa modelo para próximo dia                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⏰ TIMELINE AUTOMÁTICA

### **00:00 - TREINO DO MODELO**
```
[Scheduler] Coleta dados dos últimos 90 dias
[ML Engine] Treina Prophet com padrões sazonais
[ML Engine] Treina XGBoost com 50+ variáveis
[Backend] Salva modelo no banco de dados
✅ Logs: docker logs easy-market-backend | grep "Treinamento"
```

### **06:00 - PREDIÇÃO DIÁRIA**
```
[Scheduler] Para cada loja:
  [Backend] Coleta 50+ variáveis do dia
  [ML Engine] Faz predição para cada produto
  [Backend] Gera recomendações automáticas
  [Backend] Cria alertas críticos
✅ Logs: curl http://localhost:3000/api/v1/predicoes/loja/{id}/diaria
```

### **07:00 - ENVIO DE RELATÓRIOS**
```
[Scheduler] Para cada contato da loja:
  [Twilio] Envia WhatsApp com alertas
  [Nodemailer] Envia Email com relatório completo
  [Twilio] Envia SMS se urgência = ALTA
  [Backend] Registra envio no histórico
✅ Status: GET /api/v1/notificacao-contatos/{loja_id}
```

### **18:00-23:00 - WEBHOOK (TEMPO REAL)**
```
[PDV] Venda acontece
  → Webhook POST /integracao-pdv/venda
[Backend] Recebe venda em tempo real
  → Atualiza estoque
  → Verifica assertividade instant
  → Dispara alerta se necessário
✅ Status: Monitorar em tempo real no Dashboard
```

### **20:00 - SINCRONIZAÇÃO COM PDV**
```
[Scheduler] Para cada PDV integrado:
  [Backend] Faz GET no inventário do PDV
  [Backend] Atualiza produtos no banco
  [Backend] Registra timestamp de sincronização
✅ Verificar: GET /integracao-pdv/{loja_id}/status
```

### **23:00 - ASSERTIVIDADE + APERFEIÇOAMENTO**
```
[Scheduler] Para cada loja:
  [Backend] Busca previsões de hoje que têm realizado
  [Backend] Calcula: erro % = |previsto - realizado| / previsto
  [Backend] Calcula: assertividade = 100 - erro%
  [Backend] Registra no histórico para análise
  [ML Engine] Retreina modelo com novo dia de dados
✅ Verificar: GET /predicoes/loja/{id}/assertividade?dias=1
```

---

## 🔌 INTEGRAÇÃO COM SEU PDV

### **Passo 1: Registrar PDV no Easy Market**
```bash
curl -X POST http://localhost:3000/api/v1/integracao-pdv/configurar \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "seu-uuid-da-loja",
    "pdv_tipo": "linx|totvs|nex|custom_api",
    "pdv_api_key": "sua-chave-do-pdv",
    "pdv_host": "192.168.1.100",
    "pdv_porta": 8080
  }'
```

### **Passo 2: Configurar Webhook no PDV**

Em seu PDV, adicionar integração para chamar:
```
POST http://seu-server.com:3000/api/v1/integracao-pdv/venda
```

**Quando**: Cada vez que há uma venda

**Payload**:
```json
{
  "loja_id": "uuid",
  "transacao_id": "ECF001",
  "data_hora": "2026-03-20T18:35:00Z",
  "itens": [
    {
      "sku": "001234",
      "nome_produto": "Refrigerante 2L",
      "categoria": "Bebidas",
      "quantidade": 2,
      "preco_unitario": 5.50,
      "valor_total": 11.00
    }
  ],
  "valor_total": 11.00,
  "forma_pagamento": "dinheiro"
}
```

### **Passo 3: Testar Integração**
```bash
# Enviar venda de teste
curl -X POST http://localhost:3000/api/v1/integracao-pdv/venda \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "uuid",
    "transacao_id": "TEST001",
    "data_hora": "2026-03-20T18:35:00Z",
    "itens": [{...}],
    "valor_total": 11.00
  }'

# Verificar se chegou
curl http://localhost:3000/api/v1/integracao-pdv/uuid/status
```

---

## 📱 NOTIFICAÇÕES

### **Configurar Contatos (WhatsApp/Email)**
```bash
curl -X POST http://localhost:3000/api/v1/notificacao-contatos \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "uuid",
    "nome": "João Gerente",
    "cargo": "Gerente Geral",
    "telefone_whatsapp": "+5585988776655",
    "email": "joao@loja.com",
    "receber_alertas_whatsapp": true,
    "receber_alertas_email": true,
    "receber_relatorios": true
  }'
```

### **Exemplo de WhatsApp Enviado (07:00)**
```
📊 RELATÓRIO EASY MARKET - Loja Lagoa Junco
🕐 Sexta-feira, 20/03/2026 - 07:00

⚠️ ALERTAS CRÍTICOS:
  • FALTA DE ESTOQUE - Refrigerante 2L
    Previsto: 450 un | Estoque: 150 un
    Ação: REPOR 400 UNIDADES URGENTE

📈 PRODUTOS CRÍTICOS:
  1. Refrigerante 2L: 450 unidades (92% confiança)
  2. Cerveja: 180 unidades (88% confiança)
  3. Água: 120 unidades (91% confiança)

💰 IMPACTO FINANCEIRO:
  Potencial: R$ 2.475 em vendas
  Risco de perda: R$ 825 (se não repor)

🎯 Acesse o dashboard: https://easymarket.local/dashboard
```

---

## 📊 DASHBOARD

Visualizar tudo em tempo real:
```
http://localhost:3000/dashboard
```

**O que você vê:**
- Predições do dia para cada produto
- Assertividade do modelo
- Histórico de erros por produto
- Alertas criados
- Impacto financeiro
- Recomendações automáticas

---

## 🔍 MONITORAR ASSERTIVIDADE

```bash
# Ver assertividade dos últimos 7 dias
curl "http://localhost:3000/api/v1/predicoes/loja/{loja_id}/assertividade?dias=7"

Resposta:
{
  "assertividade_media": 87.3,
  "assertividade_minima": 75.2,
  "assertividade_maxima": 99.8,
  "previsoes_validadas": 168,
  "status_modelo": "bom",
  "recomendacao": "Modelo operacional. Adicionar mais variáveis para alcançar 95%."
}
```

### **Metas por Fase**
| Dia | Assertividade | Status | Ação |
|-----|--------------|--------|------|
| 1-3 | 70-75% | Em aprendizado | Aumentar dados |
| 4-7 | 80-85% | Aprendendo | Validar padrões |
| 8-30 | 85-90% | Bom | Otimizar variáveis |
| 30+ | 95%+ | Excelente | Manutenção |

---

## ❌ Troubleshooting

### Scheduler não está rodando
```bash
# Verificar se iniciou
curl http://localhost:3000/api/v1/health

# Verificar logs
docker logs easy-market-backend | grep "Scheduler"

# Reiniciar
npm restart backend
```

### WhatsApp não envia
```bash
# Verificar credenciais .env
echo $TWILIO_ACCOUNT_SID

# Se vazio, atualizar .env e reiniciar backend
npm restart backend
```

### Predições muito baixas/altas
```bash
# Adicionar mais dias de histórico
# Mínimo recomendado: 90 dias

# Verificar variáveis coletadas
GET /api/v1/predicoes/produto/{id}
# Analisar campo "variaveis_importantes"

# Se clima não está sendo coletado:
# Integrar Weather API (Open-Meteo)

# Se operacional não está sendo coletado:
# Integrar dados do PDV (caixas, fluxo)
```

---

## 🎯 Próximos Passos

1. **Dia 1-3**: Validar integração PDV + coleta de dados
2. **Dia 4-7**: Validar predições (comparar com realidade)
3. **Dia 8-30**: Otimizar variáveis (adicionar clima, eventos)
4. **Dia 30+**: Alcançar 95%+ de assertividade

---

## 📞 Suporte

- **API Docs**: `/docs/api.md`
- **Status**: `GET /api/v1/health`
- **Logs**: `docker logs easy-market-backend`
- **Dashboard**: `http://localhost:3000/dashboard`

---

**🚀 Sistema Easy Market v1.0 - Rodando!**
