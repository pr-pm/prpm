/**
 * Windsurf Rules Converter
 * Converts canonical package format to Windsurf .windsurfrules format
 *
 * Windsurf uses a simple markdown format similar to Cursor but without MDC headers.
 * File location: .windsurfrules (root of project)
 */

import type { CanonicalPackage, ConversionResult } from '../types/canonical.js';

/**
 * Convert canonical package to Windsurf format
 */
export function toWindsurf(pkg: CanonicalPackage): ConversionResult {
  const lines: string[] = [];
  const warnings: string[] = [];
  let qualityScore = 100;

  // Add title (without icon for Windsurf)
  const title = pkg.metadata?.title || pkg.name;
  lines.push(`# ${title}`);
  lines.push('');

  // Add description if available
  if (pkg.description || pkg.metadata?.description) {
    lines.push(pkg.description || pkg.metadata?.description || '');
    lines.push('');
  } else {
    qualityScore -= 10;
    warnings.push('No description provided');
  }

  // Convert sections
  for (const section of pkg.content.sections) {
    // Skip metadata section
    if (section.type === 'metadata') {
      continue;
    }

    // Add section title
    if (section.title) {
      lines.push(`## ${section.title}`);
      lines.push('');
    }

    // Convert based on section type
    switch (section.type) {
      case 'persona': {
        // Convert persona to Role section
        if (section.content.name) {
          const emoji = section.content.emoji || '🤖';
          const role = section.content.role || 'Assistant';
          lines.push(`${emoji} **${section.content.name}** - ${role}`);
          lines.push('');
        }

        if (section.content.tone) {
          lines.push(`**Style:** ${section.content.tone}`);
          lines.push('');
        }

        if (section.content.expertise && section.content.expertise.length > 0) {
          lines.push('**Expertise:**');
          for (const exp of section.content.expertise) {
            lines.push(`- ${exp}`);
          }
          lines.push('');
        }

        if (section.content.background) {
          lines.push(section.content.background);
          lines.push('');
        }
        break;
      }

      case 'instructions': {
        // Convert instructions
        if (section.content.text) {
          lines.push(section.content.text);
          lines.push('');
        }

        if (section.content.items && section.content.items.length > 0) {
          for (const item of section.content.items) {
            if (item.emphasis === 'strong') {
              lines.push(`**${item.title || 'Important'}:** ${item.text}`);
            } else if (item.emphasis === 'warning') {
              lines.push(`⚠️ **Warning:** ${item.text}`);
            } else {
              lines.push(`- ${item.text}`);
            }
          }
          lines.push('');
        }
        break;
      }

      case 'rules': {
        // Convert rules to numbered or bulleted list
        if (section.content.items && section.content.items.length > 0) {
          for (let i = 0; i < section.content.items.length; i++) {
            const rule = section.content.items[i];
            const prefix = section.content.ordered ? `${i + 1}.` : '-';

            lines.push(`${prefix} ${rule.text}`);

            // Add rationale if present
            if (rule.rationale) {
              lines.push(`   - *Rationale: ${rule.rationale}*`);
            }

            // Add example if present
            if (rule.example) {
              lines.push(`   - Example: ${rule.example}`);
            }
          }
          lines.push('');
        }
        break;
      }

      case 'examples': {
        // Convert examples
        if (section.content.items && section.content.items.length > 0) {
          for (const example of section.content.items) {
            if (example.title) {
              lines.push(`### ${example.title}`);
              lines.push('');
            }

            if (example.description) {
              lines.push(example.description);
              lines.push('');
            }

            if (example.code) {
              const language = example.language || '';
              lines.push(`\`\`\`${language}`);
              lines.push(example.code);
              lines.push('```');
              lines.push('');
            }
          }
        }
        break;
      }

      case 'tools': {
        // Convert tools configuration
        warnings.push('Tools configuration may not be supported by Windsurf');

        if (section.content.items && section.content.items.length > 0) {
          lines.push('**Available Tools:**');
          lines.push('');
          for (const tool of section.content.items) {
            lines.push(`- **${tool.name}**`);
            if (tool.description) {
              lines.push(`  ${tool.description}`);
            }
          }
          lines.push('');
        }
        break;
      }

      case 'reference': {
        // Convert reference section
        if (section.content.text) {
          lines.push(section.content.text);
          lines.push('');
        }

        if (section.content.links && section.content.links.length > 0) {
          lines.push('**References:**');
          for (const link of section.content.links) {
            lines.push(`- [${link.title}](${link.url})`);
          }
          lines.push('');
        }
        break;
      }

      default: {
        // Generic section - just add content
        if (section.content.text) {
          lines.push(section.content.text);
          lines.push('');
        }
      }
    }
  }

  // Calculate quality score based on content
  const hasPersona = pkg.content.sections.some(s => s.type === 'persona');
  const hasInstructions = pkg.content.sections.some(s => s.type === 'instructions');
  const hasExamples = pkg.content.sections.some(s => s.type === 'examples');

  if (!hasInstructions) {
    qualityScore -= 20;
    warnings.push('No instructions section found');
  }

  if (!hasPersona) {
    qualityScore -= 5;
  }

  if (!hasExamples) {
    qualityScore -= 10;
  }

  const content = lines.join('\n').trim() + '\n';

  return {
    format: 'windsurf',
    content,
    qualityScore: Math.max(0, qualityScore),
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Check if content is in Windsurf format
 */
export function isWindsurfFormat(content: string): boolean {
  // Windsurf files are simple markdown
  // They should have markdown headers and not have MDC frontmatter
  const hasMDCHeader = /^---\s*\n[\s\S]*?\n---/.test(content);
  const hasMarkdownHeaders = /^#{1,6}\s+.+$/m.test(content);

  return hasMarkdownHeaders && !hasMDCHeader;
}
