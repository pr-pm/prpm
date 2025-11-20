/**
 * Tests for session security middleware
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { createSessionSecurityMiddleware } from '../session-security';
import { SessionManager } from '../../services/session-manager';

// Mock SessionManager
vi.mock('../../services/session-manager');

describe('Session Security Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockSessionManager: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      user: { user_id: 'user-123' } as any,
      headers: {
        'user-agent': 'Mozilla/5.0 Chrome/120.0.0.0',
        'accept-language': 'en-US',
      } as any,
      ip: '192.168.1.100',
      server: {
        log: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        redis: {},
      } as any,
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
    };

    mockSessionManager = {
      createSession: vi.fn(),
      validateSession: vi.fn(),
    };

    (SessionManager as any).mockImplementation(() => mockSessionManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('No authentication', () => {
    it('should skip session security if no user', async () => {
      mockRequest.user = undefined;

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockSessionManager.createSession).not.toHaveBeenCalled();
      expect(mockSessionManager.validateSession).not.toHaveBeenCalled();
    });
  });

  describe('No session token', () => {
    it('should create new session when no token provided', async () => {
      const newSession = {
        sessionToken: 'new-token-123',
        userId: 'user-123',
        fingerprint: 'fp-hash',
        createdAt: Date.now(),
        lastRequestAt: 0,
        requestCount: 0,
        expiresAt: Date.now() + 30 * 60 * 1000,
      };

      mockSessionManager.createSession.mockResolvedValue(newSession);

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockSessionManager.createSession).toHaveBeenCalledWith(
        'user-123',
        mockRequest
      );

      expect(mockReply.header).toHaveBeenCalledWith(
        'X-Playground-Session',
        'new-token-123'
      );
      expect(mockReply.header).toHaveBeenCalledWith(
        'X-Playground-Session-Expires',
        newSession.expiresAt.toString()
      );
    });

    it('should handle session creation errors', async () => {
      mockSessionManager.createSession.mockRejectedValue(
        new Error('Redis connection failed')
      );

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'session_creation_failed',
        })
      );
    });
  });

  describe('Existing session token', () => {
    beforeEach(() => {
      mockRequest.headers = {
        ...mockRequest.headers,
        'x-playground-session': 'existing-token-456',
      } as any;
    });

    it('should validate existing session successfully', async () => {
      const session = {
        sessionToken: 'existing-token-456',
        userId: 'user-123',
        fingerprint: 'fp-hash',
        createdAt: Date.now(),
        lastRequestAt: Date.now() - 60000,
        requestCount: 5,
        expiresAt: Date.now() + 30 * 60 * 1000,
      };

      mockSessionManager.validateSession.mockResolvedValue({
        valid: true,
        session,
      });

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockSessionManager.validateSession).toHaveBeenCalledWith(
        'existing-token-456',
        mockRequest
      );

      expect(mockReply.header).toHaveBeenCalledWith(
        'X-Playground-Session',
        'existing-token-456'
      );
      expect(mockReply.header).toHaveBeenCalledWith(
        'X-Session-Request-Count',
        '5'
      );
    });

    it('should reject rate limited sessions', async () => {
      mockSessionManager.validateSession.mockResolvedValue({
        valid: false,
        error: 'rate_limited',
        message: 'Please wait 25 seconds',
        retryAfter: 25,
      });

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(429);
      expect(mockReply.header).toHaveBeenCalledWith('Retry-After', 25);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'session_rate_limit_exceeded',
          retryAfter: 25,
        })
      );
    });

    it('should reject fingerprint mismatches', async () => {
      mockSessionManager.validateSession.mockResolvedValue({
        valid: false,
        error: 'fingerprint_mismatch',
        message: 'Session validation failed',
      });

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'session_validation_failed',
        })
      );
    });

    it('should reject expired sessions', async () => {
      mockSessionManager.validateSession.mockResolvedValue({
        valid: false,
        error: 'expired',
        message: 'Session expired',
      });

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'session_expired',
        })
      );
    });

    it('should reject invalid tokens', async () => {
      mockSessionManager.validateSession.mockResolvedValue({
        valid: false,
        error: 'invalid_token',
        message: 'Invalid token format',
      });

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'invalid_session_token',
        })
      );
    });

    it('should fail open on validation errors', async () => {
      mockSessionManager.validateSession.mockRejectedValue(
        new Error('Redis connection failed')
      );

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Should not call reply.code or reply.send (fail open)
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });

  describe('Security logging', () => {
    it('should log session validation failures', async () => {
      mockRequest.headers = {
        ...mockRequest.headers,
        'x-playground-session': 'invalid-token',
      } as any;

      mockSessionManager.validateSession.mockResolvedValue({
        valid: false,
        error: 'fingerprint_mismatch',
        message: 'Fingerprint mismatch',
      });

      const middleware = createSessionSecurityMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.server?.log.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          error: 'fingerprint_mismatch',
        }),
        'Session validation failed'
      );
    });
  });
});
