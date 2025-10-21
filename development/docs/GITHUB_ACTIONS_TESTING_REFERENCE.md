# GitHub Actions Testing & Validation Skill

## Why This Skill Exists

GitHub Actions workflows often fail in CI due to issues that aren't caught during local development:
- **Path issues**: Wrong file paths that exist locally but not in CI
- **Cache configuration**: Cache paths that `act` doesn't validate
- **Environment differences**: GitHub-hosted runners have different setups
- **Missing dependencies**: Steps that work locally but fail in clean environments

This skill provides tools and processes to catch these issues before pushing to GitHub.

## Tools

### 1. act - Local GitHub Actions Testing
**Purpose**: Run workflows locally using Docker to simulate GitHub Actions runners

**Installation**:
```bash
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Or download from: https://github.com/nektos/act/releases
```

### 2. actionlint - Workflow Linter
**Purpose**: Catch syntax errors, type mismatches, and common issues in workflow files

**Installation**:
```bash
# macOS
brew install actionlint

# Linux
bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)

# Or download from: https://github.com/rhysd/actionlint/releases
```

### 3. yamllint - YAML Syntax Checker
**Purpose**: Validate YAML syntax before GitHub processes it

**Installation**:
```bash
# macOS
brew install yamllint

# Linux/Ubuntu
sudo apt-get install yamllint

# Python
pip install yamllint
```

## Testing Process

### Step 1: Lint Workflow Files

Run this **before every commit** that touches `.github/workflows/`:

```bash
#!/bin/bash
# Script: .github/scripts/validate-workflows.sh

set -e

echo "🔍 Validating GitHub Actions workflows..."

# Check if actionlint is installed
if ! command -v actionlint &> /dev/null; then
    echo "❌ actionlint not installed. Install with: brew install actionlint"
    exit 1
fi

# Lint all workflow files
echo ""
echo "Running actionlint..."
actionlint .github/workflows/*.yml

# Check YAML syntax
if command -v yamllint &> /dev/null; then
    echo ""
    echo "Running yamllint..."
    yamllint .github/workflows/*.yml
fi

echo ""
echo "✅ All workflow files are valid"
```

**Usage**:
```bash
chmod +x .github/scripts/validate-workflows.sh
.github/scripts/validate-workflows.sh
```

### Step 2: Dry Run with act

Test workflows locally without actually running them:

```bash
#!/bin/bash
# Script: .github/scripts/test-workflows.sh

set -e

echo "🧪 Testing GitHub Actions workflows locally..."

# List all jobs that would run on pull_request
echo ""
echo "Jobs that run on pull_request:"
act pull_request -l

# List all jobs that run on push
echo ""
echo "Jobs that run on push:"
act push -l

# Dry run specific workflow
echo ""
echo "Dry run for CI workflow:"
act pull_request -W .github/workflows/ci.yml -n

echo ""
echo "Dry run for PR checks workflow:"
act pull_request -W .github/workflows/pr-checks.yml -n

echo ""
echo "✅ All workflow dry runs completed"
```

**Usage**:
```bash
chmod +x .github/scripts/test-workflows.sh
.github/scripts/test-workflows.sh
```

### Step 3: Run Specific Jobs

Test individual jobs that are most likely to fail:

```bash
#!/bin/bash
# Script: .github/scripts/run-job.sh

# Usage: ./run-job.sh <job-name> <workflow-file>
# Example: ./run-job.sh cli-tests ci.yml

JOB_NAME="${1}"
WORKFLOW_FILE="${2:-ci.yml}"

if [ -z "$JOB_NAME" ]; then
    echo "Usage: $0 <job-name> [workflow-file]"
    echo ""
    echo "Available jobs:"
    act -l
    exit 1
fi

echo "🚀 Running job: $JOB_NAME from $WORKFLOW_FILE"
echo ""

# Run the specific job
act -W ".github/workflows/$WORKFLOW_FILE" -j "$JOB_NAME"
```

**Usage**:
```bash
chmod +x .github/scripts/run-job.sh
./run-job.sh cli-tests ci.yml
```

### Step 4: Validate Common Pitfalls

Create a pre-commit validation script:

