#!/bin/bash

# Easy Market v3.0 Quick Start Script

echo "╔════════════════════════════════════════════════════╗"
echo "║     EASY MARKET v3.0 — INICIALIZAÇÃO RÁPIDA        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# 1. Verificar node_modules
echo "📦 Verificando dependências..."
if [ ! -d "/tmp/easy-market/backend/node_modules" ]; then
    echo "⚠️  node_modules não encontrado. Instalando..."
    cd /tmp/easy-market/backend && npm install
else
    echo "✅ Dependências OK (640 packages)"
fi

# 2. Verificar .env
echo ""
echo "🔧 Verificando configuração..."
if [ ! -f "/tmp/easy-market/backend/.env" ]; then
    echo "❌ .env não encontrado!"
    exit 1
else
    echo "✅ .env configurado"
fi

# 3. Validar sintaxe
echo ""
echo "🧪 Validando sintaxe..."
cd /tmp/easy-market/backend
node --check src/index.js
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Erro de sintaxe!"
    exit 1
fi

# 4. Status final
echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║             ✅ TUDO PRONTO PARA RODAR!            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1️⃣  Criar tabelas no Supabase:"
echo "   → Acesse: https://app.supabase.com"
echo "   → SQL Editor → Cole src/migrations/000_run_all_migrations.sql"
echo ""
echo "2️⃣  Iniciar backend:"
echo "   → cd /tmp/easy-market/backend && npm start"
echo ""
echo "3️⃣  Abrir frontend:"
echo "   → open /tmp/easy-market/frontend/index.html"
echo ""
echo "4️⃣  Testar:"
echo "   → curl http://localhost:3000/health"
echo ""
echo "📊 Dashboard: http://localhost:3001"
echo "🔌 API: http://localhost:3000/api/v1"
echo ""
