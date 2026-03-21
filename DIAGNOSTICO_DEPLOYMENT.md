# 🔍 Diagnóstico: Variáveis de Ambiente não Funcionando

## Problema Identificado

O backend está **tentando conectar a `localhost:5432`** em vez de conectar ao Supabase remoto.

Isso significa as variáveis `DB_*` **NÃO estão sendo carregadas**.

---

## Possíveis Causas

### 1. ❌ nixpacks.toml não aplica vars em runtime
- `[env]` no nixpacks.toml é para **build-time**, não runtime
- EasyPanel precisa que as vars sejam configuradas no **console UI**

### 2. ❌ Console do EasyPanel não foi usado
- Variáveis setadas em `console.easypanel.io` não foram aplicadas
- Ou foram salvas em app errada

### 3. ❌ Sintaxe incorreta em EasyPanel
- Nomes de variáveis errados
- Espaços extras em valores
- Valores não salvos

---

## Solução Passo a Passo

### OPÇÃO A: Via EasyPanel Console (Recomendado)

1. **Acesse**: https://console.easypanel.io
2. **Selecione**: Projeto "easymarket"
3. **Vá para**: Environment → Variables (ou Settings → Environment)
4. **Adicione** cada variável (copie EXATAMENTE):

```
Nome: DB_HOST
Valor: db.qfkwqfrnemqregjqxkcr.supabase.co

Nome: DB_PORT  
Valor: 5432

Nome: DB_NAME
Valor: postgres

Nome: DB_USER
Valor: postgres

Nome: DB_PASSWORD
Valor: Jacyara.10davimaria

Nome: DB_SSL
Valor: true
```

5. **Clique**: Save / Apply
6. **Aguarde**: Redeploy automático (2-3 min)
7. **Verifique**: GET https://diversos-easymarket.yuhqmc.easypanel.host/health

---

### OPÇÃO B: Via Docker Compose (se EasyPanel não funcionar)

Se o console não funcionar, tente arquivo docker-compose:

1. Crie `.easypanel-env` local:
```
DB_HOST=db.qfkwqfrnemqregjqxkcr.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Jacyara.10davimaria
DB_SSL=true
```

2. Configure no EasyPanel ou passe via deploy config

---

## Verificação

Se funcionou, você verá em `/health`:
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

Se ainda falhar:
```json
{
  "status": "error",
  "checks": {
    "database": "error",
    "redis": "error"
  }
}
```

---

## Próximos Passos

✅ Após conexão funcionar:
1. `POST /api/v1/clientes/loja_001/sincronizar` - sincronizar dados
2. Frontend exibirá métricas de fidelidade
3. Rotacionar senha do Supabase (segurança)
4. Remover credentials de nixpacks.toml

---

**Precisa de help?** Screenshot de console.easypanel.io para debugar! 📸
