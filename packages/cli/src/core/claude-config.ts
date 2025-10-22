/**
 * Claude agent configuration utilities
 * Handles applying user config to Claude agent YAML frontmatter
 */

import type { ClaudeAgentConfig } from './user-config';

/**
 * Check if content has Claude agent YAML frontmatter
 */
export function hasClaudeHeader(content: string): boolean {
  return content.startsWith('---\n') && content.includes('name:');
}

/**
 * Apply user's Claude agent config to agent file
 * Merges user config with existing frontmatter, with user config taking precedence
 */
export function applyClaudeConfig(
  content: string,
  config: ClaudeAgentConfig
): string {
  if (!hasClaudeHeader(content)) {
    return content;
  }

  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return content;
  }

  const [, frontmatterText, body] = match;

  // Parse existing frontmatter
  const frontmatter: Record<string, string> = {};
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  });

  // Apply user config overrides
  if (config.tools !== undefined) {
    frontmatter.tools = config.tools;
  }

  if (config.model !== undefined) {
    frontmatter.model = config.model;
  }

  // Rebuild frontmatter
  const lines = ['---'];

  // Ensure required fields come first
  if (frontmatter.name) {
    lines.push(`name: ${frontmatter.name}`);
  }
  if (frontmatter.description) {
    lines.push(`description: ${frontmatter.description}`);
  }

  // Add optional fields
  const optionalFields = ['icon', 'tools', 'model'];
  for (const field of optionalFields) {
    if (frontmatter[field] && field !== 'name' && field !== 'description') {
      lines.push(`${field}: ${frontmatter[field]}`);
    }
  }

  // Add any other fields that might exist
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!['name', 'description', 'icon', 'tools', 'model'].includes(key)) {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---');

  return lines.join('\n') + '\n' + body;
}

/**
 * Parse Claude agent frontmatter
 */
export function parseClaudeFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, frontmatterText, body] = match;

  // Simple YAML parsing (for basic key: value pairs)
  const frontmatter: Record<string, string> = {};
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}
