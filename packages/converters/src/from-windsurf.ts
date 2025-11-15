/**
 * Windsurf Rules Parser
 * Converts Windsurf .windsurf/rules format to canonical package format
 *
 * Windsurf uses a simple markdown format without special frontmatter.
 * File location: .windsurf/rules
 * Character limit: 12,000 characters per file
 */

import type {
  CanonicalPackage,
  Section,
  InstructionsSection,
} from './types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';

const MAX_WINDSURF_CHARS = 12000;

/**
 * Parse Windsurf rules file to canonical format
 */
export function fromWindsurf(
  content: string,
  metadata: {
    id: string;
    version?: string;
    author?: string;
    tags?: string[];
  }
): CanonicalPackage {
  const sections: Section[] = [];
  const trimmedContent = content.trim();

  // Validate character limit (Windsurf has a 12,000 character limit)
  if (trimmedContent.length > MAX_WINDSURF_CHARS) {
    console.warn(
      `Warning: Windsurf rules file exceeds ${MAX_WINDSURF_CHARS} character limit (${trimmedContent.length} characters). Content may be truncated by Windsurf.`
    );
  }

  // Windsurf format is simple markdown - just treat the whole content as instructions
  const instructionsSection: InstructionsSection = {
    type: 'instructions',
    title: 'Windsurf Rules',
    content: trimmedContent,
  };

  sections.push(instructionsSection);

  // Build canonical package
  const pkg: Partial<CanonicalPackage> = {
    id: metadata.id,
    name: metadata.id,
    version: metadata.version || '1.0.0',
    description: 'Windsurf rules',
    author: metadata.author || 'unknown',
    tags: metadata.tags || [],
    sourceFormat: 'windsurf',
    content: {
      format: 'canonical',
      version: '1.0',
      sections,
    },
    metadata: {
      title: metadata.id,
      description: 'Windsurf rules',
    },
  };

  // Set taxonomy (format + subtype)
  // Windsurf rules are rules by default
  setTaxonomy(pkg, 'windsurf', 'rule');

  return pkg as CanonicalPackage;
}

/**
 * Check if content matches Windsurf format
 * (Simple markdown without YAML frontmatter)
 */
export function isWindsurfFormat(content: string): boolean {
  const trimmed = content.trim();

  // Check if it starts with frontmatter (---) - if so, it's not Windsurf
  if (trimmed.startsWith('---')) {
    return false;
  }

  // Windsurf format is just plain markdown
  // Check for common markdown patterns
  const hasMarkdown = /^#+ /.test(trimmed) || // Headers
                      /^- /.test(trimmed) ||   // Lists
                      /^[0-9]+\. /.test(trimmed); // Numbered lists

  return hasMarkdown || trimmed.length > 0;
}
