/**
 * Snippet extraction utilities
 * Extracts preview content from package files for display in modals
 */

import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import type { PackageManifest, PackageFileMetadata } from '../types/registry';
import { getInstalledFilePath } from '../core/filesystem';

const MAX_SNIPPET_LENGTH = 2000;

/**
 * Extract a preview snippet from package files
 * Uses the same path logic as the install command to determine where files will be placed
 */
export async function extractSnippet(manifest: PackageManifest): Promise<string | null> {
  const cwd = process.cwd();

  try {
    // Validate manifest has required fields
    if (!manifest.format || !manifest.name || !manifest.subtype) {
      console.warn('⚠️  Cannot extract snippet: manifest missing format, name, or subtype');
      return null;
    }

    // Determine which file to extract snippet from
    let targetFilePath: string;

    if (manifest.main) {
      // If main file is specified, use it directly (for multi-file packages)
      targetFilePath = getInstalledFilePath(
        manifest.name,
        manifest.format,
        manifest.subtype,
        manifest.main
      );
    } else if (manifest.files && manifest.files.length > 0) {
      // Get the first file from the manifest
      const firstFile = manifest.files[0];
      const fileName = typeof firstFile === 'string'
        ? firstFile
        : (firstFile as PackageFileMetadata).path;

      // For single-file packages or when no main is specified,
      // use the format-aware path construction
      targetFilePath = getInstalledFilePath(
        manifest.name,
        manifest.format,
        manifest.subtype,
        fileName
      );
    } else {
      // No files specified, try to construct the default path
      targetFilePath = getInstalledFilePath(
        manifest.name,
        manifest.format,
        manifest.subtype
      );
    }

    const fullPath = join(cwd, targetFilePath);

    // Check if path is a directory
    const stats = await stat(fullPath);
    if (stats.isDirectory()) {
      console.warn(`⚠️  Skipping snippet extraction: "${targetFilePath}" is a directory`);
      return null;
    }

    // Read the file content
    const content = await readFile(fullPath, 'utf-8');

    // Extract first N characters, trying to break at a reasonable point
    if (content.length <= MAX_SNIPPET_LENGTH) {
      return content.trim();
    }

    // Try to break at a newline near the limit
    let snippet = content.substring(0, MAX_SNIPPET_LENGTH);
    const lastNewline = snippet.lastIndexOf('\n');

    if (lastNewline > MAX_SNIPPET_LENGTH * 0.8) {
      // If we found a newline in the last 20%, break there
      snippet = snippet.substring(0, lastNewline);
    }

    return snippet.trim() + '\n\n[... content truncated ...]';
  } catch (error) {
    // If we can't read the file, return null (snippet is optional)
    console.warn('⚠️  Could not extract snippet:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Validate snippet and warn if issues found
 */
export function validateSnippet(snippet: string | null, packageName: string): void {
  if (!snippet) {
    console.warn(`⚠️  Warning: No content snippet extracted for package "${packageName}"`);
    console.warn('   A preview snippet helps users see what the prompt contains before installing.');
    console.warn('');
  } else {
    console.log(`   Snippet: ${snippet.length} characters extracted`);
  }
}
