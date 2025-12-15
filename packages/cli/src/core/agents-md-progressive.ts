/**
 * Progressive disclosure support for manifest files (AGENTS.md, GEMINI.md, etc.)
 *
 * Based on the OpenSkills specification by @numman-ali
 * @see https://github.com/numman-ali/openskills
 *
 * OpenSkills pioneered the progressive disclosure pattern for AI development:
 * - Skills/agents listed in manifest but not loaded into context by default
 * - XML-based manifest format with <skill> and <agent> tags
 * - Path-based loading via cat or Task tool
 * - Keeps context window clean and efficient
 *
 * This implementation extends OpenSkills to support:
 * - Multiple manifest formats (AGENTS.md, GEMINI.md, CLAUDE.md)
 * - Separate skills and agents systems
 * - PRPM package management integration
 *
 * Credit: Huge thanks to @numman-ali for creating OpenSkills and demonstrating
 * how progressive disclosure dramatically improves AI coding workflows.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileExists } from './filesystem.js';

export type ResourceType = 'skill' | 'agent' | 'command';

export interface SkillManifestEntry {
  name: string; // Resource name (e.g., 'backend-architect', 'code-reviewer', 'build-actions')
  description: string; // Brief description for progressive disclosure
  skillPath: string; // Relative path to resource directory or file (e.g., '.openskills/backend-architect', '.opencommands/build-actions.md')
  mainFile?: string; // Main file (defaults to 'SKILL.md' for skills, 'AGENT.md' for agents, filename for commands)
  resourceType?: ResourceType; // Type of resource: 'skill', 'agent', or 'command' (defaults to 'skill' for backward compatibility)
  eager?: boolean; // Whether this resource should always activate (eager) or be on-demand (lazy/default)
}

/**
 * Generate XML manifest entry for a skill, agent, or command
 *
 * Format inspired by OpenSkills (@numman-ali)
 * @see https://github.com/numman-ali/openskills
 */
export function generateSkillXML(entry: SkillManifestEntry): string {
  const resourceType = entry.resourceType || 'skill';
  let tag: string;
  let mainFile: string;
  let fullPath: string;

  if (resourceType === 'command') {
    tag = 'command';
    // For commands, skillPath is the directory and mainFile is the filename
    mainFile = entry.mainFile || `${entry.name}.md`;
    fullPath = path.join(entry.skillPath, mainFile);
  } else if (resourceType === 'agent') {
    tag = 'agent';
    mainFile = entry.mainFile || 'AGENT.md';
    fullPath = path.join(entry.skillPath, mainFile);
  } else {
    tag = 'skill';
    mainFile = entry.mainFile || 'SKILL.md';
    fullPath = path.join(entry.skillPath, mainFile);
  }

  const activation = entry.eager ? 'eager' : 'lazy';

  return `<${tag} activation="${activation}">
<name>${escapeXML(entry.name)}</name>
<description>${escapeXML(entry.description)}</description>
<path>${escapeXML(fullPath)}</path>
</${tag}>`;
}

/**
 * Generate eager skills system header (priority="0" - processed first)
 *
 * Eager skills MUST be loaded at the START of every session.
 * They are always active and do not wait for relevance.
 */
function generateEagerSkillsSystemHeader(): string {
  return `<!-- PRPM_MANIFEST_START -->

<skills_system priority="0">
<usage>
MANDATORY: You MUST load and apply these skills at the START of every session.
Do not wait for relevance - these are always active.

How to use eager skills:
- Load each skill immediately using Bash("cat <path>")
- These skills apply to ALL work in this project
- Do NOT skip or defer loading these skills
</usage>

<eager_skills>`;
}

/**
 * Generate skills system header (priority="1" - progressive disclosure)
 *
 * Uses OpenSkills progressive disclosure pattern (@numman-ali)
 * Skills are listed but not loaded until explicitly requested via Bash("cat <path>")
 */
