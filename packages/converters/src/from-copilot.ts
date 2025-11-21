/**
 * GitHub Copilot Parser
 * Converts GitHub Copilot instructions to canonical format
 */

import yaml from 'js-yaml';
import type {
  CanonicalPackage,
  PackageMetadata,
  CanonicalContent,
  Section,
  InstructionsSection,
  RulesSection,
  ExamplesSection,
  ContextSection,
  MetadataSection,
} from './types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';

/**
 * Parse GitHub Copilot instructions to canonical format
 */
export function fromCopilot(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  // Parse frontmatter if exists
  const { frontmatter, body } = parseFrontmatter(content);

  // Parse markdown body and extract description and H1 title
  const { sections, extractedDescription, h1Title } = parseMarkdown(body);

  // Use extracted description from first paragraph if available, otherwise use provided metadata
  const description = extractedDescription || metadata.description || '';

  // Use H1 title if available, otherwise use metadata.name
  const title = h1Title || metadata.name;

  // Create metadata section
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title,
      description,
    },
  };

  // Build canonical content
  const canonicalContent: CanonicalContent = {
    format: 'canonical',
    version: '1.0',
    sections: [metadataSection, ...sections],
  };

  // Build canonical package
  const pkg: Partial<CanonicalPackage> = {
    id: metadata.id,
    version: metadata.version || '1.0.0',
    name: metadata.name,
    description,
    author: metadata.author || '',
    tags: metadata.tags || ['copilot'],
    content: canonicalContent,
    sourceFormat: 'copilot',
    metadata: {
      title,
      description,
      copilotConfig: {
        applyTo: frontmatter.applyTo,
      },
    },
  };

  // Set taxonomy (format + subtype)
  // Detect subtype from frontmatter or default to rule
  let subtype: 'rule' | 'tool' | 'chatmode' = 'rule';
  if (frontmatter.subtype === 'chatmode' || frontmatter.type === 'chatmode') {
    subtype = 'chatmode';
  } else if (frontmatter.subtype === 'tool' || frontmatter.type === 'tool') {
    subtype = 'tool';
  }
  setTaxonomy(pkg, 'copilot', subtype);

  return pkg as CanonicalPackage;
}

/**
 * Parse YAML frontmatter from Copilot instruction
 */
function parseFrontmatter(content: string): {
  frontmatter: { applyTo?: string | string[]; subtype?: string; type?: string };
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, frontmatterText, body] = match;

  try {
    // Parse YAML frontmatter
    const parsed = yaml.load(frontmatterText) as Record<string, unknown>;

    const frontmatter: { applyTo?: string | string[]; subtype?: string; type?: string } = {};

    if (parsed && typeof parsed === 'object') {
      if ('applyTo' in parsed) {
        if (typeof parsed.applyTo === 'string') {
          frontmatter.applyTo = parsed.applyTo;
        } else if (Array.isArray(parsed.applyTo)) {
          const filtered = parsed.applyTo.filter(item => typeof item === 'string') as string[];
          // Normalize single-element arrays to strings
          frontmatter.applyTo = filtered.length === 1 ? filtered[0] : filtered;
        }
      }
      if ('subtype' in parsed && typeof parsed.subtype === 'string') {
        frontmatter.subtype = parsed.subtype;
      }
      if ('type' in parsed && typeof parsed.type === 'string') {
        frontmatter.type = parsed.type;
      }
    }

    return { frontmatter, body };
  } catch (error) {
    // If YAML parsing fails, return empty frontmatter
    console.warn('Failed to parse YAML frontmatter:', error);
    return { frontmatter: {}, body };
  }
}

/**
 * Parse markdown body into canonical sections
 */
