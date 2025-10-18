/**
 * Cursor Format Converter
 * Converts canonical format to Cursor .cursorrules format
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
  Section,
} from '../types/canonical.js';

/**
 * Convert canonical package to Cursor format
 */
export function toCursor(
  pkg: CanonicalPackage,
  options: ConversionOptions = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const content = convertContent(pkg.content, warnings);

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content,
      format: 'cursor',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error.message}`);
    return {
      content: '',
      format: 'cursor',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert canonical content to Cursor markdown
 */
function convertContent(
  content: CanonicalContent,
  warnings: string[]
): string {
  const lines: string[] = [];

  for (const section of content.sections) {
    const sectionContent = convertSection(section, warnings);
    if (sectionContent) {
      lines.push(sectionContent);
      lines.push(''); // Blank line between sections
    }
  }

  return lines.join('\n').trim();
}

/**
 * Convert individual section to Cursor format
 */
function convertSection(section: Section, warnings: string[]): string {
  switch (section.type) {
    case 'metadata':
      return convertMetadata(section);

    case 'instructions':
      return convertInstructions(section);

    case 'rules':
      return convertRules(section);

    case 'examples':
      return convertExamples(section);

    case 'persona':
      return convertPersona(section);

    case 'context':
      return convertContext(section);

    case 'tools':
      // Tools are Claude-specific, skip for Cursor
      warnings.push('Tools section skipped (Claude-specific)');
      return '';

    case 'custom':
      // Only include if it's cursor-specific or generic
      if (!section.editorType || section.editorType === 'cursor') {
        return section.content;
      }
      warnings.push(`Custom ${section.editorType} section skipped`);
      return '';

    default:
      warnings.push(`Unknown section type: ${(section as any).type}`);
      return '';
  }
}

/**
 * Convert metadata to Cursor format
 */
function convertMetadata(section: { type: 'metadata'; data: any }): string {
  const { title, description, icon } = section.data;

  const lines: string[] = [];

  // Title with optional icon
  if (icon) {
    lines.push(`# ${icon} ${title}`);
  } else {
    lines.push(`# ${title}`);
  }

  // Description
  if (description) {
    lines.push('');
    lines.push(description);
  }

  return lines.join('\n');
}

/**
 * Convert instructions to Cursor format
 */
function convertInstructions(section: {
  type: 'instructions';
  title: string;
  content: string;
  priority?: string;
}): string {
  const lines: string[] = [];

  // Section title
  lines.push(`## ${section.title}`);
  lines.push('');

  // Priority indicator (if high priority)
  if (section.priority === 'high') {
    lines.push('**Important:**');
    lines.push('');
  }

  // Content
  lines.push(section.content);

  return lines.join('\n');
}

/**
 * Convert rules to Cursor format
 */
function convertRules(section: {
  type: 'rules';
  title: string;
  items: any[];
  ordered?: boolean;
}): string {
  const lines: string[] = [];

  // Section title
  lines.push(`## ${section.title}`);
  lines.push('');

  // Rules list
  section.items.forEach((rule, index) => {
    const content = typeof rule === 'string' ? rule : rule.content;
    const prefix = section.ordered ? `${index + 1}.` : '-';

    lines.push(`${prefix} ${content}`);

    // Add rationale if present
    if (typeof rule === 'object' && rule.rationale) {
      lines.push(`   - *Rationale: ${rule.rationale}*`);
    }

    // Add examples if present
    if (typeof rule === 'object' && rule.examples) {
      rule.examples.forEach((example: string) => {
        lines.push(`   - Example: \`${example}\``);
      });
    }
  });

  return lines.join('\n');
}

/**
 * Convert examples to Cursor format
 */
function convertExamples(section: {
  type: 'examples';
  title: string;
  examples: any[];
}): string {
  const lines: string[] = [];

  // Section title
  lines.push(`## ${section.title}`);
  lines.push('');

  // Examples
  section.examples.forEach(example => {
    // Example description
    const prefix = example.good === false ? '❌ Bad' : '✅ Good';
    lines.push(`### ${prefix}: ${example.description}`);
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
 * Convert persona to Cursor format
 */
function convertPersona(section: {
  type: 'persona';
  data: any;
}): string {
  const { name, role, icon, style, expertise } = section.data;
  const lines: string[] = [];

  lines.push('## Role');
  lines.push('');

  if (icon && name) {
    lines.push(`${icon} **${name}** - ${role}`);
  } else if (name) {
    lines.push(`**${name}** - ${role}`);
  } else {
    lines.push(role);
  }

  if (style && style.length > 0) {
    lines.push('');
    lines.push(`**Style:** ${style.join(', ')}`);
  }

  if (expertise && expertise.length > 0) {
    lines.push('');
    lines.push('**Expertise:**');
    expertise.forEach((area: string) => {
      lines.push(`- ${area}`);
    });
  }

  return lines.join('\n');
}

/**
 * Convert context to Cursor format
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
 * Detect if content is already in Cursor format
 */
export function isCursorFormat(content: string): boolean {
  // Cursor files are typically markdown with specific patterns
  return (
    content.includes('# ') &&
    !content.includes('---\n') && // Not Claude format (has frontmatter)
    !content.includes('"systemMessage"') // Not Continue format (JSON)
  );
}
