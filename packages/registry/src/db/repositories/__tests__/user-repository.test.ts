import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { UserRepository } from '../user-repository';
import { pool } from '../../db';
import type { User } from '../../schema/users';

describe('UserRepository', () => {
  let repository: UserRepository;
  let testUser: User | null = null;

  beforeAll(async () => {
    repository = new UserRepository();

    // Find a test user - try to find khaliqgant first, or any user
    testUser = await repository.findByUsername('khaliqgant');
    if (!testUser) {
      // Try to find any user in the database
      const db = await import('../../db');
      const result = await db.db.select().from((await import('../../schema/users')).users).limit(1);
      testUser = result[0] || null;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      const user = await repository.findById(testUser.id);

      expect(user).toBeTruthy();
      if (user) {
        expect(user.id).toBe(testUser.id);
        expect(user.username).toBe(testUser.username);
        expect(user.email).toBeDefined();

        // TypeScript type safety checks
        const _id: string = user.id;
        const _username: string = user.username;
        const _email: string | null = user.email;
        const _verifiedAuthor: boolean = user.verifiedAuthor;
        const _isAdmin: boolean = user.isAdmin;
      }
    });

    it('should return null for non-existent user id', async () => {
      const user = await repository.findById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      const user = await repository.findByUsername(testUser.username);

      expect(user).toBeTruthy();
      if (user) {
        expect(user.id).toBe(testUser.id);
        expect(user.username).toBe(testUser.username);
      }
    });

    it('should return null for non-existent username', async () => {
      const user = await repository.findByUsername('non-existent-user-xyz-12345');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      if (!testUser?.email) {
        console.log('No test user with email available - skipping test');
        return;
      }

      const user = await repository.findByEmail(testUser.email);

      expect(user).toBeTruthy();
      if (user) {
        expect(user.id).toBe(testUser.id);
        expect(user.email).toBe(testUser.email);
      }
    });

    it('should return null for non-existent email', async () => {
      const user = await repository.findByEmail('non-existent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('findByGithubId', () => {
    it('should find user by github id', async () => {
      if (!testUser?.githubId) {
        console.log('No test user with GitHub ID available - skipping test');
        return;
      }

      const user = await repository.findByGithubId(testUser.githubId);

      expect(user).toBeTruthy();
      if (user) {
        expect(user.id).toBe(testUser.id);
        expect(user.githubId).toBe(testUser.githubId);
      }
    });

    it('should return null for non-existent github id', async () => {
      const user = await repository.findByGithubId('999999999');
      expect(user).toBeNull();
    });
  });

  describe('findByIncomingConnectionId', () => {
    it('should find user by incoming connection id', async () => {
      if (!testUser?.incomingConnectionId) {
        console.log('No test user with incoming connection ID - skipping test');
        return;
      }

      const user = await repository.findByIncomingConnectionId(testUser.incomingConnectionId);

      expect(user).toBeTruthy();
      if (user) {
        expect(user.id).toBe(testUser.id);
        expect(user.incomingConnectionId).toBe(testUser.incomingConnectionId);
      }
    });

    it('should return null for non-existent connection id', async () => {
      const user = await repository.findByIncomingConnectionId('non-existent-connection-id');
      expect(user).toBeNull();
    });
  });

  describe('getGithubUsername', () => {
    it('should get github username for user', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      const githubUsername = await repository.getGithubUsername(testUser.id);

      // May be null if user doesn't have GitHub linked
      expect(githubUsername === null || typeof githubUsername === 'string').toBe(true);

      if (testUser.githubUsername) {
        expect(githubUsername).toBe(testUser.githubUsername);
      }
    });

    it('should return null for non-existent user', async () => {
      const githubUsername = await repository.getGithubUsername('00000000-0000-0000-0000-000000000000');
      expect(githubUsername).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should get user profile with selected fields', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      const profile = await repository.getProfile(testUser.id);

      expect(profile).toBeTruthy();
      if (profile) {
        expect(profile.id).toBe(testUser.id);
        expect(profile.username).toBe(testUser.username);
        expect(profile.verifiedAuthor).toBeDefined();
        expect(profile.isAdmin).toBeDefined();

        // TypeScript type safety - should only have these fields
        const _id: string = profile.id;
        const _username: string = profile.username;
        const _email: string | null = profile.email;
        const _avatarUrl: string | null = profile.avatarUrl;
        const _website: string | null = profile.website;
        const _verifiedAuthor: boolean = profile.verifiedAuthor;
        const _isAdmin: boolean = profile.isAdmin;

        // @ts-expect-error - passwordHash should not be in profile
        const _shouldNotExist = profile.passwordHash;
      }
    });

    it('should return null for non-existent user', async () => {
      const profile = await repository.getProfile('00000000-0000-0000-0000-000000000000');
      expect(profile).toBeNull();
    });
  });

  describe('usernameExists', () => {
    it('should return true for existing username', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      const exists = await repository.usernameExists(testUser.username);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent username', async () => {
      const exists = await repository.usernameExists('non-existent-user-xyz-12345');
      expect(exists).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      if (!testUser?.email) {
        console.log('No test user with email available - skipping test');
        return;
      }

      const exists = await repository.emailExists(testUser.email);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const exists = await repository.emailExists('non-existent@example.com');
      expect(exists).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      const beforeUpdate = testUser.lastLoginAt;

      // Update last login
      await repository.updateLastLogin(testUser.id);

      // Fetch user again to check update
      const updatedUser = await repository.findById(testUser.id);

      expect(updatedUser).toBeTruthy();
      if (updatedUser) {
        expect(updatedUser.lastLoginAt).toBeTruthy();

        // If there was a previous login time, new one should be different
        if (beforeUpdate) {
          const beforeTime = new Date(beforeUpdate).getTime();
          const afterTime = new Date(updatedUser.lastLoginAt!).getTime();
          // Should be same or later (may be same if test runs very fast)
          expect(afterTime).toBeGreaterThanOrEqual(beforeTime);
        }
      }
    });
  });

  describe('updateWebsite', () => {
    it('should update user website', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      const newWebsite = 'https://example.com';

      // Update website
      const updatedUser = await repository.updateWebsite(testUser.id, newWebsite);

      expect(updatedUser).toBeTruthy();
      expect(updatedUser.website).toBe(newWebsite);
      expect(updatedUser.id).toBe(testUser.id);

      // Restore original website
      if (testUser.website !== newWebsite) {
        await repository.updateWebsite(testUser.id, testUser.website);
      }
    });

    it('should set website to null', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      // Update website to null
      const updatedUser = await repository.updateWebsite(testUser.id, null);

      expect(updatedUser).toBeTruthy();
      expect(updatedUser.website).toBeNull();

      // Restore original website
      if (testUser.website !== null) {
        await repository.updateWebsite(testUser.id, testUser.website);
      }
    });
  });

  describe('updateProfile', () => {
    it('should update multiple profile fields', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      const originalValues = {
        website: testUser.website,
        authorBio: testUser.authorBio,
      };

      const updates = {
        website: 'https://test.example.com',
        authorBio: 'Test bio for user repository tests',
      };

      // Update profile
      const updatedUser = await repository.updateProfile(testUser.id, updates);

      expect(updatedUser).toBeTruthy();
      expect(updatedUser.website).toBe(updates.website);
      expect(updatedUser.authorBio).toBe(updates.authorBio);
      expect(updatedUser.id).toBe(testUser.id);

      // Restore original values
      await repository.updateProfile(testUser.id, originalValues);
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct field names from schema', async () => {
      if (!testUser) {
        console.log('No test user available - skipping test');
        return;
      }

      const user = await repository.findById(testUser.id);

      if (user) {
        // These should compile - correct field names
        expect(user.verifiedAuthor).toBeDefined();
        expect(user.isAdmin).toBeDefined();
        expect(user.githubId).toBeDefined();
        expect(user.githubUsername).toBeDefined();
        expect(user.passwordHash).toBeDefined();
        expect(user.nangoConnectionId).toBeDefined();
        expect(user.incomingConnectionId).toBeDefined();
        expect(user.lastLoginAt).toBeDefined();
        expect(user.createdAt).toBeDefined();
        expect(user.updatedAt).toBeDefined();

        // TypeScript should prevent accessing fields with wrong names
        // @ts-expect-error - verified_author should not exist (should be verifiedAuthor)
        const _wrongName1 = user.verified_author;

        // @ts-expect-error - is_admin should not exist (should be isAdmin)
        const _wrongName2 = user.is_admin;

        // @ts-expect-error - github_id should not exist (should be githubId)
        const _wrongName3 = user.github_id;
      }
    });
  });
});
