/**
 * Claude Format Parser
 * Converts Claude agent format to canonical format
 */

import type {
  CanonicalPackage,
  CanonicalContent,
  Section,
  MetadataSection,
  InstructionsSection,
  RulesSection,
  ToolsSection,
  PersonaSection,
} from '../types/canonical.js';

/**
 * Parse Claude agent format into canonical format
 */
export function fromClaude(
  content: string,
  metadata: {
    id: string;
    version?: string;
    author?: string;
    tags?: string[];
  }
): CanonicalPackage {
  const { frontmatter, body } = parseFrontmatter(content);

  const sections: Section[] = [];

  // Extract metadata from frontmatter
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: frontmatter.name || metadata.id,
      description: frontmatter.description || '',
      icon: frontmatter.icon,
      version: metadata.version || '1.0.0',
      author: metadata.author,
    },
  };
  sections.push(metadataSection);

  // Extract tools if present
  if (frontmatter.tools) {
    const tools = frontmatter.tools
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);

    if (tools.length > 0) {
      const toolsSection: ToolsSection = {
        type: 'tools',
        tools,
      };
      sections.push(toolsSection);
    }
  }

  // Parse body content
  const bodySections = parseMarkdownBody(body);
  sections.push(...bodySections);

  return {
    id: metadata.id,
    version: metadata.version || '1.0.0',
    name: frontmatter.name || metadata.id,
    description: frontmatter.description || '',
    author: metadata.author || 'unknown',
    tags: metadata.tags || [],
    type: 'agent', // Claude packages are typically agents
    content: {
      format: 'canonical',
      version: '1.0',
      sections,
    },
    sourceFormat: 'claude',
  };
}

/**
 * Parse YAML frontmatter from Claude agent
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, frontmatterText, body] = match;

  // Simple YAML parsing
  const frontmatter: Record<string, any> = {};
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}

/**
 * Parse markdown body into sections
 */
function parseMarkdownBody(body: string): Section[] {
  const sections: Section[] = [];
  const lines = body.split('\n');

  let currentSection: { type: string; title: string; lines: string[] } | null =
    null;
  let preamble: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for h1 (main title - usually just informational)
    if (line.startsWith('# ')) {
      continue; // Skip main title, already in metadata
    }

    // Check for h2 (section header)
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection) {
        sections.push(
          createSectionFromBlock(
            currentSection.title,
            currentSection.lines.join('\n')
          )
        );
      }

      // Start new section
      currentSection = {
        type: 'section',
        title: line.substring(3).trim(),
        lines: [],
      };
      continue;
    }

    // Add line to current section or preamble
    if (currentSection) {
      currentSection.lines.push(line);
    } else if (line.trim()) {
      preamble.push(line);
    }
  }

  // Handle preamble (content before first section)
  if (preamble.length > 0) {
    const preambleText = preamble.join('\n').trim();

    // Check if preamble contains persona information
    if (
      preambleText.startsWith('You are ') ||
      preambleText.includes('Your role is')
    ) {
      sections.push(parsePersona(preambleText));
    } else {
      // Generic instructions
      sections.push({
        type: 'instructions',
        title: 'Overview',
        content: preambleText,
      });
    }
  }

  // Save last section
  if (currentSection) {
    sections.push(
      createSectionFromBlock(currentSection.title, currentSection.lines.join('\n'))
    );
  }

  return sections;
}

/**
 * Create appropriate section type from markdown block
 */
function createSectionFromBlock(title: string, content: string): Section {
  const trimmedContent = content.trim();

  // Detect section type from title and content
  const lowerTitle = title.toLowerCase();

  // Rules/guidelines section
  if (
    lowerTitle.includes('rule') ||
    lowerTitle.includes('guideline') ||
    lowerTitle.includes('principle') ||
    (trimmedContent.includes('\n- ') && !trimmedContent.includes('```'))
  ) {
    return parseRulesSection(title, trimmedContent);
  }

  // Examples section
  if (
    lowerTitle.includes('example') ||
    trimmedContent.includes('```')
  ) {
    return parseExamplesSection(title, trimmedContent);
  }

  // Context/background section
  if (lowerTitle.includes('context') || lowerTitle.includes('background')) {
    return {
      type: 'context',
      title,
      content: trimmedContent,
    };
  }

  // Default to instructions
  return {
    type: 'instructions',
    title,
    content: trimmedContent,
  };
}

/**
 * Parse persona from preamble text
 */
function parsePersona(text: string): PersonaSection {
  const lines = text.split('\n');
  const data: any = {};

  // Extract role from "You are X" pattern
  const roleMatch = text.match(/You are ([^,.]+)/);
  if (roleMatch) {
    data.role = roleMatch[1].trim();
  }

  // Extract style from "Your communication style is X"
  const styleMatch = text.match(/style is ([^.]+)/);
  if (styleMatch) {
    data.style = styleMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  // Extract expertise (bulleted list)
  const expertise: string[] = [];
  let inExpertise = false;
  for (const line of lines) {
    if (line.includes('expertise') || line.includes('areas')) {
      inExpertise = true;
      continue;
    }
    if (inExpertise && line.startsWith('- ')) {
      expertise.push(line.substring(2).trim());
    } else if (inExpertise && line.trim() && !line.startsWith('-')) {
      inExpertise = false;
    }
  }
  if (expertise.length > 0) {
    data.expertise = expertise;
  }

  return {
    type: 'persona',
    data,
  };
}

/**
 * Parse rules section
 */
function parseRulesSection(title: string, content: string): RulesSection {
  const lines = content.split('\n');
  const items: any[] = [];
  let currentRule: any = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Bulleted or numbered rule
    if (trimmed.startsWith('- ') || /^\d+\./.test(trimmed)) {
      // Save previous rule
      if (currentRule) {
        items.push(currentRule);
      }

      // Extract rule content
      const content = trimmed.replace(/^-\s+|^\d+\.\s+/, '').trim();
      currentRule = { content };
    }
    // Rationale or example (indented)
    else if (trimmed.startsWith('*') && currentRule) {
      const text = trimmed.replace(/^\*|\*$/g, '').trim();
      if (text.toLowerCase().includes('rationale:')) {
        currentRule.rationale = text.replace(/^rationale:\s*/i, '');
      }
    } else if (trimmed.startsWith('Example:') && currentRule) {
      if (!currentRule.examples) {
        currentRule.examples = [];
      }
      currentRule.examples.push(trimmed.replace(/^Example:\s*`?|`?$/g, ''));
    }
  }

  // Save last rule
  if (currentRule) {
    items.push(currentRule);
  }

  return {
    type: 'rules',
    title,
    items,
  };
}

/**
 * Parse examples section
 */
function parseExamplesSection(title: string, content: string): any {
  const examples: any[] = [];
  const sections = content.split(/###\s+/);

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.split('\n');
    const header = lines[0].trim();

    // Detect good/bad example
    const isGood = header.includes('✓') || header.includes('Good');
    const isBad = header.includes('❌') || header.includes('Bad') || header.includes('Incorrect');

    const description = header
      .replace(/^[✓❌]\s*/, '')
      .replace(/^(Good|Bad|Incorrect):\s*/i, '')
      .trim();

    // Extract code blocks
    const codeMatch = section.match(/```(\w+)?\n([\s\S]*?)```/);
    if (codeMatch) {
      examples.push({
        description,
        code: codeMatch[2].trim(),
        language: codeMatch[1] || undefined,
        good: isBad ? false : isGood ? true : undefined,
      });
    }
  }

  return {
    type: 'examples',
    title,
    examples,
  };
}
