# API de Otimização Nutricional 🥗🍔

## Visão Geral

A API de Otimização Nutricional integra dados de composição nutricional (**% gordura, calorias, proteína, sódio, açúcar, etc**) com estratégias de posicionamento, preço e cross-sell.

**Objetivo Principal:**
- ✅ Aumentar receita respeitando tendências de consumo (saúde vs prazer)
- ✅ Maximizar margem através de premium pricing em produtos health-conscious
- ✅ Aumentar ticket médio via combos nutricionalmente complementares
- ✅ Fidelizar públicos específicos (seniors, diabéticos, health-conscious)

**Por que nutrição importa:**
1. **Tendência de Mercado:** Consumidores buscam ativamente produtos "saudáveis"
2. **Premium Pricing:** Produtos low-fat/high-protein suportam +12% de preço
3. **Cross-sell:** Produto gordo + produto magro = combo natural
4. **Segmentação:** Diferentes públicos em diferentes seções

---

## Endpoints

### 1️⃣ GET `/api/v1/otimizacao-nutricional/perfil/:loja_id`

**Descrição:** Extrai perfil nutricional completo de todos os produtos com análise de:
- % Gordura (distribuição: muito baixa → muito alta)
- Proteína, calorias, sódio, açúcar, fibra, colesterol
- Vendas e receita por categoria nutricional
- Correlação com perda e movimentação

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "total_produtos": 245,
    "produtos": [
      {
        "produto_id": 5,
        "nome": "Peito de Frango Desfiado 300g",
        "categoria": "Proteínas",
        "preco": 12.50,
        "percentual_gordura": 3.2,
        "percentual_proteina": 32.5,
        "percentual_carboidrato": 0,
        "calorias_por_100g": 165,
        "sodio_mg_por_100g": 45,
        "acucar_por_100g": 0,
        "categoria_gordura": "MUITO_BAIXA_GORDURA",
        "categoria_proteina": "ALTO_PROTEINA",
        "categoria_caloria": "BAIXA_CALORIA",
        "quantidade_vendas": 520,
        "total_vendido": 2600,
        "receita_total": 32500,
        "quantidade_perdida": 12,
        "valor_perdido": 150
      },
      {
        "produto_id": 12,
        "nome": "Chocolate Premium 100g",
        "categoria": "Doces",
        "preco": 8.50,
        "percentual_gordura": 38.5,
        "percentual_proteina": 5.2,
        "percentual_carboidrato": 52.1,
        "calorias_por_100g": 540,
        "sodio_mg_por_100g": 120,
        "acucar_por_100g": 45.0,
        "categoria_gordura": "MUITO_ALTA_GORDURA",
        "categoria_proteina": "BAIXA_PROTEINA",
        "categoria_caloria": "ALTA_CALORIA",
        "quantidade_vendas": 350,
        "total_vendido": 350,
        "receita_total": 2975,
        "quantidade_perdida": 2,
        "valor_perdido": 17
      }
    ],
    "distribuicao_gordura": {
      "muito_baixa": 45,     // < 5%
      "baixa": 60,           // 5-15%
      "moderada": 85,        // 15-25%
      "alta": 35,            // 25-35%
      "muito_alta": 20       // > 35%
    }
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

#### Interpretação

| Categoria Gordura | Significado | Implicação |
|-------------------|-------------|-----------|
| **MUITO_BAIXA** (<5%) | Lean/High-protein | Premium pricing +12-15%, prateleira dos olhos |
| **BAIXA** (5-15%) | Mainstream healthy | Bom volume, preço normal |
| **MODERADA** (15-25%) | Balanced | Mainstream, volume alto |
| **ALTA** (25-35%) | Indulgent | Lower volume, impulse buy |
| **MUITO_ALTA** (>35%) | Decadent | Premium impulse, pré-checkout |

---

### 2️⃣ GET `/api/v1/otimizacao-nutricional/classificacao/:loja_id`

