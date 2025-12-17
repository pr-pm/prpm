import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PackageManifest } from '../../types/registry.js';

// Mock fs/promises - inline factory functions
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
  copyFile: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock tar
vi.mock('tar', () => ({
  create: vi.fn().mockResolvedValue(undefined),
}));

// Mock os
vi.mock('os', () => ({
  tmpdir: () => '/tmp',
}));

// Mock crypto
vi.mock('crypto', () => ({
  randomBytes: () => ({
    toString: () => 'abc12345',
  }),
}));

import { createTarball, formatTarballSize } from '../tarball-creator.js';
import { readFile, stat, mkdir, rm, copyFile } from 'fs/promises';
import * as tar from 'tar';

// Get mock references
const mockReadFile = readFile as unknown as ReturnType<typeof vi.fn>;
const mockStat = stat as unknown as ReturnType<typeof vi.fn>;
const mockMkdir = mkdir as unknown as ReturnType<typeof vi.fn>;
const mockRm = rm as unknown as ReturnType<typeof vi.fn>;
const mockCopyFile = copyFile as unknown as ReturnType<typeof vi.fn>;
const mockTarCreate = tar.create as unknown as ReturnType<typeof vi.fn>;

describe('tarball-creator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.log during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Default mock implementations
    mockStat.mockResolvedValue({ isFile: () => true });
    mockReadFile.mockResolvedValue(Buffer.from('test content'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatTarballSize', () => {
    it('should format bytes as KB', () => {
      expect(formatTarballSize(1024)).toBe('1.00KB');
      expect(formatTarballSize(5120)).toBe('5.00KB');
      expect(formatTarballSize(512)).toBe('0.50KB');
    });

    it('should format large sizes as MB', () => {
      expect(formatTarballSize(1024 * 1024)).toBe('1.00MB');
      expect(formatTarballSize(2.5 * 1024 * 1024)).toBe('2.50MB');
    });
  });

  describe('createTarball - SKILL.md auto-rename', () => {
    const baseSkillManifest: PackageManifest = {
      name: 'test-skill',
      version: '1.0.0',
      description: 'A test skill',
      author: 'test',
      format: 'claude',
      subtype: 'skill',
      files: [],
    };

    it('should auto-rename single .md file to SKILL.md', async () => {
      const manifest = {
        ...baseSkillManifest,
        files: ['my-skill.md'],
      };

      // Mock stat to succeed for the skill file
      mockStat.mockImplementation((path: string) => {
        if (path === 'my-skill.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify copyFile was called with the renamed destination
      expect(mockCopyFile).toHaveBeenCalledWith(
        'my-skill.md',
        expect.stringContaining('SKILL.md')
      );

      // Verify tar.create was called with SKILL.md in the file list
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining(['SKILL.md'])
      );

      // Verify console.log was called with rename message
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Renaming my-skill.md → SKILL.md')
      );
    });

    it('should auto-rename .md file in subdirectory preserving path', async () => {
      const manifest = {
        ...baseSkillManifest,
        files: ['skills/my-skill.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'skills/my-skill.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify copyFile was called with the renamed destination in subdirectory
      expect(mockCopyFile).toHaveBeenCalledWith(
        'skills/my-skill.md',
        expect.stringContaining('skills/SKILL.md')
      );

      // Verify tar.create was called with skills/SKILL.md
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining(['skills/SKILL.md'])
      );
    });

    it('should NOT auto-rename when SKILL.md already exists', async () => {
      const manifest = {
        ...baseSkillManifest,
        files: ['SKILL.md', 'helper.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'SKILL.md' || path === 'helper.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify no rename message was logged
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Renaming')
      );

      // Verify tar.create includes SKILL.md as-is
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining(['SKILL.md', 'helper.md'])
      );
    });

    it('should NOT auto-rename when multiple .md files exist', async () => {
      const manifest = {
        ...baseSkillManifest,
        files: ['skill1.md', 'skill2.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'skill1.md' || path === 'skill2.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify no rename message was logged
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Renaming')
      );

      // Verify tar.create includes original filenames
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining(['skill1.md', 'skill2.md'])
      );
    });

    it('should exclude README.md from .md file count for auto-rename', async () => {
      const manifest = {
        ...baseSkillManifest,
        files: ['my-skill.md', 'README.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'my-skill.md' || path === 'README.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Should auto-rename since README doesn't count
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Renaming my-skill.md → SKILL.md')
      );
    });

    it('should NOT auto-rename to SKILL.md for agent subtype', async () => {
      const manifest = {
        ...baseSkillManifest,
        subtype: 'agent',
        files: ['my-agent.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'my-agent.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify no SKILL.md rename happened (but agent relocation is expected)
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Renaming')
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('SKILL.md')
      );

      // Agents get relocated to .claude/agents/
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining(['.claude/agents/my-agent.md'])
      );
    });

    it('should NOT auto-rename for non-claude formats', async () => {
      const manifest: PackageManifest = {
        name: 'test-cursor',
        version: '1.0.0',
        description: 'A test cursor rule',
        author: 'test',
        format: 'cursor',
        subtype: 'rule',
        files: ['rule.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'rule.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify no rename happened
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Renaming')
      );
    });
  });

  describe('createTarball - slash-command auto-relocate', () => {
    const baseSlashCommandManifest: PackageManifest = {
      name: 'build-function',
      version: '1.0.0',
      description: 'A test slash command',
      author: 'test',
      format: 'claude',
      subtype: 'slash-command',
      files: [],
    };

    it('should auto-relocate .md file to .claude/commands/', async () => {
      const manifest = {
        ...baseSlashCommandManifest,
        files: ['build-function.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'build-function.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify copyFile was called with the relocated destination
      expect(mockCopyFile).toHaveBeenCalledWith(
        'build-function.md',
        expect.stringContaining('.claude/commands/build-function.md')
      );

      // Verify tar.create was called with relocated path
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining(['.claude/commands/build-function.md'])
      );

      // Verify console.log was called with relocate message
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Relocating build-function.md')
      );
    });

    it('should NOT relocate files already in .claude/commands/', async () => {
      const manifest = {
        ...baseSlashCommandManifest,
        files: ['.claude/commands/build-function.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === '.claude/commands/build-function.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify no relocate message was logged
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Relocating')
      );

      // Verify original path is used
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining(['.claude/commands/build-function.md'])
      );
    });

    it('should relocate multiple command files', async () => {
      const manifest = {
        ...baseSlashCommandManifest,
        files: ['command1.md', 'command2.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'command1.md' || path === 'command2.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify both files were relocated
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([
          '.claude/commands/command1.md',
          '.claude/commands/command2.md',
        ])
      );
    });
  });

  describe('createTarball - agent auto-relocate', () => {
    const baseAgentManifest: PackageManifest = {
      name: 'test-agent',
      version: '1.0.0',
      description: 'A test agent',
      author: 'test',
      format: 'claude',
      subtype: 'agent',
      files: [],
    };

    it('should auto-relocate .md file to .claude/agents/', async () => {
      const manifest = {
        ...baseAgentManifest,
        files: ['my-agent.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'my-agent.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify copyFile was called with the relocated destination
      expect(mockCopyFile).toHaveBeenCalledWith(
        'my-agent.md',
        expect.stringContaining('.claude/agents/my-agent.md')
      );

      // Verify tar.create was called with relocated path
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining(['.claude/agents/my-agent.md'])
      );
    });

    it('should NOT relocate files already in .claude/agents/', async () => {
      const manifest = {
        ...baseAgentManifest,
        files: ['.claude/agents/my-agent.md'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === '.claude/agents/my-agent.md' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Verify no relocate message was logged
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Relocating')
      );
    });
  });

  describe('createTarball - standard files', () => {
    it('should include prpm.json, README.md, LICENSE if they exist', async () => {
      const manifest: PackageManifest = {
        name: 'test-pkg',
        version: '1.0.0',
        description: 'Test',
        author: 'test',
        format: 'cursor',
        subtype: 'rule',
        files: ['rule.mdc'],
      };

      mockStat.mockImplementation((path: string) => {
        // All files exist
        return Promise.resolve({ isFile: () => true });
      });

      await createTarball(manifest);

      // rule.mdc gets auto-relocated to .cursor/rules/rule.mdc
      expect(mockTarCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining(['prpm.json', 'README.md', 'LICENSE', '.cursor/rules/rule.mdc'])
      );
    });

    it('should skip non-existent standard files', async () => {
      const manifest: PackageManifest = {
        name: 'test-pkg',
        version: '1.0.0',
        description: 'Test',
        author: 'test',
        format: 'cursor',
        subtype: 'rule',
        files: ['rule.mdc'],
      };

      mockStat.mockImplementation((path: string) => {
        if (path === 'rule.mdc' || path === 'prpm.json') {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await createTarball(manifest);

      // Should only include files that exist
      // rule.mdc gets auto-relocated to .cursor/rules/rule.mdc
      const tarCreateCall = mockTarCreate.mock.calls[0];
      const fileList = tarCreateCall[1];
      expect(fileList).toContain('.cursor/rules/rule.mdc');
      expect(fileList).toContain('prpm.json');
      expect(fileList).not.toContain('README.md');
      expect(fileList).not.toContain('LICENSE');
    });
  });

  describe('createTarball - error handling', () => {
    it('should throw when no files found', async () => {
      const manifest: PackageManifest = {
        name: 'test-pkg',
        version: '1.0.0',
        description: 'Test',
        author: 'test',
        format: 'cursor',
        files: ['nonexistent.mdc'],
      };

      mockStat.mockRejectedValue(new Error('File not found'));

      await expect(createTarball(manifest)).rejects.toThrow(
        'No package files found'
      );
    });

    it('should clean up temp directory on error', async () => {
      const manifest: PackageManifest = {
        name: 'test-pkg',
        version: '1.0.0',
        description: 'Test',
        author: 'test',
        format: 'cursor',
        files: ['nonexistent.mdc'],
      };

      mockStat.mockRejectedValue(new Error('File not found'));

      try {
        await createTarball(manifest);
      } catch {
        // Expected error
      }

      // Verify cleanup was attempted
      expect(mockRm).toHaveBeenCalledWith(
        expect.stringContaining('/tmp/prpm-'),
        { recursive: true, force: true }
      );
    });
  });
});
