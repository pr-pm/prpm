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
  Rule,
  Example,
} from '../types/canonical.js';

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
    // Check if content already has MDC header in raw metadata
    const metadata = pkg.content.sections.find(s => s.type === 'metadata');
    if (metadata?.type === 'metadata' && metadata.data.raw) {
      const raw = metadata.data.raw;
      if (raw.trim().startsWith('---\n') && raw.includes('\n---\n')) {
        // Content already has MDC header, return as-is
        return {
          content: raw,
          format: 'cursor',
          warnings: warnings.length > 0 ? warnings : undefined,
          lossyConversion: false,
          qualityScore: 100,
        };
      }
    }

    const mdcHeader = generateMDCHeader(pkg, options.cursorConfig);
    const content = convertContent(pkg.content, warnings);

    // Combine MDC header with content
    const fullContent = `${mdcHeader}\n\n${content}`;

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content: fullContent,
      format: 'cursor',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
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
 * Config values take precedence over package metadata
 */
function generateMDCHeader(pkg: CanonicalPackage, config?: CursorMDCConfig): string {
  const lines: string[] = ['---'];

  // Name/title (from package metadata, not configurable)
  if (pkg.metadata?.title) {
    lines.push(`name: "${pkg.metadata.title}"`);
  } else if (pkg.id) {
    lines.push(`name: "${pkg.id}"`);
  }

  // Description (from package metadata, not configurable)
  if (pkg.metadata?.description) {
    lines.push(`description: "${pkg.metadata.description}"`);
  }

  // Version - config takes precedence
  const version = config?.version || pkg.metadata?.version || '1.0.0';
  lines.push(`version: "${version}"`);

  // Globs - config takes precedence
  const globs = config?.globs || (pkg.metadata?.globs as string[] | undefined) || ['**/*'];
  lines.push('globs:');
  globs.forEach(glob => {
    lines.push(`  - "${glob}"`);
  });

  // Always apply flag - config takes precedence
  const alwaysApply = config?.alwaysApply ?? pkg.metadata?.alwaysApply ?? false;
  lines.push(`alwaysApply: ${alwaysApply}`);

  // Author - from config if provided
  if (config?.author) {
    lines.push(`author: "${config.author}"`);
  }

  // Tags - from config if provided
  if (config?.tags && config.tags.length > 0) {
    lines.push('tags:');
    config.tags.forEach(tag => {
      lines.push(`  - "${tag}"`);
    });
  }

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
