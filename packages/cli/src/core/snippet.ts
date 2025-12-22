/**
 * Snippet utilities for managing content snippets in files
 *
 * Snippets are content blocks that get inserted into existing files
 * (AGENTS.md, CLAUDE.md, CONVENTIONS.md, etc.) with markers for
 * tracking and uninstallation.
 *
 * Marker format:
 *   <!-- prpm:snippet:start @scope/package@version -->
 *   ... snippet content ...
 *   <!-- prpm:snippet:end @scope/package@version -->
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileExists } from './filesystem.js';

export interface SnippetConfig {
  /**
   * Target file to append the snippet to
   * Examples: "AGENTS.md", "CLAUDE.md", ".cursorrules", "CONVENTIONS.md"
   */
  target: string;

  /**
   * Where to insert the snippet in the target file
   * - "append": Add to end of file (default)
   * - "prepend": Add to beginning of file
   * - "section:## Section Name": Insert after a specific section header
   */
  position?: 'append' | 'prepend' | `section:${string}`;

  /**
   * Optional section header to wrap the snippet content
   * If provided, content will be wrapped: ## {header}\n{content}
   */
  header?: string;
}

export interface SnippetInstallResult {
  targetPath: string;
  created: boolean; // True if file was created, false if appended
  position: string;
}

/**
 * Generate snippet markers for a package
 */
export function generateSnippetMarkers(packageId: string, version: string): {
  start: string;
  end: string;
} {
  const id = `${packageId}@${version}`;
  return {
    start: `<!-- prpm:snippet:start ${id} -->`,
    end: `<!-- prpm:snippet:end ${id} -->`,
  };
}

/**
 * Wrap content with snippet markers and optional header
 */
export function wrapSnippetContent(
  content: string,
  packageId: string,
  version: string,
  header?: string
): string {
  const markers = generateSnippetMarkers(packageId, version);
  const lines: string[] = [];

  lines.push(markers.start);

  if (header) {
    lines.push(`## ${header}`);
    lines.push('');
  }

  lines.push(content.trim());
  lines.push(markers.end);

  return lines.join('\n');
}

/**
 * Install a snippet into a target file
 */
