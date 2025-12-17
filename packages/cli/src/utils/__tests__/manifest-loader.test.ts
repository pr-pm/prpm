import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PackageManifest } from '../../types/registry.js';

// Mock the schema validator to always return valid - must be before imports
vi.mock('../../core/schema-validator.js', () => ({
  validateManifestSchema: () => ({ valid: true, errors: [] }),
}));

import { validateManifest, normalizeFilePaths } from '../manifest-loader.js';

describe('manifest-loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.log and console.warn during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeFilePaths', () => {
    it('should handle string array', () => {
      const files = ['file1.md', 'file2.md'];
      expect(normalizeFilePaths(files)).toEqual(['file1.md', 'file2.md']);
    });

    it('should handle file metadata objects', () => {
      const files = [
        { path: 'file1.md', type: 'claude-skill' },
        { path: 'file2.md', type: 'claude-agent' },
      ];
      expect(normalizeFilePaths(files as any)).toEqual(['file1.md', 'file2.md']);
    });

    it('should handle mixed array', () => {
      const files = [
        'file1.md',
        { path: 'file2.md', type: 'claude-skill' },
      ];
      expect(normalizeFilePaths(files as any)).toEqual(['file1.md', 'file2.md']);
    });
  });

  describe('validateManifest - Claude Skills', () => {
    const baseSkillManifest: PackageManifest = {
      name: 'test-skill',
      version: '1.0.0',
      description: 'A test skill for Claude Code that helps with testing functionality and provides detailed guidance on best practices',
      author: 'test',
      format: 'claude',
      subtype: 'skill',
      files: [],
    };

    describe('SKILL.md detection', () => {
      it('should accept SKILL.md in root', () => {
        const manifest = {
          ...baseSkillManifest,
          files: ['SKILL.md', 'README.md'],
        };

        const result = validateManifest(manifest);
        expect(result.name).toBe('test-skill');
      });

      it('should accept SKILL.md in subdirectory', () => {
        const manifest = {
          ...baseSkillManifest,
          files: ['skills/SKILL.md', 'README.md'],
        };

        const result = validateManifest(manifest);
        expect(result.name).toBe('test-skill');
      });

      it('should accept single .md file (will be auto-renamed)', () => {
        const manifest = {
          ...baseSkillManifest,
          files: ['my-skill.md', 'README.md'],
        };

        const result = validateManifest(manifest);
        expect(result.name).toBe('test-skill');
        // Should log warning about auto-rename
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('auto-renamed to SKILL.md')
        );
      });

      it('should error when no .md files present', () => {
        const manifest = {
          ...baseSkillManifest,
          files: ['README.md', 'LICENSE'],
        };

        expect(() => validateManifest(manifest)).toThrow(
          'Claude skills must contain a markdown file'
        );
      });

      it('should error when multiple .md files without SKILL.md', () => {
        const manifest = {
          ...baseSkillManifest,
          files: ['skill1.md', 'skill2.md', 'README.md'],
        };

        expect(() => validateManifest(manifest)).toThrow(
          'Claude skills with multiple .md files must use SKILL.md'
        );
      });

      it('should accept multiple .md files when SKILL.md is present', () => {
        const manifest = {
          ...baseSkillManifest,
          files: ['SKILL.md', 'helper.md', 'README.md'],
        };

        const result = validateManifest(manifest);
        expect(result.name).toBe('test-skill');
      });

      it('should exclude README from .md file count', () => {
        const manifest = {
          ...baseSkillManifest,
          files: ['my-skill.md', 'README.md', 'readme.md'],
        };

        // Should only count my-skill.md, so auto-rename should work
        const result = validateManifest(manifest);
        expect(result.name).toBe('test-skill');
      });
    });

    describe('skill name validation', () => {
      it('should accept valid skill names', () => {
        const manifest = {
          ...baseSkillManifest,
          name: 'my-skill-123',
          files: ['SKILL.md'],
        };

        const result = validateManifest(manifest);
        expect(result.name).toBe('my-skill-123');
      });

      it('should error on names with uppercase letters', () => {
        const manifest = {
          ...baseSkillManifest,
          name: 'MySkill',
          files: ['SKILL.md'],
        };

        expect(() => validateManifest(manifest)).toThrow(
          'contains invalid characters'
        );
      });

      it('should error on names with underscores', () => {
        const manifest = {
          ...baseSkillManifest,
          name: 'my_skill',
          files: ['SKILL.md'],
        };

        expect(() => validateManifest(manifest)).toThrow(
          'contains invalid characters'
        );
      });

      it('should error on names exceeding 64 characters', () => {
        const manifest = {
          ...baseSkillManifest,
          name: 'a'.repeat(65),
          files: ['SKILL.md'],
        };

        expect(() => validateManifest(manifest)).toThrow(
          'exceeds 64 character limit'
        );
      });

      it('should accept names at exactly 64 characters', () => {
        const manifest = {
          ...baseSkillManifest,
          name: 'a'.repeat(64),
          files: ['SKILL.md'],
        };

        const result = validateManifest(manifest);
        expect(result.name).toBe('a'.repeat(64));
      });
    });

    describe('skill description validation', () => {
      it('should error on descriptions exceeding 1024 characters', () => {
        const manifest = {
          ...baseSkillManifest,
          description: 'a'.repeat(1025),
          files: ['SKILL.md'],
        };

        expect(() => validateManifest(manifest)).toThrow(
          'exceeds 1024 character limit'
        );
      });

      it('should warn on descriptions approaching limit', () => {
        const manifest = {
          ...baseSkillManifest,
          description: 'a'.repeat(900), // > 819 (80% of 1024)
          files: ['SKILL.md'],
        };

        validateManifest(manifest);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('900/1024 characters')
        );
      });

      it('should warn on short descriptions', () => {
        const manifest = {
          ...baseSkillManifest,
          description: 'Short description', // < 100 chars
          files: ['SKILL.md'],
        };

        validateManifest(manifest);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('only')
        );
      });
    });
  });

  describe('validateManifest - Non-skill formats', () => {
    it('should not apply SKILL.md validation to Claude agents', () => {
      const manifest: PackageManifest = {
        name: 'test-agent',
        version: '1.0.0',
        description: 'A test agent',
        author: 'test',
        format: 'claude',
        subtype: 'agent',
        files: ['.claude/agents/my-agent.md'],
      };

      const result = validateManifest(manifest);
      expect(result.name).toBe('test-agent');
    });

    it('should not apply SKILL.md validation to Cursor rules', () => {
      const manifest: PackageManifest = {
        name: 'test-cursor-rule',
        version: '1.0.0',
        description: 'A test cursor rule',
        author: 'test',
        format: 'cursor',
        files: ['.cursor/rules/rule.mdc'],
      };

      const result = validateManifest(manifest);
      expect(result.name).toBe('test-cursor-rule');
    });
  });

  describe('validateManifest - default subtype', () => {
    it('should default subtype to rule when not provided', () => {
      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'A test package',
        author: 'test',
        format: 'cursor',
        files: ['rule.mdc'],
      };

      const result = validateManifest(manifest);
      expect(result.subtype).toBe('rule');
    });
  });
});
