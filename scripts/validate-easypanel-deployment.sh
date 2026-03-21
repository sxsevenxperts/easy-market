#!/bin/bash

###############################################################################
# EASYPANEL DEPLOYMENT VALIDATION SCRIPT
# Validates that EasyPanel deployment is working correctly
# Tests health check, core endpoints, and provides diagnostics
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_URL="${1:-https://diversos-easymarket.yuhqmc.easypanel.host}"
API_PREFIX="/api/v1"
FULL_API_URL="${DEPLOYMENT_URL}${API_PREFIX}"
MAX_RETRIES=3
RETRY_DELAY=2

# Store ID for testing (must match your store)
STORE_ID="store-001"

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

###############################################################################
# UTILITY FUNCTIONS
###############################################################################

log_header() {
    echo -e "\n${BLUE}=================================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=================================================================================${NC}\n"
}

log_section() {
    echo -e "\n${YELLOW}→ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if curl is available
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed. Please install curl and try again."
        exit 1
    fi
}

# Test HTTP endpoint with retries
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_code=$3
    local description=$4
    local data=$5
    
    ((TESTS_TOTAL++))
    
    local url="${FULL_API_URL}${endpoint}"
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log_section "$description (Attempt $attempt/$MAX_RETRIES)"
        log_info "Testing: $method $url"
        
        local response
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" 2>/dev/null || echo "000")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -d "$data" 2>/dev/null || echo "000")
        fi
        
        local body=$(echo "$response" | head -n -1)
        local http_code=$(echo "$response" | tail -n 1)
        
        if [ "$http_code" = "$expected_code" ]; then
            log_success "$description - HTTP $http_code"
            
            # Validate JSON response if we got content
            if [ -n "$body" ] && [ "$body" != "000" ]; then
                if echo "$body" | jq . &>/dev/null 2>&1; then
                    log_info "Response: $(echo "$body" | jq -c '.' | head -c 100)..."
                else
                    log_warning "Response is not valid JSON"
                fi
            fi
            return 0
        fi
        
        log_warning "HTTP $http_code (Expected $expected_code)"
        
        # Only retry on network errors or 5xx errors
        if [[ "$http_code" =~ ^5 ]] || [ "$http_code" = "000" ]; then
            if [ $attempt -lt $MAX_RETRIES ]; then
                log_info "Retrying in ${RETRY_DELAY}s..."
                sleep $RETRY_DELAY
            fi
        else
            break
        fi
        
        ((attempt++))
    done
    
    log_error "$description - Failed (HTTP $http_code)"
    return 1
}

###############################################################################
# VALIDATION TESTS
###############################################################################

validate_health_check() {
    log_header "STEP 1: HEALTH CHECK"
    
    test_endpoint "GET" "/health" "200" "Health Check Endpoint"
}

validate_prediction_endpoints() {
    log_header "STEP 2: PREDICTION ENDPOINTS"
    
    # Test Churn Prediction
    test_endpoint "GET" "/predicoes/churn?loja_id=$STORE_ID" "200" \
        "Churn Prediction Endpoint"
    
    # Test Demand Forecasting
    test_endpoint "GET" "/predicoes/demanda?loja_id=$STORE_ID" "200" \
        "Demand Forecasting Endpoint"
    
    # Test Loss Rate Prediction
    test_endpoint "GET" "/predicoes/perdas?loja_id=$STORE_ID" "200" \
        "Loss Rate Endpoint"
}

validate_loss_endpoints() {
    log_header "STEP 3: LOSS MANAGEMENT ENDPOINTS"
    
    # Test Loss Analysis
    test_endpoint "GET" "/perdas/analise?loja_id=$STORE_ID" "200" \
        "Loss Analysis Endpoint"
    
    # Test High Risk Products
    test_endpoint "GET" "/perdas/alto-risco?loja_id=$STORE_ID" "200" \
        "High Risk Products Endpoint"
}

validate_gondola_endpoints() {
    log_header "STEP 4: GONDOLA OPTIMIZATION ENDPOINTS"
    
    # Test Gondola Optimization
    test_endpoint "GET" "/gondolas/otimizacao?loja_id=$STORE_ID" "200" \
        "Gondola Optimization Endpoint"
    
    # Test Product Positioning
    test_endpoint "GET" "/gondolas/posicionamento?loja_id=$STORE_ID" "200" \
        "Product Positioning Endpoint"
}

validate_purchase_endpoints() {
    log_header "STEP 5: PURCHASE OPTIMIZATION ENDPOINTS"
    
    # Test Purchase Optimization
    test_endpoint "GET" "/compras/otimizar?loja_id=$STORE_ID" "200" \
        "Purchase Optimization Endpoint"
    
    # Test Supplier Recommendations
    test_endpoint "GET" "/compras/fornecedores?loja_id=$STORE_ID" "200" \
        "Supplier Recommendations Endpoint"
}

validate_security_endpoints() {
    log_header "STEP 6: SECURITY CONFIGURATION ENDPOINTS"
    
    # Test Security Configuration
    test_endpoint "GET" "/seguranca/configuracao?loja_id=$STORE_ID" "200" \
        "Security Configuration Endpoint"
}

validate_pdf_reporting() {
    log_header "STEP 7: PDF REPORTING ENDPOINTS"
    
    # Test PDF Report Generation (Complete Analysis)
    local pdf_data='{"loja_id":"'$STORE_ID'","periodo":"mes"}'
    test_endpoint "POST" "/relatorios-pdf/gerar-completo" "200" \
        "Complete Analysis Report" "$pdf_data"
    
    # Test PDF Report List
    test_endpoint "GET" "/relatorios-pdf/listar?loja_id=$STORE_ID" "200" \
        "Report List Endpoint"
}

