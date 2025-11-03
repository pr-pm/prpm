# Repository Pattern Migration Progress

**Date Started:** 2025-11-03
**Status:** In Progress - Phase 1 Complete
**Estimated Completion:** 20-40 hours remaining

## Overview

Migrating PRPM registry from raw SQL queries (`pg.query`) to Drizzle ORM with the Repository Pattern. This improves type safety, maintainability, and reduces SQL injection risks.

## ✅ Completed Work

### 1. Drizzle Schema Implementation (100% Complete)

All PostgreSQL tables now have corresponding Drizzle schemas:

- **packages** - `/src/db/schema/packages.ts` (with language, framework fields)
- **organizations** - `/src/db/schema/organizations.ts` (with billingEmail field)
- **users** - `/src/db/schema/users.ts`
- **collections** - `/src/db/schema/collections.ts`
- **package_installations** - `/src/db/schema/package-installations.ts` (NEW)
- **package_co_installations** - `/src/db/schema/package-installations.ts` (NEW)

**Configuration:**
- `drizzle.config.ts` - Drizzle Kit configuration for migrations
- `/src/db/schema/index.ts` - Central schema exports

**Test Coverage:**
- All schema test files updated with new fields
- Compilation verified ✅

### 2. Repository Implementation

#### Existing Repositories (Pre-work)
- **PackageRepository** - 30+ methods, comprehensive coverage
  - Location: `/src/db/repositories/package-repository.ts`
  - Methods: CRUD, search, stats, trending, verification, quality scoring

- **CollectionRepository** - Basic CRUD operations
  - Location: `/src/db/repositories/collection-repository.ts`

- **OrganizationRepository** - Basic CRUD operations
  - Location: `/src/db/repositories/organization-repository.ts`

- **UserRepository** - Basic user lookups
  - Location: `/src/db/repositories/user-repository.ts`
  - Methods: findById, findByUsername, findByEmail, findByGithubId
  - **Gap:** Lacks aggregate methods for author stats

#### New Repositories (This Session)
- **PackageInstallationRepository** - 15 methods ✅ NEW
  - Location: `/src/db/repositories/package-installation-repository.ts`
  - Methods:
    - `trackInstallation()` - Record single installation
    - `trackBatchInstallation()` - Record multiple installs with batch ID
    - `getUserInstallations()` - Get user's install history
    - `getSessionInstallations()` - Get anonymous session installs
    - `getPackageInstallCount()` - Total installs for package
    - `getRecentInstallations()` - Time-filtered installs
    - `getCoInstallations()` - "Users also installed" recommendations
    - `recordCoInstallation()` - Track package pairs
    - `recordBatchCoInstallations()` - Track all pairs in batch
    - `updateConfidenceScores()` - Recalculate recommendation confidence
    - `getInstallationStats()` - Aggregate stats (24h, 7d, 30d)
    - `getMostInstalled()` - Trending by installs
  - **Features:**
    - Anonymous session tracking
    - Co-install analysis for recommendations
    - Confidence scoring algorithm
    - Time-series analytics
  - **Status:** Compiled and ready to use ✅

#### Repository Index
- **Location:** `/src/db/repositories/index.ts`
- **Purpose:** Central export point for all repositories
- **Usage:** `import { packageRepository, userRepository } from '@/db/repositories'`

### 3. SQL Query Audit (100% Complete)

**Summary:** 75 raw SQL queries across 7 route files

| File | Query Count | Priority | Status |
|------|-------------|----------|--------|
| `invites.ts` | 21 | Medium | Pending |
| `collections.ts` | 19 | High | Pending |
| `analytics.ts` | 13 | Low | Pending |
| `author-analytics.ts` | 12 | Low | Pending |
| `packages.ts` | 4 | High | Pending |
| `authors.ts` | 4 | Medium | Pending |
| `convert.ts` | 2 | High | **BLOCKED** |

**Files with NO raw SQL queries:**
- `organizations.ts` ✅
- `users.ts` ✅
- `auth.ts` ✅
- `search.ts` ✅
- `subscriptions.ts` ✅
- `webhooks.ts` ✅
- `newsletter.ts` ✅

