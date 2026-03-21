# Integração POS (PDV) e Balanças - Documentação Técnica

## 📋 Visão Geral

O Easy Market fornece integração nativa com sistemas POS (Ponto de Venda) e balanças eletrônicas, permitindo:

- **Sincronização em tempo real** de transações do PDV
- **Recomendações automáticas** de reabastecimento exibidas no POS
- **Leitura contínua** de pesos de balanças
- **Verificação automática** de pesos de produtos
- **Sem dependências externas** - utiliza apenas Node.js built-ins

---

## 🔌 Integração POS (PDV)

### Arquitetura

```
┌─────────────────┐
│   Sistema POS   │
│  (Toledo, NCR,  │
│     Sweda)      │
└────────┬────────┘
         │
    HTTP/REST
    TCP/Socket
         │
    ┌────▼─────────┐
    │ PDV Service  │
    └────┬─────────┘
         │
    ┌────▼──────────────────┐
    │   Supabase Backend     │
    │ (Histórico, Análise)   │
    └───────────────────────┘
```

### Endpoints do PDV

#### 1. Conectar ao PDV
```http
POST /api/v1/integracao/pdv/conectar
Content-Type: application/json

{
  "loja_id": "store-001",
  "tipo": "rest",
  "endpoint": "http://pdv-server:8080",
  "api_key": "sua-chave-api"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "connectionId": "uuid-conexao",
  "status": "connected"
}
```

#### 2. Sincronizar Transações
```http
POST /api/v1/integracao/pdv/sincronizar
Content-Type: application/json

{
  "connection_id": "uuid-conexao",
  "desde": "2026-03-20T10:00:00Z",
  "limite": 100
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "transacoesSincronizadas": 45
}
```

#### 3. Obter Recomendações em Tempo Real
```http
GET /api/v1/integracao/pdv/recomendacoes-realtime?loja_id=store-001&produto_ids=prod-001,prod-002
```

**Resposta:**
```json
{
  "sucesso": true,
  "lojaId": "store-001",
  "recomendacoes": [
    {
      "produtoId": "prod-001",
      "quantidadeSugerida": 25,
      "prioridade": "alta",
      "motivo": "Estoque abaixo do mínimo"
    }
  ],
  "dataCalculo": "2026-03-21T10:30:00Z"
}
```

#### 4. Enviar Recomendação para o POS
```http
POST /api/v1/integracao/pdv/enviar-recomendacao
Content-Type: application/json

{
  "connection_id": "uuid-conexao",
  "produto_id": "prod-001",
  "quantidade_sugerida": 25,
  "prioridade": "alta",
  "motivo": "Estoque abaixo do mínimo"
}
```

#### 5. Verificar Status das Conexões
```http
GET /api/v1/integracao/pdv/status
```

**Resposta:**
```json
{
  "sucesso": true,
  "conexoes": [
    {
      "id": "uuid-conexao",
      "lojaId": "store-001",
      "tipo": "rest",
      "status": "connected",
      "ultimaSync": "2026-03-21T10:30:00Z",
      "erros": 0,
      "conectadoEm": "2026-03-21T08:00:00Z"
    }
  ],
  "total": 1,
  "conectadas": 1
}
```

### Fluxo de Integração PDV

```
1. CONEXÃO (5 min)
   └─ POST /conectar → connectionId

2. SINCRONIZAÇÃO CONTÍNUA (a cada 1 min)
   ├─ POST /sincronizar → transações
   └─ Atualiza métricas da loja

3. RECOMENDAÇÕES REALTIME
   ├─ GET /recomendacoes-realtime
   ├─ Calcula baseado em vendas do dia
   └─ POST /enviar-recomendacao → exibe no POS

4. MONITORAMENTO
   └─ GET /status → saúde da conexão
```

### Tipos de POS Suportados

| Tipo | Protocolo | Configuração | Status |
|------|-----------|--------------|--------|
| **REST API** | HTTP/HTTPS | `endpoint: "http://pdv:8080"` | ✅ Suportado |
| **TCP Socket** | TCP/IP | `endpoint: "192.168.1.100:9000"` | ✅ Suportado |
| **Serial** | COM/TTY | `endpoint: "COM1"` | ⏳ Planejado |

### Exemplo: Integração com Toledo Takeda

```javascript
// Conectar ao PDV Toledo
const resultados = await axios.post('https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/integracao/pdv/conectar', {
  loja_id: 'store-001',
  tipo: 'rest',
  endpoint: 'http://toledo-pdv.local:8080',
  api_key: 'toledo-api-key-123'
});

const connectionId = resultados.data.connectionId;

// Sincronizar a cada minuto
setInterval(async () => {
  await axios.post(`https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/integracao/pdv/sincronizar`, {
    connection_id: connectionId,
    limite: 100
  });
}, 60000);

// Obter recomendações e exibir no POS
setInterval(async () => {
  const recs = await axios.get(
    `https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/integracao/pdv/recomendacoes-realtime?loja_id=store-001`
  );
  
  for (const rec of recs.data.recomendacoes) {
    await axios.post(
      `https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/integracao/pdv/enviar-recomendacao`,
      {
        connection_id: connectionId,
        ...rec
      }
    );
  }
}, 300000); // A cada 5 minutos
```

