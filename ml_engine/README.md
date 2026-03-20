# Easy Market ML Engine 🤖

Motor preditivo para previsão de demanda, correlação climática e análise inteligente.

## 🎯 Features

- **Prophet + XGBoost Ensemble**: Múltiplos modelos combinados para melhor acurácia
- **Correlação Climática**: Análise automática de clima x demanda
- **Scheduler**: Previsões automáticas a cada hora
- **Cache Redis**: Resultados cacheados para performance
- **API REST**: Endpoints para integração com backend

## 📦 Instalação

```bash
cd ml_engine
pip install -r requirements.txt
```

## 🚀 Uso

### 1. Iniciar o Predictor Diretamente

```bash
python predictor.py
```

Output exemplo:
```json
{
  "loja_id": "loja_001",
  "categoria": "Bebidas",
  "periodo_horas": 24,
  "previsoes": [
    {
      "hora": 1,
      "quantidade_esperada": 245.5,
      "intervalo_confianca": [200, 291],
      "confianca_percentual": 88.5,
      "modelos": {
        "prophet": 247.3,
        "xgboost": 243.7
      }
    }
  ]
}
```

### 2. Iniciar Scheduler

```bash
python scheduler.py
```

Executa previsões automaticamente:
- **Horária**: Previsão para todas as categorias (minuto 5)
- **Diária** (6:00 AM): Resumo do dia anterior
- **Semanal** (segundas, 8:00 AM): Relatório com insights

### 3. API REST

```bash
# Iniciar servidor Flask
python api.py
```

Servidor disponível em `http://localhost:5000`

---

## 📡 API Endpoints

### Previsões

#### **POST /api/v1/previsoes/categoria**
Fazer previsão para uma categoria

```bash
curl -X POST http://localhost:5000/api/v1/previsoes/categoria \
  -H "X-API-Key: seu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "loja_001",
    "categoria": "Bebidas",
    "horas_ahead": 24
  }'
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "categoria": "Bebidas",
  "periodo_horas": 24,
  "timestamp": "2026-03-20T10:30:00",
  "previsoes": [
    {
      "hora": 1,
      "quantidade_esperada": 245.5,
      "intervalo_confianca": [200, 291],
      "confianca_percentual": 88.5,
      "modelos": {
        "prophet": 247.3,
        "xgboost": 243.7
      }
    }
  ],
  "metricas": {
    "model_type": "ensemble",
    "weights": {"prophet": 0.4, "xgboost": 0.4, "linear": 0.2},
    "confidence_mean": 87.3
  }
}
```

#### **GET /api/v1/previsoes/<loja_id>/<categoria>**
Obter previsão do cache

```bash
curl -H "X-API-Key: seu-api-key" \
  "http://localhost:5000/api/v1/previsoes/loja_001/Bebidas?horas_ahead=24"
```

#### **POST /api/v1/previsoes/comparativo**
Comparar previsão vs vendas reais

```bash
curl -X POST http://localhost:5000/api/v1/previsoes/comparativo \
  -H "X-API-Key: seu-api-key" \
  -d '{
    "loja_id": "loja_001",
    "categoria": "Bebidas",
    "data_inicio": "2026-03-13",
    "data_fim": "2026-03-20"
  }'
```

---

### Análises

#### **POST /api/v1/analise/clima-demanda**
Correlação clima x demanda

```bash
curl -X POST http://localhost:5000/api/v1/analise/clima-demanda \
  -H "X-API-Key: seu-api-key" \
  -d '{
    "loja_id": "loja_001",
    "categorias": ["Bebidas", "Alimentos"]
  }'
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "periodo_dias": 90,
  "correlacoes": {
    "Bebidas": {
      "temperatura": 0.78,
      "precipitacao": -0.45,
      "umidade": 0.32
    }
  },
  "insights": [
    {
      "categoria": "Bebidas",
      "insight": "Correlação positiva forte com temperatura (0.78)",
      "acao": "Aumentar estoque em dias quentes"
    }
  ]
}
```

#### **GET /api/v1/insights/heatmap**
Matriz de calor de vendas

```bash
curl -H "X-API-Key: seu-api-key" \
  "http://localhost:5000/api/v1/insights/heatmap?loja_id=loja_001&dias=30"
```

---

### Recomendações

#### **POST /api/v1/insights/recomendacoes**
Recomendações automáticas de ações

