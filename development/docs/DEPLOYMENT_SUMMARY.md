# PRPM Deployment Summary

## Two-Step Deployment Model

We've separated infrastructure provisioning (one-time) from application deployment (frequent) for better safety and workflow.

### 📦 Infrastructure Provisioning (Local)

**When:** Once per environment, or when changing infrastructure settings
**How:** Run interactive script locally
**Why:** Requires secret inputs, safer with human oversight, one-time configuration

```bash
cd packages/infra
npm run provision:dev   # Interactive provisioning for dev environment
```

**What it does:**
1. ✅ Validates prerequisites (AWS CLI, Pulumi, credentials)
2. 🔐 Prompts for secrets (DB password, GitHub OAuth, JWT)
3. ⚙️ Configures infrastructure (instance type, scaling, domain)
4. 💰 Shows cost estimate
5. 👀 Shows Pulumi preview of resources
6. 🚀 Deploys infrastructure via `pulumi up`
7. 💾 Saves environment info to `dev-environment.txt`

**What gets created:**
- VPC with public/private subnets
- RDS PostgreSQL database
- S3 bucket for packages
- Elastic Beanstalk application and environment
- Route53 DNS + ACM SSL (if domain specified)
- Security groups, IAM roles, load balancer

### 🚀 Application Deployment (GitHub Actions)

**When:** Every code push, or manual trigger
**How:** Automatic via GitHub Actions
**Why:** Consistent, auditable, automated health checks, rollback on failure

```bash
git push origin main   # Automatic deployment
```

**What it does:**
1. ✅ Checks environment health (must be Ready)
2. 🏗️ Builds application (TypeScript → JavaScript)
3. 📦 Creates deployment package with version
4. ☁️ Uploads to S3
5. 🚀 Deploys to Beanstalk with rolling update
6. ⏳ Waits for deployment (up to 15 min)
7. 🏥 Verifies health endpoints
8. 🔄 Auto-rollback on failure
9. 🧹 Cleans up old versions

**Workflow:** `../../.github/workflows/deploy-registry.yml`

## Quick Start

### First Time Setup

```bash
# 1. Install prerequisites
brew install pulumi awscli
aws configure

# 2. Create GitHub OAuth App
# https://github.com/settings/developers

# 3. Set GitHub Secrets
gh secret set PULUMI_ACCESS_TOKEN
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY

# 4. Provision infrastructure
cd packages/infra
npm run provision:dev

# Enter when prompted:
# - Database password: (generate secure random)
# - GitHub Client ID: (from OAuth app)
# - GitHub Client Secret: (from OAuth app)
# - JWT Secret: openssl rand -base64 32
# - Instance type: t3.micro (default)
# - Min/Max instances: 1/2 (default)
# - Domain: (optional, e.g. registry.prpm.dev)

# 5. Wait for environment to be Ready (~10-15 min)

# 6. Deploy application
git push origin main
# Or trigger "Deploy Registry Application" workflow in GitHub UI
```

### Ongoing Updates

```bash
# Infrastructure changes (instance size, env vars, etc.)
cd packages/infra
pulumi stack select dev
pulumi config set app:instanceType t3.small
pulumi up

# Or use GitHub Actions: "Update Infrastructure (Pulumi)" workflow

# Application changes
git push origin main  # Automatic deployment
```

## Key Files

| File | Purpose |
|------|---------|
| `../../packages/infra/scripts/provision-infrastructure.sh` | Interactive provisioning script |
| `../../.github/workflows/deploy-registry.yml` | Application deployment workflow |
| `../../.github/workflows/deploy-pulumi-beanstalk.yml` | Infrastructure update workflow |
| `../../packages/infra/ENVIRONMENT_VARIABLES.md` | Environment variable reference |
| `./DEPLOYMENT_VERIFICATION.md` | Complete deployment checklist |
| `../../.github/workflows/WORKFLOWS.md` | Workflow documentation |

## Environment Variables

All configured via Pulumi and GitHub Secrets:

| Variable | Source | Configured In |
|----------|--------|---------------|
| `DATABASE_URL` | Pulumi (from RDS) | Infrastructure provisioning |
| `GITHUB_CLIENT_ID` | GitHub Secret → Pulumi | Infrastructure provisioning |
| `GITHUB_CLIENT_SECRET` | GitHub Secret → Pulumi | Infrastructure provisioning |
| `JWT_SECRET` | GitHub Secret → Pulumi | Infrastructure provisioning |
| `AWS_S3_BUCKET` | Pulumi (from S3) | Infrastructure provisioning |
| `AWS_REGION` | Pulumi | Infrastructure provisioning |
| `NODE_ENV` | Pulumi (stack-based) | Infrastructure provisioning |

See [Environment Variables](../../packages/infra/ENVIRONMENT_VARIABLES.md) for complete details.

## Cost Breakdown

| Environment | Monthly Cost |
|-------------|--------------|
| Dev | ~$30 (1x t3.micro, db.t4g.micro, S3) |
| Staging | ~$30 (1x t3.micro, db.t4g.micro, S3) |
| Production | ~$45 (2x t3.micro, db.t4g.micro, S3) |

**Savings vs ECS Fargate:** ~$94/month (74% cheaper)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Route 53 + ACM                        │
│              (Optional custom domain)                   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│         Application Load Balancer (ALB)                 │
│           (Included with Beanstalk)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│          Elastic Beanstalk Environment                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   EC2        │  │   EC2        │  (Auto-scaled)      │
│  │ (t3.micro)   │  │ (t3.micro)   │                     │
│  │              │  │              │                     │
│  │ Node.js 20   │  │ Node.js 20   │                     │
│  │ Registry App │  │ Registry App │                     │
│  └──────┬───────┘  └──────┬───────┘                    │
│         │                  │                             │
└─────────┼──────────────────┼─────────────────────────────┘
          │                  │
          └─────────┬────────┘
                    │
        ┌───────────┴──────────┬──────────────────┐
        │                      │                  │
