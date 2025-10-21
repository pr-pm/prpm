# PRPM Infrastructure

AWS infrastructure for PRPM Registry using Pulumi and Elastic Beanstalk.

## 🏗️ Architecture

**Cost-Optimized Beanstalk Setup** (~$30-45/month):
- Elastic Beanstalk (Node.js 20 on Amazon Linux 2023)
- RDS PostgreSQL (db.t4g.micro)
- S3 + CloudFront for package storage
- Application Load Balancer (included with Beanstalk)
- Route53 + ACM for custom domains (optional)
- **No NAT Gateway** (saves $32/month)
- **No ElastiCache** (saves $12/month, using in-memory caching)

## 📋 Two-Step Deployment Model

### 1. Infrastructure Provisioning (One-time / Infrequent)

**Local provisioning for safety and configuration:**

```bash
cd packages/infra

# Interactive provisioning (recommended)
npm run provision:dev      # Dev environment
npm run provision:staging  # Staging environment
npm run provision:prod     # Production environment
```

**What happens:**
1. Validates prerequisites (AWS CLI, Pulumi, credentials)
2. Prompts for secrets (database password, GitHub OAuth, JWT)
3. Shows infrastructure preview and cost estimate
4. Deploys via `pulumi up` (~10-15 minutes)
5. Saves environment details to `{stack}-environment.txt`

### 2. Application Deployment (Frequent)

**Automatic via GitHub Actions:**

```bash
# Push to main branch
git push origin main

# Or manual via GitHub UI:
# Actions → Deploy Registry Application → Select environment
```

See [`.github/workflows/WORKFLOWS.md`](../../.github/workflows/WORKFLOWS.md) for deployment details.

## 🚀 Quick Start

### Prerequisites

```bash
# Install tools
brew install pulumi awscli

# Configure AWS
aws configure

# Create Pulumi account at https://app.pulumi.com
# Create GitHub OAuth App at https://github.com/settings/developers

# Set GitHub Secrets (for CI/CD)
gh secret set PULUMI_ACCESS_TOKEN
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
```

### First-Time Setup

```bash
# 1. Provision infrastructure
cd packages/infra
npm run provision:dev

# Enter when prompted:
# - Database password (secure random string)
# - GitHub OAuth Client ID and Secret
# - JWT secret: openssl rand -base64 32
# - Instance type, scaling, domain (optional)

# 2. Wait for environment to be Ready (~10-15 min)
aws elasticbeanstalk describe-environments \
  --environment-names prpm-registry-dev-env \
  --query 'Environments[0].Status'

# 3. Deploy application
# Push code or trigger GitHub Actions workflow
```

## 🛠️ Common Tasks

### Update Environment Variables

```bash
pulumi stack select dev

# Update JWT secret
pulumi config set --secret jwt:secret "new-secret"

# Apply changes
pulumi up
```

### Scale Up/Down

```bash
pulumi config set app:instanceType t3.small
pulumi config set app:maxSize 4
pulumi up
```

### View Outputs

```bash
pulumi stack output --json
pulumi stack output beanstalkCname
```

### Monitor Environment

```bash
# Environment health
aws elasticbeanstalk describe-environments \
  --environment-names prpm-registry-dev-env

# Application logs
aws logs tail /aws/elasticbeanstalk/prpm-registry-dev-env/var/log/nodejs/nodejs.log --follow
```

## 💰 Cost Estimates

| Environment | Monthly Cost |
|-------------|--------------|
| Dev | ~$30 (1 instance) |
| Staging | ~$30 (1 instance) |
| Production | ~$45 (2 instances) |

**Savings vs ECS:** ~$94/month (74% cheaper)

## 📚 Documentation

- **[Environment Variables](./ENVIRONMENT_VARIABLES.md)** - Complete variable reference
- **[Deployment Summary](../../development/docs/DEPLOYMENT_SUMMARY.md)** - Quick deployment overview
- **[Deployment Verification](../../development/docs/DEPLOYMENT_VERIFICATION.md)** - Deployment checklist
- **[Workflows Guide](../../.github/workflows/WORKFLOWS.md)** - GitHub Actions guide
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues

## 🔒 Security

- ✅ All secrets in Pulumi encrypted config
- ✅ GitHub Secrets for CI/CD
- ✅ IAM roles (no hardcoded AWS credentials)
- ✅ Security groups with minimal access
- ✅ HTTPS with ACM certificates
- ✅ Database encryption at rest

**Best Practice:** Rotate JWT_SECRET and DB_PASSWORD every 90 days.

## 🆘 Troubleshooting

```bash
# Environment stuck?
aws elasticbeanstalk abort-environment-update \
  --environment-name prpm-registry-dev-env

# View errors
aws elasticbeanstalk describe-events \
  --environment-name prpm-registry-dev-env \
  --severity ERROR

# Refresh Pulumi state
pulumi refresh
```

## 📦 Files

```
packages/infra/
├── scripts/
│   └── provision-infrastructure.sh  # Interactive provisioning
├── modules/
│   ├── network.ts                   # VPC, security groups
│   ├── database.ts                  # RDS PostgreSQL
│   ├── storage.ts                   # S3 + CloudFront
│   └── beanstalk.ts                 # Beanstalk app
├── index.ts                         # Main Pulumi program
├── validation.ts                    # Config validation
└── README.md                        # This file
```

## ❓ FAQ

**Q: Should I provision via script or GitHub Actions?**
A: Use the local script (`npm run provision:dev`) for initial setup. GitHub Actions workflow is for updates only.

**Q: How do I deploy application code?**
A: Push to main branch. GitHub Actions handles the deployment automatically.

**Q: Can I add a custom domain?**
A: Yes, set during provisioning or update: `pulumi config set app:domainName registry.prpm.dev`

**Q: What if deployment fails?**
A: GitHub Actions automatically rolls back to the previous version.

---

**For complete deployment details, see [Deployment Verification](../../development/docs/DEPLOYMENT_VERIFICATION.md)**
