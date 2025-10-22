#!/bin/bash
set -e

# Upload scraped data and quality scores to S3
# Usage: ./scripts/upload-data-to-s3.sh [environment]

ENVIRONMENT=${1:-prod}
S3_BUCKET="prpm-registry-data-${ENVIRONMENT}"
DATA_DIR="./data"

echo "📦 Uploading data to S3..."

# Create bucket if doesn't exist
aws s3 mb "s3://${S3_BUCKET}" 2>/dev/null || true

# Upload scraped packages
echo "  📄 Uploading scraped packages..."
aws s3 sync "${DATA_DIR}/scraped/" "s3://${S3_BUCKET}/scraped/" \
  --delete \
  --exclude "*.md" \
  --exclude "*-enhanced.json" \
  --exclude "*-report.json"

# Upload quality scores
echo "  ⭐ Uploading quality scores..."
aws s3 sync "${DATA_DIR}/quality-scores/" "s3://${S3_BUCKET}/quality-scores/" \
  --delete

# Create version marker
VERSION=$(date +%Y%m%d-%H%M%S)
echo "${VERSION}" | aws s3 cp - "s3://${S3_BUCKET}/version.txt"

echo "✅ Upload complete! Version: ${VERSION}"
echo "   Bucket: s3://${S3_BUCKET}"
