/**
 * Codex Format Parser
 * Converts Agent Skills (SKILL.md format) to canonical format
 *
 * Based on the Agent Skills specification at agentskills.io
 *
 * Directory structure:
 * - .codex/skills/{skill-name}/SKILL.md (required)
 * - .codex/skills/{skill-name}/scripts/ (optional)
 * - .codex/skills/{skill-name}/references/ (optional)
 * - .codex/skills/{skill-name}/assets/ (optional)
 *
 * @see https://agentskills.io/specification
 * @see https://developers.openai.com/codex/skills
 */

import type {
  CanonicalPackage,
  PackageMetadata,
  Section,
  MetadataSection,
  ToolsSection,
} from './types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';
import yaml from 'js-yaml';

/**
 * Agent Skills frontmatter per agentskills.io specification
 */
interface AgentSkillsFrontmatter {
  // Required fields
  name: string; // 1-64 chars, lowercase alphanumeric and hyphens, must match parent dir
  description: string; // 1-1024 chars, explains what skill does and when to use it

  // Optional fields
  license?: string; // Licensing terms
  compatibility?: string; // Environment requirements (max 500 chars)
  'allowed-tools'?: string; // Space-delimited list of pre-approved tools (experimental)
  metadata?: Record<string, string>; // Arbitrary key-value pairs
}

/**
 * Parse YAML frontmatter from markdown
 * Handles both Unix (\n) and Windows (\r\n) line endings
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  // Normalize line endings (handle Windows CRLF)
  const normalizedContent = content.replace(/\r\n/g, '\n');

  const match = normalizedContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: normalizedContent };
  }

  try {
    const frontmatter = yaml.load(match[1]) as Record<string, any>;
    // Ensure frontmatter is an object
    if (typeof frontmatter !== 'object' || frontmatter === null) {
      return { frontmatter: {}, body: match[2] };
    }
    return { frontmatter, body: match[2] };
  } catch {
    // If YAML parsing fails, return empty frontmatter and full content as body
    return { frontmatter: {}, body: normalizedContent };
  }
}

/**
 * Parse allowed-tools string into array of tool names
 * Format: "Bash(git:*) Bash(jq:*) Read Write"
 */
function parseAllowedTools(toolsString: string): string[] {
  // Split by whitespace and extract tool names
  return toolsString
    .split(/\s+/)
    .filter(Boolean)
    .map(tool => {
      // Extract base tool name from patterns like "Bash(git:*)"
      const match = tool.match(/^([A-Za-z]+)(?:\([^)]*\))?$/);
      return match ? match[1] : tool;
    })
    // Deduplicate tool names
    .filter((tool, index, arr) => arr.indexOf(tool) === index);
}

/**
 * Convert Agent Skills format (SKILL.md) to canonical format
 *
 * @param content - Markdown content with YAML frontmatter
 * @param metadata - Package metadata
 */
export function fromCodex(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  const { frontmatter, body } = parseFrontmatter(content);
  const fm = frontmatter as AgentSkillsFrontmatter;

  const sections: Section[] = [];

  // Extract metadata from frontmatter
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: fm.name || metadata.name || metadata.id,
      description: fm.description || metadata.description || '',
      version: metadata.version || '1.0.0',
      author: metadata.author,
    },
  };

  // Store Agent Skills-specific data for roundtrip conversion
  metadataSection.data.agentSkills = {
    name: fm.name,
    license: fm.license,
    compatibility: fm.compatibility,
    allowedTools: fm['allowed-tools'],
    metadata: fm.metadata,
  };

  sections.push(metadataSection);

  // Extract tools from allowed-tools field
  if (fm['allowed-tools']) {
    const tools = parseAllowedTools(fm['allowed-tools']);
    if (tools.length > 0) {
      const toolsSection: ToolsSection = {
        type: 'tools',
        tools,
        description: 'Pre-approved tools for this skill',
      };
      sections.push(toolsSection);
    }
  }

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
    name: fm.name || metadata.name || metadata.id,
    version: metadata.version,
    author: metadata.author,
    description: fm.description || metadata.description || '',
    license: fm.license || metadata.license,
    tags: metadata.tags || [],
    format: 'codex',
    subtype: 'skill',
    content: canonicalContent,
  };

  setTaxonomy(pkg, 'codex', 'skill');
  return pkg;
}
