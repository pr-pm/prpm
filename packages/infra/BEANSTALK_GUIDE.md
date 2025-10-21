## PRPM Elastic Beanstalk Deployment Guide

**Cost-Optimized Infrastructure: ~$32-50/month** (74% cheaper than ECS!)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Elastic Beanstalk                      │
│  ┌──────────────┐         ┌──────────────┐                   │
│  │ Application  │────────▶│  Environment  │                   │
│  │ Load Balancer│         │  (t3.micro)   │                   │
│  └──────────────┘         └──────────────┘                   │
│         │                          │                          │
│         │                          ▼                          │
│         │                 ┌────────────────┐                 │
│         └────────────────▶│  Auto Scaling  │                 │
│                           │   (1-2 instances)│                 │
│                           └────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
               │                     │
               ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ RDS PostgreSQL   │  │  S3 + CloudFront │
    │  (db.t4g.micro)  │  │  Package Storage │
    └──────────────────┘  └──────────────────┘
```

### Cost Breakdown

| Component | Cost/Month | Notes |
|-----------|-----------|--------|
| EC2 t3.micro | $7.50 | Single instance, can scale to 2 |
| RDS db.t4g.micro | $15.00 | PostgreSQL database |
| Application Load Balancer | Included | No separate charge with Beanstalk |
| S3 Storage | $3-5 | Pay for usage |
| CloudFront CDN | $2-5 | Pay for usage |
| Data Transfer | $2-5 | Typical usage |
| CloudWatch Logs | $1-2 | 7-day retention |
| **Total** | **$30.50-39.50** | **vs $126 for ECS** |

**Savings: $86-96/month (74%)**

---

## Quick Start

### Prerequisites

Install required tools:
```bash
# AWS CLI
brew install awscli  # or curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# EB CLI (optional but recommended)
brew install aws-elasticbeanstalk

# Pulumi
curl -fsSL https://get.pulumi.com | sh

# Configure AWS
aws configure
```

### 1. Deploy Infrastructure

```bash
cd packages/infra

# Create stack
pulumi stack init dev

# Configure
pulumi config set aws:region us-west-2
pulumi config set --secret db:password "$(openssl rand -base64 32)"
pulumi config set --secret github:clientId "your_github_client_id"
pulumi config set --secret github:clientSecret "your_github_client_secret"

# Preview changes
npm run preview

# Deploy infrastructure (~10 minutes)
npm run up
```

**What gets created:**
- ✅ VPC with public subnets (no NAT Gateway = $32/month saved!)
- ✅ RDS PostgreSQL database
- ✅ S3 bucket + CloudFront
- ✅ Beanstalk Application + Environment
- ✅ Application Load Balancer
- ✅ Auto Scaling Group
- ✅ IAM Roles & Security Groups

### 2. Deploy Application

```bash
# Automated deployment
npm run deploy

# OR Manual steps:
cd ../registry
npm run build
zip -r application.zip dist/ node_modules/ package.json

# Upload and deploy
aws s3 cp application.zip s3://$(pulumi stack output s3BucketName -C ../infra)/registry/application.zip
aws elasticbeanstalk create-application-version \
  --application-name $(pulumi stack output beanstalkApplicationName -C ../infra) \
  --version-label v1.0.0 \
  --source-bundle S3Bucket="$(pulumi stack output s3BucketName -C ../infra)",S3Key="registry/application.zip"

aws elasticbeanstalk update-environment \
  --environment-name $(pulumi stack output beanstalkEnvironmentName -C ../infra) \
  --version-label v1.0.0
```

### 3. Verify Deployment

```bash
# Check status
pulumi stack output beanstalkEndpoint

# Test health
curl $(pulumi stack output beanstalkEndpoint)/health

