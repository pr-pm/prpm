# PRPM Infrastructure Deployment Guide

This guide ensures successful Pulumi infrastructure deployment with confidence.

## Pre-Deployment Checklist

### 1. Prerequisites

Required tools:
- [x] **Pulumi CLI** (v3.100+): `curl -fsSL https://get.pulumi.com | sh`
- [x] **AWS CLI** (v2): `aws --version`
- [x] **Docker**: `docker --version`
- [x] **Node.js** (v20+): `node --version`
- [x] **jq**: `brew install jq` or `apt-get install jq`

### 2. AWS Account Setup

```bash
# Configure AWS credentials
aws configure

# Verify access
aws sts get-caller-identity

# Expected output:
# {
#   "UserId": "AIDAXXXXXXXXXX",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/yourname"
# }
```

### 3. Pulumi Backend Setup

```bash
# Login to Pulumi (choose one):

# Option 1: Pulumi Cloud (recommended)
pulumi login

# Option 2: S3 backend
pulumi login s3://my-pulumi-state-bucket

# Option 3: Local filestate
pulumi login file://./state
```

### 4. Create and Configure Stack

```bash
cd packages/infra

# Create stack (choose environment)
pulumi stack init dev        # Development
pulumi stack init staging    # Staging
pulumi stack init prod       # Production

# Or select existing stack
pulumi stack select dev

# Set AWS region
pulumi config set aws:region us-west-2

# Set required secrets
pulumi config set --secret db:password "$(openssl rand -base64 32)"
pulumi config set --secret github:clientId "your_github_client_id"
pulumi config set --secret github:clientSecret "your_github_client_secret"

# Optional: Set custom values
pulumi config set db:username prpm
pulumi config set db:instanceClass db.t4g.micro
pulumi config set app:cpu 256
pulumi config set app:memory 512
pulumi config set app:desiredCount 2
```

## Deployment Steps

### Step 1: Validate Configuration

```bash
# Run automated pre-deployment checks
./scripts/pre-deploy-check.sh
```

This script validates:
- ✅ Required CLI tools installed
- ✅ AWS credentials configured
- ✅ Pulumi stack selected
- ✅ Required configuration set
- ✅ AWS service quotas
- 💰 Estimated monthly costs

### Step 2: Preview Changes

```bash
# Test with preview (dry-run)
./scripts/test-preview.sh

# Or manually:
pulumi preview --diff
```

**What to look for:**
- Number of resources to create
- Any resource replacements (⚠️ causes downtime)
- Estimated deployment time
- No unexpected deletions

### Step 3: Deploy Infrastructure

```bash
# Deploy with automatic approval (be careful!)
pulumi up --yes

# Or deploy with manual confirmation (safer)
pulumi up
```

**Deployment time:** ~15-20 minutes for initial deployment

**What gets created:**
1. **Network** (~2 min): VPC, subnets, NAT gateway, route tables
2. **Database** (~10 min): RDS PostgreSQL instance
3. **Cache** (~5 min): ElastiCache Redis cluster
4. **Storage** (~2 min): S3 bucket, CloudFront distribution
5. **Compute** (~3 min): ECS cluster, ALB, task definition
6. **Monitoring** (~1 min): CloudWatch alarms

### Step 4: Verify Deployment

```bash
# Check stack outputs
pulumi stack output

# Get specific outputs
pulumi stack output apiUrl
pulumi stack output dbEndpoint
pulumi stack output ecrRepositoryUrl

# Verify resources in AWS Console
aws ecs list-clusters
aws rds describe-db-instances
aws s3 ls | grep prpm
```

### Step 5: Deploy Application

```bash
# Get ECR repository URL
ECR_REPO=$(pulumi stack output ecrRepositoryUrl)
REGION=$(pulumi config get aws:region)

# Login to ECR
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin $ECR_REPO

# Build and push Docker image
cd ../registry
docker build -t prpm-registry:latest .
docker tag prpm-registry:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

# Force new deployment
CLUSTER=$(pulumi stack output ecsClusterName -C ../infra)
SERVICE=$(pulumi stack output ecsServiceName -C ../infra)
aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment
```

### Step 6: Run Database Migrations

```bash
# Get database connection info
DB_ENDPOINT=$(pulumi stack output dbEndpoint)
DB_PASSWORD=$(pulumi config get db:password --show-secrets)

# Option 1: Run migrations via ECS task
CLUSTER=$(pulumi stack output ecsClusterName)
TASK_DEF=$(pulumi stack output ecsServiceName | sed 's/-service/-task/')
SUBNET=$(pulumi stack output privateSubnetIds | jq -r '.[0]')
SG=$(aws ecs describe-services --cluster $CLUSTER --services $(pulumi stack output ecsServiceName) --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups[0]' --output text)

aws ecs run-task \
  --cluster $CLUSTER \
  --task-definition $TASK_DEF \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$SG],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"prpm-registry","command":["npm","run","migrate"]}]}'

# Option 2: Connect via bastion and run locally
# (requires setting up bastion host first)
```

