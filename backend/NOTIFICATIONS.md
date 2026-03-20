# Easy Market - Sistema de Notificações (Phase 4)

**Status**: 🟡 Em Desenvolvimento (70% completo)
**Último Update**: 2026-03-20
**Componentes**: Backend (✅), Frontend (✅), SMS/WhatsApp (✅), Email (⏳)

## 📋 Visão Geral

Sistema inteligente de notificações com roteamento automático baseado em **setores** (categorias de produtos). Cada contato recebe alertas apenas dos setores pelos quais é responsável.

## 🎯 Funcionalidades Implementadas

### 1. **Backend - Routes de Notificações** ✅

#### POST `/notificacoes` - Enviar Notificação
Cria uma notificação e a distribui aos contatos relevantes com base no setor.

**Request**:
```json
{
  "tipo": "alerta_critico",
  "titulo": "Estoque Crítico",
  "mensagem": "Produto XYZ com estoque baixo",
  "loja_id": "uuid",
  "setor": "Bebidas",  // Importante: para roteamento
  "canais": ["whatsapp", "sms", "push"],
  "urgencia": "alta"
}
```

**Response**:
```json
{
  "notificacao_id": "uuid",
  "resultados": {
    "total_contatos": 3,
    "whatsapp_enviadas": 2,
    "sms_enviadas": 1,
    "email_enviadas": 0,
    "erros": []
  }
}
```

**Fluxo**:
1. Valida schema
2. Busca contatos ativos do setor especificado
3. Filtra por urgência (se alta, apenas quem recebe críticos)
4. Para cada contato, envia em seus canais preferidos
5. Loga cada envio com referência externa (Twilio SID)
6. Retorna estatísticas de envio

---

#### GET `/notificacoes/:loja_id` - Listar Notificações
Lista histórico de notificações com filtros.

**Query Parameters**:
- `limite`: Número de resultados (default: 50)
- `offset`: Paginação
- `tipo`: Filtrar por tipo
- `status`: Filtrar por status (criada, enviada, lida)

**Response**:
```json
{
  "notificacoes": [
    {
      "id": "uuid",
      "tipo": "alerta_critico",
      "titulo": "...",
      "mensagem": "...",
      "urgencia": "alta",
      "status": "enviada",
      "data_criacao": "2026-03-20T...",
      "data_leitura": null
    }
  ],
  "total": 15
}
```

---

#### PUT `/notificacoes/:id/marcar-lida` - Marcar como Lida
Atualiza status de notificação para "lida".

---

### 2. **Backend - Routes de Contatos** ✅

#### POST `/notificacao-contatos` - Criar Contato
Cria um novo contato com setores responsáveis.

**Request**:
```json
{
  "loja_id": "uuid",
  "nome": "João Silva",
  "cargo": "Gerente de Vendas",
  "setores": ["Bebidas", "Alimentos"],
  "telefone_whatsapp": "+55 11 99999-9999",
  "telefone_sms": "+55 11 99999-9999",
  "email": "joao@loja.com",
  "receber_alertas_criticos": true,
  "receber_alertas_whatsapp": true,
  "receber_alertas_sms": false,
  "receber_alertas_email": false,
  "receber_relatorios": true
}
```

**Validação**:
- ✅ Número WhatsApp validado com Twilio
- ✅ Pelo menos um canal obrigatório (WhatsApp, SMS ou Email)
- ✅ Setores validados contra lista permitida

---

#### GET `/notificacao-contatos/:loja_id` - Listar Contatos
Lista todos os contatos ativos da loja.

**Query Parameters**:
- `apenas_ativos`: Filtrar apenas ativos (default: true)

---

#### GET `/notificacao-contatos/:loja_id/setor/:setor` - Contatos do Setor
Busca contatos responsáveis por um setor específico.

**Response**:
```json
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "cargo": "Gerente",
    "setores": ["Bebidas", "Alimentos"],
    "telefone_whatsapp": "+55...",
    "receber_alertas_whatsapp": true,
    // ... outros campos
  }
]
```

---

#### POST `/notificacao-contatos/:id/teste` - Testar Envio
Envia uma mensagem de teste para validar configuração.

**Response**:
```json
{
  "contato": {
    "id": "uuid",
    "nome": "João Silva"
  },
  "resultados": {
    "whatsapp": {
      "status": "enviado",
      "sid": "SMxxxxxxxxxxxxxxx"
    },
    "sms": {
      "status": "erro",
      "erro": "Invalid number"
    }
  }
}
```

