/**
 * Progressive disclosure support for manifest files (AGENTS.md, GEMINI.md, etc.)
 * Implements OpenSkills-style skill loading with XML manifests
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileExists } from './filesystem.js';

export interface SkillManifestEntry {
  name: string; // Skill name (e.g., 'backend-architect')
  description: string; // Brief description for progressive disclosure
  skillPath: string; // Relative path to skill directory (e.g., '.openskills/backend-architect')
  mainFile?: string; // Main skill file (defaults to 'SKILL.md')
}

/**
 * Generate XML manifest entry for a skill
 * Format matches OpenSkills/Claude progressive disclosure pattern
 */
export function generateSkillXML(entry: SkillManifestEntry): string {
  const mainFile = entry.mainFile || 'SKILL.md';
  const fullPath = path.join(entry.skillPath, mainFile);

  return `<skill name="${escapeXML(entry.name)}" path="${escapeXML(fullPath)}">
  ${escapeXML(entry.description)}
</skill>`;
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

  // Look for manifest section
  // Format: <!-- PRPM Manifest --> ... <!-- End PRPM Manifest -->
  const manifestStart = '<!-- PRPM Manifest -->';
  const manifestEnd = '<!-- End PRPM Manifest -->';

  const startIdx = content.indexOf(manifestStart);
  const endIdx = content.indexOf(manifestEnd);

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
 * Add or update skill in manifest file (AGENTS.md, GEMINI.md, etc.)
 */
export async function addSkillToManifest(
  entry: SkillManifestEntry,
  agentsPath: string = 'AGENTS.md'
): Promise<void> {
  const { beforeManifest, manifest, afterManifest } = await readAgentsMdManifest(agentsPath);

  // Parse existing skills
  const existingSkills = parseSkillsFromManifest(manifest);

  // Remove existing entry with same name (if updating)
  const updatedSkills = existingSkills.filter(s => s.name !== entry.name);

  // Add new entry
  updatedSkills.push(entry);

  // Generate new manifest content
  const manifestContent = updatedSkills
    .map(s => generateSkillXML(s))
    .join('\n\n');

  // Reconstruct AGENTS.md
  let newContent = '';

  // If this is a new AGENTS.md file, add header
  if (!beforeManifest.trim() && !afterManifest.trim()) {
    newContent = `# Project AI Resources\n\nThis project uses progressive disclosure for AI skills and agents.\n\n`;
  } else {
    newContent = beforeManifest;
  }

  newContent += `<!-- PRPM Manifest -->\n`;
  newContent += `<!-- Skills are loaded on-demand, agents are spawned via Task tool -->\n\n`;
  newContent += manifestContent;
  newContent += `\n<!-- End PRPM Manifest -->`;
  newContent += afterManifest;

  await fs.writeFile(agentsPath, newContent.trim() + '\n', 'utf-8');
}

/**
 * Remove skill from AGENTS.md manifest
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

  // Parse existing skills
  const existingSkills = parseSkillsFromManifest(manifest);

  // Filter out the skill to remove
  const updatedSkills = existingSkills.filter(s => s.name !== skillName);

  // If no skills remain, remove the entire manifest section
  if (updatedSkills.length === 0) {
    const newContent = (beforeManifest + afterManifest).trim();
    if (newContent) {
      await fs.writeFile(agentsPath, newContent + '\n', 'utf-8');
    } else {
      // File would be empty, delete it
      await fs.unlink(agentsPath);
    }
    return;
  }

  // Generate new manifest content
  const manifestContent = updatedSkills
    .map(s => generateSkillXML(s))
    .join('\n\n');

  // Reconstruct AGENTS.md
  let newContent = beforeManifest;
  newContent += `<!-- PRPM Manifest -->\n`;
  newContent += `<!-- Skills are loaded on-demand, agents are spawned via Task tool -->\n\n`;
  newContent += manifestContent;
  newContent += `\n<!-- End PRPM Manifest -->`;
  newContent += afterManifest;

  await fs.writeFile(agentsPath, newContent.trim() + '\n', 'utf-8');
}

/**
 * Parse skill entries from manifest XML
 */
function parseSkillsFromManifest(manifestXML: string): SkillManifestEntry[] {
  const skills: SkillManifestEntry[] = [];

  // Match <skill name="..." path="...">description</skill>
  const skillRegex = /<skill\s+name="([^"]+)"\s+path="([^"]+)">([^<]*)<\/skill>/g;

  let match;
  while ((match = skillRegex.exec(manifestXML)) !== null) {
    const [, name, skillPath, description] = match;

    // Extract main file from path (last segment after /)
    const pathParts = skillPath.split('/');
    const mainFile = pathParts[pathParts.length - 1];
    const dir = pathParts.slice(0, -1).join('/');

    skills.push({
      name: unescapeXML(name),
      description: unescapeXML(description.trim()),
      skillPath: dir,
      mainFile,
    });
  }

  return skills;
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
