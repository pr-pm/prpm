# Deployment Setup Guide

Complete automated deployment via GitHub Actions for prmp.dev infrastructure.

## Prerequisites

1. **AWS Account** with programmatic access
2. **Pulumi Account** (free tier works)
3. **GitHub Repository** with Actions enabled
4. **Domain**: prmp.dev with Route 53 hosted zone

## Required GitHub Secrets

Configure these secrets in GitHub repository settings:

```bash
# Go to: Settings → Secrets and variables → Actions → New repository secret
```

### AWS Credentials
- `AWS_ACCESS_KEY_ID` - IAM user access key
- `AWS_SECRET_ACCESS_KEY` - IAM user secret key

### Database
- `DB_PASSWORD` - PostgreSQL password (strong, random)

### GitHub OAuth (for user authentication)
- `GITHUB_CLIENT_ID` - OAuth app client ID
- `GITHUB_CLIENT_SECRET` - OAuth app client secret

### Pulumi
- `PULUMI_ACCESS_TOKEN` - From pulumi.com/account/tokens

## AWS Setup

### 1. Create IAM User for Deployments

```bash
# Create IAM user
aws iam create-user --user-name prpm-deploy

# Attach policies
aws iam attach-user-policy \
  --user-name prpm-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access key
aws iam create-access-key --user-name prpm-deploy
```

Save the `AccessKeyId` and `SecretAccessKey` as GitHub secrets.

### 2. Configure Route 53 Hosted Zone

If you don't have a hosted zone yet:

```bash
# Create hosted zone for prmp.dev
aws route53 create-hosted-zone \
  --name prmp.dev \
  --caller-reference $(date +%s)

# Get nameservers
aws route53 get-hosted-zone --id <HOSTED_ZONE_ID>
```

Update your domain registrar to use the AWS nameservers.

## Pulumi Setup

### 1. Create Pulumi Account

1. Go to https://app.pulumi.com/signup
2. Sign up (free tier)
3. Create an organization (e.g., "prpm")

### 2. Create Access Token

1. Go to https://app.pulumi.com/account/tokens
2. Click "Create token"
3. Copy token
4. Add to GitHub secrets as `PULUMI_ACCESS_TOKEN`

## GitHub OAuth Setup (Optional)

For user authentication via GitHub:

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: PRPM Registry
   - **Homepage URL**: https://registry.prmp.dev
   - **Callback URL**: https://registry.prmp.dev/api/v1/auth/callback
4. Click "Register application"
5. Copy **Client ID** → GitHub secret `GITHUB_CLIENT_ID`
6. Click "Generate a new client secret"
7. Copy **Client Secret** → GitHub secret `GITHUB_CLIENT_SECRET`

## Deployment

### Automated Deployment (Recommended)

All infrastructure is deployed via GitHub Actions - **no manual Pulumi commands needed!**

#### Option 1: Deploy via GitHub UI

1. Go to **Actions** tab in GitHub
2. Select **Deploy Infrastructure (Pulumi + Beanstalk)**
3. Click **Run workflow**
4. Select:
   - **Stack**: `prod` (or `staging`, `dev`)
   - **Action**: `preview` (to see changes) or `up` (to deploy)
5. Click **Run workflow**

#### Option 2: Deploy via Git Push

Push to `main` branch with changes in `packages/infra/`:

```bash
git add packages/infra/
git commit -m "Update infrastructure"
git push origin main
```

This will automatically run `pulumi preview`.

### Deployment Environments

#### Production
- **Domain**: https://registry.prmp.dev
- **Stack**: `prod`
- **ACM Certificate**: Auto-created for registry.prmp.dev
- **Route 53**: CNAME record auto-created
- **Database**: RDS PostgreSQL db.t4g.micro
- **Compute**: Elastic Beanstalk t3.micro
- **Cost**: ~$32.50/month

#### Staging
- **Domain**: https://staging.prmp.dev
- **Stack**: `staging`
- **Same setup as prod** but separate resources

#### Development
- **Domain**: Auto-generated Beanstalk URL
- **Stack**: `dev`
- **No custom domain** (saves ACM costs)

## What the GitHub Action Does

When you run the workflow, it automatically:

