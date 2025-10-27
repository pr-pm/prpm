/**
 * Snippet extraction utilities
 * Extracts preview content from package files for display in modals
 */

import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import type { PackageManifest, PackageFileMetadata } from '../types/registry';

const MAX_SNIPPET_LENGTH = 2000;

/**
 * Extract a preview snippet from package files
 * Takes the first file in the package and extracts ~2000 characters
 */
export async function extractSnippet(manifest: PackageManifest): Promise<string | null> {
  const cwd = process.cwd();

  try {
    // Get the first file from the manifest
    const firstFile = manifest.files[0];
    if (!firstFile) {
      return null;
    }

    // Get file path (handle both string and object formats)
    const filePath = typeof firstFile === 'string'
      ? firstFile
      : (firstFile as PackageFileMetadata).path;

    // If there's a main file specified, prefer that
    const targetFile = manifest.main || filePath;
    const fullPath = join(cwd, targetFile);

    // Check if path is a directory
    const stats = await stat(fullPath);
    if (stats.isDirectory()) {
      console.warn(`⚠️  Skipping snippet extraction: "${targetFile}" is a directory`);
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
