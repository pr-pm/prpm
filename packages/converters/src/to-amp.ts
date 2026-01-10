/**
 * Amp Format Converter
 * Converts canonical format to Amp skill, command, or AGENTS.md format
 *
 * Amp stores:
 * - Skills in .agents/skills/{name}/SKILL.md with YAML frontmatter
 * - Commands in .agents/commands/{name}.md
 * - AGENTS.md in CWD or ~/.config/amp/
 *
 * @see https://ampcode.com/manual
 */

import type {
  CanonicalPackage,
  ConversionResult,
} from './types/canonical.js';
import yaml from 'js-yaml';

/**
 * Convert canonical package to Amp format
 */
export function toAmp(pkg: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const content = convertContent(pkg, warnings);

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content,
      format: 'amp',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'amp',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert canonical content to Amp format
 */
function convertContent(pkg: CanonicalPackage, warnings: string[]): string {
  const lines: string[] = [];

  // Extract sections
  const metadata = pkg.content.sections.find(s => s.type === 'metadata');

  // Build frontmatter based on subtype
  const frontmatter: Record<string, any> = {};
  const ampData = metadata?.type === 'metadata' ? metadata.data.amp : undefined;

  if (pkg.subtype === 'skill') {
    // Amp Skill format - required: name, description
    // Generate valid skill name from package name/id
    const skillName = pkg.name || pkg.id;
    frontmatter.name = skillName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    if (metadata?.type === 'metadata' && metadata.data.description) {
      frontmatter.description = metadata.data.description;
    } else {
      frontmatter.description = pkg.description || 'No description provided';
      warnings.push('REQUIRED description field missing, using package description');
    }

    // Optional skill fields
    if (ampData?.argumentHint) {
      frontmatter['argument-hint'] = ampData.argumentHint;
    }
    if (ampData?.disableModelInvocation !== undefined) {
      frontmatter['disable-model-invocation'] = ampData.disableModelInvocation;
    }
  } else if (pkg.subtype === 'slash-command') {
    // Amp Command format - optional description
    if (metadata?.type === 'metadata' && metadata.data.description) {
      frontmatter.description = metadata.data.description;
    }
  } else {
    // AGENTS.md format - optional globs
    if (ampData?.globs && ampData.globs.length > 0) {
      frontmatter.globs = ampData.globs;
    }
  }

  // Only add frontmatter if we have fields to include
  const hasFrontmatter = Object.keys(frontmatter).length > 0;

  if (hasFrontmatter) {
    lines.push('---');
    lines.push(yaml.dump(frontmatter, { indent: 2, lineWidth: -1 }).trim());
    lines.push('---');
    lines.push('');
  }

  // Add all content sections
  const contentSections = pkg.content.sections
    .filter(s => s.type !== 'metadata' && s.type !== 'tools');

  for (const section of contentSections) {
    if (section.type === 'persona') {
      if (section.data.role) {
        lines.push(`You are a ${section.data.role}.`);
        lines.push('');
      }
    } else if (section.type === 'instructions') {
      // Include section title as header if present and not generic
      if (section.title && section.title !== 'Overview' && section.title !== 'Instructions') {
        lines.push(`## ${section.title}`);
        lines.push('');
      }
      lines.push(section.content);
      lines.push('');
    } else if (section.type === 'rules') {
      const rulesTitle = section.title || 'Rules';
      lines.push(`## ${rulesTitle}`);
      lines.push('');
      for (const rule of section.items) {
        lines.push(`- ${rule.content}`);
      }
      lines.push('');
    } else if (section.type === 'examples') {
      const examplesTitle = section.title || 'Examples';
      lines.push(`## ${examplesTitle}`);
      lines.push('');
      for (const example of section.examples) {
        if (example.description) {
          lines.push(`### ${example.description}`);
          lines.push('');
        }
        const lang = example.language || '';
        lines.push('```' + lang);
        lines.push(example.code);
        lines.push('```');
        lines.push('');
      }
    } else if (section.type === 'context') {
      const contextTitle = section.title || 'Context';
      lines.push(`## ${contextTitle}`);
      lines.push('');
      lines.push(section.content);
      lines.push('');
    } else if (section.type === 'hook' || section.type === 'cursor-hook') {
      warnings.push(`Hook sections are not supported in Amp format`);
    } else if (section.type !== 'custom' && section.type !== 'file-reference') {
      // Handle any other section types that may be added in the future
      const sectionType = (section as { type: string }).type;
      warnings.push(`Section type '${sectionType}' may not be fully supported in Amp format`);
    }
  }

  return lines.join('\n').trim() + '\n';
}
