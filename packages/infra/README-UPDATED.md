# PRPM Infrastructure as Code

This directory contains Pulumi infrastructure definitions for deploying the PRPM Registry to AWS.

## ⚡ Quick Start - Choose Your Deployment

### Option 1: Elastic Beanstalk (Recommended)
**💰 Cost:** $32.50/month | **⏱️ Setup:** 10 minutes | **🎯 Best for:** Most use cases

```bash
# Use cost-optimized Beanstalk configuration
cp index-beanstalk.ts index.ts
pulumi up
```

**Savings:** 74% cheaper than ECS ($93.50/month saved)

📖 **[Full Beanstalk Deployment Guide →](BEANSTALK_DEPLOYMENT.md)**

### Option 2: ECS Fargate (Enterprise)
**💰 Cost:** $126/month | **⏱️ Setup:** 30 minutes | **🎯 Best for:** Microservices, HA

```bash
# Use enterprise ECS configuration (current index.ts)
pulumi up
```

## Architecture Comparison

| Feature | Beanstalk | ECS Fargate |
|---------|-----------|-------------|
| **Monthly Cost** | $32.50 | $126 |
| **Compute** | t3.micro | Fargate tasks |
| **Load Balancer** | Included | Separate ($22/mo) |
| **NAT Gateway** | Not needed | Required ($32/mo) |
| **Database** | RDS db.t4g.micro ($15) | RDS db.t4g.micro ($15) |
| **Caching** | In-memory | ElastiCache ($12/mo) |
| **Auto-scaling** | ✅ Yes | ✅ Yes |
| **Zero-downtime** | ✅ Yes | ✅ Yes |
| **Setup Complexity** | Simple | Complex |
| **Best For** | 90% of use cases | Microservices |

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Pulumi Account** (free tier works - https://app.pulumi.com/signup)
3. **Node.js 20+**
4. **AWS CLI** configured (`aws configure`)
5. **Pulumi CLI** installed:
   ```bash
   brew install pulumi
   # or
   curl -fsSL https://get.pulumi.com | sh
   ```
6. **EB CLI** (for Beanstalk deployments):
   ```bash
   pip install awsebcli
   ```

## Quick Start - Beanstalk (Recommended)

### 1. Install Dependencies

```bash
cd packages/infra
npm install
```

### 2. Setup Pulumi

```bash
# Login to Pulumi
pulumi login

# Create production stack
pulumi stack init prod
pulumi stack select prod
```

### 3. Configure

```bash
# AWS region
pulumi config set aws:region us-east-1

# Database credentials
pulumi config set db:username prpm
pulumi config set --secret db:password $(openssl rand -base64 32)

# GitHub OAuth (create at github.com/settings/developers)
pulumi config set --secret github:clientId YOUR_CLIENT_ID
pulumi config set --secret github:clientSecret YOUR_CLIENT_SECRET

# Optional: Custom domain
pulumi config set app:domainName registry.prpm.dev
```

### 4. Deploy

```bash
# Switch to Beanstalk configuration
cp index-beanstalk.ts index.ts

# Preview changes
pulumi preview

# Deploy (10-15 minutes)
pulumi up

# Get outputs
pulumi stack output apiUrl
```

### 5. Deploy Application

```bash
cd ../registry

# Deploy with EB CLI
eb init --region us-east-1
eb use $(pulumi stack output beanstalkEnvironmentName --cwd ../infra)
eb deploy

# Verify
curl $(pulumi stack output apiUrl --cwd ../infra)/health
```

## Cost Breakdown

### Beanstalk Setup ($32.50/month)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| **EC2 Instance** | t3.micro (1 instance) | $7.50 |
| **RDS PostgreSQL** | db.t4g.micro (20GB) | $15.00 |
| **S3 + CloudFront** | Package storage + CDN | $5-10 |
| **Data Transfer** | Outbound traffic | $3-5 |
| **CloudWatch Logs** | Log storage (7 days) | $1-2 |
| **Total** | | **$31.50-39.50** |

### ECS Setup ($126/month)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| **ECS Fargate** | 2 tasks (256 CPU, 512MB RAM) | $30-40 |
| **Application Load Balancer** | Standard ALB | $22 |
| **NAT Gateway** | 1 NAT Gateway | $32 |
| **RDS PostgreSQL** | db.t4g.micro (20GB) | $15 |
| **ElastiCache Redis** | cache.t4g.micro | $12 |
| **S3 + CloudFront** | Package storage + CDN | $5-10 |
| **Other** | Data transfer, logs, secrets | $5-10 |
| **Total** | | **$121-141** |

**Savings with Beanstalk: $89.50-109.50/month (71-77%)**

## Configuration Reference

### Database Settings

```bash
pulumi config set db:username prpm
pulumi config set --secret db:password <secure-password>
pulumi config set db:instanceClass db.t4g.micro  # or db.t4g.small
pulumi config set db:allocatedStorage 20         # GB
```

### Application Settings (Beanstalk)

```bash
pulumi config set app:instanceType t3.micro  # or t3.small
pulumi config set app:minSize 1              # Minimum instances
pulumi config set app:maxSize 2              # Maximum instances
pulumi config set app:domainName registry.prpm.dev
```

### Application Settings (ECS)

```bash
pulumi config set app:image prpm-registry:latest
pulumi config set app:cpu 256        # CPU units
pulumi config set app:memory 512     # Memory in MB
pulumi config set app:desiredCount 2 # Number of tasks
```

## Deployment Workflows

### Local → Beanstalk

```bash
# 1. Test locally
cd packages/registry
docker-compose up -d

# 2. Deploy to Beanstalk
eb deploy

# 3. Run migrations
eb ssh
cd /var/app/current
npm run migrate
exit

# 4. Verify
curl $(eb status | grep CNAME | awk '{print $2}')/health
```

### GitHub Actions CI/CD

See `BEANSTALK_DEPLOYMENT.md` for GitHub Actions workflow examples.

## Monitoring

### Health Checks

```bash
# Beanstalk
eb health

# ECS
aws ecs describe-services --cluster prpm-prod --services prpm-prod-service
```

### Logs

```bash
# Beanstalk
eb logs --tail

# ECS
aws logs tail /ecs/prpm-prod --follow
```

### Metrics

Available in AWS Console → CloudWatch:
- Request count
- Response time
- Error rate
- CPU/Memory utilization
- Database connections

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check security groups
   aws ec2 describe-security-groups --group-ids sg-xxxxx
   ```

2. **Health Check Failing**
   ```bash
   # Test health endpoint
   curl http://your-app-url/health
   ```

3. **Deployment Timeout**
   ```bash
   # Increase timeout
   eb config
   # Edit: aws:elasticbeanstalk:command → Timeout: 900
   ```

See `BEANSTALK_DEPLOYMENT.md` for detailed troubleshooting guide.

## Migration Path

### From ECS to Beanstalk

```bash
# 1. Backup database
aws rds create-db-snapshot --db-instance-identifier prpm-db --db-snapshot-identifier prpm-backup

# 2. Deploy Beanstalk infrastructure
cp index-beanstalk.ts index.ts
pulumi up

# 3. Migrate data (if needed)
# 4. Update DNS to point to Beanstalk
# 5. Destroy ECS infrastructure
cp index-ecs.ts index.ts
pulumi destroy
```

### From Beanstalk to ECS

```bash
# 1. Backup everything
# 2. Deploy ECS infrastructure
cp index.ts index-beanstalk-backup.ts
mv index-ecs.ts index.ts
pulumi up

# 3. Migrate data
# 4. Update DNS
# 5. Destroy Beanstalk
```

## Stack Management

### Multiple Environments

```bash
# Create stacks
pulumi stack init dev
pulumi stack init staging
pulumi stack init prod

# Switch between stacks
pulumi stack select dev
pulumi up

pulumi stack select prod
pulumi up
```

### Export/Backup Stack

```bash
# Export state
pulumi stack export --file backup.json

# Import state
pulumi stack import --file backup.json
```

## Cost Optimization Tips

1. **Use Reserved Instances** - 40% savings for 1-year commitment
2. **Right-size instances** - Monitor and adjust based on usage
3. **Enable S3 Intelligent Tiering** - Auto-move old files to cheaper storage
4. **Use CloudFront caching** - Reduce origin requests
5. **Schedule scaling** - Scale down dev/staging during off-hours

## Support

- **Beanstalk Guide:** [BEANSTALK_DEPLOYMENT.md](BEANSTALK_DEPLOYMENT.md)
- **Pulumi Docs:** https://www.pulumi.com/docs/
- **AWS EB Docs:** https://docs.aws.amazon.com/elasticbeanstalk/
- **GitHub Issues:** https://github.com/khaliqgant/prompt-package-manager/issues

## Next Steps

1. ✅ Choose deployment option (Beanstalk recommended)
2. ✅ Deploy infrastructure with Pulumi
3. ✅ Deploy application
4. ⏳ Setup custom domain (Route 53)
5. ⏳ Configure SSL certificate (ACM)
6. ⏳ Setup CI/CD (GitHub Actions)
7. ⏳ Configure monitoring alarms
8. ⏳ Load test application

---

**💡 Recommendation:** Start with Beanstalk ($32.50/month). Migrate to ECS only if you need microservices or advanced container orchestration.
