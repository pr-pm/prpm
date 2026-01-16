/**
 * Package Format Conversion Service
 * Converts canonical packages to various target formats
 */

import { FastifyInstance } from 'fastify';
import {
  type CanonicalPackage,
  toCursor,
  toClaude,
  toContinue,
  toWindsurf,
  toCopilot,
  toKiro,
  toRuler,
  toAgentsMd,
  toGemini,
  toGeminiPlugin,
  toOpencode,
  toDroid,
  toTrae,
  toAider,
  toZencoder,
  toReplit,
  toCodex,
} from '@pr-pm/converters';
import type { Format } from '@pr-pm/types';

export interface ConversionResult {
  content: string;
  filename: string;
  contentType: string;
  warnings?: string[];
  lossyConversion?: boolean;
}

/**
 * Convert canonical package to target format
 */
export async function convertToFormat(
  server: FastifyInstance,
  canonicalPkg: CanonicalPackage,
  targetFormat: Format,
  options?: {
    applyConversionHints?: boolean;
  }
): Promise<ConversionResult> {
  server.log.debug(
    {
      packageName: canonicalPkg.name,
      sourceFormat: canonicalPkg.format,
      targetFormat,
    },
    'Converting package format'
  );

  let result;

  try {
    switch (targetFormat) {
      case 'cursor':
        result = toCursor(canonicalPkg);
        break;

      case 'claude':
        result = toClaude(canonicalPkg);
        break;

      case 'continue':
        result = toContinue(canonicalPkg);
        break;

      case 'windsurf':
        result = toWindsurf(canonicalPkg);
        break;

      case 'copilot':
        result = toCopilot(canonicalPkg);
        break;

      case 'kiro':
        result = toKiro(canonicalPkg);
        break;

      case 'ruler':
        result = toRuler(canonicalPkg);
        break;

      case 'agents.md':
        result = toAgentsMd(canonicalPkg);
        break;

      case 'gemini':
        // Check subtype: extension uses toGeminiPlugin, slash-command uses toGemini
        if (canonicalPkg.subtype === 'extension') {
          result = toGeminiPlugin(canonicalPkg);
        } else {
          result = toGemini(canonicalPkg);
        }
        break;

      case 'opencode':
        result = toOpencode(canonicalPkg);
        break;

      case 'droid':
        result = toDroid(canonicalPkg);
        break;

      case 'trae':
        result = toTrae(canonicalPkg);
        break;

      case 'aider':
        result = toAider(canonicalPkg);
        break;

      case 'zencoder':
        result = toZencoder(canonicalPkg);
        break;

      case 'replit':
        result = toReplit(canonicalPkg);
        break;

      case 'codex':
        result = toCodex(canonicalPkg);
        break;

      case 'generic':
        // Generic markdown - use the most compatible format
        result = toCursor(canonicalPkg);
        break;

      default:
        throw new Error(`Unsupported format: ${targetFormat}`);
    }

    return {
      content: result.content,
      filename: getFilenameForFormat(targetFormat, canonicalPkg.name, canonicalPkg.subtype),
      contentType: getContentTypeForFormat(targetFormat, canonicalPkg.subtype),
      warnings: result.warnings,
      lossyConversion: result.lossyConversion,
    };
  } catch (error: unknown) {
    server.log.error(
      {
        error: String(error),
        packageName: canonicalPkg.name,
        targetFormat,
      },
      'Failed to convert package format'
    );
    throw new Error(`Failed to convert to ${targetFormat} format`);
  }
}

/**
 * Get appropriate filename for target format
 */
