/**
 * OpenSkills Format Converter
 * Converts canonical format to OpenSkills SKILL.md format
 *
 * OpenSkills format:
 * ---
 * name: skill-name
 * description: Brief description of when to use this skill
 * ---
 *
 * # Skill Title
 *
 * Markdown instructions for AI agents
 */

import type { CanonicalPackage, Section } from './types/canonical.js';

export interface ConversionResult {
  content: string;
  format: 'openskills';
  warnings: string[];
  qualityScore: number;
  lossyConversion: boolean;
}

/**
 * Convert canonical format to OpenSkills SKILL.md format
 */
export function toOpenSkills(pkg: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  // Extract metadata
  const metadataSection = pkg.content.sections.find((s: Section) => s.type === 'metadata');
  const title = metadataSection?.type === 'metadata' ? metadataSection.data.title : pkg.name;
  const description = pkg.description || (metadataSection?.type === 'metadata' ? metadataSection.data.description : '');

  // Build frontmatter
  const frontmatter = [
    '---',
    `name: ${pkg.name}`,
    `description: ${description || 'AI skill'}`,
    '---',
  ].join('\n');

  // Build body
  const bodyParts: string[] = [];

  // Add title
  if (title) {
    bodyParts.push(`# ${title}`);
    bodyParts.push('');
  }

  // Process sections
  for (const section of pkg.content.sections) {
    switch (section.type) {
      case 'metadata':
        // Already handled in frontmatter
        break;

      case 'instructions':
        bodyParts.push(section.content);
        bodyParts.push('');
        break;

      case 'rules':
        if (section.items && section.items.length > 0) {
          bodyParts.push(`## ${section.title || 'Rules'}`);
          bodyParts.push('');
          for (const rule of section.items) {
            bodyParts.push(rule.content);
            if (rule.rationale) {
              bodyParts.push(`\n*Rationale: ${rule.rationale}*`);
            }
            bodyParts.push('');
          }
        }
        break;

      case 'examples':
        if (section.examples && section.examples.length > 0) {
          bodyParts.push(`## ${section.title || 'Examples'}`);
          bodyParts.push('');
          for (const example of section.examples) {
            if (example.description) {
              bodyParts.push(example.description);
              bodyParts.push('');
            }
            if (example.code) {
              const lang = example.language || '';
              bodyParts.push(`\`\`\`${lang}`);
              bodyParts.push(example.code);
              bodyParts.push('```');
              bodyParts.push('');
            }
          }
        }
        break;

      case 'persona':
        bodyParts.push('## Persona');
        bodyParts.push('');
        if (section.data.name) {
          bodyParts.push(`**Name:** ${section.data.name}`);
          bodyParts.push('');
        }
        bodyParts.push(`**Role:** ${section.data.role}`);
        if (section.data.style && section.data.style.length > 0) {
          bodyParts.push(`\n**Style:** ${section.data.style.join(', ')}`);
        }
        if (section.data.expertise && section.data.expertise.length > 0) {
          bodyParts.push(`\n**Expertise:** ${section.data.expertise.join(', ')}`);
        }
        bodyParts.push('');
        warnings.push('OpenSkills does not have explicit persona support - converted to markdown section');
        qualityScore -= 5;
        break;

      case 'tools':
        if (section.tools && section.tools.length > 0) {
          bodyParts.push('## Tools');
          bodyParts.push('');
          bodyParts.push(`Available tools: ${section.tools.join(', ')}`);
          bodyParts.push('');
          warnings.push('OpenSkills does not have explicit tools support - converted to markdown section');
          qualityScore -= 10;
        }
        break;

      case 'context':
        bodyParts.push(`## ${section.title || 'Context'}`);
        bodyParts.push('');
        bodyParts.push(section.content);
        bodyParts.push('');
        break;

      case 'custom':
        if (section.title) {
          bodyParts.push(`## ${section.title}`);
          bodyParts.push('');
        }
        bodyParts.push(section.content);
        bodyParts.push('');
        break;

      case 'hook':
        // Skip hook sections - they're not relevant for OpenSkills
        warnings.push('Hook sections are not supported in OpenSkills format');
        qualityScore -= 5;
        break;
    }
  }

  const content = frontmatter + '\n\n' + bodyParts.join('\n').trim();
  const lossyConversion = warnings.length > 0;

  return {
    content,
    format: 'openskills',
    warnings,
    qualityScore,
    lossyConversion,
  };
}
