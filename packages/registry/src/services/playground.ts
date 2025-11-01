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
import { getTarballContent } from '../storage/s3.js';
import { nanoid } from 'nanoid';
import { getModelId, isAnthropicModel, isOpenAIModel } from '../config/models.js';
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
   * Convert package into a tool definition
   * If package is a skill/agent/slash-command, create a tool that wraps it
   */
  private packageAsToolDefinition(
    packageData: { prompt: string; format: string; subtype: string; name: string }
  ): Anthropic.Tool | null {
    // Only convert specific subtypes to tools
    const toolableSubtypes = ['skill', 'agent', 'slash-command'];
    if (!toolableSubtypes.includes(packageData.subtype)) {
      return null;
    }

    // Extract a tool name from package name (sanitize for tool naming)
    const toolName = packageData.name
      .replace(/@/g, '')
      .replace(/\//g, '_')
      .replace(/-/g, '_')
      .toLowerCase();

    // Determine tool description based on subtype
    let description = '';
    if (packageData.subtype === 'skill') {
      description = `A skill that can ${this.extractCapability(packageData.prompt)}`;
    } else if (packageData.subtype === 'agent') {
      description = `An agent that can ${this.extractCapability(packageData.prompt)}`;
    } else if (packageData.subtype === 'slash-command') {
      description = `A command that can ${this.extractCapability(packageData.prompt)}`;
    }

    return {
      name: toolName,
      description: description || `Execute the ${packageData.name} ${packageData.subtype}`,
      input_schema: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'The input or task to give to this skill/agent/command'
          }
        },
        required: ['input']
      }
    };
  }

  /**
   * Extract capability description from prompt
   * Looks for common patterns to describe what the skill does
   */
  private extractCapability(prompt: string): string {
    // Try to find first sentence or description
    const lines = prompt.split('\n').filter(l => l.trim().length > 0);

    // Look for description patterns
    for (const line of lines.slice(0, 10)) {
      const lower = line.toLowerCase();

      // Skip headers and metadata
      if (lower.startsWith('#') || lower.startsWith('title:') || lower.startsWith('author:')) {
        continue;
      }

      // Look for descriptive sentences
      if (lower.includes('you are') || lower.includes('this is') || lower.includes('helps')) {
        return line.trim().substring(0, 100);
      }
    }

    // Fallback: use first non-header line
    const firstLine = lines.find(l => !l.startsWith('#'));
    return firstLine ? firstLine.substring(0, 100) : 'perform a task';
  }

  /**
   * Execute a tool call by running the skill/agent/slash-command
   */
  private async executeTool(
    toolName: string,
    toolInput: any,
    packageData: { prompt: string; format: string; subtype: string; name: string },
    model: string
  ): Promise<string> {
    try {
      // Get model ID
      const modelId = getModelId(model);

      if (!this.anthropic) {
        throw new Error('Anthropic API not configured');
      }

      // Execute the skill/agent with the tool input
      const response = await this.anthropic.messages.create({
        model: modelId,
        max_tokens: 4096,
        temperature: 0.7,
        system: packageData.prompt,
        messages: [
          {
            role: 'user',
            content: toolInput.input || JSON.stringify(toolInput)
          }
        ]
      });

      const resultText = response.content[0].type === 'text'
        ? response.content[0].text
        : 'No response';

      return resultText;
    } catch (error: any) {
      return JSON.stringify({
        error: `Failed to execute ${packageData.subtype}: ${error.message}`
      });
    }
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
      // 1. Load package prompt and metadata
      const packageData = await this.loadPackagePrompt(
        request.package_id,
        request.package_version
      );
      const packagePrompt = packageData.prompt;

      // 2. Get or create session
      let session: any;
      if (request.session_id) {
        session = await this.getSession(request.session_id, userId);
        if (!session) {
          throw new Error('Conversation not found');
        }
      }

      const conversationHistory = session?.conversation || [];

      // 3. Estimate credits needed
      const model = request.model || 'sonnet';
      const estimatedCredits = this.estimateCredits(
        packagePrompt.length,
        request.input.length,
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

        // Check if this package should be converted to a tool (skill/agent/slash-command)
        const toolDefinition = this.packageAsToolDefinition(packageData);
        const isSkillAsTool = toolDefinition !== null;

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

        let finalResponse: string = '';
        let totalTokens = 0;

        // If it's a skill/agent/slash-command, make it available as a tool
        if (isSkillAsTool) {
          let continueLoop = true;
          let iterations = 0;
          const maxIterations = 5; // Prevent infinite loops

          // System prompt explains that Claude has access to this skill
          const systemWithTool = `You have access to a ${packageData.subtype} that you can use to help complete tasks.

When the user asks you to do something that this ${packageData.subtype} can help with, use it by calling the tool.

Otherwise, respond normally to the user.`;

          while (continueLoop && iterations < maxIterations) {
            iterations++;

            const response = await this.anthropic.messages.create({
              model: modelName,
              max_tokens: 4096,
              temperature: 0.7,
              system: systemWithTool,
              messages: anthropicMessages,
              tools: [toolDefinition],
            });

            totalTokens += response.usage.input_tokens + response.usage.output_tokens;

            // Process response content
            let hasToolUse = false;
            const assistantContent: Anthropic.ContentBlock[] = [];

            for (const content of response.content) {
              assistantContent.push(content);

              if (content.type === 'text') {
                finalResponse += content.text;
              } else if (content.type === 'tool_use') {
                hasToolUse = true;

                // Execute the skill/agent by running its prompt with the tool input
                const toolResult = await this.executeTool(
                  content.name,
                  content.input,
                  packageData,
                  model
                );

                // Add assistant message with tool use
                anthropicMessages.push({
                  role: 'assistant',
                  content: assistantContent,
                });

                // Add tool result
                anthropicMessages.push({
                  role: 'user',
                  content: [
                    {
                      type: 'tool_result',
                      tool_use_id: content.id,
                      content: toolResult,
                    },
                  ],
                });
              }
            }

            // If no tool use, we're done
            if (!hasToolUse || response.stop_reason === 'end_turn') {
              continueLoop = false;
            }
          }

          responseText = finalResponse || 'No response generated';
          tokensUsed = totalTokens;
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

      // 10. Log usage with analytics
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
      });

      // 10. Get updated balance
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
  }): Promise<void> {
    await this.server.pg.query(
      `INSERT INTO playground_usage
       (user_id, org_id, package_id, session_id, model, tokens_used, duration_ms, credits_spent,
        package_version, input_length, output_length, comparison_mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
      ]
    );
  }
}
