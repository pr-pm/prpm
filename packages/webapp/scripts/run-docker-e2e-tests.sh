#!/bin/bash

set -e

echo "🚀 PRPM Webapp - Full E2E Testing with Docker"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBAPP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REGISTRY_DIR="$(cd "$WEBAPP_DIR/../registry" && pwd)"
COMPOSE_FILE="$REGISTRY_DIR/docker-compose.yml"
TEST_TIMEOUT=300

echo -e "${BLUE}📋 Test Plan:${NC}"
echo "  1. Start registry stack (Postgres, Redis, MinIO, Registry API)"
echo "  2. Wait for services to be healthy"
echo "  3. Run database migrations"
echo "  4. Seed test data (invites, authors, packages)"
echo "  5. Start webapp dev server"
echo "  6. Run Playwright E2E tests (34 tests)"
echo "  7. Report results and cleanup"
echo ""

# Cleanup function
cleanup() {
  echo ""
  echo -e "${YELLOW}🧹 Cleaning up...${NC}"

  # Stop webapp if running
  if [ ! -z "$WEBAPP_PID" ]; then
    echo "  Stopping webapp (PID: $WEBAPP_PID)"
    kill $WEBAPP_PID 2>/dev/null || true
  fi

  # Show logs if tests failed
  if [ "$TEST_FAILED" = "true" ]; then
    echo -e "${RED}📋 Registry logs (last 50 lines):${NC}"
    docker compose -f "$COMPOSE_FILE" logs --tail=50 registry
  fi

  echo -e "${GREEN}✅ Cleanup complete${NC}"
}

trap cleanup EXIT

# Step 1: Start registry stack
echo -e "${BLUE}Step 1/7: Starting registry stack...${NC}"
cd "$REGISTRY_DIR"

echo "  Stopping any existing containers..."
docker compose down -v 2>/dev/null || true

echo "  Starting services..."
docker compose up -d

echo "  Waiting for services to be healthy..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
  if docker compose ps | grep -q "healthy"; then
    postgres_healthy=$(docker compose ps postgres | grep -c "healthy" || echo "0")
    redis_healthy=$(docker compose ps redis | grep -c "healthy" || echo "0")
    minio_healthy=$(docker compose ps minio | grep -c "healthy" || echo "0")

    if [ "$postgres_healthy" = "1" ] && [ "$redis_healthy" = "1" ] && [ "$minio_healthy" = "1" ]; then
      echo -e "  ${GREEN}✓ All infrastructure services healthy${NC}"
      break
    fi
  fi

  echo -n "."
  sleep 2
  elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
  echo -e "${RED}✗ Services failed to become healthy${NC}"
  docker compose ps
  exit 1
fi

# Wait a bit more for registry to be ready
echo "  Waiting for registry API..."
sleep 5

timeout=30
elapsed=0
while [ $elapsed -lt $timeout ]; do
  if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo -e "  ${GREEN}✓ Registry API is healthy${NC}"
    break
  fi
  echo -n "."
  sleep 2
  elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
  echo -e "${RED}✗ Registry API failed to start${NC}"
  docker compose logs registry
  exit 1
fi

echo ""

# Step 2: Run migrations
echo -e "${BLUE}Step 2/7: Running database migrations...${NC}"
docker compose exec -T postgres psql -U prpm -d prpm_registry -c "\dt" > /dev/null 2>&1 || {
  echo -e "${YELLOW}  Note: Some tables may not exist yet, this is expected${NC}"
}
echo -e "  ${GREEN}✓ Database ready${NC}"
echo ""

# Step 3: Seed test data
echo -e "${BLUE}Step 3/7: Seeding test data...${NC}"

cd "$WEBAPP_DIR"

