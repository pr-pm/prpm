/**
 * Kiro Agent Format Parser
 * Converts Kiro agent configuration to canonical format
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
  InstructionsSection,
  RulesSection,
  ExamplesSection,
  CustomSection,
  Rule,
  Example,
} from './types/canonical.js';
import type { KiroAgentConfig } from './to-kiro-agent.js';

/**
 * Parse Kiro agent JSON to canonical format
 */
export function fromKiroAgent(
  jsonContent: string,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const agentConfig: KiroAgentConfig = JSON.parse(jsonContent);

    // Build canonical content from agent prompt
    const content: CanonicalContent = {
      format: 'canonical',
      version: '1.0',
      sections: [
        {
          type: 'metadata',
          data: {
            title: agentConfig.name || 'Kiro Agent',
            description: agentConfig.description || '',
          },
        },
      ],
    };

    // Parse prompt into content structure
    if (agentConfig.prompt) {
      parsePromptIntoContent(agentConfig.prompt, content);
    }

    // Build canonical package
    const pkg: CanonicalPackage = {
      id: agentConfig.name || 'kiro-agent',
      name: agentConfig.name || 'kiro-agent',
      version: '1.0.0',
      description: agentConfig.description || '',
      author: '',
      tags: [],
      format: 'kiro',
      subtype: 'agent',
      content,
      sourceFormat: 'kiro',
      metadata: {
        kiroConfig: {
          inclusion: 'always',
        },
        kiroAgent: {
          tools: agentConfig.tools,
          mcpServers: agentConfig.mcpServers,
          toolAliases: agentConfig.toolAliases,
          allowedTools: agentConfig.allowedTools,
          toolsSettings: agentConfig.toolsSettings,
          resources: agentConfig.resources,
          hooks: agentConfig.hooks,
          useLegacyMcpJson: agentConfig.useLegacyMcpJson,
          model: agentConfig.model,
        },
      },
    };

    return {
      content: JSON.stringify(pkg, null, 2),
      format: 'canonical',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion: false,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'canonical',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Parse prompt text into canonical content structure
 */
function parsePromptIntoContent(prompt: string, content: CanonicalContent): void {
  // If prompt is a file:// reference, note it
  if (prompt.startsWith('file://')) {
    content.sections.push({
      type: 'instructions',
      title: 'Instructions',
      content: `Loads instructions from: ${prompt}`,
    });
    return;
  }

  // Split by ## headers to extract sections
  const sections = prompt.split(/\n## /);

  // First section is the intro/description - update the metadata section
  if (sections[0]) {
    const intro = sections[0].trim();
    if (intro) {
      const metadataSection = content.sections[0];
      if (metadataSection && metadataSection.type === 'metadata') {
        if (!metadataSection.data.description) {
          metadataSection.data.description = intro;
        }
      }
    }
  }

  // Process remaining sections
  for (let i = 1; i < sections.length; i++) {
    const sectionText = sections[i];
    const lines = sectionText.split('\n');
    const title = lines[0].trim();
    const sectionContent = lines.slice(1).join('\n').trim();

    if (title.toLowerCase() === 'instructions') {
      content.sections.push({
        type: 'instructions',
        title,
        content: sectionContent,
      });
    } else if (title.toLowerCase() === 'rules') {
      // Parse rules
      const rules = parseRules(sectionContent);
      content.sections.push({
        type: 'rules',
        title,
        items: rules,
      });
    } else if (title.toLowerCase() === 'examples') {
      // Parse examples
      const examples = parseExamples(sectionContent);
      content.sections.push({
        type: 'examples',
        title,
        examples,
      });
    } else {
      // Generic section
      content.sections.push({
        type: 'custom',
        editorType: 'kiro',
        title,
        content: sectionContent,
      });
    }
  }
}

/**
 * Parse rules from markdown text
 */
function parseRules(text: string): Rule[] {
  const rules: Rule[] = [];
  const ruleSections = text.split(/\n### /);

  for (const ruleText of ruleSections) {
    if (!ruleText.trim()) continue;

    const lines = ruleText.split('\n');
    const title = lines[0].trim();
    const description = lines.slice(1).join('\n').trim();

    rules.push({
      content: `${title}: ${description}`,
    });
  }

  return rules;
}

/**
 * Parse examples from markdown text
 */
function parseExamples(text: string): Example[] {
  const examples: Example[] = [];
  const exampleSections = text.split(/\n### /);

  for (const exampleText of exampleSections) {
    if (!exampleText.trim()) continue;

    const lines = exampleText.split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n');

    // Extract code from code blocks
    const codeMatch = /```[\w]*\n([\s\S]*?)```/.exec(content);
    const code = codeMatch ? codeMatch[1].trim() : content;

    // Get description (text before first code block)
    const descMatch = /^([\s\S]*?)(?:```|$)/.exec(content);
    const description = descMatch && descMatch[1].trim() ? descMatch[1].trim() : title;

    examples.push({
      description,
      code,
    });
  }

  return examples;
}
