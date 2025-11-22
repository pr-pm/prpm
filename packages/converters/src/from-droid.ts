import type {
  CanonicalPackage,
  PackageMetadata,
  Section,
  MetadataSection,
} from './types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';
import yaml from 'js-yaml';

/**
 * Factory Droid frontmatter structure
 * Used for skills, slash commands, and hooks
 */
interface DroidFrontmatter {
  name: string;
  description: string;
  'argument-hint'?: string;
  'allowed-tools'?: string[];
  [key: string]: any; // Allow additional fields
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter = yaml.load(match[1]) as Record<string, any>;
  const body = match[2];

  return { frontmatter, body };
}

/**
 * Detect subtype based on content and context
 */
function detectSubtype(frontmatter: DroidFrontmatter, body: string, metadata: Partial<PackageMetadata>): 'skill' | 'slash-command' | 'hook' {
  // Check if metadata specifies subtype
  if (metadata && 'subtype' in metadata) {
    const subtype = (metadata as any).subtype;
    if (subtype === 'skill' || subtype === 'slash-command' || subtype === 'hook') {
      return subtype;
    }
  }

  // Check for slash command indicators
  if (frontmatter['argument-hint']) {
    return 'slash-command';
  }

  // Check for hook indicators in body content
  const hookPatterns = [
    /hook.*event/i,
    /pre.*tool.*use/i,
    /post.*tool.*use/i,
    /session.*start/i,
    /user.*prompt.*submit/i,
  ];

  if (hookPatterns.some(pattern => pattern.test(body))) {
    return 'hook';
  }

  // Default to skill
  return 'skill';
}

/**
 * Convert Factory Droid format to canonical format
 *
 * Factory Droid supports:
 * - Skills: .factory/skills/<skill-name>/SKILL.md
 * - Slash Commands: .factory/commands/*.md (or executables)
 * - Hooks: .factory/hooks.json (configuration-based)
 *
 * @param content - Factory Droid markdown content
 * @param metadata - Package metadata
 * @returns Canonical package
 */
export function fromDroid(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  const { frontmatter, body } = parseFrontmatter(content);
  const fm = frontmatter as DroidFrontmatter;

  const sections: Section[] = [];

  // Detect subtype
  const subtype = detectSubtype(fm, body, metadata);

  // 1. Create metadata section
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: fm.name || metadata.name || metadata.id,
      description: fm.description || metadata.description || '',
      version: metadata.version || '1.0.0',
      author: metadata.author,
    },
  };

  // Store Factory Droid-specific data for roundtrip conversion
  if (fm['argument-hint'] || fm['allowed-tools']) {
    metadataSection.data.droid = {
      argumentHint: fm['argument-hint'],
      allowedTools: fm['allowed-tools'],
    };
  }

  sections.push(metadataSection);

  // 2. Add body as instructions
  if (body.trim()) {
    sections.push({
      type: 'instructions',
      title: fm.name || 'Instructions',
      content: body.trim(),
    });
  }

  // 3. Build canonical package
  const canonicalContent: CanonicalPackage['content'] = {
    format: 'canonical',
    version: '1.0',
    sections,
  };

  const pkg: CanonicalPackage = {
    ...metadata,
    id: metadata.id,
    name: metadata.name || metadata.id,
    version: metadata.version,
    author: metadata.author,
    description: metadata.description || fm.description || '',
    tags: metadata.tags || [],
    format: 'droid',
    subtype,
    content: canonicalContent,
  };

  // Store droid metadata for easier access
  if (fm['argument-hint'] || fm['allowed-tools']) {
    pkg.metadata = {
      title: fm.name,
      description: fm.description,
      droid: {
        argumentHint: fm['argument-hint'],
        allowedTools: fm['allowed-tools'],
      },
    };
  }

  setTaxonomy(pkg, 'droid', subtype);
  return pkg;
}
