# Easy Market - Relatórios Agendados (Phase 4.3)

**Status**: ✅ Implementado
**Última Atualização**: 2026-03-20
**Componentes**: Backend (✅), Cron Jobs (✅), Email (✅), Seed Data (✅)

---

## 📋 O Que É?

Sistema automático que envia relatórios da loja por email em horários pré-configurados. Pode ser:
- **Diário**: Todo dia às 9:00 (exemplo)
- **Semanal**: Toda segunda-feira às 9:00
- **Mensal**: Dia 1º de cada mês às 9:00

Cada relatório inclui:
- 💰 Dados de vendas (faturamento, quantidade, transações)
- 📦 Status do estoque
- ⚠️ Alertas gerados
- 📈 Análise de impacto (crescimento, economia, perdas reduzidas)

---

## 🚀 Como Usar

### 1. Criar um Relatório Agendado

```bash
curl -X POST http://localhost:3000/api/v1/relatorios-agendados \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "550e8400-e29b-41d4-a716-446655440000",
    "tipo": "diario",
    "hora": "09:00",
    "dia_semana": null,
    "dia_mes": null,
    "destinatarios": ["gerente@loja.com", "dono@loja.com"],
    "incluir_analise_impacto": true
  }'
```

**Resposta**:
```json
{
  "relatorio_id": "uuid-aqui",
  "status": "agendado",
  "proximamente": "Próximo envio: 21/03/2026 às 09:00"
}
```

### 2. Listar Relatórios Agendados

```bash
curl http://localhost:3000/api/v1/relatorios-agendados/550e8400-e29b-41d4-a716-446655440000
```

**Resposta**:
```json
[
  {
    "id": "uuid",
    "loja_id": "uuid",
    "tipo": "diario",
    "hora": "09:00",
    "destinatarios": ["gerente@loja.com"],
    "incluir_analise_impacto": true,
    "ativo": true
  }
]
```

### 3. Testar Envio Imediato

```bash
curl -X POST http://localhost:3000/api/v1/relatorios-agendados/uuid-do-relatorio/enviar-agora
```

Envia o relatório imediatamente para testar se está funcionando.

### 4. Cancelar Agendamento

```bash
curl -X DELETE http://localhost:3000/api/v1/relatorios-agendados/uuid-do-relatorio
```

### 5. Ver Próximos Envios

```bash
curl http://localhost:3000/api/v1/relatorios-agendados/550e8400-e29b-41d4-a716-446655440000/proximos
```

**Resposta**:
```json
[
  {
    "tipo": "diario",
    "hora": "09:00",
    "proxima_data": "21/03/2026 às 09:00"
  }
]
```

---

## 📧 Como Configurar Email

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```bash
# Gmail (recomendado)
EMAIL_SERVICE=gmail
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app  # NOT sua senha regular!

# Ou outro serviço
EMAIL_SERVICE=outlook
EMAIL_USER=seu-email@outlook.com
EMAIL_PASS=sua-senha
```

### Obter Senha de App do Gmail

1. Ative autenticação de dois fatores na sua conta Google
2. Acesse https://myaccount.google.com/apppasswords
3. Selecione "Mail" e "Windows Computer"
4. Copie a senha gerada (16 caracteres)
5. Use como `EMAIL_PASS`

---

## 📊 Estrutura do Relatório

O email recebido mostra:

### 💰 Vendas
- Faturamento total do período
- Quantidade de unidades vendidas
- Total de transações
- Ticket médio (faturamento / transações)

### 📦 Estoque
- Total de produtos cadastrados
- Produtos em estoque crítico
- Percentual de saúde do estoque

### ⚠️ Alertas
- Total de alertas gerados
- Alertas que foram resolvidos
- ROI (Return on Investment) estimado

### 📈 Análise de Impacto (opcional)

Se `incluir_analise_impacto: true`:

- **Crescimento**: Comparação com período anterior
- **Aumento de Receita**: Diferença em reais
- **Redução de Perdas**: Economia estimada
- **Economia Total**: Soma de todas as economias

**Exemplo**:
```
Crescimento: +15%
Aumento de Receita: R$ 2.500,00
Redução de Perdas: R$ 450,00
Economia Estimada: R$ 950,00
```

---

## 📅 Tipos de Agendamento

### Diário
Envia todo dia à hora especificada.

```json
{
  "tipo": "diario",
  "hora": "09:00"
}
```

### Semanal
Envia em um dia da semana específico.

```json
{
  "tipo": "semanal",
  "hora": "09:00",
  "dia_semana": 1  // 0=domingo, 1=segunda, ..., 6=sábado
}
```

### Mensal
Envia no dia do mês especificado.

```json
{
  "tipo": "mensal",
  "hora": "09:00",
  "dia_mes": 15  // 1-31
}
```

---

## 🗄️ Banco de Dados

### Tabela: `relatorios_agendados`

Armazena as configurações de cada agendamento.

```sql
CREATE TABLE relatorios_agendados (
  id UUID PRIMARY KEY,
  loja_id UUID NOT NULL,
  tipo VARCHAR(20),           -- 'diario', 'semanal', 'mensal'
  hora VARCHAR(5),            -- HH:MM
  dia_semana INT,             -- 0-6 (só para semanal)
  dia_mes INT,                -- 1-31 (só para mensal)
  destinatarios TEXT[],       -- Array de emails
  incluir_analise_impacto BOOLEAN,
  ativo BOOLEAN,
  data_criacao TIMESTAMP,
  data_atualizacao TIMESTAMP
);
```

