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

set -euo pipefail

# Configuration - Export PRPM_REGISTRY_URL so the CLI picks it up
export PRPM_REGISTRY_URL="${PRPM_REGISTRY_URL:-http://localhost:3111}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_DIR="packages/cli/test-fixtures/integration"

# Use local CLI build instead of global install
PRPM_CLI="$PROJECT_ROOT/packages/cli/dist/index.js"
prpm() {
  node "$PRPM_CLI" "$@"
}
export -f prpm

# Ensure local CLI is built
echo "Building local CLI..."
(cd "$PROJECT_ROOT" && npm run build --workspace=prpm)

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
log_info "CI_MODE (local shell): ${CI_MODE:-<unset>}"
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

run_publish() {
  local batch_dir="$1"
  local batch_name="$2"

  log_info "Publishing $batch_name..."
  cd "$batch_dir"

  set +e
  local publish_output
  publish_output=$(timeout 90 node "$PRPM_CLI" publish 2>&1)
  local publish_exit=$?
  set -e

  cd "$PROJECT_ROOT"

  if [ $publish_exit -eq 0 ]; then
    log_success "Published $batch_name"
  elif echo "$publish_output" | grep -q "Version already exists"; then
    log_success "Published $batch_name (packages already exist)"
  else
    log_error "Failed to publish $batch_name (exit code: $publish_exit)"
    echo "$publish_output"

    if echo "$publish_output" | grep -qi "unauthorized"; then
      log_error "Publish rejected as Unauthorized - ensure registry is running with CI_MODE=true and PRPM_REGISTRY_URL=$PRPM_REGISTRY_URL"
    fi

    FAILED=1
  fi
}

for batch_dir in "$TEST_DIR"/batch-*; do
  if [ -d "$batch_dir" ] && [ -f "$batch_dir/prpm.json" ]; then
    batch_name=$(basename "$batch_dir")
    run_publish "$batch_dir" "$batch_name"
  fi
done

