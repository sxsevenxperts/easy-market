# API de Otimização de Compras 📦

## Visão Geral

A API de Otimização de Compras calcula a quantidade ótima de pedidos considerando:
- **Demanda** (taxa de consumo diária)
- **Lead time** (tempo de entrega do fornecedor)
- **Variabilidade** (desvio padrão das vendas)
- **Taxa de Segurança/Gordura** (buffer para evitar faltas)

**Objetivo Principal:**
- ✅ Evitar falta de estoque (stockout)
- ✅ Minimizar custo de manutenção (não excessar)
- ✅ Otimizar volume de pedido (EOQ - Economic Order Quantity)
- ✅ Melhorar taxa de fill rate (atender 100% demanda)

**"Gordura" = Taxa extra do pedido exato para não faltar:**
```
Precisa de 100 unidades → Ordena 115 (gordura 15%)
   ↓
Tem segurança, mas não excessiva
```

---

## Endpoints

### 1️⃣ GET `/api/v1/otimizacao-compras/quantidade-otima/:loja_id/:produto_id`

**Descrição:** Calcula quantidade ótima de pedido (EOQ) com buffer de segurança.

#### Parâmetros

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `loja_id` | Integer | ✅ | ID da loja |
| `produto_id` | Integer | ✅ | ID do produto |
| `gordura` | Float | ⏰ | Taxa de segurança (0.05-0.30), default 0.15 (15%) |
| `lead_time_dias` | Integer | ⏰ | Dias até fornecedor entregar, default 7 |

