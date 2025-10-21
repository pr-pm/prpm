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

# Function to check required config
check_pulumi_config() {
    echo "Checking required configuration..."

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
            echo -e "${RED}✗${NC} $conf is not set"
            echo "  Run: pulumi config set --secret $conf <value>"
            ERRORS=$((ERRORS + 1))
        fi
    done
}

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
        echo "  RDS (db.t4g.micro):      ~\$15"
        echo "  ElastiCache (t4g.micro): ~\$12"
        echo "  ECS Fargate (2 tasks):   ~\$25"
        echo "  NAT Gateway:             ~\$32"
        echo "  ALB:                     ~\$16"
        echo "  S3 + CloudFront:         ~\$5"
        echo "  ----------------------------------------"
        echo "  Total:                   ~\$105/month"
    elif [[ "$STACK" == "staging" ]]; then
        echo "  RDS (db.t4g.small):      ~\$30"
        echo "  ElastiCache (t4g.small): ~\$24"
        echo "  ECS Fargate (2 tasks):   ~\$50"
        echo "  NAT Gateway:             ~\$32"
        echo "  ALB:                     ~\$16"
        echo "  S3 + CloudFront:         ~\$10"
        echo "  ----------------------------------------"
        echo "  Total:                   ~\$162/month"
    elif [[ "$STACK" == "prod" ]]; then
        echo "  RDS (db.t4g.medium):     ~\$60"
        echo "  ElastiCache (t4g.medium):~\$48"
        echo "  ECS Fargate (3+ tasks):  ~\$100"
        echo "  NAT Gateway:             ~\$32"
        echo "  ALB:                     ~\$16"
        echo "  S3 + CloudFront:         ~\$25"
        echo "  CloudWatch + Logs:       ~\$10"
        echo "  ----------------------------------------"
        echo "  Total:                   ~\$291/month"
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
check_pulumi_config
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
        echo -e "${YELLOW}⚠${NC}  $WARNINGS warning(s) found. Review before deploying."
    fi
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: pulumi preview"
    echo "  2. Deploy:         pulumi up"
    echo "  3. Monitor:        watch -n 5 'pulumi stack output'"
    exit 0
else
    echo -e "${RED}✗${NC} $ERRORS error(s) found. Fix before deploying."
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC}  $WARNINGS warning(s) also found."
    fi
    exit 1
fi
