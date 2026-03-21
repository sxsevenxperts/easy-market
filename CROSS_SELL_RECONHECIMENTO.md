# Cross-Sell Recognition & Parameterization
**Engine de Reconhecimento de Cross-Sell por Cliente**

## 📋 Visão Geral

Sistema inteligente que:
- ✅ Reconhece automaticamente padrões de compra de cada cliente
- ✅ Identifica oportunidades de cross-sell
- ✅ Parametriza recomendações específicas por cliente
- ✅ Calcula afinidade entre categorias
- ✅ Rastreia histórico de recomendações
- ✅ Valida frequência antes de recomendar

---

## 🔍 Reconhecimento de Padrões de Compra

### Análise Automática por Cliente

```http
POST /api/v1/cross-sell/analisar-cliente
Content-Type: application/json

{
  "cliente_id": "cli-001",
  "loja_id": "store-001"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "clienteId": "cli-001",
  "analise": {
    "totalCompras": 45,
    "totalGasto": "4250.50",
    "diasAdesao": 180,
    "ticketMedio": "94.45",
    "categoriasPrincipais": [
      "alimentos",
      "bebidas",
      "higiene",
      "limpeza"
    ],
    "categoriaPrimaria": "alimentos",
    "categoriasSecundarias": [
      "bebidas",
      "higiene",
      "limpeza"
    ],
    "produtosComprados": [
      {
        "id": "prod-001",
        "nome": "Arroz Tipo A 5kg",
        "categoria": "alimentos",
        "quantidade": 12,
        "valor": 89.88,
        "frequencia": 12
      },
      {
        "id": "prod-002",
        "nome": "Feijão Carioca 1kg",
        "categoria": "alimentos",
        "quantidade": 15,
        "valor": 52.50,
        "frequencia": 15
      }
    ],
    "frequenciaPorCategoria": {
      "alimentos": 35,
      "bebidas": 25,
      "higiene": 18,
      "limpeza": 12
    }
  },
  "oportunidades": [
    {
      "categoria": "congelados",
      "afinidade": 0.65,
      "potencial": 22.75,
      "tipo": "complementar"
    },
    {
      "categoria": "perecaveis",
      "afinidade": 0.58,
      "potencial": 20.30,
      "tipo": "complementar"
    },
    {
      "categoria": "utilidades",
      "afinidade": 0.42,
      "potencial": 14.70,
      "tipo": "complementar"
    }
  ],
  "timestamp": "2026-03-21T10:30:00Z"
}
```

### Dados Extraídos

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **totalCompras** | Quantidade de transações | 45 |
| **totalGasto** | Valor total gasto | 4250.50 |
| **diasAdesao** | Dias desde primeira compra | 180 |
| **ticketMedio** | Valor médio por compra | 94.45 |
| **categoriaPrimaria** | Categoria com maior frequência | alimentos |
| **categoriasSecundarias** | Outras categorias compradas | [bebidas, higiene] |
| **oportunidades** | Categorias para cross-sell | congelados, perecaveis |

---

## ⚙️ Parametrização de Cross-Sell

### Configurar Cross-Sell para Cliente

```http
POST /api/v1/cross-sell/parametrizar
Content-Type: application/json

{
  "cliente_id": "cli-001",
  "loja_id": "store-001",
  "categoria_primaria": "alimentos",
  "categorias_cross_sell": [
    "bebidas",
    "congelados",
    "perecaveis",
    "utilidades"
  ],
  "produtos_bloqueados": [
    "prod-forbidden-001",
    "prod-discontinued-002"
  ],
  "afinidade_minima": 0.55,
  "frequencia_recomendacao": 15,
  "valor_minimo_purchase": 100,
  "tipos_recomendacao": [
    "complementar",
    "substituto",
    "inovacao"
  ]
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "configId": "cfg-123abc",
  "configuracao": {
    "id": "cfg-123abc",
    "cliente_id": "cli-001",
    "loja_id": "store-001",
    "categoria_primaria": "alimentos",
    "categorias_cross_sell": [
      "bebidas",
      "congelados",
      "perecaveis",
      "utilidades"
    ],
    "productos_bloqueados": [
      "prod-forbidden-001",
      "prod-discontinued-002"
    ],
    "afinidade_minima": 0.55,
    "frequencia_recomendacao": 15,
    "valor_minimo_purchase": 100,
    "tipos_recomendacao": [
      "complementar",
      "substituto",
      "inovacao"
    ],
    "ativo": true,
    "criado_em": "2026-03-21T10:30:00Z",
    "atualizado_em": "2026-03-21T10:30:00Z"
  }
}
```

