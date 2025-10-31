# Drizzle ORM Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate PRPM registry from raw SQL queries to type-safe Drizzle ORM to prevent column name bugs like the `is_verified` incident.

**Architecture:** Layered approach with repository pattern. Create Drizzle schema for all tables, build repository layer, then incrementally migrate routes while keeping legacy SQL queries working.

**Tech Stack:** Drizzle ORM 0.30.x, Node.js, PostgreSQL, TypeScript, Fastify

---

## Phase 1: Foundation Setup

### Task 1: Install Drizzle Dependencies

**Files:**
- Modify: `packages/registry/package.json`

**Step 1: Add Drizzle dependencies**

```bash
cd packages/registry
npm install drizzle-orm@^0.30.0
npm install -D drizzle-kit@^0.20.0
```

**Step 2: Verify installation**

Run: `npm list drizzle-orm drizzle-kit`
Expected: Shows installed versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add drizzle-orm and drizzle-kit"
```

---

### Task 2: Create Database Client Setup

**Files:**
- Create: `packages/registry/src/db/db.ts`
- Create: `packages/registry/src/db/legacy.ts`

**Step 1: Write failing import test**

Create: `packages/registry/src/db/db.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { db, pool } from './db';

describe('Database Client', () => {
  it('should export db instance', () => {
    expect(db).toBeDefined();
  });

  it('should export pool instance', () => {
    expect(pool).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/registry && npm test -- db.test.ts`
Expected: FAIL with "Cannot find module './db'"

**Step 3: Create db.ts with Drizzle client**

Create: `packages/registry/src/db/db.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

// Reuse existing connection pool configuration
export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle client (schema will be added later)
export const db = drizzle(pool);

// Graceful shutdown helper
export async function closeDatabase() {
  await pool.end();
}
```

**Step 4: Create legacy.ts for unmigrated code**

Create: `packages/registry/src/db/legacy.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { pool } from './db.js';

/**
 * Legacy query helper for unmigrated code
 * @deprecated Use repositories instead
 */
export async function queryOne<T>(
  server: FastifyInstance,
  query: string,
  params?: any[]
): Promise<T | null> {
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

/**
 * Legacy query helper for unmigrated code
 * @deprecated Use repositories instead
 */
export async function queryMany<T>(
  server: FastifyInstance,
  query: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query(query, params);
  return result.rows;
}
```

**Step 5: Run test to verify it passes**

Run: `cd packages/registry && npm test -- db.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/db/db.ts src/db/legacy.ts src/db/db.test.ts
git commit -m "feat: add Drizzle database client setup"
```

---

## Phase 2: Schema Definition

### Task 3: Create Organizations Schema

**Files:**
- Create: `packages/registry/src/db/schema/organizations.ts`
- Create: `packages/registry/src/db/schema/index.ts`

**Step 1: Write schema definition**

Create: `packages/registry/src/db/schema/organizations.ts`

```typescript
import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  avatarUrl: text('avatar_url'),
  websiteUrl: text('website_url'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionStatus: varchar('subscription_status', { length: 50 }),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free'),
  subscriptionStartDate: timestamp('subscription_start_date', { withTimezone: true }),
  subscriptionEndDate: timestamp('subscription_end_date', { withTimezone: true }),
  subscriptionCancelAtPeriodEnd: boolean('subscription_cancel_at_period_end').default(false),
});

// Type inference
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
```

**Step 2: Create schema index**

Create: `packages/registry/src/db/schema/index.ts`

```typescript
export * from './organizations.js';
```

**Step 3: Update db.ts to use schema**

Modify: `packages/registry/src/db/db.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';
import * as schema from './schema/index.js';  // Add this import

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Pass schema to drizzle
export const db = drizzle(pool, { schema });  // Update this line

export async function closeDatabase() {
  await pool.end();
}
```

**Step 4: Write type safety test**

Create: `packages/registry/src/db/schema/organizations.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { organizations, type Organization } from './organizations';

describe('Organizations Schema', () => {
  it('should have correct TypeScript types', () => {
    // This test verifies compile-time type safety
    const org: Organization = {
      id: 'test-id',
      name: 'Test Org',
      description: null,
      avatarUrl: null,
      websiteUrl: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPlan: 'free',
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      subscriptionCancelAtPeriodEnd: false,
    };

    expect(org).toBeDefined();
  });

  it('should not allow wrong column names', () => {
    // @ts-expect-error - 'verified' does not exist, should be 'isVerified'
    const wrongName = organizations.verified;

    // This line exists to use the variable and prevent "unused variable" errors
    expect(wrongName).toBeUndefined();
  });
});
```

**Step 5: Run test to verify type safety**

Run: `cd packages/registry && npm test -- organizations.test.ts`
Expected: PASS (TypeScript should show error on line with @ts-expect-error)

**Step 6: Commit**

```bash
git add src/db/schema/organizations.ts src/db/schema/index.ts src/db/schema/organizations.test.ts src/db/db.ts
git commit -m "feat: add organizations schema with type safety"
```

---

### Task 4: Create Packages Schema

**Files:**
- Create: `packages/registry/src/db/schema/packages.ts`
- Modify: `packages/registry/src/db/schema/index.ts`

**Step 1: Define packages schema**

Create: `packages/registry/src/db/schema/packages.ts`

```typescript
import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description').notNull(),
  tags: jsonb('tags').$type<string[]>(),
  authorId: uuid('author_id').references(() => organizations.id),
  orgId: uuid('org_id').references(() => organizations.id),
  verified: boolean('verified').default(false),
  featured: boolean('featured').default(false),
  official: boolean('official').default(false),
  totalDownloads: integer('total_downloads').default(0),
  weeklyDownloads: integer('weekly_downloads').default(0),
  monthlyDownloads: integer('monthly_downloads').default(0),
  versionCount: integer('version_count').default(0),
  qualityScore: integer('quality_score'),
  qualityExplanation: text('quality_explanation'),
  aiEvaluated: boolean('ai_evaluated').default(false),
  aiEvaluatedAt: timestamp('ai_evaluated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;
```

**Step 2: Export from schema index**

Modify: `packages/registry/src/db/schema/index.ts`

```typescript
export * from './organizations.js';
export * from './packages.js';
```

**Step 3: Commit**

```bash
git add src/db/schema/packages.ts src/db/schema/index.ts
git commit -m "feat: add packages schema"
```

---

### Task 5: Create Users Schema

**Files:**
- Create: `packages/registry/src/db/schema/users.ts`
- Modify: `packages/registry/src/db/schema/index.ts`

**Step 1: Define users schema**

Create: `packages/registry/src/db/schema/users.ts`

```typescript
import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  githubId: varchar('github_id', { length: 100 }).unique(),
  githubUsername: varchar('github_username', { length: 100 }),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  website: text('website'),
  isAdmin: boolean('is_admin').default(false),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

**Step 2: Export from schema index**

Modify: `packages/registry/src/db/schema/index.ts`

```typescript
export * from './organizations.js';
export * from './packages.js';
export * from './users.js';
```

**Step 3: Commit**

```bash
git add src/db/schema/users.ts src/db/schema/index.ts
git commit -m "feat: add users schema"
```

---

### Task 6: Create Collections Schema

**Files:**
- Create: `packages/registry/src/db/schema/collections.ts`
- Modify: `packages/registry/src/db/schema/index.ts`

**Step 1: Define collections schema**

Create: `packages/registry/src/db/schema/collections.ts`

```typescript
import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }),
  tags: jsonb('tags').$type<string[]>(),
  orgId: uuid('org_id').references(() => organizations.id),
  packageIds: jsonb('package_ids').$type<string[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
```

**Step 2: Export from schema index**

Modify: `packages/registry/src/db/schema/index.ts`

```typescript
export * from './organizations.js';
export * from './packages.js';
export * from './users.js';
export * from './collections.js';
```

**Step 3: Commit**

```bash
git add src/db/schema/collections.ts src/db/schema/index.ts
git commit -m "feat: add collections schema"
```

---

## Phase 3: Repository Layer

### Task 7: Create Organization Repository

**Files:**
- Create: `packages/registry/src/db/repositories/organization-repository.ts`

**Step 1: Write failing repository test**

Create: `packages/registry/src/db/repositories/organization-repository.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OrganizationRepository } from './organization-repository';
import { pool } from '../db';

describe('OrganizationRepository', () => {
  let repository: OrganizationRepository;

  beforeAll(() => {
    repository = new OrganizationRepository();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should find organization by name', async () => {
    // This test requires a test org in the database
    const org = await repository.findByName('prpm');

    if (org) {
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('isVerified');
      // Verify the bug is fixed - should have isVerified, not verified
      expect(org.isVerified).toBeDefined();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/registry && npm test -- organization-repository.test.ts`
Expected: FAIL with "Cannot find module './organization-repository'"

**Step 3: Create organization repository**

Create: `packages/registry/src/db/repositories/organization-repository.ts`

```typescript
import { eq, sql } from 'drizzle-orm';
import { db } from '../db.js';
import { organizations, type Organization, type NewOrganization } from '../schema/organizations.js';

export class OrganizationRepository {
  /**
   * Find organization by name (case-insensitive)
   * Fixes the bug: uses isVerified (correct) instead of verified (wrong)
   */
  async findByName(name: string): Promise<Pick<Organization, 'id' | 'isVerified'> | null> {
    try {
      const [org] = await db
        .select({
          id: organizations.id,
          isVerified: organizations.isVerified,
        })
        .from(organizations)
        .where(sql`LOWER(${organizations.name}) = LOWER(${name})`)
        .limit(1);

      return org || null;
    } catch (error) {
      console.error('Failed to find organization by name', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find organization by ID
   */
  async findById(id: string): Promise<Organization | null> {
    try {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      return org || null;
    } catch (error) {
      console.error('Failed to find organization by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create new organization
   */
  async create(data: NewOrganization): Promise<Organization> {
    try {
      const [org] = await db
        .insert(organizations)
        .values(data)
        .returning();

      return org;
    } catch (error) {
      console.error('Failed to create organization', {
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update organization verification status
   */
  async updateVerificationStatus(id: string, isVerified: boolean): Promise<void> {
    try {
      await db
        .update(organizations)
        .set({
          isVerified,
          updatedAt: new Date()
        })
        .where(eq(organizations.id, id));
    } catch (error) {
      console.error('Failed to update verification status', {
        id,
        isVerified,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const organizationRepository = new OrganizationRepository();
```

**Step 4: Run test to verify it passes**

Run: `cd packages/registry && npm test -- organization-repository.test.ts`
Expected: PASS (if test database has prpm org)

**Step 5: Commit**

```bash
git add src/db/repositories/organization-repository.ts src/db/repositories/organization-repository.test.ts
git commit -m "feat: add organization repository with type-safe queries"
```

---

### Task 8: Create Package Repository

**Files:**
- Create: `packages/registry/src/db/repositories/package-repository.ts`

**Step 1: Create package repository**

Create: `packages/registry/src/db/repositories/package-repository.ts`

```typescript
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db.js';
import { packages, type Package, type NewPackage } from '../schema/packages.js';

export class PackageRepository {
  /**
   * Find package by name
   */
  async findByName(name: string): Promise<Package | null> {
    try {
      const [pkg] = await db
        .select()
        .from(packages)
        .where(eq(packages.name, name))
        .limit(1);

      return pkg || null;
    } catch (error) {
      console.error('Failed to find package by name', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find package by ID
   */
  async findById(id: string): Promise<Package | null> {
    try {
      const [pkg] = await db
        .select()
        .from(packages)
        .where(eq(packages.id, id))
        .limit(1);

      return pkg || null;
    } catch (error) {
      console.error('Failed to find package by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find packages by organization
   */
  async findByOrganization(orgId: string): Promise<Package[]> {
    try {
      return await db
        .select()
        .from(packages)
        .where(eq(packages.orgId, orgId))
        .orderBy(desc(packages.createdAt));
    } catch (error) {
      console.error('Failed to find packages by organization', {
        orgId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create new package
   */
  async create(data: NewPackage): Promise<Package> {
    try {
      const [pkg] = await db
        .insert(packages)
        .values(data)
        .returning();

      return pkg;
    } catch (error) {
      console.error('Failed to create package', {
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update package
   */
  async update(id: string, data: Partial<NewPackage>): Promise<Package> {
    try {
      const [pkg] = await db
        .update(packages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(packages.id, id))
        .returning();

      return pkg;
    } catch (error) {
      console.error('Failed to update package', {
        id,
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const packageRepository = new PackageRepository();
```

**Step 2: Commit**

```bash
git add src/db/repositories/package-repository.ts
git commit -m "feat: add package repository"
```

---

### Task 9: Create User Repository

**Files:**
- Create: `packages/registry/src/db/repositories/user-repository.ts`

**Step 1: Create user repository**

Create: `packages/registry/src/db/repositories/user-repository.ts`

```typescript
import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { users, type User, type NewUser } from '../schema/users.js';

export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to find user by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to find user by username', {
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find user by GitHub ID
   */
  async findByGithubId(githubId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.githubId, githubId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Failed to find user by GitHub ID', {
        githubId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create new user
   */
  async create(data: NewUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(data)
        .returning();

      return user;
    } catch (error) {
      console.error('Failed to create user', {
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update last login time
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Failed to update last login', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
```

**Step 2: Commit**

```bash
git add src/db/repositories/user-repository.ts
git commit -m "feat: add user repository"
```

---

### Task 10: Create Collection Repository

**Files:**
- Create: `packages/registry/src/db/repositories/collection-repository.ts`

**Step 1: Create collection repository**

Create: `packages/registry/src/db/repositories/collection-repository.ts`

```typescript
import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { collections, type Collection, type NewCollection } from '../schema/collections.js';

export class CollectionRepository {
  /**
   * Find collection by slug
   */
  async findBySlug(slug: string): Promise<Collection | null> {
    try {
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.slug, slug))
        .limit(1);

      return collection || null;
    } catch (error) {
      console.error('Failed to find collection by slug', {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find collection by ID
   */
  async findById(id: string): Promise<Collection | null> {
    try {
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, id))
        .limit(1);

      return collection || null;
    } catch (error) {
      console.error('Failed to find collection by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find collections by organization
   */
  async findByOrganization(orgId: string): Promise<Collection[]> {
    try {
      return await db
        .select()
        .from(collections)
        .where(eq(collections.orgId, orgId));
    } catch (error) {
      console.error('Failed to find collections by organization', {
        orgId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create new collection
   */
  async create(data: NewCollection): Promise<Collection> {
    try {
      const [collection] = await db
        .insert(collections)
        .values(data)
        .returning();

      return collection;
    } catch (error) {
      console.error('Failed to create collection', {
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const collectionRepository = new CollectionRepository();
```

**Step 2: Commit**

```bash
git add src/db/repositories/collection-repository.ts
git commit -m "feat: add collection repository"
```

---

## Phase 4: Route Migration

### Task 11: Migrate Publish Endpoint (Critical - Bug Fix)

**Files:**
- Modify: `packages/registry/src/routes/packages.ts:511-515`

**Step 1: Update imports at top of file**

Modify: `packages/registry/src/routes/packages.ts` (add to imports section)

```typescript
import { organizationRepository } from '../db/repositories/organization-repository.js';
```

**Step 2: Replace organization query with repository call**

Modify: `packages/registry/src/routes/packages.ts:510-525`

Replace this code:
```typescript
      if (organization) {
        const org = await queryOne<{ id: string; verified: boolean }>(
          server,
          'SELECT id, is_verified as verified FROM organizations WHERE LOWER(name) = LOWER($1)',
          [organization]
        );
```

With this code:
```typescript
      if (organization) {
        const org = await organizationRepository.findByName(organization);
```

**Step 3: Update variable usage**

The rest of the code already uses `org.verified` but now it's `org.isVerified`. Update:

```typescript
        if (!org) {
          return reply.status(404).send({
            error: 'Organization not found',
            message: `Organization '${organization}' not found. Please check the name or create the organization first.`,
          });
        }

        orgId = org.id;
        orgVerified = org.isVerified || false;  // Changed from org.verified
```

**Step 4: Test the endpoint locally**

Run the registry server and test publish:
```bash
cd packages/registry
npm run dev
```

In another terminal:
```bash
cd /tmp/test-publish
# Create test package
echo '{"name": "@test/demo", "version": "1.0.0", "description": "test", "format": "claude", "subtype": "skill"}' > prpm.json
echo "test" > SKILL.md
# Try publishing
prpm publish
```

Expected: Should succeed without `column "verified" does not exist` error

**Step 5: Commit**

```bash
git add src/routes/packages.ts
git commit -m "fix: use organization repository to prevent column name bugs

Fixes the is_verified vs verified bug that caused publish failures.
Now uses type-safe repository instead of raw SQL query."
```

---

### Task 12: Run Full Test Suite

**Step 1: Run all tests**

```bash
cd packages/registry
npm test
```

Expected: All tests should pass

**Step 2: Run TypeScript compilation**

```bash
npm run build
```

Expected: No TypeScript errors, especially no "verified does not exist" errors

**Step 3: Commit if any test fixes needed**

```bash
git add .
git commit -m "test: ensure all tests pass with Drizzle migration"
```

---

## Phase 5: Documentation and Cleanup

### Task 13: Update Legacy Query Warnings

**Files:**
- Modify: `packages/registry/src/db/legacy.ts`

**Step 1: Add deprecation warnings**

Modify: `packages/registry/src/db/legacy.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { pool } from './db.js';

let deprecationWarningShown = false;

/**
 * Legacy query helper for unmigrated code
 * @deprecated Use repositories instead - provides type safety and prevents column name bugs
 */
export async function queryOne<T>(
  server: FastifyInstance,
  query: string,
  params?: any[]
): Promise<T | null> {
  if (!deprecationWarningShown) {
    server.log.warn('Using legacy queryOne - consider migrating to repositories');
    deprecationWarningShown = true;
  }
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

/**
 * Legacy query helper for unmigrated code
 * @deprecated Use repositories instead - provides type safety and prevents column name bugs
 */
export async function queryMany<T>(
  server: FastifyInstance,
  query: string,
  params?: any[]
): Promise<T[]> {
  if (!deprecationWarningShown) {
    server.log.warn('Using legacy queryMany - consider migrating to repositories');
    deprecationWarningShown = true;
  }
  const result = await pool.query(query, params);
  return result.rows;
}
```

**Step 2: Commit**

```bash
git add src/db/legacy.ts
git commit -m "chore: add deprecation warnings to legacy query helpers"
```

---

### Task 14: Update README

**Files:**
- Modify: `packages/registry/README.md`

**Step 1: Add Drizzle section to README**

Add section to `packages/registry/README.md`:

```markdown
## Database Layer

This registry uses [Drizzle ORM](https://orm.drizzle.team/) for type-safe database queries.

### Architecture

- **Schema**: Defined in `src/db/schema/` - maps TypeScript types to database columns
- **Repositories**: Defined in `src/db/repositories/` - encapsulates all database queries
- **Type Safety**: Column names are checked at compile time, preventing bugs like `verified` vs `is_verified`

### Adding New Queries

1. **Use existing repository methods** when possible
2. **Add new methods to repositories** for new query patterns
3. **Never use raw SQL in routes** - always go through repositories

Example:
```typescript
// ❌ Don't do this (raw SQL, error-prone)
const org = await queryOne<{ id: string; verified: boolean }>(
  server,
  'SELECT id, verified FROM organizations WHERE name = $1',
  [name]
);

// ✅ Do this (type-safe repository)
const org = await organizationRepository.findByName(name);
```

### Legacy Code

Some routes still use `queryOne`/`queryMany` from `src/db/legacy.ts`. These are being gradually migrated to repositories. New code should always use repositories.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Drizzle ORM documentation to README"
```

---

## Success Criteria

✅ All schemas created for core tables (organizations, packages, users, collections)
✅ All repositories implemented with essential methods
✅ Publish endpoint migrated and tested (fixes is_verified bug)
✅ All tests passing
✅ TypeScript compilation successful with no type errors
✅ Legacy query helpers marked as deprecated
✅ Documentation updated

## Next Steps (Future Work)

After this initial migration is stable:

1. **Migrate remaining routes** to use repositories (search, analytics, admin endpoints)
2. **Add more repository methods** as needed for complex queries
3. **Remove legacy.ts** once all code is migrated
4. **Consider Drizzle Kit migrations** to generate migrations from schema changes
5. **Add query performance monitoring** to track slow queries

## Testing Strategy

- Unit tests for each repository method
- Integration tests for migrated routes
- Compare behavior with legacy SQL during transition
- Monitor production error rates after deployment

## Rollback Plan

If issues arise:
1. Revert specific route changes (repositories are isolated)
2. Legacy `queryOne`/`queryMany` continue working
3. Can deploy partially migrated codebase safely
