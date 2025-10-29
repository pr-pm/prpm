/**
 * Continue Format Converter
 * Continue uses plain markdown without frontmatter
 */

import type {
  CanonicalPackage,
  ConversionResult,
  Section,
  Rule,
  Example,
} from '../types/canonical.js';

/**
 * Convert canonical package to Continue format
 * Continue format is plain markdown without YAML frontmatter
 */
export function toContinue(pkg: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const lines: string[] = [];

    // Extract metadata for title
    const metadata = pkg.content.sections.find(s => s.type === 'metadata');

    // Add title
    if (metadata?.type === 'metadata') {
      const title = metadata.data.title as string || pkg.id;
      const icon = metadata.data.icon as string | undefined;

      if (icon) {
        lines.push(`# ${icon} ${title}`);
      } else {
        lines.push(`# ${title}`);
      }

      // Add description
      if (metadata.data.description) {
        lines.push('');
        lines.push(metadata.data.description as string);
      }
    }

    // Convert all sections (except metadata)
    for (const section of pkg.content.sections) {
      if (section.type === 'metadata') continue; // Already handled

      const sectionContent = convertSection(section, warnings);
      if (sectionContent) {
        lines.push('');
        lines.push(sectionContent);
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
      format: 'continue',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'continue',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert individual section
 */
function convertSection(section: Section, warnings: string[]): string {
  switch (section.type) {
    case 'instructions':
      return convertInstructions(section);
    case 'rules':
      return convertRules(section);
    case 'examples':
      return convertExamples(section);
    case 'persona':
      // Continue doesn't have persona sections, skip
      warnings.push('Persona section skipped (not supported in Continue)');
      return '';
    case 'tools':
      // Continue doesn't have tools sections, skip
      warnings.push('Tools section skipped (not supported in Continue)');
      return '';
    case 'context':
      return convertContext(section);
    case 'custom':
      // Only include if it's continue-specific or generic
      if (!section.editorType || section.editorType === 'continue') {
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
 * Convert instructions section
 */
function convertInstructions(section: {
  type: 'instructions';
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
 * Convert rules section
 */
function convertRules(section: {
  type: 'rules';
  title: string;
  items: Rule[];
}): string {
  const lines: string[] = [];
  lines.push(`## ${section.title}`);
  lines.push('');

  section.items.forEach((rule) => {
    lines.push(`- ${rule.content}`);

    if (rule.rationale) {
      lines.push(`  - *Rationale: ${rule.rationale}*`);
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
  lines.push(`## ${section.title}`);
  lines.push('');

  section.examples.forEach((example) => {
    const prefix = example.good === false ? '❌ Bad' : '✅ Good';
    lines.push(`### ${prefix}: ${example.description}`);
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
  lines.push(`## ${section.title}`);
  lines.push('');
  lines.push(section.content);
  return lines.join('\n');
}
