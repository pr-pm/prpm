import { pgTable, unique, serial, varchar, timestamp, index, check, uuid, text, boolean, foreignKey, jsonb, numeric, integer, inet, char, date, doublePrecision, vector, primaryKey, pgView, pgMaterializedView, bigint, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Custom type for PostgreSQL tsvector (full-text search)
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});



export const migrations = pgTable("migrations", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	executedAt: timestamp("executed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("migrations_name_key").on(table.name),
]);

export const organizations = pgTable("organizations", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	avatarUrl: text("avatar_url"),
	websiteUrl: text("website_url"),
	isVerified: boolean("is_verified").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
	subscriptionStatus: varchar("subscription_status", { length: 50 }),
	subscriptionPlan: varchar("subscription_plan", { length: 50 }).default('free'),
	subscriptionStartDate: timestamp("subscription_start_date", { withTimezone: true, mode: 'string' }),
	subscriptionEndDate: timestamp("subscription_end_date", { withTimezone: true, mode: 'string' }),
	subscriptionCancelAtPeriodEnd: boolean("subscription_cancel_at_period_end").default(false),
	billingEmail: varchar("billing_email", { length: 255 }),
}, (table) => [
	index("idx_organizations_billing_email").using("btree", table.billingEmail.asc().nullsLast().op("text_ops")),
	index("idx_organizations_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("idx_organizations_stripe_customer_id").using("btree", table.stripeCustomerId.asc().nullsLast().op("text_ops")),
	index("idx_organizations_stripe_subscription_id").using("btree", table.stripeSubscriptionId.asc().nullsLast().op("text_ops")),
	index("idx_organizations_subscription_plan").using("btree", table.subscriptionPlan.asc().nullsLast().op("text_ops")),
	index("idx_organizations_subscription_status").using("btree", table.subscriptionStatus.asc().nullsLast().op("text_ops")),
	unique("organizations_name_key").on(table.name),
	unique("organizations_stripe_customer_id_key").on(table.stripeCustomerId),
	unique("organizations_stripe_subscription_id_key").on(table.stripeSubscriptionId),
	check("organizations_subscription_status_check", sql`(subscription_status)::text = ANY ((ARRAY['active'::character varying, 'canceled'::character varying, 'past_due'::character varying, 'unpaid'::character varying, 'incomplete'::character varying, 'trialing'::character varying])::text[])`),
	check("organizations_subscription_plan_check", sql`(subscription_plan)::text = ANY ((ARRAY['free'::character varying, 'verified'::character varying])::text[])`),
]);

export const securityBlockedWebfetchAttempts = pgTable("security_blocked_webfetch_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	packageId: uuid("package_id").notNull(),
	sessionId: uuid("session_id"),
	blockedUrl: text("blocked_url").notNull(),
	toolInput: jsonb("tool_input"),
	blockedAt: timestamp("blocked_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_blocked_webfetch_blocked_at").using("btree", table.blockedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_blocked_webfetch_package_id").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_blocked_webfetch_url").using("btree", table.blockedUrl.asc().nullsLast().op("text_ops")),
	index("idx_blocked_webfetch_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_blocked_webfetch_user_time").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.blockedAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [playgroundSessions.id],
			name: "security_blocked_webfetch_attempts_session_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "security_blocked_webfetch_attempts_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "security_blocked_webfetch_attempts_package_id_fkey"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }),
	passwordHash: varchar("password_hash", { length: 255 }),
	githubId: varchar("github_id", { length: 100 }),
	githubUsername: varchar("github_username", { length: 100 }),
	avatarUrl: text("avatar_url"),
	verifiedAuthor: boolean("verified_author").default(false),
	isAdmin: boolean("is_admin").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	claimedAuthorUsername: varchar("claimed_author_username", { length: 100 }),
	authorBio: text("author_bio"),
	authorWebsite: text("author_website"),
	authorTwitter: varchar("author_twitter", { length: 100 }),
	authorClaimedAt: timestamp("author_claimed_at", { withTimezone: true, mode: 'string' }),
	nangoConnectionId: varchar("nango_connection_id", { length: 255 }),
	website: varchar({ length: 500 }),
	incomingConnectionId: varchar("incoming_connection_id", { length: 255 }),
	currentMonthApiCost: numeric("current_month_api_cost", { precision: 10, scale:  4 }).default('0'),
	currentMonthCostResetAt: timestamp("current_month_cost_reset_at", { withTimezone: true, mode: 'string' }).default(sql`date_trunc('month'::text, (now() + '1 mon'::interval))`),
	isThrottled: boolean("is_throttled").default(false),
	throttledReason: text("throttled_reason"),
	throttledAt: timestamp("throttled_at", { withTimezone: true, mode: 'string' }),
	lifetimeApiCost: numeric("lifetime_api_cost", { precision: 12, scale:  4 }).default('0'),
	prpmPlusStatus: varchar("prpm_plus_status", { length: 50 }),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
	prpmPlusSubscriptionId: varchar("prpm_plus_subscription_id", { length: 255 }),
	prpmPlusCancelAtPeriodEnd: boolean("prpm_plus_cancel_at_period_end").default(false),
	prpmPlusCurrentPeriodEnd: timestamp("prpm_plus_current_period_end", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_users_claimed_author").using("btree", table.claimedAuthorUsername.asc().nullsLast().op("text_ops")),
	index("idx_users_cost_reset").using("btree", table.currentMonthCostResetAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_github_id").using("btree", table.githubId.asc().nullsLast().op("text_ops")),
	index("idx_users_incoming_connection_id").using("btree", table.incomingConnectionId.asc().nullsLast().op("text_ops")),
	index("idx_users_nango_connection_id").using("btree", table.nangoConnectionId.asc().nullsLast().op("text_ops")),
	index("idx_users_password_hash").using("btree", table.passwordHash.asc().nullsLast().op("text_ops")).where(sql`(password_hash IS NOT NULL)`),
	index("idx_users_prpm_plus_status").using("btree", table.prpmPlusStatus.asc().nullsLast().op("text_ops")).where(sql`(prpm_plus_status IS NOT NULL)`),
	index("idx_users_stripe_customer_id").using("btree", table.stripeCustomerId.asc().nullsLast().op("text_ops")),
	index("idx_users_throttled").using("btree", table.isThrottled.asc().nullsLast().op("bool_ops")).where(sql`(is_throttled = true)`),
	index("idx_users_username").using("btree", table.username.asc().nullsLast().op("text_ops")),
	index("idx_users_website").using("btree", table.website.asc().nullsLast().op("text_ops")).where(sql`(website IS NOT NULL)`),
	unique("users_username_key").on(table.username),
	unique("users_email_key").on(table.email),
	unique("users_github_id_key").on(table.githubId),
	unique("users_claimed_author_username_key").on(table.claimedAuthorUsername),
	unique("users_stripe_customer_id_key").on(table.stripeCustomerId),
	unique("users_prpm_plus_subscription_id_key").on(table.prpmPlusSubscriptionId),
]);

export const packageVersions = pgTable("package_versions", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	packageId: uuid("package_id"),
	version: varchar({ length: 50 }).notNull(),
	description: text(),
	changelog: text(),
	tarballUrl: text("tarball_url").notNull(),
	contentHash: varchar("content_hash", { length: 64 }).notNull(),
	fileSize: integer("file_size").notNull(),
	dependencies: jsonb().default({}),
	peerDependencies: jsonb("peer_dependencies").default({}),
	engines: jsonb().default({}),
	metadata: jsonb().default({}),
	isPrerelease: boolean("is_prerelease").default(false),
	isDeprecated: boolean("is_deprecated").default(false),
	downloads: integer().default(0),
	publishedBy: uuid("published_by"),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_versions_downloads").using("btree", table.downloads.desc().nullsFirst().op("int4_ops")),
	index("idx_versions_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_versions_published").using("btree", table.publishedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_versions_version").using("btree", table.version.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_versions_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.publishedBy],
			foreignColumns: [users.id],
			name: "package_versions_published_by_fkey"
		}),
	unique("package_versions_package_id_version_key").on(table.packageId, table.version),
]);

export const packageReviews = pgTable("package_reviews", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	packageId: uuid("package_id"),
	userId: uuid("user_id"),
	rating: integer().notNull(),
	title: varchar({ length: 255 }),
	comment: text(),
	helpfulCount: integer("helpful_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_reviews_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_reviews_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_reviews_rating").using("btree", table.rating.asc().nullsLast().op("int4_ops")),
	index("idx_reviews_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_reviews_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "package_reviews_user_id_fkey"
		}).onDelete("cascade"),
	unique("package_reviews_package_id_user_id_key").on(table.packageId, table.userId),
	check("package_reviews_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const accessTokens = pgTable("access_tokens", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	orgId: uuid("org_id"),
	tokenHash: varchar("token_hash", { length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	scopes: text().array().default([""]),
	isActive: boolean("is_active").default(true),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_tokens_hash").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
	index("idx_tokens_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_tokens_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "access_tokens_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "access_tokens_org_id_fkey"
		}).onDelete("cascade"),
	unique("access_tokens_token_hash_key").on(table.tokenHash),
]);

export const auditLog = pgTable("audit_log", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	action: varchar({ length: 100 }).notNull(),
	resourceType: varchar("resource_type", { length: 50 }),
	resourceId: varchar("resource_id", { length: 255 }),
	metadata: jsonb().default({}),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_audit_action").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("idx_audit_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_audit_resource").using("btree", table.resourceType.asc().nullsLast().op("text_ops"), table.resourceId.asc().nullsLast().op("text_ops")),
	index("idx_audit_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_log_user_id_fkey"
		}).onDelete("set null"),
]);

export const ratings = pgTable("ratings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	packageId: uuid("package_id"),
	userId: uuid("user_id"),
	rating: integer().notNull(),
	review: text(),
	helpful: integer().default(0),
	notHelpful: integer("not_helpful").default(0),
	verifiedInstall: boolean("verified_install").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ratings_helpful").using("btree", table.helpful.desc().nullsFirst().op("int4_ops")),
	index("idx_ratings_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_ratings_rating").using("btree", table.rating.desc().nullsFirst().op("int4_ops")),
	index("idx_ratings_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "ratings_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ratings_user_id_fkey"
		}).onDelete("cascade"),
	unique("ratings_package_id_user_id_key").on(table.packageId, table.userId),
	check("ratings_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const installations = pgTable("installations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	packageId: uuid("package_id"),
	installedAt: timestamp("installed_at", { mode: 'string' }).defaultNow(),
	clientInfo: jsonb("client_info"),
}, (table) => [
	index("idx_installations_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops"), table.installedAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_installations_user").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.installedAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "installations_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "installations_package_id_fkey"
		}).onDelete("cascade"),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	parentId: uuid("parent_id"),
	level: integer().notNull(),
	description: text(),
	icon: varchar({ length: 50 }),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_categories_display_order").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
	index("idx_categories_level").using("btree", table.level.asc().nullsLast().op("int4_ops")),
	index("idx_categories_parent").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("idx_categories_parent_id").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("idx_categories_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_fkey"
		}).onDelete("cascade"),
	unique("categories_slug_key").on(table.slug),
	check("categories_level_check", sql`(level >= 1) AND (level <= 3)`),
]);

export const useCases = pgTable("use_cases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	icon: varchar({ length: 50 }),
	exampleQuery: text("example_query"),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_use_cases_display_order").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
	index("idx_use_cases_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("use_cases_slug_key").on(table.slug),
]);

