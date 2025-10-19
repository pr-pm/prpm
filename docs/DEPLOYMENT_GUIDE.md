# PRMP Registry Deployment Guide

Complete guide to deploying the PRMP Registry infrastructure using Pulumi and GitHub Actions.

## Overview

This guide covers:
1. AWS account setup
2. Pulumi configuration
3. GitHub Actions setup
4. First deployment
5. Ongoing operations

## Prerequisites

- AWS Account with billing enabled
- GitHub repository
- Domain name (optional but recommended)
- Node.js 20+ installed locally

## Step 1: AWS Setup

### 1.1 Create IAM User for Pulumi

```bash
# Create IAM user
aws iam create-user --user-name pulumi-deploy

# Attach AdministratorAccess policy (for simplicity; restrict in production)
aws iam attach-user-policy \
  --user-name pulumi-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access key
aws iam create-access-key --user-name pulumi-deploy
```

Save the `AccessKeyId` and `SecretAccessKey` - you'll need these for GitHub Actions.

### 1.2 Create IAM Role for GitHub Actions (OIDC - Recommended)

```bash
# Create trust policy
cat > github-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/prompt-package-manager:*"
        }
      }
    }
  ]
}
EOF

# Create the OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Create IAM role
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://github-trust-policy.json

# Attach AdministratorAccess policy
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

## Step 2: Pulumi Setup

### 2.1 Create Pulumi Account

1. Go to https://app.pulumi.com/signup
2. Sign up (free tier works)
3. Create new organization (or use personal)

### 2.2 Create Pulumi Access Token

1. Go to https://app.pulumi.com/YOUR_ORG/settings/tokens
2. Click "Create token"
3. Copy the token - you'll need it for GitHub Actions

### 2.3 Local Pulumi Setup

```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Login to Pulumi
pulumi login

# Navigate to infra directory
cd infra

# Install dependencies
npm install

# Create dev stack
pulumi stack init dev

# Select the stack
pulumi stack select dev
```

### 2.4 Configure Stack

```bash
# AWS region
pulumi config set aws:region us-east-1

# Database credentials
pulumi config set db:username prpm
pulumi config set --secret db:password $(openssl rand -base64 32)

# GitHub OAuth (get from https://github.com/settings/developers)
pulumi config set --secret github:clientId YOUR_GITHUB_CLIENT_ID
pulumi config set --secret github:clientSecret YOUR_GITHUB_CLIENT_SECRET

# Optional: Custom domain
pulumi config set app:domainName registry.prpm.dev

# Optional: App configuration
pulumi config set app:cpu 256
pulumi config set app:memory 512
pulumi config set app:desiredCount 2
```

## Step 3: GitHub Setup

### 3.1 Configure Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

```
# Pulumi
PULUMI_ACCESS_TOKEN=pul-xxxxx

# AWS (Option 1: IAM User)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxx

# AWS (Option 2: OIDC - Recommended)
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/GitHubActionsDeployRole

# Pulumi encryption
PULUMI_CONFIG_PASSPHRASE=your-encryption-passphrase

# NPM (for CLI publishing)
NPM_TOKEN=npm_xxxxx

# Homebrew (for CLI publishing)
HOMEBREW_TAP_TOKEN=ghp_xxxxx
```

### 3.2 Configure Environments

Create three environments in GitHub:
1. Settings → Environments → New environment
2. Create: `dev`, `staging`, `prod`
3. For `prod`, add required reviewers

## Step 4: First Deployment

### 4.1 Deploy Infrastructure Locally

```bash
cd infra

# Preview changes
pulumi preview

# Deploy
pulumi up

# This creates:
# - VPC with subnets
# - RDS PostgreSQL
# - ElastiCache Redis
# - S3 + CloudFront
# - ECS cluster + ALB
# - ECR repository
# - Secrets Manager
# - CloudWatch alarms

# Wait ~15-20 minutes for deployment
```

### 4.2 Build and Push Docker Image

```bash
# Get ECR repository URL
ECR_REPO=$(pulumi stack output ecrRepositoryUrl)

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REPO

# Build image
cd ../registry
docker build -t prpm-registry:latest .

# Tag and push
docker tag prpm-registry:latest $ECR_REPO:latest
docker push $ECR_REPO:latest
```

### 4.3 Run Database Migrations

```bash
# Get cluster and task info
CLUSTER=$(pulumi stack output ecsClusterName)
TASK_DEF=$(pulumi stack output ecsServiceName | sed 's/-service/-task/')
SUBNET=$(pulumi stack output privateSubnetIds | jq -r '.[0]')
SG=$(aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=prpm-dev-ecs-sg" \
  --query 'SecurityGroups[0].GroupId' --output text)

# Run migration task
aws ecs run-task \
  --cluster $CLUSTER \
  --task-definition $TASK_DEF \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$SG],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"prpm-registry","command":["npm","run","migrate"]}]}'
```

### 4.4 Deploy ECS Service

```bash
# Force new deployment
SERVICE=$(pulumi stack output ecsServiceName)
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --force-new-deployment

# Wait for stable
aws ecs wait services-stable --cluster $CLUSTER --services $SERVICE
```

### 4.5 Test Deployment

```bash
# Get ALB URL
ALB_URL=$(pulumi stack output albDnsName)

# Test health endpoint
curl http://$ALB_URL/health

# Should return:
# {"status":"ok","timestamp":"...","version":"1.0.0"}

