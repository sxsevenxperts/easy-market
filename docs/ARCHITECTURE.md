# Easy Market — Arquitetura de Dados

## Visão Geral

```
[Balança/PDV] → [Agente Local] → [API Gateway] → [Fila] → [Worker] → [TimescaleDB] → [Motor ML] → [Dashboard]
```

## 1. Fontes de Dado

### PDV (Ponto de Venda)
- **Linx, Totvs, Nex**
- Dados: SKU, preço, quantidade, timestamp
- Frequência: Real-time via webhook ou polling a cada 5 min

### Balança
- **Toledo, Filizola**
- Dados: PLU (código), peso, timestamp
- Conexão: Serial (RS-232) ou TCP/IP
- Frequência: Real-time

## 2. Agente Local (Python + SQLite)

Roda na loja, em um Raspberry Pi (~R$300):

```python
# collector.py
- Conecta ao PDV (webhook listener ou polling)
- Conecta à balança (serial reader)
- Normaliza payload
- Adiciona timestamp UTC
- Buffer offline em SQLite (se internet cair)
- Envia via HTTPS em batch a cada 1 min
```

**Vantagem:** Loja continua coletando dados mesmo se internet cair.

## 3. API Gateway (Node.js + Fastify)

```
POST /api/v1/events
Content-Type: application/json

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

- Valida schema
- Rate limiting
- Enfileira em Redis Streams

## 4. Fila (Redis Streams)

```
Redis Stream: vendas:raw
├─ ID: 1234567890-0
├─ loja_id, tipo, timestamp, evento, ...
└─ Consumer Group: "processing"
   └─ Worker 1, Worker 2, Worker 3 (escala)
```

## 5. Worker de Processamento

Para cada evento enfileirado:

1. **Enriquecimento com Clima**
   ```sql
   SELECT * FROM open_meteo_api
   WHERE latitude = loja.lat AND longitude = loja.lon
   AND timestamp = event.timestamp
   ```

2. **Enriquecimento com Calendário**
   ```sql
   SELECT is_feriado, evento_local, evento_esportivo
   FROM calendario_externo
   WHERE data = event.data
   AND municipio = loja.municipio
   ```

3. **Insert em TimescaleDB**
   ```sql
   INSERT INTO vendas (
     loja_id, sku, categoria, peso, preco, quantidade,
     timestamp, temperatura, umidade, is_feriado, evento_esportivo
   ) VALUES (...)
   ```

## 6. TimescaleDB Schema

### Hypertable: vendas

```sql
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

SELECT create_hypertable('vendas', 'time', 
  if_not_exists => TRUE, 
  time_column_name => 'time');

CREATE INDEX ON vendas (loja_id, time DESC);
CREATE INDEX ON vendas (categoria, time DESC);
```

### Table: produtos

```sql
CREATE TABLE produtos (
  sku TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT,
  data_vencimento DATE,
  velocidade_media_saida NUMERIC (un/dia),
  estoque_atual INT,
  margem_lucro NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: lojas

```sql
CREATE TABLE lojas (
  loja_id TEXT PRIMARY KEY,
  nome TEXT,
  municipio TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  fuso_horario TEXT,
  integrado_pdv BOOLEAN DEFAULT FALSE,
  integrado_balanca BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 7. Motor de Previsão (Python + Prophet)

**Job agendado:** a cada hora

```python
# predictor.py
from prophet import Prophet

# Input: últimas 90 dias de vendas + clima futuro
df = query_timescaledb(
  "SELECT time, quantidade FROM vendas WHERE categoria = ? AND loja_id = ?",
  lookback_days=90
)

# Treinamento
model = Prophet(interval_width=0.95)
model.fit(df)

# Previsão: próximas 24h
future = model.make_future_dataframe(periods=24, freq='H')
forecast = model.predict(future)

# Store em cache Redis para API
redis.set(f"forecast:{loja_id}:{categoria}", forecast.to_json())
```

**Output:**
```json
{
  "categoria": "Lácteos",
  "previsao_24h": [
    { "timestamp": "2026-03-20T15:00:00Z", "quantidade": 8, "lower_bound": 6, "upper_bound": 11 },
    { "timestamp": "2026-03-20T16:00:00Z", "quantidade": 12, "lower_bound": 9, "upper_bound": 16 }
  ]
}
```

## 8. Módulo Desperdício Zero

**Job agendado:** a cada 6 horas

```sql
SELECT 
  sku,
  nome,
  estoque_atual,
  data_vencimento,
  (
    SELECT AVG(quantidade) 
    FROM vendas 
    WHERE sku = produtos.sku 
    AND time > NOW() - INTERVAL '30 days'
  ) as velocidade_media_dia,
  
  -- Cálculo de risco
  CASE 
    WHEN (data_vencimento - NOW()::date) < 3 
      AND estoque_atual / velocidade_media_dia > 1.5 
    THEN 'ALERTA_ALTO'
    WHEN (data_vencimento - NOW()::date) < 7 
      AND estoque_atual / velocidade_media_dia > 2.0 
    THEN 'ALERTA_MEDIO'
    ELSE 'OK'
  END as status_risco
  
FROM produtos
WHERE data_vencimento IS NOT NULL
ORDER BY status_risco DESC;
```

**Ação:** Se `ALERTA_ALTO`, enviar notificação:
> "⚠️ Iogurte Danone 200g (SKU 123): 47 un, vence em 2 dias. Velocidade: 8 un/dia. **Sugestão: Promo 25% off hoje**"

## 9. Dashboard API

### GET `/api/v1/dashboard/loja/:loja_id`

```json
{
  "loja": { "id": "loja-001", "nome": "Supermercado XYZ" },
  "hoje": {
    "faturamento": 15230.50,
    "transacoes": 342,
    "ticket_medio": 44.51
  },
  "alertas": [
    {
      "tipo": "desperdicio",
      "sku": "7891000000123",
      "mensagem": "Iogurte vence em 2 dias"
    }
  ],
  "previsoes_24h": {
    "Lácteos": { "quantidade": 45, "confiança": 0.92 },
    "Carnes": { "quantidade": 38, "confiança": 0.88 }
  },
  "matriz_calor": [
    { "hora": 8, "dia": "segunda", "vendas": 23 },
    { "hora": 12, "dia": "segunda", "vendas": 89 }
  ]
}
```

## 10. Frontend (Next.js PWA)

- **Matriz de calor**: heatmap com horas × dias da semana
- **Previsões**: gráfico de série temporal
- **Alertas**: toast notifications com ações rápidas
- **Mobile-first**: responsivo, funciona offline

---

**Fluxo resumido:**
```
[Balança] → [Agente Local] → [API] → [Redis Fila] → [Worker] → [TimescaleDB]
                                                                      ↓
[Dashboard] ← [API] ← [Motor ML] ← [Consulta histórico]
```