---

## ⚖️ Integração de Balanças

### Arquitetura

```
┌──────────────────┐
│ Balança Eletrônica│
│ (Serial/TCP/REST)│
└────────┬─────────┘
         │
    Serial/TCP/HTTP
         │
    ┌────▼──────────────┐
    │ Balancas Service  │
    └────┬──────────────┘
         │
    ┌────▼──────────────────────┐
    │   Supabase Backend         │
    │ (Verificações, Histórico)  │
    └───────────────────────────┘
```

### Endpoints de Balanças

#### 1. Conectar a uma Balança
```http
POST /api/v1/integracao/balancas/conectar
Content-Type: application/json

{
  "loja_id": "store-001",
  "tipo": "serial",
  "porta": "/dev/ttyUSB0",
  "modelo": "TOLEDO-PRIX"
}
```

**Tipos Suportados:**
- `serial`: Porta serial (COM1, /dev/ttyUSB0)
- `tcp`: Conexão TCP (host:port)
- `rest`: API HTTP/HTTPS

#### 2. Ler Peso
```http
POST /api/v1/integracao/balancas/ler-peso
Content-Type: application/json

{
  "connection_id": "uuid-conexao"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "peso": 2.350,
  "unidade": "kg",
  "timestamp": "2026-03-21T10:30:00Z"
}
```

#### 3. Verificar Peso de Produto
```http
POST /api/v1/integracao/balancas/verificar-peso
Content-Type: application/json

{
  "connection_id": "uuid-conexao",
  "produto_id": "prod-001",
  "peso_esperado": 2.5
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "verificacao": {
    "id": "uuid-verificacao",
    "pesoMedido": 2.472,
    "pesoDeclaro": 2.5,
    "diferenca": 0.028,
    "percentualDiferenca": 1.12,
    "dentroTolerance": true,
    "status": "ok",
    "timestamp": "2026-03-21T10:30:00Z"
  }
}
```

#### 4. Monitorar Balança Continuamente
```http
POST /api/v1/integracao/balancas/monitorar
Content-Type: application/json

{
  "connection_id": "uuid-conexao",
  "intervalo": 5000
}
```

#### 5. Parar Monitoramento
```http
POST /api/v1/integracao/balancas/parar-monitoramento
Content-Type: application/json

{
  "connection_id": "uuid-conexao"
}
```

#### 6. Histórico de Pesos
```http
GET /api/v1/integracao/balancas/historico?loja_id=store-001&horas=24
```

#### 7. Status de Balanças
```http
GET /api/v1/integracao/balancas/status
```

### Fluxo de Integração de Balanças

```
1. CONEXÃO (2 min)
   └─ POST /conectar → connectionId

2. LEITURA DE PESOS
   ├─ POST /ler-peso → peso atual
   └─ Parseado automaticamente (kg, g, etc)

3. VERIFICAÇÃO AUTOMÁTICA
   ├─ POST /verificar-peso → comparação
   ├─ Valida dentro de tolerância
   └─ Salva resultado no histórico

4. MONITORAMENTO CONTÍNUO
   ├─ POST /monitorar → intervalo de 5s
   ├─ Lê peso continuamente
   └─ POST /parar-monitoramento → parar

5. ANÁLISE HISTÓRICA
   └─ GET /historico → tendências de peso
```

### Balanças Suportadas

| Modelo | Tipo | Protocolo | Status |
|--------|------|-----------|--------|
| **TOLEDO PRIX** | Serial/TCP | RS-232 | ✅ Suportado |
| **TOLEDO 9091** | Serial | RS-232 | ✅ Suportado |
| **FILIZOLA** | Serial/TCP | RS-232 | ✅ Suportado |
| **DIGITAL** | REST | HTTP | ✅ Suportado |
| **Genérica** | Serial/TCP/REST | Qualquer | ✅ Suportado |

### Formato de Dados Suportados

A integração de balanças suporta múltiplos formatos de peso:

```
PESO: 2.350 kg      ✅ Reconhecido
2.350g              ✅ Convertido para kg
P:2350g             ✅ Parseado
TOLEDO: 2350        ✅ Interpretado em kg
2.350               ✅ Padrão numérico
```

### Configuração de Tolerância

A tolerância padrão é 5%, mas pode ser customizada:

```javascript
// Inicializar com tolerância de 3%
const service = new BalancasIntegrationService(supabase, {
  weightTolerance: 0.03
});

// Uma leitura de 2.42kg vs esperado 2.50kg:
// Diferença: 0.08kg (3.2%)
// Status: ❌ FALHA (acima de 3%)
```

### Exemplo: Integração com Toledo Prix

