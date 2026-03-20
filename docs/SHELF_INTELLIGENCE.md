# Easy Market — Shelf Intelligence & Product Tracking System

## Visão Geral

Sistema que rastreia **100% da jornada do produto** desde a pesagem na balança até o pagamento (ou não pagamento), com análise granular e recomendação automática de organização de prateleiras para **maximizar rentabilidade**.

---

## 1. Fluxo Completo de Rastreamento

```
┌──────────────────┐
│  BALANÇA (Pesada)│  ← Gera código + etiqueta
└────────┬─────────┘
         │ SKU, peso, preço, timestamp
         ▼
┌──────────────────────────┐
│ PRODUTO ETIQUETADO       │  ← Registrado no sistema
│ Status: ETIQUETADO       │     Aguardando prateleira
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ REPOSIÇÃO NA GONDOLA     │  ← Scan de código
│ Status: NA_PRATELEIRA    │     Qual gondola?
│ Timestamp: XX:XX         │     Qual posição?
└────────┬─────────────────┘
         │
         ├─► COMPRA BEM-SUCEDIDA
         │   Status: VENDIDO
         │   Timestamp pagamento
         │   Método pagamento
         │   Valor final
         │
         ├─► CLIENTE DEVOLVEU
         │   Status: DEVOLVIDO
         │   Motivo (vencimento, dano, mudança de ideia)
         │   Timestamp
         │
         ├─► CLIENTE DESISTIU (Abandono)
         │   Status: ABANDONADO
         │   Tempo na prateleira (5min? 2h?)
         │   Posição abandonada
         │
         ├─► PRODUTO PERDIDO/ROUBADO
         │   Status: FALTA_INVENTARIO
         │   Última localização conhecida
         │   Tempo desaparecido
         │
         └─► VENCIMENTO ATINGIDO
             Status: VENCIDO
             Desconto aplicado / Descarte
             Perda total
```

---

## 2. Schema Expandido - Rastreamento Completo