#### Exemplo Request
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-compras/quantidade-otima/1/5?gordura=0.15&lead_time_dias=7"
```

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "produto_id": 5,
    "nome": "Peito de Frango Desfiado 300g",
    "preco_unitario": 12.50,
    
    "demanda": {
      "media_diaria": 42.5,
      "desvio_padrao": 15.3,
      "pico_diario": 120,
      "minima_diaria": 5,
      "demanda_anual": 15512
    },

    "estoque_seguranca": 25.3,
    "demanda_durante_leadtime": 297,
    "ponto_reposicao": 322,

    "quantidade_economica_pedido": 387,
    "gordura_percentual": 15,
    "quantidade_sem_gordura": 387,
    "quantidade_com_gordura": 445,
    "quantidade_recomendada": 445,

    "custos": {
      "custo_manuticao_anual_unitario": 2.50,
      "custo_pedido_fixo": 50.00,
      "custo_manutencao_total_ano": 289.35,
      "custo_pedidos_ano": 2006.87
    },

    "recomendacao": {
      "ordenar": 445,
      "quando": "Quando estoque <= 322 unidades",
      "frequencia_dias": 10,
      "dias_de_cobertura": 10
    },

    "lead_time_dias": 7,
    "timestamp": "2026-03-21T14:30:00Z"
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

#### Interpretação

| Campo | Significado | Ação |
|-------|-----------|------|
| `quantidade_recomendada: 445` | Pedir 445 unidades (com gordura 15%) | Usar como valor para PR |
| `ponto_reposicao: 322` | Quando estoque cair para 322 | Ativar novo pedido |
| `dias_de_cobertura: 10` | 445 unidades = 10 dias de vendas | Seguro até próxima entrega |
| `estoque_seguranca: 25.3` | Buffer extra para variabilidade | Proteção contra spikes |

---

### 2️⃣ GET `/api/v1/otimizacao-compras/analise-loja/:loja_id`

**Descrição:** Analisa todos os produtos da loja e recomenda otimizações de compra. Ordena por risco (variabilidade).

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |
| `gordura` | Float | ⏰ | default 0.15 (15%) |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "loja": {
      "id": 1,
      "nome": "Super Lagoa Junco"
    },
    "total_produtos_analisados": 245,
    
    "resumo_por_risco": {
      "critico": 8,     // Muito variável, pedir com gordura +25%
      "alto": 25,       // Variável, gordura +20%
      "normal": 212     // Estável, gordura +10-15%
    },

    "produtos_alto_risco": [
      {
        "produto_id": 12,
        "nome": "Chocolate Premium 100g",
        "demanda": {
          "media_diaria": 8.5,
          "desvio_padrao": 65.2,
          "demanda_anual": 3102
        },
        "quantidade_recomendada": 95,
        "ponto_reposicao": 65,
        "recomendacao": {
          "ordenar": 95,
          "quando": "Quando estoque <= 65",
          "frequencia_dias": 11
        }
      }
    ],

    "gordura_utilizada": "15%",
    "economia_estimada": "R$ 8.500 ao mês"
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

### 3️⃣ GET `/api/v1/otimizacao-compras/cenarios/:loja_id/:produto_id`

**Descrição:** Simula 6 cenários de gordura (5%, 10%, 15%, 20%, 25%, 30%) para ajudar escolher taxa ótima.

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |
| `produto_id` | Integer | ✅ |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "produto_id": 5,
    "cenarios": [
      {
        "gordura_percentual": 5,
        "quantidade_pedido": 408,
        "custo_anual": 2310.50,
        "risco_falta": 95,
        "dias_cobertura": 9
      },
      {
        "gordura_percentual": 10,
        "quantidade_pedido": 426,
        "custo_anual": 2350.80,
        "risco_falta": 90,
        "dias_cobertura": 10
      },
      {
        "gordura_percentual": 15,
        "quantidade_pedido": 445,
        "custo_anual": 2400.20,
        "risco_falta": 85,
        "dias_cobertura": 10
      },
      {
        "gordura_percentual": 20,
        "quantidade_pedido": 464,
        "custo_anual": 2459.50,
        "risco_falta": 80,
        "dias_cobertura": 11
      },
      {
        "gordura_percentual": 25,
        "quantidade_pedido": 484,
        "custo_anual": 2520.30,
        "risco_falta": 75,
        "dias_cobertura": 11
      },
      {
        "gordura_percentual": 30,
        "quantidade_pedido": 504,
        "custo_anual": 2590.70,
        "risco_falta": 70,
        "dias_cobertura": 12
      }
    ],

    "recomendacao_otima": {
      "gordura_percentual": 15,
      "quantidade_pedido": 445,
      "custo_anual": 2400.20,
      "risco_falta": 85,
      "dias_cobertura": 10
    },

    "analise": {
      "tradeoff": "Mais gordura = menos risco falta, mas custo maior",
      "sugestao": "Gordura 15% oferece melhor relação custo-benefício"
    }
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

#### Interpretação

| Gordura | Custo | Risco | Uso Ideal |
|---------|-------|-------|-----------|
| **5%** | Mínimo | Muito alto | Produtos estáveis, sem perdas |
| **10%** | Baixo | Alto | Produtos normais |
| **15%** | Médio | Médio | **RECOMENDADO (default)** |
| **20%** | Alto | Baixo | Produtos variáveis |
| **25%** | Muito alto | Muito baixo | Produtos críticos (falta = perda) |
| **30%** | Máximo | Mínimo | Produtos essenciais |

---

### 4️⃣ GET `/api/v1/otimizacao-compras/risco-falta/:loja_id`

**Descrição:** Identifica produtos com risco CRÍTICO/ALTO/MÉDIO de falta de estoque agora.

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "loja": {
      "id": 1,
      "nome": "Super Lagoa Junco"
    },
    "total_produtos_em_risco": 8,
    
    "resumo": {
      "critico": 2,
      "alto": 3,
      "medio": 3
    },

    "alertas_criticos": [
      {
        "produto_id": 12,
        "nome": "Chocolate Premium 100g",
        "categoria": "Doces",
        "estoque_atual": 8,
        "estoque_minimo": 50,
        "vendas_7dias": 150,
        "media_diaria": 21.4,
        "nivel_risco": "CRÍTICO",
        "dias_para_faltar": 0.4,
        "acao_urgente": "PEDIR HOJE"
      },
      {
        "produto_id": 22,
        "nome": "Refrigerante Guaraná 2L",
        "categoria": "Bebidas",
        "estoque_atual": 12,
        "estoque_minimo": 100,
        "vendas_7dias": 280,
        "media_diaria": 40,
        "nivel_risco": "CRÍTICO",
        "dias_para_faltar": 0.3,
        "acao_urgente": "PEDIR HOJE"
      }
    ],

    "alertas_altos": [
      {
        "produto_id": 5,
        "nome": "Peito de Frango Desfiado 300g",
        "dias_para_faltar": 1.2,
        "acao_urgente": "PEDIR AMANHÃ"
      }
    ],

    "acoes_recomendadas": {
      "fazer_hoje": [
        "Pedir Chocolate Premium (0.4 dias de estoque)",
        "Pedir Refrigerante Guaraná (0.3 dias de estoque)"
      ],
      "fazer_amanha": [
        "Pedir Peito de Frango"
      ]
    }
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

### 5️⃣ GET `/api/v1/otimizacao-compras/gordura-por-categoria/:loja_id`

**Descrição:** Recomenda nível de gordura ideal para cada categoria baseado em variabilidade de demanda.

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "loja": {
      "id": 1,
      "nome": "Super Lagoa Junco"
    },
    "total_categorias": 12,
    
    "categorias": [
      {
        "categoria": "Bebidas",
        "total_produtos": 35,
        "variabilidade_media": 45.2,
        "variabilidade_maxima": 120,
        "total_perdas": 8,
        "total_vendido": 2500,
        "gordura_recomendada_percentual": 25,
        "justificativa": "Alta variabilidade - aumentar segurança"
      },
      {
        "categoria": "Laticínios",
        "total_produtos": 20,
        "variabilidade_media": 15.3,
        "variabilidade_maxima": 45,
        "total_perdas": 120,
        "total_vendido": 1200,
        "gordura_recomendada_percentual": 10,
        "justificativa": "Produtos perecíveis - reduzir segurança"
      },
      {
        "categoria": "Grãos",
        "total_produtos": 15,
        "variabilidade_media": 8.5,
        "variabilidade_maxima": 20,
        "total_perdas": 2,
        "total_vendido": 3200,
        "gordura_recomendada_percentual": 12,
        "justificativa": "Padrão"
      }
    ],

    "resumo_gorduras": {
      "muito_alta_25_30": ["Bebidas", "Congelados"],
      "alta_20_25": ["Doces", "Snacks"],
      "media_15_20": ["Proteínas", "Grãos"],
      "baixa_menos_15": ["Laticínios", "Perecíveis"]
    },

    "explicacao": {
      "muito_alta": "Alta variabilidade - aumentar segurança",
      "alta": "Variabilidade moderada",
      "media": "Padrão recomendado",
      "baixa": "Produtos estáveis ou com histórico de perda"
    }
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

### 6️⃣ GET `/api/v1/otimizacao-compras/impacto-financeiro/:loja_id/:produto_id`

**Descrição:** Calcula impacto financeiro de diferentes gorduras. Trade-off: custo manutenção vs risco falta.

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |
| `produto_id` | Integer | ✅ |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "produto_id": 5,
    "impactos": [
      {
        "gordura_percentual": 10,
        "quantidade_pedido": 426,
        
        "custos_mensais": {
          "manutencao": 24.23,
          "pedidos": 167.24,
          "potencial_falta": 15.50,
          "total": 206.97
        },

        "beneficios": {
          "reducao_falta_percentual": 10,
          "valor_evitado_falta": 15.50
        }
      },
      {
        "gordura_percentual": 15,
        "quantidade_pedido": 445,
        
        "custos_mensais": {
          "manutencao": 25.32,
          "pedidos": 167.24,
          "potencial_falta": 10.30,
          "total": 202.86
        },

        "beneficios": {
          "reducao_falta_percentual": 15,
          "valor_evitado_falta": 10.30
        }
      },
      {
        "gordura_percentual": 20,
        "quantidade_pedido": 464,
        
        "custos_mensais": {
          "manutencao": 26.50,
          "pedidos": 167.24,
          "potencial_falta": 7.20,
          "total": 200.94
        },

        "beneficios": {
          "reducao_falta_percentual": 20,
          "valor_evitado_falta": 7.20
        }
      }
    ],

    "recomendacao": {
      "gordura_percentual": 15,
      "quantidade_pedido": 445,
      "custos_mensais": {
        "total": 202.86
      }
    },

    "analise_risco_retorno": {
      "menor_custo": {
        "gordura_percentual": 10,
        "custo_total": 206.97
      },
      "melhor_balance": {
        "gordura_percentual": 15,
        "custo_total": 202.86
      },
      "mais_seguro": {
        "gordura_percentual": 20,
        "custo_total": 200.94
      }
    }
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

## Fluxo de Uso Recomendado

### 1️⃣ **Dia 1 - Análise Geral**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-compras/analise-loja/1"
```
👉 Ver todos os produtos por risco (crítico, alto, normal)