**Descrição:** Classifica produtos por perfil de consumidor:
- **Health-Conscious:** Baixa gordura + Alta proteína (ex: frango, iogurte grego)
- **Indulgence:** Alta gordura + Alta caloria (ex: chocolate, sorvete premium)
- **Balanced:** Gordura moderada + Macros equilibrados
- **Low-Sodium:** Ideal para hipertensos (sódio < 200mg/100g)
- **No-Sugar:** Ideal para diabéticos (açúcar < 5g/100g)

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "health_conscious": {
      "total": 45,
      "produtos": [
        {
          "produto_id": 5,
          "nome": "Peito de Frango Desfiado 300g",
          "categoria": "Proteínas",
          "gordura": 3.2,
          "proteina": 32.5,
          "calorias": 165,
          "score_saude": 10.8
        },
        {
          "produto_id": 8,
          "nome": "Iogurte Grego Natural 150g",
          "categoria": "Laticínios",
          "gordura": 4.5,
          "proteina": 18.0,
          "calorias": 95,
          "score_saude": 11.2
        }
      ]
    },
    "indulgence": {
      "total": 20,
      "produtos": [
        {
          "produto_id": 12,
          "nome": "Chocolate Premium 100g",
          "categoria": "Doces",
          "gordura": 38.5,
          "calorias": 540,
          "score_indulgencia": 0.94
        },
        {
          "produto_id": 18,
          "nome": "Sorvete Premium Chocolate 500ml",
          "categoria": "Congelados",
          "gordura": 16.2,
          "calorias": 220,
          "score_indulgencia": 0.81
        }
      ]
    },
    "balanced": {
      "total": 85,
      "produtos": [
        {
          "produto_id": 15,
          "nome": "Arroz Integral 2kg",
          "categoria": "Grãos",
          "gordura": 2.7,
          "proteina": 12.5,
          "carboidrato": 77.0
        }
      ]
    },
    "low_sodium": {
      "total": 35,
      "produtos": [
        {
          "produto_id": 22,
          "nome": "Caldo de Carne 500ml",
          "sodio": 180
        }
      ]
    },
    "no_sugar": {
      "total": 28,
      "produtos": [
        {
          "produto_id": 30,
          "nome": "Refrigerante Zero 2L",
          "acucar": 0
        }
      ]
    }
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

### 3️⃣ GET `/api/v1/otimizacao-nutricional/complementaridade/:loja_id`

**Descrição:** Gera matriz de complementaridade nutricional. Identifica produtos que se combinam bem:
- Produto gordo + produto magro = combo balanceado
- Proteína + carboidrato = refeição completa
- Salgado + sem sal = equilíbrio

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "total_combos": 156,
    "combos_premium": [
      {
        "produto_1": {
          "id": 5,
          "nome": "Peito de Frango Desfiado 300g",
          "categoria": "Proteínas",
          "gordura": 3.2,
          "receita": 32500
        },
        "produto_2": {
          "id": 15,
          "nome": "Arroz Integral 2kg",
          "categoria": "Grãos",
          "gordura": 2.7,
          "receita": 18900
        },
        "score_complementaridade": 78,
        "razoes": [
          "Proteína oposta: 32.5% vs 12.5%",
          "Combinação de refeição balanceada (proteína + carboidrato)"
        ],
        "estrategia": "COMBO_PREMIUM",
        "sugestao": "End-cap promocional: Frango + Arroz = Refeição Completa -15%"
      },
      {
        "produto_1": {
          "id": 8,
          "nome": "Iogurte Grego Natural 150g",
          "categoria": "Laticínios",
          "gordura": 4.5,
          "receita": 12600
        },
        "produto_2": {
          "id": 35,
          "nome": "Granola Integral 300g",
          "categoria": "Cereais",
          "gordura": 8.2,
          "receita": 8400
        },
        "score_complementaridade": 72,
        "razoes": [
          "Proteína complementar: 18% vs 8%",
          "Combinação natural (café da manhã)"
        ],
        "estrategia": "COMBO_PREMIUM",
        "sugestao": "Posicionar lado a lado no corredor de café da manhã"
      }
    ],
    "combos_frequent_crosssell": [
      {
        "produto_1": {...},
        "produto_2": {...},
        "score_complementaridade": 55,
        "estrategia": "CROSS_SELL_FREQUENTE"
      }
    ],
    "top_10": [...],
    "todas_combinacoes": [...]
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

