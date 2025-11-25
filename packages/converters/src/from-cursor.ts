/**
 * Cursor Format Parser
 * Cursor uses the same markdown format as Claude, but with cursor format
 */

import { fromClaude } from './from-claude.js';
import type { CanonicalPackage, PackageMetadata } from './types/canonical.js';
import type { Subtype } from './taxonomy-utils.js';

/**
 * Parse Cursor format
 * Cursor uses the same syntax as Claude but we need to set format='cursor'
 *
 * @param content - Markdown content with optional MDC frontmatter
 * @param metadata - Package metadata
 * @param explicitSubtype - Optional explicit subtype from file path (e.g., .cursor/commands/ → 'slash-command')
 */
export function fromCursor(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>,
  explicitSubtype?: Subtype
): CanonicalPackage {
  // Use Claude parser but specify cursor format
  const pkg = fromClaude(content, metadata, 'cursor', explicitSubtype);

  // Override format to 'cursor' (fromClaude returns 'claude')
  pkg.format = 'cursor';
  pkg.sourceFormat = 'cursor';

  return pkg;
}