# Test API docs
open http://$ALB_URL/docs
```

## Step 5: GitHub Actions Deployment

After the first manual deployment, use GitHub Actions for all future deployments.

### 5.1 Infrastructure Changes

When you modify `infra/` files:

```bash
# Create PR
git checkout -b feature/new-infrastructure
# ... make changes ...
git commit -m "Add OpenSearch support"
git push origin feature/new-infrastructure

# GitHub Actions will automatically run `pulumi preview`
# Review the preview in PR comments

# Merge PR
# GitHub Actions will automatically run `pulumi up` on dev
```

### 5.2 Registry Changes

When you modify `registry/` files:

```bash
# Create PR
git checkout -b feature/new-api-endpoint
# ... make changes ...
git commit -m "Add package search endpoint"
git push origin feature/new-api-endpoint

# Merge PR
# GitHub Actions will:
# 1. Build Docker image
# 2. Push to ECR
# 3. Run migrations
# 4. Deploy to ECS
# 5. Run health checks
```

### 5.3 Manual Deployment

For staging or production:

1. Go to Actions → Registry Deploy
2. Click "Run workflow"
3. Select environment (staging/prod)
4. Click "Run workflow"

## Step 6: Domain Setup (Optional)

### 6.1 Route53 Setup

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name prpm.dev \
  --caller-reference $(date +%s)

# Get name servers
aws route53 list-resource-record-sets \
  --hosted-zone-id ZXXXXX \
  --query "ResourceRecordSets[?Type=='NS']"

# Update domain registrar with these name servers
```

### 6.2 ACM Certificate

```bash
# Request certificate
aws acm request-certificate \
  --domain-name registry.prpm.dev \
  --validation-method DNS \
  --region us-east-1

# Get validation records
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:...:certificate/xxxxx

# Add CNAME records to Route53 for validation
```

### 6.3 Update ALB Listener

```bash
# Update Pulumi config
pulumi config set app:domainName registry.prpm.dev
pulumi config set app:certificateArn arn:aws:acm:us-east-1:...:certificate/xxxxx

# Deploy
pulumi up

# Create Route53 A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXX \
  --change-batch file://dns-change.json
```

## Step 7: Enable OpenSearch (Phase 2)

When you have 10k+ packages:

```bash
# Enable OpenSearch
pulumi config set search:enabled true
pulumi config set search:instanceType t3.small.search
pulumi config set search:volumeSize 10

# Deploy
pulumi up

# Update registry environment
pulumi config set app:searchEngine opensearch

# Redeploy registry
# GitHub Actions will handle the redeployment
```

## Operations

### View Logs

```bash
# ECS logs
aws logs tail /ecs/prpm-dev --follow

# Pulumi logs
pulumi logs --follow

# GitHub Actions logs
# Go to Actions tab in GitHub
```

### Scale Service

```bash
# Update desired count
pulumi config set app:desiredCount 4
pulumi up

# Or via AWS CLI
aws ecs update-service \
  --cluster prpm-dev-cluster \
  --service prpm-dev-service \
  --desired-count 4
```

### Database Backup

```bash
# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier prpm-dev-db \
  --db-snapshot-identifier prpm-dev-manual-$(date +%Y%m%d)
```

### Rollback Deployment

```bash
# Rollback to previous image
aws ecs update-service \
  --cluster prpm-dev-cluster \
  --service prpm-dev-service \
  --task-definition prpm-dev-task:PREVIOUS_REVISION
```

## Monitoring

### CloudWatch Dashboards

1. Go to CloudWatch → Dashboards
2. Create dashboard for PRMP
3. Add widgets for:
   - ECS CPU/Memory
   - ALB request count
   - RDS connections
   - Redis cache hits

### Alarms

Pulumi automatically creates alarms for:
- ECS high CPU (>80%)
- ECS high memory (>80%)
- ALB response time (>1s)
- ALB unhealthy targets
- RDS high CPU (>80%)
- RDS low storage (<2GB)

View in CloudWatch → Alarms

## Cost Management

### Cost Allocation Tags

All resources are tagged with:
- Project: PRMP
- Environment: dev/staging/prod
- ManagedBy: Pulumi

Enable cost allocation tags in Billing console.

### Cost Optimization

- Use t4g instances (Graviton) - 20% cheaper
- Enable Savings Plans for Fargate
- Use S3 Intelligent Tiering
- Right-size RDS instance based on usage
- Enable RDS auto-scaling for storage

## Troubleshooting

### ECS Task Won't Start

```bash
# Check task stopped reason
aws ecs describe-tasks \
  --cluster prpm-dev-cluster \
  --tasks TASK_ARN \
  --query 'tasks[0].stoppedReason'

# Check logs
aws logs tail /ecs/prpm-dev --follow
```

### Database Connection Failed

```bash
# Check security group
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx

# Test connection from ECS task
aws ecs execute-command \
  --cluster prpm-dev-cluster \
  --task TASK_ARN \
  --container prpm-registry \
  --interactive \
  --command "/bin/sh"
```

### Pulumi State Corruption

```bash
# Export state
pulumi stack export --file backup.json

# Refresh state
pulumi refresh

# Import state (if needed)
pulumi stack import --file backup.json
```

## Support

- GitHub Issues: https://github.com/khaliqgant/prompt-package-manager/issues
- Pulumi Community: https://slack.pulumi.com
- AWS Support: https://aws.amazon.com/support
