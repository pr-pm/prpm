/**
 * Progressive Disclosure Utilities
 *
 * Logic for choosing the best format/subtype when a system doesn't support
 * advanced features like skills, plugins, or extensions.
 *
 * Fallback hierarchy:
 * - Specific subtype (skill, plugin, extension) → Generic markdown (.md variants)
 * - Claude skill → CLAUDE.md
 * - Gemini extension → GEMINI.md
 * - Generic → agents.md (universal)
 */

import type { Format, Subtype } from '@pr-pm/types';

/**
 * Formats that support agents.md for progressive disclosure
 *
 * These systems can intelligently use agents.md as a universal fallback
 * when they don't support advanced subtypes like skills or plugins.
 */
export const AGENTS_MD_SUPPORTED_FORMATS: readonly Format[] = [
  'claude',      // Claude Code supports agents.md
  'kiro',        // Kiro AI supports agents
  'opencode',    // OpenCode AI supports agents
  'ruler',       // Ruler supports agents
  'droid',       // Factory Droid supports agents
  'replit',      // Replit Agent supports agents.md
  'agents.md',   // Native agents.md format
  'generic',     // Generic format supports agents.md
] as const;

/**
 * Check if a format supports agents.md for progressive disclosure
 */
export function supportsAgentsMd(format: Format): boolean {
  return AGENTS_MD_SUPPORTED_FORMATS.includes(format);
}

/**
 * Format capabilities - what subtypes each format supports
 */
export const FORMAT_CAPABILITIES: Partial<Record<Format, {
  supportsSkills?: boolean;
  supportsPlugins?: boolean;
  supportsExtensions?: boolean;
  supportsAgents?: boolean;
  markdownFallback?: string;
}>> = {
  cursor: {
    supportsAgents: false,
    markdownFallback: 'cursor-rules.md',
  },
  claude: {
    supportsSkills: true,
    supportsPlugins: true,
    supportsAgents: true,
    markdownFallback: 'CLAUDE.md',
  },
  continue: {
    supportsAgents: false,
    markdownFallback: 'continue-prompts.md',
  },
  windsurf: {
    supportsAgents: false,
    markdownFallback: 'windsurf-rules.md',
  },
  copilot: {
    supportsAgents: false,
    markdownFallback: 'copilot-instructions.md',
  },
  kiro: {
    supportsAgents: true,
    markdownFallback: 'kiro-agent.md',
  },
  gemini: {
    supportsExtensions: true,
    markdownFallback: 'GEMINI.md',
  },
  opencode: {
    supportsAgents: true,
    markdownFallback: 'opencode-agent.md',
  },
  ruler: {
    supportsAgents: true,
    markdownFallback: 'ruler-rules.md',
  },
  droid: {
    supportsSkills: true,
    supportsAgents: true,
    markdownFallback: 'droid-skill.md',
  },
  trae: {
    supportsAgents: false,
    markdownFallback: 'trae-rules.md',
  },
  aider: {
    supportsAgents: false,
    markdownFallback: 'CONVENTIONS.md',
  },
  zencoder: {
    supportsAgents: false,
    markdownFallback: 'zencoder-rules.md',
  },
  replit: {
    supportsAgents: true,
    markdownFallback: 'replit_agent_instructions.md',
  },
  'agents.md': {
    supportsAgents: true,
    markdownFallback: 'agents.md',
  },
  mcp: {
    supportsPlugins: true,
    markdownFallback: 'mcp-server.json',
  },
  generic: {
    supportsAgents: true,
    markdownFallback: 'README.md',
  },
};

/**
 * Check if a format supports a specific subtype
 */
export function formatSupportsSubtype(format: Format, subtype: Subtype): boolean {
  const capabilities = FORMAT_CAPABILITIES[format];
  if (!capabilities) return false;

  switch (subtype) {
    case 'skill':
      return capabilities.supportsSkills || false;
    case 'plugin':
    case 'extension':
      return capabilities.supportsPlugins || capabilities.supportsExtensions || false;
    case 'agent':
      return capabilities.supportsAgents || false;
    default:
      return true; // Most formats support basic subtypes like rule, prompt, etc.
  }
}

/**
 * Determine if we should use markdown fallback for a conversion
 *
 * @param targetFormat - Target format to convert to
 * @param sourceSubtype - Source package subtype
 * @returns Object with shouldFallback flag and recommended format
 */
export function shouldUseMarkdownFallback(
  targetFormat: Format,
  sourceSubtype: Subtype
): {
  shouldFallback: boolean;
  fallbackFormat?: string;
  reason?: string;
} {
  const capabilities = FORMAT_CAPABILITIES[targetFormat];
  if (!capabilities) {
    return { shouldFallback: false };
  }

  // Check if target format supports the source subtype
  const supportsSubtype = formatSupportsSubtype(targetFormat, sourceSubtype);

  if (!supportsSubtype) {
    return {
      shouldFallback: true,
      fallbackFormat: capabilities.markdownFallback,
      reason: `${targetFormat} doesn't support ${sourceSubtype} subtype`,
    };
  }

  return { shouldFallback: false };
}

