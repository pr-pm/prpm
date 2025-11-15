# PRPM CI/CD Workflows

This directory contains GitHub Actions workflows for PRPM deployment.

## 🏗️ Two-Step Deployment Model

### Application Deployment (Frequent)
**Automated:** GitHub Actions on push to main
- Builds and deploys application code
- Automated health checks and rollback
- Consistent and auditable

---

## Workflows

### 0. `codex-autofix.yml` - Auto-fix failed CI runs with Codex

**Purpose:** Automatically trigger Codex to triage a failed `CI` workflow, apply the smallest fix, re-run tests, and open a pull request with the proposed patch.

**Triggers:**
- `workflow_run` on the `CI` workflow whenever it completes (only proceeds if the conclusion is `failure`)

**Requirements:**
- Repository secret `OPENAI_API_KEY`
- Maintainer approval for pull requests opened from the auto-fix branch `codex/auto-fix-<run_id>`

**What it does:**
1. Ensures the OpenAI API key secret is configured, then checks out the commit/branch that failed.
2. Sets up Node.js 20 and installs dependencies so Codex has the same environment as the primary CI job.
3. Delegates to [`openai/codex-action`](https://developers.openai.com/codex/autofix-ci) with a prompt tailored for our monorepo to diagnose and fix the failure.
4. Re-runs `npm test --silent` to verify Codex’s patch.
5. Uses `peter-evans/create-pull-request` to open a PR referencing the failed workflow/run so humans can review & merge the automated fix.

### 1. `deploy-registry.yml` - Deploy Application

**Purpose:** Deploy the registry application to Elastic Beanstalk

**Triggers:**
- Push to `main` branch (changes in `packages/registry/**` or `packages/types/**`)
- Manual workflow dispatch

**What it does:**
1. ✅ **Pre-deployment checks:**
   - Verifies environment exists and is Ready
   - Checks environment health status
   - Validates current configuration

2. 🏗️ **Build:**
   - Installs dependencies (registry + types)
   - Compiles TypeScript to JavaScript
   - Prunes dev dependencies
   - Creates deployment package (.zip)

3. 📦 **Package:**
   - Includes: `dist/`, `node_modules/`, `package.json`, `.ebextensions/`, `migrations/`
   - Excludes: tests, docs, git files

4. 🚀 **Deploy:**
   - Uploads package to S3
   - Creates Beanstalk application version
   - Deploys to environment with rolling update
   - Waits for deployment completion (up to 15 minutes)

5. ✅ **Verify:**
   - Tests `/health` endpoint
   - Tests `/api/v1/packages` endpoint
   - Confirms application is responding correctly

6. 🧹 **Cleanup:**
   - Removes old application versions (keeps last 10)
   - Deletes old S3 deployment packages

**Deployment Flow:**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Check Environment Health                             │
│    - Status must be "Ready"                             │
│    - Warns if health is "Red"                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Build Application                                    │
│    - npm ci (install deps)                              │
│    - npm run build (TypeScript → JavaScript)            │
│    - npm prune --production (remove dev deps)           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Create Deployment Package                            │
│    - Version: v{run_number}-{git_sha}                   │
│    - Zip with all runtime files                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Upload to S3                                         │
│    - S3 bucket determined by environment                │
│    - Key: deployments/{version}.zip                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Create Beanstalk Application Version                 │
│    - Links S3 package to version label                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Deploy to Environment                                │
│    - Rolling update (50% batch size)                    │
│    - Zero-downtime deployment                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Wait for Deployment (up to 15 min)                   │
│    - Polls every 10 seconds                             │
│    - Checks: Status=Ready, Health=Green/Yellow          │
│    - Fails if: Health=Red or version doesn't update     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 8. Verify Application Health                            │
│    - Test /health endpoint (up to 5 min)                │
│    - Test /api/v1/packages endpoint                     │
│    - Auto-rollback if health checks fail                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 9. Cleanup Old Versions                                 │
│    - Keep last 10 versions                              │
│    - Delete older versions from Beanstalk + S3          │
└─────────────────────────────────────────────────────────┘
```

**Error Handling:**
- ❌ **Environment not Ready:** Deployment fails immediately
- ❌ **Health check fails:** Auto-rollback to previous version
- ❌ **Deployment timeout:** Fails after 15 minutes
- ❌ **Version mismatch:** Fails if new version not deployed after 100 seconds

**Usage:**
```bash
# Via GitHub UI: Actions → Deploy Registry Application → Run workflow → Select environment

# Application is deployed automatically on push to main
```

## Environment Variables

All environment variables are configured via Pulumi infrastructure and stored in GitHub Secrets.

**Infrastructure configures these in Beanstalk environment:**

| Variable | Source | Description |
|----------|--------|-------------|
| `NODE_ENV` | Pulumi | Environment (production/staging/dev) |
| `PORT` | Pulumi | Application port (3000) |
| `DATABASE_URL` | Pulumi | PostgreSQL connection string |
| `REDIS_URL` | Pulumi | Redis connection string (optional) |
| `GITHUB_CLIENT_ID` | GitHub Secret | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub Secret | GitHub OAuth client secret |
| `GITHUB_CALLBACK_URL` | Pulumi | OAuth callback URL |
| `AWS_S3_BUCKET` | Pulumi | S3 bucket for package storage |
| `AWS_REGION` | Pulumi | AWS region |
| `JWT_SECRET` | GitHub Secret | JWT signing secret |

## Deployment Strategy

**Infrastructure:**
- Deploy infrastructure changes FIRST via `deploy-pulumi-beanstalk.yml`
- Creates/updates Beanstalk environment with proper configuration
- Environment must be in "Ready" state before application deployment

**Application:**
- Deploy application changes via `deploy-registry.yml`
- Uses rolling deployment policy (50% batch size)
- Zero-downtime deployment with health checks

**Order of Operations:**
1. **Initial Setup:** Run infrastructure workflow to create environment
2. **Application Updates:** Run application workflow to deploy code
3. **Config Changes:** Run infrastructure workflow to update environment variables

## Manual Deployment Prevention

⚠️ **IMPORTANT:** All deployments MUST go through GitHub Actions.

Manual deployment scripts have been moved to infrastructure repository:
- ℹ️ `../prpm/infrastructure/scripts/deploy-beanstalk.sh` (moved to infrastructure repo)
- ❌ Direct `eb deploy` commands (not recommended)
- ❌ Direct AWS CLI deployment commands (not recommended)

**Why GitHub Actions only?**
1. ✅ **Consistent:** Same deployment process every time
2. ✅ **Auditable:** Full deployment history in GitHub
3. ✅ **Safe:** Pre-deployment health checks
4. ✅ **Automated:** Wait for deployment, verify health, cleanup
5. ✅ **Rollback:** Automatic rollback on failure

## Monitoring Deployments

**Via GitHub Actions UI:**
- View real-time deployment logs
- See deployment status (success/failure)
- Download deployment artifacts

**Via AWS Console:**
- Beanstalk → Environments → Events
- CloudWatch → Logs → Beanstalk application logs
- CloudWatch → Metrics → Beanstalk environment health

**Via AWS CLI:**
```bash
# Check environment status
aws elasticbeanstalk describe-environments \
  --environment-names prpm-registry-dev-env

# View recent events
aws elasticbeanstalk describe-events \
  --environment-name prpm-registry-dev-env \
  --max-records 20

# View environment health
aws elasticbeanstalk describe-environment-health \
  --environment-name prpm-registry-dev-env \
  --attribute-names All
```

## Troubleshooting

### Deployment Stuck in "Updating"

**Check events:**
```bash
aws elasticbeanstalk describe-events \
  --environment-name prpm-registry-dev-env \
  --max-records 50 \
  --severity ERROR
```

**Abort and rollback:**
```bash
aws elasticbeanstalk abort-environment-update \
  --environment-name prpm-registry-dev-env
```

### Health Check Failing

**Check application logs:**
```bash
aws logs tail /aws/elasticbeanstalk/prpm-registry-dev-env/var/log/nodejs/nodejs.log --follow
```

**Test health endpoint manually:**
```bash
ENDPOINT=$(aws elasticbeanstalk describe-environments \
  --environment-names prpm-registry-dev-env \
  --query "Environments[0].CNAME" \
  --output text)

curl http://${ENDPOINT}/health
```

### Deployment Failed

1. Check GitHub Actions logs for error details
2. Check Beanstalk events for deployment errors
3. Check CloudWatch logs for application errors
4. Verify environment variables are set correctly
5. Ensure database migrations completed successfully

## Rollback Procedure

**Automatic Rollback:**
- Health check failures trigger automatic rollback

**Manual Rollback:**
```bash
# List recent versions
aws elasticbeanstalk describe-application-versions \
  --application-name prpm-registry-dev \
  --max-records 10

# Deploy previous version
aws elasticbeanstalk update-environment \
  --application-name prpm-registry-dev \
  --environment-name prpm-registry-dev-env \
  --version-label <previous-version-label>
```

## Best Practices

1. ✅ **Always deploy to dev first** - Test in dev before staging/prod
2. ✅ **Monitor deployments** - Watch GitHub Actions logs during deployment
3. ✅ **Test health endpoints** - Verify `/health` and `/api/v1/packages` after deployment
4. ✅ **Review events** - Check Beanstalk events for warnings
5. ✅ **Verify migrations** - Ensure database migrations completed successfully
6. ✅ **Check CloudWatch** - Monitor application logs for errors
7. ✅ **Test OAuth flow** - Verify GitHub login works after deployment
8. ✅ **Keep secrets updated** - Rotate `JWT_SECRET` periodically

## Cost Estimates

**Per Environment (monthly):**
- Beanstalk (t3.micro): ~$7.50
- RDS (db.t4g.micro): ~$15
- S3 + CloudFront: ~$5
- Application Load Balancer: Included with Beanstalk
- **Total: ~$32.50/month per environment**

**All Environments:**
- Dev: ~$32.50
- Staging: ~$32.50 (if used)
- Prod: ~$40 (scaled to 2 instances)
- **Total: ~$105/month (dev + prod)**

### 2. `deploy-webapp.yml` - Deploy Webapp
Pushes the webapp to s3 and invalidates the cloudfront cache.
