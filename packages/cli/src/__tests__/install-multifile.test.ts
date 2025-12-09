import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, type MockedFunction, type MockInstance } from 'vitest'; type Mock = ReturnType<typeof vi.fn>;
/**
 * Tests for multi-file package installation
 */

import { handleInstall } from '../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile } from '../core/filesystem';
import { readLockfile, writeLockfile, addToLockfile, createLockfile, setPackageIntegrity } from '../core/lockfile';
import { gzipSync, gunzipSync } from 'zlib';
import * as tar from 'tar';
import { Readable } from 'stream';
import * as path from 'path';
import { CLIError } from '../core/errors';

// Mock dependencies
vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');
vi.mock('../core/lockfile', () => ({
  readLockfile: vi.fn(),
  writeLockfile: vi.fn(),
  createLockfile: vi.fn(() => ({ packages: {} })),
  addToLockfile: vi.fn(),
  setPackageIntegrity: vi.fn(),
  verifyPackageIntegrity: vi.fn(() => true),
  getLockedVersion: vi.fn(() => null),
  getLockfileKey: vi.fn((packageId: string, format?: string) => format ? `${packageId}#${format}` : packageId),
  parseLockfileKey: vi.fn((key: string) => {
    const parts = key.split('#');
    return { packageId: parts[0], format: parts[1] };
  }),
}));
vi.mock('../core/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    shutdown: vi.fn(),
  },
}));

vi.mock('../core/filesystem', async () => {
  const actual = await vi.importActual('../core/filesystem');
  return {
    ...actual,
    saveFile: vi.fn(actual.saveFile),
    ensureDirectoryExists: vi.fn(actual.ensureDirectoryExists),
    // Mock autoDetectFormat to return null so tests use the package's native format
    // This prevents the test environment's AGENTS.md from interfering with format detection
    autoDetectFormat: vi.fn(() => Promise.resolve(null)),
  };
});

/**
 * Helper to create a tar.gz archive from multiple files
 */
