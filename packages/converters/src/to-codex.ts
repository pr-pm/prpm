/**
 * Codex Format Converter
 * Converts canonical format to OpenAI Codex CLI format
 *
 * Codex supports native formats:
 * 1. SKILL.md format for skills:
 *    - Directory: .agents/skills/{skill-name}/SKILL.md
 *    - YAML frontmatter with name, description, optional metadata
 *    - Based on Agent Skills standard (agentskills.io)
 *
 * 2. AGENT.md format for agents:
 *    - Directory: .agents/agents/{agent-name}/AGENT.md
 *
 * 3. AGENTS.md fallback for other subtypes (rules, slash-commands):
 *    - Progressive disclosure via named sections
 *    - Users invoke by saying the command/skill name
 *
 * @see https://developers.openai.com/codex/skills
 * @see https://agentskills.io
 */

import yaml from 'js-yaml';
import toml from '@iarna/toml';
import type {
  CanonicalPackage,
  ConversionResult,
  Section,
  Rule,
  Example,
} from './types/canonical.js';

export interface CodexConfig {
  /** Append to existing AGENTS.md instead of creating new */
  appendMode?: boolean;
  /** Existing AGENTS.md content to append to */
  existingContent?: string;
  /** Force output to AGENTS.md format even for skills */
  forceAgentsMd?: boolean;
}

/**
 * Convert canonical package to Codex format
 *
 * For skills, outputs SKILL.md format (native)
 * For other subtypes, outputs AGENTS.md format (progressive disclosure)
 */
