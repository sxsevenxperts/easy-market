#!/bin/bash

# ============================================
# Easy Market - Setup Completo
# Instala dependências e executa setup
# ============================================

set -e

echo "🚀 Easy Market - Setup Completo"
echo "=================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Instalar dependências Node.js
echo -e "${YELLOW}📦 Instalando dependências Node.js...${NC}"
npm install
echo -e "${GREEN}✅ Dependências instaladas${NC}\n"

# 2. Instalar Supabase client
echo -e "${YELLOW}📦 Instalando Supabase client...${NC}"
npm install @supabase/supabase-js
echo -e "${GREEN}✅ Supabase client instalado${NC}\n"

# 3. Verificar arquivo .env
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
  echo "Criando .env a partir de .env.example..."
  cp .env.example .env
  echo -e "${YELLOW}⚠️  IMPORTANTE: Edite .env e adicione suas credenciais do Supabase${NC}"
  echo ""
fi

# 4. Menu de opções
echo -e "${YELLOW}Escolha uma opção:${NC}"
echo "1. Setup apenas SQL (criar tabelas no Supabase)"
echo "2. Setup completo (criar tabelas + gerar dados fictícios)"
echo "3. Gerar apenas dados fictícios (1 ano de vendas)"
echo "4. Sair"
echo ""

read -p "Digite sua escolha (1-4): " choice

case $choice in
  1)
    echo -e "\n${YELLOW}🔧 Executando: Criar SQL schema${NC}"
    echo "Copie o arquivo SUPABASE_SCHEMA_COMPLETO.sql para:"
    echo "  https://qfkwqfrnemqregjqxkcr.supabase.co (SQL Editor)"
    echo ""
    echo -e "${GREEN}✅ Próximo passo: Cole o SQL e execute${NC}"
    ;;
  2)
    echo -e "\n${YELLOW}🚀 Executando: Setup Completo (SQL + Dados)${NC}"
    npm run db:setup:supabase
    echo -e "${GREEN}✅ Setup concluído!${NC}"
    ;;
  3)
    echo -e "\n${YELLOW}📊 Executando: Gerar dados fictícios${NC}"
    npm run db:seed:year
    echo -e "${GREEN}✅ Dados fictícios gerados!${NC}"
    ;;
  4)
    echo -e "${YELLOW}Saindo...${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}Opção inválida!${NC}"
    exit 1
    ;;
esac

echo ""
echo "=================================="
echo -e "${GREEN}✨ Easy Market configurado!${NC}"
echo "=================================="
echo ""
echo "📊 Próximos passos:"
echo "1. Verificar dados no Supabase:"
echo "   https://app.supabase.com/project/qfkwqfrnemqregjqxkcr"
echo ""
echo "2. Iniciar o backend:"
echo "   npm run dev"
echo ""
echo "3. Iniciar o dashboard (em outro terminal):"
echo "   cd dashboard && npm run dev"
echo ""
echo "4. Iniciar o ML Engine (em outro terminal):"
echo "   cd ml_engine && python api.py"
echo ""
