# GitHub Actions Testing & Validation

## When Working with GitHub Actions Workflows

**ALWAYS validate before pushing:**

1. **Lint workflows**:
   ```bash
   actionlint .github/workflows/*.yml
   ```

2. **Validate paths exist**:
   - Check all `working-directory` paths exist
   - Verify `cache-dependency-path` points to existing files
   - Confirm service container paths are correct

3. **Dry run with act**:
   ```bash
   act pull_request -W .github/workflows/[workflow].yml -n
   ```

## Critical Rules for Workflow Configuration

### Cache Configuration (REQUIRED)

```yaml
# ❌ WRONG - Relies on default path
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

# ✅ CORRECT - Explicit path
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: package-lock.json
```

**Rule**: ALWAYS specify `cache-dependency-path` explicitly. GitHub Actions cache resolution will fail silently in local testing but error in CI.

### Monorepo Build Order (REQUIRED)

```yaml
# ❌ WRONG - Type check without building dependencies
- name: Install dependencies
  run: npm ci

- name: Type check
  run: npx tsc --noEmit

# ✅ CORRECT - Build workspace dependencies first
- name: Install dependencies
  run: npm ci

- name: Build @prpm/types
  run: npm run build --workspace=@prpm/types

- name: Build @prpm/registry-client
  run: npm run build --workspace=@prpm/registry-client

- name: Type check
  run: npx tsc --noEmit
```

**Rule**: In monorepos, ALWAYS build workspace dependencies before type checking or running tests that import them.

### Working Directory for npm ci (REQUIRED)

```yaml
# ❌ WRONG - npm ci in workspace directory
- name: Install dependencies
  working-directory: packages/infra
  run: npm ci

# ✅ CORRECT - npm ci from root
- name: Install dependencies
  run: npm ci

- name: Run command in workspace
  working-directory: packages/infra
  run: pulumi preview
```

**Rule**: For monorepos with npm workspaces, run `npm ci` from root, not from workspace directories.

### Service Containers (REQUIRED)

```yaml
# ❌ WRONG - Custom command in options doesn't work
services:
  minio:
    image: minio/minio:latest
    options: >-
      server /data  # This is ignored!

# ✅ CORRECT - Start service manually
services:
  minio:
    image: minio/minio:latest
    ports:
      - 9000:9000

steps:
  - name: Start MinIO
    run: |
      docker exec $(docker ps -q --filter ancestor=minio/minio:latest) \
        sh -c "minio server /data --address :9000 &"
```

**Rule**: Service containers in GitHub Actions ignore custom commands in `options`. Start services manually in steps.

## Pre-Push Validation Script

Create `.github/scripts/validate-workflows.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Validating GitHub Actions workflows..."

# 1. Lint all workflows
actionlint .github/workflows/*.yml

# 2. Check cache configurations
for file in .github/workflows/*.yml; do
    if grep -q "cache: 'npm'" "$file"; then
        if ! grep -A 2 "cache: 'npm'" "$file" | grep -q "cache-dependency-path"; then
            echo "❌ $file: Missing cache-dependency-path"
            exit 1
        fi
    fi
done

# 3. Validate paths exist
grep -r "working-directory:" .github/workflows/*.yml | while read -r line; do
    dir=$(echo "$line" | sed 's/.*working-directory: //' | tr -d '"')
    if [ ! -d "$dir" ]; then
        echo "❌ Directory does not exist: $dir"
        exit 1
    fi
done

echo "✅ All workflow files are valid"
```

Run before every push:
```bash
chmod +x .github/scripts/validate-workflows.sh
.github/scripts/validate-workflows.sh
```

## Why act Alone Isn't Enough

`act` (local GitHub Actions runner) doesn't catch:
- Cache path resolution errors (skips caching entirely)
- Service container command arguments (uses different container runtime)
- Missing workspace dependency builds (local has pre-built artifacts)
- Incorrect npm ci working directories (local has package-lock.json everywhere)

**Use the complete validation suite**: actionlint + path validation + cache validation + act dry run

## Common Failure Patterns

### "Cannot find module '@prpm/types'"
**Cause**: Workspace dependency not built before type checking
**Fix**: Add build step for the dependency before type checking

### "Cache resolution error"
**Cause**: Missing or incorrect `cache-dependency-path`
**Fix**: Always specify explicit path to package-lock.json

### "npm ci requires package-lock.json"
**Cause**: Running npm ci from workspace directory instead of root
**Fix**: Run npm ci from root for monorepo workspaces

### "Service container showing help text"
**Cause**: Custom command in service options is ignored
**Fix**: Start service manually in steps with docker exec

## Installation Tools

```bash
# macOS
brew install act actionlint yamllint

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
pip install yamllint
```

## Pre-Push Checklist

Before pushing ANY changes to `.github/workflows/`:

- [ ] Run `actionlint .github/workflows/*.yml`
- [ ] Run `.github/scripts/validate-workflows.sh`
- [ ] Verify all `cache-dependency-path` values exist
- [ ] Check monorepo build order is correct
- [ ] Dry run with `act pull_request -W .github/workflows/[workflow].yml -n`
- [ ] Confirm service containers are started manually if needed
- [ ] Ensure npm ci runs from root for workspaces

**This checklist catches 90%+ of workflow failures before CI.**
