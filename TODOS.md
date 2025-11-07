# PRPM Repository TODOs

**Last Updated**: 2025-11-07
**Total TODOs**: 22
**Fixed**: 16 ✅
**Remaining**: 6

---

## ✅ Fixed - High Priority (Security & Core Functionality)

### 1. ~~Admin Authorization Checks~~ ✅ FIXED
**Commit**: 62bb1df
**Files**: admin-cost-monitoring.ts, invites.ts, auth.ts

Applied `requireAdmin()` middleware to all 15 admin endpoints. Removed redundant auth checks from route handlers.

---

### 2. ~~Admin Checks in Invites Routes~~ ✅ FIXED
**Commit**: 62bb1df
**Files**: invites.ts

Applied `requireAdmin()` middleware to 4 invite management routes.

---

### 3. ~~Add Verified Field to JWT Payload~~ ✅ FIXED
**Commit**: 62bb1df
**Files**: types.ts, auth.ts, middleware/auth.ts

Added `verified_author` field to JWTPayload interface and all JWT sign calls.

---

## 🟡 Medium Priority (Features & Improvements)

### 4. Implement Format Conversion Parsers
**Location**: `packages/registry/src/routes/convert.ts:289`

**Issue**: Format conversion endpoint has placeholder for parsers.

**Current**:
```typescript
// TODO: Implement parsers for each format
```

**Required Fix**: Implement parsers for Continue, Windsurf, and other formats.

---

### 5. Add Organizations to Whoami Command
**Location**: `packages/cli/src/commands/whoami.ts:41`

**Issue**: Whoami command doesn't show user organizations.

**Current**:
```typescript
// TODO: Add organizations when implemented in the database
```

**Required Fix**:
1. Add organizations table/relationships in database
2. Update whoami to fetch and display organizations

---

### 6. Implement Proper Tar Extraction
**Location**: `packages/cli/src/commands/install.ts:565`

**Issue**: Using manual tar extraction instead of proper tar library.

**Current**:
```typescript
/**
 * TODO: Implement proper tar extraction with tar library
 */
```

**Required Fix**: Replace manual extraction with `tar` library (already in dependencies).

---

## 🟢 Low Priority (Tests & Nice-to-Haves)

### 7. Fix Flaky Collection Tests
**Location**: `packages/cli/src/__tests__/collections.test.ts`
**Lines**: 373, 546

**Issues**:
- Line 373: Error message changed after collection display updates
- Line 546: Passes locally but fails in CI

**Current**:
```typescript
// TODO: Fix flaky test - error message changed after collection display updates
// TODO: Fix flaky test - passes locally but fails in CI
```

**Required Fix**: Update assertions to match new error messages, investigate CI-specific failures.

---

### 8. Fix Collections Test Version Parameter
**Location**: `packages/registry/src/routes/__tests__/collections.test.ts:342`

**Issue**: Version parameter test needs proper mock handling.

**Current**:
```typescript
// TODO: Fix version parameter test - needs proper mock handling
```

**Required Fix**: Add proper mocks for version parameter tests.

---

### 9. Fix Init Test (Jest Worker Crash)
**Location**: `packages/cli/src/__tests__/init.test.ts:12`

**Issue**: Init command calls `process.exit(1)` which crashes Jest workers.

**Current**:
```typescript
// TODO KJG: Init command calls process.exit(1) which crashes Jest workers.
```

**Required Fix**: Mock `process.exit` or refactor init command to throw errors instead.

---

## 📊 Summary by Category

| Category | Count | Priority |
|----------|-------|----------|
| Security (Admin Auth) | 15 | 🔴 High |
| Core Features | 3 | 🟡 Medium |
| Tests | 4 | 🟢 Low |
| **Total** | **22** | |

---

## 🎯 Recommended Fix Order

1. **Admin Authorization Middleware** (Fixes 15 TODOs)
   - Create `requireAdmin` middleware
   - Apply to admin-cost-monitoring.ts (11 TODOs)
   - Apply to invites.ts (4 TODOs)

2. **JWT Verified Field** (Fixes 1 TODO)
   - Add `verified_author` to JWT payload
   - Update auth middleware

3. **Format Conversion Parsers** (Fixes 1 TODO)
   - Implement Continue/Windsurf parsers

4. **CLI Improvements** (Fixes 2 TODOs)
   - Add organizations to whoami
   - Implement proper tar extraction

5. **Test Fixes** (Fixes 3 TODOs)
   - Fix flaky collection tests
   - Fix version parameter test
   - Fix init test Jest crash

---

## ✅ Next Steps

Starting with highest priority: **Admin Authorization Middleware**

This single fix will resolve 15 TODOs and close a critical security gap.
