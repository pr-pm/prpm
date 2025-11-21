import type {
  CanonicalPackage,
  ConversionResult,
} from './types/canonical.js';
import yaml from 'js-yaml';

/**
 * Convert canonical format to Factory Droid format
 *
 * Factory Droid uses markdown files with YAML frontmatter for:
 * - Skills: .factory/skills/<skill-name>/SKILL.md
 * - Slash Commands: .factory/commands/*.md
 * - Hooks: Typically hooks are configuration-based in hooks.json,
 *          but can also be implemented as executable scripts
 *
 * @param pkg - Canonical package
 * @returns Conversion result with Factory Droid formatted content
 */
export function toDroid(pkg: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const result = convertContent(pkg, warnings, qualityScore);
    const content = result.content;
    qualityScore = result.qualityScore;

    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content,
      format: 'droid',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'droid',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

function convertContent(pkg: CanonicalPackage, warnings: string[], qualityScore: number): { content: string; qualityScore: number } {
  const lines: string[] = [];

  // Extract sections
  const metadata = pkg.content.sections.find(s => s.type === 'metadata');
  const instructions = pkg.content.sections.find(s => s.type === 'instructions');
  const rules = pkg.content.sections.find(s => s.type === 'rules');
  const examples = pkg.content.sections.find(s => s.type === 'examples');
  const persona = pkg.content.sections.find(s => s.type === 'persona');

  // Build frontmatter
  const frontmatter: Record<string, any> = {};

  if (metadata?.type === 'metadata') {
    frontmatter.name = metadata.data.title || pkg.name;
    frontmatter.description = metadata.data.description || pkg.description;

    // Restore Factory Droid-specific metadata (for roundtrip)
    const droidData = metadata.data.droid;
    if (droidData) {
      if (droidData.argumentHint) {
        frontmatter['argument-hint'] = droidData.argumentHint;
      }
      if (droidData.allowedTools && droidData.allowedTools.length > 0) {
        frontmatter['allowed-tools'] = droidData.allowedTools;
      }
    }
  } else {
    frontmatter.name = pkg.name;
    frontmatter.description = pkg.description;
  }

  // Check for package-level droid metadata
  if (pkg.metadata?.droid) {
    if (pkg.metadata.droid.argumentHint && !frontmatter['argument-hint']) {
      frontmatter['argument-hint'] = pkg.metadata.droid.argumentHint;
    }
    if (pkg.metadata.droid.allowedTools && pkg.metadata.droid.allowedTools.length > 0 && !frontmatter['allowed-tools']) {
      frontmatter['allowed-tools'] = pkg.metadata.droid.allowedTools;
    }
  }

  // Generate YAML frontmatter
  lines.push('---');
  lines.push(yaml.dump(frontmatter, { indent: 2, lineWidth: -1 }).trim());
  lines.push('---');
  lines.push('');

  // Add body content
  const bodyParts: string[] = [];

  // Add persona if present
  if (persona?.type === 'persona') {
    bodyParts.push(`# Role\n\n${persona.data.role}`);
    warnings.push('Persona section converted to Role heading');
  }

  // Add instructions
  if (instructions?.type === 'instructions') {
    bodyParts.push(instructions.content);
  }

  // Add rules if present
  if (rules?.type === 'rules') {
    const rulesHeader = `## ${rules.title || 'Rules'}`;
    const rulesList = rules.items
      .map((rule, idx) => {
        const prefix = rules.ordered ? `${idx + 1}. ` : '- ';
        return `${prefix}${rule.content}`;
      })
      .join('\n');
    bodyParts.push(`${rulesHeader}\n\n${rulesList}`);
  }

  // Add examples if present
  if (examples?.type === 'examples') {
    const examplesHeader = `## ${examples.title || 'Examples'}`;
    const examplesList = examples.examples
      .map(example => {
        let exampleText = `### ${example.description}\n\n`;
        if (example.language) {
          exampleText += `\`\`\`${example.language}\n${example.code}\n\`\`\``;
        } else {
          exampleText += `\`\`\`\n${example.code}\n\`\`\``;
        }
        return exampleText;
      })
      .join('\n\n');
    bodyParts.push(`${examplesHeader}\n\n${examplesList}`);
  }

  // Check for unsupported sections
  const supportedTypes = ['metadata', 'instructions', 'rules', 'examples', 'persona'];
  const unsupportedSections = pkg.content.sections.filter(
    s => !supportedTypes.includes(s.type)
  );

  if (unsupportedSections.length > 0) {
    const types = unsupportedSections.map(s => s.type).join(', ');
    warnings.push(`Factory Droid does not support these section types: ${types}. They were skipped.`);
    qualityScore -= unsupportedSections.length * 5;
  }

  lines.push(bodyParts.join('\n\n'));

  return {
    content: lines.join('\n').trim() + '\n',
    qualityScore,
  };
}
