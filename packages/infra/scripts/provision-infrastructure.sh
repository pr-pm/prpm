#!/bin/bash
# Infrastructure Provisioning Script
#
# This script provisions AWS infrastructure (one-time or infrequent operation):
# - VPC, subnets, security groups
# - RDS PostgreSQL database
# - S3 bucket for packages
# - Elastic Beanstalk application and environment
# - Route53 DNS records (optional)
# - ACM SSL certificates (optional)
#
# Usage:
#   ./scripts/provision-infrastructure.sh dev
#   ./scripts/provision-infrastructure.sh staging
#   ./scripts/provision-infrastructure.sh prod
#
# This is separate from application deployment which happens frequently.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get stack from argument or default to dev
STACK="${1:-dev}"

if [[ ! "$STACK" =~ ^(dev|staging|prod)$ ]]; then
  echo -e "${RED}Error: Stack must be dev, staging, or prod${NC}"
  echo "Usage: $0 [dev|staging|prod]"
  exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         PRPM Infrastructure Provisioning Tool             ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║  Provisions AWS infrastructure via Pulumi                 ║${NC}"
echo -e "${BLUE}║  Stack: ${STACK}                                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Change to infra directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo -e "${YELLOW}→${NC} Running pre-deployment checks..."
./scripts/pre-deploy-check.sh

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Step 1: Configure Pulumi Stack${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Login to Pulumi
echo -e "${YELLOW}→${NC} Logging into Pulumi..."
pulumi login

# Select or create stack
echo -e "${YELLOW}→${NC} Selecting stack: $STACK"
pulumi stack select $STACK 2>/dev/null || pulumi stack init $STACK

echo -e "${GREEN}✓${NC} Stack selected: $STACK"
echo ""

# Check if stack is already configured
if pulumi config get aws:region &>/dev/null; then
  echo -e "${YELLOW}⚠${NC}  Stack already configured. Current configuration:"
  echo ""
  pulumi config
  echo ""
  read -p "Do you want to reconfigure? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}→${NC} Skipping configuration, using existing values"
    SKIP_CONFIG=true
  fi
fi

if [[ "$SKIP_CONFIG" != "true" ]]; then
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Step 2: Set Configuration Values${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo ""

  # AWS Region
  read -p "AWS Region [us-west-2]: " AWS_REGION
  AWS_REGION=${AWS_REGION:-us-west-2}
  pulumi config set aws:region $AWS_REGION

  echo ""
  echo -e "${YELLOW}→${NC} Database Configuration"
  echo ""

  # Database username
  read -p "Database username [prpm]: " DB_USERNAME
  DB_USERNAME=${DB_USERNAME:-prpm}
  pulumi config set db:username $DB_USERNAME

  # Database password
  read -sp "Database password (will be encrypted): " DB_PASSWORD
  echo ""
  pulumi config set --secret db:password "$DB_PASSWORD"

  # Database instance class
  echo ""
  echo "Database instance classes:"
  echo "  db.t4g.micro   - 1 vCPU, 1 GB RAM (~\$15/month)"
  echo "  db.t4g.small   - 2 vCPU, 2 GB RAM (~\$30/month)"
  echo "  db.t4g.medium  - 4 vCPU, 4 GB RAM (~\$60/month)"
  read -p "Database instance class [db.t4g.micro]: " DB_INSTANCE
  DB_INSTANCE=${DB_INSTANCE:-db.t4g.micro}
  pulumi config set db:instanceClass $DB_INSTANCE

  # Database storage
  read -p "Database storage (GB) [20]: " DB_STORAGE
  DB_STORAGE=${DB_STORAGE:-20}
  pulumi config set db:allocatedStorage $DB_STORAGE

  echo ""
  echo -e "${YELLOW}→${NC} GitHub OAuth Configuration"
  echo ""
  echo "Create GitHub OAuth App at: https://github.com/settings/developers"
  echo ""

  read -p "GitHub Client ID: " GITHUB_CLIENT_ID
  pulumi config set --secret github:clientId "$GITHUB_CLIENT_ID"

  read -sp "GitHub Client Secret: " GITHUB_CLIENT_SECRET
  echo ""
  pulumi config set --secret github:clientSecret "$GITHUB_CLIENT_SECRET"

  echo ""
  echo -e "${YELLOW}→${NC} JWT Configuration"
  echo ""
  echo "Generate a secure random string for JWT signing (min 32 characters)"
  echo "Example: openssl rand -base64 32"
  echo ""

  read -sp "JWT Secret: " JWT_SECRET
  echo ""
  pulumi config set --secret jwt:secret "$JWT_SECRET"

  echo ""
  echo -e "${YELLOW}→${NC} Beanstalk Configuration"
  echo ""

  # Instance type
  echo "Instance types:"
  echo "  t3.micro   - 2 vCPU, 1 GB RAM (~\$7.50/month)"
  echo "  t3.small   - 2 vCPU, 2 GB RAM (~\$15/month)"
  echo "  t3.medium  - 2 vCPU, 4 GB RAM (~\$30/month)"
  read -p "Instance type [t3.micro]: " INSTANCE_TYPE
  INSTANCE_TYPE=${INSTANCE_TYPE:-t3.micro}
  pulumi config set app:instanceType $INSTANCE_TYPE

  # Auto-scaling
  read -p "Minimum instances [1]: " MIN_SIZE
  MIN_SIZE=${MIN_SIZE:-1}
  pulumi config set app:minSize $MIN_SIZE

  read -p "Maximum instances [2]: " MAX_SIZE
  MAX_SIZE=${MAX_SIZE:-2}
  pulumi config set app:maxSize $MAX_SIZE

  # Domain (optional)
  echo ""
  read -p "Custom domain (optional, e.g., registry.prpm.dev): " DOMAIN_NAME
  if [[ -n "$DOMAIN_NAME" ]]; then
    pulumi config set app:domainName $DOMAIN_NAME
    echo -e "${YELLOW}⚠${NC}  Make sure Route53 hosted zone exists for the base domain"
  fi

  echo ""
  echo -e "${GREEN}✓${NC} Configuration complete"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Step 3: Review Configuration${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

pulumi config

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Step 4: Preview Infrastructure Changes${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}→${NC} Running Pulumi preview..."
echo ""

pulumi preview --diff --show-replacement-steps

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Step 5: Deploy Infrastructure${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Cost estimate
echo -e "${YELLOW}💰 Estimated Monthly Cost:${NC}"
if [[ "$STACK" == "prod" ]]; then
  echo "  - Beanstalk (2x t3.micro): ~\$15"
  echo "  - RDS (db.t4g.micro): ~\$15"
  echo "  - S3 + CloudFront: ~\$10"
  echo "  - Data transfer: ~\$5"
  echo "  ${BLUE}Total: ~\$45/month${NC}"
else
  echo "  - Beanstalk (1x t3.micro): ~\$7.50"
  echo "  - RDS (db.t4g.micro): ~\$15"
  echo "  - S3 + CloudFront: ~\$5"
  echo "  - Data transfer: ~\$2.50"
  echo "  ${BLUE}Total: ~\$30/month${NC}"
fi
echo ""

read -p "Deploy infrastructure? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}→${NC} Deployment cancelled"
  exit 0
fi

echo ""
echo -e "${YELLOW}→${NC} Deploying infrastructure..."
echo -e "${YELLOW}⚠${NC}  This may take 10-15 minutes..."
echo ""

pulumi up --yes

echo ""
echo -e "${GREEN}✓${NC} Infrastructure deployed successfully!"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Step 6: Deployment Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Get outputs
pulumi stack output --json > outputs.json

BEANSTALK_ENV=$(pulumi stack output beanstalkEnvironmentName 2>/dev/null || echo "N/A")
BEANSTALK_CNAME=$(pulumi stack output beanstalkCname 2>/dev/null || echo "N/A")
DB_ENDPOINT=$(pulumi stack output dbEndpoint 2>/dev/null || echo "N/A")
S3_BUCKET=$(pulumi stack output s3BucketName 2>/dev/null || echo "N/A")

echo -e "${GREEN}Infrastructure Outputs:${NC}"
echo ""
echo "  Beanstalk Environment: $BEANSTALK_ENV"
echo "  Beanstalk URL: http://$BEANSTALK_CNAME"
echo "  Database Endpoint: $DB_ENDPOINT"
echo "  S3 Bucket: $S3_BUCKET"
echo ""

if [[ "$DOMAIN_NAME" ]]; then
  echo "  Custom Domain: https://$DOMAIN_NAME"
  echo "  ${YELLOW}⚠${NC}  DNS propagation may take a few minutes"
  echo ""
fi

echo -e "${GREEN}✓${NC} Stack outputs saved to outputs.json"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Next Steps${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

echo "1. ${YELLOW}Wait for environment to be Ready${NC}"
echo "   aws elasticbeanstalk describe-environments \\"
echo "     --environment-names $BEANSTALK_ENV \\"
echo "     --query 'Environments[0].Status'"
echo ""

echo "2. ${YELLOW}Deploy application${NC}"
echo "   - Push code to GitHub main branch, OR"
echo "   - Run 'Deploy Registry Application' workflow in GitHub Actions"
echo ""

echo "3. ${YELLOW}Verify deployment${NC}"
echo "   curl http://$BEANSTALK_CNAME/health"
echo ""

echo "4. ${YELLOW}Monitor logs${NC}"
echo "   aws logs tail /aws/elasticbeanstalk/$BEANSTALK_ENV/var/log/nodejs/nodejs.log --follow"
echo ""

echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Infrastructure provisioning complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Save environment info for easy reference
cat > "${STACK}-environment.txt" << EOF
PRPM Infrastructure - $STACK Environment
Generated: $(date)

Beanstalk Environment: $BEANSTALK_ENV
Beanstalk CNAME: $BEANSTALK_CNAME
Database Endpoint: $DB_ENDPOINT
S3 Bucket: $S3_BUCKET
Region: $AWS_REGION

URLs:
- Health Check: http://$BEANSTALK_CNAME/health
- API Docs: http://$BEANSTALK_CNAME/docs
- Packages API: http://$BEANSTALK_CNAME/api/v1/packages
EOF

if [[ "$DOMAIN_NAME" ]]; then
  echo "- Custom Domain: https://$DOMAIN_NAME" >> "${STACK}-environment.txt"
fi

echo -e "${GREEN}✓${NC} Environment info saved to ${STACK}-environment.txt"
