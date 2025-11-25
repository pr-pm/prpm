/**
 * Anonymous User Restriction Middleware
 *
 * Enforces monthly usage limits for anonymous playground users:
 * - 1 free playground run per month
 * - Identified by IP address + browser fingerprint
 * - After first use, must register to continue
 *
 * SECURITY: Uses fingerprinting to prevent easy bypass via IP rotation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { generateSessionFingerprint } from '../utils/session-fingerprint.js';
import { createHash } from 'crypto';

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Hash fingerprint for database storage
 */
function hashFingerprint(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Get client IP address
 */
function getClientIp(request: FastifyRequest): string {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return request.ip || 'unknown';
}

/**
 * Get IP subnet for privacy
 */
function getIpSubnet(ip: string): string {
  if (!ip || ip === 'unknown') {
    return 'unknown';
  }

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}::`;
    }
  }

  return ip;
}

/**
 * Check if anonymous user has exceeded monthly quota
 */
async function checkAnonymousQuota(
  server: any,
  fingerprintHash: string,
  currentMonth: string
): Promise<{
  hasQuota: boolean;
  usageCount: number;
  firstUsedAt?: Date;
}> {
  try {
    const result = await server.pg.query(
      `SELECT * FROM check_anonymous_playground_quota($1, $2)`,
      [fingerprintHash, currentMonth]
    );

    if (result.rows.length === 0) {
      return { hasQuota: true, usageCount: 0 };
    }

    const row = result.rows[0];
    return {
      hasQuota: row.has_quota,
      usageCount: row.usage_count || 0,
      firstUsedAt: row.first_used_at,
    };
  } catch (error) {
    server.log.error({ error }, 'Failed to check anonymous quota');
    // Fail open - allow request if database check fails
    return { hasQuota: true, usageCount: 0 };
  }
}

/**
 * Record anonymous playground usage
 */
async function recordAnonymousUsage(
  server: any,
  fingerprintHash: string,
  ipAddress: string,
  ipSubnet: string,
  userAgent: string,
  currentMonth: string,
  packageId?: string,
  model?: string
): Promise<{ success: boolean; usageCount: number }> {
  try {
    const result = await server.pg.query(
      `SELECT * FROM record_anonymous_playground_usage($1, $2, $3, $4, $5, $6, $7)`,
      [fingerprintHash, ipAddress, ipSubnet, userAgent, currentMonth, packageId, model]
    );

    if (result.rows.length === 0) {
      return { success: false, usageCount: 0 };
    }

    const row = result.rows[0];
    return {
      success: row.success,
      usageCount: row.usage_count || 0,
    };
  } catch (error) {
    server.log.error({ error }, 'Failed to record anonymous usage');
    return { success: false, usageCount: 0 };
  }
}

/**
 * Middleware to enforce anonymous user monthly limits
 * Apply this AFTER optionalAuth but BEFORE other middleware
 */
export function createAnonymousRestrictionMiddleware() {
  return async function anonymousRestrictionMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.user_id;

    // If user is authenticated, skip anonymous restrictions
    if (userId) {
      return;
    }

    // User is anonymous - check monthly quota
    const fingerprint = generateSessionFingerprint(request);
    const fingerprintHash = hashFingerprint(fingerprint.hash);
    const currentMonth = getCurrentMonth();

    // Check quota
    const quota = await checkAnonymousQuota(
      request.server,
      fingerprintHash,
      currentMonth
    );

    if (!quota.hasQuota) {
      // Anonymous user has exceeded monthly quota
      request.server.log.warn(
        {
          fingerprintHash: fingerprintHash.substring(0, 16),
          usageCount: quota.usageCount,
          firstUsedAt: quota.firstUsedAt,
          currentMonth,
        },
        'Anonymous user exceeded monthly playground quota'
      );

      return reply.code(403).send({
        error: 'anonymous_quota_exceeded',
        message: 'You have already used your free playground run for this month.',
        details: {
          quotaLimit: 1,
          usageCount: quota.usageCount,
          currentMonth,
          firstUsedAt: quota.firstUsedAt,
        },
        callToAction: {
          message: 'Create a free account to continue using the playground',
          registrationUrl: '/register',
          benefits: [
            'Unlimited playground runs',
            'Save your sessions',
            'Access to all features',
          ],
        },
      });
    }

    // Quota available - record this usage AFTER request completes
    // Store data in request context for later recording
    (request as any).anonymousUsageTracking = {
      fingerprintHash,
      ipAddress: getClientIp(request),
      ipSubnet: getIpSubnet(getClientIp(request)),
      userAgent: fingerprint.components.userAgent,
      currentMonth,
    };

    // Continue to next middleware
    return;
  };
}

/**
 * Hook to record anonymous usage after successful request
 * Add this to onResponse hook in playground routes
 */
export async function recordAnonymousUsageHook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any)?.user_id;

  // Only record for anonymous users
  if (userId) {
    return;
  }

  // Only record on successful responses
  if (reply.statusCode !== 200) {
    return;
  }

  const tracking = (request as any).anonymousUsageTracking;
  if (!tracking) {
    return;
  }

  // Extract package_id and model from request body if available
  const body = request.body as any;
  const packageId = body?.package_id;
  const model = body?.model;

  // Record usage asynchronously (don't block response)
  setImmediate(async () => {
    try {
      const result = await recordAnonymousUsage(
        request.server,
        tracking.fingerprintHash,
        tracking.ipAddress,
        tracking.ipSubnet,
        tracking.userAgent,
        tracking.currentMonth,
        packageId,
        model
      );

      request.server.log.info(
        {
          fingerprintHash: tracking.fingerprintHash.substring(0, 16),
          usageCount: result.usageCount,
          currentMonth: tracking.currentMonth,
        },
        'Recorded anonymous playground usage'
      );
    } catch (error) {
      request.server.log.error(
        { error },
        'Failed to record anonymous usage (async)'
      );
    }
  });
}
