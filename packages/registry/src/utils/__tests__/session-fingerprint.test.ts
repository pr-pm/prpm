/**
 * Tests for session fingerprinting utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSessionFingerprint,
  validateFingerprint,
  generateSessionToken,
  parseSessionToken,
  isSessionTokenExpired,
} from '../session-fingerprint';

describe('Session Fingerprinting', () => {
  const mockRequest = {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
      'x-forwarded-for': '192.168.1.100',
    },
    ip: '10.0.0.1',
  };

  describe('generateSessionFingerprint', () => {
    it('should generate consistent fingerprint for same request', () => {
      const fp1 = generateSessionFingerprint(mockRequest as any);
      const fp2 = generateSessionFingerprint(mockRequest as any);

      expect(fp1.hash).toBe(fp2.hash);
      expect(fp1.hash).toHaveLength(32); // 128-bit hash as hex
    });

    it('should extract user agent components', () => {
      const fp = generateSessionFingerprint(mockRequest as any);

      expect(fp.components.userAgent).toContain('Chrome');
      expect(fp.components.userAgent).toContain('Windows');
    });

    it('should use IP subnet for privacy', () => {
      const fp = generateSessionFingerprint(mockRequest as any);

      // Should mask last octet
      expect(fp.components.ipSubnet).toBe('192.168.1.0');
      expect(fp.components.ipSubnet).not.toContain('100');
    });

    it('should handle IPv6 addresses', () => {
      const ipv6Request = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
      };

      const fp = generateSessionFingerprint(ipv6Request as any);

      // Should mask last 4 groups
      expect(fp.components.ipSubnet).toMatch(/^2001:0db8:85a3:0000::/);
    });

    it('should extract primary accept-language', () => {
      const fp = generateSessionFingerprint(mockRequest as any);

      expect(fp.components.acceptLanguage).toBe('en-US');
    });

    it('should normalize accept-encoding', () => {
      const fp = generateSessionFingerprint(mockRequest as any);

      expect(fp.components.acceptEncoding).toBeTruthy();
    });

    it('should produce different fingerprints for different browsers', () => {
      const firefoxRequest = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
        },
      };

      const chromeFp = generateSessionFingerprint(mockRequest as any);
      const firefoxFp = generateSessionFingerprint(firefoxRequest as any);

      expect(chromeFp.hash).not.toBe(firefoxFp.hash);
    });

    it('should produce different fingerprints for different IPs', () => {
      const differentIpRequest = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'x-forwarded-for': '203.0.113.1',
        },
      };

      const fp1 = generateSessionFingerprint(mockRequest as any);
      const fp2 = generateSessionFingerprint(differentIpRequest as any);

      expect(fp1.hash).not.toBe(fp2.hash);
    });

    it('should handle missing headers gracefully', () => {
      const minimalRequest = {
        headers: {},
        ip: 'unknown',
      };

      const fp = generateSessionFingerprint(minimalRequest as any);

      expect(fp.hash).toBeTruthy();
      expect(fp.components.userAgent).toBe('unknown');
      expect(fp.components.ipSubnet).toBe('unknown');
    });
  });

  describe('validateFingerprint', () => {
    it('should validate matching fingerprints', () => {
      const fp = generateSessionFingerprint(mockRequest as any);
      const isValid = validateFingerprint(mockRequest as any, fp.hash);

      expect(isValid).toBe(true);
    });

    it('should reject different fingerprints', () => {
      const fp = generateSessionFingerprint(mockRequest as any);

      const differentRequest = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'x-forwarded-for': '203.0.113.1',
        },
      };

      const isValid = validateFingerprint(differentRequest as any, fp.hash);

      expect(isValid).toBe(false);
    });
  });

  describe('Session Tokens', () => {
    const userId = 'user-123';
    const fingerprint = 'abc123def456';

    describe('generateSessionToken', () => {
      it('should generate valid base64url token', () => {
        const token = generateSessionToken(userId, fingerprint);

        expect(token).toBeTruthy();
        expect(token).not.toContain('+');
        expect(token).not.toContain('/');
        expect(token).not.toContain('=');
      });

      it('should generate unique tokens', () => {
        const token1 = generateSessionToken(userId, fingerprint);
        const token2 = generateSessionToken(userId, fingerprint);

        expect(token1).not.toBe(token2);
      });

      it('should include userId and fingerprint', () => {
        const token = generateSessionToken(userId, fingerprint);
        const parsed = parseSessionToken(token);

        expect(parsed).not.toBeNull();
        expect(parsed!.userId).toBe(userId);
        expect(parsed!.fingerprint).toBe(fingerprint);
      });
    });

    describe('parseSessionToken', () => {
      it('should parse valid token', () => {
        const token = generateSessionToken(userId, fingerprint);
        const parsed = parseSessionToken(token);

        expect(parsed).not.toBeNull();
        expect(parsed!.userId).toBe(userId);
        expect(parsed!.fingerprint).toBe(fingerprint);
        expect(parsed!.timestamp).toBeGreaterThan(0);
        expect(parsed!.random).toBeTruthy();
      });

      it('should return null for invalid token', () => {
        const parsed = parseSessionToken('invalid-token');

        expect(parsed).toBeNull();
      });

      it('should return null for malformed token', () => {
        const parsed = parseSessionToken('YWJjOjEyMzo='); // base64 of "abc:123:" (missing parts)

        expect(parsed).toBeNull();
      });
    });

    describe('isSessionTokenExpired', () => {
      it('should not be expired immediately', () => {
        const token = generateSessionToken(userId, fingerprint);
        const expired = isSessionTokenExpired(token);

        expect(expired).toBe(false);
      });

      it('should be expired after max age', () => {
        // Create token with old timestamp
        const oldTimestamp = Date.now() - 31 * 60 * 1000; // 31 minutes ago
        const oldToken = Buffer.from(
          `${userId}:${oldTimestamp}:${fingerprint}:random123`
        ).toString('base64url');

        const expired = isSessionTokenExpired(oldToken, 30 * 60 * 1000);

        expect(expired).toBe(true);
      });

      it('should respect custom max age', () => {
        const token = generateSessionToken(userId, fingerprint);

        // Should not be expired with long max age
        expect(isSessionTokenExpired(token, 60 * 60 * 1000)).toBe(false);

        // Should be expired with very short max age
        expect(isSessionTokenExpired(token, 0)).toBe(true);
      });

      it('should handle invalid tokens', () => {
        const expired = isSessionTokenExpired('invalid-token');

        expect(expired).toBe(true);
      });
    });
  });

  describe('Browser Detection', () => {
    const testCases = [
      {
        name: 'Chrome',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        expected: 'Chrome',
      },
      {
        name: 'Firefox',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
        expected: 'Firefox',
      },
      {
        name: 'Safari',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        expected: 'Safari',
      },
      {
        name: 'Edge',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        expected: 'Edge',
      },
    ];

    testCases.forEach(({ name, userAgent, expected }) => {
      it(`should detect ${name}`, () => {
        const request = {
          ...mockRequest,
          headers: {
            ...mockRequest.headers,
            'user-agent': userAgent,
          },
        };

        const fp = generateSessionFingerprint(request as any);

        expect(fp.components.userAgent).toContain(expected);
      });
    });
  });

  describe('OS Detection', () => {
    const testCases = [
      {
        name: 'Windows',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        expected: 'Windows',
      },
      {
        name: 'macOS',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        expected: 'MacOS',
      },
      {
        name: 'Linux',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        expected: 'Linux',
      },
      {
        name: 'Android',
        userAgent:
          'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36',
        expected: 'Android',
      },
      {
        name: 'iOS',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        expected: 'iOS',
      },
    ];

    testCases.forEach(({ name, userAgent, expected }) => {
      it(`should detect ${name}`, () => {
        const request = {
          ...mockRequest,
          headers: {
            ...mockRequest.headers,
            'user-agent': userAgent,
          },
        };

        const fp = generateSessionFingerprint(request as any);

        expect(fp.components.userAgent).toContain(expected);
      });
    });
  });
});