function generateSkillsSystemHeader(includeManifestStart: boolean = true): string {
  const prefix = includeManifestStart ? '<!-- PRPM_MANIFEST_START -->\n\n' : '';
  return `${prefix}<skills_system priority="1">
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills (loaded into main context):
- Use the <path> from the skill entry below
- Invoke: Bash("cat <path>")
- The skill content will load into your current context
- Example: Bash("cat .openskills/backend-architect/SKILL.md")

Usage notes:
- Skills share your context window
- Do not invoke a skill that is already loaded in your context
</usage>

<available_skills>`;
}

/**
 * Generate agents system header
 */
function generateAgentsSystemHeader(): string {
  return `<agents_system priority="1">
<usage>
Agents are specialized AI assistants that run in independent contexts for complex multi-step tasks.

How to use agents (spawned with independent context):
- The <path> from the agent entry contains the agent definition file
- The agent definition will be automatically loaded into the subagent's context
- Invoke: Task(subagent_type="<agent-name>", prompt="task description")
- The agent runs in a separate context and returns results
- Example: Task(subagent_type="code-reviewer", prompt="Review the authentication code in auth.ts")

Usage notes:
- Agents have independent context windows
- Each agent invocation is stateless
- Agents are spawned as subprocesses via the Task tool
- The agent's AGENT.md file is loaded into the subagent's context automatically
</usage>

<available_agents>`;
}

/**
 * Generate commands system header
 */
function generateCommandsSystemHeader(): string {
  return `<commands_system priority="1">
<usage>
Commands are reusable workflows that can be invoked by the user or triggered by context.

How to use commands:
- When a user explicitly asks for a command (e.g., "run build-actions" or "/build-actions")
- Or when the task context matches a command's description
- Load the command: Bash("cat <path>")
- Follow the instructions in the loaded command file
- Example: Bash("cat .opencommands/build-actions.md")

Usage notes:
- Commands are loaded into your current context when invoked
- Each command contains step-by-step instructions for a specific workflow
- Commands may reference other skills or agents
</usage>

<available_commands>`;
}

/**
 * Generate manifest footer
 */
function generateManifestFooter(hasAgents: boolean, agentsXML?: string): string {
  let footer = '</available_skills>\n</skills_system>';

  if (hasAgents && agentsXML) {
    footer += '\n\n' + generateAgentsSystemHeader();
    footer += `\n\n${agentsXML}\n\n`;
    footer += '</available_agents>\n</agents_system>';
  }

  footer += '\n\n<!-- PRPM_MANIFEST_END -->';

  return footer;
}

/**
 * Read existing manifest file (AGENTS.md, GEMINI.md, etc.) and extract skill manifest section
 */
export async function readAgentsMdManifest(
  agentsPath: string = 'AGENTS.md'
): Promise<{
  beforeManifest: string;
  manifest: string;
  afterManifest: string;
}> {
  if (!(await fileExists(agentsPath))) {
    return {
      beforeManifest: '',
      manifest: '',
      afterManifest: '',
    };
  }

  const content = await fs.readFile(agentsPath, 'utf-8');

  // Look for manifest section (try new format first, fall back to legacy)
  let manifestStart = '<!-- PRPM_MANIFEST_START -->';
  let manifestEnd = '<!-- PRPM_MANIFEST_END -->';

  let startIdx = content.indexOf(manifestStart);
  let endIdx = content.indexOf(manifestEnd);

  // Fall back to old SKILLS_TABLE markers for backward compatibility
  if (startIdx === -1 || endIdx === -1) {
    manifestStart = '<!-- SKILLS_TABLE_START -->';
    manifestEnd = '<!-- SKILLS_TABLE_END -->';
    startIdx = content.indexOf(manifestStart);
    endIdx = content.indexOf(manifestEnd);
  }

  // Fall back to oldest PRPM Manifest format
  if (startIdx === -1 || endIdx === -1) {
    manifestStart = '<!-- PRPM Manifest -->';
    manifestEnd = '<!-- End PRPM Manifest -->';
    startIdx = content.indexOf(manifestStart);
    endIdx = content.indexOf(manifestEnd);
  }

  if (startIdx === -1 || endIdx === -1) {
    // No manifest section exists yet
    return {
      beforeManifest: content,
      manifest: '',
      afterManifest: '',
    };
  }

  const beforeManifest = content.substring(0, startIdx);
  const manifest = content.substring(
    startIdx + manifestStart.length,
    endIdx
  ).trim();
  const afterManifest = content.substring(endIdx + manifestEnd.length);

  return {
    beforeManifest,
    manifest,
    afterManifest,
  };
}

