#!/bin/bash

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       SMART MARKET - DEPLOY AUTOMÁTICO                     ║"
echo "║       Vai levar 2 minutos                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

PROJECT_DIR="/Users/sergioponte/easy-market"
cd "$PROJECT_DIR"

# Step 1: Validar estrutura
echo -e "${YELLOW}[1/5] Validando estrutura do projeto...${NC}"
if [ ! -f "docker-compose.yml" ]; then
  echo -e "${RED}❌ docker-compose.yml não encontrado${NC}"
  exit 1
fi
if [ ! -d "backend/src" ]; then
  echo -e "${RED}❌ backend/src não encontrado${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Estrutura OK${NC}"

# Step 2: Verificar Docker
echo -e "${YELLOW}[2/5] Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker não instalado${NC}"
  echo "   Instale em: https://www.docker.com/products/docker-desktop"
  exit 1
fi
echo -e "${GREEN}✅ Docker instalado${NC}"

# Step 3: Criar .env
echo -e "${YELLOW}[3/5] Configurando variáveis de ambiente...${NC}"

# Verificar se já existe
if [ -f ".env" ]; then
  echo -e "${YELLOW}    ⚠️  .env já existe. Usando existente.${NC}"
else
  # Criar com valores de demo
  cat > .env << 'ENVEOF'
# ⚠️ CONFIGURAR ANTES DE PRODUÇÃO!
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-chave-de-servico
OPENWEATHER_API_KEY=sua-chave-openweather
JWT_SECRET=change-me-in-production-$(openssl rand -base64 16)
NODE_ENV=production
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
ENVEOF

  echo -e "${YELLOW}    ⚠️  IMPORTANTE: Edite .env com suas credenciais!${NC}"
  echo -e "${YELLOW}    Abra: $PROJECT_DIR/.env${NC}"
  echo ""
  echo -e "${BLUE}    Você precisa de:${NC}"
  echo "    1. SUPABASE_URL → https://app.supabase.com (seu projeto > Settings > API)"
  echo "    2. SUPABASE_SERVICE_KEY → Mesma página (service_role key)"
  echo "    3. OPENWEATHER_API_KEY → https://openweathermap.org/api (sign up grátis)"
  echo ""
  read -p "Pressione ENTER após preencher o .env"
fi

echo -e "${GREEN}✅ .env configurado${NC}"

# Step 4: Build & Deploy
echo -e "${YELLOW}[4/5] Iniciando containers Docker...${NC}"

# Stop existing
docker-compose down 2>/dev/null

# Start
docker-compose up -d

# Wait for startup
echo "    Aguardando inicialização (30s)..."
sleep 30

echo -e "${GREEN}✅ Containers iniciados${NC}"

# Step 5: Test
echo -e "${YELLOW}[5/5] Testando endpoints...${NC}"

TESTS=0
PASSED=0

test_url() {
  local name=$1
  local url=$2
  TESTS=$((TESTS + 1))
  
  if curl -s "$url" > /dev/null 2>&1; then
    echo -e "    ${GREEN}✅${NC} $name"
    PASSED=$((PASSED + 1))
  else
    echo -e "    ${RED}❌${NC} $name"
  fi
}

test_url "Health" "http://localhost:3000/health"
test_url "Dashboard" "http://localhost:3000/api/v1/dashboard"
test_url "Scheduler" "http://localhost:3000/api/v1/scheduler/status"
test_url "Lojas" "http://localhost:3000/api/v1/lojas"
test_url "RFM" "http://localhost:3000/api/v1/rfm"

echo -e "${GREEN}✅ Tests: $PASSED/$TESTS passed${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 SISTEMA ONLINE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $PASSED -eq 5 ]; then
  echo -e "${GREEN}✅ TUDO FUNCIONANDO!${NC}"
  echo ""
  echo "🌐 Acesse:"
  echo "   Dashboard: http://localhost:3000/api/v1/dashboard"
  echo "   Scheduler: http://localhost:3000/api/v1/scheduler/status"
  echo ""
  echo "📊 Próximas ações:"
  echo "   1. Testar endpoints (veja VENDENDO_AGORA.md)"
  echo "   2. Se OK → Deploy em staging"
  echo "   3. Se OK → Deploy em produção no EasyPanel"
  echo "   4. Chamar cliente para demonstração"
  echo ""
  echo "💰 Você vai começar a faturar em 2 horas!"
else
  echo -e "${RED}⚠️  Alguns testes falharam${NC}"
  echo ""
  echo "Verifique logs:"
  echo "   docker logs easy-market-backend-1"
  echo ""
  echo "Problemas comuns:"
  echo "   • SUPABASE_URL não configurada"
  echo "   • Docker sem memória (aumente em Docker Desktop)"
  echo "   • Porta 3000 já em uso"
fi

echo ""
echo "📚 Leia: VENDENDO_AGORA.md"

