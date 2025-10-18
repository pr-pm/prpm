# GitHub Actions CI/CD Documentation

This document describes the comprehensive GitHub Actions workflows configured for the PRPM (Prompt Package Manager) project.

---

## 📋 Overview

The project uses **5 main GitHub Actions workflows** to ensure code quality, security, and reliability:

1. **CI** - Core continuous integration checks
2. **E2E Tests** - End-to-end testing with full infrastructure
3. **Code Quality** - TypeScript, security, and code metrics
4. **PR Checks** - Pull request specific validations
5. **Deployment** - Automated deployments (existing)

---

## 🔄 Workflow Details

### 1. CI Workflow (`ci.yml`)

**Triggers**: Push to `main`/`develop`, Pull Requests
**Purpose**: Core build and test validation

#### Jobs:

##### Registry Tests
- **Services**: PostgreSQL, Redis, MinIO
- **Steps**:
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies (`npm ci`)
  4. TypeScript type checking
  5. Build verification
  6. TypeScript error count (fails if >5 errors)

**Pass Criteria**:
- ✅ Builds successfully
- ✅ ≤5 TypeScript errors (allows test file errors)

##### CLI Tests
- **Steps**:
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies
  4. TypeScript type checking
  5. Build verification

**Pass Criteria**:
- ✅ Builds successfully
- ✅ TypeScript compiles

##### Security Checks
- **Steps**:
  1. Run `npm audit` on registry
  2. Run `npm audit` on CLI
  3. Report vulnerabilities