export const authorInvites = pgTable("author_invites", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	token: varchar({ length: 64 }).notNull(),
	authorUsername: varchar("author_username", { length: 100 }).notNull(),
	email: varchar({ length: 255 }),
	packageCount: integer("package_count").default(0),
	invitedBy: uuid("invited_by"),
	inviteMessage: text("invite_message"),
	status: varchar({ length: 50 }).default('pending'),
	claimedBy: uuid("claimed_by"),
	claimedAt: timestamp("claimed_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).default(sql`(now() + '30 days'::interval)`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_author_invites_expires").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_author_invites_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_author_invites_token").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("idx_author_invites_username").using("btree", table.authorUsername.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "author_invites_invited_by_fkey"
		}),
	foreignKey({
			columns: [table.claimedBy],
			foreignColumns: [users.id],
			name: "author_invites_claimed_by_fkey"
		}),
	unique("author_invites_token_key").on(table.token),
	unique("author_invites_author_username_key").on(table.authorUsername),
	check("author_invites_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'claimed'::character varying, 'expired'::character varying, 'revoked'::character varying])::text[])`),
]);

export const authorClaims = pgTable("author_claims", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	inviteId: uuid("invite_id"),
	userId: uuid("user_id"),
	authorUsername: varchar("author_username", { length: 100 }).notNull(),
	verificationMethod: varchar("verification_method", { length: 50 }),
	githubUsername: varchar("github_username", { length: 100 }),
	githubVerified: boolean("github_verified").default(false),
	packagesClaimed: integer("packages_claimed").default(0),
	claimedAt: timestamp("claimed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_author_claims_author").using("btree", table.authorUsername.asc().nullsLast().op("text_ops")),
	index("idx_author_claims_invite").using("btree", table.inviteId.asc().nullsLast().op("uuid_ops")),
	index("idx_author_claims_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.inviteId],
			foreignColumns: [authorInvites.id],
			name: "author_claims_invite_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "author_claims_user_id_fkey"
		}).onDelete("cascade"),
	unique("author_claims_invite_id_user_id_key").on(table.inviteId, table.userId),
]);

export const collectionInstalls = pgTable("collection_installs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	format: varchar({ length: 50 }),
	installedAt: timestamp("installed_at", { mode: 'string' }).defaultNow(),
	collectionId: uuid("collection_id").notNull(),
}, (table) => [
	index("idx_collection_installs_collection").using("btree", table.collectionId.asc().nullsLast().op("uuid_ops")),
	index("idx_collection_installs_date").using("btree", table.installedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_collection_installs_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "collection_installs_collection_fkey"
		}).onDelete("cascade"),
]);

export const playgroundSessionAudit = pgTable("playground_session_audit", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	sessionTokenHash: varchar("session_token_hash", { length: 64 }).notNull(),
	eventType: varchar("event_type", { length: 50 }).notNull(),
	eventDetails: jsonb("event_details"),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	fingerprintHash: varchar("fingerprint_hash", { length: 64 }),
	requestPath: varchar("request_path", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_playground_session_audit_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_playground_session_audit_event_type").using("btree", table.eventType.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_playground_session_audit_fingerprint").using("btree", table.fingerprintHash.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_playground_session_audit_security_events").using("btree", table.eventType.asc().nullsLast().op("timestamptz_ops"), table.userId.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")).where(sql`((event_type)::text = ANY ((ARRAY['fingerprint_mismatch'::character varying, 'rate_limited'::character varying])::text[]))`),
	index("idx_playground_session_audit_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "playground_session_audit_user_id_fkey"
		}).onDelete("cascade"),
]);

export const downloadEvents = pgTable("download_events", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	packageId: uuid("package_id"),
	version: varchar({ length: 50 }),
	clientType: varchar("client_type", { length: 50 }),
	format: varchar({ length: 50 }),
	userId: uuid("user_id"),
	clientId: varchar("client_id", { length: 255 }),
	ipHash: varchar("ip_hash", { length: 64 }),
	userAgent: text("user_agent"),
	referrer: text(),
	countryCode: char("country_code", { length: 2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_download_events_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_download_events_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_download_events_package_date").using("btree", table.packageId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_download_events_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "download_events_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "download_events_user_id_fkey"
		}).onDelete("set null"),
]);

export const packageViews = pgTable("package_views", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	packageId: uuid("package_id"),
	userId: uuid("user_id"),
	sessionId: varchar("session_id", { length: 255 }),
	ipHash: varchar("ip_hash", { length: 64 }),
	userAgent: text("user_agent"),
	referrer: text(),
	countryCode: char("country_code", { length: 2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_package_views_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_package_views_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_package_views_package_date").using("btree", table.packageId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_package_views_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_views_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "package_views_user_id_fkey"
		}).onDelete("set null"),
]);

export const packageStats = pgTable("package_stats", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	packageId: uuid("package_id"),
	date: date().notNull(),
	totalDownloads: integer("total_downloads").default(0),
	uniqueDownloads: integer("unique_downloads").default(0),
	cliDownloads: integer("cli_downloads").default(0),
	webDownloads: integer("web_downloads").default(0),
	apiDownloads: integer("api_downloads").default(0),
	cursorDownloads: integer("cursor_downloads").default(0),
	claudeDownloads: integer("claude_downloads").default(0),
	continueDownloads: integer("continue_downloads").default(0),
	windsurfDownloads: integer("windsurf_downloads").default(0),
	genericDownloads: integer("generic_downloads").default(0),
	totalViews: integer("total_views").default(0),
	uniqueViews: integer("unique_views").default(0),
	topCountries: jsonb("top_countries").default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_package_stats_date").using("btree", table.date.desc().nullsFirst().op("date_ops")),
	index("idx_package_stats_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_package_stats_package_date").using("btree", table.packageId.asc().nullsLast().op("uuid_ops"), table.date.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_stats_package_id_fkey"
		}).onDelete("cascade"),
	unique("package_stats_package_id_date_key").on(table.packageId, table.date),
]);

export const authorStats = pgTable("author_stats", {
	userId: uuid("user_id").primaryKey().notNull(),
	totalPackages: integer("total_packages").default(0),
	publicPackages: integer("public_packages").default(0),
	privatePackages: integer("private_packages").default(0),
	totalDownloads: integer("total_downloads").default(0),
	totalUniqueDownloads: integer("total_unique_downloads").default(0),
	downloadsToday: integer("downloads_today").default(0),
	downloadsWeek: integer("downloads_week").default(0),
	downloadsMonth: integer("downloads_month").default(0),
	totalViews: integer("total_views").default(0),
	viewsToday: integer("views_today").default(0),
	viewsWeek: integer("views_week").default(0),
	viewsMonth: integer("views_month").default(0),
	averageRating: numeric("average_rating", { precision: 3, scale:  2 }),
	totalRatings: integer("total_ratings").default(0),
	mostPopularPackageId: uuid("most_popular_package_id"),
	mostPopularPackageDownloads: integer("most_popular_package_downloads").default(0),
	lastUpdated: timestamp("last_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_author_stats_downloads").using("btree", table.totalDownloads.desc().nullsFirst().op("int4_ops")),
	index("idx_author_stats_packages").using("btree", table.totalPackages.desc().nullsFirst().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "author_stats_user_id_fkey"
		}).onDelete("cascade"),
]);

export const collections = pgTable("collections", {
	oldId: varchar("old_id", { length: 255 }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	version: varchar({ length: 50 }).notNull(),
	authorId: uuid("author_id"),
	maintainers: text().array(),
	official: boolean().default(false),
	verified: boolean().default(false),
	category: varchar({ length: 100 }),
	tags: text().array(),
	framework: varchar({ length: 100 }),
	downloads: integer().default(0),
	stars: integer().default(0),
	icon: varchar({ length: 255 }),
	banner: varchar({ length: 500 }),
	readme: text(),
	config: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	nameSlug: varchar("name_slug", { length: 255 }),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_collections_author_id").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_collections_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_collections_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_collections_downloads").using("btree", table.downloads.desc().nullsFirst().op("int4_ops")),
	index("idx_collections_name_slug").using("btree", table.nameSlug.asc().nullsLast().op("text_ops")),
	index("idx_collections_official").using("btree", table.official.asc().nullsLast().op("bool_ops")),
	index("idx_collections_org_id").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_collections_tags").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "collections_author_id_fkey"
		}),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "collections_org_id_fkey"
		}).onDelete("set null"),
	unique("collections_name_slug_version_key").on(table.version, table.nameSlug),
]);

