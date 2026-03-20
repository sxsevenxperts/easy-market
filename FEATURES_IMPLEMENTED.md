# Features Implementadas - Easy Market

## 🎯 Resumo Executivo

Adicionadas 4 funcionalidades principais ao backend que cobrem:
- **Sistema de Alertas** completo (desperdício, estoque, preços, vencimentos)
- **Controle de Inventário** com rastreamento de perecíveis
- **Relatórios** em múltiplos períodos (diário até 1 ano)
- **Integração com Sistemas PDV** (Linx, Totvs, Nex) com sincronização de inventário

---

## 1. SISTEMA DE ALERTAS 🚨

### Endpoints

#### **POST /api/v1/alertas**
Criar novo alerta
```json
{
  "loja_id": "loja_001",
  "sku": "SKU123",
  "tipo": "desperdicio|falta_estoque|preco_anormal|vencimento_proximo",
  "urgencia": "alta|média|baixa",
  "titulo": "Produto vencido detectado",
  "mensagem": "Produto X venceu em 2024-03-15",
  "dados_json": {
    "quantidade_comprometida": 50,
    "preco_unitario": 15.90
  }
}
```

**Response:**
```json
{
  "id": 123,
  "loja_id": "loja_001",
  "tipo": "desperdicio",
  "status": "aberto",
  "roi_estimado": 795.00,
  "created_at": "2026-03-20T10:30:00Z"
}
```

---

#### **GET /api/v1/alertas/:loja_id**
Listar alertas da loja (com filtro de status)
```bash
GET /api/v1/alertas/loja_001?status=aberto&tipo=desperdicio&limit=50
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "total": 3,
  "alertas": [
    {
      "id": 123,
      "tipo": "desperdicio",
      "urgencia": "alta",
      "titulo": "Produto vencido",
      "status": "aberto",
      "roi_estimado": 795.00,
      "created_at": "2026-03-20T10:30:00Z"
    }
  ]
}
```

---

#### **GET /api/v1/alertas/:loja_id/criticos**
Alertas críticos apenas (alta e média urgência)
```bash
GET /api/v1/alertas/loja_001/criticos
```

---

#### **PUT /api/v1/alertas/:id**
Atualizar status de alerta
```json
{
  "status": "em_acao|resolvido",
  "resolucao_sugerida": "Aplicar desconto de 30%"
}
```

---

#### **GET /api/v1/alertas/:loja_id/resumo**
Resumo de alertas (últimos 7 dias)
```bash
GET /api/v1/alertas/loja_001/resumo
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "resumo": [
    {
      "tipo": "desperdicio",
      "status": "aberto",
      "total": 5,
      "roi_total": 3975.00
    },
    {
      "tipo": "falta_estoque",
      "status": "resolvido",
      "total": 2,
      "roi_total": 1500.00
    }
  ]
}
```

---

## 2. CONTROLE DE INVENTÁRIO 📦

### Endpoints

#### **GET /api/v1/inventario/:loja_id**
Resumo geral de estoque
```bash
GET /api/v1/inventario/loja_001
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "resumo_estoque": {
    "total_produtos": 1240,
    "total_unidades": 15432,
    "valor_total_estoque": 125000.00,
    "produtos_estoque_baixo": 47,
    "produtos_pereciveis": 156
  }
}
```

---

#### **GET /api/v1/inventario/:loja_id/produtos**
Listar produtos com status
```bash
GET /api/v1/inventario/loja_001/produtos?categoria=Bebidas&status=critico&limit=100
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "total": 47,
  "produtos": [
    {
      "sku": "SKU123",
      "nome": "Cerveja Brahma 350ml",
      "categoria": "Bebidas",
      "preco_venda": 5.50,
      "estoque_atual": 3,
      "estoque_minimo": 50,
      "estoque_maximo": 500,
      "status_estoque": "critico",
      "dias_para_vencer": null
    }
  ]
}
```

---

