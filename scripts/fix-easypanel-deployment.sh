#!/bin/bash

###############################################################################
# Easy Market - EasyPanel Deployment Fix Script
# Diagnóstico e correção de problemas de deployment
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  Easy Market - EasyPanel Deployment Fix                ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_header

# Check if running in project root
if [ ! -f "package.json" ]; then
    print_error "package.json not found! Run from project root"
    exit 1
fi

print_section "📋 DIAGNÓSTICO DO DEPLOYMENT"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js encontrado: $NODE_VERSION"
else
    print_error "Node.js não encontrado!"
    exit 1
fi

# Check backend structure
print_info "Verificando estrutura do backend..."
if [ -f "backend/package.json" ]; then
    print_success "backend/package.json encontrado"
else
    print_error "backend/package.json não encontrado!"
    exit 1
fi

if [ -f "backend/src/server.js" ]; then
    print_success "backend/src/server.js encontrado"
else
    print_error "backend/src/server.js não encontrado!"
    exit 1
fi

# Check environment file
print_info "Verificando variáveis de ambiente..."
if [ -f "backend/.env" ]; then
    print_success "backend/.env encontrado"
    # Check for key variables
    if grep -q "DATABASE_URL" backend/.env; then
        print_success "DATABASE_URL configurada"
    else
        print_warning "DATABASE_URL não configurada em backend/.env"
    fi
    
    if grep -q "JWT_SECRET" backend/.env; then
        print_success "JWT_SECRET configurada"
    else
        print_warning "JWT_SECRET não configurada"
    fi
else
    print_warning "backend/.env não encontrado"
    print_info "Criando backend/.env a partir do template..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_success "backend/.env criado (configure com seus valores!)"
    fi
fi

print_section "🔧 VERIFICAÇÕES DE CÓDIGO"

# Check for dotenv in package.json
if grep -q '"dotenv"' backend/package.json; then
    print_success "dotenv está em backend/package.json"
else
    print_warning "dotenv não encontrado em backend/package.json"
    print_info "Adicionando dotenv..."
    cd backend
    npm install dotenv --save > /dev/null 2>&1
    cd ..
    print_success "dotenv instalado"
fi

# Check for supabase client
if grep -q '"@supabase/supabase-js"' backend/package.json; then
    print_success "@supabase/supabase-js está em backend/package.json"
else
    print_warning "@supabase/supabase-js não encontrado"
    print_info "Adicionando @supabase/supabase-js..."
    cd backend
    npm install @supabase/supabase-js --save > /dev/null 2>&1
    cd ..
    print_success "@supabase/supabase-js instalado"
fi

# Check for pdfkit
if grep -q '"pdfkit"' backend/package.json; then
    print_success "pdfkit está em backend/package.json"
else
    print_warning "pdfkit não encontrado"
    print_info "Adicionando pdfkit..."
    cd backend
    npm install pdfkit --save > /dev/null 2>&1
    cd ..
    print_success "pdfkit instalado"
fi

print_section "📦 INSTALAÇÃO DE DEPENDÊNCIAS"

print_info "Instalando dependências do backend..."
cd backend
npm install > /dev/null 2>&1
print_success "Dependências do backend instaladas"
cd ..

print_info "Instalando dependências do dashboard..."
cd dashboard
npm install > /dev/null 2>&1
print_success "Dependências do dashboard instaladas"
cd ..

print_section "✅ PASSOS FINAIS"

echo -e "${GREEN}Diagnóstico concluído!${NC}"
echo ""
echo "Para completar o fix:"
echo ""
echo "1. ${YELLOW}Configure as variáveis de ambiente:${NC}"
echo "   vim backend/.env"
echo ""
echo "2. ${YELLOW}Valores necessários:${NC}"
echo "   DATABASE_URL=postgresql://..."
echo "   SUPABASE_URL=https://..."
echo "   SUPABASE_API_KEY=..."
echo "   SUPABASE_SECRET_KEY=..."
echo "   JWT_SECRET=seu-secret-aqui"
echo ""
echo "3. ${YELLOW}Faça commit e push:${NC}"
echo "   git add backend/.env"
echo "   git commit -m 'fix: configurar environment variables'"
echo "   git push origin main"
echo ""
echo "4. ${YELLOW}No EasyPanel:${NC}"
echo "   - Vá em Settings"
echo "   - Configure as mesmas variáveis de ambiente"
echo "   - Clique em Rebuild"
echo "   - Aguarde 3-5 minutos"
echo ""
echo "5. ${YELLOW}Teste:${NC}"
echo "   curl https://easymarket.sevenxperts.solutions/api/v1/health"
echo ""

print_success "🎉 Script de fix concluído!"
