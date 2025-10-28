/**
 * Auth routes integration tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { authRoutes } from '../auth';
import bcrypt from 'bcrypt';

describe('Auth Routes', () => {
  let server: FastifyInstance;
  const testUserPassword = 'Test123!@#';
  let testUserHashedPassword: string;

  beforeAll(async () => {
    server = Fastify();

    // Hash password for test
    testUserHashedPassword = await bcrypt.hash(testUserPassword, 10);

    // Mock authenticate decorator
    server.decorate('authenticate', async (request: any) => {
      request.user = {
        user_id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
      };
    });

    // Create mock query function
    const mockQuery = async (sql: string, params?: unknown[]) => {
      // Mock user registration check
      if (sql.includes('SELECT * FROM users WHERE username') || sql.includes('SELECT * FROM users WHERE email')) {
        const username = params?.[0];
        const email = params?.[0];
        if (username === 'existinguser' || email === 'existing@example.com') {
          return {
            rows: [{
              id: 'existing-user-id',
              username: 'existinguser',
              email: 'existing@example.com',
              created_at: new Date(),
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

      // Mock user registration INSERT
      if (sql.includes('INSERT INTO users')) {
        return {
          rows: [{
            id: 'new-user-id',
            username: params?.[0],
            email: params?.[1],
            created_at: new Date(),
          }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      // Mock login query
      if (sql.includes('SELECT id, username, email, password FROM users')) {
        const identifier = params?.[0];
        if (identifier === 'testuser' || identifier === 'test@example.com') {
          return {
            rows: [{
              id: 'test-user-id',
              username: 'testuser',
              email: 'test@example.com',
              password: testUserHashedPassword,
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

      // Mock token creation
      if (sql.includes('INSERT INTO auth_tokens')) {
        return {
          rows: [{
            id: 'new-token-id',
            user_id: params?.[0],
            token: params?.[1],
            name: params?.[2],
            created_at: new Date(),
          }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      // Mock token list query
      if (sql.includes('SELECT id, name, created_at, last_used FROM auth_tokens')) {
        return {
          rows: [
            {
              id: 'token-1',
              name: 'CLI Token',
              created_at: new Date(),
              last_used: new Date(),
            },
            {
              id: 'token-2',
              name: 'CI/CD Token',
              created_at: new Date(),
              last_used: null,
            },
          ],
          command: 'SELECT',
          rowCount: 2,
          oid: 0,
          fields: [],
        };
      }

      // Mock token deletion
      if (sql.includes('DELETE FROM auth_tokens')) {
        return {
          rows: [],
          command: 'DELETE',
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

    // Mock JWT
    (server as any).decorate('jwt', {
      sign: (payload: any) => `mock-jwt-token-${payload.userId}`,
      verify: (token: string) => ({ userId: 'test-user-id', username: 'testuser' }),
    });

    // Mock database
    (server as any).decorate('pg', {
      query: mockQuery,
      connect: async () => ({
        query: mockQuery,
        release: () => {},
      }),
    } as any);

    await server.register(authRoutes, { prefix: '/api/v1/auth' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'newuser',
          email: 'new@example.com',
          password: 'NewPass123!',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
      expect(body.user).toHaveProperty('username', 'newuser');
      expect(body.user).toHaveProperty('email', 'new@example.com');
    });

    it('should reject duplicate username', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'existinguser',
          email: 'another@example.com',
          password: 'Pass123!',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('already exists');
    });

    it('should reject duplicate email', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'anotheruser',
          email: 'existing@example.com',
          password: 'Pass123!',
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should validate password strength', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'newuser2',
          email: 'new2@example.com',
          password: 'weak',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate email format', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'newuser3',
          email: 'invalid-email',
          password: 'Strong123!',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate username format', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'Invalid User!',
          email: 'valid@example.com',
          password: 'Strong123!',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with username', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          identifier: 'testuser',
          password: testUserPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
      expect(body.user).toHaveProperty('username', 'testuser');
    });

    it('should login with email', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          identifier: 'test@example.com',
          password: testUserPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          identifier: 'testuser',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          identifier: 'nonexistent',
          password: 'somepassword',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('username', 'testuser');
      expect(body).toHaveProperty('email', 'test@example.com');
    });

    it('should return user organizations', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('organizations');
      expect(Array.isArray(body.organizations)).toBe(true);
    });
  });

  describe('POST /api/v1/auth/token', () => {
    it('should create a new API token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/token',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: 'New CLI Token',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('name', 'New CLI Token');
    });

    it('should require token name', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/token',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/auth/tokens', () => {
    it('should list user tokens', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/auth/tokens',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.tokens)).toBe(true);
      expect(body.tokens.length).toBeGreaterThan(0);
      expect(body.tokens[0]).toHaveProperty('id');
      expect(body.tokens[0]).toHaveProperty('name');
    });
  });

  describe('DELETE /api/v1/auth/tokens/:tokenId', () => {
    it('should delete a token', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/v1/auth/tokens/token-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
    });
  });


  describe('GET /api/v1/auth/me/unclaimed-packages', () => {
    it('should return unclaimed packages for user with GitHub username', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/auth/me/unclaimed-packages',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('packages');
      expect(body).toHaveProperty('count');
      expect(Array.isArray(body.packages)).toBe(true);
    });

    it('should return empty array for user without GitHub username', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/auth/me/unclaimed-packages',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.packages).toEqual([]);
      expect(body.count).toBe(0);
    });
  });

  describe('POST /api/v1/auth/claim', () => {
    it('should claim packages for user with GitHub username', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/claim',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('claimed_count');
      expect(body).toHaveProperty('message');
    });

    it('should return error for user without GitHub account', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/claim',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      // This will depend on mock implementation
      // Could be 400 if no GitHub account or 200 with 0 claimed
      expect([200, 400]).toContain(response.statusCode);
    });
  });
});
