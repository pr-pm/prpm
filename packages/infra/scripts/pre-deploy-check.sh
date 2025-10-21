#!/bin/bash
# Pre-deployment validation checklist
# Run this before `pulumi up` to catch issues early

set -e

echo "🔍 PRPM Infrastructure Pre-Deployment Checklist"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check AWS credentials
check_aws_credentials() {
    if aws sts get-caller-identity &> /dev/null; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        REGION=$(aws configure get region)
        echo -e "${GREEN}✓${NC} AWS credentials valid"
        echo "  Account: $ACCOUNT_ID"
        echo "  Region: $REGION"
        return 0
    else
        echo -e "${RED}✗${NC} AWS credentials invalid or not configured"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check Pulumi stack
check_pulumi_stack() {
    if pulumi stack --show-name &> /dev/null; then
        STACK=$(pulumi stack --show-name)
        echo -e "${GREEN}✓${NC} Pulumi stack selected: $STACK"

        # Check if stack is dev/staging/prod
        if [[ "$STACK" == "dev" ]] || [[ "$STACK" == "staging" ]] || [[ "$STACK" == "prod" ]]; then
            echo "  Valid stack name"
        else
            echo -e "${YELLOW}⚠${NC}  Stack name '$STACK' is not standard (expected: dev, staging, or prod)"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 0
    else
        echo -e "${RED}✗${NC} No Pulumi stack selected"
        echo "  Run: pulumi stack select <stack-name>"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check required config (removed - now inline in main script)

# Function to check AWS quotas/limits
check_aws_quotas() {
    echo "Checking AWS service quotas..."

    # Check VPC limit
    VPC_COUNT=$(aws ec2 describe-vpcs --query 'length(Vpcs)' --output text 2>/dev/null || echo "0")
    if [ "$VPC_COUNT" -lt 5 ]; then
        echo -e "${GREEN}✓${NC} VPC quota ok ($VPC_COUNT/5 used)"
    else
        echo -e "${YELLOW}⚠${NC}  VPC quota near limit ($VPC_COUNT/5 used)"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check Elastic IP limit
    EIP_COUNT=$(aws ec2 describe-addresses --query 'length(Addresses)' --output text 2>/dev/null || echo "0")
    if [ "$EIP_COUNT" -lt 5 ]; then
        echo -e "${GREEN}✓${NC} Elastic IP quota ok ($EIP_COUNT/5 used)"
    else
        echo -e "${YELLOW}⚠${NC}  Elastic IP quota near limit ($EIP_COUNT/5 used)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Function to estimate costs
estimate_costs() {
    STACK=$(pulumi stack --show-name 2>/dev/null || echo "unknown")

    echo ""
    echo "💰 Estimated Monthly Costs (approximate):"
    echo "  ----------------------------------------"

    if [[ "$STACK" == "dev" ]]; then
        echo "  Beanstalk (1x t3.micro): ~\$7.50"
        echo "  RDS (db.t4g.micro):      ~\$15"
        echo "  Bastion (t3.micro):      ~\$7.50"
        echo "  S3 + CloudFront:         ~\$5"
        echo "  Data transfer + logs:    ~\$2.50"
        echo "  ----------------------------------------"
        echo "  Total:                   ~\$37.50/month"
    elif [[ "$STACK" == "staging" ]]; then
        echo "  Beanstalk (2x t3.small): ~\$30"
        echo "  RDS (db.t4g.small):      ~\$30"
        echo "  Bastion (t3.micro):      ~\$7.50"
        echo "  S3 + CloudFront:         ~\$10"
        echo "  Data transfer + logs:    ~\$5"
        echo "  ----------------------------------------"
        echo "  Total:                   ~\$82.50/month"
    elif [[ "$STACK" == "prod" ]]; then
        echo "  Beanstalk (2x t3.micro): ~\$15"
        echo "  RDS (db.t4g.micro):      ~\$15"
        echo "  Bastion (t3.micro):      ~\$7.50"
        echo "  S3 + CloudFront:         ~\$10"
        echo "  Data transfer + logs:    ~\$5"
        echo "  ----------------------------------------"
        echo "  Total:                   ~\$52.50/month"
    fi

    echo ""
    echo -e "${YELLOW}⚠${NC}  These are estimates. Actual costs may vary based on usage."
}

# Run all checks
echo "1. Checking Prerequisites"
echo "-------------------------"
check_command pulumi
check_command aws
check_command docker
check_command jq
echo ""

echo "2. Checking AWS Credentials"
echo "---------------------------"
check_aws_credentials
echo ""

echo "3. Checking Pulumi Configuration"
echo "--------------------------------"
check_pulumi_stack

# Check if config exists, but don't fail if missing (provision script will prompt)
if pulumi config get aws:region &> /dev/null; then
    echo "Checking configuration values..."
    CONFIG_MISSING=0

    REQUIRED_CONFIGS=(
        "db:password"
        "github:clientId"
        "github:clientSecret"
        "aws:region"
    )

    for conf in "${REQUIRED_CONFIGS[@]}"; do
        if pulumi config get $conf --show-secrets &> /dev/null; then
            echo -e "${GREEN}✓${NC} $conf is set"
        else
            echo -e "${YELLOW}⚠${NC}  $conf is not set (will be prompted during provisioning)"
            CONFIG_MISSING=$((CONFIG_MISSING + 1))
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "${YELLOW}⚠${NC}  Stack not yet configured (this is OK for first-time setup)"
    echo "  Configuration will be set during provisioning"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo "4. Checking AWS Service Quotas"
echo "------------------------------"
check_aws_quotas
echo ""

estimate_costs

# Summary
echo ""
echo "================================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Pre-deployment checks passed!"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC}  $WARNINGS warning(s) found (configuration will be prompted if needed)"
    fi
    exit 0
else
    echo -e "${RED}✗${NC} $ERRORS critical error(s) found. Fix before deploying."
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC}  $WARNINGS warning(s) also found."
    fi
    echo ""
    echo "Please fix the errors above before continuing."
    exit 1
fi
