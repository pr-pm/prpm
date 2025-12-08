/**
 * Codex Format Converter
 * Converts canonical format to OpenAI Codex CLI AGENTS.md format
 *
 * Codex doesn't have native slash commands, so we use progressive disclosure:
 * - Slash commands become named sections in AGENTS.md
 * - Users invoke by saying the command name (e.g., "build-actions" not "/build-actions")
 * - Commands are documented with usage instructions and arguments
 *
 * File location: AGENTS.md in project root
 */

import type {
  CanonicalPackage,
  ConversionResult,
  Section,
  Rule,
  Example,
} from './types/canonical.js';

export interface CodexConfig {
  /** Append to existing AGENTS.md instead of creating new */
  appendMode?: boolean;
  /** Existing AGENTS.md content to append to */
  existingContent?: string;
}

/**
 * Convert canonical package to Codex AGENTS.md format
 *
 * For slash commands, creates a named section that users can invoke by name
 */
export function toCodex(
  pkg: CanonicalPackage,
  options: { codexConfig?: CodexConfig } = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const config = options.codexConfig || {};
    const isSlashCommand = pkg.subtype === 'slash-command';

    let content: string;

    if (isSlashCommand) {
      // Convert slash command to AGENTS.md section
      content = convertSlashCommandToSection(pkg, warnings);

      // If appending to existing content
      if (config.appendMode && config.existingContent) {
        content = appendToExistingAgentsMd(config.existingContent, content, pkg.name);
      }
    } else {
      // Regular conversion to AGENTS.md format
      content = convertToAgentsMd(pkg, warnings);
    }

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content,
      format: 'codex',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'codex',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert a slash command to an AGENTS.md section
 *
 * Creates a section that users can invoke by saying the command name
 */
function convertSlashCommandToSection(
  pkg: CanonicalPackage,
  warnings: string[]
): string {
  const lines: string[] = [];

  // Get command name (strip leading slash if present)
  const commandName = pkg.name.replace(/^\//, '');

  // Extract argument hint and description from metadata
  const metadataSection = pkg.content.sections.find(s => s.type === 'metadata');
  let argumentHint: string | string[] | undefined;
  let description = pkg.description;

  if (metadataSection && metadataSection.type === 'metadata') {
    const claudeSlashCommand = metadataSection.data.claudeSlashCommand;
    if (claudeSlashCommand) {
      argumentHint = claudeSlashCommand.argumentHint;
      if (claudeSlashCommand.description) {
        description = claudeSlashCommand.description;
      }
    }
  }

  // Section header
  lines.push(`## ${commandName}`);
  lines.push('');

  // Usage instruction
  if (argumentHint) {
    const args = formatArgumentHint(argumentHint);
    lines.push(`**Usage:** Say "${commandName} ${args}" to invoke this command`);
  } else {
    lines.push(`**Usage:** Say "${commandName}" to invoke this command`);
  }
  lines.push('');

  // Description
  if (description) {
    lines.push(`**Description:** ${description}`);
    lines.push('');
  }

  // Add argument details if present
  if (argumentHint) {
    const argNames = parseArgumentHint(argumentHint);
    if (argNames.length > 0) {
      lines.push('**Arguments:**');
      argNames.forEach((arg, i) => {
        lines.push(`- \`${arg}\` - Argument ${i + 1}`);
      });
      lines.push('');
    }
  }

  // Invocation instruction
  lines.push('---');
  lines.push('');
  lines.push(`When the user says "${commandName}" or asks to "${commandName.replace(/-/g, ' ')}", follow these instructions:`);
  lines.push('');

  // Convert the rest of the content
  for (const section of pkg.content.sections) {
    if (section.type === 'metadata') continue; // Already handled
    if (section.type === 'tools') {
      warnings.push('Tools section skipped (not supported by Codex AGENTS.md)');
      continue;
    }
    if (section.type === 'persona') {
      warnings.push('Persona section skipped (not supported by Codex AGENTS.md)');
      continue;
    }

    const sectionContent = convertSection(section, warnings);
    if (sectionContent) {
      lines.push(sectionContent);
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}

/**
 * Convert canonical package to standard AGENTS.md format
 */
function convertToAgentsMd(
  pkg: CanonicalPackage,
  warnings: string[]
): string {
  const lines: string[] = [];

  // Title
  const title = pkg.metadata?.title || pkg.name;
  lines.push(`# ${title}`);
  lines.push('');

  // Description
  if (pkg.description) {
    lines.push(pkg.description);
    lines.push('');
  }

  // Convert sections
  for (const section of pkg.content.sections) {
    if (section.type === 'metadata') continue;
    if (section.type === 'tools') {
      warnings.push('Tools section skipped (not supported by Codex AGENTS.md)');
      continue;
    }
    if (section.type === 'persona') {
      warnings.push('Persona section skipped (not supported by Codex AGENTS.md)');
      continue;
    }

    const sectionContent = convertSection(section, warnings);
    if (sectionContent) {
      lines.push(sectionContent);
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}

/**
 * Append a new command section to existing AGENTS.md content
 */
function appendToExistingAgentsMd(
  existingContent: string,
  newSection: string,
  commandName: string
): string {
  // Check if command already exists
  const sectionHeader = `## ${commandName.replace(/^\//, '')}`;
  if (existingContent.includes(sectionHeader)) {
    // Replace existing section
    const regex = new RegExp(
      `## ${commandName.replace(/^\//, '')}[\\s\\S]*?(?=## |$)`,
      'g'
    );
    return existingContent.replace(regex, newSection + '\n\n');
  }

  // Append new section
  const trimmedExisting = existingContent.trim();
  return `${trimmedExisting}\n\n${newSection}`;
}

/**
 * Convert individual section to markdown
 */
function convertSection(section: Section, warnings: string[]): string {
  switch (section.type) {
    case 'instructions':
      return convertInstructions(section);

    case 'rules':
      return convertRules(section);

    case 'examples':
      return convertExamples(section);

    case 'context':
      return convertContext(section);

    case 'hook':
      warnings.push('Hook section skipped (not supported by Codex)');
      return '';

    case 'cursor-hook':
      warnings.push('Cursor hook section skipped (not supported by Codex)');
      return '';

    case 'file-reference':
      warnings.push('File reference section skipped (not supported by Codex)');
      return '';

    case 'custom':
      if (!section.editorType || section.editorType === 'codex') {
        return section.content;
      }
      warnings.push(`Custom ${section.editorType} section skipped`);
      return '';

    default:
      return '';
  }
}

/**
 * Convert instructions section
 */
function convertInstructions(section: {
  type: 'instructions';
  title: string;
  content: string;
  priority?: string;
}): string {
  const lines: string[] = [];

  lines.push(`### ${section.title}`);
  lines.push('');

  if (section.priority === 'high') {
    lines.push('**Important:**');
    lines.push('');
  }

  lines.push(section.content);

  return lines.join('\n');
}

/**
 * Convert rules section
 */
function convertRules(section: {
  type: 'rules';
  title: string;
  items: Rule[];
  ordered?: boolean;
}): string {
  const lines: string[] = [];

  lines.push(`### ${section.title}`);
  lines.push('');

  section.items.forEach((rule, index) => {
    const prefix = section.ordered ? `${index + 1}.` : '-';
    lines.push(`${prefix} ${rule.content}`);

    if (rule.rationale) {
      lines.push(`   - Rationale: ${rule.rationale}`);
    }

    if (rule.examples && rule.examples.length > 0) {
      rule.examples.forEach((example: string) => {
        lines.push(`   - Example: \`${example}\``);
      });
    }
  });

  return lines.join('\n');
}

/**
 * Convert examples section
 */
function convertExamples(section: {
  type: 'examples';
  title: string;
  examples: Example[];
}): string {
  const lines: string[] = [];

  lines.push(`### ${section.title}`);
  lines.push('');

  section.examples.forEach((example) => {
    if (example.good === false) {
      lines.push(`#### ❌ Avoid: ${example.description}`);
    } else if (example.good === true) {
      lines.push(`#### ✅ Preferred: ${example.description}`);
    } else {
      lines.push(`#### ${example.description}`);
    }

    lines.push('');

    const lang = example.language || '';
    lines.push('```' + lang);
    lines.push(example.code);
    lines.push('```');
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Convert context section
 */
function convertContext(section: {
  type: 'context';
  title: string;
  content: string;
}): string {
  const lines: string[] = [];

  lines.push(`### ${section.title}`);
  lines.push('');
  lines.push(section.content);

  return lines.join('\n');
}

/**
 * Format argument hint for display
 */
function formatArgumentHint(hint: string | string[]): string {
  if (Array.isArray(hint)) {
    return hint.map(arg => `<${arg}>`).join(' ');
  }

  // Handle bracketed format: [arg1] [arg2]
  const bracketMatches = hint.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    return bracketMatches.map(m => `<${m.replace(/^\[|\]$/g, '')}>`).join(' ');
  }

  // Space-separated format
  return hint.split(/\s+/).filter(Boolean).map(arg => `<${arg}>`).join(' ');
}

/**
 * Parse argument hint into array of argument names
 */
function parseArgumentHint(hint: string | string[]): string[] {
  if (Array.isArray(hint)) {
    return hint;
  }

  // Handle bracketed format: [arg1] [arg2]
  const bracketMatches = hint.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    return bracketMatches.map(m => m.replace(/^\[|\]$/g, ''));
  }

  // Space-separated format
  return hint.split(/\s+/).filter(Boolean);
}

/**
 * Generate suggested filename for Codex
 */
export function generateFilename(): string {
  return 'AGENTS.md';
}
