/**
 * Package Versions Schema
 *
 * Drizzle ORM schema for package_versions table.
 * Each package can have multiple versions following semantic versioning.
 */

import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { packages } from './packages.js';
import { users } from './users.js';

export const packageVersions = pgTable('package_versions', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  packageId: uuid('package_id').notNull().references(() => packages.id, { onDelete: 'cascade' }),

  // Version information
  version: varchar('version', { length: 50 }).notNull(), // Semantic versioning (e.g., "1.2.3")

  // Version metadata
  description: text('description'),
  changelog: text('changelog'),

  // File information
  tarballUrl: text('tarball_url').notNull(), // S3/CDN URL to .tar.gz
  contentHash: varchar('content_hash', { length: 64 }).notNull(), // SHA-256 hash
  fileSize: integer('file_size').notNull(), // Size in bytes

  // Dependencies
  dependencies: jsonb('dependencies').default({}),
  peerDependencies: jsonb('peer_dependencies').default({}),

  // Engine requirements
  engines: jsonb('engines').default({}), // e.g., {"cursor": ">=0.40.0"}

  // Additional metadata
  metadata: jsonb('metadata').default({}),

  // Version status
  isPrerelease: boolean('is_prerelease').default(false),
  isDeprecated: boolean('is_deprecated').default(false),

  // Statistics
  downloads: integer('downloads').default(0),

  // Publishing info
  publishedBy: uuid('published_by').references(() => users.id),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes
  packageIdx: index('idx_versions_package').on(table.packageId),
  versionIdx: index('idx_versions_version').on(table.version),
  publishedIdx: index('idx_versions_published').on(table.publishedAt), // Note: DESC ordering handled by PostgreSQL

  // Unique constraint
  packageVersionUnique: unique().on(table.packageId, table.version),
}));

export type PackageVersion = typeof packageVersions.$inferSelect;
export type NewPackageVersion = typeof packageVersions.$inferInsert;
