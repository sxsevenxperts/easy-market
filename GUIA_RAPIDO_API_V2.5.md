# 🚀 Guia Rápido - API Store Size Optimizer v2.5

## 📌 Base URL
```
http://localhost:3000/api/v1/predicoes
```

---

## 🎯 12 Endpoints em 60 Segundos

### 1️⃣ Previsão Completa por Tamanho
```bash
POST /forecast-tamanho-loja
Content-Type: application/json

{
  "categoria_id": "bebidas_001",
  "dias_historico": 90,
  "tamanho_loja": "media"
}

# Retorna: Previsão 4 horizontes + Otimização + Recomendações
# Assertiveness: 90% (dia) → 70% (mês)
```

### 2️⃣ Classificar Loja por Área
```bash
POST /classificar-loja
Content-Type: application/json

{
  "area_m2": 350
}

# Retorna: Classificação automática (grande/media/pequena)
```

### 3️⃣ Comparar Grandes/Médias/Pequenas
```bash
POST /comparar-tamanhos
Content-Type: application/json

{
  "categoria_id": "alimentos_seccos",
  "dias_historico": 90
}

# Retorna: 3 previsões + Diferenças percentuais
```

### 4️⃣ Obter Parâmetros Otimizados
```bash
GET /parametros-otimizados/media

# Retorna: Sazonalidade, Volatilidade, Tendência, Estoque, Cross-Sell
```

### 5️⃣ Dashboard para Múltiplas Lojas
```bash
POST /dashboard-multiplo-tamanho
Content-Type: application/json

{
  "categoria_id": "bebidas_001",
  "dias_historico": 90,
  "areas_loja": [150, 350, 600]
}

# Retorna: 3 dashboards completos
```

### 6️⃣ Otimização de Estoque
```bash
POST /otimizacao-estoque-por-tamanho
Content-Type: application/json

{
  "categoria_id": "bebidas_001",
  "dias_historico": 90
}

# Retorna: EOQ, Safety Stock, Ponto Reorden por tamanho
```

### 7️⃣ Assertiveness por Tamanho
```bash
GET /assertiveness-por-tamanho

# Retorna: 
# Grande: 92% (dia) → 75% (mês)
# Média:  90% (dia) → 70% (mês)
# Pequena: 87% (dia) → 63% (mês)
```

### 8️⃣ Análise de Volatilidade
```bash
POST /analise-volatilidade-comparativa
Content-Type: application/json

{
  "categoria_id": "bebidas_001",
  "dias_historico": 90
}

# Retorna: Estabilidade por tamanho (baixa/media/alta)
```

### 9️⃣ Recomendações por Tamanho
```bash
POST /recomendacoes-por-tamanho
Content-Type: application/json

{
  "categoria_id": "bebidas_001",
  "dias_historico": 90
}

# Retorna: Estratégias específicas para cada tamanho
```

### 🔟 Métricas de Performance
```bash
GET /metricas-performance-esperada

# Retorna: Taxa de acerto média por tamanho
# Grande:  86.4%
# Média:   82.0%
# Pequena: 76.0%
```

### 1️⃣1️⃣ Exportação Completa
```bash
POST /export-analise-completa
Content-Type: application/json

{
  "categoria_id": "bebidas_001",
  "dias_historico": 90
}

# Retorna: Análise JSON (exportável para CSV/XLSX/PDF)
```

### 1️⃣2️⃣ Status do Serviço
```bash
GET /status-store-size-optimizer

# Retorna: Status operacional, versão, capacidades
```

---

## 🔑 Parâmetros Rápidos

| Parâmetro | Valores | Padrão | Descrição |
|-----------|---------|--------|-----------|
| `categoria_id` | String | - | ID da categoria (obrigatório) |
| `dias_historico` | 7-365 | 90 | Dias de histórico |
| `tamanho_loja` | grande/media/pequena | media | Tamanho da loja |
| `area_m2` | Número > 0 | - | Área em m² |
| `areas_loja` | Array | [150,350,600] | Múltiplas áreas |

---

## 📊 Tamanhos de Loja

