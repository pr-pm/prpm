# Local Testing Guide

Complete guide for testing the entire PRPM stack locally before deploying to AWS.

## Overview

This guide shows you how to:
1. Run the registry API locally with Docker Compose
2. Set up a local database and Redis
3. Test the complete CLI → Registry → Database flow
4. Publish and install packages locally
5. Run end-to-end tests

---

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ installed
- PostgreSQL client (psql) optional but recommended

---

## Quick Start

```bash
# 1. Start local registry stack
docker-compose up -d

# 2. Run database migrations
cd registry
npm install
npm run migrate

# 3. Build CLI
cd ..
npm install
npm run build

# 4. Test the flow
npm run test:e2e
```

---

## Detailed Setup

### 1. Start Local Services

The `docker-compose.yml` file in the registry directory starts:
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)
- Registry API (port 3000)
- MinIO (S3-compatible storage, port 9000)

```bash
cd registry
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f registry
```

### 2. Configure Local Environment

Create `.env` file in registry directory:

```bash
cat > registry/.env.local << 'EOF'
# Database
DATABASE_URL=postgresql://prpm:prpm_dev_password@localhost:5432/prpm

# Redis
REDIS_URL=redis://localhost:6379

# S3 (MinIO)
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=prpm-packages

# JWT
JWT_SECRET=local_dev_secret_change_in_production

# GitHub OAuth (optional for local testing)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/callback

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# Search
SEARCH_ENGINE=postgres

# Feature Flags
ENABLE_TELEMETRY=false
ENABLE_RATE_LIMITING=false
EOF
```

### 3. Run Database Migrations

```bash
cd registry
npm install

# Run migrations
npm run migrate

# Verify tables created
docker exec -it prpm-postgres psql -U prpm -d prpm -c "\dt"

# Should show:
# packages, package_versions, users, downloads, ratings, etc.
```

### 4. Create Test User & Token

```bash
# Connect to database
docker exec -it prpm-postgres psql -U prpm -d prpm

# Create test user
INSERT INTO users (id, github_id, username, email, role, created_at)
VALUES (
  'test-user-001',
  12345,
  'testuser',
  'test@example.com',
  'user',
  NOW()
);

# Exit psql
\q

# Generate JWT token
cd registry
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'test-user-001', username: 'testuser', role: 'user' },
  'local_dev_secret_change_in_production',
  { expiresIn: '30d' }
);
console.log('\nYour test token:');
console.log(token);
console.log('\nSave this to ~/.prpmrc');
"
```

### 5. Configure CLI for Local Registry

Create or edit `~/.prpmrc`:

```json
{
  "registryUrl": "http://localhost:3000",
  "token": "your-jwt-token-from-above",
  "username": "testuser",
  "telemetryEnabled": false
}
```

Or use environment variables:

```bash
export PRPM_REGISTRY_URL=http://localhost:3000
export PRMP_TOKEN=your-jwt-token-from-above
```

### 6. Build and Link CLI

```bash
cd /path/to/prompt-package-manager
npm install
npm run build

# Link for local testing
npm link

# Verify
prpm --version
# Should show: 1.2.0
```

---

## Testing Workflows

### Test 1: Health Check

```bash
# API health
curl http://localhost:3000/health

# Expected: {"status":"healthy","timestamp":"..."}
```

### Test 2: Search (Empty Registry)

```bash
prpm search react

# Expected: No packages found
```

### Test 3: Publish a Test Package

Create a test package:

```bash
mkdir -p /tmp/test-package
cd /tmp/test-package

# Create cursor rules file
cat > .cursorrules << 'EOF'
# React Expert Rules

You are a React expert. Always:
- Use functional components and hooks
- Consider performance (memo, useMemo, useCallback)
- Follow React best practices
- Write accessible code
EOF

# Create manifest
cat > prpm.json << 'EOF'
{
  "name": "test-react-rules",
  "version": "1.0.0",
  "displayName": "Test React Rules",
  "description": "Test package for local development",
  "type": "cursor",
  "tags": ["react", "javascript", "test"],
  "author": {
    "name": "Test User",
    "github": "testuser"
  },
  "files": [".cursorrules"],
  "keywords": ["react", "cursor", "test"]
}
EOF

# Publish
prpm publish

# Expected: ✅ Package published successfully!
```

### Test 4: Search for Published Package

```bash
prpm search react

# Expected: Shows test-react-rules package
```

### Test 5: Get Package Info

```bash
prpm info test-react-rules

# Expected: Package details, version, downloads, etc.
```

### Test 6: Install Package

```bash
mkdir -p /tmp/test-project
cd /tmp/test-project

prpm install test-react-rules

# Expected: Package installed to cursor_rules/
```

### Test 7: Verify Installation

```bash
ls -la cursor_rules/
cat cursor_rules/.cursorrules

# Should show the React rules content
```

### Test 8: Trending Packages

```bash
prpm trending

# Expected: Shows test-react-rules (if it has downloads)
```

---

## End-to-End Test Script

Create `scripts/test-e2e.sh`:

