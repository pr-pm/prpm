# GitHub Actions Troubleshooting Guide

## Recent Fixes Applied

### 1. ✅ NPM Cache Paths
**Fixed in commits:**
- `eb3fcba` - Removed npm cache from deploy-pulumi-beanstalk.yml
- `8adf6b0` - Fixed cache-dependency-path in ci.yml

**Issue:** Cache paths pointing to non-existent package-lock.json files
**Solution:** Use root package-lock.json or remove caching

### 2. ✅ Migration 002 - Index Creation
**Fixed in commit: `77373eb`**

**Issue:** `relation "idx_packages_trending" already exists`
**Solution:** Added `IF NOT EXISTS` to all CREATE INDEX statements

### 3. ✅ AWS Credentials
**Fixed in commit: `d14f633`**

**Issue:** `Credentials could not be loaded`
**Solution:** Changed from OIDC (role-to-assume) to access keys

**Updated workflows:**
- infra-deploy.yml
- infra-preview.yml
- registry-deploy.yml

### 4. ✅ Pulumi Configuration
**Fixed in commits:**
- `abcc908` - Removed aws:region default from Pulumi.yaml
- `c0ccff5` - Added auto-create stack logic

**Issue:** `Configuration key 'aws:region' is not namespaced`
**Solution:** Removed config section from Pulumi.yaml

**Issue:** `no stack named 'dev' found`
**Solution:** Added `pulumi stack select $STACK || pulumi stack init $STACK`

## Common Workflow Failures & Solutions

### CI Workflow (`ci.yml`)

**Potential Issues:**
1. **Missing dependencies** - Run `npm ci` at root first
2. **TypeScript errors** - Check for new type issues
3. **Migration failures** - Already fixed with IF NOT EXISTS
4. **Test failures** - Need to verify test data

**Quick Fix:**
```yaml
- name: Install dependencies
  run: npm ci
  working-directory: ./
```

### Package Tests (`package-tests.yml`)

**Potential Issues:**
1. **Working directory mismatch**
2. **Missing build artifacts**
3. **Test environment setup**

**Check:**
- Are all packages building successfully?
- Are test databases accessible?
- Are environment variables set?

### E2E Tests (`e2e-tests.yml`)

**Potential Issues:**
1. **Webapp not building**
2. **Docker compose issues**
3. **Playwright configuration**

**Verify:**
- packages/webapp/package.json exists
- Docker services start correctly
- Test data is seeded

### Deployment Workflows

**All deployment workflows now use:**
```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1
```

**All Pulumi workflows now use:**
```bash
STACK="${{ inputs.stack || 'dev' }}"
pulumi stack select $STACK || pulumi stack init $STACK
pulumi config set aws:region us-east-1
```

## Required GitHub Secrets

Verify all secrets are set:
- ✅ `AWS_ACCESS_KEY_ID`
- ✅ `AWS_SECRET_ACCESS_KEY`
- ✅ `PULUMI_ACCESS_TOKEN`
- ⚠️ `PULUMI_CONFIG_PASSPHRASE` (may need to be set)
- ⚠️ `DB_PASSWORD`
- ⚠️ `GITHUB_CLIENT_ID` (optional)
- ⚠️ `GITHUB_CLIENT_SECRET` (optional)

## Debugging Steps

### 1. Check Workflow Logs
Go to Actions tab and identify which step is failing:
- Setup Node.js ➜ Cache issue
- Install dependencies ➜ package.json or npm issue
- Type check ➜ TypeScript errors
- Build ➜ Compilation errors
- Run tests ➜ Test failures
- Deploy ➜ AWS/Pulumi errors

### 2. Local Reproduction
```bash
# Test builds
npm ci
npm run build

# Test registry specifically
cd packages/registry
npm run build
npm test

# Test CLI
cd packages/cli
npm run build

# Test migrations
cd packages/registry
npm run migrate
```

### 3. Common Fixes

**If npm ci fails:**
```bash
# Regenerate lock file
rm package-lock.json
npm install
```

**If TypeScript fails:**
```bash
# Clean and rebuild
npm run clean
npm run build
```

**If tests fail:**
```bash
# Check Docker is running
docker ps

# Restart services
cd packages/registry
docker compose down
docker compose up -d
```

## Next Steps

To fix remaining issues, I need:

1. **Specific error messages** from failing workflows
2. **Which workflows** are failing (names)
3. **Which step** in each workflow is failing

Then I can provide targeted fixes.

## Status

| Workflow | Status | Notes |
|----------|--------|-------|
| CI | ⚠️ Unknown | Need error logs |
| Package Tests | ⚠️ Unknown | Need error logs |
| E2E Tests | ⚠️ Unknown | Need error logs |
| Deploy Pulumi Beanstalk | 🔧 Fixed | Recent fixes applied |
| Infra Deploy | 🔧 Fixed | Recent fixes applied |
| Infra Preview | 🔧 Fixed | Recent fixes applied |
| Registry Deploy | 🔧 Fixed | Recent fixes applied |

**Please provide the specific error messages from the failing workflows so I can create targeted fixes.**
