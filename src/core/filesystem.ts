/**
 * File system operations for managing prompt files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { PackageType } from '../types';

/**
 * Get the destination directory for a package type
 */
export function getDestinationDir(type: PackageType): string {
  switch (type) {
    case 'cursor':
      return '.cursor/rules';
    case 'claude':
      return '.claude/agents';
    case 'windsurf':
      // Windsurf doesn't have a standardized directory structure
      // We'll create a conventional location for rules
      return '.windsurf/rules';
    case 'continue':
      return '.continue/prompts';
    case 'aider':
      // Aider uses CONVENTIONS.md at repo root or .aider directory
      return '.aider';
    case 'copilot':
      return '.github/prompts';
    case 'copilot-instructions':
      // Special case: single file at .github/copilot-instructions.md
      return '.github';
    case 'copilot-path':
      return '.github/instructions';
    default:
      throw new Error(`Unknown package type: ${type}`);
  }
}

/**
 * Get the appropriate file extension for a package type
 */
export function getFileExtension(type: PackageType): string {
  switch (type) {
    case 'continue':
      return '.prompt';
    case 'aider':
      return '.md'; // Can be .yml for config
    case 'copilot':
      return '.prompt.md';
    case 'copilot-instructions':
      return '.md';
    case 'copilot-path':
      return '.instructions.md';
    case 'cursor':
    case 'claude':
    case 'windsurf':
    default:
      return '.md';
  }
}

/**
 * Get the filename for special cases (e.g., copilot-instructions)
 */
export function getSpecialFilename(type: PackageType): string | null {
  switch (type) {
    case 'copilot-instructions':
      return 'copilot-instructions.md';
    case 'aider':
      // Common convention
      return 'CONVENTIONS.md';
    default:
      return null;
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
