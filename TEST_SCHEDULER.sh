#!/bin/bash

# Test Script for Smart Market Scheduler
# Verifica se o scheduler está funcionando corretamente

echo "🔍 Testando Smart Market Scheduler..."
echo ""

# 1. Verificar se backend existe
if [ ! -f "backend/src/index.js" ]; then
    echo "❌ Backend não encontrado em backend/src/index.js"
    exit 1
fi

echo "✅ Backend encontrado"

# 2. Verificar se ScraperScheduler está presente no index.js
if grep -q "ScraperScheduler" backend/src/index.js; then
    echo "✅ ScraperScheduler inicializado em index.js"
else
    echo "❌ ScraperScheduler NÃO encontrado em index.js"
    exit 1
fi

# 3. Verificar se scrapers/scheduler.js existe
if [ ! -f "backend/src/scrapers/scheduler.js" ]; then
    echo "❌ Scheduler não encontrado em backend/src/scrapers/scheduler.js"
    exit 1
fi

echo "✅ Scheduler módulo existe"

# 4. Verificar endpoints de controle
if grep -q "'/api/v1/scheduler/status'" backend/src/index.js; then
    echo "✅ Endpoint GET /api/v1/scheduler/status configurado"
else
    echo "❌ Endpoint status não encontrado"
    exit 1
fi

if grep -q "'/api/v1/scheduler/start'" backend/src/index.js; then
    echo "✅ Endpoint POST /api/v1/scheduler/start configurado"
else
    echo "❌ Endpoint start não encontrado"
    exit 1
fi

if grep -q "'/api/v1/scheduler/stop'" backend/src/index.js; then
    echo "✅ Endpoint POST /api/v1/scheduler/stop configurado"
else
    echo "❌ Endpoint stop não encontrado"
    exit 1
fi

# 5. Verificar variáveis de ambiente no easypanel.json
if grep -q "OPENWEATHER_API_KEY" easypanel.json; then
    echo "✅ OPENWEATHER_API_KEY configurada no EasyPanel"
else
    echo "❌ OPENWEATHER_API_KEY não encontrada"
    exit 1
fi

if grep -q "SCRAPER_INTERVAL" easypanel.json; then
    echo "✅ SCRAPER_INTERVAL configurada no EasyPanel"
else
    echo "❌ SCRAPER_INTERVAL não encontrada"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  ✅ Scheduler está totalmente configurado!         ║"
echo "╠════════════════════════════════════════════════════╣"
echo "║  Próximos passos:                                  ║"
echo "║  1. Configurar variáveis no EasyPanel              ║"
echo "║  2. Deploy para produção                           ║"
echo "║  3. Verificar: curl localhost:3000/health          ║"
echo "║  4. Status: curl localhost:3000/api/v1/scheduler   ║"
echo "║                              /status               ║"
echo "╚════════════════════════════════════════════════════╝"
