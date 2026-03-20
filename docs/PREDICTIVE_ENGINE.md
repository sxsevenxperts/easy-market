# Easy Market — Motor de Inteligência Preditiva

## Visão Geral

O motor preditivo analisa **dados históricos + clima + calendário + comportamento** para:

1. ✅ Prever demanda por categoria (próximas 24h-7 dias)
2. ✅ Identificar padrões de consumo específicos (por clima, dia da semana, evento)
3. ✅ Recomendar ações (estoque, promoção, escala)
4. ✅ Estimar impacto de eventos externos (chuva, feriado, jogo de futebol)

---

## 1. Arquitetura do Motor

```
┌─────────────────────────────────────────────────────────┐
│  Coleta de Dados (TimescaleDB)                          │
│  ├─ Histórico de vendas (90 dias)                       │
│  ├─ Clima (temp, umidade, chuva)                        │
│  ├─ Calendário (feriados, eventos)                      │
│  └─ Segmentação (cliente, categoria, horário)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Feature Engineering (Python)                           │
│  ├─ Defasagem temporal (lag features)                   │
│  ├─ Agregações (média móvel, velocidade)                │
│  ├─ Codificação cíclica (hora, dia, mês)                │
│  ├─ One-hot encoding (feriados, eventos)                │
│  └─ Interações (clima × dia × categoria)                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Modelos Preditivos (Multi-Model Ensemble)              │
│  ├─ Prophet (séries temporais + sazonalidade)           │
│  ├─ XGBoost (padrões complexos + clima)                 │
│  ├─ ARIMA (tendência)                                   │
│  └─ Regressão Linear (baseline)                         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Ensemble & Calibração                                  │
│  ├─ Média ponderada (weights por accuracy)              │
│  ├─ Intervalo de confiança (95%)                        │
│  └─ Detecção de anomalias                               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Recomendações Acionáveis                               │
│  ├─ Aumentar estoque (+X%)                              │
│  ├─ Oferecer promoção (desconto Y%)                     │
│  ├─ Escalar funcionários (Z pessoas)                    │
│  └─ Alertas de risco (desperdício, falta)               │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Coleta de Dados Contextual

### 2.1 Dados Climáticos (Open-Meteo API)

**Integração:**
```python
import requests
from datetime import datetime

