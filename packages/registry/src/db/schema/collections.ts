import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb, index, primaryKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { packages } from './packages.js';

/**
 * Collections Schema
 *
 * Maps to the `collections` table in the database.
 * Handles collection (package bundles) metadata, ownership, statistics, and categorization.
 *
 * Migration history:
 * - 004_add_collections.sql: Initial collections table with composite PK (scope, id, version)
 * - 014_collections_uuid_id.sql: Migrated to UUID primary key, added name_slug field
 * - 022_transform_prpm_author_to_org.sql: Added org_id column, made author_id nullable
 * - 023_remove_old_id_not_null.sql: Made old_id nullable
 */
export const collections = pgTable('collections', {
  // Primary identifier (UUID as of migration 014)
  id: uuid('id').primaryKey().defaultRandom(),

  // Naming and identification
  scope: varchar('scope', { length: 100 }).notNull(), // 'collection' (official) or username
  name: varchar('name', { length: 255 }).notNull(),
  nameSlug: varchar('name_slug', { length: 255 }), // URL-friendly name slug (e.g., "startup-mvp")
  oldId: varchar('old_id', { length: 255 }), // Legacy name-based identifier (kept for compatibility), nullable as of migration 023
  version: varchar('version', { length: 50 }).notNull(),
  description: text('description'),

  // Ownership (both nullable as of migration 022)
  authorId: uuid('author_id'), // References users(id)
  orgId: uuid('org_id').references(() => organizations.id), // References organizations(id), added in migration 022
  maintainers: text('maintainers').array().default([]), // Array of usernames

  // Status flags
  official: boolean('official').default(false).notNull(),
  verified: boolean('verified').default(false).notNull(),

  // Categorization
  category: varchar('category', { length: 100 }),
  tags: text('tags').array().default([]),
  framework: varchar('framework', { length: 100 }),

  // Statistics (cached)
  downloads: integer('downloads').default(0).notNull(),
  stars: integer('stars').default(0).notNull(),

  // Display assets
  icon: varchar('icon', { length: 255 }),
  banner: varchar('banner', { length: 500 }),
  readme: text('readme'),

  // Configuration (JSONB: defaultFormat, installOrder, postInstall, etc.)
  config: jsonb('config'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type inference for TypeScript
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

/**
 * Collection Packages Join Table
 *
 * Maps packages to collections with metadata (order, required status, reason).
 * Composite primary key: (collection_id, package_id)
 *
 * Migration history:
 * - 004_add_collections.sql: Initial table with composite FK to collections (scope, id, version)
 * - 014_collections_uuid_id.sql: Migrated to UUID collection_id, composite PK (collection_id, package_id)
 */
export const collectionPackages = pgTable('collection_packages', {
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  packageId: uuid('package_id').notNull().references(() => packages.id, { onDelete: 'cascade' }),
  packageVersion: varchar('package_version', { length: 50 }), // NULL means 'latest'
  required: boolean('required').default(true).notNull(),
  reason: text('reason'),
  installOrder: integer('install_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.collectionId, table.packageId] }),
}));

export type CollectionPackage = typeof collectionPackages.$inferSelect;
export type NewCollectionPackage = typeof collectionPackages.$inferInsert;
