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
 *
 * NOTE: All format capabilities are loaded from data/format-capabilities.json
 * to avoid hardcoding format-specific logic.
 */

import type { Format, Subtype } from '@pr-pm/types';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Format capability definition
 */
export interface FormatCapability {
  name: string;
  supportsSkills: boolean;
  supportsPlugins: boolean;
  supportsExtensions: boolean;
  supportsAgents: boolean;
  supportsAgentsMd: boolean;
  markdownFallback?: string;
  notes?: string;
}

/**
 * Format capabilities data structure
 */
export interface FormatCapabilitiesData {
  version: string;
  description: string;
  formats: Record<string, FormatCapability>;
  agentsMdSupport: {
    description: string;
    formats: string[];
    notes?: string;
  };
}

/**
 * Load format capabilities from JSON file
 */
function loadFormatCapabilities(): FormatCapabilitiesData {
  try {
    const dataPath = join(__dirname, 'format-capabilities.json');
    const data = readFileSync(dataPath, 'utf-8');
    const parsed = JSON.parse(data);

    // Validate basic structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid format-capabilities.json: not an object');
    }
    if (!parsed.agentsMdSupport || !Array.isArray(parsed.agentsMdSupport.formats)) {
      throw new Error('Invalid format-capabilities.json: missing agentsMdSupport.formats array');
    }
    if (!parsed.formats || typeof parsed.formats !== 'object') {
      throw new Error('Invalid format-capabilities.json: missing formats object');
    }

    return parsed as FormatCapabilitiesData;
  } catch (error) {
    // Provide fallback minimal capabilities to prevent startup crash
    console.error(`Failed to load format-capabilities.json: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Using minimal fallback capabilities');
    return {
      version: '1.0.0',
      description: 'Minimal fallback capabilities due to load error',
      agentsMdSupport: {
        description: 'Basic agents.md support (fallback)',
        formats: ['cursor', 'copilot', 'windsurf', 'continue', 'kiro', 'droid', 'opencode', 'trae', 'zed', 'agents.md']
      },
      formats: {}
    };
  }
}

// Load capabilities once at module initialization
const capabilitiesData = loadFormatCapabilities();

/**
 * Formats that support agents.md for progressive disclosure
 *
 * Loaded dynamically from data/format-capabilities.json
 */
export const AGENTS_MD_SUPPORTED_FORMATS: readonly Format[] =
  capabilitiesData.agentsMdSupport.formats as Format[];

/**
 * Format capabilities - what subtypes each format supports
 *
 * Loaded dynamically from data/format-capabilities.json
 */
export const FORMAT_CAPABILITIES: Partial<Record<Format, {
  name?: string;
  supportsSkills?: boolean;
  supportsPlugins?: boolean;
  supportsExtensions?: boolean;
  supportsAgents?: boolean;
  supportsAgentsMd?: boolean;
  markdownFallback?: string;
}>> = capabilitiesData.formats as any;

/**
 * Check if a format supports agents.md for progressive disclosure
 *
 * Reads from data/format-capabilities.json agentsMdSupport section
 */
export function supportsAgentsMd(format: Format): boolean {
  return AGENTS_MD_SUPPORTED_FORMATS.includes(format);
}

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
 * Dynamically loaded from format-capabilities.json
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

  const capabilities = FORMAT_CAPABILITIES[format];

  // Primary: Native format
  chain.push({
    format,
    filename: capabilities?.markdownFallback || 'README.md',
    priority: 1,
    description: `Native ${format} format`,
  });

  // Secondary: Format-specific markdown (loaded from JSON)
  if (capabilities?.markdownFallback) {
    const fallbackFilename = capabilities.markdownFallback;
    const formatName = capabilities.name || format;

    chain.push({
      format: 'markdown',
      filename: fallbackFilename,
      priority: 2,
      description: `${formatName}-specific markdown format`,
    });
  }

  // Tertiary: agents.md (universal fallback for all formats)
  // Note: lowercase 'agents.md' for broader compatibility
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

/**
 * Get all format capabilities for inspection/debugging
 */
export function getAllFormatCapabilities(): FormatCapabilitiesData {
  return capabilitiesData;
}

/**
 * Get capability for a specific format
 */
export function getFormatCapability(format: Format): FormatCapability | undefined {
  return capabilitiesData.formats[format];
}
