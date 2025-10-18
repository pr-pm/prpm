#!/bin/bash
set -e

echo "🧪 PRMP End-to-End Test"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((TESTS_PASSED++))
}

test_fail() {
  echo -e "${RED}✗${NC} $1"
  ((TESTS_FAILED++))
}

test_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

# Ensure we're in project root
cd "$(dirname "$0")/.."

echo "Prerequisites Check"
echo "===================="

# Check Docker
test_info "Checking Docker..."
if ! command -v docker &> /dev/null; then
  test_fail "Docker not installed"
  exit 1
fi
test_pass "Docker installed"

# Check Docker Compose
test_info "Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  test_fail "Docker Compose not installed"
  exit 1
fi
test_pass "Docker Compose installed"

# Check Node.js
test_info "Checking Node.js..."
if ! command -v node &> /dev/null; then
  test_fail "Node.js not installed"
  exit 1
fi
NODE_VERSION=$(node --version)
test_pass "Node.js $NODE_VERSION"

echo ""
echo "Starting Services"
echo "================="

# Start Docker services
test_info "Starting Docker services..."
cd registry
docker-compose up -d

# Wait for services
test_info "Waiting for services to be healthy..."
sleep 10

# Test 1: PostgreSQL
echo ""
echo "Test 1: PostgreSQL Connection"
if docker exec prmp-postgres psql -U prmp -d prmp_registry -c "SELECT 1" &>/dev/null; then
  test_pass "PostgreSQL connection"
else
  test_fail "PostgreSQL connection"
fi

# Test 2: Redis
echo "Test 2: Redis Connection"
if docker exec prmp-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
  test_pass "Redis connection"
else
  test_fail "Redis connection"
fi

# Test 3: MinIO
echo "Test 3: MinIO Connection"
if curl -s http://localhost:9000/minio/health/live 2>/dev/null | grep -q "OK"; then
  test_pass "MinIO connection"
else
  test_fail "MinIO connection"
fi

# Run migrations
echo ""
echo "Database Setup"
echo "=============="
test_info "Running database migrations..."
if npm run migrate &>/dev/null; then
  test_pass "Database migrations"
else
  test_fail "Database migrations"
fi

# Wait for registry API
test_info "Waiting for registry API..."
sleep 5

# Test 4: Registry Health
echo ""
echo "Test 4: Registry API Health"
if curl -s http://localhost:3000/health 2>/dev/null | grep -q "healthy"; then
  test_pass "Registry health check"
else
  test_fail "Registry health check"
fi

# Test 5: Search API
echo "Test 5: Search API (Empty)"
if curl -s "http://localhost:3000/api/v1/search?q=test" 2>/dev/null | grep -q "packages"; then
  test_pass "Search API"
else
  test_fail "Search API"
fi

# Create test user and token
echo ""
echo "User Setup"
echo "=========="
test_info "Creating test user..."

# Create user via SQL
docker exec prmp-postgres psql -U prmp -d prmp_registry -c "
INSERT INTO users (id, github_id, username, email, role, created_at)
VALUES ('test-user-e2e', 99999, 'e2e-test', 'e2e@test.com', 'user', NOW())
ON CONFLICT (github_id) DO NOTHING;
" &>/dev/null

if [ $? -eq 0 ]; then
  test_pass "Test user created"
else
  test_fail "Test user created"
fi

# Generate token
test_info "Generating JWT token..."
cd ..
TEST_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'test-user-e2e', username: 'e2e-test', role: 'user' },
  'dev-secret-change-in-production',
  { expiresIn: '1h' }
);
console.log(token);
" 2>/dev/null)

if [ -n "$TEST_TOKEN" ]; then
  test_pass "JWT token generated"
else
  test_fail "JWT token generated"
  exit 1
fi

# Configure CLI
test_info "Configuring CLI..."
cat > ~/.prmprc << EOF
{
  "registryUrl": "http://localhost:3000",
  "token": "$TEST_TOKEN",
  "username": "e2e-test",
  "telemetryEnabled": false
}
EOF

test_pass "CLI configured"

# Build CLI
echo ""
echo "CLI Build"
echo "========="
test_info "Building CLI..."
if npm run build &>/dev/null; then
  test_pass "CLI build"
