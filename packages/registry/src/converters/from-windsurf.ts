/**
 * Windsurf Rules Parser
 * Converts Windsurf .windsurfrules format to canonical package format
 *
 * Windsurf uses a simple markdown format without special frontmatter.
 */

import type {
  CanonicalPackage,
  Section,
} from '../types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';

/**
 * Parse Windsurf rules file to canonical format
 */
export function fromWindsurf(
  content: string,
  metadata: {
    id: string;
    version?: string;
    author?: string;
    tags?: string[];
  }
): CanonicalPackage {
  const sections: Section[] = [];
  const lines = content.split('\n');

  let currentSection: Section | null = null;
  let currentText: string[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent: string[] = [];

  const flushText = () => {
    if (currentText.length > 0 && currentSection) {
      const text = currentText.join('\n').trim();
      if (text) {
        if (!currentSection.content.text) {
          currentSection.content.text = text;
        } else {
          currentSection.content.text += '\n\n' + text;
        }
      }
      currentText = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0 && currentSection) {
      if (!currentSection.content.items) {
        currentSection.content.items = [];
      }
      currentSection.content.items.push({
        code: codeBlockContent.join('\n'),
        language: codeBlockLanguage || 'typescript',
      });
      codeBlockContent = [];
      codeBlockLanguage = '';
    }
  };

  const flushSection = () => {
    flushText();
    if (currentSection) {
      sections.push(currentSection);
      currentSection = null;
    }
  };

  let title = '';
  let description = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        flushText();
        inCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim();
      } else {
        flushCodeBlock();
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const headerTitle = headerMatch[2].trim();

      if (level === 1) {
        // Main title
        flushSection();
        title = headerTitle;
        // Next non-empty line might be description
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.startsWith('#')) {
            description = nextLine;
            i = j; // Skip to after description
            break;
          }
          if (nextLine.startsWith('#')) {
            break;
          }
        }
      } else if (level === 2) {
        // Section header
        flushSection();
        currentSection = {
          type: inferSectionType(headerTitle),
          title: headerTitle,
          content: {},
        };
      } else {
        // Sub-header within section
        currentText.push(line);
      }
      continue;
    }

    // Handle list items
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
    if (listMatch && currentSection) {
      flushText();
      const indent = listMatch[1].length;
      const marker = listMatch[2];
      const itemText = listMatch[3];

      if (indent === 0) {
        // Top-level list item
        if (!currentSection.content.items) {
          currentSection.content.items = [];
        }

        // Check if it's a rule format (with rationale or example)
        const nextLines: string[] = [];
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          if (lines[j].trim()) {
            nextLines.push(lines[j]);
          } else {
            break;
          }
        }

        let rationale: string | undefined;
        let example: string | undefined;

        for (const nextLine of nextLines) {
          const rationaleMatch = nextLine.match(/^\s+-\s+\*Rationale:\s*(.+)\*$/);
          if (rationaleMatch) {
            rationale = rationaleMatch[1];
            i++;
            continue;
          }
          const exampleMatch = nextLine.match(/^\s+-\s+Example:\s*(.+)$/);
          if (exampleMatch) {
            example = exampleMatch[1];
            i++;
            continue;
          }
        }

        if (currentSection.type === 'rules') {
          currentSection.content.items.push({
            text: itemText,
            rationale,
            example,
          });
        } else {
          currentSection.content.items.push({
            text: itemText,
          });
        }
      }
      continue;
    }

    // Regular text
    if (line.trim()) {
      currentText.push(line);
    } else if (currentText.length > 0) {
      // Empty line - might be paragraph break
      currentText.push('');
    }
  }

  // Flush remaining content
  flushSection();

  // Build canonical package
  const pkg: Partial<CanonicalPackage> = {
    id: metadata.id,
    name: metadata.id,
    version: metadata.version || '1.0.0',
    description: description || 'Windsurf rules',
    author: metadata.author || 'unknown',
    tags: metadata.tags || [],
    sourceFormat: 'windsurf',
    content: {
      format: 'canonical',
      version: '1.0',
      sections,
    },
  };

  // Set taxonomy (format + subtype + legacy type)
  // Windsurf rules are rules by default
  setTaxonomy(pkg, 'windsurf', 'rule');

  return pkg as CanonicalPackage;
}

/**
 * Infer section type from title
 */
function inferSectionType(title: string): Section['type'] {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes('instruction') ||
    lowerTitle.includes('guideline') ||
    lowerTitle.includes('principle')
  ) {
    return 'instructions';
  }

  if (
    lowerTitle.includes('rule') ||
    lowerTitle.includes('convention') ||
    lowerTitle.includes('standard')
  ) {
    return 'rules';
  }

  if (
    lowerTitle.includes('example') ||
    lowerTitle.includes('usage') ||
    lowerTitle.includes('demo')
  ) {
    return 'examples';
  }

  if (
    lowerTitle.includes('role') ||
    lowerTitle.includes('persona') ||
    lowerTitle.includes('character')
  ) {
    return 'persona';
  }

  if (
    lowerTitle.includes('tool') ||
    lowerTitle.includes('command') ||
    lowerTitle.includes('function')
  ) {
    return 'tools';
  }

  if (
    lowerTitle.includes('reference') ||
    lowerTitle.includes('link') ||
    lowerTitle.includes('resource')
  ) {
    return 'reference';
  }

  return 'instructions';
}
