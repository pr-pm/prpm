#!/bin/bash
# Comprehensive E2E API Test Suite

set -e

echo "🧪 PRPM Registry API End-to-End Test Suite"
echo "============================================"
echo ""

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0
TOTAL=0

# Test function
test_api() {
    local name="$1"
    local endpoint="$2"
    local expected_status="$3"
    local check_field="$4"  # Optional: field to check in response
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] $name... "
    
    response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
    body=$(echo "$response" | sed '$d')
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" = "$expected_status" ]; then
        if [ -n "$check_field" ]; then
            if echo "$body" | jq -e "$check_field" > /dev/null 2>&1; then
                echo "✅ PASS (HTTP $status, $check_field exists)"
                PASSED=$((PASSED + 1))
            else
                echo "❌ FAIL (HTTP $status OK, but $check_field missing)"
                FAILED=$((FAILED + 1))
            fi
        else
            echo "✅ PASS (HTTP $status)"
            PASSED=$((PASSED + 1))
        fi
    else
        echo "❌ FAIL (expected HTTP $expected_status, got $status)"
        FAILED=$((FAILED + 1))
    fi
}

echo "🏥 Health & Status"
echo "=================="
test_api "Health endpoint" "/health" "200" ".status"
test_api "Health services" "/health" "200" ".services.database"

echo ""
echo "🔍 Search Endpoints"
echo "==================="
test_api "Search with query" "/api/v1/search?q=react&limit=5" "200" ".packages"
test_api "Search with type filter" "/api/v1/search?q=python&type=cursor&limit=3" "200" ".packages"
test_api "Search total count" "/api/v1/search?q=react" "200" ".total"

echo ""
echo "📦 Package Endpoints"
echo "===================="
test_api "List packages" "/api/v1/packages?limit=10" "200" ".packages"
test_api "List with type filter" "/api/v1/packages?type=claude&limit=5" "200" ".packages"
test_api "List with pagination" "/api/v1/packages?limit=5&offset=10" "200" ".packages"
test_api "Get package by ID" "/api/v1/packages/%40obra%2Fskill-brainstorming" "200" ".id"
test_api "Get package versions" "/api/v1/packages/%40obra%2Fskill-brainstorming" "200" ".versions"
test_api "Get non-existent package" "/api/v1/packages/%40fake%2Fnonexistent" "404" ""

echo ""
echo "🏷️  Discovery Endpoints"
echo "======================="
test_api "Get all tags" "/api/v1/search/tags" "200" ".tags"
test_api "Get all categories" "/api/v1/search/categories" "200" ".categories"
test_api "Trending packages" "/api/v1/search/trending?limit=10" "200" ".packages"
test_api "Featured packages" "/api/v1/search/featured?limit=10" "200" ".packages"

echo ""
echo "📊 Stats Endpoints"
echo "=================="
test_api "Package stats" "/api/v1/packages/%40obra%2Fskill-brainstorming/stats?days=30" "200" ".stats"

echo ""
echo "============================================"
echo "📊 Test Results"
echo "============================================"
echo "Total tests: $TOTAL"
echo "Passed: ✅ $PASSED"
echo "Failed: ❌ $FAILED"
echo "Pass rate: $(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All API tests passed!"
    exit 0
else
    echo "⚠️  Some API tests failed"
    exit 1
fi
