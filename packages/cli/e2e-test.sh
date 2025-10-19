#!/bin/bash
# Comprehensive E2E CLI Test Suite

set -e

echo "🧪 PRPM CLI End-to-End Test Suite"
echo "===================================="
echo ""

PASSED=0
FAILED=0
TOTAL=0

# Test function
test_cmd() {
    local name="$1"
    local cmd="$2"
    local expected_exit="$3"  # 0 or 1
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] Testing: $name... "
    
    if eval "$cmd" > /dev/null 2>&1; then
        if [ "$expected_exit" = "0" ]; then
            echo "✅ PASS"
            PASSED=$((PASSED + 1))
        else
            echo "❌ FAIL (expected failure, got success)"
            FAILED=$((FAILED + 1))
        fi
    else
        if [ "$expected_exit" = "1" ]; then
            echo "✅ PASS (expected failure)"
            PASSED=$((PASSED + 1))
        else
            echo "❌ FAIL (expected success, got failure)"
            FAILED=$((FAILED + 1))
        fi
    fi
}

echo "📋 Basic Commands"
echo "=================="
test_cmd "CLI version" "node dist/index.js --version" 0
test_cmd "CLI help" "node dist/index.js --help" 0
test_cmd "Search help" "node dist/index.js search --help" 0
test_cmd "Install help" "node dist/index.js install --help" 0
test_cmd "Collections help" "node dist/index.js collections --help" 0

echo ""
echo "🔍 Search Commands"
echo "=================="
test_cmd "Search react" "node dist/index.js search react --limit 5" 0
test_cmd "Search python" "node dist/index.js search python --limit 3" 0
test_cmd "Search with type filter" "node dist/index.js search python --type cursor --limit 3" 0
test_cmd "Search empty query" "node dist/index.js search '' --limit 5" 1

echo ""
echo "📦 Package Info Commands"
echo "========================"
test_cmd "Info for existing package" "node dist/index.js info @obra/skill-brainstorming" 1
test_cmd "Info for non-existent package" "node dist/index.js info @fake/nonexistent" 1

echo ""
echo "🔥 Trending & Popular"
echo "====================="
test_cmd "Trending packages" "node dist/index.js trending --limit 5" 0

echo ""
echo "📚 Collections"
echo "=============="
test_cmd "List collections" "node dist/index.js collections list" 0

echo ""
echo "===================================="
echo "📊 Test Results"
echo "===================================="
echo "Total tests: $TOTAL"
echo "Passed: ✅ $PASSED"
echo "Failed: ❌ $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed"
    exit 1
fi
