/**
 * OpenCode Format Parser
 * Converts OpenCode agents, skills, and slash commands to canonical format
 *
 * OpenCode stores:
 * - Agents in .opencode/agent/${name}.md with YAML frontmatter
 * - Skills in .opencode/skill/${name}/SKILL.md with YAML frontmatter (has 'name' field, Agent Skills spec)
 * - Slash commands in .opencode/command/${name}.md with YAML frontmatter (has 'template' field)
 *
 * @see https://opencode.ai/docs/agents/
 * @see https://opencode.ai/docs/skills/
 * @see https://opencode.ai/docs/commands/
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

interface OpencodeTools {
  write?: boolean;
  edit?: boolean;
  bash?: boolean;
  read?: boolean;
  grep?: boolean;
  glob?: boolean;
  webfetch?: boolean;
  websearch?: boolean;
  [key: string]: boolean | undefined;
}

interface OpencodePermission {
  edit?: 'ask' | 'allow' | 'deny';
  bash?: 'ask' | 'allow' | 'deny' | Record<string, unknown>;
  webfetch?: 'ask' | 'allow' | 'deny';
  [key: string]: 'ask' | 'allow' | 'deny' | Record<string, unknown> | undefined;
}

interface OpencodeFrontmatter {
  description?: string; // Required for agents and skills
  mode?: 'subagent' | 'primary' | 'all';
  model?: string;
  temperature?: number;
  prompt?: string; // Path to custom system prompt file using {file:./path} syntax
  maxSteps?: number; // Iteration limit - unlimited if unset
  tools?: OpencodeTools;
  permission?: OpencodePermission;
  disable?: boolean;
  // Slash command specific fields
  template?: string; // Required for slash commands
  agent?: string;
  subtask?: boolean;
  // Skill specific fields (Agent Skills spec)
  name?: string; // Required for skills: 1-64 chars, lowercase alphanumeric with hyphens
  license?: string;
  compatibility?: string;
  'allowed-tools'?: string; // Space-delimited list of pre-approved tools
  metadata?: Record<string, string>; // Arbitrary string key-value pairs
}

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
 * Convert OpenCode format (agent, skill, or slash command) to canonical format
 *
 * Automatically detects subtype based on frontmatter fields:
 * - If 'template' exists → slash-command
 * - If 'name' exists (Agent Skills spec) → skill
 * - Otherwise → agent
 *
 * @param content - Markdown content with YAML frontmatter
 * @param metadata - Package metadata
 */
export function fromOpencode(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  const { frontmatter, body } = parseFrontmatter(content);
  const fm = frontmatter as OpencodeFrontmatter;

  const sections: Section[] = [];

  // Extract metadata from frontmatter
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: metadata.name || metadata.id,
      description: fm.description || metadata.description || '',
      version: metadata.version || '1.0.0',
      author: metadata.author,
    },
  };

  // Store OpenCode-specific data for roundtrip conversion
  // For agents: store mode, model, temperature, prompt, maxSteps, permission, disable
  if (fm.mode || fm.model || fm.temperature !== undefined || fm.prompt || fm.maxSteps !== undefined || fm.permission || fm.disable !== undefined) {
    metadataSection.data.opencode = {
      mode: fm.mode,
      model: fm.model,
      temperature: fm.temperature,
      prompt: fm.prompt,
      maxSteps: fm.maxSteps,
      permission: fm.permission,
      disable: fm.disable,
    };
  }

  // For slash commands: store template, agent, model, subtask
  if (fm.template) {
    metadataSection.data.opencodeSlashCommand = {
      template: fm.template,
      description: fm.description,
      agent: fm.agent,
      model: fm.model,
      subtask: fm.subtask,
    };
  }

  // For skills (Agent Skills spec): store name, license, compatibility, allowed-tools, metadata
  // Use consistent check with skill detection (line ~205)
  if (typeof fm.name === 'string' && fm.name.trim().length > 0) {
    metadataSection.data.agentSkills = {
      name: fm.name,
      license: fm.license,
      compatibility: fm.compatibility,
      allowedTools: fm['allowed-tools'],
      metadata: fm.metadata,
    };
  }

  sections.push(metadataSection);

  // Extract tools if present
  if (fm.tools) {
    const enabledTools = Object.entries(fm.tools)
      .filter(([_, enabled]) => enabled === true)
      .map(([tool, _]) => {
        // Normalize tool names to match canonical format (PascalCase)
        const toolMap: Record<string, string> = {
          'write': 'Write',
          'edit': 'Edit',
          'bash': 'Bash',
          'read': 'Read',
          'grep': 'Grep',
          'glob': 'Glob',
          'webfetch': 'WebFetch',
          'websearch': 'WebSearch',
        };
        const normalized = toolMap[tool.toLowerCase()];
        if (normalized) {
          return normalized;
        }
        // For unknown tools, normalize to PascalCase for consistency
        return tool.charAt(0).toUpperCase() + tool.slice(1).toLowerCase();
      });

    if (enabledTools.length > 0) {
      const toolsSection: ToolsSection = {
        type: 'tools',
        tools: enabledTools,
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

  // Detect subtype based on frontmatter fields:
  // 1. If 'template' field exists and is non-empty → slash-command
  // 2. If 'name' field exists (Agent Skills spec) → skill
  // 3. Otherwise → agent
  const templateValue = fm.template;
  const isSlashCommand = typeof templateValue === 'string' && templateValue.trim().length > 0;
  const isSkill = typeof fm.name === 'string' && fm.name.trim().length > 0;
  const detectedSubtype = isSlashCommand ? 'slash-command' : isSkill ? 'skill' : 'agent';

  const pkg: CanonicalPackage = {
    ...metadata,
    id: metadata.id,
    name: metadata.name || metadata.id,
    version: metadata.version,
    author: metadata.author,
    description: metadata.description || fm.description || '',
    tags: metadata.tags || [],
    format: 'opencode',
    subtype: detectedSubtype,
    content: canonicalContent,
  };

  setTaxonomy(pkg, 'opencode', detectedSubtype);
  return pkg;
}
