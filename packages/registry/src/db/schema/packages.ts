import { pgTable, uuid, varchar, text, boolean, timestamp, integer, decimal, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations.js';

/**
 * Packages Schema
 *
 * Maps to the `packages` table in the database.
 * Handles package metadata, ownership, statistics, quality scoring, and categorization.
 */
export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  description: text('description'),

  // Ownership
  authorId: uuid('author_id'), // References users(id) - will add after users schema
  orgId: uuid('org_id').references(() => organizations.id),

  // Package metadata
  format: varchar('format', { length: 255 }).notNull(), // cursor, claude, continue, windsurf, copilot, kiro, generic, mcp
  subtype: varchar('subtype', { length: 255 }).notNull().default('rule'), // rule, agent, skill, slash-command, prompt, workflow, tool, template, collection, chatmode
  license: varchar('license', { length: 50 }),
  licenseText: text('license_text'),
  licenseUrl: varchar('license_url', { length: 500 }),
  repositoryUrl: text('repository_url'),
  homepageUrl: text('homepage_url'),
  documentationUrl: text('documentation_url'),

  // Categorization
  tags: text('tags').array().default([]),
  keywords: text('keywords').array().default([]),
  category: varchar('category', { length: 100 }),

  // Package status
  visibility: varchar('visibility', { length: 50 }).default('public'), // public, private, unlisted
  deprecated: boolean('deprecated').default(false).notNull(),
  deprecatedReason: text('deprecated_reason'),
  verified: boolean('verified').default(false).notNull(),
  featured: boolean('featured').default(false).notNull(),
  official: boolean('official').default(false).notNull(),

  // Statistics (cached from package_stats)
  totalDownloads: integer('total_downloads').default(0).notNull(),
  weeklyDownloads: integer('weekly_downloads').default(0).notNull(),
  monthlyDownloads: integer('monthly_downloads').default(0).notNull(),
  versionCount: integer('version_count').default(0).notNull(),

  // Quality metrics
  qualityScore: decimal('quality_score', { precision: 3, scale: 2 }), // 0.00 to 5.00
  qualityExplanation: text('quality_explanation'),
  ratingAverage: decimal('rating_average', { precision: 3, scale: 2 }), // 0.00 to 5.00
  ratingCount: integer('rating_count').default(0).notNull(),

  // Quality scoring components (from migration 002)
  scoreTotal: integer('score_total').default(0).notNull(),
  scorePopularity: integer('score_popularity').default(0).notNull(),
  scoreQuality: integer('score_quality').default(0).notNull(),
  scoreTrust: integer('score_trust').default(0).notNull(),
  scoreRecency: integer('score_recency').default(0).notNull(),
  scoreCompleteness: integer('score_completeness').default(0).notNull(),
  scoreUpdatedAt: timestamp('score_updated_at', { withTimezone: true }),

  // Additional statistics
  viewCount: integer('view_count').default(0).notNull(),
  installCount: integer('install_count').default(0).notNull(),
  installRate: decimal('install_rate', { precision: 10, scale: 6 }).default('0'),
  downloadsLast7Days: integer('downloads_last_7_days').default(0).notNull(),
  downloadsLast30Days: integer('downloads_last_30_days').default(0).notNull(),
  trendingScore: decimal('trending_score', { precision: 10, scale: 6 }).default('0'),

  // Content preview
  snippet: text('snippet'),

  // MCP Server fields (from migration 009)
  remoteServer: boolean('remote_server').default(false),
  remoteUrl: text('remote_url'),
  transportType: varchar('transport_type', { length: 50 }),
  mcpConfig: jsonb('mcp_config').default({}),

  // Full-text search (from migration 003)
  searchVector: text('search_vector').$type<string | null>(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastPublishedAt: timestamp('last_published_at', { withTimezone: true }),
});

// Type inference for TypeScript
export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;
