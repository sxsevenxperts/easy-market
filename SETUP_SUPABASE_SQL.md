# ⚡ Setup Rápido - Executar SQL no Supabase

## 🎯 Objetivo
Criar as 25 tabelas de análise preditiva no Supabase em 5 minutos.

---

## ✅ Passos

### Passo 1: Abra o SQL Editor
1. Vá para: https://qfkwqfrnemqregjqxkcr.supabase.co/project/default/sql/new
2. Ou:
   - Abra: https://app.supabase.com
   - Selecione o projeto: `qfkwqfrnemqregjqxkcr`
   - Clique em: **SQL Editor** (esquerda)
   - Clique em: **New Query**

### Passo 2: Cole o SQL
1. Copie o conteúdo completo do arquivo: `SUPABASE_SCHEMA_COMPLETO.sql`
2. Cole no SQL Editor
3. Clique em: **Run** (botão azul)

### Passo 3: Aguarde
- Vai criar 10 tabelas principais
- Vai criar 3 views
- Vai criar 1 trigger
- Vai criar 1 função
- Tempo estimado: 30-60 segundos

### Passo 4: Verifique
No **Data** (esquerda):
- [ ] Tabela: `clima` ✓
- [ ] Tabela: `operacional_loja` ✓
- [ ] Tabela: `campanhas_ativas` ✓
- [ ] Tabela: `eventos_externos` ✓
- [ ] Tabela: `concorrencia_preco` ✓
- [ ] Tabela: `previsoes_ml` ✓
- [ ] Tabela: `historico_descontos` ✓
- [ ] Tabela: `comportamento_compra` ✓
- [ ] Tabela: `reposicoes` ✓
- [ ] Tabela: `impacto_financeiro` ✓
- [ ] View: `vw_previsao_vs_realizado` ✓
- [ ] View: `vw_impacto_diario` ✓
- [ ] View: `vw_produtos_criticos` ✓

---

## ❌ Se Houver Erro

### Erro: "relation already exists"
**Causa**: As tabelas já foram criadas
**Solução**: Pule este erro, continue com Passo 5

### Erro: "permission denied"
**Causa**: Você não tem permissão neste projeto
**Solução**: Use credenciais corretas do Supabase

### Erro: Syntax error
**Causa**: Arquivo SQL está corrompido
**Solução**: Baixe novamente: `git pull origin main`

---

## ✅ Passo 5: Gerar Dados Fictícios

Depois que as tabelas forem criadas, execute:

```bash
cd /tmp/easy-market
npm install @supabase/supabase-js
node scripts/setup-supabase-complete.js
```

Isso vai:
- Criar 1 loja (Loja Super LAgoa Junco)
- Criar 24 produtos
- Gerar 365 dias de vendas (~5.400 transações)
- Gerar ~540 alertas
- Criar contato de teste
- Criar relatório agendado

---

## 📊 Resultado Final

```
✅ Loja: Loja Super LAgoa Junco
✅ Período: 20/03/2025 até 20/03/2026
✅ Total de transações: 5.432
✅ Total de produtos: 24
✅ Total de alertas: ~543
✅ Contato: Gerente Teste
✅ Relatório: Diário às 09:00
```

---

## 🚀 Próximo Passo

Com as tabelas criadas e dados gerados:

1. **Treinar ML Engine**:
   ```bash
   cd ml_engine
   python api.py
   ```

2. **Iniciar Dashboard**:
   ```bash
   cd dashboard
   npm run dev
   ```

3. **Ver Previsões**:
   - http://localhost:3000/previsoes
   - http://localhost:3000/estoque
   - http://localhost:3000/alertas

---

**Tempo total: 10-15 minutos** ⏱️