#### **POST /api/v1/inventario/:loja_id/produtos**
Criar ou atualizar produto
```json
{
  "sku": "SKU123",
  "nome": "Cerveja Brahma 350ml",
  "categoria": "Bebidas",
  "preco_custo": 2.50,
  "preco_venda": 5.50,
  "estoque_atual": 150,
  "estoque_minimo": 50,
  "estoque_maximo": 500,
  "eh_perecivel": true,
  "data_vencimento": "2026-06-30"
}
```

---

#### **PUT /api/v1/inventario/:loja_id/movimento**
Registrar entrada/saída de estoque
```json
{
  "sku": "SKU123",
  "quantidade": 50,
  "tipo_movimento": "entrada|saida|ajuste|devolucao",
  "motivo": "Reposição de estoque"
}
```

**Response:**
```json
{
  "sku": "SKU123",
  "estoque_atual": 200,
  "updated_at": "2026-03-20T10:30:00Z"
}
```

---

#### **GET /api/v1/inventario/:loja_id/vencimentos**
Produtos vencendo em breve (últimos 7 dias por padrão)
```bash
GET /api/v1/inventario/loja_001/vencimentos?dias=15
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "dias_verificacao": 15,
  "total_risco": 12,
  "produtos": [
    {
      "sku": "SKU456",
      "nome": "Iogurte Natural 500g",
      "data_vencimento": "2026-03-22",
      "estoque_atual": 45,
      "dias_para_vencer": 2,
      "nivel_risco": "CRÍTICO"
    }
  ]
}
```

---

#### **GET /api/v1/inventario/:loja_id/estoque-baixo**
Produtos com estoque abaixo do mínimo
```bash
GET /api/v1/inventario/loja_001/estoque-baixo
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "total_produtos_baixo": 47,
  "valor_total_repor": 12500.00,
  "produtos": [
    {
      "sku": "SKU123",
      "nome": "Cerveja Brahma 350ml",
      "estoque_atual": 3,
      "estoque_minimo": 50,
      "quantidade_para_repor": 47,
      "valor_para_repor": 117.50
    }
  ]
}
```

---

## 3. RELATÓRIOS 📊

### Períodos Disponíveis
- `diario` (1 dia)
- `semanal` (7 dias)
- `quinzenal` (15 dias)
- `mensal` (30 dias)
- `90dias` (90 dias)
- `6meses` (180 dias)
- `1ano` (365 dias)

---

#### **GET /api/v1/relatorios/:loja_id/vendas**
Relatório de vendas com segmentação

```bash
GET /api/v1/relatorios/loja_001/vendas?periodo=mensal&categoria=Bebidas
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "periodo": "mensal",
  "dias_analisados": 30,
  "resumo": {
    "total_faturamento": 45000.00,
    "total_quantidade": 5000,
    "total_transacoes": 1250,
    "ticket_medio": 36.00
  },
  "dados": [
    {
      "data": "2026-03-20",
      "hora": 10,
      "categoria": "Bebidas",
      "total_quantidade": 120,
      "total_faturamento": 660.00,
      "quantidade_produtos_unicos": 8,
      "preco_medio": 5.50
    }
  ]
}
```

---

#### **GET /api/v1/relatorios/:loja_id/memorial**
Memorial completo de cada item (histórico)

```bash
GET /api/v1/relatorios/loja_001/memorial?sku=SKU123&segmentar_por=dia
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "segmentacao": "dia",
  "total_registros": 45,
  "memorial": [
    {
      "time": "2026-03-20T15:30:00Z",
      "dia": 20,
      "hora": 15,
      "dia_semana": 3,
      "sku": "SKU123",
      "nome_produto": "Cerveja Brahma 350ml",
      "categoria": "Bebidas",
      "quantidade": 10,
      "preco_unitario": 5.50,
      "preco_total": 55.00,
      "is_feriado": false
    }
  ]
}
```

---

#### **GET /api/v1/relatorios/:loja_id/categoria/:categoria**
Análise específica de categoria com trends

