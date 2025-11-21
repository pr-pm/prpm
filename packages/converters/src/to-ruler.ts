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
  MetadataSection,
  InstructionsSection,
  RulesSection,
  ExamplesSection,
  CustomSection,
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

  // Extract metadata section for title and description
  const metadataSection = content.sections.find(s => s.type === 'metadata') as MetadataSection | undefined;
  if (metadataSection) {
    if (metadataSection.data.title) {
      parts.push(`# ${metadataSection.data.title}\n`);
    }
    if (metadataSection.data.description) {
      parts.push(`${metadataSection.data.description}\n`);
    }
  }

  // Process all sections
  for (const section of content.sections) {
    if (section.type === 'metadata') {
      // Skip metadata section - already handled above
      continue;
    } else if (section.type === 'instructions') {
      const instructionsSection = section as InstructionsSection;
      parts.push(`## ${instructionsSection.title}\n`);
      parts.push(`${instructionsSection.content}\n`);
    } else if (section.type === 'rules') {
      const rulesSection = section as RulesSection;
      parts.push(`## ${rulesSection.title}\n`);
      for (const rule of rulesSection.items) {
        parts.push(convertRule(rule));
      }
    } else if (section.type === 'examples') {
      const examplesSection = section as ExamplesSection;
      parts.push(`## ${examplesSection.title}\n`);
      for (const example of examplesSection.examples) {
        parts.push(convertExample(example));
      }
    } else if (section.type === 'custom') {
      const customSection = section as CustomSection;
      if (customSection.title) {
        parts.push(`## ${customSection.title}\n`);
      }
      parts.push(`${customSection.content}\n`);
    }
  }

  return parts.join('\n').trim();
}

/**
 * Convert a rule to markdown
 */
function convertRule(rule: Rule): string {
  const parts: string[] = [];

  // Rule type only has: content, rationale, examples
  parts.push(`- ${rule.content}`);

  if (rule.rationale) {
    parts.push(`\n  *Rationale:* ${rule.rationale}`);
  }

  if (rule.examples && rule.examples.length > 0) {
    parts.push(`\n  *Examples:*`);
    for (const example of rule.examples) {
      parts.push(`\n  \`\`\`\n  ${example}\n  \`\`\``);
    }
  }

  parts.push('\n');

  return parts.join('');
}

/**
 * Convert an example to markdown
 */
function convertExample(example: Example): string {
  const parts: string[] = [];

  // Example type only has: description, code, language, good
  if (example.description) {
    parts.push(`### ${example.description}\n`);
  }

  if (example.good !== undefined) {
    parts.push(`*${example.good ? 'Good' : 'Bad'} example*\n`);
  }

  if (example.code) {
    const lang = example.language || '';
    parts.push('```' + lang);
    parts.push(example.code);
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
