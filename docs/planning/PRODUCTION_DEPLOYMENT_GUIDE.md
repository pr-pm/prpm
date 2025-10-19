# PRPM Production Deployment Guide

**Last Updated:** 2025-10-19
**Status:** Ready for deployment
**Infrastructure:** AWS (via Pulumi)

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup (Pulumi)](#infrastructure-setup-pulumi)
3. [Database Migration](#database-migration)
4. [Application Deployment](#application-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring Setup](#monitoring-setup)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 Pre-Deployment Checklist

### Required Software
- [ ] AWS CLI v2 installed and configured
- [ ] Pulumi CLI installed (`curl -fsSL https://get.pulumi.com | sh`)
- [ ] Docker installed
- [ ] Node.js ≥20.0.0
- [ ] Git

### AWS Prerequisites
- [ ] AWS account with admin access
- [ ] AWS CLI configured (`aws configure`)
- [ ] Default VPC or existing VPC in target region
- [ ] Sufficient service limits for ECS, RDS, ElastiCache
- [ ] Domain name registered (optional, for custom domain)

### Secrets & Credentials
- [ ] GitHub OAuth App created (for user authentication)
  - Client ID
  - Client Secret
  - Callback URL: `https://<your-domain>/api/v1/auth/callback`
- [ ] Database password (strong, 16+ characters)
- [ ] JWT secret (generate: `openssl rand -base64 32`)

### Code Preparation
- [ ] Latest code merged to `main` branch
- [ ] All tests passing locally
- [ ] E2E tests validated
- [ ] Database migrations tested
- [ ] Docker image builds successfully

---

## 🏗️ Infrastructure Setup (Pulumi)

### Step 1: Install Pulumi

```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Verify installation
pulumi version
```

### Step 2: Login to Pulumi

Choose one option:

**Option A: Pulumi Cloud (Recommended)**
```bash
pulumi login
# Follow browser prompts to authenticate
```

**Option B: Local State (Self-hosted)**
```bash
pulumi login file://~/.pulumi
```

### Step 3: Initialize Pulumi Stack

```bash
cd packages/infra

# Create production stack
pulumi stack init prod

# Or select existing stack
pulumi stack select prod
```

### Step 4: Configure Pulumi Secrets

```bash
# Required configuration
pulumi config set aws:region us-east-1
pulumi config set --secret db:password <STRONG_PASSWORD>
pulumi config set --secret github:clientId <GITHUB_CLIENT_ID>
pulumi config set --secret github:clientSecret <GITHUB_CLIENT_SECRET>

# Optional configuration (with defaults shown)
pulumi config set db:username prmp                    # default: prmp
pulumi config set db:instanceClass db.t4g.micro      # default: db.t4g.micro
pulumi config set db:allocatedStorage 20              # default: 20 (GB)
pulumi config set app:cpu 256                         # default: 256
pulumi config set app:memory 512                      # default: 512 (MB)
pulumi config set app:desiredCount 2                  # default: 2
pulumi config set app:domainName registry.prmp.dev # optional

# Enable OpenSearch (optional, for Phase 2)
pulumi config set search:enabled false                # default: false
```

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Preview Infrastructure (Dry Run)

```bash
pulumi preview

# This will show:
# - Resources to be created
# - Estimated costs
# - Configuration values
# - No actual changes made
```

**Expected Output:**
```
Previewing update (prod):
  + 45 resources to create

Resources:
  + 1 vpc
  + 2 public subnets
  + 2 private subnets
  + 1 internet gateway
  + 1 nat gateway
  + 1 rds postgres instance
  + 1 elasticache redis cluster
  + 1 s3 bucket + cloudfront
  + 1 ecs cluster
  + 1 application load balancer
  + 1 ecr repository
  + ... security groups, IAM roles, etc.
```

### Step 7: Deploy Infrastructure

```bash
# Deploy (requires confirmation)
pulumi up

# Or auto-approve (use with caution)
pulumi up --yes
```

**Deployment Time:** ~15-20 minutes

**What Gets Created:**
- VPC with public/private subnets across 2 availability zones
- RDS PostgreSQL 15 instance
- ElastiCache Redis 7 cluster
- S3 bucket for package storage + CloudFront CDN
- ECS Fargate cluster
- Application Load Balancer
- ECR repository for Docker images
- Secrets Manager for sensitive configuration
- CloudWatch log groups
- IAM roles and security groups

### Step 8: Save Infrastructure Outputs

```bash
# Get all outputs
pulumi stack output

# Save important values
pulumi stack output dbEndpoint > .env.prod
pulumi stack output redisEndpoint >> .env.prod
pulumi stack output s3BucketName >> .env.prod
pulumi stack output ecrRepositoryUrl >> .env.prod
pulumi stack output albDnsName >> .env.prod
pulumi stack output apiUrl >> .env.prod
```

---

## 🗄️ Database Migration

### Step 1: Build and Push Docker Image

```bash
# Get ECR repository URL
ECR_REPO=$(pulumi stack output ecrRepositoryUrl)
AWS_REGION=$(pulumi config get aws:region)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \\
  docker login --username AWS --password-stdin $ECR_REPO

# Build image
cd ../registry
docker build -t prmp-registry:latest .

# Tag and push
docker tag prmp-registry:latest $ECR_REPO:latest
docker push $ECR_REPO:latest
```

### Step 2: Run Database Migrations

**Option A: Via ECS Task (Recommended)**

```bash
cd ../infra

# Get infrastructure details
CLUSTER=$(pulumi stack output ecsClusterName)
TASK_DEF=$(pulumi stack output ecsServiceName | sed 's/-service/-task/')
SUBNET=$(pulumi stack output privateSubnetIds | jq -r '.[0]')
SG=$(pulumi stack output ecsSecurityGroupId)

# Run migration task
aws ecs run-task \\
  --cluster $CLUSTER \\
  --task-definition $TASK_DEF \\
  --launch-type FARGATE \\
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$SG],assignPublicIp=DISABLED}" \\
  --overrides '{
    "containerOverrides": [{
      "name": "prmp-registry",
      "command": ["npm", "run", "migrate"]
    }]
  }'

# Watch task logs
aws logs tail /ecs/prmp-prod --follow
```

**Option B: Via Bastion/Local**

```bash
# Get database endpoint
DB_HOST=$(pulumi stack output dbEndpoint | cut -d: -f1)
DB_PORT=$(pulumi stack output dbPort)
DB_NAME=prmp_registry
DB_USER=prmp
DB_PASS=<from pulumi config>

# Run migrations
cd ../registry
npm run migrate -- \\
  --host $DB_HOST \\
  --port $DB_PORT \\
  --database $DB_NAME \\
  --user $DB_USER \\
  --password $DB_PASS
```

### Step 3: Seed Initial Data (Optional)

```bash
# Seed 722 packages
npm run seed
```

**Note:** Seeding is optional for production. You may want to start with an empty registry and let users publish packages organically.

---

## 🚀 Application Deployment

### ECS Service Deployment

Once the Docker image is pushed to ECR, ECS Fargate will automatically:
1. Pull the latest image
2. Start containers (default: 2 instances)
3. Register with Application Load Balancer
4. Perform health checks
5. Drain old containers

**Deployment happens automatically after:**
```bash
docker push $ECR_REPO:latest

# Force new deployment
aws ecs update-service \\
  --cluster $CLUSTER \\
  --service $(pulumi stack output ecsServiceName) \\
  --force-new-deployment
```

### Deployment Status

```bash
# Watch deployment
aws ecs describe-services \\
  --cluster $CLUSTER \\
  --services $(pulumi stack output ecsServiceName) \\
  --query 'services[0].deployments'

# Check running tasks
aws ecs list-tasks \\
  --cluster $CLUSTER \\
  --service-name $(pulumi stack output ecsServiceName)
```

### Environment Variables

The following environment variables are automatically set via Secrets Manager:

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database (from Secrets Manager)
DATABASE_URL=postgresql://prmp:***@<rds-endpoint>:5432/prmp_registry

# Redis (from Secrets Manager)
REDIS_URL=redis://<elasticache-endpoint>:6379

# S3 Storage
AWS_REGION=us-east-1
S3_BUCKET=<bucket-name>

# GitHub OAuth (from Secrets Manager)
GITHUB_CLIENT_ID=***
GITHUB_CLIENT_SECRET=***
GITHUB_CALLBACK_URL=https://<domain>/api/v1/auth/callback

# JWT (from Secrets Manager)
JWT_SECRET=***

# Features
SEARCH_ENGINE=postgres  # or "opensearch" if enabled
ENABLE_TELEMETRY=true
ENABLE_RATE_LIMITING=true
```

---

## ✅ Post-Deployment Verification

### 1. Health Check

```bash
# Get API URL
API_URL=$(pulumi stack output apiUrl)

# Test health endpoint
curl $API_URL/health | jq '.'

# Expected output:
# {
#   "status": "ok",
#   "timestamp": "2025-10-19T...",
#   "version": "1.0.0",
#   "services": {
#     "database": "ok",
#     "redis": "ok",
#     "storage": "ok"
#   }
# }
```

### 2. API Endpoints

```bash
# List packages
curl $API_URL/api/v1/packages | jq '.total'

# Search
curl "$API_URL/api/v1/packages?search=react&limit=5" | jq '.packages[].id'

# Get specific package
curl "$API_URL/api/v1/packages/%40jhonma82%2Fnextjs-typescript-tailwind" | jq '.id'
```

### 3. Database Connectivity

```bash
# Check connection via ECS task
aws ecs execute-command \\
  --cluster $CLUSTER \\
  --task <task-id> \\
  --container prmp-registry \\
  --interactive \\
  --command "psql $DATABASE_URL -c 'SELECT COUNT(*) FROM packages;'"
```

### 4. Load Balancer Health

```bash
# Check ALB target health
aws elbv2 describe-target-health \\
  --target-group-arn $(pulumi stack output targetGroupArn)

# Expected: All targets "healthy"
```

### 5. CloudWatch Logs

```bash
# Tail application logs
aws logs tail /ecs/prmp-prod --follow

# Search for errors
aws logs filter-log-events \\
  --log-group-name /ecs/prmp-prod \\
  --filter-pattern "ERROR"
```

### 6. Performance Test

```bash
# Run benchmark
cd ../../
curl "$API_URL/api/v1/packages?limit=20" -w "\\n%{time_total}s\\n"

# Expected: < 1 second
```

---

## 📊 Monitoring Setup

### CloudWatch Dashboards

Pulumi automatically creates CloudWatch alarms for:

1. **ECS Service**
   - CPU utilization > 80%
   - Memory utilization > 80%
   - Task count < desired count

2. **RDS Database**
   - CPU utilization > 80%
   - Storage space < 10% free
   - Connection count > 80% max

3. **Application Load Balancer**
   - Target 5XX errors > 10 per minute
   - Unhealthy host count > 0
   - Request latency > 1 second (p99)

### View Alarms

```bash
# List all alarms
aws cloudwatch describe-alarms \\
  --alarm-name-prefix prmp-prod

# Get alarm state
aws cloudwatch describe-alarms \\
  --alarm-names prmp-prod-high-cpu
```

### Set Up SNS Notifications

```bash
# Create SNS topic for alerts
aws sns create-topic --name prmp-prod-alerts

# Subscribe email
aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:prmp-prod-alerts \\
  --protocol email \\
  --notification-endpoint your-email@example.com

# Update alarms to use SNS
# (Requires re-running Pulumi with SNS topic ARN configured)
```

---

## 🔄 Rollback Procedures

### Application Rollback

```bash
# Get previous task definition revision
aws ecs describe-task-definition \\
  --task-definition prmp-prod-task \\
  --query 'taskDefinition.revision'

# Update service to use previous revision
aws ecs update-service \\
  --cluster $CLUSTER \\
  --service $(pulumi stack output ecsServiceName) \\
  --task-definition prmp-prod-task:PREVIOUS_REVISION
```

### Database Rollback

```bash
# Restore from RDS automated backup
aws rds restore-db-instance-to-point-in-time \\
  --source-db-instance-identifier prmp-prod-db \\
  --target-db-instance-identifier prmp-prod-db-restored \\
  --restore-time 2025-10-19T12:00:00Z

# Update application to point to restored DB
```

### Infrastructure Rollback

```bash
# Rollback to previous Pulumi state
pulumi stack select prod
pulumi refresh
pulumi up --target=<specific-resource>

# Or full rollback
git checkout <previous-commit>
pulumi up
```

---

## 🐛 Troubleshooting

### Issue: ECS Tasks Keep Restarting

**Check:**
```bash
# Get task details
aws ecs describe-tasks \\
  --cluster $CLUSTER \\
  --tasks <task-id>

# Common causes:
# 1. Health check failing
# 2. Database connection error
# 3. Missing environment variables
# 4. Out of memory
```

**Solution:**
```bash
# View logs
aws logs tail /ecs/prmp-prod --follow

# Check health endpoint
curl http://<task-private-ip>:3000/health
```

### Issue: Database Connection Refused

**Check:**
```bash
# Security group rules
aws ec2 describe-security-groups \\
  --group-ids $(pulumi stack output dbSecurityGroupId)

# Verify ECS tasks can reach RDS
```

**Solution:**
```bash
# Ensure ECS security group is in RDS inbound rules
# Re-run Pulumi if needed
pulumi up
```

### Issue: High Latency

**Check:**
```bash
# Database performance
aws rds describe-db-instances \\
  --db-instance-identifier prmp-prod-db \\
  --query 'DBInstances[0].DBInstanceStatus'

# Redis status
aws elasticache describe-cache-clusters \\
  --cache-cluster-id prmp-prod-redis
```

**Solution:**
```bash
# Scale up RDS instance
pulumi config set db:instanceClass db.t4g.small
pulumi up

# Add read replicas (requires code changes)
```

### Issue: 502 Bad Gateway

**Cause:** ECS tasks not healthy or not running

**Check:**
```bash
aws elbv2 describe-target-health \\
  --target-group-arn $(pulumi stack output targetGroupArn)
```

**Solution:**
```bash
# Check ECS service events
aws ecs describe-services \\
  --cluster $CLUSTER \\
  --services $(pulumi stack output ecsServiceName) \\
  --query 'services[0].events[:5]'
```

---

## 📝 Post-Deployment Checklist

- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] API endpoints responding (GET /api/v1/packages)
- [ ] Database migrations applied successfully
- [ ] All ECS tasks healthy
- [ ] ALB health checks passing
- [ ] CloudWatch alarms configured
- [ ] SNS notifications set up
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Logs flowing to CloudWatch
- [ ] Backups configured (RDS automated backups)
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## 🔐 Security Checklist

- [ ] All secrets in Secrets Manager (not env vars)
- [ ] Database in private subnet
- [ ] Redis in private subnet
- [ ] ECS tasks in private subnet
- [ ] ALB in public subnet only
- [ ] Security groups properly configured
- [ ] IAM roles follow least privilege
- [ ] S3 bucket not publicly accessible
- [ ] CloudFront signed URLs enabled (optional)
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured

---

## 📞 Support & Resources

### Documentation
- **API Docs:** `https://<domain>/docs`
- **Architecture:** `packages/infra/README.md`
- **Database Schema:** `packages/registry/migrations/`

### Monitoring
- **CloudWatch Dashboard:** AWS Console → CloudWatch → Dashboards
- **Logs:** AWS Console → CloudWatch → Log Groups → `/ecs/prmp-prod`
- **Metrics:** AWS Console → CloudWatch → Metrics

### Commands Reference

```bash
# Quick status check
pulumi stack output apiUrl && curl $(pulumi stack output apiUrl)/health

# View logs
aws logs tail /ecs/prmp-prod --follow

# Force deployment
aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment

# Scale service
aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count 4

# View infrastructure
pulumi stack
```

---

## 🚀 Ready to Deploy?

1. Complete [Pre-Deployment Checklist](#pre-deployment-checklist)
2. Run `pulumi preview` to verify plan
3. Run `pulumi up` to deploy infrastructure
4. Push Docker image to ECR
5. Run database migrations
6. Verify health checks
7. Complete [Post-Deployment Checklist](#post-deployment-checklist)

**Estimated Total Time:** 30-45 minutes

---

**Production Deployment Guide Complete** ✅

For questions or issues, refer to troubleshooting section or check CloudWatch logs.
