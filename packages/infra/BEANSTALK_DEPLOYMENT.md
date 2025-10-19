# PRPM - Elastic Beanstalk Deployment Guide

## Overview

This guide will help you deploy PRPM Registry to AWS Elastic Beanstalk, reducing costs from **$126/month to $32.50/month** (74% savings).

**Architecture:**
- Elastic Beanstalk (Node.js 20 on Amazon Linux 2023)
- RDS PostgreSQL 15 (db.t4g.micro)
- S3 + CloudFront (package storage)
- Auto-scaling (1-2 instances)
- Application Load Balancer (included)

---

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured (`aws configure`)
3. **Pulumi CLI** installed (`brew install pulumi` or `curl -fsSL https://get.pulumi.com | sh`)
4. **EB CLI** installed (`pip install awsebcli`)
5. **Node.js 20+**
6. **GitHub OAuth App** (for authentication)

---

## Option 1: Full Pulumi Deployment (Recommended)

### Step 1: Setup Pulumi

```bash
cd packages/infra

# Install dependencies
npm install

# Login to Pulumi
pulumi login

# Create stack
pulumi stack init prod
pulumi stack select prod
```

### Step 2: Configure Stack

```bash
# AWS region
pulumi config set aws:region us-east-1

# Database credentials
pulumi config set db:username prpm
pulumi config set --secret db:password $(openssl rand -base64 32)

# GitHub OAuth (create app at github.com/settings/developers)
pulumi config set --secret github:clientId YOUR_GITHUB_CLIENT_ID
pulumi config set --secret github:clientSecret YOUR_GITHUB_CLIENT_SECRET

# Optional: Custom domain
pulumi config set app:domainName registry.prpm.dev

# Optional: Instance size (default: t3.micro)
pulumi config set app:instanceType t3.micro
pulumi config set app:minSize 1
pulumi config set app:maxSize 2
```

### Step 3: Switch to Beanstalk Infrastructure

```bash
# Backup current index.ts (ECS version)
mv index.ts index-ecs.ts

# Use Beanstalk version
cp index-beanstalk.ts index.ts
```

### Step 4: Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy (takes 10-15 minutes)
pulumi up

# Get outputs
pulumi stack output
```

**Outputs you'll receive:**
- `beanstalkEndpoint` - Your application URL
- `dbEndpoint` - PostgreSQL connection string
- `s3BucketName` - Package storage bucket
- `apiUrl` - Public API URL

### Step 5: Deploy Application Code

```bash
# Get the Beanstalk environment name
EB_ENV=$(pulumi stack output beanstalkEnvironmentName)

cd ../registry

# Initialize EB CLI
eb init --region us-east-1

# Link to environment
eb use $EB_ENV

# Deploy application
eb deploy

# View logs
eb logs --tail
```

### Step 6: Run Database Migrations

```bash
# SSH into instance
eb ssh

# Navigate to app directory
cd /var/app/current

# Run migrations
npm run migrate

# Verify
psql $DATABASE_URL -c "\dt"

# Exit SSH
exit
```

### Step 7: Verify Deployment

```bash
# Get API URL
API_URL=$(pulumi stack output apiUrl)

# Test health endpoint
curl $API_URL/health

# Test packages endpoint
curl $API_URL/api/v1/packages?limit=5

# Test Swagger docs
open $API_URL/docs
```

---

## Option 2: EB CLI Only (Simpler, No Pulumi)

### Step 1: Create RDS Database Manually

```bash
# Via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier prpm-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username prpm \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx
```

### Step 2: Initialize Elastic Beanstalk

```bash
cd packages/registry

# Initialize EB
eb init

# Follow prompts:
# - Region: us-east-1
# - Application name: prpm
# - Platform: Node.js
# - Platform version: Node.js 20 on Amazon Linux 2023
# - CodeCommit: No
# - SSH: Yes (optional)
```

### Step 3: Create Environment

```bash
# Create production environment
eb create prpm-production \
  --instance-type t3.micro \
  --envvars \
    NODE_ENV=production,\
    DATABASE_URL=postgresql://prpm:password@your-rds-endpoint:5432/prpm_registry,\
    JWT_SECRET=$(openssl rand -hex 32),\
    GITHUB_CLIENT_ID=your_client_id,\
    GITHUB_CLIENT_SECRET=your_client_secret

