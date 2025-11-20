/**
 * Ruler Format Parser
 * Converts Ruler .ruler/ format to canonical format
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  ConversionOptions,
  ConversionResult,
  CustomSection,
  MetadataSection,
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

    // Get description and title from metadata section
    const metadataSection = content.sections.find((s) => s.type === 'metadata') as MetadataSection | undefined;
    const description = metadata.description || metadataSection?.data.description || '';
    const title = metadataSection?.data.title || 'Ruler Rule';

    // Build canonical package
    const pkg: CanonicalPackage = {
      id: metadata.name || 'ruler-rule',
      name: metadata.name || 'ruler-rule',
      version: '1.0.0',
      author: metadata.author || '',
      tags: [],
      format: 'generic',
      subtype: 'rule',
      description,
      content,
      sourceFormat: 'ruler',
      metadata: {
        title,
        description,
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
    format: 'canonical',
    version: '1.0',
    sections: [],
  };

  let title = '';
  let description = '';
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
        content.sections.push({
          type: 'custom',
          title: currentSection.title,
          content: buffer.join('\n').trim(),
        });
        buffer = [];
      }

      // Start new section
      const match = line.match(/^(#+)\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const sectionTitle = match[2].trim();

        // First h1 is the title
        if (level === 1 && !title) {
          title = sectionTitle;
          currentSection = null;
        } else {
          currentSection = { title: sectionTitle, content: '' };
        }
      }
    } else if (currentSection) {
      buffer.push(line);
    } else if (!title) {
      // Content before first header becomes description
      if (line.trim()) {
        description += (description ? '\n' : '') + line;
      }
    }
  }

  // Save final section
  if (currentSection && buffer.length > 0) {
    content.sections.push({
      type: 'custom',
      title: currentSection.title,
      content: buffer.join('\n').trim(),
    });
  }

  // Add metadata section at the beginning
  content.sections.unshift({
    type: 'metadata',
    data: {
      title: title || 'Ruler Rule',
      description: description || '',
    },
  });

  return content;
}