/**
 * Add or update skill or agent in manifest file (AGENTS.md, GEMINI.md, etc.)
 */
export async function addSkillToManifest(
  entry: SkillManifestEntry,
  agentsPath: string = 'AGENTS.md'
): Promise<void> {
  const { beforeManifest, manifest, afterManifest } = await readAgentsMdManifest(agentsPath);

  // Parse existing resources
  const existingResources = parseSkillsFromManifest(manifest);

  // Remove existing entry with same name (if updating)
  const updatedResources = existingResources.filter(s => s.name !== entry.name);

  // Add new entry
  updatedResources.push(entry);

  // Separate skills, agents, and commands, then further separate by eager/lazy
  const skills = updatedResources.filter(r => (r.resourceType || 'skill') === 'skill');
  const agents = updatedResources.filter(r => r.resourceType === 'agent');
  const commands = updatedResources.filter(r => r.resourceType === 'command');

  const eagerSkills = skills.filter(s => s.eager === true);
  const lazySkills = skills.filter(s => s.eager !== true);
  const eagerAgents = agents.filter(a => a.eager === true);
  const lazyAgents = agents.filter(a => a.eager !== true);
  const eagerCommands = commands.filter(c => c.eager === true);
  const lazyCommands = commands.filter(c => c.eager !== true);

  // Reconstruct AGENTS.md
  let newContent = '';

  // If this is a new AGENTS.md file, add minimal header
  if (!beforeManifest.trim() && !afterManifest.trim()) {
    newContent = '';
  } else {
    newContent = beforeManifest;
  }

  // Generate eager section first (priority="0") if there are any eager skills/agents/commands
  const hasEagerContent = eagerSkills.length > 0 || eagerAgents.length > 0 || eagerCommands.length > 0;
  const hasLazyContent = lazySkills.length > 0 || lazyAgents.length > 0 || lazyCommands.length > 0;

  if (hasEagerContent) {
    // Eager skills section
    if (eagerSkills.length > 0) {
      newContent += generateEagerSkillsSystemHeader();
      newContent += '\n\n';
      newContent += eagerSkills.map(s => generateSkillXML(s)).join('\n\n');
      newContent += '\n\n</eager_skills>\n</skills_system>\n\n';
    }

    // Eager agents section
    if (eagerAgents.length > 0) {
      newContent += `<agents_system priority="0">
<usage>
MANDATORY: These agents are always available and should be used proactively.
Do not wait for explicit requests - invoke these agents when their expertise applies.
</usage>

<eager_agents>\n\n`;
      newContent += eagerAgents.map(a => generateSkillXML(a)).join('\n\n');
      newContent += '\n\n</eager_agents>\n</agents_system>\n\n';
    }

    // Eager commands section
    if (eagerCommands.length > 0) {
      newContent += `<commands_system priority="0">
<usage>
MANDATORY: These commands are always available and should be suggested proactively.
When user tasks match these commands, offer to run them.
</usage>

<eager_commands>\n\n`;
      newContent += eagerCommands.map(c => generateSkillXML(c)).join('\n\n');
      newContent += '\n\n</eager_commands>\n</commands_system>\n\n';
    }
  }

  // Generate lazy section (priority="1") - progressive disclosure
  if (hasLazyContent) {
    // Lazy skills
    if (lazySkills.length > 0) {
      // Only include manifest start marker if there's no eager content
      newContent += generateSkillsSystemHeader(!hasEagerContent);
      newContent += '\n\n';
      newContent += lazySkills.map(s => generateSkillXML(s)).join('\n\n');
      newContent += '\n\n</available_skills>\n</skills_system>';
    }

    // Lazy agents
    if (lazyAgents.length > 0) {
      newContent += '\n\n' + generateAgentsSystemHeader();
      newContent += '\n\n';
      newContent += lazyAgents.map(a => generateSkillXML(a)).join('\n\n');
      newContent += '\n\n</available_agents>\n</agents_system>';
    }

    // Lazy commands
    if (lazyCommands.length > 0) {
      newContent += '\n\n' + generateCommandsSystemHeader();
      newContent += '\n\n';
      newContent += lazyCommands.map(c => generateSkillXML(c)).join('\n\n');
      newContent += '\n\n</available_commands>\n</commands_system>';
    }
  }

  // Add manifest end marker
  newContent += '\n\n<!-- PRPM_MANIFEST_END -->';
  newContent += afterManifest;

  await fs.writeFile(agentsPath, newContent.trim() + '\n', 'utf-8');
}

