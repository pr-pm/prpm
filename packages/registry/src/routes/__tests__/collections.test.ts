/**
 * Collections routes tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { collectionRoutes } from '../collections';

describe('Collection Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();

    // Mock authenticate decorator
    server.decorate('authenticate', async () => {});

    // Create mock query function
    const mockQuery = async (sql: string, params?: unknown[]) => {
      // Debug logging (uncomment if needed)
      // console.log('SQL:', sql.substring(0, 150));
      // console.log('Params:', params);

      // Mock COUNT query for collections list
      if (sql.includes('COUNT(*)') && sql.includes('count_query')) {
        return {
          rows: [{ count: '2' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
      }

      // Mock specific collection query by scope/id/version (GET /:scope/:id/:version)
      if (sql.includes('c.scope') && sql.includes('c.id') && sql.includes('c.version') &&
          sql.includes('FROM collections c') && !sql.includes('LEFT JOIN')) {
        if (params?.[0] === 'collection' && params?.[1] === 'test-collection' && params?.[2] === '1.0.0') {
          return {
            rows: [{
              id: 'test-collection',
              scope: 'collection',
              name: 'Test Collection',
              description: 'A test collection',
              version: '1.0.0',
              author: 'test-author',
              official: true,
              verified: true,
              category: 'development',
              tags: ['test', 'typescript'],
              downloads: 500,
              stars: 25,
              package_count: 3,
              icon: '📦',
              framework: null,
              created_at: new Date(),
              updated_at: new Date()
            }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: []
          };
        }
        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: []
        };
      }

      // Mock specific collection query (GET /:scope/:name_slug with or without version)
      if (sql.includes('SELECT c.*') && sql.includes('WHERE c.scope = $1 AND c.name_slug = $2')) {
        if (params?.[0] === 'collection' && params?.[1] === 'test-collection') {
          // Check if version parameter is provided
          if (params?.length === 3 && params[2] === '1.0.0') {
            return {
              rows: [{
                id: 'test-collection',
                scope: 'collection',
                name: 'Test Collection',
                description: 'A test collection',
                version: '1.0.0',
                author: 'test-author',
                official: true,
                verified: true,
                category: 'development',
                tags: ['test', 'typescript'],
                downloads: 500,
                stars: 25,
                package_count: 3,
                created_at: new Date(),
                updated_at: new Date()
              }],
              command: 'SELECT',
              rowCount: 1,
              oid: 0,
              fields: []
            };
          }
          // Without version, return latest
          return {
            rows: [{
              id: 'uuid-test-collection',
              scope: 'collection',
              name_slug: 'test-collection',
              name: 'Test Collection',
              description: 'A test collection',
              version: '1.0.0',
              author: 'test-author',
              official: true,
              verified: true,
              category: 'development',
              tags: ['test', 'typescript'],
              downloads: 500,
              stars: 25,
              package_count: 3,
              created_at: new Date(),
              updated_at: new Date()
            }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: []
          };
        }
        // Return empty for non-existent collection
        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: []
        };
      }

      // Mock collection packages query (both JOIN and LEFT JOIN variants)
      if (sql.includes('FROM collection_packages cp') && (sql.includes('JOIN packages p') || sql.includes('LEFT JOIN packages p'))) {
        return {
          rows: [
            {
              package_id: 'pkg1',
              package_version: '1.0.0',
              required: true,
              reason: 'Core package',
              install_order: 1,
              package_name: 'Package 1',
              
              package_description: 'First package',
              description: 'First package',
              package_type: 'agent',
              type: 'agent',
              tags: ['test'],
              latest_version: '1.0.0'
            },
            {
              package_id: 'pkg2',
              package_version: '1.0.0',
              required: false,
              reason: 'Optional enhancement',
              install_order: 2,
              package_name: 'Package 2',
              
              package_description: 'Second package',
              description: 'Second package',
              package_type: 'rule',
              type: 'rule',
              tags: ['test'],
              latest_version: '1.0.0'
            }
          ],
          command: 'SELECT',
          rowCount: 2,
          oid: 0,
          fields: []
        };
      }

      // Mock collections list query
      if (sql.includes('FROM collections c') && sql.includes('LEFT JOIN')) {
        return {
          rows: [
            {
              id: 'typescript-fullstack',
              scope: 'collection',
              name: 'TypeScript Full Stack',
              description: 'Full stack TypeScript development',
              version: '1.0.0',
              author: 'admin',
              official: true,
              verified: true,
              category: 'development',
              tags: ['typescript', 'fullstack'],
              framework: null,
              package_count: 5,
              downloads: 1000,
              stars: 50,
              icon: '📦',
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              id: 'pulumi-infrastructure',
              scope: 'collection',
              name: 'Pulumi Infrastructure',
              description: 'Infrastructure as code with Pulumi',
              version: '1.0.0',
              author: 'admin',
              official: true,
              verified: true,
              category: 'infrastructure',
              tags: ['pulumi', 'iac'],
              framework: null,
              package_count: 7,
              downloads: 750,
              stars: 40,
              icon: '☁️',
              created_at: new Date(),
              updated_at: new Date()
            }
          ],
          command: 'SELECT',
          rowCount: 2,
          oid: 0,
          fields: []
        };
      }

      return {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: []
      };
    };

    // Mock database with both query() and connect() methods
    (server as any).decorate('pg', {
      query: mockQuery,
      connect: async () => ({
        query: mockQuery,
        release: () => {}
      })
    } as any);

    await server.register(collectionRoutes, { prefix: '/api/v1/collections' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/v1/collections', () => {
    it('should list collections', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.collections)).toBe(true);
      expect(body.total).toBeDefined();
    });

    it('should filter by category', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections?category=development'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should filter by official flag', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections?official=true'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.collections.every((c: any) => c.official === true));
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections?limit=10&offset=0'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.perPage).toBe(10);
      expect(body.page).toBeDefined();
      expect(body.total).toBeDefined();
    });
  });

  describe('GET /api/v1/collections/:scope/:id', () => {
    it('should return collection details', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections/collection/test-collection'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name_slug).toBe('test-collection');
      expect(body.name).toBe('Test Collection');
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.packages.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent collection', async () => {
      (server as any).pg = {
        query: async () => ({
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: []
        }),
        connect: async () => ({
          query: async () => ({ rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] }),
          release: () => {}
        })
      };

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections/collection/does-not-exist'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should support version parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections/collection/test-collection?version=1.0.0'
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/v1/collections/:scope/:nameSlug/star', () => {
    let starredCollections: Set<string>;

    beforeEach(() => {
      starredCollections = new Set();

      // Update mock to handle star queries
      const originalMockQuery = (server as any).pg.query;
      (server as any).pg.query = async (sql: string, params?: unknown[]) => {
        // Get collection ID by scope and name_slug
        if (sql.includes('SELECT id FROM collections WHERE scope = $1 AND name_slug = $2')) {
          if (params?.[0] === 'collection' && params?.[1] === 'test-collection') {
            return { rows: [{ id: 'uuid-test-collection' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
          }
          return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] };
        }

        // Star insert
        if (sql.includes('INSERT INTO collection_stars')) {
          const collectionId = params?.[0] as string;
          starredCollections.add(collectionId);
          return { rows: [], command: 'INSERT', rowCount: 1, oid: 0, fields: [] };
        }

        // Star delete
        if (sql.includes('DELETE FROM collection_stars')) {
          const collectionId = params?.[0] as string;
          starredCollections.delete(collectionId);
          return { rows: [], command: 'DELETE', rowCount: 1, oid: 0, fields: [] };
        }

        // Get updated star count
        if (sql.includes('SELECT stars FROM collections WHERE id = $1')) {
          const collectionId = params?.[0] as string;
          const count = collectionId === 'uuid-test-collection' ? (starredCollections.has(collectionId) ? 26 : 25) : 0;
          return { rows: [{ stars: count }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }

        return originalMockQuery(sql, params);
      };

      // Mock user authentication
      (server as any).decorate('authenticate', async (request: any) => {
        request.user = { user_id: 'test-user-id', username: 'test-user' };
      }, { decorateRequest: true });
    });

    it('should star a collection', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/collections/collection/test-collection/star',
        headers: {
          authorization: 'Bearer test-token'
        },
        payload: {
          starred: true
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.starred).toBe(true);
      expect(body.stars).toBe(26);
    });

    it('should unstar a collection', async () => {
      // First star it
      starredCollections.add('uuid-test-collection');

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/collections/collection/test-collection/star',
        headers: {
          authorization: 'Bearer test-token'
        },
        payload: {
          starred: false
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.starred).toBe(false);
      expect(body.stars).toBe(25);
    });
  });

  describe('GET /api/v1/collections/starred', () => {
    beforeEach(() => {
      // Mock starred collections query
      const originalMockQuery = (server as any).pg.query;
      (server as any).pg.query = async (sql: string, params?: unknown[]) => {
        if (sql.includes('FROM collection_stars cs') && sql.includes('JOIN collections c')) {
          return {
            rows: [
              {
                id: 'starred-col-1',
                scope: 'collection',
                name_slug: 'starred-collection-1',
                name: 'Starred Collection 1',
                description: 'First starred collection',
                author_username: 'author1',
                stars: 30,
                package_count: 5,
                starred_at: new Date()
              },
              {
                id: 'starred-col-2',
                scope: 'collection',
                name_slug: 'starred-collection-2',
                name: 'Starred Collection 2',
                description: 'Second starred collection',
                author_username: 'author2',
                stars: 40,
                package_count: 8,
                starred_at: new Date()
              }
            ],
            command: 'SELECT',
            rowCount: 2,
            oid: 0,
            fields: []
          };
        }

        return originalMockQuery(sql, params);
      };

      // Mock user authentication
      (server as any).decorate('authenticate', async (request: any) => {
        request.user = { user_id: 'test-user-id', username: 'test-user' };
      }, { decorateRequest: true });
    });

    it('should return starred collections', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections/starred',
        headers: {
          authorization: 'Bearer test-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.collections)).toBe(true);
      expect(body.collections.length).toBe(2);
      expect(body.collections[0].name).toBe('Starred Collection 1');
      expect(body.total).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections/starred?limit=10&offset=0',
        headers: {
          authorization: 'Bearer test-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.collections).toBeDefined();
    });
  });

  describe('Collection version deduplication', () => {
    let deduplicationServer: FastifyInstance;

    beforeAll(async () => {
      deduplicationServer = Fastify();

      // Mock authenticate decorator
      deduplicationServer.decorate('authenticate', async () => {});

      // Mock redis
      deduplicationServer.decorate('redis', {
        del: async () => {},
        get: async () => null,
        set: async () => {},
      } as any);

      // Create mock query function that simulates multiple versions of same collection
      const mockQuery = async (sql: string, params?: unknown[]) => {
        // Mock COUNT query - should count unique name_slugs, not total rows
        if (sql.includes('COUNT(*)') && sql.includes('count_query')) {
          // The CTE should deduplicate, so only 2 unique collections
          return {
            rows: [{ count: '2' }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: []
          };
        }

        // Mock COUNT DISTINCT for SSG endpoint
        if (sql.includes('COUNT(DISTINCT name_slug)')) {
          return {
            rows: [{ total: '2' }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: []
          };
        }

        // Mock collections list query with CTE (deduplication query)
        // This simulates having multiple versions but only returning the latest
        if (sql.includes('WITH latest_versions AS') && sql.includes('DISTINCT ON (name_slug)')) {
          return {
            rows: [
              {
                id: 'uuid-v2',
                name_slug: 'my-collection',
                name: 'My Collection',
                description: 'Test collection with multiple versions',
                version: '2.0.0',  // Latest version
                author: 'test-author',
                official: false,
                verified: false,
                category: 'development',
                tags: ['test'],
                framework: null,
                package_count: 3,
                downloads: 150,  // Aggregated from both versions
                stars: 10,
                icon: '📦',
                created_at: new Date('2024-02-01'),
                updated_at: new Date('2024-02-01')
              },
              {
                id: 'uuid-other',
                name_slug: 'other-collection',
                name: 'Other Collection',
                description: 'Another collection',
                version: '1.0.0',
                author: 'other-author',
                official: true,
                verified: true,
                category: 'infrastructure',
                tags: ['iac'],
                framework: null,
                package_count: 5,
                downloads: 500,
                stars: 25,
                icon: '☁️',
                created_at: new Date('2024-01-15'),
                updated_at: new Date('2024-01-15')
              }
            ],
            command: 'SELECT',
            rowCount: 2,
            oid: 0,
            fields: []
          };
        }

        // Mock collection packages query
        if (sql.includes('FROM collection_packages cp')) {
          return {
            rows: [
              {
                package_id: 'pkg1',
                package_version: '1.0.0',
                required: true,
                reason: 'Core package',
                install_order: 1,
                package_name: 'Package 1',
                package_description: 'First package',
                description: 'First package',
                package_type: 'agent',
                type: 'agent',
                tags: ['test'],
                latest_version: '1.0.0'
              }
            ],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: []
          };
        }

        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: []
        };
      };

      // Mock database
      (deduplicationServer as any).decorate('pg', {
        query: mockQuery,
        connect: async () => ({
          query: mockQuery,
          release: () => {}
        })
      } as any);

      await deduplicationServer.register(collectionRoutes, { prefix: '/api/v1/collections' });
      await deduplicationServer.ready();
    });

    afterAll(async () => {
      await deduplicationServer.close();
    });

    it('should return only latest version of each collection in list', async () => {
      const response = await deduplicationServer.inject({
        method: 'GET',
        url: '/api/v1/collections'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Should have 2 collections, not 3 (one collection has 2 versions)
      expect(body.collections.length).toBe(2);

      // Verify we got the latest version of 'my-collection'
      const myCollection = body.collections.find((c: any) => c.name_slug === 'my-collection');
      expect(myCollection).toBeDefined();
      expect(myCollection.version).toBe('2.0.0');

      // Verify no duplicate name_slugs
      const nameSlugs = body.collections.map((c: any) => c.name_slug);
      const uniqueSlugs = [...new Set(nameSlugs)];
      expect(nameSlugs.length).toBe(uniqueSlugs.length);
    });

    it('should count unique collections, not total versions', async () => {
      const response = await deduplicationServer.inject({
        method: 'GET',
        url: '/api/v1/collections'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Total should be 2 unique collections, not 3 total rows
      expect(body.total).toBe(2);
    });

    it('should return deduplicated featured collections', async () => {
      const response = await deduplicationServer.inject({
        method: 'GET',
        url: '/api/v1/collections/featured'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Verify no duplicate name_slugs in featured
      const nameSlugs = body.collections.map((c: any) => c.name_slug);
      const uniqueSlugs = [...new Set(nameSlugs)];
      expect(nameSlugs.length).toBe(uniqueSlugs.length);
    });
  });
});