```bash
GET /api/v1/relatorios/loja_001/categoria/Bebidas?periodo=mensal
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "categoria": "Bebidas",
  "periodo": "mensal",
  "trend_percentual": "12.50",
  "dados": [
    {
      "data": "2026-03-20",
      "total_quantidade": 150,
      "total_faturamento": 825.00,
      "transacoes": 45,
      "preco_medio": 5.50
    }
  ]
}
```

---

#### **GET /api/v1/relatorios/:loja_id/horarios**
Análise de vendas por hora e dia da semana
```bash
GET /api/v1/relatorios/loja_001/horarios?periodo=semanal
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "periodo": "semanal",
  "horas_pico": [
    {
      "hora": 18,
      "dia_semana": 5,
      "total_faturamento": 3500.00,
      "transacoes": 180
    }
  ],
  "matriz_vendas": [...]
}
```

---

#### **GET /api/v1/relatorios/:loja_id/desperdicio**
Análise de desperdício e perdas

```bash
GET /api/v1/relatorios/loja_001/desperdicio?dias=30
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "periodo_dias": 30,
  "analise_desperdicio": [
    {
      "tipo": "desperdicio",
      "categoria": "Perecíveis",
      "total_alertas": 5,
      "quantidade_afetada": 250,
      "economia_potencial": 3980.50
    }
  ],
  "total_economia_potencial": 7500.00
}
```

---

#### **GET /api/v1/relatorios/:loja_id/comparativo**
Análise comparativa (semana atual vs passada, mês atual vs passado)

```bash
GET /api/v1/relatorios/loja_001/comparativo
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "comparativo": {
    "semana": {
      "atual": 3500,
      "passada": 3100,
      "variacao_percentual": "12.90"
    },
    "mes": {
      "atual": 15000,
      "passada": 13500,
      "variacao_percentual": "11.11"
    },
    "faturamento": {
      "semana_atual": 19250.00,
      "semana_passada": 17050.00
    }
  }
}
```

---

## 4. INTEGRAÇÃO COM SISTEMAS PDV 🔗

### Sistemas Suportados
- **Linx** - Sistema tradicional de PDV (varejo)
- **Totvs** - ERP com módulo de PDV
- **Nex** - Sistema moderno de gestão
- **Custom API** - Qualquer API customizada

---

#### **POST /api/v1/integracao-pdv/configurar**
Configurar integração com PDV

```json
{
  "loja_id": "loja_001",
  "pdv_tipo": "linx|totvs|nex|custom_api",
  "pdv_api_key": "sua-chave-api",
  "pdv_host": "192.168.1.100",
  "pdv_porta": 8080
}
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "pdv_tipo": "linx",
  "pdv_host": "192.168.1.100",
  "pdv_porta": 8080,
  "connection_test": true,
  "status": "conectado"
}
```

---

#### **POST /api/v1/integracao-pdv/venda**
Receber venda do PDV e processar automaticamente

```json
{
  "loja_id": "loja_001",
  "transacao_id": "TRX20260320001",
  "data_hora": "2026-03-20T15:30:00Z",
  "itens": [
    {
      "sku": "SKU123",
      "codigo_balanca": "001234",
      "nome_produto": "Cerveja Brahma 350ml",
      "categoria": "Bebidas",
      "quantidade": 10,
      "preco_unitario": 5.50,
      "valor_total": 55.00,
      "desconto_percentual": 0
    }
  ],
  "valor_total": 55.00,
  "forma_pagamento": "dinheiro|cartao",
  "operador": "Operador 1"
}
```

**Response:**
```json
{
  "transacao_id": "TRX20260320001",
  "loja_id": "loja_001",
  "status": "processada",
  "itens_inseridos": 1,
  "timestamp": "2026-03-20T15:30:45Z"
}
```

---

#### **POST /api/v1/integracao-pdv/:loja_id/sincronizar-inventario**
Puxar inventário completo do PDV e sincronizar

