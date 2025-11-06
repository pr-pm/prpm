/**
 * CSRF Protection Middleware
 *
 * SECURITY: Prevents Cross-Site Request Forgery attacks on state-changing operations
 *
 * Implementation:
 * - Web UI: CSRF tokens in forms/headers
 * - API: Requires custom X-PRPM-Token header
 * - Cookies: SameSite=Strict for session cookies
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

/**
 * Generate CSRF token for a user session
 * SECURITY: Uses cryptographically secure random bytes
 *
 * @param userId - User ID
 * @param sessionId - Session ID
 * @returns CSRF token
 */
export function generateCSRFToken(userId: string, sessionId?: string): string {
  const data = `${userId}:${sessionId || 'nosession'}:${Date.now()}`;
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET || '';

  if (!secret) {
    throw new Error('CSRF_SECRET or JWT_SECRET must be set for CSRF protection');
  }

  const token = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  // Return token with timestamp (allows expiry checking)
  return `${token}.${Date.now()}`;
}

/**
 * Verify CSRF token
 * SECURITY: Time-bound verification (tokens expire after 1 hour)
 *
 * @param token - CSRF token to verify
 * @param userId - Expected user ID
 * @param sessionId - Expected session ID
 * @returns True if token is valid
 */
export function verifyCSRFToken(
  token: string,
  userId: string,
  sessionId?: string
): boolean {
  try {
    const [tokenHash, timestamp] = token.split('.');

    if (!tokenHash || !timestamp) {
      return false;
    }

    // Check token age (1 hour expiry)
    const age = Date.now() - parseInt(timestamp, 10);
    const MAX_AGE = 60 * 60 * 1000; // 1 hour

    if (age > MAX_AGE || age < 0) {
      return false;
    }

    // Regenerate expected token
    const expectedToken = generateCSRFToken(userId, sessionId);
    const [expectedHash] = expectedToken.split('.');

    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(tokenHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * CSRF protection middleware for web UI requests
 * Validates CSRF token from header or body
 */
export function csrfProtection() {
  return async function csrfMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // Only check CSRF for state-changing methods
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return;
    }

    const userId = (request.user as any)?.user_id;

    if (!userId) {
      // Not authenticated, skip CSRF (auth middleware will handle)
      return;
    }

    // Check for CSRF token in header or body
    const token =
      request.headers['x-csrf-token'] as string ||
      (request.body as any)?.csrf_token;

    if (!token) {
      return reply.code(403).send({
        error: 'csrf_token_missing',
        message: 'CSRF token is required for this operation',
      });
    }

    // Verify token
    const sessionId = (request.body as any)?.session_id;
    const valid = verifyCSRFToken(token, userId, sessionId);

    if (!valid) {
      request.server.log.warn({
        userId,
        method: request.method,
        url: request.url,
      }, 'Invalid CSRF token');

      return reply.code(403).send({
        error: 'csrf_token_invalid',
        message: 'CSRF token is invalid or expired',
      });
    }

    // Token is valid, continue
  };
}

/**
 * API token verification middleware
 * SECURITY: Requires custom header to prevent CSRF from external sites
 *
 * This is simpler than CSRF tokens and works well for APIs:
 * - Browsers won't send custom headers in cross-origin requests
 * - Legitimate API clients can easily add the header
 */
export function requireAPIToken() {
  return async function apiTokenMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // Only check for state-changing methods
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return;
    }

    // Check for custom API header
    const apiToken = request.headers['x-prpm-token'];

    if (!apiToken) {
      return reply.code(403).send({
        error: 'api_token_missing',
        message: 'X-PRPM-Token header is required for API requests',
      });
    }

    // For now, any value is accepted (just checking header exists)
    // This prevents CSRF attacks while keeping API integration simple
    // Future: Could validate against user-specific API keys
  };
}

/**
 * Configure cookie security settings
 * SECURITY: SameSite=Strict prevents CSRF via cookie-based auth
 */
export function secureCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}