### Step 7: Configure DNS (Production Only)

```bash
# Get ALB DNS name
ALB_DNS=$(pulumi stack output albDnsName)
ALB_ZONE=$(pulumi stack output albZoneId)

# Create Route 53 records (if using Route 53)
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.prpm.dev",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "'$ALB_ZONE'",
        "DNSName": "'$ALB_DNS'",
        "EvaluateTargetHealth": true
      }
    }
  }]
}'
```

## Post-Deployment Verification

### Health Checks

```bash
# Check API health
API_URL=$(pulumi stack output apiUrl)
curl $API_URL/health

# Expected response:
# {"status":"ok","timestamp":"..."}

# Check ECS service status
aws ecs describe-services \
  --cluster $(pulumi stack output ecsClusterName) \
  --services $(pulumi stack output ecsServiceName) \
  --query 'services[0].deployments[0].{Status:status,Running:runningCount,Desired:desiredCount}'

# Check database connectivity
aws rds describe-db-instances \
  --db-instance-identifier $(pulumi stack select --show-name)-db \
  --query 'DBInstances[0].DBInstanceStatus'
```

### View Logs

```bash
# Tail ECS logs
aws logs tail /ecs/$(pulumi stack select --show-name) --follow

# View last 100 lines
aws logs tail /ecs/$(pulumi stack select --show-name) --since 1h

# Search logs
aws logs tail /ecs/$(pulumi stack select --show-name) --filter-pattern "ERROR"
```

## Monitoring

### CloudWatch Dashboards

```bash
# View alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix prpm-$(pulumi stack select --show-name)

# Get metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=$(pulumi stack output ecsServiceName) \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300
```

### Cost Monitoring

```bash
# Get cost estimate for current month
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Project

# Set up budget alert (recommended)
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json
```

## Updating Infrastructure

### Making Changes

```bash
# 1. Update Pulumi code in modules/
# 2. Preview changes
pulumi preview --diff

# 3. Apply changes
pulumi up

# 4. Verify changes
pulumi stack output
```

### Rollback

```bash
# View stack history
pulumi stack history

# Rollback to previous version
pulumi stack export --version 2 > backup.json
pulumi stack import --file backup.json
```

## Destroying Infrastructure

**⚠️ WARNING: This permanently deletes all resources and data!**

```bash
# Preview what will be destroyed
pulumi destroy --preview

# Destroy all resources
pulumi destroy

# For production, require manual confirmation
pulumi destroy --target urn:pulumi:prod::prpm::aws:rds/instance:Instance::prpm-prod-db

# Remove stack entirely
pulumi stack rm <stack-name>
```

## Cost Optimization Tips

### Development Environment
- Use `db.t4g.micro` for RDS (~$15/month)
- Use `cache.t4g.micro` for Redis (~$12/month)
- Single NAT Gateway instead of per-AZ (~$32/month vs $96/month)
- Reduce ECS desired count to 1 during off-hours
- Use Fargate Spot for non-critical tasks (70% savings)

### Production Environment
- Enable RDS auto-scaling
- Use Reserved Instances for long-term savings (up to 60%)
- Enable S3 Intelligent-Tiering
- Use CloudFront for global distribution (reduces data transfer costs)
- Set up AWS Cost Anomaly Detection

## Security Best Practices

### Secrets Management
- ✅ Use Pulumi secrets: `pulumi config set --secret`
- ✅ Rotate database passwords every 90 days
- ✅ Use AWS Secrets Manager for application secrets
- ✅ Enable MFA for Pulumi account
- ✅ Use IAM roles instead of access keys where possible

### Network Security
- ✅ Private subnets for databases and application
- ✅ Public subnets only for ALB
- ✅ Security groups with least privilege
- ✅ VPC Flow Logs enabled
- ✅ AWS WAF on ALB (production)

### Compliance
- ✅ Enable CloudTrail for audit logs
- ✅ Encrypt all data at rest (RDS, S3, EBS)
- ✅ Encrypt data in transit (TLS/HTTPS only)
- ✅ Regular security scans with AWS Inspector
- ✅ Automated backups with 7-day retention

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Support

- **Pulumi Docs**: https://www.pulumi.com/docs/
- **AWS Support**: https://aws.amazon.com/support/
- **PRPM Issues**: https://github.com/khaliqgant/prompt-package-manager/issues
