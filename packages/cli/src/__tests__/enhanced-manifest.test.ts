/**
 * Tests for enhanced manifest format with per-file metadata
 */

import type { PackageManifest, PackageFileMetadata } from '../types/registry';

describe('Enhanced Manifest Format', () => {
  describe('Simple format (backward compatible)', () => {
    it('should accept string array for files', () => {
      const manifest: PackageManifest = {
        name: '@test/package',
        version: '1.0.0',
        description: 'Test package description',
        author: 'Test Author',
        type: 'claude',
        files: ['skill.md', 'README.md'],
      };

      expect(manifest.files).toEqual(['skill.md', 'README.md']);
      expect(Array.isArray(manifest.files)).toBe(true);
      expect(typeof manifest.files[0]).toBe('string');
    });
  });

  describe('Enhanced format (file objects)', () => {
    it('should accept file objects with metadata', () => {
      const files: PackageFileMetadata[] = [
        {
          path: '.claude/skills/skill1.md',
          type: 'claude-skill',
          name: 'My Skill',
          description: 'A great skill',
          tags: ['productivity'],
        },
        {
          path: '.claude/agents/agent1.md',
          type: 'claude-agent',
          name: 'My Agent',
          tags: ['coding'],
        },
      ];

      const manifest: PackageManifest = {
        name: '@test/collection',
        version: '1.0.0',
        description: 'Test collection',
        author: 'Test Author',
        type: 'collection',
        files,
      };

      expect(manifest.files).toHaveLength(2);
      expect(typeof manifest.files[0]).toBe('object');

      const firstFile = manifest.files[0] as PackageFileMetadata;
      expect(firstFile.path).toBe('.claude/skills/skill1.md');
      expect(firstFile.type).toBe('claude-skill');
      expect(firstFile.name).toBe('My Skill');
      expect(firstFile.tags).toEqual(['productivity']);
    });

    it('should support mixed Claude types', () => {
      const files: PackageFileMetadata[] = [
        {
          path: '.claude/skills/tdd.md',
          type: 'claude-skill',
          name: 'Test-Driven Development',
        },
        {
          path: '.claude/agents/test-gen.md',
          type: 'claude-agent',
          name: 'Test Generator',
        },
        {
          path: '.claude/commands/test.md',
          type: 'claude-slash-command',
          name: 'Test Command',
        },
      ];

      const manifest: PackageManifest = {
        name: '@test/testing-suite',
        version: '1.0.0',
        description: 'Complete testing suite',
        author: 'Test Author',
        type: 'collection',
        files,
      };

      expect(manifest.files).toHaveLength(3);

      const fileTypes = (manifest.files as PackageFileMetadata[]).map(f => f.type);
      expect(fileTypes).toContain('claude-skill');
      expect(fileTypes).toContain('claude-agent');
      expect(fileTypes).toContain('claude-slash-command');
    });

    it('should support multiple Cursor files with different tags', () => {
      const files: PackageFileMetadata[] = [
        {
          path: '.cursor/rules/typescript.mdc',
          type: 'cursor',
          name: 'TypeScript Rules',
          tags: ['typescript', 'frontend'],
        },
        {
          path: '.cursor/rules/python.mdc',
          type: 'cursor',
          name: 'Python Rules',
          tags: ['python', 'backend'],
        },
        {
          path: '.cursor/rules/rust.mdc',
          type: 'cursor',
          name: 'Rust Rules',
          tags: ['rust', 'systems'],
        },
      ];

      const manifest: PackageManifest = {
        name: '@company/cursor-rules',
        version: '1.0.0',
        description: 'Multi-language Cursor rules',
        author: 'Company',
        type: 'collection',
        files,
      };

      expect(manifest.files).toHaveLength(3);

      const allFiles = manifest.files as PackageFileMetadata[];
      expect(allFiles[0].tags).toEqual(['typescript', 'frontend']);
      expect(allFiles[1].tags).toEqual(['python', 'backend']);
      expect(allFiles[2].tags).toEqual(['rust', 'systems']);
    });

    it('should support cross-IDE packages', () => {
      const files: PackageFileMetadata[] = [
        {
          path: '.cursor/rules/react.mdc',
          type: 'cursor',
          tags: ['react'],
        },
        {
          path: '.claude/skills/react-best-practices.md',
          type: 'claude-skill',
          tags: ['react'],
        },
        {
          path: '.continue/rules/react.json',
          type: 'continue',
          tags: ['react'],
        },
      ];

      const manifest: PackageManifest = {
        name: '@test/react-rules',
        version: '1.0.0',
        description: 'React rules for all IDEs',
        author: 'Test Author',
        type: 'collection',
        files,
      };

      expect(manifest.files).toHaveLength(3);

      const fileTypes = (manifest.files as PackageFileMetadata[]).map(f => f.type);
      expect(fileTypes).toContain('cursor');
      expect(fileTypes).toContain('claude-skill');
      expect(fileTypes).toContain('continue');
    });

    it('should allow optional name and description fields', () => {
      const files: PackageFileMetadata[] = [
        {
          path: '.claude/skills/skill1.md',
          type: 'claude-skill',
          // No name or description
        },
        {
          path: '.claude/skills/skill2.md',
          type: 'claude-skill',
          name: 'Named Skill',
          // No description
        },
        {
          path: '.claude/skills/skill3.md',
          type: 'claude-skill',
          name: 'Fully Documented Skill',
          description: 'This skill does great things',
        },
      ];

      const manifest: PackageManifest = {
        name: '@test/skills',
        version: '1.0.0',
        description: 'Skills collection',
        author: 'Test Author',
        type: 'collection',
        files,
      };

      const allFiles = manifest.files as PackageFileMetadata[];
      expect(allFiles[0].name).toBeUndefined();
      expect(allFiles[0].description).toBeUndefined();
      expect(allFiles[1].name).toBe('Named Skill');
      expect(allFiles[1].description).toBeUndefined();
      expect(allFiles[2].name).toBe('Fully Documented Skill');
      expect(allFiles[2].description).toBe('This skill does great things');
    });
  });

  describe('Type checking', () => {
    it('should allow union type for files', () => {
      // Simple format
      const manifest1: PackageManifest = {
        name: '@test/simple',
        version: '1.0.0',
        description: 'Simple package',
        author: 'Test',
        type: 'claude',
        files: ['file.md'],
      };

      // Enhanced format
      const manifest2: PackageManifest = {
        name: '@test/enhanced',
        version: '1.0.0',
        description: 'Enhanced package',
        author: 'Test',
        type: 'collection',
        files: [
          {
            path: 'file.md',
            type: 'claude-skill',
          },
        ],
      };

      expect(Array.isArray(manifest1.files)).toBe(true);
      expect(Array.isArray(manifest2.files)).toBe(true);
    });
  });
});
