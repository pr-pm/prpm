/**
 * Continue Format Converter
 * Continue uses YAML frontmatter for both prompts (slash commands) and rules
 */

import type {
  CanonicalPackage,
  ConversionResult,
  Section,
  Rule,
  Example,
} from './types/canonical.js';

/**
 * Convert canonical package to Continue format
 * Continue format requires YAML frontmatter:
 * - Prompts (slash commands): name, description, invokable: true
 * - Rules: name, globs, alwaysApply, description
 */
export function toContinue(pkg: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const lines: string[] = [];

    // Extract metadata
    const metadata = pkg.content.sections.find(s => s.type === 'metadata');
    const title = metadata?.type === 'metadata' ? (metadata.data.title as string || pkg.name || pkg.id) : (pkg.name || pkg.id);
    const description = metadata?.type === 'metadata' ? (metadata.data.description as string || pkg.description) : pkg.description;

    // Determine if this is a prompt/slash-command or a rule
    const isPrompt = pkg.subtype === 'slash-command' || pkg.subtype === 'prompt';
    const isRule = pkg.subtype === 'rule';

    // Generate YAML frontmatter based on type
    if (isPrompt) {
      // Prompts (slash commands) need: name, description, invokable: true
      lines.push('---');
      lines.push(`name: ${title}`);
      if (description) {
        lines.push(`description: ${description}`);
      }
      lines.push('invokable: true');
      lines.push('---');
      lines.push('');
    } else {
      // Rules (default for most conversions) need: name, description, globs, regex, alwaysApply
      lines.push('---');
      lines.push(`name: ${title}`);

      // Description (optional)
      if (description) {
        lines.push(`description: "${description}"`);
      }

      // Globs (optional) - only include if they exist
      const globs = pkg.metadata?.globs;
      if (globs && Array.isArray(globs) && globs.length > 0) {
        if (globs.length === 1) {
          lines.push(`globs: "${globs[0]}"`);
        } else {
          lines.push(`globs:`);
          globs.forEach(glob => {
            lines.push(`  - "${glob}"`);
          });
        }
      }

      // Note: regex field is not preserved in canonical format
      // This is a known limitation - regex patterns won't round-trip

      // AlwaysApply (optional) - only include if explicitly set
      const alwaysApply = pkg.metadata?.alwaysApply;
      if (alwaysApply !== undefined) {
        lines.push(`alwaysApply: ${alwaysApply}`);
      }

      lines.push('---');
      lines.push('');
    }

    // Add title and description in markdown body
    const icon = metadata?.type === 'metadata' ? (metadata.data.icon as string | undefined) : undefined;
    if (icon) {
      lines.push(`# ${icon} ${title}`);
    } else {
      lines.push(`# ${title}`);
    }

    if (description) {
      lines.push('');
      lines.push(description);
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