```sql
-- ============================================
-- 1. TRANSAÇÃO (Ticket de Compra)
-- ============================================
CREATE TABLE transacoes (
  id SERIAL PRIMARY KEY,
  loja_id TEXT NOT NULL REFERENCES lojas(loja_id),
  
  -- Timeline da transação
  data_hora_inicio TIMESTAMPTZ NOT NULL, -- Quando cliente pegou primeira item
  data_hora_pagamento TIMESTAMPTZ,       -- Quando pagou (NULL se não pagou)
  duracao_compra_minutos INT,             -- Tempo que levou
  
  -- Cliente
  cliente_id TEXT,  -- Anonimizado
  numero_itens INT,
  
  -- Resultado
  status TEXT NOT NULL, -- 'finalizada', 'abandonada', 'parcial'
  valor_total NUMERIC(12, 2),
  desconto_aplicado NUMERIC(12, 2),
  metodo_pagamento TEXT, -- 'dinheiro', 'debito', 'credito', 'pix', 'cupom'
  
  -- Localização final
  caixa_id TEXT,
  atendente_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transacoes_loja_data ON transacoes(loja_id, data_hora_pagamento);

-- ============================================
-- 2. ITEM DA TRANSAÇÃO (SKU específico rastreado)
-- ============================================
CREATE TABLE item_transacao (
  id SERIAL PRIMARY KEY,
  
  transacao_id INT REFERENCES transacoes(id) ON DELETE CASCADE,
  loja_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  
  -- Identificação
  codigo_balanca TEXT UNIQUE, -- De onde veio (balança ID + timestamp)
  codigo_etiqueta TEXT UNIQUE,
  
  -- Produto
  nome_produto TEXT,
  categoria TEXT,
  subcategoria TEXT,
  
  -- Peso/Quantidade
  quantidade NUMERIC(10, 3),
  unidade_medida TEXT, -- 'kg', 'un', 'l'
  
  -- Preços
  preco_unitario NUMERIC(10, 2),
  preco_total NUMERIC(12, 2),
  
  -- Timeline do item
  data_hora_pesagem TIMESTAMPTZ NOT NULL,
  data_hora_etiquetagem TIMESTAMPTZ,
  data_hora_reposicao TIMESTAMPTZ,      -- Quando foi para prateleira
  data_hora_pego_cliente TIMESTAMPTZ,   -- Quando cliente pegou
  data_hora_carrinho TIMESTAMPTZ,       -- Quando entrou no carrinho
  data_hora_pagamento TIMESTAMPTZ,      -- Quando foi pago (NULL se abandonado)
  
  -- Localização na prateleira
  gondola_id TEXT,           -- ID da prateleira
  posicao_prateleira TEXT,   -- 'olho', 'mão', 'pé', 'topo'
  linha_numero INT,
  coluna_numero INT,
  
  -- Status do item
  status TEXT NOT NULL, -- 'etiquetado', 'na_prateleira', 'no_carrinho', 'vendido', 
                        -- 'abandonado', 'devolvido', 'falta_inventario', 'vencido'
  
  -- Razão de não compra (se aplicável)
  motivo_nao_compra TEXT, -- 'vencimento', 'dano', 'cliente_mudou_ideia', 'roubado', 'desaparecido'
  
  -- Rastreamento de perda
  eh_perecivel BOOLEAN,
  data_vencimento DATE,
  dias_para_vencer_na_prateleira INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_item_transacao_sku ON item_transacao(loja_id, sku);
CREATE INDEX idx_item_transacao_gondola ON item_transacao(loja_id, gondola_id);
CREATE INDEX idx_item_transacao_status ON item_transacao(loja_id, status);
CREATE INDEX idx_item_transacao_categoria ON item_transacao(loja_id, categoria);

-- ============================================
-- 3. EVENTO DE RASTREAMENTO (Timeline detalhada)
-- ============================================
CREATE TABLE evento_item (
  id SERIAL PRIMARY KEY,
  
  item_id INT REFERENCES item_transacao(id) ON DELETE CASCADE,
  loja_id TEXT NOT NULL,
  
  -- Evento
  tipo_evento TEXT NOT NULL, -- 'pesagem', 'etiquetagem', 'reposicao', 'pego_cliente', 
                             -- 'carrinho', 'pagamento', 'abandono', 'devolucao'
  
  timestamp_evento TIMESTAMPTZ NOT NULL,
  
  -- Contexto
  local_evento TEXT,  -- 'balanca_1', 'gondola_5', 'caixa_3', 'entrada_loja'
  usuario_id TEXT,    -- Quem fez a ação (operador balança, repositor, caixa)
  
  -- Dados do evento
  dados_json JSONB, -- {temperatura: 5, umidade: 80, velocidade_filme: 2.5, qualidade_etiqueta: ok}
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evento_item ON evento_item(item_id, timestamp_evento);
CREATE INDEX idx_evento_tipo ON evento_item(loja_id, tipo_evento, timestamp_evento);

-- ============================================
-- 4. ANÁLISE DE ABANDONO (Produto que saiu mas não foi comprado)
-- ============================================
CREATE TABLE analise_abandono (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  categoria TEXT,
  
  -- Análise
  data_analise DATE,
  quantidade_etiquetada INT,
  quantidade_vendida INT,
  quantidade_abandonada INT,
  taxa_abandono_percentual NUMERIC(5, 2), -- 100 * (abandonadas / etiquetadas)
  
  -- Detalhes do abandono
  motivos_principais JSONB, -- {"vencimento_proximo": 45, "posicao_ruim": 30, "preco_alto": 25}
  tempo_medio_prateleira_minutos INT,
  
  -- Posições de abandono (onde são mais deixados)
  posicoes_abandono_comuns TEXT[], -- ['olho_centro', 'pé_direita', 'topo']
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. OTIMIZAÇÃO DE GONDOLA (Recomendação de reposição)
-- ============================================
CREATE TABLE otimizacao_gondola (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL,
  gondola_id TEXT NOT NULL,
  categoria TEXT,
  
  -- Data para qual otimizar
  data_recomendacao DATE,
  dia_semana TEXT, -- 'segunda', 'terça', ... 'domingo'
  
  -- Produtos recomendados (ordenado por rentabilidade)
  produtos_recomendados JSONB, -- [{
                                --   "sku": "123",
                                --   "nome": "Sorvete",
                                --   "posicao_ideal": "olho",
                                --   "quantidade_recomendada": 20,
                                --   "margem_lucro": 35,
                                --   "velocidade_venda": 8.5,
                                --   "roi_estimado": 245.67,
                                --   "motivo": "pico de vendas sábado + calor previsto"
                                -- }]
  
  -- Análise
  roi_estimado NUMERIC(12, 2), -- ROI esperado com essa configuração
  economia_esperada NUMERIC(12, 2), -- Redução de perdas
  
  -- Configuração
  posicao_mapa JSONB, -- Mapa visual da prateleira com posições
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ANÁLISE DE PERDA POR CATEGORIA
-- ============================================
CREATE TABLE analise_perda_categoria (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL,
  categoria TEXT NOT NULL,
  
  -- Data
  data_analise DATE,
  ano INT,
  mes INT,
  dia_semana INT,
  hora INT,
  
  -- Perda
  quantidade_perdida NUMERIC(10, 2),
  valor_perdido NUMERIC(12, 2),
  causa_perda TEXT[], -- ['vencimento', 'dano', 'abandono', 'roubo', 'deterioracao']
  
  -- Métrica
  taxa_perda_percentual NUMERIC(5, 2), -- % de perda do total em estoque
  
  -- Previsão de perda
  perda_prevenivel_valor NUMERIC(12, 2), -- O que poderia ter sido vendido
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_perda_categoria_data ON analise_perda_categoria(loja_id, categoria, data_analise);

-- ============================================
-- 7. MATRIZ DE VENDAS POR POSIÇÃO NA GONDOLA
-- ============================================
CREATE TABLE matriz_posicao_vendas (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL,
  gondola_id TEXT,
  categoria TEXT,
  
  -- Posição
  posicao TEXT, -- 'olho_esquerda', 'olho_centro', 'olho_direita',
                -- 'mao_esquerda', 'mao_centro', 'mao_direita',
                -- 'pe_esquerda', 'pe_centro', 'pe_direita',
                -- 'topo', 'final'
  
  -- Análise por período
  periodo_tempo TEXT, -- 'matinal', 'horario_pico', 'tarde', 'noturno'
  dia_semana TEXT,
  
  -- Vendas
  quantidade_media_vendida NUMERIC(10, 2),
  valor_medio_vendido NUMERIC(12, 2),
  taxa_conversao_percentual NUMERIC(5, 2), -- % que pegam vs total que passam
  
  -- Posição "hot spot" ou "dead zone"
  tipo_posicao TEXT, -- 'hot_spot' (vende bem), 'normal', 'dead_zone' (vende mal)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. RECOMENDAÇÃO DE POSIÇÃO (IA)
-- ============================================
CREATE TABLE recomendacao_posicao (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  
  -- Produto
  nome_produto TEXT,
  categoria TEXT,
  margem_lucro NUMERIC(5, 2),
  velocidade_venda_media NUMERIC(10, 2),
  
  -- Recomendação
  posicao_ideal TEXT, -- 'olho_centro' é melhor? ou 'mao_direita'?
  motivo_recomendacao TEXT, -- "Produtos com margem alta devem estar a nível dos olhos"
  roi_posicao_ideal NUMERIC(12, 2),
  roi_posicao_atual NUMERIC(12, 2),
  potencial_melhoria_percentual INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. CONFIGURAÇÃO DE PRATELEIRA (Mapa físico)
-- ============================================
CREATE TABLE configuracao_gondola (
  id SERIAL PRIMARY KEY,
  
  loja_id TEXT NOT NULL,
  gondola_id TEXT NOT NULL,
  
  -- Física da prateleira
  altura_total_cm INT,
  largura_total_cm INT,
  profundidade_cm INT,
  numero_linhas INT,
  numero_colunas INT,
  
  -- Características
  localizacao_loja TEXT, -- 'entrada', 'corredor_central', 'fundo', 'caixa'
  tipo_gondola TEXT, -- 'dupla_face', 'simples', 'ilha'
  iluminacao BOOLEAN DEFAULT TRUE,
  temperatura_controlada BOOLEAN DEFAULT FALSE,
  
  -- Configuração atual
  config_atual JSONB, -- Qual SKU em qual posição hoje
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Fluxo de Dados Detalhado

### 3.1 Pesagem na Balança

```python
# Quando operador pesa produto na balança
{
  "evento": "pesagem",
  "timestamp": "2026-03-20T08:15:30Z",
  "balanca_id": "balanca_1",
  "loja_id": "loja-001",
  "sku": "7891000012345",
  "nome_produto": "Tomate Caqui 500g",
  "categoria": "FLV",
  "peso_kg": 0.520,
  "preco_unitario": 7.50,
  "preco_total": 3.90,
  "data_vencimento": "2026-03-22",
  "dados_clima": {
    "temperatura_balanca": 12,
    "umidade": 85
  }
}
# → Cria registro em item_transacao com status: ETIQUETADO
```

### 3.2 Reposição na Prateleira

```python
# Quando repositor escaneia código e repõe
{
  "evento": "reposicao",
  "timestamp": "2026-03-20T08:45:00Z",
  "codigo_etiqueta": "EM1234567890",
  "gondola_id": "gondola_5",
  "posicao": "olho_centro",
  "linha": 2,
  "coluna": 3,
  "repositor_id": "user_145",
  "quantidade_reposicao": 15
}
# → Atualiza item_transacao com status: NA_PRATELEIRA
# → Registra localização exata
```

### 3.3 Cliente Pega Produto

```python
# Detectado por câmera ou scan manual
{
  "evento": "pego_cliente",
  "timestamp": "2026-03-20T10:20:00Z",
  "sku": "7891000012345",
  "gondola_id": "gondola_5",
  "cliente_id": "cli_anonimizado_xyz"
}
# → Atualiza item_transacao com status: NO_CARRINHO
# → Registra tempo na prateleira: 95 minutos
```

### 3.4 Pagamento no Caixa

```python
# Quando escaneia no caixa
{
  "evento": "pagamento",
  "timestamp": "2026-03-20T10:35:00Z",
  "transacao_id": "txn_20260320_1005",
  "caixa_id": "caixa_1",
  "codigo_etiqueta": "EM1234567890",
  "valor_pago": 3.90,
  "metodo": "debito"
}
# → Atualiza item_transacao com status: VENDIDO
# → Calcula tempo total do item (pesagem → pagamento)
```

### 3.5 Abandono (Cliente Deixa na Prateleira)

```python
# Se produto não foi vendido até vencimento ou limpeza
{
  "evento": "abandono_detectado",
  "timestamp": "2026-03-22T16:00:00Z",
  "sku": "7891000012345",
  "gondola_id": "gondola_5",
  "tempo_na_prateleira_horas": 32,
  "motivo_potencial": "vencimento_proximo", # ou "posicao_ruim", "cliente_mudou_ideia"
  "posicao_abandoned": "olho_centro"
}
# → Atualiza item_transacao com status: ABANDONADO
# → Registra como perda
```

---

## 4. Análises Geradas Automaticamente

### 4.1 Taxa de Abandono por Hora/Dia

```sql
SELECT 
  EXTRACT(HOUR FROM data_hora_reposicao)::INT as hora,
  EXTRACT(DOW FROM data_hora_reposicao)::INT as dia_semana,
  categoria,
  COUNT(*) as total_etiquetado,
  COUNT(CASE WHEN status = 'VENDIDO' THEN 1 END) as vendido,
  COUNT(CASE WHEN status = 'ABANDONADO' THEN 1 END) as abandonado,
  ROUND(100.0 * COUNT(CASE WHEN status = 'ABANDONADO' THEN 1 END) / 
        COUNT(*), 2) as taxa_abandono
