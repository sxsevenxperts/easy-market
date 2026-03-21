# Endpoints de Análise de Perdas de Produtos
## Easy Market - Rastreamento de Desperdício e Redução de Perdas

### Base URL
```
https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/perdas
```

---

## 📊 1. Taxa de Perda Atual

### GET `/taxa-atual/:loja_id`

Calcula a taxa de perda atual da loja (percentual + valor monetário).

**Query Parameters:**
- `periodo` (opcional, padrão: 30): Número de dias a analisar

**Exemplo:**
```bash
GET /api/v1/perdas/taxa-atual/loja_001?periodo=30
```

**Resposta:**
```json
{
  "sucesso": true,
  "data": {
    "loja_id": "loja_001",
    "periodo_dias": 30,
    "taxa_perda_percentual": 7.5,
    "quantidade_total_perdida": 245,
    "valor_total_perdido": 3680,
    "quantidade_vendida": 3012,
    "valor_vendido": 45180,
    "quantidade_estoque": 856,
    "valor_estoque": 12840,
    "produtos_afetados": 12,
    "classificacao": "alto",
    "recomendacoes": [
      "⚠️ ALTO: Taxa de perda acima do esperado. Investigar causas principais",
      "💡 Implemente sistema de rastreamento de produtos em tempo real",
      "📋 Revise frequência de auditorias de estoque"
    ]
  }
}
```

**Interpretação:**
- **Taxa < 2%**: Excelente
- **Taxa 2-5%**: Bom
- **Taxa 5-10%**: Alto
- **Taxa > 10%**: Crítico

---

## 📈 2. Redução de Perdas (Comparativo)

### GET `/reducao/:loja_id`

Compara a taxa de perda entre os últimos 30 dias e os 30 dias anteriores.

**Exemplo:**
```bash
GET /api/v1/perdas/reducao/loja_001
```

**Resposta:**
```json
{
  "sucesso": true,
  "data": {
    "loja_id": "loja_001",
    "periodo_anterior": {
      "nome": "Últimos 30-60 dias",
      "perda_media_diaria": 8.2
    },
    "periodo_atual": {
      "nome": "Últimos 30 dias",
      "perda_media_diaria": 7.5
    },
    "reducao_percentual": 8.54,
    "reducao_alcancada": "sim",
    "tendencia": "melhora",
    "delta_unidades": 0.7,
    "recomendacao": "👍 Boa melhora na redução de perdas. Mantenha os esforços"
  }
}
```

**Significado:**
- **Redução > 20%**: Excelente progresso
- **Redução 10-20%**: Boa melhora
- **Redução 0-10%**: Leve melhora
- **Redução < 0%**: Perdas aumentaram (ação necessária)

---

## 🏆 3. Top 10 Produtos com Maior Perda

### GET `/produtos-maior-perda/:loja_id`

Lista os produtos com maior taxa de perda.

**Query Parameters:**
- `limite` (opcional, padrão: 10): Número máximo de produtos

**Exemplo:**
```bash
GET /api/v1/perdas/produtos-maior-perda/loja_001?limite=5
```

**Resposta:**
```json
{
  "sucesso": true,
  "data": {
    "loja_id": "loja_001",
    "periodo_dias": 30,
    "total_produtos_afetados": 12,
    "produtos": [
      {
        "rank": 1,
        "produto_id": "prod_023",
        "nome": "Leite Integral 1L",
        "categoria": "Bebidas",
        "quantidade_perdida": 45,
        "valor_perdido": 180,
        "numero_perdas": 15,
        "quantidade_vendida": 312,
        "taxa_perda_pct": 12.6,
        "nivel_risco": "crítico",
        "ultima_perda": "2026-03-21T10:30:00Z",
        "acao_recomendada": "Investigar imediatamente + Implementar controle diário"
      },
      {
        "rank": 2,
        "produto_id": "prod_045",
        "nome": "Iogurte Natural 500g",
        "categoria": "Laticínios",
        "quantidade_perdida": 32,
        "valor_perdido": 128,
        "numero_perdas": 8,
        "quantidade_vendida": 425,
        "taxa_perda_pct": 7.0,
        "nivel_risco": "alto",
        "ultima_perda": "2026-03-20T15:45:00Z",
        "acao_recomendada": "Revisar procedimentos + Aumentar frequência de auditoria"
      }
    ]
  }
}
```

---

## 🏷️ 4. Análise por Categoria

### GET `/por-categoria/:loja_id`

Breakdown de perdas agrupado por categoria de produto.

**Exemplo:**
```bash
GET /api/v1/perdas/por-categoria/loja_001
```

**Resposta:**
```json
{
  "sucesso": true,
  "data": {
    "loja_id": "loja_001",
    "periodo_dias": 30,
    "total_categorias_afetadas": 5,
    "categorias": [
      {
        "rank": 1,
        "categoria": "Laticínios",
        "numero_perdas": 28,
        "quantidade_total": 78,
        "valor_total": 312,
        "quantidade_media": 2.79,
        "percentual_do_total": 31.8
      },
      {
        "rank": 2,
        "categoria": "Bebidas",
        "numero_perdas": 22,
        "quantidade_total": 67,
        "valor_total": 268,
        "quantidade_media": 3.05,
        "percentual_do_total": 27.4
      }
    ]
  }
}
```

