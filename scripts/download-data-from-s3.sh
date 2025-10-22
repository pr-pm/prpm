#!/bin/bash
set -e

# Download scraped data and quality scores from S3
# Usage: ./scripts/download-data-from-s3.sh [environment]

ENVIRONMENT=${1:-prod}
S3_BUCKET="prpm-registry-data-${ENVIRONMENT}"
DATA_DIR="./data"

echo "📦 Downloading data from S3..."

# Create data directories
mkdir -p "${DATA_DIR}/scraped"
mkdir -p "${DATA_DIR}/quality-scores"

# Download scraped packages
echo "  📄 Downloading scraped packages..."
aws s3 sync "s3://${S3_BUCKET}/scraped/" "${DATA_DIR}/scraped/" \
  --delete

# Download quality scores
echo "  ⭐ Downloading quality scores..."
aws s3 sync "s3://${S3_BUCKET}/quality-scores/" "${DATA_DIR}/quality-scores/" \
  --delete

# Show version
VERSION=$(aws s3 cp "s3://${S3_BUCKET}/version.txt" - 2>/dev/null || echo "unknown")
echo "✅ Download complete! Version: ${VERSION}"
echo "   📊 Scraped files: $(ls -1 ${DATA_DIR}/scraped/*.json 2>/dev/null | wc -l)"
echo "   ⭐ Quality score files: $(ls -1 ${DATA_DIR}/quality-scores/*.* 2>/dev/null | wc -l)"
