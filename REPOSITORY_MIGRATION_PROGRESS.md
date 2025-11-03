# Repository Pattern Migration Progress

**Date Started:** 2025-11-03
**Last Updated:** 2025-11-03
**Status:** In Progress - Phase 2 Complete, Phase 3 Infrastructure Ready
**Estimated Completion:** 10-15 hours remaining (route refactoring only)

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

### 3. SQL Query Audit & Migration Status

**Summary:** 75 raw SQL queries total → 10 migrated (13% complete)

| File | Query Count | Priority | Status |
|------|-------------|----------|--------|
| `convert.ts` | 2 | High | ✅ **COMPLETE** |
| `packages.ts` | 4 | High | ✅ **COMPLETE** |
| `authors.ts` | 4 | Medium | ✅ **COMPLETE** |
| `collections.ts` | 19 | High | 🚧 **INFRASTRUCTURE READY** |
| `invites.ts` | 21 | Medium | Pending |
| `analytics.ts` | 13 | Low (Deferred) | Pending |
| `author-analytics.ts` | 12 | Low (Deferred) | Pending |

**Files with NO raw SQL queries:**
- `organizations.ts` ✅
- `users.ts` ✅
- `auth.ts` ✅
- `search.ts` ✅
- `subscriptions.ts` ✅
- `webhooks.ts` ✅
- `newsletter.ts` ✅

**Migration Progress by Phase:**
- Phase 1: Schema Setup - ✅ 100% Complete
- Phase 2: Core Package Routes - ✅ 100% Complete (10/10 queries)
- Phase 3: Collections Infrastructure - ✅ 100% Complete (schemas + repos)
- Phase 3: Collections Routes - 🚧 0% Complete (0/19 queries) - Ready to start
- Phase 4: Remaining Routes - ⏳ Pending

## 🎯 Phase 2 Complete: Core Package Routes (✅ Done)

### Completed Routes (10 queries migrated)

#### 1. **convert.ts** - Format Conversion (2 queries) ✅
- **Route:** `GET /:id/download` - Download package in different format
- **Route:** `GET /:id/tarball` - Download tarball
- **Repository Used:** `packageRepository`, `packageVersionRepository`
- **Key Changes:**
  - Replaced raw SQL joins with repository methods
  - Separate package and version lookups with conditional logic for 'latest'
  - Type-safe merging of package + version data

#### 2. **packages.ts** - Package Management (4 queries) ✅
- **Route:** `GET /:id/related` - Get related packages via co-installations (2 queries)
- **Route:** `POST /installations/track` - Track package installs (2 queries)
- **Repositories Used:** `packageRepository`, `packageInstallationRepository`
- **Key Changes:**
  - UUID-first lookup with name fallback
  - Co-installation query uses repository + Promise.all for package details
  - Installation tracking via dedicated repository method

#### 3. **authors.ts** - Author Profiles (4 queries) ✅
- **Route:** `GET /:username` - Author profile with stats and packages (3 queries)
- **Route:** `GET /:username/unclaimed` - Unclaimed packages by author (1 query)
- **Repositories Used:** `userRepository`, `packageRepository`
- **Repository Enhancements:**
  - Added `userRepository.findByUsernameCaseInsensitive()`
  - Added `packageRepository.getAuthorStats()` - aggregate stats
  - Added `packageRepository.getAuthorPackages()` - with sorting/pagination
  - Added `packageRepository.getUnclaimedByAuthorName()` - pattern matching

### Phase 2 Impact
- **Routes Migrated:** 3 files (convert.ts, packages.ts, authors.ts)
- **Queries Eliminated:** 10 raw SQL queries
- **Type Safety:** 100% - All queries now use Drizzle schemas
- **New Repositories:** PackageVersionRepository (10 methods)
- **Repository Enhancements:** UserRepository (+1 method), PackageRepository (+3 methods)

## 🏗️ Phase 3 In Progress: Collections (Infrastructure Complete)

### Completed Infrastructure (100% Ready)

#### New Schemas Created
1. **collectionPackages** - Join table for packages in collections
   - Composite PK: (collection_id, package_id)
   - Fields: packageVersion, required, reason, installOrder
   - Cascade deletes on collection/package removal

2. **collectionInstalls** - Installation tracking for collections
   - Fields: collectionId, userId, format, installedAt
   - Indexed on collection and user

