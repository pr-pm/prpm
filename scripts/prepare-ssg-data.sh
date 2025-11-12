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
# Realistic mock data for local development
FALLBACK_PACKAGES=${FALLBACK_PACKAGES:-'[
  {"name":"@prpm/pulumi-troubleshooting-skill","description":"Comprehensive guide to troubleshooting Pulumi TypeScript errors","format":"claude","subtype":"skill","total_downloads":150,"weekly_downloads":25},
  {"name":"@prpm/creating-skills-skill","description":"Expert guidance for creating effective Claude Code skills","format":"claude","subtype":"skill","total_downloads":120,"weekly_downloads":20},
  {"name":"@prpm/typescript-type-safety","description":"Eliminate TypeScript any types and enforce strict type safety","format":"cursor","subtype":"rule","total_downloads":100,"weekly_downloads":15},
  {"name":"@prpm/postgres-migrations","description":"PostgreSQL migrations best practices and common errors","format":"cursor","subtype":"rule","total_downloads":85,"weekly_downloads":12},
  {"name":"@prpm/test-driven-development","description":"Write tests first to ensure they verify behavior","format":"claude","subtype":"skill","total_downloads":200,"weekly_downloads":30}
]'}
FALLBACK_COLLECTIONS=${FALLBACK_COLLECTIONS:-'[
  {"name_slug":"claude-plugins-builder","description":"Tools and skills for building Claude Code plugins","package_count":8,"downloads":450,"stars":12},
  {"name_slug":"accessibility-compliance","description":"WCAG compliance and accessibility testing","package_count":5,"downloads":280,"stars":8},
  {"name_slug":"api-testing-observability","description":"API testing and observability patterns","package_count":6,"downloads":320,"stars":10}
]'}

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

# Try S3 first, then fetch from registry API
echo "Step 2: Fetching SSG data..."

# Try downloading from S3 first (faster if available)
S3_SUCCESS=false
if command -v aws &> /dev/null; then
  debug "AWS CLI found, attempting S3 download"

  if aws s3 sync "$S3_BUCKET" "$SSG_DATA_DIR" \
    --exclude "*" \
    --include "packages.json" \
    --include "collections.json" \
    --no-progress 2>/dev/null; then

    # Verify we got real data (not empty)
    if [ -f "$SSG_DATA_DIR/packages.json" ] && [ -s "$SSG_DATA_DIR/packages.json" ]; then
      PKG_COUNT=$(jq '. | length' "$SSG_DATA_DIR/packages.json" 2>/dev/null || echo "0")
      if [ "$PKG_COUNT" -gt 100 ]; then
        success "Downloaded data from S3 ($PKG_COUNT packages)"
        S3_SUCCESS=true
      else
        warn "S3 data exists but seems incomplete ($PKG_COUNT packages), will fetch from registry"
      fi
    fi
  else
    warn "Could not download from S3"
  fi
else
  warn "AWS CLI not found"
fi

# If S3 failed or had incomplete data, fetch from registry API
if [ "$S3_SUCCESS" = false ]; then
  if [ -n "$SSG_DATA_TOKEN" ]; then
    warn "Fetching fresh data from registry API (this may take a minute)..."

    REGISTRY_URL="${REGISTRY_URL:-https://registry.prpm.dev}"
    debug "Registry URL: $REGISTRY_URL"

    # Fetch packages
    echo "  Fetching packages..."
    ALL_PACKAGES="[]"
    OFFSET=0
    LIMIT=1000
    HAS_MORE=true

    while [ "$HAS_MORE" = true ]; do
      debug "Fetching packages at offset $OFFSET"
      RESPONSE=$(curl -s -H "X-SSG-Token: $SSG_DATA_TOKEN" \
        "${REGISTRY_URL}/api/v1/packages/ssg-data?limit=${LIMIT}&offset=${OFFSET}")

      if [ $? -ne 0 ]; then
        error "Failed to fetch packages from registry"
        break
      fi

      PACKAGES=$(echo "$RESPONSE" | jq -r '.packages // []')
      PAGE_COUNT=$(echo "$PACKAGES" | jq '. | length')

      if [ "$PAGE_COUNT" = "0" ]; then
        break
      fi

      # Merge packages
      ALL_PACKAGES=$(echo "$ALL_PACKAGES" "$PACKAGES" | jq -s '.[0] + .[1]')
      OFFSET=$((OFFSET + LIMIT))

      HAS_MORE=$(echo "$RESPONSE" | jq -r '.hasMore // false')
      debug "Page: $PAGE_COUNT packages, total: $(echo "$ALL_PACKAGES" | jq '. | length'), hasMore: $HAS_MORE"

      if [ "$HAS_MORE" != "true" ]; then
        break
      fi

      # Safety: stop after 10K packages
      TOTAL=$(echo "$ALL_PACKAGES" | jq '. | length')
      if [ "$TOTAL" -gt 10000 ]; then
        warn "Reached 10K packages, stopping"
        break
      fi
    done

    echo "$ALL_PACKAGES" > "$SSG_DATA_DIR/packages.json"
    PKG_COUNT=$(echo "$ALL_PACKAGES" | jq '. | length')
    success "Fetched $PKG_COUNT packages from registry"

    # Fetch collections
    echo "  Fetching collections..."
    ALL_COLLECTIONS="[]"
    OFFSET=0
    HAS_MORE=true

    while [ "$HAS_MORE" = true ]; do
      debug "Fetching collections at offset $OFFSET"
      RESPONSE=$(curl -s -H "X-SSG-Token: $SSG_DATA_TOKEN" \
        "${REGISTRY_URL}/api/v1/collections/ssg-data?limit=${LIMIT}&offset=${OFFSET}")

      if [ $? -ne 0 ]; then
        error "Failed to fetch collections from registry"
        break
      fi

      COLLECTIONS=$(echo "$RESPONSE" | jq -r '.collections // []')
      PAGE_COUNT=$(echo "$COLLECTIONS" | jq '. | length')

      if [ "$PAGE_COUNT" = "0" ]; then
        break
      fi

      # Merge collections
      ALL_COLLECTIONS=$(echo "$ALL_COLLECTIONS" "$COLLECTIONS" | jq -s '.[0] + .[1]')
      OFFSET=$((OFFSET + LIMIT))

      HAS_MORE=$(echo "$RESPONSE" | jq -r '.hasMore // false')
      debug "Page: $PAGE_COUNT collections, total: $(echo "$ALL_COLLECTIONS" | jq '. | length'), hasMore: $HAS_MORE"

      if [ "$HAS_MORE" != "true" ]; then
        break
      fi
    done

    echo "$ALL_COLLECTIONS" > "$SSG_DATA_DIR/collections.json"
    COLL_COUNT=$(echo "$ALL_COLLECTIONS" | jq '. | length')
    success "Fetched $COLL_COUNT collections from registry"

  else
    warn "SSG_DATA_TOKEN not set and S3 failed, using fallback data"
  fi
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
