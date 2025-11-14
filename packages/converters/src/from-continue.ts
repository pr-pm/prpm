/**
 * Continue Format Parser
 * Continue uses plain markdown without frontmatter
 */

import { fromClaude } from './from-claude.js';
import type { CanonicalPackage } from './types/canonical.js';

/**
 * Parse Continue format
 * Continue uses markdown with YAML frontmatter (similar to Claude)
 */
export function fromContinue(
  content: string,
  metadata: { id: string; name?: string; version?: string; author?: string; tags?: string[] }
): CanonicalPackage {
  // Use Claude parser but specify continue format for subtype detection
  const pkg = fromClaude(content, metadata, 'continue');

  // Override format to 'continue' (fromClaude returns 'claude')
  pkg.format = 'continue';
  pkg.sourceFormat = 'continue';

  return pkg;
}