### 4️⃣ GET `/api/v1/otimizacao-nutricional/posicionamento/:loja_id`

**Descrição:** Estratégia de posicionamento baseada em perfil nutricional com seções, visibilidade e sinalização recomendada.

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "secoes_por_perfil": {
      "entrada_health_conscious": {
        "localizacao": "Lado direito entrada (visibilidade máxima)",
        "produtos": [
          {
            "produto_id": 5,
            "nome": "Peito de Frango Desfiado 300g",
            "score_saude": 10.8
          }
        ],
        "objetivo": "Atrair consumidor consciente na entrada",
        "impacto_esperado": "Aumentar ticket em 8-12%",
        "sinalização": "Bandeira SAUDÁVEL ou ECO"
      },
      
      "entrada_indulgence": {
        "localizacao": "Lado esquerdo entrada (visibilidade máxima)",
        "produtos": [
          {
            "produto_id": 12,
            "nome": "Chocolate Premium 100g",
            "score_indulgencia": 0.94
          }
        ],
        "objetivo": "Venda por impulso (prazer)",
        "impacto_esperado": "Aumentar impulse buys em 15-20%",
        "sinalização": "Bandeira Premium ou INDULGÊNCIA"
      },

      "corredor_central_balanced": {
        "localizacao": "Corredor principal",
        "objetivo": "Produtos mainstream para maioria consumidores",
        "impacto_esperado": "Aumentar volume"
      },

      "secao_senior": {
        "localizacao": "Altura facilmente acessível (1.2m a 1.6m)",
        "produtos": "Low-sodium products",
        "objetivo": "Fácil acesso, produtos com baixo sódio",
        "impacto_esperado": "Fidelizar seniors"
      },

      "secao_diabeticos": {
        "localizacao": "Próximo a bebidas e doces",
        "produtos": "No-sugar products",
        "objetivo": "Opções sem açúcar"
      }
    },

    "estrategia_por_percentual_gordura": {
      "muito_baixa_gordura": {
        "localizacao": "Prateleira dos olhos",
        "motivo": "Consumidores health-conscious buscam ativamente",
        "markup_recomendado": "+15%",
        "visibilidade": "Alta",
        "exemplo": "Peito de frango, iogurte grego, clara de ovo"
      },
      
      "baixa_gordura": {
        "localizacao": "Altura natural (entre olhos e cintura)",
        "motivo": "Gama mais vendida",
        "markup_recomendado": "+10%",
        "visibilidade": "Alta"
      },

      "gordura_moderada": {
        "localizacao": "Prateleira abaixo dos olhos",
        "motivo": "Mais fácil verificar se procurando",
        "markup_recomendado": "+5%",
        "visibilidade": "Média"
      },

      "alta_gordura": {
        "localizacao": "Prateleira baixa ou alto (menos alcance)",
        "motivo": "Impulse/curiosidade, não busca ativa",
        "markup_recomendado": "+20%",
        "visibilidade": "Baixa",
        "estrategia": "Menor volume, maior margem"
      },

      "muito_alta_gordura": {
        "localizacao": "Pré-checkout ou end-cap promo",
        "motivo": "Venda por impulso/hedge",
        "markup_recomendado": "+25%",
        "visibilidade": "Very High (impulse)",
        "exemplo": "Chocolate, sorvete premium, biscoitos"
      }
    },

    "combos_recomendados": [
      {
        "combo": "Peito de Frango + Arroz Integral",
        "posicionamento": "End-cap na entrada",
        "impacto_ticket": "+15%"
      }
    ]
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

### 5️⃣ GET `/api/v1/otimizacao-nutricional/precos/:loja_id`

