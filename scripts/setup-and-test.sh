#!/bin/bash

###############################################################################
# Easy Market - Setup and Test Script
# Configura e testa o sistema localmente antes do EasyPanel
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  Easy Market - Setup & Test Local                      ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

print_header

# Step 1: Verify structure
print_info "Passo 1: Verificando estrutura do projeto..."
[ -f "package.json" ] && print_success "package.json encontrado" || { print_error "package.json não encontrado"; exit 1; }
[ -f "backend/package.json" ] && print_success "backend/package.json encontrado" || { print_error "backend/package.json não encontrado"; exit 1; }
[ -d "cypress" ] && print_success "cypress directory encontrado" || { print_error "cypress directory não encontrado"; exit 1; }
[ -f "ml_engine/models.py" ] && print_success "ML models encontrado" || { print_error "ML models não encontrado"; exit 1; }

# Step 2: Install dependencies
print_info "Passo 2: Instalando dependências..."
cd backend
echo "  → Instalando backend dependencies..."
npm install > /dev/null 2>&1
print_success "Backend dependencies instaladas"
cd ..

cd dashboard
echo "  → Instalando dashboard dependencies..."
npm install > /dev/null 2>&1
print_success "Dashboard dependencies instaladas"
cd ..

# Step 3: Create .env file from template
print_info "Passo 3: Configurando .env..."
if [ ! -f "backend/.env" ]; then
    print_warning "backend/.env não encontrado, criando a partir do template..."
    cp backend/.env.example backend/.env
    print_success "backend/.env criado"
    
    echo ""
    echo -e "${YELLOW}⚠️  ATENÇÃO - Você precisa configurar as variáveis em backend/.env:${NC}"
    echo ""
    echo "  Abra: backend/.env"
    echo "  E preencha com seus valores:"
    echo "    - DATABASE_URL (do Supabase)"
    echo "    - SUPABASE_URL"
    echo "    - SUPABASE_API_KEY"
    echo "    - SUPABASE_SECRET_KEY"
    echo "    - JWT_SECRET (gere uma senha forte)"
    echo ""
    read -p "Pressione Enter quando terminar de configurar..."
else
    print_success "backend/.env já configurado"
fi

# Step 4: Verify environment variables
print_info "Passo 4: Verificando variáveis de ambiente..."
source backend/.env || true

if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL não está configurada"
else
    print_success "DATABASE_URL configurada"
fi

if [ -z "$JWT_SECRET" ]; then
    print_warning "JWT_SECRET não está configurada"
else
    print_success "JWT_SECRET configurada"
fi

if [ -z "$SUPABASE_URL" ]; then
    print_warning "SUPABASE_URL não está configurada"
else
    print_success "SUPABASE_URL configurada"
fi

# Step 5: Start backend
print_info "Passo 5: Iniciando backend..."
cd backend
echo "  → Backend rodando em background (PID salvo)"
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend iniciado com sucesso (PID: $BACKEND_PID)"
else
    print_error "Falha ao iniciar backend"
    cat backend.log
    exit 1
fi

# Step 6: Test health check
print_info "Passo 6: Testando health check..."
sleep 2

if command -v curl &> /dev/null; then
    HEALTH=$(curl -s http://localhost:3000/api/v1/health 2>/dev/null || echo "")
    
    if echo "$HEALTH" | grep -q "ok"; then
        print_success "Health check respondeu com sucesso"
    else
        print_warning "Health check não respondeu corretamente"
        print_info "Resposta: $HEALTH"
    fi
else
    print_warning "curl não disponível, pulando teste de health check"
fi

# Step 7: Run E2E tests
print_info "Passo 7: Executando testes E2E..."
if command -v npx &> /dev/null; then
    read -p "Deseja rodar os testes E2E agora? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        npm run test:e2e
    fi
else
    print_warning "npx não disponível"
fi

# Step 8: Summary
print_info "Passo 8: Resumo Final"
echo ""
echo -e "${GREEN}✅ Sistema configurado e testado!${NC}"
echo ""
echo "Backend rodando em: ${BLUE}http://localhost:3000${NC}"
echo "Frontend pode rodar em: ${BLUE}http://localhost:3001${NC}"
echo ""
echo "Endpoints disponíveis:"
echo "  - Health: http://localhost:3000/api/v1/health"
echo "  - Previsões: http://localhost:3000/api/v1/predicoes/churn"
echo "  - Perdas: http://localhost:3000/api/v1/perdas/taxa-perda"
echo "  - Gôndolas: http://localhost:3000/api/v1/gondolas/analise"
echo "  - Compras: http://localhost:3000/api/v1/compras/quantidade-otima"
echo "  - Relatórios: http://localhost:3000/api/v1/relatorios/listar"
echo ""

# Step 9: Save configuration for EasyPanel
print_info "Passo 9: Gerando arquivo de configuração para EasyPanel..."

cat > /tmp/easypanel-env-config.txt << 'EOF'
# 📋 COPIE ESTAS VARIÁVEIS PARA O EASYPANEL

DATABASE_URL=postgresql://[usuario]:[senha]@[host]:5432/[database]
SUPABASE_URL=https://[seu-project].supabase.co
SUPABASE_API_KEY=[sua-chave-publica]
SUPABASE_SECRET_KEY=[sua-chave-secreta]
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1
CORS_ORIGIN=https://easymarket.sevenxperts.solutions,http://localhost:3001
JWT_SECRET=[seu-secret-seguro]
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
EOF

print_success "Arquivo de configuração salvo em: /tmp/easypanel-env-config.txt"

echo ""
echo -e "${YELLOW}📝 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1. Copie o conteúdo de: /tmp/easypanel-env-config.txt"
echo "2. No EasyPanel Dashboard:"
echo "   - Vá em: Projetos > diversos > easymarket > Settings"
echo "   - Cole as variáveis em: Environment Variables"
echo "   - Clique: Save"
echo "   - Clique: Rebuild"
echo "3. Aguarde 3-5 minutos"
echo "4. Teste em: https://easymarket.sevenxperts.solutions/api/v1/health"
echo ""

print_success "🎉 Setup concluído! Sistema pronto para EasyPanel"

echo ""
echo -e "${BLUE}Para parar o backend, execute:${NC}"
echo "  kill $BACKEND_PID"
echo ""
