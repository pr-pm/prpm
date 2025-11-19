/**
 * Ruler Format Parser
 * Converts Ruler .ruler/ format to canonical format
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
} from './types/canonical.js';

/**
 * Parse Ruler markdown to canonical format
 * Ruler uses plain markdown without frontmatter
 */
export function fromRuler(
  markdown: string,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    // Remove HTML comments that might be present (package metadata)
    const cleanedMarkdown = markdown.replace(/<!--.*?-->/gs, '').trim();

    // Parse markdown content
    const content = parseMarkdownContent(cleanedMarkdown, warnings);

    // Extract metadata from HTML comments if present
    const metadata = extractMetadata(markdown);

    // Build canonical package
    const pkg: CanonicalPackage = {
      name: metadata.name || 'ruler-rule',
      version: '1.0.0',
      author: metadata.author,
      description: metadata.description || content.description || '',
      content,
      metadata: {
        sourceFormat: 'ruler',
      },
    };

    return {
      content: JSON.stringify(pkg, null, 2),
      format: 'canonical',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion: false,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'canonical',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

/**
 * Extract metadata from HTML comments
 */
function extractMetadata(markdown: string): {
  name?: string;
  author?: string;
  description?: string;
} {
  const metadata: {
    name?: string;
    author?: string;
    description?: string;
  } = {};

  const nameMatch = /<!--\s*Package:\s*(.+?)\s*-->/i.exec(markdown);
  if (nameMatch) {
    metadata.name = nameMatch[1].trim();
  }

  const authorMatch = /<!--\s*Author:\s*(.+?)\s*-->/i.exec(markdown);
  if (authorMatch) {
    metadata.author = authorMatch[1].trim();
  }

  const descMatch = /<!--\s*Description:\s*(.+?)\s*-->/i.exec(markdown);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }

  return metadata;
}

/**
 * Parse markdown content into canonical structure
 */
function parseMarkdownContent(
  markdown: string,
  warnings: string[]
): CanonicalContent {
  const lines = markdown.split('\n');
  const content: CanonicalContent = {
    title: '',
    description: '',
    sections: [],
  };

  let currentSection: { title: string; content: string } | null = null;
  let inCodeBlock = false;
  let buffer: string[] = [];

  for (const line of lines) {
    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      buffer.push(line);
      continue;
    }

    // Don't process headers inside code blocks
    if (!inCodeBlock && line.match(/^#+\s/)) {
      // Save previous section if exists
      if (currentSection) {
        content.sections?.push({
          title: currentSection.title,
          content: buffer.join('\n').trim(),
        });
        buffer = [];
      }

      // Start new section
      const match = line.match(/^(#+)\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].trim();

        // First h1 is the title
        if (level === 1 && !content.title) {
          content.title = title;
          currentSection = null;
        } else {
          currentSection = { title, content: '' };
        }
      }
    } else if (currentSection) {
      buffer.push(line);
    } else if (!content.title) {
      // Content before first header becomes description
      if (line.trim()) {
        content.description += (content.description ? '\n' : '') + line;
      }
    }
  }

  // Save final section
  if (currentSection && buffer.length > 0) {
    content.sections?.push({
      title: currentSection.title,
      content: buffer.join('\n').trim(),
    });
  }

  return content;
}
