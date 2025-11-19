/**
 * Ruler Format Converter
 * Converts canonical format to Ruler .ruler/ format
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
  Section,
  Rule,
  Example,
} from './types/canonical.js';
import { validateMarkdown } from './validation.js';

/**
 * Convert canonical package to Ruler format
 * Ruler uses plain markdown files without frontmatter
 * Files are placed in .ruler/ directory and concatenated with source markers
 */
export function toRuler(
  pkg: CanonicalPackage,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    // Ruler supports simple markdown rules
    // Warn about features that may not translate well
    if (pkg.metadata?.copilotConfig?.applyTo) {
      warnings.push('Path-specific configuration (applyTo) will be ignored by Ruler');
    }

    if (pkg.subtype === 'agent' || pkg.subtype === 'workflow') {
      warnings.push(`Subtype "${pkg.subtype}" may not be fully supported by Ruler's simple rule format`);
      qualityScore -= 10;
    }

    if (pkg.subtype === 'slash-command') {
      warnings.push('Slash commands are not supported by Ruler');
      qualityScore -= 20;
    }

    if (pkg.subtype === 'hook') {
      warnings.push('Hooks are not supported by Ruler');
      qualityScore -= 20;
    }

    // Convert content to plain markdown (no frontmatter)
    const content = convertContent(pkg.content, warnings);

    // Add package header comment to help identify source
    const header = `<!-- Package: ${pkg.name} -->\n<!-- Author: ${pkg.author || 'Unknown'} -->\n${pkg.description ? `<!-- Description: ${pkg.description} -->\n` : ''}`;

    const fullContent = `${header}\n${content}`;

    // Validate against ruler schema if it exists, otherwise skip validation
    // Since Ruler uses plain markdown, validation is minimal
    const validation = validateMarkdown('ruler', fullContent);
    const validationErrors = validation.errors.map(e => e.message);
    const validationWarnings = validation.warnings.map(w => w.message);

    if (validationWarnings.length > 0) {
      warnings.push(...validationWarnings);
    }

    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('ignored')
    );

    if (validationErrors.length > 0) {
      qualityScore -= validationErrors.length * 5;
    }

    return {
      content: fullContent,
      format: 'ruler',
      warnings: warnings.length > 0 ? warnings : undefined,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      lossyConversion,
      qualityScore: Math.max(0, qualityScore),
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'ruler',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert canonical content structure to Ruler markdown
 */
function convertContent(content: CanonicalContent, warnings: string[]): string {
  const parts: string[] = [];

  // Add title if present
  if (content.title) {
    parts.push(`# ${content.title}\n`);
  }

  // Add description
  if (content.description) {
    parts.push(`${content.description}\n`);
  }

  // Add sections
  if (content.sections && content.sections.length > 0) {
    for (const section of content.sections) {
      parts.push(convertSection(section));
    }
  }

  // Add rules
  if (content.rules && content.rules.length > 0) {
    parts.push('## Rules\n');
    for (const rule of content.rules) {
      parts.push(convertRule(rule));
    }
  }

  // Add examples
  if (content.examples && content.examples.length > 0) {
    parts.push('## Examples\n');
    for (const example of content.examples) {
      parts.push(convertExample(example));
    }
  }

  // Add context if present
  if (content.context) {
    parts.push('## Context\n');
    parts.push(`${content.context}\n`);
  }

  // Add instructions
  if (content.instructions) {
    parts.push('## Instructions\n');
    parts.push(`${content.instructions}\n`);
  }

  return parts.join('\n').trim();
}

/**
 * Convert a section to markdown
 */
function convertSection(section: Section): string {
  const parts: string[] = [];

  if (section.title) {
    parts.push(`## ${section.title}\n`);
  }

  if (section.content) {
    parts.push(`${section.content}\n`);
  }

  if (section.subsections && section.subsections.length > 0) {
    for (const subsection of section.subsections) {
      parts.push(convertSection(subsection));
    }
  }

  return parts.join('\n');
}

/**
 * Convert a rule to markdown
 */
function convertRule(rule: Rule): string {
  const parts: string[] = [];

  if (rule.title) {
    parts.push(`### ${rule.title}\n`);
  }

  if (rule.description) {
    parts.push(`${rule.description}\n`);
  }

  if (rule.pattern) {
    parts.push(`**Pattern:** \`${rule.pattern}\`\n`);
  }

  if (rule.severity) {
    parts.push(`**Severity:** ${rule.severity}\n`);
  }

  return parts.join('\n');
}

/**
 * Convert an example to markdown
 */
function convertExample(example: Example): string {
  const parts: string[] = [];

  if (example.title) {
    parts.push(`### ${example.title}\n`);
  }

  if (example.description) {
    parts.push(`${example.description}\n`);
  }

  if (example.input) {
    parts.push('**Input:**\n');
    parts.push('```');
    parts.push(example.input);
    parts.push('```\n');
  }

  if (example.output) {
    parts.push('**Output:**\n');
    parts.push('```');
    parts.push(example.output);
    parts.push('```\n');
  }

  return parts.join('\n');
}

/**
 * Check if content appears to be in Ruler format
 */
export function isRulerFormat(content: string): boolean {
  // Ruler format is plain markdown without frontmatter
  // It should not start with --- (YAML frontmatter)
  // It should contain typical rule content markers

  const lines = content.trim().split('\n');

  // Check it doesn't have frontmatter
  if (lines[0] === '---') {
    return false;
  }

  // Check for typical Ruler content patterns
  const hasHeaders = /^#+\s/.test(content);
  const hasRuleContent = /rule|instruction|guideline|convention/i.test(content);

  return hasHeaders || hasRuleContent;
}
