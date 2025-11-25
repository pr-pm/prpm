/**
 * Kiro Agent Format Converter
 * Converts canonical format to Kiro agent configuration (.kiro/agents/*.json)
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
  MetadataSection,
  PersonaSection,
  InstructionsSection,
  RulesSection,
  ExamplesSection,
  CustomSection,
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

    // Extract Kiro-specific agent properties from metadata
    if (pkg.metadata?.kiroAgent) {
      const kiroAgent = pkg.metadata.kiroAgent;

      if (kiroAgent.tools) {
        agentConfig.tools = kiroAgent.tools;
      }

      if (kiroAgent.mcpServers) {
        agentConfig.mcpServers = kiroAgent.mcpServers;
      }

      if (kiroAgent.toolAliases) {
        agentConfig.toolAliases = kiroAgent.toolAliases;
      }

      if (kiroAgent.allowedTools) {
        agentConfig.allowedTools = kiroAgent.allowedTools;
      }

      if (kiroAgent.toolsSettings) {
        agentConfig.toolsSettings = kiroAgent.toolsSettings;
      }

      if (kiroAgent.resources) {
        agentConfig.resources = kiroAgent.resources;
      }

      if (kiroAgent.hooks) {
        agentConfig.hooks = kiroAgent.hooks;
      }

      if (kiroAgent.useLegacyMcpJson !== undefined) {
        agentConfig.useLegacyMcpJson = kiroAgent.useLegacyMcpJson;
      }

      if (kiroAgent.model) {
        agentConfig.model = kiroAgent.model;
      }
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

  // Extract metadata section for description
  const metadataSection = content.sections.find(s => s.type === 'metadata') as MetadataSection | undefined;
  if (metadataSection?.data.description) {
    parts.push(metadataSection.data.description);
  }

  // Extract persona section
  const personaSection = content.sections.find(s => s.type === 'persona') as PersonaSection | undefined;
  if (personaSection) {
    const persona = personaSection.data;
    let personaText = '';

    if (persona.name) {
      personaText += `You are ${persona.name}`;
      if (persona.role) {
        personaText += `, ${persona.role}`;
      }
      personaText += '. ';
    }

    if (persona.style && persona.style.length > 0) {
      personaText += `Your communication style is ${persona.style.join(', ')}. `;
    }

    if (persona.expertise && persona.expertise.length > 0) {
      personaText += `You specialize in: ${persona.expertise.join(', ')}. `;
    }

    if (personaText) {
      parts.push(personaText.trim());
    }
  }

  // Process all sections
  for (const section of content.sections) {
    if (section.type === 'instructions') {
      const instructionsSection = section as InstructionsSection;
      parts.push(`\n## ${instructionsSection.title}\n`);
      parts.push(instructionsSection.content);
    } else if (section.type === 'rules') {
      const rulesSection = section as RulesSection;
      parts.push(`\n## ${rulesSection.title}\n`);
      for (const rule of rulesSection.items) {
        parts.push(`- ${rule.content}`);
        if (rule.rationale) {
          parts.push(`  *Rationale:* ${rule.rationale}`);
        }
      }
    } else if (section.type === 'examples') {
      const examplesSection = section as ExamplesSection;
      parts.push(`\n## ${examplesSection.title}\n`);
      for (const example of examplesSection.examples) {
        if (example.description) {
          parts.push(`\n### ${example.description}\n`);
        }
        if (example.code) {
          const lang = example.language || '';
          parts.push(`\`\`\`${lang}\n${example.code}\n\`\`\``);
        }
      }
    } else if (section.type === 'custom') {
      const customSection = section as CustomSection;
      if (customSection.title) {
        parts.push(`\n## ${customSection.title}\n`);
      }
      parts.push(customSection.content);
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