---

#### GET `/notificacao-contatos/:loja_id/para-notificar` - Busca Inteligente
Busca contatos para notificação com filtros automáticos.

**Query Parameters**:
- `setor`: Setor específico
- `tipo_alerta`: Tipo de alerta (ex: "critico")

**Resposta**: Lista de contatos qualificados

---

### 3. **Database - Schema** ✅

#### Tabela: `notificacao_contatos`
```sql
id UUID PRIMARY KEY
loja_id UUID REFERENCES lojas(id)
nome VARCHAR(255)
cargo VARCHAR(255)
setores TEXT[]  -- ['Bebidas', 'Alimentos', ...]
telefone_whatsapp VARCHAR(20)
telefone_sms VARCHAR(20)
email VARCHAR(255)
ativo BOOLEAN
receber_alertas_criticos BOOLEAN
receber_alertas_whatsapp BOOLEAN
receber_alertas_sms BOOLEAN
receber_alertas_email BOOLEAN
receber_relatorios BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### Tabela: `notificacoes`
```sql
id UUID PRIMARY KEY
tipo VARCHAR(50)  -- alerta_critico, vencimento, etc
titulo VARCHAR(255)
mensagem TEXT
loja_id UUID REFERENCES lojas(id)
urgencia VARCHAR(20)  -- alta, media, baixa
status VARCHAR(20)  -- criada, enviada, lida
data_criacao TIMESTAMP
data_leitura TIMESTAMP
dados_adicionais JSONB  -- { setor: 'Bebidas' }
```

#### Tabela: `notificacao_logs`
```sql
id UUID PRIMARY KEY
notificacao_id UUID REFERENCES notificacoes(id)
contato_id UUID REFERENCES notificacao_contatos(id)
canal VARCHAR(50)  -- whatsapp, sms, email, push
status VARCHAR(50)  -- enviado, pendente, erro
referencia_externa VARCHAR(255)  -- Twilio SID
erro_msg TEXT
data_envio TIMESTAMP
```

---

### 4. **Frontend - Hooks** ✅

#### `useNotifications()` Hook
Gerencia conexão SSE e envio de notificações.

**Funcionalidades**:
```typescript
const {
  sendNotification,    // Enviar notificação
  markAsRead,         // Marcar como lida
  connectSSE          // Conectar/reconectar
} = useNotifications();

// Enviar
await sendNotification({
  tipo: 'alerta_critico',
  titulo: 'Alerta',
  mensagem: '...',
  canais: ['whatsapp', 'push']
});

// Marcar como lida
await markAsRead(notificationId);
```

**Features**:
- ✅ Auto-reconexão em caso de desconexão
- ✅ Toast notifications automáticas
- ✅ SSE para push notifications em tempo real
- ✅ Fetch inicial de notificações recentes

---

### 5. **Frontend - Components** ✅

#### `NotificationsCenter` Component
Painel de notificações com bell icon.

**Features**:
- Bell icon com badge de contagem
- Dropdown panel com lista
- Mark as read + delete
- Link para página de alertas
- Auto-refresh a cada 30s

**Usage**:
```tsx
import NotificationsCenter from '@/components/NotificationsCenter';

// No Header:
<NotificationsCenter />
```

---

#### Página: `/notificacoes/contatos`
Gerenciamento completo de contatos de notificação.

**Features**:
- ✅ Criar novo contato
- ✅ Editar contato existente
- ✅ Deletar contato
- ✅ Selecionar setores responsáveis
- ✅ Configurar canais preferidos
- ✅ Testar envio
- ✅ Visualizar estatísticas

**UI**:
```
[+ Adicionar Contato]

Contatos Cadastrados (3)
├─ João Silva (Gerente)
│  Setores: [Bebidas] [Alimentos]
│  Contatos: 📱 WhatsApp | ✓ SMS | 📧 Email
│  [Testar] [Editar] [Deletar]
├─ Maria Santos...
└─ ...
```

---

## 🚀 Fluxo de Roteamento Inteligente

### Exemplo: Alerta de Estoque Baixo em Bebidas

```
1. Alerta criado
   POST /alertas
   {
     "produto": "Refrigerante",
     "categoria": "Bebidas"
   }

