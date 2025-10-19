#!/bin/bash

# PRPM Infrastructure Validation Script
# Tests Pulumi configuration without deploying

set -e

echo "========================================="
echo "PRPM Infrastructure Validation"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "Pulumi.yaml" ]; then
    echo -e "${RED}❌ Error: Must run from packages/infra directory${NC}"
    exit 1
fi

echo "✅ Running from correct directory"
echo ""

# Check Pulumi installation
echo "Checking Pulumi installation..."
if ! command -v pulumi &> /dev/null; then
    echo -e "${RED}❌ Pulumi CLI not installed${NC}"
    echo "Install: curl -fsSL https://get.pulumi.com | sh"
    exit 1
fi
echo -e "${GREEN}✅ Pulumi CLI installed: $(pulumi version)${NC}"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version must be >= 20.0.0 (current: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo ""

# Check if logged into Pulumi
echo "Checking Pulumi login status..."
if ! pulumi whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged into Pulumi${NC}"
    echo "Run: pulumi login"
    exit 1
fi
echo -e "${GREEN}✅ Logged into Pulumi as: $(pulumi whoami)${NC}"
echo ""

# Check if stack exists
echo "Checking Pulumi stack..."
CURRENT_STACK=$(pulumi stack --show-name 2>/dev/null || echo "none")
echo "Current stack: $CURRENT_STACK"
echo ""

# Install dependencies
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
    echo "Installing..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# List available stacks
echo "Available stacks:"
pulumi stack ls 2>/dev/null || echo "  (none)"
echo ""

# Check TypeScript compilation
echo "Checking TypeScript compilation..."
if ! npx tsc --noEmit; then
    echo -e "${RED}❌ TypeScript compilation errors${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript compiles successfully${NC}"
echo ""

# Validate Pulumi configuration
echo "Validating Pulumi configuration..."
echo ""

if [ "$CURRENT_STACK" != "none" ]; then
    echo "Configuration for stack: $CURRENT_STACK"
    echo "---"

    # Check required config
    REQUIRED_CONFIGS=(
        "aws:region"
    )

    REQUIRED_SECRETS=(
        "db:password"
        "github:clientId"
        "github:clientSecret"
    )

    MISSING=0

    for config in "${REQUIRED_CONFIGS[@]}"; do
        if pulumi config get $config &> /dev/null; then
            VALUE=$(pulumi config get $config)
            echo -e "${GREEN}✅ $config: $VALUE${NC}"
        else
            echo -e "${RED}❌ $config: NOT SET${NC}"
            MISSING=1
        fi
    done

    for secret in "${REQUIRED_SECRETS[@]}"; do
        if pulumi config get $secret &> /dev/null; then
            echo -e "${GREEN}✅ $secret: [secret]${NC}"
        else
            echo -e "${RED}❌ $secret: NOT SET${NC}"
            MISSING=1
        fi
    done

    echo ""

    if [ $MISSING -eq 1 ]; then
        echo -e "${YELLOW}⚠️  Missing required configuration${NC}"
        echo ""
        echo "Set missing values with:"
        echo "  pulumi config set aws:region us-east-1"
        echo "  pulumi config set --secret db:password <PASSWORD>"
        echo "  pulumi config set --secret github:clientId <CLIENT_ID>"
        echo "  pulumi config set --secret github:clientSecret <CLIENT_SECRET>"
        exit 1
    fi

    # Show optional configuration
    echo "Optional configuration:"
    OPTIONAL_CONFIGS=(
        "db:username"
        "db:instanceClass"
        "db:allocatedStorage"
        "app:cpu"
        "app:memory"
        "app:desiredCount"
        "app:domainName"
        "search:enabled"
    )

    for config in "${OPTIONAL_CONFIGS[@]}"; do
        if pulumi config get $config &> /dev/null; then
            VALUE=$(pulumi config get $config)
            echo "  $config: $VALUE"
        else
            echo "  $config: (using default)"
        fi
    done

    echo ""
else
    echo -e "${YELLOW}⚠️  No stack selected${NC}"
    echo ""
    echo "Initialize a stack:"
    echo "  pulumi stack init dev"
    echo "  pulumi stack init staging"
    echo "  pulumi stack init prod"
    echo ""
    exit 1
fi

# Test Pulumi preview (dry run)
echo "========================================="
echo "Running Pulumi Preview (Dry Run)"
echo "========================================="
echo ""
echo "This will show what would be created without making any changes..."
echo ""

# Run preview
if pulumi preview --non-interactive 2>&1 | tee /tmp/pulumi-preview.log; then
    echo ""
    echo -e "${GREEN}✅ Pulumi preview successful!${NC}"
    echo ""

    # Extract resource counts
    echo "Summary:"
    grep -E "^\s+[+~-]" /tmp/pulumi-preview.log | head -20 || true

else
    echo ""
    echo -e "${RED}❌ Pulumi preview failed${NC}"
    echo "Check the errors above and fix configuration"
    exit 1
fi

echo ""
echo "========================================="
echo "Validation Complete!"
echo "========================================="
echo ""
echo -e "${GREEN}✅ Infrastructure configuration is valid${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the preview output above"
echo "  2. If everything looks good, run: pulumi up"
echo "  3. Follow the PRODUCTION_DEPLOYMENT_GUIDE.md for full deployment"
echo ""
