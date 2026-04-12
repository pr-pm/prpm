import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, type MockedFunction, type MockInstance } from 'vitest'; type Mock = ReturnType<typeof vi.fn>;
/**
 * Tests for install command
 */

import { handleInstall, createInstallCommand } from '../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile } from '../core/filesystem';
import { readLockfile, writeLockfile, addPackage, addToLockfile, createLockfile, getLockedVersion } from '../core/lockfile';
import { gzipSync } from 'zlib';
import { CLIError } from '../core/errors';

// Mock dependencies
vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');
vi.mock('../core/filesystem', () => ({
  getDestinationDir: vi.fn(() => '.cursor/rules'),
  ensureDirectoryExists: vi.fn(),
  saveFile: vi.fn(),
  deleteFile: vi.fn(),
  fileExists: vi.fn(() => Promise.resolve(false)),
  generateId: vi.fn((name) => name),
  stripAuthorNamespace: vi.fn((name) => name.split('/').pop() || name),
  autoDetectFormat: vi.fn(() => Promise.resolve('cursor')),
  getManifestFilename: vi.fn(() => 'AGENTS.md'),
}));
vi.mock('../core/lockfile', () => ({
  readLockfile: vi.fn(),
  writeLockfile: vi.fn(),
  createLockfile: vi.fn(() => ({ packages: {} })),
  addToLockfile: vi.fn(),
  setPackageIntegrity: vi.fn(),
  verifyPackageIntegrity: vi.fn(() => true), // Default to passing verification
  getLockedVersion: vi.fn(() => null),
  getLockfileKey: vi.fn((packageId: string, format?: string) => format ? `${packageId}#${format}` : packageId),
  parseLockfileKey: vi.fn((key: string) => {
    const parts = key.split('#');
    return { packageId: parts[0], format: parts[1] };
  }),
  addPackage: vi.fn(),
  removePackage: vi.fn(),
  getPackage: vi.fn(),
  listPackages: vi.fn(() => Promise.resolve([])),
}));
vi.mock('../core/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    shutdown: vi.fn(),
  },
}));

