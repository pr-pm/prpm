# PRPM Skipped Tests Audit

**Last Updated**: 2025-11-07
**Total Skipped**: 46 tests (including entire test suites)
**Status**: 🔴 High volume of skipped tests

---

## 📊 Summary by Category

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| **Registry Tests** | 9 | 🟡 Medium | Individual tests |
| **Search Tests (DB-dependent)** | 26 | 🟢 Low | Conditional (skipIf) |
| **CLI Tests** | 7 | 🔴 High | Individual tests |
| **E2E Tests** | 4 suites | 🟡 Medium | Entire suites |
| **Total** | **46** | | |

---

## 🔴 Critical - CLI Tests (Should Be Fixed)

### 1. Collections Tests
**File**: `packages/cli/src/__tests__/collections.test.ts`

#### Line 377: Invalid Collection Format
```typescript
it.skip('should handle invalid collection format', async () => {
```
**Why Skipped**: Likely TODO comment says "Fix flaky test - error message changed after collection display updates"
**Impact**: ⚠️ Can't verify error handling for malformed collections
**Fix Priority**: HIGH - Error handling validation is critical

---

#### Line 550: Validate Non-Empty Packages
```typescript
it.skip('should validate packages array is not empty', async () => {
```
**Why Skipped**: Likely TODO comment says "Fix flaky test - passes locally but fails in CI"
**Impact**: ⚠️ Can't verify validation of empty package arrays
**Fix Priority**: HIGH - Input validation is critical

---

#### Line 598: Publish Valid Collection
```typescript
it.skip('should successfully publish valid collection', async () => {
```
**Why Skipped**: Unknown - this is a core feature test
**Impact**: 🚨 Can't verify successful collection publishing
**Fix Priority**: CRITICAL - Core functionality untested

---

### 2. Collections Publish Integration Test
**File**: `packages/cli/src/__tests__/collections-publish.integration.test.ts`

#### Line 343: Fixture Content Validation
```typescript
describe.skip('Fixture Content Validation', () => {
```
**Why Skipped**: Unknown - entire suite disabled
**Impact**: ⚠️ Can't verify fixture data integrity
**Fix Priority**: MEDIUM - Integration test validation

---

### 3. Publish Command Tests
**File**: `packages/cli/src/__tests__/publish.test.ts`

#### Line 29: Entire Publish Suite
```typescript
describe.skip('Publish Command', () => {
```
**Why Skipped**: Unknown - ENTIRE publish test suite disabled
**Impact**: 🚨 CRITICAL - Core publishing functionality completely untested
**Fix Priority**: CRITICAL - This is a major gap

---

### 4. Install from Lockfile Tests
**File**: `packages/cli/src/__tests__/install-from-lockfile.test.ts`

All 6 tests skipped:
- Line 119: Install package from lockfile
- Line 164: Preserve format from lockfile
- Line 205: Install all packages from lockfile
- Line 262: Handle partial failures gracefully
- Line 315: Respect --as option to override format
- Line 356: Force reinstall packages from lockfile

**Why Skipped**: Unknown - entire lockfile installation feature untested
**Impact**: 🚨 Can't verify lockfile-based installation (like package-lock.json)
**Fix Priority**: HIGH - Important workflow untested

---

### 5. Install Tests
**File**: `packages/cli/src/__tests__/install.test.ts`

3 entire describe blocks skipped:
- Line 80: `describe.skip('basic installation', () => {`
- Line 209: `describe.skip('lockfile handling', () => {`
- Line 286: `describe.skip('type overrides', () => {`

**Why Skipped**: Unknown - major installation features untested
**Impact**: 🚨 Core installation features have no tests running
**Fix Priority**: CRITICAL

---

### 6. Init Tests
**File**: `packages/cli/src/__tests__/init.test.ts`

#### Line 14: Entire Init Suite
```typescript
describe.skip('prpm init command', () => {
```
**Why Skipped**: Has TODO comment: "Init command calls process.exit(1) which crashes Jest workers"
**Impact**: ⚠️ Can't verify project initialization
**Fix Priority**: MEDIUM - Need to mock process.exit

---

## 🟡 Medium Priority - Registry Tests

### 1. Collections API Test
**File**: `packages/registry/src/routes/__tests__/collections.test.ts`

#### Line 343: Version Parameter Support
```typescript
it.skip('should support version parameter', async () => {
```
**Why Skipped**: Has TODO: "Fix version parameter test - needs proper mock handling"
**Impact**: ⚠️ Version parameter functionality untested
**Fix Priority**: MEDIUM - Need better mocks

---

### 2. Invites API Test
**File**: `packages/registry/src/routes/__tests__/invites.test.ts`

#### Line 52: Valid Pending Invite
```typescript
it.skip('should return invite details for valid pending invite', async () => {
```
**Why Skipped**: Unknown
**Impact**: ⚠️ Can't verify invite retrieval
**Fix Priority**: MEDIUM

---

### 3. Users API Tests
**File**: `packages/registry/src/routes/__tests__/users.test.ts`

#### Line 199: Filter by Visibility
```typescript
it.skip('should filter by visibility', async () => {
```
**Impact**: ⚠️ Visibility filtering untested
**Fix Priority**: MEDIUM

#### Line 208: Support Sorting
```typescript
it.skip('should support sorting', async () => {
```
**Impact**: ⚠️ Sorting functionality untested
**Fix Priority**: MEDIUM

---

### 4. Packages API Tests
**File**: `packages/registry/src/routes/__tests__/packages.test.ts`