**Descrição:** Recomendações de ajuste de preço baseado em elasticidade por tipo nutricional.

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Resposta 200 (Success)

```json
{
  "success": true,
  "data": {
    "aumentar_preco": {
      "total": 12,
      "produtos": [
        {
          "produto": "Peito de Frango Desfiado 300g",
          "preco_atual": 12.50,
          "preco_sugerido": "14.00",
          "justificativa": "Premium health product - elasticidade preço baixa",
          "impacto_estimado": "+8-12% margem",
          "potencial_receita_adicional": "R$ 1.800/mês"
        },
        {
          "produto": "Iogurte Grego Natural 150g",
          "preco_atual": 6.50,
          "preco_sugerido": "7.28",
          "justificativa": "High-protein demand crescente",
          "impacto_estimado": "+10% margem"
        }
      ],
      "motivo": "Premium health products - elasticidade preço baixa"
    },

    "reduzir_preco": {
      "total": 5,
      "produtos": [
        {
          "produto": "Chocolate Premium 100g",
          "preco_atual": 8.50,
          "preco_sugerido": "7.65",
          "justificativa": "Promover movimento de estoque",
          "impacto_estimado": "+40-50% volume"
        }
      ],
      "motivo": "Produtos com baixa rotação e alta gordura"
    },

    "promover_combo": {
      "total": 8,
      "produtos": [
        {
          "combo": "Frango + Arroz",
          "estrategia": "Combo com desconto 10% no total",
          "impacto_ticket": "+15-20%",
          "preco_combo": "R$ 18.90 (vs R$ 21.00 individual)"
        }
      ],
      "motivo": "Aumentar ticket médio"
    }
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

### 6️⃣ GET `/api/v1/otimizacao-nutricional/relatorio-completo/:loja_id`

**Descrição:** Relatório INTEGRADO com todas as análises + recomendações + impacto estimado. Ideal para dashboard ou PDF.

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
    "timestamp": "2026-03-21T14:30:00Z",
    "perfilNutricional": {
      "total_produtos": 245,
      "categorias_gordura": {
        "muito_baixa": 45,
        "baixa": 60,
        "moderada": 85,
        "alta": 35,
        "muito_alta": 20
      }
    },
    "perfilConsumidor": {...},
    "complementaridade": {...},
    "posicionamento": {...},
    "ajustesPreco": {...},
    "metricas_impacto": {
      "receita_potencial_aumento": "+12-18%",
      "ticket_medio_aumento": "+8-12%",
      "volume_venda_aumento": "+5-8%",
      "margem_aumento": "+10-15%",
      "receita_adicional_mensal_estimada": "R$ 18.000-25.000",
      "periodo_payback": "6-8 semanas"
    }
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

## Fluxo de Uso Recomendado

### 1️⃣ **Dia 1 - Entender Perfil Nutricional**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-nutricional/perfil/1"
```
👉 Ver distribuição de % gordura: quantos produtos low-fat vs high-fat?

### 2️⃣ **Dia 1 - Classificar por Consumidor**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-nutricional/classificacao/1"
```
👉 Identificar: Health-Conscious, Indulgence, Balanced, Seniors, Diabetics

### 3️⃣ **Dia 2 - Analisar Combos**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-nutricional/complementaridade/1"
```
👉 Descobrir: Quais produtos se combinam bem nutricionalmente?

### 4️⃣ **Dia 2 - Revisar Posicionamento**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-nutricional/posicionamento/1"
```
👉 Validar com gerente: Onde posicionar por % gordura?

### 5️⃣ **Dia 3 - Ajustar Preços**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-nutricional/precos/1"
```
👉 Implementar: +15% em health products, -10% em low-rotation items

### 6️⃣ **Semanal - Monitorar**
```bash
curl -X GET "http://localhost:3000/api/v1/otimizacao-nutricional/relatorio-completo/1"
```
👉 Relatório com impacto: receita +12-18%, margem +10-15%

---

## Integração com Gondola Optimization