┌───────▼────────┐  ┌──────────▼───────┐  ┌──────▼─────┐
│ RDS PostgreSQL │  │    S3 Bucket     │  │ CloudWatch │
│ (db.t4g.micro) │  │   + CloudFront   │  │   Logs     │
│                │  │                  │  │            │
│  Private       │  │  Package Storage │  │ Monitoring │
│  Subnet        │  │                  │  │            │
└────────────────┘  └──────────────────┘  └────────────┘
```

## Workflows

### Infrastructure Provisioning Workflow

```
Local Machine
      │
      ├─ Run: npm run provision:dev
      │
      ├─ 1. Pre-deployment checks
      │    ├─ AWS CLI installed?
      │    ├─ Pulumi installed?
      │    └─ AWS credentials valid?
      │
      ├─ 2. Prompt for configuration
      │    ├─ Database password
      │    ├─ GitHub OAuth credentials
      │    ├─ JWT secret
      │    ├─ Instance type & scaling
      │    └─ Domain (optional)
      │
      ├─ 3. Configure Pulumi stack
      │    └─ pulumi config set (all secrets encrypted)
      │
      ├─ 4. Preview infrastructure
      │    └─ pulumi preview --diff
      │
      ├─ 5. Show cost estimate
      │    └─ ~$30-45/month
      │
      ├─ 6. Confirm deployment
      │    └─ Deploy? (y/N)
      │
      ├─ 7. Deploy infrastructure
      │    ├─ pulumi up (~10-15 min)
      │    ├─ Create VPC, subnets, security groups
      │    ├─ Create RDS database
      │    ├─ Create S3 bucket
      │    ├─ Create Beanstalk app & environment
      │    └─ Configure all environment variables
      │
      └─ 8. Save outputs
           └─ dev-environment.txt
```

### Application Deployment Workflow

```
GitHub Push
      │
      ├─ Trigger: .github/workflows/deploy-registry.yml
      │
      ├─ 1. Pre-deployment checks
      │    ├─ Environment exists?
      │    ├─ Environment status = Ready?
      │    └─ Environment health?
      │
      ├─ 2. Build application
      │    ├─ npm ci (install deps)
      │    ├─ npm run build (TypeScript → JS)
      │    └─ npm prune --production
      │
      ├─ 3. Create deployment package
      │    ├─ Version: v{run}-{sha}
      │    └─ zip: dist/, node_modules/, .ebextensions/
      │
      ├─ 4. Upload to S3
      │    └─ s3://bucket/deployments/{version}.zip
      │
      ├─ 5. Create Beanstalk version
      │    └─ Link S3 package to version label
      │
      ├─ 6. Deploy to environment
      │    └─ Rolling update (50% batch)
      │
      ├─ 7. Wait for deployment
      │    ├─ Poll every 10s (up to 15 min)
      │    ├─ Check: Status=Ready, Health=Green
      │    └─ Verify version updated
      │
      ├─ 8. Verify health
      │    ├─ Test: /health endpoint
      │    ├─ Test: /api/v1/packages endpoint
      │    └─ Rollback if failed
      │
      └─ 9. Cleanup
           └─ Delete old versions (keep 10)
```

## Security

✅ **All secrets properly configured:**
- Database password → Pulumi encrypted secret
- GitHub OAuth → Pulumi encrypted secret
- JWT secret → Pulumi encrypted secret
- AWS credentials → IAM roles (no env vars)

✅ **No secrets in Git:**
- `.gitignore` includes `Pulumi.*.yaml` files
- Environment info files (`.txt`) excluded

✅ **Deployment safety:**
- Pre-deployment health checks
- Rolling updates (zero downtime)
- Automatic rollback on failure
- Health endpoint verification

## Monitoring

```bash
# Environment health
aws elasticbeanstalk describe-environments \
  --environment-names prpm-registry-dev-env \
  --query 'Environments[0].[Status,Health]'

# Application logs
aws logs tail /aws/elasticbeanstalk/prpm-registry-dev-env/var/log/nodejs/nodejs.log --follow

# Recent events
aws elasticbeanstalk describe-events \
  --environment-name prpm-registry-dev-env \
  --max-records 20

# Test endpoints
CNAME=$(pulumi stack output beanstalkCname)
curl http://$CNAME/health
curl http://$CNAME/api/v1/packages?limit=1
```

## Next Steps

1. ✅ **Provision dev environment**
   ```bash
   cd packages/infra
   npm run provision:dev
   ```

2. ✅ **Deploy application**
   ```bash
   git push origin main
   ```

3. ✅ **Verify deployment**
   ```bash
   curl http://$(pulumi stack output beanstalkCname)/health
   ```

4. ⚙️ **Provision staging/prod** (when ready)
   ```bash
   npm run provision:prod
   ```

## Documentation

- **[Infrastructure README](../../packages/infra/README.md)** - Infrastructure overview
- **[Environment Variables](../../packages/infra/ENVIRONMENT_VARIABLES.md)** - Complete variable reference
- **[Workflows Guide](../../.github/workflows/WORKFLOWS.md)** - Workflow documentation
- **[Deployment Verification](./DEPLOYMENT_VERIFICATION.md)** - Complete checklist
- **[Beanstalk Expert Skill](../../skills/aws-beanstalk-expert.md)** - Beanstalk best practices

---

**You're all set!** Run `npm run provision:dev` to get started.
