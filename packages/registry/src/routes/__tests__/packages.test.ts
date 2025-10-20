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
      // Mock package by ID query
      if (sql.includes('SELECT * FROM packages WHERE id = $1')) {
        if (params?.[0] === 'test-package') {
          return {
            rows: [{
              id: 'test-package',
              name: 'Test Package',
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
    server.decorate('pg', {
      query: mockQuery,
      connect: async () => ({
        query: mockQuery,
        release: () => {}
      })
    } as unknown);

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
      expect(body.id).toBe('test-package');
      expect(body.name).toBe('Test Package');
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
});
