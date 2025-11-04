/**
 * Playground Service
 *
 * Handles playground execution, session management, and AI model integration.
 * Works with the Credits Service to manage cost and usage.
 */

import Anthropic from '@anthropic-ai/sdk';
import { query as claudeQuery } from '@anthropic-ai/claude-agent-sdk';
import OpenAI from 'openai';
import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { PlaygroundCreditsService } from './playground-credits.js';
import { CostMonitoringService } from './cost-monitoring.js';
import { getTarballContent } from '../storage/s3.js';
import { nanoid } from 'nanoid';
import { getModelId, isAnthropicModel, isOpenAIModel } from '../config/models.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type {
  PlaygroundMessage,
  PlaygroundSession,
  PlaygroundRunRequest,
  PlaygroundRunResponse,
} from '@pr-pm/types';

export class PlaygroundService {
  private server: FastifyInstance;
  private anthropic: Anthropic | null;
  private openai: OpenAI | null;
  private creditsService: PlaygroundCreditsService;
  private costMonitoring: CostMonitoringService;

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
    this.costMonitoring = new CostMonitoringService(server);

    // Log warnings for missing API keys
    if (!this.anthropic) {
      this.server.log.warn('Anthropic API key not configured - Anthropic models will not be available in playground');
    }
    if (!this.openai) {
      this.server.log.warn('OpenAI API key not configured - OpenAI models will not be available in playground');
    }
  }

  /**
   * Create temporary .claude directory structure for Skills/Agents
   * Returns the base directory path
   */
  private async createTempClaudeDirectory(): Promise<string> {
    const sessionId = nanoid(12);
    const baseDir = join(tmpdir(), `prpm-playground-${sessionId}`);
    const claudeDir = join(baseDir, '.claude');
    const skillsDir = join(claudeDir, 'skills');
    const agentsDir = join(claudeDir, 'agents');

    await fs.mkdir(skillsDir, { recursive: true });
    await fs.mkdir(agentsDir, { recursive: true });

    return baseDir;
  }

  /**
   * Write skill to filesystem in proper Claude SDK format
   */
  private async writeSkillToFilesystem(
    baseDir: string,
    skillName: string,
    prompt: string
  ): Promise<void> {
    // Sanitize skill name for directory
    const dirName = skillName
      .replace(/@/g, '')
      .replace(/\//g, '-')
      .toLowerCase();

    const skillDir = join(baseDir, '.claude', 'skills', dirName);
    await fs.mkdir(skillDir, { recursive: true });

    const skillPath = join(skillDir, 'SKILL.md');
    await fs.writeFile(skillPath, prompt, 'utf-8');
  }

  /**
   * Write agent to filesystem in proper Claude SDK format
   */
  private async writeAgentToFilesystem(
    baseDir: string,
    agentName: string,
    prompt: string
  ): Promise<void> {
    // Sanitize agent name for directory
    const dirName = agentName
      .replace(/@/g, '')
      .replace(/\//g, '-')
      .toLowerCase();

    const agentDir = join(baseDir, '.claude', 'agents', dirName);
    await fs.mkdir(agentDir, { recursive: true });

    const agentPath = join(agentDir, 'AGENT.md');
    await fs.writeFile(agentPath, prompt, 'utf-8');
  }

  /**
   * Cleanup temp directory after execution
   */
  private async cleanupTempDirectory(baseDir: string): Promise<void> {
    try {
      await fs.rm(baseDir, { recursive: true, force: true });
    } catch (error) {
      this.server.log.warn({ baseDir, error }, 'Failed to cleanup temp directory');
    }
  }

  /**
   * Load package prompt content and metadata from database
   */
  async loadPackagePrompt(packageId: string, version?: string): Promise<{
    prompt: string;
    format: string;
    subtype: string;
    name: string;
  }> {
    const query = version
      ? `SELECT pv.tarball_url, pv.version, p.snippet, p.name, p.format, p.subtype
         FROM packages p
         JOIN package_versions pv ON p.id = pv.package_id
         WHERE p.id = $1 AND pv.version = $2`
      : `SELECT pv.tarball_url, pv.version, p.snippet, p.name, p.format, p.subtype
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

    let prompt: string;

    // Priority order: 1) snippet field, 2) extract from S3 tarball
    if (row.snippet) {
      this.server.log.info({ packageName: row.name }, 'Using cached snippet for playground');
      prompt = row.snippet;
    } else {
      // No snippet, try to fetch and extract from S3
      this.server.log.info({ packageName: row.name, version: row.version }, 'Fetching package content from S3 tarball');

      try {
        prompt = await getTarballContent(
          this.server,
          packageId,
          row.version,
          row.name
        );
      } catch (error) {
        this.server.log.error({
          error: error instanceof Error ? error.message : String(error),
          packageName: row.name
        }, 'Failed to fetch content from S3');

        throw new Error(
          `Package content not available for ${row.name}. ` +
          `Failed to extract from storage: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      prompt,
      format: row.format,
      subtype: row.subtype,
      name: row.name,
    };
  }

  /**
   * Check if package should be mounted as Skill or Agent
   */
  private shouldMountAsSkill(subtype: string): boolean {
    return subtype === 'skill' || subtype === 'slash-command';
  }

  private shouldMountAsAgent(subtype: string): boolean {
    return subtype === 'agent';
  }

  /**
   * Estimate credits required for a playground run
   *
   * Token-based pricing: 1 credit = 5,000 tokens
   * Includes 30% buffer for response tokens
   *
   * Model multipliers based on API costs:
   * - Sonnet: $3/$15 per 1M tokens (base 1.0x)
   * - GPT-4o-mini: $0.60/$2.40 per 1M tokens (0.5x)
   * - GPT-4o: $5/$20 per 1M tokens (2.0x)
   * - Opus: $15/$75 per 1M tokens (5.0x)
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

    // Request size limits for financial protection
    const MAX_TOKENS_PER_REQUEST = 20000;
    if (estimatedTokens > MAX_TOKENS_PER_REQUEST) {
      throw new Error(
        `Request too large: ${Math.ceil(estimatedTokens)} tokens exceeds maximum of ${MAX_TOKENS_PER_REQUEST} tokens per request`
      );
    }

    // Token-based pricing: 1 credit per 5,000 tokens
    const TOKENS_PER_CREDIT = 5000;
    const baseCredits = Math.ceil(estimatedTokens / TOKENS_PER_CREDIT);

    // Model-specific multipliers based on actual API costs
    let modelMultiplier = 1.0;
    if (model === 'opus') {
      modelMultiplier = 5.0;  // Opus is 5x more expensive than Sonnet
    } else if (model === 'gpt-4o' || model === 'gpt-4-turbo') {
      modelMultiplier = 2.0;  // GPT-4o is ~2x Sonnet cost
    } else if (model === 'gpt-4o-mini') {
      modelMultiplier = 0.5;  // GPT-4o-mini is much cheaper
    }
    // Sonnet defaults to 1.0x

    return Math.max(1, Math.ceil(baseCredits * modelMultiplier));
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
      // 1. Load package prompt and metadata
      const packageData = await this.loadPackagePrompt(
        request.package_id,
        request.package_version
      );

      // Use empty prompt if comparing against "no prompt" mode (raw model baseline)
      const packagePrompt = request.use_no_prompt ? '' : packageData.prompt;

      // 2. Get or create session
      let session: any;
      if (request.session_id) {
        session = await this.getSession(request.session_id, userId);
        if (!session) {
          throw new Error('Conversation not found');
        }
      }

      const conversationHistory = session?.conversation || [];

      // 3. Estimate credits needed and API cost
      const model = request.model || 'sonnet';
      const estimatedCredits = this.estimateCredits(
        packagePrompt.length,
        request.input.length,
        model,
        conversationHistory
      );

      // Calculate estimated tokens and API cost
      const totalChars = packagePrompt.length + request.input.length +
        (conversationHistory.reduce((sum: number, msg: PlaygroundMessage) => sum + msg.content.length, 0));
      const estimatedTokens = (totalChars / 4) * 1.3; // 30% buffer

      const costEstimate = this.costMonitoring.calculateCost(estimatedTokens, model);

      // 4. Check if user can afford API cost (throttling check)
      const costCheck = await this.costMonitoring.canAffordRequest(userId, costEstimate.estimatedCost);
      if (!costCheck.allowed) {
        throw new Error(costCheck.reason || 'Request not allowed due to cost limits');
      }

      // 5. Check user can afford credits
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
          content: request.input,
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

        // Get model ID from centralized config
        modelName = getModelId(model);

        // Determine if we need filesystem mounting for Skills/Agents
        const needsSkillMount = this.shouldMountAsSkill(packageData.subtype);
        const needsAgentMount = this.shouldMountAsAgent(packageData.subtype);
        const needsFilesystemMount = needsSkillMount || needsAgentMount;

        let tempDir: string | null = null;

        try {
          // Build messages for Anthropic
          let anthropicMessages: Anthropic.MessageParam[] = [];

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
            content: request.input,
          });

          let totalTokens = 0;

          // If package is a skill/agent, mount it on filesystem and use SDK
          if (needsFilesystemMount) {
            // Create temp directory and write skill/agent
            tempDir = await this.createTempClaudeDirectory();

            if (needsSkillMount) {
              await this.writeSkillToFilesystem(tempDir, packageData.name, packageData.prompt);
            } else if (needsAgentMount) {
              await this.writeAgentToFilesystem(tempDir, packageData.name, packageData.prompt);
            }

            // Use Claude Agent SDK with proper filesystem mounting
            const queryOptions: any = {
              cwd: tempDir,
              settingSources: ['project'] as const,
              model: modelName,
              maxTurns: 10,
              allowDangerouslySkipPermissions: true, // For playground, bypass permission prompts
            };

            // For skills, enable Skill tool
            if (needsSkillMount) {
              queryOptions.allowedTools = ['Skill'];
            }

            // Build conversation context from history
            let promptText = request.input;
            if (conversationHistory.length > 0) {
              const historyText = conversationHistory
                .map((msg: PlaygroundMessage) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                .join('\n\n');
              promptText = `${historyText}\n\nUser: ${request.input}`;
            }

            // Execute with Claude Agent SDK
            const queryResult = claudeQuery({
              prompt: promptText,
              options: queryOptions,
            });

            // Collect all messages
            let assistantText = '';
            let tokens = 0;

            for await (const message of queryResult) {
              if (message.type === 'assistant') {
                // Extract text from assistant message
                for (const content of message.message.content) {
                  if (content.type === 'text') {
                    assistantText += content.text;
                  }
                }
              } else if (message.type === 'result') {
                // Get final result and usage
                if (message.subtype === 'success') {
                  assistantText = message.result || assistantText;
                } else {
                  // Handle error result types
                  assistantText = assistantText || `Error: ${message.errors?.join(', ')}`;
                }
                tokens = message.usage.input_tokens + message.usage.output_tokens;
                break;
              }
            }

            responseText = assistantText || 'No response generated';
            tokensUsed = tokens;
          } else {
            // Regular prompt execution without tools (regular prompts, rules, etc.)
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
        } finally {
          // Cleanup temp directory if created
          if (tempDir) {
            await this.cleanupTempDirectory(tempDir);
          }
        }
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
        content: request.input,
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
          packageId: request.package_id,
          packageVersion: request.package_version,
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
          packageId: request.package_id,
          model: modelName,
          tokensUsed,
          durationMs,
        }
      );

      // 9. Get user's organization (if any)
      const orgResult = await this.server.pg.query(
        `SELECT org_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      const orgId = orgResult.rows[0]?.org_id || null;

      // 10. Calculate and record actual API cost
      const actualCost = this.costMonitoring.calculateCost(tokensUsed, model);
      await this.costMonitoring.recordCost(userId, actualCost.estimatedCost, {
        sessionId,
        model: modelName,
        tokens: tokensUsed,
      });

      // 11. Log usage with analytics and cost tracking
      await this.logUsage({
        userId,
        orgId,
        packageId: request.package_id,
        sessionId,
        model: modelName,
        tokensUsed,
        durationMs,
        creditsSpent: estimatedCredits,
        packageVersion: request.package_version,
        inputLength: request.input.length,
        outputLength: responseText.length,
        comparisonMode: false, // Will be updated when comparison mode is implemented
        estimatedApiCost: actualCost.estimatedCost,
        actualInputTokens: actualCost.inputTokens,
        actualOutputTokens: actualCost.outputTokens,
      });

      // 12. Get updated balance
      const balance = await this.creditsService.getBalance(userId);

      this.server.log.info(
        {
          userId,
          packageId: request.package_id,
          sessionId,
          creditsSpent: estimatedCredits,
          creditsRemaining: balance.balance,
          tokensUsed,
          durationMs,
        },
        'Playground run completed successfully'
      );

      // Get the updated session to include conversation
      const updatedSession = await this.getSession(sessionId, userId);
      const conversation = updatedSession?.conversation || [];

      return {
        session_id: sessionId,
        response: responseText,
        credits_spent: estimatedCredits,
        credits_remaining: balance.balance,
        tokens_used: tokensUsed,
        duration_ms: durationMs,
        model: modelName,
        conversation,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.server.log.error(
        { error, userId, packageId: request.package_id, durationMs },
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
      user_id: row.user_id,
      org_id: row.org_id,
      package_id: row.package_id,
      package_version: row.package_version,
      package_name: row.package_name,
      conversation: row.conversation,
      credits_spent: row.credits_spent,
      estimated_tokens: row.estimated_tokens,
      model: row.model,
      total_tokens: row.total_tokens,
      total_duration_ms: row.total_duration_ms,
      run_count: row.run_count,
      is_public: row.is_public,
      share_token: row.share_token,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_run_at: row.last_run_at,
    };
  }

  /**
   * Share session publicly and generate share token
   */
  async shareSession(sessionId: string, userId: string): Promise<string> {
    const shareToken = nanoid(16);

    // Update the session to be public with share token
    const result = await this.server.pg.query(
      `UPDATE playground_sessions
       SET is_public = TRUE, share_token = $1, updated_at = NOW(), shared_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING share_token, is_comparison, comparison_session_id`,
      [shareToken, sessionId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Session not found or unauthorized');
    }

    const session = result.rows[0];

    // If this is a comparison session, also share the paired session
    if (session.is_comparison && session.comparison_session_id) {
      await this.server.pg.query(
        `UPDATE playground_sessions
         SET is_public = TRUE, share_token = $1, updated_at = NOW(), shared_at = NOW()
         WHERE id = $2 AND user_id = $3`,
        [shareToken, session.comparison_session_id, userId]
      );
    }

    return session.share_token;
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
      user_id: row.user_id,
      org_id: row.org_id,
      package_id: row.package_id,
      package_version: row.package_version,
      package_name: row.package_name,
      conversation: row.conversation,
      credits_spent: row.credits_spent,
      estimated_tokens: row.estimated_tokens,
      model: row.model,
      total_tokens: row.total_tokens,
      total_duration_ms: row.total_duration_ms,
      run_count: row.run_count,
      is_public: row.is_public,
      share_token: row.share_token,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_run_at: row.last_run_at,
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

    const sessions: PlaygroundSession[] = result.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      org_id: row.org_id,
      package_id: row.package_id,
      package_version: row.package_version,
      package_name: row.package_name,
      conversation: row.conversation,
      credits_spent: row.credits_spent,
      estimated_tokens: row.estimated_tokens,
      model: row.model,
      total_tokens: row.total_tokens,
      total_duration_ms: row.total_duration_ms,
      run_count: row.run_count,
      is_public: row.is_public,
      share_token: row.share_token,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_run_at: row.last_run_at,
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
    packageVersion?: string;
    inputLength?: number;
    outputLength?: number;
    comparisonMode?: boolean;
    orgId?: string;
    estimatedApiCost?: number;
    actualInputTokens?: number;
    actualOutputTokens?: number;
  }): Promise<void> {
    await this.server.pg.query(
      `INSERT INTO playground_usage
       (user_id, org_id, package_id, session_id, model, tokens_used, duration_ms, credits_spent,
        package_version, input_length, output_length, comparison_mode, estimated_api_cost, actual_input_tokens, actual_output_tokens)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        data.userId,
        data.orgId || null,
        data.packageId,
        data.sessionId,
        data.model,
        data.tokensUsed,
        data.durationMs,
        data.creditsSpent,
        data.packageVersion || null,
        data.inputLength || null,
        data.outputLength || null,
        data.comparisonMode || false,
        data.estimatedApiCost || null,
        data.actualInputTokens || null,
        data.actualOutputTokens || null,
      ]
    );
  }

  /**
   * Record a view on a shared result
   * Returns IP hash for tracking
   */
  async recordView(
    sessionId: string,
    viewerUserId: string | null,
    ip: string
  ): Promise<string> {
    // Create SHA-256 hash of IP for privacy
    const crypto = await import('crypto');
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Use the database function to record view and update counters
    await this.server.pg.query(
      `SELECT record_shared_result_view($1, $2, $3)`,
      [sessionId, viewerUserId, ipHash]
    );

    return ipHash;
  }

  /**
   * Record helpful/not-helpful feedback on shared result
   */
  async recordFeedback(
    sessionId: string,
    viewerUserId: string | null,
    ip: string,
    isHelpful: boolean,
    feedbackText?: string
  ): Promise<void> {
    // Create IP hash
    const crypto = await import('crypto');
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Find the most recent view by this user/IP
    const viewResult = await this.server.pg.query(
      `SELECT id FROM shared_result_views
       WHERE session_id = $1
         AND (
           ($2::uuid IS NOT NULL AND viewer_user_id = $2)
           OR ($3 IS NOT NULL AND ip_hash = $3)
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [sessionId, viewerUserId, ipHash]
    );

    if (viewResult.rows.length === 0) {
      throw new Error('No view record found. Please view the result first.');
    }

    const viewId = viewResult.rows[0].id;

    // Use the database function to record feedback and update counters
    await this.server.pg.query(
      `SELECT record_helpful_feedback($1, $2, $3, $4)`,
      [sessionId, viewId, isHelpful, feedbackText || null]
    );
  }

  /**
   * Get top shared results for a package
   */
  async getTopResultsForPackage(
    packageId: string,
    limit: number = 10,
    sort: 'popular' | 'recent' | 'helpful' = 'popular'
  ): Promise<{ results: any[]; total: number }> {
    let orderBy: string;
    switch (sort) {
      case 'popular':
        orderBy = 'view_count DESC, helpful_count DESC, shared_at DESC';
        break;
      case 'recent':
        orderBy = 'shared_at DESC';
        break;
      case 'helpful':
        orderBy = 'helpfulness_ratio DESC, helpful_count DESC';
        break;
      default:
        orderBy = 'view_count DESC';
    }

    const result = await this.server.pg.query(
      `SELECT
        session_id,
        share_token,
        package_name,
        package_version,
        model,
        view_count,
        helpful_count,
        not_helpful_count,
        helpfulness_ratio,
        user_input,
        assistant_response,
        credits_spent,
        total_tokens,
        shared_at,
        created_at
       FROM top_shared_results
       WHERE package_id = $1
         AND rank_by_popularity <= $2
       ORDER BY ${orderBy}
       LIMIT $2`,
      [packageId, limit]
    );

    // Also get total count of public results for this package
    const countResult = await this.server.pg.query(
      `SELECT COUNT(*) FROM playground_sessions
       WHERE package_id = $1 AND is_public = TRUE AND share_token IS NOT NULL`,
      [packageId]
    );

    return {
      results: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }
}