FROM item_transacao
WHERE loja_id = 'loja-001'
  AND data_hora_reposicao >= NOW() - INTERVAL '30 days'
GROUP BY hora, dia_semana, categoria
ORDER BY taxa_abandono DESC;
```

**Resultado:**
```
hora | dia_semana | categoria | total | vendido | abandonado | taxa_abandono
─────┼────────────┼───────────┼───────┼─────────┼────────────┼──────────────
 8   | 1 (seg)    | FLV       | 45    | 40      | 5          | 11.1%
 12  | 1 (seg)    | FLV       | 60    | 48      | 12         | 20.0%  ← PICO
 18  | 6 (sab)    | Frios     | 80    | 75      | 5          | 6.3%
 ...
```

### 4.2 Posição Ideal por Produto

```
PRODUTO: Sorvete Kibon
├─ Posição Atual: "pé_direita" → Vende 8 un/dia
├─ Posição Ideal: "olho_centro" → Venderia 18 un/dia (+125%)
├─ ROI Atual: R$156/dia
├─ ROI Potencial: R$351/dia
└─ Ganho Potencial: R$195/dia = R$5.850/mês

RECOMENDAÇÃO: Mover para olho_centro HOJE
Motivo: Margem 40%, velocidade alta, clima quente previsto
```

### 4.3 Composição Ideal da Prateleira por Dia

```
┌─ SEGUNDA-FEIRA ─────────────────────┐
│                                     │
│  [OLHO_CENTRO]  Iogurte (perda↑)   │  ← Segunda perde 15% iogurte
│  [OLHO_DIREITA] Leite Integral     │     → Aumentar posição prime
│  [MAO_ESQUERDA] Queijo              │
│  [PE_ESQUERDA]  Butter (vence 3d)  │
│                                     │
│  ROI Estimado: R$4.250              │
│  Perda Estimada: R$185              │
│                                     │
└─────────────────────────────────────┘