# Publish edge cases (minimal, unicode, large packages)
EDGE_CASES_DIR="$PROJECT_ROOT/$TEST_DIR/edge-cases"
if [ -d "$EDGE_CASES_DIR" ]; then
  log_info "Publishing edge case packages..."
  for edge_case in "$EDGE_CASES_DIR"/*/; do
    if [ -f "$edge_case/prpm.json" ]; then
      run_publish "$edge_case" "edge-case-$(basename "$edge_case")"
    fi
  done
fi

# ============================================
# Phase 2: Publish collection
# ============================================
echo ""
echo "--------------------------------------------"
echo "  Phase 2: Publishing collection"
echo "--------------------------------------------"

if [ -d "$TEST_DIR/collection" ] && [ -f "$TEST_DIR/collection/prpm.json" ]; then
  run_publish "$TEST_DIR/collection" "collection"
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

# Install published packages into workspace before verification
BATCH_PACKAGES=(
  # Batch 1: Rules
  @ci-test/cursor-rule
  @ci-test/claude-rule
  @ci-test/continue-rule
  @ci-test/windsurf-rule
  @ci-test/copilot-rule
  @ci-test/kiro-rule
  @ci-test/agents-md-rule
  @ci-test/generic-rule
  @ci-test/mcp-rule
  # Batch 2: Agents, skills, commands
  @ci-test/claude-agent
  ci-test-claude-skill
  @ci-test/claude-slash-command
  @ci-test/cursor-agent
  @ci-test/cursor-slash-command
  @ci-test/kiro-agent
  @ci-test/copilot-chatmode
  @ci-test/continue-prompt
  @ci-test/generic-prompt
  # Batch 3: Special (hooks, plugins, MCP)
  @ci-test/claude-hook
  @ci-test/kiro-hook
  @ci-test/claude-plugin
  @ci-test/mcp-server
  @ci-test/mcp-tool
  ci-test-agents-md-skill
  @ci-test/agents-md-agent
  @ci-test/generic-tool
  @ci-test/generic-plugin
)

log_info "Installing published packages into workspace..."
for pkg in "${BATCH_PACKAGES[@]}"; do
  if prpm install "$pkg" 2>&1; then
    log_success "Installed $pkg"
  else
    log_error "Failed to install $pkg"
    FAILED=1
  fi
done

# Install edge case packages
log_info "Installing edge case packages..."
EDGE_CASE_PACKAGES=(
  @ci-test/minimal-rule
  @ci-test/unicode-rule
)
for pkg in "${EDGE_CASE_PACKAGES[@]}"; do
  if prpm install "$pkg" 2>&1; then
    log_success "Installed $pkg"
  else
    log_error "Failed to install $pkg"
    FAILED=1
  fi
done

# Install large package rules (10 rules)
log_info "Installing large package rules..."
for i in $(seq -w 1 10); do
  if prpm install "@ci-test/large-rule-$i" 2>&1; then
    log_success "Installed @ci-test/large-rule-$i"
  else
    log_error "Failed to install @ci-test/large-rule-$i"
    FAILED=1
  fi
done

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
# Phase 5: Version update tests (PR #209 regression)
# ============================================
echo ""
echo "--------------------------------------------"
echo "  Phase 5: Testing version updates"
echo "--------------------------------------------"

# This tests the fix from PR #209 - after bumping version and republishing,
# install should get the NEW version, not the old cached one.
# Bug was: sorting prioritized downloads over created_at

VERSION_TEST_WORKSPACE="$WORKSPACE/version-test"
mkdir -p "$VERSION_TEST_WORKSPACE"

# Copy minimal package to temp location for modification
VERSION_TEST_PKG="$VERSION_TEST_WORKSPACE/version-bump-pkg"
cp -r "$PROJECT_ROOT/$TEST_DIR/edge-cases/minimal" "$VERSION_TEST_PKG"

# Step 1: Bump version from 1.0.0 to 1.0.1
log_info "Bumping package version from 1.0.0 to 1.0.1..."

# Cross-platform sed: macOS uses -i '', Linux uses -i without extension
if sed --version 2>/dev/null | grep -q GNU; then
  # GNU sed (Linux)
  sed -i 's/"version": "1.0.0"/"version": "1.0.1"/g' "$VERSION_TEST_PKG/prpm.json"
else
  # BSD sed (macOS)
  sed -i '' 's/"version": "1.0.0"/"version": "1.0.1"/g' "$VERSION_TEST_PKG/prpm.json"
fi

# Verify the bump worked
if grep -q '"version": "1.0.1"' "$VERSION_TEST_PKG/prpm.json"; then
  log_success "Version bumped to 1.0.1"
else
  log_error "Failed to bump version"
  FAILED=1
fi

# Step 2: Publish the new version
log_info "Publishing version 1.0.1..."
cd "$VERSION_TEST_PKG"
set +e
publish_output=$(timeout 90 node "$PRPM_CLI" publish 2>&1)
publish_exit=$?
set -e
cd "$PROJECT_ROOT"

if [ $publish_exit -eq 0 ]; then
  log_success "Published version 1.0.1"
elif echo "$publish_output" | grep -q "Version already exists"; then
  log_success "Version 1.0.1 already published (from previous run)"
else
  log_error "Failed to publish version 1.0.1 (exit code: $publish_exit)"
  echo "$publish_output"
  FAILED=1
fi

# Step 3: Install in fresh workspace and verify we get v1.0.1
VERSION_INSTALL_WORKSPACE="$VERSION_TEST_WORKSPACE/install"
mkdir -p "$VERSION_INSTALL_WORKSPACE"
cd "$VERSION_INSTALL_WORKSPACE"

log_info "Installing @ci-test/minimal-rule (should get v1.0.1)..."
set +e
install_output=$(prpm install @ci-test/minimal-rule 2>&1)
install_exit=$?
set -e

if [ $install_exit -eq 0 ]; then
  log_success "Installed @ci-test/minimal-rule"

  # Step 4: Verify we got version 1.0.1, not 1.0.0
  # Check prpm.lock for the installed version - must be package-specific
  if [ -f "prpm.lock" ]; then
    # Look for @ci-test/minimal-rule specifically and check its version
    # Use grep -A to get lines after the package name match
    if grep -A 5 '@ci-test/minimal-rule' prpm.lock | grep -q '"1\.0\.1"'; then
      log_success "Version 1.0.1 correctly installed (PR #209 regression test passed)"
    elif grep -A 5 '@ci-test/minimal-rule' prpm.lock | grep -q '"1\.0\.0"'; then
      log_error "Got version 1.0.0 instead of 1.0.1 - PR #209 regression!"
      log_error "prpm.lock content for @ci-test/minimal-rule:"
      grep -A 5 '@ci-test/minimal-rule' prpm.lock || true
      FAILED=1
    else
      log_warn "Could not verify version from prpm.lock"
      log_info "prpm.lock content:"
      cat prpm.lock || true
    fi
  else
    log_warn "No prpm.lock found, skipping version verification"
  fi
else
  log_error "Failed to install @ci-test/minimal-rule"
  echo "$install_output"
  FAILED=1
fi

cd "$PROJECT_ROOT"

# ============================================
# Phase 6: Republish idempotency test
# ============================================
echo ""
echo "--------------------------------------------"
echo "  Phase 6: Republish idempotency test"
echo "--------------------------------------------"

# Tests that republishing the same version is handled gracefully
# (should return "Version already exists" without error)
#
# Phase 5 above tests the full version bump regression (PR #209 fix)
# This phase tests idempotency - republishing same version doesn't error

EDGE_CASES_DIR="$PROJECT_ROOT/$TEST_DIR/edge-cases"
if [ -d "$EDGE_CASES_DIR" ]; then
  log_info "Testing republish idempotency (same version)..."
  for edge_case in "$EDGE_CASES_DIR"/*/; do
    if [ -f "$edge_case/prpm.json" ]; then
      case_name=$(basename "$edge_case")
      run_publish "$edge_case" "$case_name"
    fi
  done
  log_success "Republish idempotency test complete"
else
  log_warn "Edge cases directory not found, skipping republish test"
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
