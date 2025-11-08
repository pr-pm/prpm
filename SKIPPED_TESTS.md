# PRPM Skipped Tests Audit

**Last Updated**: 2025-11-07 (Updated after CI investigation)
**Total Skipped**: 46 tests
**Status**: ⚠️ **20 CLI tests require architectural refactoring to test**

## ⚠️ Update: Tests Reverted (Commit 33aad3c)

Initial attempt to re-enable tests failed in CI due to architectural issues.
Tests work locally but fail in GitHub Actions parallel workers.

**Root Cause**: `process.exit()` mocking is unreliable in Jest CI environments
**Solution**: Requires refactoring CLI commands to throw errors instead of calling process.exit()
**Impact**: 20 CLI tests remain skipped until architectural refactoring is complete
**Reference**: See PR #108 for detailed analysis and solution options

---

## 📊 Final Summary

| Category | Original | Fixed | Remaining | Status |
|----------|----------|-------|-----------|--------|
| **CLI Tests** | 20 | 0 | 20 | 🔴 **Requires refactoring** |
| **Registry API Tests** | 9 | 0 | 9 | 🟡 Medium (unfixed) |
| **Search Tests (DB)** | 26 | 0 | 26 | 🟢 Acceptable (conditional skipIf) |
| **E2E Test Suites** | 4 | 0 | 4 | 🟡 Medium (unfixed) |
| **TOTAL** | **46** | **0** | **46** | **20 blocked by architecture, 26 acceptable** |

---

## 🔴 BLOCKED - All 20 Critical CLI Tests (Architectural Issue)

These tests were temporarily re-enabled (commit 1a40906) but **reverted** (commit 33aad3c) due to CI failures.

**The Problem**: All CLI commands use `process.exit()` for error handling, which cannot be reliably mocked in Jest, especially in GitHub Actions parallel workers. Tests pass locally but fail in CI.

**Architectural Solutions Required**:
1. Refactor CLI commands to throw errors instead of calling `process.exit()`
2. Extract business logic from CLI layer and test separately
3. Use dependency injection to inject exit behavior (testable in mocks)

### 🔴 1. Publish Command Tests (publish.test.ts)
- **Status**: SKIPPED - Requires architectural refactoring
- **File**: `packages/cli/src/__tests__/publish.test.ts`
- **Why skipped**: CLI calls `process.exit()` which crashes Jest workers in CI
- **Tests affected**: Entire test suite (publish workflow)

### 🔴 2. Install Command Tests (install.test.ts)
- **Status**: SKIPPED - Requires architectural refactoring
- **File**: `packages/cli/src/__tests__/install.test.ts`
- **Why skipped**: CLI calls `process.exit()` which crashes Jest workers in CI
- **Tests affected**:
  - `describe('basic installation')` - package installation tests
  - `describe('lockfile handling')` - lockfile operation tests
  - `describe('type overrides')` - format conversion tests

### 🔴 3. Install from Lockfile Tests (install-from-lockfile.test.ts)
- **Status**: SKIPPED - Requires architectural refactoring
- **File**: `packages/cli/src/__tests__/install-from-lockfile.test.ts`
- **Why skipped**: CLI calls `process.exit()` which crashes Jest workers in CI
- **Tests affected** (6 tests):
  1. Install package from lockfile
  2. Preserve format from lockfile
  3. Install all packages from lockfile
  4. Handle partial failures gracefully
  5. Respect --as option to override lockfile format
  6. Force reinstall packages from lockfile

### 🔴 4. Collections Tests (collections.test.ts)
- **Status**: SKIPPED - Requires architectural refactoring
- **File**: `packages/cli/src/__tests__/collections.test.ts`
- **Why skipped**: CLI calls `process.exit()` which crashes Jest workers in CI
- **Tests affected** (3 tests):
  - Line 377: Invalid collection format handling
  - Line 550: Validate packages array is not empty
  - Line 598: Successfully publish valid collection