2. Sistema cria notificação
   POST /notificacoes
   {
     "tipo": "falta_estoque",
     "setor": "Bebidas",
     "urgencia": "alta"
   }

3. Backend busca contatos
   SELECT * FROM notificacao_contatos
   WHERE loja_id = 'xxx'
   AND 'Bebidas' = ANY(setores)
   AND receber_alertas_criticos = true
   AND ativo = true

   Resultado: [João Silva, Maria Santos]

4. Para cada contato:
   - João: WhatsApp + SMS ❌ Email
   - Maria: WhatsApp + Email ❌ SMS

5. Envia Twilio
   whatsapp:+55-11-99991111: ✅
   sms:+55-11-99992222: ✅
   whatsapp:+55-11-99993333: ✅
   email:maria@loja.com: ⏳ (pendente)

6. Log de todos os envios
   INSERT notificacao_logs (...)
```

---

## 📊 Estatísticas de Envio

Cada notificação retorna:
```json
{
  "notificacao_id": "uuid",
  "resultados": {
    "total_contatos": 3,        // Contatos do setor
    "whatsapp_enviadas": 2,     // Sucesso
    "sms_enviadas": 1,          // Sucesso
    "email_enviadas": 0,        // Não enviado
    "erros": [
      {
        "contato": "João Silva",
        "canal": "email",
        "erro": "Service not configured"
      }
    ]
  }
}
```

---

## 🔐 Segurança

- ✅ Número WhatsApp validado com Twilio lookups API
- ✅ Telefone SMS obrigatório ou WhatsApp
- ✅ Email opcional mas validado
- ✅ Logging completo de todos os envios
- ✅ Rastreabilidade com Twilio SID
- ✅ Erro handling granular por contato

---

## 🔮 Próximas Fases

### Phase 4.2: Email Integration
```bash
NEXT_PUBLIC_SENDGRID_API_KEY=sg_xxxxx
POST /notificacoes -> email via SendGrid
```

### Phase 4.3: Relatórios Automáticos
```sql
-- Agenda diária
0 6 * * * POST /relatorios/enviar-diario
0 9 * * 0 POST /relatorios/enviar-semanal
```

### Phase 5: Local Agent
```python
# Na loja
agent.send_alert(
  tipo="falta_estoque",
  setor="Bebidas",
  rotas_automaticamente=True  # Usa contatos do setor
)
```

---

## 📝 Ambiente

**Variáveis Obrigatórias**:
```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=+55xxxx
TWILIO_SMS_NUMBER=+55xxxx
```

**Variáveis Opcionais**:
```bash
SENDGRID_API_KEY=sg_xxxxx  # Para email
SENDGRID_FROM_EMAIL=noreply@loja.com
```

---

## 🎓 Decisões Arquiteturais

| Decisão | Justificativa |
|---------|---|
| Roteamento por SETOR | Cada gerente responsável por sua categoria |
| Múltiplos contatos | Diferentes pessoas, diferentes horários |
| Canais individuais | Gerente prefere SMS, proprietário WhatsApp |
| Twilio em vez de API nativa | Fallback global + suporte multi-país |
| SSE para push | Simples, confiável, sem WebSocket overhead |
| Logging granular | Auditoria + debugging de falhas |

---

## 📞 Exemplo Prático

Criar um Gerente de Bebidas que recebe WhatsApp:

```bash
curl -X POST http://localhost:3000/api/v1/notificacao-contatos \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João Silva",
    "cargo": "Gerente de Bebidas",
    "setores": ["Bebidas"],
    "telefone_whatsapp": "+5511999999999",
    "receber_alertas_whatsapp": true,
    "receber_alertas_criticos": true
  }'
```

Testar envio:

```bash
curl -X POST http://localhost:3000/api/v1/notificacao-contatos/{id}/teste
```

Enviar alerta para o setor:

```bash
curl -X POST http://localhost:3000/api/v1/notificacoes \
  -d '{
    "tipo": "alerta_critico",
    "titulo": "Estoque de Refrigerante Crítico",
    "mensagem": "Apenas 5 unidades restantes",
    "loja_id": "550e8400-e29b-41d4-a716-446655440000",
    "setor": "Bebidas",
    "canais": ["whatsapp"],
    "urgencia": "alta"
  }'
```

---

**Versão**: 1.0.0
**Última Atualização**: 2026-03-20
**Próximo Review**: 2026-04-15