export const packages = pgTable("packages", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	authorId: uuid("author_id"),
	orgId: uuid("org_id"),
	license: varchar({ length: 50 }),
	repositoryUrl: text("repository_url"),
	homepageUrl: text("homepage_url"),
	documentationUrl: text("documentation_url"),
	tags: text().array().default([""]),
	keywords: text().array().default([""]),
	category: varchar({ length: 100 }),
	visibility: varchar({ length: 50 }).default('public'),
	deprecated: boolean().default(false),
	deprecatedReason: text("deprecated_reason"),
	verified: boolean().default(false),
	featured: boolean().default(false),
	totalDownloads: integer("total_downloads").default(0),
	weeklyDownloads: integer("weekly_downloads").default(0),
	monthlyDownloads: integer("monthly_downloads").default(0),
	versionCount: integer("version_count").default(0),
	qualityScore: numeric("quality_score", { precision: 3, scale:  2 }),
	ratingAverage: numeric("rating_average", { precision: 3, scale:  2 }),
	ratingCount: integer("rating_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastPublishedAt: timestamp("last_published_at", { withTimezone: true, mode: 'string' }),
	scoreTotal: integer("score_total").default(0),
	scorePopularity: integer("score_popularity").default(0),
	scoreQuality: integer("score_quality").default(0),
	scoreTrust: integer("score_trust").default(0),
	scoreRecency: integer("score_recency").default(0),
	scoreCompleteness: integer("score_completeness").default(0),
	scoreUpdatedAt: timestamp("score_updated_at", { mode: 'string' }),
	viewCount: integer("view_count").default(0),
	installCount: integer("install_count").default(0),
	installRate: doublePrecision("install_rate").default(0),
	downloadsLast7Days: integer("downloads_last_7_days").default(0),
	downloadsLast30Days: integer("downloads_last_30_days").default(0),
	trendingScore: doublePrecision("trending_score").default(0),
	official: boolean().default(false),
	remoteServer: boolean("remote_server").default(false),
	remoteUrl: text("remote_url"),
	transportType: varchar("transport_type", { length: 50 }),
	mcpConfig: jsonb("mcp_config").default({}),
	qualityExplanation: text("quality_explanation"),
	format: text().notNull(),
	subtype: text().default('rule').notNull(),
	licenseText: text("license_text"),
	licenseUrl: varchar("license_url", { length: 500 }),
	snippet: text(),
	language: varchar({ length: 50 }),
	framework: varchar({ length: 100 }),
	fullContent: text("full_content"),
	displayName: text("display_name"),
	stars: integer().default(0),
	// PostgreSQL tsvector for full-text search (generated column)
	searchVector: tsvector("search_vector").generatedAlwaysAs(sql`(((((setweight(to_tsvector('english'::regconfig, (COALESCE(name, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(display_name, ''::text)), 'A'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(description, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, (COALESCE(category, ''::character varying))::text), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, immutable_array_to_string(tags, ' '::text)), 'C'::"char")) || setweight(to_tsvector('english'::regconfig, immutable_array_to_string(keywords, ' '::text)), 'D'::"char"))`),
	aiTags: text("ai_tags").array().default([""]),
	aiCategory: text("ai_category"),
	aiUseCases: text("ai_use_cases").array(),
	aiUseCasesGeneratedAt: timestamp("ai_use_cases_generated_at", { withTimezone: true, mode: 'string' }),
	aiEnrichmentCompletedAt: timestamp("ai_enrichment_completed_at", { withTimezone: true, mode: 'string' }),
	aiEnrichmentNeeded: boolean("ai_enrichment_needed").default(true),
}, (table) => [
	index("idx_packages_ai_category").using("btree", table.aiCategory.asc().nullsLast().op("text_ops")).where(sql`(ai_category IS NOT NULL)`),
	index("idx_packages_ai_tags").using("gin", table.aiTags.asc().nullsLast().op("array_ops")),
	index("idx_packages_author").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_packages_author_name").using("btree", table.authorId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	index("idx_packages_category").using("btree", table.category.asc().nullsLast().op("text_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_category_downloads").using("btree", table.category.asc().nullsLast().op("text_ops"), table.totalDownloads.desc().nullsFirst().op("int4_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_category_perf").using("btree", table.category.asc().nullsLast().op("numeric_ops"), table.totalDownloads.desc().nullsFirst().op("int4_ops"), table.qualityScore.desc().nullsLast().op("text_ops")).where(sql`(((visibility)::text = 'public'::text) AND (deprecated = false))`),
	index("idx_packages_category_quality").using("btree", table.category.asc().nullsLast().op("text_ops"), table.qualityScore.desc().nullsLast().op("numeric_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_category_visibility_created").using("btree", table.category.asc().nullsLast().op("timestamptz_ops"), table.visibility.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_packages_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_packages_desc_trgm").using("gin", table.description.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_packages_display_name").using("btree", table.displayName.asc().nullsLast().op("text_ops")).where(sql`(display_name IS NOT NULL)`),
	index("idx_packages_downloads").using("btree", table.totalDownloads.desc().nullsFirst().op("int4_ops")),
	index("idx_packages_exceptional_quality").using("btree", table.qualityScore.desc().nullsFirst().op("numeric_ops"), table.totalDownloads.desc().nullsFirst().op("numeric_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`((quality_score >= 4.5) AND ((visibility)::text = 'public'::text) AND (deprecated = false))`),
	index("idx_packages_featured").using("btree", table.featured.asc().nullsLast().op("bool_ops")).where(sql`(featured = true)`),
	index("idx_packages_featured_verified").using("btree", table.featured.asc().nullsLast().op("int4_ops"), table.verified.asc().nullsLast().op("int4_ops"), table.totalDownloads.desc().nullsFirst().op("bool_ops")).where(sql`(((visibility)::text = 'public'::text) AND ((featured = true) OR (verified = true)))`),
	index("idx_packages_format").using("btree", table.format.asc().nullsLast().op("text_ops")),
	index("idx_packages_format_search").using("btree", table.format.asc().nullsLast().op("numeric_ops"), table.visibility.asc().nullsLast().op("text_ops"), table.totalDownloads.asc().nullsLast().op("numeric_ops"), table.qualityScore.asc().nullsLast().op("text_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_format_subtype").using("btree", table.format.asc().nullsLast().op("text_ops"), table.subtype.asc().nullsLast().op("text_ops")),
	index("idx_packages_format_subtype_quality").using("btree", table.format.asc().nullsLast().op("numeric_ops"), table.subtype.asc().nullsLast().op("numeric_ops"), table.qualityScore.desc().nullsLast().op("numeric_ops")).where(sql`(((visibility)::text = 'public'::text) AND (deprecated = false))`),
	index("idx_packages_format_subtype_visibility_downloads").using("btree", table.format.asc().nullsLast().op("text_ops"), table.subtype.asc().nullsLast().op("int4_ops"), table.visibility.asc().nullsLast().op("int4_ops"), table.totalDownloads.desc().nullsFirst().op("text_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_format_visibility_downloads").using("btree", table.format.asc().nullsLast().op("int4_ops"), table.visibility.asc().nullsLast().op("text_ops"), table.totalDownloads.desc().nullsFirst().op("text_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_framework").using("btree", table.framework.asc().nullsLast().op("text_ops")).where(sql`(framework IS NOT NULL)`),
	index("idx_packages_framework_quality").using("btree", table.framework.asc().nullsLast().op("text_ops"), table.qualityScore.desc().nullsLast().op("numeric_ops")).where(sql`((framework IS NOT NULL) AND ((visibility)::text = 'public'::text))`),
	index("idx_packages_full_content_search").using("gin", sql`to_tsvector('english'::regconfig, COALESCE(full_content, ''::te`),
	index("idx_packages_install_rate").using("btree", table.installRate.desc().nullsFirst().op("float8_ops")),
	index("idx_packages_installs").using("btree", table.installCount.desc().nullsFirst().op("int4_ops")),
	index("idx_packages_keywords").using("gin", table.keywords.asc().nullsLast().op("array_ops")),
	index("idx_packages_lang_framework").using("btree", table.language.asc().nullsLast().op("text_ops"), table.framework.asc().nullsLast().op("text_ops")).where(sql`((language IS NOT NULL) OR (framework IS NOT NULL))`),
	index("idx_packages_language").using("btree", table.language.asc().nullsLast().op("text_ops")).where(sql`(language IS NOT NULL)`),
	index("idx_packages_language_quality").using("btree", table.language.asc().nullsLast().op("numeric_ops"), table.qualityScore.desc().nullsLast().op("text_ops")).where(sql`((language IS NOT NULL) AND ((visibility)::text = 'public'::text))`),
	index("idx_packages_license").using("btree", table.license.asc().nullsLast().op("text_ops")),
	index("idx_packages_missing_use_cases").using("btree", sql`(((ai_use_cases IS NULL) OR (array_length(ai_use_cases, 1) IS N`).where(sql`((ai_use_cases IS NULL) OR (array_length(ai_use_cases, 1) IS NULL))`),
	index("idx_packages_name_prefix").using("btree", table.name.asc().nullsLast().op("int4_ops"), table.totalDownloads.desc().nullsFirst().op("int4_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_name_trgm").using("gin", table.name.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_packages_needs_enrichment").using("btree", table.aiEnrichmentNeeded.asc().nullsLast().op("bool_ops"), table.totalDownloads.desc().nullsFirst().op("int4_ops")).where(sql`((ai_enrichment_needed = true) AND ((visibility)::text = 'public'::text) AND (deprecated = false))`),
	index("idx_packages_official").using("btree", table.verified.asc().nullsLast().op("bool_ops")).where(sql`((verified = true) AND ((visibility)::text = 'public'::text))`),
	index("idx_packages_official_flag").using("btree", table.official.asc().nullsLast().op("bool_ops")).where(sql`(official = true)`),
	index("idx_packages_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_packages_quality").using("btree", table.qualityScore.desc().nullsLast().op("numeric_ops")),
	index("idx_packages_score").using("btree", table.scoreTotal.desc().nullsFirst().op("int4_ops")),
	index("idx_packages_search_vector").using("gin", table.searchVector.asc().nullsLast().op("tsvector_ops")),
	index("idx_packages_snippet").using("gin", sql`to_tsvector('english'::regconfig, snippet)`),
	index("idx_packages_stale_enrichment").using("btree", table.aiEnrichmentCompletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(ai_enrichment_completed_at IS NOT NULL)`),
	index("idx_packages_subtype").using("btree", table.subtype.asc().nullsLast().op("text_ops")),
	index("idx_packages_subtype_search").using("btree", table.subtype.asc().nullsLast().op("int4_ops"), table.visibility.asc().nullsLast().op("numeric_ops"), table.totalDownloads.asc().nullsLast().op("numeric_ops"), table.qualityScore.asc().nullsLast().op("numeric_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_subtype_visibility_downloads").using("btree", table.subtype.asc().nullsLast().op("text_ops"), table.visibility.asc().nullsLast().op("int4_ops"), table.totalDownloads.desc().nullsFirst().op("int4_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_tags").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	index("idx_packages_tags_contains").using("gin", table.tags.asc().nullsLast().op("array_ops")),
	index("idx_packages_tags_overlap").using("gin", table.tags.asc().nullsLast().op("array_ops")).where(sql`(((visibility)::text = 'public'::text) AND (array_length(tags, 1) > 0))`),
	index("idx_packages_trending").using("btree", table.trendingScore.desc().nullsFirst().op("float8_ops")),
	index("idx_packages_use_cases_stale").using("btree", table.aiUseCasesGeneratedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(ai_use_cases_generated_at IS NOT NULL)`),
	index("idx_packages_views").using("btree", table.viewCount.desc().nullsFirst().op("int4_ops")),
	index("idx_packages_visibility").using("btree", table.visibility.asc().nullsLast().op("text_ops")),
	index("idx_packages_visibility_created").using("btree", table.visibility.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("text_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_visibility_downloads").using("btree", table.visibility.asc().nullsLast().op("int4_ops"), table.totalDownloads.desc().nullsFirst().op("int4_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_visibility_quality").using("btree", table.visibility.asc().nullsLast().op("text_ops"), table.qualityScore.desc().nullsLast().op("text_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_visibility_rating").using("btree", table.visibility.asc().nullsLast().op("numeric_ops"), table.ratingAverage.desc().nullsLast().op("text_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("idx_packages_visibility_updated").using("btree", table.visibility.asc().nullsLast().op("timestamptz_ops"), table.updatedAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`((visibility)::text = 'public'::text)`),
	index("packages_fts_idx").using("gin", sql`packages_search_vector((name)::text, description, tags)`),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "packages_author_id_fkey"
		}),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "packages_org_id_fkey"
		}),
	unique("packages_name_key").on(table.name),
	check("packages_visibility_check", sql`(visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying, 'unlisted'::character varying])::text[])`),
	check("packages_subtype_check", sql`subtype = ANY (ARRAY['rule'::text, 'agent'::text, 'skill'::text, 'slash-command'::text, 'prompt'::text, 'workflow'::text, 'tool'::text, 'template'::text, 'collection'::text, 'chatmode'::text, 'hook'::text])`),
	check("packages_format_check", sql`format = ANY (ARRAY['cursor'::text, 'claude'::text, 'continue'::text, 'windsurf'::text, 'copilot'::text, 'kiro'::text, 'gemini'::text, 'generic'::text, 'mcp'::text, 'agents.md'::text])`),
]);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	subscribedAt: timestamp("subscribed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	confirmed: boolean().default(false),
	unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_newsletter_subscribers_active").using("btree", table.confirmed.asc().nullsLast().op("timestamptz_ops"), table.unsubscribedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`((confirmed = true) AND (unsubscribed_at IS NULL))`),
	index("idx_newsletter_subscribers_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("newsletter_subscribers_email_key").on(table.email),
]);

export const useCasePackages = pgTable("use_case_packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	useCaseId: uuid("use_case_id").notNull(),
	packageId: uuid("package_id").notNull(),
	recommendationReason: text("recommendation_reason").notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	curatedBy: text("curated_by").default('ai'),
}, (table) => [
	index("idx_use_case_packages_package_id").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_use_case_packages_sort_order").using("btree", table.useCaseId.asc().nullsLast().op("uuid_ops"), table.sortOrder.asc().nullsLast().op("uuid_ops")),
	index("idx_use_case_packages_use_case_id").using("btree", table.useCaseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.useCaseId],
			foreignColumns: [useCases.id],
			name: "use_case_packages_use_case_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "use_case_packages_package_id_fkey"
		}).onDelete("cascade"),
	unique("use_case_packages_use_case_id_package_id_key").on(table.useCaseId, table.packageId),
]);

export const subscriptionEvents = pgTable("subscription_events", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	orgId: uuid("org_id"),
	stripeEventId: varchar("stripe_event_id", { length: 255 }).notNull(),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	subscriptionStatus: varchar("subscription_status", { length: 50 }),
	subscriptionPlan: varchar("subscription_plan", { length: 50 }),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_subscription_events_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_subscription_events_event_type").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("idx_subscription_events_org_id").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_subscription_events_stripe_event_id").using("btree", table.stripeEventId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "subscription_events_org_id_fkey"
		}).onDelete("cascade"),
	unique("subscription_events_stripe_event_id_key").on(table.stripeEventId),
]);

export const paymentMethods = pgTable("payment_methods", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	orgId: uuid("org_id"),
	stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 }).notNull(),
	cardBrand: varchar("card_brand", { length: 50 }),
	cardLast4: varchar("card_last4", { length: 4 }),
	cardExpMonth: integer("card_exp_month"),
	cardExpYear: integer("card_exp_year"),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payment_methods_is_default").using("btree", table.isDefault.asc().nullsLast().op("bool_ops")).where(sql`(is_default = true)`),
	index("idx_payment_methods_org_id").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_payment_methods_stripe_payment_method_id").using("btree", table.stripePaymentMethodId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "payment_methods_org_id_fkey"
		}).onDelete("cascade"),
	unique("payment_methods_stripe_payment_method_id_key").on(table.stripePaymentMethodId),
]);

