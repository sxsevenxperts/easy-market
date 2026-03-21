#!/bin/bash

# Script completo para setup de analytics de clientes
# Uso: bash setup-analytics.sh

set -e

echo "🚀 Easy Market - Setup de Analytics de Clientes"
echo "================================================\n"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "backend/src/migrations/008_add_customer_analytics.sql" ]; then
    echo -e "${RED}✗ Erro: execute este script da raiz do projeto Easy Market${NC}"
    echo "   Esperado: $(pwd)/backend/src/migrations/008_add_customer_analytics.sql"
    exit 1
fi

# Verificar credenciais
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}\n"
    echo "Configure as credenciais do Supabase:"
    echo ""
    read -p "DB_HOST (ex: db.xxxxx.supabase.co): " DB_HOST
    read -p "DB_USER (ex: postgres): " DB_USER
    read -s -p "DB_PASSWORD: " DB_PASSWORD
    echo ""
    read -p "DB_NAME (ex: postgres): " DB_NAME
    read -p "DB_PORT (ex: 5432): " DB_PORT
    
    cat > .env << EOF
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=$DB_PORT
EOF
    echo -e "${GREEN}✓ Arquivo .env criado${NC}\n"
fi

# Carregar variáveis
export $(cat .env | xargs)

# Passo 1: Rodar migração
echo -e "${BLUE}[1/3] Aplicando migração de banco de dados...${NC}\n"

if [ ! -f "apply-migration.js" ]; then
    echo -e "${RED}✗ Arquivo apply-migration.js não encontrado${NC}"
    exit 1
fi

if ! node apply-migration.js; then
    echo -e "${RED}✗ Erro ao aplicar migração${NC}"
    exit 1
fi

echo ""

# Passo 2: Aguardar backend
echo -e "${BLUE}[2/3] Aguardando backend estar online...${NC}"

BACKEND_URL="https://diversos-easymarket.yuhqmc.easypanel.host"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend online${NC}\n"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "\n${YELLOW}⚠️  Backend não respondeu após 60 segundos${NC}"
    echo "O backend pode estar ainda iniciando. Tente novamente em alguns minutos."
    exit 1
fi

# Passo 3: Sincronizar dados
echo -e "${BLUE}[3/3] Sincronizando dados de clientes...${NC}\n"

SYNC_RESPONSE=$(curl -s -X POST \
    "$BACKEND_URL/api/v1/clientes/loja_001/sincronizar" \
    -H "Content-Type: application/json")

if echo "$SYNC_RESPONSE" | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Resposta do servidor:${NC}"
    echo "$SYNC_RESPONSE"
else
    echo -e "${GREEN}✓ Sincronização iniciada${NC}"
    echo "Resposta: $SYNC_RESPONSE\n"
fi

# Resumo final
echo -e "${GREEN}✅ Setup concluído!${NC}\n"
echo "Próximos passos:"
echo "1. Acesse o dashboard: $BACKEND_URL"
echo "2. Você deve ver 4 novos cards de fidelidade"
echo "3. Para sincronizar outras lojas, execute:"
echo "   curl -X POST $BACKEND_URL/api/v1/clientes/{loja_id}/sincronizar"
echo ""