**Pass Criteria**:
- ⚠️ Informational only (doesn't fail build)

---

### 2. E2E Tests Workflow (`e2e-tests.yml`)

**Triggers**: Push, Pull Requests, Manual (`workflow_dispatch`)
**Purpose**: Comprehensive end-to-end testing

#### Infrastructure Services:
```yaml
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)
- MinIO (ports 9000-9001)
```

#### Test Scenarios:

1. **Health Check Test**
   ```bash
   curl -f http://localhost:4000/health
   ```
   - Verifies server is running
   - Checks status response

2. **API Endpoint Tests**
   - `/api/v1/packages` - List packages
   - `/api/v1/search` - Search functionality
   - `/api/v1/packages/trending` - Trending packages
   - `/api/v1/collections` - Collections API

3. **Security Tests**
   - Helmet security headers present
   - Rate limiting headers configured
   - CORS headers set

4. **Full E2E Suite**
   - Runs `scripts/e2e-test.sh`
   - 18+ comprehensive test scenarios
   - Timeout: 2 minutes

**Pass Criteria**:
- ✅ All health checks pass
- ✅ All API endpoints respond
- ✅ Security headers present
- ✅ E2E test suite passes

---

### 3. Code Quality Workflow (`code-quality.yml`)

**Triggers**: Push, Pull Requests
**Purpose**: Enforce code quality standards

#### Jobs:

##### TypeScript Quality Check
- **Registry**: Must have **0 production errors**
- **CLI**: Allows errors (warning only)
- Filters out `__tests__` directories
- Reports metrics to PR summary

**Example Output**:
```
| Component | Errors | Status |
|-----------|--------|--------|
| Registry (Production) | 0 | ✅ Clean |
| CLI | 3 | ⚠️ Has errors |
```

##### Security Audit
- Uses `npm audit --audit-level=moderate`
- Tracks critical and high vulnerabilities
- **Fails on**: Critical vulnerabilities
- **Warns on**: High vulnerabilities

**Example Output**:
```
| Component | Critical | High | Status |
|-----------|----------|------|--------|
| Registry | 0 | 6 | ✅ |
| CLI | 0 | 2 | ✅ |
```

##### Code Metrics
- Lines of TypeScript code
- Excludes node_modules and tests
- Reports to PR summary

**Pass Criteria**:
- ✅ 0 TypeScript errors in production code
- ✅ 0 critical vulnerabilities
- ⚠️ Code metrics are informational

---

### 4. PR Checks Workflow (`pr-checks.yml`)

**Triggers**: Pull Request opened/updated
**Purpose**: PR-specific validations

#### Checks:

1. **PR Information**
   - Files changed count
   - Lines added/deleted
   - Summary in PR

2. **Bundle Size Check**
   - Builds the application
   - Reports dist folder size
   - Tracks size over time

**Pass Criteria**:
- ℹ️ All checks are informational
- Provides visibility into PR impact

---

### 5. Deployment Workflows (Existing)

#### Registry Deploy (`registry-deploy.yml`)
- Deploys registry service
- Production and staging environments

#### Infrastructure Deploy (`infra-deploy.yml`, `infra-preview.yml`)
- Manages infrastructure
- Preview environments for PRs

#### CLI Publish (`cli-publish.yml`)
- Publishes CLI to npm
- Version management

---

## 🎯 Status Badges

Add these badges to your README.md:

```markdown
![CI](https://github.com/your-org/prompt-package-manager/workflows/CI/badge.svg)
![E2E Tests](https://github.com/your-org/prompt-package-manager/workflows/E2E%20Tests/badge.svg)
![Code Quality](https://github.com/your-org/prompt-package-manager/workflows/Code%20Quality/badge.svg)
```

---

## 📊 Check Requirements Summary

### For Pull Requests to Merge:

| Check | Required | Can Fail PR? |
|-------|----------|--------------|
| CI - Registry Tests | ✅ Yes | ✅ Yes |
| CI - CLI Tests | ✅ Yes | ✅ Yes |
| CI - Security | ⚠️ Advisory | ❌ No |
| E2E Tests | ✅ Yes | ✅ Yes |
| TypeScript Quality | ✅ Yes | ✅ Yes |
| Security Audit (Critical) | ✅ Yes | ✅ Yes |
| Code Metrics | ℹ️ Info | ❌ No |
| PR Checks | ℹ️ Info | ❌ No |

### Critical Failure Conditions:

1. **TypeScript Errors**: >0 in production code
2. **Build Failure**: Cannot compile
3. **E2E Test Failure**: Any test scenario fails
4. **Critical Vulnerabilities**: Any npm package with critical CVE

---

## 🔧 Configuration

### Environment Variables (GitHub Secrets)

None required for CI workflows! All tests use:
- Default credentials for services
- Test-only secrets
- No production credentials needed

### Service Configuration

#### PostgreSQL
```yaml
POSTGRES_USER: prmp
POSTGRES_PASSWORD: prmp
POSTGRES_DB: prpm_registry
```

#### MinIO
```yaml
MINIO_ROOT_USER: minioadmin
MINIO_ROOT_PASSWORD: minioadmin
```

#### Registry
```yaml
JWT_SECRET: test-secret-key
ENABLE_TELEMETRY: "false"
```

---

## 🐛 Troubleshooting

### Common Issues:

#### 1. E2E Tests Timeout
**Symptom**: Tests fail waiting for registry
**Solution**: Increase `sleep` time in "Start Registry Server" step

#### 2. MinIO Health Check Fails
**Symptom**: MinIO service not ready
**Solution**: Increase health check intervals in service definition

#### 3. TypeScript Errors in CI but not Local
**Symptom**: CI fails but local `tsc` passes
**Solution**: Run `npm ci` (not `npm install`) to match CI dependencies

#### 4. Security Audit Fails
**Symptom**: New vulnerabilities block PR
**Solution**: Run `npm audit fix` or update affected packages

---

## 📈 Performance

### Typical Run Times:

| Workflow | Duration | Cost (GitHub Actions) |
|----------|----------|----------------------|
| CI | ~3-5 minutes | Free tier |
| E2E Tests | ~5-8 minutes | Free tier |
| Code Quality | ~2-3 minutes | Free tier |
| PR Checks | ~1-2 minutes | Free tier |
| **Total per PR** | **~11-18 minutes** | **Free tier** |

### Optimization Tips:

1. **Use Caching**: Already configured for npm dependencies
2. **Parallel Jobs**: Independent jobs run in parallel
3. **Fail Fast**: TypeScript check before expensive E2E tests
4. **Conditional Runs**: Some checks only on PRs

---

## 🚀 Best Practices

### For Contributors:

1. **Run locally first**:
   ```bash
   cd registry
   npm run build  # Should pass
   npx tsc --noEmit  # Should have 0 prod errors
   bash scripts/e2e-test.sh  # Should pass
   ```

2. **Fix TypeScript errors** before pushing
3. **Review security audit** with `npm audit`
4. **Keep PRs focused** - smaller = faster CI

### For Maintainers:

1. **Monitor workflow success rate**
2. **Update dependencies** regularly to avoid security issues
3. **Review failing checks** promptly
4. **Add new tests** as features are added

---

## 📚 Advanced Usage

### Running Workflows Manually:

E2E Tests can be triggered manually:

1. Go to Actions tab
2. Select "E2E Tests"
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow"

### Viewing Detailed Logs:

1. Click on failed workflow run
2. Click on failed job
3. Expand failed step
4. Review error messages and logs

### Re-running Failed Checks:

GitHub provides "Re-run failed jobs" button on workflow runs.

---

## 🔐 Security Considerations

### What We Check:
- ✅ npm package vulnerabilities
- ✅ Critical CVEs
- ✅ Dependency security
- ✅ No credentials in code

### What We Don't Check (Yet):
- ⚠️ Container image scanning
- ⚠️ SAST (Static Application Security Testing)
- ⚠️ Secret scanning (basic only)

### Recommendations:
- Add Dependabot for automated dependency updates
- Consider adding Snyk or similar SAST tools
- Enable GitHub secret scanning

---

## 📝 Workflow File Locations

```
.github/workflows/
├── ci.yml              # Core CI checks
├── e2e-tests.yml       # End-to-end testing
├── code-quality.yml    # Quality metrics
├── pr-checks.yml       # PR validations
├── registry-deploy.yml # Registry deployment
├── infra-deploy.yml    # Infrastructure deployment
├── infra-preview.yml   # Preview environments
├── cli-publish.yml     # CLI publishing
└── release.yml         # Release automation
```

---

## 🎓 Learning Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Service Containers](https://docs.github.com/en/actions/using-containerized-services)

---

**Last Updated**: October 18, 2025
**Maintained By**: PRPM Team
**Status**: ✅ Production Ready
