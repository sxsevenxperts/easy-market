# ⚡ Quick Start - 3 Passos (15 minutos)

## 🎯 Meta
Ter dados fictícios de 1 ano de vendas no Supabase e começar a treinar o ML.

---

## ✅ PASSO 1: Criar Tabelas no Supabase (2 min)

### 1.1 - Abra o SQL Editor
O navegador já foi aberto com:
👉 https://qfkwqfrnemqregjqxkcr.supabase.co/project/default/sql/new

**Se não abriu, acesse manualmente:**
1. Vá para https://app.supabase.com
2. Projeto: `qfkwqfrnemqregjqxkcr`
3. Menu esquerda: **SQL Editor**
4. Botão: **+ New Query**

### 1.2 - Cole o SQL

**Copie TUDO do arquivo:**
```bash
cat SUPABASE_SCHEMA_COMPLETO.sql
```

**Cole no SQL Editor** (Cmd+V ou Ctrl+V)

### 1.3 - Execute

Clique no botão azul: **Run**

**Esperado:**
```
✅ CREATE TABLE IF NOT EXISTS clima
✅ CREATE TABLE IF NOT EXISTS operacional_loja
✅ CREATE TABLE IF NOT EXISTS campanhas_ativas
... (10 tabelas)
✅ CREATE VIEW vw_previsao_vs_realizado
✅ CREATE TRIGGER trigger_erro_previsao
```

**Tempo: 30-60 segundos**

### 1.4 - Verifique

Na aba **Data** (esquerda), procure:
- ✅ `clima`
- ✅ `previsoes_ml`
- ✅ `impacto_financeiro`
- ... (10 tabelas no total)

Se tiver todas ✅, prossiga para Passo 2.

---

## ✅ PASSO 2: Gerar Dados Fictícios (5 min)

### 2.1 - Instale dependência
```bash
npm install @supabase/supabase-js
```

### 2.2 - Gere dados

```bash
cd /tmp/easy-market
node scripts/setup-supabase-complete.js
```

**Esperado:**
```
🚀 Iniciando setup completo no Supabase...

📦 Criando loja...
✅ Loja criada: abc-123-uuid

📦 Criando 24 produtos...
✅ 24 produtos criados

💰 Gerando 1 ano de vendas (365 dias)...
  ✓ 50/365 dias
  ✓ 100/365 dias
  ... (progresso)
✅ 5.432 transações geradas

⚠️  Gerando alertas...
✅ 543 alertas gerados

👤 Criando contato de teste...
✅ Contato criado

📧 Criando relatório agendado...
✅ Relatório agendado criado

🎉 SETUP CONCLUÍDO COM SUCESSO!
```

**Tempo: 3-5 minutos**

### 2.3 - Verifique

Vá para https://app.supabase.co → **Data**:
- Tabela `lojas`: 1 loja ✅
- Tabela `inventario`: 24 produtos ✅
- Tabela `vendas`: 5.432 transações ✅
- Tabela `alertas`: ~540 alertas ✅

---

## ✅ PASSO 3: Pronto! (0 min)

Agora você tem:

```
📊 1 Loja Completa
   └─ Loja Super LAgoa Junco (Recife, PE)

📦 24 Produtos
   ├─ 5 Bebidas (Refrigerante, Suco, Água, Cerveja, Vinho)
   ├─ 6 Alimentos (Feijão, Arroz, Macarrão, Óleo, Leite, Queijo)
   ├─ 4 Higiene (Sabonete, Shampoo, Desodorante, Escova)
   ├─ 4 Limpeza (Detergente, Desinfetante, Papel, Sacas)
   └─ 5 Perecíveis (Frutas, Verduras, Carnes, Peixes, Frango)

📈 5.432 Transações
   └─ 365 dias de vendas realistas com:
      ├─ Padrões horários (pico 18h)
      ├─ Padrões semanais (sexta vende mais)
      ├─ Padrões sazonais (dez vende 50% mais)
      └─ Eventos (feriados, épocas)

⚠️ 543 Alertas
   └─ Falta de estoque, desperdício, preço anormal, vencimento

📧 1 Contato de Teste
   └─ Gerente Teste (seu email)

🔄 1 Relatório Agendado
   └─ Diário às 09:00
```

---

## 🚀 Próximos Passos

### 3.1 - Ver dados no Supabase
```
https://app.supabase.co/project/qfkwqfrnemqregjqxkcr/editor
```

### 3.2 - Treinar ML Engine
```bash
cd ml_engine
python api.py
```

### 3.3 - Iniciar Dashboard
```bash
cd dashboard
npm run dev
```

### 3.4 - Ver Previsões
```
http://localhost:3000/previsoes
http://localhost:3000/estoque
http://localhost:3000/alertas
```

---

## ❌ Se Algo der Errado

### Erro: "Could not find table 'lojas'"
**Causa**: SQL não foi executado
**Solução**: Volte ao Passo 1, execute SQL no Supabase

### Erro: "Connection refused"
**Causa**: Credenciais Supabase incorretas
**Solução**: Verifique em `.env`:
```bash
SUPABASE_URL=https://qfkwqfrnemqregjqxkcr.supabase.co
SUPABASE_KEY=sb_publishable_vBAVB5lBnPY18GbnJxRlkA_fxMYrUmQ
```

### Erro: npm command not found
**Causa**: Node.js não está instalado
**Solução**: Instale em https://nodejs.org

---

## 📞 Suporte

**Arquivo de Documentação**:
- `SUPABASE_SCHEMA_COMPLETO.sql` - SQL das tabelas
- `SETUP_SUPABASE_SQL.md` - Instruções detalhadas
- `CONVERSATION_LOG.md` - Histórico do projeto
- `ROADMAP_EASYMARKET.md` - Roadmap completo

**Repositório**:
- GitHub: https://github.com/sxsevenxperts/easy-market

---

**⏱️ Tempo Total: ~15 minutos**

Depois disso, o sistema estará pronto para:
✅ Visualizar dados no Dashboard
✅ Treinar modelo de IA com dados reais
✅ Fazer previsões de demanda
✅ Gerar recomendações automáticas

🎉 **Você está pronto!**