```
┌─ GRANDE (>500m²)
│  ├─ Assertiveness: 92% (dia)
│  ├─ Gordura: 18%
│  ├─ Exemplo: Carrefour, Pão de Açúcar
│  └─ ROI: Máximo
│
├─ MÉDIA (200-500m²)
│  ├─ Assertiveness: 90% (dia)
│  ├─ Gordura: 22%
│  ├─ Exemplo: Supermercados regionais
│  └─ ROI: Alto
│
└─ PEQUENA (<200m²)
   ├─ Assertiveness: 87% (dia)
   ├─ Gordura: 28%
   ├─ Exemplo: Minimercados, bodegas
   └─ ROI: Bom
```

---

## 💡 Exemplos Rápidos

### Exemplo 1: Testar Tudo
```bash
# 1. Verificar status
curl http://localhost:3000/api/v1/predicoes/status-store-size-optimizer

# 2. Obter parâmetros
curl http://localhost:3000/api/v1/predicoes/parametros-otimizados/media

# 3. Fazer previsão
curl -X POST http://localhost:3000/api/v1/predicoes/forecast-tamanho-loja \
  -H "Content-Type: application/json" \
  -d '{"categoria_id":"teste","dias_historico":90,"tamanho_loja":"media"}'

# 4. Comparar tamanhos
curl -X POST http://localhost:3000/api/v1/predicoes/comparar-tamanhos \
  -H "Content-Type: application/json" \
  -d '{"categoria_id":"teste","dias_historico":90}'
```

### Exemplo 2: Integração POS
```bash
# Quando PDV realiza venda, enviar para backend
curl -X POST http://localhost:3000/api/v1/predicoes/forecast-tamanho-loja \
  -H "Content-Type: application/json" \
  -d '{
    "categoria_id": "produto_do_pdv",
    "dias_historico": 90,
    "tamanho_loja": "media"
  }' | jq '.dados.previsao_dia'

# Resultado: {"previsao": 850, "assertiveness": 0.90, ...}
```

### Exemplo 3: Recomendação de Estoque
```bash
# Verificar estoque otimizado
curl -X POST http://localhost:3000/api/v1/predicoes/otimizacao-estoque-por-tamanho \
  -H "Content-Type: application/json" \
  -d '{"categoria_id":"bebidas_001"}' | jq '.otimizacoes.media'

# Resultado: EOQ=2310, Ponto Reorden=907, ...
```

---

## 🎨 Resposta Típica

```json
{
  "sucesso": true,
  "dados": {
    "tamanho_loja": "media",
    "classificacao": {
      "min": 200,
      "max": 500,
      "label": "Média",
      "código": "MSM"
    },
    "previsao_dia": {
      "previsao": 850,
      "intervalo_confianca_90": {
        "minimo": 748,
        "maximo": 952
      },
      "assertiveness": 0.90,
      "margem_erro": "12.09%"
    },
    "previsao_semana": {
      "previsao": 6020,
      "por_dia": 860,
      "assertiveness": 0.85,
      "margem_erro": "14.12%"
    },
    "previsao_quinzena": {
      "previsao": 9030,
      "por_dia": 602,
      "assertiveness": 0.78,
      "margem_erro": "15.33%"
    },
    "previsao_mes": {
      "previsao": 12100,
      "por_dia": 403,
      "assertiveness": 0.70,
      "margem_erro": "17.22%"
    },
    "otimizacao": {
      "quantidade_economica_pedido": 2310,
      "estoque_seguranca_maximo": 207,
      "gordura_recomendada": {
        "percentual": "22.00",
        "quantidade": 660,
        "dias_cobertura": 2.7
      },
      "ponto_reorden": 907,
      "estoque_maximo": 3177,
      "estoque_minimo": 207
    },
    "recomendacoes": [
      {
        "prioridade": "media",
        "tipo": "estoque",
        "mensagem": "Equilibre EOQ com espaço disponível"
      }
    ]
  }
}
```

---

## ⚡ Assertiveness Quick Reference