/**
 * Remove skill or agent from AGENTS.md manifest
 */
export async function removeSkillFromManifest(
  skillName: string,
  agentsPath: string = 'AGENTS.md'
): Promise<void> {
  const { beforeManifest, manifest, afterManifest } = await readAgentsMdManifest(agentsPath);

  if (!manifest) {
    // No manifest section, nothing to remove
    return;
  }

  // Parse existing resources
  const existingResources = parseSkillsFromManifest(manifest);

  // Filter out the resource to remove
  const updatedResources = existingResources.filter(s => s.name !== skillName);

  // If no resources remain, remove the entire manifest section
  if (updatedResources.length === 0) {
    const newContent = (beforeManifest + afterManifest).trim();
    if (newContent) {
      await fs.writeFile(agentsPath, newContent + '\n', 'utf-8');
    } else {
      // File would be empty, delete it
      await fs.unlink(agentsPath);
    }
    return;
  }

  // Separate skills and agents
  const skills = updatedResources.filter(r => (r.resourceType || 'skill') === 'skill');
  const agents = updatedResources.filter(r => r.resourceType === 'agent');

  // Generate XML entries
  const skillsXML = skills
    .map(s => generateSkillXML(s))
    .join('\n\n');

  const agentsXML = agents.length > 0
    ? agents.map(a => generateSkillXML(a)).join('\n\n')
    : undefined;

  // Reconstruct AGENTS.md with separate systems
  const hasAgents = agents.length > 0;
  let newContent = beforeManifest;
  newContent += generateSkillsSystemHeader();
  newContent += '\n\n';
  newContent += skillsXML;
  newContent += '\n\n';
  newContent += generateManifestFooter(hasAgents, agentsXML);
  newContent += afterManifest;

  await fs.writeFile(agentsPath, newContent.trim() + '\n', 'utf-8');
}

/**
 * Parse skill and agent entries from manifest XML
 */
