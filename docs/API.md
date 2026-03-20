# Easy Market API Reference

## Base URL
```
https://api.easy-market.com/v1
```

## Authentication
```
Authorization: Bearer {JWT_TOKEN}
```

---

## Endpoints

### 1. Ingestão de Eventos

#### POST `/api/v1/events`

Envia um evento de venda/balança.

**Request:**
```json
{
  "loja_id": "loja-001",
  "tipo": "venda",
  "timestamp": "2026-03-20T14:30:00Z",
  "evento": {
    "sku": "7891000000123",
    "produto": "Leite Integral 1L",
    "categoria": "Lácteos",
    "peso": 1.0,
    "preco": 4.50,
    "quantidade": 2
  }
}
```

**Response (201):**
```json
{
  "event_id": "evt_123abc",
  "status": "enqueued",
  "timestamp": "2026-03-20T14:30:00Z"
}
```

---

### 2. Dashboard

#### GET `/api/v1/dashboard/loja/:loja_id`

Retorna dados consolidados do dashboard.

**Query params:**
- `periodo`: `hoje` | `semana` | `mes` (default: hoje)

**Response (200):**
```json
{
  "loja": {
    "id": "loja-001",
    "nome": "Supermercado XYZ",
    "municipio": "Fortaleza"
  },
  "hoje": {
    "faturamento": 15230.50,
    "transacoes": 342,
    "ticket_medio": 44.51,
    "itens_vendidos": 847
  },
  "alertas": [
    {
      "id": "alert_001",
      "tipo": "desperdicio",
      "sku": "7891000000123",
      "produto": "Iogurte Danone 200g",
      "mensagem": "Vence em 2 dias. Sugestão: desconto 25%",
      "urgencia": "alta",
      "created_at": "2026-03-20T14:30:00Z"
    }
  ],
  "previsoes_24h": {
    "Lácteos": {
      "quantidade_esperada": 45,
      "confianca": 0.92,
      "intervalo": [32, 58]
    },
    "Carnes": {
      "quantidade_esperada": 38,
      "confianca": 0.88,
      "intervalo": [28, 50]
    }
  },
  "matriz_calor": [
    { "hora": 8, "dia": "segunda", "vendas": 23, "faturamento": 1230 },
    { "hora": 12, "dia": "segunda", "vendas": 89, "faturamento": 4560 }
  ]
}
```

---

### 3. Histórico de Vendas

#### GET `/api/v1/vendas/:loja_id`

**Query params:**
- `categoria`: filtro por categoria
- `data_inicio`: ISO 8601
- `data_fim`: ISO 8601
- `limit`: 100 (default)

**Response (200):**
```json
{
  "loja_id": "loja-001",
  "period": {
    "inicio": "2026-03-20T00:00:00Z",
    "fim": "2026-03-20T23:59:59Z"
  },
  "total_vendas": 342,
  "faturamento_total": 15230.50,
  "dados": [
    {
      "time": "2026-03-20T14:30:00Z",
      "sku": "7891000000123",
      "produto": "Leite Integral 1L",
      "categoria": "Lácteos",
      "quantidade": 2,
      "preco": 4.50,
      "temperatura": 28,
      "umidade": 75,
      "is_feriado": false
    }
  ]
}
```

---

### 4. Previsões de Demanda

#### GET `/api/v1/predicoes/:loja_id/:categoria`

**Query params:**
- `horas`: quantas horas prever (24 default, máximo 168)

**Response (200):**
```json
{
  "loja_id": "loja-001",
  "categoria": "Lácteos",
  "modelo": "Prophet",
  "treino_data": "2026-03-20T20:00:00Z",
  "previsoes": [
    {
      "timestamp": "2026-03-21T00:00:00Z",
      "quantidade_esperada": 12,
      "intervalo_confianca": [8, 16],
      "confianca": 0.95
    },
    {
      "timestamp": "2026-03-21T01:00:00Z",
      "quantidade_esperada": 5,
      "intervalo_confianca": [2, 9],
      "confianca": 0.93
    }
  ]
}
```

---

### 5. Alertas de Desperdício

#### GET `/api/v1/alertas/:loja_id`

**Query params:**
- `filtro`: `alto` | `medio` | `baixo` | `todos` (default: todos)

**Response (200):**
```json
{
  "loja_id": "loja-001",
  "total_alertas": 3,
  "alertas": [
    {
      "id": "alert_001",
      "sku": "7891000000123",
      "produto": "Iogurte Danone 200g",
      "estoque_atual": 47,
      "data_vencimento": "2026-03-22",
      "dias_restantes": 2,
      "velocidade_media_dia": 8,
      "dias_estoque": 5.9,
      "risco": "ALTO",
      "sugestao_desconto": 0.25,
      "estimated_perda": 210.50
    }
  ]
}
```

---

### 6. Configuração de Lojas

#### POST `/api/v1/lojas`

Cadastra uma nova loja.

**Request:**
```json
{
  "loja_id": "loja-002",
  "nome": "Supermercado ABC",
  "municipio": "Recife",
  "latitude": -8.0476,
  "longitude": -34.8770,
  "fuso_horario": "America/Recife"
}
```

**Response (201):**
```json
{
  "loja_id": "loja-002",
  "status": "criada",
  "chave_api": "sk_live_abc123...",
  "created_at": "2026-03-20T14:30:00Z"
}
```

#### GET `/api/v1/lojas/:loja_id`

**Response (200):**
```json
{
  "loja_id": "loja-001",
  "nome": "Supermercado XYZ",
  "municipio": "Fortaleza",
  "latitude": -3.7319,
  "longitude": -38.5267,
  "fuso_horario": "America/Fortaleza",
  "status": "ativo",
  "integrado_pdv": true,
  "integrado_balanca": false,
  "ultima_sincronizacao": "2026-03-20T20:34:00Z",
  "created_at": "2026-03-10T10:00:00Z"
}
```

---

### 7. Produtos

#### POST `/api/v1/lojas/:loja_id/produtos`

Cadastra/atualiza um produto.

**Request:**
```json
{
  "sku": "7891000000123",
  "nome": "Leite Integral 1L",
  "categoria": "Lácteos",
  "data_vencimento": "2026-03-22",
  "estoque_atual": 50,
  "margem_lucro": 0.30
}
```

**Response (201):**
```json
{
  "sku": "7891000000123",
  "status": "criado"
}
```

---

## Erros

### 400 Bad Request
```json
{
  "error": "invalid_payload",
  "message": "Missing required field: loja_id"
}
```

### 401 Unauthorized
```json
{
  "error": "invalid_token",
  "message": "Token inválido ou expirado"
}
```

### 429 Too Many Requests
```json
{
  "error": "rate_limited",
  "message": "Limite de requisições excedido. Aguarde 60 segundos."
}
```

---

## Rate Limits

- **Free**: 100 req/min
- **Starter**: 500 req/min
- **Pro**: 5000 req/min

---

## Webhook Events

### `venda.criada`
```json
{
  "event": "venda.criada",
  "timestamp": "2026-03-20T14:30:00Z",
  "data": {
    "loja_id": "loja-001",
    "sku": "7891000000123",
    "quantidade": 2,
    "preco": 4.50
  }
}
```

### `alerta.gerado`
```json
{
  "event": "alerta.gerado",
  "timestamp": "2026-03-20T14:30:00Z",
  "data": {
    "alerta_id": "alert_001",
    "tipo": "desperdicio",
    "urgencia": "alta",
    "sku": "7891000000123"
  }
}
```
