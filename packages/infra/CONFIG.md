# Pulumi Configuration Guide

## Understanding Configuration Sources

PRPM infrastructure uses configuration from two sources depending on the deployment context:

### 1. GitHub Secrets (CI/CD Deployments)
When deploying via GitHub Actions, secrets are stored in GitHub and automatically injected into Pulumi config:

**Required GitHub Secrets:**
- `DB_PASSWORD` - PostgreSQL database password
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `PULUMI_ACCESS_TOKEN` - Pulumi Cloud access token
- `PULUMI_CONFIG_PASSPHRASE` - Encryption key for Pulumi state
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials

**Flow:**
```
GitHub Secrets → GitHub Actions → Pulumi Config → AWS Resources
```

See `.github/workflows/infra-deploy.yml` lines 83-87 for how these are set.

### 2. Pulumi Config (Local/Manual Deployments)
When deploying locally, configuration is stored in Pulumi's encrypted state:

**Local Setup:**
```bash
# Quick setup with auto-generated password
./setup-local-config.sh

# Or manual setup
pulumi stack select prod
pulumi config set aws:region us-west-2
pulumi config set db:username prpm
pulumi config set --secret db:password "your-secure-password"
pulumi config set --secret github:clientId "your-client-id"
pulumi config set --secret github:clientSecret "your-client-secret"
```

**Flow:**
```
Pulumi Config (local) → AWS Resources
```

## Why Two Sources?

This dual-source approach follows best practices:

1. **Separation of Concerns**: CI/CD secrets managed in GitHub, local development in Pulumi
2. **Security**: Secrets never committed to git, encrypted in both locations
3. **Flexibility**: Different credentials for different environments without conflicts
4. **Team Collaboration**: Team members can use own local credentials without affecting CI/CD

## Configuration Reference

### Required Configuration

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `aws:region` | string | AWS deployment region | `us-west-2` |
| `db:username` | string | Database admin username | `prpm` |
| `db:password` | secret | Database admin password | (auto-generated) |
| `github:clientId` | secret | GitHub OAuth client ID | `Iv1.abc123...` |
| `github:clientSecret` | secret | GitHub OAuth secret | `ghp_abc123...` |

### Optional Configuration

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `app:image` | string | Docker image to deploy | `prpm-registry:latest` |
| `app:instanceType` | string | EC2/Beanstalk instance type | `t3.micro` |
| `app:minSize` | number | Min instances (autoscaling) | `1` |
| `app:maxSize` | number | Max instances (autoscaling) | `2` |
| `app:domainName` | string | Custom domain (prod only) | `registry.prpm.dev` |
| `db:instanceClass` | string | RDS instance class | `db.t4g.micro` |
| `db:allocatedStorage` | number | Database storage (GB) | `20` |

## Managing Configuration

### View Current Configuration
```bash
pulumi config
```

### View Secret Values (requires passphrase)
```bash
pulumi config get db:password --show-secrets
```

### Update Configuration
```bash
pulumi config set <key> <value>
pulumi config set --secret <key> <secret-value>
```

### Switch Stacks
```bash
pulumi stack ls              # List stacks
pulumi stack select prod     # Switch to prod
pulumi stack select staging  # Switch to staging
```

## Security Notes

1. **Never commit secrets** - All sensitive values use `--secret` flag
2. **Different passwords per environment** - Each stack should have unique credentials
3. **Rotate credentials regularly** - Update secrets periodically
4. **Use strong passwords** - Auto-generated 32-character base64 strings recommended
5. **Limit access** - Only authorized team members should have Pulumi/AWS access

## Troubleshooting

### Error: "Missing required configuration variable"
```bash
# Check what's missing
pulumi config

# Set missing value
pulumi config set --secret <key> <value>

# Or run setup script
./setup-local-config.sh
```

### Error: "no stack selected"
```bash
pulumi stack select prod
```

### Error: "unable to decrypt secret"
```bash
# Make sure PULUMI_CONFIG_PASSPHRASE is set
export PULUMI_CONFIG_PASSPHRASE="your-passphrase"
```

## Environment Variables

For automation/scripting, you can set config via environment variables:

```bash
export DB_PASSWORD="your-password"
export GITHUB_CLIENT_ID="your-client-id"
export GITHUB_CLIENT_SECRET="your-client-secret"
export AWS_REGION="us-west-2"

./setup-local-config.sh  # Will use env vars
```
