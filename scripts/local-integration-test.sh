#!/bin/bash
#
# Local Integration Test Runner
#
# Convenience script that starts all services, runs integration tests,
# and cleans up. For iterative development and testing before pushing.
#
# Usage:
#   ./scripts/local-integration-test.sh
#
# Options:
#   --keep-services  Don't stop services after tests (for debugging)
#   --skip-build     Skip building packages (faster iteration)
#   --debug          Enable verbose logging

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse arguments
KEEP_SERVICES=false
SKIP_BUILD=false
DEBUG=false

for arg in "$@"; do
  case $arg in
    --keep-services)
      KEEP_SERVICES=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
  esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
  if [ "$KEEP_SERVICES" = false ]; then
    log_info "Cleaning up..."

    # Stop registry
    if [ -f /tmp/prpm-registry.pid ]; then
      kill $(cat /tmp/prpm-registry.pid) 2>/dev/null || true
      rm /tmp/prpm-registry.pid
    fi

    # Stop docker services
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.integration.yml down -v 2>/dev/null || true

    log_success "Cleanup complete"
  else
    log_warn "Keeping services running (--keep-services)"
    log_info "To stop services manually: docker-compose -f docker-compose.integration.yml down -v"
    if [ -f /tmp/prpm-registry.pid ]; then
      log_info "Registry PID: $(cat /tmp/prpm-registry.pid)"
    fi
  fi
}

trap cleanup EXIT

cd "$PROJECT_ROOT"

echo ""
echo "============================================"
echo "  PRPM Local Integration Tests"
echo "============================================"
echo ""

# ============================================
# Step 1: Start services
# ============================================
log_info "Starting Docker services..."
docker-compose -f docker-compose.integration.yml up -d

# Wait for services to be healthy
log_info "Waiting for services to be ready..."
sleep 5

# Check postgres
timeout 30 bash -c 'until docker exec prpm-integration-postgres pg_isready -U prpm 2>/dev/null; do echo "Waiting for Postgres..."; sleep 2; done'
log_success "Postgres is ready"

# Check redis
timeout 30 bash -c 'until docker exec prpm-integration-redis redis-cli ping 2>/dev/null | grep -q PONG; do echo "Waiting for Redis..."; sleep 2; done'
log_success "Redis is ready"

# Check MinIO
timeout 30 bash -c 'until curl -sf http://localhost:9000/minio/health/live 2>/dev/null; do echo "Waiting for MinIO..."; sleep 2; done'
log_success "MinIO is ready"

# Wait for bucket creation
sleep 3

# ============================================
# Step 2: Build packages (unless skipped)
# ============================================
if [ "$SKIP_BUILD" = false ]; then
  log_info "Building packages..."
  npm run build --workspace=@pr-pm/types
  npm run build --workspace=@pr-pm/converters
  npm run build --workspace=@pr-pm/registry-client
  npm run build --workspace=@pr-pm/registry
  npm run build --workspace=@pr-pm/cli
  log_success "Packages built"
else
  log_warn "Skipping build (--skip-build)"
fi

# ============================================
# Step 3: Run migrations
# ============================================
log_info "Running database migrations..."
cd packages/registry
DATABASE_URL=postgresql://prpm:prpm@localhost:5432/prpm_registry npm run migrate
log_success "Migrations complete"

# ============================================
# Step 4: Start registry
# ============================================
log_info "Starting registry server..."

LOG_LEVEL="info"
if [ "$DEBUG" = true ]; then
  LOG_LEVEL="debug"
fi

CI_MODE=true \
DATABASE_URL=postgresql://prpm:prpm@localhost:5432/prpm_registry \
REDIS_URL=redis://localhost:6379 \
S3_ENDPOINT=http://localhost:9000 \
S3_ACCESS_KEY=minioadmin \
S3_SECRET_KEY=minioadmin \
S3_BUCKET=prpm-packages \
JWT_SECRET=local-test-secret \
LOG_LEVEL=$LOG_LEVEL \
npm start &

echo $! > /tmp/prpm-registry.pid
cd "$PROJECT_ROOT"

# Wait for registry to be ready
timeout 60 bash -c 'until curl -sf http://localhost:3111/health 2>/dev/null; do echo "Waiting for registry..."; sleep 2; done'
log_success "Registry is ready at http://localhost:3111"

# ============================================
# Step 5: Link CLI
# ============================================
log_info "Linking CLI..."
cd packages/cli
npm link 2>/dev/null || true
cd "$PROJECT_ROOT"
log_success "CLI linked"

# ============================================
# Step 6: Run integration tests
# ============================================
echo ""
log_info "Running integration tests..."
echo ""

export PRPM_REGISTRY=http://localhost:3111
export DEBUG=$DEBUG

TEST_EXIT=0
./scripts/run-integration-tests.sh || TEST_EXIT=$?

# ============================================
# Summary
# ============================================
echo ""
if [ $TEST_EXIT -eq 0 ]; then
  log_success "All tests passed!"
else
  log_error "Tests failed with exit code $TEST_EXIT"
fi

exit $TEST_EXIT