# Expected: {"status":"ok"}
```

---

## Deployment Workflow

### Initial Deployment

1. **Deploy Infrastructure**
   ```bash
   cd packages/infra
   npm run precheck  # Validate setup
   npm run up        # Deploy (~10 min)
   ```

2. **Deploy Application**
   ```bash
   npm run deploy    # Build, package, upload, deploy (~5 min)
   ```

3. **Run Migrations**
   ```bash
   # Get instance ID
   INSTANCE_ID=$(aws elasticbeanstalk describe-environment-resources \
     --environment-name $(pulumi stack output beanstalkEnvironmentName) \
     --query 'EnvironmentResources.Instances[0].Id' --output text)

   # SSH into instance
   aws ssm start-session --target $INSTANCE_ID

   # Run migrations
   cd /var/app/current
   npm run migrate
   ```

### Updating Application

```bash
cd packages/infra
npm run deploy  # Automated build + deploy

# OR with EB CLI (faster)
cd ../registry
eb deploy
```

### Updating Infrastructure

```bash
cd packages/infra

# Preview changes
npm run preview

# Apply changes
npm run up
```

---

## Configuration

### Environment Variables

Set via Beanstalk console or CLI:

```bash
ENV_NAME=$(pulumi stack output beanstalkEnvironmentName -C packages/infra)

# Set JWT secret
eb setenv JWT_SECRET="$(openssl rand -base64 32)" --environment $ENV_NAME

# Set feature flags
eb setenv FEATURE_COLLECTIONS=true --environment $ENV_NAME

# View all variables
eb printenv --environment $ENV_NAME
```

### Scaling Configuration

```bash
# Scale to 2-4 instances
pulumi config set app:minSize 2
pulumi config set app:maxSize 4
pulumi up

# OR via EB CLI
eb scale 2 --environment $ENV_NAME
```

### Instance Type

```bash
# Upgrade to t3.small (more CPU/memory)
pulumi config set app:instanceType t3.small
pulumi up
```

---

## Monitoring & Logs

### View Logs

```bash
# Tail logs
eb logs --tail

# Download last 100 lines
eb logs

# CloudWatch logs
aws logs tail /aws/elasticbeanstalk/$(pulumi stack output beanstalkEnvironmentName) --follow
```

### Check Health

```bash
# Overall health
eb health

# Detailed status
eb status

# Metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElasticBeanstalk \
  --metric-name EnvironmentHealth \
  --dimensions Name=EnvironmentName,Value=$(pulumi stack output beanstalkEnvironmentName) \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300
```

### Alarms

CloudWatch alarms are automatically configured for:
- Environment health degraded
- High HTTP 4xx/5xx error rates
- Instance CPU > 80%
- Application latency > 1s

---

## Troubleshooting

### Application won't start

**Check logs:**
```bash
eb logs --tail
```

**Common issues:**
- Missing environment variables → `eb printenv`
- Database connection failed → Check security groups
- Node.js version mismatch → Update `.ebextensions/nodejs.config`

### Health checks failing

**Update health check path:**
```bash
# In Beanstalk console: Configuration → Load Balancer → Processes
# Set Health Check Path to /health
```

### Deployment takes too long

**Use rolling deployment:**
```bash
# Already configured in index.ts:
# DeploymentPolicy: RollingWithAdditionalBatch
# BatchSize: 50%

# Force faster deployment (zero downtime, but costs more during deploy)
eb config set DeploymentPolicy=Immutable
```

### Database connection errors

**Check security group:**
```bash
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*rds*" \
  --query 'SecurityGroups[*].{Name:GroupName,Ingress:IpPermissions}'
