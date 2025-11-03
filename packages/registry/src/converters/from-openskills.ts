/**
 * OpenSkills Format Parser
 * Converts OpenSkills SKILL.md format to canonical format
 *
 * OpenSkills uses YAML frontmatter with:
 * - name: skill identifier
 * - description: when to load this skill
 *
 * Body is markdown with instructions for AI agents
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  Section,
  MetadataSection,
  InstructionsSection,
} from '../types/canonical.js';

/**
 * Parse OpenSkills SKILL.md format into canonical format
 */
export function fromOpenSkills(
  content: string,
  metadata: {
    id: string;
    version?: string;
    author?: string;
    tags?: string[];
  }
): CanonicalPackage {
  const { frontmatter, body } = parseFrontmatter(content);

  const sections: Section[] = [];

  // Extract metadata from frontmatter
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: frontmatter.name || metadata.id,
      description: frontmatter.description || '',
      version: metadata.version || '1.0.0',
      author: metadata.author,
    },
  };
  sections.push(metadataSection);

  // Parse markdown body as instructions
  const bodyContent = body.trim();
  if (bodyContent) {
    // Extract H1 title if present
    const h1Match = bodyContent.match(/^#\s+(.+)$/m);
    if (h1Match) {
      metadataSection.data.title = h1Match[1].trim();
    }

    // Add entire body as instructions section
    const instructionsSection: InstructionsSection = {
      type: 'instructions',
      content: bodyContent,
    };
    sections.push(instructionsSection);
  }

  // OpenSkills packages are always skills
  const pkg: CanonicalPackage = {
    id: metadata.id,
    version: metadata.version || '1.0.0',
    name: frontmatter.name || metadata.id,
    description: frontmatter.description || '',
    author: metadata.author || 'unknown',
    tags: metadata.tags || [],
    format: 'openskills',
    subtype: 'skill',
    content: {
      format: 'canonical',
      version: '1.0',
      sections,
    },
    sourceFormat: 'openskills',
  };

  return pkg;
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      body: content,
    };
  }

  const [, frontmatterContent, body] = match;
  const frontmatter: Record<string, any> = {};

  // Simple YAML parser for key: value pairs
  const lines = frontmatterContent.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}
