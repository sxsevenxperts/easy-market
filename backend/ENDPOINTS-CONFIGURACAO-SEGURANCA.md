# API de Configuração de Taxa de Segurança 🛡️

## Visão Geral

Cada supermercado pode configurar suas próprias taxas de segurança (gordura/buffer) em 3 níveis:

1. **Loja** - Taxa padrão aplicada a todos os produtos
2. **Categoria** - Taxa específica para cada tipo de produto
3. **Produto** - Taxa customizada para produtos críticos

## Hierarquia de Aplicação

```
Taxa Customizada do Produto (prioridade 1)
         ↓ se não existe
Taxa da Categoria (prioridade 2)
         ↓ se não existe
Taxa Padrão da Loja (prioridade 3)
```

---

## Endpoints

### 1️⃣ GET `/api/v1/configuracao-seguranca/loja/:loja_id`

**Descrição:** Obter toda a configuração de segurança da loja.

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Resposta 200

```json
{
  "success": true,
  "data": {
    "id": 1,
    "loja_id": 1,
    "taxa_seguranca_padrao": 0.15,
    
    "taxa_bebidas": 0.25,
    "taxa_alimentos_pereciveis": 0.10,
    "taxa_alimentos_nao_pereciveis": 0.12,
    "taxa_higiene_limpeza": 0.15,
    "taxa_eletronicos": 0.20,
    "taxa_outros": 0.15,
    
    "politica_risco_aceitavel": "BALANCEADO",
    "considerar_sazonalidade": true,
    "considerar_perecibilidade": true,
    
    "criada_em": "2026-01-01T10:00:00Z",
    "atualizada_em": "2026-03-21T14:30:00Z",
    "atualizada_por": "gerente@supermercado.com"
  },
  "timestamp": "2026-03-21T14:30:00Z",
  "loja_id": 1
}
```

---

### 2️⃣ PUT `/api/v1/configuracao-seguranca/loja/:loja_id/taxa-padrao`

**Descrição:** Atualizar taxa padrão de segurança da loja (aplica a todos produtos sem customização).

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Body

```json
{
  "taxa_padrao": 0.15
}
```

#### Resposta 200

```json
{
  "success": true,
  "data": {
    "loja_id": 1,
    "taxa_seguranca_padrao": 0.15,
    "atualizada_em": "2026-03-21T14:35:00Z"
  },
  "mensagem": "Taxa padrão atualizada para 15%",
  "timestamp": "2026-03-21T14:35:00Z",
  "loja_id": 1
}
```

---

### 3️⃣ PUT `/api/v1/configuracao-seguranca/loja/:loja_id/taxa-categoria`

**Descrição:** Definir taxa de segurança customizada por categoria.

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |

#### Body

```json
{
  "categoria": "bebidas",
  "taxa": 0.25
}
```

#### Categorias Suportadas

| Categoria | Descrição | Taxa Sugerida |
|-----------|-----------|---------------|
| `bebidas` | Bebidas em geral | 0.25 (alta variabilidade) |
| `alimentos_pereciveis` | Laticínios, carnes, frescos | 0.10 (risco de perda) |
| `alimentos_nao_pereciveis` | Grãos, arroz, etc | 0.12 (estável) |
| `higiene_limpeza` | Higiene pessoal e limpeza | 0.15 (padrão) |
| `eletronicos` | Eletrônicos e eletrodomésticos | 0.20 (demanda variável) |
| `outros` | Categorias não mapeadas | 0.15 (padrão) |

#### Resposta 200

```json
{
  "success": true,
  "data": {
    "loja_id": 1,
    "taxa_bebidas": 0.25
  },
  "mensagem": "Taxa da categoria bebidas atualizada para 25%",
  "timestamp": "2026-03-21T14:40:00Z"
}
```

---

### 4️⃣ PUT `/api/v1/configuracao-seguranca/loja/:loja_id/produto/:produto_id/taxa-customizada`

**Descrição:** Definir taxa de segurança específica para um produto (máxima prioridade).

#### Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `loja_id` | Integer | ✅ |
| `produto_id` | Integer | ✅ |

#### Body

```json
{
  "taxa": 0.30,
  "observacoes": "Produto essencial, falta gera perda de clientes"
}
```

#### Resposta 200

```json
{
  "success": true,
  "data": {
    "id": 5,
    "nome": "Refrigerante Guaraná 2L",
    "taxa_seguranca_customizada": 0.30,
    "observacoes_seguranca": "Produto essencial, falta gera perda de clientes"
  },
  "mensagem": "Taxa customizada para Refrigerante Guaraná 2L definida em 30%",
  "timestamp": "2026-03-21T14:45:00Z"
}
```

---

### 5️⃣ DELETE `/api/v1/configuracao-seguranca/loja/:loja_id/produto/:produto_id/taxa-customizada`

**Descrição:** Remover taxa customizada de um produto (volta ao padrão da categoria ou loja).

#### Resposta 200