```bash
curl -X POST http://localhost:5000/api/v1/insights/recomendacoes \
  -H "X-API-Key: seu-api-key" \
  -d '{"loja_id": "loja_001"}'
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "total_recomendacoes": 3,
  "roi_total_potencial": 3300.00,
  "recomendacoes": [
    {
      "tipo": "estoque",
      "prioridade": "alta",
      "titulo": "Aumentar estoque de Bebidas",
      "descricao": "Previsão indica aumento de 40% na demanda",
      "acao_sugerida": "Repor 500 unidades",
      "roi_estimado": 1500.00,
      "confianca": 0.89
    }
  ]
}
```

---

### Scheduler

#### **GET /api/v1/scheduler/status**
Status do scheduler

```bash
curl -H "X-API-Key: seu-api-key" \
  "http://localhost:5000/api/v1/scheduler/status"
```

#### **POST /api/v1/scheduler/trigger**
Disparar previsões manualmente

```bash
curl -X POST http://localhost:5000/api/v1/scheduler/trigger \
  -H "X-API-Key: seu-api-key"
```

---

## 🏗️ Arquitetura

### Classes Principais

**FeatureEngineer**
- Lag features (defasagem)
- Rolling features (média móvel)
- Cyclical features (hora, dia, mês)
- Interaction features (clima x demanda)

**ProphetPredictor**
- Sazonalidade: annual, weekly, daily
- Confidence intervals
- Métricas: MAPE

**XGBoostPredictor**
- Gradient boosting
- Feature importance
- Normalização automática

**EnsemblePredictor**
- Combinação ponderada
- Weighting automático
- Confidence aggregation

**PredictionPipeline**
- Orquestra todo fluxo
- Persistência em banco
- Cache Redis

---

## 📊 Fluxo de Dados

```
1. Buscar dados históricos (últimos 90 dias)
   ↓
2. Feature Engineering
   - Lag features
   - Rolling statistics
   - Cyclical encoding
   - Interactions
   ↓
3. Treinar Modelos
   - Prophet (sazonalidade)
   - XGBoost (não-linear)
   ↓
4. Ensemble
   - Combinar com pesos
   - Calcular confidence
   ↓
5. Validação
   - Verificar MAPE
   - Confidence > 80%
   ↓
6. Armazenar
   - Banco de dados
   - Redis cache
```

---

## 🔄 Ciclo de Previsão

### Horário (A cada 1 hora no minuto 5)
```
06:05 → Previsão para Bebidas
06:06 → Previsão para Alimentos
06:07 → Previsão para Higiene
...
```

### Diário (6:00 AM)
```
Gera resumo com:
- Total de previsões
- Confiança média
- Principais categorias
```

### Semanal (Segunda-feira, 8:00 AM)
```
Relatório com:
- Acurácia da semana
- Categoria melhor/pior prevista
- Insights de demanda
```

---

## 🔐 Segurança

- **API Key**: Requerido em todos endpoints
- **CORS**: Configurado por origem
- **Rate Limiting**: Limitar requisições por IP (futura)
- **Validação**: Todos inputs validados

---

## 📈 Performance

- **Cache Redis**: 30 minutos para previsões
- **Hypertable TimescaleDB**: Queries otimizadas
- **Batch Processing**: Previsões por loja/categoria
- **Async Jobs**: Scheduler em background

---

## 🛠️ Troubleshooting

### "Insufficient data for prediction"
```
- Precisamos de pelo menos 30 dias de histórico
- Solução: Aguarde 30+ dias de dados ou use dados sintéticos
```

### "Redis connection error"
```
- Verificar se Redis está rodando: redis-cli ping
- Testar conexão: nc -zv localhost 6379
```

### "Database connection error"
```
- Verificar credenciais no .env
- Testar: psql -U postgres -d easy_market -c "SELECT NOW()"
```

### "API key invalid"
```
- Verificar header: -H "X-API-Key: seu-api-key"
- Validar no banco de dados
```

---

## 📚 Dependências

| Pacote | Versão | Uso |
|--------|--------|-----|
| prophet | 1.1.5 | Previsões com sazonalidade |
| xgboost | 2.0.3 | Gradient boosting |
| scikit-learn | 1.3.2 | Preprocessing, Linear Regression |
| pandas | 2.1.3 | Manipulação de dados |
| psycopg2 | 2.9.9 | PostgreSQL driver |
| redis | 5.0.1 | Cache client |
| APScheduler | 3.10.4 | Job scheduling |
| flask | 3.0.0 | REST API framework |

---

## 📝 Próximos Passos

- [ ] LSTM/GRU para séries temporais
- [ ] Anomaly detection
- [ ] A/B testing de modelos
- [ ] Fine-tuning automático de hiperparâmetros
- [ ] Explicabilidade (SHAP values)

---

## 📞 Suporte

Para dúvidas ou issues, abra uma issue no repositório.