```
GRANDE LOJA (>500m²)
├─ 92% dia ✅ Muito confiável
├─ 88% semana ✅ Muito confiável
├─ 82% quinzena ✅ Confiável
└─ 75% mês ⚠️ Requer validação

MÉDIA LOJA (200-500m²)
├─ 90% dia ✅ Muito confiável
├─ 85% semana ✅ Confiável
├─ 78% quinzena ⚠️ Requer validação
└─ 70% mês ⚠️ Supervisão recomendada

PEQUENA LOJA (<200m²)
├─ 87% dia ✅ Confiável
├─ 81% semana ⚠️ Requer validação
├─ 73% quinzena ⚠️ Supervisão recomendada
└─ 63% mês ❌ Validação obrigatória
```

---

## 🔄 Fluxo de Uso

```
1. CLASSIFICAR
   POST /classificar-loja {area_m2: 350}
   ↓
2. OBTER PARÂMETROS
   GET /parametros-otimizados/media
   ↓
3. FAZER PREVISÃO
   POST /forecast-tamanho-loja {...}
   ↓
4. OTIMIZAR ESTOQUE
   POST /otimizacao-estoque-por-tamanho {...}
   ↓
5. APLICAR RECOMENDAÇÕES
   POST /recomendacoes-por-tamanho {...}
```

---

## ❌ Erros Comuns

```
❌ "categoria_id é obrigatório"
   → Adicione "categoria_id" no body

❌ "tamanho_loja inválido"
   → Use: grande, media, ou pequena

❌ "area_m2 deve ser um número positivo"
   → Envie número > 0

❌ Assertiveness muito baixa
   → Aumente dias_historico para 180

❌ 404 Not Found
   → Verifique URL: /api/v1/predicoes/...
```

---

## ✅ Checklist Rápido

```
⬜ API está online
   curl http://localhost:3000/health

⬜ Status check
   curl http://localhost:3000/api/v1/predicoes/status-store-size-optimizer

⬜ Classificação funciona
   POST /classificar-loja com area_m2: 350

⬜ Previsão funciona
   POST /forecast-tamanho-loja com categoria_id: "test"

⬜ Estoque otimizado
   POST /otimizacao-estoque-por-tamanho

⬜ Comparação entre tamanhos
   POST /comparar-tamanhos

⬜ Todos 12 endpoints funcionando
   Testar cada um vez
```

---

## 🎯 Casos de Uso em 30 Segundos

### PDV (POS System)
```
1. Cliente compra
2. PDV manda: categoria_id + area_loja
3. API retorna: previsão + recomendação
4. PDV mostra: "Reabastecer em 500 unidades"
```

### Balancas (Scales)
```
1. Balança detecta peso
2. Valida contra tamanho da loja
3. Se diferença: Alerta com tolerância específica
4. Atualiza estoque
```

### Compras (Purchasing)
```
1. Gerente compra para 3 lojas
2. Usa: /comparar-tamanhos
3. Recebe: EOQ específico por loja
4. Economiza: 25% em estoque
```

---

## 📱 Para Mobile/Frontend

### Requisição Simplificada
```javascript
// JavaScript/React
fetch('/api/v1/predicoes/forecast-tamanho-loja', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    categoria_id: 'bebidas_001',
    dias_historico: 90,
    tamanho_loja: 'media'
  })
})
.then(r => r.json())
.then(d => {
  console.log('Previsão:', d.dados.previsao_dia.previsao);
  console.log('Assertiveness:', d.dados.previsao_dia.assertiveness);
})
```

---

## 🔗 Recursos Relacionados

- 📖 [Guia Completo](./OTIMIZACAO_TAMANHO_LOJA.md)
- 📊 [Release Notes](./ATUALIZACAO_V2.5_MAXIMA_PRECISAO.md)
- 📋 [Mudanças](./RESUMO_CHANGES_V2.5.md)
- 🔧 [Integração POS/Scales](./INTEGRACAO_PDV_BALANCAS.md)
- 🎓 [Forecasting Principal](./PREVISAO_VENDAS_PROFISSIONAL.md)

---

**Dúvidas?** Consulte: [OTIMIZACAO_TAMANHO_LOJA.md](./OTIMIZACAO_TAMANHO_LOJA.md)