---

## 🔍 5. Análise de Motivos de Perda

### GET `/motivos/:loja_id`

Análise dos motivos mais comuns de perdas (vencimento, dano, roubo, etc).

**Exemplo:**
```bash
GET /api/v1/perdas/motivos/loja_001
```

**Resposta:**
```json
{
  "sucesso": true,
  "data": {
    "loja_id": "loja_001",
    "periodo_dias": 30,
    "total_motivos": 4,
    "motivos": [
      {
        "motivo": "Vencimento",
        "numero_registros": 45,
        "quantidade_total": 112,
        "valor_total": 448,
        "quantidade_media": 2.49,
        "percentual": 45.7,
        "prioridade": "alta"
      },
      {
        "motivo": "Dano/Quebra",
        "numero_registros": 28,
        "quantidade_total": 78,
        "valor_total": 312,
        "quantidade_media": 2.79,
        "percentual": 31.8,
        "prioridade": "alta"
      },
      {
        "motivo": "Manuseio",
        "numero_registros": 12,
        "quantidade_total": 34,
        "valor_total": 136,
        "quantidade_media": 2.83,
        "percentual": 13.9,
        "prioridade": "média"
      }
    ]
  }
}
```

---

## 📝 6. Registrar Nova Perda

### POST `/registrar`

Registra uma nova perda de produto no sistema.

**Body (JSON):**
```json
{
  "loja_id": "loja_001",
  "produto_id": "prod_023",
  "quantidade_perdida": 5,
  "motivo": "Vencimento",
  "observacoes": "Lote vencido em 21/03. Encontrado ao fazer auditoria de estoque."
}
```

**Campos Obrigatórios:**
- `loja_id`: ID da loja
- `produto_id`: ID do produto
- `quantidade_perdida`: Quantidade em unidades
- `motivo`: Razão (ex: "Vencimento", "Dano", "Roubo", "Perda de Estoque", etc)

**Campos Opcionais:**
- `observacoes`: Notas adicionais

**Resposta:**
```json
{
  "sucesso": true,
  "data": {
    "perda_id": 1245,
    "quantidade": 5,
    "valor": 20,
    "motivo": "Vencimento",
    "data_registro": "2026-03-21T14:30:00Z"
  }
}
```

---

## 📊 7. Relatório Completo

### GET `/relatorio-completo/:loja_id`

Análise abrangente de todas as perdas (todas as 5 métricas acima em um único endpoint).

**Exemplo:**
```bash
GET /api/v1/perdas/relatorio-completo/loja_001
```

**Resposta:**
```json
{
  "sucesso": true,
  "loja_id": "loja_001",
  "data": {
    "taxa_atual": { /* dados completos */ },
    "reducao_comparativa": { /* dados completos */ },
    "top_produtos_perda": { /* dados completos */ },
    "perdas_por_categoria": { /* dados completos */ },
    "perdas_por_motivo": { /* dados completos */ },
    "resumo_executivo": {
      "taxa_perda_pct": 7.5,
      "valor_perdido_30d": 3680,
      "tendencia": "melhora",
      "reducao_pct": 8.54,
      "produtos_afetados": 12,
      "status_geral": "BOM - Redução em progresso"
    }
  }
}
```

---

## 🎯 Motivos Padrão

```
- "Vencimento": Produtos que passaram da data de validade
- "Dano": Produtos danificados durante manuseio ou transporte
- "Roubo": Produtos desaparecidos (suspeita de roubo)
- "Quebra": Produtos quebrados ou danificados irremediavelmente
- "Deterioração": Produtos que deterioraram (temperatura, umidade)
- "Manuseio": Danos causados por manuseio inadequado
- "Logística": Perdas durante transporte ou recebimento
- "Perda de Estoque": Discrepância entre registro e físico
```

---

## 📈 Indicadores-Chave (KPIs)

| Métrica | Excelente | Bom | Atenção | Crítico |
|---------|-----------|-----|---------|---------|
| Taxa de Perda | <2% | 2-5% | 5-10% | >10% |
| Redução Mês | >20% | 10-20% | 0-10% | <0% |
| Produtos Afetados | <3 | 3-7 | 7-12 | >12 |
| Valor Perdido/Dia | <15 | 15-30 | 30-60 | >60 |

---

## 💡 Recomendações por Nível

### Crítico (Taxa > 10%)
- 🚨 Investigação imediata necessária
- Auditar processos de armazenamento e manuseio
- Implementar controles diários
- Revisar treinamento de equipe

### Alto (Taxa 5-10%)
- ⚠️ Revisar procedimentos operacionais
- Aumentar frequência de auditorias
- Focar nos produtos com maior perda
- Analisar motivos predominantes

### Normal (Taxa < 5%)
- ✅ Manter procedimentos atuais
- Continuar monitoramento mensal
- Documentar boas práticas
- Compartilhar aprendizados com outras lojas

---

**Desenvolvido com ❤️ para Easy Market - Seven Xperts**
