/**
 * Cursor Format Parser
 * Cursor uses the same markdown format as Claude, but with cursor format.
 * Supports multi-file packages with @file references (e.g., @patterns/naming.md)
 */

import { fromClaude } from './from-claude.js';
import type { CanonicalPackage, PackageMetadata, FileReferenceSection } from './types/canonical.js';
import type { Subtype } from './taxonomy-utils.js';
import {
  extractAtReferences,
  loadReferencedFiles,
  extractDirectories,
  type LoadedFile,
} from './utils/file-references.js';

/**
 * Options for parsing Cursor format with multi-file support
 */
export interface FromCursorOptions {
  /** Whether to resolve @file references in the content */
  resolveFiles?: boolean;
  /** Base path for resolving relative file references */
  basePath?: string;
  /** Optional explicit subtype from file path (e.g., .cursor/commands/ → 'slash-command') */
  explicitSubtype?: Subtype;
}

/**
 * Parse Cursor format
 * Cursor uses the same syntax as Claude but we need to set format='cursor'
 *
 * @param content - Markdown content with optional MDC frontmatter
 * @param metadata - Package metadata
 * @param options - Parsing options (can be Subtype for backward compatibility or FromCursorOptions)
 */
export function fromCursor(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>,
  options?: Subtype | FromCursorOptions
): CanonicalPackage {
  // Handle backward compatibility: if options is a string, it's the explicitSubtype
  const opts: FromCursorOptions = typeof options === 'string'
    ? { explicitSubtype: options }
    : (options || {});

  // Use Claude parser but specify cursor format
  const pkg = fromClaude(content, metadata, 'cursor', opts.explicitSubtype);

  // Override format to 'cursor' (fromClaude returns 'claude')
  pkg.format = 'cursor';
  pkg.sourceFormat = 'cursor';

  // If file resolution is enabled, detect and load @file references
  if (opts.resolveFiles && opts.basePath) {
    const fileRefs = extractAtReferences(content);

    if (fileRefs.length > 0) {
      try {
        const loadedFiles = loadReferencedFiles(fileRefs, opts.basePath);

      // Create FileReferenceSection for each loaded file
      const fileSections: FileReferenceSection[] = loadedFiles.map((file: LoadedFile) => ({
        type: 'file-reference',
        title: file.path,
        path: file.path,
        content: file.content,
        contentType: file.contentType,
        category: file.category,
        description: `Referenced file from @${file.path}`,
      }));

      // Add file sections to the package
      pkg.content.sections.push(...fileSections);

        // Populate fileStructure metadata
        const directories = extractDirectories(fileRefs);
        pkg.metadata = pkg.metadata || {};
        pkg.metadata.fileStructure = {
          mainFile: 'rule.md', // Cursor typically uses single rule files
          files: loadedFiles.map((file: LoadedFile) => ({
            path: file.path,
            category: file.category,
            description: `Referenced via @${file.path}`,
          })),
          directories: directories.length > 0 ? directories : undefined,
        };
      } catch (error) {
        // File loading failed - log warning but don't fail conversion
        console.warn(`Failed to load @file references: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with conversion without file references
      }
    }
  }

  return pkg;
}