## 🚧 Blockers & Gaps

### Critical Blockers

1. **Missing Schema: package_versions**
   - Table exists in PostgreSQL (migrations 001, 002, etc.)
   - No Drizzle schema file
   - Blocks: `convert.ts` refactoring (2 queries join packages + package_versions)
   - **Action Required:** Create `/src/db/schema/package-versions.ts`

2. **Missing Repository: invites**
   - Table exists (organization_member_invites)
   - No repository implementation
   - Blocks: `invites.ts` refactoring (21 queries)
   - **Action Required:** Create `/src/db/repositories/invite-repository.ts`

### Repository Method Gaps

Existing repositories lack methods for complex queries:

1. **UserRepository** - Missing aggregate methods:
   ```typescript
   // Needed by authors.ts:
   - getAuthorStats(userId: string) // SUM downloads, COUNT packages, AVG rating
   - getAuthorProfile(username: string) // Case-insensitive lookup
   ```

2. **PackageRepository** - Missing advanced filters:
   ```typescript
   // Needed by authors.ts:
   - getByAuthorWithVisibility(authorId: string, includePrivate: boolean, sort, pagination)
   - getUnclaimedByAuthorName(username: string) // Pattern matching on name
   ```

3. **All Repositories** - Missing patterns:
   - Aggregate functions (SUM, COUNT, AVG, weighted averages)
   - Dynamic ORDER BY (currently some routes use string interpolation - security risk)
   - Conditional WHERE clauses based on auth context
   - Time-series grouping (for analytics)

## 📋 Remaining Work

### Phase 2: High-Value Routes (Recommended Next)

#### Task 1: Create package_versions Schema
**Estimated Time:** 30 minutes
**Files to Create:**
- `/src/db/schema/package-versions.ts`

**Schema Fields (from migration 001):**
```typescript
{
  id: uuid (PK)
  packageId: uuid (FK -> packages.id)
  version: varchar(50)
  canonicalFormat: jsonb
  tarballUrl: varchar(500)
  tarballHash: varchar(100)
  size: integer
  publishedAt: timestamp
  downloadCount: integer
}
```

**Add to:** `/src/db/schema/index.ts`

#### Task 2: Create PackageVersionRepository
**Estimated Time:** 1 hour
**Location:** `/src/db/repositories/package-version-repository.ts`

**Required Methods:**
```typescript
- findByPackageAndVersion(packageId: string, version: string)
- findLatestVersion(packageId: string)
- getVersionHistory(packageId: string)
- create(data: NewPackageVersion)
- incrementDownloadCount(id: string)
```

#### Task 3: Refactor convert.ts (2 queries)
**Estimated Time:** 1 hour
**Complexity:** Medium
**SQL Queries:**
1. Line 54-64: GET package + version for download
2. Line 165-176: GET package + version for tarball

**Strategy:**
```typescript
// Replace:
const result = await server.pg.query(`SELECT p.*, pv.* FROM packages p JOIN...`)

// With:
const pkg = await packageRepository.findById(id);
const version = await packageVersionRepository.findByPackageAndVersion(pkg.id, version);
```

#### Task 4: Refactor packages.ts (4 queries)
**Estimated Time:** 2 hours
**Complexity:** Low-Medium
**Note:** This is core functionality, heavily used

**SQL Query Locations:**
- Review with `grep -n "pg\.query" packages.ts`
- Most likely package lookups and updates during publish flow

### Phase 3: Medium Priority Routes

#### Task 5: Refactor authors.ts (4 queries)
**Estimated Time:** 2-3 hours
**Complexity:** Medium

**Required New Repository Methods:**

In `UserRepository`:
```typescript
async getAuthorProfile(username: string) {
  // Case-insensitive lookup
  // Returns: id, username, verified_author, github_username, avatar_url, website
}
```

In `PackageRepository`:
```typescript
async getAuthorStats(authorId: string, visibility: 'public' | 'all') {
  // Aggregate: COUNT(*), SUM(downloads), SUM(ratings), weighted avg rating
}

async getAuthorPackages(
  authorId: string,
  visibility: 'public' | 'all',
  sort: 'downloads' | 'recent' | 'name',
  limit: number,
  offset: number
) {
  // Dynamic sorting, pagination, visibility filtering
}

async getUnclaimedByAuthorName(username: string) {
  // WHERE (name LIKE 'username/%' OR name LIKE '@username/%')
  // AND author_id IS NULL
}
```

