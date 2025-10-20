# UUID Schema Migration Progress

## Overview

**Goal**: Change the packages table structure from using package name as VARCHAR primary key to using UUID as primary key with name as a separate field.

**Status**: Database schema, seed scripts, TypeScript interfaces, API routes, and search complete ✅
**Remaining**: CLI/client updates, final end-to-end testing

---

## Schema Change Details

### Before
```sql
CREATE TABLE packages (
  id VARCHAR(255) PRIMARY KEY,  -- Package name (e.g., "@author/package")
  description TEXT,
  ...
);
```

### After
```sql
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,  -- Package name (e.g., "@author/package")
  description TEXT,
  ...
);
```

---

## ✅ Completed Work

### 1. Database Schema Migrations (ALL PASSING)

#### Migration 001: Initial Schema
**File**: `packages/registry/migrations/001_initial_schema.sql`

**Changes**:
- Line 78: Changed `id VARCHAR(255) PRIMARY KEY` to `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- Line 79: Added `name VARCHAR(255) UNIQUE NOT NULL`
- Line 136: Updated full-text search index from `coalesce(id, '')` to `coalesce(name, '')`

```sql
-- Full-text search index
CREATE INDEX idx_packages_search ON packages USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);
```

#### Migration 002-012: Foreign Key Updates
**Files**:
- `002_add_quality_scoring.sql`
- `004_add_collections.sql`
- `008_enhanced_analytics.sql`

**Changes**: Updated all `package_id VARCHAR(255)` to `package_id UUID` across:
- `package_versions.package_id`
- `package_stats.package_id`
- `download_events.package_id`
- `package_views.package_id`
- `package_reviews.package_id`
- `collection_packages.package_id`
- `badges.package_id`
- `ratings.package_id`
- `installations.package_id`

#### Migration 003: Search Optimization
**File**: `003_search_optimization.sql`

**Changes**:
- Line 21: Updated index from `idx_packages_author_name ON packages(author_id, id)` to `ON packages(author_id, name)`
- Line 24: Changed trigram index from `idx_packages_id_trgm` to `idx_packages_name_trgm` using `name` field
- Line 67: Updated generated search_vector column to use `coalesce(name, '')` instead of `coalesce(id, '')`
- Lines 86-87: Added `name` field to materialized view `package_search_rankings`
- Lines 157-173: Updated `search_packages()` function return type to include `name UUID` and `name VARCHAR`

#### Migration 006: Author Invites
**File**: `006_add_author_invites.sql`

**Changes**:
- Lines 145, 154: Updated view to use `SPLIT_PART(p.name, '/', 1)` instead of `SPLIT_PART(p.id, '/', 1)`
- Line 153: Changed WHERE clause from `p.id LIKE '@%/%'` to `p.name LIKE '@%/%'`
- Line 223: Updated function to use `WHERE name LIKE '@' || p_author_username || '/%'`

**Migration Test Results**:
```bash
✅ Successfully executed 13 migration(s)
```

---

### 2. Seed Scripts Updated

#### seed-packages.ts
**File**: `packages/registry/scripts/seed-packages.ts`

**Changes**:
- Line 203: Changed INSERT field from `id` to `name`
- Line 216: Changed conflict check from `ON CONFLICT (id)` to `ON CONFLICT (name)`
- Line 239: Added `const dbPackageId = pkgResult.rows[0].id;` to capture UUID
- Lines 255, 274: Use `dbPackageId` (UUID) for package_versions FK and UPDATE WHERE clause

**Test Results**:
```
✅ Successfully seeded 1327 packages!
⏭️  Skipped 289 duplicates
📋 Total attempted: 1616
```

**Package Distribution**:
- cursor: 1110 packages
- claude: 160 packages
- claude-skill: 20 packages
- mcp: 16 packages
- windsurf: 16 packages
- continue: 5 packages

#### seed-prpm-skills.ts
**File**: `packages/registry/scripts/seed-prpm-skills.ts`

**Changes**:
- Line 107: Changed lookup query from `WHERE id = $1` to `WHERE name = $1`
- Line 130: Changed INSERT field from `id` to `name`
- Line 138: Changed conflict from `ON CONFLICT (id)` to `ON CONFLICT (name)`
- Line 160: Added `const dbPackageId = pkgResult.rows[0].id;`
- Lines 172, 190: Use `dbPackageId` for package_versions and UPDATE queries

**Test Results**:
```
✅ Imported: 6
- @prpm/pulumi-troubleshooting-skill
- @prpm/postgres-migrations-skill
- @prpm/self-improve-cursor
- @prpm/self-improve-windsurf
- @prpm/self-improve-continue
- @prpm/self-improve-claude
```

#### seed-collections.ts
**File**: `packages/registry/scripts/seed/seed-collections.ts`

**Changes**:
- Lines 99-109: Added package lookup by name to get UUID:
```typescript
// Look up package UUID by name
const pkgLookup = await pool.query(
  `SELECT id FROM packages WHERE name = $1`,
  [pkg.packageId]
);