┌─ SÁBADO ────────────────────────────┐
│                                     │
│  [OLHO_CENTRO]  CERVEJA (pico!)    │  ← Sábado vende 3x cerveja
│  [OLHO_DIREITA] Vinho/Bebidas      │
│  [MAO_ESQUERDA] Sorvete             │  ← Calor previsto +30%
│  [MAO_DIREITA]  Carnes Frias       │
│  [PE_CENTRO]    Água (consumo↑)     │
│                                     │
│  ROI Estimado: R$9.850              │
│  Perda Estimada: R$95 (↓50%)        │
│                                     │
└─────────────────────────────────────┘
```

---

## 5. Motor de Recomendação de Gondola (IA)

### Algoritmo: Score de Ocupação

```python
def calcular_score_recomendacao(sku, posicao, dia_semana, clima_previsto):
    """
    Calcula score 0-100 para produto em posição específica
    """
    
    # 1. Margem de lucro (40 pontos)
    margem_score = (margem_lucro / 100) * 40  # 0-40 pontos
    
    # 2. Velocidade histórica (30 pontos)
    velocidade_score = min(velocidade_venda_media, 20) / 20 * 30  # 0-30 pontos
    
    # 3. Taxa de conversão POR POSIÇÃO (20 pontos)
    # Dados históricos: qual % que pega nessa posição?
    conversao_posicao = taxa_conversao_por_posicao[posicao]  # 45%, 62%, 38%...
    posicao_score = conversao_posicao / 100 * 20  # 0-20 pontos
    
    # 4. Contexto (clima, eventos, dia) (10 pontos)
    contexto_score = 0
    if clima_previsto == "chuva" and categoria == "Bebidas Quentes":
        contexto_score += 10
    elif clima_previsto == "calor" and categoria == "Sorvete":
        contexto_score += 10
    elif eh_vespera_feriado and categoria == "Carnes":
        contexto_score += 8
    elif dia_semana == 6 and margem > 30:  # Sábado, margem alta
        contexto_score += 7
    
    # TOTAL
    score_final = margem_score + velocidade_score + posicao_score + contexto_score
    
    return score_final  # 0-100

