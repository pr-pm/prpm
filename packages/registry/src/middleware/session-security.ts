/**
 * Session Security Middleware
 *
 * Implements per-session rate limiting and fingerprint validation for playground endpoints.
 * This prevents API abuse via copied curl requests by:
 * 1. Requiring session tokens that bind to browser fingerprints
 * 2. Enforcing 30-second minimum interval between requests per session
 * 3. Rotating tokens to prevent long-term theft
 *
 * SECURITY: This is applied ON TOP of existing user-level rate limiting
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { SessionManager } from '../services/session-manager.js';

/**
 * Middleware to validate and enforce session-level security
 * Should be applied AFTER authentication middleware but BEFORE rate limiting
 */
export function createSessionSecurityMiddleware() {
  return async function sessionSecurityMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.user_id;

    if (!userId) {
      // No user ID, skip session security (auth middleware will handle)
      return;
    }

    const sessionManager = new SessionManager(request.server);

    // Get session token from header
    const sessionToken = request.headers['x-playground-session'] as string;

    // If no session token, create a new session
    if (!sessionToken) {
      try {
        const newSession = await sessionManager.createSession(userId, request);

        // Return session token to client
        reply.header('X-Playground-Session', newSession.sessionToken);
        reply.header('X-Playground-Session-Expires', newSession.expiresAt.toString());

        // Allow first request without rate limiting
        return;
      } catch (error) {
        request.server.log.error(
          { error, userId },
          'Failed to create playground session'
        );

        return reply.code(500).send({
          error: 'session_creation_failed',
          message: 'Failed to create playground session',
        });
      }
    }

    // Validate existing session
    try {
      const validation = await sessionManager.validateSession(
        sessionToken,
        request
      );

      if (!validation.valid) {
        request.server.log.warn(
          {
            userId,
            sessionToken: sessionToken.substring(0, 16) + '...',
            error: validation.error,
          },
          'Session validation failed'
        );

        // Return specific error based on validation failure
        if (validation.error === 'rate_limited') {
          reply.header('Retry-After', validation.retryAfter || 30);
          return reply.code(429).send({
            error: 'session_rate_limit_exceeded',
            message: validation.message,
            retryAfter: validation.retryAfter,
            details: 'Each session is limited to 1 request per 30 seconds to prevent abuse',
          });
        }

        if (validation.error === 'fingerprint_mismatch') {
          // Possible security issue - token used from different browser/IP
          return reply.code(403).send({
            error: 'session_validation_failed',
            message: validation.message,
            details: 'Your session could not be validated. Please refresh the page to get a new session.',
          });
        }

        if (validation.error === 'expired') {
          // Session expired, client should request new session
          return reply.code(401).send({
            error: 'session_expired',
            message: validation.message,
            details: 'Please refresh the page to get a new session.',
          });
        }

        // Invalid token
        return reply.code(400).send({
          error: 'invalid_session_token',
          message: validation.message,
        });
      }

      // Session is valid, return updated session info
      const session = validation.session!;
      reply.header('X-Playground-Session', session.sessionToken);
      reply.header('X-Playground-Session-Expires', session.expiresAt.toString());
      reply.header('X-Session-Request-Count', session.requestCount.toString());

      // Continue to next middleware/handler
      return;
    } catch (error) {
      request.server.log.error(
        { error, userId, sessionToken },
        'Session validation error'
      );

      // Fail open - allow request but log error
      // This prevents blocking legitimate users if Redis fails
      return;
    }
  };
}

/**
 * Middleware to check if session token should be rotated
 * Apply this AFTER request completes (using onResponse hook)
 */
export function createSessionRotationMiddleware() {
  return async function sessionRotationMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.user_id;
    const sessionToken = request.headers['x-playground-session'] as string;

    if (!userId || !sessionToken) {
      return;
    }

    const sessionManager = new SessionManager(request.server);

    try {
      const session = await sessionManager.getSession(sessionToken);
      if (!session) {
        return;
      }

      // Rotate token every 10 requests or every 15 minutes
      const shouldRotate =
        session.requestCount >= 10 ||
        Date.now() - session.createdAt > 15 * 60 * 1000;

      if (shouldRotate) {
        const newSession = await sessionManager.rotateSessionToken(
          sessionToken,
          request
        );

        if (newSession) {
          reply.header('X-Playground-Session', newSession.sessionToken);
          reply.header(
            'X-Playground-Session-Expires',
            newSession.expiresAt.toString()
          );
          reply.header('X-Session-Rotated', 'true');

          request.server.log.info(
            {
              userId,
              oldRequestCount: session.requestCount,
              oldAge: Date.now() - session.createdAt,
            },
            'Session token rotated'
          );
        }
      }
    } catch (error) {
      request.server.log.error(
        { error, userId, sessionToken },
        'Session rotation error'
      );
      // Don't fail the response, just log the error
    }
  };
}

/**
 * Admin endpoint middleware to revoke user sessions
 */
export async function revokeUserSessions(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userId } = request.params as { userId: string };
  const adminUserId = (request.user as any)?.user_id;

  // Verify admin privileges (implement based on your auth system)
  const result = await request.server.pg.query(
    'SELECT is_admin FROM users WHERE id = $1',
    [adminUserId]
  );

  if (!result.rows[0]?.is_admin) {
    return reply.code(403).send({
      error: 'forbidden',
      message: 'Admin privileges required',
    });
  }

  const sessionManager = new SessionManager(request.server);
  const revokedCount = await sessionManager.revokeAllUserSessions(userId);

  return reply.send({
    success: true,
    userId,
    revokedCount,
    message: `Revoked ${revokedCount} active sessions`,
  });
}