export const invoices = pgTable("invoices", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	orgId: uuid("org_id"),
	stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }).notNull(),
	stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
	amountDue: integer("amount_due").notNull(),
	amountPaid: integer("amount_paid").notNull(),
	currency: varchar({ length: 3 }).default('usd'),
	status: varchar({ length: 50 }).notNull(),
	invoiceDate: timestamp("invoice_date", { withTimezone: true, mode: 'string' }),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	invoicePdfUrl: text("invoice_pdf_url"),
	hostedInvoiceUrl: text("hosted_invoice_url"),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_invoices_invoice_date").using("btree", table.invoiceDate.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_invoices_org_id").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_invoices_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_invoices_stripe_invoice_id").using("btree", table.stripeInvoiceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "invoices_org_id_fkey"
		}).onDelete("cascade"),
	unique("invoices_stripe_invoice_id_key").on(table.stripeInvoiceId),
]);

export const playgroundUsage = pgTable("playground_usage", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	orgId: uuid("org_id"),
	packageId: uuid("package_id"),
	sessionId: uuid("session_id"),
	model: varchar({ length: 50 }).notNull(),
	tokensUsed: integer("tokens_used").notNull(),
	durationMs: integer("duration_ms").notNull(),
	creditsSpent: integer("credits_spent").default(1).notNull(),
	requestSizeBytes: integer("request_size_bytes"),
	responseSizeBytes: integer("response_size_bytes"),
	errorOccurred: boolean("error_occurred").default(false),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	packageVersion: varchar("package_version", { length: 50 }),
	inputLength: integer("input_length"),
	outputLength: integer("output_length"),
	comparisonMode: boolean("comparison_mode").default(false),
	userRating: integer("user_rating"),
	wasHelpful: boolean("was_helpful"),
	userFeedback: text("user_feedback"),
	estimatedApiCost: numeric("estimated_api_cost", { precision: 10, scale:  6 }).default('0'),
	actualInputTokens: integer("actual_input_tokens"),
	actualOutputTokens: integer("actual_output_tokens"),
}, (table) => [
	index("idx_playground_usage_model").using("btree", table.model.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_playground_usage_org_time").using("btree", table.orgId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")).where(sql`(org_id IS NOT NULL)`),
	index("idx_playground_usage_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")).where(sql`(package_id IS NOT NULL)`),
	index("idx_playground_usage_package_model").using("btree", table.packageId.asc().nullsLast().op("uuid_ops"), table.model.asc().nullsLast().op("text_ops")).where(sql`(package_id IS NOT NULL)`),
	index("idx_playground_usage_package_version").using("btree", table.packageId.asc().nullsLast().op("text_ops"), table.packageVersion.asc().nullsLast().op("text_ops")).where(sql`(package_id IS NOT NULL)`),
	index("idx_playground_usage_rating").using("btree", table.userRating.asc().nullsLast().op("int4_ops")).where(sql`(user_rating IS NOT NULL)`),
	index("idx_playground_usage_session").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")).where(sql`(session_id IS NOT NULL)`),
	index("idx_playground_usage_success").using("btree", table.errorOccurred.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_playground_usage_user_time").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "playground_usage_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "playground_usage_org_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "playground_usage_package_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [playgroundSessions.id],
			name: "playground_usage_session_id_fkey"
		}).onDelete("set null"),
	check("playground_usage_user_rating_check", sql`(user_rating >= 1) AND (user_rating <= 5)`),
]);

