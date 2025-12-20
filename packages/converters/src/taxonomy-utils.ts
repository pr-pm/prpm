/**
 * Taxonomy utility functions
 * Helper functions for working with package format and subtype
 */

import type { CanonicalPackage, Format, Subtype } from './types/canonical.js';

// Re-export types from canonical for backwards compatibility
export type { Format, Subtype } from './types/canonical.js';

/**
 * CLI-supported formats for the convert command
 * This is the single source of truth for formats exposed via CLI
 * Add new formats here when converters are implemented
 */
export const CLI_SUPPORTED_FORMATS = [
  'cursor',
  'claude',
  'windsurf',
  'continue',
  'copilot',
  'kiro',
  'agents.md',
  'gemini',
  'ruler',
  'zed',
  'opencode',
  'aider',
  'trae',
  'replit',
  'zencoder',
  'droid',
  'codex',
  'amp',
] as const;

export type CLISupportedFormat = (typeof CLI_SUPPORTED_FORMATS)[number];

/**
 * Detect subtype from frontmatter fields
 *
 * Strategy:
 * 1. Check for explicit PRPM extension fields (agentType, skillType, commandType)
 *    - These exist for backwards compatibility with old packages
 * 2. Check for explicit 'type' field
 * 3. Default to 'rule'
 *
 * Note: Content-based detection (persona, tools, etc.) is unreliable and removed.
 * The CLI should determine subtype from file path context when converting/installing.
 *
 * @param frontmatter - YAML frontmatter fields
 * @param explicitSubtype - Optional explicit subtype from file path or caller context
 */
export function detectSubtypeFromFrontmatter(
  frontmatter: Record<string, any>,
  explicitSubtype?: Subtype
): Subtype {
  // Use explicit subtype if provided (from file path context)
  if (explicitSubtype) {
    return explicitSubtype;
  }

  // Check for explicit PRPM extension type fields (backwards compatibility)
  if (frontmatter.agentType === 'agent' || frontmatter.type === 'agent') {
    return 'agent';
  }
  if (frontmatter.skillType === 'skill' || frontmatter.type === 'skill') {
    return 'skill';
  }
  if (frontmatter.commandType === 'slash-command' || frontmatter.type === 'slash-command') {
    return 'slash-command';
  }

  // Default to rule - the CLI should provide explicit subtype from file path
  return 'rule';
}

/**
 * Set taxonomy fields on a canonical package
 */
export function setTaxonomy(
  pkg: Partial<CanonicalPackage>,
  format: Format,
  subtype?: Subtype
): void {
  pkg.format = format;
  pkg.subtype = subtype || 'rule';
}

/**
 * Detect format from source format string
 */
export function normalizeFormat(sourceFormat: string): Format {
  const normalized = sourceFormat.toLowerCase();

  // Note: cursor-hooks is not a separate format - use format: 'cursor', subtype: 'hook'
  if (normalized.includes('cursor')) return 'cursor';
  if (normalized.includes('claude')) return 'claude';
  if (normalized.includes('continue')) return 'continue';
  if (normalized.includes('windsurf')) return 'windsurf';
  if (normalized.includes('copilot')) return 'copilot';
  if (normalized.includes('kiro')) return 'kiro';
  if (normalized.includes('agents.md') || normalized.includes('agentsmd') || normalized.includes('agents-md')) return 'agents.md';
  if (normalized.includes('gemini')) return 'gemini';
  if (normalized.includes('opencode')) return 'opencode';
  if (normalized.includes('ruler')) return 'ruler';
  if (normalized.includes('droid') || normalized.includes('factory')) return 'droid';
  if (normalized.includes('trae')) return 'trae';
  if (normalized.includes('aider')) return 'aider';
  if (normalized.includes('zencoder')) return 'zencoder';
  if (normalized.includes('replit')) return 'replit';
  if (normalized.includes('zed')) return 'zed';
  if (normalized.includes('mcp')) return 'mcp';
  if (normalized.includes('amp')) return 'amp';

  return 'generic';
}
