#!/bin/bash
# Test infrastructure with Pulumi preview
# This runs a dry-run to validate the infrastructure without deploying

set -e

echo "🧪 Testing Pulumi Infrastructure (Preview Mode)"
echo "==============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current stack
STACK=$(pulumi stack --show-name 2>/dev/null || echo "none")

if [ "$STACK" == "none" ]; then
    echo -e "${RED}✗${NC} No Pulumi stack selected"
    echo "Available options:"
    echo "  1. Select existing: pulumi stack select <name>"
    echo "  2. Create new:      pulumi stack init <name>"
    exit 1
fi

echo -e "${BLUE}ℹ${NC}  Testing stack: $STACK"
echo ""

# Run pre-deployment checks first
if [ -f "./scripts/pre-deploy-check.sh" ]; then
    echo "Running pre-deployment checks..."
    ./scripts/pre-deploy-check.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗${NC} Pre-deployment checks failed. Fix errors before preview."
        exit 1
    fi
    echo ""
fi

# Run Pulumi preview
echo "Running Pulumi preview..."
echo "This will show what changes would be made WITHOUT actually deploying."
echo ""

# Save preview output
PREVIEW_FILE="/tmp/pulumi-preview-$(date +%Y%m%d-%H%M%S).txt"

if pulumi preview --diff --show-reads --show-replacement-steps | tee "$PREVIEW_FILE"; then
    echo ""
    echo -e "${GREEN}✓${NC} Preview completed successfully!"
    echo ""
    echo "Preview saved to: $PREVIEW_FILE"
    echo ""

    # Parse preview output for insights
    CREATES=$(grep -c "^\s*+\s*" "$PREVIEW_FILE" 2>/dev/null || echo "0")
    UPDATES=$(grep -c "^\s*~\s*" "$PREVIEW_FILE" 2>/dev/null || echo "0")
    DELETES=$(grep -c "^\s*-\s*" "$PREVIEW_FILE" 2>/dev/null || echo "0")
    REPLACES=$(grep -c "^\s*+-\s*" "$PREVIEW_FILE" 2>/dev/null || echo "0")

    echo "Summary of changes:"
    echo "  Creates:  $CREATES resources"
    echo "  Updates:  $UPDATES resources"
    echo "  Deletes:  $DELETES resources"
    echo "  Replaces: $REPLACES resources"
    echo ""

    if [ "$REPLACES" -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC}  WARNING: $REPLACES resource(s) will be REPLACED (destroyed and recreated)"
        echo "  This may cause downtime. Review carefully:"
        grep "^\s*+-\s*" "$PREVIEW_FILE" || true
        echo ""
    fi

    if [ "$DELETES" -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC}  WARNING: $DELETES resource(s) will be DELETED"
        echo "  Review carefully:"
        grep "^\s*-\s*" "$PREVIEW_FILE" || true
        echo ""
    fi

    echo "Next steps:"
    echo "  1. Review the preview output above"
    echo "  2. If changes look correct: pulumi up"
    echo "  3. To cancel:                pulumi cancel"

    exit 0
else
    echo ""
    echo -e "${RED}✗${NC} Preview failed!"
    echo ""
    echo "Common issues:"
    echo "  - Missing configuration: pulumi config set <key> <value>"
    echo "  - Invalid credentials:   aws configure"
    echo "  - Syntax errors:         check TypeScript files"
    echo ""
    echo "Preview output saved to: $PREVIEW_FILE"
    exit 1
fi
