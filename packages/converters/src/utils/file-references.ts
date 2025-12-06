/**
 * File Reference Utilities
 *
 * Utilities for detecting and processing @file references in Cursor rules
 * and other multi-file package formats.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';

/**
 * Extract @file references from content
 *
 * Supports various patterns:
 * - @filename.ext
 * - @dir/filename.ext
 * - @./relative/path.ext
 * - @../parent/path.ext
 *
 * @param content - The content to search for @file references
 * @returns Array of file paths referenced
 */
export function extractAtReferences(content: string): string[] {
  // Match @followed by file path (alphanumeric, dash, underscore, dot, slash)
  // Must end with a file extension
  const atRefRegex = /@([\w\-./]+\.\w+)/g;
  const matches = content.matchAll(atRefRegex);
  const refs = Array.from(matches, m => m[1]);

  // Remove duplicates
  return [...new Set(refs)];
}

/**
 * Categorize a file based on its path
 *
 * @param path - Relative path to the file
 * @returns Category string
 */
export function categorizeFile(path: string): 'pattern' | 'example' | 'context' | 'config' | 'data' | 'documentation' | 'other' {
  const pathLower = path.toLowerCase();

  // Check directory-based categorization first (highest priority)
  if (pathLower.includes('/patterns/') || pathLower.includes('/pattern/') || pathLower.startsWith('patterns/') || pathLower.startsWith('pattern/')) {
    return 'pattern';
  }
  if (pathLower.includes('/examples/') || pathLower.includes('/example/') || pathLower.startsWith('examples/') || pathLower.startsWith('example/')) {
    return 'example';
  }
  if (pathLower.includes('/context/') || pathLower.includes('/contexts/') || pathLower.startsWith('context/') || pathLower.startsWith('contexts/')) {
    return 'context';
  }
  if (pathLower.includes('/config/') || pathLower.includes('/configs/') || pathLower.startsWith('config/') || pathLower.startsWith('configs/')) {
    return 'config';
  }
  if (pathLower.includes('/data/') || pathLower.startsWith('data/')) {
    return 'data';
  }

  // Check for explicit documentation directories
  if (pathLower.includes('/docs/') || pathLower.includes('/documentation/') || pathLower.startsWith('docs/') || pathLower.startsWith('documentation/')) {
    return 'documentation';
  }

  // Fallback: .md files in root or unknown directories
  if (pathLower.endsWith('.md') && !pathLower.includes('/')) {
    return 'documentation';
  }

  return 'other';
}

/**
 * Detect content type from file path
 *
 * @param path - File path
 * @returns Content type string
 */
export function detectContentType(path: string): string {
  const ext = extname(path).toLowerCase();

  const typeMap: Record<string, string> = {
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
    '.toml': 'text/toml',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.php': 'php',
    '.sh': 'shellscript',
    '.bash': 'shellscript',
    '.zsh': 'shellscript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.xml': 'text/xml',
    '.sql': 'sql',
  };

  return typeMap[ext] || 'text/plain';
}

/**
 * Load referenced files from filesystem
 *
 * @param references - Array of file paths to load
 * @param basePath - Base directory to resolve paths from
 * @returns Array of loaded file references
 */
export function loadReferencedFiles(
  references: string[],
  basePath: string
): Array<{
  path: string;
  content: string;
  contentType: string;
  category: string;
  description?: string;
}> {
  const loaded: Array<{
    path: string;
    content: string;
    contentType: string;
    category: string;
    description?: string;
  }> = [];

  for (const ref of references) {
    // Resolve relative path
    const fullPath = join(basePath, ref);

    if (!existsSync(fullPath)) {
      console.warn(`Warning: Referenced file not found: ${ref}`);
      continue;
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      loaded.push({
        path: ref,
        content,
        contentType: detectContentType(ref),
        category: categorizeFile(ref),
      });
    } catch (error) {
      console.warn(`Warning: Could not read file: ${ref}`, error);
    }
  }

  return loaded;
}

/**
 * Extract directory structure from file paths
 *
 * @param filePaths - Array of file paths
 * @returns Array of unique directory paths
 */
export function extractDirectories(filePaths: string[]): string[] {
  const dirs = new Set<string>();

  for (const path of filePaths) {
    const dir = dirname(path);
    if (dir && dir !== '.') {
      dirs.add(dir);

      // Add parent directories too
      const parts = dir.split('/');
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
    }
  }

  return Array.from(dirs).sort();
}

/**
 * Check if content contains @file references
 *
 * @param content - Content to check
 * @returns True if content has @file references
 */
export function hasAtReferences(content: string): boolean {
  return extractAtReferences(content).length > 0;
}

/**
 * Group files by category
 *
 * @param files - Array of file objects with category
 * @returns Object keyed by category
 */
export function groupByCategory<T extends { category?: string }>(
  files: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  for (const file of files) {
    const category = file.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(file);
  }

  return grouped;
}
