/**
 * Tests for install command format conversion with --as and --format flags
 */

import { handleInstall } from '../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile } from '../core/filesystem';
import { readLockfile, writeLockfile, addToLockfile, createLockfile, setPackageIntegrity } from '../core/lockfile';
import { gzipSync } from 'zlib';

// Mock dependencies
jest.mock('@pr-pm/registry-client');
jest.mock('../core/user-config');
jest.mock('../core/lockfile');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

jest.mock('../core/filesystem', () => {
  const actual = jest.requireActual('../core/filesystem');
  return {
    ...actual,
    saveFile: jest.fn(actual.saveFile),
    ensureDirectoryExists: jest.fn(actual.ensureDirectoryExists),
  };
});

describe('Install command - format conversion', () => {
  const mockClient = {
    getPackage: jest.fn(),
    getPackageVersion: jest.fn(),
    downloadPackage: jest.fn(),
    trackDownload: jest.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  beforeEach(() => {
    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue(mockConfig);
    (readLockfile as jest.Mock).mockResolvedValue(null);
    (writeLockfile as jest.Mock).mockResolvedValue(undefined);
    (addToLockfile as jest.Mock).mockImplementation(() => {});
    (createLockfile as jest.Mock).mockReturnValue({ packages: {} });
    (setPackageIntegrity as jest.Mock).mockImplementation(() => {});
    (saveFile as jest.Mock).mockResolvedValue(undefined);
    mockClient.trackDownload.mockResolvedValue(undefined);

    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('--as flag (client-side conversion)', () => {
    it('should convert Claude package to Cursor format using --as', async () => {
      const mockPackage = {
        id: 'claude-skill',
        name: 'claude-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      // Sample Claude skill content
      const claudeContent = `---
name: test-skill
description: A test skill
tools: Read, Write
---

# Test Skill

This is a test skill.

## Principles
- Write clean code
- Test thoroughly`;

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(claudeContent));

      await handleInstall('claude-skill', { as: 'cursor' });

      // Should download native format (no format parameter)
      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        'https://example.com/package.tar.gz'
      );

      // Should save to cursor directory
      expect(saveFile).toHaveBeenCalledWith(
        expect.stringContaining('.cursor/rules'),
        expect.any(String)
      );

      // Verify conversion happened - saved content should be in Cursor format
      const savedContent = (saveFile as jest.Mock).mock.calls[0][1];
      expect(savedContent).toContain('alwaysApply'); // Cursor frontmatter
    });

    it('should convert Cursor package to Claude format using --as', async () => {
      const mockPackage = {
        id: 'cursor-rule',
        name: 'cursor-rule',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 50,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      // Sample Cursor rule content
      const cursorContent = `---
alwaysApply: true
description: A test rule
---

# Test Rule

This is a test cursor rule.`;

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(cursorContent));

      await handleInstall('cursor-rule', { as: 'claude' });

      // Should download native format
      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        'https://example.com/package.tar.gz'
      );

      expect(saveFile).toHaveBeenCalledWith(
        expect.stringContaining('.claude/'),
        expect.any(String)
      );

      // Verify conversion - should have Claude frontmatter
      const savedContent = (saveFile as jest.Mock).mock.calls[0][1];
      expect(savedContent).toContain('name:'); // Claude frontmatter
      expect(savedContent).toContain('description:');
    });

    it('should convert Claude to Windsurf format using --as', async () => {
      const mockPackage = {
        id: 'claude-skill',
        name: 'claude-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 25,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      const claudeContent = `---
name: windsurf-test
description: Test for windsurf conversion
---

# Test Skill`;

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(claudeContent));

      await handleInstall('claude-skill', { as: 'windsurf' });

      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        'https://example.com/package.tar.gz'
      );

      expect(saveFile).toHaveBeenCalledWith(
        expect.stringContaining('.windsurf/'),
        expect.any(String)
      );
    });

    it('should convert to Continue format using --as', async () => {
      const mockPackage = {
        id: 'claude-agent',
        name: 'claude-agent',
        format: 'claude',
        subtype: 'agent',
        tags: [],
        total_downloads: 75,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      const claudeContent = `---
name: test-agent
description: Test agent
---

# Test Agent`;

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(claudeContent));

      await handleInstall('claude-agent', { as: 'continue' });

      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        'https://example.com/package.tar.gz'
      );

      expect(saveFile).toHaveBeenCalledWith(
        expect.stringContaining('.continue'),
        expect.any(String)
      );
    });

    it('should convert Claude to Kiro format', async () => {
      const mockPackage = {
        id: 'claude-skill',
        name: 'test-kiro',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 30,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      const claudeContent = `---
name: kiro-test
description: Test for kiro
---

# Kiro Test`;

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(claudeContent));

      await handleInstall('claude-skill', { as: 'kiro' });

      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        'https://example.com/package.tar.gz'
      );

      const savedContent = (saveFile as jest.Mock).mock.calls[0][1];
      expect(savedContent).toContain('inclusion:'); // Kiro frontmatter
    });

    it('should convert Claude to Copilot format', async () => {
      const mockPackage = {
        id: 'claude-skill',
        name: 'copilot-test',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 20,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      const claudeContent = `---
name: copilot-test
description: Test for copilot
---

# Copilot Test`;

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(claudeContent));

      await handleInstall('claude-skill', { as: 'copilot' });

      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        'https://example.com/package.tar.gz'
      );

      // Copilot uses official GitHub naming: .github/instructions/NAME.instructions.md
      expect(saveFile).toHaveBeenCalledWith(
        expect.stringContaining('.github/instructions/'),
        expect.any(String)
      );
    });
  });

  describe('Install in native format (no conversion)', () => {
    it('should install Claude skill in native format without conversion', async () => {
      const mockPackage = {
        id: 'claude-skill',
        name: 'claude-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Claude Skill\n\nContent'));

      await handleInstall('claude-skill', {});

      // Should download without format parameter (native format)
      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        'https://example.com/package.tar.gz'
      );

      // Should save to claude directory with skill subtype
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/skills/claude-skill/SKILL.md',
        expect.any(String)
      );
    });

    it('should install Cursor rule in native format', async () => {
      const mockPackage = {
        id: 'cursor-rule',
        name: 'cursor-rule',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 50,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Cursor Rule\n\nContent'));

      await handleInstall('cursor-rule', {});

      // Should download without format parameter
      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        'https://example.com/package.tar.gz'
      );

      expect(saveFile).toHaveBeenCalledWith(
        '.cursor/rules/cursor-rule.mdc',
        expect.any(String)
      );
    });

    it('should install Windsurf agent in native format', async () => {
      const mockPackage = {
        id: 'windsurf-agent',
        name: 'windsurf-agent',
        format: 'windsurf',
        subtype: 'agent',
        tags: [],
        total_downloads: 30,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Windsurf Agent\n\nContent'));

      await handleInstall('windsurf-agent', {});

      expect(saveFile).toHaveBeenCalledWith(
        '.windsurf/rules/windsurf-agent.md',
        expect.any(String)
      );
    });
  });

  describe('Subtype preservation', () => {
    it('should preserve agent subtype when converting formats', async () => {
      const mockPackage = {
        id: 'claude-agent',
        name: 'claude-agent',
        format: 'claude',
        subtype: 'agent',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Agent\n\nContent'));

      await handleInstall('claude-agent', { as: 'cursor' });

      // Should save to cursor agents directory (preserving agent subtype)
      // Note: cursor uses .mdc for all files
      expect(saveFile).toHaveBeenCalledWith(
        '.cursor/agents/claude-agent.mdc',
        expect.any(String)
      );
    });

    it('should preserve slash-command subtype when converting', async () => {
      const mockPackage = {
        id: 'claude-command',
        name: 'claude-command',
        format: 'claude',
        subtype: 'slash-command',
        tags: [],
        total_downloads: 50,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Command\n\nContent'));

      await handleInstall('claude-command', { as: 'cursor' });

      // Should save to cursor commands directory
      // Note: cursor uses .mdc for all files
      expect(saveFile).toHaveBeenCalledWith(
        '.cursor/commands/claude-command.mdc',
        expect.any(String)
      );
    });
  });
});
