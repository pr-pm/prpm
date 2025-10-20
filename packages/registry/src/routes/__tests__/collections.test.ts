/**
 * Collections routes tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

    // TODO: Fix version parameter test - needs proper mock handling
    it.skip('should support version parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/collections/collection/test-collection?version=1.0.0'
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