export function toCodex(
  pkg: CanonicalPackage,
  options: { codexConfig?: CodexConfig } = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const config = options.codexConfig || {};
    const isSkill = pkg.subtype === 'skill';
    const isAgent = pkg.subtype === 'agent';
    const isSlashCommand = pkg.subtype === 'slash-command';

    let content: string;

    if (isSkill && !config.forceAgentsMd) {
      // Native SKILL.md format for skills
      content = convertToSkillMd(pkg, warnings);
    } else if (isAgent) {
      // Native TOML format for agent roles (~/.codex/agents/<name>.toml)
      content = convertToAgentRoleToml(pkg, warnings);
    } else if (isSlashCommand) {
      // Convert slash command to AGENTS.md section
      content = convertSlashCommandToSection(pkg, warnings);

      // If appending to existing content
      if (config.appendMode && config.existingContent) {
        content = appendToExistingAgentsMd(config.existingContent, content, pkg.name);
      }
    } else {
      // Regular conversion to AGENTS.md format
      content = convertToAgentsMd(pkg, warnings);
    }

    // Check for lossy conversion
    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content,
      format: 'codex',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'codex',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Convert canonical package to Codex agent role TOML format
 *
 * Outputs a TOML file suitable for ~/.codex/agents/<name>.toml
 * Fields: model, model_reasoning_effort, developer_instructions, sandbox_mode
 *
 * @see https://developers.openai.com/codex/multi-agent/#agent-roles
 */
function convertToAgentRoleToml(
  pkg: CanonicalPackage,
  warnings: string[]
): string {
  const metadataSection = pkg.content.sections.find(s => s.type === 'metadata');
  const instructionsSection = pkg.content.sections.find(s => s.type === 'instructions');

  // Build the TOML object
  const role: Record<string, unknown> = {};

  // Restore codex-specific metadata for roundtrip
  const codexAgent = metadataSection?.type === 'metadata'
    ? metadataSection.data.codexAgent
    : undefined;

  if (codexAgent?.model) {
    role['model'] = codexAgent.model;
  }
  if (codexAgent?.modelReasoningEffort) {
    role['model_reasoning_effort'] = codexAgent.modelReasoningEffort;
  }
  if (codexAgent?.sandboxMode) {
    role['sandbox_mode'] = codexAgent.sandboxMode;
  }

  // Map instructions section to developer_instructions
  if (instructionsSection?.type === 'instructions') {
    role['developer_instructions'] = instructionsSection.content;
  } else if (pkg.description) {
    // Fall back to package description
    role['developer_instructions'] = pkg.description;
  }

  // Warn about unsupported sections
  for (const section of pkg.content.sections) {
    if (section.type === 'tools') {
      warnings.push('Tools section skipped (not supported by Codex agent role TOML)');
    } else if (section.type === 'persona') {
      warnings.push('Persona section skipped (not supported by Codex agent role TOML)');
    } else if (section.type === 'rules') {
      warnings.push('Rules section skipped (not supported by Codex agent role TOML - use developer_instructions)');
    }
  }

  return toml.stringify(role as toml.JsonMap);
}

/**
 * Convert canonical package to native SKILL.md format
 * Per Agent Skills specification at agentskills.io
 *
 * Outputs YAML frontmatter with:
 * - name (required): 1-64 chars, lowercase alphanumeric and hyphens
 * - description (required): 1-1024 chars
 * - license (optional): licensing terms
 * - compatibility (optional): environment requirements
 * - allowed-tools (optional): space-delimited list of tools
 * - metadata (optional): arbitrary key-value pairs
 */
function convertToSkillMd(
  pkg: CanonicalPackage,
  warnings: string[]
): string {
  const lines: string[] = [];

  // Extract metadata section
  const metadataSection = pkg.content.sections.find(s => s.type === 'metadata');
  const toolsSection = pkg.content.sections.find(s => s.type === 'tools');

  const description = pkg.description || '';

  // Build frontmatter per Agent Skills spec
  // IMPORTANT: name must be the slug (lowercase, hyphens) matching the parent directory name.
  // Priority: preserved agentSkills.name > slugified package name (NOT display title/H1)
  const frontmatter: Record<string, any> = {
    name: slugify(stripNamespace(pkg.name)),
    description: truncateDescription(description, 1024),
  };

  // Add license from package if available
  if (pkg.license) {
    frontmatter.license = pkg.license;
  }

  // Check for existing Agent Skills metadata for roundtrip
  if (metadataSection?.type === 'metadata' && metadataSection.data.agentSkills) {
    const skillsData = metadataSection.data.agentSkills;

    // Use original name if available
    if (skillsData.name) {
      frontmatter.name = skillsData.name;
    }

    // Add optional fields per Agent Skills spec
    if (skillsData.license) {
      frontmatter.license = skillsData.license;
    }
    if (skillsData.compatibility) {
      frontmatter.compatibility = skillsData.compatibility;
    }
    if (skillsData.allowedTools) {
      frontmatter['allowed-tools'] = skillsData.allowedTools;
    }
    if (skillsData.metadata && Object.keys(skillsData.metadata).length > 0) {
      frontmatter.metadata = skillsData.metadata;
    }
  }

  // Convert tools section to allowed-tools if not already set
  if (toolsSection?.type === 'tools' && toolsSection.tools.length > 0 && !frontmatter['allowed-tools']) {
    frontmatter['allowed-tools'] = toolsSection.tools.join(' ');
  }

  // Generate YAML frontmatter
  lines.push('---');
  lines.push(yaml.dump(frontmatter, { indent: 2, lineWidth: -1 }).trim());
  lines.push('---');
  lines.push('');

  // Convert sections to body content
  for (const section of pkg.content.sections) {
    if (section.type === 'metadata') continue;
    if (section.type === 'tools') continue; // Already handled in frontmatter
    if (section.type === 'persona') {
      warnings.push('Persona section skipped (not supported by Agent Skills format)');
      continue;
    }

    const sectionContent = convertSection(section, warnings);
    if (sectionContent) {
      lines.push(sectionContent);
      lines.push('');
    }
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * Truncate description to max length per Agent Skills spec
 */
function truncateDescription(desc: string, maxLength: number): string {
  if (desc.length <= maxLength) return desc;
  return desc.substring(0, maxLength - 3) + '...';
}

/**
 * Strip author namespace from package name (e.g., @prpm/self-improving → self-improving)
 */
function stripNamespace(name: string): string {
  return name.replace(/^@[^/]+\//, '');
}

/**
 * Convert a skill name to a slug (lowercase, hyphens)
 * Per Agent Skills spec: 1-64 chars, lowercase alphanumeric and hyphens
 */
function slugify(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Handle edge case: empty result (e.g., input was '!!!')
  if (!slug) {
    return 'unnamed-skill';
  }

  // Enforce max length of 64 chars per Agent Skills spec
  if (slug.length > 64) {
    slug = slug.substring(0, 64).replace(/-$/, '');
  }

  return slug;
}

/**
 * Convert a slash command to an AGENTS.md section
 *
 * Creates a section that users can invoke by saying the command name
 */
function convertSlashCommandToSection(
  pkg: CanonicalPackage,
  warnings: string[]
): string {
  const lines: string[] = [];

  // Get command name (strip leading slash if present)
  const commandName = pkg.name.replace(/^\//, '');

  // Extract argument hint and description from metadata
  const metadataSection = pkg.content.sections.find(s => s.type === 'metadata');
  let argumentHint: string | string[] | undefined;
  let description = pkg.description;

  if (metadataSection && metadataSection.type === 'metadata') {
    const claudeSlashCommand = metadataSection.data.claudeSlashCommand;
    if (claudeSlashCommand) {
      argumentHint = claudeSlashCommand.argumentHint;
      if (claudeSlashCommand.description) {
        description = claudeSlashCommand.description;
      }
    }
  }

  // Section header
  lines.push(`## ${commandName}`);
  lines.push('');

  // Usage instruction
  if (argumentHint) {
    const args = formatArgumentHint(argumentHint);
    lines.push(`**Usage:** Say "${commandName} ${args}" to invoke this command`);
  } else {
    lines.push(`**Usage:** Say "${commandName}" to invoke this command`);
  }
  lines.push('');

  // Description
  if (description) {
    lines.push(`**Description:** ${description}`);
    lines.push('');
  }

  // Add argument details if present
  if (argumentHint) {
    const argNames = parseArgumentHint(argumentHint);
    if (argNames.length > 0) {
      lines.push('**Arguments:**');
      argNames.forEach((arg, i) => {
        lines.push(`- \`${arg}\` - Argument ${i + 1}`);
      });
      lines.push('');
    }
  }

  // Invocation instruction
  lines.push('---');
  lines.push('');
  lines.push(`When the user says "${commandName}" or asks to "${commandName.replace(/-/g, ' ')}", follow these instructions:`);
  lines.push('');

  // Convert the rest of the content
  for (const section of pkg.content.sections) {
    if (section.type === 'metadata') continue; // Already handled
    if (section.type === 'tools') {
      warnings.push('Tools section skipped (not supported by Codex AGENTS.md)');
      continue;
    }
    if (section.type === 'persona') {
      warnings.push('Persona section skipped (not supported by Codex AGENTS.md)');
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
 * Convert canonical package to standard AGENTS.md format
 */
function convertToAgentsMd(
  pkg: CanonicalPackage,
  warnings: string[]
): string {
  const lines: string[] = [];

  // Title
  const title = pkg.metadata?.title || pkg.name;
  lines.push(`# ${title}`);
  lines.push('');

  // Description
  if (pkg.description) {
    lines.push(pkg.description);
    lines.push('');
  }

  // Convert sections
  for (const section of pkg.content.sections) {
    if (section.type === 'metadata') continue;
    if (section.type === 'tools') {
      warnings.push('Tools section skipped (not supported by Codex AGENTS.md)');
      continue;
    }
    if (section.type === 'persona') {
      warnings.push('Persona section skipped (not supported by Codex AGENTS.md)');
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
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Append a new command section to existing AGENTS.md content
 */
function appendToExistingAgentsMd(
  existingContent: string,
  newSection: string,
  commandName: string
): string {
  // Strip leading slash and escape regex metacharacters
  const cleanCommandName = commandName.replace(/^\//, '');
  const escapedCommandName = escapeRegex(cleanCommandName);

  // Check if command already exists
  const sectionHeader = `## ${cleanCommandName}`;
  if (existingContent.includes(sectionHeader)) {
    // Replace existing section
    const regex = new RegExp(
      `## ${escapedCommandName}[\\s\\S]*?(?=## |$)`,
      'g'
    );
    return existingContent.replace(regex, newSection + '\n\n');
  }

  // Append new section
  const trimmedExisting = existingContent.trim();
  return `${trimmedExisting}\n\n${newSection}`;
}

/**
 * Convert individual section to markdown
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

    case 'hook':
      warnings.push('Hook section skipped (not supported by Codex)');
      return '';

    case 'cursor-hook':
      warnings.push('Cursor hook section skipped (not supported by Codex)');
      return '';

    case 'file-reference':
      warnings.push('File reference section skipped (not supported by Codex)');
      return '';

    case 'custom':
      if (!section.editorType || section.editorType === 'codex') {
        return section.content;
      }
      warnings.push(`Custom ${section.editorType} section skipped`);
      return '';

    default:
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
  priority?: string;
}): string {
  const lines: string[] = [];

  lines.push(`### ${section.title}`);
  lines.push('');

  if (section.priority === 'high') {
    lines.push('**Important:**');
    lines.push('');
  }

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
  ordered?: boolean;
}): string {
  const lines: string[] = [];

  lines.push(`### ${section.title}`);
  lines.push('');

  section.items.forEach((rule, index) => {
    const prefix = section.ordered ? `${index + 1}.` : '-';
    lines.push(`${prefix} ${rule.content}`);

    if (rule.rationale) {
      lines.push(`   - Rationale: ${rule.rationale}`);
    }

    if (rule.examples && rule.examples.length > 0) {
      rule.examples.forEach((example: string) => {
        lines.push(`   - Example: \`${example}\``);
      });
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

  lines.push(`### ${section.title}`);
  lines.push('');

  section.examples.forEach((example) => {
    if (example.good === false) {
      lines.push(`#### ❌ Avoid: ${example.description}`);
    } else if (example.good === true) {
      lines.push(`#### ✅ Preferred: ${example.description}`);
    } else {
      lines.push(`#### ${example.description}`);
    }

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

  lines.push(`### ${section.title}`);
  lines.push('');
  lines.push(section.content);

  return lines.join('\n');
}

/**
 * Format argument hint for display
 */
function formatArgumentHint(hint: string | string[]): string {
  if (Array.isArray(hint)) {
    return hint.map(arg => `<${arg}>`).join(' ');
  }

  // Handle bracketed format: [arg1] [arg2]
  const bracketMatches = hint.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    return bracketMatches.map(m => `<${m.replace(/^\[|\]$/g, '')}>`).join(' ');
  }

  // Space-separated format
  return hint.split(/\s+/).filter(Boolean).map(arg => `<${arg}>`).join(' ');
}

/**
 * Parse argument hint into array of argument names
 */
function parseArgumentHint(hint: string | string[]): string[] {
  if (Array.isArray(hint)) {
    return hint;
  }

  // Handle bracketed format: [arg1] [arg2]
  const bracketMatches = hint.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    return bracketMatches.map(m => m.replace(/^\[|\]$/g, ''));
  }

  // Space-separated format
  return hint.split(/\s+/).filter(Boolean);
}

/**
 * Generate suggested filename for Codex
 *
 * For skills: SKILL.md (inside .agents/skills/{name}/ directory)
 * For agents: AGENT.md (inside .agents/agents/{name}/ directory)
 * For other subtypes: AGENTS.md
 */
export function generateFilename(pkg?: CanonicalPackage, name?: string): string {
  if (pkg?.subtype === 'skill') {
    return 'SKILL.md';
  }
  if (pkg?.subtype === 'agent') {
    // Agent roles use <name>.toml (installed to ~/.codex/agents/<name>.toml)
    const roleName = name || pkg?.name || 'agent';
    return `${roleName}.toml`;
  }
  return 'AGENTS.md';
}

/**
 * Check if content appears to be in Codex SKILL.md format
 * Handles both Unix (\n) and Windows (\r\n) line endings
 * Tolerates trailing spaces after ---
 */
export function isCodexSkillFormat(content: string): boolean {
  // Normalize line endings (handle Windows CRLF)
  const normalizedContent = content.replace(/\r\n/g, '\n');

  // Check for YAML frontmatter with name and description
  // Lenient regex: allows trailing spaces after ---
  const match = normalizedContent.match(/^---[ \t]*\n([\s\S]*?)\n---/);
  if (!match) return false;

  const frontmatterText = match[1];
  // Check for required Agent Skills fields (handles both quoted and unquoted keys)
  const hasName = /^[ \t]*name\s*:/m.test(frontmatterText);
  const hasDescription = /^[ \t]*description\s*:/m.test(frontmatterText);
  return hasName && hasDescription;
}