else
  test_fail "CLI build"
fi

# Link CLI
test_info "Linking CLI..."
if npm link &>/dev/null; then
  test_pass "CLI linked"
else
  test_fail "CLI linked"
fi

# Test 6: CLI Version
echo ""
echo "Test 6: CLI Version"
if prmp --version 2>/dev/null | grep -q "1.2.0"; then
  test_pass "CLI version"
else
  test_fail "CLI version"
fi

# Test 7: CLI Whoami
echo "Test 7: CLI Whoami"
if prmp whoami 2>/dev/null | grep -q "e2e-test"; then
  test_pass "CLI whoami"
else
  test_fail "CLI whoami"
fi

# Create test package
echo ""
echo "Package Publishing"
echo "=================="

TEST_PKG_DIR=$(mktemp -d)
cd "$TEST_PKG_DIR"

cat > .cursorrules << 'EOF'
# E2E Test Package

This is an end-to-end test package for PRMP.

## Features
- Local testing
- Full stack validation
- Package lifecycle testing
EOF

cat > prmp.json << 'EOF'
{
  "name": "e2e-test-package",
  "version": "1.0.0",
  "displayName": "E2E Test Package",
  "description": "End-to-end test package for PRMP local development",
  "type": "cursor",
  "tags": ["test", "e2e", "development"],
  "author": {
    "name": "E2E Test",
    "github": "e2e-test"
  },
  "files": [".cursorrules"],
  "keywords": ["test", "e2e", "cursor"]
}
EOF

# Test 8: Publish Package
echo "Test 8: Publish Package"
if prmp publish 2>&1 | grep -q "published successfully"; then
  test_pass "Package published"
else
  test_fail "Package published"
fi

# Test 9: Search for Package
echo "Test 9: Search for Package"
sleep 2  # Wait for indexing
if prmp search "e2e" 2>/dev/null | grep -q "e2e-test-package"; then
  test_pass "Package searchable"
else
  test_fail "Package searchable"
fi

# Test 10: Get Package Info
echo "Test 10: Get Package Info"
if prmp info e2e-test-package 2>/dev/null | grep -q "E2E Test Package"; then
  test_pass "Package info"
else
  test_fail "Package info"
fi

# Test 11: Install Package
echo "Test 11: Install Package"
INSTALL_DIR=$(mktemp -d)
cd "$INSTALL_DIR"

if prmp install e2e-test-package 2>&1 | grep -q "installed successfully"; then
  test_pass "Package installed"
else
  test_fail "Package installed"
fi

# Test 12: Verify Installation
echo "Test 12: Verify Installation"
if [ -f "cursor_rules/.cursorrules" ]; then
  test_pass "Package files exist"
else
  test_fail "Package files exist"
fi

# Test 13: Verify Content
echo "Test 13: Verify Package Content"
if grep -q "E2E Test Package" cursor_rules/.cursorrules; then
  test_pass "Package content correct"
else
  test_fail "Package content correct"
fi

# Test 14: List Packages
echo "Test 14: List Installed Packages"
if prmp list 2>/dev/null | grep -q "e2e-test-package"; then
  test_pass "Package listed"
else
  test_fail "Package listed"
fi

# Test 15: Trending
echo "Test 15: Trending Packages"
if prmp trending 2>/dev/null | grep -q "Trending"; then
  test_pass "Trending command works"
else
  test_fail "Trending command works"
fi

# Cleanup
echo ""
echo "Cleanup"
echo "======="
test_info "Removing test directories..."
rm -rf "$TEST_PKG_DIR" "$INSTALL_DIR"
test_pass "Test directories cleaned"

test_info "Unlinking CLI..."
npm unlink prmp &>/dev/null || true
test_pass "CLI unlinked"

# Summary
echo ""
echo "===================="
echo "Test Summary"
echo "===================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "To stop services:"
  echo "  cd registry && docker-compose down"
  echo ""
  echo "To view logs:"
  echo "  cd registry && docker-compose logs -f"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  echo ""
  echo "To debug:"
  echo "  cd registry && docker-compose logs"
  exit 1
fi
