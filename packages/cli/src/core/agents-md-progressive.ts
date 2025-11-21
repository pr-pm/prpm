/**
 * Progressive disclosure support for manifest files (AGENTS.md, GEMINI.md, etc.)
 * Implements OpenSkills-style skill loading with XML manifests
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileExists } from './filesystem.js';

export type ResourceType = 'skill' | 'agent';

export interface SkillManifestEntry {
  name: string; // Resource name (e.g., 'backend-architect', 'code-reviewer')
  description: string; // Brief description for progressive disclosure
  skillPath: string; // Relative path to resource directory (e.g., '.openskills/backend-architect' or '.openagents/code-reviewer')
  mainFile?: string; // Main file (defaults to 'SKILL.md' for skills, 'AGENT.md' for agents)
  resourceType?: ResourceType; // Type of resource: 'skill' or 'agent' (defaults to 'skill' for backward compatibility)
}

/**
 * Generate XML manifest entry for a skill or agent
 * Format matches OpenSkills/Claude progressive disclosure pattern
 */
export function generateSkillXML(entry: SkillManifestEntry): string {
  const resourceType = entry.resourceType || 'skill';
  const tag = resourceType === 'agent' ? 'agent' : 'skill';
  const mainFile = entry.mainFile || (resourceType === 'agent' ? 'AGENT.md' : 'SKILL.md');
  const fullPath = path.join(entry.skillPath, mainFile);

  return `<${tag}>
<name>${escapeXML(entry.name)}</name>
<description>${escapeXML(entry.description)}</description>
<path>${escapeXML(fullPath)}</path>
</${tag}>`;
}

/**
 * Generate skills system header
 */
function generateSkillsSystemHeader(): string {
  return `<!-- PRPM_MANIFEST_START -->

<skills_system priority="1">
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

  // Reconstruct AGENTS.md
  let newContent = '';

  // If this is a new AGENTS.md file, add minimal header
  if (!beforeManifest.trim() && !afterManifest.trim()) {
    newContent = '';
  } else {
    newContent = beforeManifest;
  }

  // Generate full OpenSkills-compatible manifest with separate systems
  const hasAgents = agents.length > 0;
  newContent += generateSkillsSystemHeader();
  newContent += '\n\n';
  newContent += skillsXML;
  newContent += '\n\n';
  newContent += generateManifestFooter(hasAgents, agentsXML);
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

  // Try new format for skills: <skill><name>...</name><description>...</description><path>...</path></skill>
  const skillFormatRegex = /<skill>\s*<name>([^<]+)<\/name>\s*<description>([^<]+)<\/description>\s*<path>([^<]+)<\/path>\s*<\/skill>/g;

  let match;
  while ((match = skillFormatRegex.exec(manifestXML)) !== null) {
    const [, name, description, fullPath] = match;

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
    });
  }

  // Try new format for agents: <agent><name>...</name><description>...</description><path>...</path></agent>
  const agentFormatRegex = /<agent>\s*<name>([^<]+)<\/name>\s*<description>([^<]+)<\/description>\s*<path>([^<]+)<\/path>\s*<\/agent>/g;

  while ((match = agentFormatRegex.exec(manifestXML)) !== null) {
    const [, name, description, fullPath] = match;

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
