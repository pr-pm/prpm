/**
 * Cursor Format Parser
 * Cursor uses the same markdown format as Claude, but with cursor format
 */

import { fromClaude } from './from-claude.js';
import type { CanonicalPackage } from './types/canonical.js';

/**
 * Parse Cursor format
 * Cursor uses the same syntax as Claude but we need to set format='cursor'
 */
export function fromCursor(
  content: string,
  metadata: { id: string; name?: string; version?: string; author?: string; tags?: string[] }
): CanonicalPackage {
  // Use Claude parser but specify cursor format for subtype detection
  const pkg = fromClaude(content, metadata, 'cursor');

  // Override format to 'cursor' (fromClaude returns 'claude')
  pkg.format = 'cursor';
  pkg.sourceFormat = 'cursor';

  return pkg;
}
