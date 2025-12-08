/**
 * Tests for Codex format converter
 */

import { describe, it, expect } from 'vitest';
import { toCodex } from '../to-codex.js';
import { minimalCanonicalPackage } from './setup.js';
import type { CanonicalPackage } from '../types/canonical.js';

describe('toCodex', () => {
  describe('basic conversion', () => {
    it('should convert canonical to AGENTS.md format', () => {
      const result = toCodex(minimalCanonicalPackage);

      expect(result.format).toBe('codex');
      expect(result.content).toBeTruthy();
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should generate valid markdown with title', () => {
      const result = toCodex(minimalCanonicalPackage);

      expect(result.content).toContain('# ');
    });
  });

  describe('slash command conversion', () => {
    it('should convert slash command to AGENTS.md section', () => {
      const slashCommandPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'build-actions',
        subtype: 'slash-command',
        description: 'Build actions workflow for Nango integrations',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Build Actions',
                description: 'Build actions workflow',
                claudeSlashCommand: {
                  description: 'Complete workflow for building Nango actions',
                  argumentHint: '[integration-name] [action-name] [instructions]',
                },
              },
            },
            {
              type: 'instructions',
              title: 'Workflow Steps',
              content: 'Follow these steps to build actions...',
            },
          ],
        },
      };

      const result = toCodex(slashCommandPkg);

      // Should have section header
      expect(result.content).toContain('## build-actions');

      // Should have usage instruction (without slash)
      expect(result.content).toContain('Say "build-actions');

      // Should have argument documentation
      expect(result.content).toContain('<integration-name>');
      expect(result.content).toContain('<action-name>');
      expect(result.content).toContain('<instructions>');

      // Should have invocation instruction
      expect(result.content).toContain('When the user says "build-actions"');

      // Should include instructions content
      expect(result.content).toContain('Workflow Steps');
      expect(result.content).toContain('Follow these steps');
    });

    it('should handle slash command without arguments', () => {
      const slashCommandPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'help',
        subtype: 'slash-command',
        description: 'Show help information',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Help',
                description: 'Show help information',
              },
            },
            {
              type: 'instructions',
              title: 'Help Information',
              content: 'Display available commands and their usage.',
            },
          ],
        },
      };

      const result = toCodex(slashCommandPkg);

      expect(result.content).toContain('## help');
      expect(result.content).toContain('Say "help" to invoke');
      expect(result.content).not.toContain('Arguments:');
    });

    it('should strip leading slash from command name', () => {
      const slashCommandPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: '/my-command',
        subtype: 'slash-command',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'My Command',
                description: 'Test command',
              },
            },
          ],
        },
      };

      const result = toCodex(slashCommandPkg);

      expect(result.content).toContain('## my-command');
      expect(result.content).not.toContain('## /my-command');
    });
  });

  describe('argument handling', () => {
    it('should handle bracketed argument format', () => {
      const pkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'test',
        subtype: 'slash-command',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test',
                claudeSlashCommand: {
                  argumentHint: '[file-path] [output-dir]',
                },
              },
            },
          ],
        },
      };

      const result = toCodex(pkg);

      expect(result.content).toContain('<file-path>');
      expect(result.content).toContain('<output-dir>');
    });

    it('should handle array argument format', () => {
      const pkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'test',
        subtype: 'slash-command',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test',
                claudeSlashCommand: {
                  argumentHint: ['source', 'destination'],
                },
              },
            },
          ],
        },
      };

      const result = toCodex(pkg);

      expect(result.content).toContain('<source>');
      expect(result.content).toContain('<destination>');
    });
  });

  describe('append mode', () => {
    it('should append new command to existing AGENTS.md', () => {
      const existingContent = `# My Project

Some project instructions.

## existing-command

Usage: Say "existing-command" to invoke
`;

      const newCommandPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'new-command',
        subtype: 'slash-command',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'New Command',
                description: 'A new command',
              },
            },
          ],
        },
      };

      const result = toCodex(newCommandPkg, {
        codexConfig: {
          appendMode: true,
          existingContent,
        },
      });

      // Should contain both commands
      expect(result.content).toContain('## existing-command');
      expect(result.content).toContain('## new-command');

      // Should preserve original content
      expect(result.content).toContain('# My Project');
      expect(result.content).toContain('Some project instructions');
    });

    it('should replace existing command section when appending', () => {
      const existingContent = `# My Project

## my-command

Old content for my-command
`;

      const updatedCommandPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'my-command',
        subtype: 'slash-command',
        description: 'Updated description',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'My Command',
                description: 'Updated command',
              },
            },
            {
              type: 'instructions',
              title: 'New Instructions',
              content: 'Updated instructions here',
            },
          ],
        },
      };

      const result = toCodex(updatedCommandPkg, {
        codexConfig: {
          appendMode: true,
          existingContent,
        },
      });

      // Should have the updated content
      expect(result.content).toContain('Updated instructions');

      // Should NOT have the old content
      expect(result.content).not.toContain('Old content for my-command');
    });
  });

  describe('section conversion', () => {
    it('should skip tools section with warning', () => {
      const pkgWithTools: CanonicalPackage = {
        ...minimalCanonicalPackage,
        subtype: 'slash-command',
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'tools',
              tools: ['Read', 'Write', 'Bash'],
            },
          ],
        },
      };

      const result = toCodex(pkgWithTools);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('Tools section skipped'))).toBe(true);
    });

    it('should skip persona section with warning', () => {
      const pkgWithPersona: CanonicalPackage = {
        ...minimalCanonicalPackage,
        subtype: 'slash-command',
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'persona',
              data: {
                role: 'Expert developer',
              },
            },
          ],
        },
      };

      const result = toCodex(pkgWithPersona);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('Persona section skipped'))).toBe(true);
    });

    it('should skip cursor-hook section with warning', () => {
      const pkgWithCursorHook: CanonicalPackage = {
        ...minimalCanonicalPackage,
        subtype: 'slash-command',
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'cursor-hook',
              hookType: 'beforeShellExecution',
              command: 'echo "test"',
            },
          ],
        },
      };

      const result = toCodex(pkgWithCursorHook);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('Cursor hook section skipped'))).toBe(true);
    });

    it('should skip file-reference section with warning', () => {
      const pkgWithFileRef: CanonicalPackage = {
        ...minimalCanonicalPackage,
        subtype: 'slash-command',
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'file-reference',
              path: 'src/utils.ts',
              required: true,
            },
          ],
        },
      };

      const result = toCodex(pkgWithFileRef);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('File reference section skipped'))).toBe(true);
    });

    it('should include examples section', () => {
      const pkgWithExamples: CanonicalPackage = {
        ...minimalCanonicalPackage,
        subtype: 'slash-command',
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
              title: 'Examples',
              examples: [
                {
                  description: 'Good example',
                  code: 'console.log("hello")',
                  language: 'javascript',
                  good: true,
                },
              ],
            },
          ],
        },
      };

      const result = toCodex(pkgWithExamples);

      expect(result.content).toContain('### Examples');
      expect(result.content).toContain('Preferred: Good example');
      expect(result.content).toContain('```javascript');
    });
  });

  describe('invocation instructions', () => {
    it('should provide natural language invocation hint', () => {
      const pkg: CanonicalPackage = {
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
              },
            },
          ],
        },
      };

      const result = toCodex(pkg);

      // Should include both exact name and natural language variant
      expect(result.content).toContain('When the user says "run-tests"');
      expect(result.content).toContain('or asks to "run tests"');
    });
  });
});
