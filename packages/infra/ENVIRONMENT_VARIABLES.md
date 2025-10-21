# Environment Variables Configuration

This document tracks all environment variables required by the PRPM Registry application and how they are configured in the Beanstalk deployment.

## Configuration Flow

```
GitHub Secrets
      ↓
Pulumi Config (encrypted)
      ↓
Pulumi Index.ts
      ↓
Beanstalk Module
      ↓
Beanstalk Environment Settings
      ↓
Application Runtime
```

## Environment Variables

### 1. Node.js Environment

| Variable | Value | Source | File |
|----------|-------|--------|------|
| `NODE_ENV` | `production` / `staging` / `dev` | Pulumi (based on stack) | `modules/beanstalk.ts:295` |
| `PORT` | `3000` | Pulumi (hardcoded) | `modules/beanstalk.ts:299` |

**Configuration:**
```typescript
// packages/infra/modules/beanstalk.ts
{
  namespace: "aws:elasticbeanstalk:application:environment",
  name: "NODE_ENV",
  value: environment === "prod" ? "production" : environment,
}
```

### 2. Database Connection

| Variable | Value | Source | File |
|----------|-------|--------|------|
| `DATABASE_URL` | `postgresql://username:password@endpoint/prpm_registry` | Pulumi (computed from RDS outputs) | `modules/beanstalk.ts:306` |

**Configuration:**
```typescript
// packages/infra/modules/beanstalk.ts
{
  namespace: "aws:elasticbeanstalk:application:environment",
  name: "DATABASE_URL",
  value: pulumi.all([config.dbEndpoint, config.dbPassword]).apply(
    ([endpoint, password]) =>
      `postgresql://${config.dbUsername}:${password}@${endpoint}/prpm_registry`
  ),
}
```

**Source Chain:**
1. GitHub Secret: `DB_PASSWORD`
2. Pulumi Config: `pulumi config set --secret db:password "${{ secrets.DB_PASSWORD }}"`
3. Pulumi Index: `config.requireSecret("db:password")`
4. Beanstalk Module: Constructs full `DATABASE_URL`

### 3. Redis Connection (Optional)

| Variable | Value | Source | File |
|----------|-------|--------|------|
| `REDIS_URL` | `redis://endpoint:6379` | Pulumi (if Redis enabled) | `modules/beanstalk.ts:318` |

**Configuration:**
```typescript
// packages/infra/modules/beanstalk.ts
...(config.redisEndpoint
  ? [{
      namespace: "aws:elasticbeanstalk:application:environment",
      name: "REDIS_URL",
      value: config.redisEndpoint.apply(
        (endpoint) => `redis://${endpoint}:6379`
      ),
    }]
  : [])
```

**Note:** Currently disabled to save costs (~$12/month). Using in-memory caching instead.

### 4. GitHub OAuth

| Variable | Value | Source | File |
|----------|-------|--------|------|
| `GITHUB_CLIENT_ID` | OAuth App Client ID | GitHub Secret → Pulumi | `modules/beanstalk.ts:329` |
| `GITHUB_CLIENT_SECRET` | OAuth App Client Secret | GitHub Secret → Pulumi | `modules/beanstalk.ts:335` |
| `GITHUB_CALLBACK_URL` | `https://domain/api/v1/auth/callback` or localhost | Pulumi (computed from domain) | `modules/beanstalk.ts:339` |

**Configuration:**
```typescript
// packages/infra/modules/beanstalk.ts
{
  namespace: "aws:elasticbeanstalk:application:environment",
  name: "GITHUB_CLIENT_ID",
  value: config.githubClientId,
},
{
  namespace: "aws:elasticbeanstalk:application:environment",
  name: "GITHUB_CLIENT_SECRET",
  value: config.githubClientSecret,
},
{
  namespace: "aws:elasticbeanstalk:application:environment",
  name: "GITHUB_CALLBACK_URL",
  value: config.domainName
    ? `https://${config.domainName}/api/v1/auth/callback`
    : "http://localhost:3000/api/v1/auth/callback",
}
```

**Source Chain:**
1. GitHub Secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
2. Pulumi Config: `pulumi config set --secret github:clientId "${{ secrets.GITHUB_CLIENT_ID }}"`
3. Pulumi Index: `config.requireSecret("github:clientId")`
4. Beanstalk Module: Passes through to environment

### 5. AWS S3 Storage

| Variable | Value | Source | File |
|----------|-------|--------|------|
| `AWS_S3_BUCKET` | S3 bucket name | Pulumi (from S3 module output) | `modules/beanstalk.ts:348` |
| `AWS_REGION` | `us-west-2` | Pulumi (from AWS config) | `modules/beanstalk.ts:354` |

**Configuration:**
```typescript
// packages/infra/modules/beanstalk.ts
{
  namespace: "aws:elasticbeanstalk:application:environment",
  name: "AWS_S3_BUCKET",
  value: config.s3BucketName,
},
{
  namespace: "aws:elasticbeanstalk:application:environment",
  name: "AWS_REGION",
  value: aws.config.region || "us-west-2",
}
```

**IAM Permissions:**
EC2 instances have IAM role with S3 access policy (lines 95-116 in `modules/beanstalk.ts`).

### 6. JWT Authentication

| Variable | Value | Source | File |
|----------|-------|--------|------|
| `JWT_SECRET` | Random secret for JWT signing | GitHub Secret → Pulumi | `modules/beanstalk.ts:361` |

**Configuration:**
```typescript
// packages/infra/modules/beanstalk.ts
{
  namespace: "aws:elasticbeanstalk:application:environment",
  name: "JWT_SECRET",
  value: config.jwtSecret,
}
```

**Source Chain:**
1. GitHub Secret: `JWT_SECRET`
2. Pulumi Config: `pulumi config set --secret jwt:secret "${{ secrets.JWT_SECRET }}"`
3. Pulumi Index: `config.requireSecret("jwt:secret")`
4. Beanstalk Module: Passes through to environment

**✅ FIXED:** Previously was hardcoded placeholder. Now properly configured from secrets.

## Required GitHub Secrets

The following secrets MUST be configured in GitHub repository settings:

### Infrastructure Secrets (`.github/workflows/deploy-pulumi-beanstalk.yml`)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `PULUMI_ACCESS_TOKEN` | Pulumi Cloud access token | `pul-xxx...` |
| `AWS_ACCESS_KEY_ID` | AWS IAM user access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `DB_PASSWORD` | PostgreSQL database password | `SecureRandomPassword123!` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | `Iv1.abc123def456` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | `abc123def456...` |
| `JWT_SECRET` | Secret for JWT token signing | `random-secure-string-min-32-chars` |

### Setting Secrets

**Via GitHub UI:**
1. Go to repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret above

**Via GitHub CLI:**
```bash
gh secret set PULUMI_ACCESS_TOKEN
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set DB_PASSWORD
gh secret set GITHUB_CLIENT_ID
gh secret set GITHUB_CLIENT_SECRET
gh secret set JWT_SECRET
```

## Pulumi Configuration Commands

**Setting configuration in Pulumi:**

```bash
# Switch to desired stack
pulumi stack select dev