### Tabela: `relatorios_logs`

Registra cada envio para auditoria.

```sql
CREATE TABLE relatorios_logs (
  id UUID PRIMARY KEY,
  relatorio_agendado_id UUID,
  data_envio TIMESTAMP,
  status VARCHAR(20),    -- 'enviado', 'erro', 'pendente'
  mensagem_erro TEXT
);
```

---

## 🔄 Como Funciona

### 1. Agendamento Criado

```
POST /relatorios-agendados
  ↓
Valida dados
  ↓
Insere no banco
  ↓
Inicia Cron Job
  ↓
Ativo na memória
```

### 2. Hora do Envio Chega

```
Cron Job dispara
  ↓
Gera relatório (query no banco)
  ↓
Monta HTML com dados
  ↓
Envia por email para cada destinatário
  ↓
Log do envio no banco
```

### 3. Servidor Reinicia

```
onReady hook
  ↓
Carrega agendamentos ativos do banco
  ↓
Reinicia Cron Jobs
  ↓
Sistema volta ao normal
```

---

## 🧪 Testar com Dados Fictícios

### Gerar 1 Ano de Dados

```bash
cd /tmp/easy-market/backend
npm install uuid pg  # se ainda não instalou
node scripts/seed-data-1year.js
```

**O que cria**:
- 365 dias de vendas
- ~5000+ transações
- Padrões realistas (pico de compras, sazonalidade)
- ~500 alertas

**Saída**:
```
📊 Resumo:
  • Loja ID: abc-123-def-456
  • Período: 20/03/2025 até 20/03/2026
  • Total de vendas: 5432
  • Total de produtos: 24
  • Total de alertas: ~543
```

### Criar Agendamento para Testar

```bash
curl -X POST http://localhost:3000/api/v1/relatorios-agendados \
  -d '{
    "loja_id": "abc-123-def-456",
    "tipo": "diario",
    "hora": "09:00",
    "destinatarios": ["seu@email.com"],
    "incluir_analise_impacto": true
  }'
```

### Enviar Imediatamente

```bash
curl -X POST http://localhost:3000/api/v1/relatorios-agendados/uuid-aqui/enviar-agora
```

Você receberá um email em segundos!

---

## 📈 Métricas Calculadas

### Crescimento (%)
```
(Faturamento Atual - Faturamento Anterior) / Faturamento Anterior * 100
```

### Aumento de Receita
```
Faturamento Atual - Faturamento Anterior
```

### Redução de Perdas
```
Estoque Crítico * 0.15 (estimado 15% de redução com boa gestão)
```

### Economia Estimada
```
Redução de Perdas + ROI dos Alertas Resolvidos
```

---

## 🚨 Possíveis Erros

### Email não é enviado
1. Verificar variáveis de ambiente (EMAIL_USER, EMAIL_PASS)
2. Se Gmail, usar senha de app, não senha regular
3. Verificar firewall/proxy bloqueando SMTP
4. Consultar logs: `docker logs easy-market-backend`

### Relatório não é gerado
1. Verificar se há dados na tabela `vendas`
2. Verificar se `loja_id` existe em `lojas`
3. Consultar banco:
   ```sql
   SELECT COUNT(*) FROM vendas WHERE loja_id = 'seu-id';
   ```

### Job não dispara na hora certa
1. Verificar timezone do servidor: `date`
2. Horário deve estar em 24h: "09:00" não "9:00"
3. Verificar se `ativo = true` no banco

---

## 🔐 Segurança

- ✅ Emails validados ao criar contato
- ✅ Cron job validado com schema Joi
- ✅ Logs completos de envio
- ✅ Senhas de email em variáveis de ambiente
- ✅ Deletar agendamento para de imediato

---

## 📝 Próximos Passos

- [ ] SMS para relatórios (Twilio)
- [ ] WhatsApp para resumo rápido
- [ ] Dashboard com histórico de relatórios
- [ ] Templates customizáveis por setor
- [ ] Gráficos embutidos nos emails

---

## 🎓 Exemplos Práticos

### Exemplo 1: Relatório Diário

```bash
# Criar
curl -X POST http://localhost:3000/api/v1/relatorios-agendados \
  -d '{
    "loja_id": "store-123",
    "tipo": "diario",
    "hora": "09:00",
    "destinatarios": ["gerente@loja.com"],
    "incluir_analise_impacto": true
  }'

# Resultado: Email recebido todos os dias às 9:00 AM
```

### Exemplo 2: Relatório Semanal (Segundas)

```bash
curl -X POST http://localhost:3000/api/v1/relatorios-agendados \
  -d '{
    "loja_id": "store-123",
    "tipo": "semanal",
    "hora": "08:30",
    "dia_semana": 1,
    "destinatarios": ["gerente@loja.com", "dono@loja.com"],
    "incluir_analise_impacto": true
  }'

# Resultado: Email toda segunda às 8:30 AM
```

### Exemplo 3: Relatório Mensal (Dia 1º)

```bash
curl -X POST http://localhost:3000/api/v1/relatorios-agendados \
  -d '{
    "loja_id": "store-123",
    "tipo": "mensal",
    "hora": "07:00",
    "dia_mes": 1,
    "destinatarios": ["dono@loja.com"],
    "incluir_analise_impacto": true
  }'

# Resultado: Email no dia 1º de cada mês às 7:00 AM
```

---

**Versão**: 1.0.0
**Última Atualização**: 2026-03-20
**Próximo Review**: 2026-04-15
