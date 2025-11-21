/**
 * File system operations for managing prompt files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Format, Subtype } from '../types';

/**
 * Get the destination directory for a package based on format and subtype
 * @param format - Package format (cursor, claude, etc.)
 * @param subtype - Package subtype (skill, agent, rule, etc.)
 * @param name - Package name (optional, only needed for Claude skills which create subdirectories)
 */
export function getDestinationDir(format: Format, subtype: Subtype, name?: string): string {
  // Strip author namespace from package name to avoid nested directories
  const packageName = stripAuthorNamespace(name);

  switch (format) {
    case 'cursor':
      if (subtype === 'agent') return '.cursor/agents';
      if (subtype === 'slash-command') return '.cursor/commands';
      return '.cursor/rules';

    case 'claude':
      // Only create subdirectory for skills if name is provided
      if (subtype === 'skill' && packageName) return `.claude/skills/${packageName}`;
      if (subtype === 'skill') return '.claude/skills';
      if (subtype === 'slash-command') return '.claude/commands';
      if (subtype === 'agent') return '.claude/agents';
      // Hooks are configured in settings.json, return .claude directory
      if (subtype === 'hook') return '.claude';
      return '.claude/agents'; // Default for claude

    case 'continue':
      // Continue has separate directories for prompts (slash commands) and rules
      if (subtype === 'rule') return '.continue/rules';
      return '.continue/prompts';

    case 'windsurf':
      return '.windsurf/rules';

    case 'copilot':
      // Copilot has different locations based on subtype:
      // - Repository-wide instructions: .github/copilot-instructions.md
      // - Path-specific instructions: .github/instructions/*.instructions.md
      // - Chat modes: .github/chatmodes/*.chatmode.md
      if (subtype === 'chatmode') return '.github/chatmodes';
      // Default to path-specific instructions directory
      return '.github/instructions';

    case 'kiro':
      // Kiro has different locations based on subtype:
      // - Steering files: .kiro/steering/*.md
      // - Hooks: .kiro/hooks/*.kiro.hook (JSON files)
      // - Agents: .kiro/agents/*.json (custom AI agent configurations)
      if (subtype === 'hook') return '.kiro/hooks';
      if (subtype === 'agent') return '.kiro/agents';
      return '.kiro/steering';

    case 'gemini':
      // Gemini custom commands: .gemini/commands/*.toml
      return '.gemini/commands';

    case 'agents.md':
    case 'gemini.md':
    case 'claude.md':
      // For skills in progressive disclosure mode, use .openskills directory
      if (subtype === 'skill' && packageName) {
        return `.openskills/${packageName}`;
      }
      // For agents in progressive disclosure mode, use .openagents directory
      if (subtype === 'agent' && packageName) {
        return `.openagents/${packageName}`;
      }
      return '.';

    case 'generic':
      return '.prompts';

    case 'mcp':
      return '.mcp/tools';

    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

/**
 * Ensure directory exists, creating it if necessary
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error}`);
  }
}

/**
 * Save content to a file
 */
export async function saveFile(filePath: string, content: string): Promise<void> {
  try {
    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    await ensureDirectoryExists(dir);

    // Write file
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save file ${filePath}: ${error}`);
  }
}

/**
 * Delete a file
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      // File doesn't exist, that's fine
      return;
    }
    throw new Error(`Failed to delete file ${filePath}: ${error}`);
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Map manifest format to filename
 */
export function getManifestFilename(format: Format): string {
  switch (format) {
    case 'agents.md':
      return 'AGENTS.md';
    case 'gemini.md':
      return 'GEMINI.md';
    case 'claude.md':
      return 'CLAUDE.md';
    default:
      return 'AGENTS.md';
  }
}

/**
 * Auto-detect the format based on existing directories in the current project
 * Returns the format if a matching directory is found, or null if none found
 */
export async function autoDetectFormat(): Promise<Format | null> {
  // Check for manifest files
  if (await fileExists('GEMINI.md')) {
    return 'gemini.md';
  }
  if (await fileExists('CLAUDE.md')) {
    return 'claude.md';
  }
  if (await fileExists('AGENTS.md')) {
    return 'agents.md';
  }

  const formatDirs: Array<{ format: Format; dir: string }> = [
    { format: 'cursor', dir: '.cursor' },
    { format: 'claude', dir: '.claude' },
    { format: 'continue', dir: '.continue' },
    { format: 'windsurf', dir: '.windsurf' },
    { format: 'copilot', dir: '.github/instructions' },
    { format: 'kiro', dir: '.kiro' },
    { format: 'gemini', dir: '.gemini' },
    { format: 'agents.md', dir: '.agents' },
  ];

  for (const { format, dir } of formatDirs) {
    if (await directoryExists(dir)) {
      return format;
    }
  }

  return null;
}

/**
 * Generate a unique ID from filename
 */
export function generateId(filename: string): string {
  // Remove extension and convert to kebab-case
  const name = filename.replace(/\.[^/.]+$/, '');
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Strip author namespace from package ID and return just the package name
 * @example
 * stripAuthorNamespace('@community/git-workflow-manager') // 'git-workflow-manager'
 * stripAuthorNamespace('community/git-workflow-manager') // 'git-workflow-manager'
 * stripAuthorNamespace('@wshobson/commands/agent-orchestration/improve-agent') // 'improve-agent'
 * stripAuthorNamespace('git-workflow-manager') // 'git-workflow-manager'
 */
export function stripAuthorNamespace(packageId: string | undefined): string {
  // Handle undefined or empty string
  if (!packageId) {
    return '';
  }

  // Split by '/' and get the last segment (the actual package name)
  const parts = packageId.split('/');
  return parts[parts.length - 1];
}

/**
 * Get the expected installed file path for a package
 * This matches the logic used by the install command to determine where files are placed
 *
 * @param packageName - Full package name (e.g., '@prpm/typescript-rules')
 * @param format - Package format
 * @param subtype - Package subtype
 * @param fileName - Optional specific file name (defaults to main file)
 * @returns Path where the file will be installed relative to working directory
 */
export function getInstalledFilePath(
  packageName: string,
  format: Format,
  subtype: Subtype,
  fileName?: string
): string {
  const destDir = getDestinationDir(format, subtype, packageName);
  const packageBaseName = stripAuthorNamespace(packageName);

  // If a specific file name is provided, use it
  if (fileName) {
    return path.join(destDir, fileName);
  }

  // Claude skills always use SKILL.md
  if (format === 'claude' && subtype === 'skill') {
    return path.join(destDir, 'SKILL.md');
  }

  // agents.md uses package-name/AGENTS.md structure
  if (format === 'agents.md') {
    return path.join(destDir, packageBaseName, 'AGENTS.md');
  }

  // Determine file extension
  let fileExtension: string;
  if (format === 'cursor') {
    fileExtension = 'mdc';
  } else if (format === 'gemini') {
    fileExtension = 'toml';
  } else {
    fileExtension = 'md';
  }

  // For other formats, use package name as filename
  return path.join(destDir, `${packageBaseName}.${fileExtension}`);
}

/**
 * Get all expected installed file paths for a multi-file package
 *
 * @param packageName - Full package name
 * @param format - Package format
 * @param subtype - Package subtype
 * @param fileNames - Array of file names in the package
 * @returns Array of paths where files will be installed
 */
export function getInstalledFilePaths(
  packageName: string,
  format: Format,
  subtype: Subtype,
  fileNames: string[]
): string[] {
  const destDir = getDestinationDir(format, subtype, packageName);

  return fileNames.map(fileName => path.join(destDir, fileName));
}