export async function installSnippet(
  content: string,
  packageId: string,
  version: string,
  config: SnippetConfig
): Promise<SnippetInstallResult> {
  const targetPath = config.target;
  const position = config.position || 'append';

  // Wrap content with markers
  const wrappedContent = wrapSnippetContent(content, packageId, version, config.header);

  // Check if file exists
  const exists = await fileExists(targetPath);

  if (!exists) {
    // Create new file with snippet content
    const dir = path.dirname(targetPath);
    if (dir && dir !== '.') {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(targetPath, wrappedContent + '\n', 'utf-8');

    return {
      targetPath,
      created: true,
      position: 'new file',
    };
  }

  // Read existing file
  let existingContent = await fs.readFile(targetPath, 'utf-8');

  // Check if snippet is already installed (by package ID, any version)
  const existingMarkerPattern = new RegExp(
    `<!-- prpm:snippet:start ${escapeRegExp(packageId)}@[^\\s]+ -->`,
    'g'
  );
  if (existingMarkerPattern.test(existingContent)) {
    // Remove existing snippet first (update scenario)
    existingContent = await removeSnippetFromContent(existingContent, packageId);
  }

  // Insert snippet based on position
  let newContent: string;
  let actualPosition: string;

  if (position === 'prepend') {
    newContent = wrappedContent + '\n\n' + existingContent.trim();
    actualPosition = 'prepend';
  } else if (position.startsWith('section:')) {
    const sectionHeader = position.slice('section:'.length);
    const result = insertAfterSection(existingContent, sectionHeader, wrappedContent);
    newContent = result.content;
    actualPosition = result.found ? `after "${sectionHeader}"` : 'append (section not found)';
  } else {
    // Default: append
    newContent = existingContent.trim() + '\n\n' + wrappedContent;
    actualPosition = 'append';
  }

  await fs.writeFile(targetPath, newContent.trim() + '\n', 'utf-8');

  return {
    targetPath,
    created: false,
    position: actualPosition,
  };
}

/**
 * Remove a snippet from a file by package ID
 */
export async function uninstallSnippet(
  targetPath: string,
  packageId: string
): Promise<boolean> {
  if (!(await fileExists(targetPath))) {
    return false;
  }

  const content = await fs.readFile(targetPath, 'utf-8');
  const newContent = await removeSnippetFromContent(content, packageId);

  if (newContent === content) {
    return false; // Nothing removed
  }

  // Clean up empty file or write new content
  const trimmedContent = newContent.trim();
  if (!trimmedContent) {
    await fs.unlink(targetPath);
  } else {
    await fs.writeFile(targetPath, trimmedContent + '\n', 'utf-8');
  }

  return true;
}

/**
 * Remove snippet content from a string by package ID
 */
async function removeSnippetFromContent(
  content: string,
  packageId: string
): Promise<string> {
  // Match snippet markers for any version of this package
  const pattern = new RegExp(
    `\\n?<!-- prpm:snippet:start ${escapeRegExp(packageId)}@[^\\s]+ -->[\\s\\S]*?<!-- prpm:snippet:end ${escapeRegExp(packageId)}@[^\\s]+ -->\\n?`,
    'g'
  );

  return content.replace(pattern, '\n');
}

/**
 * Insert content after a section header
 */
function insertAfterSection(
  content: string,
  sectionHeader: string,
  insertContent: string
): { content: string; found: boolean } {
  // Normalize the header text by removing leading # symbols and whitespace
  const normalizedHeader = sectionHeader.replace(/^#+\s*/, '').trim();

  // Create a regex pattern that matches any header level (1-6) with this text
  const headerRegex = new RegExp(
    `^#{1,6}\\s+${escapeRegExp(normalizedHeader)}\\s*$`,
    'i'
  );

  const lines = content.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (headerRegex.test(lines[i].trim())) {
      // Find the end of this section (next header or end of file)
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^#{1,6}\s/)) {
          // Found next header, insert before it
          insertIndex = j;
          break;
        }
      }
      if (insertIndex === -1) {
        // No next header, insert at end
        insertIndex = lines.length;
      }
      break;
    }
  }

  if (insertIndex === -1) {
    // Section not found, append to end
    return {
      content: content.trim() + '\n\n' + insertContent,
      found: false,
    };
  }

  // Insert at the found position
  lines.splice(insertIndex, 0, '', insertContent);

  return {
    content: lines.join('\n'),
    found: true,
  };
}

/**
 * List all snippets installed in a file
 */
export async function listSnippetsInFile(
  targetPath: string
): Promise<Array<{ packageId: string; version: string }>> {
  if (!(await fileExists(targetPath))) {
    return [];
  }

  const content = await fs.readFile(targetPath, 'utf-8');
  const snippets: Array<{ packageId: string; version: string }> = [];

  // Match all snippet start markers
  // Package ID can be scoped (@scope/name) or unscoped (name)
  const pattern = /<!-- prpm:snippet:start ((?:@[^/\s]+\/)?[^@\s]+)@([^\s]+) -->/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    snippets.push({
      packageId: match[1],
      version: match[2],
    });
  }

  return snippets;
}

/**
 * Check if a snippet is installed in a file
 */
export async function isSnippetInstalled(
  targetPath: string,
  packageId: string
): Promise<boolean> {
  if (!(await fileExists(targetPath))) {
    return false;
  }

  const content = await fs.readFile(targetPath, 'utf-8');
  const pattern = new RegExp(
    `<!-- prpm:snippet:start ${escapeRegExp(packageId)}@[^\\s]+ -->`,
    'g'
  );

  return pattern.test(content);
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