```

**Should allow PostgreSQL (5432) from VPC CIDR (10.0.0.0/16)**

---

## Advanced Configuration

### Custom Domain (HTTPS)

1. **Add domain to Pulumi config:**
   ```bash
   pulumi config set app:domainName api.prpm.dev
   pulumi up
   ```

2. **Pulumi automatically creates:**
   - ACM SSL certificate
   - Route53 DNS records
   - HTTPS listener on ALB

3. **Verify:**
   ```bash
   curl https://api.prpm.dev/health
   ```

### Database Backups

RDS automated backups are enabled (7-day retention).

**Manual snapshot:**
```bash
aws rds create-db-snapshot \
  --db-instance-identifier $(pulumi stack select --show-name)-db \
  --db-snapshot-identifier manual-snapshot-$(date +%Y%m%d)
```

### Blue-Green Deployment

```bash
# Clone environment
eb clone $(pulumi stack output beanstalkEnvironmentName) --clone_name prpm-dev-blue

# Deploy to blue
eb deploy prpm-dev-blue

# Test blue environment
curl $(eb status prpm-dev-blue --verbose | grep CNAME | awk '{print $2}')/health

# Swap URLs (zero downtime)
eb swap prpm-dev-env --destination_name prpm-dev-blue
```

---

## Cost Optimization Tips

### Development Environment

```bash
# Use single instance (no ALB)
pulumi config set app:minSize 1
pulumi config set app:maxSize 1

# Smaller instance
pulumi config set app:instanceType t3.micro

# Reduce database size
pulumi config set db:instanceClass db.t4g.micro
pulumi config set db:allocatedStorage 20

# Estimated: $25-30/month
```

### Staging Environment

```bash
# 1-2 instances for availability
pulumi config set app:minSize 1
pulumi config set app:maxSize 2
pulumi config set app:instanceType t3.small

# Modest database
pulumi config set db:instanceClass db.t4g.small
pulumi config set db:allocatedStorage 50

# Estimated: $45-60/month
```

### Production Environment

```bash
# 2-4 instances with auto-scaling
pulumi config set app:minSize 2
pulumi config set app:maxSize 4
pulumi config set app:instanceType t3.small

# Production database
pulumi config set db:instanceClass db.t4g.medium
pulumi config set db:allocatedStorage 100

# Estimated: $75-100/month
```

---

## Migration from ECS

If you previously deployed with ECS:

```bash
# 1. Export data from ECS RDS
aws rds create-db-snapshot \
  --db-instance-identifier prpm-ecs-prod-db \
  --db-snapshot-identifier migration-snapshot

# 2. Deploy Beanstalk infrastructure
pulumi stack select prod
pulumi up

# 3. Restore data to new RDS
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier prpm-prod-db \
  --db-snapshot-identifier migration-snapshot

# 4. Update DNS to point to Beanstalk
# (Pulumi handles this if domainName is set)

# 5. Destroy ECS infrastructure
pulumi stack select prod-ecs
pulumi destroy
```

---

## Comparison: Beanstalk vs ECS

| Feature | Beanstalk | ECS Fargate |
|---------|-----------|-------------|
| **Cost** | ~$32/month | ~$126/month |
| **Complexity** | Low | High |
| **Deployment** | `eb deploy` | ECR push + ECS update |
| **Auto-scaling** | Built-in | Manual configuration |
| **Monitoring** | Beanstalk console | CloudWatch + ECS console |
| **Zero Downtime** | Rolling updates | Blue-green with ALB |
| **Container Support** | Docker supported | Docker required |
| **Multi-container** | Limited | Excellent |

**Choose Beanstalk if:**
- Cost is a concern (saves ~$94/month)
- Simple Node.js application
- Don't need complex microservices
- Want managed platform updates

**Choose ECS if:**
- Need multiple containers per task
- Want full control over infrastructure
- Complex service mesh required
- Container orchestration is priority

---

## Next Steps

1. ✅ Deploy infrastructure: `npm run up`
2. ✅ Deploy application: `npm run deploy`
3. ✅ Run migrations
4. ✅ Test health endpoint
5. ✅ Set up custom domain (optional)
6. ✅ Configure monitoring alerts
7. ✅ Set up CI/CD pipeline

**Happy deploying! 🚀**

For issues, check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