### 2️⃣ **Dia 1 - Alertas Urgentes**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-compras/risco-falta/1"
```
👉 Identificar o que pedir HOJE vs AMANHÃ

### 3️⃣ **Dia 1 - Gordura por Categoria**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-compras/gordura-por-categoria/1"
```
👉 Definir taxa de segurança padrão por tipo produto

### 4️⃣ **Dia 2 - Para Cada Produto**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-compras/quantidade-otima/1/5?gordura=0.15"
```
👉 Calcular quantidade exata de pedido com gordura

### 5️⃣ **Opcional - Comparar Cenários**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-compras/cenarios/1/5"
```
👉 Validar se 15% é melhor que 10% ou 20%

### 6️⃣ **Opcional - Impacto Financeiro**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-compras/impacto-financeiro/1/5"
```
👉 Entender trade-off custo vs segurança

---

## Interpretação de Métricas

### EOQ (Economic Order Quantity)
```
EOQ = sqrt(2 * D * S / H)
D = Demanda anual
S = Custo fixo por pedido
H = Custo de manutenção anual

Significa: Quantidade que equilibra custo de pedido vs custo estoque
```

### Ponto de Reposição
```
Reorder Point = (Demanda Diária × Lead Time) + Estoque Segurança
Significa: Quando pedir novo lote para não faltar durante entrega
```

### Estoque de Segurança
```
Safety Stock = Z-score × Desvio Padrão × sqrt(Lead Time)
Z-score = 1.65 (95% confiança)
Significa: Buffer extra para variações inesperadas
```

---

## Cenários de Uso

### Produto Estável (Baixa Variabilidade)
- Variabilidade: 5-10 unidades
- Gordura recomendada: 10%
- Exemplo: Arroz, feijão, óleo

### Produto Normal (Média Variabilidade)
- Variabilidade: 15-30 unidades
- Gordura recomendada: 15% ⭐ default
- Exemplo: Leite, pão, frutas

### Produto Volátil (Alta Variabilidade)
- Variabilidade: 50+ unidades
- Gordura recomendada: 20-25%
- Exemplo: Bebidas, doces, produtos sazonais

### Produto Perecível (Alto Risco Perda)
- Variabilidade: qualquer
- Gordura recomendada: 10% (reduzido)
- Exemplo: Laticínios, carnes frescas

---

## Exemplos de Implementação

### Node.js (Backend)
```javascript
const axios = require('axios');

