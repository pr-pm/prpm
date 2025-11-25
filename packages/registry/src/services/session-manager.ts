/**
 * Session Manager Service
 *
 * Manages short-lived playground sessions with fingerprint binding.
 * Prevents API abuse via copied curl requests by validating:
 * 1. Session token validity (30 minute expiration)
 * 2. Fingerprint match (browser/IP consistency)
 * 3. Per-session rate limiting (1 request per 30 seconds)
 *
 * Uses Redis for fast session storage and automatic expiration.
 */

import { FastifyInstance } from 'fastify';
import { createHash } from 'crypto';
import {
  generateSessionFingerprint,
  generateSessionToken,
  parseSessionToken,
  isSessionTokenExpired,
  validateFingerprint,
  type SessionFingerprint,
} from '../utils/session-fingerprint.js';

export interface PlaygroundSession {
  sessionToken: string;
  userId: string;
  fingerprint: string;
  createdAt: number;
  lastRequestAt: number;
  requestCount: number;
  expiresAt: number;
}

export interface SessionValidationResult {
  valid: boolean;
  error?: 'invalid_token' | 'expired' | 'fingerprint_mismatch' | 'rate_limited';
  message?: string;
  session?: PlaygroundSession;
  retryAfter?: number;
}

export class SessionManager {
  private server: FastifyInstance;
  private readonly SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly MIN_REQUEST_INTERVAL_MS = 30 * 1000; // 30 seconds between requests

  constructor(server: FastifyInstance) {
    this.server = server;
  }