### Parâmetros Explicados

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| **cliente_id** | string | - | ID único do cliente |
| **loja_id** | string | - | ID da loja |
| **categoria_primaria** | string | - | Categoria principal de compra |
| **categorias_cross_sell** | array | [] | Categorias para recomendar |
| **produtos_bloqueados** | array | [] | Produtos a não recomendar |
| **afinidade_minima** | number | 0.5 | Mínimo de relevância (0-1) |
| **frequencia_recomendacao** | number | 30 | Dias entre recomendações |
| **valor_minimo_purchase** | number | 50 | Valor mínimo da compra anterior |
| **tipos_recomendacao** | array | [complementar, substituto, inovacao] | Tipos de recomendações |

---

## 🎯 Obter Recomendações de Cross-Sell

### Recomendações Personalizadas

```http
GET /api/v1/cross-sell/recomendacoes/cli-001?loja_id=store-001
```

**Resposta:**
```json
{
  "sucesso": true,
  "clienteId": "cli-001",
  "recomendacoes": [
    {
      "id": "prod-congelados-001",
      "nome": "Frango Congelado 1kg",
      "categoria": "congelados",
      "preco": 29.90,
      "estoqueAtual": 150,
      "scoreRelevancia": 0.78,
      "afinidade": 0.65,
      "tipoRecomendacao": "complementar",
      "compradoAntes": false
    },
    {
      "id": "prod-perecaveis-002",
      "nome": "Queijo Meia Cura 500g",
      "categoria": "perecaveis",
      "preco": 45.50,
      "estoqueAtual": 89,
      "scoreRelevancia": 0.72,
      "afinidade": 0.58,
      "tipoRecomendacao": "complementar",
      "compradoAntes": true
    },
    {
      "id": "prod-utilidades-003",
      "nome": "Pano de Prato Premium",
      "categoria": "utilidades",
      "preco": 15.90,
      "estoqueAtual": 250,
      "scoreRelevancia": 0.65,
      "afinidade": 0.42,
      "tipoRecomendacao": "complementar",
      "compradoAntes": false
    }
  ],
  "total": 3,
  "timestamp": "2026-03-21T10:35:00Z"
}
```

### Validações Aplicadas

✅ **Frequência**: Respeita intervalo mínimo entre recomendações  
✅ **Relevância**: Filtra produtos com score mínimo de afinidade  
✅ **Bloqueados**: Exclui produtos na lista negra  
✅ **Estoque**: Recomenda apenas produtos em estoque  
✅ **Histórico**: Prioriza produtos nunca comprados  

---

## 📊 Calcular Afinidade Entre Categorias

### Análise de Correlação

```http
GET /api/v1/cross-sell/afinidade?categoria_principal=alimentos&categoria_destino=bebidas&loja_id=store-001
```

**Resposta:**
```json
{
  "sucesso": true,
  "categoriaPrincipal": "alimentos",
  "categoriaDestino": "bebidas",
  "afinidade": 0.72,
  "confianca": 32,
  "transacoesComAmbas": 32,
  "transacoesComPrincipal": 45
}
```

### Interpretação

