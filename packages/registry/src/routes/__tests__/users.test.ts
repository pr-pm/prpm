/**
 * User routes integration tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { userRoutes } from '../users';

describe('User Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();

    // Mock authenticate decorator
    server.decorate('authenticate', async () => {});

    // Create mock query function
    const mockQuery = async (sql: string, params?: unknown[]) => {
      // Mock user query
      if (sql.includes('SELECT * FROM users WHERE username')) {
        const username = params?.[0];
        if (username === 'testuser') {
          return {
            rows: [{
              id: 'test-user-id',
              username: 'testuser',
              email: 'test@example.com',
              bio: 'Test user bio',
              website: 'https://example.com',
              github_username: 'testuser',
              verified: true,
              created_at: new Date('2024-01-01'),
              updated_at: new Date(),
            }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          };
        }
        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: [],
        };
      }

      // Mock user packages query
      if (sql.includes('SELECT * FROM packages WHERE author')) {
        return {
          rows: [
            {
              id: 'pkg-1',
              name: 'user-package-1',
              description: 'First user package',
              author: 'testuser',
              type: 'cursor',
              tags: ['test'],
              downloads: 100,
              stars: 10,
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date(),
            },
            {
              id: 'pkg-2',
              name: 'user-package-2',
              description: 'Second user package',
              author: 'testuser',
              type: 'claude',
              tags: ['test', 'ai'],
              downloads: 50,
              stars: 5,
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          command: 'SELECT',
          rowCount: 2,
          oid: 0,
          fields: [],
        };
      }

      // Mock COUNT query
      if (sql.includes('COUNT(*) as count')) {
        return {
          rows: [{ count: '2' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      return {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      };
    };

    // Mock database
    (server as any).decorate('pg', {
      query: mockQuery,
      connect: async () => ({
        query: mockQuery,
        release: () => {},
      }),
    } as any);

    await server.register(userRoutes, { prefix: '/api/v1/users' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/v1/users/:username', () => {
    it('should return user profile', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users/testuser',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('username', 'testuser');
      expect(body).toHaveProperty('email', 'test@example.com');
      expect(body).toHaveProperty('bio', 'Test user bio');
      expect(body).toHaveProperty('website', 'https://example.com');
      expect(body).toHaveProperty('verified', true);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users/nonexistent',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should not expose sensitive fields', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users/testuser',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('password');
    });
  });

  describe('GET /api/v1/users/:username/packages', () => {
    it('should return user packages', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users/testuser/packages',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.packages.length).toBe(2);
      expect(body.packages[0]).toHaveProperty('name');
      expect(body.packages[0]).toHaveProperty('description');
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users/testuser/packages?limit=10&offset=0',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('page');
    });

    it('should filter by type', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users/testuser/packages?type=cursor',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should filter by visibility', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users/testuser/packages?visibility=public',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should support sorting', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users/testuser/packages?sortBy=downloads',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
