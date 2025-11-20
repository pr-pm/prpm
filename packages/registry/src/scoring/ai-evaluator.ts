/**
 * AI-Powered Prompt Quality Evaluator
 *
 * Uses Anthropic's Claude API to evaluate prompt content quality with expert analysis.
 * Scoring is heavily weighted against Anthropic's official Agent Skills best practices:
 * https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices
 *
 * Key Evaluation Criteria (from Anthropic guidelines):
 * - Conciseness (under 500 lines, assumes Claude intelligence)
 * - Progressive disclosure (references to separate files, one-level-deep)
 * - Description quality (third person, includes what AND when to use)
 * - Clear workflows (checklists, validation loops)
 * - Examples and patterns (concrete input/output examples)
 * - Terminology consistency (no time-sensitive info)
 *
 * Anti-patterns that reduce scores:
 * - Over-explaining concepts Claude already knows
 * - Too many options without guidance
 * - Vague naming (helper, utils)
 * - Missing "when to use" context
 */

import Anthropic from '@anthropic-ai/sdk';
import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { ANTHROPIC_MODELS } from '../config/models.js';
import type { CanonicalContent } from '../types/canonical.js';

export interface AIEvaluationResult {
  score: number; // 0.0 to 1.0 (maps to 1.0 points in quality algorithm)
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface EvaluationContext {
  format: string; // cursor, claude, windsurf, etc.
  subtype: string; // rule, skill, agent, slash-command, etc.
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
  content: CanonicalContent | string | undefined | any, // any for test compatibility with partial objects
  server: FastifyInstance,
  context?: EvaluationContext
): Promise<number> {
  // Check if AI evaluation is enabled and API key is configured
  if (!config.ai.evaluationEnabled || !config.ai.anthropicApiKey) {
    server.log.info('🤖 AI evaluation disabled, using heuristic scoring');
    return evaluatePromptHeuristic(content, server);
  }

  try {
    server.log.info({
      format: context?.format,
      subtype: context?.subtype
    }, '🤖 Starting AI prompt evaluation...');

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
      sectionCount: content?.sections?.length || 0,
      format: context?.format,
      subtype: context?.subtype
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
          content: buildEvaluationPrompt(promptText, content, context),
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
function extractPromptText(content: CanonicalContent | string | undefined | any): string {
  if (!content) return '';

  try {
    // Handle string content
    if (typeof content === 'string') {
      return content;
    }

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
 * Build evaluation prompt for Claude based on format and subtype
 */
function buildEvaluationPrompt(
  promptText: string,
  content: CanonicalContent | string | undefined,
  context?: EvaluationContext
): string {
  const format = context?.format || 'unknown';
  const subtype = context?.subtype || 'unknown';
  const promptLength = promptText.length;

  // Use format/subtype-specific evaluation
  if (format === 'claude' && subtype === 'skill') {
    return buildClaudeSkillEvaluation(promptText, promptLength);
  } else if (subtype === 'rule') {
    return buildRuleEvaluation(promptText, promptLength, format);
  } else if (subtype === 'slash-command' || subtype === 'prompt') {
    return buildCommandPromptEvaluation(promptText, promptLength, format);
  } else if (subtype === 'agent') {
    return buildAgentEvaluation(promptText, promptLength, format);
  } else {
    // Generic evaluation
    return buildGenericEvaluation(promptText, promptLength, format, subtype);
  }
}

/**
 * Claude Skill evaluation (Anthropic best practices)
 */
function buildClaudeSkillEvaluation(promptText: string, length: number): string {
  return `You are an expert evaluating Claude Agent Skills against Anthropic's official best practices.

Length: ${length} characters

Evaluate against Anthropic's Official Best Practices (https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices):

**CRITICAL CRITERIA (80% weight):**
1. **Conciseness (30%)** - Under 500 lines? Assumes Claude intelligence? No over-explaining?
2. **Progressive Disclosure (20%)** - References to separate files? One-level-deep structure?
3. **Description Quality (15%)** - Third person, includes WHAT and WHEN to use, specific triggers?
4. **Clear Workflows (15%)** - Sequential steps with checklists? Validation loops?

**SECONDARY CRITERIA (20% weight):**
5. **Examples & Patterns (10%)** - Concrete input/output examples? Templates?
6. **Terminology Consistency (5%)** - Same terms throughout? No time-sensitive info?
7. **Structure & Organization (5%)** - Logical flow? TOC for long files?

**ANTI-PATTERNS (score reductions):**
- Too many options without guidance (-0.2)
- Windows paths (-0.1)
- Time-sensitive info (-0.15)
- Over-explaining basics (-0.2)
- Vague naming (helper, utils) (-0.1)
- Missing "when to use" (-0.15)

**BONUS:** Utility scripts (+0.1), validation steps (+0.1), gerund naming (+0.05)

SKILL TO EVALUATE:
---
${promptText.slice(0, 8000)}
---

SCORE: [0.0-1.0, be strict, most should score 0.4-0.7]
REASONING: [2-3 sentences on Anthropic best practices]
STRENGTHS: [2-3 items following best practices]
WEAKNESSES: [2-3 violations, or "none"]`;
}

/**
 * Rule evaluation (Cursor, Windsurf, etc.)
 */
function buildRuleEvaluation(promptText: string, length: number, format: string): string {
  return `You are an expert evaluating coding rules for ${format.toUpperCase()}.

Length: ${length} characters

Evaluate coding rules quality:

**CRITICAL CRITERIA (70% weight):**
1. **Specificity (25%)** - Are rules specific and actionable vs vague guidance?
2. **Clarity (20%)** - Clear, unambiguous instructions the AI can follow?
3. **Completeness (15%)** - Covers key aspects (code style, patterns, anti-patterns)?
4. **Examples (10%)** - Concrete before/after examples?

**SECONDARY CRITERIA (30% weight):**
5. **Organization (10%)** - Logical grouping? Clear sections?
6. **Consistency (10%)** - Consistent terminology and style?
7. **Practicality (10%)** - Rules that actually help vs theoretical?

**WHAT TO LOOK FOR:**
- Specific patterns to follow/avoid
- Code examples showing good vs bad
- Technology-specific guidance (if applicable)
- Clear do's and don'ts
- Priority indicators (must/should/may)

**RED FLAGS:**
- Too generic ("write good code")
- Contradictory rules
- Outdated practices
- Missing examples
- Overly prescriptive for simple decisions

RULE TO EVALUATE:
---
${promptText.slice(0, 8000)}
---

SCORE: [0.0-1.0, most rules score 0.5-0.8]
REASONING: [why this score]
STRENGTHS: [what makes this effective]
WEAKNESSES: [what could improve, or "none"]`;
}

/**
 * Slash command / prompt evaluation
 */
function buildCommandPromptEvaluation(promptText: string, length: number, format: string): string {
  return `You are an expert evaluating slash commands/prompts for ${format.toUpperCase()}.

Length: ${length} characters

Evaluate command/prompt quality:

**CRITICAL CRITERIA (75% weight):**
1. **Purpose Clarity (25%)** - Is the command's purpose immediately clear?
2. **Instructions (25%)** - Clear, step-by-step guidance for AI?
3. **Output Format (15%)** - Specifies expected output structure?
4. **Examples (10%)** - Shows example usage/output?

**SECONDARY CRITERIA (25% weight):**
5. **Completeness (10%)** - Handles edge cases?
6. **Reusability (10%)** - Works across different contexts?
7. **Brevity (5%)** - Concise yet complete?

**WHAT TO LOOK FOR:**
- Clear command name and description
- Step-by-step instructions for AI
- Expected output format/structure
- Example usage or demonstrations
- Parameter/input specifications
- Error handling guidance

**RED FLAGS:**
- Ambiguous instructions
- Missing output specification
- No examples
- Overly complex for the task
- Assumes too much context

COMMAND/PROMPT TO EVALUATE:
---
${promptText.slice(0, 8000)}
---

SCORE: [0.0-1.0, most commands score 0.5-0.8]
REASONING: [why this score]
STRENGTHS: [what works well]
WEAKNESSES: [what needs improvement, or "none"]`;
}

/**
 * Agent evaluation
 */
function buildAgentEvaluation(promptText: string, length: number, format: string): string {
  return `You are an expert evaluating AI agents for ${format.toUpperCase()}.

Length: ${length} characters

Evaluate agent quality:

**CRITICAL CRITERIA (75% weight):**
1. **Role Definition (20%)** - Clear agent purpose and capabilities?
2. **System Prompt (25%)** - Effective system instructions?
3. **Tool/Action Definitions (15%)** - Clear tool specifications?
4. **Workflow Logic (15%)** - Decision-making and flow control?

**SECONDARY CRITERIA (25% weight):**
5. **Examples (10%)** - Usage demonstrations?
6. **Error Handling (10%)** - Handles failures gracefully?
7. **Documentation (5%)** - Clear setup/usage docs?

**WHAT TO LOOK FOR:**
- Clear agent role and responsibilities
- Detailed system prompt
- Tool definitions with parameters
- Decision logic and workflows
- Example interactions
- Error handling strategies
- Setup/configuration instructions

**RED FLAGS:**
- Vague agent purpose
- Missing tool definitions
- No workflow logic
- No error handling
- Overly complex for the task

AGENT TO EVALUATE:
---
${promptText.slice(0, 8000)}
---

SCORE: [0.0-1.0, most agents score 0.4-0.7]
REASONING: [why this score]
STRENGTHS: [what's well-designed]
WEAKNESSES: [what needs work, or "none"]`;
}

/**
 * Generic evaluation fallback
 */
function buildGenericEvaluation(promptText: string, length: number, format: string, subtype: string): string {
  return `You are an expert evaluating AI prompts/configurations.

Type: ${format} ${subtype}
Length: ${length} characters

Evaluate overall quality:

**CRITERIA (weighted equally):**
1. **Clarity (25%)** - Clear and unambiguous?
2. **Structure (25%)** - Well-organized and logical?
3. **Completeness (25%)** - Covers necessary aspects?
4. **Effectiveness (25%)** - Will produce good results?

**WHAT TO LOOK FOR:**
- Clear purpose and goals
- Logical organization
- Specific instructions
- Examples where helpful
- Consistent terminology
- Appropriate level of detail

**RED FLAGS:**
- Vague or ambiguous
- Poor organization
- Missing critical details
- No examples (where needed)
- Inconsistent style

CONTENT TO EVALUATE:
---
${promptText.slice(0, 8000)}
---

SCORE: [0.0-1.0, most content scores 0.5-0.7]
REASONING: [why this score]
STRENGTHS: [what works]
WEAKNESSES: [what to improve, or "none"]`;
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
function evaluatePromptHeuristic(
  content: CanonicalContent | string | undefined | any,
  server?: FastifyInstance
): number {
  if (!content) {
    server?.log.debug('Empty content provided for evaluation');
    return 0;
  }

  let score = 0;

  try {
    // Handle string content - basic length-based scoring
    if (typeof content === 'string') {
      const length = content.length;
      if (length > 5000) score += 0.8;
      else if (length > 2000) score += 0.6;
      else if (length > 500) score += 0.4;
      else if (length > 100) score += 0.2;
      return Math.min(score, 1.0);
    }

    // Handle canonical format
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
  content: CanonicalContent | string | undefined | any,
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
  content: CanonicalContent | string | undefined | any,
  existingMetadata: {
    language?: string;
    framework?: string;
    category?: string;
    tags?: string[];
    description?: string;
  },
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

/**
 * Generate a display name for a package using AI
 * Falls back to formatting the package name if AI is disabled or fails
 */
export async function generateDisplayName(
  packageName: string,
  description: string,
  content: CanonicalContent | string | undefined | any,
  server: FastifyInstance
): Promise<string> {
  // Fallback: format package name nicely (remove scope, capitalize words)
  const fallbackDisplayName = packageName
    .replace(/^@[^/]+\//, '') // Remove scope
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (!config.ai.evaluationEnabled || !config.ai.anthropicApiKey) {
    return fallbackDisplayName;
  }

  try {
    const anthropic = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });

    const promptText = extractPromptText(content);

    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 100,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Generate a concise, human-readable display name for this package. The display name should:
- Be 2-5 words maximum
- Be clear and descriptive
- Use title case
- NOT include version numbers, format names, or technical jargon
- Sound natural and professional

Package name: ${packageName}
Description: ${description}

Content preview (first 500 chars):
${promptText.substring(0, 500)}

Return ONLY the display name, nothing else. Example: "React TypeScript Rules" or "Python Testing Agent"`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : '';

    // Validate the response is reasonable (not too long, not empty)
    if (responseText && responseText.length > 0 && responseText.length <= 60 && !responseText.includes('\n')) {
      server.log.info({ packageName, displayName: responseText }, '✅ Generated display name with AI');
      return responseText;
    }

    server.log.warn({ packageName, responseText }, '⚠️  Invalid AI display name response, using fallback');
    return fallbackDisplayName;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    server.log.warn({ error: err.message, packageName }, '⚠️  AI display name generation failed, using fallback');
    return fallbackDisplayName;
  }
}