- **Afinidade 0.72**: Em 72% das compras de alimentos, também há compra de bebidas
- **Confianca 32**: 32 transações confirmam este padrão
- **Valor alto (>0.6)**: Excelente oportunidade de cross-sell
- **Valor médio (0.3-0.6)**: Boa oportunidade com potencial
- **Valor baixo (<0.3)**: Baixa correlação, recomendação fraca

---

## 🔄 Atualizar Configuração

```http
PUT /api/v1/cross-sell/atualizar/cfg-123abc
Content-Type: application/json

{
  "afinidade_minima": 0.6,
  "frequencia_recomendacao": 20,
  "categorias_cross_sell": [
    "bebidas",
    "congelados",
    "perecaveis"
  ]
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "configId": "cfg-123abc"
}
```

---

## 🗑️ Desativar Configuração

```http
POST /api/v1/cross-sell/desativar/cfg-123abc
```

**Resposta:**
```json
{
  "sucesso": true
}
```

---

## 📈 Histórico de Recomendações

```http
GET /api/v1/cross-sell/historico/cli-001?loja_id=store-001&dias=30
```

**Resposta:**
```json
{
  "sucesso": true,
  "recomendacoes": [
    {
      "id": "rec-001",
      "cliente_id": "cli-001",
      "loja_id": "store-001",
      "produto_id": "prod-congelados-001",
      "categoria_origem": "alimentos",
      "categoria_destino": "congelados",
      "tipo_recomendacao": "complementar",
      "afinidade": 0.65,
      "score_relevancia": 0.78,
      "recomendado_em": "2026-03-20T15:30:00Z"
    },
    {
      "id": "rec-002",
      "cliente_id": "cli-001",
      "loja_id": "store-001",
      "produto_id": "prod-perecaveis-002",
      "categoria_origem": "alimentos",
      "categoria_destino": "perecaveis",
      "tipo_recomendacao": "complementar",
      "afinidade": 0.58,
      "score_relevancia": 0.72,
      "recomendado_em": "2026-03-19T10:15:00Z"
    }
  ],
  "total": 2,
  "periodo": "30 dias"
}
```

---

## 📊 Tabelas Supabase Necessárias

### cross_sell_config
```sql
CREATE TABLE cross_sell_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id TEXT NOT NULL,
  loja_id TEXT NOT NULL,
  categoria_primaria TEXT NOT NULL,
  categorias_cross_sell JSONB DEFAULT '[]',
  productos_bloqueados JSONB DEFAULT '[]',
  afinidade_minima NUMERIC DEFAULT 0.5,
  frequencia_recomendacao INT DEFAULT 30,
  valor_minimo_purchase NUMERIC DEFAULT 50,
  tipos_recomendacao JSONB DEFAULT '["complementar", "substituto", "inovacao"]',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(cliente_id, loja_id)
);
```

### cross_sell_recomendacoes
```sql
CREATE TABLE cross_sell_recomendacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id TEXT NOT NULL,
  loja_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  categoria_origem TEXT,
  categoria_destino TEXT,
  tipo_recomendacao TEXT,
  afinidade NUMERIC,
  score_relevancia NUMERIC,
  aceita BOOLEAN DEFAULT NULL,
  aceita_em TIMESTAMP,
  recomendado_em TIMESTAMP DEFAULT NOW(),
  INDEX idx_cliente_loja (cliente_id, loja_id),
  INDEX idx_recomendado (recomendado_em)
);
```

### cross_sell_afinidades
```sql
CREATE TABLE cross_sell_afinidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id TEXT NOT NULL,
  categoria_principal TEXT NOT NULL,
  categoria_destino TEXT NOT NULL,
  afinidade NUMERIC,
  confianca INT,
  transacoes_ambas INT,
  transacoes_principal INT,
  calculado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(loja_id, categoria_principal, categoria_destino)
);
```

---

## 🎯 Casos de Uso

### Caso 1: Cliente Compra Alimentos → Recomendar Bebidas
```
Cliente: cli-001
Categoria Primária: alimentos (35 compras)
Categoria Destino: bebidas (25 compras)
Afinidade: 0.72 (71.4% de correlação)

Recomendação Gerada:
- Suco Natural 1L → Score: 0.85 (alta relevância)
- Refrigerante 2L → Score: 0.78
- Água Mineral 5L → Score: 0.82
```