async function otimizarCompras(lojaId) {
  // 1. Alertas urgentes
  const riscos = await axios.get(
    `http://localhost:3000/api/v1/otimizacao-compras/risco-falta/${lojaId}`
  );
  
  console.log('PEDIR HOJE:', riscos.data.data.acoes_recomendadas.fazer_hoje);
  
  // 2. Para cada produto crítico, calcular quantidade
  for (const produto of riscos.data.data.alertas_criticos) {
    const otimizacao = await axios.get(
      `http://localhost:3000/api/v1/otimizacao-compras/quantidade-otima/${lojaId}/${produto.produto_id}`
    );
    
    console.log(`${produto.nome}: Pedir ${otimizacao.data.data.quantidade_recomendada} unidades`);
  }
}

otimizarCompras(1);
```

### SQL Query (Criar PR automática)
```sql
WITH otimizacao AS (
  SELECT 
    produto_id,
    quantidade_recomendada,
    ponto_reposicao,
    CURRENT_TIMESTAMP as data_calculo
  FROM (SELECT * FROM otimizacao_compras.calcular_quantidade_otima(...))
)
INSERT INTO pedidos_recomendados (produto_id, quantidade, data_recomendacao, status)
SELECT produto_id, quantidade_recomendada, data_calculo, 'PENDENTE'
FROM otimizacao
WHERE status_estoque = 'CRÍTICO'
```

---

## KPIs Monitorados

| Métrica | Fórmula | Target |
|---------|---------|--------|
| **Fill Rate** | (Vendas realizadas / Demanda total) * 100 | >98% |
| **Stockout %** | (Dias sem estoque / 30) * 100 | <1% |
| **Inventory Turns** | COGS / Avg Inventory | >12x/ano |
| **Days Sales Inventory** | 365 / Inventory Turns | <30 dias |
| **Custo Pedidos/Mês** | Total pesados × custo fixo / 12 | Mínimo |

---

## Próximos Passos

1. ✅ Endpoints criados e testados
2. ⏳ Integrar com dashboard (mostrar alertas)
3. ⏳ Criar scheduler para gerar POs automáticas (diárias/semanais)
4. ⏳ Conectar com fornecedores (API de pedido)
5. ⏳ Histórico de acurácia (EOQ vs realizado)
6. ⏳ Machine learning para ajustar gordura por padrões
