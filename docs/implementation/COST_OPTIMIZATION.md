# PRPM Infrastructure - Cost Optimization Analysis

## Current Pulumi/ECS Setup Cost Breakdown

### Phase 1 Infrastructure (~$100-150/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | 2 tasks (256 CPU, 512MB RAM) | ~$30-40 |
| **Application Load Balancer** | Standard ALB | ~$22 |
| **RDS PostgreSQL** | db.t4g.micro (1vCPU, 1GB RAM) | ~$15 |
| **ElastiCache Redis** | cache.t4g.micro (1vCPU, 0.5GB RAM) | ~$12 |
| **NAT Gateway** | 1 NAT Gateway | ~$32 |
| **S3 + CloudFront** | Storage + CDN | ~$5-10 |
| **Data Transfer** | Outbound data | ~$5-10 |
| **Secrets Manager** | 3-4 secrets | ~$1-2 |
| **CloudWatch Logs** | Log storage | ~$3-5 |
| **Total** | | **~$125-148/month** |

### Why So Expensive?

1. **NAT Gateway** ($32/mo) - Most expensive single item
2. **Application Load Balancer** ($22/mo) - Required for ECS
3. **Fargate pricing** - More expensive than EC2
4. **Multi-AZ** - High availability = 2x costs

---

## 🚀 Elastic Beanstalk Alternative (MUCH CHEAPER)

### Proposed Architecture

```
AWS Elastic Beanstalk (Node.js)
├── Single t3.micro instance ($7.50/mo)
├── Application Load Balancer (included)
├── Auto Scaling (optional)
└── No NAT Gateway needed!

RDS PostgreSQL
└── db.t4g.micro ($15/mo)

ElastiCache Redis (Optional - use instance memory first)
└── cache.t4g.micro ($12/mo) OR in-memory ($0)

S3 + CloudFront
└── Storage + CDN ($5-10/mo)
```

### Cost Comparison

| Service | Current (ECS) | Beanstalk | Savings |
|---------|---------------|-----------|---------|
| **Compute** | Fargate: $30-40 | t3.micro: $7.50 | **-$22.50** |
| **Load Balancer** | ALB: $22 | Included: $0 | **-$22** |
| **NAT Gateway** | $32 | Not needed: $0 | **-$32** |
| **Database** | $15 | $15 | $0 |
| **Redis** | $12 | $0 (in-memory) | **-$12** |
| **S3/CDN** | $5-10 | $5-10 | $0 |
| **Other** | $10 | $5 | **-$5** |
| **TOTAL** | **~$126** | **~$32.50** | **-$93.50 (74% savings!)** |

### Even Cheaper Option (No Redis)

If we use in-memory caching instead of ElastiCache:

| Configuration | Monthly Cost |
|---------------|--------------|
| t3.micro (Node.js) | $7.50 |
| RDS db.t4g.micro | $15.00 |
| S3 + CloudFront | $5-10 |
| Data Transfer | $3-5 |
| **Total** | **$30.50-37.50/month** |

**Savings: 70-75% vs current setup!**

---

## Elastic Beanstalk Setup

### 1. Create Beanstalk Application

```bash
# Install EB CLI
pip install awsebcli

# Initialize Elastic Beanstalk
cd packages/registry
eb init

# Create environment
eb create prpm-prod \
  --instance-type t3.micro \
  --database.engine postgres \
  --database.size 20 \
  --database.instance db.t4g.micro \
  --envvars \
    NODE_ENV=production,\
    PORT=3000,\
    DATABASE_URL=postgres://...,\
    REDIS_URL=redis://localhost:6379,\
    JWT_SECRET=...,\
    GITHUB_CLIENT_ID=...,\
    GITHUB_CLIENT_SECRET=...
```

### 2. Configuration Files

**`.ebextensions/01_packages.config`**
```yaml
packages:
  yum:
    redis: []  # Install Redis locally

services:
  sysvinit:
    redis:
      enabled: true
      ensureRunning: true
```

**`.ebextensions/02_node.config`**
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: 20.x
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    NPM_USE_PRODUCTION: true
```

**`.ebextensions/03_migrations.config`**
```yaml
container_commands:
  01_migrate:
    command: "npm run migrate"
    leader_only: true
```

### 3. Deployment

```bash
# Deploy
eb deploy

# Check status
eb status

# View logs
eb logs

# SSH into instance
eb ssh
```

### 4. Auto Scaling (Optional)

```yaml
# .ebextensions/04_autoscaling.config
option_settings:
  aws:autoscaling:asg:
    MinSize: 1
    MaxSize: 4
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Statistic: Average
    Unit: Percent
    UpperThreshold: 70
    LowerThreshold: 30
```

**Scaling costs:**
- 1 instance: $7.50/mo
- 2 instances: $15/mo
- 4 instances: $30/mo

Still cheaper than ECS Fargate!

---

## Alternative: Single EC2 + Docker Compose

### Even Simpler & Cheaper Setup

```bash
# Launch t3.micro ($7.50/mo)
# Install Docker & Docker Compose
# Use existing docker-compose.yml

Total cost: $7.50/mo + data transfer
```

**Setup:**
```bash
# 1. Launch EC2 t3.micro
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --security-group-ids sg-xxx \
  --key-name your-key

