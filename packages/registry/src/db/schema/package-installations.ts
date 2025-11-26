import { pgTable, uuid, varchar, timestamp, integer, decimal, index, primaryKey, check } from 'drizzle-orm/pg-core';
import { sql, desc } from 'drizzle-orm';
import { packages } from './packages.js';
import { users } from './users.js';

/**
 * Package Installations Schema
 *
 * Tracks individual package installations for analytics and co-install analysis.
 * Separate from download stats (which track HTTP downloads).
 * Anonymized tracking using session IDs.
 */
export const packageInstallations = pgTable('package_installations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What was installed
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }),
  version: varchar('version', { length: 50 }),

  // Who installed it (optional - for logged-in users)
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Anonymous session identifier (for co-install tracking without tracking users)
  // Generated on first install, stored in CLI config
  sessionId: varchar('session_id', { length: 100 }),

  // Installation context
  installedAt: timestamp('installed_at', { withTimezone: true }).defaultNow().notNull(),
  format: varchar('format', { length: 50 }), // what format they requested (cursor, claude, etc.)

  // For grouping co-installs (installs within 24h of each other)
  installBatchId: uuid('install_batch_id'), // packages installed in same batch get same ID
}, (table) => ({
  packageIdx: index('idx_installations_package').on(table.packageId),
  userIdx: index('idx_installations_user').on(table.userId).where(sql`${table.userId} IS NOT NULL`),
  sessionIdx: index('idx_installations_session').on(table.sessionId).where(sql`${table.sessionId} IS NOT NULL`),
  batchIdx: index('idx_installations_batch').on(table.installBatchId).where(sql`${table.installBatchId} IS NOT NULL`),
  dateIdx: index('idx_installations_date').on(table.installedAt),
}));

/**
 * Package Co-Installations Schema
 *
 * Tracks which packages are frequently installed together for recommendations.
 * Powers "users also installed" features.
 */
export const packageCoInstallations = pgTable('package_co_installations', {
  packageAId: uuid('package_a_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  packageBId: uuid('package_b_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),

  // Number of times these two packages were installed together
  coInstallCount: integer('co_install_count').default(1).notNull(),

  // Confidence score (0-100) - higher means stronger relationship
  // Calculated based on: co_install_count, time proximity, user diversity
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }).default('0').notNull(),

  // Last time these were co-installed
  lastCoInstalledAt: timestamp('last_co_installed_at', { withTimezone: true }).defaultNow().notNull(),

  // First time tracked
  firstCoInstalledAt: timestamp('first_co_installed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.packageAId, table.packageBId] }),
  // Ensure package_a_id < package_b_id to avoid duplicates (a,b) and (b,a)
  packageOrderCheck: check('package_order_check', sql`${table.packageAId} < ${table.packageBId}`),
  // Note: DESC ordering on indexes is handled by PostgreSQL migration SQL
  packageAIdx: index('idx_co_installs_package_a').on(table.packageAId, table.confidenceScore),
  packageBIdx: index('idx_co_installs_package_b').on(table.packageBId, table.confidenceScore),
  confidenceIdx: index('idx_co_installs_confidence').on(table.confidenceScore),
  countIdx: index('idx_co_installs_count').on(table.coInstallCount),
}));

// Type inference for TypeScript
export type PackageInstallation = typeof packageInstallations.$inferSelect;
export type NewPackageInstallation = typeof packageInstallations.$inferInsert;
export type PackageCoInstallation = typeof packageCoInstallations.$inferSelect;
export type NewPackageCoInstallation = typeof packageCoInstallations.$inferInsert;
