#!/bin/bash
# Comprehensive End-to-End Testing Script for PRPM

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Registry URL
REGISTRY_URL="http://localhost:4000"

# Helper functions
test_start() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${BLUE}[TEST $TESTS_TOTAL]${NC} $1"
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓ PASSED${NC}: $1\n"
}

test_fail() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAILED${NC}: $1"
    echo -e "${RED}Error: $2${NC}\n"
}

echo "========================================"
echo "  PRPM Comprehensive E2E Test Suite"
echo "========================================"
echo ""

# ============================================
# PART 1: UNIT TESTS
# ============================================
echo -e "${YELLOW}═══ PART 1: Unit Tests ═══${NC}"
echo ""

test_start "CLI Package Unit Tests"
if npm test --workspace=@prpm/cli > /tmp/cli-tests.log 2>&1; then
    CLI_TESTS=$(cat /tmp/cli-tests.log | grep "Tests:" | awk '{print $2}')
    test_pass "CLI tests - $CLI_TESTS tests passed"
else
    test_fail "CLI unit tests" "See /tmp/cli-tests.log"
fi

test_start "Registry Client Unit Tests"
if npm test --workspace=@prpm/registry-client > /tmp/client-tests.log 2>&1; then
    CLIENT_TESTS=$(cat /tmp/client-tests.log | grep "Tests:" | awk '{print $2}')
    test_pass "Registry Client tests - $CLIENT_TESTS tests passed"
else
    test_fail "Registry Client unit tests" "See /tmp/client-tests.log"
fi

# ============================================
# PART 2: API ENDPOINT TESTS
# ============================================
echo -e "${YELLOW}═══ PART 2: API Endpoint Tests ═══${NC}"
echo ""

