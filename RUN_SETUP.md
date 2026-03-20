# 🚀 Executar Setup no Supabase

## Passo 1: Instalar Dependência do Supabase

```bash
cd /tmp/easy-market
npm install @supabase/supabase-js
```

## Passo 2: Executar o Setup

```bash
node scripts/setup-supabase.js
```

## Esperado

Você verá:

```
🚀 Iniciando setup no Supabase...

📦 Criando loja...
✅ Loja criada: abc-123-uuid

📦 Criando produtos...
✅ 24 produtos criados

💰 Gerando dados de vendas...
  ✓ 50/365 dias
  ✓ 100/365 dias
  ✓ 150/365 dias
  ...
✅ 5432 transações geradas

⚠️  Gerando alertas...
✅ 543 alertas gerados

👤 Criando contato de teste...
✅ Contato criado

📧 Criando relatório agendado...
✅ Relatório agendado criado

🎉 SETUP CONCLUÍDO COM SUCESSO!

📊 Resumo:
  • Loja ID: abc-123-uuid
  • Período: 20/03/2025 até 20/03/2026
  • Total de vendas: 5432
  • Total de produtos: 24
  • Total de alertas: ~543
  • Contato de teste: Gerente Teste
  • Email: sevenxpertssxacademy@gmail.com

✅ Tudo pronto para testar!
```

---

## O Que Será Criado

✅ **Loja**: "Loja Super LAgoa Junco"
✅ **1 Ano de Vendas**: 365 dias, ~5.400 transações
✅ **24 Produtos**: Bebidas, Alimentos, Higiene, Limpeza, Perecíveis
✅ **~540 Alertas**: Estoque baixo, desperdício, etc
✅ **1 Contato**: Gerente Teste com seu email
✅ **1 Relatório Agendado**: Diário às 9:00 AM

---

## Próximo Passo

Depois de rodar com sucesso:

1. **Verificar no Supabase**:
   - https://qfkwqfrnemqregjqxkcr.supabase.co
   - Ver as tabelas sendo preenchidas

2. **Testar API** (quando backend estiver rodando):
   ```bash
   curl http://localhost:3000/api/v1/dashboard/[LOJA_ID]
   ```

3. **Ver Relatórios**:
   - Relatórios agendados para disparar diariamente
   - Emails chegando às 9:00 AM

---

**Aviso**: Isto cria dados FICTÍCIOS para teste.
Depois você fornece dados reais da sua loja.

**Tá pronto? Pode rodar!** 🚀
