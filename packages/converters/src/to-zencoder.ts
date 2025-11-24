/**
 * Zencoder Format Converter
 * Converts canonical format to Zencoder rule format
 *
 * File structure:
 * - Standard location: .zencoder/rules/*.md
 * - Markdown format with optional YAML frontmatter
 * - Frontmatter fields: description, globs, alwaysApply
 */

import type {
  CanonicalPackage,
  ConversionResult,
  Section,
  Rule,
  Example,
} from './types/canonical.js';

export interface ZencoderConfig {
  description?: string; // Description of the rule
  globs?: string[]; // File patterns to apply to
  alwaysApply?: boolean; // Whether to always apply this rule
  includeFrontmatter?: boolean; // Whether to include YAML frontmatter (default: true if any config exists)
}

/**
 * Convert canonical package to Zencoder format
 */
export function toZencoder(
  pkg: CanonicalPackage,
  options: { zencoderConfig?: ZencoderConfig } = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const config = options.zencoderConfig || {};

    // Auto-detect if we should include frontmatter
    const hasConfig = config.description || config.globs || config.alwaysApply !== undefined ||
                      pkg.metadata?.globs || pkg.metadata?.alwaysApply !== undefined;
    const includeFrontmatter = config.includeFrontmatter ?? hasConfig;

    // Generate content
    const content = convertContent(pkg, warnings, config);

    // Add frontmatter if requested
    let fullContent: string;
    if (includeFrontmatter) {
      const frontmatter = generateFrontmatter(pkg, config);
      if (frontmatter) {
        fullContent = `${frontmatter}\n\n${content}`;
      } else {
        fullContent = content;
      }
    } else {
      fullContent = content;
    }

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content: fullContent,
      format: 'zencoder',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'zencoder',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Generate YAML frontmatter
 */
function generateFrontmatter(pkg: CanonicalPackage, config: ZencoderConfig): string {
  const lines: string[] = [];
  let hasContent = false;

  // Description
  const description = config.description || pkg.description || pkg.metadata?.description;
  if (description) {
    if (!hasContent) {
      lines.push('---');
      hasContent = true;
    }
    lines.push(`description: ${JSON.stringify(description)}`);
  }

  // Globs
  const globs = config.globs || pkg.metadata?.globs;
  if (globs && globs.length > 0) {
    if (!hasContent) {
      lines.push('---');
      hasContent = true;
    }
    lines.push('globs:');
    globs.forEach(glob => {
      lines.push(`  - ${JSON.stringify(glob)}`);
    });
  }

  // AlwaysApply
  const alwaysApply = config.alwaysApply ?? pkg.metadata?.alwaysApply;
  if (alwaysApply !== undefined) {
    if (!hasContent) {
      lines.push('---');
      hasContent = true;
    }
    lines.push(`alwaysApply: ${alwaysApply}`);
  }

  if (hasContent) {
    lines.push('---');
    return lines.join('\n');
  }

  return '';
}

/**
 * Convert canonical content to Zencoder markdown
 */
function convertContent(
  pkg: CanonicalPackage,
  warnings: string[],
  config: ZencoderConfig
): string {
  const lines: string[] = [];

  // Add package name as title
  const title = pkg.metadata?.title || pkg.name;
  lines.push(`# ${title}`);
  lines.push('');

  // Add description in body if not in frontmatter
  if (!config.description && (pkg.description || pkg.metadata?.description)) {
    lines.push(pkg.description || pkg.metadata?.description || '');
    lines.push('');
  }

  // Convert sections
  for (const section of pkg.content.sections) {
    // Skip metadata, tools, and persona (not applicable to Zencoder)
    if (
      section.type === 'metadata' ||
      section.type === 'tools' ||
      section.type === 'persona'
    ) {
      if (section.type === 'persona') {
        warnings.push('Persona section skipped (not supported by Zencoder)');
      } else if (section.type === 'tools') {
        warnings.push('Tools section skipped (not supported by Zencoder)');
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
 * Convert individual section to Zencoder format
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
      // Skip editor-specific custom sections
      warnings.push(`Custom ${section.editorType} section skipped`);
      return '';

    default:
      return '';
  }
}

/**
 * Convert instructions to Zencoder format
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
 * Convert rules to Zencoder format
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
 * Convert examples to Zencoder format
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
 * Convert context to Zencoder format
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
 * Detect if content is already in Zencoder format
 */
export function isZencoderFormat(content: string): boolean {
  // Zencoder files may have YAML frontmatter with specific fields
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    // Check for Zencoder-specific fields
    if (frontmatter.includes('globs:') || frontmatter.includes('alwaysApply:')) {
      return true;
    }
  }

  // Or simple markdown without specific markers
  const hasSpecificMarkers = content.includes('inclusion:') || // Kiro
    content.includes('applyTo:') || // Copilot
    content.includes('tools:'); // Claude

  return !hasSpecificMarkers && content.includes('#');
}

/**
 * Generate suggested filename for Zencoder file
 * Format: .zencoder/rules/package-name.md
 */
export function generateFilename(pkg: CanonicalPackage): string {
  const packageName = sanitizeFilename(pkg.name);
  return `.zencoder/rules/${packageName}.md`;
}

/**
 * Sanitize filename for filesystem
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