```bash
#!/bin/bash
# Script: .github/scripts/pre-commit-workflow-check.sh

set -e

echo "🔍 Pre-commit workflow validation..."

# Function to check if path exists
check_path_exists() {
    local workflow_file="$1"
    local paths=$(grep -E "(working-directory|cache-dependency-path|path):" "$workflow_file" | grep -v "#" || true)

    if [ -n "$paths" ]; then
        echo ""
        echo "Checking paths in $workflow_file:"
        echo "$paths" | while IFS= read -r line; do
            # Extract path value
            path=$(echo "$line" | sed 's/.*: //' | tr -d '"' | tr -d "'")

            # Skip variables and URLs
            if [[ "$path" =~ ^\$\{ ]] || [[ "$path" =~ ^http ]]; then
                continue
            fi

            # Check if path exists
            if [ ! -e "$path" ] && [ ! -e "./$path" ]; then
                echo "  ⚠️  Path may not exist: $path"
            else
                echo "  ✅ Path exists: $path"
            fi
        done
    fi
}

# Check all workflow files
for workflow in .github/workflows/*.yml; do
    check_path_exists "$workflow"
done

# Validate cache configurations
echo ""
echo "Checking npm cache configurations..."
grep -A 3 "cache: 'npm'" .github/workflows/*.yml | grep -E "(File:|cache-dependency-path)" || echo "  ⚠️  Some workflows use cache: 'npm' without explicit cache-dependency-path"

echo ""
echo "✅ Pre-commit validation complete"
```

**Usage**:
```bash
chmod +x .github/scripts/pre-commit-workflow-check.sh
.github/scripts/pre-commit-workflow-check.sh
```

## Common Issues & Solutions

### Issue 1: Cache Resolution Errors

**Error**:
```
Error: Some specified paths were not resolved, unable to cache dependencies.
```

**Why act doesn't catch this**:
- `act` skips cache steps entirely because caching is GitHub-hosted infrastructure
- Cache paths are only validated at runtime on GitHub's runners

**Solution**:
Always specify `cache-dependency-path` explicitly:

```yaml
# ❌ Bad - relies on default path
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

# ✅ Good - explicit path
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: package-lock.json

# ✅ Good - monorepo with workspace
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: packages/cli/package-lock.json
```

**Validation Script**:
```bash
#!/bin/bash
# Validate all cache configurations have explicit paths

for file in .github/workflows/*.yml; do
    # Find lines with cache: 'npm'
    if grep -q "cache: 'npm'" "$file"; then
        # Check if cache-dependency-path is specified
        if ! grep -A 2 "cache: 'npm'" "$file" | grep -q "cache-dependency-path"; then
            echo "⚠️  $file uses cache: 'npm' without cache-dependency-path"
        else
            echo "✅ $file has explicit cache-dependency-path"
        fi
    fi
done
```

### Issue 2: Wrong Working Directory

**Error**:
```
npm ERR! enoent ENOENT: no such file or directory
```

**Solution**:
```yaml
# Verify paths match your actual structure
defaults:
  run:
    working-directory: ./packages/cli  # ← Check this exists!
```

**Validation**:
```bash
# Extract and verify all working-directory paths
grep -r "working-directory:" .github/workflows/*.yml | while read -r line; do
    dir=$(echo "$line" | sed 's/.*working-directory: //' | tr -d '"')
    if [ ! -d "$dir" ]; then
        echo "❌ Directory does not exist: $dir"
    else
        echo "✅ Directory exists: $dir"
    fi
done
```

### Issue 3: Missing Environment Variables

**Why act doesn't catch this**:
- Local environment has different variables
- Secrets aren't available locally

**Solution**:
Create `.env.act` for local testing:

```bash
# .env.act - Not committed to git
DATABASE_URL=postgresql://localhost:5432/test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret
```

**Usage**:
```bash
act pull_request --env-file .env.act
```

### Issue 4: Action Version Mismatches

**Error**:
```
Unable to resolve action 'actions/checkout@v5'
```

**Solution**:
Use actionlint to catch unsupported versions:

```bash
actionlint .github/workflows/*.yml
```

### Issue 5: Service Container Command Arguments

**Error**:
```
Service container minio failed.
Container is showing help text instead of starting.
```

**Why act doesn't catch this**:
- Service containers in GitHub Actions don't support custom commands in the `options` field
- MinIO and similar containers need explicit command arguments (`server /data`)
- This only manifests in actual GitHub Actions runners

**Solution**:
Start the service manually after container initialization:

```yaml
# ❌ Bad - service containers can't override CMD
services:
  minio:
    image: minio/minio:latest
    env:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    options: >-
      --health-cmd "curl -f http://localhost:9000/minio/health/live"
      server /data  # ← This doesn't work!

# ✅ Good - manually start the service in steps
services:
  minio:
    image: minio/minio:latest
    env:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - 9000:9000

steps:
  - name: Start MinIO
    run: |
      docker exec $(docker ps -q --filter ancestor=minio/minio:latest) \
        sh -c "minio server /data --address :9000 --console-address :9001 &"

  - name: Wait for MinIO
    run: |
      timeout 60 bash -c 'until curl -f http://localhost:9000/minio/health/live; do sleep 2; done'
```

