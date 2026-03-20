#!/bin/bash

# ============================================
# Execute SQL no Supabase via API REST
# ============================================

SUPABASE_URL="https://qfkwqfrnemqregjqxkcr.supabase.co"
SUPABASE_KEY="sb_publishable_vBAVB5lBnPY18GbnJxRlkA_fxMYrUmQ"
SQL_FILE="SUPABASE_SCHEMA_COMPLETO.sql"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  AVISO IMPORTANTE:${NC}"
echo ""
echo "O cliente Supabase JavaScript não pode executar SQL bruto."
echo "Você tem 2 opções:"
echo ""
echo -e "${GREEN}OPÇÃO 1: Via SQL Editor (Recomendado - 2 minutos)${NC}"
echo "  1. Abra: https://qfkwqfrnemqregjqxkcr.supabase.co/project/default/sql/new"
echo "  2. Cole o conteúdo de: SUPABASE_SCHEMA_COMPLETO.sql"
echo "  3. Clique em 'Run'"
echo ""
echo -e "${GREEN}OPÇÃO 2: Via CLI do Supabase${NC}"
echo "  1. Instale: npm install -g supabase"
echo "  2. Configure: supabase login"
echo "  3. Execute: supabase db push"
echo ""
echo -e "${YELLOW}Qual opção você escolhe? (1 ou 2):${NC}"
read -p "> " choice

if [ "$choice" = "1" ]; then
  echo ""
  echo -e "${YELLOW}Abrindo SQL Editor no navegador...${NC}"

  # Tentar abrir no navegador padrão
  if command -v open &> /dev/null; then
    # macOS
    open "https://qfkwqfrnemqregjqxkcr.supabase.co/project/default/sql/new"
  elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "https://qfkwqfrnemqregjqxkcr.supabase.co/project/default/sql/new"
  elif command -v start &> /dev/null; then
    # Windows
    start "https://qfkwqfrnemqregjqxkcr.supabase.co/project/default/sql/new"
  fi

  echo ""
  echo -e "${YELLOW}Próximos passos:${NC}"
  echo "1. Copie o conteúdo de SUPABASE_SCHEMA_COMPLETO.sql"
  echo "2. Cole no SQL Editor"
  echo "3. Clique em 'Run'"
  echo "4. Volte aqui e execute: npm run db:seed:year"
  echo ""

elif [ "$choice" = "2" ]; then
  echo ""
  echo -e "${YELLOW}Você escolheu usar a CLI do Supabase${NC}"
  echo "Passos:"
  echo "1. npm install -g supabase"
  echo "2. supabase login"
  echo "3. supabase db push"
  echo ""
  echo "Mas primeiro você precisa:"
  echo "  • Ter um projeto Supabase inicializado localmente"
  echo "  • Ter as migrations em supabase/migrations/"
  echo ""
else
  echo -e "${RED}Opção inválida!${NC}"
  exit 1
fi