export const playgroundCredits = pgTable("playground_credits", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	orgId: uuid("org_id"),
	balance: integer().default(0).notNull(),
	lifetimeEarned: integer("lifetime_earned").default(0).notNull(),
	lifetimeSpent: integer("lifetime_spent").default(0).notNull(),
	lifetimePurchased: integer("lifetime_purchased").default(0).notNull(),
	monthlyCredits: integer("monthly_credits").default(0).notNull(),
	monthlyCreditsUsed: integer("monthly_credits_used").default(0).notNull(),
	monthlyResetAt: timestamp("monthly_reset_at", { withTimezone: true, mode: 'string' }),
	rolloverCredits: integer("rollover_credits").default(0).notNull(),
	rolloverExpiresAt: timestamp("rollover_expires_at", { withTimezone: true, mode: 'string' }),
	purchasedCredits: integer("purchased_credits").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_playground_credits_monthly_reset").using("btree", table.monthlyResetAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(monthly_reset_at IS NOT NULL)`),
	index("idx_playground_credits_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")).where(sql`(org_id IS NOT NULL)`),
	index("idx_playground_credits_rollover_expires").using("btree", table.rolloverExpiresAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(rollover_expires_at IS NOT NULL)`),
	index("idx_playground_credits_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "playground_credits_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "playground_credits_org_id_fkey"
		}).onDelete("set null"),
	unique("playground_credits_user_id_key").on(table.userId),
	check("playground_credits_balance_check", sql`balance >= 0`),
	check("balance_sum_check", sql`balance = (((monthly_credits - monthly_credits_used) + rollover_credits) + purchased_credits)`),
]);

export const playgroundCreditTransactions = pgTable("playground_credit_transactions", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	orgId: uuid("org_id"),
	amount: integer().notNull(),
	balanceAfter: integer("balance_after").notNull(),
	transactionType: varchar("transaction_type", { length: 50 }).notNull(),
	description: text().notNull(),
	metadata: jsonb().default({}),
	sessionId: uuid("session_id"),
	purchaseId: varchar("purchase_id", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_playground_credit_tx_purchase").using("btree", table.purchaseId.asc().nullsLast().op("text_ops")).where(sql`(purchase_id IS NOT NULL)`),
	index("idx_playground_credit_tx_session").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")).where(sql`(session_id IS NOT NULL)`),
	index("idx_playground_credit_tx_type").using("btree", table.transactionType.asc().nullsLast().op("text_ops")),
	index("idx_playground_credit_tx_user").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "playground_credit_transactions_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "playground_credit_transactions_org_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [playgroundSessions.id],
			name: "playground_credit_transactions_session_id_fkey"
		}).onDelete("set null"),
	check("playground_credit_transactions_balance_after_check", sql`balance_after >= 0`),
	check("playground_credit_transactions_transaction_type_check", sql`(transaction_type)::text = ANY ((ARRAY['signup'::character varying, 'monthly'::character varying, 'purchase'::character varying, 'spend'::character varying, 'rollover'::character varying, 'expire'::character varying, 'refund'::character varying, 'bonus'::character varying, 'admin'::character varying])::text[])`),
]);

export const playgroundCreditPurchases = pgTable("playground_credit_purchases", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	orgId: uuid("org_id"),
	credits: integer().notNull(),
	amountCents: integer("amount_cents").notNull(),
	currency: varchar({ length: 3 }).default('usd').notNull(),
	packageType: varchar("package_type", { length: 20 }),
	stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
	stripeStatus: varchar("stripe_status", { length: 50 }).default('pending'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	refundedAt: timestamp("refunded_at", { withTimezone: true, mode: 'string' }),
	failedAt: timestamp("failed_at", { withTimezone: true, mode: 'string' }),
	failureReason: text("failure_reason"),
}, (table) => [
	index("idx_playground_credit_purchases_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")).where(sql`(org_id IS NOT NULL)`),
	index("idx_playground_credit_purchases_status").using("btree", table.stripeStatus.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_playground_credit_purchases_stripe").using("btree", table.stripePaymentIntentId.asc().nullsLast().op("text_ops")),
	index("idx_playground_credit_purchases_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "playground_credit_purchases_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "playground_credit_purchases_org_id_fkey"
		}).onDelete("set null"),
	unique("playground_credit_purchases_stripe_payment_intent_id_key").on(table.stripePaymentIntentId),
	check("playground_credit_purchases_credits_check", sql`credits > 0`),
	check("playground_credit_purchases_amount_cents_check", sql`amount_cents > 0`),
	check("playground_credit_purchases_package_type_check", sql`(package_type)::text = ANY ((ARRAY['small'::character varying, 'medium'::character varying, 'large'::character varying])::text[])`),
	check("playground_credit_purchases_stripe_status_check", sql`(stripe_status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'refunded'::character varying, 'canceled'::character varying])::text[])`),
]);

export const generatedTestCases = pgTable("generated_test_cases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityType: varchar("entity_type", { length: 20 }).notNull(),
	entityId: uuid("entity_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	input: text().notNull(),
	difficulty: varchar({ length: 20 }),
	testType: varchar("test_type", { length: 50 }),
	expectedCriteria: text("expected_criteria").array(),
	tags: text().array(),
	confidenceScore: numeric("confidence_score", { precision: 3, scale:  2 }),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow(),
	versionGeneratedFrom: varchar("version_generated_from", { length: 50 }),
	isActive: boolean("is_active").default(true),
	usageCount: integer("usage_count").default(0),
	helpfulVotes: integer("helpful_votes").default(0),
	unhelpfulVotes: integer("unhelpful_votes").default(0),
	successRate: numeric("success_rate", { precision: 3, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_test_cases_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_test_cases_difficulty").using("btree", table.difficulty.asc().nullsLast().op("text_ops")),
	index("idx_test_cases_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
	index("idx_test_cases_success_rate").using("btree", table.successRate.desc().nullsLast().op("numeric_ops")),
	index("idx_test_cases_usage").using("btree", table.usageCount.desc().nullsFirst().op("int4_ops")),
	check("generated_test_cases_entity_type_check", sql`(entity_type)::text = ANY ((ARRAY['package'::character varying, 'collection'::character varying])::text[])`),
	check("generated_test_cases_difficulty_check", sql`(difficulty)::text = ANY ((ARRAY['basic'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::text[])`),
	check("generated_test_cases_test_type_check", sql`(test_type)::text = ANY ((ARRAY['concept'::character varying, 'practical'::character varying, 'edge_case'::character varying, 'comparison'::character varying, 'quality'::character varying])::text[])`),
	check("generated_test_cases_confidence_score_check", sql`(confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)`),
]);

export const testCaseFeedback = pgTable("test_case_feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	testCaseId: uuid("test_case_id").notNull(),
	userId: uuid("user_id").notNull(),
	wasHelpful: boolean("was_helpful").notNull(),
	feedbackComment: text("feedback_comment"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_test_feedback_test_case").using("btree", table.testCaseId.asc().nullsLast().op("uuid_ops")),
	index("idx_test_feedback_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.testCaseId],
			foreignColumns: [generatedTestCases.id],
			name: "test_case_feedback_test_case_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "test_case_feedback_user_id_fkey"
		}).onDelete("cascade"),
	unique("test_case_feedback_test_case_id_user_id_key").on(table.testCaseId, table.userId),
]);

export const packageInstallations = pgTable("package_installations", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	packageId: uuid("package_id"),
	version: varchar({ length: 50 }),
	userId: uuid("user_id"),
	sessionId: varchar("session_id", { length: 100 }),
	installedAt: timestamp("installed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	format: varchar({ length: 50 }),
	installBatchId: uuid("install_batch_id"),
}, (table) => [
	index("idx_installations_batch").using("btree", table.installBatchId.asc().nullsLast().op("uuid_ops")).where(sql`(install_batch_id IS NOT NULL)`),
	index("idx_installations_date").using("btree", table.installedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_installations_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")).where(sql`(session_id IS NOT NULL)`),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_installations_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "package_installations_user_id_fkey"
		}).onDelete("set null"),
]);

export const userCostAlerts = pgTable("user_cost_alerts", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	alertType: varchar("alert_type", { length: 50 }).notNull(),
	thresholdAmount: numeric("threshold_amount", { precision: 10, scale:  4 }).notNull(),
	currentAmount: numeric("current_amount", { precision: 10, scale:  4 }).notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true, mode: 'string' }),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_user_cost_alerts_type").using("btree", table.alertType.asc().nullsLast().op("timestamptz_ops"), table.sentAt.desc().nullsFirst().op("text_ops")),
	index("idx_user_cost_alerts_unresolved").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.alertType.asc().nullsLast().op("uuid_ops")).where(sql`(resolved_at IS NULL)`),
	index("idx_user_cost_alerts_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_cost_alerts_user_id_fkey"
		}).onDelete("cascade"),
	check("user_cost_alerts_alert_type_check", sql`(alert_type)::text = ANY ((ARRAY['warning_50'::character varying, 'warning_75'::character varying, 'warning_90'::character varying, 'limit_exceeded'::character varying, 'throttled'::character varying])::text[])`),
]);

export const costLimitsConfig = pgTable("cost_limits_config", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	tierName: varchar("tier_name", { length: 50 }).notNull(),
	monthlyCostLimit: numeric("monthly_cost_limit", { precision: 10, scale:  4 }).notNull(),
	dailyCostLimit: numeric("daily_cost_limit", { precision: 10, scale:  4 }),
	hourlyRequestLimit: integer("hourly_request_limit"),
	throttleOnExceed: boolean("throttle_on_exceed").default(true),
	alertAtPercent: integer("alert_at_percent").array().default([50, 75, 90]),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_cost_limits_tier").using("btree", table.tierName.asc().nullsLast().op("text_ops")).where(sql`(is_active = true)`),
	unique("cost_limits_config_tier_name_key").on(table.tierName),
	check("cost_limits_config_tier_name_check", sql`(tier_name)::text = ANY ((ARRAY['free'::character varying, 'prpm_plus_individual'::character varying, 'prpm_plus_org'::character varying, 'unlimited'::character varying])::text[])`),
]);

export const sharedResultViews = pgTable("shared_result_views", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	viewerUserId: uuid("viewer_user_id"),
	ipHash: varchar("ip_hash", { length: 64 }),
	userAgent: text("user_agent"),
	referrer: text(),
	timeSpentSeconds: integer("time_spent_seconds"),
	wasHelpful: boolean("was_helpful"),
	feedbackText: text("feedback_text"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_shared_result_views_ip").using("btree", table.sessionId.asc().nullsLast().op("text_ops"), table.ipHash.asc().nullsLast().op("text_ops")),
	index("idx_shared_result_views_session").using("btree", table.sessionId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_shared_result_views_viewer").using("btree", table.viewerUserId.asc().nullsLast().op("uuid_ops")).where(sql`(viewer_user_id IS NOT NULL)`),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [playgroundSessions.id],
			name: "shared_result_views_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.viewerUserId],
			foreignColumns: [users.id],
			name: "shared_result_views_viewer_user_id_fkey"
		}).onDelete("set null"),
]);

export const playgroundSessions = pgTable("playground_sessions", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	orgId: uuid("org_id"),
	packageId: uuid("package_id"),
	packageVersion: varchar("package_version", { length: 50 }),
	packageName: varchar("package_name", { length: 255 }),
	conversation: jsonb().default([]).notNull(),
	creditsSpent: integer("credits_spent").default(1).notNull(),
	estimatedTokens: integer("estimated_tokens").default(2000),
	model: varchar({ length: 50 }).default('claude-3-5-sonnet-20241022').notNull(),
	totalTokens: integer("total_tokens").default(0),
	totalDurationMs: integer("total_duration_ms").default(0),
	runCount: integer("run_count").default(1),
	isPublic: boolean("is_public").default(false),
	shareToken: varchar("share_token", { length: 32 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastRunAt: timestamp("last_run_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	viewCount: integer("view_count").default(0),
	uniqueViewers: integer("unique_viewers").default(0),
	lastViewedAt: timestamp("last_viewed_at", { withTimezone: true, mode: 'string' }),
	sharedAt: timestamp("shared_at", { withTimezone: true, mode: 'string' }),
	helpfulCount: integer("helpful_count").default(0),
	notHelpfulCount: integer("not_helpful_count").default(0),
	isFeaturedByAuthor: boolean("is_featured_by_author").default(false),
	featuredAt: timestamp("featured_at", { withTimezone: true, mode: 'string' }),
	featuredByUserId: uuid("featured_by_user_id"),
	featureDescription: text("feature_description"),
	featureDisplayOrder: integer("feature_display_order").default(0),
	isComparison: boolean("is_comparison").default(false),
	comparisonSessionId: uuid("comparison_session_id"),
	comparisonLabel: varchar("comparison_label", { length: 20 }),
}, (table) => [
	index("idx_playground_sessions_comparison").using("btree", table.comparisonSessionId.asc().nullsLast().op("uuid_ops")).where(sql`(is_comparison = true)`),
	index("idx_playground_sessions_custom_prompts").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")).where(sql`((package_id IS NULL) AND ((package_name)::text = 'Custom Prompt'::text))`),
	index("idx_playground_sessions_featured").using("btree", table.packageId.asc().nullsLast().op("int4_ops"), table.featureDisplayOrder.asc().nullsLast().op("uuid_ops")).where(sql`((is_featured_by_author = true) AND (is_public = true))`),
	index("idx_playground_sessions_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")).where(sql`(org_id IS NOT NULL)`),
	index("idx_playground_sessions_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_playground_sessions_public_popular").using("btree", table.packageId.asc().nullsLast().op("uuid_ops"), table.viewCount.desc().nullsFirst().op("uuid_ops")).where(sql`(is_public = true)`),
	index("idx_playground_sessions_public_recent").using("btree", table.packageId.asc().nullsLast().op("uuid_ops"), table.sharedAt.desc().nullsFirst().op("uuid_ops")).where(sql`((is_public = true) AND (shared_at IS NOT NULL))`),
	index("idx_playground_sessions_share").using("btree", table.shareToken.asc().nullsLast().op("text_ops")).where(sql`(is_public = true)`),
	index("idx_playground_sessions_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "playground_sessions_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "playground_sessions_org_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "playground_sessions_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.featuredByUserId],
			foreignColumns: [users.id],
			name: "playground_sessions_featured_by_user_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.comparisonSessionId],
			foreignColumns: [table.id],
			name: "playground_sessions_comparison_session_id_fkey"
		}).onDelete("set null"),
	unique("playground_sessions_share_token_key").on(table.shareToken),
	check("playground_sessions_package_or_custom_check", sql`(package_id IS NOT NULL) OR ((package_name)::text = 'Custom Prompt'::text)`),
	check("playground_sessions_comparison_label_check", sql`(comparison_label)::text = ANY ((ARRAY['A'::character varying, 'B'::character varying, NULL::character varying])::text[])`),
]);

export const suggestedTestInputs = pgTable("suggested_test_inputs", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	packageId: uuid("package_id").notNull(),
	authorId: uuid("author_id"),
	title: varchar({ length: 100 }).notNull(),
	description: text(),
	suggestedInput: text("suggested_input").notNull(),
	category: varchar({ length: 50 }),
	difficulty: varchar({ length: 20 }).default('beginner'),
	estimatedCredits: integer("estimated_credits").default(1),
	recommendedModel: varchar("recommended_model", { length: 50 }),
	displayOrder: integer("display_order").default(0),
	isActive: boolean("is_active").default(true),
	usageCount: integer("usage_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_suggested_test_inputs_author").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_suggested_test_inputs_category").using("btree", table.packageId.asc().nullsLast().op("uuid_ops"), table.category.asc().nullsLast().op("uuid_ops")).where(sql`(is_active = true)`),
	index("idx_suggested_test_inputs_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops"), table.displayOrder.asc().nullsLast().op("int4_ops")).where(sql`(is_active = true)`),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "suggested_test_inputs_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "suggested_test_inputs_author_id_fkey"
		}).onDelete("cascade"),
	check("valid_difficulty", sql`(difficulty)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::text[])`),
	check("valid_model", sql`(recommended_model IS NULL) OR ((recommended_model)::text = ANY ((ARRAY['sonnet'::character varying, 'opus'::character varying, 'gpt-4o'::character varying, 'gpt-4o-mini'::character varying, 'gpt-4-turbo'::character varying])::text[]))`),
]);

export const suggestedInputUsage = pgTable("suggested_input_usage", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	suggestedInputId: uuid("suggested_input_id").notNull(),
	userId: uuid("user_id"),
	sessionId: uuid("session_id"),
	clickedAt: timestamp("clicked_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedTest: boolean("completed_test").default(false),
	ipHash: varchar("ip_hash", { length: 64 }),
	userAgent: text("user_agent"),
}, (table) => [
	index("idx_suggested_input_usage_input").using("btree", table.suggestedInputId.asc().nullsLast().op("timestamptz_ops"), table.clickedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_suggested_input_usage_session").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")).where(sql`(session_id IS NOT NULL)`),
	foreignKey({
			columns: [table.suggestedInputId],
			foreignColumns: [suggestedTestInputs.id],
			name: "suggested_input_usage_suggested_input_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "suggested_input_usage_user_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [playgroundSessions.id],
			name: "suggested_input_usage_session_id_fkey"
		}).onDelete("set null"),
]);

export const anonymousPlaygroundUsage = pgTable("anonymous_playground_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fingerprintHash: varchar("fingerprint_hash", { length: 64 }).notNull(),
	ipAddress: inet("ip_address").notNull(),
	ipSubnet: varchar("ip_subnet", { length: 50 }).notNull(),
	userAgentNormalized: varchar("user_agent_normalized", { length: 255 }).notNull(),
	firstUsedAt: timestamp("first_used_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	usageCount: integer("usage_count").default(1),
	currentMonth: varchar("current_month", { length: 7 }).notNull(),
	packageId: uuid("package_id"),
	model: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_anonymous_usage_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_anonymous_usage_current_month").using("btree", table.currentMonth.asc().nullsLast().op("text_ops")),
	index("idx_anonymous_usage_fingerprint").using("btree", table.fingerprintHash.asc().nullsLast().op("text_ops"), table.currentMonth.asc().nullsLast().op("text_ops")),
	index("idx_anonymous_usage_ip_subnet").using("btree", table.ipSubnet.asc().nullsLast().op("text_ops"), table.currentMonth.asc().nullsLast().op("text_ops")),
	index("idx_anonymous_usage_last_used").using("btree", table.lastUsedAt.asc().nullsLast().op("timestamptz_ops")),
	unique("anonymous_playground_usage_fingerprint_hash_current_month_key").on(table.fingerprintHash, table.currentMonth),
]);

export const packageEmbeddings = pgTable("package_embeddings", {
	packageId: uuid("package_id").primaryKey().notNull(),
	aiUseCaseDescription: text("ai_use_case_description"),
	aiProblemStatement: text("ai_problem_statement"),
	aiSimilarTo: text("ai_similar_to").array().default([""]),
	aiBestFor: text("ai_best_for"),
	embedding: vector({ dimensions: 1536 }),
	generatedAt: timestamp("generated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	embeddingSourceHash: varchar("embedding_source_hash", { length: 64 }),
}, (table) => [
	index("idx_package_embeddings_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_package_embeddings_updated").using("btree", table.updatedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_package_embeddings_vector").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "100"}),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_embeddings_package_id_fkey"
		}).onDelete("cascade"),
]);

export const playgroundSessionFeedback = pgTable("playground_session_feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	userId: uuid("user_id"),
	ipHash: varchar("ip_hash", { length: 64 }),
	isEffective: boolean("is_effective").notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	exchangeIndex: integer("exchange_index").default(0).notNull(),
}, (table) => [
	index("idx_feedback_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_feedback_effective").using("btree", table.isEffective.asc().nullsLast().op("bool_ops")),
	index("idx_feedback_package_effective").using("btree", table.isEffective.asc().nullsLast().op("bool_ops"), table.createdAt.asc().nullsLast().op("bool_ops")).where(sql`(is_effective IS NOT NULL)`),
	index("idx_feedback_session_exchange").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops"), table.exchangeIndex.asc().nullsLast().op("uuid_ops")),
	index("idx_feedback_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_feedback_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")).where(sql`(user_id IS NOT NULL)`),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [playgroundSessions.id],
			name: "playground_session_feedback_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "playground_session_feedback_user_id_fkey"
		}).onDelete("set null"),
	unique("unique_session_exchange_feedback").on(table.sessionId, table.exchangeIndex),
]);

export const errorAlerts = pgTable("error_alerts", {
	id: serial().primaryKey().notNull(),
	operation: varchar({ length: 100 }).notNull(),
	errorName: varchar("error_name", { length: 255 }).notNull(),
	errorCount: integer("error_count").notNull(),
	threshold: integer().notNull(),
	timeWindowMs: integer("time_window_ms").notNull(),
	resolved: boolean().default(false),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("error_alerts_active_idx").using("btree", table.resolved.asc().nullsLast().op("timestamp_ops"), table.createdAt.desc().nullsFirst().op("timestamp_ops")).where(sql`(resolved = false)`),
	index("error_alerts_operation_idx").using("btree", table.operation.asc().nullsLast().op("timestamp_ops"), table.createdAt.desc().nullsFirst().op("timestamp_ops")),
]);

export const errorLogs = pgTable("error_logs", {
	id: serial().primaryKey().notNull(),
	operation: varchar({ length: 100 }).notNull(),
	errorName: varchar("error_name", { length: 255 }).notNull(),
	errorMessage: text("error_message").notNull(),
	errorStack: text("error_stack"),
	userId: varchar("user_id", { length: 255 }),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("error_logs_operation_time_idx").using("btree", table.operation.asc().nullsLast().op("timestamp_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	index("error_logs_time_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("error_logs_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")).where(sql`(user_id IS NOT NULL)`),
]);

export const reviewHelpful = pgTable("review_helpful", {
	reviewId: uuid("review_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [packageReviews.id],
			name: "review_helpful_review_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "review_helpful_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.reviewId, table.userId], name: "review_helpful_pkey"}),
]);

export const packageStars = pgTable("package_stars", {
	packageId: uuid("package_id").notNull(),
	userId: uuid("user_id").notNull(),
	starredAt: timestamp("starred_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_package_stars_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_package_stars_starred_at").using("btree", table.starredAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_package_stars_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_stars_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "package_stars_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.packageId, table.userId], name: "package_stars_pkey"}),
]);

export const packageCategories = pgTable("package_categories", {
	packageId: uuid("package_id").notNull(),
	categoryId: uuid("category_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_package_categories_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_package_categories_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_categories_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "package_categories_category_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.packageId, table.categoryId], name: "package_categories_pkey"}),
]);

export const packageUseCases = pgTable("package_use_cases", {
	packageId: uuid("package_id").notNull(),
	useCaseId: uuid("use_case_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_package_use_cases_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_package_use_cases_use_case").using("btree", table.useCaseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "package_use_cases_package_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.useCaseId],
			foreignColumns: [useCases.id],
			name: "package_use_cases_use_case_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.packageId, table.useCaseId], name: "package_use_cases_pkey"}),
]);

export const collectionStars = pgTable("collection_stars", {
	userId: uuid("user_id").notNull(),
	starredAt: timestamp("starred_at", { mode: 'string' }).defaultNow(),
	collectionId: uuid("collection_id").notNull(),
}, (table) => [
	index("idx_collection_stars_collection").using("btree", table.collectionId.asc().nullsLast().op("uuid_ops")),
	index("idx_collection_stars_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "collection_stars_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "collection_stars_collection_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.collectionId], name: "collection_stars_pkey"}),
]);

export const reviewVotes = pgTable("review_votes", {
	reviewId: uuid("review_id").notNull(),
	userId: uuid("user_id").notNull(),
	vote: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [ratings.id],
			name: "review_votes_review_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "review_votes_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.reviewId, table.userId], name: "review_votes_pkey"}),
	check("review_votes_vote_check", sql`vote = ANY (ARRAY['-1'::integer, 1])`),
]);

export const installationPairs = pgTable("installation_pairs", {
	packageA: varchar("package_a", { length: 255 }).notNull(),
	packageB: varchar("package_b", { length: 255 }).notNull(),
	pairCount: integer("pair_count").default(1),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_installation_pairs_a").using("btree", table.packageA.asc().nullsLast().op("int4_ops"), table.pairCount.desc().nullsFirst().op("int4_ops")),
	index("idx_installation_pairs_b").using("btree", table.packageB.asc().nullsLast().op("int4_ops"), table.pairCount.desc().nullsFirst().op("text_ops")),
	primaryKey({ columns: [table.packageA, table.packageB], name: "installation_pairs_pkey"}),
]);

export const organizationMembers = pgTable("organization_members", {
	orgId: uuid("org_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: varchar({ length: 50 }).notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isPublic: boolean("is_public").default(true),
}, (table) => [
	index("idx_org_members_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_org_members_public").using("btree", table.orgId.asc().nullsLast().op("uuid_ops"), table.isPublic.asc().nullsLast().op("uuid_ops")).where(sql`(is_public = true)`),
	index("idx_org_members_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "organization_members_org_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "organization_members_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.orgId, table.userId], name: "organization_members_pkey"}),
	check("organization_members_role_check", sql`(role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'maintainer'::character varying, 'member'::character varying])::text[])`),
]);

export const badges = pgTable("badges", {
	packageId: uuid("package_id").notNull(),
	badgeType: varchar("badge_type", { length: 50 }).notNull(),
	awardedAt: timestamp("awarded_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	metadata: jsonb(),
}, (table) => [
	index("idx_badges_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_badges_type").using("btree", table.badgeType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "badges_package_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.packageId, table.badgeType], name: "badges_pkey"}),
]);

export const packageCoInstallations = pgTable("package_co_installations", {
	packageAId: uuid("package_a_id").notNull(),
	packageBId: uuid("package_b_id").notNull(),
	coInstallCount: integer("co_install_count").default(1),
	confidenceScore: numeric("confidence_score", { precision: 5, scale:  2 }).default('0'),
	lastCoInstalledAt: timestamp("last_co_installed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	firstCoInstalledAt: timestamp("first_co_installed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_co_installs_confidence").using("btree", table.confidenceScore.desc().nullsFirst().op("numeric_ops")),
	index("idx_co_installs_count").using("btree", table.coInstallCount.desc().nullsFirst().op("int4_ops")),
	index("idx_co_installs_package_a").using("btree", table.packageAId.asc().nullsLast().op("numeric_ops"), table.confidenceScore.desc().nullsFirst().op("numeric_ops")),
	index("idx_co_installs_package_b").using("btree", table.packageBId.asc().nullsLast().op("numeric_ops"), table.confidenceScore.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.packageAId],
			foreignColumns: [packages.id],
			name: "package_co_installations_package_a_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.packageBId],
			foreignColumns: [packages.id],
			name: "package_co_installations_package_b_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.packageAId, table.packageBId], name: "package_co_installations_pkey"}),
	check("package_co_installations_check", sql`package_a_id < package_b_id`),
]);

export const collectionPackages = pgTable("collection_packages", {
	packageId: uuid("package_id").notNull(),
	packageVersion: varchar("package_version", { length: 50 }),
	required: boolean().default(true),
	reason: text(),
	installOrder: integer("install_order").default(0),
	formatOverride: varchar("format_override", { length: 50 }),
	collectionId: uuid("collection_id").notNull(),
}, (table) => [
	index("idx_collection_packages_collection").using("btree", table.collectionId.asc().nullsLast().op("uuid_ops")),
	index("idx_collection_packages_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [packages.id],
			name: "collection_packages_package_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "collection_packages_collection_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.packageId, table.collectionId], name: "collection_packages_pkey"}),
]);
export const playgroundComparisonSessions = pgView("playground_comparison_sessions", {	sessionAId: uuid("session_a_id"),
	shareToken: varchar("share_token", { length: 32 }),
	userId: uuid("user_id"),
	packageAId: uuid("package_a_id"),
	packageAName: varchar("package_a_name", { length: 255 }),
	packageAVersion: varchar("package_a_version", { length: 50 }),
	modelA: varchar("model_a", { length: 50 }),
	conversationA: jsonb("conversation_a"),
	creditsA: integer("credits_a"),
	tokensA: integer("tokens_a"),
	sessionBId: uuid("session_b_id"),
	packageBId: uuid("package_b_id"),
	packageBName: varchar("package_b_name", { length: 255 }),
	packageBVersion: varchar("package_b_version", { length: 50 }),
	modelB: varchar("model_b", { length: 50 }),
	conversationB: jsonb("conversation_b"),
	creditsB: integer("credits_b"),
	tokensB: integer("tokens_b"),
	viewCount: integer("view_count"),
	helpfulCount: integer("helpful_count"),
	notHelpfulCount: integer("not_helpful_count"),
	sharedAt: timestamp("shared_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT a.id AS session_a_id, a.share_token, a.user_id, a.package_id AS package_a_id, a.package_name AS package_a_name, a.package_version AS package_a_version, a.model AS model_a, a.conversation AS conversation_a, a.credits_spent AS credits_a, a.total_tokens AS tokens_a, b.id AS session_b_id, b.package_id AS package_b_id, b.package_name AS package_b_name, b.package_version AS package_b_version, b.model AS model_b, b.conversation AS conversation_b, b.credits_spent AS credits_b, b.total_tokens AS tokens_b, a.view_count, a.helpful_count, a.not_helpful_count, a.shared_at, a.created_at FROM playground_sessions a JOIN playground_sessions b ON a.comparison_session_id = b.id WHERE a.is_comparison = true AND a.comparison_label::text = 'A'::text AND a.is_public = true`);