function parseSkillsFromManifest(manifestXML: string): SkillManifestEntry[] {
  const resources: SkillManifestEntry[] = [];

  // Try new format with activation attribute: <skill activation="eager|lazy">...</skill>
  const skillFormatWithAttrRegex = /<skill(?:\s+activation="(eager|lazy)")?\s*>\s*<name>([^<]+)<\/name>\s*<description>([^<]+)<\/description>\s*<path>([^<]+)<\/path>\s*<\/skill>/g;

  let match;
  while ((match = skillFormatWithAttrRegex.exec(manifestXML)) !== null) {
    const [, activation, name, description, fullPath] = match;

    // Extract directory and file from path
    const pathParts = fullPath.trim().split('/');
    const mainFile = pathParts[pathParts.length - 1];
    const dir = pathParts.slice(0, -1).join('/');

    resources.push({
      name: unescapeXML(name.trim()),
      description: unescapeXML(description.trim()),
      skillPath: dir,
      mainFile,
      resourceType: 'skill',
      eager: activation === 'eager',
    });
  }

  // Try new format for agents with activation attribute: <agent activation="eager|lazy">...</agent>
  const agentFormatWithAttrRegex = /<agent(?:\s+activation="(eager|lazy)")?\s*>\s*<name>([^<]+)<\/name>\s*<description>([^<]+)<\/description>\s*<path>([^<]+)<\/path>\s*<\/agent>/g;

  while ((match = agentFormatWithAttrRegex.exec(manifestXML)) !== null) {
    const [, activation, name, description, fullPath] = match;

    // Extract directory and file from path
    const pathParts = fullPath.trim().split('/');
    const mainFile = pathParts[pathParts.length - 1];
    const dir = pathParts.slice(0, -1).join('/');

    resources.push({
      name: unescapeXML(name.trim()),
      description: unescapeXML(description.trim()),
      skillPath: dir,
      mainFile,
      resourceType: 'agent',
      eager: activation === 'eager',
    });
  }

  // Try new format for commands with activation attribute: <command activation="eager|lazy">...</command>
  const commandFormatWithAttrRegex = /<command(?:\s+activation="(eager|lazy)")?\s*>\s*<name>([^<]+)<\/name>\s*<description>([^<]+)<\/description>\s*<path>([^<]+)<\/path>\s*<\/command>/g;

  while ((match = commandFormatWithAttrRegex.exec(manifestXML)) !== null) {
    const [, activation, name, description, fullPath] = match;

    // Extract directory and file from path
    const pathParts = fullPath.trim().split('/');
    const mainFile = pathParts[pathParts.length - 1];
    const dir = pathParts.slice(0, -1).join('/');

    resources.push({
      name: unescapeXML(name.trim()),
      description: unescapeXML(description.trim()),
      skillPath: dir,
      mainFile,
      resourceType: 'command',
      eager: activation === 'eager',
    });
  }

  // Fall back to legacy format if no new format resources found
  if (resources.length === 0) {
    // Match legacy format: <skill name="..." path="...">description</skill>
    const legacyRegex = /<skill\s+name="([^"]+)"\s+path="([^"]+)">([^<]*)<\/skill>/g;

    while ((match = legacyRegex.exec(manifestXML)) !== null) {
      const [, name, skillPath, description] = match;

      // Extract main file from path (last segment after /)
      const pathParts = skillPath.split('/');
      const mainFile = pathParts[pathParts.length - 1];
      const dir = pathParts.slice(0, -1).join('/');

      resources.push({
        name: unescapeXML(name),
        description: unescapeXML(description.trim()),
        skillPath: dir,
        mainFile,
        resourceType: 'skill',
        eager: false, // Legacy format defaults to lazy
      });
    }
  }

  return resources;
}

/**
 * List all skills in AGENTS.md manifest
 */
export async function listManifestSkills(
  agentsPath: string = 'AGENTS.md'
): Promise<SkillManifestEntry[]> {
  const { manifest } = await readAgentsMdManifest(agentsPath);
  return parseSkillsFromManifest(manifest);
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Unescape XML special characters
 */
function unescapeXML(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Generate instructions comment for using skills
 */
export function generateSkillUsageInstructions(): string {
  return `<!--
Progressive Disclosure Skills

Skills are installed but not loaded into context by default.
This keeps your context window clean and efficient.

To activate a skill:
  prpm activate <skill-name>

To list available skills:
  prpm list --skills

To deactivate a skill:
  prpm deactivate <skill-name>

Skills are stored in .openskills/ directory.
-->`;
}
