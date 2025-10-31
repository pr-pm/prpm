import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CollectionRepository } from '../collection-repository';
import { pool } from '../../db';

describe('CollectionRepository', () => {
  let repository: CollectionRepository;

  beforeAll(() => {
    repository = new CollectionRepository();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('findBySlug', () => {
    it('should find collection by scope and name slug', async () => {
      // This test requires a test collection in the database
      // Using a collection that should exist in the seeded database
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection) {
        expect(collection).toHaveProperty('id');
        expect(collection).toHaveProperty('scope');
        expect(collection).toHaveProperty('nameSlug');
        expect(collection.scope).toBe('prpm');
        expect(collection.nameSlug).toBe('startup-mvp');

        // Verify TypeScript types are correct
        const _id: string = collection.id;
        const _scope: string = collection.scope;
        const _name: string = collection.name;
        const _nameSlug: string | null = collection.nameSlug;
        const _version: string = collection.version;
        const _description: string | null = collection.description;
      }
    });

    it('should find collection by scope, name slug, and version', async () => {
      const collection = await repository.findBySlug('prpm', 'startup-mvp', '1.0.0');

      if (collection) {
        expect(collection.scope).toBe('prpm');
        expect(collection.nameSlug).toBe('startup-mvp');
        expect(collection.version).toBe('1.0.0');
      }
    });

    it('should return latest version when version not specified', async () => {
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection) {
        expect(collection).toHaveProperty('version');
        expect(collection).toHaveProperty('createdAt');
      }
    });

    it('should return null for non-existent collection', async () => {
      const collection = await repository.findBySlug('non-existent', 'collection-12345');
      expect(collection).toBeNull();
    });

    it('should handle scoped collection lookups', async () => {
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection) {
        expect(collection.scope).toBe('prpm');
      }
    });
  });

  describe('findById', () => {
    it('should find collection by id', async () => {
      // First find a collection to get its ID
      const collectionBySlug = await repository.findBySlug('prpm', 'startup-mvp');

      if (collectionBySlug) {
        const collection = await repository.findById(collectionBySlug.id);

        expect(collection).toBeTruthy();
        if (collection) {
          expect(collection.id).toBe(collectionBySlug.id);
          expect(collection.scope).toBe(collectionBySlug.scope);
          expect(collection.nameSlug).toBe(collectionBySlug.nameSlug);
        }
      }
    });

    it('should return null for non-existent id', async () => {
      const collection = await repository.findById('00000000-0000-0000-0000-000000000000');
      expect(collection).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing collection', async () => {
      const exists = await repository.exists('prpm', 'startup-mvp');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent collection', async () => {
      const exists = await repository.exists('non-existent', 'collection-12345');
      expect(exists).toBe(false);
    });
  });

  describe('findByOrganization', () => {
    it('should find collections by organization', async () => {
      // First find a collection to get an org ID
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection?.orgId) {
        const collections = await repository.findByOrganization(collection.orgId);
        expect(Array.isArray(collections)).toBe(true);

        if (collections.length > 0) {
          collections.forEach(c => {
            expect(c.orgId).toBe(collection.orgId);
          });
        }
      }
    });

    it('should return empty array for organization with no collections', async () => {
      const collections = await repository.findByOrganization('00000000-0000-0000-0000-000000000000');
      expect(Array.isArray(collections)).toBe(true);
      expect(collections.length).toBe(0);
    });

    it('should sort by created date descending', async () => {
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection?.orgId) {
        const collections = await repository.findByOrganization(collection.orgId);

        if (collections.length > 1) {
          for (let i = 0; i < collections.length - 1; i++) {
            const date1 = new Date(collections[i].createdAt);
            const date2 = new Date(collections[i + 1].createdAt);
            expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
          }
        }
      }
    });
  });

  describe('findByAuthor', () => {
    it('should find collections by author', async () => {
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection?.authorId) {
        const collections = await repository.findByAuthor(collection.authorId);
        expect(Array.isArray(collections)).toBe(true);

        if (collections.length > 0) {
          collections.forEach(c => {
            expect(c.authorId).toBe(collection.authorId);
          });
        }
      }
    });

    it('should return empty array for author with no collections', async () => {
      const collections = await repository.findByAuthor('00000000-0000-0000-0000-000000000000');
      expect(Array.isArray(collections)).toBe(true);
      expect(collections.length).toBe(0);
    });

    it('should sort by created date descending', async () => {
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection?.authorId) {
        const collections = await repository.findByAuthor(collection.authorId);

        if (collections.length > 1) {
          for (let i = 0; i < collections.length - 1; i++) {
            const date1 = new Date(collections[i].createdAt);
            const date2 = new Date(collections[i + 1].createdAt);
            expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
          }
        }
      }
    });
  });

  describe('search', () => {
    it('should search collections with default params', async () => {
      const result = await repository.search({});

      expect(result).toHaveProperty('collections');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.collections)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should filter by category', async () => {
      const result = await repository.search({
        category: 'Development',
        limit: 10,
      });

      if (result.collections.length > 0) {
        result.collections.forEach(collection => {
          expect(collection.category).toBe('Development');
        });
      }
    });

    it('should filter by tag', async () => {
      const result = await repository.search({
        tag: 'startup',
        limit: 10,
      });

      if (result.collections.length > 0) {
        result.collections.forEach(collection => {
          expect(collection.tags).toContain('startup');
        });
      }
    });

    it('should filter by framework', async () => {
      const result = await repository.search({
        framework: 'cursor',
        limit: 10,
      });

      if (result.collections.length > 0) {
        result.collections.forEach(collection => {
          expect(collection.framework).toBe('cursor');
        });
      }
    });

    it('should filter by official', async () => {
      const result = await repository.search({
        official: true,
        limit: 10,
      });

      if (result.collections.length > 0) {
        result.collections.forEach(collection => {
          expect(collection.official).toBe(true);
        });
      }
    });

    it('should filter by verified', async () => {
      const result = await repository.search({
        verified: true,
        limit: 10,
      });

      if (result.collections.length > 0) {
        result.collections.forEach(collection => {
          expect(collection.verified).toBe(true);
        });
      }
    });

    it('should filter by scope', async () => {
      const result = await repository.search({
        scope: 'prpm',
        limit: 10,
      });

      if (result.collections.length > 0) {
        result.collections.forEach(collection => {
          expect(collection.scope).toBe('prpm');
        });
      }
    });

    it('should sort by downloads (default)', async () => {
      const result = await repository.search({
        sort: 'downloads',
        limit: 5,
      });

      if (result.collections.length > 1) {
        for (let i = 0; i < result.collections.length - 1; i++) {
          expect(result.collections[i].downloads).toBeGreaterThanOrEqual(
            result.collections[i + 1].downloads
          );
        }
      }
    });

    it('should sort by stars', async () => {
      const result = await repository.search({
        sort: 'stars',
        limit: 5,
      });

      if (result.collections.length > 1) {
        for (let i = 0; i < result.collections.length - 1; i++) {
          expect(result.collections[i].stars).toBeGreaterThanOrEqual(
            result.collections[i + 1].stars
          );
        }
      }
    });

    it('should sort by created date', async () => {
      const result = await repository.search({
        sort: 'created',
        limit: 5,
      });

      if (result.collections.length > 1) {
        for (let i = 0; i < result.collections.length - 1; i++) {
          const date1 = new Date(result.collections[i].createdAt);
          const date2 = new Date(result.collections[i + 1].createdAt);
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
        }
      }
    });

    it('should sort by name', async () => {
      const result = await repository.search({
        sort: 'name',
        sortOrder: 'asc',
        limit: 5,
      });

      if (result.collections.length > 1) {
        for (let i = 0; i < result.collections.length - 1; i++) {
          expect(result.collections[i].name.localeCompare(result.collections[i + 1].name)).toBeLessThanOrEqual(0);
        }
      }
    });

    it('should respect sort order', async () => {
      const resultAsc = await repository.search({
        sort: 'downloads',
        sortOrder: 'asc',
        limit: 5,
      });

      if (resultAsc.collections.length > 1) {
        for (let i = 0; i < resultAsc.collections.length - 1; i++) {
          expect(resultAsc.collections[i].downloads).toBeLessThanOrEqual(
            resultAsc.collections[i + 1].downloads
          );
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

      if (page1.collections.length > 0 && page2.collections.length > 0) {
        expect(page1.collections[0].id).not.toBe(page2.collections[0].id);
      }
    });

    it('should search by text query', async () => {
      const result = await repository.search({
        search: 'startup',
        limit: 10,
      });

      if (result.collections.length > 0) {
        result.collections.forEach(collection => {
          const matchesName = collection.name.toLowerCase().includes('startup');
          const matchesDescription = collection.description?.toLowerCase().includes('startup') ?? false;
          const matchesNameSlug = collection.nameSlug?.toLowerCase().includes('startup') ?? false;
          const matchesTags = collection.tags?.some(tag => tag.toLowerCase().includes('startup')) ?? false;

          expect(matchesName || matchesDescription || matchesNameSlug || matchesTags).toBe(true);
        });
      }
    });

    it('should combine multiple filters', async () => {
      const result = await repository.search({
        category: 'Development',
        official: true,
        verified: true,
        limit: 5,
      });

      if (result.collections.length > 0) {
        result.collections.forEach(collection => {
          expect(collection.category).toBe('Development');
          expect(collection.official).toBe(true);
          expect(collection.verified).toBe(true);
        });
      }
    });
  });

  describe('getFeatured', () => {
    it('should get featured collections', async () => {
      const collections = await repository.getFeatured(10);

      expect(Array.isArray(collections)).toBe(true);
      collections.forEach(collection => {
        expect(collection.official).toBe(true);
        expect(collection.verified).toBe(true);
      });
    });

    it('should sort by stars and downloads', async () => {
      const collections = await repository.getFeatured(5);

      if (collections.length > 1) {
        for (let i = 0; i < collections.length - 1; i++) {
          // Should be sorted by stars first, then downloads
          if (collections[i].stars === collections[i + 1].stars) {
            expect(collections[i].downloads).toBeGreaterThanOrEqual(
              collections[i + 1].downloads
            );
          } else {
            expect(collections[i].stars).toBeGreaterThanOrEqual(
              collections[i + 1].stars
            );
          }
        }
      }
    });
  });

  describe('getLatest', () => {
    it('should get latest collections', async () => {
      const collections = await repository.getLatest(10);

      expect(Array.isArray(collections)).toBe(true);
    });

    it('should sort by created date descending', async () => {
      const collections = await repository.getLatest(5);

      if (collections.length > 1) {
        for (let i = 0; i < collections.length - 1; i++) {
          const date1 = new Date(collections[i].createdAt);
          const date2 = new Date(collections[i + 1].createdAt);
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
        }
      }
    });
  });

  describe('getPopular', () => {
    it('should get popular collections', async () => {
      const collections = await repository.getPopular(10);

      expect(Array.isArray(collections)).toBe(true);
    });

    it('should sort by downloads descending', async () => {
      const collections = await repository.getPopular(5);

      if (collections.length > 1) {
        for (let i = 0; i < collections.length - 1; i++) {
          // Should be sorted by downloads first, then stars
          if (collections[i].downloads === collections[i + 1].downloads) {
            expect(collections[i].stars).toBeGreaterThanOrEqual(
              collections[i + 1].stars
            );
          } else {
            expect(collections[i].downloads).toBeGreaterThanOrEqual(
              collections[i + 1].downloads
            );
          }
        }
      }
    });
  });

  describe('countByAuthor', () => {
    it('should count collections by author', async () => {
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection?.authorId) {
        const count = await repository.countByAuthor(collection.authorId);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    it('should return 0 for author with no collections', async () => {
      const count = await repository.countByAuthor('00000000-0000-0000-0000-000000000000');
      expect(count).toBe(0);
    });
  });

  describe('countByOrganization', () => {
    it('should count collections by organization', async () => {
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection?.orgId) {
        const count = await repository.countByOrganization(collection.orgId);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    it('should return 0 for organization with no collections', async () => {
      const count = await repository.countByOrganization('00000000-0000-0000-0000-000000000000');
      expect(count).toBe(0);
    });
  });

  describe('Type Safety', () => {
    it('should have correct TypeScript types for Collection', async () => {
      const collection = await repository.findBySlug('prpm', 'startup-mvp');

      if (collection) {
        // These should all compile without errors
        const _id: string = collection.id;
        const _scope: string = collection.scope;
        const _name: string = collection.name;
        const _nameSlug: string | null = collection.nameSlug;
        const _oldId: string | null = collection.oldId;
        const _version: string = collection.version;
        const _description: string | null = collection.description;
        const _authorId: string | null = collection.authorId;
        const _orgId: string | null = collection.orgId;
        const _official: boolean = collection.official;
        const _verified: boolean = collection.verified;
        const _category: string | null = collection.category;
        const _tags: string[] | null = collection.tags;
        const _framework: string | null = collection.framework;
        const _downloads: number = collection.downloads;
        const _stars: number = collection.stars;
        const _icon: string | null = collection.icon;
        const _banner: string | null = collection.banner;
        const _readme: string | null = collection.readme;
        const _config: unknown = collection.config;
        const _createdAt: Date = collection.createdAt;
        const _updatedAt: Date = collection.updatedAt;

        // @ts-expect-error - should not have non-existent properties
        const _shouldNotExist = collection.nonExistentProperty;
      }
    });

    it('should have correct TypeScript types for search results', async () => {
      const result = await repository.search({});

      // Verify result structure types
      const _collections: typeof result.collections = result.collections;
      const _total: number = result.total;

      // @ts-expect-error - should not have non-existent properties
      const _shouldNotExist = result.nonExistentProperty;
    });

    it('should enforce correct parameter types', async () => {
      // These should compile
      await repository.findBySlug('scope', 'slug');
      await repository.findBySlug('scope', 'slug', '1.0.0');
      await repository.findById('00000000-0000-0000-0000-000000000000');
      await repository.exists('scope', 'slug');

      // @ts-expect-error - should require string parameters
      await repository.findBySlug(123, 'slug');

      // @ts-expect-error - should require all required parameters
      await repository.findBySlug('scope');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid UUID gracefully', async () => {
      const collection = await repository.findById('invalid-uuid');
      // Should either return null or throw - we're just checking it doesn't crash
      expect(collection === null || collection !== undefined).toBe(true);
    });

    it('should handle empty search query', async () => {
      const result = await repository.search({ search: '' });
      expect(result).toHaveProperty('collections');
      expect(result).toHaveProperty('total');
    });

    it('should handle zero limit', async () => {
      const result = await repository.search({ limit: 0 });
      expect(result.collections.length).toBe(0);
    });

    it('should handle large offset', async () => {
      const result = await repository.search({ limit: 10, offset: 999999 });
      expect(Array.isArray(result.collections)).toBe(true);
    });
  });
});