1. ✅ Checks out code
2. ✅ Installs dependencies
3. ✅ Configures AWS credentials
4. ✅ Switches to Beanstalk infrastructure config
5. ✅ Selects/creates Pulumi stack
6. ✅ Configures stack with all secrets
7. ✅ Sets domain (prod: registry.prmp.dev, staging: staging.prmp.dev)
8. ✅ Runs Pulumi (preview/up/destroy)
9. ✅ Creates ACM certificate
10. ✅ Validates certificate via DNS
11. ✅ Creates Route 53 CNAME record
12. ✅ Deploys Beanstalk environment
13. ✅ Verifies deployment health
14. ✅ Tests API endpoints
15. ✅ Exports outputs as artifacts

## Verify Deployment

After deployment completes, the GitHub Action will:

1. Test health endpoint: `https://registry.prmp.dev/health`
2. Test packages endpoint: `https://registry.prmp.dev/api/v1/packages`

You can also manually verify:

```bash
# Health check
curl https://registry.prmp.dev/health

# API test
curl https://registry.prmp.dev/api/v1/packages?limit=5 | jq
```

## Monitoring

### View Infrastructure

```bash
# Option 1: Pulumi Console
# Visit: https://app.pulumi.com/<your-org>/prpm/prod

# Option 2: AWS Console
# - Elastic Beanstalk: https://console.aws.amazon.com/elasticbeanstalk
# - RDS: https://console.aws.amazon.com/rds
# - Route 53: https://console.aws.amazon.com/route53
# - ACM: https://console.aws.amazon.com/acm
```

### View Logs

Logs are automatically streamed to CloudWatch:

```bash
# Via AWS Console
# CloudWatch Logs → /aws/elasticbeanstalk/prmp-prod-env

# Via GitHub Actions
# The workflow outputs all deployment logs
```

## Update Infrastructure

To update infrastructure config:

1. Edit `packages/infra/index-beanstalk.ts` or modules
2. Commit and push:
   ```bash
   git add packages/infra/
   git commit -m "Update infrastructure configuration"
   git push origin main
   ```
3. Go to Actions → Run workflow → Select `preview` to see changes
4. If changes look good, run again with `up` to apply

## Destroy Infrastructure

To tear down infrastructure:

1. Go to **Actions** → **Deploy Infrastructure**
2. Click **Run workflow**
3. Select:
   - **Stack**: `prod` (or whichever to destroy)
   - **Action**: `destroy`
4. Click **Run workflow**
5. Confirm in action logs

**Warning**: This will delete all resources including the database!

## Troubleshooting

### ACM Certificate Validation Stuck

If certificate validation hangs:

1. Check Route 53 hosted zone has the validation CNAME record
2. Wait up to 30 minutes for DNS propagation
3. Verify nameservers are correct at your domain registrar

### Beanstalk Deployment Failed

Check the GitHub Action logs:

1. Go to **Actions** tab
2. Click the failed workflow run
3. Expand the failed step
4. Look for error messages

Common issues:
- **IAM permissions**: Ensure IAM user has AdministratorAccess
- **Secrets missing**: Double-check all GitHub secrets are set
- **Domain**: Ensure Route 53 hosted zone exists for prmp.dev

### Database Connection Failed

1. Check security group allows Beanstalk → RDS traffic
2. Verify `DB_PASSWORD` secret is set
3. Check RDS instance is in `available` state

## Cost Breakdown

### Production Stack (~$32.50/month)

- **Compute**: $7.50/month (t3.micro)
- **Database**: $15/month (db.t4g.micro)
- **Storage**: $5-10/month (S3 + CloudFront)
- **Data Transfer**: $5/month
- **Route 53**: $0.50/month (hosted zone)
- **ACM Certificate**: FREE

### Savings vs ECS

- **ECS Setup**: ~$126/month
- **Beanstalk Setup**: ~$32.50/month
- **Savings**: $93.50/month (74%)

## Next Steps

After deployment:

1. **Seed Database**:
   ```bash
   # SSH into Beanstalk instance
   eb ssh prmp-prod-env
   cd /var/app/current
   npm run migrate
   npm run seed
   ```

2. **Configure DNS** (if not using Route 53):
   - Point your domain CNAME to the Beanstalk endpoint
   - GitHub Action outputs will show the endpoint

3. **Enable HTTPS**:
   - Already done! ACM certificate is auto-created
   - Beanstalk ALB handles SSL termination

4. **Monitor**:
   - CloudWatch dashboards
   - Beanstalk health dashboard
   - Pulumi console

## Support

- **Pulumi Docs**: https://www.pulumi.com/docs/
- **Beanstalk Docs**: https://docs.aws.amazon.com/elasticbeanstalk/
- **GitHub Actions**: https://docs.github.com/actions