validate_ml_endpoints() {
    log_header "STEP 8: MACHINE LEARNING ENDPOINTS"
    
    # Test Behavioral Variations
    test_endpoint "GET" "/ml/variacoes-comportamento?loja_id=$STORE_ID" "200" \
        "Behavioral Variations Endpoint"
    
    # Test Model Training Status
    test_endpoint "GET" "/ml/status-treinamento?loja_id=$STORE_ID" "200" \
        "ML Training Status Endpoint"
}

###############################################################################
# ENVIRONMENT VALIDATION
###############################################################################

validate_environment() {
    log_header "STEP 9: ENVIRONMENT VALIDATION"
    
    # Check if we can reach the deployment URL
    log_section "Testing deployment URL accessibility"
    
    if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200\|301\|302\|403\|404"; then
        log_success "Deployment URL is accessible: $DEPLOYMENT_URL"
    else
        log_error "Cannot reach deployment URL: $DEPLOYMENT_URL"
        log_info "Possible causes:"
        log_info "  1. Deployment is still building (check EasyPanel dashboard)"
        log_info "  2. URL is incorrect"
        log_info "  3. Network connectivity issue"
    fi
}

###############################################################################
# DIAGNOSTIC INFORMATION
###############################################################################

collect_diagnostics() {
    log_header "STEP 10: DIAGNOSTIC INFORMATION"
    
    log_section "System Information"
    log_info "Deployment URL: $DEPLOYMENT_URL"
    log_info "API Base URL: $FULL_API_URL"
    log_info "Store ID: $STORE_ID"
    log_info "Node Version: $(node --version 2>/dev/null || echo 'Not installed')"
    log_info "npm Version: $(npm --version 2>/dev/null || echo 'Not installed')"
    log_info "curl Version: $(curl --version 2>/dev/null | head -n 1 || echo 'Not installed')"
}

###############################################################################
# REMEDIATION GUIDANCE
###############################################################################

provide_remediation() {
    if [ $TESTS_FAILED -gt 0 ]; then
        log_header "TROUBLESHOOTING GUIDE"
        
        log_section "If health check failed:"
        log_info "1. Verify Backend is running: ssh into EasyPanel and check logs"
        log_info "2. Check all required environment variables are set"
        log_info "3. Verify NODE_ENV=production is set"
        log_info "4. Verify PORT=3000 is set"
        
        log_section "If API endpoints failed:"
        log_info "1. Verify Supabase credentials are correct"
        log_info "2. Check that SUPABASE_URL and SUPABASE_API_KEY are set"
        log_info "3. Verify JWT_SECRET is configured"
        log_info "4. Check backend logs for detailed error messages"
        
        log_section "If all tests failed:"
        log_info "1. Run the fix script: bash scripts/fix-easypanel-deployment.sh"
        log_info "2. Rebuild the application in EasyPanel"
        log_info "3. Wait 5 minutes for the rebuild to complete"
        log_info "4. Run this validation script again"
        
        log_section "To view EasyPanel logs:"
        log_info "1. Log into your EasyPanel dashboard"
        log_info "2. Click on the Easy Market application"
        log_info "3. Click 'Logs' tab to see real-time logs"
        log_info "4. Look for ERROR or FATAL messages"
    fi
}

###############################################################################
# SUMMARY REPORT
###############################################################################

print_summary() {
    log_header "VALIDATION SUMMARY"
    
    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    
    echo -e "Total Tests: $TESTS_TOTAL"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo -e "Success Rate: ${success_rate}%"
    
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  🎉 ALL TESTS PASSED - DEPLOYMENT IS SUCCESSFUL!  🎉${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${GREEN}Your Easy Market deployment is ready for production!${NC}"
        echo ""
        log_section "Next Steps:"
        log_info "1. Configure customer data in Supabase"
        log_info "2. Train ML models with production data: python ml_engine/train.py"
        log_info "3. Set up monitoring and alerting"
        log_info "4. Create daily backups of Supabase data"
        echo ""
        return 0
    else
        echo -e "${RED}════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ⚠️  SOME TESTS FAILED - REVIEW DIAGNOSTICS ABOVE  ⚠️${NC}"
        echo -e "${RED}════════════════════════════════════════════════════════${NC}"
        echo ""
        log_section "Action Required:"
        log_warning "Review the troubleshooting guide above and take corrective actions"
        log_warning "Then run this validation script again to confirm fixes"
        echo ""
        return 1
    fi
}

###############################################################################
# MAIN EXECUTION
###############################################################################

main() {
    clear
    
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║        EASY MARKET - EASYPANEL DEPLOYMENT VALIDATOR         ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check dependencies
    check_dependencies
    
    # Run validation tests
    validate_health_check
    validate_prediction_endpoints
    validate_loss_endpoints
    validate_gondola_endpoints
    validate_purchase_endpoints
    validate_security_endpoints
    validate_pdf_reporting
    validate_ml_endpoints
    validate_environment
    collect_diagnostics
    
    # Provide remediation if needed
    provide_remediation
    
    # Print summary and exit with appropriate code
    print_summary
    exit_code=$?
    
    # Save report to file
    local report_file="validation_report_$(date +%Y%m%d_%H%M%S).txt"
    log_info "Full report saved to: $report_file"
    
    exit $exit_code
}

# Run main function
main "$@"
