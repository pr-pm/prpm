# GitHub Actions Workflows

Complete list of all GitHub Actions workflows in the PRPM repository and their functions.

## Table of Contents
- [CI/CD Workflows](#cicd-workflows)
- [Publishing Workflows](#publishing-workflows)
- [Quality & Testing Workflows](#quality--testing-workflows)
- [Infrastructure & Deployment](#infrastructure--deployment)
- [Experimental Workflows](#experimental-workflows)

---

## CI/CD Workflows

### 1. **ci.yml** - Main CI Pipeline
**Trigger:** Push to `main`/`develop`, Pull requests  
**Purpose:** Primary continuous integration pipeline that runs all tests

**Jobs:**
- `registry-tests` - Tests registry service with Postgres, Redis, MinIO
- `cli-tests` - Tests CLI package
- `registry-client-tests` - Tests registry client library
- `types-tests` - Tests @prpm/types package (builds and type-checks)
- `security` - Runs npm audit on all packages
- `all-checks` - Summary job that waits for all checks

**Key Features:**
- Builds @prpm/types first (dependency for all other packages)
- Sets up full backend services (Postgres, Redis, MinIO)
- Runs type checking and builds for all packages
- Validates security with npm audit

---

### 2. **package-tests.yml** - Isolated Package Tests
**Trigger:** Push to `main`/`develop`, Pull requests  
**Purpose:** Run tests for individual packages in isolation

**Jobs:**
- `cli-tests` - CLI package tests with coverage upload
- `registry-client-tests` - Registry client tests with coverage
- `integration-tests` - Full workspace test suite

**Key Features:**
- Uploads coverage to Codecov
- Tests each package independently
- Builds packages in correct dependency order (@prpm/types → registry-client → others)

---

### 3. **e2e-tests.yml** - End-to-End Tests
**Trigger:** Push to `main`/`develop`, Pull requests, Manual dispatch  
**Purpose:** Full integration testing with running services

**Jobs:**
- `e2e-tests` - Complete end-to-end test suite

**Tests:**
- Health endpoint
- API endpoints (packages, search, trending, collections)
- Security headers
- Rate limiting
- Full E2E test scripts

**Services:**
- Postgres database
- Redis cache
- MinIO object storage
- Registry server (running on port 4000)

---

### 4. **code-quality.yml** - Quality Metrics
**Trigger:** Push to `main`/`develop`, Pull requests  
**Purpose:** Track and enforce code quality standards

**Jobs:**
- `typescript-check` - TypeScript error tracking
  - Registry (production code only, excludes tests)
  - CLI
  - Registry Client
  - Fails if errors > 0
- `security-audit` - npm audit for vulnerabilities
  - Registry
  - Root workspace
  - Fails on critical vulnerabilities
- `code-metrics` - Lines of code tracking
  - Generates summary reports

**Outputs:**
- TypeScript quality report table
- Security audit summary
- Code metrics dashboard

---

### 5. **pr-checks.yml** - Pull Request Validation
**Trigger:** Pull request events (opened, synchronize, reopened)  
**Purpose:** Quick checks on pull requests

**Jobs:**
- `pr-info` - PR summary generation
- `size-check` - Bundle size verification

---

## Publishing Workflows

### 6. **npm-publish.yml** - NPM Package Publishing
**Trigger:** Manual workflow dispatch  
**Purpose:** Publish packages to npm registry

**Inputs:**
- `version` - Bump type (patch/minor/major/pre-release)
- `custom_version` - Override with specific version
- `packages` - Which packages to publish (cli, registry-client, or all)
- `dry_run` - Test without actually publishing
- `tag` - NPM dist-tag (latest/next/beta/alpha)

**Jobs:**
- `validate` - Run tests and determine packages
- `publish` - Publish to npm (matrix job for each package)
- `create-git-tag` - Create git tag and GitHub release
- `summary` - Generate publish summary

**Publishing Order:**
1. Builds @prpm/types first
2. Builds @prpm/registry-client
3. Publishes packages with proper versioning
4. Creates git tags
5. Creates GitHub releases

**Features:**
- Dry run mode for testing
- Matrix strategy for parallel publishing
- Automatic version bumping
- Git tag creation with release notes

---

### 7. **cli-publish.yml** - CLI Release Pipeline
**Trigger:** Version tags (`v*.*.*`), Manual dispatch  
**Purpose:** Full CLI release with binaries

**Jobs:**
- `test` - Run tests before publishing
- `publish-npm` - Publish to npm
- `build-binaries` - Build platform-specific binaries
  - Linux x64
  - macOS x64
  - macOS ARM64
- `create-release` - Create GitHub release with binaries
- `update-homebrew` - Update Homebrew tap formula

**Artifacts:**
- npm package
- Platform-specific binaries
- Homebrew formula update

---

### 8. **homebrew-publish.yml** - Homebrew Formula Updates
**Trigger:** Manual dispatch, GitHub releases  
**Purpose:** Update Homebrew tap with new versions

**Features:**
- Updates Formula/prpm.rb in homebrew-prpm repo
- Calculates SHA256 for tarball
- Creates PR or direct push option
- Automated formula generation

---

### 9. **release.yml** - Cross-Platform Release
**Trigger:** Version tags (`v*`)  
**Purpose:** Build releases for multiple platforms

**Matrix:**
- macOS
- Ubuntu (Linux)
- Windows

**Steps:**
- Checkout code
- Setup Node.js 18
- Install dependencies
- Build packages

---

## Infrastructure & Deployment

### 10. **infra-deploy.yml** - Infrastructure Deployment
**Trigger:** Push to `main` (infra changes), Manual dispatch  
**Purpose:** Deploy infrastructure with Pulumi

**Environment:**
- AWS Region: us-west-2
- Pulumi access token required

**Jobs:**
- `deploy` - Deploy infrastructure to production

**Paths Watched:**
- `packages/infra/**`
- `.github/workflows/infra-*.yml`

---

### 11. **infra-preview.yml** - Infrastructure Preview
**Trigger:** Pull requests affecting infrastructure  
**Purpose:** Preview infrastructure changes before merging

**Jobs:**
- `preview` - Run Pulumi preview

**Features:**
- Posts preview results to PR
- Matrix strategy for multiple stacks
- Read-only operation (no actual deployment)

---

### 12. **deploy-pulumi-beanstalk.yml** - AWS Deployment
**Trigger:** Push to `main` (infra changes), Manual dispatch  
**Purpose:** Deploy to AWS Elastic Beanstalk with Pulumi

**Inputs:**
- `stack` - Environment (dev/staging/prod)
- `action` - Operation (preview/up/destroy)

**Environments:**
- Development
- Staging
- Production

---

### 13. **registry-deploy.yml** - Registry Service Deployment
**Trigger:** Push to `main` (registry changes), Manual dispatch  
**Purpose:** Deploy registry service

**Inputs:**
- `environment` - Target (dev/staging/prod)

**Jobs:**
- `build-and-push` - Build and push Docker image

**Features:**
- AWS integration
- Docker image building
- Environment-specific deployments

---

## Experimental Workflows

### 14. **karen-test.yml** - AI Code Review Testing
**Trigger:** Manual dispatch, Push to `v2`  
**Purpose:** Test Karen AI code review action

**Features:**
- Uses khaliqgant/karen-action@v1.0.1
- Anthropic API integration
- Badge generation
- No automatic commenting (test mode)

**Configuration:**
- `post_comment: false` - Don't comment on pushes
- `generate_badge: true` - Create quality badges
- `min_score: 0` - No failure threshold (testing)

---

## Workflow Dependencies & Build Order

### Critical Build Order
All workflows that build packages must follow this order:

1. **@prpm/types** - Build first (no dependencies)
2. **@prpm/registry-client** - Depends on types
3. **prpm (CLI)** - Depends on types and registry-client
4. **@prpm/registry** - Depends on types
5. **@prpm/webapp** - Depends on types

### Workflows Updated for @prpm/types
The following workflows have been updated to build `@prpm/types` first:

✅ `ci.yml` - All test jobs  
✅ `code-quality.yml` - TypeScript checks  
✅ `package-tests.yml` - Package tests  
✅ `e2e-tests.yml` - E2E tests  
✅ `npm-publish.yml` - Publishing workflow  

---

## Secrets Required

The workflows require the following GitHub secrets:

| Secret | Used By | Purpose |
|--------|---------|---------|
| `NPM_TOKEN` | npm-publish, cli-publish | Publish to npm registry |
| `GITHUB_TOKEN` | Multiple | GitHub API access (auto-provided) |
| `HOMEBREW_TAP_TOKEN` | homebrew-publish, cli-publish | Update homebrew formula |
| `ANTHROPIC_API_KEY` | karen-test, e2e-tests | AI code review, optional tests |
| `PULUMI_ACCESS_TOKEN` | infra-deploy, infra-preview, deploy-pulumi | Infrastructure deployment |
| AWS credentials | infra-deploy, registry-deploy | AWS deployment |

---

## Workflow Triggers Summary

| Workflow | Push main | Push develop | Push v2 | PR | Tags | Manual |
|----------|-----------|--------------|---------|----|----- |--------|
| ci.yml | ✅ | ✅ | - | ✅ | - | - |
| package-tests.yml | ✅ | ✅ | - | ✅ | - | - |
| e2e-tests.yml | ✅ | ✅ | - | ✅ | - | ✅ |
| code-quality.yml | ✅ | ✅ | - | ✅ | - | - |
| pr-checks.yml | - | - | - | ✅ | - | - |
| npm-publish.yml | - | - | - | - | - | ✅ |
| cli-publish.yml | - | - | - | - | v*.*.* | ✅ |
| homebrew-publish.yml | - | - | - | - | releases | ✅ |
| release.yml | - | - | - | - | v* | - |
| infra-deploy.yml | ✅* | - | - | - | - | ✅ |
| infra-preview.yml | - | - | - | ✅* | - | - |
| registry-deploy.yml | ✅* | - | - | - | - | ✅ |
| deploy-pulumi.yml | ✅* | - | - | - | - | ✅ |
| karen-test.yml | - | - | ✅ | - | - | ✅ |

*Only when specific paths change

---

## Monitoring & Notifications

### GitHub Actions UI
- All workflows appear in the Actions tab
- Workflow runs show status badges
- Step summaries show detailed reports

### Workflow Status Badges
Add to README.md:

```markdown
![CI](https://github.com/khaliqgant/prompt-package-manager/workflows/CI/badge.svg)
![Code Quality](https://github.com/khaliqgant/prompt-package-manager/workflows/Code%20Quality/badge.svg)
![E2E Tests](https://github.com/khaliqgant/prompt-package-manager/workflows/E2E%20Tests/badge.svg)
```

---

## Best Practices

1. **Always build @prpm/types first** in any workflow that builds packages
2. **Use workspace dependencies** with `npm run build --workspace=@prpm/types`
3. **Set working-directory** when targeting specific packages
4. **Use matrix strategies** for parallel execution when possible
5. **Add if: always()** to cleanup jobs
6. **Use secrets** for sensitive values (never hardcode)
7. **Test with dry-run** before actual publishing
8. **Use GITHUB_STEP_SUMMARY** for human-readable reports

---

## Maintenance

### Adding New Workflows
1. Create `.github/workflows/<name>.yml`
2. Add to this documentation
3. Test with manual dispatch if possible
4. Add required secrets to repository settings

### Modifying Existing Workflows
1. Test changes on a branch first
2. Use workflow_dispatch for manual testing
3. Update this documentation
4. Ensure @prpm/types build order is maintained

### Deprecating Workflows
1. Add deprecation notice to workflow file
2. Set `if: false` to disable
3. Update this documentation
4. Remove after confirming no dependencies
