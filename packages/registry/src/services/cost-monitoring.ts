/**
 * Cost Monitoring Service
 *
 * Tracks API costs, enforces limits, and triggers alerts for financial protection.
 */

import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';

// API pricing per 1M tokens (as of 2025-11-03)
const API_PRICING = {
  sonnet: { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  opus: { input: 15.0 / 1_000_000, output: 75.0 / 1_000_000 },
  'gpt-4o': { input: 5.0 / 1_000_000, output: 20.0 / 1_000_000 },
  'gpt-4o-mini': { input: 0.6 / 1_000_000, output: 2.4 / 1_000_000 },
  'gpt-4-turbo': { input: 10.0 / 1_000_000, output: 30.0 / 1_000_000 },
} as const;

type Model = keyof typeof API_PRICING;

export interface CostEstimate {
  estimatedCost: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface UserCostStatus {
  userId: string;
  currentMonthCost: number;
  costLimit: number;
  percentUsed: number;
  isThrottled: boolean;
  throttledReason?: string;
  tier: string;
}

export class CostMonitoringService {
  private db: Pool;
  private server: FastifyInstance;

  constructor(server: FastifyInstance) {
    this.server = server;
    this.db = server.pg.pool;
  }

  /**
   * Calculate estimated API cost for a request
   * Assumes 60% input tokens, 40% output tokens
   */
  calculateCost(
    totalTokens: number,
    model: string
  ): CostEstimate {
    const modelKey = model.toLowerCase() as Model;
    const pricing = API_PRICING[modelKey] || API_PRICING.sonnet;

    // Conservative estimate: 60% input, 40% output
    const inputTokens = Math.ceil(totalTokens * 0.6);
    const outputTokens = Math.ceil(totalTokens * 0.4);

    const estimatedCost = (
      inputTokens * pricing.input +
      outputTokens * pricing.output
    );

    return {
      estimatedCost,
      inputTokens,
      outputTokens,
      model: modelKey,
    };
  }

  /**
   * Calculate cost from actual token counts (when available from API response)
   */
  calculateActualCost(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): number {
    const modelKey = model.toLowerCase() as Model;
    const pricing = API_PRICING[modelKey] || API_PRICING.sonnet;

    return (
      inputTokens * pricing.input +
      outputTokens * pricing.output
    );
  }

  /**
   * Record API cost for a user
   * Updates both monthly and lifetime costs
   */
  async recordCost(
    userId: string,
    cost: number,
    metadata?: {
      sessionId?: string;
      model?: string;
      tokens?: number;
    }
  ): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Update user costs
      await client.query(
        `UPDATE users
         SET
           current_month_api_cost = current_month_api_cost + $2,
           lifetime_api_cost = lifetime_api_cost + $2,
           updated_at = NOW()
         WHERE id = $1`,
        [userId, cost]
      );

      // Check if we should send alerts
      await this.checkAndSendAlerts(userId, client);

      await client.query('COMMIT');

      this.server.log.info(
        { userId, cost, metadata },
        'Recorded API cost for user'
      );
    } catch (error) {
      await client.query('ROLLBACK');
      this.server.log.error({ error, userId, cost }, 'Failed to record API cost');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if user can afford a request without exceeding limits
   */
  async canAffordRequest(
    userId: string,
    estimatedCost: number
  ): Promise<{ allowed: boolean; reason?: string; status: UserCostStatus }> {
    const status = await this.getUserCostStatus(userId);

    // Check if already throttled
    if (status.isThrottled) {
      return {
        allowed: false,
        reason: status.throttledReason || 'User is currently throttled',
        status,
      };
    }

    // Check if new cost would exceed limit
    const newTotal = status.currentMonthCost + estimatedCost;
    if (newTotal > status.costLimit) {
      // Throttle the user
      await this.throttleUser(
        userId,
        `Would exceed ${status.tier} monthly API cost limit ($${status.costLimit.toFixed(2)})`
      );

      return {
        allowed: false,
        reason: `This request would exceed your monthly API cost limit of $${status.costLimit.toFixed(2)}`,
        status: { ...status, isThrottled: true },
      };
    }

    return { allowed: true, status };
  }

  /**
   * Get user's current cost status
   */
  async getUserCostStatus(userId: string): Promise<UserCostStatus> {
    const result = await this.db.query(
      `SELECT
        u.id,
        u.current_month_api_cost,
        u.is_throttled,
        u.throttled_reason,
        u.prpm_plus_status,
        c.monthly_cost_limit,
        c.tier_name,
        CASE
          WHEN u.prpm_plus_status = 'active' THEN
            CASE
              WHEN EXISTS (
                SELECT 1 FROM organization_members om
                JOIN organizations o ON om.org_id = o.id
                WHERE om.user_id = u.id AND o.is_verified = TRUE
              ) THEN 'prpm_plus_org'
              ELSE 'prpm_plus_individual'
            END
          ELSE 'free'
        END AS user_tier
       FROM users u
       LEFT JOIN cost_limits_config c ON c.tier_name = (
         CASE
           WHEN u.prpm_plus_status = 'active' THEN
             CASE
               WHEN EXISTS (
                 SELECT 1 FROM organization_members om
                 JOIN organizations o ON om.org_id = o.id
                 WHERE om.user_id = u.id AND o.is_verified = TRUE
               ) THEN 'prpm_plus_org'
               ELSE 'prpm_plus_individual'
             END
           ELSE 'free'
         END
       )
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const row = result.rows[0];
    const currentMonthCost = parseFloat(row.current_month_api_cost) || 0;
    const costLimit = parseFloat(row.monthly_cost_limit) || 0.50;

    return {
      userId,
      currentMonthCost,
      costLimit,
      percentUsed: costLimit > 0 ? (currentMonthCost / costLimit) * 100 : 0,
      isThrottled: row.is_throttled || false,
      throttledReason: row.throttled_reason,
      tier: row.user_tier,
    };
  }

  /**
   * Throttle a user for exceeding cost limits
   */
  async throttleUser(userId: string, reason: string): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET
         is_throttled = TRUE,
         throttled_reason = $2,
         throttled_at = NOW(),
         updated_at = NOW()
       WHERE id = $1`,
      [userId, reason]
    );

    // Create throttled alert
    const status = await this.getUserCostStatus(userId);
    await this.createAlert(userId, 'throttled', status.costLimit, status.currentMonthCost);

    this.server.log.warn({ userId, reason }, 'User throttled for exceeding cost limit');
  }

  /**
   * Unthrottle a user (admin action or monthly reset)
   */
  async unthrottleUser(userId: string): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET
         is_throttled = FALSE,
         throttled_reason = NULL,
         throttled_at = NULL,
         updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    this.server.log.info({ userId }, 'User unthrottled');
  }

  /**
   * Check and send cost alerts (50%, 75%, 90% thresholds)
   */
  private async checkAndSendAlerts(
    userId: string,
    client: any
  ): Promise<void> {
    const status = await this.getUserCostStatus(userId);
    const thresholds = [
      { percent: 50, type: 'warning_50' as const },
      { percent: 75, type: 'warning_75' as const },
      { percent: 90, type: 'warning_90' as const },
    ];

    for (const { percent, type } of thresholds) {
      if (status.percentUsed >= percent) {
        // Check if alert already sent
        const existing = await client.query(
          `SELECT id FROM user_cost_alerts
           WHERE user_id = $1
             AND alert_type = $2
             AND created_at >= DATE_TRUNC('month', NOW())
             AND resolved_at IS NULL`,
          [userId, type]
        );

        if (existing.rows.length === 0) {
          await this.createAlert(
            userId,
            type,
            status.costLimit,
            status.currentMonthCost,
            client
          );

          this.server.log.info(
            { userId, type, percentUsed: status.percentUsed },
            'Sent cost warning alert to user'
          );
        }
      }
    }
  }

  /**
   * Create a cost alert for a user
   */
  private async createAlert(
    userId: string,
    alertType: string,
    thresholdAmount: number,
    currentAmount: number,
    client?: any
  ): Promise<void> {
    const db = client || this.db;

    await db.query(
      `INSERT INTO user_cost_alerts
       (user_id, alert_type, threshold_amount, current_amount)
       VALUES ($1, $2, $3, $4)`,
      [userId, alertType, thresholdAmount, currentAmount]
    );
  }

  /**
   * Get cost analytics for admin dashboard
   */
  async getCostAnalytics(options?: {
    riskLevel?: 'safe' | 'low_risk' | 'medium_risk' | 'high_risk';
    limit?: number;
  }): Promise<any[]> {
    let query = `
      SELECT * FROM user_cost_analytics
    `;

    const params: any[] = [];

    if (options?.riskLevel) {
      query += ` WHERE risk_level = $1`;
      params.push(options.riskLevel);
    }

    query += ` ORDER BY current_month_api_cost DESC`;

    if (options?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Get aggregated cost metrics for dashboard
   */
  async getAggregateCostMetrics(): Promise<{
    totalMonthlyRevenue: number;
    totalMonthlyCost: number;
    overallMargin: number;
    activeUsers: number;
    throttledUsers: number;
    highRiskUsers: number;
    averageCostPerUser: number;
  }> {
    const result = await this.db.query(`
      SELECT
        COALESCE(SUM(monthly_revenue), 0) AS total_monthly_revenue,
        COALESCE(SUM(current_month_api_cost), 0) AS total_monthly_cost,
        COUNT(*) AS active_users,
        COUNT(*) FILTER (WHERE is_throttled = TRUE) AS throttled_users,
        COUNT(*) FILTER (WHERE risk_level = 'high_risk') AS high_risk_users,
        COALESCE(AVG(current_month_api_cost), 0) AS avg_cost_per_user
      FROM user_cost_analytics
    `);

    const row = result.rows[0];
    const revenue = parseFloat(row.total_monthly_revenue) || 0;
    const cost = parseFloat(row.total_monthly_cost) || 0;

    return {
      totalMonthlyRevenue: revenue,
      totalMonthlyCost: cost,
      overallMargin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
      activeUsers: parseInt(row.active_users) || 0,
      throttledUsers: parseInt(row.throttled_users) || 0,
      highRiskUsers: parseInt(row.high_risk_users) || 0,
      averageCostPerUser: parseFloat(row.avg_cost_per_user) || 0,
    };
  }

  /**
   * Reset monthly costs (cron job)
   */
  async resetMonthlyCosts(): Promise<number> {
    const result = await this.db.query(`SELECT reset_monthly_api_costs()`);
    const resetCount = result.rows[0].reset_monthly_api_costs;

    this.server.log.info({ resetCount }, 'Monthly API costs reset');
    return resetCount;
  }

  /**
   * Refresh cost analytics materialized view (cron job)
   */
  async refreshAnalytics(): Promise<void> {
    await this.db.query(`SELECT refresh_user_cost_analytics()`);
    this.server.log.info('User cost analytics refreshed');
  }
}
