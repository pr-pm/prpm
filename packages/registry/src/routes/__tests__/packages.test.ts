/**
 * Package routes tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { packageRoutes } from '../packages';

describe('Package Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();

    // Mock authenticate decorator
    server.decorate('authenticate', async () => {});

    // Create mock query function
    const mockQuery = async (sql: string, params?: unknown[]) => {
      // Mock package by name query (used by GET /packages/:packageName)
      if (sql.includes('SELECT * FROM packages WHERE name = $1')) {
        if (params?.[0] === 'test-package') {
          return {
            rows: [{
              id: 'test-package-uuid',
              name: 'test-package',
              description: 'A test package',
              author: 'test-author',
              downloads: 100,
              stars: 10,
              type: 'agent',
              category: 'development',
              visibility: 'public',
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

      // Mock package by ID query (UUID)
      if (sql.includes('SELECT * FROM packages WHERE id = $1')) {
        if (params?.[0] === 'test-package-uuid') {
          return {
            rows: [{
              id: 'test-package-uuid',
              name: 'test-package',
              description: 'A test package',
              author: 'test-author',
              downloads: 100,
              stars: 10,
              type: 'agent',
              category: 'development',
              visibility: 'public',
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

      // Mock package versions query
      if (sql.includes('SELECT * FROM package_versions')) {
        return {
          rows: [
            { version: '1.0.0', created_at: new Date() }
          ],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
      }

      // Mock COUNT query
      if (sql.includes('COUNT(*) as count FROM packages')) {
        return {
          rows: [{ count: '2' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
      }

      // Mock packages list query
      if (sql.includes('SELECT * FROM packages') && sql.includes('ORDER BY')) {
        return {
          rows: [
            {
              id: 'pkg1',
              name: 'Package 1',
              description: 'First package',
              author: 'author1',
              type: 'agent',
              downloads: 100,
              stars: 10,
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              id: 'pkg2',
              name: 'Package 2',
              description: 'Second package',
              author: 'author2',
              type: 'rule',
              downloads: 50,
              stars: 5,
              visibility: 'public',
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

    // Mock cache functions (used by package routes)
    const mockCache = {
      get: async () => null,
      set: async () => {}
    };

    // Mock database with connect() method
    (server as any).decorate('pg', {
      query: mockQuery,
      connect: async () => ({
        query: mockQuery,
        release: () => {}
      })
    } as any);

    await server.register(packageRoutes, { prefix: '/api/v1/packages' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/v1/packages/:id', () => {
    it('should return package details', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/test-package'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('test-package-uuid');
      expect(body.name).toBe('test-package');
      expect(body.description).toBe('A test package');
    });

    it('should return 404 for non-existent package', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/does-not-exist'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/packages', () => {
    it('should list packages with pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages?limit=10&offset=0'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.total).toBeDefined();
    });

    it('should filter by type', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages?type=cursor'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should filter by tags', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages?tags=typescript&tags=nodejs'
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/v1/packages - Author Scoping', () => {
    // These tests verify automatic author-scoping for package names
    // Skip these tests for now as they require full auth and S3 mocking
    it.skip('should auto-prefix unscoped package name with @username/', async () => {
      // Test that publishing "my-package" becomes "@testuser/my-package"
    });

    it.skip('should preserve existing @author/ scope', async () => {
      // Test that "@testuser/my-package" stays "@testuser/my-package"
    });

    it.skip('should use organization scope when organization is specified', async () => {
      // Test that with organization: "myorg", "my-package" becomes "@myorg/my-package"
    });

    it.skip('should prevent publishing to other authors scope', async () => {
      // Test that user "alice" cannot publish "@bob/package"
    });
  });

  describe('POST /api/v1/packages/:packageId/star', () => {
    let starredPackages: Set<string>;

    beforeEach(() => {
      starredPackages = new Set();

      // Update mock to handle star queries
      const originalMockQuery = (server as any).pg.query;
      (server as any).pg.query = async (sql: string, params?: unknown[]) => {
        // Package existence check
        if (sql.includes('SELECT id, visibility FROM packages WHERE id = $1')) {
          const packageId = params?.[0] as string;
          if (packageId === 'test-package-uuid') {
            return { rows: [{ id: packageId, visibility: 'public' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
          }
          return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] };
        }

        // Star insert
        if (sql.includes('INSERT INTO package_stars')) {
          const packageId = params?.[0] as string;
          starredPackages.add(packageId);
          return { rows: [], command: 'INSERT', rowCount: 1, oid: 0, fields: [] };
        }

        // Star delete
        if (sql.includes('DELETE FROM package_stars')) {
          const packageId = params?.[0] as string;
          starredPackages.delete(packageId);
          return { rows: [], command: 'DELETE', rowCount: 1, oid: 0, fields: [] };
        }

        // Get updated star count
        if (sql.includes('SELECT stars FROM packages WHERE id = $1')) {
          const packageId = params?.[0] as string;
          const count = packageId === 'test-package-uuid' ? (starredPackages.has(packageId) ? 11 : 10) : 0;
          return { rows: [{ stars: count }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }

        return originalMockQuery(sql, params);
      };

      // Mock user authentication
      (server as any).decorate('authenticate', async (request: any) => {
        request.user = { user_id: 'test-user-id', username: 'test-user' };
      }, { decorateRequest: true });
    });

    it('should star a package', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/packages/test-package-uuid/star',
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
      expect(body.stars).toBe(11);
    });

    it('should unstar a package', async () => {
      // First star it
      starredPackages.add('test-package-uuid');

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/packages/test-package-uuid/star',
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
      expect(body.stars).toBe(10);
    });

    it('should return 404 when starring non-existent package', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/packages/non-existent-uuid/star',
        headers: {
          authorization: 'Bearer test-token'
        },
        payload: {
          starred: true
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Package not found');
    });
  });

  describe('GET /api/v1/packages/starred', () => {
    beforeEach(() => {
      // Mock starred packages query
      const originalMockQuery = (server as any).pg.query;
      (server as any).pg.query = async (sql: string, params?: unknown[]) => {
        if (sql.includes('FROM package_stars ps') && sql.includes('JOIN packages p')) {
          return {
            rows: [
              {
                id: 'starred-pkg-1',
                name: 'starred-package-1',
                description: 'First starred package',
                author: 'author1',
                stars: 15,
                total_downloads: 200,
                format: 'cursor',
                starred_at: new Date()
              },
              {
                id: 'starred-pkg-2',
                name: 'starred-package-2',
                description: 'Second starred package',
                author: 'author2',
                stars: 20,
                total_downloads: 300,
                format: 'claude',
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

    it('should return starred packages', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/starred',
        headers: {
          authorization: 'Bearer test-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.packages.length).toBe(2);
      expect(body.packages[0].name).toBe('starred-package-1');
      expect(body.total).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/starred?limit=10&offset=0',
        headers: {
          authorization: 'Bearer test-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.packages).toBeDefined();
    });
  });
});
