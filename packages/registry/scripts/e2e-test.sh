#!/bin/bash
# Comprehensive E2E Test Suite for PRPM Registry
# Tests all critical functionality with Docker infrastructure

set -e

BASE_URL="http://localhost:4000"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 PRPM Registry End-to-End Test Suite"
echo "========================================"
echo ""
echo "📍 Testing against: $BASE_URL"
echo ""

# Helper function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local description="$5"

    echo -n "Testing: $description... "

    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected HTTP $expected_status, got $status_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Health Check
test_endpoint "health" "GET" "/health" "200" "Health endpoint"

# Test 2: API Documentation
test_endpoint "swagger" "GET" "/docs" "200" "Swagger documentation"

# Test 3: List Packages
test_endpoint "packages_list" "GET" "/api/v1/packages?limit=10" "200" "List packages with limit"

# Test 4: Search Packages
test_endpoint "search" "GET" "/api/v1/search?q=test&limit=5" "200" "Search packages"

# Test 5: Get Trending Packages
test_endpoint "trending" "GET" "/api/v1/packages/trending?limit=5" "200" "Get trending packages"

# Test 6: Get Popular Packages
test_endpoint "popular" "GET" "/api/v1/packages/popular?limit=5" "200" "Get popular packages"

# Test 7: Search Tags
test_endpoint "tags" "GET" "/api/v1/search/tags" "200" "List all tags"

# Test 8: Search Categories
test_endpoint "categories" "GET" "/api/v1/search/categories" "200" "List all categories"

# Test 9: Get Non-Existent Package (should 404)
test_endpoint "not_found" "GET" "/api/v1/packages/nonexistent-package-xyz" "404" "Get non-existent package (expect 404)"

# Test 10: Invalid Search (missing query)
test_endpoint "invalid_search" "GET" "/api/v1/search" "400" "Search without query parameter (expect 400)"

# Test 11: List Collections
test_endpoint "collections" "GET" "/api/v1/collections?limit=5" "200" "List collections"

# Test 12: Security Headers Check
echo -n "Testing: Security headers present... "
headers=$(curl -s -I "$BASE_URL/health")
has_security_headers=0

if echo "$headers" | grep -q "X-Content-Type-Options"; then
    if echo "$headers" | grep -q "X-Frame-Options"; then
        if echo "$headers" | grep -q "Strict-Transport-Security"; then
            echo -e "${GREEN}✅ PASS${NC}"
            ((PASSED++))
            has_security_headers=1
        fi
    fi
fi

if [ $has_security_headers -eq 0 ]; then
    echo -e "${RED}❌ FAIL${NC} (Missing security headers)"
    ((FAILED++))
fi

# Test 13: Rate Limiting Headers
echo -n "Testing: Rate limit headers present... "
rate_headers=$(curl -s -I "$BASE_URL/health")
if echo "$rate_headers" | grep -q "x-ratelimit-limit"; then
    if echo "$rate_headers" | grep -q "x-ratelimit-remaining"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Missing x-ratelimit-remaining)"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ FAIL${NC} (Missing x-ratelimit-limit)"
    ((FAILED++))
fi

# Test 14: Check MinIO is accessible
echo -n "Testing: MinIO storage accessible... "
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test 15: Check Redis is accessible
echo -n "Testing: Redis cache accessible... "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  SKIP${NC} (redis-cli not available)"
fi

echo ""
echo "========================================"
echo "📊 Test Results"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
