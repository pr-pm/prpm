/**
 * Tests for installing from lockfile (prpm install with no args)
 */

import { installFromLockfile } from '../commands/install';
import { readLockfile, writeLockfile, addToLockfile } from '../core/lockfile';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile, getManifestFilename } from '../core/filesystem';
import { gzipSync } from 'zlib';
import type { Lockfile } from '../core/lockfile';
import { CLIError } from '../core/errors';

// Mock dependencies
jest.mock('@pr-pm/registry-client', () => ({
  getRegistryClient: jest.fn(),
}));
jest.mock('../core/user-config', () => ({
  getConfig: jest.fn(),
}));
jest.mock('../core/lockfile', () => ({
  readLockfile: jest.fn(),
  writeLockfile: jest.fn(),
  addToLockfile: jest.fn(),
  createLockfile: jest.fn(() => ({ packages: {} })),
  setPackageIntegrity: jest.fn(),
  getLockedVersion: jest.fn(() => null),
}));
jest.mock('../core/filesystem', () => ({
  getDestinationDir: jest.fn((format: string, subtype: string) => {
    // Return appropriate directory based on format
    if (format === 'agents.md' || format === 'gemini.md' || format === 'claude.md') {
      if (subtype === 'skill') return '.openskills/test-skill';
      if (subtype === 'agent') return '.openagents/test-agent';
      return '.'; // For non-skill/agent subtypes, return project root
    }
    return '.cursor/rules'; // Default for other formats
  }),
  ensureDirectoryExists: jest.fn(),
  saveFile: jest.fn(),
  deleteFile: jest.fn(),
  fileExists: jest.fn(() => Promise.resolve(false)),
  generateId: jest.fn((name) => name),
  stripAuthorNamespace: jest.fn((packageId: string) => {
    // Strip @author/ prefix from package names
    return packageId.replace(/^@[^/]+\//, '');
  }),
  autoDetectFormat: jest.fn(() => Promise.resolve(null)),
  getManifestFilename: jest.fn((format: string) => {
    // Map format to manifest filename
    if (format === 'gemini.md') return 'GEMINI.md';
    if (format === 'claude.md') return 'CLAUDE.md';
    return 'AGENTS.md';
  }),
}));
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

const mockReadLockfile = readLockfile as jest.MockedFunction<typeof readLockfile>;
const mockWriteLockfile = writeLockfile as jest.MockedFunction<typeof writeLockfile>;
const mockAddToLockfile = addToLockfile as jest.MockedFunction<typeof addToLockfile>;
const mockGetRegistryClient = getRegistryClient as jest.MockedFunction<typeof getRegistryClient>;
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockSaveFile = saveFile as jest.MockedFunction<typeof saveFile>;
const mockGetManifestFilename = getManifestFilename as jest.MockedFunction<typeof getManifestFilename>;

describe('install from lockfile', () => {
  const mockClient = {
    getPackage: jest.fn(),
    getPackageVersion: jest.fn(),
    downloadPackage: jest.fn(),
    trackDownload: jest.fn(),
    getCollection: jest.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://registry.prpm.dev',
    token: 'test-token',
    defaultFormat: 'cursor' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRegistryClient.mockReturnValue(mockClient as any);
    mockGetConfig.mockReturnValue(mockConfig);
    mockWriteLockfile.mockResolvedValue(undefined);
    mockAddToLockfile.mockResolvedValue(undefined);
    mockSaveFile.mockResolvedValue(undefined);

    // Ensure getManifestFilename is properly mocked
    mockGetManifestFilename.mockImplementation((format: string) => {
      if (format === 'gemini.md') return 'GEMINI.md';
      if (format === 'claude.md') return 'CLAUDE.md';
      return 'AGENTS.md';
    });

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('no lockfile', () => {
    it('should exit with error when no lockfile exists', async () => {
      // Arrange
      mockReadLockfile.mockResolvedValue(null);

      // Act & Assert
      await expect(installFromLockfile({})).rejects.toThrow('❌ No prpm.lock file found');
    });
  });

  describe('empty lockfile', () => {
    it('should handle empty lockfile gracefully', async () => {
      // Arrange
      const lockfile: Lockfile = {
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {},
        generated: new Date().toISOString()
      };
      mockReadLockfile.mockResolvedValue(lockfile);

      // Act
      await installFromLockfile({});

      // Assert
      expect(console.log).toHaveBeenCalledWith('✅ No packages to install (prpm.lock is empty)');
      expect(mockClient.getPackage).not.toHaveBeenCalled();
    });
  });

  describe('single package installation', () => {
    it('should install package from lockfile', async () => {
      // Arrange
      const lockfile: Lockfile = {
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@test/cursor-rule': {
            version: '1.0.0',
            resolved: 'https://registry.prpm.dev/packages/@test/cursor-rule/1.0.0/download',
            integrity: 'sha256-abc123',
            format: 'cursor',
            subtype: 'rule'
          }
        },
        generated: new Date().toISOString()
      };
      mockReadLockfile.mockResolvedValue(lockfile);

      const mockPackage = {
        id: '@test/cursor-rule',
        name: '@test/cursor-rule',
        author: 'test',
        version: '1.0.0',
        format: 'cursor',
        subtype: 'rule',
        files: ['rule.md'],
        description: 'Test cursor rule',
        total_downloads: 0,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://registry.prpm.dev/packages/@test/cursor-rule/1.0.0/download'
        }
      };
      mockClient.getPackage.mockResolvedValue(mockPackage as any);
      mockClient.getPackageVersion.mockResolvedValue({
        version: '1.0.0',
        tarball_url: 'https://registry.prpm.dev/packages/@test/cursor-rule/1.0.0/download'
      } as any);

      const fileContent = '# Cursor Rule\nTest content';
      const tarballContent = gzipSync(fileContent);
      mockClient.downloadPackage.mockResolvedValue(tarballContent);

      // Act
      await installFromLockfile({});

      // Assert
      expect(mockClient.getPackage).toHaveBeenCalledWith('@test/cursor-rule');
      expect(mockClient.downloadPackage).toHaveBeenCalled();
      expect(mockSaveFile).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Installing 1 package'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Installed 1/1'));
    });

    it('should honor agents.md location stored in lockfile', async () => {
      const lockfile: Lockfile = {
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@test/agents': {
            version: '1.0.0',
            resolved: 'https://registry.prpm.dev/packages/@test/agents/1.0.0/download',
            integrity: 'sha256-abc123',
            format: 'agents.md',
            subtype: 'rule',
            installedPath: 'custom/dir/AGENTS.override.md',
          },
        },
        generated: new Date().toISOString(),
      };
      mockReadLockfile.mockResolvedValue(lockfile);

      const mockPackage = {
        id: '@test/agents',
        name: '@test/agents',
        author: 'test',
        version: '1.0.0',
        format: 'agents.md',
        subtype: 'rule',
        files: ['AGENTS.md'],
        description: 'Test agents file',
        total_downloads: 0,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://registry.prpm.dev/packages/@test/agents/1.0.0/download'
        }
      };
      mockClient.getPackage.mockResolvedValue(mockPackage as any);
      mockClient.getPackageVersion.mockResolvedValue({
        version: '1.0.0',
        tarball_url: 'https://registry.prpm.dev/packages/@test/agents/1.0.0/download'
      } as any);

      const fileContent = '# Agents\nTest content';
      const tarballContent = gzipSync(fileContent);
      mockClient.downloadPackage.mockResolvedValue(tarballContent);

      await installFromLockfile({});

      expect(mockSaveFile).toHaveBeenCalledWith('custom/dir/AGENTS.override.md', expect.any(String));
    });

    it('should preserve format from lockfile', async () => {
      // Arrange
      const lockfile: Lockfile = {
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@test/claude-skill': {
            version: '2.0.0',
            resolved: 'https://registry.prpm.dev/packages/@test/claude-skill/2.0.0/download',
            integrity: 'sha256-def456',
            format: 'claude',
            subtype: 'skill'
          }
        },
        generated: new Date().toISOString()
      };
      mockReadLockfile.mockResolvedValue(lockfile);

      const mockPackage = {
        id: '@test/claude-skill',
        name: '@test/claude-skill',
        author: 'test',
        version: '2.0.0',
        format: 'cursor', // Original format
        subtype: 'rule',
        files: ['SKILL.md'],
        description: 'Test skill',
        total_downloads: 0,
        latest_version: {
          version: '2.0.0',
          tarball_url: 'https://registry.prpm.dev/packages/@test/claude-skill/2.0.0/download'
        }
      };
      mockClient.getPackage.mockResolvedValue(mockPackage as any);
      mockClient.getPackageVersion.mockResolvedValue({
        version: '2.0.0',
        tarball_url: 'https://registry.prpm.dev/packages/@test/claude-skill/2.0.0/download'
      } as any);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Skill'));

      // Act
      await installFromLockfile({});

      // Assert - should request the package and install as claude format (from lockfile)
      expect(mockClient.getPackage).toHaveBeenCalledWith('@test/claude-skill');
      expect(mockClient.downloadPackage).toHaveBeenCalled();
    });
  });

  describe('multiple packages installation', () => {
    it('should install all packages from lockfile', async () => {
      // Arrange
      const lockfile: Lockfile = {
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@test/package1': {
            version: '1.0.0',
            resolved: 'https://registry.prpm.dev/packages/@test/package1/1.0.0/download',
            integrity: 'sha256-abc',
            format: 'cursor',
            subtype: 'rule'
          },
          '@test/package2': {
            version: '2.0.0',
            resolved: 'https://registry.prpm.dev/packages/@test/package2/2.0.0/download',
            integrity: 'sha256-def',
            format: 'claude',
            subtype: 'skill'
          },
          '@test/package3': {
            version: '1.5.0',
            resolved: 'https://registry.prpm.dev/packages/@test/package3/1.5.0/download',
            integrity: 'sha256-ghi',
            format: 'copilot',
            subtype: 'rule'
          }
        },
        generated: new Date().toISOString()
      };
      mockReadLockfile.mockResolvedValue(lockfile);

      // Mock each package
      mockClient.getPackage.mockImplementation(async (packageId: string) => ({
        id: packageId,
        name: packageId,
        author: 'test',
        version: '1.0.0',
        format: 'cursor',
        subtype: 'rule',
        files: ['file.md'],
        description: `Test ${packageId}`,
        total_downloads: 0,
        latest_version: {
          version: '1.0.0',
          tarball_url: `https://registry.prpm.dev/packages/${packageId}/1.0.0/download`
        }
      } as any));
      mockClient.getPackageVersion.mockImplementation(async (packageId: string, version: string) => ({
        version: version,
        tarball_url: `https://registry.prpm.dev/packages/${packageId}/${version}/download`
      } as any));
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test'));

      // Act
      await installFromLockfile({});

      // Assert
      expect(mockClient.getPackage).toHaveBeenCalledTimes(3);
      expect(mockClient.getPackage).toHaveBeenCalledWith('@test/package1');
      expect(mockClient.getPackage).toHaveBeenCalledWith('@test/package2');
      expect(mockClient.getPackage).toHaveBeenCalledWith('@test/package3');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Installing 3 packages'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Installed 3/3'));
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange
      const lockfile: Lockfile = {
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@test/good-package': {
            version: '1.0.0',
            resolved: 'https://registry.prpm.dev/packages/@test/good-package/1.0.0/download',
            integrity: 'sha256-abc',
            format: 'cursor',
            subtype: 'rule'
          },
          '@test/bad-package': {
            version: '1.0.0',
            resolved: 'https://registry.prpm.dev/packages/@test/bad-package/1.0.0/download',
            integrity: 'sha256-def',
            format: 'cursor',
            subtype: 'rule'
          }
        },
        generated: new Date().toISOString()
      };
      mockReadLockfile.mockResolvedValue(lockfile);

      // Mock one success, one failure
      mockClient.getPackage.mockImplementation(async (packageId: string) => {
        if (packageId === '@test/bad-package') {
          throw new Error('Package not found');
        }
        return {
          id: packageId,
          name: packageId,
          author: 'test',
          version: '1.0.0',
          format: 'cursor',
          subtype: 'rule',
          files: ['file.md'],
          description: `Test ${packageId}`,
          total_downloads: 0,
          latest_version: {
            version: '1.0.0',
            tarball_url: `https://registry.prpm.dev/packages/${packageId}/1.0.0/download`
          }
        } as any;
      });
      mockClient.getPackageVersion.mockImplementation(async (packageId: string, version: string) => {
        if (packageId === '@test/bad-package') {
          throw new Error('Package not found');
        }
        return {
          version: version,
          tarball_url: `https://registry.prpm.dev/packages/${packageId}/${version}/download`
        } as any;
      });
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test'));

      // Act & Assert
      await expect(installFromLockfile({})).rejects.toThrow('1 package failed to install');

      // Verify partial success was logged
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Installed 1/2'));
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to install'));
    });
  });

  describe('format override', () => {
    it('should respect --as option to override lockfile format', async () => {
      // Arrange
      const lockfile: Lockfile = {
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@test/package': {
            version: '1.0.0',
            resolved: 'https://registry.prpm.dev/packages/@test/package/1.0.0/download',
            integrity: 'sha256-abc',
            format: 'cursor',
            subtype: 'rule'
          }
        },
        generated: new Date().toISOString()
      };
      mockReadLockfile.mockResolvedValue(lockfile);

      const mockPackage = {
        id: '@test/package',
        name: '@test/package',
        author: 'test',
        version: '1.0.0',
        format: 'cursor',
        subtype: 'rule',
        files: ['file.md'],
        description: 'Test',
        total_downloads: 0,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://registry.prpm.dev/packages/@test/package/1.0.0/download'
        }
      };
      mockClient.getPackage.mockResolvedValue(mockPackage as any);
      mockClient.getPackageVersion.mockResolvedValue({
        version: '1.0.0',
        tarball_url: 'https://registry.prpm.dev/packages/@test/package/1.0.0/download'
      } as any);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test'));

      // Act - override with --as claude
      await installFromLockfile({ as: 'claude' });

      // Assert - should still install but check that package was fetched
      expect(mockClient.getPackage).toHaveBeenCalledWith('@test/package');
      // The actual format conversion happens in handleInstall which we're testing indirectly
    });
  });

  describe('force reinstall', () => {
    it('should force reinstall packages from lockfile', async () => {
      // Arrange
      const lockfile: Lockfile = {
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@test/package': {
            version: '1.0.0',
            resolved: 'https://registry.prpm.dev/packages/@test/package/1.0.0/download',
            integrity: 'sha256-abc',
            format: 'cursor',
            subtype: 'rule'
          }
        },
        generated: new Date().toISOString()
      };
      mockReadLockfile.mockResolvedValue(lockfile);

      const mockPackage = {
        id: '@test/package',
        name: '@test/package',
        author: 'test',
        version: '1.0.0',
        format: 'cursor',
        subtype: 'rule',
        files: ['file.md'],
        description: 'Test',
        total_downloads: 0,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://registry.prpm.dev/packages/@test/package/1.0.0/download'
        }
      };
      mockClient.getPackage.mockResolvedValue(mockPackage as any);
      mockClient.getPackageVersion.mockResolvedValue({
        version: '1.0.0',
        tarball_url: 'https://registry.prpm.dev/packages/@test/package/1.0.0/download'
      } as any);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test'));

      // Act
      await installFromLockfile({});

      // Assert - should install even if package exists
      // (force: true is passed internally to handleInstall)
      expect(mockClient.getPackage).toHaveBeenCalledWith('@test/package');
      expect(mockClient.downloadPackage).toHaveBeenCalled();
    });
  });
});
