# 🔗 INTEGRAÇÃO PDV + SISTEMA EASY MARKET

## Visão Geral

O Easy Market é um **sistema de inteligência de varejo** que se integra com seu PDV (Linx, Totvs, Nex, etc) e balança eletrônica para fazer **predições automáticas de demanda** e enviar **recomendações inteligentes** via WhatsApp/Email.

```
┌──────────────────┐
│   PDV/Balança    │
│  (Linx, Totvs)   │
└────────┬─────────┘
         │ Webhook: vendas em tempo real
         ▼
┌──────────────────────────────┐
│   API EASY MARKET            │
│  • POST /integracao-pdv/venda │
│  • POST /predicoes/...       │
└────────┬─────────────────────┘
         │
    ┌────┴─────┬──────────┬────────────┐
    │           │          │            │
    ▼           ▼          ▼            ▼
  TREINA    PREDIZ    ENVIA RECOMENDAÇÕES
  (00:00)  (06:00)      (07:00/Webhook)
                         WhatsApp/Email/SMS
```

---

## 1️⃣ PASSO 1: Configurar Integração PDV

### A. Criar credenciais no PDV (Linx/Totvs/Nex)

Cada PDV tem um método diferente. Exemplos:

#### **Linx PDV**
1. Acessar Admin Linx → Integrações → Criar API Key
2. Anotar: `API_KEY` e IP do servidor Linx

#### **Totvs Microsiga**
1. Acessar Configuração → Web Services → Novo
2. Criar usuário REST com permissões de leitura

#### **Nex PDV**
1. Menu → Configurações → Integrações
2. Gerar token de API

### B. Registrar PDV no Easy Market

```bash
curl -X POST http://localhost:3000/api/v1/integracao-pdv/configurar \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "uuid-da-loja",
    "pdv_tipo": "linx",
    "pdv_api_key": "sua-chave-api",
    "pdv_host": "192.168.1.100",
    "pdv_porta": 8080
  }'
```

**Resposta:**
```json
{
  "loja_id": "...",
  "pdv_tipo": "linx",
  "status": "conectado",
  "connection_test": true
}
```

---

## 2️⃣ PASSO 2: Configurar Webhook (Tempo Real)

### O PDV envia vendas para Easy Market automaticamente

#### **Via Webhook (Recomendado)**

Configurar no seu PDV para chamar:
```
POST http://seu-servidor.com/api/v1/integracao-pdv/venda
```

**Payload esperado:**
```json
{
  "loja_id": "uuid-da-loja",
  "transacao_id": "001234",
  "data_hora": "2026-03-20T18:35:00Z",
  "itens": [
    {
      "sku": "001001",
      "nome_produto": "Refrigerante 2L",
      "categoria": "Bebidas",
      "quantidade": 2,
      "preco_unitario": 5.50,
      "valor_total": 11.00,
      "desconto_percentual": 0
    }
  ],
  "valor_total": 11.00,
  "forma_pagamento": "dinheiro",
  "operador": "joao"
}
```

#### **Via Sincronização Programada**

Se seu PDV não suporta webhook, o Easy Market sincroniza a cada hora:
```bash
POST /api/v1/integracao-pdv/:loja_id/sincronizar-inventario
```

---

## 3️⃣ PASSO 3: Fluxo Automático Diário

### Timeline (Totalmente Automático)

```
00:00 ┌─────────────────────────────────┐
      │ TREINO DO MODELO                │
      │ • Coleta dados dos últimos 90d  │
      │ • Treina Prophet + XGBoost      │
      │ • Calcula padrões de sazonalidade
      └─────────────────┬───────────────┘
                        │
06:00 ┌─────────────────▼───────────────┐
      │ PREDICÃO DO DIA                 │
      │ • Analisa 50+ variáveis         │
      │ • Gera predição para cada produto
      │ • Calcula confiança (85-95%)    │
      │ • Identifica alertas críticos   │
      └─────────────────┬───────────────┘
                        │
07:00 ┌─────────────────▼───────────────┐
      │ ENVIO DE RELATÓRIOS             │
      │ • WhatsApp para gerente         │
      │ • Email para compras            │
      │ • SMS para alertas críticos     │
      │ • Dashboard atualizado          │
      └─────────────────┬───────────────┘
                        │
18:00-22:00 (continuo) │
      │ WEBHOOK DO PDV: Recebe vendas   │
      │ • Atualiza estoque              │
      │ • Verifica assertividade em RT  │
      │ • Dispara alertas se necessário │
                        │
20:00 ┌─────────────────▼───────────────┐
      │ REGISTRO DE VENDAS (SYNC)       │
      │ • Sincroniza dados do PDV       │
      │ • Atualiza inventário          │
      │ • Registra transações          │
      └─────────────────┬───────────────┘
                        │
23:00 ┌─────────────────▼───────────────┐
      │ CÁLCULO DE ASSERTIVIDADE       │
      │ • Compara previsto vs realizado │
      │ • Calcula erro % de cada pred.  │
      │ • Registra métricas             │
      │ • Aperfeiçoa modelo para amanhã │
      └─────────────────────────────────┘
```

