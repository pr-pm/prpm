# GitHub Actions Workflows

Complete list of all GitHub Actions workflows in the PRPM repository and their functions.

**Current Structure: 3 Workflows**

## Table of Contents
- [CI/CD](#cicd)
- [Publishing](#publishing)
- [Deployment](#deployment)

---

## CI/CD

### 1. **ci.yml** - Main CI Pipeline
**Trigger:** Push to `main`/`develop`, Pull requests  
**Purpose:** Comprehensive continuous integration pipeline

**Jobs:**
- `registry-tests` - Tests registry service with Postgres, Redis, MinIO
- `cli-tests` - Tests CLI package  
- `registry-client-tests` - Tests registry client library
- `types-tests` - Tests @pr-pm/types package
- `security` - Runs npm audit on all packages
- `all-checks` - Summary job

**Key Features:**
- ✅ Builds @pr-pm/types first (required dependency)
- ✅ Full backend services (Postgres, Redis, MinIO)
- ✅ Type checking and builds for all packages
- ✅ Security validation with npm audit
- Includes unit tests, integration tests, and E2E tests
- Coverage reporting
- Code quality metrics

**Services:**
- PostgreSQL 15
- Redis 7
- MinIO (S3-compatible storage)

---

## Publishing

### 2. **publish.yml** - Package Publishing
**Trigger:** Manual workflow dispatch  
**Purpose:** Publish packages to npm registry with version management

**Inputs:**
- `version` - Version bump type (patch/minor/major/prerelease)
- `custom_version` - Override with specific version
- `packages` - Which packages to publish: `types`, `registry-client`, `cli`, or `all`
- `dry_run` - Test without actually publishing (default: false)
- `tag` - NPM dist-tag: `latest`, `next`, `beta`, `alpha` (default: latest)

**Jobs:**
1. `validate` - Run tests and determine packages to publish
2. `publish` - Publish to npm (matrix job per package)
3. `create-git-tag` - Create git tag and GitHub release
4. `summary` - Generate publish summary report

**Publishing Order (Critical):**
1. **@pr-pm/types** (no dependencies)
2. **@pr-pm/registry-client** (depends on types)
3. **prpm** (CLI - depends on types and registry-client)

**Features:**
- ✅ Builds packages in dependency order
- ✅ Dry run mode for testing
- ✅ Matrix strategy for parallel publishing
- ✅ Automatic version bumping
- ✅ Git tag creation with release notes
- ✅ Supports pre-release versions

**Example Usage:**
```bash
# Publish all packages with patch bump
# Go to Actions → Publish Packages → Run workflow
# Select: version=patch, packages=all, dry_run=false, tag=latest

# Dry run test
# Select: dry_run=true to test without publishing

# Publish only types package
# Select: packages=types
```

---

### 3. **homebrew-publish.yml** - Homebrew Formula Updates
**Trigger:** Manual workflow dispatch, GitHub releases  
**Purpose:** Update Homebrew tap with new CLI versions

**Inputs:**
- `version` - Version to publish (e.g., 1.2.3)
- `create_pr` - Create PR instead of direct push (default: false)

**Features:**
- Updates `Formula/prpm.rb` in homebrew-prpm repository
- Calculates SHA256 for source tarball
- Automated formula generation
- Option to create PR for review

**Repository:** `khaliqgant/homebrew-prpm`

---

## Deployment

### 4. **registry-deploy.yml** - Registry Service Deployment
**Trigger:** Push to `main` (registry path changes), Manual workflow dispatch  
**Purpose:** Build and deploy registry Docker image

**Inputs:**
- `environment` - Target environment: `dev`, `staging`, `prod`

**Jobs:**
- `build-and-push` - Build Docker image and push to registry

**Features:**
- AWS ECR integration
- Multi-environment support
- Docker image building and tagging
- Automated deployment to ECS/Beanstalk

**Paths Watched:**
- `packages/registry/**`
- `.github/workflows/registry-*.yml`

---

## Workflow Dependencies & Build Order

### Critical Build Order
All workflows that build packages **must** follow this order:

1. **@pr-pm/types** (no dependencies) ← Build FIRST
2. **@pr-pm/registry-client** (depends on types)
3. **prpm** CLI (depends on types + registry-client)
4. **@pr-pm/registry** (depends on types)
5. **@pr-pm/webapp** (depends on types)

### Workflows Updated for @pr-pm/types Dependency

✅ **ci.yml** - All test jobs build types first  
✅ **publish.yml** - Builds types before publishing  

---

## Required GitHub Secrets

| Secret | Used By | Purpose |
|--------|---------|---------|
| `NPM_TOKEN` | publish.yml | Publish to npm registry |
| `GITHUB_TOKEN` | Multiple | GitHub API access (auto-provided) |
| `HOMEBREW_TAP_TOKEN` | homebrew-publish.yml | Update Homebrew formula |
| AWS credentials | registry-deploy | AWS deployment access |

---

## Workflow Triggers Summary

| Workflow | Push main | Push develop | PR | Manual | Path Filter |
|----------|-----------|--------------|----|----- |-------------|
| ci.yml | ✅ | ✅ | ✅ | - | - |
| publish.yml | - | - | - | ✅ | - |
| homebrew-publish.yml | - | - | - | ✅ | - |
| registry-deploy.yml | ✅ | - | - | ✅ | packages/registry/** |

---

## Workflow Best Practices

### 1. Always Build Dependencies First
```yaml
- name: Build dependencies in order
  run: |
    npm run build --workspace=@pr-pm/types
    npm run build --workspace=@pr-pm/registry-client
    npm run build --workspace=prpm
```

### 2. Use Workspace Targeting
```yaml
# Correct
npm run build --workspace=@pr-pm/types

# Wrong - builds everything
npm run build
```

### 3. Set Working Directory for Package-Specific Jobs
```yaml
defaults:
  run:
    working-directory: ./packages/cli
```

### 4. Use Matrix for Parallel Execution
```yaml
strategy:
  matrix:
    package: [types, registry-client, cli]
```

### 5. Cleanup Jobs Use if: always()
```yaml
- name: Cleanup
  if: always()
  run: kill $(cat /tmp/server.pid) || true
```

---

## Monitoring & Status Badges

### GitHub Actions UI
- View all workflow runs in the **Actions** tab
- Each workflow shows status, timing, and logs
- Step summaries provide detailed reports

### Add Status Badges to README
```markdown
![CI](https://github.com/pr-pm/prpm/workflows/CI/badge.svg)
![Publish](https://github.com/pr-pm/prpm/workflows/Publish%20Packages/badge.svg)
```

---

## Common Workflow Operations

### Manual Publishing
1. Go to **Actions** → **Publish Packages**
2. Click **Run workflow**
3. Select options:
   - Version: patch/minor/major
   - Packages: all/types/registry-client/cli
   - Dry run: true (to test first)
   - Tag: latest
4. Review dry run output
5. Run again with dry_run=false to publish

### Deploying Registry Service
1. Go to **Actions** → **Registry Deploy**
2. Click **Run workflow**
3. Select environment (dev/staging/prod)

---

## Maintenance

### Adding New Packages
When adding a new publishable package:
1. Add to `publish.yml` packages list
2. Update build order in `ci.yml`
3. Add package.json with `publishConfig`
4. Update `PUBLISHING.md` documentation

### Modifying Workflows
1. Test changes on a feature branch first
2. Use `workflow_dispatch` trigger for manual testing
3. Update this documentation
4. Ensure @pr-pm/types build order is maintained
5. Test dry-run before actual publishing

### Secrets Management
- Store in GitHub repo Settings → Secrets and variables → Actions
- Use environment-specific secrets for multi-env deployments
- Rotate tokens periodically
- Never commit secrets to code

---

## Removed Workflows (Consolidated)

The following workflows were removed to eliminate redundancy:

- ❌ `package-tests.yml` - Merged into ci.yml
- ❌ `code-quality.yml` - Merged into ci.yml
- ❌ `pr-checks.yml` - Merged into ci.yml
- ❌ `e2e-tests.yml` - Merged into ci.yml
- ❌ `release.yml` - Functionality merged into publish.yml
- ❌ `cli-publish.yml` - Functionality merged into publish.yml
- ❌ `karen-test.yml` - Experimental, removed

**Result:** Consolidated from 14 → 7 workflows (50% reduction)

**Benefits:**
- Fewer concurrent runs (better performance)
- Single source of truth for CI/CD
- Easier maintenance
- Better resource utilization
- Clearer job dependencies
