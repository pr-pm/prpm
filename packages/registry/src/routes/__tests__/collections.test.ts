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

      // Mock COUNT query for collections list (new optimized pattern with CTE)
      if (sql.includes('SELECT COUNT(*)') && sql.includes('latest_versions')) {
        return {
          rows: [{ count: '2' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
      }

      // Mock COUNT query for collections list (legacy pattern)
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

      // Mock collections list query (new pattern with CTE from latest_versions)
      if (sql.includes('FROM latest_versions c') && sql.includes('LEFT JOIN')) {
        return {
          rows: [
            {
              id: 'typescript-fullstack',
              name_slug: 'typescript-fullstack',
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
              name_slug: 'pulumi-infrastructure',
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

      // Mock collections list query (legacy pattern)
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

  describe('Collection packages deduplication', () => {
    let dedupePackagesServer: FastifyInstance;

    beforeAll(async () => {
      dedupePackagesServer = Fastify();

      // Mock authenticate decorator
      dedupePackagesServer.decorate('authenticate', async () => {});

      // Mock Redis
      (dedupePackagesServer as any).decorate('redis', {
        get: async () => null,
        set: async () => 'OK',
        del: async () => 1,
      });

      // Create mock query function that simulates:
      // - A collection with 4 packages
      // - Each package has multiple versions in package_versions
      // - The LATERAL JOIN should ensure only 1 row per package
      const mockQuery = async (sql: string, params?: unknown[]) => {
        // Mock collection lookup by name_slug (GET /:name_slug endpoint)
        // The query uses: SELECT c.*, ... WHERE c.name_slug = $1
        if (sql.includes('SELECT c.*') && sql.includes('WHERE c.name_slug = $1') && !sql.includes('c.version = $2')) {
          if (params?.[0] === 'multi-version-packages') {
            return {
              rows: [{
                id: 'collection-uuid',
                scope: 'collection',
                name_slug: 'multi-version-packages',
                name: 'Multi Version Packages Collection',
                description: 'A collection where packages have multiple versions',
                version: '1.0.0',
                author: 'test-author',
                official: true,
                verified: true,
                category: 'development',
                tags: ['test'],
                downloads: 100,
                stars: 10,
                package_count: 4,
                created_at: new Date(),
                updated_at: new Date()
              }],
              command: 'SELECT',
              rowCount: 1,
              oid: 0,
              fields: []
            };
          }
          return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] };
        }

        // Mock collection packages query with LATERAL JOIN
        // This simulates the fixed query that uses LATERAL to get only 1 version per package
        // Before the fix, LEFT JOIN package_versions would create N rows per package (where N = number of versions)
        // NOTE: We specifically require LEFT JOIN LATERAL to ensure the deduplication fix is present
        if (sql.includes('FROM collection_packages cp') &&
            sql.includes('LEFT JOIN LATERAL')) {
          // Return exactly 4 unique packages, each with their latest version
          // This is the correct behavior after the LATERAL JOIN fix
          // Fields match the actual query: cp.*, p.name as package_name, p.description as package_description, etc.
          return {
            rows: [
              {
                package_id: 'pkg-1',
                package_version: '^1.0.0',
                required: true,
                reason: 'Core TypeScript support',
                install_order: 1,
                format_override: null,
                package_name: '@test/typescript-rules',
                package_description: 'TypeScript coding rules',
                package_format: 'cursor',
                package_subtype: 'rule',
                latest_version: '2.5.0'  // Has versions: 1.0.0, 1.1.0, 2.0.0, 2.5.0
              },
              {
                package_id: 'pkg-2',
                package_version: '^1.0.0',
                required: true,
                reason: 'React patterns',
                install_order: 2,
                format_override: null,
                package_name: '@test/react-patterns',
                package_description: 'React best practices',
                package_format: 'claude',
                package_subtype: 'skill',
                latest_version: '3.0.0'  // Has versions: 1.0.0, 2.0.0, 3.0.0
              },
              {
                package_id: 'pkg-3',
                package_version: '^2.0.0',
                required: false,
                reason: 'Optional testing utilities',
                install_order: 3,
                format_override: null,
                package_name: '@test/testing-utils',
                package_description: 'Testing utilities',
                package_format: 'claude',
                package_subtype: 'agent',
                latest_version: '2.1.0'  // Has versions: 1.0.0, 1.5.0, 2.0.0, 2.1.0
              },
              {
                package_id: 'pkg-4',
                package_version: 'latest',
                required: true,
                reason: 'Code formatting',
                install_order: 4,
                format_override: null,
                package_name: '@test/prettier-config',
                package_description: 'Prettier configuration',
                package_format: 'cursor',
                package_subtype: 'rule',
                latest_version: '1.2.3'  // Has versions: 1.0.0, 1.1.0, 1.2.0, 1.2.3
              }
            ],
            command: 'SELECT',
            rowCount: 4,
            oid: 0,
            fields: []
          };
        }

        return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] };
      };

      // Mock database
      (dedupePackagesServer as any).decorate('pg', {
        query: mockQuery,
        connect: async () => ({
          query: mockQuery,
          release: () => {}
        })
      } as any);

      await dedupePackagesServer.register(collectionRoutes, { prefix: '/api/v1/collections' });
      await dedupePackagesServer.ready();
    });

    afterAll(async () => {
      await dedupePackagesServer.close();
    });

    it('should return each package only once even when packages have multiple versions', async () => {
      // Use GET /:name_slug endpoint (not /:name_slug/:version)
      // This endpoint has the LATERAL JOIN fix that prevents duplicate packages
      const response = await dedupePackagesServer.inject({
        method: 'GET',
        url: '/api/v1/collections/multi-version-packages'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Should have exactly 4 packages, not 14 (which would be 4+3+4+3 if each version created a row)
      expect(body.packages).toHaveLength(4);

      // Verify no duplicate packageIds (response uses camelCase)
      const packageIds = body.packages.map((p: any) => p.packageId);
      const uniqueIds = [...new Set(packageIds)];
      expect(packageIds.length).toBe(uniqueIds.length);
    });

    it('should return the latest version info for each package', async () => {
      const response = await dedupePackagesServer.inject({
        method: 'GET',
        url: '/api/v1/collections/multi-version-packages'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Check each package has the correct packageId (package name)
      // Response maps package_name -> packageId in camelCase
      const typescriptPkg = body.packages.find((p: any) => p.packageId === '@test/typescript-rules');
      expect(typescriptPkg).toBeDefined();
      expect(typescriptPkg.package.name).toBe('@test/typescript-rules');

      const reactPkg = body.packages.find((p: any) => p.packageId === '@test/react-patterns');
      expect(reactPkg).toBeDefined();
      expect(reactPkg.package.name).toBe('@test/react-patterns');

      const testingPkg = body.packages.find((p: any) => p.packageId === '@test/testing-utils');
      expect(testingPkg).toBeDefined();
      expect(testingPkg.package.name).toBe('@test/testing-utils');

      const prettierPkg = body.packages.find((p: any) => p.packageId === '@test/prettier-config');
      expect(prettierPkg).toBeDefined();
      expect(prettierPkg.package.name).toBe('@test/prettier-config');
    });

    it('should preserve package metadata correctly after deduplication', async () => {
      const response = await dedupePackagesServer.inject({
        method: 'GET',
        url: '/api/v1/collections/multi-version-packages'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Verify required/optional flags are preserved
      const requiredPackages = body.packages.filter((p: any) => p.required === true);
      const optionalPackages = body.packages.filter((p: any) => p.required === false);

      expect(requiredPackages).toHaveLength(3);
      expect(optionalPackages).toHaveLength(1);

      // Verify installOrder is preserved (camelCase in response)
      const orders = body.packages.map((p: any) => p.installOrder).sort((a: number, b: number) => a - b);
      expect(orders).toEqual([1, 2, 3, 4]);

      // Verify package subtypes are preserved
      const subtypes = body.packages.map((p: any) => p.package.subtype);
      expect(subtypes).toContain('rule');
      expect(subtypes).toContain('skill');
      expect(subtypes).toContain('agent');
    });
  });

  describe('Collection Install - Always Resolves to Latest Version', () => {
    let installServer: FastifyInstance;

    beforeAll(async () => {
      installServer = Fastify();

      // Mock authenticate decorator
      installServer.decorate('authenticate', async () => {});

      // Mock Redis
      (installServer as any).decorate('redis', {
        get: async () => null,
        set: async () => 'OK',
        del: async () => 1,
      });

      // Mock query function that simulates:
      // - Collection with packages that have various stored versions
      // - The subquery ALWAYS returns the latest version from package_versions
      // - Even if a specific version was stored, we resolve to latest
      const mockQuery = async (sql: string, params?: unknown[]) => {
        // Mock collection lookup
        if (sql.includes('SELECT * FROM collections') && sql.includes('name_slug = $1')) {
          if (params?.[0] === 'test-collection') {
            return {
              rows: [{
                id: 'collection-uuid',
                name_slug: 'test-collection',
                name: 'Test Collection',
                description: 'A test collection',
                version: '1.0.0',
                official: true,
                verified: true,
                downloads: 100,
              }],
              command: 'SELECT',
              rowCount: 1,
              oid: 0,
              fields: []
            };
          }
        }

        // Mock collection packages query - the subquery ALWAYS runs now
        // Regardless of what's stored in package_version, we resolve to latest
        if (sql.includes('SELECT cp.*, p.name as package_name') &&
            sql.includes('SELECT pv.version') &&
            sql.includes('FROM package_versions pv')) {
          return {
            rows: [
              {
                package_id: 'pkg-uuid-1',
                package_name: '@test/package-a',
                package_version: '1.0.0',    // Stored as specific old version
                resolved_version: '2.0.0',   // Latest version from subquery
                required: true,
                format_override: null,
              },
              {
                package_id: 'pkg-uuid-2',
                package_name: '@test/package-b',
                package_version: 'latest',   // Stored as "latest"
                resolved_version: '3.0.0',   // Latest version from subquery
                required: false,
                format_override: null,
              },
              {
                package_id: 'pkg-uuid-3',
                package_name: '@test/package-c',
                package_version: null,       // Stored as NULL
                resolved_version: '4.0.0',   // Latest version from subquery
                required: true,
                format_override: null,
              },
            ],
            command: 'SELECT',
            rowCount: 3,
            oid: 0,
            fields: []
          };
        }

        // Mock collection_installs INSERT (tracking)
        if (sql.includes('INSERT INTO collection_installs')) {
          return {
            rows: [],
            command: 'INSERT',
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
      (installServer as any).decorate('pg', {
        query: mockQuery,
        connect: async () => ({
          query: mockQuery,
          release: () => {}
        })
      } as any);

      await installServer.register(collectionRoutes, { prefix: '/api/v1/collections' });
      await installServer.ready();
    });

    afterAll(async () => {
      await installServer.close();
    });

    it('should always resolve to latest version regardless of stored package_version', async () => {
      const response = await installServer.inject({
        method: 'POST',
        url: '/api/v1/collections/test-collection/install',
        payload: {
          format: 'cursor',
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Verify packagesToInstall contains the resolved latest versions
      expect(body.packagesToInstall).toHaveLength(3);

      // Package A: stored as "1.0.0" (old pinned version), resolved to latest 2.0.0
      const packageA = body.packagesToInstall.find((p: any) => p.packageId === '@test/package-a');
      expect(packageA).toBeDefined();
      expect(packageA.version).toBe('2.0.0');

      // Package B: stored as "latest", resolved to 3.0.0
      const packageB = body.packagesToInstall.find((p: any) => p.packageId === '@test/package-b');
      expect(packageB).toBeDefined();
      expect(packageB.version).toBe('3.0.0');

      // Package C: stored as NULL, resolved to 4.0.0
      const packageC = body.packagesToInstall.find((p: any) => p.packageId === '@test/package-c');
      expect(packageC).toBeDefined();
      expect(packageC.version).toBe('4.0.0');
    });

    it('should use resolved_version (latest) instead of stored package_version', async () => {
      const response = await installServer.inject({
        method: 'POST',
        url: '/api/v1/collections/test-collection/install',
        payload: {}
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // The version should come from resolved_version (subquery result),
      // NOT from package_version (which could be old/pinned/latest/NULL)
      body.packagesToInstall.forEach((pkg: any) => {
        // Version should be a real semver, not 'latest' or undefined
        expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
      });
    });
  });
});
