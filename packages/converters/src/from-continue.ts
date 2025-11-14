/**
 * Continue Format Parser
 * Continue uses plain markdown without frontmatter
 */

import { fromClaude } from './from-claude.js';
import type { CanonicalPackage } from './types/canonical.js';

/**
 * Parse Continue format
 * Continue uses plain markdown without frontmatter (unlike Claude which has YAML frontmatter)
 */
export function fromContinue(
  content: string,
  metadata: { id: string; name?: string; version?: string; author?: string; tags?: string[] }
): CanonicalPackage {
  // Use Claude parser but override the format
  const pkg = fromClaude(content, metadata);

  // Override format to 'continue' (fromClaude returns 'claude')
  pkg.format = 'continue';
  pkg.sourceFormat = 'continue';

  return pkg;
}
