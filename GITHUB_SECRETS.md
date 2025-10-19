# GitHub Secrets Configuration

Complete list of secrets needed for automated deployment.

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

## Required Secrets

### AWS Credentials

#### `AWS_ACCESS_KEY_ID`
**What**: AWS IAM access key for deployment
**How to get**:
```bash
aws iam create-access-key --user-name prpm-deploy
```
**Example**: `AKIAIOSFODNN7EXAMPLE`

#### `AWS_SECRET_ACCESS_KEY`
**What**: AWS IAM secret access key
**How to get**: Same as above (returned together)
**Example**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

---

### Database

#### `DB_PASSWORD`
**What**: PostgreSQL database password
**How to generate**:
```bash
# Generate a secure random password
openssl rand -base64 32
```
**Example**: `aB3$xY9#mN2@qW7&kL5!pR8%vT1^jH4*`
**Notes**:
- Must be strong (uppercase, lowercase, numbers, symbols)
- 20-40 characters recommended
- Avoid quotes and backslashes

---

### GitHub OAuth (Optional - for user login)

#### `GITHUB_CLIENT_ID`
**What**: GitHub OAuth app client ID
**How to get**:
1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Name**: PRPM Registry
   - **Homepage**: https://registry.prpm.dev
   - **Callback**: https://registry.prpm.dev/api/v1/auth/callback
4. Copy the **Client ID**
**Example**: `Iv1.1234567890abcdef`

#### `GITHUB_CLIENT_SECRET`
**What**: GitHub OAuth app client secret
**How to get**:
1. Same OAuth app as above
2. Click **Generate a new client secret**
3. Copy immediately (only shown once!)
**Example**: `1234567890abcdef1234567890abcdef12345678`

---

### Pulumi

#### `PULUMI_ACCESS_TOKEN`
**What**: Pulumi backend access token
**How to get**:
1. Go to https://app.pulumi.com/signup (create account if needed)
2. Go to https://app.pulumi.com/account/tokens
3. Click **Create token**
4. Give it a name like "GitHub Actions"
5. Copy the token
**Example**: `pul-abc123def456ghi789jkl012mno345pqr678`

---

## Verification Checklist

Before deploying, verify all secrets are set:

- [ ] `AWS_ACCESS_KEY_ID` - AWS access key
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key
- [ ] `DB_PASSWORD` - Database password
- [ ] `GITHUB_CLIENT_ID` - OAuth client ID (optional)
- [ ] `GITHUB_CLIENT_SECRET` - OAuth client secret (optional)
- [ ] `PULUMI_ACCESS_TOKEN` - Pulumi token

## Testing Secrets

You can test if secrets are properly configured by running a workflow:

1. Go to **Actions** tab
2. Select **Deploy Infrastructure (Pulumi + Beanstalk)**
3. Click **Run workflow**
4. Select **Stack**: `dev`, **Action**: `preview`
5. Check the logs - if secrets are missing, it will fail with clear errors

## Security Best Practices

### AWS IAM User

Create a dedicated IAM user for deployments:

```bash
# Create user
aws iam create-user --user-name prpm-deploy

# Attach minimal required policies (or use AdministratorAccess for simplicity)
aws iam attach-user-policy \
  --user-name prpm-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create access key
aws iam create-access-key --user-name prpm-deploy
```

**Production recommendation**: Create a custom IAM policy with only required permissions:
- Elastic Beanstalk
- RDS
- S3
- CloudFront
- Route 53
- ACM
- VPC
- EC2
- IAM (limited)
- CloudWatch

### Rotate Secrets

Regularly rotate credentials:

1. **AWS Keys**: Rotate every 90 days
2. **Database Password**: Rotate every 6 months
3. **GitHub OAuth**: Regenerate if compromised
4. **Pulumi Token**: Rotate yearly

### GitHub Secret Scanning

GitHub automatically scans for leaked secrets. If you accidentally commit a secret:

1. Immediately revoke it in AWS/GitHub/Pulumi
2. Generate a new one
3. Update GitHub secret
4. Force push to remove from history (if recent)

## Environment-Specific Secrets (Optional)

If you want different secrets per environment:

### Using Environments

1. Go to **Settings** → **Environments**
2. Create environments: `production`, `staging`, `dev`
3. Add environment-specific secrets
4. Update workflow to use: `environment: ${{ github.event.inputs.stack }}`

Example differences:
- **Production**: Real database password, real OAuth app
- **Staging**: Different OAuth app, test database password
- **Dev**: Simplified configs, test credentials

## Troubleshooting

### "Secret not found" error

**Symptom**: Workflow fails with "secret not found"
**Solution**:
1. Verify secret name matches exactly (case-sensitive)
2. Check secret is in repository (not organization)
3. Ensure you're in the correct repository

### "Invalid AWS credentials" error

**Symptom**: AWS actions fail with authentication error
**Solution**:
1. Verify access key is still active in AWS IAM
2. Check secret values don't have extra spaces
3. Ensure IAM user has required permissions
4. Test credentials locally:
   ```bash
   export AWS_ACCESS_KEY_ID="your-key"
   export AWS_SECRET_ACCESS_KEY="your-secret"
   aws sts get-caller-identity
   ```

### "Pulumi login failed" error

**Symptom**: Pulumi commands fail
**Solution**:
1. Verify token from https://app.pulumi.com/account/tokens
2. Ensure token hasn't expired
3. Check Pulumi account is active

## Quick Setup Script

```bash
#!/bin/bash
# This script helps you gather all required secrets
# Run locally, then copy to GitHub Secrets UI

echo "=== PRPM Deployment Secrets Setup ==="
echo ""

# AWS
echo "1. AWS Credentials"
echo "   Run: aws iam create-access-key --user-name prpm-deploy"
read -p "   AWS_ACCESS_KEY_ID: " AWS_ACCESS_KEY_ID
read -p "   AWS_SECRET_ACCESS_KEY: " AWS_SECRET_ACCESS_KEY
echo ""

# Database
echo "2. Database Password"
echo "   Generating random password..."
DB_PASSWORD=$(openssl rand -base64 32)
echo "   DB_PASSWORD: $DB_PASSWORD"
echo ""

# GitHub OAuth
echo "3. GitHub OAuth (optional)"
echo "   Create at: https://github.com/settings/developers"
read -p "   GITHUB_CLIENT_ID: " GITHUB_CLIENT_ID
read -p "   GITHUB_CLIENT_SECRET: " GITHUB_CLIENT_SECRET
echo ""

# Pulumi
echo "4. Pulumi Token"
echo "   Get from: https://app.pulumi.com/account/tokens"
read -p "   PULUMI_ACCESS_TOKEN: " PULUMI_ACCESS_TOKEN
echo ""

# Summary
echo "=== Summary ==="
echo "Copy these to GitHub Secrets:"
echo ""
echo "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
echo "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID"
echo "GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET"
echo "PULUMI_ACCESS_TOKEN=$PULUMI_ACCESS_TOKEN"
echo ""
echo "⚠️  Keep this information secure!"
echo "⚠️  Don't commit this to git!"
```

Save as `setup-secrets.sh`, run it, then copy values to GitHub Secrets UI.

## Next Steps

After configuring secrets:

1. ✅ Verify all secrets are added to GitHub
2. ✅ Read [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
3. ✅ Run your first deployment via GitHub Actions
