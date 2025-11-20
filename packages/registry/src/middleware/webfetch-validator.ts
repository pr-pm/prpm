/**
 * WebFetch Domain Validation Middleware
 *
 * SECURITY: Intercepts WebFetch tool calls and validates URLs against allowlist
 * This prevents data exfiltration and SSRF attacks in playground execution
 */

import { FastifyInstance } from 'fastify';
import { isAllowedWebFetchDomain } from '../config/security-domains.js';
import type {
  HookCallback,
  PreToolUseHookInput,
  HookJSONOutput
} from '@anthropic-ai/claude-agent-sdk';

/**
 * Blocked attempt tracking for security monitoring
 */
interface BlockedAttempt {
  userId: string;
  packageId: string;
  sessionId: string;
  url: string;
  timestamp: Date;
  toolInput: unknown;
}

/**
 * Create WebFetch validation hook for Claude SDK
 *
 * This hook intercepts ALL tool calls before execution and blocks
 * WebFetch attempts to non-allowlisted domains.
 *
 * @param server - Fastify server instance for logging
 * @param userId - User making the request
 * @param packageId - Package being executed
 * @param sessionId - Playground session ID
 * @returns Hook callback for Claude SDK
 */
export function createWebFetchValidationHook(
  server: FastifyInstance,
  userId: string,
  packageId: string,
  sessionId: string
): HookCallback {
  return async (input, toolUseID, options): Promise<HookJSONOutput> => {
    // Only intercept PreToolUse events
    if (input.hook_event_name !== 'PreToolUse') {
      return { continue: true };
    }

    const preToolInput = input as PreToolUseHookInput;

    // Only validate WebFetch tool calls
    if (preToolInput.tool_name !== 'WebFetch') {
      return { continue: true };
    }

    try {
      // Extract URL from tool input
      const toolInput = preToolInput.tool_input as { url?: string };
      const url = toolInput?.url;

      if (!url) {
        server.log.warn({
          userId,
          packageId,
          sessionId,
          toolUseID,
          toolInput,
        }, 'WebFetch called without URL parameter');

        return {
          continue: false,
          suppressOutput: false,
        };
      }

      // Validate domain against allowlist
      const allowed = isAllowedWebFetchDomain(url);

      if (!allowed) {
        // SECURITY: Block the request and log attempt
        const blockedAttempt: BlockedAttempt = {
          userId,
          packageId,
          sessionId,
          url,
          timestamp: new Date(),
          toolInput,
        };

        server.log.warn({
          type: 'security_blocked_webfetch',
          ...blockedAttempt,
          toolUseID,
        }, '🚫 SECURITY: Blocked WebFetch to non-allowlisted domain');

        // Store blocked attempt for monitoring (async, don't wait)
        recordBlockedAttempt(server, blockedAttempt).catch(err => {
          server.log.error({ error: err }, 'Failed to record blocked WebFetch attempt');
        });

        // Return error to the agent
        // Setting continue: false blocks the tool execution
        return {
          continue: false,
          suppressOutput: false,
        };
      }

      // Domain is allowed - log and continue
      server.log.info({
        type: 'security_allowed_webfetch',
        userId,
        packageId,
        sessionId,
        url,
        toolUseID,
      }, '✅ SECURITY: Allowed WebFetch to allowlisted domain');

      return {
        continue: true,
      };

    } catch (error) {
      // Fail closed - if validation fails, block the request
      server.log.error({
        error,
        userId,
        packageId,
        sessionId,
        toolUseID,
        toolInput: preToolInput.tool_input,
      }, 'WebFetch validation failed - blocking request');

      return {
        continue: false,
        suppressOutput: false,
      };
    }
  };
}

/**
 * Record blocked WebFetch attempt to database for security monitoring
 */