```bash
POST /api/v1/integracao-pdv/loja_001/sincronizar-inventario
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "pdv_tipo": "linx",
  "status": "sincronizado",
  "resumo": {
    "total_produtos": 1240,
    "produtos_inseridos": 45,
    "produtos_atualizados": 1195
  },
  "timestamp": "2026-03-20T15:35:00Z"
}
```

---

#### **GET /api/v1/integracao-pdv/:loja_id/status**
Verificar status da conexão PDV

```bash
GET /api/v1/integracao-pdv/loja_001/status
```

**Response:**
```json
{
  "loja_id": "loja_001",
  "integrado": true,
  "pdv_tipo": "linx",
  "status": "conectado|desconectado|nao_integrado",
  "ultima_sincronizacao": "2026-03-20T15:35:00Z"
}
```

---

## 📈 Fluxos de Dados

### Fluxo 1: Integração PDV → Venda → Alerta
```
PDV (Linx/Totvs/Nex)
    ↓
POST /integracao-pdv/venda
    ↓
Inserir em vendas (hypertable)
    ↓
Atualizar estoque em produtos
    ↓
Verificar se estoque < mínimo
    ↓
CRIAR ALERTA (falta_estoque)
```

### Fluxo 2: Sincronização de Inventário
```
POST /integracao-pdv/sincronizar-inventario
    ↓
Fetch inventário do PDV
    ↓
Upsert em tabela produtos
    ↓
Log em historico_acoes
    ↓
Response com resumo
```

### Fluxo 3: Geração de Relatório
```
GET /relatorios/vendas?periodo=mensal
    ↓
Query timescaledb com agregações
    ↓
GROUP BY data/hora/categoria
    ↓
Cálculo de trends e resumos
    ↓
Response com dados consolidados
```

---

## 🔄 Próximas Features (Sugeridas)

1. **Dashboard Web (Next.js PWA)**
   - Visualização em tempo real de alertas
   - Gráficos interativos de vendas e estoque
   - Mapas de calor de horários pico

2. **Notificações em Tempo Real**
   - WhatsApp para alertas críticos
   - SMS para o gerente
   - Email para relatórios programados

3. **Local Agent (Python)**
   - Collector rodando em Raspberry Pi na loja
   - Sincronização offline com SQLite
   - Suporte para scales (Toledo, Filizola)

4. **ML Engine (Python)**
   - Previsões com Prophet/XGBoost
   - Correlação clima-demanda
   - Recomendações de shelf positioning

5. **Integração com Mais PDVs**
   - SAT (Sistema Autenticador de Transmissão)
   - Frente de Loja específicas (Nulogia, Olex, etc)

---

## 🚀 Como Usar

### 1. Configurar PDV
```bash
curl -X POST http://localhost:3000/api/v1/integracao-pdv/configurar \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "loja_001",
    "pdv_tipo": "linx",
    "pdv_api_key": "sua-chave",
    "pdv_host": "192.168.1.100",
    "pdv_porto": 8080
  }'
```

### 2. Sincronizar Inventário
```bash
curl -X POST http://localhost:3000/api/v1/integracao-pdv/loja_001/sincronizar-inventario
```

### 3. Gerar Relatório
```bash
curl http://localhost:3000/api/v1/relatorios/loja_001/vendas?periodo=mensal
```

### 4. Verificar Alertas
```bash
curl http://localhost:3000/api/v1/alertas/loja_001/criticos
```

---

## 📝 Notas Técnicas

- **Cache Redis**: Alertas e inventário são cacheados por 5-10 minutos
- **Hypertable TimescaleDB**: Vendas mantêm 2 anos de histórico com compressão automática
- **Validação Joi**: Todos endpoints validam com schemas explícitos
- **Logarithmação**: Winston tracks todas operações em error.log e combined.log
- **Sincronização**: Inventário do PDV usa UPSERT para evitar duplicatas
