# 🚀 Guia para Aplicar Migração de Analytics de Clientes

## Passo 1: Preparar as Credenciais do Supabase

Você vai precisar das credenciais do seu banco Supabase. Crie um arquivo `.env` na raiz do projeto:

```bash
cd /tmp/easy-market
cat > .env << 'EOF'
DB_HOST=db.seu_projeto_id.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha_supabase
EOF
```

**Como encontrar as credenciais:**
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em Settings → Database
4. Copie a connection string (URL padrão)
5. Extraia: Host, Port, Database, User, Password

Exemplo de connection string:
```
postgresql://postgres:senha@db.xxxxx.supabase.co:5432/postgres
```

---

## Passo 2: Rodar a Migração

### Opção A: Node.js (Recomendado)

```bash
cd /tmp/easy-market
npm install pg dotenv
node apply-migration.js
```

**Saída esperada:**
```
📡 Conectando ao banco: db.xxxxx.supabase.co:5432/postgres
✓ Conectado ao banco de dados

📝 Executando migração: 008_add_customer_analytics.sql

✓ Migração aplicada com sucesso!

✓ Tabela "clientes" criada com sucesso!

📋 Colunas da tabela clientes:
  - id: uuid
  - loja_id: uuid
  - cliente_id: character varying
  - nome: character varying
  - [... mais colunas ...]
  
✓ View "v_resumo_fidelidade" criada com sucesso!

✅ Migração completada com sucesso!
```

### Opção B: Python

```bash
pip install psycopg2-binary python-dotenv
python3 apply-migration.py
```

### Opção C: Supabase SQL Editor (Manual)

1. Acesse https://app.supabase.com
2. Vá em SQL Editor
3. Crie um novo query
4. Cole o conteúdo de: `/tmp/easy-market/backend/src/migrations/008_add_customer_analytics.sql`
5. Clique em "Execute"

---

## Passo 3: Sincronizar Dados de Clientes

Após a migração ser aplicada, sincronize os dados das vendas com a tabela de clientes.

### Via cURL:

```bash
curl -X POST \
  https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/clientes/loja_001/sincronizar \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "mensagem": "Sincronização concluída",
  "clientes_processados": 245,
  "clientes_atualizados": 245,
  "tempo_ms": 1234
}
```

### Via Node.js/Fetch:

```javascript
const response = await fetch(
  'https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/clientes/loja_001/sincronizar',
  { method: 'POST' }
);
const data = await response.json();
console.log(data);
```

---

## Passo 4: Verificar o Dashboard

1. Acesse o dashboard: https://diversos-easymarket.yuhqmc.easypanel.host
2. Você deve ver 4 novos cards de fidelidade:
   - **Taxa de Fidelidade**: % de clientes ativos
   - **LTV Médio**: Valor médio de lifetime por cliente
   - **Taxa de Clientes Novos**: % de novos clientes
   - **Taxa de Churn**: % de clientes inativos

---

## Passo 5: Verificar os Dados (Opcional)

Verifique os dados que foram populados:

### Ver resumo de fidelidade:
```sql
SELECT * FROM v_resumo_fidelidade WHERE loja_id = 'sua_loja_id';
```

### Ver clientes importados:
```sql
SELECT 
  cliente_id, 
  nome, 
  total_compras, 
  taxa_fidelidade_percentual, 
  ltv_estimado, 
  status, 
  categoria_cliente
FROM clientes 
WHERE loja_id = 'sua_loja_id'
LIMIT 10;
```

### Ver estatísticas:
```sql
SELECT 
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN status = 'ativo' THEN 1 END) as ativos,
  COUNT(CASE WHEN status = 'churn' THEN 1 END) as churn,
  COUNT(CASE WHEN categoria_cliente = 'VIP' THEN 1 END) as vips,
  ROUND(AVG(taxa_fidelidade_percentual)::NUMERIC, 2) as fidelidade_media,
  ROUND(AVG(ltv_estimado)::NUMERIC, 2) as ltv_medio
FROM clientes 
WHERE loja_id = 'sua_loja_id';
```

---

## 🔧 Troubleshooting

### "Connection refused"
- Verifique se o host está correto (deve começar com `db.`)
- Verifique se o password está correto
- Verifique a URL do Supabase

### "Table already exists"
- A tabela já foi criada, pode rodar o sync normalmente

### "Table clientes does not exist"
- A migração não foi aplicada corretamente
- Verifique os logs do SQL Editor

### Backend ainda não está respondendo
- Aguarde 2-3 minutos para o EasyPanel finalizar o deploy
- Verifique em https://diversos-easymarket.yuhqmc.easypanel.host/health

---

## 📊 Métricas Calculadas

A sincronização calcula automaticamente:

| Métrica | Descrição |
|---------|-----------|
| **taxa_fidelidade_percentual** | Frequência de compras do cliente |
| **ltv_estimado** | Valor total gasto × frequência média |
| **status** | ativo/inativo/churn baseado em recência |
| **categoria_cliente** | VIP (>R$5k), regular (>R$1k), novo (<R$1k) |

---

## ✅ Checklist

- [ ] Credenciais do Supabase configuradas em `.env`
- [ ] Migração aplicada (opção A, B ou C)
- [ ] Tabela `clientes` criada com sucesso
- [ ] Endpoint `/sincronizar` chamado
- [ ] Dashboard exibe as métricas de fidelidade
- [ ] Dados de clientes visíveis

---

**Tempo estimado total:** 5-10 minutos