async function recordBlockedAttempt(
  server: FastifyInstance,
  attempt: BlockedAttempt
): Promise<void> {
  try {
    await server.pg.query(
      `INSERT INTO security_blocked_webfetch_attempts
       (user_id, package_id, session_id, blocked_url, tool_input, blocked_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        attempt.userId,
        attempt.packageId,
        attempt.sessionId,
        attempt.url,
        JSON.stringify(attempt.toolInput),
        attempt.timestamp,
      ]
    );
  } catch (error) {
    // If table doesn't exist, log warning but don't fail
    // This allows the security feature to work even if migration hasn't run yet
    if ((error as any)?.code === '42P01') {
      server.log.warn(
        'security_blocked_webfetch_attempts table does not exist. Run migrations to enable tracking.'
      );
    } else {
      throw error;
    }
  }
}

/**
 * Get blocked WebFetch attempts for monitoring dashboard
 */
export async function getBlockedWebFetchAttempts(
  server: FastifyInstance,
  options: {
    userId?: string;
    packageId?: string;
    limit?: number;
    since?: Date;
  } = {}
): Promise<BlockedAttempt[]> {
  const { userId, packageId, limit = 100, since } = options;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(userId);
  }

  if (packageId) {
    conditions.push(`package_id = $${paramIndex++}`);
    params.push(packageId);
  }

  if (since) {
    conditions.push(`blocked_at >= $${paramIndex++}`);
    params.push(since);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  params.push(limit);

  try {
    const result = await server.pg.query(
      `SELECT user_id, package_id, session_id, blocked_url as url,
              tool_input, blocked_at as timestamp
       FROM security_blocked_webfetch_attempts
       ${whereClause}
       ORDER BY blocked_at DESC
       LIMIT $${paramIndex}`,
      params
    );

    return result.rows.map(row => ({
      userId: row.user_id,
      packageId: row.package_id,
      sessionId: row.session_id,
      url: row.url,
      timestamp: row.timestamp,
      toolInput: row.tool_input,
    }));
  } catch (error) {
    // If table doesn't exist, return empty array
    if ((error as any)?.code === '42P01') {
      return [];
    }
    throw error;
  }
}

/**
 * Get abuse statistics for security monitoring
 */
export async function getWebFetchAbuseStats(
  server: FastifyInstance,
  since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
): Promise<{
  totalBlocked: number;
  uniqueUsers: number;
  topBlockedDomains: Array<{ domain: string; count: number }>;
  topOffendingUsers: Array<{ userId: string; count: number }>;
}> {
  try {
    // Total blocked attempts
    const totalResult = await server.pg.query(
      `SELECT COUNT(*) as total FROM security_blocked_webfetch_attempts
       WHERE blocked_at >= $1`,
      [since]
    );

    // Unique users
    const usersResult = await server.pg.query(
      `SELECT COUNT(DISTINCT user_id) as unique_users
       FROM security_blocked_webfetch_attempts
       WHERE blocked_at >= $1`,
      [since]
    );

    // Top blocked domains
    const domainsResult = await server.pg.query(
      `SELECT blocked_url, COUNT(*) as count
       FROM security_blocked_webfetch_attempts
       WHERE blocked_at >= $1
       GROUP BY blocked_url
       ORDER BY count DESC
       LIMIT 10`,
      [since]
    );

    // Top offending users
    const offendersResult = await server.pg.query(
      `SELECT user_id, COUNT(*) as count
       FROM security_blocked_webfetch_attempts
       WHERE blocked_at >= $1
       GROUP BY user_id
       ORDER BY count DESC
       LIMIT 10`,
      [since]
    );

    return {
      totalBlocked: parseInt(totalResult.rows[0]?.total || '0'),
      uniqueUsers: parseInt(usersResult.rows[0]?.unique_users || '0'),
      topBlockedDomains: domainsResult.rows.map(row => ({
        domain: row.blocked_url,
        count: parseInt(row.count),
      })),
      topOffendingUsers: offendersResult.rows.map(row => ({
        userId: row.user_id,
        count: parseInt(row.count),
      })),
    };
  } catch (error) {
    // If table doesn't exist, return zeros
    if ((error as any)?.code === '42P01') {
      return {
        totalBlocked: 0,
        uniqueUsers: 0,
        topBlockedDomains: [],
        topOffendingUsers: [],
      };
    }
    throw error;
  }
}