# Set AWS region
pulumi config set aws:region us-west-2

# Set database credentials
pulumi config set db:username prpm
pulumi config set --secret db:password "your-secure-password"

# Set GitHub OAuth (secrets)
pulumi config set --secret github:clientId "Iv1.abc123def456"
pulumi config set --secret github:clientSecret "abc123def456..."

# Set JWT secret
pulumi config set --secret jwt:secret "random-secure-string-min-32-chars"

# Set Beanstalk configuration
pulumi config set app:instanceType t3.micro
pulumi config set app:minSize 1
pulumi config set app:maxSize 2

# Set domain (optional)
pulumi config set app:domainName registry.prpm.dev
```

**Viewing configuration:**

```bash
# List all configuration
pulumi config

# View specific config (encrypted values hidden)
pulumi config get db:password

# View with secrets visible
pulumi config get db:password --show-secrets
```

## Environment Variable Validation

**At Deployment Time:**

The application should validate all required environment variables on startup:

```typescript
// Example validation in packages/registry/src/config.ts
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_CALLBACK_URL',
  'AWS_S3_BUCKET',
  'AWS_REGION',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

## Debugging Environment Variables

**Via AWS Console:**
1. Beanstalk → Environments → Configuration → Software
2. View all environment properties

**Via AWS CLI:**
```bash
aws elasticbeanstalk describe-configuration-settings \
  --application-name prpm-registry-dev \
  --environment-name prpm-registry-dev-env \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`]'
```

**Via SSH to instance:**
```bash
# Get instance ID
aws ec2 describe-instances \
  --filters "Name=tag:elasticbeanstalk:environment-name,Values=prpm-registry-dev-env" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text

# SSH to instance (if configured)
eb ssh prpm-registry-dev-env

# Check environment variables
sudo su - webapp
env | grep -E 'NODE_ENV|DATABASE_URL|GITHUB_|AWS_|JWT_'
```

## Security Best Practices

1. ✅ **Never commit secrets to Git**
2. ✅ **Use GitHub Secrets for sensitive values**
3. ✅ **Use Pulumi's `--secret` flag for sensitive config**
4. ✅ **Rotate `JWT_SECRET` periodically (every 90 days)**
5. ✅ **Rotate `DB_PASSWORD` periodically (every 90 days)**
6. ✅ **Use different secrets for dev/staging/prod stacks**
7. ✅ **Audit who has access to GitHub Secrets**
8. ✅ **Enable AWS CloudTrail for secret access auditing**
9. ✅ **Consider using AWS Secrets Manager for production** (currently using Pulumi secrets for cost optimization)

## Migration from Manual to GitHub Actions

**Previous State:**
- Manual deployment scripts
- `JWT_SECRET` was placeholder: `"change-this-in-production-via-eb-setenv"`

**Current State:**
- ✅ All deployments via GitHub Actions
- ✅ All secrets configured via Pulumi from GitHub Secrets
- ✅ `JWT_SECRET` properly configured from GitHub Secret
- ✅ Environment variables validated before deployment

**Verification:**

After infrastructure deployment, verify all variables are set:

```bash
# Get Beanstalk environment name from Pulumi
ENVIRONMENT_NAME=$(pulumi stack output beanstalkEnvironmentName)

# Check all environment variables
aws elasticbeanstalk describe-configuration-settings \
  --application-name prpm-registry-dev \
  --environment-name $ENVIRONMENT_NAME \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`].[OptionName,Value]' \
  --output table
```

Expected output should show:
- `NODE_ENV`: dev/staging/production
- `PORT`: 3000
- `DATABASE_URL`: postgresql://...
- `GITHUB_CLIENT_ID`: Iv1...
- `GITHUB_CLIENT_SECRET`: *** (hidden)
- `GITHUB_CALLBACK_URL`: https://...
- `AWS_S3_BUCKET`: prpm-packages-...
- `AWS_REGION`: us-west-2
- `JWT_SECRET`: *** (hidden)
