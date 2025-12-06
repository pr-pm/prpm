# Drizzle ORM Migration Guide

This document outlines the strategy for migrating from raw SQL queries to Drizzle ORM.

## Current State

- ✅ Drizzle ORM is installed and configured
- ✅ Schema introspected from database (56 tables, 647 columns)
- ✅ Schema copied to `src/db/schema/` and committed
- ✅ SSL configuration matches Fastify PostgreSQL setup
- ✅ Build passes with new schema
- ⏳ Existing raw SQL queries via `@fastify/postgres` continue to work
- ⏳ Ready to start Phase 2: Gradual Route Migration

## Next Steps

### Immediate (Phase 2 Start)

1. **Pick first route to migrate**: Start with a simple read-only endpoint
   - Recommended: `GET /packages/:id` or `GET /users/:id`
   - Low traffic, simple query, easy to verify

2. **Create comparison test**: Write a test that runs both raw SQL and Drizzle, comparing results

3. **Implement Drizzle version**: Add Drizzle query alongside existing raw SQL

4. **A/B test in staging**: Deploy with both implementations, log any differences

5. **Switch over**: Once verified, remove raw SQL version

### Suggested First Routes to Migrate

| Route | Complexity | Risk | Notes |
|-------|-----------|------|-------|
| `GET /packages/:id` | Low | Low | Single row fetch by UUID |
| `GET /users/:id` | Low | Low | Single row fetch by UUID |
| `GET /packages/:id/versions` | Medium | Low | List with FK join |
| `GET /packages` (list) | Medium | Medium | Pagination, sorting |
| `POST /packages` | High | High | Write operation - save for Phase 3 |

### Before Starting Route Migration

- [ ] Verify local DB matches production schema
- [ ] Run `npm run db:studio` to explore data
- [ ] Identify routes with existing test coverage
- [ ] Set up logging to compare query results

## Available Commands

```bash
# Generate schema from database (outputs to drizzle/ folder)
npm run db:introspect

# Open Drizzle Studio (visual DB browser)
npm run db:studio
```

## Schema Management

The schema is introspected from the database and stored in `src/db/schema/`:

- `schema.ts` - All 56 tables with columns, indexes, constraints
- `relations.ts` - Table relationships for Drizzle queries
- `index.ts` - Re-exports everything

**After database migrations, re-introspect the schema:**

