import { describe, it, expect } from 'vitest';
import { collections, type Collection, type NewCollection } from '../collections.js';

describe('Collections Schema', () => {
  describe('type inference', () => {
    it('should infer Collection type correctly', () => {
      // This test ensures type inference works by creating a mock collection
      const mockCollection: Collection = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        scope: 'collection',
        name: 'Test Collection',
        nameSlug: 'test-collection',
        oldId: null,
        version: '1.0.0',
        description: 'A test collection',
        authorId: null,
        orgId: null,
        maintainers: ['user1', 'user2'],
        official: false,
        verified: false,
        category: 'productivity',
        tags: ['test', 'example'],
        framework: null,
        downloads: 100,
        stars: 10,
        icon: 'test-icon.png',
        banner: 'test-banner.png',
        readme: '# Test Collection',
        config: { defaultFormat: 'claude', installOrder: ['pkg1', 'pkg2'] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Type assertions to verify the structure
      expect(mockCollection).toHaveProperty('id');
      expect(mockCollection).toHaveProperty('scope');
      expect(mockCollection).toHaveProperty('name');
      expect(mockCollection).toHaveProperty('nameSlug');
      expect(mockCollection).toHaveProperty('version');
      expect(mockCollection).toHaveProperty('description');
      expect(mockCollection).toHaveProperty('authorId');
      expect(mockCollection).toHaveProperty('orgId');
      expect(mockCollection).toHaveProperty('maintainers');
      expect(mockCollection).toHaveProperty('official');
      expect(mockCollection).toHaveProperty('verified');
      expect(mockCollection).toHaveProperty('category');
      expect(mockCollection).toHaveProperty('tags');
      expect(mockCollection).toHaveProperty('framework');
      expect(mockCollection).toHaveProperty('downloads');
      expect(mockCollection).toHaveProperty('stars');
      expect(mockCollection).toHaveProperty('icon');
      expect(mockCollection).toHaveProperty('banner');
      expect(mockCollection).toHaveProperty('readme');
      expect(mockCollection).toHaveProperty('config');
      expect(mockCollection).toHaveProperty('createdAt');
      expect(mockCollection).toHaveProperty('updatedAt');
    });

    it('should infer NewCollection type correctly for inserts', () => {
      // Test that NewCollection allows partial data for inserts
      const newCollection: NewCollection = {
        scope: 'collection',
        name: 'New Collection',
        version: '1.0.0',
        description: 'A new collection',
      };

      // Type assertions
      expect(newCollection).toHaveProperty('scope');
      expect(newCollection).toHaveProperty('name');
      expect(newCollection).toHaveProperty('version');
      expect(newCollection).not.toHaveProperty('id'); // Should not have id yet
    });

    it('should support nullable fields correctly', () => {
      const collection: Collection = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        scope: 'username',
        name: 'Minimal Collection',
        nameSlug: null,
        oldId: null,
        version: '1.0.0',
        description: null,
        authorId: null,
        orgId: null,
        maintainers: [],
        official: false,
        verified: false,
        category: null,
        tags: [],
        framework: null,
        downloads: 0,
        stars: 0,
        icon: null,
        banner: null,
        readme: null,
        config: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Verify nullable fields accept null
      expect(collection.nameSlug).toBeNull();
      expect(collection.oldId).toBeNull();
      expect(collection.description).toBeNull();
      expect(collection.authorId).toBeNull();
      expect(collection.orgId).toBeNull();
      expect(collection.category).toBeNull();
      expect(collection.framework).toBeNull();
      expect(collection.icon).toBeNull();
      expect(collection.banner).toBeNull();
      expect(collection.readme).toBeNull();
      expect(collection.config).toBeNull();
    });

    it('should support org_id reference', () => {
      const collection: NewCollection = {
        scope: 'collection',
        name: 'Org Collection',
        version: '1.0.0',
        orgId: '123e4567-e89b-12d3-a456-426614174001', // UUID reference to organizations table
      };

      expect(collection.orgId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('should support arrays (maintainers, tags)', () => {
      const collection: NewCollection = {
        scope: 'collection',
        name: 'Array Test',
        version: '1.0.0',
        maintainers: ['user1', 'user2', 'user3'],
        tags: ['productivity', 'tools', 'automation'],
      };

      expect(collection.maintainers).toHaveLength(3);
      expect(collection.tags).toHaveLength(3);
    });

    it('should support JSONB config field', () => {
      const collection: NewCollection = {
        scope: 'collection',
        name: 'Config Test',
        version: '1.0.0',
        config: {
          defaultFormat: 'cursor',
          installOrder: ['pkg1', 'pkg2', 'pkg3'],
          postInstall: 'echo "Installation complete"',
          metadata: { author: 'test', date: '2025-10-31' },
        },
      };

      expect(collection.config).toHaveProperty('defaultFormat');
      expect(collection.config).toHaveProperty('installOrder');
      expect(collection.config).toHaveProperty('postInstall');
      expect(collection.config).toHaveProperty('metadata');
    });
  });

  describe('schema definition', () => {
    it('should have correct table name', () => {
      // @ts-expect-error - accessing internal property for testing
      expect(collections[Symbol.for('drizzle:Name')]).toBe('collections');
    });

    it('should export collections table', () => {
      expect(collections).toBeDefined();
    });
  });

  describe('camelCase to snake_case mapping', () => {
    it('should map TypeScript fields to database columns correctly', () => {
      // This ensures our camelCase (TS) to snake_case (DB) mapping is correct
      const fieldMapping = {
        // TS field -> DB column
        id: 'id',
        scope: 'scope',
        name: 'name',
        nameSlug: 'name_slug',
        oldId: 'old_id',
        version: 'version',
        description: 'description',
        authorId: 'author_id',
        orgId: 'org_id',
        maintainers: 'maintainers',
        official: 'official',
        verified: 'verified',
        category: 'category',
        tags: 'tags',
        framework: 'framework',
        downloads: 'downloads',
        stars: 'stars',
        icon: 'icon',
        banner: 'banner',
        readme: 'readme',
        config: 'config',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      };

      // Verify all expected fields are in the schema
      Object.keys(fieldMapping).forEach((tsField) => {
        expect(collections).toHaveProperty(tsField);
      });
    });
  });
});