# This will:
# - Create load balancer
# - Launch t3.micro instance
# - Deploy application
# - Configure auto-scaling
```

### Step 4: Deploy Updates

```bash
# Deploy code changes
eb deploy

# View status
eb status

# View logs
eb logs --tail

# SSH for debugging
eb ssh
```

---

## Configuration Management

### Set Environment Variables

```bash
# Set single variable
eb setenv DATABASE_URL=postgresql://...

# Set multiple variables
eb setenv \
  NODE_ENV=production \
  JWT_SECRET=xxx \
  GITHUB_CLIENT_ID=xxx \
  GITHUB_CLIENT_SECRET=xxx
```

### View Current Config

```bash
# Show environment info
eb config

# Show environment variables
eb printenv
```

### Update Instance Size

```bash
# Scale up to t3.small
eb scale 2  # Number of instances

# Change instance type (via console or config file)
# Edit .ebextensions/06_autoscaling.config
```

---

## Deployment Workflows

### Local Development → Production

```bash
# 1. Test locally
cd packages/registry
docker-compose up -d
npm run dev

# 2. Run tests
npm test

# 3. Build
npm run build

# 4. Deploy to Beanstalk
eb deploy

# 5. Verify
curl $(eb status | grep CNAME | awk '{print $2}')/health
```

### GitHub Actions CI/CD

Create `.github/workflows/deploy-beanstalk.yml`:

```yaml
name: Deploy to Elastic Beanstalk

on:
  push:
    branches: [main]
    paths:
      - 'packages/registry/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd packages/registry
          npm ci

      - name: Run tests
        run: |
          cd packages/registry
          npm test

      - name: Deploy to EB
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: prpm
          environment_name: prpm-production
          region: us-east-1
          version_label: ${{ github.sha }}
          deployment_package: packages/registry
```

---

## Monitoring & Maintenance

### View Logs

```bash
# Tail application logs
eb logs --tail

# Download all logs
eb logs --all

# CloudWatch Logs
aws logs tail /aws/elasticbeanstalk/prpm-production --follow
```

### Health Monitoring

```bash
# Environment health
eb health

# Detailed health
eb health --refresh

# AWS Console
open "https://console.aws.amazon.com/elasticbeanstalk"
```

### Metrics & Alarms

Available in AWS Console → Elastic Beanstalk → Monitoring:
- Request count
- CPU utilization
- Network in/out
- Target response time
- HTTP 2xx/4xx/5xx responses

### Database Backups

RDS automated backups (7 days retention by default):

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier prpm-db \
  --db-snapshot-identifier prpm-db-manual-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier prpm-db

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier prpm-db-restored \
  --db-snapshot-identifier prpm-db-manual-20251019
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
eb logs

# Common issues:
# 1. Missing environment variables
eb printenv

# 2. Database connection
eb ssh
ping your-rds-endpoint

# 3. Node.js version
eb ssh
node --version  # Should be 20.x
```

### Database Connection Errors

```bash
# 1. Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxx

# 2. Test connection from instance
eb ssh
psql $DATABASE_URL -c "SELECT 1"

# 3. Verify RDS endpoint
aws rds describe-db-instances --db-instance-identifier prpm-db
```

### Deployment Failures

```bash
# View deployment events
eb events --follow

# Common fixes:
# 1. Timeout during deployment
eb config
# Increase Timeout under aws:elasticbeanstalk:command

# 2. Health check failing
# Check /health endpoint
curl $(eb status | grep CNAME | awk '{print $2}')/health

# 3. Migrations failing
eb ssh
cd /var/app/current
npm run migrate
```

### High Costs