### Issue 6: Monorepo Dependency Build Order

**Error**:
```
error TS2307: Cannot find module '@prpm/registry-client' or its corresponding type declarations.
```

**Why local testing doesn't catch this**:
- Local development has previously built packages in `node_modules`
- Fresh CI environment starts clean without any built artifacts
- TypeScript checks need the compiled output from workspace dependencies

**Solution**:
Always build workspace dependencies before type checking:

```yaml
# ❌ Bad - type check without building dependencies
- name: Install dependencies
  run: npm ci

- name: Type check
  run: npx tsc --noEmit

# ✅ Good - build dependencies first
- name: Install dependencies
  run: npm ci

- name: Build registry-client
  run: npm run build --workspace=@prpm/registry-client

- name: Type check
  run: npx tsc --noEmit
```

**Validation Script**:
```bash
#!/bin/bash
# Check if workflows have proper build order for workspace dependencies

echo "Checking workspace dependency build order..."

# Find workflows that do TypeScript checks
for file in .github/workflows/*.yml; do
    if grep -q "tsc --noEmit" "$file"; then
        # Check if they build dependencies first
        if ! grep -B 10 "tsc --noEmit" "$file" | grep -q "npm run build.*workspace"; then
            echo "⚠️  $file: TypeScript check without building workspace dependencies"
        else
            echo "✅ $file: Has proper build order"
        fi
    fi
done
```

### Issue 7: Working Directory Confusion with npm ci

**Error**:
```
npm ci requires an existing package-lock.json file
```

**Why this happens**:
- Using `working-directory: infra` with `npm ci` when `infra/` has no package-lock.json
- In monorepos, workspace dependencies are installed from the root
- Pulumi and other tools that use workspaces should run `npm ci` from root

**Solution**:
Run `npm ci` from root, not from workspace directories:

```yaml
# ❌ Bad - tries to install from workspace directory
- name: Install dependencies
  working-directory: infra
  run: npm ci

# ✅ Good - install from root for monorepo
- name: Install dependencies
  run: npm ci

# Then use working-directory for actual commands
- name: Run Pulumi
  working-directory: infra
  run: pulumi preview
```

## Pre-Push Checklist

Create this script and run it before every push:

```bash
#!/bin/bash
# Script: .github/scripts/pre-push-check.sh

set -e

echo "🚀 Pre-push workflow validation..."
echo ""

# 1. Lint workflows
echo "1️⃣  Linting workflows..."
actionlint .github/workflows/*.yml || { echo "❌ Linting failed"; exit 1; }
echo "✅ Linting passed"
echo ""

# 2. Validate paths
echo "2️⃣  Validating paths..."
.github/scripts/pre-commit-workflow-check.sh || { echo "❌ Path validation failed"; exit 1; }
echo ""

# 3. Dry run critical workflows
echo "3️⃣  Dry running CI workflow..."
act pull_request -W .github/workflows/ci.yml -n || { echo "❌ CI dry run failed"; exit 1; }
echo "✅ CI dry run passed"
echo ""

# 4. Check for required secrets
echo "4️⃣  Checking for required secrets..."
REQUIRED_SECRETS=("NPM_TOKEN" "GITHUB_TOKEN")
for secret in "${REQUIRED_SECRETS[@]}"; do
    if grep -r "\${{ secrets.$secret }}" .github/workflows/*.yml > /dev/null; then
        echo "  ℹ️  Workflow uses secret: $secret"
    fi
done
echo ""

echo "✅ All pre-push checks passed!"
echo ""
echo "Ready to push? Run: git push"
```

**Usage**:
```bash
chmod +x .github/scripts/pre-push-check.sh
.github/scripts/pre-push-check.sh
```

## Git Hooks Integration

Make validation automatic with git hooks:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run workflow validation before every commit
if git diff --cached --name-only | grep -q "^.github/workflows/"; then
    echo "🔍 Detected workflow changes, running validation..."
    .github/scripts/validate-workflows.sh || exit 1
fi

exit 0
```

**Setup**:
```bash
# Make it executable
chmod +x .git/hooks/pre-commit

# Or use husky for project-wide hooks
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit ".github/scripts/validate-workflows.sh"
```

## Complete Testing Workflow

```bash
#!/bin/bash
# Script: .github/scripts/full-workflow-test.sh