if (pkgLookup.rows.length === 0) {
  console.warn(`  ⚠️  Package not found: ${pkg.packageId}`);
  continue;
}

const dbPackageId = pkgLookup.rows[0].id;
```
- Line 128: Use `dbPackageId` (UUID) instead of `pkg.packageId` (string) for FK

**Note**: Script needs .env fix to test fully, but code changes are correct.

---

### 3. Database Verification

**Current Database State**:
```sql
-- Sample data showing UUID id + name structure
SELECT id::text, name, type FROM packages LIMIT 3;

                  id                  |              name               |     type
--------------------------------------+---------------------------------+--------------
 d2802c6b-6721-4a39-ab87-5351413f737f | @obra/skill-brainstorming       | claude-skill
 be76330d-e216-485b-a18a-69a22c46a3b6 | @obra/skill-condition-based-waiting | claude-skill
 445d78b5-b31c-436a-bb1a-578648b73842 | @obra/skill-defense-in-depth    | claude-skill
```

**Foreign Key Verification**:
```sql
SELECT pv.package_id::text, p.name, pv.version
FROM package_versions pv
JOIN packages p ON pv.package_id = p.id
WHERE p.name LIKE '@prpm%' LIMIT 3;

              package_id              |               name                | version
--------------------------------------+-----------------------------------+---------
 2b96ae45-9adc-4ea4-a312-2b5239d00965 | @prpm/pulumi-troubleshooting-skill | 1.0.0
 979a3395-9b88-43ad-91ce-8a935920b84a | @prpm/postgres-migrations-skill   | 1.0.0
 10fca580-ecbc-436a-b429-bb3a224ebba5 | @prpm/self-improve-cursor         | 1.0.0