```bash
#!/bin/bash
set -e

echo "🧪 PRMP End-to-End Test"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
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

# Test 1: Health check
echo "Test 1: Health check..."
if curl -s http://localhost:3000/health | grep -q "healthy"; then
  test_pass "Health check"
else
  test_fail "Health check"
fi

# Test 2: Database connection
echo "Test 2: Database connection..."
if docker exec prpm-postgres psql -U prpm -d prpm -c "SELECT 1" &>/dev/null; then
  test_pass "Database connection"
else
  test_fail "Database connection"
fi

# Test 3: Redis connection
echo "Test 3: Redis connection..."
if docker exec prpm-redis redis-cli ping | grep -q "PONG"; then
  test_pass "Redis connection"
else
  test_fail "Redis connection"
fi

# Test 4: MinIO (S3) connection
echo "Test 4: MinIO connection..."
if curl -s http://localhost:9000/minio/health/live | grep -q "OK"; then
  test_pass "MinIO connection"
else
  test_fail "MinIO connection"
fi

# Test 5: Search API
echo "Test 5: Search API..."
if curl -s "http://localhost:3000/api/v1/search?q=test" | grep -q "packages"; then
  test_pass "Search API"
else
  test_fail "Search API"
fi

# Test 6: CLI build
echo "Test 6: CLI build..."
if [ -f "dist/index.js" ]; then
  test_pass "CLI build"
else
  test_fail "CLI build"
fi

# Test 7: CLI version
echo "Test 7: CLI version..."
if prpm --version | grep -q "1.2.0"; then
  test_pass "CLI version"
else
  test_fail "CLI version"
fi

# Test 8: Create and publish test package
echo "Test 8: Publish test package..."
TEST_PKG_DIR=$(mktemp -d)
cd "$TEST_PKG_DIR"

cat > .cursorrules << 'EOF'
# E2E Test Rules
This is a test package.
EOF

cat > prpm.json << 'EOF'
{
  "name": "e2e-test-package",
  "version": "1.0.0",
  "description": "E2E test package",
  "type": "cursor",
  "tags": ["test"],
  "author": {"name": "Test"},
  "files": [".cursorrules"]
}
EOF

if prpm publish 2>&1 | grep -q "published successfully"; then
  test_pass "Publish test package"
else
  test_fail "Publish test package"
fi

# Test 9: Search for published package
echo "Test 9: Search for package..."
if prpm search "e2e-test" | grep -q "e2e-test-package"; then
  test_pass "Search for package"
else
  test_fail "Search for package"
fi

# Test 10: Install package
echo "Test 10: Install package..."
INSTALL_DIR=$(mktemp -d)
cd "$INSTALL_DIR"

if prpm install e2e-test-package 2>&1 | grep -q "installed successfully"; then
  test_pass "Install package"
else
  test_fail "Install package"
fi

# Cleanup
rm -rf "$TEST_PKG_DIR" "$INSTALL_DIR"

# Summary
echo ""
echo "===================="
echo "Test Summary"
echo "===================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
```

Run the tests:

```bash
chmod +x scripts/test-e2e.sh
./scripts/test-e2e.sh
```

---

## Debugging

### View Registry Logs

```bash
docker-compose logs -f registry
```

### View Database Tables

```bash
docker exec -it prpm-postgres psql -U prpm -d prpm

# List tables
\dt

# View packages
SELECT id, display_name, type, total_downloads FROM packages;

# View users
SELECT id, username, email, role FROM users;

# Exit
\q
```

### View Redis Cache

```bash
docker exec -it prpm-redis redis-cli

# List all keys
KEYS *

# Get a value
GET search:react

# Clear cache
FLUSHALL

# Exit
exit
```

### View S3 (MinIO) Files

Access MinIO console at http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`

Or use CLI:

```bash
# Install mc (MinIO client)
brew install minio/stable/mc

# Configure
mc alias set local http://localhost:9000 minioadmin minioadmin

# List buckets
mc ls local

# List files
mc ls local/prpm-packages
```

### Reset Everything

```bash
# Stop all services
docker-compose down -v

# Remove all data (careful!)
docker volume prune

# Start fresh
docker-compose up -d
npm run migrate
```

---

## Common Issues

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change registry port in docker-compose.yml
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs prpm-postgres

# Restart
docker-compose restart postgres
```

### S3 Upload Failures

```bash
# Check MinIO is accessible
curl http://localhost:9000/minio/health/live

# Create bucket manually
docker exec -it prpm-minio mc mb local/prpm-packages

# Check bucket policy
docker exec -it prpm-minio mc policy get local/prpm-packages
```

---

## Performance Testing

### Load Test with Apache Bench

```bash
# Install ab
brew install httpd  # macOS
sudo apt install apache2-utils  # Ubuntu

# Test search endpoint
ab -n 1000 -c 10 http://localhost:3000/api/v1/search?q=react

# Test package info
ab -n 1000 -c 10 http://localhost:3000/api/v1/packages/test-react-rules
```

### Database Query Performance

```bash
docker exec -it prpm-postgres psql -U prpm -d prpm

# Enable query timing
\timing

# Test search query
EXPLAIN ANALYZE
SELECT * FROM packages
WHERE to_tsvector('english', display_name || ' ' || description) @@ plainto_tsquery('english', 'react')
ORDER BY total_downloads DESC
LIMIT 20;
```

---

## CI Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: prpm
          POSTGRES_PASSWORD: prpm_test
          POSTGRES_DB: prpm_test
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build CLI
        run: npm run build

      - name: Run migrations
        working-directory: registry
        run: npm run migrate
        env:
          DATABASE_URL: postgresql://prpm:prpm_test@localhost:5432/prpm_test

      - name: Run E2E tests
        run: ./scripts/test-e2e.sh
        env:
          DATABASE_URL: postgresql://prpm:prpm_test@localhost:5432/prpm_test
          REDIS_URL: redis://localhost:6379
```

---

## Next Steps

Once local testing is complete:
1. Deploy to AWS staging environment
2. Run same E2E tests against staging
3. Deploy to production
4. Set up monitoring and alerts

---

**Happy Testing! 🧪**
