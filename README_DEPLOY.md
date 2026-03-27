# 🚀 SMART MARKET - Deploy em 2 Minutos

## ✅ Checklist Rápido

```
[ ] Docker instalado em seu Mac/PC
[ ] 3 chaves do Supabase (URL + Service Key)
[ ] 1 chave OpenWeather (grátis em openweathermap.org)
[ ] 2 minutos de tempo
```

---

## 🎯 Para Deploy LOCAL (teste):

### Passo 1: Executar script de setup
```bash
cd /Users/sergioponte/easy-market
bash DEPLOY_AGORA.sh
```

Esse script vai:
- ✅ Validar Docker
- ✅ Criar arquivo `.env`
- ✅ Iniciar containers
- ✅ Testar endpoints
- ✅ Mostrar status

### Passo 2: Fornecer credenciais

O script vai pedir:
```
1. SUPABASE_URL
   → Ir em https://app.supabase.com
   → Seu projeto > Settings > API
   → Copiar "Project URL"

2. SUPABASE_SERVICE_KEY  
   → Mesma página
   → Copiar "service_role key"

3. OPENWEATHER_API_KEY
   → https://openweathermap.org/api
   → Sign up (grátis)
   → Copiar API Key
```

### Passo 3: Esperar resultado

```
✅ Se todos os testes passarem:
   Sistema está 100% online
   Já pode chamar cliente!

❌ Se falhar:
   Verificar logs: docker logs easy-market-backend-1
   Ver seção "Troubleshooting" abaixo
```

---

## 🌐 Para Deploy em EASYPANEL (produção):

### Opção A: Via UI (fácil)
```
1. Abrir EasyPanel no navegador
2. Procurar "smart-market"
3. Clicar em "Environment Variables"
4. Preencher as 3 chaves (mesmas acima)
5. Clicar "Deploy"
6. Esperar ~3 min
7. Testar em https://seu-dominio.com/health
```

### Opção B: Via CLI (rápido)
```bash
# Se você tem easypanel-cli instalado:
easypanel env set SUPABASE_URL https://seu-projeto.supabase.co
easypanel env set SUPABASE_SERVICE_KEY sua-chave
easypanel env set OPENWEATHER_API_KEY sua-chave
easypanel deploy smart-market
```

---

## ✅ Validar que está funcionando:

Depois de deploy, testar estes endpoints:

```bash
# Health check
curl https://seu-dominio.com/health
# Deve retornar: { "status": "OK" }

# Scheduler status
curl https://seu-dominio.com/api/v1/scheduler/status
# Deve retornar: { "sucesso": true, "scheduler": { "isRunning": true } }

# Listar lojas
curl https://seu-dominio.com/api/v1/lojas
# Deve retornar: { "sucesso": true, "lojas": [...] }

# Dashboard
curl https://seu-dominio.com/api/v1/dashboard
# Deve retornar dados do dashboard
```

✅ Se todos retornam `sucesso: true` → **Está pronto para vender!**

---

## 🔧 Troubleshooting

### "docker: command not found"
```
❌ Docker não instalado
✅ Instale: https://www.docker.com/products/docker-desktop
```

### "ERROR: No such service: backend"
```
❌ docker-compose.yml não encontrado
✅ Certifique-se de estar em /Users/sergioponte/easy-market
```

### Servidor inicia mas endpoints retornam 500
```
❌ SUPABASE_URL ou SERVICE_KEY inválido
✅ Verificar no painel Supabase e atualizar .env
✅ docker-compose down && docker-compose up -d
```

### "Porta 3000 já está em uso"
```
❌ Outra aplicação usa porta 3000
✅ Matar processo: lsof -i :3000 | grep -v PID | awk '{print $2}' | xargs kill -9
✅ Ou editar docker-compose.yml (porta 8000)
```

### Scheduler não inicia
```
❌ REDIS_HOST ou credenciais inválidas
✅ Verificar .env (REDIS_HOST=redis)
✅ Verificar docker logs
```

---

## 🎯 Próximos Passos

Se tudo passou no teste local:

### 1️⃣ Deploy em Staging (EasyPanel):
```
bash DEPLOY_AGORA.sh  # Valida tudo
# Se OK → Deploy via EasyPanel
```

### 2️⃣ Teste de Integração:
```bash
# Simular venda do PDV
curl -X POST https://seu-staging.com/api/v1/integracao-pdv/sincronizar \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "loja_001",
    "venda": {
      "id": "venda_123",
      "ticket_total": 250.50,
      "itens": [{"produto": "leite", "quantidade": 2, "preco": 8.90}]
    }
  }'
```

### 3️⃣ Deploy em Produção:
```
Quando staging OK → Deploy em produção
Chamar cliente para demonstração
```

---

## 📊 Comandos Úteis

```bash
# Ver logs do servidor
docker logs easy-market-backend-1 -f

# Parar tudo
docker-compose down

# Reiniciar
docker-compose restart

# Ver status dos containers
docker-compose ps

# Limpar tudo (cuidado!)
docker-compose down -v
```

---

## 📞 Suporte

Se algo não funcionar:

1. Verificar `.env` tem todas 3 chaves ✅
2. Verificar Docker está rodando ✅
3. Ver logs: `docker logs easy-market-backend-1` ✅
4. Restart: `docker-compose down && docker-compose up -d` ✅

---

## 🎉 Sucesso!

Se todos os testes passaram → Você está pronto para vender!

**Próximas 2 horas = R$ 5.000-8.500/mês por cliente** 💰

