/**
 * Tests for OpenCode format converter
 */

import { describe, it, expect } from 'vitest';
import { toOpencode } from '../to-opencode.js';
import { sampleCanonicalPackage, minimalCanonicalPackage } from './setup.js';
import type { CanonicalPackage } from '../types/canonical.js';

describe('toOpencode', () => {
  describe('basic conversion', () => {
    it('should convert canonical to OpenCode agent format', () => {
      const result = toOpencode(sampleCanonicalPackage);

      expect(result.format).toBe('opencode');
      expect(result.content).toBeTruthy();
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should generate valid YAML frontmatter', () => {
      const result = toOpencode(sampleCanonicalPackage);

      expect(result.content).toMatch(/^---\n/);
      expect(result.content).toContain('description:');
      expect(result.content).toContain('mode:');
    });

    it('should include description in frontmatter', () => {
      const result = toOpencode(sampleCanonicalPackage);

      expect(result.content).toContain('description: A test agent for conversion testing');
    });

    it('should default mode to "all" when not specified', () => {
      const result = toOpencode(sampleCanonicalPackage);

      expect(result.content).toContain('mode: all');
    });
  });

  describe('multi-section content - regression test for truncation bug', () => {
    it('should include ALL sections, not just the first instructions section', () => {
      // This is a regression test for the bug where only the first instructions
      // section was output, causing massive content truncation
      const multiSectionPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'multi-section-skill',
        subtype: 'skill',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Multi Section Skill',
                description: 'A skill with multiple sections',
              },
            },
            {
              type: 'instructions',
              title: 'Overview',
              content: 'This is the overview section.',
            },
            {
              type: 'instructions',
              title: 'When to Use',
              content: 'Use this when you need to do X, Y, and Z.',
            },
            {
              type: 'instructions',
              title: 'Directory Structure',
              content: 'Files are organized as follows:\n- src/\n- tests/\n- docs/',
            },
            {
              type: 'rules',
              title: 'Best Practices',
              items: [
                { content: 'Always validate input' },
                { content: 'Use TypeScript for type safety' },
                { content: 'Write tests first' },
              ],
            },
            {
              type: 'examples',
              title: 'Code Examples',
              examples: [
                {
                  description: 'Basic usage',
                  code: 'const result = doSomething();',
                  language: 'typescript',
                },
              ],
            },
            {
              type: 'instructions',
              title: 'Common Mistakes',
              content: 'Avoid these common mistakes:\n1. Forgetting error handling\n2. Not testing edge cases',
            },
          ],
        },
      };

      const result = toOpencode(multiSectionPkg);

      // All sections should be present
      expect(result.content).toContain('This is the overview section');
      expect(result.content).toContain('## When to Use');
      expect(result.content).toContain('Use this when you need to do X, Y, and Z');
      expect(result.content).toContain('## Directory Structure');
      expect(result.content).toContain('Files are organized as follows');
      expect(result.content).toContain('## Best Practices');
      expect(result.content).toContain('Always validate input');
      expect(result.content).toContain('Use TypeScript for type safety');
      expect(result.content).toContain('## Code Examples');
      expect(result.content).toContain('Basic usage');
      expect(result.content).toContain('## Common Mistakes');
      expect(result.content).toContain('Avoid these common mistakes');
    });

    it('should preserve section titles as headers', () => {
      const pkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test description',
              },
            },
            {
              type: 'instructions',
              title: 'Getting Started',
              content: 'Start here.',
            },
            {
              type: 'instructions',
              title: 'Advanced Usage',
              content: 'For advanced users.',
            },
          ],
        },
      };

      const result = toOpencode(pkg);

      expect(result.content).toContain('## Getting Started');
      expect(result.content).toContain('## Advanced Usage');
    });

    it('should not add header for generic section titles', () => {
      const pkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test description',
              },
            },
            {
              type: 'instructions',
              title: 'Overview',
              content: 'Overview content here.',
            },
            {
              type: 'instructions',
              title: 'Instructions',
              content: 'More instructions.',
            },
          ],
        },
      };

      const result = toOpencode(pkg);

      // Generic titles should not become headers
      expect(result.content).not.toContain('## Overview');
      expect(result.content).not.toContain('## Instructions');
      // But content should still be present
      expect(result.content).toContain('Overview content here');
      expect(result.content).toContain('More instructions');
    });
  });

  describe('context sections', () => {
    it('should include context sections with their titles', () => {
      const pkgWithContext: CanonicalPackage = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test',
              },
            },
            {
              type: 'context',
              title: 'Background',
              content: 'Important background information about the project.',
            },
          ],
        },
      };

      const result = toOpencode(pkgWithContext);

      expect(result.content).toContain('## Background');
      expect(result.content).toContain('Important background information');
    });
  });

  describe('slash command conversion', () => {
    it('should convert slash command with template field', () => {
      const slashCommandPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'run-tests',
        subtype: 'slash-command',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Run Tests',
                description: 'Run test suite',
                opencodeSlashCommand: {
                  template: 'Run the test suite with coverage: {{args}}',
                  description: 'Execute tests',
                },
              },
            },
          ],
        },
      };

      const result = toOpencode(slashCommandPkg);

      // YAML may quote strings with special chars like {{ }}
      expect(result.content).toContain('template:');
      expect(result.content).toContain('Run the test suite with coverage: {{args}}');
      expect(result.content).toContain('description: Execute tests');
    });

    it('should fallback to instructions content for template', () => {
      const slashCommandPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'deploy',
        subtype: 'slash-command',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Deploy',
                description: 'Deploy application',
              },
            },
            {
              type: 'instructions',
              title: 'Deployment Steps',
              content: 'Deploy to production environment',
            },
          ],
        },
      };

      const result = toOpencode(slashCommandPkg);

      expect(result.content).toContain('template: Deploy to production environment');
      expect(result.warnings).toContain('No template field found, using instructions content as template');
    });
  });

  describe('tools conversion', () => {
    it('should convert tools to OpenCode format', () => {
      const pkgWithTools: CanonicalPackage = {
        ...sampleCanonicalPackage,
        content: {
          ...sampleCanonicalPackage.content,
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Tool Test',
                description: 'Test tools conversion',
              },
            },
            {
              type: 'tools',
              tools: ['Read', 'Write', 'Bash', 'WebSearch'],
            },
          ],
        },
      };

      const result = toOpencode(pkgWithTools);

      expect(result.content).toContain('tools:');
      expect(result.content).toContain('read: true');
      expect(result.content).toContain('write: true');
      expect(result.content).toContain('bash: true');
      expect(result.content).toContain('websearch: true');
    });
  });

  describe('persona section', () => {
    it('should convert persona to role statement', () => {
      const pkgWithPersona: CanonicalPackage = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test',
              },
            },
            {
              type: 'persona',
              data: {
                role: 'Expert TypeScript Developer',
              },
            },
          ],
        },
      };

      const result = toOpencode(pkgWithPersona);

      expect(result.content).toContain('You are a Expert TypeScript Developer');
    });
  });

  describe('rules section', () => {
    it('should convert rules to bullet list', () => {
      const pkgWithRules: CanonicalPackage = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test',
              },
            },
            {
              type: 'rules',
              title: 'Coding Standards',
              items: [
                { content: 'Use TypeScript' },
                { content: 'Write tests' },
                { content: 'Document APIs' },
              ],
            },
          ],
        },
      };

      const result = toOpencode(pkgWithRules);

      expect(result.content).toContain('## Coding Standards');
      expect(result.content).toContain('- Use TypeScript');
      expect(result.content).toContain('- Write tests');
      expect(result.content).toContain('- Document APIs');
    });
  });

  describe('examples section', () => {
    it('should convert examples with code blocks', () => {
      const pkgWithExamples: CanonicalPackage = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test',
              },
            },
            {
              type: 'examples',
              title: 'Usage Examples',
              examples: [
                {
                  description: 'Basic API call',
                  code: 'fetch("/api/data")',
                },
                {
                  description: 'With error handling',
                  code: 'try { await fetch() } catch (e) { handle(e) }',
                },
              ],
            },
          ],
        },
      };

      const result = toOpencode(pkgWithExamples);

      expect(result.content).toContain('## Usage Examples');
      expect(result.content).toContain('### Basic API call');
      expect(result.content).toContain('```');
      expect(result.content).toContain('fetch("/api/data")');
      expect(result.content).toContain('### With error handling');
    });
  });

  describe('quality and warnings', () => {
    it('should report warnings for unsupported section types', () => {
      const pkgWithUnsupported: CanonicalPackage = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test',
              },
            },
            {
              type: 'file-reference' as any,
              path: 'src/utils.ts',
              required: true,
            },
          ],
        },
      };

      const result = toOpencode(pkgWithUnsupported);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('file-reference'))).toBe(true);
    });

    it('should mark conversion as lossy when sections are not supported', () => {
      const pkgWithUnsupported: CanonicalPackage = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test',
              },
            },
            {
              type: 'cursor-hook' as any,
              hookType: 'beforeShellExecution',
              command: 'echo test',
            },
          ],
        },
      };

      const result = toOpencode(pkgWithUnsupported);

      // Should have warning about unsupported section
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('cursor-hook'))).toBe(true);
    });
  });
});