function getFilenameForFormat(format: Format, packageName: string, subtype?: string): string {
  const baseName = packageName.split('/').pop() || 'package';

  switch (format) {
    case 'cursor':
      return '.cursorrules';

    case 'claude':
      // Skills go in .claude/skills/, agents in .claude/agents/
      return `${baseName}.md`;

    case 'continue':
      return `${baseName}.md`;

    case 'windsurf':
      return '.windsurfrules';

    case 'copilot':
      return '.github-copilot-instructions.md';

    case 'kiro':
      return `${baseName}.json`;

    case 'ruler':
      return `${baseName}.md`;

    case 'agents.md':
      return 'agents.md';

    case 'gemini':
      // Extensions use .json, slash-commands use .toml
      return subtype === 'extension' ? 'gemini-extension.json' : `${baseName}.toml`;

    case 'opencode':
      return `${baseName}.md`;

    case 'droid':
      return `${baseName}.md`;

    case 'trae':
      return `${baseName}.md`;

    case 'aider':
      return 'CONVENTIONS.md';

    case 'zencoder':
      return `${baseName}.md`;

    case 'replit':
      return 'replit_agent_instructions.md';

    case 'codex':
      // Skills use SKILL.md, other subtypes use AGENTS.md
      return subtype === 'skill' ? 'SKILL.md' : 'AGENTS.md';

    case 'generic':
    case 'mcp':
    default:
      return `${baseName}.md`;
  }
}

/**
 * Get content type for target format
 */
function getContentTypeForFormat(format: Format, subtype?: string): string {
  switch (format) {
    case 'kiro':
      return 'application/json';

    case 'gemini':
      // Extensions use JSON, slash-commands use TOML
      return subtype === 'extension' ? 'application/json' : 'text/toml';

    case 'cursor':
    case 'claude':
    case 'continue':
    case 'windsurf':
    case 'copilot':
    case 'ruler':
    case 'agents.md':
    case 'opencode':
    case 'droid':
    case 'trae':
    case 'aider':
    case 'zencoder':
    case 'replit':
    case 'codex':
    case 'generic':
    case 'mcp':
    default:
      return 'text/markdown';
  }
}

/**
 * Get file extension for format
 */
export function getExtensionForFormat(format: Format, subtype?: string): string {
  switch (format) {
    case 'kiro':
      return '.json';

    case 'cursor':
      return '.cursorrules';

    case 'windsurf':
      return '.windsurfrules';

    case 'gemini':
      // Extensions use .json, slash-commands use .toml
      return subtype === 'extension' ? '.json' : '.toml';

    default:
      return '.md';
  }
}

/**
 * Detect if conversion would be lossy
 * Warns users before converting
 */
export async function isLossyConversion(
  from: Format,
  to: Format
): Promise<boolean> {
  // Same format = no loss
  if (from === to) {
    return false;
  }

  // Known lossy conversions
  const lossyPairs = [
    // Agents -> Rules lose agent-specific features
    ['claude-agent', 'cursor'],
    ['kiro', 'cursor'],
    ['kiro', 'windsurf'],

    // Slash commands lose command structure
    ['claude-slash-command', 'cursor'],
    ['claude-slash-command', 'windsurf'],

    // Hooks lose executable code
    ['claude-hook', 'cursor'],
    ['claude-hook', 'copilot'],
  ];

  const pair = `${from}->${to}`;
  return lossyPairs.some(([f, t]) => pair.includes(f) && pair.includes(t));
}

/**
 * Get conversion quality score
 * 0-100, where 100 is perfect conversion
 */
export function getConversionQualityScore(
  from: Format,
  to: Format
): number {
  // Same format = perfect
  if (from === to) {
    return 100;
  }

  // Format compatibility matrix
  const compatibility: Record<string, Record<string, number>> = {
    cursor: {
      claude: 85,
      continue: 90,
      windsurf: 95,
      copilot: 80,
      ruler: 85,
    },
    claude: {
      cursor: 80,
      continue: 85,
      windsurf: 80,
      kiro: 90,
    },
    kiro: {
      claude: 85,
      cursor: 70,
    },
  };

  return compatibility[from]?.[to] ?? 75; // Default: 75% compatibility
}