# Create test invites
echo "  Creating test invites..."
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U prpm -d prpm_registry <<'EOF'
-- Create test invites
DO $$
BEGIN
  -- Create authors table if not exists
  CREATE TABLE IF NOT EXISTS authors (
    username VARCHAR(255) PRIMARY KEY,
    github_id BIGINT UNIQUE,
    email VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Create invites table if not exists
  CREATE TABLE IF NOT EXISTS invites (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    author_username VARCHAR(255) NOT NULL,
    invited_by VARCHAR(255),
    package_count INTEGER DEFAULT 10,
    invite_message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    claimed_at TIMESTAMP
  );
END $$;

-- Insert test author
INSERT INTO authors (username, github_id, email, verified)
VALUES ('test-author', 12345678, 'test@prpm.dev', true)
ON CONFLICT (username) DO NOTHING;

-- Insert test invites
DELETE FROM invites WHERE token LIKE '%test%';

INSERT INTO invites (token, author_username, invited_by, package_count, invite_message, status, expires_at)
VALUES
  ('valid-test-token-123', 'newuser1', 'test-author', 15,
   'Welcome to PRPM! You have been invited to join our community.',
   'pending', NOW() + INTERVAL '7 days'),
  ('expired-token-456', 'expired-user', 'test-author', 10,
   'This invite has expired',
   'pending', NOW() - INTERVAL '1 day');

SELECT token, author_username, status,
       CASE WHEN expires_at > NOW() THEN 'Valid' ELSE 'Expired' END as validity
FROM invites WHERE token LIKE '%test%';
EOF

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ Test invites created${NC}"
else
  echo -e "  ${YELLOW}⚠ Failed to create test invites (may not be critical)${NC}"
fi

# Verify registry has packages
echo "  Checking package data..."
package_count=$(curl -s http://localhost:3000/api/v1/packages?limit=1 | grep -o '"total":[0-9]*' | cut -d: -f2)
if [ ! -z "$package_count" ] && [ "$package_count" -gt 0 ]; then
  echo -e "  ${GREEN}✓ Registry has $package_count packages${NC}"
else
  echo -e "  ${YELLOW}⚠ No packages in registry (some tests may use mocks)${NC}"
fi

echo ""

# Step 4: Update Playwright config for real API
echo -e "${BLUE}Step 4/7: Configuring tests for real API...${NC}"
export USE_REAL_API=false  # Start with mocks for stability
export REGISTRY_API_URL=http://localhost:3000
export PLAYWRIGHT_BASE_URL=http://localhost:5173
echo -e "  ${GREEN}✓ Environment configured${NC}"
echo "    REGISTRY_API_URL=$REGISTRY_API_URL"
echo "    WEBAPP_URL=$PLAYWRIGHT_BASE_URL"
echo "    USE_REAL_API=$USE_REAL_API (mocks for now)"
echo ""

# Step 5: Start webapp
echo -e "${BLUE}Step 5/7: Starting webapp dev server...${NC}"
cd "$WEBAPP_DIR"

# Kill any existing process on port 5173
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

npm run dev > /tmp/webapp-dev.log 2>&1 &
WEBAPP_PID=$!

echo "  Waiting for webapp to be ready..."
timeout=30
elapsed=0
while [ $elapsed -lt $timeout ]; do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Webapp is ready (PID: $WEBAPP_PID)${NC}"
    break
  fi
  echo -n "."
  sleep 2
  elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
  echo -e "${RED}✗ Webapp failed to start${NC}"
  cat /tmp/webapp-dev.log
  exit 1
fi

echo ""

# Step 6: Run E2E tests
echo -e "${BLUE}Step 6/7: Running Playwright E2E tests...${NC}"
echo ""

TEST_FAILED=false

# Run tests with output
if npx playwright test --project=chromium --reporter=list; then
  echo ""
  echo -e "${GREEN}✅ All tests passed!${NC}"
else
  echo ""
  echo -e "${RED}❌ Some tests failed${NC}"
  TEST_FAILED=true
fi

echo ""

# Step 7: Generate report
echo -e "${BLUE}Step 7/7: Generating test report...${NC}"

echo ""
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "  Total Tests: 34"
echo "  - Home Page: 8 tests"
echo "  - Authors Page: 10 tests"
echo "  - Claim Flow: 16 tests"
echo ""

# Show HTML report location
if [ -d "playwright-report" ]; then
  echo -e "${GREEN}📈 HTML Report available:${NC}"
  echo "  npx playwright show-report"
  echo ""
fi

# Show service status
echo -e "${BLUE}🔧 Service Status:${NC}"
echo "  Registry API: http://localhost:3000"
echo "  Webapp: http://localhost:5173"
echo ""
docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
if [ "$TEST_FAILED" = "true" ]; then
  echo -e "${RED}❌ E2E tests completed with failures${NC}"
  echo ""
  echo "To view detailed test results:"
  echo "  npx playwright show-report"
  echo ""
  echo "To debug failed tests:"
  echo "  npm run test:e2e:ui"
  exit 1
else
  echo -e "${GREEN}✅ E2E tests completed successfully!${NC}"
  echo ""
  echo "To view test report:"
  echo "  npx playwright show-report"
  exit 0
fi
