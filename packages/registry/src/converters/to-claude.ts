/**
 * Claude Format Converter
 * Converts canonical format to Claude agent format
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
  Section,
  Rule,
  Example,
} from '../types/canonical.js';

/**
 * Convert canonical package to Claude agent format
 */
export function toClaude(
  pkg: CanonicalPackage,
  options: Partial<ConversionOptions> & { claudeConfig?: { tools?: string; model?: string } } = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const content = convertContent(pkg, warnings, options);

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content,
      format: 'claude',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'claude',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert canonical content to Claude agent format
 */
function convertContent(
  pkg: CanonicalPackage,
  warnings: string[],
  options?: { claudeConfig?: { tools?: string; model?: string } }
): string {
  const lines: string[] = [];

  // Extract metadata and tools for frontmatter
  const metadata = pkg.content.sections.find(s => s.type === 'metadata');
  const tools = pkg.content.sections.find(s => s.type === 'tools');
  const persona = pkg.content.sections.find(s => s.type === 'persona');

  // Generate frontmatter
  lines.push('---');

  // Use human-readable title from metadata if available, otherwise use package ID
  const skillName = metadata?.type === 'metadata' && metadata.data.title
    ? metadata.data.title
    : pkg.id;
  lines.push(`name: ${skillName}`);

  if (metadata?.type === 'metadata') {
    lines.push(`description: ${metadata.data.description}`);
    if (metadata.data.icon) {
      lines.push(`icon: ${metadata.data.icon}`);
    }
  }

  // Tools field - use config override if provided, otherwise use package tools
  const toolsValue = options?.claudeConfig?.tools || (tools?.type === 'tools' ? tools.tools.join(', ') : undefined);
  if (toolsValue) {
    lines.push(`tools: ${toolsValue}`);
  }

  // Model field - use config override if provided, otherwise use stored model from metadata
  const storedModel = metadata?.type === 'metadata' ? metadata.data.claudeAgent?.model : undefined;
  const modelValue = options?.claudeConfig?.model || storedModel;
  if (modelValue) {
    lines.push(`model: ${modelValue}`);
  }

  lines.push('---');
  lines.push('');

  // Main title
  if (metadata?.type === 'metadata') {
    const { title, icon } = metadata.data;
    if (icon) {
      lines.push(`# ${icon} ${title}`);
    } else {
      lines.push(`# ${title}`);
    }
    lines.push('');
  }

  // Persona section (if exists)
  if (persona?.type === 'persona') {
    const personaContent = convertPersona(persona);
    if (personaContent) {
      lines.push(personaContent);
      lines.push('');
    }
  }

  // Convert remaining sections
  for (const section of pkg.content.sections) {
    // Skip metadata, tools, and persona (already handled)
    if (
      section.type === 'metadata' ||
      section.type === 'tools' ||
      section.type === 'persona'
    ) {
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
 * Convert individual section to Claude format
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

    case 'custom':
      // Only include if it's claude-specific or generic
      if (!section.editorType || section.editorType === 'claude') {
        return section.content;
      }
      warnings.push(`Custom ${section.editorType} section skipped`);
      return '';

    default:
      return '';
  }
}

/**
 * Convert persona to Claude format
 */
function convertPersona(section: {
  type: 'persona';
  data: Record<string, unknown>;
}): string {
  const { name, role, style, expertise } = section.data;
  const lines: string[] = [];

  // Opening statement
  if (name) {
    lines.push(`You are ${name}, ${role}.`);
  } else {
    lines.push(`You are ${role}.`);
  }

  // Style
  if (style && Array.isArray(style) && style.length > 0) {
    lines.push('');
    lines.push(`Your communication style is ${style.join(', ')}.`);
  }

  // Expertise
  if (expertise && Array.isArray(expertise) && expertise.length > 0) {
    lines.push('');
    lines.push('Your areas of expertise include:');
    expertise.forEach((area: unknown) => {
      lines.push(`- ${area}`);
    });
  }

  return lines.join('\n');
}

/**
 * Convert instructions to Claude format
 */
function convertInstructions(section: {
  type: 'instructions';
  title: string;
  content: string;
  priority?: string;
}): string {
  const lines: string[] = [];

  lines.push(`## ${section.title}`);
  lines.push('');

  // Priority indicator for high priority items
  if (section.priority === 'high') {
    lines.push('**IMPORTANT:**');
    lines.push('');
  }

  lines.push(section.content);

  return lines.join('\n');
}

/**
 * Convert rules to Claude format
 */
function convertRules(section: {
  type: 'rules';
  title: string;
  items: Rule[];
  ordered?: boolean;
}): string {
  const lines: string[] = [];

  lines.push(`## ${section.title}`);
  lines.push('');

  // For Claude, phrase rules as instructions/guidelines
  section.items.forEach((rule, index) => {
    const content = rule.content;
    const prefix = section.ordered ? `${index + 1}.` : '-';

    // Rephrase as directive if it's a simple rule
    if (content.startsWith('Use ') || content.startsWith('Always ') || content.startsWith('Never ')) {
      lines.push(`${prefix} ${content}`);
    } else {
      lines.push(`${prefix} ${content}`);
    }

    // Add rationale if present
    if (rule.rationale) {
      lines.push(`   *${rule.rationale}*`);
    }

    // Add examples if present
    if (rule.examples) {
      rule.examples.forEach((example: string) => {
        lines.push(`   Example: \`${example}\``);
      });
    }
  });

  return lines.join('\n');
}

/**
 * Convert examples to Claude format
 */
function convertExamples(section: {
  type: 'examples';
  title: string;
  examples: Example[];
}): string {
  const lines: string[] = [];

  lines.push(`## ${section.title}`);
  lines.push('');

  section.examples.forEach((example) => {
    // Good/bad indicator
    if (example.good === false) {
      lines.push(`### ❌ Incorrect: ${example.description}`);
    } else {
      lines.push(`### ✓ ${example.description}`);
    }

    lines.push('');

    // Code block
    const lang = example.language || '';
    lines.push('```' + lang);
    lines.push(example.code);
    lines.push('```');
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Convert context to Claude format
 */
function convertContext(section: {
  type: 'context';
  title: string;
  content: string;
}): string {
  const lines: string[] = [];

  lines.push(`## ${section.title}`);
  lines.push('');
  lines.push(section.content);

  return lines.join('\n');
}

/**
 * Convert canonical package to CLAUDE.md format (plain markdown, no frontmatter)
 * This is the recommended format for project-specific context in Claude Code
 */
export function toClaudeMd(
  pkg: CanonicalPackage,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const lines: string[] = [];

    // Extract metadata
    const metadata = pkg.content.sections.find(s => s.type === 'metadata');

    // Main title (no frontmatter for CLAUDE.md)
    if (metadata?.type === 'metadata') {
      const { title } = metadata.data;
      lines.push(`# ${title}`);
      lines.push('');
    }

    // Convert all sections to plain markdown (no frontmatter)
    for (const section of pkg.content.sections) {
      // Skip metadata (already handled as title)
      if (section.type === 'metadata') {
        continue;
      }

      // Skip tools and persona (not appropriate for CLAUDE.md)
      if (section.type === 'tools' || section.type === 'persona') {
        warnings.push(`${section.type} section skipped (not appropriate for CLAUDE.md)`);
        continue;
      }

      const sectionContent = convertSectionToPlainMarkdown(section, warnings);
      if (sectionContent) {
        lines.push(sectionContent);
        lines.push('');
      }
    }

    const content = lines.join('\n').trim();

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content,
      format: 'claude',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'claude',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert section to plain markdown (for CLAUDE.md format)
 */
function convertSectionToPlainMarkdown(section: Section, warnings: string[]): string {
  switch (section.type) {
    case 'instructions':
      return convertInstructions(section);

    case 'rules':
      return convertRules(section);

    case 'examples':
      return convertExamples(section);

    case 'context':
      return convertContext(section);

    case 'custom':
      // Only include if it's claude-specific or generic
      if (!section.editorType || section.editorType === 'claude') {
        return section.content;
      }
      warnings.push(`Custom ${section.editorType} section skipped`);
      return '';

    default:
      return '';
  }
}

/**
 * Detect if content is already in Claude agent format
 */
export function isClaudeFormat(content: string): boolean {
  // Claude agents have YAML frontmatter
  return content.startsWith('---\n') && content.includes('name:');
}

/**
 * Parse Claude frontmatter
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, frontmatterText, body] = match;

  // Simple YAML parsing (for basic key: value pairs)
  const frontmatter: Record<string, any> = {};
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
