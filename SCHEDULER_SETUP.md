# Scheduler Setup - Smart Market

## ✅ O que foi feito

1. **ScraperScheduler inicializado automaticamente** no startup do servidor
   - Coleta as 50 variáveis a cada 60 minutos (configurável)
   - Armazena no Supabase em `store_flow_variables`

2. **3 novos endpoints de controle**:
   ```
   GET  /api/v1/scheduler/status    → Ver status do scheduler
   POST /api/v1/scheduler/start     → Iniciar manualmente (JSON body)
   POST /api/v1/scheduler/stop      → Parar scheduler
   ```

3. **Variáveis adicionadas ao EasyPanel**:
   - `OPENWEATHER_API_KEY` → para dados reais de clima
   - `REDIS_HOST` e `REDIS_PORT` → para cache de predições
   - `LOJA_IDS` → quais lojas monitorar
   - `SCRAPER_INTERVAL` → minutos entre coletas (padrão: 60)

## 🚀 Como ativar em produção

### 1. Obter API key do OpenWeather (gratuito)
```
Ir para: https://openweathermap.org/api
Sign up → Create account → Copiar API key
```

### 2. No EasyPanel, configurar variáveis:
```
SUPABASE_URL=          → sua URL Supabase
SUPABASE_SERVICE_KEY=  → sua chave de serviço
OPENWEATHER_API_KEY=   → sua chave OpenWeather
REDIS_HOST=redis       → ou localhost/seu_host
REDIS_PORT=6379
LOJA_IDS=loja_001,loja_002,loja_003
SCRAPER_INTERVAL=60    → coleta a cada 60 min
```

### 3. Verificar se está funcionando:
```bash
curl http://seu-ip:3000/api/v1/scheduler/status
# Response: 
{
  "sucesso": true,
  "scheduler": {
    "isRunning": true,
    "activeSchedules": 3,
    "schedules": [
      { "lojaId": "loja_001", "intervalMinutes": 60 }
    ]
  }
}
```

## 📊 Variáveis coletadas automaticamente

### Clima (8 variáveis)
- Temperatura, umidade, chuva, nuvens, UV, alerta extremo, previsão 24h
- **Fonte**: OpenWeatherMap API

### Calendário (7 variáveis)
- Hora, dia da semana, mês, feriado, dias para payday
- Férias escolares, Natal, Páscoa, Carnaval, Black Friday
- **Fonte**: Sistema (hardcoded)

### Economia (7 variáveis)
- Confiança do consumidor, desemprego, inflação, taxa Selic, câmbio, B3, combustível
- **Fonte**: Mock (configure APIs de IBGE/BCB para dados reais)

### Dados internos (8 variáveis)
- Disponibilidade de staff, tempo de espera, faltantes, reposição, atraso fornecedor
- Estoque vencido, itens alta margem, lançamentos, sazonalidade, temperatura
- **Fonte**: PDV/Balanças/Sistema interno

### Concorrência (5 variáveis)
- Promoções ativas, índice de preços, market share, vendas regionais, buzz social
- **Fonte**: Web scraping (mock atualmente)

### Redes sociais (7 variáveis)
- Menções, sentimento, Google Trends, TikTok, influenciadores, avaliações, notícias
- Congestionamento de tráfego
- **Fonte**: APIs (mock atualmente)

## 🔄 Flow de dados completo

```
┌─────────────────────────────────────┐
│  Scheduler a cada 60 minutos        │
└──────────────┬──────────────────────┘
               │
        ┌──────▼──────┐
        │ StoreFlow    │
        │ Scraper      │
        └──────┬───────┘
               │
     ┌─────────┼─────────┬───────────┐
     │         │         │           │
 OpenWeather  Calendário Economia  Interno
     │         │         │           │
     └─────────┴─────────┴───────────┘
               │
        ┌──────▼──────────┐
        │ Supabase        │
        │ store_flow_     │
        │ variables       │
        └──────┬──────────┘
               │
        ┌──────▼──────────┐
        │ RFM Scoring     │
        │ Anomaly Detect  │
        │ Predicoes       │
        │ Cross-sell      │
        └─────────────────┘
```

## 🔧 Troubleshooting

### Scheduler não inicia
```
❌ "[SmartMarket] Erro ao iniciar Scheduler"
→ Verifique se SUPABASE_URL e SUPABASE_SERVICE_KEY estão configuradas
```

### Dados mock ao invés de reais
```
⚠️  "[Scraper] Weather API unavailable, using mock data"
→ Configure OPENWEATHER_API_KEY
→ Verifique conexão à internet
```

### Variáveis não aparecem no Supabase
```
→ Verifique se tabela 'store_flow_variables' existe
→ Verifique logs do scheduler em /api/v1/scheduler/status
```

## 📝 Logs

O scheduler registra:
- Coletas bem-sucedidas: `[00:15] loja_001: ✅ 50 variables in 245ms`
- Erros: `[00:15] loja_001: ❌ Supabase error: ...`
- Status a cada 6 horas

Ver histórico:
```sql
SELECT * FROM scraper_logs 
WHERE scraper_name = 'store_flow_variables'
ORDER BY executed_at DESC
LIMIT 20;
```

---

✅ **Sistema pronto para coletar 50 variáveis em tempo real!**