async function createTarGz(files: Record<string, string>, options?: { format?: string, subtype?: string, packageName?: string }): Promise<Buffer> {
  const fs = await import('fs');
  const os = await import('os');
  const path = await import('path');

  // Create temp directory
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));

  try {
    // Determine the tarball prefix based on format/subtype (realistic structure)
    let prefix = '';
    if (options?.format === 'claude' && options?.subtype === 'skill' && options?.packageName) {
      prefix = `.claude/skills/${options.packageName}/`;
    } else if (options?.format === 'claude' && options?.subtype === 'agent' && options?.packageName) {
      prefix = `.claude/agents/${options.packageName}/`;
    } else if (options?.format === 'claude' && options?.subtype === 'slash-command' && options?.packageName) {
      prefix = `.claude/commands/${options.packageName}/`;
    }

    // Write all files to temp directory with prefix
    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(tmpDir, prefix + filename);
      const fileDir = path.dirname(filePath);
      await fs.promises.mkdir(fileDir, { recursive: true });
      await fs.promises.writeFile(filePath, content);
    }

    // Create tar.gz using tar.create
    const chunks: Buffer[] = [];
    const stream = tar.create(
      {
        gzip: true,
        cwd: tmpDir,
      },
      [prefix ? prefix.split('/')[0] : '.'] // Start from the root directory
    );

    // Collect chunks
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    // Cleanup
    await fs.promises.rm(tmpDir, { recursive: true, force: true });

    return Buffer.concat(chunks);
  } catch (error) {
    // Cleanup on error
    await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

describe('install command - multi-file packages', () => {
  const mockClient = {
    getPackage: vi.fn(),
    getPackageVersion: vi.fn(),
    downloadPackage: vi.fn(),
    trackDownload: vi.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  beforeEach(() => {
    (getRegistryClient as Mock).mockReturnValue(mockClient);
    (getConfig as Mock).mockResolvedValue(mockConfig);
    (readLockfile as Mock).mockResolvedValue(null);
    (writeLockfile as Mock).mockResolvedValue(undefined);
    (addToLockfile as Mock).mockImplementation(() => {});
    (createLockfile as Mock).mockReturnValue({ packages: {} });
    (setPackageIntegrity as Mock).mockImplementation(() => {});
    (saveFile as Mock).mockResolvedValue(undefined);
    mockClient.trackDownload.mockResolvedValue(undefined);

    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Single file packages', () => {
    it('should install single-file package as before', async () => {
      const mockPackage = {
        id: 'test-skill',
        name: 'test-skill',
        format: 'claude', subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Skill\n\nSingle file content'));

      await handleInstall('test-skill', {});

      // Should save as SKILL.md in package directory
      expect(saveFile).toHaveBeenCalledTimes(1);
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/skills/test-skill/SKILL.md',
        expect.stringContaining('Single file content')
      );
    });
  });

  describe('Multi-file packages', () => {
    it('should extract and save multi-file Claude skill to directory', async () => {
      const mockPackage = {
        id: 'complex-skill',
        name: 'complex-skill',
        format: 'claude', subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      const tarGz = await createTarGz({
        'SKILL.md': '# Main Skill File',
        'helpers/utils.md': '# Utility Functions',
        'examples/demo.md': '# Demo Examples',
      }, { format: 'claude', subtype: 'skill', packageName: 'complex-skill' });

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(tarGz);

      await handleInstall('complex-skill', {});

      // Should save to directory with multiple files, preserving subdirectories
      expect(saveFile).toHaveBeenCalledTimes(3);
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/skills/complex-skill/SKILL.md',
        '# Main Skill File'
      );
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/skills/complex-skill/helpers/utils.md',
        '# Utility Functions'
      );
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/skills/complex-skill/examples/demo.md',
        '# Demo Examples'
      );
    });

    it('should reject tampered tarballs with corrupted headers (security)', async () => {
      // Security: tampered archives should be rejected with strict mode enabled
      const mockPackage = {
        id: 'complex-skill',
        name: 'complex-skill',
        format: 'claude', subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      const tarGz = await createTarGz({
        'SKILL.md': '# Main Skill File',
        'helpers/utils.md': '# Utility Functions',
        'examples/demo.md': '# Demo Examples',
      }, { format: 'claude', subtype: 'skill', packageName: 'complex-skill' });

      const tamperedTar = (() => {
        const decompressed = gunzipSync(tarGz);
        // Wipe out the POSIX magic header - this corrupts the archive
        decompressed.fill(0, 257, 263);
        return gzipSync(decompressed);
      })();

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(tamperedTar);

      // Should reject the tampered archive for security
      await expect(handleInstall('complex-skill', {})).rejects.toThrow(CLIError);
    });

    it('should auto-fix skill.md to SKILL.md for Claude skills', async () => {
      const mockPackage = {
        id: 'legacy-skill',
        name: 'legacy-skill',
        format: 'claude', subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      // Package has lowercase skill.md instead of SKILL.md
      const tarGz = await createTarGz({
        'skill.md': '# Main Skill File',
        'helpers/utils.md': '# Utility Functions',
      }, { format: 'claude', subtype: 'skill', packageName: 'legacy-skill' });

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(tarGz);

      // Mock console.log to capture the warning
      const consoleLogSpy = vi.spyOn(console, 'log');

      await handleInstall('legacy-skill', {});

      // Should auto-rename skill.md to SKILL.md and preserve subdirectories
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/skills/legacy-skill/SKILL.md',
        '# Main Skill File'
      );
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/skills/legacy-skill/helpers/utils.md',
        '# Utility Functions'
      );

      // Should log a warning about the auto-fix (with full path from tarball)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auto-fixing skill filename: .claude/skills/legacy-skill/skill.md → .claude/skills/legacy-skill/SKILL.md')
      );

      consoleLogSpy.mockRestore();
    });

    it('should extract multi-file agent to .claude/agents directory', async () => {
      const mockPackage = {
        id: 'complex-agent',
        name: 'complex-agent',
        format: 'claude', subtype: 'agent',
        tags: [],
        total_downloads: 50,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/agent.tar.gz',
        },
      };

      const tarGz = await createTarGz({
        'agent.md': '# Agent Definition',
        'prompts/system.md': '# System Prompt',
        'prompts/user.md': '# User Prompt',
      }, { format: 'claude', subtype: 'agent', packageName: 'complex-agent' });

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(tarGz);

      await handleInstall('complex-agent', {});

      expect(saveFile).toHaveBeenCalledTimes(3);
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/agents/complex-agent/agent.md',
        '# Agent Definition'
      );
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/agents/complex-agent/system.md',
        '# System Prompt'
      );
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/agents/complex-agent/user.md',
        '# User Prompt'
      );
    });

    it('should extract multi-file slash command to .claude/commands directory', async () => {
      const mockPackage = {
        id: 'complex-command',
        name: 'complex-command',
        format: 'claude', subtype: 'slash-command',
        tags: [],
        total_downloads: 75,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/command.tar.gz',
        },
      };

      const tarGz = await createTarGz({
        'command.md': '# Command Definition',
        'config.json': '{"name": "test"}',
      });

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(tarGz);

      await handleInstall('complex-command', {});

      expect(saveFile).toHaveBeenCalledTimes(2);
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/commands/complex-command/command.md',
        '# Command Definition'
      );
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/commands/complex-command/config.json',
        '{"name": "test"}'
      );
    });

    it('should convert multi-file package by using main file (progressive disclosure for skills)', async () => {
      const mockPackage = {
        id: 'complex-skill',
        name: 'complex-skill',
        format: 'claude', subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      // Create tarball with SKILL.md as the main file
      const tarGz = await createTarGz({
        'SKILL.md': '# Main Skill\n\nThis is the main content.',
        'helper.md': '# Helper',
      }, { format: 'claude', subtype: 'skill', packageName: 'complex-skill' });

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(tarGz);

      // Should succeed and convert only the main file (SKILL.md)
      await handleInstall('complex-skill', { as: 'cursor' });

      // Cursor doesn't have native skill support - uses progressive disclosure
      // Should save to .openskills/ with AGENTS.md reference
      expect(saveFile).toHaveBeenCalledTimes(1);
      expect(saveFile).toHaveBeenCalledWith(
        '.openskills/complex-skill/SKILL.md',
        expect.stringContaining('Main Skill')
      );
    });

    it('should fail conversion if no main file found', async () => {
      const mockPackage = {
        id: 'no-main-skill',
        name: 'no-main-skill',
        format: 'claude', subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      // Create tarball without any recognizable main file
      const tarGz = await createTarGz({
        'data.json': '{"key": "value"}',
        'config.yaml': 'setting: true',
      });

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(tarGz);

      // Should fail because no main file can be identified
      await expect(handleInstall('no-main-skill', { as: 'cursor' })).rejects.toThrow(
        'Could not identify main file'
      );
    });
  });

  describe('Backward compatibility', () => {
    it('should handle legacy single gzipped file (no tar)', async () => {
      const mockPackage = {
        id: 'legacy-skill',
        name: 'legacy-skill',
        format: 'claude', subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/legacy.gz',
        },
      };

      // Just gzipped content, not tarred
      const gzipped = gzipSync('# Legacy Skill\n\nOld format');

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipped);

      await handleInstall('legacy-skill', {});

      // Should work as single file, now in directory with SKILL.md
      expect(saveFile).toHaveBeenCalledTimes(1);
      expect(saveFile).toHaveBeenCalledWith(
        '.claude/skills/legacy-skill/SKILL.md',
        expect.stringContaining('Legacy Skill')
      );
    });
  });
});
