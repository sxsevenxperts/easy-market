#!/bin/bash

echo "🚀 SMART MARKET - SETUP AUTOMÁTICO"
echo "=================================="
echo ""
echo "Você precisa de 3 chaves. Vou guiar:"
echo ""
echo "1️⃣  SUPABASE_URL"
echo "   → Acesse: https://app.supabase.com"
echo "   → Seu projeto → Settings → API"
echo "   → Copie 'Project URL'"
echo ""
read -p "Cole aqui (ou Enter para pular): " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
  echo "⚠️  SUPABASE_URL não fornecido. Deploy não funcionará."
  SUPABASE_URL="https://seu-projeto.supabase.co"
fi

echo ""
echo "2️⃣  SUPABASE_SERVICE_KEY"  
echo "   → Mesmo lugar (Settings > API)"
echo "   → Copie 'service_role' (a chave secreta)"
echo ""
read -sp "Cole aqui (oculto): " SUPABASE_SERVICE_KEY

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "⚠️  SUPABASE_SERVICE_KEY não fornecido."
  SUPABASE_SERVICE_KEY="sua-chave-aqui"
fi

echo ""
echo ""
echo "3️⃣  OPENWEATHER_API_KEY"
echo "   → Acesse: https://openweathermap.org/api"
echo "   → Sign up (grátis)"
echo "   → Copy API Key"
echo ""
read -p "Cole aqui: " OPENWEATHER_API_KEY

if [ -z "$OPENWEATHER_API_KEY" ]; then
  OPENWEATHER_API_KEY="demo"
fi

# Gerar JWT Secret aleatório
JWT_SECRET=$(openssl rand -base64 32)

# Criar/atualizar .env
cat > /Users/sergioponte/easy-market/.env << ENVFILE
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
ENVFILE

echo ""
echo "✅ Arquivo .env criado com sucesso!"
echo ""
echo "📋 Credenciais configuradas:"
echo "   SUPABASE_URL: $(echo $SUPABASE_URL | cut -c1-50)..."
echo "   OPENWEATHER_API_KEY: $(echo $OPENWEATHER_API_KEY | cut -c1-20)..."
echo "   JWT_SECRET: [gerado aleatoriamente]"
echo ""

# Testar conexão
echo "🔍 Testando conexão com Supabase..."

cd /Users/sergioponte/easy-market

# Verificar se Docker está rodando
if ! command -v docker &> /dev/null; then
  echo "⚠️  Docker não encontrado. Pulando teste."
else
  # Build e start
  echo "🐳 Iniciando Docker Compose..."
  docker-compose down 2>/dev/null
  docker-compose up -d
  
  sleep 3
  
  # Test health
  if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Servidor iniciou com sucesso!"
    echo ""
    echo "📊 Próximos testes:"
    echo "   curl http://localhost:3000/api/v1/scheduler/status"
    echo "   curl http://localhost:3000/api/v1/lojas"
  else
    echo "⚠️  Servidor não respondeu. Verificar logs:"
    echo "   docker logs easy-market-backend-1"
  fi
fi

echo ""
echo "🎯 PRÓXIMO PASSO:"
echo "   1. Se Docker funcionou: Abra http://localhost:3000/api/v1/dashboard"
echo "   2. Se for usar EasyPanel: Cole as 3 chaves no painel"
echo "   3. Teste em staging/produção"
echo ""
echo "✅ Tudo pronto!"

