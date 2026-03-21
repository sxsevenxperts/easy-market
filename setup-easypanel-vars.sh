#!/bin/bash

###############################################################################
# 🚀 SETUP WIZARD: Configurar Variáveis no EasyPanel
# Execute uma vez: bash setup-easypanel-vars.sh
###############################################################################

set -e  # Exit on error

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🚀 Easy Market - EasyPanel Setup Wizard               ║"
echo "║   Configure variáveis de ambiente automaticamente         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Defaults
DB_HOST="db.qfkwqfrnemqregjqxkcr.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="Jacyara.10davimaria"
DB_SSL="true"

echo -e "${BLUE}📋 PASSO 1: Verificar Acesso ao EasyPanel${NC}"
echo "Você precisa acessar: https://console.easypanel.io"
echo ""
read -p "Você tem acesso ao console.easypanel.io? (s/n): " has_access

if [[ ! "$has_access" =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Sem acesso ao console, não posso continuar.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔑 PASSO 2: Informações a Configurar${NC}"
echo ""
echo "As seguintes variáveis precisam ser adicionadas:"
echo ""
echo "  1. DB_HOST = $DB_HOST"
echo "  2. DB_PORT = $DB_PORT"
echo "  3. DB_NAME = $DB_NAME"
echo "  4. DB_USER = $DB_USER"
echo "  5. DB_PASSWORD = $DB_PASSWORD (⚠️ ROTACIONE DEPOIS)"
echo "  6. DB_SSL = $DB_SSL"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "1. No console do EasyPanel, vá em: Projeto → Environment → Variables"
echo "2. Clique em 'Add Variable' para cada uma acima"
echo "3. Copie exatamente (sem espaços)"
echo "4. Clique 'Save' / 'Apply'"
echo "5. Aguarde redeploy (2-3 minutos)"
echo ""

read -p "Já adicionou todas as 6 variáveis no EasyPanel? (s/n): " vars_added

if [[ ! "$vars_added" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}ℹ️  Abra https://console.easypanel.io e complete a configuração${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}⏳ PASSO 3: Aguardando Redeploy${NC}"
echo "O EasyPanel está reiniciando a aplicação..."
echo ""

# Wait for redeploy
sleep 5

echo -e "${BLUE}🔍 PASSO 4: Testando Conexão${NC}"
echo ""

# Test connection
MAX_ATTEMPTS=12
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "Tentativa $ATTEMPT/$MAX_ATTEMPTS... "
    
    RESPONSE=$(curl -s https://diversos-easymarket.yuhqmc.easypanel.host/health 2>/dev/null | grep -o '"database":"ok"' || echo "")
    
    if [[ ! -z "$RESPONSE" ]]; then
        echo -e "${GREEN}✅ CONECTADO!${NC}"
        break
    else
        echo -e "${YELLOW}aguardando...${NC}"
        sleep 10
    fi
done

if [[ $ATTEMPT -eq $MAX_ATTEMPTS ]]; then
    echo ""
    echo -e "${RED}❌ Timeout: Backend ainda não conectando ao banco${NC}"
    echo ""
    echo "Debug info:"
    curl -s https://diversos-easymarket.yuhqmc.easypanel.host/health | jq '.' 2>/dev/null || echo "Erro ao conectar"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ SUCESSO! Backend está online e conectado!         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📊 PASSO 5: Sincronizar Dados de Clientes${NC}"
echo ""

read -p "Deseja sincronizar dados de clientes agora? (s/n): " sync_data

if [[ "$sync_data" =~ ^[Ss]$ ]]; then
    echo "Sincronizando..."
    SYNC_RESPONSE=$(curl -s -X POST https://diversos-easymarket.yuhqmc.easypanel.host/api/v1/clientes/loja_001/sincronizar)
    echo "Resposta: $SYNC_RESPONSE"
    echo -e "${GREEN}✅ Sincronização iniciada!${NC}"
fi

echo ""
echo -e "${YELLOW}⚠️  PRÓXIMOS PASSOS (IMPORTANTE):${NC}"
echo ""
echo "1. 🔐 Rotacionar Senha do Supabase IMEDIATAMENTE:"
echo "   - Acesse: https://app.supabase.com"
echo "   - Settings → Database → Reset Password"
echo "   - Guarde a NOVA senha em local seguro"
echo ""
echo "2. 🔄 Atualizar Variáveis no EasyPanel:"
echo "   - Console → Projeto → Environment"
echo "   - Atualize DB_PASSWORD com a NOVA senha"
echo "   - Remova DB_PASSWORD de nixpacks.toml"
echo ""
echo "3. ✅ Testar Dashboard:"
echo "   - Abra: https://diversos-easymarket.yuhqmc.easypanel.host"
echo "   - Verifique métricas de fidelidade"
echo ""
echo "4. 📋 Commit de segurança:"
echo "   - git add nixpacks.toml"
echo "   - git commit -m 'security: remove DB credentials, use EasyPanel vars'"
echo "   - git push"
echo ""
echo -e "${GREEN}Pronto para começar! 🚀${NC}"
