/**
 * Amp Format Parser
 * Converts Amp skills, commands, and AGENTS.md to canonical format
 *
 * Amp stores:
 * - Skills in .agents/skills/{name}/SKILL.md with YAML frontmatter
 * - Commands in .agents/commands/{name}.md (markdown or executable)
 * - AGENTS.md in CWD, parent dirs, or ~/.config/amp/
 *
 * @see https://ampcode.com/manual
 */

import type {
  CanonicalPackage,
  PackageMetadata,
  Section,
  MetadataSection,
} from './types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';
import yaml from 'js-yaml';

interface AmpSkillFrontmatter {
  name: string; // Required
  description: string; // Required
  'argument-hint'?: string; // Optional hint for invocation
  'disable-model-invocation'?: boolean; // Optional, prevents auto-invocation
}

interface AmpCommandFrontmatter {
  description?: string; // Optional description
}

interface AmpAgentsFrontmatter {
  globs?: string | string[]; // Optional glob patterns for conditional inclusion
}

type AmpFrontmatter = AmpSkillFrontmatter | AmpCommandFrontmatter | AmpAgentsFrontmatter;

/**
 * Parse YAML frontmatter from markdown
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter = yaml.load(match[1]) as Record<string, any>;
  const body = match[2];

  return { frontmatter, body };
}

/**
 * Detect subtype based on frontmatter fields
 * - name + description → skill
 * - globs only or no frontmatter → rule/agent
 * - description only (no name) → slash-command
 */
function detectSubtype(frontmatter: Record<string, any>): 'skill' | 'slash-command' | 'rule' {
  // Skills have required name and description fields
  if (frontmatter.name && frontmatter.description) {
    return 'skill';
  }

  // Commands may have just description or no frontmatter
  // We'll detect commands by file path context (provided externally)
  // For now, if we have a description but no name, assume command
  if (frontmatter.description && !frontmatter.name) {
    return 'slash-command';
  }

  // AGENTS.md files have globs or no frontmatter
  return 'rule';
}

/**
 * Convert Amp format (skill, command, or AGENTS.md) to canonical format
 *
 * @param content - Markdown content with optional YAML frontmatter
 * @param metadata - Package metadata
 * @param subtypeHint - Optional hint for subtype detection (from file path)
 */
export function fromAmp(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>,
  subtypeHint?: 'skill' | 'slash-command' | 'rule'
): CanonicalPackage {
  const { frontmatter, body } = parseFrontmatter(content);
  const fm = frontmatter as AmpFrontmatter;

  const sections: Section[] = [];

  // Detect subtype from frontmatter or use hint
  const detectedSubtype = subtypeHint || detectSubtype(frontmatter);

  // Extract metadata from frontmatter
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: (fm as AmpSkillFrontmatter).name || metadata.name || metadata.id,
      description: (fm as AmpSkillFrontmatter | AmpCommandFrontmatter).description || metadata.description || '',
      version: metadata.version || '1.0.0',
      author: metadata.author,
    },
  };

  // Store Amp-specific data for roundtrip conversion
  const skillFm = fm as AmpSkillFrontmatter;
  const agentsFm = fm as AmpAgentsFrontmatter;

  if (detectedSubtype === 'skill') {
    // Skill-specific fields
    if (skillFm['argument-hint'] || skillFm['disable-model-invocation'] !== undefined) {
      metadataSection.data.amp = {
        argumentHint: skillFm['argument-hint'],
        disableModelInvocation: skillFm['disable-model-invocation'],
      };
    }
  } else if (agentsFm.globs) {
    // AGENTS.md with globs
    const globs = Array.isArray(agentsFm.globs) ? agentsFm.globs : [agentsFm.globs];
    metadataSection.data.amp = {
      globs,
    };
  }

  sections.push(metadataSection);

  // Add body as instructions
  if (body.trim()) {
    sections.push({
      type: 'instructions',
      title: 'Instructions',
      content: body.trim(),
    });
  }

  // Build canonical package
  const canonicalContent: CanonicalPackage['content'] = {
    format: 'canonical',
    version: '1.0',
    sections
  };

  const pkg: CanonicalPackage = {
    ...metadata,
    id: metadata.id,
    name: (fm as AmpSkillFrontmatter).name || metadata.name || metadata.id,
    version: metadata.version,
    author: metadata.author,
    description: metadata.description || (fm as AmpSkillFrontmatter).description || '',
    tags: metadata.tags || [],
    format: 'amp',
    subtype: detectedSubtype,
    content: canonicalContent,
  };

  setTaxonomy(pkg, 'amp', detectedSubtype);
  return pkg;
}
