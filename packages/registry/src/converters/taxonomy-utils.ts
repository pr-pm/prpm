/**
 * Taxonomy utility functions
 * Helps convert between old type-based taxonomy and new format+subtype taxonomy
 */

import type { CanonicalPackage } from '../types/canonical.js';

export type Format = 'cursor' | 'claude' | 'continue' | 'windsurf' | 'copilot' | 'kiro' | 'generic' | 'mcp';
export type Subtype = 'rule' | 'agent' | 'skill' | 'slash-command' | 'prompt' | 'workflow' | 'tool' | 'template' | 'collection';
export type LegacyType = 'cursor' | 'cursor-agent' | 'cursor-slash-command' | 'claude' | 'claude-skill' | 'claude-agent' | 'claude-slash-command' | 'continue' | 'windsurf' | 'copilot' | 'kiro' | 'generic' | 'mcp' | 'collection';

/**
 * Detect subtype from frontmatter fields
 */
export function detectSubtypeFromFrontmatter(frontmatter: Record<string, any>): Subtype | undefined {
  // Check for explicit type fields
  if (frontmatter.agentType === 'agent' || frontmatter.type === 'agent') {
    return 'agent';
  }
  if (frontmatter.skillType === 'skill' || frontmatter.type === 'skill') {
    return 'skill';
  }
  if (frontmatter.commandType === 'slash-command' || frontmatter.type === 'slash-command') {
    return 'slash-command';
  }

  // Check for tools (indicates agent)
  if (frontmatter.tools && frontmatter.tools.trim().length > 0) {
    return 'agent';
  }

  // Default to rule
  return 'rule';
}

/**
 * Convert format + subtype to legacy type
 */
export function toLegacyType(format: Format, subtype?: Subtype): LegacyType {
  if (subtype === 'collection') {
    return 'collection';
  }

  if (!subtype || subtype === 'rule' || subtype === 'prompt') {
    return format as LegacyType;
  }

  // Construct compound type for non-rule subtypes
  if (subtype === 'agent' && (format === 'cursor' || format === 'claude')) {
    return `${format}-agent` as LegacyType;
  }
  if (subtype === 'skill' && format === 'claude') {
    return 'claude-skill';
  }
  if (subtype === 'slash-command' && (format === 'cursor' || format === 'claude')) {
    return `${format}-slash-command` as LegacyType;
  }

  // Default to base format
  return format as LegacyType;
}

/**
 * Parse legacy type to format + subtype
 */
export function fromLegacyType(type: LegacyType): { format: Format; subtype?: Subtype } {
  // Handle collection separately
  if (type === 'collection') {
    return { format: 'generic', subtype: 'collection' };
  }

  // Handle MCP
  if (type === 'mcp') {
    return { format: 'mcp', subtype: 'tool' };
  }

  // Split compound types
  if (type.includes('-')) {
    const parts = type.split('-');
    const format = parts[0] as Format;
    const subtypeStr = parts.slice(1).join('-');

    // Map to proper subtype
    const subtypeMap: Record<string, Subtype> = {
      'agent': 'agent',
      'skill': 'skill',
      'slash-command': 'slash-command',
    };

    return { format, subtype: subtypeMap[subtypeStr] || 'rule' };
  }

  // Simple format types default to rule
  return { format: type as Format, subtype: 'rule' };
}

/**
 * Set taxonomy fields on a canonical package
 * Sets both new (format + subtype) and legacy (type) fields
 */
export function setTaxonomy(
  pkg: Partial<CanonicalPackage>,
  format: Format,
  subtype?: Subtype
): void {
  pkg.format = format;
  pkg.subtype = subtype || 'rule';
  pkg.type = toLegacyType(format, subtype);
}

/**
 * Detect format from source format string
 */
export function normalizeFormat(sourceFormat: string): Format {
  const normalized = sourceFormat.toLowerCase();

  if (normalized.includes('cursor')) return 'cursor';
  if (normalized.includes('claude')) return 'claude';
  if (normalized.includes('continue')) return 'continue';
  if (normalized.includes('windsurf')) return 'windsurf';
  if (normalized.includes('copilot')) return 'copilot';
  if (normalized.includes('kiro')) return 'kiro';
  if (normalized.includes('mcp')) return 'mcp';

  return 'generic';
}
