/**
 * OpenCode Format Converter
 * Converts canonical format to OpenCode agent format
 *
 * OpenCode stores agents in .opencode/agent/${name}.md with YAML frontmatter
 * @see https://opencode.ai/docs/agents/
 */

import type {
  CanonicalPackage,
  ConversionResult,
} from './types/canonical.js';
import yaml from 'js-yaml';

/**
 * Convert canonical package to OpenCode agent format
 */
export function toOpencode(pkg: CanonicalPackage): ConversionResult {
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
      format: 'opencode',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'opencode',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert canonical content to OpenCode agent or slash command format
 */
function convertContent(pkg: CanonicalPackage, warnings: string[]): string {
  const lines: string[] = [];

  // Extract sections
  const metadata = pkg.content.sections.find(s => s.type === 'metadata');
  const tools = pkg.content.sections.find(s => s.type === 'tools');

  // Build frontmatter
  const frontmatter: Record<string, any> = {};

  // Handle slash commands differently from agents
  if (pkg.subtype === 'slash-command') {
    // OpenCode Slash Command format requires 'template' field
    const opencodeSlashCommand = metadata?.type === 'metadata' ? metadata.data.opencodeSlashCommand : undefined;
    const firstInstructions = pkg.content.sections.find(s => s.type === 'instructions');

    if (opencodeSlashCommand?.template) {
      frontmatter.template = opencodeSlashCommand.template;
    } else if (firstInstructions?.type === 'instructions') {
      // Fallback: use first instruction as template
      frontmatter.template = firstInstructions.content;
      warnings.push('No template field found, using instructions content as template');
    } else {
      // Required field missing
      frontmatter.template = 'Execute the following task: {{args}}';
      warnings.push('REQUIRED template field missing for slash command, using default placeholder');
    }

    // Optional slash command fields
    if (opencodeSlashCommand) {
      if (opencodeSlashCommand.description) frontmatter.description = opencodeSlashCommand.description;
      if (opencodeSlashCommand.agent) frontmatter.agent = opencodeSlashCommand.agent;
      if (opencodeSlashCommand.model) frontmatter.model = opencodeSlashCommand.model;
      if (opencodeSlashCommand.subtask !== undefined) frontmatter.subtask = opencodeSlashCommand.subtask;
    } else if (metadata?.type === 'metadata' && metadata.data.description) {
      frontmatter.description = metadata.data.description;
    }
  } else {
    // OpenCode Agent format
    // Required: description and mode
    if (metadata?.type === 'metadata') {
      frontmatter.description = metadata.data.description;
    }

    // Restore OpenCode-specific metadata if present (for roundtrip)
    const opencodeData = metadata?.type === 'metadata' ? metadata.data.opencode : undefined;
    if (opencodeData) {
      if (opencodeData.mode) {
        frontmatter.mode = opencodeData.mode;
      } else {
        // REQUIRED field: default to 'all' if not specified
        frontmatter.mode = 'all';
        warnings.push('REQUIRED mode field missing, defaulting to "all"');
      }
      if (opencodeData.model) frontmatter.model = opencodeData.model;
      if (opencodeData.temperature !== undefined) frontmatter.temperature = opencodeData.temperature;
      if (opencodeData.permission) frontmatter.permission = opencodeData.permission;
      if (opencodeData.disable !== undefined) frontmatter.disable = opencodeData.disable;
    } else {
      // No OpenCode metadata: default mode to 'all'
      frontmatter.mode = 'all';
      warnings.push('REQUIRED mode field missing, defaulting to "all"');
    }

    // Convert tools to OpenCode format (object with boolean values)
    if (tools?.type === 'tools' && tools.tools.length > 0) {
      const toolsObj: Record<string, boolean> = {};

      // Map canonical tool names to OpenCode lowercase format
      const toolMap: Record<string, string> = {
        'Write': 'write',
        'Edit': 'edit',
        'Bash': 'bash',
        'Read': 'read',
        'Grep': 'grep',
        'Glob': 'glob',
        'WebFetch': 'webfetch',
        'WebSearch': 'websearch',
      };

      for (const tool of tools.tools) {
        const opencodeToolName = toolMap[tool] || tool.toLowerCase();
        toolsObj[opencodeToolName] = true;
      }

      frontmatter.tools = toolsObj;
    }
  }

  // Generate YAML frontmatter
  lines.push('---');
  lines.push(yaml.dump(frontmatter, { indent: 2, lineWidth: -1 }).trim());
  lines.push('---');
  lines.push('');

  // Add all content sections (not just the first instructions section)
  // This ensures skills and agents with multiple sections are fully converted
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
        lines.push('```');
        lines.push(example.code);
        lines.push('```');
        lines.push('');
      }
    } else if (section.type === 'context') {
      // Include context sections with their title
      const contextTitle = section.title || 'Context';
      lines.push(`## ${contextTitle}`);
      lines.push('');
      lines.push(section.content);
      lines.push('');
    } else {
      warnings.push(`Section type '${section.type}' may not be fully supported in OpenCode format`);
    }
  }

  return lines.join('\n').trim() + '\n';
}
