#!/bin/bash

set -e  # Exit on error

echo "=================================================="
echo "Preparing SSG Data for Next.js Static Build"
echo "=================================================="
echo ""

# Configuration
SSG_DATA_DIR="packages/webapp/public/seo-data"
S3_BUCKET="s3://prpm-prod-packages/seo-data"
DEBUG=${DEBUG:-false}

# Fallback data (can be overridden by environment variables)
FALLBACK_PACKAGES=${FALLBACK_PACKAGES:-'[{"name":"@prpm/example","description":"Example package","format":"cursor","subtype":"rules","total_downloads":0,"weekly_downloads":0}]'}
FALLBACK_COLLECTIONS=${FALLBACK_COLLECTIONS:-'[{"name_slug":"example-collection","description":"Example collection","package_count":0,"downloads":0,"stars":0}]'}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print debug info
debug() {
  if [ "$DEBUG" = "true" ]; then
    echo -e "${YELLOW}[DEBUG]${NC} $1"
  fi
}

# Function to print success
success() {
  echo -e "${GREEN}✓${NC} $1"
}

# Function to print warning
warn() {
  echo -e "${YELLOW}⚠️${NC}  $1"
}

# Function to print error
error() {
  echo -e "${RED}❌${NC} $1"
}

# Create directory
echo "Step 1: Creating SSG data directory..."
mkdir -p "$SSG_DATA_DIR"
success "Directory created: $SSG_DATA_DIR"
echo ""

# Download from S3 if available
echo "Step 2: Attempting to download data from S3..."
if command -v aws &> /dev/null; then
  debug "AWS CLI found, attempting download"

  if aws s3 sync "$S3_BUCKET" "$SSG_DATA_DIR" \
    --exclude "*" \
    --include "packages.json" \
    --include "collections.json" \
    --no-progress 2>/dev/null; then
    success "Downloaded data from S3"
  else
    warn "Could not download from S3 (might not have credentials or bucket might be empty)"
  fi
else
  warn "AWS CLI not found, skipping S3 download"
fi
echo ""

# Validate packages.json
echo "Step 3: Validating packages.json..."
if [ -f "$SSG_DATA_DIR/packages.json" ]; then
  debug "Found packages.json at $SSG_DATA_DIR/packages.json"

  # Check if valid JSON and not empty
  if jq -e '. | length > 0' "$SSG_DATA_DIR/packages.json" > /dev/null 2>&1; then
    PKG_COUNT=$(jq '. | length' "$SSG_DATA_DIR/packages.json")
    success "packages.json is valid with $PKG_COUNT packages"

    if [ "$DEBUG" = "true" ]; then
      echo ""
      debug "Sample package entry:"
      jq '.[0] | {name, format, subtype, description: .description[:50]}' "$SSG_DATA_DIR/packages.json" || true
    fi
  else
    warn "packages.json is empty or invalid, creating fallback"
    echo "$FALLBACK_PACKAGES" > "$SSG_DATA_DIR/packages.json"
  fi
else
  warn "packages.json not found, creating fallback"
  echo "$FALLBACK_PACKAGES" > "$SSG_DATA_DIR/packages.json"
fi
echo ""

# Validate collections.json
echo "Step 4: Validating collections.json..."
if [ -f "$SSG_DATA_DIR/collections.json" ]; then
  debug "Found collections.json at $SSG_DATA_DIR/collections.json"

  # Check if valid JSON and not empty
  if jq -e '. | length > 0' "$SSG_DATA_DIR/collections.json" > /dev/null 2>&1; then
    COLL_COUNT=$(jq '. | length' "$SSG_DATA_DIR/collections.json")
    success "collections.json is valid with $COLL_COUNT collections"

    if [ "$DEBUG" = "true" ]; then
      echo ""
      debug "Sample collection entry:"
      jq '.[0] | {name_slug, package_count, description: .description[:50]}' "$SSG_DATA_DIR/collections.json" || true
    fi
  else
    warn "collections.json is empty or invalid, creating fallback"
    echo "$FALLBACK_COLLECTIONS" > "$SSG_DATA_DIR/collections.json"
  fi
else
  warn "collections.json not found, creating fallback"
  echo "$FALLBACK_COLLECTIONS" > "$SSG_DATA_DIR/collections.json"
fi
echo ""

# Final verification
echo "Step 5: Final verification..."
echo ""
echo "SSG Data Directory Contents:"
ls -lh "$SSG_DATA_DIR"
echo ""

# Verify files exist and are readable
if [ -f "$SSG_DATA_DIR/packages.json" ] && [ -r "$SSG_DATA_DIR/packages.json" ]; then
  FILE_SIZE=$(wc -c < "$SSG_DATA_DIR/packages.json")
  success "packages.json exists and is readable (${FILE_SIZE} bytes)"
else
  error "packages.json is missing or not readable!"
  exit 1
fi

if [ -f "$SSG_DATA_DIR/collections.json" ] && [ -r "$SSG_DATA_DIR/collections.json" ]; then
  FILE_SIZE=$(wc -c < "$SSG_DATA_DIR/collections.json")
  success "collections.json exists and is readable (${FILE_SIZE} bytes)"
else
  error "collections.json is missing or not readable!"
  exit 1
fi

echo ""
echo "=================================================="
echo "SSG Data Preparation Complete!"
echo "=================================================="
echo ""
echo "Summary:"
PKG_COUNT=$(jq '. | length' "$SSG_DATA_DIR/packages.json" 2>/dev/null || echo "0")
COLL_COUNT=$(jq '. | length' "$SSG_DATA_DIR/collections.json" 2>/dev/null || echo "0")
echo "  📦 Packages: $PKG_COUNT"
echo "  📚 Collections: $COLL_COUNT"
echo ""

if [ "$DEBUG" = "true" ]; then
  echo "Debug Info:"
  echo "  Working directory: $(pwd)"
  echo "  SSG data path (absolute): $(realpath "$SSG_DATA_DIR")"
  echo "  packages.json path: $(realpath "$SSG_DATA_DIR/packages.json")"
  echo "  collections.json path: $(realpath "$SSG_DATA_DIR/collections.json")"
  echo ""
fi

success "Ready for Next.js build!"
