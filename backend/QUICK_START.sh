#!/bin/bash

#
# Smart Market Backend - Quick Start Script
# Inicia o servidor de forma simples e pronta para produção
#

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║            SMART MARKET v3.0 - Quick Start                ║"
echo "║                  By Seven Xperts                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "Instale em: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"

# Check if in backend directory
if [ ! -f "package.json" ]; then
    echo "⚠️  Entrando no diretório backend..."
    cd backend || exit 1
fi

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo "✅ Dependências instaladas"
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado"
    echo "Criando .env padrão para desenvolvimento..."
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Opcional: Configure para ativar funcionalidades
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_KEY=your-key
# OPENWEATHER_API_KEY=your-key
# JWT_SECRET=your-secret

# Scheduler
LOJA_IDS=loja_001,loja_002,loja_003
SCRAPER_INTERVAL=60
EOF
    echo "✅ .env criado (com valores padrão)"
fi

echo ""
echo "🚀 Iniciando servidor..."
echo ""

# Start the server
node src/index.js