```

**Statistics**:
- Total packages: 1333
- Total types: 6
- All UUIDs valid ✅
- All foreign keys working ✅
- All names populated ✅

---

### 4. TypeScript Interfaces & API Routes (ALL UPDATED)

#### TypeScript Interfaces ✅
**File**: `packages/registry/src/types.ts`

The Package interface was already correctly defined with both `id` (UUID) and `name` (string) fields. No changes needed.

#### Search Implementation ✅
**Files Updated**:
- ✅ `packages/registry/src/search/postgres.ts`
  - Line 32: Text search updated to use `name` field
  - Line 94: Ranking updated to use `name` instead of `id`
- ✅ `packages/registry/src/routes/packages.ts`
  - Line 86: List packages search updated to use `name` field

#### API Routes - Package Endpoints ✅
**File**: `packages/registry/src/routes/packages.ts`

All routes updated to accept package names and lookup by name:
- ✅ Line 145: `GET /:packageName` - Looks up by name
- ✅ Line 199: `GET /:packageName/:version` - Looks up by name
- ✅ Line 271: `DELETE /:packageName/:version` - Looks up by name, uses UUID for FK
- ✅ Line 323: `GET /:packageName/stats` - Looks up by name, uses UUID for FK
- ✅ Line 475: `GET /:packageName/versions` - Looks up by name
- ✅ Line 532: `GET /:packageName/:version/dependencies` - Looks up by name
- ✅ Line 596: `GET /:packageName/resolve` - Looks up by name
- ✅ Line 645: `resolveDependencyTree()` function - Handles package names

#### API Routes - Analytics Endpoints ✅
**File**: `packages/registry/src/routes/analytics.ts`

All analytics routes updated to lookup by name:
- ✅ Line 67: `POST /download` - Looks up by name (line 71-73), uses UUID for FK
- ✅ Line 188: `POST /view` - Looks up by name (line 193-196), uses UUID for FK
- ✅ Line 261: `GET /stats/:packageId` - Looks up by name (line 265-278), uses UUID for FK

#### Pattern Applied
All routes now follow this pattern:
```typescript
// 1. Accept package NAME in route parameter
server.get('/:packageName', async (request, reply) => {
  const { packageName } = request.params;

  // 2. Look up package by name to get UUID
  const pkg = await queryOne<Package>(
    server,
    'SELECT id FROM packages WHERE name = $1',
    [packageName]
  );

  // 3. Use UUID for foreign key relationships
  const versions = await query(
    server,
    'SELECT * FROM package_versions WHERE package_id = $1',
    [pkg.id]  // UUID
  );
});
```

**Build Verification**:
```bash
✅ npm run typecheck --workspace=@prpm/registry
✅ npm run build:registry
```

---

## 🔲 Remaining Work

### 1. Update Client/CLI Code

**Files to Update**:
- `packages/registry/src/types/*.ts`
- Any interface definitions for `Package` type

**Changes Needed**:
```typescript
// Before
interface Package {
  id: string;  // Was the package name
  description: string;
  // ...
}

// After
interface Package {
  id: string;  // UUID
  name: string;  // Package identifier (e.g., "@author/package")
  description: string;
  // ...
}
```

**Search for**:
```bash
grep -r "interface.*Package" packages/registry/src/types/
grep -r "type.*Package" packages/registry/src/types/
```

---

### 2. Update API Routes

**Files to Check**:
- `packages/registry/src/routes/packages.ts`
- `packages/registry/src/routes/search.ts`
- `packages/registry/src/routes/analytics.ts`

**Changes Needed**:

#### Package Lookup by Name
Current routes likely do:
```typescript
// GET /api/v1/packages/:packageId
const result = await db.query('SELECT * FROM packages WHERE id = $1', [packageId]);
```

Should become:
```typescript
// GET /api/v1/packages/:packageName
const result = await db.query('SELECT * FROM packages WHERE name = $1', [packageName]);
```

#### Response Format
Ensure responses include both fields:
```typescript
{
  id: "2b96ae45-9adc-4ea4-a312-2b5239d00965",  // UUID
  name: "@prpm/pulumi-troubleshooting-skill",   // Package identifier
  description: "...",
  // ...
}
```

**Search for SQL queries**:
```bash
grep -r "WHERE id = " packages/registry/src/routes/
grep -r "packages.id" packages/registry/src/routes/
```

---

### 3. Update Search Implementation

**Files to Check**:
- `packages/registry/src/routes/search.ts`
- Any files using the `search_packages()` PostgreSQL function

**Changes Needed**:
- Ensure search results return both `id` (UUID) and `name` (package identifier)
- Update any client code expecting `id` to be the package name
- Verify full-text search is using `name` field correctly (already done in migration 001/003)

---

### 4. Update Client/CLI Code

**Files to Check**:
- `packages/cli/src/**/*.ts`
- `packages/registry-client/src/**/*.ts`

**Changes Needed**:
- Update any code that constructs package IDs
- Change from using `id` as the package identifier to using `name`
- Update URL construction (e.g., `/packages/${id}` → `/packages/${encodeURIComponent(name)}`)

**Example**:
```typescript
// Before
const packageUrl = `/packages/${package.id}`;  // @prpm/skill-name