# 2. SSH in and setup
ssh ec2-user@your-ip

# 3. Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# 4. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Clone repo and run
git clone https://github.com/khaliqgant/prompt-package-manager.git
cd prompt-package-manager/packages/registry
docker-compose up -d

# 6. Setup reverse proxy with Caddy (auto HTTPS)
docker run -d \
  -p 80:80 \
  -p 443:443 \
  -v caddy_data:/data \
  caddy:latest \
  caddy reverse-proxy --from registry.prmp.dev --to localhost:3000
```

**Pros:**
- Cheapest option ($7.50/mo)
- Simple deployment
- Full control
- Auto HTTPS with Caddy

**Cons:**
- Manual scaling
- No built-in monitoring
- Need to manage OS updates

---

## Recommended Architecture Tiers

### Tier 1: MVP/Hobby ($7.50-15/month)
**Single EC2 t3.micro with Docker Compose**
- Good for: 0-1,000 users
- Services: All-in-one (Registry, Postgres, Redis)
- Scaling: Vertical (upgrade instance)

**Setup:**
```yaml
# docker-compose.yml (production)
version: '3.8'
services:
  registry:
    image: prmp-registry:latest
    depends_on: [postgres, redis]
    ports: ["3000:3000"]
    restart: always

  postgres:
    image: postgres:15-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  caddy:
    image: caddy:latest
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    restart: always
```

### Tier 2: Startup ($32.50-50/month)
**Elastic Beanstalk + RDS**
- Good for: 1,000-10,000 users
- Services: Beanstalk (app) + RDS (db)
- Scaling: Horizontal auto-scaling

**Features:**
- Auto-scaling (1-4 instances)
- Managed deployments
- Zero-downtime updates
- Built-in monitoring

### Tier 3: Growth ($100-150/month)
**Current ECS Fargate + RDS + ElastiCache**
- Good for: 10,000+ users
- Services: Multi-AZ, HA setup
- Scaling: Fargate auto-scaling

**Features:**
- High availability
- Auto-scaling
- Container orchestration
- Enterprise-grade

---

## Migration Path

### Phase 1: Start with EC2 (Week 1)
1. Launch t3.micro
2. Deploy with Docker Compose
3. Setup Caddy for HTTPS
4. Configure domain DNS
5. **Cost: $7.50/month**

### Phase 2: Move to Beanstalk (Month 2-3)
When traffic grows:
1. Create Beanstalk environment
2. Migrate database to RDS
3. Setup auto-scaling
4. Test deployment
5. Switch DNS
6. **Cost: $32.50/month**

### Phase 3: Scale to ECS (Month 6+)
When you need HA:
1. Use existing Pulumi infra
2. Deploy to ECS Fargate
3. Enable multi-AZ
4. Add ElastiCache
5. **Cost: $100-150/month**

---

## Immediate Action Plan

### Step 1: Create Beanstalk Environment

```bash
cd packages/registry

# Initialize EB
eb init -p node.js-20 -r us-east-1 prpm

# Create environment
eb create prpm-production \
  --instance-type t3.micro \
  --single \
  --envvars \
    NODE_ENV=production,\
    PORT=3000,\
    JWT_SECRET=$(openssl rand -hex 32)

# Deploy
eb deploy

# Get URL
eb status
```

### Step 2: Setup External Database

```bash
# Create RDS separately for better control
aws rds create-db-instance \
  --db-instance-identifier prpm-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username prmp \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --publicly-accessible false

# Add to Beanstalk
eb setenv DATABASE_URL=postgresql://prmp:password@endpoint:5432/prmp_registry
```

### Step 3: Deploy & Test

```bash
# Deploy application
eb deploy

# Check logs
eb logs

# Open in browser
eb open
```

---

## Cost Comparison Summary

| Approach | Month 1 | Month 6 | Month 12 | Scaling |
|----------|---------|---------|----------|---------|
| **EC2 Docker** | $7.50 | $7.50 | $7.50 | Manual |
| **Beanstalk** | $32.50 | $32.50-75 | $50-100 | Auto |
| **ECS Current** | $126 | $126-200 | $150-250 | Auto |

**Recommendation:** Start with **Beanstalk** for balance of cost ($32.50/mo) and features (auto-scaling, deployments, monitoring).

---

## Cost Optimization Tips

1. **Use Reserved Instances** - 40% savings for 1-year commitment
2. **Spot Instances** - 70% savings for non-critical environments
3. **Right-size instances** - Start small, scale up as needed
4. **Delete unused resources** - NAT Gateways, old snapshots
5. **Use S3 Intelligent Tiering** - Auto-move old files to cheaper storage
6. **CloudFront caching** - Reduce origin requests
7. **Combine environments** - dev/staging on same instance

---

## Next Steps

1. **Immediate:** Create Beanstalk environment ($32.50/mo)
2. **Week 1:** Deploy registry to Beanstalk
3. **Week 2:** Migrate database data
4. **Week 3:** Update DNS, test
5. **Week 4:** Decomission ECS/Fargate infrastructure

**Expected savings: $93.50/month (74%)**

**Time to implement: 2-3 days**
