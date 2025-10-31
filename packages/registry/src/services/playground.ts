/**
 * Playground Service
 *
 * Handles playground execution, session management, and AI model integration.
 * Works with the Credits Service to manage cost and usage.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { PlaygroundCreditsService } from './playground-credits.js';
import { nanoid } from 'nanoid';

export interface PlaygroundMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens?: number;
}

export interface PlaygroundSession {
  id: string;
  userId: string;
  orgId?: string;
  packageId: string;
  packageVersion?: string;
  packageName: string;
  conversation: PlaygroundMessage[];
  creditsSpent: number;
  estimatedTokens: number;
  model: string;
  totalTokens: number;
  totalDurationMs: number;
  runCount: number;
  isPublic: boolean;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt: Date;
}

export interface PlaygroundRunRequest {
  packageId: string;
  packageVersion?: string;
  userInput: string;
  conversationId?: string;
  model?: 'sonnet' | 'opus' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
}

export interface PlaygroundRunResponse {
  id: string;
  response: string;
  conversationId: string;
  creditsSpent: number;
  creditsRemaining: number;
  tokensUsed: number;
  durationMs: number;
  model: string;
}

export class PlaygroundService {
  private server: FastifyInstance;
  private anthropic: Anthropic | null;
  private openai: OpenAI | null;
  private creditsService: PlaygroundCreditsService;

  constructor(server: FastifyInstance) {
    this.server = server;

    // Initialize Anthropic client if API key is available
    this.anthropic = config.ai.anthropicApiKey
      ? new Anthropic({ apiKey: config.ai.anthropicApiKey })
      : null;

    // Initialize OpenAI client if API key is available
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    this.creditsService = new PlaygroundCreditsService(server);

    // Log warnings for missing API keys
    if (!this.anthropic) {
      this.server.log.warn('Anthropic API key not configured - Anthropic models will not be available in playground');
    }
    if (!this.openai) {
      this.server.log.warn('OpenAI API key not configured - OpenAI models will not be available in playground');
    }
  }

  /**
   * Load package prompt content from database
   */
  async loadPackagePrompt(packageId: string, version?: string): Promise<string> {
    const query = version
      ? `SELECT pv.tarball_url, p.snippet, p.name
         FROM packages p
         JOIN package_versions pv ON p.id = pv.package_id
         WHERE p.id = $1 AND pv.version = $2`
      : `SELECT pv.tarball_url, p.snippet, p.name
         FROM packages p
         JOIN package_versions pv ON p.id = pv.package_id
         WHERE p.id = $1
         ORDER BY pv.published_at DESC
         LIMIT 1`;

    const params = version ? [packageId, version] : [packageId];
    const result = await this.server.pg.query(query, params);

    if (result.rows.length === 0) {
      throw new Error('Package not found');
    }

    const row = result.rows[0];

    // For MVP, use snippet. In future, extract from tarball
    if (row.snippet) {
      return row.snippet;
    }

    // TODO: Extract full content from tarball if snippet not available
    throw new Error('Package content not available');
  }

  /**
   * Estimate credits required for a playground run
   */
  estimateCredits(
    promptLength: number,
    userInputLength: number,
    model: 'sonnet' | 'opus' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo',
    conversationHistory?: PlaygroundMessage[]
  ): number {
    // Calculate approximate tokens
    // Rule of thumb: 1 token ≈ 4 characters
    const historyTokens = conversationHistory
      ? conversationHistory.reduce(
          (sum, msg) => sum + (msg.content.length / 4),
          0
        )
      : 0;

    const totalChars = promptLength + userInputLength + (historyTokens * 4);
    const estimatedTokens = (totalChars / 4) * 1.3; // 30% buffer for response

    // Model-specific pricing
    if (model === 'opus') return 3;
    if (model === 'gpt-4o') return 2;  // GPT-4o pricing similar to medium tier
    if (model === 'gpt-4-turbo') return 3;  // GPT-4 Turbo similar to opus
    if (model === 'gpt-4o-mini') return 1;  // Mini is cheaper

    // Sonnet pricing tiers (default)
    if (estimatedTokens < 2500) return 1;  // Basic run
    if (estimatedTokens < 6000) return 2;  // Medium run
    return 3;  // Large run
  }

  /**
   * Execute playground run with Claude API
   */
  async executePrompt(
    userId: string,
    request: PlaygroundRunRequest
  ): Promise<PlaygroundRunResponse> {
    const startTime = Date.now();

    try {
      // 1. Load package prompt
      const packagePrompt = await this.loadPackagePrompt(
        request.packageId,
        request.packageVersion
      );

      // 2. Get or create session
      let session: any;
      if (request.conversationId) {
        session = await this.getSession(request.conversationId, userId);
        if (!session) {
          throw new Error('Conversation not found');
        }
      }

      const conversationHistory = session?.conversation || [];

      // 3. Estimate credits needed
      const model = request.model || 'sonnet';
      const estimatedCredits = this.estimateCredits(
        packagePrompt.length,
        request.userInput.length,
        model,
        conversationHistory
      );

      // 4. Check user can afford
      const canAfford = await this.creditsService.canAfford(userId, estimatedCredits);
      if (!canAfford) {
        const balance = await this.creditsService.getBalance(userId);
        throw new Error(
          `Insufficient credits. Need ${estimatedCredits} but have ${balance.balance}`
        );
      }

      // 5. Determine if using Anthropic or OpenAI
      const isOpenAI = model.startsWith('gpt');

      let responseText: string;
      let tokensUsed: number;
      let modelName: string;

      if (isOpenAI) {
        // Check if OpenAI client is available
        if (!this.openai) {
          throw new Error(
            'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable to use OpenAI models.'
          );
        }

        // OpenAI models
        const openaiModelMap: Record<string, string> = {
          'gpt-4o': 'gpt-4o',
          'gpt-4o-mini': 'gpt-4o-mini',
          'gpt-4-turbo': 'gpt-4-turbo-preview',
        };
        modelName = openaiModelMap[model] || 'gpt-4o';

        // Build messages for OpenAI
        const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: packagePrompt,
          },
        ];

        // Add conversation history
        for (const msg of conversationHistory) {
          openaiMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        }

        // Add current user input
        openaiMessages.push({
          role: 'user',
          content: request.userInput,
        });

        // Call OpenAI API
        const response = await this.openai.chat.completions.create({
          model: modelName,
          messages: openaiMessages,
          max_tokens: 4096,
          temperature: 0.7,
        });

        responseText = response.choices[0]?.message?.content || 'No response generated';
        tokensUsed = response.usage?.total_tokens || 0;
      } else {
        // Check if Anthropic client is available
        if (!this.anthropic) {
          throw new Error(
            'Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable to use Anthropic models.'
          );
        }

        // Anthropic models
        modelName =
          model === 'opus'
            ? 'claude-3-opus-20240229'
            : 'claude-3-5-sonnet-20241022';

        // Build messages for Anthropic
        const anthropicMessages: Anthropic.MessageParam[] = [];

        // Add conversation history
        for (const msg of conversationHistory) {
          anthropicMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        }

        // Add current user input
        anthropicMessages.push({
          role: 'user',
          content: request.userInput,
        });

        // Call Anthropic API
        const response = await this.anthropic.messages.create({
          model: modelName,
          max_tokens: 4096,
          temperature: 0.7,
          system: packagePrompt,
          messages: anthropicMessages,
        });

        responseText =
          response.content[0].type === 'text'
            ? response.content[0].text
            : 'No response generated';

        tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
      }

      const durationMs = Date.now() - startTime;

      // 7. Create or update session
      const newMessage: PlaygroundMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        tokens: tokensUsed,
      };

      const userMessage: PlaygroundMessage = {
        role: 'user',
        content: request.userInput,
        timestamp: new Date().toISOString(),
      };

      let sessionId: string;
      if (session) {
        // Update existing session
        sessionId = session.id;
        await this.updateSession(sessionId, [userMessage, newMessage], estimatedCredits);
      } else {
        // Create new session
        sessionId = await this.createSession({
          userId,
          packageId: request.packageId,
          packageVersion: request.packageVersion,
          conversation: [userMessage, newMessage],
          model: modelName,
          tokensUsed,
          durationMs,
          creditsSpent: estimatedCredits,
        });
      }

      // 8. Deduct credits
      await this.creditsService.spendCredits(
        userId,
        estimatedCredits,
        sessionId,
        `Playground run: ${model} model`,
        {
          packageId: request.packageId,
          model: modelName,
          tokensUsed,
          durationMs,
        }
      );

      // 9. Log usage
      await this.logUsage({
        userId,
        packageId: request.packageId,
        sessionId,
        model: modelName,
        tokensUsed,
        durationMs,
        creditsSpent: estimatedCredits,
      });

      // 10. Get updated balance
      const balance = await this.creditsService.getBalance(userId);

      this.server.log.info(
        {
          userId,
          packageId: request.packageId,
          sessionId,
          creditsSpent: estimatedCredits,
          creditsRemaining: balance.balance,
          tokensUsed,
          durationMs,
        },
        'Playground run completed successfully'
      );

      return {
        id: sessionId,
        response: responseText,
        conversationId: sessionId,
        creditsSpent: estimatedCredits,
        creditsRemaining: balance.balance,
        tokensUsed,
        durationMs,
        model: modelName,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.server.log.error(
        { error, userId, packageId: request.packageId, durationMs },
        'Playground run failed'
      );
      throw error;
    }
  }

  /**
   * Create new playground session
   */
  private async createSession(data: {
    userId: string;
    packageId: string;
    packageVersion?: string;
    conversation: PlaygroundMessage[];
    model: string;
    tokensUsed: number;
    durationMs: number;
    creditsSpent: number;
  }): Promise<string> {
    // Get package name
    const pkgResult = await this.server.pg.query(
      'SELECT name FROM packages WHERE id = $1',
      [data.packageId]
    );

    if (pkgResult.rows.length === 0) {
      throw new Error('Package not found');
    }

    const result = await this.server.pg.query(
      `INSERT INTO playground_sessions
       (user_id, package_id, package_version, package_name, conversation,
        model, total_tokens, total_duration_ms, credits_spent, estimated_tokens)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        data.userId,
        data.packageId,
        data.packageVersion || null,
        pkgResult.rows[0].name,
        JSON.stringify(data.conversation),
        data.model,
        data.tokensUsed,
        data.durationMs,
        data.creditsSpent,
        data.tokensUsed,
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Update existing playground session with new messages
   */
  private async updateSession(
    sessionId: string,
    newMessages: PlaygroundMessage[],
    creditsSpent: number
  ): Promise<void> {
    await this.server.pg.query(
      `UPDATE playground_sessions
       SET
         conversation = conversation || $1::jsonb,
         run_count = run_count + 1,
         credits_spent = credits_spent + $2,
         last_run_at = NOW(),
         updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(newMessages), creditsSpent, sessionId]
    );
  }

  /**
   * Get session by ID (with authorization check)
   */
  async getSession(sessionId: string, userId: string): Promise<PlaygroundSession | null> {
    const result = await this.server.pg.query(
      `SELECT
        id, user_id, org_id, package_id, package_version, package_name,
        conversation, credits_spent, estimated_tokens, model, total_tokens,
        total_duration_ms, run_count, is_public, share_token,
        created_at, updated_at, last_run_at
       FROM playground_sessions
       WHERE id = $1 AND (user_id = $2 OR is_public = TRUE)`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      orgId: row.org_id,
      packageId: row.package_id,
      packageVersion: row.package_version,
      packageName: row.package_name,
      conversation: row.conversation,
      creditsSpent: row.credits_spent,
      estimatedTokens: row.estimated_tokens,
      model: row.model,
      totalTokens: row.total_tokens,
      totalDurationMs: row.total_duration_ms,
      runCount: row.run_count,
      isPublic: row.is_public,
      shareToken: row.share_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastRunAt: row.last_run_at,
    };
  }

  /**
   * Share session publicly and generate share token
   */
  async shareSession(sessionId: string, userId: string): Promise<string> {
    const shareToken = nanoid(16);

    const result = await this.server.pg.query(
      `UPDATE playground_sessions
       SET is_public = TRUE, share_token = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING share_token`,
      [shareToken, sessionId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Session not found or unauthorized');
    }

    return result.rows[0].share_token;
  }

  /**
   * Get session by share token (public access)
   */
  async getSessionByShareToken(shareToken: string): Promise<PlaygroundSession | null> {
    const result = await this.server.pg.query(
      `SELECT
        id, user_id, org_id, package_id, package_version, package_name,
        conversation, credits_spent, estimated_tokens, model, total_tokens,
        total_duration_ms, run_count, is_public, share_token,
        created_at, updated_at, last_run_at
       FROM playground_sessions
       WHERE share_token = $1 AND is_public = TRUE`,
      [shareToken]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      orgId: row.org_id,
      packageId: row.package_id,
      packageVersion: row.package_version,
      packageName: row.package_name,
      conversation: row.conversation,
      creditsSpent: row.credits_spent,
      estimatedTokens: row.estimated_tokens,
      model: row.model,
      totalTokens: row.total_tokens,
      totalDurationMs: row.total_duration_ms,
      runCount: row.run_count,
      isPublic: row.is_public,
      shareToken: row.share_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastRunAt: row.last_run_at,
    };
  }

  /**
   * List user's playground sessions
   */
  async listSessions(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ sessions: PlaygroundSession[]; total: number }> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const result = await this.server.pg.query(
      `SELECT
        id, user_id, org_id, package_id, package_version, package_name,
        conversation, credits_spent, estimated_tokens, model, total_tokens,
        total_duration_ms, run_count, is_public, share_token,
        created_at, updated_at, last_run_at
       FROM playground_sessions
       WHERE user_id = $1
       ORDER BY last_run_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await this.server.pg.query(
      'SELECT COUNT(*) FROM playground_sessions WHERE user_id = $1',
      [userId]
    );

    const sessions: PlaygroundSession[] = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      orgId: row.org_id,
      packageId: row.package_id,
      packageVersion: row.package_version,
      packageName: row.package_name,
      conversation: row.conversation,
      creditsSpent: row.credits_spent,
      estimatedTokens: row.estimated_tokens,
      model: row.model,
      totalTokens: row.total_tokens,
      totalDurationMs: row.total_duration_ms,
      runCount: row.run_count,
      isPublic: row.is_public,
      shareToken: row.share_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastRunAt: row.last_run_at,
    }));

    return {
      sessions,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const result = await this.server.pg.query(
      'DELETE FROM playground_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Session not found or unauthorized');
    }
  }

  /**
   * Log playground usage for analytics
   */
  private async logUsage(data: {
    userId: string;
    packageId: string;
    sessionId: string;
    model: string;
    tokensUsed: number;
    durationMs: number;
    creditsSpent: number;
  }): Promise<void> {
    await this.server.pg.query(
      `INSERT INTO playground_usage
       (user_id, package_id, session_id, model, tokens_used, duration_ms, credits_spent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.userId,
        data.packageId,
        data.sessionId,
        data.model,
        data.tokensUsed,
        data.durationMs,
        data.creditsSpent,
      ]
    );
  }
}
