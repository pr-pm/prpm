/**
 * Invite Routes Tests
 * Tests for author invite API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { inviteRoutes } from '../invites.js';

describe('Invite Routes', () => {
  let server: FastifyInstance;
  let mockPgClient: any;
  let mockPgPool: any;

  beforeEach(async () => {
    server = Fastify({ logger: false });

    // Mock PostgreSQL client
    mockPgClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    // Mock PostgreSQL pool
    mockPgPool = {
      query: vi.fn(),
      connect: vi.fn().mockResolvedValue(mockPgClient),
    };

    // Register mock pg plugin
    server.decorate('pg', mockPgPool);

    // Mock authenticate decorator
    server.decorate('authenticate', async (request: any, reply: any) => {
      if (!request.headers.authorization) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      // Mock user object
      request.user = { user_id: 'test-user-123' };
    });

    // Register routes
    await server.register(inviteRoutes, { prefix: '/api/v1/invites' });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('GET /api/v1/invites/:token', () => {
    it.skip('should return invite details for valid pending invite', async () => {
      const mockInvite = {
        id: 'inv-123',
        author_username: 'testauthor',
        package_count: 10,
        invite_message: 'Welcome to PRPM!',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockInvite],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites/a'.repeat(64), // 64-char token
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.invite).toMatchObject({
        id: 'inv-123',
        author_username: 'testauthor',
        package_count: 10,
        status: 'pending',
      });
    });

    it('should return 404 for non-existent invite', async () => {
      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites/' + 'a'.repeat(64),
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invite not found');
    });

    it('should return 410 for expired invite and update status', async () => {
      const mockInvite = {
        id: 'inv-expired',
        author_username: 'testauthor',
        package_count: 5,
        status: 'pending',
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Expired
        created_at: new Date().toISOString(),
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockInvite],
      });

      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites/' + 'b'.repeat(64),
      });

      expect(response.statusCode).toBe(410);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invite expired');

      // Verify status was updated
      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE author_invites SET status = 'expired'"),
        expect.any(Array)
      );
    });

    it('should return 410 for already claimed invite', async () => {
      const mockInvite = {
        id: 'inv-claimed',
        status: 'claimed',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockInvite],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites/' + 'c'.repeat(64),
      });

      expect(response.statusCode).toBe(410);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invite already claimed');
    });

    it('should return 403 for revoked invite', async () => {
      const mockInvite = {
        id: 'inv-revoked',
        status: 'revoked',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockInvite],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites/' + 'd'.repeat(64),
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invite revoked');
    });
  });

  describe('POST /api/v1/invites/:token/claim', () => {
    it('should successfully claim invite for authenticated user', async () => {
      const mockInvite = {
        id: 'inv-123',
        author_username: 'claimauthor',
        package_count: 15,
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUser = {
        id: 'test-user-123',
        username: 'testuser',
        claimed_author_username: 'claimauthor',
        verified_author: true,
        email: 'test@example.com',
        github_username: 'testgithub',
      };

      // Mock transaction queries
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockPgClient.query.mockResolvedValueOnce({ rows: [mockInvite] }); // Fetch invite
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // Check existing claim
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // Update user
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // Update invite
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // Create author_claims
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // Update packages
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Mock user fetch after transaction
      mockPgPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites/' + 'e'.repeat(64) + '/claim',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          github_username: 'testgithub',
          email: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.user.claimed_author_username).toBe('claimauthor');
      expect(body.user.verified_author).toBe(true);
      expect(body.user.package_count).toBe(15);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites/' + 'f'.repeat(64) + '/claim',
        payload: {
          github_username: 'test',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent invite', async () => {
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // Fetch invite - empty
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites/' + 'g'.repeat(64) + '/claim',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invite not found');
    });

    it('should return 400 for already claimed invite', async () => {
      const mockInvite = {
        id: 'inv-claimed',
        status: 'claimed',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockPgClient.query.mockResolvedValueOnce({ rows: [mockInvite] }); // Fetch invite
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites/' + 'h'.repeat(64) + '/claim',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid invite');
    });

    it('should return 410 for expired invite', async () => {
      const mockInvite = {
        id: 'inv-expired',
        status: 'pending',
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Expired
      };

      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockPgClient.query.mockResolvedValueOnce({ rows: [mockInvite] }); // Fetch invite
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites/' + 'i'.repeat(64) + '/claim',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(410);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invite expired');
    });

    it('should return 409 if username already claimed by different user', async () => {
      const mockInvite = {
        id: 'inv-123',
        author_username: 'claimauthor',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const existingClaim = {
        id: 'different-user-id',
      };

      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockPgClient.query.mockResolvedValueOnce({ rows: [mockInvite] }); // Fetch invite
      mockPgClient.query.mockResolvedValueOnce({ rows: [existingClaim] }); // Check existing claim
      mockPgClient.query.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites/' + 'j'.repeat(64) + '/claim',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Username already claimed');
    });
  });

  describe('GET /api/v1/invites/stats', () => {
    it('should return invite statistics for authenticated user', async () => {
      const mockStats = {
        total_invites: '25',
        pending: '10',
        claimed: '12',
        expired: '2',
        revoked: '1',
        total_packages: '250',
        claimed_packages: '180',
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockStats],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites/stats',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        total_invites: 25,
        pending: 10,
        claimed: 12,
        expired: 2,
        revoked: 1,
        total_packages: 250,
        claimed_packages: 180,
      });
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites/stats',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle null package counts', async () => {
      const mockStats = {
        total_invites: '5',
        pending: '5',
        claimed: '0',
        expired: '0',
        revoked: '0',
        total_packages: null,
        claimed_packages: null,
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockStats],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites/stats',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.total_packages).toBe(0);
      expect(body.claimed_packages).toBe(0);
    });
  });

  describe('POST /api/v1/invites (admin create)', () => {
    it('should create new invite for authenticated user', async () => {
      const mockInvite = {
        id: 'inv-new-123',
        token: 'a'.repeat(64),
        author_username: 'newauthor',
        package_count: 20,
        invite_message: 'Welcome aboard!',
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockInvite],
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          author_username: 'newauthor',
          package_count: 20,
          invite_message: 'Welcome aboard!',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.invite.author_username).toBe('newauthor');
      expect(body.invite.package_count).toBe(20);
      expect(body.invite.token).toBeDefined();
      expect(body.invite.invite_url).toContain('/claim/');
    });

    it('should use custom expiration days', async () => {
      const mockInvite = {
        id: 'inv-custom',
        token: 'b'.repeat(64),
        author_username: 'testauthor',
        package_count: 5,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockInvite],
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          author_username: 'testauthor',
          package_count: 5,
          expires_in_days: 7,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.invite.expires_at).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites',
        payload: {
          author_username: 'test',
          package_count: 1,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/invites',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          author_username: 'test',
          // Missing package_count
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/invites (admin list)', () => {
    it('should list all invites for authenticated user', async () => {
      const mockInvites = [
        {
          id: 'inv-1',
          author_username: 'author1',
          package_count: 10,
          status: 'pending',
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 'inv-2',
          author_username: 'author2',
          package_count: 5,
          status: 'claimed',
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          claimed_at: new Date().toISOString(),
          claimed_by: 'user-123',
        },
      ];

      mockPgPool.query.mockResolvedValueOnce({
        rows: mockInvites,
      });

      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ total: '2' }],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.invites).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.limit).toBe(50);
      expect(body.offset).toBe(0);
    });

    it('should filter by status', async () => {
      mockPgPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-1',
            author_username: 'author1',
            package_count: 10,
            status: 'pending',
            expires_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ],
      });

      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ total: '1' }],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites?status=pending',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.invites).toHaveLength(1);
      expect(body.invites[0].status).toBe('pending');
    });

    it('should support pagination', async () => {
      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      });

      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ total: '100' }],
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites?limit=10&offset=20',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.limit).toBe(10);
      expect(body.offset).toBe(20);
      expect(body.total).toBe(100);
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/invites',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/v1/invites/:token (admin revoke)', () => {
    it('should revoke pending invite', async () => {
      const mockInvite = {
        id: 'inv-revoke',
        author_username: 'revokeauthor',
      };

      mockPgPool.query.mockResolvedValueOnce({
        rows: [mockInvite],
      });

      const response = await server.inject({
        method: 'DELETE',
        url: '/api/v1/invites/' + 'r'.repeat(64),
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('revokeauthor');
      expect(body.message).toContain('revoked');
    });

    it('should return 404 for non-existent or already claimed invite', async () => {
      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      });

      const response = await server.inject({
        method: 'DELETE',
        url: '/api/v1/invites/' + 's'.repeat(64),
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invite not found');
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/v1/invites/' + 't'.repeat(64),
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