---

## 4️⃣ Endpoints do Sistema

### Configuração PDV
```bash
# Setup
POST /api/v1/integracao-pdv/configurar

# Check status
GET /api/v1/integracao-pdv/:loja_id/status

# Sincronizar inventário
POST /api/v1/integracao-pdv/:loja_id/sincronizar-inventario
```

### Predições
```bash
# Predição para 1 produto
POST /api/v1/predicoes/produto/:produto_id
Body: { loja_id: "..." }

# Predição diária (todos produtos)
POST /api/v1/predicoes/loja/:loja_id/diaria

# Registrar vendas reais
POST /api/v1/predicoes/registrar-realizado
Body: {
  previsao_id: "...",
  produto_id: "...",
  loja_id: "...",
  quantidade_realizada: 285,
  data_venda: "2026-03-20"
}

# Ver assertividade
GET /api/v1/predicoes/loja/:loja_id/assertividade?dias=7
```

### Alertas
```bash
# Listar alertas da loja
GET /api/v1/alertas/loja/:loja_id

# Marcar alerta como resolvido
PATCH /api/v1/alertas/:alerta_id
Body: { status: "resolvido" }
```

---

## 5️⃣ Exemplo de Implementação Completa

### Cenário: Segunda 35°C, Sexta (pós-salário)

**06:00 - PREDIÇÃO:**
```json
{
  "produto": "Refrigerante 2L",
  "quantidade_em_estoque": 150,
  "quantidade_prevista": 450,
  "confianca": 92,
  "intervalo": [400, 500],
  "risco": "ALTO - Falta de estoque",
  "recomendacoes": [
    "REPOR 400 UNIDADES URGENTE",
    "Colocar 3 garrafas por caixa (impulso)",
    "Abrir 5 caixas (fila será grande)",
    "Potencial: R$ 2.475 em vendas"
  ]
}
```

**07:00 - WHATSAPP ENVIADO:**
```
📊 RELATÓRIO EASY MARKET - Loja Lagoa Junco
🕐 Sexta-feira, 20/03/2026 - 07:00

⚠️ ALERTAS CRÍTICOS:
  • FALTA DE ESTOQUE - Refrigerante 2L
  • PROMOÇÃO RECOMENDADA - Cerveja (estoque acumulado)

📈 TOP PRODUTOS:
  ⚠️ Refrigerante 2L: 450 unidades (estoque: 150)
  ✅ Água Mineral: 120 unidades (estoque: 200)
  ✅ Cerveja: 90 unidades (estoque: 180)

🎯 Acesso: https://easymarket.local/dashboard
```

**18:00-23:00 - WEBHOOK (Tempo Real):**
```
PDV enviou 448 refrigerantes vendidos
Easy Market registrou: 98.4% de assertividade ✅
Modelo reafirma confiança para amanhã
```

**23:00 - ASSERTIVIDADE:**
```json
{
  "data": "2026-03-20",
  "previsto": 450,
  "realizado": 448,
  "erro_percentual": 0.4,
  "assertividade": 99.6,
  "status_modelo": "excelente"
}
```

---

## 6️⃣ Variáveis Coletadas (Bloco 2)

### Temporal
- Hora do dia (pico 18h)
- Dia da semana (sexta vende +50%)
- Semana do mês (pós-salário vende +40%)
- Mês do ano (dez. +50%, jan. -30%)
- Feriados (multiplicador especial)

### Clima
- Temperatura (>32°C = +30% bebidas)
- Chuva (reduz fluxo em -30%)
- Umidade
- Índice UV
- Velocidade do vento