describe('install command', () => {
  const mockClient = {
    getPackage: vi.fn(),
    getPackageVersion: vi.fn(),
    downloadPackage: vi.fn(),
    trackDownload: vi.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
    defaultFormat: 'cursor',
  };

  beforeEach(() => {
    (getRegistryClient as Mock).mockReturnValue(mockClient);
    (getConfig as Mock).mockResolvedValue(mockConfig);
    (readLockfile as Mock).mockResolvedValue(null);
    (writeLockfile as Mock).mockResolvedValue(undefined);
    (saveFile as Mock).mockResolvedValue(undefined);
    (addPackage as Mock).mockResolvedValue(undefined);
    (addToLockfile as Mock).mockImplementation(() => {});
    (createLockfile as Mock).mockReturnValue({ packages: {} });
    mockClient.trackDownload.mockResolvedValue(undefined);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('basic installation', () => {
    it('should install package successfully', async () => {
      const mockPackage = {
        id: 'test-package',
        name: 'test-package',
        description: 'A test package',
        format: 'cursor',
        subtype: 'rule',
        tags: ['test'],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('test-content'));

      await handleInstall('test-package', {});

      expect(mockClient.getPackage).toHaveBeenCalledWith('test-package');
      expect(mockClient.downloadPackage).toHaveBeenCalled();
      expect(saveFile).toHaveBeenCalled();
      expect(addToLockfile).toHaveBeenCalled();
    });

    it('should install specific version', async () => {
      const mockPackage = {
        id: 'test-package',
        name: 'test-package',
        type: 'cursor',
        tags: [],
        total_downloads: 100,
        verified: true,
      };

      const mockVersion = {
        version: '1.5.0',
        tarball_url: 'https://example.com/package-1.5.0.tar.gz',
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.getPackageVersion.mockResolvedValue(mockVersion);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('test-content'));

      await handleInstall('test-package@1.5.0', {});

      expect(mockClient.getPackageVersion).toHaveBeenCalledWith('test-package', '1.5.0');
    });

    it('should use specified format', async () => {
      const mockPackage = {
        id: 'test-package',
        name: 'test-package',
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
      mockClient.downloadPackage.mockResolvedValue(gzipSync('test-content'));

      await handleInstall('test-package', { as: 'claude' });

      // Should download native format (conversion happens client-side)
      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        expect.any(String)
      );
    });
  });

  describe('error handling', () => {
    it('should handle package not found', async () => {
      mockClient.getPackage.mockRejectedValue(new Error('Package not found'));

      await expect(handleInstall('nonexistent', {})).rejects.toThrow(CLIError);
    });

    it('should handle network errors', async () => {
      mockClient.getPackage.mockRejectedValue(new Error('Network error'));

      await expect(handleInstall('test-package', {})).rejects.toThrow(CLIError);
    });

    it('should handle download failures', async () => {
      const mockPackage = {
        id: 'test-package',
        name: 'test-package',
        type: 'cursor',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockRejectedValue(new Error('Download failed'));

      await expect(handleInstall('test-package', {})).rejects.toThrow(CLIError);
    });
  });

  describe('lockfile handling', () => {
    it('should create lockfile entry', async () => {
      const mockPackage = {
        id: 'test-package',
        name: 'test-package',
        type: 'cursor',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('test-content'));

      await handleInstall('test-package', {});

      expect(writeLockfile).toHaveBeenCalled();
    });

    it('should respect frozen lockfile', async () => {
      const mockLockfile = {
        packages: {
          'test-package': {
            version: '1.0.0',
            tarball_url: 'https://example.com/package.tar.gz',
            type: 'cursor',
            format: 'cursor',
          },
        },
      };

      (readLockfile as Mock).mockResolvedValue(mockLockfile);
      (getLockedVersion as Mock).mockReturnValue('1.0.0');

      const mockPackage = {
        id: 'test-package',
        name: 'test-package',
        type: 'cursor',
        format: 'cursor',
        tags: [],
        total_downloads: 100,
        verified: true,
      };

      const mockVersion = {
        version: '1.0.0',
        tarball_url: 'https://example.com/package.tar.gz',
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.getPackageVersion.mockResolvedValue(mockVersion);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('test-content'));

      await handleInstall('test-package', { frozenLockfile: true, force: true });

      expect(mockClient.getPackageVersion).toHaveBeenCalledWith('test-package', '1.0.0');
    });

    it('should fail on frozen lockfile without entry', async () => {
      (readLockfile as Mock).mockResolvedValue({ packages: {} });

      await expect(
        handleInstall('test-package', { frozenLockfile: true })
      ).rejects.toThrow(CLIError);
    });
  });

  describe('type overrides', () => {
    it('should use format parameter for format conversion', async () => {
      const mockPackage = {
        id: 'test-package',
        name: 'test-package',
        type: 'cursor',
        format: 'cursor',  // Package's native format
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('test-content'));

      await handleInstall('test-package', { as: 'claude' });

      // Should download native format (conversion happens client-side)
      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        expect.any(String)
      );

      // Verify lockfile stores the installed format plus original metadata
      expect(addToLockfile).toHaveBeenCalledWith(
        expect.any(Object),
        'test-package',
        expect.objectContaining({
          format: 'claude',
          sourceFormat: 'cursor',
          version: '1.0.0',
        })
      );
    });
  });

  describe('multi-format --as dispatch', () => {
    const mockPackage = {
      id: 'test-package',
      name: 'test-package',
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

    beforeEach(() => {
      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('test-content'));
    });

    it('installs the package once per unique format token', async () => {
      const cmd = createInstallCommand();
      cmd.exitOverride();

      await cmd.parseAsync(
        ['test-package', '--as', 'claude,codex'],
        { from: 'user' },
      );

      // One download per target format (no shared cache today — if that changes,
      // update this assertion to match the new behavior).
      expect(mockClient.downloadPackage).toHaveBeenCalledTimes(2);

      // Lockfile should record an entry for each format.
      const recordedFormats = (addToLockfile as Mock).mock.calls
        .map(call => call[2]?.format)
        .filter(Boolean);
      expect(recordedFormats).toEqual(expect.arrayContaining(['claude', 'codex']));
    });

    it('deduplicates repeated format tokens', async () => {
      const cmd = createInstallCommand();
      cmd.exitOverride();

      await cmd.parseAsync(
        ['test-package', '--as', 'claude,claude,codex'],
        { from: 'user' },
      );

      // 'claude' appears twice in the flag but should only install once.
      expect(mockClient.downloadPackage).toHaveBeenCalledTimes(2);
    });

    it('continues installing remaining formats after one fails, then throws with summary', async () => {
      const cmd = createInstallCommand();
      cmd.exitOverride();

      // First call (claude) succeeds, second call (codex) fails.
      mockClient.downloadPackage
        .mockResolvedValueOnce(gzipSync('test-content'))
        .mockRejectedValueOnce(new Error('boom'));

      const run = cmd.parseAsync(
        ['test-package', '--as', 'claude,codex'],
        { from: 'user' },
      );

      await expect(run).rejects.toThrow(CLIError);
      await expect(run).rejects.toThrow(/1 target failed/);

      // Both targets were attempted.
      expect(mockClient.downloadPackage).toHaveBeenCalledTimes(2);
    });

    it('preserves single-format behavior when only one token is passed', async () => {
      const cmd = createInstallCommand();
      cmd.exitOverride();

      await cmd.parseAsync(
        ['test-package', '--as', 'claude'],
        { from: 'user' },
      );

      expect(mockClient.downloadPackage).toHaveBeenCalledTimes(1);
      expect(addToLockfile).toHaveBeenCalledWith(
        expect.any(Object),
        'test-package',
        expect.objectContaining({ format: 'claude' }),
      );
    });
  });
});
