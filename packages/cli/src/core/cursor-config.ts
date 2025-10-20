/**
 * Cursor MDC header configuration utilities
 */

import { CursorMDCConfig } from './user-config';

/**
 * Apply cursor config to MDC header in content
 * Replaces configurable fields in the YAML frontmatter
 */
export function applyCursorConfig(content: string, config: CursorMDCConfig): string {
  // Check if content has MDC header (YAML frontmatter)
  if (!content.startsWith('---')) {
    return content;
  }

  const lines = content.split('\n');
  const headerEndIndex = lines.findIndex((line, index) => index > 0 && line === '---');

  if (headerEndIndex === -1) {
    // Malformed header, return as-is
    return content;
  }

  // Extract header lines (excluding the --- markers)
  const headerLines = lines.slice(1, headerEndIndex);
  const bodyLines = lines.slice(headerEndIndex + 1);

  // Parse and update header
  const updatedHeaderLines: string[] = [];
  let i = 0;

  while (i < headerLines.length) {
    const line = headerLines[i];

    // Check for fields that should be replaced by config
    if (line.startsWith('version:') && config.version) {
      updatedHeaderLines.push(`version: "${config.version}"`);
      i++;
    } else if (line.startsWith('globs:') && config.globs) {
      // Replace globs array
      updatedHeaderLines.push('globs:');
      config.globs.forEach((glob: string) => {
        updatedHeaderLines.push(`  - "${glob}"`);
      });
      // Skip existing globs in the original header
      i++;
      while (i < headerLines.length && headerLines[i].startsWith('  - ')) {
        i++;
      }
    } else if (line.startsWith('alwaysApply:') && config.alwaysApply !== undefined) {
      updatedHeaderLines.push(`alwaysApply: ${config.alwaysApply}`);
      i++;
    } else if (line.startsWith('author:') && config.author) {
      // Replace existing author
      updatedHeaderLines.push(`author: "${config.author}"`);
      i++;
    } else if (line.startsWith('tags:') && config.tags) {
      // Replace tags array
      updatedHeaderLines.push('tags:');
      config.tags.forEach((tag: string) => {
        updatedHeaderLines.push(`  - "${tag}"`);
      });
      // Skip existing tags in the original header
      i++;
      while (i < headerLines.length && headerLines[i].startsWith('  - ')) {
        i++;
      }
    } else {
      // Keep existing line
      updatedHeaderLines.push(line);
      i++;
    }
  }

  // Add new fields if they don't exist
  const hasAuthor = updatedHeaderLines.some(line => line.startsWith('author:'));
  const hasTags = updatedHeaderLines.some(line => line.startsWith('tags:'));

  if (config.author && !hasAuthor) {
    updatedHeaderLines.push(`author: "${config.author}"`);
  }

  if (config.tags && !hasTags) {
    updatedHeaderLines.push('tags:');
    config.tags.forEach((tag: string) => {
      updatedHeaderLines.push(`  - "${tag}"`);
    });
  }

  // Reconstruct content
  return ['---', ...updatedHeaderLines, '---', ...bodyLines].join('\n');
}

/**
 * Check if content has MDC header
 */
export function hasMDCHeader(content: string): boolean {
  return content.startsWith('---\n');
}