set -e

echo "🧪 Complete GitHub Actions Testing Suite"
echo "========================================"
echo ""

# 1. Static Analysis
echo "📋 Step 1: Static Analysis"
echo "-------------------------"
actionlint .github/workflows/*.yml
yamllint .github/workflows/*.yml
echo "✅ Static analysis passed"
echo ""

# 2. Path Validation
echo "📁 Step 2: Path Validation"
echo "-------------------------"
.github/scripts/pre-commit-workflow-check.sh
echo ""

# 3. Dry Runs
echo "🔍 Step 3: Workflow Dry Runs"
echo "-------------------------"
for workflow in .github/workflows/{ci,pr-checks,code-quality}.yml; do
    echo "  Testing $(basename $workflow)..."
    act pull_request -W "$workflow" -n || echo "  ⚠️  Warning: dry run had issues"
done
echo "✅ Dry runs completed"
echo ""

# 4. Local Execution (optional - can be slow)
if [ "$1" == "--run" ]; then
    echo "🚀 Step 4: Local Execution"
    echo "-------------------------"
    echo "  Running CLI tests..."
    act pull_request -W .github/workflows/ci.yml -j cli-tests
    echo "✅ Local execution passed"
else
    echo "ℹ️  Step 4: Skipped (use --run to execute workflows locally)"
fi

echo ""
echo "✅ All tests passed! Safe to push."
```

**Usage**:
```bash
# Quick validation (no actual execution)
.github/scripts/full-workflow-test.sh

# Full validation with execution
.github/scripts/full-workflow-test.sh --run
```

## Continuous Improvement

### Monitor Workflow Failures
Create a script to analyze failed workflow runs:

```bash
#!/bin/bash
# Script: .github/scripts/analyze-failures.sh

# Requires: gh CLI (GitHub CLI)
# Install: brew install gh

echo "📊 Analyzing recent workflow failures..."

gh run list --limit 20 --json conclusion,name,createdAt | \
  jq -r '.[] | select(.conclusion=="failure") | "\(.name) - \(.createdAt)"'

echo ""
echo "Common failure reasons to check:"
echo "  1. Cache path resolution"
echo "  2. Working directory paths"
echo "  3. Missing dependencies"
echo "  4. Environment variable configuration"
```

### Add to CI
Include workflow validation in CI itself:

```yaml
# .github/workflows/validate-workflows.yml
name: Validate Workflows

on:
  pull_request:
    paths:
      - '.github/workflows/**'

jobs:
  validate:
    name: Validate Workflow Files
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install actionlint
        run: |
          bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
          sudo mv actionlint /usr/local/bin/

      - name: Lint workflows
        run: actionlint .github/workflows/*.yml

      - name: Check paths
        run: .github/scripts/pre-commit-workflow-check.sh
```

## Summary

**Always run before pushing workflow changes**:
1. `actionlint .github/workflows/*.yml` - Catch syntax errors
2. `.github/scripts/validate-workflows.sh` - Validate configuration
3. `.github/scripts/pre-commit-workflow-check.sh` - Validate paths and cache configs
4. `act pull_request -W .github/workflows/ci.yml -n` - Dry run
5. Check that all `cache-dependency-path` values are explicit and point to existing files
6. Verify monorepo build order (build workspace dependencies before type checking)
7. Ensure service containers with custom commands are started manually
8. Run `npm ci` from root for monorepo workspaces

**Why act alone isn't enough**:
- Skips cache validation entirely
- Skips secret validation
- May have different environment
- Doesn't catch GitHub-specific features
- Doesn't validate service container command arguments
- Has previously built artifacts that mask missing build steps
- Can't detect monorepo dependency build order issues

**Why local development doesn't catch these**:
- Previous builds exist in `node_modules` and `dist/`
- Local package-lock.json files might exist in workspace directories
- Service containers may already be running from previous sessions
- Environment variables are set differently

**Best practice**: Use the complete testing suite:
- **Static analysis**: actionlint + yamllint
- **Path validation**: Custom scripts to verify all paths exist
- **Cache validation**: Check `cache-dependency-path` points to existing files
- **Build order**: Ensure workspace dependencies are built before type checks
- **Dry runs**: `act -n` to catch basic issues
- **Clean environment testing**: Occasionally test in Docker to simulate fresh CI

**Critical insight**: The failures we encountered (missing module errors, service container issues, npm ci failures) would have been caught by running workflows in a truly clean environment. The pre-commit validation script now checks for file existence, not just configuration presence.