3. **collectionStars** - User starring/favoriting
   - Composite PK: (collection_id, user_id)
   - Cascade deletes on both sides

#### New Repositories Created
1. **CollectionPackageRepository** (8 methods)
   - `getPackagesByCollection()` - Basic join table data
   - `getPackagesWithDetails()` - ⭐ **Full package info with versions via joins**
   - `findByCollectionAndPackage()` - Check membership
   - `addPackage()` / `addPackages()` - Single/bulk insert
   - `removePackage()` / `removeAllPackages()` - Delete operations
   - `countByCollection()` - Package count aggregation

2. **CollectionInstallRepository** (1 method)
   - `trackInstall()` - Record collection installations

3. **CollectionStarRepository** (4 methods)
   - `addStar()` - Idempotent star creation (ON CONFLICT DO NOTHING)
   - `removeStar()` - Idempotent star removal
   - `getStarCount()` - Aggregate star count
   - `hasUserStarred()` - Boolean check

#### Enhanced CollectionRepository (+4 methods)
1. **`searchWithDetails()`** - ⭐ Enhanced search with author username and package count
   - Joins with users table for author
   - Subquery for package count
   - Supports all existing filters + author filter
   - Returns enriched collection objects

2. **`findBySlugWithAuthor()`** - Collection details with author username
   - Left join with users table
   - Returns collection + author field

3. **`findBestMatchByNameSlug()`** - Smart collection matching
   - Searches across all scopes
   - Orders by official DESC, verified DESC, downloads DESC
   - Used by install endpoint for "collection" scope

4. **`getFeaturedWithDetails()`** - Featured collections with enriched data
   - Official + verified only
   - Includes author username and package count

### Collections Route Mapping (Ready to Implement)

**19 queries → 9 routes** (All infrastructure ready)

| Route | Queries | Repository Methods Ready |
|-------|---------|-------------------------|
| GET `/collections` | 2 | ✅ `searchWithDetails()` |
| GET `/collections/:scope/:slug` | 2 | ✅ `findBySlugWithAuthor()`, `getPackagesWithDetails()` |
| POST `/collections` | 4 | ✅ `findBySlug()`, `findByName()`, `create()`, `addPackages()` |
| POST `/collections/:scope/:slug/install` | 4 | ✅ `findBestMatchByNameSlug()`, `findBySlug()`, `getPackagesWithDetails()`, `trackInstall()` |
| POST `/collections/:scope/:slug/star` | 4 | ✅ `findBySlug()`, `addStar()`, `removeStar()`, `getStarCount()` |
| GET `/collections/featured` | 1 | ✅ `getFeaturedWithDetails()` |
| GET `/collections/:scope/:slug/:version` | 2 | ✅ `findBySlugWithAuthor()`, `getPackagesWithDetails()` |

### Testing Checklist
- **Document Created:** `COLLECTIONS_TESTING_CHECKLIST.md`
- **Test Cases:** 95 detailed test cases
- **Coverage:** All 9 endpoints, database integrity, performance, security
- **Ready for QA:** ✅ Yes

## 🚧 Blockers & Gaps

### Critical Blockers (All Resolved! ✅)

1. ~~**Missing Schema: package_versions**~~ ✅ RESOLVED
   - **Solution:** Created `/src/db/schema/package-versions.ts`
   - Includes all fields: version, description, changelog, tarballUrl, dependencies, etc.
   - Exported from schema index

2. ~~**Missing Schema: collection_packages**~~ ✅ RESOLVED
   - **Solution:** Added to `/src/db/schema/collections.ts`
   - Composite PK, cascade deletes configured

3. ~~**Missing Schema: collection_installs**~~ ✅ RESOLVED
   - **Solution:** Added to `/src/db/schema/collections.ts`

4. ~~**Missing Schema: collection_stars**~~ ✅ RESOLVED
   - **Solution:** Added to `/src/db/schema/collections.ts`

### Non-Critical Gaps

1. **Missing Repository: invites**
   - Table exists (organization_member_invites)
   - Blocks: `invites.ts` refactoring (21 queries)
   - **Status:** Medium priority, can defer
   - **Action Required:** Create `/src/db/repositories/invite-repository.ts`

