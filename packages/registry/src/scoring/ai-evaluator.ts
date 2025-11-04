/**
 * AI-Powered Prompt Quality Evaluator
 *
 * Uses Anthropic's Claude API to evaluate prompt content quality with expert analysis.
 * Provides detailed scoring on clarity, structure, effectiveness, and best practices.
 */

import Anthropic from '@anthropic-ai/sdk';
import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { ANTHROPIC_MODELS } from '../config/models.js';

export interface AIEvaluationResult {
  score: number; // 0.0 to 1.0 (maps to 1.0 points in quality algorithm)
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface AIMetadataResult {
  language?: string;
  framework?: string;
  category?: string;
}

/**
 * Evaluate prompt content quality using Claude AI
 * Returns a score from 0.0 to 1.0
 */
export async function evaluatePromptWithAI(
  content: any,
  server: FastifyInstance
): Promise<number> {
  // Check if AI evaluation is enabled and API key is configured
  if (!config.ai.evaluationEnabled || !config.ai.anthropicApiKey) {
    server.log.info('🤖 AI evaluation disabled, using heuristic scoring');
    return evaluatePromptHeuristic(content, server);
  }

  try {
    server.log.info('🤖 Starting AI prompt evaluation...');

    const anthropic = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });

    // Extract text content for evaluation
    const promptText = extractPromptText(content);

    if (!promptText || promptText.length < 50) {
      server.log.info({
        promptLength: promptText?.length || 0,
        minRequired: 50
      }, '⚠️  Prompt too short for AI evaluation, using fallback');
      return evaluatePromptHeuristic(content, server);
    }

    server.log.info({
      promptLength: promptText.length,
      hasStructure: !!content?.sections,
      sectionCount: content?.sections?.length || 0
    }, '📊 Extracted prompt text for AI evaluation');

    // Call Claude API with structured evaluation prompt
    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: buildEvaluationPrompt(promptText, content),
        },
      ],
    });
    const duration = Date.now() - startTime;

    // Parse response and extract score
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    const result = parseEvaluationResponse(responseText);

    server.log.info(
      {
        score: result.score,
        reasoning: result.reasoning.substring(0, 100) + '...',
        strengths: result.strengths.length,
        weaknesses: result.weaknesses.length,
        promptLength: promptText.length,
        apiDuration: duration,
        hasStructure: !!content?.sections,
      },
      `✅ AI evaluation completed: ${result.score.toFixed(3)}/1.000 (${duration}ms)`
    );

    return result.score;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    server.log.warn(
      {
        error: err.message,
        errorType: err.name,
        stack: err.stack?.split('\n')[0]
      },
      '⚠️  AI evaluation failed, falling back to heuristic scoring'
    );
    return evaluatePromptHeuristic(content, server);
  }
}

/**
 * Extract readable text from canonical format or raw content
 */
function extractPromptText(content: any): string {
  if (!content) return '';

  try {
    // Handle canonical format
    if (content.sections && Array.isArray(content.sections)) {
      const sections = content.sections;
      let text = '';

      for (const section of sections) {
        // Add section title
        if (section.title) {
          text += `## ${section.title}\n\n`;
        }

        // Add section content based on type
        if (section.content) {
          text += `${section.content}\n\n`;
        }

        if (section.items && Array.isArray(section.items)) {
          text += section.items.map((item: any) =>
            typeof item === 'string' ? `- ${item}` : JSON.stringify(item)
          ).join('\n') + '\n\n';
        }

        if (section.rules && Array.isArray(section.rules)) {
          text += section.rules.map((rule: any) =>
            typeof rule === 'string' ? `- ${rule}` : JSON.stringify(rule)
          ).join('\n') + '\n\n';
        }

        if (section.examples && Array.isArray(section.examples)) {
          text += '### Examples\n';
          text += section.examples.map((ex: any) => {
            if (typeof ex === 'string') return ex;
            let exText = '';
            if (ex.title) exText += `**${ex.title}**\n`;
            if (ex.description) exText += `${ex.description}\n`;
            if (ex.code) exText += `\`\`\`\n${ex.code}\n\`\`\`\n`;
            return exText;
          }).join('\n') + '\n\n';
        }
      }

      return text.trim();
    }

    // Handle string content
    if (typeof content === 'string') {
      return content;
    }

    // Try to stringify object
    return JSON.stringify(content, null, 2);

  } catch (error) {
    return '';
  }
}

