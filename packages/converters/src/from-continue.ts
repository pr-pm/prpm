/**
 * Continue Format Parser
 * Continue uses plain markdown without frontmatter
 */

import { fromClaude } from './from-claude.js';
import type { CanonicalPackage } from './types/canonical.js';
import type { Subtype } from './taxonomy-utils.js';

/**
 * Parse Continue format
 * Continue uses markdown with YAML frontmatter (similar to Claude)
 *
 * @param content - Markdown content with YAML frontmatter
 * @param metadata - Package metadata
 * @param explicitSubtype - Optional explicit subtype from file path (e.g., .continue/prompts/ → 'prompt')
 */
export function fromContinue(
  content: string,
  metadata: { id: string; name?: string; version?: string; author?: string; tags?: string[] },
  explicitSubtype?: Subtype
): CanonicalPackage {
  // Use Claude parser but specify continue format
  const pkg = fromClaude(content, metadata, 'continue', explicitSubtype);

  // Override format to 'continue' (fromClaude returns 'claude')
  pkg.format = 'continue';
  pkg.sourceFormat = 'continue';

  return pkg;
}