# Exemplo:
produtos_classificados = sorted([
    ("Sorvete", "olho_centro", 92),      ← TOP 1 para sábado quente
    ("Cerveja", "olho_direita", 88),     ← TOP 2
    ("Carnes", "mao_esquerda", 85),
    ("Queijo", "mao_direita", 78),
    ("Manteiga", "pe_esquerda", 62),     ← Posição ruim
], key=lambda x: x[2], reverse=True)
```

---

## 6. Alertas Inteligentes

```
🚨 ALERT: Iogurte abandonado em quantidade anormal
   ├─ Taxa normal de abandono: 8%
   ├─ Taxa atual: 22%
   ├─ Causa detectada: Vence em 2 dias (posição "pé" = invisível)
   ├─ ROI da ação: +R$450/semana
   └─ Recomendação: Mover para "olho_centro" HOJE + Desconto 15%

🚨 ALERT: Posição "olho_centro" subutilizada
   ├─ Produto lá agora: Iogurte (vende 5 un/dia)
   ├─ Melhor candidato: Cerveja (venderia 15 un/dia nessa posição)
   ├─ Ganho potencial: +R$240/dia = R$7.200/mês
   └─ Recomendação: Swap de posições HOJE

📊 INSIGHT: Padrão detectado
   ├─ Segunda-feira: Perda de iogurte sobe 50%
   ├─ Causa: Reposição às 8am, cliente checa validade às 10am
   ├─ Solução: Repor às 10am em vez de 8am
   └─ Economia potencial: -R$280/mês
