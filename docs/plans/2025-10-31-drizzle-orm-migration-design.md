# Drizzle ORM Migration Design

**Date:** 2025-10-31
**Status:** Approved
**Author:** Claude + Khaliq

## Problem Statement

Raw SQL queries with manual type annotations are causing production bugs due to column name mismatches (e.g., `verified` vs `is_verified`). We need compile-time type safety to prevent these errors.

**Recent incident:** Publish endpoint failed in production because query used `SELECT verified` instead of `SELECT is_verified` from the organizations table.

## Goals

**Primary:** Type safety to prevent column name bugs
**Timeline:** Urgent (3-4 days)
**Risk Tolerance:** Conservative - minimize production risk

## Requirements

1. Type-safe database queries with compile-time column validation
2. Keep existing SQL migrations (32 files in `migrations/`)
3. Incremental migration - both systems coexist during transition
4. Zero breaking changes to existing functionality
5. Same or better performance than current raw SQL

## Design Overview

**Approach:** Layered migration with repository pattern
- Day 1: Create Drizzle schema + repositories for core tables
- Day 2-4: Migrate routes incrementally with testing between each

## Architecture

### Project Structure

```
packages/registry/src/
├── db/
│   ├── schema/
│   │   ├── index.ts              # Export all schemas
│   │   ├── organizations.ts      # Organizations table schema
│   │   ├── packages.ts           # Packages table schema
│   │   ├── users.ts              # Users table schema
│   │   └── collections.ts        # Collections table schema
│   ├── repositories/
│   │   ├── organization-repository.ts
│   │   ├── package-repository.ts
│   │   ├── user-repository.ts
│   │   └── collection-repository.ts
│   ├── db.ts                     # Drizzle client setup
│   └── legacy.ts                 # Existing queryOne/queryMany
├── routes/                        # Existing route files
└── ...
```

### Dependencies

```json
{
  "dependencies": {
    "drizzle-orm": "^0.30.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0"
  }
}
```

Keep existing `pg` package - Drizzle works with current connection pool.

## Schema Definition Pattern

**Key principle:** Explicit mapping between TypeScript (camelCase) and database (snake_case)

```typescript
// src/db/schema/organizations.ts
import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  isVerified: boolean('is_verified').default(false),  // TS: isVerified, DB: is_verified
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  // ... other columns
});

// Type inference - automatically generated
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
```

**All core tables follow this pattern:**
- `organizations`: ~15 columns
- `packages`: ~20 columns
- `users`: ~15 columns
- `collections`: ~10 columns

## Repository Pattern

Centralize all database access in type-safe repositories:

```typescript
// src/db/repositories/organization-repository.ts
import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { organizations, type Organization } from '../schema/organizations';

export class OrganizationRepository {
  async findByName(name: string): Promise<Pick<Organization, 'id' | 'isVerified'> | null> {
    const [org] = await db
      .select({
        id: organizations.id,
        isVerified: organizations.isVerified,  // TypeScript catches typos!
      })
      .from(organizations)
      .where(sql`LOWER(${organizations.name}) = LOWER(${name})`)
      .limit(1);

    return org || null;
  }

  async findById(id: string): Promise<Organization | null> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return org || null;
  }

  async create(data: NewOrganization): Promise<Organization> {
    const [org] = await db
      .insert(organizations)
      .values(data)
      .returning();

    return org;
  }
}

export const organizationRepository = new OrganizationRepository();
```

**Benefits:**
- All queries in one place - easy to find and test
- Type safety - `organizations.isVerified` autocompletes, typos error at compile time
- Reusable across routes
- Testable - mock repositories instead of SQL
- Self-documenting with JSDoc comments

## Database Client Setup

```typescript
// src/db/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';
import * as schema from './schema/index.js';

const { Pool } = pg;

// Reuse existing connection pool
export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle client
export const db = drizzle(pool, { schema });

export async function closeDatabase() {
  await pool.end();
}
```

