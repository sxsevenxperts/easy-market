#!/bin/bash

# Smart Market Backend Startup Script
# Configure your .env file before running this script

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Verify required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "⚠️  ERRO: Credenciais Supabase não configuradas!"
    echo "Configure o arquivo .env com suas credenciais."
    echo ""
    echo "Exemplos:"
    echo "  SUPABASE_URL=https://seu-projeto.supabase.co"
    echo "  SUPABASE_SERVICE_KEY=sua-chave-aqui"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           SMART MARKET - Iniciando Servidor                ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Ambiente: $NODE_ENV"
echo "║  Porta: $PORT"
echo "║  Supabase: ✅ Configurada"
echo "║  OpenWeather: ${OPENWEATHER_API_KEY:+✅ Configurada}${OPENWEATHER_API_KEY:- ⚠️  Opcional}"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/sergioponte/easy-market/backend
node src/index.js