#### Task 6: Refactor invites.ts (21 queries)
**Estimated Time:** 4-5 hours
**Complexity:** High
**Blocker:** Need InviteRepository

**Steps:**
1. Create `/src/db/schema/invites.ts` (if not exists)
2. Create `/src/db/repositories/invite-repository.ts`
3. Implement 21 query replacements

#### Task 7: Refactor collections.ts (19 queries)
**Estimated Time:** 3-4 hours
**Complexity:** Medium-High

**Note:** CollectionRepository exists but likely needs enhancement for:
- Version management
- Package collection relationships
- Installation tracking

### Phase 4: Analytics Routes (Low Priority)

These routes work fine with raw SQL. Defer unless needed:

- **analytics.ts** - 13 queries (time-series, complex aggregations)
- **author-analytics.ts** - 12 queries (user-specific analytics)

**Estimated Time:** 6-8 hours each
**Complexity:** Very High (complex time-series queries, window functions, aggregations)

## 🎯 Recommended Migration Path

### Option A: Quick Wins First (Recommended)
**Goal:** Get visible user-facing features on repository pattern quickly

1. ✅ Create package_versions schema (30 min)
2. ✅ Create PackageVersionRepository (1 hr)
3. ✅ Refactor convert.ts - 2 queries (1 hr)
4. ✅ Refactor packages.ts - 4 queries (2 hrs)
5. ⏳ Enhance UserRepository + PackageRepository (2 hrs)
6. ⏳ Refactor authors.ts - 4 queries (2 hrs)

**Total Time:** ~8-9 hours
**Impact:** Core package functionality fully on repository pattern

### Option B: Complete by Module
**Goal:** Finish entire modules before moving on

1. Users module (authors.ts + user enhancements) - 4-5 hrs
2. Packages module (packages.ts + convert.ts + versions) - 4-5 hrs
3. Collections module (collections.ts) - 3-4 hrs
4. Invites module (invites.ts + repository) - 4-5 hrs
5. Analytics (defer) - 14-16 hrs

**Total Time:** ~16-19 hours (excluding analytics)

### Option C: Complexity-Based
**Goal:** Build confidence with simple routes first

1. ✅ convert.ts - 2 queries (easiest)
2. ✅ packages.ts - 4 queries (moderate)
3. ✅ authors.ts - 4 queries (moderate)
4. ⏳ analytics.ts - 13 queries (hard)
5. ⏳ author-analytics.ts - 12 queries (hard)
6. ⏳ collections.ts - 19 queries (very hard)
7. ⏳ invites.ts - 21 queries (very hard)

## 🧪 Testing Strategy

After each route refactor:

1. **Unit Tests:** Test new repository methods
   - Location: `/src/db/repositories/__tests__/`
   - Pattern: Mirror existing test files

2. **Integration Tests:** Test route endpoints
   - Location: `/src/routes/__tests__/`
   - Update existing test files

3. **Manual Testing:**
   - Start registry: `npm run dev`
   - Test affected endpoints with curl/Postman
   - Verify response structure unchanged

4. **Build Verification:**
   ```bash
   cd /Users/khaliqgant/Projects/prpm/app/packages/registry
   npm run build
   ```

## 📝 Code Patterns

### Before (Raw SQL):
```typescript
const result = await server.pg.query(
  `SELECT * FROM packages WHERE id = $1`,
  [packageId]
);
const pkg = result.rows[0];
```

### After (Repository):
```typescript
const pkg = await packageRepository.findById(packageId);
```

### Complex Queries:
For queries with aggregations/joins, add repository method:

