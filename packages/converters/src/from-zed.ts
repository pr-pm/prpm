/**
 * Zed Format Parser
 * Zed uses plain markdown files (.rules) without frontmatter
 * Also reads .cursorrules, .windsurfrules, .clinerules, .github/copilot-instructions.md,
 * AGENT.md, AGENTS.md, CLAUDE.md, and GEMINI.md in priority order
 */

import type { CanonicalPackage, PackageMetadata } from './types/canonical.js';
import type { Subtype } from './taxonomy-utils.js';
import { fromAgentsMd } from './from-agents-md.js';

/**
 * Parse Zed format (.rules files)
 *
 * Zed uses plain markdown without frontmatter or special syntax.
 * Files are just markdown instructions for the AI assistant.
 * Since Zed uses the same plain markdown format as agents.md,
 * we reuse the agents.md parser.
 *
 * @param content - Plain markdown content
 * @param metadata - Package metadata
 * @param explicitSubtype - Optional explicit subtype
 */
export function fromZed(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>,
  explicitSubtype?: Subtype
): CanonicalPackage {
  // Use agents.md parser for plain markdown content
  const pkg = fromAgentsMd(content, metadata);

  // Override format to 'zed'
  pkg.format = 'zed';
  pkg.sourceFormat = 'zed';

  // Apply explicit subtype if provided
  if (explicitSubtype) {
    pkg.subtype = explicitSubtype;
  }

  return pkg;
}

/**
 * Detect if content is in Zed format
 *
 * Zed uses plain markdown, so this checks for:
 * - No YAML frontmatter (no --- markers)
 * - Standard markdown structure
 * - No JSON or other structured formats
 */
export function isZedFormat(content: string): boolean {
  const trimmed = content.trim();

  // Not Zed if it has YAML frontmatter
  if (trimmed.startsWith('---')) {
    return false;
  }

  // Not Zed if it's JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return false;
  }

  // Looks like plain markdown
  return true;
}
