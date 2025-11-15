/**
 * Tests for install command - file location verification
 * Tests that packages are installed to the correct directories based on type and format
 */

import { handleInstall } from '../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile, getDestinationDir } from '../core/filesystem';
import { readLockfile, writeLockfile, addToLockfile, createLockfile, setPackageIntegrity } from '../core/lockfile';
import { gzipSync } from 'zlib';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promptYesNo } from '../core/prompts';

jest.mock('../core/prompts', () => ({
  promptYesNo: jest.fn(),
}));

const promptYesNoMock = promptYesNo as jest.MockedFunction<typeof promptYesNo>;

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

// Don't mock filesystem - we want to test actual file operations
jest.mock('../core/filesystem', () => {
  const actual = jest.requireActual('../core/filesystem');
  return {
    ...actual,
    saveFile: jest.fn(actual.saveFile),
    ensureDirectoryExists: jest.fn(actual.ensureDirectoryExists),
  };
});

describe('install command - file locations', () => {
  const testDir = path.join(__dirname, '../../.test-install');
  const mockClient = {
    getPackage: jest.fn(),
    getPackageVersion: jest.fn(),
    downloadPackage: jest.fn(),
    trackDownload: jest.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
    // Don't set defaultFormat so tests can verify native format installation
  };

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterAll(async () => {
    // Clean up test directory
    process.chdir(path.join(__dirname, '../../../'));
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Clean up any existing directories
    const dirs = ['.claude', '.cursor', '.continue', '.windsurf', '.prompts', '.agents', 'AGENTS.md', 'custom'];
    for (const dir of dirs) {
      await fs.rm(path.join(testDir, dir), { recursive: true, force: true }).catch(() => {});
    }

    promptYesNoMock.mockReset();

    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue(mockConfig);
    (readLockfile as jest.Mock).mockResolvedValue(null);
    (writeLockfile as jest.Mock).mockResolvedValue(undefined);
    (addToLockfile as jest.Mock).mockImplementation(() => {});
    (createLockfile as jest.Mock).mockReturnValue({ packages: {} });
    (setPackageIntegrity as jest.Mock).mockImplementation(() => {});
    mockClient.trackDownload.mockResolvedValue(undefined);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock process.exit to prevent test from exiting
    jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit called with ${code}`);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Claude package types', () => {
    it('should install claude-skill to .claude/skills', async () => {
      const mockPackage = {
        id: 'test-skill',
        name: 'test-skill',
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
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Skill\n\nThis is a test skill.'));

      await handleInstall('test-skill', {});

      // Verify file was saved to correct location (relative path)
      const expectedPath = '.claude/skills/test-skill/SKILL.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      // Verify directory exists
      const destDir = getDestinationDir('claude', 'skill', 'test-skill');
      expect(destDir).toBe('.claude/skills/test-skill');
    });

    it('should install claude-agent to .claude/agents', async () => {
      const mockPackage = {
        id: 'test-agent',
        name: 'test-agent',
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
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Agent\n\nThis is a test agent.'));

      await handleInstall('test-agent', {});

      const expectedPath = '.claude/agents/test-agent.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('claude', 'agent');
      expect(destDir).toBe('.claude/agents');
    });

    it('should install claude-slash-command to .claude/commands', async () => {
      const mockPackage = {
        id: 'test-command',
        name: 'test-command',
        format: 'claude',
        subtype: 'slash-command',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Command\n\nThis is a test command.'));

      await handleInstall('test-command', {});

      const expectedPath = '.claude/commands/test-command.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('claude', 'slash-command');
      expect(destDir).toBe('.claude/commands');
    });
  });

  describe('Format conversions with --as', () => {
    it('should install cursor package with --as claude to .claude/agents', async () => {
      const mockPackage = {
        id: 'test-cursor-rule',
        name: 'test-cursor-rule',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Rule\n\nThis is a test rule.'));

      await handleInstall('test-cursor-rule', { as: 'claude' });

      // Generic cursor type maps to claude-agent when using --as claude
      const expectedPath = '.claude/agents/test-cursor-rule.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it('should install any package with --as cursor to .cursor/rules with .mdc extension', async () => {
      const mockPackage = {
        id: 'test-skill',
        name: 'test-skill',
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
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Skill\n\nThis is a test skill.'));

      await handleInstall('test-skill', { as: 'cursor' });

      // Should go to .cursor/rules with .mdc extension when using --as cursor
      const expectedPath = '.cursor/rules/test-skill.mdc';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it('should install cursor package to .cursor/rules by default', async () => {
      const mockPackage = {
        id: 'test-cursor',
        name: 'test-cursor',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await handleInstall('test-cursor', {});

      const expectedPath = '.cursor/rules/test-cursor.mdc';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('cursor', 'rule');
      expect(destDir).toBe('.cursor/rules');
    });

    it('should install cursor package to nested .cursor directory when --location is provided', async () => {
      const mockPackage = {
        id: 'nested-cursor',
        name: 'nested-cursor',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Nested Cursor Rule'));

      await handleInstall('nested-cursor', { as: 'cursor', location: 'backend/server' });

      const nestedPath = path.join('backend/server', '.cursor/rules/nested-cursor.mdc');
      expect(saveFile).toHaveBeenCalledWith(nestedPath, expect.any(String));
    });

    it('should install continue package to .continue/rules', async () => {
      const mockPackage = {
        id: 'test-continue',
        name: 'test-continue',
        format: 'continue',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Continue Rule\n\nThis is a test rule.'));

      await handleInstall('test-continue', {});

      const expectedPath = '.continue/rules/test-continue.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('continue', 'rule');
      expect(destDir).toBe('.continue/rules');
    });

    it('should install windsurf package to .windsurf/rules', async () => {
      const mockPackage = {
        id: 'test-windsurf',
        name: 'test-windsurf',
        format: 'windsurf',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Windsurf Rule\n\nThis is a test rule.'));

      await handleInstall('test-windsurf', {});

      const expectedPath = '.windsurf/rules/test-windsurf.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('windsurf', 'rule');
      expect(destDir).toBe('.windsurf/rules');
    });

    it('should install agents.md package to project root AGENTS.md', async () => {
      const mockPackage = {
        id: 'test-agents',
        name: 'test-agents',
        format: 'agents.md',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Agents.md Rule\n\nThis is a test rule.'));

      await handleInstall('test-agents', {});

      const expectedPath = 'AGENTS.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('agents.md', 'rule');
      expect(destDir).toBe('.');
    });

    it('should install package with --as agents.md to project root AGENTS.md', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await handleInstall('test-cursor-to-agents', { as: 'agents.md' });

      const expectedPath = 'AGENTS.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it('should install agents.md package to custom location when --location is provided', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await handleInstall('test-cursor-to-agents', { as: 'agents.md', location: 'custom/dir' });

      const expectedPath = path.join('custom/dir', 'AGENTS.override.md');
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it('should prompt before overwriting existing AGENTS.md', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await fs.writeFile(path.join(testDir, 'AGENTS.md'), '# Existing file');
      promptYesNoMock.mockResolvedValueOnce(false);

      await handleInstall('test-cursor-to-agents', { as: 'agents.md' });

      expect(promptYesNoMock).toHaveBeenCalled();
      expect(saveFile).not.toHaveBeenCalled();
    });

    it('should overwrite AGENTS.md when user confirms prompt', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await fs.writeFile(path.join(testDir, 'AGENTS.md'), '# Existing file');
      promptYesNoMock.mockResolvedValueOnce(true);

      await handleInstall('test-cursor-to-agents', { as: 'agents.md' });

      expect(promptYesNoMock).toHaveBeenCalled();
      expect(saveFile).toHaveBeenCalledWith('AGENTS.md', expect.any(String));
    });

    it('should prompt before overwriting custom location AGENTS.override.md', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await fs.mkdir(path.join(testDir, 'custom/dir'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'custom/dir/AGENTS.override.md'), '# Existing file');
      promptYesNoMock.mockResolvedValueOnce(false);

      await handleInstall('test-cursor-to-agents', { as: 'agents.md', location: 'custom/dir' });

      expect(promptYesNoMock).toHaveBeenCalled();
      expect(saveFile).not.toHaveBeenCalled();
    });

    it('should skip prompt when force option is provided', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await fs.writeFile(path.join(testDir, 'AGENTS.md'), '# Existing file');

      await handleInstall('test-cursor-to-agents', { as: 'agents.md', force: true });

      expect(promptYesNoMock).not.toHaveBeenCalled();
      expect(saveFile).toHaveBeenCalledWith('AGENTS.md', expect.any(String));
    });
  });

  describe('Lockfile metadata', () => {
    it('should record both installed and source formats in lockfile', async () => {
      const mockPackage = {
        id: 'test-skill',
        name: 'test-skill',
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
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Skill'));

      await handleInstall('test-skill', { as: 'cursor' });

      // Format/subtype should reflect installed version, source fields preserve original metadata
      expect(addToLockfile).toHaveBeenCalledWith(
        expect.any(Object),
        'test-skill',
        expect.objectContaining({
          format: 'cursor',
          subtype: 'skill',
          sourceFormat: 'claude',
          sourceSubtype: 'skill',
        })
      );
    });
  });
});