def fetch_weather(latitude, longitude, date):
    """
    Busca dados de clima histórico e futuro
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": "2024-01-01",
        "end_date": date.isoformat(),
        "hourly": ["temperature_2m", "relative_humidity_2m", 
                   "precipitation", "weather_code"],
        "timezone": "auto"
    }
    
    response = requests.get(url, params=params)
    return response.json()
```

**Variáveis Capturadas:**
- `temperatura` (°C)
- `umidade_relativa` (%)
- `precipitacao` (mm)
- `condicao_tempo` (chuva, nublado, ensolarado, etc)

**Correlações esperadas com consumo:**

| Condição | Categoria | Impacto | Magnitude |
|---|---|---|---|
| Chuva | Massas | +25% | Alto |
| Chuva | Sorvete | -60% | Muito Alto |
| Chuva | Pão/Broa | +15% | Médio |
| Calor (>30°C) | Bebidas | +40% | Alto |
| Calor | Carnes | -20% | Médio |
| Frio (<15°C) | Leite | +10% | Baixo |

---

### 2.2 Calendário e Eventos

**Tabela `calendario_externo`:**

```sql
CREATE TABLE calendario_externo (
  data DATE PRIMARY KEY,
  dia_semana INT, -- 0=segunda, 6=domingo
  eh_feriado BOOLEAN DEFAULT FALSE,
  tipo_feriado TEXT, -- 'nacional', 'estadual', 'municipal'
  nome_feriado TEXT,
  evento_local TEXT, -- 'festa de santo', 'festas juninas'
  evento_esportivo TEXT, -- 'clássico', 'libertadores'
  eh_verao BOOLEAN,
  semana_numero INT,
  mes INT,
  trimestre INT,
  eh_fim_de_semana BOOLEAN,
  eh_primeira_semana_mes BOOLEAN,
  municipio TEXT -- Fortaleza, Recife, Salvador, etc
);
```

**Impactos no consumo:**

| Evento | Período | Categorias Afetadas | Impacto |
|---|---|---|---|
| Feriado prolongado | -1 dia antes / +1 dia depois | Tudo | +15% a +40% |
| Festas Juninas | Junho-Julho | Bebidas, Milho, Doces | +50% a +100% |
| Natal/Ano Novo | Dezembro | Bebidas, Carnes, Doces | +60% a +120% |
| Black Friday | Novembro | Bebidas, Alimentos em promoção | +80% variável |
| Clássico Cebolinha | Dia do jogo | Bebidas, Salgados | +35% no dia |
| Domingo | Todo domingo | Carnes, Fruta | +20% vs. segunda |
| Véspera de feriado | -1 dia | Bebidas, Carnes | +30% a +50% |

---

### 2.3 Segmentação de Consumo

**Padrões por hora:**

```sql
SELECT 
  EXTRACT(HOUR FROM time) as hora,
  categoria,
  AVG(quantidade) as consumo_medio,
  STDDEV(quantidade) as variancia,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY quantidade) as p95
FROM vendas
WHERE EXTRACT(DOW FROM time) IN (1,2,3,4,5) -- weekday only
GROUP BY hora, categoria
ORDER BY hora, categoria;
```

**Padrões por dia da semana:**

| Dia | Padrão | Categorias Altas | Recomendação |
|---|---|---|---|
| **Segunda** | Consumo baixo | Laticínios, Café | Estoque mínimo, promos |
| **Terça-Quarta** | Consumo estável | Todas equilibrado | Operação normal |
| **Quinta** | Consumo cresce | Bebidas, Carnes | Begin estoque weekend |
| **Sexta** | Consumo sobe 30% | Bebidas, Carnes, Sorvete | Máximo estoque |
| **Sábado** | **Pico máximo** | TODAS (especialmente carnes) | **Máximo tudo** |
| **Domingo** | Alto ainda | Laticínios, Frutas | Estoque remanente |

**Padrões horários (exemplo Fortaleza):**

```
08:00 - Pico matinal (café, pão, leite)
10:00 - Vale
12:00 - Almoço (carnes, arroz, feijão)
14:00 - Vale
17:00 - Café tarde
19:00-21:00 - PICO NOTURNO (compras peso, bebidas, carnes)
```

---

## 3. Feature Engineering

### 3.1 Defasagens Temporais (Lag Features)

```python
def create_lag_features(df, lags=[1, 7, 14, 30]):
    """
    Cria features defasadas (t-1, t-7, t-14, t-30)
    para capturar padrões cíclicos
    """
    for lag in lags:
        df[f'quantidade_lag_{lag}'] = df['quantidade'].shift(lag)
        df[f'preco_lag_{lag}'] = df['preco'].shift(lag)
    
    return df
```

**Justificativa:**
- `lag_1`: efeito de dia anterior
- `lag_7`: padrão semanal (segunda passada vs segunda atual)
- `lag_14`: quebras de tendência
- `lag_30`: sazonalidade mensal

### 3.2 Agregações e Suavizações

```python
def create_rolling_features(df, windows=[7, 14, 30]):
    """
    Cria médias móveis e variância
    """
    for window in windows:
        df[f'media_movel_{window}'] = df['quantidade'].rolling(window).mean()
        df[f'std_dev_{window}'] = df['quantidade'].rolling(window).std()
        
    # Velocidade de saída (consumo/dia)
    df['velocidade_saida_7d'] = df['quantidade'].rolling(7).sum() / 7
    
    return df
```

### 3.3 Codificação Cíclica

```python
import numpy as np

def encode_cyclical(df):
    """
    Transforma variáveis cíclicas em coordenadas sin/cos
    (hora, dia da semana, mês são cíclicos!)
    """
    # Hora (0-23)
    df['hora_sin'] = np.sin(2 * np.pi * df['hora'] / 24)
    df['hora_cos'] = np.cos(2 * np.pi * df['hora'] / 24)
    
    # Dia da semana (0-6)
    df['dia_sin'] = np.sin(2 * np.pi * df['dia'] / 7)
    df['dia_cos'] = np.cos(2 * np.pi * df['dia'] / 7)
    
    # Mês (1-12)
    df['mes_sin'] = np.sin(2 * np.pi * df['mes'] / 12)
    df['mes_cos'] = np.cos(2 * np.pi * df['mes'] / 12)
    
    return df
```

### 3.4 Interações (O segredo da previsão!)

```python
def create_interaction_features(df):
    """
    Cria features de interação:
    chuva + sábado = efeito multiplicativo!
    """
    df['chuva_x_sabado'] = df['precipitacao'] * df['eh_sabado']
    df['temperatura_x_categoria_sorvete'] = df['temperatura'] * df['is_sorvete']
    df['feriado_x_bebidas'] = df['eh_feriado'] * df['is_bebida']
    df['noite_x_pico'] = df['eh_noite'] * df['eh_hora_pico']
    
    # Interação temporal mais sofisticada
    df['chuva_x_terça_noite'] = (
        df['precipitacao'] * df['dia'] == 1 * df['eh_noite']
    )
    
    return df
```

---

## 4. Modelos Preditivos

### 4.1 Prophet (Sazonalidade + Tendência)

```python
from prophet import Prophet
import pandas as pd

def train_prophet_model(loja_id, categoria, lookback_days=90):
    """
    Prophet: excelente para sazonalidade diária/semanal/mensal
    """
    # Prepara dados
    df = query_db(f"""
        SELECT 
            time as ds,
            quantidade as y
        FROM vendas
        WHERE loja_id = '{loja_id}'
        AND categoria = '{categoria}'
        AND time > NOW() - INTERVAL '{lookback_days} days'
        ORDER BY time
    """)
    
    # Treina
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=True,
        interval_width=0.95
    )
    
    # Adiciona regressores externos
    model.add_regressor('temperatura')
    model.add_regressor('umidade')
    model.add_regressor('precipitacao')
    model.add_regressor('eh_feriado')
    
    model.fit(df)
    
    # Previsão 24h
    future = model.make_future_dataframe(periods=24, freq='H')
    forecast = model.predict(future)
    
    return model, forecast
```

**Saída:**
```
              ds    yhat   yhat_lower   yhat_upper
2026-03-21 00:00  12.5    8.2          17.3
2026-03-21 01:00   5.2    2.1          10.1
2026-03-21 02:00   3.8    0.5           8.2
...
```

### 4.2 XGBoost (Padrões Complexos)

```python
import xgboost as xgb
from sklearn.model_selection import train_test_split

def train_xgboost_model(loja_id, categoria):
    """
    XGBoost: captura interações complexas (chuva + sábado à noite)
    """
    # Coleta features
    features = query_db(f"""
        SELECT 
            quantidade as target,
            lag_1, lag_7, lag_30,
            media_movel_7, media_movel_30,
            temperatura, umidade, precipitacao,
            hora_sin, hora_cos, dia_sin, dia_cos,
            eh_feriado, evento_esportivo,
            chuva_x_sabado, temperatura_x_categoria_sorvete
        FROM vendas_features
        WHERE loja_id = '{loja_id}'
        AND categoria = '{categoria}'
        AND quantidade IS NOT NULL
    """)
    
    X = features.drop('target', axis=1)
    y = features['target']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Treina
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8
    )
    
    model.fit(X_train, y_train, 
              eval_set=[(X_test, y_test)],
              early_stopping_rounds=10,
              verbose=False)
    
    # Importância de features (!) 
    importances = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(importances)
    
    return model
```

**Exemplo de importância:**
```
Feature                        Importance
─────────────────────────────────────────
lag_7                          0.25    ← padrão semanal!
temperatura                    0.18    ← clima importa!
chuva_x_sabado                0.14    ← interação!
media_movel_7                  0.12
precipitacao                   0.10
hora_sin                       0.08
dia_sin                        0.07
evento_esportivo               0.03
...
```

### 4.3 Ensemble (Melhor de Tudo)

```python
def ensemble_predict(prophet_forecast, xgboost_pred, arima_pred):
    """
    Combina 3 modelos com pesos adaptativos baseados em RMSE histórico
    """
    # Calcula pesos por acurácia recente (últimas 2 semanas)
    prophet_rmse = calculate_rmse(prophet_forecast, actual_last_14d)
    xgb_rmse = calculate_rmse(xgboost_pred, actual_last_14d)
    arima_rmse = calculate_rmse(arima_pred, actual_last_14d)
    
    # Inverte: menor erro = maior peso
    total_inverse_error = (1/prophet_rmse) + (1/xgb_rmse) + (1/arima_rmse)
    
    w_prophet = (1/prophet_rmse) / total_inverse_error
    w_xgb = (1/xgb_rmse) / total_inverse_error
    w_arima = (1/arima_rmse) / total_inverse_error
    
    # Média ponderada
    ensemble = (
        prophet_forecast['yhat'] * w_prophet +
        xgboost_pred * w_xgb +
        arima_pred * w_arima
    )
    
    # Intervalo de confiança (95%)
    lower = ensemble.quantile(0.025)
    upper = ensemble.quantile(0.975)
    
    return ensemble, lower, upper
```

---

## 5. Análise de Correlações Clima-Demanda

```python
def analyze_climate_impact(loja_id):
    """
    Calcula correlação entre clima e demanda por categoria
    """
    df = query_db(f"""
        SELECT 
            categoria,
            temperatura,
            precipitacao,
            quantidade
        FROM vendas v
        WHERE loja_id = '{loja_id}'
        AND time > NOW() - INTERVAL '90 days'
    """)
    
    correlacoes = {}
    
    for categoria in df['categoria'].unique():
        cat_data = df[df['categoria'] == categoria]
        
        correlacoes[categoria] = {
            'temperatura': cat_data['temperatura'].corr(cat_data['quantidade']),
            'precipitacao': cat_data['precipitacao'].corr(cat_data['quantidade']),
        }
    
    # Imprime matriz
    print(f"\n=== Correlação Clima-Demanda para {loja_id} ===\n")
    for cat, corrs in sorted(correlacoes.items(), 
                             key=lambda x: abs(x[1]['temperatura']), 
                             reverse=True):
        print(f"{cat:20} | Temp: {corrs['temperatura']:+.2f} | Chuva: {corrs['precipitacao']:+.2f}")
    
    return correlacoes
```

**Output esperado:**
```
=== Correlação Clima-Demanda para Loja-001 ===

Sorvete               | Temp: +0.78 | Chuva: -0.65
Bebidas Quentes       | Temp: -0.42 | Chuva: +0.35
Carnes                | Temp: -0.28 | Chuva: +0.18
Massas                | Temp: -0.15 | Chuva: +0.45
Pão                   | Temp: +0.05 | Chuva: +0.12
```

---

## 6. Recomendações Automáticas

### 6.1 Ajuste de Estoque

```python
def recommend_stock_adjustment(previsao, estoque_atual, velocidade_media):
    """
    Recomenda ajuste de estoque baseado em previsão
    """
    previsao_consumo_24h = previsao['yhat'].sum()
    dias_estoque = estoque_atual / (velocidade_media or 1)
    
    recomendacao = {
        'acao': None,
        'percentual': 0,
        'justificativa': ''
    }
    
    if previsao_consumo_24h > velocidade_media * 1.5:
        # Demanda anormalmente alta
        recomendacao['acao'] = 'AUMENTAR_ESTOQUE'
        recomendacao['percentual'] = 30
        recomendacao['justificativa'] = (
            f"Previsão de {previsao_consumo_24h:.0f} unidades nas próximas 24h "
            f"(+{((previsao_consumo_24h/velocidade_media - 1)*100):.0f}% vs média). "
            f"Estoque atual: {dias_estoque:.1f} dias."
        )
    
    elif dias_estoque < 2 and previsao_consumo_24h > 0:
        recomendacao['acao'] = 'REPOSICAO_URGENTE'
        recomendacao['percentual'] = 50
        recomendacao['justificativa'] = (
            f"Estoque baixo ({dias_estoque:.1f} dias) com demanda "
            f"prevista de {previsao_consumo_24h:.0f} un. Risco de falta."
        )
    
    return recomendacao
```

### 6.2 Sugestão de Promoção

```python
def recommend_promotion(categoria, estoque_atual, vencimento_proximos_dias, velocidade):
    """
    Recomenda promoção relâmpago se risco de desperdício
    """
    dias_para_vencer = (vencimento_proximos_dias - datetime.now().date()).days
    
    if dias_para_vencer <= 3 and estoque_atual > velocidade * dias_para_vencer * 1.5:
        # Risco de desperdício
        desconto_recomendado = min(
            15 + (3 - dias_para_vencer) * 10,  # Mais urgente = maior desconto
            50  # Máximo 50%
        )
        
        return {
            'acao': 'PROMO_RELAMPAGO',
            'desconto': desconto_recomendado,
            'duracao_horas': 24,
            'canal': 'whatsapp',
            'mensagem': f"🔥 {categoria} com {desconto_recomendado}% OFF por 24h! Válido até {vencimento_proximos_dias:%d/%m}"
        }
    
    return None
```

### 6.3 Escala de Funcionários

```python
def recommend_staffing(previsao_clientes, horario_pico=None):
    """
    Recomenda número de caixas/funcionários por horário
    
    Assumindo: 1 caixa processa ~20 clientes/hora
    """
    
    # Calcula clientes esperados
    clientes_esperados = previsao_clientes['yhat'].tolist()
    
    recomendacoes = []
    
    for hora, clientes in enumerate(clientes_esperados):
        caixas_necessarios = max(
            1,
            int(np.ceil(clientes / 20))
        )
        
        recomendacoes.append({
            'hora': hora,
            'clientes_estimados': clientes,
            'caixas_recomendados': caixas_necessarios,
            'filas_esperadas': 'Baixas' if caixas_necessarios >= clientes/20 else 'Altas'
        })
    
    # Identifica picos
    max_clientes = max(clientes_esperados)
    horas_pico = [r for r in recomendacoes if r['clientes_estimados'] > max_clientes * 0.8]
    
    return {
        'escala_horaria': recomendacoes,
        'horas_pico': horas_pico,
        'economia_potencial': economizar_folha_payroll(recomendacoes)
    }
```

---

## 7. Casos de Uso Reais

### Caso 1: "Chuva Prevista + Sábado"

```
Data: Sábado, 22 de Março de 2026
Previsão de Chuva: 15mm (100% certeza)
Histórico: Dias chuvosos de sábado → +25% massas, -50% sorvete

RECOMENDAÇÕES AUTOMÁTICAS:
├─ Aumentar estoque de Massas em +30%
├─ Reduzir estoque de Sorvete em 50% (descartar próximo vencimento)
├─ Oferecer promo de Bebidas quentes (+15%)
└─ Escala normal (sábado = sempre pico)
```

### Caso 2: "Véspera de Feriado (Natal)"

```
Data: 23 de Dezembro de 2025
Tipo: Véspera de feriado prolongado (24-26 dez)
Histórico: Véspera de Natal → +80% bebidas, +60% carnes, +40% doces

RECOMENDAÇÕES AUTOMÁTICAS:
├─ MÁXIMO estoque em: Bebidas, Carnes, Doces, Pão
├─ Contratar 3 funcionários extras (estimado +150 clientes)
├─ Avisar fornecedores de reposição urgente
├─ Alertar sobre prazo de recebimento (pode fechar cedo)
└─ Preparar promos pós-feriado para segunda (20% em perecíveis)
```

### Caso 3: "Clássico Cebolinha + Calor"

```
Data: Sábado, 5 de Abril de 2026
Evento: Clássico Cebolinha (Fortaleza vs Ceará) 18:00
Clima: 32°C, ensolarado
Histórico: Dias de jogo → +35% bebidas; Calor → +40% sorvete

RECOMENDAÇÕES AUTOMÁTICAS:
├─ Aumentar estoque de Bebidas em +50%
├─ Aumentar estoque de Sorvete em +45%
├─ Oferecer promo de Cerveja/Refrigerante (14:00-18:00)
├─ Escalar +2 funcionários (17:00-20:00)
└─ Alert: Sem estoque de bebida não perde cliente? Sim! MÁXIMO prioridade
```

---

## 8. Dashboard de Análise Preditiva

**Telas recomendadas:**

### 8.1 "Previsão 24h"
```
┌──────────────────────────────────────────┐
│ Próximas 24 horas - Sexta, 21/03         │
├──────────────────────────────────────────┤
│                                          │
│ Lácteos                                  │
│ ████████░░ 45 un (92% confiança)         │
│ Recomendação: Normal                     │
│                                          │
│ Bebidas                                  │
│ ██████████ 67 un (88% confiança)         │
│ Recomendação: +20% estoque               │
│                                          │
│ Sorvete                                  │
│ ██████░░░░ 28 un (84% confiança)         │
│ Recomendação: Normal (clima previne)     │
│                                          │
│ Carnes                                   │
│ ████████░░ 52 un (89% confiança)         │
│ Recomendação: +15% estoque (sexta)       │
└──────────────────────────────────────────┘
```

### 8.2 "Fatores Influenciadores"
```
┌─────────────────────────────────────────┐
│ O que está influenciando a demanda?      │
├─────────────────────────────────────────┤
│                                         │
│ 📊 Padrão de Sexta: +20%                 │
│ 🌡️  Temperatura 28°C: +5%                │
│ 🚫 Sem evento esportivo: -0%             │
│ 📅 Dia normal (não feriado): +0%         │
│ 🌧️  Sem previsão de chuva: +0%           │
│                                         │
│ ────────────────────────────────────     │
│ EFEITO TOTAL: +25% acima da média       │
│                                         │
│ Confiança do modelo: 89%                 │
│ Última atualização: 14:32 (hoje)         │
└─────────────────────────────────────────┘
```

### 8.3 "Alertas Preditivos"
```
┌──────────────────────────────────────────┐
│ 🚨 Alertas Baseados em Previsão          │
├──────────────────────────────────────────┤
│                                          │
│ ⚠️  ALTO: Iogurte vence em 2 dias        │
│     Estoque: 47 un | Consumo: 8/dia     │
│     → Desconto 25% hoje                  │
│     Economia potencial: R$180            │
│                                          │
│ ⚠️  MÉDIO: Falta prevista de Carnes      │
│     Previsão: +50% consumo sábado        │
│     → Aumentar estoque 25%               │
│                                          │
│ ✅ BAIXO: Escala reduzida pode aparecer  │
│     Segunda = -30% de clientes           │
│     → Economize folha payroll em 8h      │
│                                          │
└──────────────────────────────────────────┘
```

---

## 9. Métricas de Qualidade do Modelo

```python
def evaluate_model_performance(actual, predicted):
    """
    Métricas para monitorar qualidade das previsões
    """
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    import numpy as np
    
    mae = mean_absolute_error(actual, predicted)
    rmse = np.sqrt(mean_squared_error(actual, predicted))
    mape = np.mean(np.abs((actual - predicted) / actual)) * 100
    
    # Acurácia direcional (previu aumento ou queda corretamente?)
    direction_accuracy = (
        np.sum((predicted >= np.mean(predicted)) == (actual >= np.mean(actual))) 
        / len(actual) * 100
    )
    
    return {
        'MAE': mae,  # Erro médio absoluto
        'RMSE': rmse,  # Raiz do erro quadrado
        'MAPE': mape,  # Erro percentual absoluto médio
        'Direction_Accuracy': direction_accuracy,  # % vezes acertou direção
        'Status': 'Excelente' if mape < 10 else 'Bom' if mape < 20 else 'Ruim'
    }
```

**Alvo:**
- MAPE < 15% (bom para retail)
- Direction Accuracy > 75% (sabe se vai subir ou cair)

---

## 10. Fluxo de Retrainamento

```python
# Job que roda todo domingo às 02:00
def weekly_retraining():
    """
    Retreina modelos com dados novos
    """
    for loja in get_all_lojas():
        for categoria in get_categories(loja):
            
            # Treina Prophet
            prophet_model, _ = train_prophet_model(loja, categoria)
            save_model(f'prophet_{loja}_{categoria}', prophet_model)
            
            # Treina XGBoost
            xgb_model = train_xgboost_model(loja, categoria)
            save_model(f'xgb_{loja}_{categoria}', xgb_model)
            
            # Valida
            performance = evaluate_on_test_set(xgb_model)
            
            if performance['MAPE'] > 25:
                # Alerta para avaliar dados ou features
                send_alert(f"⚠️ Modelo {loja}/{categoria} com MAPE {performance['MAPE']:.1f}%")
            
            print(f"✅ {loja} / {categoria} retreinado com sucesso")
```

---

## Resumo: O Poder da Análise Preditiva

| Ação | Sem Previsão | Com Previsão | Impacto |
|---|---|---|---|
| Desperdício de perecíveis | R$3.750/mês | R$1.875/mês | **-50%** |
| Falta de produto (perda venda) | R$2.000/mês | R$500/mês | **-75%** |
| Folha de payroll desnecessária | R$2.000/mês | R$800/mês | **-60%** |
| **Economia Total** | - | **R$4.375/mês** | **-50-75%** |
| **ROI (vs. software R$497/mês)** | - | **8.8x** | **Altíssimo** |

