import { eq, sql } from 'drizzle-orm';
import { db } from '../db.js';
import { organizations, type Organization, type NewOrganization } from '../schema/organizations.js';

/**
 * Organization Repository
 *
 * Provides type-safe database operations for organizations.
 * This is the CRITICAL fix for the `is_verified` bug - all queries now use
 * the correct field name `isVerified` instead of aliasing to `verified`.
 */
export class OrganizationRepository {
  /**
   * Find organization by name (case-insensitive)
   *
   * This method is used in the package publish endpoint to look up
   * organizations when publishing packages.
   *
   * CRITICAL: Returns isVerified (not verified) - fixes the bug!
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
   *
   * Returns full organization object with all fields.
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
   * Find organization by Stripe customer ID
   *
   * Used by Stripe webhook handlers to look up organizations
   * when processing subscription events and invoices.
   */
  async findByStripeCustomerId(stripeCustomerId: string): Promise<Pick<Organization, 'id'> | null> {
    try {
      const [org] = await db
        .select({
          id: organizations.id,
        })
        .from(organizations)
        .where(eq(organizations.stripeCustomerId, stripeCustomerId))
        .limit(1);

      return org || null;
    } catch (error) {
      console.error('Failed to find organization by Stripe customer ID', {
        stripeCustomerId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get Stripe customer ID for an organization
   *
   * Used by Stripe service to check if customer already exists
   * before creating a new one.
   */
  async getStripeCustomerId(orgId: string): Promise<string | null> {
    try {
      const [org] = await db
        .select({
          stripeCustomerId: organizations.stripeCustomerId,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      return org?.stripeCustomerId || null;
    } catch (error) {
      console.error('Failed to get Stripe customer ID', {
        orgId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get Stripe subscription ID for an organization
   *
   * Used by Stripe service to check subscription status
   * and manage subscription updates.
   */
  async getStripeSubscriptionId(orgId: string): Promise<string | null> {
    try {
      const [org] = await db
        .select({
          stripeSubscriptionId: organizations.stripeSubscriptionId,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      return org?.stripeSubscriptionId || null;
    } catch (error) {
      console.error('Failed to get Stripe subscription ID', {
        orgId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get Stripe billing data for an organization
   *
   * Used by Stripe service to retrieve complete billing information
   * including customer ID, subscription ID, and subscription status.
   */
  async getStripeBillingData(
    orgId: string
  ): Promise<Pick<
    Organization,
    'stripeCustomerId' | 'stripeSubscriptionId' | 'subscriptionStatus'
  > | null> {
    try {
      const [org] = await db
        .select({
          stripeCustomerId: organizations.stripeCustomerId,
          stripeSubscriptionId: organizations.stripeSubscriptionId,
          subscriptionStatus: organizations.subscriptionStatus,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      return org || null;
    } catch (error) {
      console.error('Failed to get Stripe billing data', {
        orgId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get organization name and ID
   *
   * Used by subscription routes to validate organization exists
   * and retrieve basic information.
   */
  async getBasicInfo(name: string): Promise<Pick<Organization, 'id' | 'name'> | null> {
    try {
      const [org] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
        })
        .from(organizations)
        .where(eq(organizations.name, name))
        .limit(1);

      return org || null;
    } catch (error) {
      console.error('Failed to get organization basic info', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get organization verification status
   *
   * Used to check if an organization is verified before
   * allowing certain operations.
   */
  async getVerificationStatus(id: string): Promise<boolean> {
    try {
      const [org] = await db
        .select({
          isVerified: organizations.isVerified,
        })
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      return org?.isVerified || false;
    } catch (error) {
      console.error('Failed to get verification status', {
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
          updatedAt: new Date(),
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

  /**
   * Update Stripe customer ID
   *
   * Called when creating a new Stripe customer for an organization.
   */
  async updateStripeCustomerId(orgId: string, stripeCustomerId: string): Promise<void> {
    try {
      await db
        .update(organizations)
        .set({
          stripeCustomerId,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, orgId));
    } catch (error) {
      console.error('Failed to update Stripe customer ID', {
        orgId,
        stripeCustomerId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update Stripe subscription data
   *
   * Called by Stripe webhook handlers when subscription events occur.
   */
  async updateSubscriptionData(
    orgId: string,
    data: {
      stripeSubscriptionId?: string;
      subscriptionStatus?: string;
      subscriptionPlan?: string;
      subscriptionStartDate?: Date;
      subscriptionEndDate?: Date;
      subscriptionCancelAtPeriodEnd?: boolean;
    }
  ): Promise<void> {
    try {
      await db
        .update(organizations)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, orgId));
    } catch (error) {
      console.error('Failed to update subscription data', {
        orgId,
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const organizationRepository = new OrganizationRepository();