### 🔴 5. Init Command Tests (init.test.ts)
- **Status**: SKIPPED - Requires architectural refactoring
- **File**: `packages/cli/src/__tests__/init.test.ts`
- **Why skipped**: CLI calls `process.exit()` which crashes Jest workers in CI
- **Tests affected**: Entire test suite (init command workflow)

---

## 🟢 Acceptable - Database-Dependent Tests (26 tests)

**File**: `packages/registry/src/search/__tests__/postgres-search.test.ts`

All 26 tests use **conditional skipping** with `it.skipIf(!dbAvailable)`:
- ✅ This is the **correct pattern** for integration tests
- ✅ Tests run when database is available
- ✅ Tests skip gracefully when database is not available
- ✅ No action needed

**Categories**:
- Filtering tests (5): format, tags, category, combined filters
- Search tests (3): text query, combined with filters
- Status filters (3): verified, featured, combined
- Sorting tests (4): downloads, quality, rating, created date
- Pagination tests (3): limit, offset, edge cases

---

## 🟡 Medium Priority - Remaining Skipped Tests (13 tests)

These are less critical but should eventually be addressed:

### Registry API Tests (9 tests)

1. **collections.test.ts:343** - Version parameter test
   - TODO: "Fix version parameter test - needs proper mock handling"

2. **invites.test.ts:52** - Valid pending invite details
   - No clear reason for skip

3. **users.test.ts:199** - Filter by visibility
   - No clear reason for skip

4. **users.test.ts:208** - Support sorting
   - No clear reason for skip

5. **packages.test.ts:235-247** - Package scoping tests (4 tests)
   - Auto-prefix unscoped package name
   - Preserve existing @author/ scope
   - Use organization scope
   - Prevent publishing to other authors' scope
   - No clear reason for skips

### E2E Test Suites (4 suites)

1. **search.e2e.test.ts** - Search command E2E tests
2. **auth.e2e.test.ts** - Auth commands E2E tests
3. **install.e2e.test.ts** - Install command E2E tests
4. **publish.e2e.test.ts** - Publish command E2E tests

**Status**: All entire suites skipped  
**Reason**: E2E tests require full environment setup  
**Priority**: Medium - E2E coverage is valuable but not critical with good unit tests

---

## 📋 Recommended Next Steps

### 🔴 Phase 1: Critical - CLI Architectural Refactoring (REQUIRED)
**Effort**: Medium - Requires changes to command architecture
**Impact**: Enables testing of 20 critical CLI tests

**Options**:
1. **Refactor commands to throw errors** (Recommended)
   - Change all `process.exit()` calls to `throw new Error()`
   - Move `process.exit()` to top-level CLI wrapper only
   - Allows Jest to catch errors instead of exiting

2. **Extract business logic from CLI layer**
   - Separate command logic from CLI concerns
   - Test business logic independently
   - CLI becomes thin wrapper

3. **Dependency injection for exit behavior**
   - Inject exit function into commands
   - Mock exit function in tests
   - More invasive change

**Reference**: See PR #108 for detailed analysis

### 🟡 Phase 2: Medium Priority (Optional)
1. Fix registry API tests (9 tests) - Lower risk, feature-specific
2. Evaluate E2E test infrastructure - Determine if environment setup is worth it

### 🟢 Phase 3: Low Priority (No Action Needed)
- ✅ Postgres search tests - Already properly handled with conditional skips

---

## 📊 Current Status

- 🔴 **20 CLI tests blocked** - Architectural refactoring required
- 🟢 **26 DB tests acceptable** - Conditional skipIf pattern is correct
- 🟡 **13 other tests** - Medium priority (registry API + E2E)

**Result**: Security fixes complete. Test re-enabling blocked by architectural issue.

---

## 💡 Key Learnings

1. **process.exit() mocking unreliable in CI** - Works locally, fails in GitHub Actions parallel workers
2. **Architectural issue discovered** - CLI commands need refactoring to be testable
3. **Conditional skips (skipIf) are acceptable** - Proper pattern for environment-dependent tests
4. **Quick fixes not always possible** - Some issues require architectural changes

**Next action**: Refactor CLI commands to enable comprehensive test coverage
