#!/usr/bin/env bash
# ============================================================
# Easy Market — EasyPanel Deployment Script
# ============================================================
# Usage: ./scripts/deploy-easypanel.sh [--tag <version>]
# ============================================================

set -euo pipefail

# --------------------------------------------------------
# Configuration
# --------------------------------------------------------
APP_NAME="easy-market"
DEFAULT_TAG="3.0.0"
IMAGE_NAME="${APP_NAME}-backend"
ENV_FILE=".env"

# Parse optional --tag argument
TAG="${DEFAULT_TAG}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag) TAG="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# --------------------------------------------------------
# Colors for output
# --------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --------------------------------------------------------
# Step 1: Validate .env file and required variables
# --------------------------------------------------------
validate_env() {
  log_info "Validating environment file..."

  if [[ ! -f "${ENV_FILE}" ]]; then
    log_error ".env file not found. Copy .env.example to .env and fill in the values."
    exit 1
  fi

  REQUIRED_VARS=(
    "SUPABASE_URL"
    "SUPABASE_SERVICE_KEY"
    "JWT_SECRET"
    "PORT"
  )

  local missing=0
  for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -qE "^${var}=.+" "${ENV_FILE}"; then
      log_error "Required variable '${var}' is missing or empty in ${ENV_FILE}"
      missing=$((missing + 1))
    fi
  done

  if [[ $missing -gt 0 ]]; then
    log_error "${missing} required variable(s) missing. Aborting."
    exit 1
  fi

  log_success ".env validation passed."
}

# --------------------------------------------------------
# Step 2: Syntax check
# --------------------------------------------------------
syntax_check() {
  log_info "Running Node.js syntax check on src/index.js..."

  if ! node --check backend/src/index.js 2>&1; then
    log_error "Syntax check failed. Fix the errors above before deploying."
    exit 1
  fi

  log_success "Syntax check passed."
}

# --------------------------------------------------------
# Step 3: Build Docker image
# --------------------------------------------------------
build_image() {
  log_info "Building Docker image '${IMAGE_NAME}:${TAG}'..."

  docker build \
    --file Dockerfile \
    --target production \
    --tag "${IMAGE_NAME}:${TAG}" \
    --tag "${IMAGE_NAME}:latest" \
    --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --build-arg VERSION="${TAG}" \
    .

  log_success "Image built: ${IMAGE_NAME}:${TAG}"
}

# --------------------------------------------------------
# Step 4: Tag image with version
# --------------------------------------------------------
tag_image() {
  log_info "Tagging image as '${IMAGE_NAME}:${TAG}'..."
  docker tag "${IMAGE_NAME}:${TAG}" "${IMAGE_NAME}:${TAG}"
  log_success "Image tagged successfully."
}

# --------------------------------------------------------
# Step 5: Print EasyPanel deployment instructions
# --------------------------------------------------------
print_instructions() {
  echo ""
  echo -e "${GREEN}============================================================${NC}"
  echo -e "${GREEN}  Easy Market v${TAG} — EasyPanel Deployment Instructions${NC}"
  echo -e "${GREEN}============================================================${NC}"
  echo ""
  echo -e "${BLUE}1. Acesse seu painel EasyPanel${NC}"
  echo "   https://seu-servidor:3000"
  echo ""
  echo -e "${BLUE}2. Crie ou selecione o projeto 'easy-market'${NC}"
  echo "   Apps > New App > Docker Image"
  echo ""
  echo -e "${BLUE}3. Configure a imagem${NC}"
  echo "   Image: ${IMAGE_NAME}:${TAG}"
  echo "   Port:  3000"
  echo ""
  echo -e "${BLUE}4. Adicione as variáveis de ambiente${NC}"
  echo "   (copie do arquivo .env ou defina manualmente no painel)"
  echo ""
  echo -e "${BLUE}5. Configure o domínio e SSL${NC}"
  echo "   Domains > Add Domain > Enable HTTPS (Let's Encrypt)"
  echo ""
  echo -e "${BLUE}6. Clique em 'Deploy'${NC}"
  echo ""
}

# --------------------------------------------------------
# Step 6: Rollback instructions
# --------------------------------------------------------
print_rollback() {
  echo -e "${YELLOW}============================================================${NC}"
  echo -e "${YELLOW}  Instruções de Rollback${NC}"
  echo -e "${YELLOW}============================================================${NC}"
  echo ""
  echo "  Em caso de falha, para reverter para a versão anterior:"
  echo ""
  echo "  1. No EasyPanel, vá em Apps > easy-market > Deployments"
  echo "  2. Localize o deploy anterior na lista"
  echo "  3. Clique em 'Redeploy' no deployment anterior"
  echo ""
  echo "  Ou via linha de comando (se usar registry privado):"
  echo "  docker tag ${IMAGE_NAME}:<versão-anterior> ${IMAGE_NAME}:latest"
  echo "  docker push ${IMAGE_NAME}:latest"
  echo ""
  echo -e "${YELLOW}  Versão atual: ${TAG}${NC}"
  echo ""
}

# --------------------------------------------------------
# Main execution
# --------------------------------------------------------
main() {
  echo ""
  log_info "Starting Easy Market deployment pipeline — v${TAG}"
  echo ""

  validate_env
  syntax_check
  build_image
  tag_image
  print_instructions
  print_rollback

  log_success "Pipeline concluído. Siga as instruções acima para finalizar o deploy no EasyPanel."
  echo ""
}

main "$@"