Os dois sistemas funcionam em conjunto:

```
Gondola (Perda + Consumo Temporal) 
    +
Nutricional (% Gordura + Segmentação)
    ↓
Layout Ótimo com Receita Máxima + Saúde
```

**Exemplo:**
- Gondola: "Iogurte está perdendo 2.3%, posicionar em pré-checkout"
- Nutricional: "Iogurte é MUITO_BAIXA_GORDURA, posicionar prateleira dos olhos com +15% preço"
- **Combinado:** End-cap de iogurte com promoção "Saudável" a R$ 7.50 (vs R$ 6.50)

---

## Exemplos de Implementação

### Node.js (Backend)
```javascript
const axios = require('axios');

async function optimizeStore(lojaId) {
  try {
    // 1. Perfil nutricional
    const perfil = await axios.get(
      `http://localhost:3000/api/v1/otimizacao-nutricional/perfil/${lojaId}`
    );
    
    // 2. Classificação
    const classificacao = await axios.get(
      `http://localhost:3000/api/v1/otimizacao-nutricional/classificacao/${lojaId}`
    );
    
    // 3. Relatório completo
    const relatorio = await axios.get(
      `http://localhost:3000/api/v1/otimizacao-nutricional/relatorio-completo/${lojaId}`
    );
    
    console.log('Receita potencial:', relatorio.data.data.metricas_impacto.receita_potencial_aumento);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

optimizeStore(1);
```

### Frontend (React)
```javascript
const [relatorio, setRelatorio] = useState(null);

const fetchNutritionalReport = async (lojaId) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/otimizacao-nutricional/relatorio-completo/${lojaId}`
  );
  const data = await response.json();
  setRelatorio(data.data);
};

// Render: Distribuição de gordura
<BarChart data={relatorio.perfilNutricional.categorias_gordura} />

// Render: Impacto estimado
<KPICard label="Receita +12-18%" value={relatorio.metricas_impacto.receita_potencial_aumento} />
```

---

## Métricas Alvo (KPIs)

| Métrica | Initial | Alvo | Método |
|---------|---------|------|--------|
| Receita | R$ 145k | R$ 162-175k (+12-20%) | Soma de vendas mensais |
| Ticket Médio | R$ 52 | R$ 56-62 (+8-15%) | receita / quantidade_vendas |
| Margem | 22% | 25-27% (+3-5pp) | (margem_bruta / receita) * 100 |
| Receita Health-Conscious | R$ 18k | R$ 22-25k (+15-20%) | Soma produtos low-fat |
| Receita Indulgence (impulse) | R$ 12k | R$ 16-18k (+25-30%) | Soma produtos pre-checkout |

---

## Notas Importantes

✅ **Colunas Nutricionais Obrigatórias:**
- Para usar este sistema, a tabela `produtos` precisa ter:
  - `percentual_gordura`
  - `percentual_proteina`
  - `percentual_carboidrato`
  - `calorias_por_100g`
  - `sodio_mg_por_100g`
  - `acucar_por_100g`
  - Ver: `/backend/src/migrations/003_adicionar_colunas_nutricionais.sql`

✅ **Alimentação de Dados:**
- Esses dados podem vir de:
  - Tabela de nutrição de fornecedor
  - API de informação nutricional
  - Inserção manual via dashboard
  - Integração com Supabase

✅ **Frequência de Atualização:**
- Recomendado: Atualizar % gordura / calorias mensal ou a cada mudança de fornecedor
- Vendas/Receita: Atualizam em tempo real conforme transações

---

## Próximos Passos

1. ✅ Executar migration 003 para adicionar colunas nutricionais
2. ⏳ Alimentar dados de composição nutricional na tabela de produtos
3. ⏳ Testar endpoints com dados reais de "Super Lagoa Junco"
4. ⏳ Integrar visualizações no dashboard (gráficos de distribuição)
5. ⏳ Criar scheduler para relatórios automáticos (semanal/mensal)
6. ⏳ Combinar com Gondola Optimization para layout final ótimo
