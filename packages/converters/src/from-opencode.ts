/**
 * OpenCode Format Parser
 * Converts OpenCode agent format to canonical format
 *
 * OpenCode stores agents in .opencode/agent/${name}.md with YAML frontmatter
 * @see https://opencode.ai/docs/agents/
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
  description: string; // Required
  mode?: 'subagent' | 'primary' | 'all';
  model?: string;
  temperature?: number;
  tools?: OpencodeTools;
  permission?: OpencodePermission;
  disable?: boolean;
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
 * Convert OpenCode agent format to canonical format
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
  if (fm.mode || fm.model || fm.temperature !== undefined || fm.permission || fm.disable !== undefined) {
    metadataSection.data.opencode = {
      mode: fm.mode,
      model: fm.model,
      temperature: fm.temperature,
      permission: fm.permission,
      disable: fm.disable,
    };
  }

  sections.push(metadataSection);

  // Extract tools if present
  if (fm.tools) {
    const enabledTools = Object.entries(fm.tools)
      .filter(([_, enabled]) => enabled === true)
      .map(([tool, _]) => {
        // Normalize tool names to match canonical format
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
        return toolMap[tool.toLowerCase()] || tool;
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

  const pkg: CanonicalPackage = {
    ...metadata,
    id: metadata.id,
    name: metadata.name || metadata.id,
    version: metadata.version,
    author: metadata.author,
    description: metadata.description || fm.description || '',
    tags: metadata.tags || [],
    format: 'opencode',
    subtype: 'agent', // OpenCode only supports agents
    content: canonicalContent,
  };

  setTaxonomy(pkg, 'opencode', 'agent');
  return pkg;
}
