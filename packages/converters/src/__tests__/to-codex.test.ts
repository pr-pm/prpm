/**
 * Tests for Codex format converter
 */

import { describe, it, expect } from 'vitest';
import { toCodex } from '../to-codex.js';
import { fromCodexAgentRole } from '../from-codex.js';
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

  describe('skill conversion (Agent Skills format)', () => {
    it('should convert skill to SKILL.md format with YAML frontmatter', () => {
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'typescript-expert',
        subtype: 'skill',
        description: 'Expert TypeScript development assistance.',
        metadata: {
          title: 'TypeScript Expert',
          description: 'Expert TypeScript development assistance.',
        },
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'TypeScript Expert',
                description: 'Expert TypeScript development assistance.',
              },
            },
            {
              type: 'instructions',
              title: 'Guidelines',
              content: 'Always use strict type checking.',
            },
          ],
        },
      };

      const result = toCodex(skillPkg);

      expect(result.format).toBe('codex');
      expect(result.content).toContain('---');
      expect(result.content).toContain('name: typescript-expert');
      expect(result.content).toContain('description:');
      expect(result.content).toContain('### Guidelines');
    });

    it('should include license in SKILL.md frontmatter', () => {
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'licensed-skill',
        subtype: 'skill',
        license: 'MIT',
        description: 'A licensed skill.',
        metadata: {
          title: 'Licensed Skill',
          description: 'A licensed skill.',
        },
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Licensed Skill',
                description: 'A licensed skill.',
              },
            },
          ],
        },
      };

      const result = toCodex(skillPkg);

      expect(result.content).toContain('license: MIT');
    });

    it('should preserve Agent Skills metadata for roundtrip', () => {
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'roundtrip-skill',
        subtype: 'skill',
        description: 'Testing roundtrip.',
        metadata: {
          title: 'Roundtrip Skill',
          description: 'Testing roundtrip.',
        },
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Roundtrip Skill',
                description: 'Testing roundtrip.',
                agentSkills: {
                  name: 'original-name',
                  license: 'Apache-2.0',
                  compatibility: 'Requires python3',
                  allowedTools: 'Bash(python:*) Read',
                  metadata: {
                    category: 'data-science',
                  },
                },
              },
            },
          ],
        },
      };

      const result = toCodex(skillPkg);

      expect(result.content).toContain('name: original-name');
      expect(result.content).toContain('license: Apache-2.0');
      expect(result.content).toContain('compatibility: Requires python3');
      expect(result.content).toContain('allowed-tools: Bash(python:*) Read');
      expect(result.content).toContain('metadata:');
      expect(result.content).toContain('category:');
    });

    it('should convert tools section to allowed-tools', () => {
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'tools-skill',
        subtype: 'skill',
        description: 'Skill with tools.',
        metadata: {
          title: 'Tools Skill',
          description: 'Skill with tools.',
        },
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Tools Skill',
                description: 'Skill with tools.',
              },
            },
            {
              type: 'tools',
              tools: ['Read', 'Write', 'Bash'],
            },
          ],
        },
      };

      const result = toCodex(skillPkg);

      expect(result.content).toContain('allowed-tools: Read Write Bash');
    });

    it('should skip persona section with warning for skills', () => {
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'persona-skill',
        subtype: 'skill',
        description: 'Skill with persona.',
        metadata: {
          title: 'Persona Skill',
          description: 'Skill with persona.',
        },
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Persona Skill',
                description: 'Skill with persona.',
              },
            },
            {
              type: 'persona',
              data: {
                role: 'Expert developer',
              },
            },
          ],
        },
      };

      const result = toCodex(skillPkg);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('Persona section skipped'))).toBe(true);
    });

    it('should truncate description to 1024 chars', () => {
      const longDescription = 'A'.repeat(1100);
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'long-desc-skill',
        subtype: 'skill',
        description: longDescription,
        metadata: {
          title: 'Long Desc Skill',
          description: longDescription,
        },
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Long Desc Skill',
                description: longDescription,
              },
            },
          ],
        },
      };

      const result = toCodex(skillPkg);

      // Description should be truncated
      expect(result.content).toContain('...');
    });

    it('should slugify skill name properly', () => {
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'My Cool Skill',
        subtype: 'skill',
        description: 'Test.',
        metadata: {
          title: 'My Cool Skill',
          description: 'Test.',
        },
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'My Cool Skill',
                description: 'Test.',
              },
            },
          ],
        },
      };

      const result = toCodex(skillPkg);

      expect(result.content).toContain('name: my-cool-skill');
    });

    it('should use package name slug (not H1 title) for skill name', () => {
      // Regression: H1 title was incorrectly used instead of pkg.name,
      // violating the Agent Skills spec (name must match parent directory name)
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'self-improving',
        subtype: 'skill',
        description: 'Searches PRPM registry for relevant packages.',
        metadata: {
          title: 'Self-Improving with PRPM',  // H1 — should NOT become the name slug
          description: 'Searches PRPM registry for relevant packages.',
        },
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Self-Improving with PRPM',
                description: 'Searches PRPM registry for relevant packages.',
              },
            },
          ],
        },
      };

      const result = toCodex(skillPkg);

      expect(result.content).toContain('name: self-improving');
      expect(result.content).not.toContain('name: self-improving-with-prpm');
    });

    it('should strip author namespace from skill name', () => {
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: '@prpm/self-improving',
        subtype: 'skill',
        description: 'Test.',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [{ type: 'metadata', data: { title: 'Test', description: 'Test.' } }],
        },
      };

      const result = toCodex(skillPkg);

      expect(result.content).toContain('name: self-improving');
      expect(result.content).not.toContain('name: prpm-self-improving');
    });

    it('should prefer agentSkills.name over pkg.name for roundtrip fidelity', () => {
      const skillPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'different-registry-name',
        subtype: 'skill',
        description: 'Test.',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test',
                description: 'Test.',
                agentSkills: { name: 'original-skill-name' },
              },
            },
          ],
        },
      };

      const result = toCodex(skillPkg);

      expect(result.content).toContain('name: original-skill-name');
    });
  });

  describe('agent role TOML conversion', () => {
    it('should produce TOML output for agent subtype', () => {
      const agentPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'reviewer',
        subtype: 'agent',
        description: 'Find security issues.',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            { type: 'metadata', data: { title: 'Reviewer', description: 'Find security issues.' } },
            { type: 'instructions', title: 'Instructions', content: 'Focus on security vulnerabilities.' },
          ],
        },
      };

      const result = toCodex(agentPkg);

      expect(result.format).toBe('codex');
      // TOML output — no YAML frontmatter delimiters
      expect(result.content).not.toContain('---');
      expect(result.content).toContain('developer_instructions');
      expect(result.content).toContain('Focus on security vulnerabilities.');
    });

    it('should include model field in TOML when set', () => {
      const agentPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'explorer',
        subtype: 'agent',
        description: 'Fast codebase explorer.',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Explorer',
                description: 'Fast codebase explorer.',
                codexAgent: { model: 'o3-mini', modelReasoningEffort: 'low' },
              },
            },
          ],
        },
      };

      const result = toCodex(agentPkg);

      expect(result.content).toContain('model = ');
      expect(result.content).toContain('o3-mini');
      expect(result.content).toContain('model_reasoning_effort = ');
      expect(result.content).toContain('low');
    });

    it('should include sandbox_mode with correct enum values', () => {
      const agentPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'safe-agent',
        subtype: 'agent',
        description: 'Read-only agent.',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Safe Agent',
                description: 'Read-only agent.',
                codexAgent: { sandboxMode: 'read-only' },
              },
            },
          ],
        },
      };

      const result = toCodex(agentPkg);

      expect(result.content).toContain('sandbox_mode = ');
      expect(result.content).toContain('read-only');
    });

    it('should warn and not crash when unsupported sections are present', () => {
      const agentPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'agent-with-tools',
        subtype: 'agent',
        description: 'Agent with tools.',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            { type: 'metadata', data: { title: 'Agent', description: 'Agent with tools.' } },
            { type: 'tools', tools: ['Read', 'Write'] },
          ],
        },
      };

      const result = toCodex(agentPkg);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('Tools section skipped'))).toBe(true);
      expect(result.lossyConversion).toBe(true);
    });

    it('should produce a roundtrip-stable agent role', () => {
      const agentPkg: CanonicalPackage = {
        ...minimalCanonicalPackage,
        name: 'reviewer',
        subtype: 'agent',
        description: 'Find security issues.',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Reviewer',
                description: 'Find security issues.',
                codexAgent: { model: 'o3', modelReasoningEffort: 'high', sandboxMode: 'read-only' },
              },
            },
            { type: 'instructions', title: 'Instructions', content: 'Focus on security.' },
          ],
        },
      };

      const tomlOutput = toCodex(agentPkg).content;
      const reparsed = fromCodexAgentRole(tomlOutput, {
        id: 'reviewer', name: 'reviewer', version: '1.0.0', author: 'test',
      });

      const meta = reparsed.content.sections.find(s => s.type === 'metadata');
      if (meta?.type === 'metadata') {
        expect(meta.data.codexAgent?.model).toBe('o3');
        expect(meta.data.codexAgent?.modelReasoningEffort).toBe('high');
        expect(meta.data.codexAgent?.sandboxMode).toBe('read-only');
      }
      const instr = reparsed.content.sections.find(s => s.type === 'instructions');
      expect(instr?.type === 'instructions' && instr.content).toContain('Focus on security.');
    });
  });
});
