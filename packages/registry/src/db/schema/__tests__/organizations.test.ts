import { describe, it, expect } from 'vitest';
import { organizations, type Organization, type NewOrganization } from '../organizations.js';

describe('Organizations Schema', () => {
  it('should have correct TypeScript types for Organization', () => {
    // This test verifies compile-time type safety for the select type
    const org: Organization = {
      id: '550e8400-e29b-41d4-a716-446655440000',
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
      billingEmail: null,
    };

    expect(org).toBeDefined();
    expect(org.name).toBe('Test Org');
  });

  it('should have correct TypeScript types for NewOrganization', () => {
    // This test verifies compile-time type safety for the insert type
    const newOrg: NewOrganization = {
      name: 'New Org',
      description: 'A test organization',
      avatarUrl: 'https://example.com/avatar.png',
      websiteUrl: 'https://example.com',
      isVerified: true,
    };

    expect(newOrg).toBeDefined();
    expect(newOrg.name).toBe('New Org');
  });

  it('should allow partial inserts with defaults', () => {
    // Verify that fields with defaults are optional
    const minimalOrg: NewOrganization = {
      name: 'Minimal Org',
    };

    expect(minimalOrg).toBeDefined();
    expect(minimalOrg.name).toBe('Minimal Org');
  });

  it('should handle verified organization with subscription', () => {
    // Test type safety for paid verified organizations
    const verifiedOrg: Organization = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Verified Org',
      description: 'A verified organization',
      avatarUrl: 'https://example.com/verified-avatar.png',
      websiteUrl: 'https://verified.example.com',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeCustomerId: 'cus_123456789',
      stripeSubscriptionId: 'sub_987654321',
      subscriptionStatus: 'active',
      subscriptionPlan: 'verified',
      subscriptionStartDate: new Date('2025-01-01'),
      subscriptionEndDate: null,
      subscriptionCancelAtPeriodEnd: false,
      billingEmail: 'billing@verified.example.com',
    };

    expect(verifiedOrg).toBeDefined();
    expect(verifiedOrg.isVerified).toBe(true);
    expect(verifiedOrg.subscriptionStatus).toBe('active');
  });

  it('should correctly map camelCase to snake_case', () => {
    // Verify that the schema correctly maps TypeScript camelCase to database snake_case
    const table = organizations;

    // Check that the table name is correct
    expect(table).toBeDefined();

    // Verify column name mappings exist
    expect(table.avatarUrl.name).toBe('avatar_url');
    expect(table.websiteUrl.name).toBe('website_url');
    expect(table.isVerified.name).toBe('is_verified');
    expect(table.createdAt.name).toBe('created_at');
    expect(table.updatedAt.name).toBe('updated_at');
    expect(table.stripeCustomerId.name).toBe('stripe_customer_id');
    expect(table.stripeSubscriptionId.name).toBe('stripe_subscription_id');
    expect(table.subscriptionStatus.name).toBe('subscription_status');
    expect(table.subscriptionPlan.name).toBe('subscription_plan');
    expect(table.subscriptionStartDate.name).toBe('subscription_start_date');
    expect(table.subscriptionEndDate.name).toBe('subscription_end_date');
    expect(table.subscriptionCancelAtPeriodEnd.name).toBe('subscription_cancel_at_period_end');
  });

  it('should enforce type constraints', () => {
    // Test that TypeScript catches type errors at compile time
    const org: Organization = {
      id: '550e8400-e29b-41d4-a716-446655440000',
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
      billingEmail: null,
    };

    // These should be the correct types
    const idIsString: string = org.id;
    const nameIsString: string = org.name;
    const isVerifiedIsBoolean: boolean = org.isVerified;
    const createdAtIsDate: Date = org.createdAt;

    expect(idIsString).toBeDefined();
    expect(nameIsString).toBeDefined();
    expect(isVerifiedIsBoolean).toBeDefined();
    expect(createdAtIsDate).toBeDefined();
  });
});
