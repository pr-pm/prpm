/**
 * Cursor Format Converter
 * Converts canonical format to Cursor .cursor/rules format
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

export interface CursorMDCConfig {
  version?: string;
  globs?: string[];
  alwaysApply?: boolean;
  author?: string;
  tags?: string[];
}

/**
 * Convert canonical package to Cursor format
 */
export function toCursor(
  pkg: CanonicalPackage,
  options: Partial<ConversionOptions & { cursorConfig?: CursorMDCConfig }> = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    // Warn if package has Copilot path-specific config (not supported by Cursor)
    if (pkg.metadata?.copilotConfig?.applyTo) {
      warnings.push('Copilot path-specific configuration (applyTo) is not supported by Cursor');
    }

    const content = convertContent(pkg.content, warnings);

    // Cursor slash commands use plain markdown (no frontmatter)
    // Cursor rules use MDC format (with frontmatter)
    let fullContent: string;
    if (pkg.subtype === 'slash-command') {
      fullContent = content;
    } else {
      const mdcHeader = generateMDCHeader(pkg, options.cursorConfig);
      fullContent = `${mdcHeader}\n\n${content}`;
    }

    // Validate the generated content against Cursor schema
    const validation = validateMarkdown('cursor', fullContent);
    const validationErrors = validation.errors.map(e => e.message);
    const validationWarnings = validation.warnings.map(w => w.message);

    // Merge validation warnings with conversion warnings
    if (validationWarnings.length > 0) {
      warnings.push(...validationWarnings);
    }

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    // Reduce quality score for validation errors
    if (validationErrors.length > 0) {
      qualityScore -= validationErrors.length * 5;
    }

    return {
      content: fullContent,
      format: 'cursor',
      warnings: warnings.length > 0 ? warnings : undefined,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      lossyConversion,
      qualityScore: Math.max(0, qualityScore),
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
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
 * Generate MDC (Model Context) header for Cursor rules
 * Format: YAML frontmatter with metadata
 *
 * According to official Cursor docs (https://cursor.com/docs/context/rules),
 * only these fields are officially supported:
 * - description (required)
 * - globs (array of file patterns, optional)
 * - alwaysApply (boolean, optional, defaults to false)
 *
 * This function only outputs Cursor-native fields. PRPM extension fields
 * are not included to ensure clean output for actual Cursor usage.
 */
function generateMDCHeader(pkg: CanonicalPackage, config?: CursorMDCConfig): string {
  const lines: string[] = ['---'];

  // Description (required by Cursor)
  if (pkg.metadata?.description) {
    lines.push(`description: "${pkg.metadata.description}"`);
  }

  // Globs (optional - file patterns to match)
  const globs = config?.globs || (pkg.metadata?.globs as string[] | undefined);
  if (globs && globs.length > 0) {
    lines.push('globs:');
    globs.forEach(glob => {
      lines.push(`  - "${glob}"`);
    });
  }

  // Always apply flag (optional, defaults to false)
  const alwaysApply = config?.alwaysApply ?? pkg.metadata?.alwaysApply ?? false;
  lines.push(`alwaysApply: ${alwaysApply}`);

  lines.push('---');

  return lines.join('\n');
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
      warnings.push(`Unknown section type: ${(section as { type: string }).type}`);
      return '';
  }
}

/**
 * Convert metadata to Cursor format
 */
function convertMetadata(section: { type: "metadata"; data: Record<string, unknown> }): string {
  const { title, description, icon } = section.data;

  const lines: string[] = [];

  // Title with optional icon
  if (icon && typeof icon === 'string' && typeof title === 'string') {
    lines.push(`# ${icon} ${title}`);
  } else if (typeof title === 'string') {
    lines.push(`# ${title}`);
  }

  // Description
  if (description && typeof description === 'string') {
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
  items: Rule[];
  ordered?: boolean;
}): string {
  const lines: string[] = [];

  // Section title
  lines.push(`## ${section.title}`);
  lines.push('');

  // Rules list
  section.items.forEach((rule, index) => {
    const content = rule.content;
    const prefix = section.ordered ? `${index + 1}.` : '-';

    lines.push(`${prefix} ${content}`);

    // Add rationale if present
    if (rule.rationale) {
      lines.push(`   - *Rationale: ${rule.rationale}*`);
    }

    // Add examples if present
    if (rule.examples) {
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
  examples: Example[];
}): string {
  const lines: string[] = [];

  // Section title
  lines.push(`## ${section.title}`);
  lines.push('');

  // Examples
  section.examples.forEach((example) => {
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
  data: Record<string, unknown>;
}): string {
  const { name, role, icon, style, expertise } = section.data;
  const lines: string[] = [];

  lines.push('## Role');
  lines.push('');

  if (icon && typeof icon === 'string' && name && typeof name === 'string' && typeof role === 'string') {
    lines.push(`${icon} **${name}** - ${role}`);
  } else if (name && typeof name === 'string' && typeof role === 'string') {
    lines.push(`**${name}** - ${role}`);
  } else if (typeof role === 'string') {
    lines.push(role);
  }

  if (style && Array.isArray(style) && style.length > 0) {
    lines.push('');
    lines.push(`**Style:** ${style.join(', ')}`);
  }

  if (expertise && Array.isArray(expertise) && expertise.length > 0) {
    lines.push('');
    lines.push('**Expertise:**');
    expertise.forEach((area: unknown) => {
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
