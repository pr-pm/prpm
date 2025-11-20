/**
 * Gemini Format Converter
 * Converts canonical format to Gemini TOML custom command format
 */

import * as TOML from '@iarna/toml';
import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
  Section,
} from './types/canonical.js';
import { validateFormat } from './validation.js';

export interface GeminiCommand {
  prompt: string;
  description?: string;
}

/**
 * Convert canonical package to Gemini TOML format
 */
export function toGemini(
  pkg: CanonicalPackage,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    // Build the prompt from canonical sections
    const prompt = buildPrompt(pkg.content, warnings);

    // Build Gemini command object
    const geminiCommand: GeminiCommand = {
      prompt,
    };

    // Add description if available
    if (pkg.description) {
      geminiCommand.description = pkg.description;
    } else if (pkg.metadata?.description) {
      geminiCommand.description = pkg.metadata.description;
    }

    // Convert to TOML string
    const tomlContent = TOML.stringify(geminiCommand as unknown as TOML.JsonMap);

    // Validate the generated TOML structure
    const validation = validateFormat('gemini', geminiCommand);
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
      content: tomlContent,
      format: 'gemini',
      warnings: warnings.length > 0 ? warnings : undefined,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      lossyConversion,
      qualityScore: Math.max(0, qualityScore),
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'gemini',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Build prompt string from canonical sections
 */
function buildPrompt(content: CanonicalContent, warnings: string[]): string {
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
 * Convert individual section to Gemini-compatible text
 */
function convertSection(section: Section, warnings: string[]): string {
  switch (section.type) {
    case 'metadata':
      // Skip metadata in prompt (handled separately)
      return '';

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
      // Tools are not supported in Gemini
      warnings.push('Tools section skipped (not supported by Gemini)');
      return '';

    case 'hook':
      // Hooks are not supported in Gemini
      warnings.push('Hook section skipped (not supported by Gemini)');
      return '';

    case 'custom':
      // Only include if it's gemini-specific or generic
      if (!section.editorType || section.editorType === 'gemini') {
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
 * Convert instructions to text
 */
function convertInstructions(section: {
  type: 'instructions';
  title: string;
  content: string;
  priority?: string;
}): string {
  const lines: string[] = [];

  // Add priority indicator if high priority
  if (section.priority === 'high') {
    lines.push('**Important:**');
    lines.push('');
  }

  // Add content
  lines.push(section.content);

  return lines.join('\n');
}

/**
 * Convert rules to text
 */
function convertRules(section: {
  type: 'rules';
  title: string;
  items: Array<{ content: string; rationale?: string; examples?: string[] }>;
  ordered?: boolean;
}): string {
  const lines: string[] = [];

  // Section title
  lines.push(`# ${section.title}`);
  lines.push('');

  // Rules list
  section.items.forEach((rule, index) => {
    const prefix = section.ordered ? `${index + 1}.` : '-';
    lines.push(`${prefix} ${rule.content}`);

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
 * Convert examples to text
 */
function convertExamples(section: {
  type: 'examples';
  title: string;
  examples: Array<{ description: string; code: string; language?: string; good?: boolean }>;
}): string {
  const lines: string[] = [];

  // Section title
  lines.push(`# ${section.title}`);
  lines.push('');

  // Examples
  section.examples.forEach((example) => {
    // Example description
    const prefix = example.good === false ? '❌ Bad' : '✅ Good';
    lines.push(`## ${prefix}: ${example.description}`);
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
 * Convert persona to text
 */
function convertPersona(section: {
  type: 'persona';
  data: Record<string, unknown>;
}): string {
  const { name, role, icon, style, expertise } = section.data;
  const lines: string[] = [];

  lines.push('# Role');
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
 * Convert context to text
 */
function convertContext(section: {
  type: 'context';
  title: string;
  content: string;
}): string {
  const lines: string[] = [];

  lines.push(`# ${section.title}`);
  lines.push('');
  lines.push(section.content);

  return lines.join('\n');
}