  /**
   * Hash session token for audit logging (privacy protection)
   */
  private hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Log security event to audit table
   */
  private async logAuditEvent(
    userId: string,
    sessionToken: string,
    eventType: string,
    eventDetails: any,
    request: any
  ): Promise<void> {
    try {
      const tokenHash = this.hashSessionToken(sessionToken);
      const fingerprint = generateSessionFingerprint(request);

      // Get client IP
      const forwardedFor = request.headers['x-forwarded-for'];
      const ipAddress = forwardedFor
        ? (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(',')[0].trim()
        : request.ip;

      const userAgent = request.headers['user-agent'] || '';
      const requestPath = request.url || '';

      await this.server.pg.query(
        `INSERT INTO playground_session_audit
         (user_id, session_token_hash, event_type, event_details, ip_address,
          user_agent, fingerprint_hash, request_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          tokenHash,
          eventType,
          JSON.stringify(eventDetails),
          ipAddress,
          userAgent,
          fingerprint.hash,
          requestPath,
        ]
      );
    } catch (error) {
      // Don't throw - audit logging should not break the app
      this.server.log.error({ error, userId, eventType }, 'Failed to log audit event');
    }
  }

  /**
   * Create a new playground session
   */
  async createSession(
    userId: string,
    request: any
  ): Promise<PlaygroundSession> {
    const fingerprint = generateSessionFingerprint(request);
    const sessionToken = generateSessionToken(userId, fingerprint.hash);
    const now = Date.now();

    const session: PlaygroundSession = {
      sessionToken,
      userId,
      fingerprint: fingerprint.hash,
      createdAt: now,
      lastRequestAt: 0, // No requests yet
      requestCount: 0,
      expiresAt: now + this.SESSION_TTL_MS,
    };

    // Store in Redis with automatic expiration
    const key = `playground:session:${sessionToken}`;
    const ttlSeconds = Math.ceil(this.SESSION_TTL_MS / 1000);

    await this.server.redis.setex(
      key,
      ttlSeconds,
      JSON.stringify(session)
    );

    this.server.log.info(
      {
        userId,
        sessionToken: sessionToken.substring(0, 16) + '...',
        fingerprintHash: fingerprint.hash.substring(0, 16),
        expiresIn: `${ttlSeconds}s`,
      },
      'Playground session created'
    );

    // Log audit event
    await this.logAuditEvent(
      userId,
      sessionToken,
      'created',
      {
        fingerprint: fingerprint.components,
        expiresAt: session.expiresAt,
      },
      request
    );

    return session;
  }

  /**
   * Get an existing session
   */
  async getSession(sessionToken: string): Promise<PlaygroundSession | null> {
    try {
      const key = `playground:session:${sessionToken}`;
      const data = await this.server.redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as PlaygroundSession;
    } catch (error) {
      this.server.log.error({ error, sessionToken }, 'Failed to get session');
      return null;
    }
  }

  /**
   * Update session last request time and increment counter
   */
  async updateSession(session: PlaygroundSession): Promise<void> {
    const key = `playground:session:${session.sessionToken}`;

    // Calculate remaining TTL
    const remainingMs = session.expiresAt - Date.now();
    if (remainingMs <= 0) {
      // Session expired, don't update
      return;
    }

    const ttlSeconds = Math.ceil(remainingMs / 1000);

    await this.server.redis.setex(
      key,
      ttlSeconds,
      JSON.stringify(session)
    );
  }

  /**
   * Validate session and check rate limiting
   */
  async validateSession(
    sessionToken: string,
    request: any
  ): Promise<SessionValidationResult> {
    // Parse token
    const parsed = parseSessionToken(sessionToken);
    if (!parsed) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid session token format',
      };
    }

    // Check expiration
    if (isSessionTokenExpired(sessionToken, this.SESSION_TTL_MS)) {
      return {
        valid: false,
        error: 'expired',
        message: 'Session token expired. Please refresh the page.',
      };
    }

    // Get session from Redis
    const session = await this.getSession(sessionToken);
    if (!session) {
      return {
        valid: false,
        error: 'expired',
        message: 'Session not found or expired',
      };
    }

    // Validate fingerprint
    const currentFingerprint = generateSessionFingerprint(request);
    if (currentFingerprint.hash !== session.fingerprint) {
      this.server.log.warn(
        {
          userId: session.userId,
          sessionToken: sessionToken.substring(0, 16) + '...',
          expectedFingerprint: session.fingerprint.substring(0, 16),
          actualFingerprint: currentFingerprint.hash.substring(0, 16),
        },
        'Session fingerprint mismatch - possible token theft'
      );

      // Log security event
      await this.logAuditEvent(
        session.userId,
        sessionToken,
        'fingerprint_mismatch',
        {
          expectedFingerprint: session.fingerprint,
          actualFingerprint: currentFingerprint.hash,
          fingerprintComponents: currentFingerprint.components,
        },
        request
      );

      return {
        valid: false,
        error: 'fingerprint_mismatch',
        message: 'Session validation failed. Please refresh the page.',
      };
    }

    // Check per-session rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - session.lastRequestAt;

    if (
      session.lastRequestAt > 0 &&
      timeSinceLastRequest < this.MIN_REQUEST_INTERVAL_MS
    ) {
      const retryAfter = Math.ceil(
        (this.MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest) / 1000
      );

      this.server.log.warn(
        {
          userId: session.userId,
          sessionToken: sessionToken.substring(0, 16) + '...',
          timeSinceLastRequest,
          retryAfter,
        },
        'Per-session rate limit exceeded'
      );

      // Log security event
      await this.logAuditEvent(
        session.userId,
        sessionToken,
        'rate_limited',
        {
          timeSinceLastRequest,
          retryAfter,
          requestCount: session.requestCount,
        },
        request
      );

      return {
        valid: false,
        error: 'rate_limited',
        message: `Please wait ${retryAfter} seconds before making another request`,
        retryAfter,
      };
    }

    // Update session
    session.lastRequestAt = now;
    session.requestCount += 1;
    await this.updateSession(session);

    // Log successful validation
    await this.logAuditEvent(
      session.userId,
      sessionToken,
      'validated',
      {
        requestCount: session.requestCount,
      },
      request
    );

    return {
      valid: true,
      session,
    };
  }

  /**
   * Rotate session token (refresh with new token but keep session data)
   * This prevents long-lived token theft
   */
  async rotateSessionToken(
    oldSessionToken: string,
    request: any
  ): Promise<PlaygroundSession | null> {
    const session = await this.getSession(oldSessionToken);
    if (!session) {
      return null;
    }

    // Validate fingerprint before rotating
    const currentFingerprint = generateSessionFingerprint(request);
    if (currentFingerprint.hash !== session.fingerprint) {
      return null;
    }

    // Generate new token
    const newFingerprint = generateSessionFingerprint(request);
    const newSessionToken = generateSessionToken(session.userId, newFingerprint.hash);

    // Create new session with existing data
    const newSession: PlaygroundSession = {
      ...session,
      sessionToken: newSessionToken,
      fingerprint: newFingerprint.hash,
      expiresAt: Date.now() + this.SESSION_TTL_MS, // Extend expiration
    };

    // Store new session
    const newKey = `playground:session:${newSessionToken}`;
    const ttlSeconds = Math.ceil(this.SESSION_TTL_MS / 1000);
    await this.server.redis.setex(
      newKey,
      ttlSeconds,
      JSON.stringify(newSession)
    );

    // Delete old session
    const oldKey = `playground:session:${oldSessionToken}`;
    await this.server.redis.del(oldKey);

    this.server.log.info(
      {
        userId: session.userId,
        oldToken: oldSessionToken.substring(0, 16) + '...',
        newToken: newSessionToken.substring(0, 16) + '...',
      },
      'Session token rotated'
    );

    // Log audit event
    await this.logAuditEvent(
      session.userId,
      newSessionToken,
      'rotated',
      {
        oldTokenHash: this.hashSessionToken(oldSessionToken),
        requestCount: session.requestCount,
      },
      request
    );

    return newSession;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionToken: string): Promise<void> {
    const key = `playground:session:${sessionToken}`;
    await this.server.redis.del(key);
  }

  /**
   * Get all active sessions for a user (for security/debugging)
   */
  async getUserSessions(userId: string): Promise<PlaygroundSession[]> {
    try {
      // Scan for all session keys
      const pattern = 'playground:session:*';
      const sessions: PlaygroundSession[] = [];

      // Note: This is not efficient for large scale, but works for monitoring
      const keys = await this.server.redis.keys(pattern);

      for (const key of keys) {
        const data = await this.server.redis.get(key);
        if (data) {
          const session = JSON.parse(data) as PlaygroundSession;
          if (session.userId === userId) {
            sessions.push(session);
          }
        }
      }

      return sessions;
    } catch (error) {
      this.server.log.error({ error, userId }, 'Failed to get user sessions');
      return [];
    }
  }

  /**
   * Revoke all sessions for a user (security feature)
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    let revokedCount = 0;

    for (const session of sessions) {
      await this.deleteSession(session.sessionToken);
      revokedCount++;
    }

    this.server.log.info(
      { userId, revokedCount },
      'All user sessions revoked'
    );

    return revokedCount;
  }
}
