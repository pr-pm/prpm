#!/bin/bash
# Test Pulumi workflow configuration
# This script validates the GitHub Actions workflows for Pulumi infrastructure deployment

set -e

echo "🔍 Pulumi Workflow Validation Test"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check if a secret exists
check_secret() {
    local secret_name=$1
    if gh secret list | grep -q "^${secret_name}"; then
        echo -e "${GREEN}✓${NC} Secret '${secret_name}' exists"
        return 0
    else
        echo -e "${RED}✗${NC} Secret '${secret_name}' NOT FOUND"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check required config
check_config_requirement() {
    local config_name=$1
    local description=$2
    echo -e "${YELLOW}ℹ${NC} Config '${config_name}' required: ${description}"
}

echo "1. Checking GitHub Secrets"
echo "=========================="
echo ""

# Required secrets from workflows
check_secret "PULUMI_ACCESS_TOKEN"
check_secret "AWS_ROLE_ARN" || echo -e "${YELLOW}  Note: AWS_ROLE_ARN needed for OIDC authentication${NC}"
check_secret "PULUMI_CONFIG_PASSPHRASE"

# Optional AWS credentials (if not using OIDC)
if ! gh secret list | grep -q "^AWS_ROLE_ARN"; then
    echo ""
    echo -e "${YELLOW}⚠${NC} AWS_ROLE_ARN not found, checking for legacy credentials..."
    check_secret "AWS_ACCESS_KEY_ID" && check_secret "AWS_SECRET_ACCESS_KEY"
fi

echo ""
echo "2. Checking Pulumi Configuration Requirements"
echo "=============================================="
echo ""

# Required configurations from index.ts
check_config_requirement "db:password" "Database password (REQUIRED SECRET)"
check_config_requirement "github:clientId" "GitHub OAuth client ID (REQUIRED SECRET)"
check_config_requirement "github:clientSecret" "GitHub OAuth client secret (REQUIRED SECRET)"

echo ""
echo "Optional configurations:"
check_config_requirement "db:username" "Database username (default: prmp)"
check_config_requirement "db:instanceClass" "RDS instance class (default: db.t4g.micro)"
check_config_requirement "db:allocatedStorage" "Database storage in GB (default: 20)"
check_config_requirement "app:image" "Docker image name (default: prmp-registry:latest)"
check_config_requirement "app:cpu" "ECS task CPU (default: 256)"
check_config_requirement "app:memory" "ECS task memory in MB (default: 512)"
check_config_requirement "app:desiredCount" "Number of ECS tasks (default: 2)"
check_config_requirement "app:domainName" "Custom domain name (optional)"
check_config_requirement "search:enabled" "Enable OpenSearch (default: false)"

echo ""
echo "3. Validating Workflow Files"
echo "============================="
echo ""

# Check if workflow files exist
WORKFLOW_DIR="../../.github/workflows"
if [ -f "${WORKFLOW_DIR}/infra-deploy.yml" ]; then
    echo -e "${GREEN}✓${NC} infra-deploy.yml exists"
else
    echo -e "${RED}✗${NC} infra-deploy.yml NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "${WORKFLOW_DIR}/infra-preview.yml" ]; then
    echo -e "${GREEN}✓${NC} infra-preview.yml exists"
else
    echo -e "${RED}✗${NC} infra-preview.yml NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "4. Validating Workflow Configuration"
echo "====================================="
echo ""

# Check infra-deploy.yml configuration
if [ -f "${WORKFLOW_DIR}/infra-deploy.yml" ]; then
    echo "infra-deploy.yml:"

    # Check for PULUMI_ACCESS_TOKEN
    if grep -q "PULUMI_ACCESS_TOKEN.*secrets.PULUMI_ACCESS_TOKEN" "${WORKFLOW_DIR}/infra-deploy.yml"; then
        echo -e "  ${GREEN}✓${NC} Uses PULUMI_ACCESS_TOKEN from secrets"
    else
        echo -e "  ${RED}✗${NC} PULUMI_ACCESS_TOKEN not configured correctly"
        ERRORS=$((ERRORS + 1))
    fi

    # Check for AWS credentials
    if grep -q "aws-actions/configure-aws-credentials" "${WORKFLOW_DIR}/infra-deploy.yml"; then
        echo -e "  ${GREEN}✓${NC} Configures AWS credentials"
    else
        echo -e "  ${RED}✗${NC} AWS credentials configuration missing"
        ERRORS=$((ERRORS + 1))
    fi

    # Check for Pulumi action
    if grep -q "pulumi/actions@v5" "${WORKFLOW_DIR}/infra-deploy.yml"; then
        echo -e "  ${GREEN}✓${NC} Uses Pulumi GitHub Action v5"
    else
        echo -e "  ${YELLOW}⚠${NC} Pulumi action version might be outdated"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check for pulumi up command
    if grep -q "pulumi up --yes" "${WORKFLOW_DIR}/infra-deploy.yml"; then
        echo -e "  ${GREEN}✓${NC} Runs 'pulumi up --yes'"
    else
        echo -e "  ${RED}✗${NC} 'pulumi up' command not found"
        ERRORS=$((ERRORS + 1))
    fi

    # Check for stack selection
    if grep -q "pulumi stack select" "${WORKFLOW_DIR}/infra-deploy.yml"; then
        echo -e "  ${GREEN}✓${NC} Selects Pulumi stack"
    else
        echo -e "  ${YELLOW}⚠${NC} Stack selection not explicit"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# Check infra-preview.yml configuration
if [ -f "${WORKFLOW_DIR}/infra-preview.yml" ]; then
    echo "infra-preview.yml:"

    # Check for PULUMI_ACCESS_TOKEN
    if grep -q "PULUMI_ACCESS_TOKEN.*secrets.PULUMI_ACCESS_TOKEN" "${WORKFLOW_DIR}/infra-preview.yml"; then
        echo -e "  ${GREEN}✓${NC} Uses PULUMI_ACCESS_TOKEN from secrets"
    else
        echo -e "  ${RED}✗${NC} PULUMI_ACCESS_TOKEN not configured correctly"
        ERRORS=$((ERRORS + 1))
    fi

    # Check for pulumi preview command
    if grep -q "pulumi preview" "${WORKFLOW_DIR}/infra-preview.yml"; then
        echo -e "  ${GREEN}✓${NC} Runs 'pulumi preview'"
    else
        echo -e "  ${RED}✗${NC} 'pulumi preview' command not found"
        ERRORS=$((ERRORS + 1))
    fi

    # Check for matrix strategy
    if grep -q "strategy:" "${WORKFLOW_DIR}/infra-preview.yml" && grep -q "matrix:" "${WORKFLOW_DIR}/infra-preview.yml"; then
        echo -e "  ${GREEN}✓${NC} Uses matrix strategy for multiple stacks"
    else
        echo -e "  ${YELLOW}⚠${NC} Matrix strategy not configured"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""
echo "5. Checking Pulumi Project Configuration"
echo "========================================="
echo ""

# Check Pulumi.yaml
if [ -f "Pulumi.yaml" ]; then
    echo -e "${GREEN}✓${NC} Pulumi.yaml exists"

    # Validate it's a TypeScript project
    if grep -q "runtime:.*nodejs" "Pulumi.yaml"; then
        echo -e "  ${GREEN}✓${NC} Runtime: Node.js"
    fi

    if grep -q "typescript: true" "Pulumi.yaml"; then
        echo -e "  ${GREEN}✓${NC} TypeScript: enabled"
    fi
else
    echo -e "${RED}✗${NC} Pulumi.yaml NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

# Check index.ts
if [ -f "index.ts" ]; then
    echo -e "${GREEN}✓${NC} index.ts exists"

    # Check for required imports
    if grep -q "import.*@pulumi/pulumi" "index.ts"; then
        echo -e "  ${GREEN}✓${NC} Imports Pulumi SDK"
    fi

    # Check for required secret configs
    if grep -q "requireSecret.*db:password" "index.ts"; then
        echo -e "  ${GREEN}✓${NC} Requires db:password secret"
    fi

    if grep -q "requireSecret.*github:clientId" "index.ts"; then
        echo -e "  ${GREEN}✓${NC} Requires github:clientId secret"
    fi

    if grep -q "requireSecret.*github:clientSecret" "index.ts"; then
        echo -e "  ${GREEN}✓${NC} Requires github:clientSecret secret"
    fi
else
    echo -e "${RED}✗${NC} index.ts NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "6. Checking Pulumi Modules"
echo "=========================="
echo ""

MODULES=("network" "database" "cache" "storage" "secrets" "ecs" "search" "monitoring")
for module in "${MODULES[@]}"; do
    if [ -f "modules/${module}.ts" ]; then
        echo -e "${GREEN}✓${NC} Module '${module}' exists"
    else
        echo -e "${RED}✗${NC} Module '${module}' NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "7. Workflow Permissions Check"
echo "=============================="
echo ""

# Check infra-deploy.yml permissions
if grep -q "id-token: write" "${WORKFLOW_DIR}/infra-deploy.yml"; then
    echo -e "${GREEN}✓${NC} infra-deploy.yml has id-token: write (required for AWS OIDC)"
else
    echo -e "${YELLOW}⚠${NC} infra-deploy.yml missing id-token: write permission"
    WARNINGS=$((WARNINGS + 1))
fi

# Check infra-preview.yml permissions
if grep -q "pull-requests: write" "${WORKFLOW_DIR}/infra-preview.yml"; then
    echo -e "${GREEN}✓${NC} infra-preview.yml has pull-requests: write"
else
    echo -e "${YELLOW}⚠${NC} infra-preview.yml missing pull-requests: write permission"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "8. Testing Workflow Triggers"
echo "============================="
echo ""

# Check deploy workflow triggers
echo "infra-deploy.yml triggers on:"
if grep -q "branches:.*main" "${WORKFLOW_DIR}/infra-deploy.yml"; then
    echo -e "  ${GREEN}✓${NC} Push to main branch"
fi
if grep -q "workflow_dispatch:" "${WORKFLOW_DIR}/infra-deploy.yml"; then
    echo -e "  ${GREEN}✓${NC} Manual dispatch (workflow_dispatch)"
fi
if grep -q "paths:.*packages/infra" "${WORKFLOW_DIR}/infra-deploy.yml"; then
    echo -e "  ${GREEN}✓${NC} Path filter: packages/infra/**"
fi

echo ""
echo "infra-preview.yml triggers on:"
if grep -q "pull_request:" "${WORKFLOW_DIR}/infra-preview.yml"; then
    echo -e "  ${GREEN}✓${NC} Pull requests"
fi
if grep -q "paths:.*packages/infra" "${WORKFLOW_DIR}/infra-preview.yml"; then
    echo -e "  ${GREEN}✓${NC} Path filter: packages/infra/**"
fi

echo ""
echo "=================================="
echo "Summary"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
else
    echo -e "${RED}✗ Found ${ERRORS} error(s)${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found ${WARNINGS} warning(s)${NC}"
fi

echo ""
echo "Next steps to test the workflow:"
echo "1. Create a PR that modifies packages/infra/ to trigger preview"
echo "2. Merge to main to trigger deployment (or use workflow_dispatch)"
echo "3. Monitor workflow execution in GitHub Actions tab"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Workflows are properly configured for Pulumi deployment!${NC}"
    exit 0
else
    echo -e "${RED}✗ Fix the errors above before deploying${NC}"
    exit 1
fi