test_start "Health Check Endpoint"
HEALTH=$(curl -s $REGISTRY_URL/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    test_pass "Health endpoint responding correctly"
else
    test_fail "Health endpoint" "Got: $HEALTH"
fi

test_start "Search Packages Endpoint"
SEARCH_RESULT=$(curl -s "$REGISTRY_URL/api/v1/search?q=cursor&limit=5")
if echo "$SEARCH_RESULT" | grep -q '"results"'; then
    COUNT=$(echo "$SEARCH_RESULT" | jq '.results | length')
    test_pass "Search endpoint - returned $COUNT results"
else
    test_fail "Search endpoint" "Invalid response"
fi

test_start "Get Packages List"
PACKAGES=$(curl -s "$REGISTRY_URL/api/v1/packages?limit=10")
if echo "$PACKAGES" | grep -q '"packages"'; then
    COUNT=$(echo "$PACKAGES" | jq '.packages | length')
    test_pass "Packages list - returned $COUNT packages"
else
    test_fail "Packages list" "Invalid response"
fi

test_start "Get Trending Packages"
TRENDING=$(curl -s "$REGISTRY_URL/api/v1/packages/trending?limit=5")
if echo "$TRENDING" | grep -q '"packages"'; then
    COUNT=$(echo "$TRENDING" | jq '.packages | length')
    test_pass "Trending packages - returned $COUNT packages"
else
    test_fail "Trending packages" "Invalid response"
fi

test_start "Get Collections"
COLLECTIONS=$(curl -s "$REGISTRY_URL/api/v1/collections?limit=5")
if echo "$COLLECTIONS" | grep -q '"collections"'; then
    COUNT=$(echo "$COLLECTIONS" | jq '.collections | length')
    test_pass "Collections - returned $COUNT collections"
else
    test_fail "Collections endpoint" "Invalid response"
fi

test_start "Search with Type Filter"
SEARCH_CURSOR=$(curl -s "$REGISTRY_URL/api/v1/search?q=test&type=cursor&limit=5")
if echo "$SEARCH_CURSOR" | grep -q '"results"'; then
    test_pass "Search with type filter works"
else
    test_fail "Search with type filter" "Invalid response"
fi

test_start "Security Headers"
HEADERS=$(curl -sI $REGISTRY_URL/health)
if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    test_pass "Security headers present"
else
    test_fail "Security headers" "Missing X-Content-Type-Options"
fi

test_start "Rate Limiting Headers"
RATE_HEADERS=$(curl -sI $REGISTRY_URL/health)
if echo "$RATE_HEADERS" | grep -q "x-ratelimit-limit"; then
    LIMIT=$(echo "$RATE_HEADERS" | grep "x-ratelimit-limit" | awk '{print $2}' | tr -d '\r')
    test_pass "Rate limiting active - limit: $LIMIT"
else
    test_fail "Rate limiting" "No rate limit headers"
fi

# ============================================
# PART 3: CLI FUNCTIONALITY TESTS
# ============================================
echo -e "${YELLOW}═══ PART 3: CLI Functionality Tests ═══${NC}"
echo ""

CLI_PATH="./packages/cli/dist/index.js"

test_start "CLI Help Command"
if node $CLI_PATH --help > /tmp/cli-help.log 2>&1; then
    test_pass "CLI help displays correctly"
else
    test_fail "CLI help" "Command failed"
fi

test_start "CLI Search Command"
if node $CLI_PATH search cursor --limit 5 > /tmp/cli-search.log 2>&1; then
    if grep -q "Found" /tmp/cli-search.log; then
        test_pass "CLI search command works"
    else
        test_fail "CLI search" "No results found"
    fi
else
    test_fail "CLI search" "Command failed"
fi

test_start "CLI Search with Type Filter"
if node $CLI_PATH search test --type cursor --limit 3 > /tmp/cli-search-type.log 2>&1; then
    test_pass "CLI search with type filter works"
else
    test_fail "CLI search with type" "Command failed"
fi

test_start "CLI Trending Command"
if node $CLI_PATH trending --limit 5 > /tmp/cli-trending.log 2>&1; then
    if grep -q "Trending" /tmp/cli-trending.log || grep -q "packages" /tmp/cli-trending.log; then
        test_pass "CLI trending command works"
    else
        test_fail "CLI trending" "No output"
    fi
else
    test_fail "CLI trending" "Command failed"
fi

test_start "CLI Popular Command"
if node $CLI_PATH popular --limit 5 > /tmp/cli-popular.log 2>&1; then
    test_pass "CLI popular command works"
else
    test_fail "CLI popular" "Command failed"
fi

test_start "CLI Collections List"
if node $CLI_PATH collections --limit 5 > /tmp/cli-collections.log 2>&1; then
    if grep -q -E "(collections|Collection)" /tmp/cli-collections.log; then
        test_pass "CLI collections list works"
    else
        test_fail "CLI collections" "No collections output"
    fi
else
    test_fail "CLI collections" "Command failed"
fi

test_start "CLI Collections Official Filter"
if node $CLI_PATH collections --official > /tmp/cli-collections-official.log 2>&1; then
    test_pass "CLI collections official filter works"
else
    test_fail "CLI collections official" "Command failed"
fi

test_start "CLI Collections by Category"
if node $CLI_PATH collections --category development > /tmp/cli-collections-cat.log 2>&1; then
    test_pass "CLI collections category filter works"
else
    test_fail "CLI collections category" "Command failed"
fi

# ============================================
# PART 4: DATA INTEGRITY TESTS
# ============================================
echo -e "${YELLOW}═══ PART 4: Data Integrity Tests ═══${NC}"
echo ""

test_start "Package Data Structure"
PACKAGE_DATA=$(curl -s "$REGISTRY_URL/api/v1/packages?limit=1")
if echo "$PACKAGE_DATA" | jq -e '.packages[0] | has("id") and has("name") and has("description")' > /dev/null 2>&1; then
    test_pass "Package data structure is valid"
else
    test_fail "Package data structure" "Missing required fields"
fi

test_start "Search Result Structure"
SEARCH_DATA=$(curl -s "$REGISTRY_URL/api/v1/search?q=test&limit=1")
if echo "$SEARCH_DATA" | jq -e '.results[0] | has("id") and has("name")' > /dev/null 2>&1 || echo "$SEARCH_DATA" | jq -e '.results == []' > /dev/null 2>&1; then
    test_pass "Search result structure is valid"
else
    test_fail "Search result structure" "Invalid structure"
fi

test_start "Collection Data Structure"
COLLECTION_DATA=$(curl -s "$REGISTRY_URL/api/v1/collections?limit=1")
if echo "$COLLECTION_DATA" | jq -e '.collections[0] | has("id") and has("name")' > /dev/null 2>&1 || echo "$COLLECTION_DATA" | jq -e '.collections == []' > /dev/null 2>&1; then
    test_pass "Collection data structure is valid"
else
    test_fail "Collection data structure" "Invalid structure"
fi

test_start "Pagination Parameters"
PAGE1=$(curl -s "$REGISTRY_URL/api/v1/packages?limit=2&offset=0")
PAGE2=$(curl -s "$REGISTRY_URL/api/v1/packages?limit=2&offset=2")
if [ "$(echo $PAGE1 | jq '.packages[0].id')" != "$(echo $PAGE2 | jq '.packages[0].id')" ]; then
    test_pass "Pagination works correctly"
else
    test_fail "Pagination" "Same results on different pages"
fi

# ============================================
# PART 5: ERROR HANDLING TESTS
# ============================================
echo -e "${YELLOW}═══ PART 5: Error Handling Tests ═══${NC}"
echo ""

test_start "404 on Invalid Endpoint"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$REGISTRY_URL/api/v1/nonexistent")
if [ "$RESPONSE" == "404" ]; then
    test_pass "Returns 404 for invalid endpoints"
else
    test_fail "404 handling" "Got: $RESPONSE"
fi

test_start "Invalid Search Parameters"
INVALID_SEARCH=$(curl -s "$REGISTRY_URL/api/v1/search?limit=-1")
# Should handle gracefully, not crash
if [ -n "$INVALID_SEARCH" ]; then
    test_pass "Handles invalid search parameters gracefully"
else
    test_fail "Invalid parameters" "Empty response"
fi

# ============================================
# FINAL RESULTS
# ============================================
echo ""
echo "========================================"
echo "         TEST RESULTS SUMMARY"
echo "========================================"
echo ""
echo -e "Total Tests:  ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    PASS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo -e "${YELLOW}Pass Rate: $PASS_RATE%${NC}"
    exit 1
fi
