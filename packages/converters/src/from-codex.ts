/**
 * Codex Format Parser
 * Converts Agent Skills (SKILL.md format) to canonical format
 *
 * Based on the Agent Skills specification at agentskills.io
 *
 * Directory structure:
 * - .agents/skills/{skill-name}/SKILL.md (required)
 * - .agents/skills/{skill-name}/scripts/ (optional)
 * - .agents/skills/{skill-name}/references/ (optional)
 * - .agents/skills/{skill-name}/assets/ (optional)
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
import toml from '@iarna/toml';

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
 * Tolerates trailing spaces after --- and optional trailing newline
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  // Normalize line endings (handle Windows CRLF)
  const normalizedContent = content.replace(/\r\n/g, '\n');

  // More lenient regex: allows trailing spaces after ---, optional final newline
  const match = normalizedContent.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n([\s\S]*))?$/);
  if (!match) {
    return { frontmatter: {}, body: normalizedContent };
  }

  try {
    const frontmatter = yaml.load(match[1]) as Record<string, any>;
    // Ensure frontmatter is an object
    if (typeof frontmatter !== 'object' || frontmatter === null) {
      return { frontmatter: {}, body: match[2] || '' };
    }
    return { frontmatter, body: match[2] || '' };
  } catch {
    // If YAML parsing fails, return empty frontmatter and full content as body
    return { frontmatter: {}, body: normalizedContent };
  }
}

/**
 * Parse allowed-tools string into array of tool names
 * Format: "Bash(git:*) Bash(jq:*) Read Write"
 *
 * Tool names may contain letters, digits, hyphens, underscores, and dots.
 * Patterns like "Bash(git:*)" extract the base tool name "Bash".
 */
function parseAllowedTools(toolsString: string): string[] {
  // Split by whitespace and extract tool names
  return toolsString
    .split(/\s+/)
    .filter(Boolean)
    .map(tool => {
      // Extract base tool name from patterns like "Bash(git:*)" or "MCP_tool(pattern)"
      // Tool names can contain: letters, digits, hyphens, underscores, dots
      const match = tool.match(/^([A-Za-z0-9_.-]+)(?:\([^)]*\))?$/);
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

/**
 * Codex agent role TOML fields
 * @see https://developers.openai.com/codex/multi-agent/#agent-roles
 */
interface CodexAgentRoleToml {
  name?: string;
  description?: string;
  developer_instructions?: string;
  nickname_candidates?: string[];
  model?: string;
  model_reasoning_effort?: 'low' | 'medium' | 'high';
  sandbox_mode?: 'read-only' | 'workspace-write' | 'danger-full-access';
  mcp_servers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string> }>;
  skills?: { config?: Record<string, unknown>; [key: string]: unknown };
}

/**
 * Convert Codex agent role TOML format to canonical format
 *
 * Parses TOML files installed at ~/.codex/agents/<name>.toml
 * These configure specialized agent roles for Codex multi-agent workflows.
 *
 * @param content - TOML content of the agent role file
 * @param metadata - Package metadata
 * @see https://developers.openai.com/codex/multi-agent/#agent-roles
 */
export function fromCodexAgentRole(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  let role: CodexAgentRoleToml = {};

  try {
    role = toml.parse(content) as CodexAgentRoleToml;
  } catch {
    // If TOML parsing fails, treat as empty role with no fields
  }

  const sections: Section[] = [];

  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: role.name || metadata.name || metadata.id,
      description: role.description || metadata.description || '',
      version: metadata.version || '1.0.0',
      author: metadata.author,
    },
  };

  // Store codex-specific fields for roundtrip conversion
  metadataSection.data.codexAgent = {
    model: role.model,
    modelReasoningEffort: role.model_reasoning_effort,
    sandboxMode: role.sandbox_mode,
    name: role.name,
    description: role.description,
    nicknameCandidates: role.nickname_candidates,
    mcpServers: role.mcp_servers as Record<string, { command?: string; args?: string[]; env?: Record<string, string> }>,
    skillsConfig: role.skills?.config as Record<string, unknown>,
  };

  sections.push(metadataSection);

  // Map developer_instructions to an instructions section
  if (role.developer_instructions?.trim()) {
    sections.push({
      type: 'instructions',
      title: 'Instructions',
      content: role.developer_instructions.trim(),
    });
  }

  const canonicalContent: CanonicalPackage['content'] = {
    format: 'canonical',
    version: '1.0',
    sections,
  };

  const pkg: CanonicalPackage = {
    ...metadata,
    id: metadata.id,
    name: role.name || metadata.name || metadata.id,
    version: metadata.version,
    author: metadata.author,
    description: role.description || metadata.description || '',
    tags: metadata.tags || [],
    format: 'codex',
    subtype: 'agent',
    content: canonicalContent,
  };

  setTaxonomy(pkg, 'codex', 'agent');
  return pkg;
}
