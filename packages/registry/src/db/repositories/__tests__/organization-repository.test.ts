import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OrganizationRepository } from '../organization-repository';
import { pool } from '../../db';

describe('OrganizationRepository', () => {
  let repository: OrganizationRepository;

  beforeAll(() => {
    repository = new OrganizationRepository();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should find organization by name', async () => {
    // This test requires a test org in the database
    const org = await repository.findByName('prpm');

    if (org) {
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('isVerified');
      // Verify the bug is fixed - should have isVerified, not verified
      expect(org.isVerified).toBeDefined();

      // TypeScript should recognize these properties
      const _id: string = org.id;
      const _isVerified: boolean = org.isVerified;

      // @ts-expect-error - 'verified' should not exist on the type
      const _shouldNotExist = org.verified;
    }
  });

  it('should find organization by id', async () => {
    // First find an org to get its ID
    const orgByName = await repository.findByName('prpm');

    if (orgByName) {
      const org = await repository.findById(orgByName.id);

      expect(org).toBeTruthy();
      if (org) {
        expect(org.id).toBe(orgByName.id);
        expect(org.name).toBeDefined();
        expect(org.isVerified).toBeDefined();
      }
    }
  });

  it('should return null for non-existent organization', async () => {
    const org = await repository.findByName('non-existent-org-12345');
    expect(org).toBeNull();
  });

  it('should find organization by stripe customer id', async () => {
    // This requires an org with Stripe data
    const orgByName = await repository.findByName('prpm');

    if (orgByName) {
      const fullOrg = await repository.findById(orgByName.id);

      if (fullOrg?.stripeCustomerId) {
        const org = await repository.findByStripeCustomerId(fullOrg.stripeCustomerId);
        expect(org).toBeTruthy();
        if (org) {
          expect(org.id).toBe(fullOrg.id);
        }
      }
    }
  });

  it('should get stripe customer id', async () => {
    const orgByName = await repository.findByName('prpm');

    if (orgByName) {
      const stripeCustomerId = await repository.getStripeCustomerId(orgByName.id);
      // May be null if org doesn't have Stripe integration yet
      expect(stripeCustomerId === null || typeof stripeCustomerId === 'string').toBe(true);
    }
  });
});