/**
 * Build evaluation prompt for Claude
 */
function buildEvaluationPrompt(promptText: string, content: any): string {
  const hasStructure = !!(content?.sections && Array.isArray(content.sections));
  const structureNote = hasStructure
    ? 'This prompt uses a structured canonical format with sections.'
    : 'This prompt is in plain text format.';

  return `You are an expert prompt engineer evaluating the quality of AI prompts for a package registry.

${structureNote}

Evaluate this prompt based on:
1. **Clarity** (25%) - Is it clear, unambiguous, and easy to understand?
2. **Structure** (25%) - Is it well-organized with logical flow?
3. **Effectiveness** (30%) - Will it produce reliable, high-quality outputs?
4. **Best Practices** (20%) - Does it follow prompt engineering best practices?

PROMPT TO EVALUATE:
---
${promptText.slice(0, 8000)}
---

Provide a score from 0.0 to 1.0 (where 1.0 is exceptional quality) in this EXACT format:

SCORE: [your decimal score]
REASONING: [2-3 sentences explaining the score]
STRENGTHS: [comma-separated list of 2-3 strengths]
WEAKNESSES: [comma-separated list of 2-3 weaknesses, or "none" if excellent]

Be concise and direct. Focus on actionable assessment.`;
}

/**
 * Parse Claude's evaluation response
 */
function parseEvaluationResponse(response: string): AIEvaluationResult {
  const scoreMatch = response.match(/SCORE:\s*([0-9.]+)/i);
  const reasoningMatch = response.match(/REASONING:\s*(.+?)(?=STRENGTHS:|$)/is);
  const strengthsMatch = response.match(/STRENGTHS:\s*(.+?)(?=WEAKNESSES:|$)/is);
  const weaknessesMatch = response.match(/WEAKNESSES:\s*(.+?)(?=$)/is);

  const score = scoreMatch
    ? Math.max(0, Math.min(1, parseFloat(scoreMatch[1])))
    : 0.5; // Default to middle if parsing fails

  const reasoning = reasoningMatch
    ? reasoningMatch[1].trim()
    : 'AI evaluation completed';

  const strengths = strengthsMatch
    ? strengthsMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0)
    : [];

  const weaknesses = weaknessesMatch
    ? weaknessesMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0 && s.toLowerCase() !== 'none')
    : [];

  return {
    score,
    reasoning,
    strengths,
    weaknesses,
    suggestions: [], // Could be expanded in future
  };
}

/**
 * Fallback heuristic evaluation when AI is unavailable
 * Uses same logic as scorePromptContent but returns 0-1 scale
 */
function evaluatePromptHeuristic(content: any, server?: FastifyInstance): number {
  if (!content) {
    server?.log.debug('Empty content provided for evaluation');
    return 0;
  }

  let score = 0;

  try {
    if (content.sections && Array.isArray(content.sections)) {
      const sections = content.sections;

      // Multiple sections (shows structure) - 0.3 max
      if (sections.length >= 5) score += 0.3;
      else if (sections.length >= 3) score += 0.2;
      else if (sections.length >= 1) score += 0.1;

      // Section type diversity - 0.2 max
      const sectionTypes = new Set(sections.map((s: any) => s.type));
      if (sectionTypes.size >= 4) score += 0.2;
      else if (sectionTypes.size >= 2) score += 0.1;

      // Total content length - 0.3 max
      let totalContentLength = 0;
      sections.forEach((section: any) => {
        if (section.content) totalContentLength += section.content.length;
        if (section.items) totalContentLength += JSON.stringify(section.items).length;
        if (section.rules) totalContentLength += JSON.stringify(section.rules).length;
        if (section.examples) totalContentLength += JSON.stringify(section.examples).length;
      });

      if (totalContentLength >= 2000) score += 0.3;
      else if (totalContentLength >= 1000) score += 0.2;
      else if (totalContentLength >= 500) score += 0.1;
      else if (totalContentLength >= 200) score += 0.05;

      // Has instructions/rules section - 0.2 max
      const hasInstructions = sections.some((s: any) =>
        s.type === 'instructions' || s.type === 'rules' || s.type === 'guidelines'
      );
      if (hasInstructions) score += 0.2;
    } else if (typeof content === 'string') {
      // Simple string content scoring
      const length = content.length;
      if (length >= 2000) score += 0.5;
      else if (length >= 1000) score += 0.3;
      else if (length >= 500) score += 0.2;
      else if (length >= 200) score += 0.1;
    }
  } catch (error) {
    return 0.1;
  }

  return Math.min(1.0, score);
}

