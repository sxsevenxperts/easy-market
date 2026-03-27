#!/bin/bash

# Script de Diagnóstico - EasyPanel Deploy

echo "════════════════════════════════════════════════════════════"
echo "  DIAGNÓSTICO DO DEPLOY - SMART MARKET"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "1️⃣  Verificando conectividade com EasyPanel..."
if curl -s --connect-timeout 5 https://diverses-smartmarket.yuhqmc.easypanel.host/health > /dev/null 2>&1; then
    echo "   ✅ Serviço respondendo"
else
    echo "   ❌ Serviço NÃO respondendo"
    echo "   Status: Service is not reachable"
fi

echo ""
echo "2️⃣  Verificando último commit no GitHub..."
git log -1 --oneline
echo ""

echo "3️⃣  Verificando status das rotas locais..."
echo "   Testando require() de cada rota:"
node -e "
const rotas = [
  './backend/src/routes/clientes',
  './backend/src/routes/relatorios-pdf',
  './backend/src/routes/dashboard'
];

rotas.forEach(r => {
  try {
    require(r);
    console.log('   ✅ ' + r);
  } catch(e) {
    console.log('   ❌ ' + r + ': ' + e.message.split('\n')[0]);
  }
});
"

echo ""
echo "4️⃣  Próximos passos:"
echo "   a) Aguarde 2-3 minutos para que o EasyPanel detecte o novo push"
echo "   b) Visite: http://187.77.32.172:3000/projects/diversos/app/smartmarket/deployments"
echo "   c) Procure por um novo deploy ou clique 'Redeploy'"
echo "   d) Verifique os logs de deploy/runtime"
echo ""
echo "5️⃣  Endpoints a testar após sucesso:"
echo "   - https://diverses-smartmarket.yuhqmc.easypanel.host/health"
echo "   - https://diverses-smartmarket.yuhqmc.easypanel.host/api/v1/lojas"
echo "   - https://diverses-smartmarket.yuhqmc.easypanel.host/api/v1/dashboard"
echo ""
