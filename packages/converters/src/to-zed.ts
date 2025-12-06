/**
 * Zed Format Converter
 * Converts canonical format to Zed .rules format
 *
 * File structure:
 * - Standard location: .rules at project root
 * - Alternative files (in priority order): .cursorrules, .windsurfrules, .clinerules,
 *   .github/copilot-instructions.md, AGENT.md, AGENTS.md, CLAUDE.md, GEMINI.md
 *
 * Format:
 * - Plain markdown only (NO frontmatter)
 * - Natural language instructions for AI coding assistant
 * - First matching file is used (no merging)
 */

import type {
  CanonicalPackage,
  ConversionResult,
  Section,
  Rule,
  Example,
} from './types/canonical.js';

export interface ZedConfig {
  useAlternativeFile?: 'cursorrules' | 'windsurfrules' | 'clinerules' | 'agents' | 'claude' | 'gemini';
}

/**
 * Convert canonical package to Zed .rules format
 * Plain markdown only - NO frontmatter per Zed requirements
 */
export function toZed(
  pkg: CanonicalPackage,
  options: { zedConfig?: ZedConfig } = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    // Generate plain markdown content only
    const fullContent = convertContent(pkg, warnings);

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content: fullContent,
      format: 'zed',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'zed',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert canonical content to Zed markdown
 * Plain markdown only - NO frontmatter
 */
function convertContent(
  pkg: CanonicalPackage,
  warnings: string[]
): string {
  const lines: string[] = [];

  // Add project name as title
  const projectName = pkg.metadata?.title || pkg.name;
  lines.push(`# ${projectName}`);
  lines.push('');

  // Add description if available
  if (pkg.description || pkg.metadata?.description) {
    lines.push(pkg.description || pkg.metadata?.description || '');
    lines.push('');
  }

  // Convert sections
  for (const section of pkg.content.sections) {
    // Skip metadata, tools, and persona (not applicable to Zed)
    if (
      section.type === 'metadata' ||
      section.type === 'tools' ||
      section.type === 'persona'
    ) {
      if (section.type === 'persona') {
        warnings.push('Persona section skipped (not supported by Zed)');
      } else if (section.type === 'tools') {
        warnings.push('Tools section skipped (not supported by Zed)');
      }
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
 * Convert individual section to Zed format
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
      // Include if no specific editor type (generic custom section)
      if (!section.editorType) {
        return section.content;
      }
      // Skip editor-specific custom sections unless it's for zed
      if (section.editorType === 'zed') {
        return section.content;
      }
      warnings.push(`Custom ${section.editorType} section skipped`);
      return '';

    default:
      return '';
  }
}

/**
 * Convert instructions to Zed format
 */
function convertInstructions(section: {
  type: 'instructions';
  title: string;
  content: string;
  priority?: string;
}): string {
  const lines: string[] = [];

  // Add section title
  lines.push(`## ${section.title}`);
  lines.push('');

  // Add content (already natural language markdown)
  lines.push(section.content);

  return lines.join('\n');
}

/**
 * Convert rules to Zed format
 * Zed prefers clear, instructional language
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

  section.items.forEach((rule, index) => {
    const prefix = section.ordered ? `${index + 1}.` : '-';

    // Convert rule to clear instruction
    lines.push(`${prefix} ${rule.content}`);

    // Add rationale as sub-bullet for context
    if (rule.rationale) {
      lines.push(`   - Rationale: ${rule.rationale}`);
    }

    // Add examples as inline code
    if (rule.examples && rule.examples.length > 0) {
      rule.examples.forEach((example: string) => {
        lines.push(`   - Example: \`${example}\``);
      });
    }
  });

  return lines.join('\n');
}

/**
 * Convert examples to Zed format
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
    // Add description
    if (example.good === false) {
      lines.push(`### ❌ Avoid: ${example.description}`);
    } else if (example.good === true) {
      lines.push(`### ✅ Preferred: ${example.description}`);
    } else {
      lines.push(`### ${example.description}`);
    }

    lines.push('');

    // Add code block
    const lang = example.language || '';
    lines.push('```' + lang);
    lines.push(example.code);
    lines.push('```');
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Convert context to Zed format
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
 * Detect if content is already in Zed format
 */
export function isZedFormat(content: string): boolean {
  const trimmed = content.trim();

  // Not Zed if it has YAML frontmatter
  if (trimmed.startsWith('---')) {
    return false;
  }

  // Not Zed if it's JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return false;
  }

  // Looks like plain markdown
  return true;
}

/**
 * Generate suggested filename for Zed rules file
 */
export function generateFilename(
  pkg: CanonicalPackage,
  config?: ZedConfig
): string {
  // Determine filename based on config or default to .rules
  if (config?.useAlternativeFile) {
    switch (config.useAlternativeFile) {
      case 'cursorrules':
        return '.cursorrules';
      case 'windsurfrules':
        return '.windsurfrules';
      case 'clinerules':
        return '.clinerules';
      case 'agents':
        return 'AGENTS.md';
      case 'claude':
        return 'CLAUDE.md';
      case 'gemini':
        return 'GEMINI.md';
      default:
        return '.rules';
    }
  }

  return '.rules';
}