```json
{
  "success": true,
  "data": {
    "id": 5,
    "nome": "Refrigerante Guaraná 2L",
    "taxa_seguranca_customizada": null
  },
  "mensagem": "Taxa customizada removida. Refrigerante Guaraná 2L voltará ao padrão da loja",
  "timestamp": "2026-03-21T14:50:00Z"
}
```

---

### 6️⃣ GET `/api/v1/configuracao-seguranca/loja/:loja_id/produto/:produto_id/taxa`

**Descrição:** Obter taxa que será aplicada a um produto (mostra qual nível está sendo usado).

#### Resposta 200

```json
{
  "success": true,
  "data": {
    "produto_id": 5,
    "nome": "Refrigerante Guaraná 2L",
    "categoria": "Bebidas",
    "taxa_final": 0.30,
    "origem_taxa": "CUSTOMIZADA_PRODUTO",
    "detalhes": {
      "taxa_customizada_produto": 0.30,
      "taxa_categoria_configurada": 0.25,
      "taxa_padrao_loja": 0.15
    }
  },
  "timestamp": "2026-03-21T14:55:00Z"
}
```

#### Interpretação

```
taxa_final: 0.30 (a que será usada para cálculos)

Prioridade em cascata:
1. taxa_customizada_produto: 0.30 ✅ (USADA!)
2. taxa_categoria_configurada: 0.25 (não usada)
3. taxa_padrao_loja: 0.15 (não usada)
```

---

### 7️⃣ PUT `/api/v1/configuracao-seguranca/loja/:loja_id/politica-risco`

**Descrição:** Definir política de risco geral da loja (ajusta taxa padrão automaticamente).

#### Body

```json
{
  "politica": "BALANCEADO"
}
```

#### Políticas Disponíveis

| Política | Taxa | Descrição | Use Quando |
|----------|------|-----------|-----------|
| **CONSERVADOR** | 25-30% | Evita stockout a todo custo | Produtos críticos, sem margem falha |
| **BALANCEADO** | 15% | Equilíbrio custo-segurança | Maioria dos supermercados |
| **AGRESSIVO** | 10% | Minimiza estoque | Produtos estáveis, alta rotação |

#### Resposta 200

```json
{
  "success": true,
  "data": {
    "loja_id": 1,
    "politica_risco_aceitavel": "BALANCEADO",
    "taxa_seguranca_padrao": 0.15,
    "atualizada_em": "2026-03-21T15:00:00Z"
  },
  "descricao_politica": "Política média (15%) - equilibra custo de estoque vs risco de falta",
  "mensagem": "Política de risco alterada para BALANCEADO",
  "timestamp": "2026-03-21T15:00:00Z"
}
```

---

### 8️⃣ GET `/api/v1/configuracao-seguranca/loja/:loja_id/taxas-customizadas`

**Descrição:** Listar todos os produtos com taxa customizada.

#### Resposta 200

```json
{
  "success": true,
  "data": {
    "total": 3,
    "produtos": [
      {
        "id": 5,
        "nome": "Refrigerante Guaraná 2L",
        "categoria": "Bebidas",
        "taxa_customizada": 0.30,
        "observacoes_seguranca": "Produto essencial",
        "taxa_padrao_comparacao": 0.15
      },
      {
        "id": 12,
        "nome": "Chocolate Premium 100g",
        "categoria": "Doces",
        "taxa_customizada": 0.08,
        "observacoes_seguranca": "Alto histórico de perda",
        "taxa_padrao_comparacao": 0.15
      },
      {
        "id": 22,
        "nome": "Leite Integral 1L",
        "categoria": "Laticínios",
        "taxa_customizada": 0.05,
        "observacoes_seguranca": "Perecível, risco de vencimento",
        "taxa_padrao_comparacao": 0.15
      }
    ]
  },
  "timestamp": "2026-03-21T15:05:00Z"
}
```

---

### 9️⃣ GET `/api/v1/configuracao-seguranca/loja/:loja_id/produto/:produto_id/taxa-recomendada`

**Descrição:** Obter taxa recomendada considerando contexto do produto.

#### Query Parameters

| Nome | Tipo | Valores | Default |
|------|------|--------|---------|
| `variabilidade` | String | `ALTA`, `MEDIA`, `BAIXA` | `MEDIA` |
| `perecivel` | Boolean | `true`, `false` | `false` |
| `essencial` | Boolean | `true`, `false` | `false` |
| `sazonalidade` | String | `ALTA`, `MEDIA`, `BAIXA` | `BAIXA` |

#### Exemplo Request

```bash
curl -X GET "http://localhost:3000/api/v1/configuracao-seguranca/1/5/taxa-recomendada?variabilidade=ALTA&perecivel=false&essencial=true&sazonalidade=MEDIA"
```

#### Resposta 200

```json
{
  "success": true,
  "data": {
    "taxa_recomendada": 0.28,
    "baseado_em": "BALANCEADO",
    "contexto_aplicado": {
      "variabilidade_demanda": "ALTA",
      "eh_perecivel": false,
      "eh_essencial": true,
      "sazonalidade": "MEDIA"
    }
  },
  "timestamp": "2026-03-21T15:10:00Z"
}
```

#### Ajustes Aplicados