function parseMarkdown(content: string): { sections: Section[]; extractedDescription?: string; h1Title?: string } {
  const sections: Section[] = [];
  const lines = content.split('\n');
  let extractedDescription: string | undefined;
  let h1Title: string | undefined;

  let currentSection: {
    type: 'instructions' | 'rules' | 'examples' | 'context';
    title: string;
    content: string[];
    items?: Array<{ content: string; rationale?: string; examples?: string[] }>;
    examples?: Array<{ description: string; code: string; language?: string; good?: boolean }>;
  } | null = null;

  let inCodeBlock = false;
  let currentCodeBlock: { description: string; code: string[]; language?: string; good?: boolean } | null = null;
  let afterH1 = false;
  let firstParagraph: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect headers
    if (line.startsWith('# ')) {
      // Main title - mark that we're after H1 to capture first paragraph
      if (currentSection) {
        sections.push(buildSection(currentSection));
      }
      const title = line.substring(2).trim();

      // Extract H1 title (remove emoji if present)
      h1Title = title.replace(/^[\u{1F000}-\u{1F9FF}]\s+/u, '').trim() || title;

      currentSection = {
        type: 'context',
        title: 'Overview',
        content: [title],
      };
      afterH1 = true;
      firstParagraph = [];
      continue;
    }

    if (line.startsWith('## ')) {
      // Section header - capture first paragraph as description if we have it
      if (afterH1 && firstParagraph.length > 0 && !extractedDescription) {
        extractedDescription = firstParagraph.join(' ').trim();
      }
      afterH1 = false;

      if (currentSection) {
        sections.push(buildSection(currentSection));
      }

      const title = line.substring(3).trim();
      const sectionType = inferSectionType(title, lines, i);

      currentSection = {
        type: sectionType,
        title,
        content: [],
        items: sectionType === 'rules' ? [] : undefined,
        examples: sectionType === 'examples' ? [] : undefined,
      };
      continue;
    }

    if (line.startsWith('### ')) {
      // Example description
      const description = line.substring(4).trim();
      const good = description.startsWith('✅') || description.toLowerCase().includes('do:');

      currentCodeBlock = {
        description: description.replace(/^[✅❌]\s*/, '').replace(/^(Do|Don't):\s*/i, ''),
        code: [],
        good,
      };
      continue;
    }

    // Code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        inCodeBlock = true;
        const language = line.substring(3).trim() || undefined;
        if (currentCodeBlock) {
          currentCodeBlock.language = language;
        }
      } else {
        // End of code block
        inCodeBlock = false;
        if (currentCodeBlock && currentSection?.type === 'examples') {
          currentSection.examples!.push({
            description: currentCodeBlock.description,
            code: currentCodeBlock.code.join('\n'),
            language: currentCodeBlock.language,
            good: currentCodeBlock.good,
          });
          currentCodeBlock = null;
        }
      }
      continue;
    }

    // Inside code block
    if (inCodeBlock && currentCodeBlock) {
      currentCodeBlock.code.push(line);
      continue;
    }

    // List items (rules)
    if ((line.startsWith('- ') || line.match(/^\d+\.\s/)) && currentSection?.type === 'rules') {
      const itemContent = line.replace(/^[-\d.]\s+/, '').trim();
      currentSection.items!.push({ content: itemContent });
      continue;
    }

    // Sub-bullets (rationale or examples)
    if (line.startsWith('   - ') && currentSection?.type === 'rules' && currentSection.items!.length > 0) {
      const lastItem = currentSection.items![currentSection.items!.length - 1];
      const subContent = line.substring(5).trim();

      if (subContent.startsWith('*Rationale:')) {
        lastItem.rationale = subContent.replace(/^\*Rationale:\s*/, '').replace(/\*$/, '');
      } else if (subContent.startsWith('Example:')) {
        if (!lastItem.examples) lastItem.examples = [];
        lastItem.examples.push(subContent.replace(/^Example:\s*`([^`]+)`/, '$1'));
      }
      continue;
    }

    // Regular content lines
    // Capture first paragraph after H1
    if (afterH1 && line.trim() && !line.startsWith('#') && !line.startsWith('```')) {
      firstParagraph.push(line.trim());
    } else if (afterH1 && !line.trim() && firstParagraph.length > 0) {
      // Empty line marks end of first paragraph
      extractedDescription = firstParagraph.join(' ').trim();
      afterH1 = false;
    }

    if (line.trim() && currentSection) {
      currentSection.content.push(line);
    }
  }

  // Add last section
  if (currentSection) {
    sections.push(buildSection(currentSection));
  }

  // If we never extracted description but have first paragraph, use it now
  if (!extractedDescription && firstParagraph.length > 0) {
    extractedDescription = firstParagraph.join(' ').trim();
  }

  return { sections, extractedDescription, h1Title };
}

/**
 * Build canonical section from parsed data
 */
function buildSection(parsed: {
  type: 'instructions' | 'rules' | 'examples' | 'context';
  title: string;
  content: string[];
  items?: Array<{ content: string; rationale?: string; examples?: string[] }>;
  examples?: Array<{ description: string; code: string; language?: string; good?: boolean }>;
}): Section {
  switch (parsed.type) {
    case 'rules':
      return {
        type: 'rules',
        title: parsed.title,
        items: (parsed.items || []).map(item => ({
          content: item.content,
          rationale: item.rationale,
          examples: item.examples,
        })),
        ordered: false,
      } as RulesSection;

    case 'examples':
      return {
        type: 'examples',
        title: parsed.title,
        examples: parsed.examples || [],
      } as ExamplesSection;

    case 'context':
      return {
        type: 'context',
        title: parsed.title,
        content: parsed.content.join('\n'),
      } as ContextSection;

    case 'instructions':
    default:
      return {
        type: 'instructions',
        title: parsed.title,
        content: parsed.content.join('\n'),
      } as InstructionsSection;
  }
}

/**
 * Infer section type from title and content
 */
function inferSectionType(
  title: string,
  lines: string[],
  startIndex: number
): 'instructions' | 'rules' | 'examples' | 'context' {
  const titleLower = title.toLowerCase();

  // Check for examples keywords
  if (titleLower.includes('example') || titleLower.includes('sample')) {
    return 'examples';
  }

  // Check for rules/guidelines keywords
  if (
    titleLower.includes('rule') ||
    titleLower.includes('guideline') ||
    titleLower.includes('standard') ||
    titleLower.includes('convention')
  ) {
    return 'rules';
  }

  // Look ahead to see if next lines are list items
  for (let i = startIndex + 1; i < Math.min(startIndex + 5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.startsWith('- ') || line.match(/^\d+\.\s/)) {
      return 'rules';
    }
    if (line.startsWith('### ') || line.startsWith('```')) {
      return 'examples';
    }
  }

  // Default to instructions
  return 'instructions';
}
