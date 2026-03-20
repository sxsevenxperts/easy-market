# ⚡ Guia Rápido: Relatórios Agendados

Vou te mostrar como colocar o sistema de relatórios automáticos funcionando em 5 minutos.

## 1️⃣ Instalar Dependências

```bash
cd /tmp/easy-market/backend
npm install
```

Isto instala:
- `cron` - Para agendar horários
- `nodemailer` - Para enviar emails
- `twilio` - Para WhatsApp/SMS

## 2️⃣ Configurar Email

Edite o arquivo `.env` na pasta backend:

```bash
# Gmail (recomendado)
EMAIL_SERVICE=gmail
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=senha-de-app-de-16-caracteres

# Ou outro email
EMAIL_SERVICE=outlook
EMAIL_USER=seu-email@outlook.com
EMAIL_PASS=sua-senha
```

**Como gerar senha de app do Gmail**:
1. Ative 2FA na sua conta Google
2. Vá para https://myaccount.google.com/apppasswords
3. Selecione "Mail" e "Windows"
4. Copie a senha (16 chars)
5. Use como `EMAIL_PASS`

## 3️⃣ Criar Banco de Dados

Execute a migração:

```bash
npm run db:migrate
```

Isto cria as tabelas:
- `relatorios_agendados` - Configurações de agendamentos
- `relatorios_logs` - Histórico de envios

## 4️⃣ Gerar Dados de Teste (1 Ano)

```bash
npm run db:seed:year
```

Isto cria:
- 365 dias de vendas
- ~5.000 transações
- Padrões realistas (picos, sazonalidade)
- ~500 alertas

**Saída esperada**:
```
🌱 Iniciando geração de dados fictícios...
📦 Criando loja...
💰 Gerando dados de vendas...
✅ Dados fictícios gerados com sucesso!

📊 Resumo:
  • Loja ID: abc-123-def-456
  • Período: 20/03/2025 até 20/03/2026
  • Total de vendas: 5432
```

**Copie o Loja ID** - você vai precisar!

## 5️⃣ Iniciar o Backend

```bash
npm run dev
```

Deverá ver:
```
✓ Server running on http://localhost:3000
✓ X relatórios agendados foram carregados
```

## 6️⃣ Criar Seu Primeiro Agendamento

Substitua `LOJA_ID` pelo ID que você copiou acima:

```bash
curl -X POST http://localhost:3000/api/v1/relatorios-agendados \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "LOJA_ID_AQUI",
    "tipo": "diario",
    "hora": "09:00",
    "destinatarios": ["seu@email.com"],
    "incluir_analise_impacto": true
  }'
```

Copie o `relatorio_id` da resposta.

## 7️⃣ Testar Envio Imediato

```bash
curl -X POST http://localhost:3000/api/v1/relatorios-agendados/RELATORIO_ID_AQUI/enviar-agora
```

**Em segundos você receberá um email** com o relatório! 📧

---

## 📊 O Que Você Vai Receber

O email mostra:

```
RELATÓRIO DIÁRIO - EASY MARKET

📊 Vendas
Faturamento Total: R$ 2.845,00
Quantidade Vendida: 234 unidades
Total de Transações: 47
Ticket Médio: R$ 60,53

📦 Estoque
Total de Produtos: 24
Produtos em Crítico: 3
Saúde do Estoque: 87% saudável

⚠️ Alertas
Total de Alertas: 12
Alertas Resolvidos: 9
ROI Total Estimado: R$ 450,00

📈 Análise de Impacto
Crescimento: +15%
Aumento de Receita: R$ 380,00
Redução de Perdas: R$ 85,00
Economia Estimada: R$ 535,00
```

---

## 🎯 Próximas Ações

### Opção A: Testar Diferentes Agendamentos

```bash
# Relatório Semanal (Segundas às 8:30)
curl -X POST http://localhost:3000/api/v1/relatorios-agendados \
  -d '{
    "loja_id": "LOJA_ID",
    "tipo": "semanal",
    "hora": "08:30",
    "dia_semana": 1,
    "destinatarios": ["seu@email.com"],
    "incluir_analise_impacto": true
  }'

# Relatório Mensal (Dia 1º às 7:00)
curl -X POST http://localhost:3000/api/v1/relatorios-agendados \
  -d '{
    "loja_id": "LOJA_ID",
    "tipo": "mensal",
    "hora": "07:00",
    "dia_mes": 1,
    "destinatarios": ["seu@email.com"],
    "incluir_analise_impacto": true
  }'
```

### Opção B: Integrar no Dashboard

O Dashboard irá mostrar:
- Lista de agendamentos ativos
- Próximo horário de envio
- Histórico de relatórios enviados
- Botão para testar envio

### Opção C: Análise dos Dados de Teste

Consultar no banco:
```sql
-- Total de vendas por dia
SELECT DATE(data_venda), COUNT(*), SUM(faturamento)
FROM vendas
WHERE loja_id = 'LOJA_ID'
GROUP BY DATE(data_venda)
LIMIT 10;

-- Produtos mais vendidos
SELECT nome_produto, COUNT(*), SUM(quantidade)
FROM vendas v
JOIN inventario i ON v.loja_id = i.loja_id
GROUP BY nome_produto
ORDER BY COUNT(*) DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Erro: "Email não foi enviado"

**Verificar**:
1. Variáveis de ambiente estão definidas?
   ```bash
   echo $EMAIL_USER $EMAIL_PASS
   ```
2. Se Gmail, usou senha de app?
3. Firewall/proxy bloqueando?

### Erro: "Loja ID não encontrado"

```sql
-- Verificar se loja existe
SELECT id, nome FROM lojas LIMIT 5;
```

### Erro: "Nenhum dado de venda"

O seed script já criou dados. Se não aparecerem:
```bash
npm run db:seed:year
```

### Relatório não dispara no horário

1. Verificar timezone: `date`
2. Hora deve ser 24h: "09:00" não "9:00"
3. Verificar se ativo=true:
   ```sql
   SELECT * FROM relatorios_agendados WHERE ativo = true;
   ```

---

## 📚 Documentação Completa

- `/tmp/easy-market/backend/RELATORIOS_AGENDADOS.md` - Documentação técnica
- `/tmp/easy-market/backend/src/routes/relatorios-agendados.js` - Código fonte
- `/tmp/easy-market/backend/src/migrations/010-relatorios-agendados.sql` - Schema do banco

---

## ✅ Checklist

- [ ] Instalou dependências: `npm install`
- [ ] Configurou `.env` com EMAIL_USER/EMAIL_PASS
- [ ] Executou migração: `npm run db:migrate`
- [ ] Gerou dados de teste: `npm run db:seed:year`
- [ ] Iniciou backend: `npm run dev`
- [ ] Criou agendamento com curl
- [ ] Testou envio: `/enviar-agora`
- [ ] Recebeu email ✉️

---

## 🎉 Pronto!

Seu sistema de relatórios automáticos está funcionando!

**Próximo passo**: Conectar a um supermercado de verdade e começar a coletar dados reais.