```typescript
// src/db/legacy.ts - preserve for unmigrated code
import { pool } from './db';

export async function queryOne<T>(
  server: FastifyInstance,
  query: string,
  params?: any[]
): Promise<T | null> {
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

export async function queryMany<T>(
  server: FastifyInstance,
  query: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query(query, params);
  return result.rows;
}
```

## Migration Strategy

### Phase 1: Foundation (Day 1 - ~4-6 hours)

1. Install dependencies: `npm install drizzle-orm`
2. Create schema files for all core tables
3. Create repositories with essential methods
4. Set up `db.ts` client
5. Write repository unit tests

### Phase 2: High-Risk Routes (Day 2 - ~4-6 hours)

Migrate routes that caused bugs or are error-prone:
1. `POST /api/v1/packages` (publish endpoint - where is_verified bug was)
2. Organization endpoints (`/api/v1/organizations`)
3. User authentication endpoints

### Phase 3: Remaining Routes (Day 3-4 - ~6-8 hours)

Migrate by priority:
1. Package listing/search
2. Collections
3. Analytics
4. Admin endpoints

### Migration Checklist (per route)

```
Route: /api/v1/packages (POST)
- [ ] Identify all database queries in route
- [ ] Create/verify repository methods exist
- [ ] Replace raw SQL with repository calls
- [ ] Update types (remove manual annotations)
- [ ] Write/update tests
- [ ] Test locally with real database
- [ ] Deploy to staging
- [ ] Monitor for errors
- [ ] Deploy to production
```

## Testing Strategy

```typescript
// Example repository test
describe('OrganizationRepository', () => {
  it('findByName returns correct column names', async () => {
    const org = await organizationRepository.findByName('test-org');

    expect(org?.isVerified).toBeDefined();  // ✓ Works
    // @ts-expect-error - this should not compile
    expect(org?.verified).toBeDefined();    // ✗ TypeScript error!
  });
});
```

**Test coverage:**
- Unit tests for each repository method
- Integration tests for migrated routes
- Compare results with legacy SQL queries during transition

## Error Handling

```typescript
export class OrganizationRepository {
  async findByName(name: string): Promise<Pick<Organization, 'id' | 'isVerified'> | null> {
    try {
      // ... query
    } catch (error) {
      console.error('Failed to find organization by name', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Re-throw for route to handle
    }
  }
}
```

## Rollback Safety

- Each route migration is isolated (one PR per route/group)
- Legacy `queryOne`/`queryMany` continue working for unmigrated routes
- Can deploy partially migrated codebase safely
- If issues arise, only roll back specific route changes

## Monitoring

During migration, add logging to track which layer handles requests:

```typescript
server.log.info({
  route: '/api/v1/packages',
  method: 'POST',
  databaseLayer: 'drizzle',  // or 'legacy'
});
```

## Success Metrics

- Zero column name errors in TypeScript compilation
- No increase in database query latency
- All tests passing with new repositories
- Successful production deployment without rollback
- Developer feedback: queries easier to write

## Known Compatibility Notes

1. **Transactions**: Drizzle supports them, add wrapper methods as needed
2. **Raw SQL escape hatch**: Can use `sql` template for complex queries
3. **Performance**: Drizzle generates efficient SQL, no regression expected
4. **Migrations**: Keep existing SQL migrations unchanged

## Risk Mitigation

**Risk:** Breaking production queries during migration
**Mitigation:**
- Conservative incremental approach
- Test each route thoroughly before deployment
- Keep both systems working during transition
- Monitor error rates closely

**Risk:** Performance regression
**Mitigation:**
- Drizzle generates optimized SQL
- Same connection pool, no overhead
- Load test in staging before production

**Risk:** Learning curve for team
**Mitigation:**
- Repository pattern abstracts Drizzle complexity
- Clear examples in this doc
- Start with simple queries, add complexity as needed

## Future Considerations

After successful migration:
- Consider migrating to Drizzle Kit for schema migrations (optional)
- Add query performance monitoring
- Create shared repository base class for common patterns
- Generate migration from schema changes (if adopting Drizzle Kit)

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle with PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- Bug that motivated this: `is_verified` column name mismatch in organizations table