4 tests skipped related to package scoping:
- Line 235: Auto-prefix unscoped package name with @username/
- Line 239: Preserve existing @author/ scope
- Line 243: Use organization scope when organization specified
- Line 247: Prevent publishing to other authors' scope

**Why Skipped**: Unknown - scoping functionality untested
**Impact**: ⚠️ Can't verify package naming/scoping rules
**Fix Priority**: MEDIUM - Important for multi-tenant security

---

## 🟢 Low Priority - Database-Dependent Tests

### Postgres Search Tests
**File**: `packages/registry/src/search/__tests__/postgres-search.test.ts`

**26 tests** using `it.skipIf(!dbAvailable)` - These are **conditional skips**, not permanently disabled:

**Filtering Tests (5):**
- Line 83: Return all public packages when query is empty
- Line 90: Filter by format with empty query
- Line 102: Filter by tags with empty query
- Line 113: Filter by category with empty query
- Line 124: Combine format and tags filters

**Search Tests (3):**
- Line 151: Search by text query
- Line 163: Combine text query with format filter
- Line 174: Combine text query with tags filter

**Status Filters (3):**
- Line 198: Filter by verified status
- Line 209: Filter by featured status
- Line 220: Combine verified and featured filters

**Sorting Tests (4):**
- Line 245: Sort by downloads (default)
- Line 257: Sort by quality score
- Line 269: Sort by rating
- Line 281: Sort by created date

**Pagination Tests (3):**
- Line 307: Respect limit parameter
- Line 319: Respect offset parameter
- Line 330: Handle offset beyond total

**Why Skipped**: Only run when database is available (`skipIf(!dbAvailable)`)
**Impact**: ✅ These are integration tests that require DB setup - this is acceptable
**Fix Priority**: LOW - These are properly handled with conditional skips

---

## 🟡 Medium Priority - E2E Test Suites

### 1. Search E2E Tests
**File**: `packages/cli/src/__tests__/e2e/search.e2e.test.ts`

#### Line 20: Entire Suite
```typescript
describe.skip('Search Command - E2E Tests', () => {
```
**Why Skipped**: E2E tests require full environment
**Impact**: ⚠️ Search command end-to-end flow untested
**Fix Priority**: MEDIUM

---

### 2. Auth E2E Tests
**File**: `packages/cli/src/__tests__/e2e/auth.e2e.test.ts`

#### Line 28: Entire Suite
```typescript
describe.skip('Auth Commands - E2E Tests', () => {
```
**Why Skipped**: E2E tests require full environment
**Impact**: ⚠️ Auth flow end-to-end untested
**Fix Priority**: MEDIUM

---

### 3. Install E2E Tests
**File**: `packages/cli/src/__tests__/e2e/install.e2e.test.ts`

#### Line 22: Entire Suite
```typescript
describe.skip('Install Command - E2E Tests', () => {
```
**Why Skipped**: E2E tests require full environment
**Impact**: ⚠️ Install command end-to-end flow untested
**Fix Priority**: MEDIUM

---

### 4. Publish E2E Tests
**File**: `packages/cli/src/__tests__/e2e/publish.e2e.test.ts`

#### Line 22: Entire Suite
```typescript
describe.skip('Publish Command - E2E Tests', () => {
```
**Why Skipped**: E2E tests require full environment
**Impact**: ⚠️ Publish command end-to-end flow untested
**Fix Priority**: MEDIUM

---

## 🚨 Critical Issues Identified

### 1. Publish Command Has NO Unit Tests Running
- **File**: `packages/cli/src/__tests__/publish.test.ts`
- **Entire test suite is skipped**
- This is a **core feature** with zero test coverage
- **Action Required**: Immediate investigation and re-enable

### 2. Install Command Heavily Untested
- **Files**: `install.test.ts`, `install-from-lockfile.test.ts`
- **Multiple describe blocks skipped**
- Core installation workflows have no coverage
- **Action Required**: Investigate why these were disabled

### 3. Collections Publishing Untested
- **File**: `collections.test.ts`
- **Core publishing test is skipped** (line 598)
- Collection feature has incomplete coverage
- **Action Required**: Fix and re-enable

---

## 📋 Recommended Action Plan

### Phase 1: Critical (Immediate)
1. **Investigate and fix publish.test.ts** - Entire suite disabled
2. **Investigate and fix install.test.ts** - Multiple suites disabled
3. **Fix collections publishing test** - Core feature untested

### Phase 2: High Priority
4. **Fix install-from-lockfile tests** - Important workflow
5. **Fix init test** - Mock process.exit properly
6. **Fix collections validation tests** - Error handling critical

### Phase 3: Medium Priority
7. **Fix package scoping tests** - Security implications
8. **Fix registry API tests** - Feature completeness
9. **Evaluate E2E test infrastructure** - Determine if needed

### Phase 4: Low Priority
10. **Postgres search tests** - Already properly handled with conditional skips

---

## 💡 Notes

- **Conditional skips** (`skipIf`) are acceptable for environment-dependent tests
- **Hard skips** (`it.skip`, `describe.skip`) should be temporary and tracked
- **26 out of 46** skipped tests are acceptable (conditional DB tests)
- **20 hard-skipped tests** need investigation and fixing
- **Focus on CLI tests first** - these affect end users directly

---

## ✅ Success Metrics

Once fixed, we should have:
- ✅ Publish command fully tested
- ✅ Install command fully tested
- ✅ Collections feature fully tested
- ✅ Init command testable (with mocked process.exit)
- ✅ All hard-skipped tests either fixed or documented why they remain skipped