```bash
# 1. Run introspection
npm run db:introspect

# 2. Copy updated files
cp drizzle/schema.ts src/db/schema/schema.ts
cp drizzle/relations.ts src/db/schema/relations.ts

# 3. Fix known issues (if any):
#    - tsvector columns: replace `unknown("col")` with `tsvector("col")`
#    - Array defaults: fix malformed `[RAY[...]` to proper arrays
#    - Materialized view options: remove unsupported `.with({...})`

# 4. Verify build
npm run build

# 5. Commit changes
git add src/db/schema/
git commit -m "chore: update Drizzle schema from database"
```

## Migration Strategy

This is a production system, so we're taking a careful incremental approach.

### Phase 1: Schema Setup ✅ COMPLETE

- ✅ Install drizzle-orm and drizzle-kit
- ✅ Configure drizzle.config.ts
- ✅ Introspect schema from database
- ✅ Fix introspection issues (tsvector, array defaults, materialized view options)
- ✅ Copy schema to src/db/schema/
- ✅ Add SSL configuration to Drizzle pool (matches Fastify setup)
- ✅ Verify build passes

### Phase 2: Gradual Route Migration (Current Phase)

**Goal**: Replace raw SQL with Drizzle one route at a time.

**Process for each route:**

1. **Identify the route** - Pick a simple read-only endpoint
2. **Write Drizzle query** - Implement equivalent query using Drizzle ORM
3. **Add comparison test** - Test that raw SQL and Drizzle return identical results
4. **Deploy with logging** - Log both results in staging, compare
5. **Switch over** - Once verified, use Drizzle as primary
6. **Remove raw SQL** - Clean up old implementation
7. **Monitor** - Watch for any production issues

**Order of migration** (by risk level):

1. **Low risk** - Simple SELECT by ID (package details, user info)
2. **Medium risk** - List queries with pagination and sorting
3. **Medium-high risk** - Search queries with full-text search
4. **High risk** - Aggregate queries (counts, stats)
5. **Highest risk** - Write operations (Phase 3)

**Routes to migrate (suggested order):**

```
Phase 2a - Simple reads:
[ ] GET /packages/:id
[ ] GET /users/:id
[ ] GET /collections/:id

Phase 2b - List queries:
[ ] GET /packages (with pagination)
[ ] GET /packages/:id/versions
[ ] GET /users/:id/packages

Phase 2c - Search queries:
[ ] GET /packages/search
[ ] GET /collections/search

Phase 2d - Aggregates:
[ ] GET /stats/packages
[ ] GET /stats/downloads
```

### Phase 3: Write Operations

**Goal**: Migrate INSERT/UPDATE/DELETE operations.

Only after reads are stable:

1. **Start with low-risk tables** - `download_events`, `package_views` (analytics)
2. **Migrate one table at a time** - Don't batch multiple tables
3. **Keep transaction handling identical** - Match existing behavior exactly
4. **Add comprehensive tests** - Cover edge cases before switching
5. **Consider rollback strategy** - Keep raw SQL available for quick revert

**Write operations to migrate (suggested order):**

```
Phase 3a - Analytics (low risk, high volume):
[ ] POST download_events
[ ] POST package_views

Phase 3b - User actions (medium risk):
[ ] POST /packages/:id/star
[ ] POST /packages/:id/rate
[ ] PUT /users/:id (profile updates)

Phase 3c - Core operations (high risk):
[ ] POST /packages (publish)
[ ] PUT /packages/:id (update)
[ ] DELETE /packages/:id
```

## What NOT To Do

- **Don't run `drizzle-kit push`** against production - this modifies the schema
- **Don't run `drizzle-kit migrate`** against production without extensive testing
- **Don't edit schema.ts manually** - regenerate from database instead
- **Don't migrate all routes at once** - incremental is safer
- **Don't skip comparison testing** - verify Drizzle matches raw SQL exactly
- **Don't remove raw SQL immediately** - keep it as fallback during transition

## File Structure

```
packages/registry/
├── drizzle/                    # Generated (gitignored) - temp output
│   ├── schema.ts              # Raw introspected schema
│   ├── relations.ts           # Table relations
│   └── *.sql                  # Generated SQL (reference only)
├── src/db/
│   ├── db.ts                  # Drizzle client setup (with SSL)
│   ├── index.ts               # Fastify postgres setup (existing)
│   └── schema/                # Production schema files (committed)
│       ├── schema.ts          # Fixed introspected schema (56 tables)
│       ├── relations.ts       # Table relations
│       └── index.ts           # Re-exports
└── drizzle.config.ts          # Drizzle Kit configuration
```

## Example: Migrating a Query

**Before (raw SQL)**:
```typescript
const result = await server.pg.query(
  'SELECT id, name, description FROM packages WHERE id = $1',
  [packageId]
);
return result.rows[0];
```

**After (Drizzle)**:
```typescript
import { db } from '../db/db.js';
import { packages } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

const result = await db
  .select({
    id: packages.id,
    name: packages.name,
    description: packages.description,
  })
  .from(packages)
  .where(eq(packages.id, packageId))
  .limit(1);

return result[0];
```

## Example: Comparison Test

Before switching a route, validate the Drizzle query matches raw SQL:

```typescript
import { describe, it, expect } from 'vitest';
import { db } from '../db/db.js';
import { packages } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

describe('Package queries', () => {
  it('Drizzle returns same result as raw SQL', async () => {
    const testId = 'some-known-package-uuid';

    // Raw SQL (existing)
    const rawResult = await server.pg.query(
      'SELECT id, name, description FROM packages WHERE id = $1',
      [testId]
    );

    // Drizzle (new)
    const drizzleResult = await db
      .select({
        id: packages.id,
        name: packages.name,
        description: packages.description,
      })
      .from(packages)
      .where(eq(packages.id, testId));

    // Compare
    expect(drizzleResult[0]).toEqual(rawResult.rows[0]);
  });
});
```

## Known Issues with Introspection

The `drizzle-kit introspect` command has some bugs that require manual fixes:

1. **tsvector columns**: Generated as `unknown("col")` - replace with custom `tsvector("col")` type
2. **Array defaults**: Sometimes generates malformed `[RAY[50, 75, 9]` instead of `[50, 75, 90]`
3. **Materialized view options**: `.with({autovacuumAnalyzeScaleFactor: ...})` not supported - remove

These are already fixed in the committed `src/db/schema/schema.ts`.

## Rollback Plan

If issues arise after migrating a route:

1. **Immediate**: Revert to raw SQL (keep old code commented or behind feature flag)
2. **Investigate**: Compare Drizzle vs raw SQL output in logs
3. **Fix**: Address the specific issue
4. **Re-test**: Run comparison tests again
5. **Re-deploy**: Try migration again

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit Docs](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle with PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Drizzle Query Examples](https://orm.drizzle.team/docs/select)