### Caso 2: Cliente Compra Higiene → Recomendar Limpeza
```
Cliente: cli-002
Categoria Primária: higiene (28 compras)
Categoria Destino: limpeza (12 compras)
Afinidade: 0.43 (42.9% de correlação)

Recomendação Gerada:
- Detergente Neutro → Score: 0.56 (média relevância)
- Desinfetante → Score: 0.52
```

### Caso 3: Validação de Frequência
```
Cliente: cli-001
Última Recomendação: 2026-03-15 (6 dias atrás)
Frequência Configurada: 15 dias
Status: ❌ NÃO RECOMENDAR AINDA

Mensagem:
"Cliente recomendado há 6 dias. 
Frequência mínima: 15 dias. 
Próxima recomendação: 2026-03-30"
```

---

## 📈 Fórmulas e Cálculos

### Score de Relevância
```
scoreRelevancia = afinidade × coeficiente_preco × coeficiente_novidade

Onde:
- afinidade: correlação entre categorias (0-1)
- coeficiente_preco: 
  * 0.8 se preco < 50
  * 1.0 se 50 ≤ preco ≤ 200
  * 1.2 se preco > 200
- coeficiente_novidade:
  * 1.2 se nunca comprou
  * 1.0 se já comprou
```

### Afinidade Entre Categorias
```
afinidade = transacoes_com_ambas / transacoes_com_principal

Exemplo:
- 32 transações com alimentos E bebidas
- 45 transações com alimentos
- afinidade = 32/45 = 0.71
```

### Potencial de Cross-Sell
```
potencial = frequencia_principal × afinidade

Exemplo:
- Frequência de alimentos: 35 compras/período
- Afinidade com congelados: 0.65
- potencial = 35 × 0.65 = 22.75
```

---

## 🔐 Segurança & Privacidade

✅ Dados de cliente nunca expostos externamente  
✅ Apenas estatísticas agregadas compartilhadas  
✅ Recomendações respeitam bloqueios  
✅ Histórico armazenado por período configurável  
✅ Validação de permissões por loja  

---

## 📊 Exemplos Práticos

### Integrar com Dashboard
```javascript
// React component
const [recomendacoes, setRecomendacoes] = useState([]);

useEffect(() => {
  fetch(`/api/v1/cross-sell/recomendacoes/${clienteId}?loja_id=${lojaId}`)
    .then(r => r.json())
    .then(data => setRecomendacoes(data.recomendacoes));
}, [clienteId, lojaId]);

return (
  <div className="cross-sell-section">
    <h3>Recomendações Personalizadas</h3>
    {recomendacoes.map(rec => (
      <ProductCard 
        key={rec.id}
        product={rec}
        score={rec.scoreRelevancia}
        type={rec.tipoRecomendacao}
      />
    ))}
  </div>
);
```

### Análise em Lote
```bash
# Analisar todos os clientes de uma loja
for cliente in $(psql -t -c "SELECT id FROM clientes WHERE loja_id='store-001'"); do
  curl -X POST "http://localhost:3000/api/v1/cross-sell/analisar-cliente" \
    -H "Content-Type: application/json" \
    -d "{\"cliente_id\":\"$cliente\",\"loja_id\":\"store-001\"}"
done
```

---

## 🚀 Próximos Passos

1. ✅ Configurar tabelas Supabase
2. ✅ Integrar routes ao backend
3. ⏳ Rodar análise inicial em todos os clientes
4. ⏳ Treinar modelos com dados históricos
5. ⏳ Implementar feedback loop
6. ⏳ A/B testing de recomendações

---

**Status**: ✅ Pronto para produção  
**Versão**: 1.0.0  
**Última atualização**: 2026-03-21  
**Dependências Externas**: 0