/**
 * Get detailed AI evaluation (for debugging/admin purposes)
 */
export async function getDetailedAIEvaluation(
  content: any,
  server: FastifyInstance
): Promise<AIEvaluationResult> {
  if (!config.ai.evaluationEnabled || !config.ai.anthropicApiKey) {
    const score = evaluatePromptHeuristic(content);
    return {
      score,
      reasoning: 'Heuristic evaluation (AI disabled)',
      strengths: ['Structured content'],
      weaknesses: ['AI evaluation not available'],
      suggestions: ['Enable AI evaluation for detailed analysis'],
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });

    const promptText = extractPromptText(content);

    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 2048,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: buildEvaluationPrompt(promptText, content),
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    return parseEvaluationResponse(responseText);

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    server.log.error({ error: err.message }, 'Detailed AI evaluation failed');

    const fallbackScore = evaluatePromptHeuristic(content);
    return {
      score: fallbackScore,
      reasoning: `AI evaluation failed: ${err.message}`,
      strengths: [],
      weaknesses: ['AI evaluation error'],
      suggestions: ['Check API key and connectivity'],
    };
  }
}

/**
 * Extract metadata (language, framework, category) from package content using AI
 */
export async function extractMetadataWithAI(
  content: any,
  existingMetadata: { language?: string; framework?: string; category?: string; tags?: string[]; description?: string },
  server: FastifyInstance
): Promise<AIMetadataResult> {
  if (!config.ai.evaluationEnabled || !config.ai.anthropicApiKey) {
    return {};
  }

  try {
    const anthropic = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });

    const promptText = extractPromptText(content);
    const tags = existingMetadata.tags?.join(', ') || 'none';
    const description = existingMetadata.description || '';

    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 512,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Analyze this package and extract metadata. Return ONLY a JSON object with these fields (use null if not applicable):
{
  "language": "primary programming language (javascript, typescript, python, go, rust, java, csharp, php, ruby, swift, kotlin, or null)",
  "framework": "primary framework (react, nextjs, vue, angular, svelte, django, fastapi, flask, rails, laravel, express, nestjs, spring, dotnet, or null)",
  "category": "best category from this list: development, development/frontend, development/backend, development/fullstack, development/testing, development/debugging, development/code-review, development/refactoring, development/framework, data, data/analysis, data/ml, data/etl, security, security/audit, security/pentest, documentation, documentation/api, documentation/technical, framework, framework/frontend, framework/backend, framework/fullstack, workflow, workflow/agile, workflow/project-management, automation, automation/ci-cd, automation/deployment, automation/testing, or null"
}

Package description: ${description}
Tags: ${tags}

Content preview (first 1000 chars):
${promptText.substring(0, 1000)}

Return ONLY the JSON object, nothing else.`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      server.log.info({ extracted: result }, '🤖 Extracted metadata with AI');
      return {
        language: result.language || undefined,
        framework: result.framework || undefined,
        category: result.category || undefined,
      };
    }

    return {};

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    server.log.warn({ error: err.message }, '⚠️  AI metadata extraction failed');
    return {};
  }
}
