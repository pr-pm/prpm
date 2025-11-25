/**
 * Tests for anonymous restriction middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { createAnonymousRestrictionMiddleware, recordAnonymousUsageHook } from '../anonymous-restriction';

describe('Anonymous Restriction Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServer = {
      pg: {
        query: vi.fn(),
      },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    mockRequest = {
      user: undefined, // Anonymous by default
      headers: {
        'user-agent': 'Mozilla/5.0 Chrome/120.0.0.0',
        'accept-language': 'en-US',
        'accept-encoding': 'gzip',
      } as any,
      ip: '192.168.1.100',
      server: mockServer,
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('Authenticated users', () => {
    it('should skip restrictions for authenticated users', async () => {
      mockRequest.user = { user_id: 'user-123' } as any;

      const middleware = createAnonymousRestrictionMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockServer.pg.query).not.toHaveBeenCalled();
      expect(mockReply.code).not.toHaveBeenCalled();
    });
  });

  describe('Anonymous users', () => {
    it('should allow first playground run', async () => {
      // Mock quota check - no usage yet
      mockServer.pg.query.mockResolvedValueOnce({
        rows: [{ has_quota: true, usage_count: 0, first_used_at: null }],
      });

      const middleware = createAnonymousRestrictionMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockServer.pg.query).toHaveBeenCalled();
      expect(mockReply.code).not.toHaveBeenCalled();
      expect((mockRequest as any).anonymousUsageTracking).toBeDefined();
    });

    it('should block second playground run in same month', async () => {
      // Mock quota check - already used once
      mockServer.pg.query.mockResolvedValueOnce({
        rows: [
          {
            has_quota: false,
            usage_count: 1,
            first_used_at: new Date('2025-11-01'),
          },
        ],
      });

      const middleware = createAnonymousRestrictionMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockServer.pg.query).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'anonymous_quota_exceeded',
          message: expect.stringContaining('already used your free playground run'),
        })
      );
    });

    it('should include call-to-action in quota exceeded response', async () => {
      mockServer.pg.query.mockResolvedValueOnce({
        rows: [{ has_quota: false, usage_count: 1, first_used_at: new Date() }],
      });

      const middleware = createAnonymousRestrictionMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          callToAction: expect.objectContaining({
            message: expect.stringContaining('Create a free account'),
            registrationUrl: '/register',
            benefits: expect.arrayContaining([
              expect.stringContaining('Unlimited'),
            ]),
          }),
        })
      );
    });

    it('should store usage tracking data for later recording', async () => {
      mockServer.pg.query.mockResolvedValueOnce({
        rows: [{ has_quota: true, usage_count: 0 }],
      });

      const middleware = createAnonymousRestrictionMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      const tracking = (mockRequest as any).anonymousUsageTracking;
      expect(tracking).toBeDefined();
      expect(tracking.fingerprintHash).toBeDefined();
      expect(tracking.ipAddress).toBe('192.168.1.100');
      expect(tracking.ipSubnet).toBe('192.168.1.0');
      expect(tracking.currentMonth).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should fail open on database errors', async () => {
      mockServer.pg.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const middleware = createAnonymousRestrictionMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Should allow request despite error
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockServer.log.error).toHaveBeenCalled();
    });

    it('should handle different IP addresses correctly', async () => {
      mockServer.pg.query.mockResolvedValueOnce({
        rows: [{ has_quota: true, usage_count: 0 }],
      });

      mockRequest.headers = {
        ...mockRequest.headers,
        'x-forwarded-for': '203.0.113.50',
      } as any;

      const middleware = createAnonymousRestrictionMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      const tracking = (mockRequest as any).anonymousUsageTracking;
      expect(tracking.ipAddress).toBe('203.0.113.50');
      expect(tracking.ipSubnet).toBe('203.0.113.0');
    });

    it('should handle IPv6 addresses', async () => {
      mockServer.pg.query.mockResolvedValueOnce({
        rows: [{ has_quota: true, usage_count: 0 }],
      });

      mockRequest.headers = {
        ...mockRequest.headers,
        'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      } as any;

      const middleware = createAnonymousRestrictionMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      const tracking = (mockRequest as any).anonymousUsageTracking;
      expect(tracking.ipSubnet).toMatch(/^2001:0db8:85a3:0000::/);
    });
  });

  describe('recordAnonymousUsageHook', () => {
    it('should skip recording for authenticated users', async () => {
      mockRequest.user = { user_id: 'user-123' } as any;
      mockReply.statusCode = 200;

      await recordAnonymousUsageHook(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockServer.pg.query).not.toHaveBeenCalled();
    });

    it('should skip recording on non-200 responses', async () => {
      mockReply.statusCode = 500;
      (mockRequest as any).anonymousUsageTracking = {
        fingerprintHash: 'hash123',
      };

      await recordAnonymousUsageHook(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockServer.pg.query).not.toHaveBeenCalled();
    });

    it('should skip recording if no tracking data', async () => {
      mockReply.statusCode = 200;
      (mockRequest as any).anonymousUsageTracking = undefined;

      await recordAnonymousUsageHook(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockServer.pg.query).not.toHaveBeenCalled();
    });

    it('should record usage asynchronously on success', async () => {
      mockReply.statusCode = 200;
      (mockRequest as any).anonymousUsageTracking = {
        fingerprintHash: 'hash123',
        ipAddress: '192.168.1.100',
        ipSubnet: '192.168.1.0',
        userAgent: 'Chrome/120|Windows',
        currentMonth: '2025-11',
      };
      (mockRequest as any).body = {
        package_id: 'pkg-123',
        model: 'sonnet',
      };

      mockServer.pg.query.mockResolvedValueOnce({
        rows: [{ success: true, usage_count: 1 }],
      });

      await recordAnonymousUsageHook(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockServer.pg.query).toHaveBeenCalledWith(
        expect.stringContaining('record_anonymous_playground_usage'),
        expect.arrayContaining([
          'hash123',
          '192.168.1.100',
          '192.168.1.0',
          'Chrome/120|Windows',
          '2025-11',
          'pkg-123',
          'sonnet',
        ])
      );
    });
  });

  describe('Fingerprinting consistency', () => {
    it('should generate same fingerprint for same request', async () => {
      mockServer.pg.query.mockResolvedValue({
        rows: [{ has_quota: true, usage_count: 0 }],
      });

      const middleware = createAnonymousRestrictionMiddleware();

      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
      const tracking1 = (mockRequest as any).anonymousUsageTracking;

      // Reset request but keep same headers
      (mockRequest as any).anonymousUsageTracking = undefined;

      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
      const tracking2 = (mockRequest as any).anonymousUsageTracking;

      expect(tracking1.fingerprintHash).toBe(tracking2.fingerprintHash);
    });

    it('should generate different fingerprints for different browsers', async () => {
      mockServer.pg.query.mockResolvedValue({
        rows: [{ has_quota: true, usage_count: 0 }],
      });

      const middleware = createAnonymousRestrictionMiddleware();

      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
      const tracking1 = (mockRequest as any).anonymousUsageTracking;

      // Change user agent
      mockRequest.headers = {
        ...mockRequest.headers,
        'user-agent': 'Mozilla/5.0 Firefox/115.0',
      } as any;
      (mockRequest as any).anonymousUsageTracking = undefined;

      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
      const tracking2 = (mockRequest as any).anonymousUsageTracking;

      expect(tracking1.fingerprintHash).not.toBe(tracking2.fingerprintHash);
    });
  });

  describe('Monthly reset', () => {
    it('should use current month in YYYY-MM format', async () => {
      mockServer.pg.query.mockResolvedValueOnce({
        rows: [{ has_quota: true, usage_count: 0 }],
      });

      const middleware = createAnonymousRestrictionMiddleware();
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      const tracking = (mockRequest as any).anonymousUsageTracking;
      expect(tracking.currentMonth).toMatch(/^\d{4}-\d{2}$/);

      const [year, month] = tracking.currentMonth.split('-');
      expect(parseInt(year)).toBeGreaterThan(2020);
      expect(parseInt(month)).toBeGreaterThanOrEqual(1);
      expect(parseInt(month)).toBeLessThanOrEqual(12);
    });
  });
});