/**
 * Get recommended format for a conversion
 *
 * Returns either the native format or markdown fallback
 */
export function getRecommendedFormat(
  targetFormat: Format,
  sourceSubtype: Subtype
): {
  format: Format | 'markdown';
  subtype?: Subtype;
  filename?: string;
  useProgressive: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const fallback = shouldUseMarkdownFallback(targetFormat, sourceSubtype);

  if (fallback.shouldFallback) {
    warnings.push(
      `Progressive disclosure: Using ${fallback.fallbackFormat} because ${fallback.reason}`
    );

    return {
      format: 'markdown',
      filename: fallback.fallbackFormat,
      useProgressive: true,
      warnings,
    };
  }

  return {
    format: targetFormat,
    subtype: sourceSubtype,
    useProgressive: false,
    warnings,
  };
}

/**
 * Get universal fallback (agents.md) for maximum compatibility
 */
export function getUniversalFallback(): {
  format: 'markdown';
  filename: string;
  description: string;
} {
  return {
    format: 'markdown',
    filename: 'agents.md',
    description: 'Universal agent format - works with OpenAI, Gemini, Claude, and most AI systems',
  };
}

/**
 * Determine best fallback order for a format
 *
 * Returns an array of fallback options in priority order
 */
export function getFallbackChain(format: Format): Array<{
  format: Format | 'markdown';
  filename: string;
  priority: number;
  description: string;
}> {
  const chain: Array<{
    format: Format | 'markdown';
    filename: string;
    priority: number;
    description: string;
  }> = [];

  // Primary: Native format
  chain.push({
    format,
    filename: FORMAT_CAPABILITIES[format]?.markdownFallback || 'README.md',
    priority: 1,
    description: `Native ${format} format`,
  });

  // Secondary: Format-specific markdown
  if (format === 'claude') {
    chain.push({
      format: 'markdown',
      filename: 'CLAUDE.md',
      priority: 2,
      description: 'Claude-specific markdown format',
    });
  } else if (format === 'gemini') {
    chain.push({
      format: 'markdown',
      filename: 'GEMINI.md',
      priority: 2,
      description: 'Gemini-specific markdown format',
    });
  }

  // Tertiary: agents.md (universal)
  chain.push({
    format: 'markdown',
    filename: 'agents.md',
    priority: 3,
    description: 'Universal agents.md format',
  });

  return chain;
}

/**
 * Get conversion strategy with progressive disclosure
 *
 * This is the main function to use when planning a conversion
 */
export function getConversionStrategy(
  targetFormat: Format,
  sourceSubtype: Subtype,
  options?: {
    preferNative?: boolean;    // Prefer native format even if lossy
    forceMarkdown?: boolean;   // Always use markdown fallback
    preferUniversal?: boolean; // Use agents.md for max compatibility
  }
): {
  primaryFormat: Format | 'markdown';
  primaryFilename?: string;
  fallbackFormat?: 'markdown';
  fallbackFilename?: string;
  strategy: 'native' | 'progressive' | 'universal';
  warnings: string[];
  qualityScore: number; // 0-100
} {
  const warnings: string[] = [];
  let qualityScore = 100;

  // Force markdown if requested
  if (options?.forceMarkdown) {
    const capabilities = FORMAT_CAPABILITIES[targetFormat];
    return {
      primaryFormat: 'markdown',
      primaryFilename: capabilities?.markdownFallback,
      strategy: 'progressive',
      warnings: ['Forced markdown fallback as requested'],
      qualityScore: 80,
    };
  }

  // Universal fallback if requested
  if (options?.preferUniversal) {
    return {
      primaryFormat: 'markdown',
      primaryFilename: 'agents.md',
      strategy: 'universal',
      warnings: ['Using universal agents.md format for maximum compatibility'],
      qualityScore: 75,
    };
  }

  // Check if native format supports the subtype
  const recommendation = getRecommendedFormat(targetFormat, sourceSubtype);

  if (recommendation.useProgressive) {
    qualityScore -= 15; // Progressive disclosure has slightly lower quality
    return {
      primaryFormat: recommendation.format,
      primaryFilename: recommendation.filename,
      fallbackFormat: 'markdown',
      fallbackFilename: 'agents.md',
      strategy: 'progressive',
      warnings: recommendation.warnings,
      qualityScore,
    };
  }

  // Native format works
  return {
    primaryFormat: recommendation.format,
    strategy: 'native',
    warnings: [],
    qualityScore,
  };
}
