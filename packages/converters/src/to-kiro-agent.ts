/**
 * Kiro Agent Format Converter
 * Converts canonical format to Kiro agent configuration (.kiro/agents/*.json)
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
} from './types/canonical.js';

export interface KiroAgentConfig {
  name?: string;
  description?: string;
  prompt?: string;
  mcpServers?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    timeout?: number;
  }>;
  tools?: string[];
  toolAliases?: Record<string, string>;
  allowedTools?: string[];
  toolsSettings?: Record<string, any>;
  resources?: string[];
  hooks?: {
    agentSpawn?: string[];
    userPromptSubmit?: string[];
    preToolUse?: string[];
    postToolUse?: string[];
    stop?: string[];
  };
  useLegacyMcpJson?: boolean;
  model?: string;
}

/**
 * Convert canonical package to Kiro agent configuration
 */
export function toKiroAgent(
  pkg: CanonicalPackage,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    // Build agent configuration from canonical package
    const agentConfig: KiroAgentConfig = {
      name: pkg.name,
      description: pkg.description,
    };

    // Convert content to prompt
    const prompt = convertToPrompt(pkg.content, warnings);
    if (prompt) {
      agentConfig.prompt = prompt;
    }

    // Extract tools from metadata
    if (pkg.metadata?.tools && Array.isArray(pkg.metadata.tools)) {
      agentConfig.tools = pkg.metadata.tools.map((tool: any) =>
        typeof tool === 'string' ? tool : tool.name
      );
    }

    // Extract MCP servers if present
    if (pkg.metadata?.mcpServers) {
      agentConfig.mcpServers = pkg.metadata.mcpServers;
    }

    // Extract tool settings
    if (pkg.metadata?.toolsSettings) {
      agentConfig.toolsSettings = pkg.metadata.toolsSettings;
    }

    // Extract resources
    if (pkg.metadata?.resources && Array.isArray(pkg.metadata.resources)) {
      agentConfig.resources = pkg.metadata.resources;
    }

    // Extract hooks
    if (pkg.metadata?.hooks) {
      agentConfig.hooks = pkg.metadata.hooks;
    }

    // Extract model
    if (pkg.metadata?.model) {
      agentConfig.model = pkg.metadata.model;
    }

    // Warn about slash commands (not supported by Kiro agents)
    if (pkg.subtype === 'slash-command') {
      warnings.push('Slash commands are not directly supported by Kiro agents');
      qualityScore -= 20;
    }

    // Warn about skills (should be converted to prompts)
    if (pkg.subtype === 'skill') {
      warnings.push('Skills are converted to agent prompts - some features may be lost');
      qualityScore -= 10;
    }

    const content = JSON.stringify(agentConfig, null, 2);

    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('may be lost')
    );

    return {
      content,
      format: 'kiro',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore: Math.max(0, qualityScore),
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'kiro',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert canonical content to agent prompt
 */
function convertToPrompt(content: CanonicalContent, warnings: string[]): string {
  const parts: string[] = [];

  // Add description as context
  if (content.description) {
    parts.push(content.description);
  }

  // Add persona information
  if (content.persona) {
    const persona = content.persona;
    let personaText = '';

    if (persona.name) {
      personaText += `You are ${persona.name}`;
      if (persona.role) {
        personaText += `, ${persona.role}`;
      }
      personaText += '. ';
    }

    if (persona.style) {
      personaText += `Your communication style is ${persona.style}. `;
    }

    if (persona.expertise && persona.expertise.length > 0) {
      personaText += `You specialize in: ${persona.expertise.join(', ')}. `;
    }

    if (personaText) {
      parts.push(personaText.trim());
    }
  }

  // Add instructions
  if (content.instructions) {
    parts.push('\n## Instructions\n');
    parts.push(content.instructions);
  }

  // Add sections
  if (content.sections && content.sections.length > 0) {
    for (const section of content.sections) {
      if (section.title) {
        parts.push(`\n## ${section.title}\n`);
      }
      if (section.content) {
        parts.push(section.content);
      }
    }
  }

  // Add rules
  if (content.rules && content.rules.length > 0) {
    parts.push('\n## Rules\n');
    for (const rule of content.rules) {
      if (rule.title) {
        parts.push(`\n### ${rule.title}\n`);
      }
      if (rule.description) {
        parts.push(rule.description);
      }
    }
  }

  // Add examples
  if (content.examples && content.examples.length > 0) {
    parts.push('\n## Examples\n');
    for (const example of content.examples) {
      if (example.title) {
        parts.push(`\n### ${example.title}\n`);
      }
      if (example.description) {
        parts.push(example.description + '\n');
      }
      if (example.input) {
        parts.push(`Input:\n\`\`\`\n${example.input}\n\`\`\`\n`);
      }
      if (example.output) {
        parts.push(`Output:\n\`\`\`\n${example.output}\n\`\`\`\n`);
      }
    }
  }

  return parts.join('\n').trim();
}

/**
 * Check if content appears to be in Kiro agent format
 */
export function isKiroAgentFormat(content: string): boolean {
  try {
    const parsed = JSON.parse(content);

    // Must have either name or description
    if (!parsed.name && !parsed.description) {
      return false;
    }

    // Should have at least one of: prompt, tools, mcpServers
    return !!(parsed.prompt || parsed.tools || parsed.mcpServers);
  } catch {
    return false;
  }
}
