#!/bin/bash
# Deploy application to Elastic Beanstalk
# This script builds, packages, and deploys the registry application

set -e

echo "🚀 PRPM Beanstalk Deployment Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0;No Color'

# Change to infra directory
cd "$(dirname "$0")/.."

# Get outputs from Pulumi
echo "📋 Getting infrastructure details..."
APP_NAME=$(pulumi stack output beanstalkApplicationName 2>/dev/null)
ENV_NAME=$(pulumi stack output beanstalkEnvironmentName 2>/dev/null)
S3_BUCKET=$(pulumi stack output s3BucketName 2>/dev/null)
REGION=$(pulumi config get aws:region 2>/dev/null || echo "us-west-2")

if [ -z "$APP_NAME" ] || [ -z "$ENV_NAME" ] || [ -z "$S3_BUCKET" ]; then
    echo -e "${RED}✗${NC} Could not get Beanstalk details from Pulumi"
    echo "Make sure you've deployed the infrastructure first:"
    echo "  pulumi up"
    exit 1
fi

echo -e "${GREEN}✓${NC} Application: $APP_NAME"
echo -e "${GREEN}✓${NC} Environment: $ENV_NAME"
echo -e "${GREEN}✓${NC} S3 Bucket: $S3_BUCKET"
echo -e "${GREEN}✓${NC} Region: $REGION"
echo ""

# Build application
echo "🏗️  Building application..."
cd ../../registry

# Clean previous builds
rm -rf node_modules dist *.zip 2>/dev/null || true

# Install dependencies (production only)
echo "  Installing dependencies..."
npm ci --production --quiet

# Build TypeScript
echo "  Compiling TypeScript..."
npm run build

# Create application bundle
echo "📦 Creating deployment package..."
VERSION="v$(date +%Y%m%d-%H%M%S)"
ZIP_FILE="prpm-registry-${VERSION}.zip"

# Create zip with all necessary files
zip -r $ZIP_FILE \
    dist/ \
    node_modules/ \
    package.json \
    package-lock.json \
    .ebextensions/ \
    .platform/ \
    Procfile \
    -x "*.git*" "*.DS_Store" "node_modules/.cache/*" \
    2>&1 | grep -v "adding:" || true

echo -e "${GREEN}✓${NC} Package created: $ZIP_FILE ($(du -h $ZIP_FILE | cut -f1))"
echo ""

# Upload to S3
echo "☁️  Uploading to S3..."
S3_KEY="registry/${ZIP_FILE}"

aws s3 cp $ZIP_FILE s3://${S3_BUCKET}/${S3_KEY} --region $REGION

echo -e "${GREEN}✓${NC} Uploaded to s3://${S3_BUCKET}/${S3_KEY}"
echo ""

# Create application version
echo "📝 Creating Beanstalk application version..."
aws elasticbeanstalk create-application-version \
    --application-name $APP_NAME \
    --version-label $VERSION \
    --source-bundle S3Bucket="$S3_BUCKET",S3Key="$S3_KEY" \
    --description "Deployed on $(date '+%Y-%m-%d %H:%M:%S')" \
    --region $REGION \
    --output json | jq -r '.ApplicationVersion | "Version: \(.VersionLabel)\nStatus: \(.Status)"'

echo ""

# Deploy to environment
echo "🚢 Deploying to environment..."
echo "This may take 3-5 minutes..."
echo ""

aws elasticbeanstalk update-environment \
    --application-name $APP_NAME \
    --environment-name $ENV_NAME \
    --version-label $VERSION \
    --region $REGION \
    --output json | jq -r '. | "Environment: \(.EnvironmentName)\nStatus: \(.Status)\nHealth: \(.Health)"'

echo ""
echo -e "${BLUE}ℹ${NC}  Monitoring deployment status..."
echo "You can watch progress with:"
echo "  aws elasticbeanstalk describe-environment-health --environment-name $ENV_NAME --attribute-names All --region $REGION"
echo ""

# Wait for deployment to complete
echo "Waiting for deployment..."
aws elasticbeanstalk wait environment-updated \
    --environment-name $ENV_NAME \
    --region $REGION

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""

# Get environment info
ENDPOINT=$(pulumi stack output beanstalkEndpoint -C ../../infra 2>/dev/null)
echo "🌐 Application URL: $ENDPOINT"
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 5  # Give app a moment to stabilize

if curl -f -s "$ENDPOINT/health" > /dev/null; then
    echo -e "${GREEN}✓${NC} Health check passed"
    curl -s "$ENDPOINT/health" | jq '.'
else
    echo -e "${YELLOW}⚠${NC}  Health check failed (app may still be starting up)"
    echo "Check logs with:"
    echo "  eb logs $ENV_NAME --tail"
fi

echo ""
echo "📊 Next steps:"
echo "  View logs:     eb logs $ENV_NAME --tail"
echo "  Check status:  eb status $ENV_NAME"
echo "  Open in browser: open $ENDPOINT"
echo ""

# Cleanup
echo "🧹 Cleaning up local files..."
rm -f $ZIP_FILE
cd ../../infra

echo -e "${GREEN}✅ Deployment script complete!${NC}"