export const packageDependencies = pgMaterializedView("package_dependencies", {	packageId: uuid("package_id"),
	version: varchar({ length: 50 }),
	dependencyName: text("dependency_name"),
	dependencyVersion: text("dependency_version"),
}).as(sql`SELECT pv.package_id, pv.version, dep.key AS dependency_name, dep.value::text AS dependency_version FROM package_versions pv CROSS JOIN LATERAL jsonb_each(pv.dependencies) dep(key, value)`);

export const activeAuthorInvites = pgView("active_author_invites", {	id: uuid(),
	token: varchar({ length: 64 }),
	authorUsername: varchar("author_username", { length: 100 }),
	email: varchar({ length: 255 }),
	packageCount: integer("package_count"),
	status: varchar({ length: 50 }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	invitedByUsername: varchar("invited_by_username", { length: 100 }),
	invitedByEmail: varchar("invited_by_email", { length: 255 }),
}).as(sql`SELECT ai.id, ai.token, ai.author_username, ai.email, ai.package_count, ai.status, ai.expires_at, ai.created_at, u.username AS invited_by_username, u.email AS invited_by_email FROM author_invites ai LEFT JOIN users u ON ai.invited_by = u.id WHERE ai.status::text = 'pending'::text AND ai.expires_at > now()`);

export const topUnclaimedAuthors = pgView("top_unclaimed_authors", {	authorUsername: text("author_username"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	packageCount: bigint("package_count", { mode: "number" }),
	packageTypes: text("package_types"),
	categories: varchar(),
	firstPackageDate: timestamp("first_package_date", { withTimezone: true, mode: 'string' }),
	latestPackageDate: timestamp("latest_package_date", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalDownloads: bigint("total_downloads", { mode: "number" }),
	isClaimed: boolean("is_claimed"),
	hasPendingInvite: boolean("has_pending_invite"),
}).as(sql`WITH author_stats AS ( SELECT split_part(p.name::text, '/'::text, 1) AS author_username, count(*) AS package_count, array_agg(DISTINCT concat(p.format, '-', p.subtype)) AS package_types, array_agg(DISTINCT p.category) AS categories, min(p.created_at) AS first_package_date, max(p.created_at) AS latest_package_date, sum(p.total_downloads) AS total_downloads FROM packages p WHERE p.name::text ~~ '@%/%'::text GROUP BY (split_part(p.name::text, '/'::text, 1)) HAVING count(*) >= 5 ) SELECT author_stats.author_username, author_stats.package_count, author_stats.package_types, author_stats.categories, author_stats.first_package_date, author_stats.latest_package_date, author_stats.total_downloads, (EXISTS ( SELECT 1 FROM users u WHERE u.claimed_author_username::text = author_stats.author_username)) AS is_claimed, (EXISTS ( SELECT 1 FROM author_invites ai WHERE ai.author_username::text = author_stats.author_username AND ai.status::text = 'pending'::text)) AS has_pending_invite FROM author_stats ORDER BY author_stats.package_count DESC, author_stats.total_downloads DESC`);

export const categoryStats = pgView("category_stats", {	category: varchar(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	packageCount: bigint("package_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalDownloads: bigint("total_downloads", { mode: "number" }),
	avgQualityScore: numeric("avg_quality_score"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	packagesLast30Days: bigint("packages_last_30_days", { mode: "number" }),
}).as(sql`SELECT COALESCE(packages.category, 'uncategorized'::character varying) AS category, count(*) AS package_count, sum(packages.total_downloads) AS total_downloads, avg(packages.quality_score) AS avg_quality_score, count(*) FILTER (WHERE packages.created_at > (now() - '30 days'::interval)) AS packages_last_30_days FROM packages WHERE packages.visibility::text = 'public'::text GROUP BY packages.category ORDER BY (count(*)) DESC`);

export const packageEffectiveCategory = pgView("package_effective_category", {	id: uuid(),
	name: varchar({ length: 255 }),
	userCategory: varchar("user_category", { length: 100 }),
	aiCategory: text("ai_category"),
	effectiveCategory: text("effective_category"),
}).as(sql`SELECT packages.id, packages.name, packages.category AS user_category, packages.ai_category, COALESCE(packages.ai_category, packages.category::text) AS effective_category FROM packages`);

export const relatedPackagesView = pgView("related_packages_view", {	packageAId: uuid("package_a_id"),
	packageBId: uuid("package_b_id"),
	coInstallCount: integer("co_install_count"),
	confidenceScore: numeric("confidence_score", { precision: 5, scale:  2 }),
	packageAName: varchar("package_a_name", { length: 255 }),
	packageADescription: text("package_a_description"),
	packageBName: varchar("package_b_name", { length: 255 }),
	packageBDescription: text("package_b_description"),
	packageBDownloads: integer("package_b_downloads"),
	packageBQuality: numeric("package_b_quality", { precision: 3, scale:  2 }),
}).as(sql`SELECT pc.package_a_id, pc.package_b_id, pc.co_install_count, pc.confidence_score, pa.name AS package_a_name, pa.description AS package_a_description, pb.name AS package_b_name, pb.description AS package_b_description, pb.total_downloads AS package_b_downloads, pb.quality_score AS package_b_quality FROM package_co_installations pc JOIN packages pa ON pc.package_a_id = pa.id JOIN packages pb ON pc.package_b_id = pb.id WHERE pc.confidence_score > 10::numeric ORDER BY pc.confidence_score DESC`);

export const playgroundSecurityEvents = pgView("playground_security_events", {	id: uuid(),
	userId: uuid("user_id"),
	username: varchar({ length: 100 }),
	email: varchar({ length: 255 }),
	eventType: varchar("event_type", { length: 50 }),
	eventDetails: jsonb("event_details"),
	ipAddress: inet("ip_address"),
	fingerprintHash: varchar("fingerprint_hash", { length: 64 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	suspiciousEventsLastHour: bigint("suspicious_events_last_hour", { mode: "number" }),
}).as(sql`SELECT psa.id, psa.user_id, u.username, u.email, psa.event_type, psa.event_details, psa.ip_address, psa.fingerprint_hash, psa.created_at, ( SELECT count(*) AS count FROM playground_session_audit psa2 WHERE psa2.user_id = psa.user_id AND (psa2.event_type::text = ANY (ARRAY['fingerprint_mismatch'::character varying, 'rate_limited'::character varying]::text[])) AND psa2.created_at > (now() - '01:00:00'::interval)) AS suspicious_events_last_hour FROM playground_session_audit psa LEFT JOIN users u ON psa.user_id = u.id WHERE psa.event_type::text = ANY (ARRAY['fingerprint_mismatch'::character varying, 'rate_limited'::character varying]::text[]) ORDER BY psa.created_at DESC`);

export const playgroundUsageTimeSeries = pgView("playground_usage_time_series", {	packageId: uuid("package_id"),
	authorId: uuid("author_id"),
	date: date(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sessionsCount: bigint("sessions_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uniqueUsers: bigint("unique_users", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	creditsSpent: bigint("credits_spent", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sharedCount: bigint("shared_count", { mode: "number" }),
}).as(sql`SELECT ps.package_id, p.author_id, date(ps.created_at) AS date, count(DISTINCT ps.id) AS sessions_count, count(DISTINCT ps.user_id) AS unique_users, sum(ps.credits_spent) AS credits_spent, count(DISTINCT CASE WHEN ps.is_public = true THEN ps.id ELSE NULL::uuid END) AS shared_count FROM playground_sessions ps JOIN packages p ON ps.package_id = p.id WHERE ps.created_at > (now() - '90 days'::interval) GROUP BY ps.package_id, p.author_id, (date(ps.created_at)) ORDER BY (date(ps.created_at)) DESC`);

export const suggestedInputUsageTimeSeries = pgView("suggested_input_usage_time_series", {	suggestedInputId: uuid("suggested_input_id"),
	packageId: uuid("package_id"),
	authorId: uuid("author_id"),
	date: date(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clicks: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	completions: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uniqueUsers: bigint("unique_users", { mode: "number" }),
}).as(sql`SELECT sti.id AS suggested_input_id, sti.package_id, sti.author_id, date(siu.clicked_at) AS date, count(DISTINCT siu.id) AS clicks, count(DISTINCT CASE WHEN siu.completed_test = true THEN siu.id ELSE NULL::uuid END) AS completions, count(DISTINCT siu.user_id) AS unique_users FROM suggested_test_inputs sti LEFT JOIN suggested_input_usage siu ON sti.id = siu.suggested_input_id WHERE siu.clicked_at > (now() - '90 days'::interval) GROUP BY sti.id, sti.package_id, sti.author_id, (date(siu.clicked_at)) ORDER BY (date(siu.clicked_at)) DESC`);

export const suggestedInputAnalytics = pgMaterializedView("suggested_input_analytics", {	suggestedInputId: uuid("suggested_input_id"),
	packageId: uuid("package_id"),
	authorId: uuid("author_id"),
	title: varchar({ length: 100 }),
	category: varchar({ length: 50 }),
	difficulty: varchar({ length: 20 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalClicks: bigint("total_clicks", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	completedTests: bigint("completed_tests", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uniqueUsers: bigint("unique_users", { mode: "number" }),
	conversionRate: numeric("conversion_rate"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clicksLast7Days: bigint("clicks_last_7_days", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	clicksLast30Days: bigint("clicks_last_30_days", { mode: "number" }),
	lastClickedAt: timestamp("last_clicked_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT sti.id AS suggested_input_id, sti.package_id, sti.author_id, sti.title, sti.category, sti.difficulty, sti.created_at, count(DISTINCT siu.id) AS total_clicks, count(DISTINCT CASE WHEN siu.completed_test = true THEN siu.id ELSE NULL::uuid END) AS completed_tests, count(DISTINCT siu.user_id) AS unique_users, CASE WHEN count(DISTINCT siu.id) > 0 THEN count(DISTINCT CASE WHEN siu.completed_test = true THEN siu.id ELSE NULL::uuid END)::numeric / count(DISTINCT siu.id)::numeric * 100::numeric ELSE 0::numeric END AS conversion_rate, count(DISTINCT CASE WHEN siu.clicked_at > (now() - '7 days'::interval) THEN siu.id ELSE NULL::uuid END) AS clicks_last_7_days, count(DISTINCT CASE WHEN siu.clicked_at > (now() - '30 days'::interval) THEN siu.id ELSE NULL::uuid END) AS clicks_last_30_days, max(siu.clicked_at) AS last_clicked_at FROM suggested_test_inputs sti LEFT JOIN suggested_input_usage siu ON sti.id = siu.suggested_input_id WHERE sti.is_active = true GROUP BY sti.id, sti.package_id, sti.author_id, sti.title, sti.category, sti.difficulty, sti.created_at`);

export const anonymousPlaygroundStats = pgView("anonymous_playground_stats", {	currentMonth: varchar("current_month", { length: 7 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uniqueUsers: bigint("unique_users", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalAttempts: bigint("total_attempts", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	usersExceededQuota: bigint("users_exceeded_quota", { mode: "number" }),
	avgAttemptsPerUser: numeric("avg_attempts_per_user"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uniqueIpSubnets: bigint("unique_ip_subnets", { mode: "number" }),
}).as(sql`SELECT anonymous_playground_usage.current_month, count(*) AS unique_users, sum(anonymous_playground_usage.usage_count) AS total_attempts, count( CASE WHEN anonymous_playground_usage.usage_count > 1 THEN 1 ELSE NULL::integer END) AS users_exceeded_quota, avg(anonymous_playground_usage.usage_count) AS avg_attempts_per_user, count(DISTINCT anonymous_playground_usage.ip_subnet) AS unique_ip_subnets FROM anonymous_playground_usage GROUP BY anonymous_playground_usage.current_month ORDER BY anonymous_playground_usage.current_month DESC`);

export const packagePlaygroundAnalytics = pgMaterializedView("package_playground_analytics", {	packageId: uuid("package_id"),
	packageName: varchar("package_name", { length: 255 }),
	authorId: uuid("author_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalPlaygroundSessions: bigint("total_playground_sessions", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	publicSessions: bigint("public_sessions", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	featuredSessions: bigint("featured_sessions", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uniquePlaygroundUsers: bigint("unique_playground_users", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalCreditsSpent: bigint("total_credits_spent", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalTokensUsed: bigint("total_tokens_used", { mode: "number" }),
	avgCreditsPerSession: numeric("avg_credits_per_session"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sessionsLast7Days: bigint("sessions_last_7_days", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sessionsLast30Days: bigint("sessions_last_30_days", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalSuggestedInputs: bigint("total_suggested_inputs", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	activeSuggestedInputs: bigint("active_suggested_inputs", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sharedSessions: bigint("shared_sessions", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalShareViews: bigint("total_share_views", { mode: "number" }),
	lastPlaygroundSessionAt: timestamp("last_playground_session_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT p.id AS package_id, p.name AS package_name, p.author_id, count(DISTINCT ps.id) AS total_playground_sessions, count(DISTINCT CASE WHEN ps.is_public = true THEN ps.id ELSE NULL::uuid END) AS public_sessions, count(DISTINCT CASE WHEN ps.is_featured_by_author = true THEN ps.id ELSE NULL::uuid END) AS featured_sessions, count(DISTINCT ps.user_id) AS unique_playground_users, sum(ps.credits_spent) AS total_credits_spent, sum(ps.total_tokens) AS total_tokens_used, avg(ps.credits_spent) AS avg_credits_per_session, count(DISTINCT CASE WHEN ps.created_at > (now() - '7 days'::interval) THEN ps.id ELSE NULL::uuid END) AS sessions_last_7_days, count(DISTINCT CASE WHEN ps.created_at > (now() - '30 days'::interval) THEN ps.id ELSE NULL::uuid END) AS sessions_last_30_days, count(DISTINCT sti.id) AS total_suggested_inputs, count(DISTINCT CASE WHEN sti.is_active = true THEN sti.id ELSE NULL::uuid END) AS active_suggested_inputs, count(DISTINCT CASE WHEN ps.share_token IS NOT NULL THEN ps.id ELSE NULL::uuid END) AS shared_sessions, sum(COALESCE(ps.view_count, 0)) AS total_share_views, max(ps.created_at) AS last_playground_session_at FROM packages p LEFT JOIN playground_sessions ps ON p.id = ps.package_id LEFT JOIN suggested_test_inputs sti ON p.id = sti.package_id GROUP BY p.id, p.name, p.author_id`);

export const topSharedResults = pgMaterializedView("top_shared_results", {	packageId: uuid("package_id"),
	sessionId: uuid("session_id"),
	shareToken: varchar("share_token", { length: 32 }),
	packageName: varchar("package_name", { length: 255 }),
	packageVersion: varchar("package_version", { length: 50 }),
	model: varchar({ length: 50 }),
	viewCount: integer("view_count"),
	helpfulCount: integer("helpful_count"),
	notHelpfulCount: integer("not_helpful_count"),
	sharedAt: timestamp("shared_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	helpfulnessRatio: numeric("helpfulness_ratio"),
	userInput: text("user_input"),
	assistantResponse: text("assistant_response"),
	creditsSpent: integer("credits_spent"),
	totalTokens: integer("total_tokens"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	rankByPopularity: bigint("rank_by_popularity", { mode: "number" }),
}).as(sql`SELECT ps.package_id, ps.id AS session_id, ps.share_token, ps.package_name, ps.package_version, ps.model, ps.view_count, ps.helpful_count, ps.not_helpful_count, ps.shared_at, ps.created_at, CASE WHEN (ps.helpful_count + ps.not_helpful_count) > 0 THEN round(ps.helpful_count::numeric / (ps.helpful_count + ps.not_helpful_count)::numeric, 2) ELSE 0::numeric END AS helpfulness_ratio, (ps.conversation -> 0) ->> 'content'::text AS user_input, (ps.conversation -> 1) ->> 'content'::text AS assistant_response, ps.credits_spent, ps.total_tokens, row_number() OVER (PARTITION BY ps.package_id ORDER BY ps.view_count DESC, ps.helpful_count DESC, ps.shared_at DESC) AS rank_by_popularity FROM playground_sessions ps WHERE ps.is_public = true AND ps.share_token IS NOT NULL AND ps.shared_at IS NOT NULL AND jsonb_array_length(ps.conversation) >= 2`);

export const packageAllTags = pgView("package_all_tags", {	id: uuid(),
	name: varchar({ length: 255 }),
	userTags: text("user_tags"),
	aiTags: text("ai_tags"),
	allTags: text("all_tags"),
}).as(sql`SELECT packages.id, packages.name, packages.tags AS user_tags, packages.ai_tags, ARRAY( SELECT DISTINCT unnest(COALESCE(packages.tags, '{}'::text[]) || COALESCE(packages.ai_tags, '{}'::text[])) AS unnest) AS all_tags FROM packages`);

export const authorDashboardSummary = pgMaterializedView("author_dashboard_summary", {	authorId: uuid("author_id"),
	username: varchar({ length: 100 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalPackages: bigint("total_packages", { mode: "number" }),
	totalPlaygroundSessions: numeric("total_playground_sessions"),
	totalUniqueUsers: numeric("total_unique_users"),
	totalCreditsSpent: numeric("total_credits_spent"),
	sessionsLast30Days: numeric("sessions_last_30_days"),
	totalSuggestedInputs: numeric("total_suggested_inputs"),
	activeSuggestedInputs: numeric("active_suggested_inputs"),
	totalSharedSessions: numeric("total_shared_sessions"),
	totalFeaturedSessions: numeric("total_featured_sessions"),
	totalShareViews: numeric("total_share_views"),
	topPackageName: varchar("top_package_name", { length: 255 }),
}).as(sql`SELECT u.id AS author_id, u.username, count(DISTINCT p.id) AS total_packages, sum(ppa.total_playground_sessions) AS total_playground_sessions, sum(ppa.unique_playground_users) AS total_unique_users, sum(ppa.total_credits_spent) AS total_credits_spent, sum(ppa.sessions_last_30_days) AS sessions_last_30_days, sum(ppa.total_suggested_inputs) AS total_suggested_inputs, sum(ppa.active_suggested_inputs) AS active_suggested_inputs, sum(ppa.shared_sessions) AS total_shared_sessions, sum(ppa.featured_sessions) AS total_featured_sessions, sum(ppa.total_share_views) AS total_share_views, ( SELECT p2.name FROM packages p2 LEFT JOIN package_playground_analytics ppa2 ON p2.id = ppa2.package_id WHERE p2.author_id = u.id ORDER BY ppa2.total_playground_sessions DESC NULLS LAST LIMIT 1) AS top_package_name FROM users u LEFT JOIN packages p ON u.id = p.author_id LEFT JOIN package_playground_analytics ppa ON p.id = ppa.package_id GROUP BY u.id, u.username`);

export const userCostAnalytics = pgMaterializedView("user_cost_analytics", {	userId: uuid("user_id"),
	email: varchar({ length: 255 }),
	prpmPlusStatus: varchar("prpm_plus_status", { length: 50 }),
	currentMonthApiCost: numeric("current_month_api_cost", { precision: 10, scale:  4 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	currentMonthRequests: bigint("current_month_requests", { mode: "number" }),
	avgCostPerRequest: numeric("avg_cost_per_request"),
	lifetimeApiCost: numeric("lifetime_api_cost", { precision: 12, scale:  4 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalRequests: bigint("total_requests", { mode: "number" }),
	monthlyRevenue: numeric("monthly_revenue"),
	currentMarginPercent: numeric("current_margin_percent"),
	isThrottled: boolean("is_throttled"),
	riskLevel: text("risk_level"),
	lastRequestAt: timestamp("last_request_at", { withTimezone: true, mode: 'string' }),
	userCreatedAt: timestamp("user_created_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT u.id AS user_id, u.email, u.prpm_plus_status, u.current_month_api_cost, count( CASE WHEN pu.created_at >= date_trunc('month'::text, now()) THEN 1 ELSE NULL::integer END) AS current_month_requests, avg( CASE WHEN pu.created_at >= date_trunc('month'::text, now()) THEN pu.estimated_api_cost ELSE NULL::numeric END) AS avg_cost_per_request, u.lifetime_api_cost, count(pu.id) AS total_requests, CASE WHEN u.prpm_plus_status::text = 'active'::text THEN CASE WHEN (EXISTS ( SELECT 1 FROM organization_members om JOIN organizations o ON om.org_id = o.id WHERE om.user_id = u.id AND o.is_verified = true)) THEN 3.00 ELSE 6.00 END ELSE 0.00 END AS monthly_revenue, CASE WHEN u.current_month_api_cost > 0::numeric THEN round(( CASE WHEN u.prpm_plus_status::text = 'active'::text THEN CASE WHEN (EXISTS ( SELECT 1 FROM organization_members om JOIN organizations o ON om.org_id = o.id WHERE om.user_id = u.id AND o.is_verified = true)) THEN 3.00 ELSE 6.00 END ELSE 0.00 END - u.current_month_api_cost) / NULLIF( CASE WHEN u.prpm_plus_status::text = 'active'::text THEN CASE WHEN (EXISTS ( SELECT 1 FROM organization_members om JOIN organizations o ON om.org_id = o.id WHERE om.user_id = u.id AND o.is_verified = true)) THEN 3.00 ELSE 6.00 END ELSE 0.00 END, 0::numeric) * 100::numeric, 2) ELSE NULL::numeric END AS current_margin_percent, u.is_throttled, CASE WHEN u.current_month_api_cost > 5.00 THEN 'high_risk'::text WHEN u.current_month_api_cost > 2.50 THEN 'medium_risk'::text WHEN u.current_month_api_cost > 1.00 THEN 'low_risk'::text ELSE 'safe'::text END AS risk_level, max(pu.created_at) AS last_request_at, u.created_at AS user_created_at FROM users u LEFT JOIN playground_usage pu ON pu.user_id = u.id WHERE u.current_month_api_cost > 0::numeric OR u.prpm_plus_status IS NOT NULL GROUP BY u.id, u.email, u.prpm_plus_status, u.current_month_api_cost, u.lifetime_api_cost, u.is_throttled, u.created_at`);

export const packageSearchRankings = pgMaterializedView("package_search_rankings", {	id: uuid(),
	name: varchar({ length: 255 }),
	displayName: text("display_name"),
	description: text(),
	format: text(),
	subtype: text(),
	category: varchar({ length: 100 }),
	tags: text(),
	keywords: text(),
	totalDownloads: integer("total_downloads"),
	weeklyDownloads: integer("weekly_downloads"),
	qualityScore: numeric("quality_score", { precision: 3, scale:  2 }),
	ratingAverage: numeric("rating_average", { precision: 3, scale:  2 }),
	ratingCount: integer("rating_count"),
	verified: boolean(),
	featured: boolean(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	searchRank: doublePrecision("search_rank"),
	// PostgreSQL tsvector for full-text search
	searchVector: tsvector("search_vector"),
}).as(sql`SELECT p.id, p.name, p.display_name, p.description, p.format, p.subtype, p.category, p.tags, p.keywords, p.total_downloads, p.weekly_downloads, p.quality_score, p.rating_average, p.rating_count, p.verified, p.featured, p.created_at, (( CASE WHEN p.featured THEN 1000 ELSE 0 END + CASE WHEN p.verified THEN 500 ELSE 0 END + CASE WHEN p.official THEN 300 ELSE 0 END)::numeric + COALESCE(p.quality_score, 0::numeric) * 100::numeric)::double precision + LEAST(log((NULLIF(p.total_downloads, 0) + 1)::double precision) * 50::double precision, 500::double precision) + (COALESCE(p.rating_average, 0::numeric) * 100::numeric)::double precision + CASE WHEN p.created_at > (now() - '7 days'::interval) THEN 200 WHEN p.created_at > (now() - '30 days'::interval) THEN 100 WHEN p.created_at > (now() - '90 days'::interval) THEN 50 ELSE 0 END::double precision AS search_rank, p.search_vector FROM packages p WHERE p.visibility::text = 'public'::text AND p.deprecated = false`);

export const categoryAggregation = pgMaterializedView("category_aggregation", {	id: uuid(),
	slug: varchar({ length: 255 }),
	name: varchar({ length: 255 }),
	description: text(),
	icon: varchar({ length: 50 }),
	level: integer(),
	parentId: uuid("parent_id"),
	displayOrder: integer("display_order"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	packageCount: bigint("package_count", { mode: "number" }),
}).as(sql`WITH RECURSIVE category_closure AS ( SELECT categories.id AS ancestor_id, categories.id AS descendant_id FROM categories UNION ALL SELECT c.parent_id AS ancestor_id, cc_1.descendant_id FROM categories c JOIN category_closure cc_1 ON cc_1.ancestor_id = c.id WHERE c.parent_id IS NOT NULL ), package_assignments AS ( SELECT DISTINCT pc.package_id, pc.category_id FROM package_categories pc JOIN packages p ON p.id = pc.package_id WHERE p.visibility::text = 'public'::text AND p.deprecated = false ) SELECT cat.id, cat.slug, cat.name, cat.description, cat.icon, cat.level, cat.parent_id, cat.display_order, COALESCE(count(DISTINCT pa.package_id), 0::bigint) AS package_count FROM categories cat LEFT JOIN category_closure cc ON cc.ancestor_id = cat.id LEFT JOIN package_assignments pa ON pa.category_id = cc.descendant_id GROUP BY cat.id, cat.slug, cat.name, cat.description, cat.icon, cat.level, cat.parent_id, cat.display_order ORDER BY cat.level, cat.display_order, cat.name`);