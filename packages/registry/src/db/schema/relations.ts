import { relations } from "drizzle-orm/relations";
import { playgroundSessions, securityBlockedWebfetchAttempts, users, packages, packageVersions, packageReviews, accessTokens, organizations, auditLog, ratings, installations, categories, authorInvites, authorClaims, collections, collectionInstalls, playgroundSessionAudit, downloadEvents, packageViews, packageStats, authorStats, useCases, useCasePackages, subscriptionEvents, paymentMethods, invoices, playgroundUsage, playgroundCredits, playgroundCreditTransactions, playgroundCreditPurchases, generatedTestCases, testCaseFeedback, packageInstallations, userCostAlerts, sharedResultViews, suggestedTestInputs, suggestedInputUsage, packageEmbeddings, playgroundSessionFeedback, reviewHelpful, packageStars, packageCategories, packageUseCases, collectionStars, reviewVotes, organizationMembers, badges, packageCoInstallations, collectionPackages } from "./schema";

export const securityBlockedWebfetchAttemptsRelations = relations(securityBlockedWebfetchAttempts, ({one}) => ({
	playgroundSession: one(playgroundSessions, {
		fields: [securityBlockedWebfetchAttempts.sessionId],
		references: [playgroundSessions.id]
	}),
	user: one(users, {
		fields: [securityBlockedWebfetchAttempts.userId],
		references: [users.id]
	}),
	package: one(packages, {
		fields: [securityBlockedWebfetchAttempts.packageId],
		references: [packages.id]
	}),
}));

export const playgroundSessionsRelations = relations(playgroundSessions, ({one, many}) => ({
	securityBlockedWebfetchAttempts: many(securityBlockedWebfetchAttempts),
	playgroundUsages: many(playgroundUsage),
	playgroundCreditTransactions: many(playgroundCreditTransactions),
	sharedResultViews: many(sharedResultViews),
	user_userId: one(users, {
		fields: [playgroundSessions.userId],
		references: [users.id],
		relationName: "playgroundSessions_userId_users_id"
	}),
	organization: one(organizations, {
		fields: [playgroundSessions.orgId],
		references: [organizations.id]
	}),
	package: one(packages, {
		fields: [playgroundSessions.packageId],
		references: [packages.id]
	}),
	user_featuredByUserId: one(users, {
		fields: [playgroundSessions.featuredByUserId],
		references: [users.id],
		relationName: "playgroundSessions_featuredByUserId_users_id"
	}),
	playgroundSession: one(playgroundSessions, {
		fields: [playgroundSessions.comparisonSessionId],
		references: [playgroundSessions.id],
		relationName: "playgroundSessions_comparisonSessionId_playgroundSessions_id"
	}),
	playgroundSessions: many(playgroundSessions, {
		relationName: "playgroundSessions_comparisonSessionId_playgroundSessions_id"
	}),
	suggestedInputUsages: many(suggestedInputUsage),
	playgroundSessionFeedbacks: many(playgroundSessionFeedback),
}));

export const usersRelations = relations(users, ({many}) => ({
	securityBlockedWebfetchAttempts: many(securityBlockedWebfetchAttempts),
	packageVersions: many(packageVersions),
	packageReviews: many(packageReviews),
	accessTokens: many(accessTokens),
	auditLogs: many(auditLog),
	ratings: many(ratings),
	installations: many(installations),
	authorInvites_invitedBy: many(authorInvites, {
		relationName: "authorInvites_invitedBy_users_id"
	}),
	authorInvites_claimedBy: many(authorInvites, {
		relationName: "authorInvites_claimedBy_users_id"
	}),
	authorClaims: many(authorClaims),
	playgroundSessionAudits: many(playgroundSessionAudit),
	downloadEvents: many(downloadEvents),
	packageViews: many(packageViews),
	authorStats: many(authorStats),
	collections: many(collections),
	packages: many(packages),
	playgroundUsages: many(playgroundUsage),
	playgroundCredits: many(playgroundCredits),
	playgroundCreditTransactions: many(playgroundCreditTransactions),
	playgroundCreditPurchases: many(playgroundCreditPurchases),
	testCaseFeedbacks: many(testCaseFeedback),
	packageInstallations: many(packageInstallations),
	userCostAlerts: many(userCostAlerts),
	sharedResultViews: many(sharedResultViews),
	playgroundSessions_userId: many(playgroundSessions, {
		relationName: "playgroundSessions_userId_users_id"
	}),
	playgroundSessions_featuredByUserId: many(playgroundSessions, {
		relationName: "playgroundSessions_featuredByUserId_users_id"
	}),
	suggestedTestInputs: many(suggestedTestInputs),
	suggestedInputUsages: many(suggestedInputUsage),
	playgroundSessionFeedbacks: many(playgroundSessionFeedback),
	reviewHelpfuls: many(reviewHelpful),
	packageStars: many(packageStars),
	collectionStars: many(collectionStars),
	reviewVotes: many(reviewVotes),
	organizationMembers: many(organizationMembers),
}));

