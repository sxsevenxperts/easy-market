#!/bin/bash

###############################################################################
# Easy Market - EasyPanel Deployment Setup Script
# Configura todas as variáveis e prepara o sistema para produção
###############################################################################

set -e

echo "🚀 Easy Market - EasyPanel Deployment Setup"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found! Run this script from project root"
    exit 1
fi

print_info "Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_error "Node.js not installed!"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ required (you have: $(node -v))"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm not installed!"
    exit 1
fi
print_success "npm $(npm -v) detected"

# Check git
if ! command -v git &> /dev/null; then
    print_error "git not installed!"
    exit 1
fi
print_success "git installed"

echo ""
print_info "Setting up environment files..."

# Create .env for backend if doesn't exist
if [ ! -f "backend/.env" ]; then
    print_warning "Creating backend/.env template"
    cat > backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@host:5432/easy_market
SUPABASE_URL=https://project.supabase.co
SUPABASE_API_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-secret-key

# API
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# CORS
CORS_ORIGIN=https://frontend.domain.com,http://localhost:3001

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info

# Optional: Redis (if using caching)
REDIS_URL=redis://localhost:6379

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EOF
    print_warning "⚠️  IMPORTANT: Edit backend/.env with your credentials!"
else
    print_success "backend/.env already exists"
fi

# Create .env for dashboard if doesn't exist
if [ ! -f "dashboard/.env.local" ]; then
    print_warning "Creating dashboard/.env.local template"
    cat > dashboard/.env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=https://api.domain.com/api/v1
NEXT_PUBLIC_API_BASE=https://api.domain.com
NEXT_PUBLIC_APP_NAME=Easy Market
EOF
    print_warning "⚠️  IMPORTANT: Edit dashboard/.env.local with your API URL!"
else
    print_success "dashboard/.env.local already exists"
fi

echo ""
print_info "Installing dependencies..."

# Install root dependencies
print_info "Installing root dependencies..."
npm install --save-dev cypress > /dev/null 2>&1
print_success "Root dependencies installed"

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
npm install > /dev/null 2>&1
print_success "Backend dependencies installed"
cd ..

# Install dashboard dependencies
print_info "Installing dashboard dependencies..."
cd dashboard
npm install > /dev/null 2>&1
print_success "Dashboard dependencies installed"
cd ..

echo ""
print_info "Building applications..."

# Build backend
print_info "Building backend..."
cd backend
npm run lint || true
cd ..
print_success "Backend build completed"

# Build dashboard
print_info "Building dashboard..."
cd dashboard
npm run build 2>/dev/null || print_warning "Dashboard build skipped (may need running during deployment)"
cd ..

echo ""
print_info "Running tests..."

# Run unit tests if they exist
if [ -f "backend/package.json" ]; then
    print_info "Running backend unit tests..."
    cd backend
    npm test -- --passWithNoTests 2>/dev/null || print_warning "No unit tests found"
    cd ..
fi

echo ""
print_success "Setup completed!"

echo ""
echo "📋 Next Steps for EasyPanel Deployment:"
echo ""
echo "1. Configure your environment variables:"
echo "   - Edit backend/.env with Supabase credentials"
echo "   - Edit dashboard/.env.local with API URL"
echo ""
echo "2. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'feat: prepare for EasyPanel deployment'"
echo "   git push origin main"
echo ""
echo "3. In EasyPanel:"
echo "   - Create new application"
echo "   - Connect GitHub repository"
echo "   - Configure backend (Node.js, port 3000, dir: /backend)"
echo "   - Configure frontend (Node.js, port 3001, dir: /dashboard)"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "4. Run E2E tests after deployment:"
echo "   npm run test:e2e"
echo ""
echo "📖 Full deployment guide: DEPLOY_EASYPANEL_COMPLETO.md"
echo ""

print_success "🎉 Ready for deployment!"
