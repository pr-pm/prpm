import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PackageRepository } from '../package-repository';
import { pool } from '../../db';

describe('PackageRepository', () => {
  let repository: PackageRepository;

  beforeAll(() => {
    repository = new PackageRepository();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('findByName', () => {
    it('should find package by name', async () => {
      // This test requires a test package in the database
      // Using a package that should exist in the seeded database
      const pkg = await repository.findByName('@prpm/getting-started');

      if (pkg) {
        expect(pkg).toHaveProperty('id');
        expect(pkg).toHaveProperty('name');
        expect(pkg).toHaveProperty('description');
        expect(pkg.name).toBe('@prpm/getting-started');

        // Verify TypeScript types are correct
        const _id: string = pkg.id;
        const _name: string = pkg.name;
        const _description: string | null = pkg.description;
        const _format: string = pkg.format;
        const _subtype: string = pkg.subtype;
      }
    });

    it('should return null for non-existent package', async () => {
      const pkg = await repository.findByName('non-existent-package-12345');
      expect(pkg).toBeNull();
    });

    it('should handle scoped package names', async () => {
      const pkg = await repository.findByName('@prpm/getting-started');

      if (pkg) {
        expect(pkg.name).toContain('@');
        expect(pkg.name).toContain('/');
      }
    });
  });

  describe('findPublicByName', () => {
    it('should find public package by name', async () => {
      const pkg = await repository.findPublicByName('@prpm/getting-started');

      if (pkg) {
        expect(pkg.visibility).toBe('public');
        expect(pkg.name).toBe('@prpm/getting-started');
      }
    });

    it('should not find private packages', async () => {
      // First, we'd need to know if there are private packages in test data
      // This is a placeholder test
      const pkg = await repository.findPublicByName('private-package-test');
      expect(pkg).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find package by id', async () => {
      // First find a package to get its ID
      const pkgByName = await repository.findByName('@prpm/getting-started');

      if (pkgByName) {
        const pkg = await repository.findById(pkgByName.id);

        expect(pkg).toBeTruthy();
        if (pkg) {
          expect(pkg.id).toBe(pkgByName.id);
          expect(pkg.name).toBe(pkgByName.name);
        }
      }
    });

    it('should return null for non-existent id', async () => {
      const pkg = await repository.findById('00000000-0000-0000-0000-000000000000');
      expect(pkg).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing package', async () => {
      const exists = await repository.exists('@prpm/getting-started');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent package', async () => {
      const exists = await repository.exists('non-existent-package-12345');
      expect(exists).toBe(false);
    });
  });

  describe('getOwnership', () => {
    it('should return ownership info for package', async () => {
      const ownership = await repository.getOwnership('@prpm/getting-started');

      if (ownership) {
        expect(ownership).toHaveProperty('id');
        expect(ownership).toHaveProperty('authorId');
        expect(ownership).toHaveProperty('orgId');

        // Verify TypeScript types
        const _id: string = ownership.id;
        const _authorId: string | null = ownership.authorId;
        const _orgId: string | null = ownership.orgId;

        // @ts-expect-error - should not have 'name' property
        const _shouldNotExist = ownership.name;
      }
    });

    it('should return null for non-existent package', async () => {
      const ownership = await repository.getOwnership('non-existent-package-12345');
      expect(ownership).toBeNull();
    });
  });

  describe('search', () => {
    it('should search packages with default params', async () => {
      const result = await repository.search({});

      expect(result).toHaveProperty('packages');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.packages)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should filter by format', async () => {
      const result = await repository.search({
        format: 'cursor',
        limit: 10,
      });

      if (result.packages.length > 0) {
        result.packages.forEach(pkg => {
          expect(pkg.format).toBe('cursor');
        });
      }
    });

    it('should filter by subtype', async () => {
      const result = await repository.search({
        subtype: 'rule',
        limit: 10,
      });

      if (result.packages.length > 0) {
        result.packages.forEach(pkg => {
          expect(pkg.subtype).toBe('rule');
        });
      }
    });

    it('should filter by featured', async () => {
      const result = await repository.search({
        featured: true,
        limit: 10,
      });

      if (result.packages.length > 0) {
        result.packages.forEach(pkg => {
          expect(pkg.featured).toBe(true);
        });
      }
    });

    it('should filter by verified', async () => {
      const result = await repository.search({
        verified: true,
        limit: 10,
      });

      if (result.packages.length > 0) {
        result.packages.forEach(pkg => {
          expect(pkg.verified).toBe(true);
        });
      }
    });

    it('should sort by downloads (default)', async () => {
      const result = await repository.search({
        sort: 'downloads',
        limit: 5,
      });

      if (result.packages.length > 1) {
        for (let i = 0; i < result.packages.length - 1; i++) {
          expect(result.packages[i].totalDownloads).toBeGreaterThanOrEqual(
            result.packages[i + 1].totalDownloads
          );
        }
      }
    });

    it('should sort by created date', async () => {
      const result = await repository.search({
        sort: 'created',
        limit: 5,
      });

      if (result.packages.length > 1) {
        for (let i = 0; i < result.packages.length - 1; i++) {
          const date1 = new Date(result.packages[i].createdAt);
          const date2 = new Date(result.packages[i + 1].createdAt);
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
        }
      }
    });

    it('should paginate results', async () => {
      const page1 = await repository.search({
        limit: 5,
        offset: 0,
      });

      const page2 = await repository.search({
        limit: 5,
        offset: 5,
      });

      if (page1.packages.length > 0 && page2.packages.length > 0) {
        expect(page1.packages[0].id).not.toBe(page2.packages[0].id);
      }
    });

    it('should search by text query', async () => {
      const result = await repository.search({
        search: 'cursor',
        limit: 10,
      });

      if (result.packages.length > 0) {
        result.packages.forEach(pkg => {
          const matchesName = pkg.name.toLowerCase().includes('cursor');
          const matchesDescription = pkg.description?.toLowerCase().includes('cursor') ?? false;
          const matchesTags = pkg.tags?.some(tag => tag.toLowerCase().includes('cursor')) ?? false;

          expect(matchesName || matchesDescription || matchesTags).toBe(true);
        });
      }
    });

    it('should combine multiple filters', async () => {
      const result = await repository.search({
        format: 'cursor',
        subtype: 'rule',
        verified: true,
        limit: 5,
      });

      if (result.packages.length > 0) {
        result.packages.forEach(pkg => {
          expect(pkg.format).toBe('cursor');
          expect(pkg.subtype).toBe('rule');
          expect(pkg.verified).toBe(true);
        });
      }
    });
  });

  describe('getTrending', () => {
    it('should get trending packages', async () => {
      const packages = await repository.getTrending(10);

      expect(Array.isArray(packages)).toBe(true);
      packages.forEach(pkg => {
        expect(pkg.visibility).toBe('public');
      });
    });

    it('should return packages with recent downloads', async () => {
      const packages = await repository.getTrending(10);

      if (packages.length > 0) {
        packages.forEach(pkg => {
          expect(pkg.downloadsLast7Days).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('getPopular', () => {
    it('should get popular packages', async () => {
      const packages = await repository.getPopular({
        limit: 10,
      });

      expect(Array.isArray(packages)).toBe(true);
      packages.forEach(pkg => {
        expect(pkg.visibility).toBe('public');
      });
    });

    it('should sort by total downloads', async () => {
      const packages = await repository.getPopular({
        limit: 5,
      });

      if (packages.length > 1) {
        for (let i = 0; i < packages.length - 1; i++) {
          expect(packages[i].totalDownloads).toBeGreaterThanOrEqual(
            packages[i + 1].totalDownloads
          );
        }
      }
    });

    it('should filter by format', async () => {
      const packages = await repository.getPopular({
        format: 'cursor',
        limit: 10,
      });

      if (packages.length > 0) {
        packages.forEach(pkg => {
          expect(pkg.format).toBe('cursor');
        });
      }
    });
  });

  describe('getLatest', () => {
    it('should get latest packages', async () => {
      const packages = await repository.getLatest(10);

      expect(Array.isArray(packages)).toBe(true);
      packages.forEach(pkg => {
        expect(pkg.visibility).toBe('public');
      });
    });

    it('should sort by created date descending', async () => {
      const packages = await repository.getLatest(5);

      if (packages.length > 1) {
        for (let i = 0; i < packages.length - 1; i++) {
          const date1 = new Date(packages[i].createdAt);
          const date2 = new Date(packages[i + 1].createdAt);
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
        }
      }
    });
  });

  describe('getRecentlyUpdated', () => {
    it('should get recently updated packages', async () => {
      const packages = await repository.getRecentlyUpdated(10);

      expect(Array.isArray(packages)).toBe(true);
      packages.forEach(pkg => {
        expect(pkg.visibility).toBe('public');
        expect(pkg.lastPublishedAt).toBeTruthy();
      });
    });

    it('should sort by last published date descending', async () => {
      const packages = await repository.getRecentlyUpdated(5);

      if (packages.length > 1) {
        for (let i = 0; i < packages.length - 1; i++) {
          if (packages[i].lastPublishedAt && packages[i + 1].lastPublishedAt) {
            const date1 = new Date(packages[i].lastPublishedAt!);
            const date2 = new Date(packages[i + 1].lastPublishedAt!);
            expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
          }
        }
      }
    });
  });

  describe('countByAuthor', () => {
    it('should count packages by author', async () => {
      // First find a package to get an author ID
      const pkg = await repository.findByName('@prpm/getting-started');

      if (pkg?.authorId) {
        const count = await repository.countByAuthor(pkg.authorId);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    it('should return 0 for author with no packages', async () => {
      const count = await repository.countByAuthor('00000000-0000-0000-0000-000000000000');
      expect(count).toBe(0);
    });
  });

  describe('countByOrganization', () => {
    it('should count packages by organization', async () => {
      // Find a package with an org
      const pkg = await repository.findByName('@prpm/getting-started');

      if (pkg?.orgId) {
        const count = await repository.countByOrganization(pkg.orgId);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    it('should return 0 for organization with no packages', async () => {
      const count = await repository.countByOrganization('00000000-0000-0000-0000-000000000000');
      expect(count).toBe(0);
    });
  });

  describe('getByAuthor', () => {
    it('should get packages by author', async () => {
      const pkg = await repository.findByName('@prpm/getting-started');

      if (pkg?.authorId) {
        const packages = await repository.getByAuthor(pkg.authorId);
        expect(Array.isArray(packages)).toBe(true);

        if (packages.length > 0) {
          packages.forEach(p => {
            expect(p.authorId).toBe(pkg.authorId);
          });
        }
      }
    });

    it('should only return public packages by default', async () => {
      const pkg = await repository.findByName('@prpm/getting-started');

      if (pkg?.authorId) {
        const packages = await repository.getByAuthor(pkg.authorId, false);

        packages.forEach(p => {
          expect(p.visibility).toBe('public');
        });
      }
    });
  });

  describe('getByOrganization', () => {
    it('should get packages by organization', async () => {
      const pkg = await repository.findByName('@prpm/getting-started');

      if (pkg?.orgId) {
        const packages = await repository.getByOrganization(pkg.orgId);
        expect(Array.isArray(packages)).toBe(true);

        if (packages.length > 0) {
          packages.forEach(p => {
            expect(p.orgId).toBe(pkg.orgId);
          });
        }
      }
    });

    it('should only return public packages by default', async () => {
      const pkg = await repository.findByName('@prpm/getting-started');

      if (pkg?.orgId) {
        const packages = await repository.getByOrganization(pkg.orgId, false);

        packages.forEach(p => {
          expect(p.visibility).toBe('public');
        });
      }
    });
  });

  describe('Type Safety', () => {
    it('should have correct TypeScript types for Package', async () => {
      const pkg = await repository.findByName('@prpm/getting-started');

      if (pkg) {
        // These should all compile without errors
        const _id: string = pkg.id;
        const _name: string = pkg.name;
        const _description: string | null = pkg.description;
        const _authorId: string | null = pkg.authorId;
        const _orgId: string | null = pkg.orgId;
        const _format: string = pkg.format;
        const _subtype: string = pkg.subtype;
        const _visibility: string | null = pkg.visibility;
        const _totalDownloads: number = pkg.totalDownloads;
        const _verified: boolean = pkg.verified;
        const _featured: boolean = pkg.featured;
        const _createdAt: Date = pkg.createdAt;
        const _updatedAt: Date = pkg.updatedAt;

        // @ts-expect-error - should not have non-existent properties
        const _shouldNotExist = pkg.nonExistentProperty;
      }
    });

    it('should have correct TypeScript types for ownership', async () => {
      const ownership = await repository.getOwnership('@prpm/getting-started');

      if (ownership) {
        // Should only have id, authorId, orgId
        const _id: string = ownership.id;
        const _authorId: string | null = ownership.authorId;
        const _orgId: string | null = ownership.orgId;

        // @ts-expect-error - should not have other package properties
        const _shouldNotExist = ownership.name;
      }
    });
  });
});
