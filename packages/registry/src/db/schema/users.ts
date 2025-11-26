import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users Schema
 *
 * Maps to the `users` table in the database.
 * Handles user authentication, profiles, and author claims.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),

  // OAuth provider data
  githubId: varchar('github_id', { length: 100 }).unique(),
  githubUsername: varchar('github_username', { length: 100 }),
  avatarUrl: text('avatar_url'),

  // Nango connection IDs for GitHub API access
  nangoConnectionId: varchar('nango_connection_id', { length: 255 }),
  incomingConnectionId: varchar('incoming_connection_id', { length: 255 }),

  // Author claim fields
  claimedAuthorUsername: varchar('claimed_author_username', { length: 100 }).unique(),
  authorBio: text('author_bio'),
  authorWebsite: text('author_website'),
  authorTwitter: varchar('author_twitter', { length: 100 }),
  authorClaimedAt: timestamp('author_claimed_at', { withTimezone: true }),

  // User profile
  website: varchar('website', { length: 500 }),

  // User status
  verifiedAuthor: boolean('verified_author').default(false).notNull(),
  isAdmin: boolean('is_admin').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

// Type inference for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
