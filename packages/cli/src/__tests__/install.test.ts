/**
 * Tests for install command
 */

import { handleInstall } from '../commands/install';
import { getRegistryClient } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile } from '../core/filesystem';
import { addPackage } from '../core/config';
import { readLockfile, writeLockfile } from '../core/lockfile';
import { gzipSync } from 'zlib';

// Mock dependencies
jest.mock('@prpm/registry-client');
jest.mock('../core/user-config');
jest.mock('../core/filesystem', () => ({
  getDestinationDir: jest.fn(() => '.cursor/rules'),
  ensureDirectoryExists: jest.fn(),
  saveFile: jest.fn(),
  deleteFile: jest.fn(),
  fileExists: jest.fn(() => Promise.resolve(false)),
  generateId: jest.fn((name) => name),
}));
jest.mock('../core/config', () => ({
  readConfig: jest.fn(),
  writeConfig: jest.fn(),
  addPackage: jest.fn(),
  removePackage: jest.fn(),
  getPackage: jest.fn(),
  listPackages: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../core/lockfile', () => ({
  readLockfile: jest.fn(),
  writeLockfile: jest.fn(),
  createLockfile: jest.fn(() => ({ packages: {} })),
  addToLockfile: jest.fn(),
  setPackageIntegrity: jest.fn(),
  getLockedVersion: jest.fn(() => null),
}));
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
  },
}));

describe('install command', () => {
  const mockClient = {
    getPackage: jest.fn(),
    getPackageVersion: jest.fn(),
    downloadPackage: jest.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
    defaultFormat: 'cursor',
  };

  beforeEach(() => {
    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue(mockConfig);
    (readLockfile as jest.Mock).mockResolvedValue(null);
    (writeLockfile as jest.Mock).mockResolvedValue(undefined);
    (saveFile as jest.Mock).mockResolvedValue(undefined);
    (addPackage as jest.Mock).mockResolvedValue(undefined);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock process.exit to prevent actual exit during tests
    jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`Process exited with code ${code}`);
    }) as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('basic installation', () => {
    it('should install package successfully', async () => {
      const mockPackage = {
        id: 'test-package',
        display_name: 'Test Package',
        description: 'A test package',
        type: 'cursor',
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
      expect(addPackage).toHaveBeenCalled();
    });

    it('should install specific version', async () => {
      const mockPackage = {
        id: 'test-package',
        display_name: 'Test Package',
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
        display_name: 'Test Package',
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

      await handleInstall('test-package', { as: 'claude' });

      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        expect.any(String),
        { format: 'claude' }
      );
    });
  });

  describe('error handling', () => {
    it('should handle package not found', async () => {
      mockClient.getPackage.mockRejectedValue(new Error('Package not found'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleInstall('nonexistent', {})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should handle network errors', async () => {
      mockClient.getPackage.mockRejectedValue(new Error('Network error'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleInstall('test-package', {})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should handle download failures', async () => {
      const mockPackage = {
        id: 'test-package',
        display_name: 'Test Package',
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

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleInstall('test-package', {})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });
  });

  describe('lockfile handling', () => {
    it('should create lockfile entry', async () => {
      const mockPackage = {
        id: 'test-package',
        display_name: 'Test Package',
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

      const { getLockedVersion } = require('../core/lockfile');
      (readLockfile as jest.Mock).mockResolvedValue(mockLockfile);
      (getLockedVersion as jest.Mock).mockReturnValue('1.0.0');

      const mockPackage = {
        id: 'test-package',
        display_name: 'Test Package',
        type: 'cursor',
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

      await handleInstall('test-package', { frozenLockfile: true });

      expect(mockClient.getPackageVersion).toHaveBeenCalledWith('test-package', '1.0.0');
    });

    it('should fail on frozen lockfile without entry', async () => {
      (readLockfile as jest.Mock).mockResolvedValue({ packages: {} });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(
        handleInstall('test-package', { frozenLockfile: true })
      ).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });
  });

  describe('type overrides', () => {
    it('should allow type override', async () => {
      const mockPackage = {
        id: 'test-package',
        display_name: 'Test Package',
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

      await handleInstall('test-package', { type: 'claude' });

      expect(addPackage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'claude',
        })
      );
    });
  });
});
