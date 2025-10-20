# GitHub Secrets Configuration

## Required Secrets

The following secrets must be configured in GitHub repository settings for CI/CD to work:

### Infrastructure Deployment

Navigate to: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | How to Generate | Required For |
|-------------|-------------|-----------------|--------------|
| `DB_PASSWORD` | PostgreSQL database password | `openssl rand -base64 32` | Pulumi infrastructure |
| `PULUMI_ACCESS_TOKEN` | Pulumi Cloud access token | https://app.pulumi.com/account/tokens | Pulumi deployments |
| `PULUMI_CONFIG_PASSPHRASE` | Encryption key for Pulumi state | `openssl rand -base64 32` | Pulumi deployments |
| `AWS_ACCESS_KEY_ID` | AWS access key | AWS IAM console | Infrastructure deployment |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | AWS IAM console | Infrastructure deployment |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | https://github.com/settings/developers | GitHub OAuth login |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret | https://github.com/settings/developers | GitHub OAuth login |

### Publishing (Optional)

| Secret Name | Description | How to Generate | Required For |
|-------------|-------------|-----------------|--------------|
| `NPM_TOKEN` | NPM publish token | https://www.npmjs.com/settings/tokens | npm publishing |
| `HOMEBREW_TAP_TOKEN` | GitHub PAT for Homebrew tap | https://github.com/settings/tokens | Homebrew publishing |

## Setting Up Secrets

### 1. Generate Database Password

```bash
# Generate a secure random password
openssl rand -base64 32

# Example output:
# kJ9mP2xL5nQ8wR3vT7yU4iO6aS1dF0gH2jK5lN8mB4xC9z
```

Copy this value and add it as `DB_PASSWORD` in GitHub Secrets.

### 2. Get Pulumi Access Token

1. Go to https://app.pulumi.com/account/tokens
2. Click "Create token"
3. Give it a name like "PRPM GitHub Actions"
4. Copy the token and add it as `PULUMI_ACCESS_TOKEN`

### 3. Generate Pulumi Config Passphrase

```bash
# Generate encryption passphrase
openssl rand -base64 32
```

Add this as `PULUMI_CONFIG_PASSPHRASE`.

**Important:** Save this passphrase securely! You'll need it for local Pulumi operations:
```bash
export PULUMI_CONFIG_PASSPHRASE="your-passphrase-here"
```

### 4. AWS Credentials

1. Go to AWS IAM Console
2. Create a new IAM user for GitHub Actions
3. Attach policies:
   - `AmazonEC2FullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonVPCFullAccess`
   - `ElasticLoadBalancingFullAccess`
   - `IAMFullAccess` (or limited IAM permissions)
4. Create access key
5. Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to GitHub Secrets

### 5. GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in details:
   - Application name: `PRPM Registry`
   - Homepage URL: `https://registry.prpm.dev` (or your domain)
   - Authorization callback URL: `https://registry.prpm.dev/api/v1/auth/callback`
4. Click "Register application"
5. Copy the Client ID → add as `GITHUB_CLIENT_ID`
6. Click "Generate a new client secret"
7. Copy the secret → add as `GITHUB_CLIENT_SECRET`

## Quick Setup Script

Run this locally to generate values:

```bash
#!/bin/bash
echo "=== GitHub Secrets to Add ==="
echo ""
echo "DB_PASSWORD:"
openssl rand -base64 32
echo ""
echo "PULUMI_CONFIG_PASSPHRASE:"
openssl rand -base64 32
echo ""
echo "Then manually set:"
echo "- PULUMI_ACCESS_TOKEN (from https://app.pulumi.com/account/tokens)"
echo "- AWS_ACCESS_KEY_ID (from AWS IAM)"
echo "- AWS_SECRET_ACCESS_KEY (from AWS IAM)"
echo "- GITHUB_CLIENT_ID (from GitHub OAuth app)"
echo "- GITHUB_CLIENT_SECRET (from GitHub OAuth app)"
```

## Verification

After adding secrets, verify they're set:

1. Go to **Settings → Secrets and variables → Actions**
2. You should see all required secrets listed (values are hidden)
3. Re-run the failed GitHub Action workflow

## Current Issue

The workflow is currently failing with:
```
error: Missing required configuration variable 'prpm-infra:db:password'
please set a value using the command `pulumi config set --secret prpm-infra:db:password <value>`
```

**Root Cause:** The `DB_PASSWORD` GitHub Secret is not set in the repository.

**Solution:** Add the `DB_PASSWORD` secret as described above. The workflow will then:
1. Read `secrets.DB_PASSWORD` from GitHub
2. Run `pulumi config set --secret db:password "$DB_PASSWORD"`
3. Pulumi deployment will succeed

## Security Best Practices

1. **Never commit secrets** to git
2. **Rotate secrets regularly** (every 90 days recommended)
3. **Use different secrets** for different environments (dev/staging/prod)
4. **Limit AWS IAM permissions** to only what's needed
5. **Enable 2FA** on all accounts (GitHub, AWS, Pulumi)
6. **Review secret access logs** periodically
7. **Delete unused secrets** immediately

## Local Development

For local Pulumi deployments, you don't need GitHub Secrets. Instead:

```bash
cd packages/infra
./setup-local-config.sh

# Or manually:
export PULUMI_CONFIG_PASSPHRASE="your-passphrase"
pulumi stack select prod
pulumi config set --secret db:password "$(openssl rand -base64 32)"
```

See `CONFIG.md` for details on local Pulumi configuration.

## Troubleshooting

### Workflow fails with "Missing required configuration variable"

**Cause:** GitHub Secret not set

**Solution:** Add the missing secret in repository settings

### Workflow fails with "unable to decrypt secret"

**Cause:** Wrong `PULUMI_CONFIG_PASSPHRASE`

**Solution:** Ensure passphrase matches what was used to encrypt the stack

### Workflow fails with "Access Denied" from AWS

**Cause:** IAM permissions insufficient

**Solution:** Review and update IAM policy for the GitHub Actions user

### Workflow fails with "GitHub OAuth error"

**Cause:** Invalid client ID/secret or callback URL mismatch

**Solution:** Verify OAuth app settings match deployment URL
