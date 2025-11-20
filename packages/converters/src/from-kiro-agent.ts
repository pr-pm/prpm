/**
 * Kiro Agent Format Parser
 * Converts Kiro agent configuration to canonical format
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
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
      title: agentConfig.name || 'Kiro Agent',
      description: agentConfig.description || '',
    };

    // Parse prompt into content structure
    if (agentConfig.prompt) {
      parsePromptIntoContent(agentConfig.prompt, content);
    }

    // Build canonical package
    const pkg: CanonicalPackage = {
      name: agentConfig.name || 'kiro-agent',
      version: '1.0.0',
      description: agentConfig.description || '',
      content,
      subtype: 'agent',
      metadata: {
        sourceFormat: 'kiro',
        tools: agentConfig.tools,
        mcpServers: agentConfig.mcpServers,
        toolsSettings: agentConfig.toolsSettings,
        resources: agentConfig.resources,
        hooks: agentConfig.hooks,
        model: agentConfig.model,
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
    content.instructions = `Loads instructions from: ${prompt}`;
    return;
  }

  // Split by ## headers to extract sections
  const sections = prompt.split(/\n## /);

  // First section is the intro/description
  if (sections[0]) {
    const intro = sections[0].trim();
    if (intro && !content.description) {
      content.description = intro;
    }
  }

  // Process remaining sections
  content.sections = [];
  for (let i = 1; i < sections.length; i++) {
    const sectionText = sections[i];
    const lines = sectionText.split('\n');
    const title = lines[0].trim();
    const sectionContent = lines.slice(1).join('\n').trim();

    if (title.toLowerCase() === 'instructions') {
      content.instructions = sectionContent;
    } else if (title.toLowerCase() === 'rules') {
      // Parse rules
      content.rules = parseRules(sectionContent);
    } else if (title.toLowerCase() === 'examples') {
      // Parse examples
      content.examples = parseExamples(sectionContent);
    } else {
      // Generic section
      content.sections.push({
        title,
        content: sectionContent,
      });
    }
  }
}

/**
 * Parse rules from markdown text
 */
function parseRules(text: string): any[] {
  const rules = [];
  const ruleSections = text.split(/\n### /);

  for (const ruleText of ruleSections) {
    if (!ruleText.trim()) continue;

    const lines = ruleText.split('\n');
    const title = lines[0].trim();
    const description = lines.slice(1).join('\n').trim();

    rules.push({
      title,
      description,
    });
  }

  return rules;
}

/**
 * Parse examples from markdown text
 */
function parseExamples(text: string): any[] {
  const examples = [];
  const exampleSections = text.split(/\n### /);

  for (const exampleText of exampleSections) {
    if (!exampleText.trim()) continue;

    const lines = exampleText.split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n');

    const example: any = { title };

    // Extract input/output from code blocks
    const inputMatch = /Input:\s*```[\s\S]*?\n([\s\S]*?)```/i.exec(content);
    const outputMatch = /Output:\s*```[\s\S]*?\n([\s\S]*?)```/i.exec(content);

    if (inputMatch) {
      example.input = inputMatch[1].trim();
    }

    if (outputMatch) {
      example.output = outputMatch[1].trim();
    }

    // Get description (text before first code block)
    const descMatch = /^([\s\S]*?)(?:Input:|Output:|$)/.exec(content);
    if (descMatch && descMatch[1].trim()) {
      example.description = descMatch[1].trim();
    }

    examples.push(example);
  }

  return examples;
}
