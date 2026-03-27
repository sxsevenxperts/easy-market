#!/bin/bash

echo "🧪 TESTANDO SMART MARKET"
echo "========================"
echo ""

# Cor para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  
  echo -n "Testing $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$url")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✅ OK${NC} (HTTP $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Check if server is running
echo "Checking server..."

if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo -e "${RED}❌ Server not responding on localhost:3000${NC}"
  echo ""
  echo "Start with: cd /Users/sergioponte/easy-market && docker-compose up -d"
  exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Run tests
echo "Running endpoint tests..."
echo ""

test_endpoint "Health Check" "http://localhost:3000/health"
test_endpoint "Scheduler Status" "http://localhost:3000/api/v1/scheduler/status"
test_endpoint "Lojas" "http://localhost:3000/api/v1/lojas"
test_endpoint "Dashboard" "http://localhost:3000/api/v1/dashboard"
test_endpoint "RFM" "http://localhost:3000/api/v1/rfm"
test_endpoint "Alertas" "http://localhost:3000/api/v1/alertas"
test_endpoint "Inventário" "http://localhost:3000/api/v1/inventario"
test_endpoint "Vendas" "http://localhost:3000/api/v1/vendas"

echo ""
echo "================================"
echo "Results: ${GREEN}$TESTS_PASSED passed${NC} / ${RED}$TESTS_FAILED failed${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED - Ready to sell!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. Check logs:${NC}"
  echo "   docker logs easy-market-backend-1"
  exit 1
fi

