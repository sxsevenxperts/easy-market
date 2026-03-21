# 🔐 Configurar Database Secrets no EasyPanel

**IMPORTANTE:** Nunca coloque secrets em `nixpacks.toml` ou arquivos do repositório. Use o painel do EasyPanel para ambiente seguro.

---

## Passo 1: Acessar o Console EasyPanel

1. Acesse: **https://console.easypanel.io**
2. Faça login com sua conta
3. Selecione o projeto: **"easymarket"** (ou o nome que você deu)

---

## Passo 2: Navegar até as Variáveis de Ambiente

### Opção A: Via Aba "Environment" (Recomendado)
1. No menu lateral, procure: **Environment** ou **Configuration**
2. Clique em **Environment Variables** ou **Secrets**
3. Você verá um formulário para adicionar variáveis

### Opção B: Via Aplicação
1. Encontre a aplicação **"easymarket"** (backend)
2. Clique em: **Settings** → **Environment**
3. Procure pela seção de variáveis

---

## Passo 3: Adicionar Variáveis de Banco de Dados

Para cada variável abaixo, clique em **"Add Variable"** e preencha:

### 1. Database Host
```
Nome:  DB_HOST
Valor: db.qfkwqfrnemqregjqxkcr.supabase.co
```

### 2. Database Port
```
Nome:  DB_PORT
Valor: 5432
```

### 3. Database Name
```
Nome:  DB_NAME
Valor: postgres
```

### 4. Database User
```
Nome:  DB_USER
Valor: postgres
```

### 5. Database Password ⚠️
```
Nome:  DB_PASSWORD
Valor: Jacyara.10davimaria
```
**Tipo:** Marque como "Secret" (se houver opção)

### 6. SSL Connection
```
Nome:  DB_SSL
Valor: true
```

---

## Passo 4: Salvar e Fazer Deploy

1. Clique em **"Save"** ou **"Apply Changes"**
2. Aguarde confirmação
3. A aplicação fará **redeploy automático** com as novas variáveis

---

## Verificar se Funcionou

1. Acesse o backend: **https://diversos-easymarket.yuhqmc.easypanel.host**
2. A resposta deve ser:
```json
{
  "name": "Easy Market API",
  "version": "1.0.0",
  "status": "online",
  "endpoints": { ... }
}
```

Se receber erro de conexão com banco de dados:
- ✓ Verifique se todas as 6 variáveis estão salvas
- ✓ Aguarde 2-3 minutos para o deploy completar
- ✓ Faça refresh na página (F5)

---

## Passo 5: Sincronizar Dados de Clientes (Após Deploy)

Quando o backend estiver online, execute:

```bash
curl -X POST https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/clientes/loja_001/sincronizar
```

Deve retornar:
```json
{
  "message": "Sincronização iniciada",
  "loja_id": "loja_001",
  "timestamp": "2026-03-21T..."
}
```

---

## 🔒 Boas Práticas de Segurança

✅ **FAÇA:**
- Use secrets no painel do EasyPanel
- Regenere senhas de tempos em tempos
- Use senhas complexas (mix de letras, números, símbolos)
- Mantenha `.env` e `nixpacks.toml` fora do Git

❌ **NÃO FAÇA:**
- Coloque senhas em arquivos de configuração
- Commit de `.env` no repositório
- Compartilhe credenciais em texto plano
- Use a mesma senha em múltiplos serviços

---

## Troubleshooting

### ❌ "Connection refused" ou "Cannot connect to database"
**Solução:**
1. Verifique se todas as 6 variáveis estão corretas
2. Confira: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
3. Aguarde 3-5 minutos para o deploy completar

### ❌ "Invalid password" ou "authentication failed"
**Solução:**
1. Confirme a senha no painel do Supabase
2. Copie exatamente (sem espaços extras)
3. Se mudou a senha no Supabase, atualize no EasyPanel

### ❌ "Variáveis não aparecem na app"
**Solução:**
1. Clique em "Save" ou "Apply"
2. Aguarde o redeploy automático
3. Faça refresh (F5) na aplicação

---

## Próximos Passos

✅ Configurar secrets no EasyPanel
✅ Backend redeploy e online
✅ Executar POST `/api/v1/clientes/loja_001/sincronizar`
✅ Dashboard exibir métricas de fidelidade
✅ Frontend integrado com dados reais

---

**Precisa de ajuda?** Envie um screenshot do console.easypanel.io que te ajudo! 🚀
