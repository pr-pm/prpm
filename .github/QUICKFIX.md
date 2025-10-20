# Quick Fix: GitHub Actions Failing

## The Problem

GitHub Actions workflow `infra-deploy.yml` is failing with:
```
error: Missing required configuration variable 'prpm-infra:db:password'
```

## The Solution

The workflow code is **correct** - it reads from GitHub Secrets and sets Pulumi config. The issue is the **GitHub Secret is missing**.

### Add the Missing Secret (2 minutes)

1. **Generate a secure password:**
   ```bash
   openssl rand -base64 32
   ```

   Example output: `kJ9mP2xL5nQ8wR3vT7yU4iO6aS1dF0gH2jK5lN8mB4xC9z`

2. **Add to GitHub:**
   - Go to https://github.com/khaliqgant/prompt-package-manager/settings/secrets/actions
   - Click **"New repository secret"**
   - Name: `DB_PASSWORD`
   - Value: (paste the generated password)
   - Click **"Add secret"**

3. **Re-run the workflow:**
   - Go to https://github.com/khaliqgant/prompt-package-manager/actions
   - Find the failed workflow run
   - Click **"Re-run all jobs"**

**That's it!** The workflow will now:
1. Read `secrets.DB_PASSWORD` ✅
2. Set it in Pulumi config ✅
3. Deploy successfully ✅

## What the Code Does

From `.github/workflows/infra-deploy.yml` line 83:
```yaml
pulumi config set --secret db:password "${{ secrets.DB_PASSWORD }}"
```

This is **already correct** - it reads from GitHub Secrets and writes to Pulumi config.

## Why Both Places?

- **GitHub Secrets** → Source of truth for CI/CD
- **Pulumi Config** → Where Pulumi reads from during deployment

The workflow acts as the bridge:
```
GitHub Secret (DB_PASSWORD)
    ↓
GitHub Actions reads it
    ↓
Writes to Pulumi Config
    ↓
Pulumi uses it to create RDS
```

## Other Required Secrets

While you're there, verify these secrets are also set:

- ✅ `DB_PASSWORD` ← **FIX THIS NOW**
- ❓ `PULUMI_ACCESS_TOKEN`
- ❓ `PULUMI_CONFIG_PASSPHRASE`
- ❓ `AWS_ACCESS_KEY_ID`
- ❓ `AWS_SECRET_ACCESS_KEY`
- ❓ `GITHUB_CLIENT_ID`
- ❓ `GITHUB_CLIENT_SECRET`

See `.github/SECRETS.md` for full setup guide.

## TL;DR

```bash
# 1. Generate password
openssl rand -base64 32

# 2. Add to GitHub Secrets as DB_PASSWORD
# https://github.com/khaliqgant/prompt-package-manager/settings/secrets/actions

# 3. Re-run workflow
# https://github.com/khaliqgant/prompt-package-manager/actions

# Done! ✅
```