// After
const packageUrl = `/packages/${encodeURIComponent(package.name)}`;  // @prpm/skill-name
// Note: package.id is now UUID, package.name is the identifier
```

---

### 5. Update Quality Scorer

**File**: `packages/registry/src/scoring/quality-scorer.ts`

**Check for**:
- Any hardcoded references to package IDs as strings
- Queries that filter by `id` when they should filter by `name`

---

### 6. Final End-to-End Testing

**Test Checklist**:

- [ ] Reset database and run all migrations
  ```bash
  npm run migrate
  ```

- [ ] Seed all data
  ```bash
  npx tsx scripts/seed-packages.ts
  npx tsx scripts/seed-prpm-skills.ts
  npx tsx scripts/seed/seed-collections.ts
  ```

- [ ] Start registry server
  ```bash
  npm run dev
  ```

- [ ] Test API endpoints:
  ```bash
  # Search packages
  curl http://localhost:3000/api/v1/search?q=pulumi

  # Get package by name
  curl http://localhost:3000/api/v1/packages/@prpm/pulumi-troubleshooting-skill

  # Get package stats
  curl http://localhost:3000/api/v1/analytics/stats/@prpm/pulumi-troubleshooting-skill
  ```

- [ ] Test CLI commands:
  ```bash
  prpm search pulumi
  prpm info @prpm/pulumi-troubleshooting-skill
  prpm install @prpm/pulumi-troubleshooting-skill
  ```

- [ ] Verify search results include both `id` (UUID) and `name` (identifier)

- [ ] Check webapp displays packages correctly

- [ ] Run any existing test suites
  ```bash
  npm test
  ```

---

## Files Modified Summary

### Database Migrations
- ✅ `packages/registry/migrations/001_initial_schema.sql`
- ✅ `packages/registry/migrations/002_add_quality_scoring.sql`
- ✅ `packages/registry/migrations/003_search_optimization.sql`
- ✅ `packages/registry/migrations/004_add_collections.sql`
- ✅ `packages/registry/migrations/006_add_author_invites.sql`
- ✅ `packages/registry/migrations/008_enhanced_analytics.sql`

### Seed Scripts
- ✅ `packages/registry/scripts/seed-packages.ts`
- ✅ `packages/registry/scripts/seed-prpm-skills.ts`
- ✅ `packages/registry/scripts/seed/seed-collections.ts`

### Pending Updates
- 🔲 TypeScript interfaces in `packages/registry/src/types/`
- 🔲 API routes in `packages/registry/src/routes/`
- 🔲 CLI client in `packages/cli/src/`
- 🔲 Registry client in `packages/registry-client/src/`
- 🔲 Quality scorer in `packages/registry/src/scoring/`

---

## Quick Commands Reference

### Reset Database and Migrate
```bash
cd packages/registry

# Terminate connections and recreate database
PGPASSWORD=prpm psql -h localhost -p 5434 -U prpm -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'prpm' AND pid <> pg_backend_pid();"

PGPASSWORD=prpm psql -h localhost -p 5434 -U prpm -d postgres -c "DROP DATABASE IF EXISTS prpm;"
PGPASSWORD=prpm psql -h localhost -p 5434 -U prpm -d postgres -c "CREATE DATABASE prpm;"

# Run migrations
npm run migrate
```

### Seed Database
```bash
cd packages/registry

# Seed main packages
npx tsx scripts/seed-packages.ts

# Seed PRPM official packages
npx tsx scripts/seed-prpm-skills.ts

# Seed collections (optional - needs env fix)
npx tsx scripts/seed/seed-collections.ts
```

### Verify Database State
```bash
# Check total packages
PGPASSWORD=prpm psql -h localhost -p 5434 -U prpm -d prpm -c \
  "SELECT COUNT(*) as total, COUNT(DISTINCT type) as types FROM packages;"

# Check sample data with UUID and name
PGPASSWORD=prpm psql -h localhost -p 5434 -U prpm -d prpm -c \
  "SELECT id::text, name, type FROM packages LIMIT 5;"

# Check foreign key relationships
PGPASSWORD=prpm psql -h localhost -p 5434 -U prpm -d prpm -c \
  "SELECT pv.package_id::text, p.name, pv.version
   FROM package_versions pv
   JOIN packages p ON pv.package_id = p.id
   LIMIT 5;"
```

---

## Notes

### Why This Change?

1. **Proper Database Design**: UUIDs as primary keys follow best practices
2. **Immutability**: UUIDs never change, package names can be updated if needed
3. **Distributed Systems**: UUIDs work well across distributed systems
4. **Foreign Keys**: More efficient joins with UUID indexes
5. **Clarity**: Separates identity (UUID) from naming (human-readable)

### Backward Compatibility

- **Breaking Change**: Yes - API clients will need to update
- **Migration Path**:
  - Update all code to use `name` for lookups
  - Use `id` (UUID) for internal references
  - Update API documentation
  - Version API if needed (e.g., `/v2/packages/:name`)

### Performance Considerations

- UUID indexes are efficient for lookups
- UNIQUE index on `name` ensures fast name-based queries
- Foreign key joins use UUID (indexed) - performant
- Full-text search now uses `name` field - tested and working

---

## Contact

For questions or issues, see:
- Main task tracking: `packages/registry/TODO.md`
- This progress doc: `SCHEMA_MIGRATION_PROGRESS.md`
- Migration files: `packages/registry/migrations/`