```
Taxa base (BALANCEADO): 0.15

+ Variabilidade ALTA: +0.10 → 0.25
+ Essencial: +0.05 → 0.30
- Perecível: -0.05 (não aplica)
+ Sazonalidade MEDIA: ~0.00

Taxa recomendada: 0.28
```

---

## Fluxo de Configuração Recomendado

### 1️⃣ **Dia 1 - Configurar Loja**

```bash
# Obter configuração atual
curl -X GET "http://localhost:3000/api/v1/configuracao-seguranca/loja/1"

# Definir política de risco (ex: BALANCEADO)
curl -X PUT "http://localhost:3000/api/v1/configuracao-seguranca/loja/1/politica-risco" \
  -H "Content-Type: application/json" \
  -d '{"politica": "BALANCEADO"}'
```

### 2️⃣ **Dia 1-2 - Configurar Categorias**

```bash
# Bebidas (alta variabilidade) → 25%
curl -X PUT "http://localhost:3000/api/v1/configuracao-seguranca/loja/1/taxa-categoria" \
  -d '{"categoria": "bebidas", "taxa": 0.25}'

# Perecíveis (risco perda) → 10%
curl -X PUT "http://localhost:3000/api/v1/configuracao-seguranca/loja/1/taxa-categoria" \
  -d '{"categoria": "alimentos_pereciveis", "taxa": 0.10}'

# Não-perecíveis (estável) → 12%
curl -X PUT "http://localhost:3000/api/v1/configuracao-seguranca/loja/1/taxa-categoria" \
  -d '{"categoria": "alimentos_nao_pereciveis", "taxa": 0.12}'
```

### 3️⃣ **Dia 2-3 - Produtos Críticos**

```bash
# Produto essencial (falta = perda cliente)
curl -X PUT "http://localhost:3000/api/v1/configuracao-seguranca/loja/1/produto/5/taxa-customizada" \
  -d '{"taxa": 0.30, "observacoes": "Essencial, falta gera insatisfação"}'

# Produto perecível alto risco
curl -X PUT "http://localhost:3000/api/v1/configuracao-seguranca/loja/1/produto/12/taxa-customizada" \
  -d '{"taxa": 0.05, "observacoes": "Alto risco vencimento"}'
```

### 4️⃣ **Usar Configuração**

```bash
# Ao calcular quantidade ótima, sistema:
1. Verifica taxa_customizada_produto (se existe, usa)
2. Se não, verifica taxa_categoria (se existe, usa)
3. Se não, usa taxa_padrao_loja
```

---

## Exemplo: Aplicação Prática

### Cenário: "Refrigerante é essencial, bebidas voláteis"

**Configuração:**

```
Loja:
  - Taxa padrão: 0.15
  - Política: BALANCEADO
  
Categoria:
  - Bebidas: 0.25 (alta variabilidade)
  
Produto:
  - Refrigerante Guaraná 2L: 0.30 (essencial)
  - Refrigerante genérico: (usa categoria 0.25)
  - Suco natural: (usa categoria 0.25)
```

**Ao calcular compra de Refrigerante Guaraná 2L:**

```
GET /otimizacao-compras/quantidade-otima/1/5

Sistema:
1. Obtém taxa → 0.30 (customizada do produto)
2. Calcula quantidade ótima com gordura 30%
3. Se EOQ = 100, ordena 130 unidades
```

---

## Integração com Otimização de Compras

Quando usar endpoints de compras, sistema **automáticamente**:

```javascript
// Na função calcularQuantidadeOtimaPedido()

const taxaAUtilizar = await ConfiguracaoSeguranca.obterTaxaParaProduto(lojaId, produtoId);
// taxaAUtilizar = 0.30 (se customizada) ou 0.25 (se categoria) ou 0.15 (padrão)

const quantidadeComGordura = Math.round(eoq * (1 + taxaAUtilizar));
```

---

## KPIs Monitorados

Sistema rastreia efetividade das taxas configuradas:

```sql
SELECT 
  taxa_aplicada,
  quantidade_perdida,
  resultado_esperado_vs_real
FROM historico_taxa_seguranca
WHERE loja_id = 1
ORDER BY data_pedido DESC;

-- Análise:
-- Se muitas perdas com taxa 30% → aumentar
-- Se muito excesso com taxa 10% → reduzir
```

---

## Dicas de Configuração

| Situação | Taxa | Motivo |
|----------|------|--------|
| Produto novo, demanda desconhecida | +25% | Segurança contra variabilidade |
| Produto com histórico de perda | -5% | Evitar excesso obsoleto |
| Produto seasonal (Natal, páscoa) | +20% | Picos previsíveis |
| Produto perecível | -5 a -10% | Risco vencimento |
| Produto essencial (falta = perda) | +20% | Crítico manter estoque |
| Produto slow-moving | -5% | Não ocupar espaço |

---

## Próximos Passos

1. ✅ Endpoints criados
2. ⏳ Integrar com dashboard (mostrar configurações)
3. ⏳ Machine learning para sugerir ajustes baseado em histórico
4. ⏳ Alertas quando taxa está ineficiente
5. ⏳ Relatório de ROI das configurações
