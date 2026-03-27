# 🚀 Smart Market - Como Rodar o Servidor

## ✅ Credenciais Configuradas

Suas credenciais foram salvas em `.env`:
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_KEY  
- ✅ OPENWEATHER_API_KEY

## 🎯 Opção 1: Rodar Localmente (sem Docker)

### Passo 1: Abrir Terminal

```bash
cd /Users/sergioponte/easy-market
```

### Passo 2: Executar o servidor

```bash
bash START_SERVER.sh
```

Você verá:
```
🚀 Iniciando Smart Market Backend...
[SmartMarket] Servidor rodando em http://localhost:3000
[SmartMarket] Supabase conectado
[Scheduler] Iniciando coleta de variáveis...
```

### Passo 3: Testar em outra aba do Terminal

```bash
# Health check
curl http://localhost:3000/health

# Scheduler status
curl http://localhost:3000/api/v1/scheduler/status

# Lojas
curl http://localhost:3000/api/v1/lojas

# Dashboard
curl http://localhost:3000/api/v1/dashboard
```

Se todos retornam `sucesso: true` → ✅ **Está funcionando!**

---

## 🐳 Opção 2: Rodar com Docker (recomendado para produção)

### Pré-requisito
Instale Docker Desktop: https://www.docker.com/products/docker-desktop

### Execute

```bash
cd /Users/sergioponte/easy-market
docker-compose up -d
```

Depois teste com os mesmos curl commands acima.

---

## 🔧 Troubleshooting

### "Port 3000 already in use"
```bash
# Encontrar processo na porta 3000
lsof -i :3000

# Matar o processo
kill -9 <PID>
```

### "Supabase connection error"
```bash
# Verificar credenciais no .env
cat .env

# Testar conexão
curl https://qfkwqfrnemqregjqxkcr.supabase.co/rest/v1/
```

### "Module not found"
```bash
# Reinstalar dependências
cd backend
npm install
```

---

## 📊 Ver Logs

```bash
# Se rodando localmente
# Os logs aparecem no terminal

# Se rodando com Docker
docker logs easy-market-backend-1 -f
```

---

## 🎯 Próximos Passos

Se o servidor está rodando e testes passaram:

1. ✅ Abra http://localhost:3000/api/v1/dashboard no navegador
2. ✅ Veja os dados em tempo real
3. ✅ Teste integração PDV: `POST /api/v1/integracao-pdv/sincronizar`
4. ✅ Teste integração Balanças: `POST /api/v1/integracao-balancas/leitura`

---

**Sistema está ONLINE! Pronto para cliente!** 🎉