```typescript
// In PackageRepository
async getAuthorStats(authorId: string, includePrivate: boolean = false) {
  const conditions: SQL[] = [eq(packages.authorId, authorId)];

  if (!includePrivate) {
    conditions.push(eq(packages.visibility, 'public'));
  }

  const result = await db
    .select({
      totalPackages: sql<number>`count(*)::int`,
      totalDownloads: sql<number>`sum(${packages.totalDownloads})::int`,
      avgRating: sql<number>`avg(${packages.ratingAverage})`,
    })
    .from(packages)
    .where(and(...conditions));

  return result[0];
}
```

## 🔒 Security Improvements

Current raw SQL has security concerns:

1. **String Interpolation in ORDER BY:**
   ```typescript
   // UNSAFE:
   const orderBy = sortMap[sort] || 'total_downloads DESC';
   const query = `SELECT * FROM packages ORDER BY ${orderBy}`;

   // SAFE (Repository):
   const orderByColumn = sort === 'downloads'
     ? desc(packages.totalDownloads)
     : desc(packages.createdAt);
   ```

2. **Dynamic WHERE Clauses:**
   ```typescript
   // UNSAFE:
   const visibilityFilter = isOwner ? `visibility IN ('public', 'private')` : `visibility = 'public'`;
   const query = `SELECT * FROM packages WHERE ${visibilityFilter}`;

   // SAFE (Repository):
   const conditions = isOwner
     ? [or(eq(packages.visibility, 'public'), eq(packages.visibility, 'private'))]
     : [eq(packages.visibility, 'public')];
   ```

## 📚 Reference Documentation

### Drizzle ORM Docs
- Queries: https://orm.drizzle.team/docs/select
- Aggregations: https://orm.drizzle.team/docs/sql#aggregate-functions
- Joins: https://orm.drizzle.team/docs/joins

### Existing Patterns
- Study `PackageRepository` for comprehensive examples
- Pattern: One repository per table
- Pattern: Export singleton instance: `export const repoRepository = new RepoRepository()`

### Key Files
- **Schema:** `/src/db/schema/*.ts`
- **Repositories:** `/src/db/repositories/*.ts`
- **DB Connection:** `/src/db/db.ts`
- **Routes:** `/src/routes/*.ts`

## 🐛 Known Issues

1. **TypeScript**: Drizzle query builder doesn't support conditional `.limit()` calls
   - **Solution:** Use default values instead of optional parameters
   - **Example:** `async method(limit: number = 100)` instead of `async method(limit?: number)`

2. **Indexes**: Drizzle schema doesn't support `DESC` in index definitions
   - **Workaround:** DESC ordering handled by PostgreSQL migration SQL
   - **Note:** Document this in schema comments

3. **Composite Types**: Some PostgreSQL columns use custom types (tsvector, etc.)
   - **Solution:** Use `sql` template for custom types
   - **Example:** `searchVector: sql<string>\`tsvector\``

## 📊 Progress Tracking

**Total Queries:** 75
**Migrated:** 0 (0%)
**Blocked:** 2 (convert.ts)
**Deferred:** 25 (analytics routes)
**Remaining:** 48 (64%)

**Estimated Completion:**
- Phase 2 (High-Value): 8-9 hours
- Phase 3 (Medium Priority): 10-12 hours
- Phase 4 (Analytics): 14-16 hours (optional)
- **Total:** 32-37 hours (excluding analytics: 18-21 hours)

## 🚀 Next Session Checklist

**Resume with:**
1. ✅ Read this document
2. ✅ Decide on migration path (Option A recommended)
3. ✅ Start with: Create package_versions schema
4. ✅ Then: Create PackageVersionRepository
5. ✅ Then: Refactor convert.ts

**Quick start command:**
```bash
cd /Users/khaliqgant/Projects/prpm/app/packages/registry
npm run build  # Verify everything still compiles
npm run dev    # Start registry for testing
```

## 📞 Questions for Next Session

1. **Scope:** Do you want to include analytics routes, or defer them indefinitely?
2. **Testing:** Should I write tests for each new repository method, or just integration tests?
3. **Breaking Changes:** Can I change method signatures for consistency, or must they match current SQL exactly?
4. **Performance:** Should I add caching to repository methods, or handle that at route level?

---

**Last Updated:** 2025-11-03
**Author:** Claude Code
**Session:** Repository Pattern Migration - Phase 1