```

---

## 7. Dashboard do Gerente - Visão de Prateleira

```
╔════════════════════════════════════════════════════════╗
║        INTELIGÊNCIA DE PRATELEIRA - HOJE (QUARTA)     ║
╚════════════════════════════════════════════════════════╝

GONDOLA 5 (Bebidas - Entrada)

     Posição Ideal        Produto Atual        Score    Ação
┌────────────────────────────────────────────────────────┐
│ OLHO_CENTRO    →  Cerveja Brahma     85/100   ✅ OK   │
│ OLHO_DIREITA   →  Água Mineral       72/100   ⚠️ LOW  │
│ OLHO_ESQUERDA  →  Vinho Tinto        68/100   ⚠️ LOW  │
│                                                        │
│ MAO_ESQUERDA   →  Refrigerante       81/100   ✅ OK   │
│ MAO_CENTRO     →  Suco Natural       65/100   ⚠️ LOW  │
│ MAO_DIREITA    →  Bebida Energética  74/100   ⚠️ OK   │
│                                                        │
│ PE_ESQUERDA    →  Água Com Gás       45/100   ❌ BAD  │
│ PE_CENTRO      →  Chá Gelado         52/100   ❌ BAD  │
│ PE_DIREITA     →  Café Gelado        38/100   ❌ RUIM │
└────────────────────────────────────────────────────────┘

📊 KPIs DA PRATELEIRA
├─ Score Geral: 66/100
├─ Faturamento Hoje: R$1.240
├─ Potencial com reposição ideal: R$1.980 (+60%)
├─ Perda Estimada: R$145
└─ Taxa Abandono: 11%

🎯 TOP 3 AÇÕES PARA HOJE
1. Mover "Café Gelado" para "olho_direita"   | ROI: +R$280
2. Aumentar estoque de "Cerveja" 30%         | ROI: +R$320
3. Aplicar desconto 20% em "Água Com Gás"   | ROI: +R$95