### Histórico
- Vendas do dia anterior
- Vendas da semana anterior
- Padrão do mesmo dia (1 ano atrás)
- Tendência (subindo/caindo)

### Econômico
- Preço nosso vs concorrência
- Promoções ativas
- Elasticidade de preço

### Operacional
- Número de caixas abertos
- Fluxo de pessoas
- Tempo médio de fila
- Música da loja (sim/não)

### Eventos
- Copa do Mundo
- Páscoa, Natal, Corpus Christi
- Eventos locais
- Black Friday, Cyber Monday

---

## 7️⃣ Alertas e Notificações

### Tipos de Alertas

| Tipo | Urgência | Ação |
|------|----------|------|
| **falta_estoque** | Alta | Repor imediatamente |
| **vencimento_proximo** | Alta | Desconto automático |
| **desperdicio** | Média | Reposição reduzida |
| **preco_anormal** | Média | Revisar precificação |
| **anomalia_vendas** | Média | Investigar causa |

### Canais de Notificação

- **WhatsApp**: Alerts críticos (em tempo real)
- **Email**: Relatórios completos (07:00)
- **SMS**: Alertas críticos de falta (imediato)
- **Dashboard**: Visualização em tempo real

---

## 8️⃣ Configuração de Contatos

```bash
POST /api/v1/notificacao-contatos
Body: {
  "loja_id": "uuid",
  "nome": "João Gerente",
  "cargo": "Gerente Geral",
  "setores": ["Bebidas", "Alimentos"],
  "telefone_whatsapp": "+5585988776655",
  "email": "joao@loja.com",
  "receber_alertas_whatsapp": true,
  "receber_alertas_email": true,
  "receber_relatorios": true
}
```

---

## 9️⃣ Monitoramento de Assertividade

```bash
GET /api/v1/predicoes/loja/:loja_id/assertividade?dias=30

Resposta:
{
  "assertividade_media": 91.2,
  "assertividade_minima": 78.5,
  "assertividade_maxima": 99.8,
  "previsoes_validadas": 247,
  "status_modelo": "bom",
  "recomendacao": "Modelo operacional, continuar monitorando"
}
```

### Metas

- **Dia 1**: 70% (modelo novo)
- **Dia 7**: 82% (aprendendo padrões)
- **Dia 30**: 90% (ótimo!)
- **Dia 90**: 95%+ (alvo final)

---

## 🔟 Setup Completo (5 minutos)

```bash
# 1. Criar loja no Easy Market
curl -X POST http://localhost:3000/api/v1/lojas \
  -d '{"nome":"Loja Lagoa Junco","endereco":"...","cidade":"Recife"}'

# 2. Configurar integração PDV
curl -X POST http://localhost:3000/api/v1/integracao-pdv/configurar \
  -d '{
    "loja_id":"...",
    "pdv_tipo":"linx",
    "pdv_api_key":"...",
    "pdv_host":"192.168.1.100",
    "pdv_porta":8080
  }'

# 3. Sincronizar inventário inicial
curl -X POST http://localhost:3000/api/v1/integracao-pdv/:loja_id/sincronizar-inventario

# 4. Criar contatos para notificação
curl -X POST http://localhost:3000/api/v1/notificacao-contatos \
  -d '{
    "loja_id":"...",
    "nome":"João",
    "telefone_whatsapp":"+5585988776655",
    "email":"joao@loja.com",
    ...
  }'

# 5. Testar primeira predição
curl -X POST http://localhost:3000/api/v1/predicoes/loja/:loja_id/diaria

# ✅ PRONTO! Scheduler automático iniciado
```

---

## ⚠️ Troubleshooting

### PDV não conecta
```bash
GET /api/v1/integracao-pdv/:loja_id/status
# Se status = "desconectado"
# Verificar: IP, porta, API Key, firewall
```

### Predições baixas demanda
```
Adicionar mais dias de histórico (mínimo 30 dias)
Treinar modelo com dados de 1 ano completo
```

### WhatsApp não envia
```bash
# Verificar credenciais Twilio em .env
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=...
```

---

## 📞 Suporte

- **Documentação**: /docs/api.md
- **Dashboard**: http://localhost:3000/dashboard
- **API Status**: GET /api/v1/health
- **Logs**: `docker logs easy-market-backend`

---

**Easy Market v1.0 - Sistema de Inteligência de Varejo** 🚀
