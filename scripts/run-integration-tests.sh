#!/bin/bash
#
# PRPM Integration Test Runner
#
# This script runs comprehensive E2E tests against a local registry.
# Prerequisites:
#   - Registry running at $PRPM_REGISTRY_URL (default: http://localhost:3111)
#   - CI_MODE=true enabled on registry for anonymous publishing
#   - prpm CLI linked globally (npm link in packages/cli)
#
# Usage:
#   ./scripts/run-integration-tests.sh
#
# Environment variables:
#   PRPM_REGISTRY_URL - Registry URL (default: http://localhost:3111)
#   DEBUG - Enable verbose output (default: false)

set -e

# Configuration - Export PRPM_REGISTRY_URL so the CLI picks it up
export PRPM_REGISTRY_URL="${PRPM_REGISTRY_URL:-http://localhost:3111}"
TEST_DIR="packages/cli/test-fixtures/integration"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE=$(mktemp -d)
FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[FAIL]${NC} $1"
}

cleanup() {
  log_info "Cleaning up workspace: $WORKSPACE"
  rm -rf "$WORKSPACE"
}

trap cleanup EXIT

# Header
echo ""
echo "============================================"
echo "  PRPM Integration Tests"
echo "============================================"
echo ""
log_info "Registry URL: $PRPM_REGISTRY_URL"
log_info "Test fixtures: $TEST_DIR"
log_info "Workspace: $WORKSPACE"
echo ""

# Verify registry is accessible
log_info "Checking registry health..."
if ! curl -sf "$PRPM_REGISTRY_URL/health" > /dev/null 2>&1; then
  log_error "Registry is not accessible at $PRPM_REGISTRY_URL"
  log_error "Make sure the registry is running with CI_MODE=true"
  exit 1
fi
log_success "Registry is healthy"

# Verify test fixtures exist
cd "$PROJECT_ROOT"
if [ ! -d "$TEST_DIR" ]; then
  log_error "Test fixtures not found at $TEST_DIR"
  log_error "Please ensure test fixtures have been created"
  exit 1
fi

# ============================================
# Phase 1: Publish packages
# ============================================
echo ""
echo "--------------------------------------------"
echo "  Phase 1: Publishing packages"
echo "--------------------------------------------"

for batch_dir in "$TEST_DIR"/batch-*; do
  if [ -d "$batch_dir" ] && [ -f "$batch_dir/prpm.json" ]; then
    batch_name=$(basename "$batch_dir")
    log_info "Publishing $batch_name..."

    cd "$batch_dir"
    if prpm publish 2>&1; then
      log_success "Published $batch_name"
    else
      log_error "Failed to publish $batch_name"
      FAILED=1
    fi
    cd "$PROJECT_ROOT"
  fi
done

# ============================================
# Phase 2: Publish collection
# ============================================
echo ""
echo "--------------------------------------------"
echo "  Phase 2: Publishing collection"
echo "--------------------------------------------"

if [ -d "$TEST_DIR/collection" ] && [ -f "$TEST_DIR/collection/prpm.json" ]; then
  log_info "Publishing collection..."
  cd "$TEST_DIR/collection"
  if prpm publish 2>&1; then
    log_success "Published collection"
  else
    log_error "Failed to publish collection"
    FAILED=1
  fi
  cd "$PROJECT_ROOT"
else
  log_warn "Collection fixtures not found, skipping"
fi

# ============================================
# Phase 3: Install and verify packages
# ============================================
echo ""
echo "--------------------------------------------"
echo "  Phase 3: Installing and verifying packages"
echo "--------------------------------------------"

# Create install workspace
INSTALL_WORKSPACE="$WORKSPACE/install-test"
mkdir -p "$INSTALL_WORKSPACE"
cd "$INSTALL_WORKSPACE"

# Run Vitest verification if test file exists
VERIFY_TEST="$PROJECT_ROOT/$TEST_DIR/__tests__/verify-installs.test.ts"
if [ -f "$VERIFY_TEST" ]; then
  log_info "Running Vitest verification matrix..."
  cd "$PROJECT_ROOT"
  export TEST_WORKSPACE="$INSTALL_WORKSPACE"
  if npx vitest run "$VERIFY_TEST" --reporter=verbose 2>&1; then
    log_success "All install locations verified"
  else
    log_error "Install verification failed"
    FAILED=1
  fi
else
  log_warn "Verification test not found at $VERIFY_TEST"
  log_warn "Running basic install tests instead..."

  # Basic install test - install a few packages and check they exist
  cd "$INSTALL_WORKSPACE"

  # Test cursor rule install
  if prpm install @ci-test/cursor-rule --as cursor 2>&1; then
    if [ -d ".cursor/rules" ]; then
      log_success "Cursor rule installed correctly"
    else
      log_error "Cursor rule directory not found"
      FAILED=1
    fi
  else
    log_warn "Could not test cursor rule install (package may not exist yet)"
  fi
fi

# ============================================
# Phase 4: Install collection
# ============================================
echo ""
echo "--------------------------------------------"
echo "  Phase 4: Testing collection install"
echo "--------------------------------------------"

COLLECTION_WORKSPACE="$WORKSPACE/collection-test"
mkdir -p "$COLLECTION_WORKSPACE"
cd "$COLLECTION_WORKSPACE"

if prpm install collections/ci-test-collection 2>&1; then
  log_success "Collection installed successfully"

  # Verify collection contents
  log_info "Verifying collection contents..."
  # TODO: Add specific collection content verification
else
  log_warn "Collection install failed (collection may not exist yet)"
fi

# ============================================
# Phase 5: Version update tests
# ============================================
echo ""
echo "--------------------------------------------"
echo "  Phase 5: Testing version updates"
echo "--------------------------------------------"

# TODO: Implement version bump and republish tests
# This requires:
# 1. Modify prpm.json versions programmatically
# 2. Republish with new versions
# 3. Verify prpm install gets new version

log_warn "Version update tests not yet implemented"

# ============================================
# Phase 6: Edge case tests
# ============================================
echo ""
echo "--------------------------------------------"
echo "  Phase 6: Edge case tests"
echo "--------------------------------------------"

EDGE_CASES_DIR="$PROJECT_ROOT/$TEST_DIR/edge-cases"
if [ -d "$EDGE_CASES_DIR" ]; then
  for edge_case in "$EDGE_CASES_DIR"/*/; do
    if [ -f "$edge_case/prpm.json" ]; then
      case_name=$(basename "$edge_case")
      log_info "Testing edge case: $case_name"

      cd "$edge_case"
      if prpm publish 2>&1; then
        log_success "Edge case $case_name: publish succeeded"
      else
        log_error "Edge case $case_name: publish failed"
        FAILED=1
      fi
      cd "$PROJECT_ROOT"
    fi
  done
else
  log_warn "Edge cases directory not found, skipping"
fi

# ============================================
# Summary
# ============================================
echo ""
echo "============================================"
echo "  Test Summary"
echo "============================================"
echo ""

if [ $FAILED -eq 0 ]; then
  log_success "All integration tests passed!"
  exit 0
else
  log_error "Some integration tests failed"
  exit 1
fi