2. **Analytics Routes** - Low priority (deferred)
   - `analytics.ts` (13 queries) - Complex time-series aggregations
   - `author-analytics.ts` (12 queries) - Complex time-series aggregations
   - **Status:** Deferred - Not critical for core functionality

## 📋 Remaining Work

### Phase 3: Collections Routes (Next Step - Infrastructure Complete!)

**Estimated Time:** 6-8 hours

All infrastructure is ready. Just need to refactor the 9 routes to use repository methods:

#### Ready to Implement (Step-by-step)
1. **GET /collections** - Replace raw SQL with `searchWithDetails()` (30 min)
2. **GET /collections/:scope/:slug** - Use `findBySlugWithAuthor()` + `getPackagesWithDetails()` (30 min)
3. **GET /collections/featured** - Replace with `getFeaturedWithDetails()` (15 min)
4. **GET /collections/:scope/:slug/:version** - Use `findBySlugWithAuthor()` (15 min)
5. **POST /collections** - Use `create()` + `addPackages()` (45 min)
6. **POST /collections/:scope/:slug/install** - Use `findBestMatchByNameSlug()` + `trackInstall()` (45 min)
7. **POST /collections/:scope/:slug/star** - Use `addStar()` / `removeStar()` (30 min)
8. **PUT /collections/:scope/:slug** - Update logic (45 min)
9. **DELETE /collections/:scope/:slug** - Delete logic (15 min)

**Testing:** Use `COLLECTIONS_TESTING_CHECKLIST.md` (95 test cases prepared)

### Phase 4: Remaining Routes (Optional/Deferred)

#### invites.ts (21 queries) - Medium Priority
**Estimated Time:** 4-5 hours
- Need to create InviteRepository first
- Complex authorization logic

#### analytics.ts + author-analytics.ts (25 queries) - Low Priority
**Estimated Time:** 10-14 hours
- Complex time-series queries with window functions
- Can defer until later - not critical for core functionality

## 🧪 Testing Strategy

### Collections Testing (Ready to Use)
- **Document:** `COLLECTIONS_TESTING_CHECKLIST.md`
- **Test Cases:** 95 comprehensive test cases
- **Coverage:**
  - All 9 collection endpoints
  - Database integrity tests
  - Performance tests
  - Security & authorization tests
  - Regression tests

### General Testing After Each Route Migration

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
   npm run build
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

### Option A: Quick Wins First (Recommended) ✅ COMPLETED
**Goal:** Get visible user-facing features on repository pattern quickly

1. ✅ Create package_versions schema (30 min) - DONE
2. ✅ Create PackageVersionRepository (1 hr) - DONE
3. ✅ Refactor convert.ts - 2 queries (1 hr) - DONE
4. ✅ Refactor packages.ts - 4 queries (2 hrs) - DONE
5. ✅ Enhance UserRepository + PackageRepository (2 hrs) - DONE
6. ✅ Refactor authors.ts - 4 queries (2 hrs) - DONE

**Total Time:** ~8-9 hours
**Impact:** Core package functionality fully on repository pattern
**Status:** ✅ COMPLETED - All 10 queries migrated

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
**Migrated:** 10 (13%)
**Blocked:** 0 (all blockers resolved)
**Deferred:** 25 (analytics routes)
**Remaining:** 40 (53%)

**Estimated Completion:**
- ✅ Phase 2 (High-Value): 8-9 hours - COMPLETED
- Phase 3 (Medium Priority): 10-12 hours - IN PROGRESS
- Phase 4 (Analytics): 14-16 hours (optional)
- **Remaining:** 24-28 hours (excluding analytics: 10-12 hours)

## 🚀 Next Session: Collections Routes Refactoring

**All infrastructure is ready!** Just refactor the 9 routes to use repository methods.

**Start with:** `GET /collections` route - replace raw SQL with `searchWithDetails()`

**Quick start command:**
```bash
cd /home/khaliqgant/projects/prompt-package-manager/packages/registry
npm run build  # Verify everything compiles
npm run dev    # Start registry for testing
```

**Testing:**
- Use `COLLECTIONS_TESTING_CHECKLIST.md` for comprehensive test cases
- 95 test cases prepared covering all scenarios

---

**Last Updated:** 2025-11-03 (Session 2)
**Progress:** Phase 2 Complete (10 queries), Phase 3 Infrastructure Complete
**Next:** Phase 3 Routes - Collections.ts route refactoring (19 queries)