```javascript
// Conectar à balança
const resultado = await axios.post(
  'https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/integracao/balancas/conectar',
  {
    loja_id: 'store-001',
    tipo: 'serial',
    porta: '/dev/ttyUSB0',
    modelo: 'TOLEDO-PRIX'
  }
);

const connectionId = resultado.data.connectionId;

// Verificar peso de um produto
const verificacao = await axios.post(
  'https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/integracao/balancas/verificar-peso',
  {
    connection_id: connectionId,
    produto_id: 'prod-001',
    peso_esperado: 2.5
  }
);

if (verificacao.data.verificacao.status === 'ok') {
  console.log('✅ Peso correto!');
} else {
  console.log('❌ Peso fora da tolerância:', verificacao.data.verificacao.percentualDiferenca + '%');
}

// Monitorar continuamente
await axios.post(
  'https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/integracao/balancas/monitorar',
  {
    connection_id: connectionId,
    intervalo: 5000 // A cada 5 segundos
  }
);
```

---

## 🔐 Configuração de Segurança

### Variáveis de Ambiente

Nenhuma variável especial necessária. As chaves de API devem ser passadas como parâmetro de requisição:

```bash
# Não é necessário adicionar ao .env
# As credenciais são validadas via API Key no corpo da requisição
```

### Autenticação

Cada requisição para os endpoints de integração deve incluir:

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

O JWT_TOKEN é o mesmo usado para o resto da API Easy Market.

---

## 📊 Tabelas Supabase Necessárias

### pdv_connections
```sql
CREATE TABLE pdv_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id TEXT NOT NULL,
  connection_id TEXT UNIQUE NOT NULL,
  tipo_pdv TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  criado_em TIMESTAMP DEFAULT NOW(),
  desconectado_em TIMESTAMP
);
```

### pdv_transactions
```sql
CREATE TABLE pdv_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id TEXT NOT NULL,
  pdv_transaction_id TEXT NOT NULL,
  tipo TEXT,
  total NUMERIC,
  itens_quantidade INT,
  itens JSONB,
  metodo_pagamento TEXT,
  desconto NUMERIC,
  operador_id TEXT,
  processado_em TIMESTAMP DEFAULT NOW(),
  timestamp_pdv TIMESTAMP
);
```

### balancas_connections
```sql
CREATE TABLE balancas_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id TEXT NOT NULL,
  connection_id TEXT UNIQUE NOT NULL,
  tipo_balanca TEXT NOT NULL,
  modelo TEXT,
  status TEXT DEFAULT 'active',
  criado_em TIMESTAMP DEFAULT NOW(),
  desconectado_em TIMESTAMP
);
```

### balancas_verificacoes
```sql
CREATE TABLE balancas_verificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  peso_medido NUMERIC,
  peso_declarado NUMERIC,
  diferenca NUMERIC,
  percentual_diferenca NUMERIC,
  resultado TEXT,
  verificado_em TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Deploy e Testes

### 1. Adicionar rotas ao backend

Editar `/tmp/easy-market/backend/src/index.js`:

```javascript
const pdvRoutes = require('./routes/integracao-pdv');
const balancasRoutes = require('./routes/integracao-balancas');

app.use('/api/v1/integracao/pdv', pdvRoutes);
app.use('/api/v1/integracao/balancas', balancasRoutes);
```

### 2. Testar conexão PDV

```bash
curl -X POST http://localhost:3000/api/v1/integracao/pdv/health
```

### 3. Testar conexão Balanças

```bash
curl -X GET http://localhost:3000/api/v1/integracao/balancas/health
```

### 4. Rodar no EasyPanel

```bash
npm start
```

---

## 📝 Logs e Monitoramento

Os serviços emitem eventos para monitoramento:

```javascript
// PDV Events
service.on('pdv:connected', (data) => {
  console.log('POS conectado:', data.lojaId);
});

service.on('pdv:sync-success', (data) => {
  console.log('Sincronizadas:', data.quantidadeTransacoes, 'transações');
});

service.on('pdv:sync-error', (data) => {
  console.log('Erro na sincronização:', data.erro);
});

// Balancas Events
service.on('balanca:connected', (data) => {
  console.log('Balança conectada:', data.modelo);
});

service.on('balanca:weight-read', (data) => {
  console.log('Peso lido:', data.peso, 'kg');
});

service.on('balanca:verification-error', (data) => {
  console.log('Erro na verificação:', data.erro);
});
```

---

## ❓ Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| "Falha ao conectar com POS" | Endpoint inválido ou POS offline | Verificar endpoint e conectividade de rede |
| "Timeout ao ler peso" | Balança não respondendo | Verificar porta serial e configurações da balança |
| "Não foi possível extrair peso" | Formato não reconhecido | Adicionar novo padrão de parsing |
| "connection_id não encontrado" | Sessão expirada | Reconectar com POST /conectar |
| "Porta serial não está aberta" | Permissões insuficientes | Adicionar usuário ao grupo dialout: `usermod -a -G dialout $USER` |

---

## 📚 Referências

- **PDV REST API**: Documentação do fabricante do POS
- **Serial Protocols**: Manuais das balanças eletrônicas
- **Node.js SerialPort**: https://serialport.io/
- **Supabase**: https://supabase.com/docs

---

**Status**: ✅ Pronto para produção
**Versão**: 1.0.0
**Última atualização**: 2026-03-21