HORÁRIOS CRÍTICOS HOJE
├─ 11:00-12:30: PICO de Bebidas (prepare +50%)
├─ 14:00-15:00: Vale (posicione promos)
└─ 18:00-20:00: Pico noturno (cerveja +80%)
```

---

## 8. Previsão de Organização Automática

```python
def gerar_recomendacao_gondola_para_data(loja_id, gondola_id, data_alvo):
    """
    Recomenda organização PERFEITA da prateleira para uma data específica
    """
    
    # Busca dados históricos
    historico_vendas = query_db(f"""
        SELECT categoria, sku, quantidade_vendida, hora, dia_semana
        FROM item_transacao
        WHERE loja_id = '{loja_id}'
        AND gondola_id = '{gondola_id}'
        AND EXTRACT(DOW FROM data_hora_pagamento) = EXTRACT(DOW FROM '{data_alvo}'::date)
        AND data_hora_pagamento > NOW() - INTERVAL '90 days'
    """)
    
    # Busca previsão de clima
    clima = fetch_open_meteo(loja_lat, loja_lon, data_alvo)
    
    # Busca eventos (feriado, jogo, festividade)
    eventos = query_db(f"""
        SELECT impacto_percentual, categorias_afetadas
        FROM calendario_eventos
        WHERE data_inicio = '{data_alvo}'
    """)
    
    # Pondera scores
    produtos_scores = []
    for produto in get_produtos_categoria(gondola_id):
        score = calcular_score(
            produto,
            dia_semana=data_alvo.weekday(),
            clima=clima,
            eventos=eventos,
            historico=historico_vendas
        )
        produtos_scores.append((produto, score))
    
    # Ordena por score
    produtos_ranked = sorted(produtos_scores, key=lambda x: x[1], reverse=True)
    
    # Aloca às melhores posições
    posicoes_hot_spot = ['olho_centro', 'olho_direita', 'mao_esquerda', 'mao_centro', ...]
    
    recomendacao = {}
    for idx, (produto, score) in enumerate(produtos_ranked):
        recomendacao[posicoes_hot_spot[idx]] = {
            'sku': produto['sku'],
            'nome': produto['nome'],
            'score': score,
            'quantidade_sugerida': calcular_quantidade_ideal(produto, data_alvo),
            'roi_esperado': calcular_roi(produto)
        }
    
    return recomendacao

# Saída:
"""
RECOMENDAÇÃO PARA SÁBADO 22/03/2026

OLHO_CENTRO → Cerveja Brahma (Score: 94)
├─ Quantidade: 25 unidades
├─ ROI Esperado: R$580/dia
└─ Motivo: Sábado + calor + 28°C previsto

OLHO_DIREITA → Sorvete Kibon (Score: 92)
├─ Quantidade: 18 unidades
├─ ROI Esperado: R$540/dia
└─ Motivo: Calor + margem 40% + histórico de venda

MAO_ESQUERDA → Carnes Frias (Score: 88)
├─ Quantidade: 35 unidades
├─ ROI Esperado: R$620/dia
└─ Motivo: Sábado é auge de carnes (compra semanal)

...

TOTAL ROI ESPERADO: R$2.850/dia
Comparado ao aleatório: +45%
"""
```

---

## 9. Checklist de Implementação

- [ ] Schema expandido (10 novas tabelas)
- [ ] Endpoints de rastreamento (pesagem, reposição, pagamento, abandono)
- [ ] Motor de análise de abandono
- [ ] Cálculo de scores de posição
- [ ] Motor de recomendação de gondola (IA)
- [ ] Dashboard de prateleira (frontend)
- [ ] Alertas automáticos (WhatsApp/Email)
- [ ] Previsão de organização por dia
- [ ] Integração com câmeras/sensores (opcional, fase 2)
- [ ] Matriz de posições por loja
- [ ] Relatório de ROI por gondola

---

**Resultado Final:** Supermercado que **muda prateleira automaticamente** baseado em:
- Vendas históricas
- Clima previsto
- Eventos locais
- Margens de lucro
- Padrões de abandono

**Economia Esperada:** +30-50% em vendas de bebidas e perecíveis | -40-60% em perdas
