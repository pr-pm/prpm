/**
 * File system operations for managing prompt files
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Format, Subtype } from '../types';
import { getDestinationDirectory, getSubtypeConfig, getSubtypes, getDefaultSubtype } from '@pr-pm/converters';

/**
 * Get the destination directory for a package based on format and subtype
 * Uses the format-registry.json as the single source of truth.
 *
 * @param format - Package format (cursor, claude, etc.)
 * @param subtype - Package subtype (skill, agent, rule, etc.)
 * @param name - Package name (optional, only needed for formats that create subdirectories)
 */
export function getDestinationDir(format: Format, subtype: Subtype, name?: string): string {
  // Strip author namespace from package name to avoid nested directories
  const packageName = stripAuthorNamespace(name);

  // Try to get from format registry first
  let config = getSubtypeConfig(format, subtype);

  // If subtype not found, try the format's default subtype
  if (!config) {
    const defaultSubtype = getDefaultSubtype(format);
    if (defaultSubtype) {
      config = getSubtypeConfig(format, defaultSubtype);
    }
  }

  if (config) {
    // If the format uses package subdirectories and a name is provided
    if (config.usesPackageSubdirectory && packageName) {
      return `${config.directory}/${packageName}`;
    }
    return config.directory;
  }

  throw new Error(`Unknown format/subtype combination: ${format}/${subtype}`);
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
 * Create a symbolic link from source to target
 * Falls back to copying if symlinks are not supported (Windows without admin)
 *
 * @param target - The path the symlink points to (the existing file)
 * @param linkPath - The path where the symlink will be created
 * @param forceRelative - If true, converts target to relative path from linkPath's directory
 */
export async function createSymlink(
  target: string,
  linkPath: string,
  forceRelative: boolean = true
): Promise<{ symlinked: boolean; path: string }> {
  try {
    // Ensure parent directory exists
    const linkDir = path.dirname(linkPath);
    await ensureDirectoryExists(linkDir);

    // Convert to relative path if requested (better for portability)
    let symlinkTarget = target;
    if (forceRelative) {
      symlinkTarget = path.relative(linkDir, target);
    }

    // Remove existing file/symlink if present
    try {
      await fs.unlink(linkPath);
    } catch {
      // File doesn't exist, that's fine
    }

    // Create symlink (use 'junction' on Windows for directories, 'file' for files)
    const targetStat = await fs.stat(target);
    const type = os.platform() === 'win32' && targetStat.isDirectory() ? 'junction' : undefined;
    await fs.symlink(symlinkTarget, linkPath, type);

    return { symlinked: true, path: linkPath };
  } catch (error) {
    // Symlinks may not be supported (Windows without developer mode)
    // Fall back to copying
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EPERM' || err.code === 'ENOTSUP') {
      await copyFileOrDirectory(target, linkPath);
      return { symlinked: false, path: linkPath };
    }
    throw new Error(`Failed to create symlink ${linkPath} -> ${target}: ${error}`);
  }
}

/**
 * Copy a file or directory recursively
 */
async function copyFileOrDirectory(source: string, dest: string): Promise<void> {
  const stat = await fs.stat(source);

  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);
      await copyFileOrDirectory(srcPath, destPath);
    }
  } else {
    await ensureDirectoryExists(path.dirname(dest));
    await fs.copyFile(source, dest);
  }
}

/**
 * Check if a path is a symbolic link
 */
export async function isSymlink(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(filePath);
    return stat.isSymbolicLink();
  } catch {
    return false;
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
 * Map manifest format to filename for progressive disclosure
 * Most formats use AGENTS.md, with a few exceptions
 */
export function getManifestFilename(format: Format): string {
  switch (format) {
    // Formats with custom manifest files
    case 'gemini.md':
      return 'GEMINI.md';
    case 'claude.md':
      return 'CLAUDE.md';
    case 'aider':
      return 'CONVENTIONS.md';
    // All other formats use AGENTS.md for progressive disclosure
    // Including: agents.md, codex, cursor, copilot, kiro, opencode, ruler, replit, zed, generic
    default:
      return 'AGENTS.md';
  }
}

/**
 * Auto-detect the format based on existing directories in the current project
 * Returns the format if a matching directory is found, or null if none found
 * Uses the format-registry.json as the single source of truth.
 */
export async function autoDetectFormat(): Promise<Format | null> {
  const { getFormatRegistry, findFormatByRootFile } = await import('@pr-pm/converters');
  const registry = getFormatRegistry();

  // Check for root manifest files first
  for (const [format, config] of Object.entries(registry.formats)) {
    if (config.rootFiles) {
      for (const rootFile of config.rootFiles) {
        if (await fileExists(rootFile)) {
          return format as Format;
        }
      }
    }
  }

  // Check for format directories
  for (const [format, config] of Object.entries(registry.formats)) {
    // Get the first subtype's directory as the format's base directory
    const subtypeKeys = Object.keys(config.subtypes);
    if (subtypeKeys.length > 0) {
      const firstSubtype = config.subtypes[subtypeKeys[0]];
      // Extract base directory (e.g., '.cursor' from '.cursor/rules')
      const baseDir = firstSubtype.directory.split('/')[0];
      if (baseDir && baseDir !== '.' && await directoryExists(baseDir)) {
        return format as Format;
      }
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
 * Uses the format-registry.json as the single source of truth.
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
  const config = getSubtypeConfig(format, subtype);

  // If a specific file name is provided, use it
  if (fileName) {
    return path.join(destDir, fileName);
  }

  // Check for nested indicator (e.g., SKILL.md for Claude skills)
  if (config?.nestedIndicator) {
    return path.join(destDir, config.nestedIndicator);
  }

  // agents.md uses package-name/AGENTS.md structure
  if (format === 'agents.md') {
    return path.join(destDir, packageBaseName, 'AGENTS.md');
  }

  // Get file extension from registry (strip the leading dot for path.join)
  const fileExtension = config?.fileExtension?.replace(/^\./, '') || 'md';

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
