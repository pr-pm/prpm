# NPM Cache Configuration Fix Guide

## The Problem

GitHub Actions workflows fail with this error:
```
Error: Some specified paths were not resolved, unable to cache dependencies.
```

## Root Cause

When using `actions/setup-node@v4` with `cache: 'npm'`, GitHub Actions tries to cache npm dependencies. However:

1. **Without explicit `cache-dependency-path`**, it looks for `package-lock.json` in the repository root
2. **In monorepos or complex structures**, the lock file might be in a subdirectory
3. **The error is silent in local testing** because `act` (local GitHub Actions runner) skips cache operations entirely

## Why Local Testing Doesn't Catch This

### act Limitations
`act` cannot validate cache configurations because:
- Caching is GitHub-hosted infrastructure
- `act` skips cache steps to avoid requiring GitHub API access
- No validation occurs until the workflow runs on GitHub's servers

### What act Does
```yaml
# In workflow
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**On GitHub**: Validates cache path, downloads/uploads cache
**With act**: Skips entirely, proceeds to next step

## The Solution

### Quick Fix
Add explicit `cache-dependency-path` to every `setup-node` action:

```yaml
# ❌ BEFORE (fails in CI)
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

# ✅ AFTER (works)
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: package-lock.json
```

### Path Selection Guide

Choose the correct path based on your workflow's working directory:

| Working Directory | Cache Dependency Path |
|---|---|
| (root) | `package-lock.json` |
| `./registry` | `registry/package-lock.json` |
| `./packages/cli` | `packages/cli/package-lock.json` |
| `./packages/registry-client` | `packages/registry-client/package-lock.json` |
| `./infra` | `infra/package-lock.json` |

### Example Configurations

**Root level workflow:**
```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'
      cache-dependency-path: package-lock.json

  - run: npm ci
```

**Monorepo workspace:**
```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'
      cache-dependency-path: packages/cli/package-lock.json

  - name: Install
    run: npm ci
    working-directory: ./packages/cli
```

**No cache needed (simple jobs):**
```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      # No cache: 'npm' - faster for simple echo/info jobs

  - run: echo "No dependencies needed"
```

## Automated Detection & Fixing

### Detection Script
Run validation before committing:
```bash
.github/scripts/pre-commit-workflow-check.sh
```

This checks:
- ✅ All file paths exist
- ✅ All `cache: 'npm'` have `cache-dependency-path`
- ✅ Working directories are valid

### Automated Fix
Run the auto-fix script:
```bash
.github/scripts/fix-cache-paths.sh
```

This automatically:
1. Finds all `cache: 'npm'` without `cache-dependency-path`
2. Determines the correct path based on `working-directory`
3. Adds the missing configuration
4. Reports what was fixed

### Manual Verification
After running the fix script:
```bash
# 1. Review changes
git diff .github/workflows/

# 2. Validate
.github/scripts/pre-commit-workflow-check.sh

# 3. Test (dry run)
act pull_request -W .github/workflows/ci.yml -n

# 4. Commit
git add .github/workflows/
git commit -m "Fix npm cache paths in workflows"
```

## Prevention

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
if git diff --cached --name-only | grep -q "^.github/workflows/"; then
    echo "🔍 Validating GitHub Actions workflows..."
    .github/scripts/pre-commit-workflow-check.sh || exit 1
fi
```

### CI Validation
Add workflow validation to CI:
```yaml
# .github/workflows/validate-workflows.yml
name: Validate Workflows

on:
  pull_request:
    paths:
      - '.github/workflows/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install actionlint
        run: |
          bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
          sudo mv actionlint /usr/local/bin/

      - name: Lint workflows
        run: actionlint .github/workflows/*.yml

      - name: Check cache paths
        run: .github/scripts/pre-commit-workflow-check.sh
```

### Development Workflow
Before pushing workflow changes:

1. **Edit workflow**
   ```bash
   vim .github/workflows/my-workflow.yml
   ```

2. **Validate**
   ```bash
   .github/scripts/pre-commit-workflow-check.sh
   ```

3. **Auto-fix if needed**
   ```bash
   .github/scripts/fix-cache-paths.sh
   ```

4. **Test locally**
   ```bash
   act pull_request -W .github/workflows/my-workflow.yml -n
   ```

5. **Commit & push**
   ```bash
   git add .github/workflows/my-workflow.yml
   git commit -m "Add my-workflow"
   git push
   ```

## Common Patterns

### Pattern 1: Multiple Workspaces
If your workflow installs multiple workspaces:

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'
      cache-dependency-path: package-lock.json  # Root lockfile

  - run: npm ci  # Installs all workspaces
  - run: npm run build --workspace=@prmp/cli
  - run: npm run test --workspace=@prmp/registry-client
```

### Pattern 2: Different Lockfiles Per Job
```yaml
jobs:
  cli:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          cache: 'npm'
          cache-dependency-path: packages/cli/package-lock.json
      - run: npm ci
        working-directory: ./packages/cli

  registry:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          cache: 'npm'
          cache-dependency-path: registry/package-lock.json
      - run: npm ci
        working-directory: ./registry
```

### Pattern 3: Matrix Builds
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]

steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      cache: 'npm'
      cache-dependency-path: package-lock.json  # Same for all OS

  - run: npm ci
```

## Troubleshooting

### Issue: Cache still failing after adding path
**Check:**
1. Does the file exist? `ls package-lock.json`
2. Is the path relative to repo root? (should be)
3. Is there a typo? (case-sensitive)

**Solution:**
```bash
# Verify the file exists at that path
git ls-files package-lock.json

# Check from workflow perspective
act pull_request -W .github/workflows/failing.yml -n
```

### Issue: Multiple lock files in monorepo
**Check:** Which lock file does your job actually use?

**Solution:**
Match the `cache-dependency-path` to the `working-directory`:
```yaml
defaults:
  run:
    working-directory: ./packages/cli

steps:
  - uses: actions/setup-node@v4
    with:
      cache-dependency-path: packages/cli/package-lock.json  # Match!
```

### Issue: No lock file needed
**Solution:** Don't use cache:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    # No cache - this job doesn't install dependencies
```

## Summary Checklist

Before committing workflow changes:
- [ ] Run `.github/scripts/pre-commit-workflow-check.sh`
- [ ] All `cache: 'npm'` have explicit `cache-dependency-path`
- [ ] All paths are relative to repo root
- [ ] All paths exist in the repository
- [ ] Validated with `act -n` dry run
- [ ] Tested locally if possible

After push:
- [ ] Monitor GitHub Actions for cache warnings
- [ ] Verify cache is being used (faster subsequent runs)
- [ ] Check workflow run logs for cache hit/miss

## Resources

- [GitHub Actions setup-node documentation](https://github.com/actions/setup-node)
- [act - Local GitHub Actions testing](https://github.com/nektos/act)
- [actionlint - Workflow linter](https://github.com/rhysd/actionlint)
- [This project's validation scripts](.github/scripts/)