```bash
# Check current instance type
eb status

# Scale down
eb scale 1  # Reduce to 1 instance

# Use smaller instance (edit config)
# t3.micro → t3.nano (if sufficient)
```

---

## Cost Optimization Tips

### Current Setup ($32.50/month)

| Component | Cost | Optimization |
|-----------|------|--------------|
| t3.micro | $7.50 | Use t3.nano ($3.75) if traffic is low |
| RDS db.t4g.micro | $15 | Can't go smaller, this is minimum |
| S3 + CloudFront | $5-10 | Use Intelligent Tiering |
| Data Transfer | $3-5 | Minimize outbound data |
| **Total** | **$32.50** | **Possible: $25.75** |

### Further Optimizations

1. **Reserved Instances** - Save 40% with 1-year commitment
   ```bash
   # RDS Reserved Instance
   aws rds purchase-reserved-db-instances-offering \
     --reserved-db-instances-offering-id xxx \
     --db-instance-count 1
   ```

2. **Spot Instances** (dev/staging only)
   - 70% cost reduction
   - Not recommended for production (can be terminated)

3. **Scheduled Scaling** - Turn off during nights/weekends (dev only)
   ```bash
   # Create scheduled action
   aws autoscaling put-scheduled-update-group-action \
     --auto-scaling-group-name xxx \
     --scheduled-action-name scale-down-nights \
     --schedule "0 0 * * *" \
     --desired-capacity 0
   ```

---

## Backup & Disaster Recovery

### Automated Backups

- **RDS:** Daily snapshots (7 days retention)
- **S3:** Versioning enabled
- **EB Config:** Saved in Pulumi state

### Manual Backup

```bash
# 1. Backup database
aws rds create-db-snapshot \
  --db-instance-identifier prpm-db \
  --db-snapshot-identifier prpm-backup-$(date +%Y%m%d)

# 2. Backup S3 bucket
aws s3 sync s3://your-bucket s3://your-backup-bucket

# 3. Export EB configuration
eb config save prpm-production --cfg production-config
```

### Restore Procedure

```bash
# 1. Restore database
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier prpm-db-new \
  --db-snapshot-identifier prpm-backup-20251019

# 2. Update DATABASE_URL
eb setenv DATABASE_URL=postgresql://prpm:pass@new-endpoint:5432/prpm_registry

# 3. Redeploy
eb deploy
```

---

## Comparison: Beanstalk vs ECS

| Feature | Beanstalk | ECS Fargate |
|---------|-----------|-------------|
| **Cost** | $32.50/mo | $126/mo |
| **Setup Time** | 10 min | 30 min |
| **Complexity** | Simple | Complex |
| **Auto-scaling** | ✅ Yes | ✅ Yes |
| **Zero-downtime** | ✅ Yes | ✅ Yes |
| **Container Support** | ✅ Docker | ✅ Native |
| **Load Balancer** | Included | Separate ($22/mo) |
| **Monitoring** | Built-in | CloudWatch |
| **Best For** | Most use cases | Microservices |

**Recommendation:** Use Beanstalk unless you need:
- Multiple microservices
- Complex container orchestration
- Service mesh
- Advanced networking

---

## Next Steps

1. ✅ Deploy infrastructure with Pulumi
2. ✅ Deploy application with EB CLI
3. ⏳ Setup custom domain (Route 53)
4. ⏳ Configure SSL certificate (ACM)
5. ⏳ Setup CloudWatch alarms
6. ⏳ Configure CI/CD (GitHub Actions)
7. ⏳ Load test application
8. ⏳ Setup monitoring dashboard

---

## Support & Resources

- **AWS EB Docs:** https://docs.aws.amazon.com/elasticbeanstalk/
- **EB CLI Reference:** https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html
- **Pulumi AWS Docs:** https://www.pulumi.com/docs/clouds/aws/
- **PRPM Issues:** https://github.com/khaliqgant/prompt-package-manager/issues

---

**Cost savings: $93.50/month (74%) vs ECS**
**Deployment time: 10-15 minutes**
**Maintenance: Minimal (auto-updates enabled)**
