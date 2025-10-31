import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * Organizations Schema
 *
 * Maps to the `organizations` table in the database.
 * Handles organization profiles, verification status, and Stripe subscription data.
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  description: text('description'),
  avatarUrl: text('avatar_url'),
  websiteUrl: text('website_url'),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

  // Stripe subscription fields (from migration 024)
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionStatus: varchar('subscription_status', { length: 50 }),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free').notNull(),
  subscriptionStartDate: timestamp('subscription_start_date', { withTimezone: true }),
  subscriptionEndDate: timestamp('subscription_end_date', { withTimezone: true }),
  subscriptionCancelAtPeriodEnd: boolean('subscription_cancel_at_period_end').default(false).notNull(),
});

// Type inference for TypeScript
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