export const packagesRelations = relations(packages, ({one, many}) => ({
	securityBlockedWebfetchAttempts: many(securityBlockedWebfetchAttempts),
	packageVersions: many(packageVersions),
	packageReviews: many(packageReviews),
	ratings: many(ratings),
	installations: many(installations),
	downloadEvents: many(downloadEvents),
	packageViews: many(packageViews),
	packageStats: many(packageStats),
	user: one(users, {
		fields: [packages.authorId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [packages.orgId],
		references: [organizations.id]
	}),
	useCasePackages: many(useCasePackages),
	playgroundUsages: many(playgroundUsage),
	packageInstallations: many(packageInstallations),
	playgroundSessions: many(playgroundSessions),
	suggestedTestInputs: many(suggestedTestInputs),
	packageEmbeddings: many(packageEmbeddings),
	packageStars: many(packageStars),
	packageCategories: many(packageCategories),
	packageUseCases: many(packageUseCases),
	badges: many(badges),
	packageCoInstallations_packageAId: many(packageCoInstallations, {
		relationName: "packageCoInstallations_packageAId_packages_id"
	}),
	packageCoInstallations_packageBId: many(packageCoInstallations, {
		relationName: "packageCoInstallations_packageBId_packages_id"
	}),
	collectionPackages: many(collectionPackages),
}));

export const packageVersionsRelations = relations(packageVersions, ({one}) => ({
	package: one(packages, {
		fields: [packageVersions.packageId],
		references: [packages.id]
	}),
	user: one(users, {
		fields: [packageVersions.publishedBy],
		references: [users.id]
	}),
}));

export const packageReviewsRelations = relations(packageReviews, ({one, many}) => ({
	package: one(packages, {
		fields: [packageReviews.packageId],
		references: [packages.id]
	}),
	user: one(users, {
		fields: [packageReviews.userId],
		references: [users.id]
	}),
	reviewHelpfuls: many(reviewHelpful),
}));

export const accessTokensRelations = relations(accessTokens, ({one}) => ({
	user: one(users, {
		fields: [accessTokens.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [accessTokens.orgId],
		references: [organizations.id]
	}),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	accessTokens: many(accessTokens),
	collections: many(collections),
	packages: many(packages),
	subscriptionEvents: many(subscriptionEvents),
	paymentMethods: many(paymentMethods),
	invoices: many(invoices),
	playgroundUsages: many(playgroundUsage),
	playgroundCredits: many(playgroundCredits),
	playgroundCreditTransactions: many(playgroundCreditTransactions),
	playgroundCreditPurchases: many(playgroundCreditPurchases),
	playgroundSessions: many(playgroundSessions),
	organizationMembers: many(organizationMembers),
}));

export const auditLogRelations = relations(auditLog, ({one}) => ({
	user: one(users, {
		fields: [auditLog.userId],
		references: [users.id]
	}),
}));

export const ratingsRelations = relations(ratings, ({one, many}) => ({
	package: one(packages, {
		fields: [ratings.packageId],
		references: [packages.id]
	}),
	user: one(users, {
		fields: [ratings.userId],
		references: [users.id]
	}),
	reviewVotes: many(reviewVotes),
}));

export const installationsRelations = relations(installations, ({one}) => ({
	user: one(users, {
		fields: [installations.userId],
		references: [users.id]
	}),
	package: one(packages, {
		fields: [installations.packageId],
		references: [packages.id]
	}),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
	packageCategories: many(packageCategories),
}));

export const authorInvitesRelations = relations(authorInvites, ({one, many}) => ({
	user_invitedBy: one(users, {
		fields: [authorInvites.invitedBy],
		references: [users.id],
		relationName: "authorInvites_invitedBy_users_id"
	}),
	user_claimedBy: one(users, {
		fields: [authorInvites.claimedBy],
		references: [users.id],
		relationName: "authorInvites_claimedBy_users_id"
	}),
	authorClaims: many(authorClaims),
}));

export const authorClaimsRelations = relations(authorClaims, ({one}) => ({
	authorInvite: one(authorInvites, {
		fields: [authorClaims.inviteId],
		references: [authorInvites.id]
	}),
	user: one(users, {
		fields: [authorClaims.userId],
		references: [users.id]
	}),
}));

export const collectionInstallsRelations = relations(collectionInstalls, ({one}) => ({
	collection: one(collections, {
		fields: [collectionInstalls.collectionId],
		references: [collections.id]
	}),
}));

export const collectionsRelations = relations(collections, ({one, many}) => ({
	collectionInstalls: many(collectionInstalls),
	user: one(users, {
		fields: [collections.authorId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [collections.orgId],
		references: [organizations.id]
	}),
	collectionStars: many(collectionStars),
	collectionPackages: many(collectionPackages),
}));

export const playgroundSessionAuditRelations = relations(playgroundSessionAudit, ({one}) => ({
	user: one(users, {
		fields: [playgroundSessionAudit.userId],
		references: [users.id]
	}),
}));

export const downloadEventsRelations = relations(downloadEvents, ({one}) => ({
	package: one(packages, {
		fields: [downloadEvents.packageId],
		references: [packages.id]
	}),
	user: one(users, {
		fields: [downloadEvents.userId],
		references: [users.id]
	}),
}));

export const packageViewsRelations = relations(packageViews, ({one}) => ({
	package: one(packages, {
		fields: [packageViews.packageId],
		references: [packages.id]
	}),
	user: one(users, {
		fields: [packageViews.userId],
		references: [users.id]
	}),
}));

export const packageStatsRelations = relations(packageStats, ({one}) => ({
	package: one(packages, {
		fields: [packageStats.packageId],
		references: [packages.id]
	}),
}));

export const authorStatsRelations = relations(authorStats, ({one}) => ({
	user: one(users, {
		fields: [authorStats.userId],
		references: [users.id]
	}),
}));

export const useCasePackagesRelations = relations(useCasePackages, ({one}) => ({
	useCase: one(useCases, {
		fields: [useCasePackages.useCaseId],
		references: [useCases.id]
	}),
	package: one(packages, {
		fields: [useCasePackages.packageId],
		references: [packages.id]
	}),
}));

export const useCasesRelations = relations(useCases, ({many}) => ({
	useCasePackages: many(useCasePackages),
	packageUseCases: many(packageUseCases),
}));

export const subscriptionEventsRelations = relations(subscriptionEvents, ({one}) => ({
	organization: one(organizations, {
		fields: [subscriptionEvents.orgId],
		references: [organizations.id]
	}),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({one}) => ({
	organization: one(organizations, {
		fields: [paymentMethods.orgId],
		references: [organizations.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one}) => ({
	organization: one(organizations, {
		fields: [invoices.orgId],
		references: [organizations.id]
	}),
}));

export const playgroundUsageRelations = relations(playgroundUsage, ({one}) => ({
	user: one(users, {
		fields: [playgroundUsage.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [playgroundUsage.orgId],
		references: [organizations.id]
	}),
	package: one(packages, {
		fields: [playgroundUsage.packageId],
		references: [packages.id]
	}),
	playgroundSession: one(playgroundSessions, {
		fields: [playgroundUsage.sessionId],
		references: [playgroundSessions.id]
	}),
}));

export const playgroundCreditsRelations = relations(playgroundCredits, ({one}) => ({
	user: one(users, {
		fields: [playgroundCredits.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [playgroundCredits.orgId],
		references: [organizations.id]
	}),
}));

export const playgroundCreditTransactionsRelations = relations(playgroundCreditTransactions, ({one}) => ({
	user: one(users, {
		fields: [playgroundCreditTransactions.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [playgroundCreditTransactions.orgId],
		references: [organizations.id]
	}),
	playgroundSession: one(playgroundSessions, {
		fields: [playgroundCreditTransactions.sessionId],
		references: [playgroundSessions.id]
	}),
}));

export const playgroundCreditPurchasesRelations = relations(playgroundCreditPurchases, ({one}) => ({
	user: one(users, {
		fields: [playgroundCreditPurchases.userId],
		references: [users.id]
	}),
	organization: one(organizations, {
		fields: [playgroundCreditPurchases.orgId],
		references: [organizations.id]
	}),
}));

export const testCaseFeedbackRelations = relations(testCaseFeedback, ({one}) => ({
	generatedTestCase: one(generatedTestCases, {
		fields: [testCaseFeedback.testCaseId],
		references: [generatedTestCases.id]
	}),
	user: one(users, {
		fields: [testCaseFeedback.userId],
		references: [users.id]
	}),
}));

export const generatedTestCasesRelations = relations(generatedTestCases, ({many}) => ({
	testCaseFeedbacks: many(testCaseFeedback),
}));

export const packageInstallationsRelations = relations(packageInstallations, ({one}) => ({
	package: one(packages, {
		fields: [packageInstallations.packageId],
		references: [packages.id]
	}),
	user: one(users, {
		fields: [packageInstallations.userId],
		references: [users.id]
	}),
}));

export const userCostAlertsRelations = relations(userCostAlerts, ({one}) => ({
	user: one(users, {
		fields: [userCostAlerts.userId],
		references: [users.id]
	}),
}));

export const sharedResultViewsRelations = relations(sharedResultViews, ({one}) => ({
	playgroundSession: one(playgroundSessions, {
		fields: [sharedResultViews.sessionId],
		references: [playgroundSessions.id]
	}),
	user: one(users, {
		fields: [sharedResultViews.viewerUserId],
		references: [users.id]
	}),
}));

export const suggestedTestInputsRelations = relations(suggestedTestInputs, ({one, many}) => ({
	package: one(packages, {
		fields: [suggestedTestInputs.packageId],
		references: [packages.id]
	}),
	user: one(users, {
		fields: [suggestedTestInputs.authorId],
		references: [users.id]
	}),
	suggestedInputUsages: many(suggestedInputUsage),
}));

export const suggestedInputUsageRelations = relations(suggestedInputUsage, ({one}) => ({
	suggestedTestInput: one(suggestedTestInputs, {
		fields: [suggestedInputUsage.suggestedInputId],
		references: [suggestedTestInputs.id]
	}),
	user: one(users, {
		fields: [suggestedInputUsage.userId],
		references: [users.id]
	}),
	playgroundSession: one(playgroundSessions, {
		fields: [suggestedInputUsage.sessionId],
		references: [playgroundSessions.id]
	}),
}));

export const packageEmbeddingsRelations = relations(packageEmbeddings, ({one}) => ({
	package: one(packages, {
		fields: [packageEmbeddings.packageId],
		references: [packages.id]
	}),
}));

export const playgroundSessionFeedbackRelations = relations(playgroundSessionFeedback, ({one}) => ({
	playgroundSession: one(playgroundSessions, {
		fields: [playgroundSessionFeedback.sessionId],
		references: [playgroundSessions.id]
	}),
	user: one(users, {
		fields: [playgroundSessionFeedback.userId],
		references: [users.id]
	}),
}));

export const reviewHelpfulRelations = relations(reviewHelpful, ({one}) => ({
	packageReview: one(packageReviews, {
		fields: [reviewHelpful.reviewId],
		references: [packageReviews.id]
	}),
	user: one(users, {
		fields: [reviewHelpful.userId],
		references: [users.id]
	}),
}));

export const packageStarsRelations = relations(packageStars, ({one}) => ({
	package: one(packages, {
		fields: [packageStars.packageId],
		references: [packages.id]
	}),
	user: one(users, {
		fields: [packageStars.userId],
		references: [users.id]
	}),
}));

export const packageCategoriesRelations = relations(packageCategories, ({one}) => ({
	package: one(packages, {
		fields: [packageCategories.packageId],
		references: [packages.id]
	}),
	category: one(categories, {
		fields: [packageCategories.categoryId],
		references: [categories.id]
	}),
}));

export const packageUseCasesRelations = relations(packageUseCases, ({one}) => ({
	package: one(packages, {
		fields: [packageUseCases.packageId],
		references: [packages.id]
	}),
	useCase: one(useCases, {
		fields: [packageUseCases.useCaseId],
		references: [useCases.id]
	}),
}));

export const collectionStarsRelations = relations(collectionStars, ({one}) => ({
	user: one(users, {
		fields: [collectionStars.userId],
		references: [users.id]
	}),
	collection: one(collections, {
		fields: [collectionStars.collectionId],
		references: [collections.id]
	}),
}));

export const reviewVotesRelations = relations(reviewVotes, ({one}) => ({
	rating: one(ratings, {
		fields: [reviewVotes.reviewId],
		references: [ratings.id]
	}),
	user: one(users, {
		fields: [reviewVotes.userId],
		references: [users.id]
	}),
}));

export const organizationMembersRelations = relations(organizationMembers, ({one}) => ({
	organization: one(organizations, {
		fields: [organizationMembers.orgId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [organizationMembers.userId],
		references: [users.id]
	}),
}));

export const badgesRelations = relations(badges, ({one}) => ({
	package: one(packages, {
		fields: [badges.packageId],
		references: [packages.id]
	}),
}));

export const packageCoInstallationsRelations = relations(packageCoInstallations, ({one}) => ({
	package_packageAId: one(packages, {
		fields: [packageCoInstallations.packageAId],
		references: [packages.id],
		relationName: "packageCoInstallations_packageAId_packages_id"
	}),
	package_packageBId: one(packages, {
		fields: [packageCoInstallations.packageBId],
		references: [packages.id],
		relationName: "packageCoInstallations_packageBId_packages_id"
	}),
}));

export const collectionPackagesRelations = relations(collectionPackages, ({one}) => ({
	package: one(packages, {
		fields: [collectionPackages.packageId],
		references: [packages.id]
	}),
	collection: one(collections, {
		fields: [collectionPackages.collectionId],
		references: [collections.id]
	}),
}));