/**
 * Tests for Claude hooks in collections
 */

import { handleCollectionInstall } from '../commands/collections';
import { handleInstall } from '../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile } from '../core/filesystem';
import { readLockfile, writeLockfile, createLockfile, addToLockfile, addCollectionToLockfile } from '../core/lockfile';
import { gzipSync } from 'zlib';

// Mock dependencies
jest.mock('@pr-pm/registry-client');
jest.mock('../core/user-config');
jest.mock('../commands/install');
jest.mock('../core/filesystem', () => ({
  getDestinationDir: jest.fn((format, subtype) => {
    if (format === 'claude' && subtype === 'hook') {
      return '.claude';
    }
    return '.claude/skills';
  }),
  ensureDirectoryExists: jest.fn(),
  saveFile: jest.fn(),
  deleteFile: jest.fn(),
  fileExists: jest.fn(() => Promise.resolve(false)),
  generateId: jest.fn((name) => name),
  stripAuthorNamespace: jest.fn((name) => name.split('/').pop() || name),
  autoDetectFormat: jest.fn(() => Promise.resolve('claude')),
}));
jest.mock('../core/lockfile');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe('Claude Hooks in Collections', () => {
  const mockClient = {
    getCollection: jest.fn(),
    installCollection: jest.fn(),
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
    (saveFile as jest.Mock).mockResolvedValue(undefined);
    (createLockfile as jest.Mock).mockReturnValue({
      version: '1.0.0',
      lockfileVersion: 1,
      packages: {},
      generated: new Date().toISOString()
    });
    (addToLockfile as jest.Mock).mockImplementation(() => {});
    (addCollectionToLockfile as jest.Mock).mockImplementation(() => {});
    (handleInstall as jest.Mock).mockResolvedValue(undefined);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Collection with Claude hooks', () => {
    it('should install collection with hooks and show summary warning', async () => {
      const mockCollection = {
        id: 'test-collection',
        name: 'Test Collection with Hooks',
        description: 'A collection containing hooks',
        scope: 'collection',
        name_slug: 'test-collection',
        version: '1.0.0',
        package_count: 3,
        downloads: 100,
        stars: 10,
      };

      const packagesToInstall = [
        {
          packageId: '@author/skill1',
          version: '1.0.0',
          format: 'claude',
          subtype: 'skill',
          required: true,
        },
        {
          packageId: '@author/pre-hook',
          version: '1.0.0',
          format: 'claude',
          subtype: 'hook',
          required: false,
        },
        {
          packageId: '@author/post-hook',
          version: '1.0.0',
          format: 'claude',
          subtype: 'hook',
          required: false,
        },
      ];

      mockClient.installCollection.mockResolvedValue({
        collection: mockCollection,
        packagesToInstall,
      });

      await handleCollectionInstall('test-collection', {
        skipOptional: false,
        dryRun: false,
      });

      // Verify all packages were installed
      expect(handleInstall).toHaveBeenCalledTimes(3);

      // Verify hooks warning was shown
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('This collection includes Claude hooks that execute automatically')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Review hook configurations in .claude/settings.json')
      );
    });

    it('should not show hooks warning for collection without hooks', async () => {
      const mockCollection = {
        id: 'no-hooks-collection',
        name: 'Collection Without Hooks',
        description: 'A collection with no hooks',
        scope: 'collection',
        name_slug: 'no-hooks-collection',
        version: '1.0.0',
        package_count: 2,
        downloads: 100,
        stars: 10,
      };

      const packagesToInstall = [
        {
          packageId: '@author/skill1',
          version: '1.0.0',
          format: 'claude',
          subtype: 'skill',
          required: true,
        },
        {
          packageId: '@author/agent1',
          version: '1.0.0',
          format: 'claude',
          subtype: 'agent',
          required: true,
        },
      ];

      mockClient.installCollection.mockResolvedValue({
        collection: mockCollection,
        packagesToInstall,
      });

      await handleCollectionInstall('no-hooks-collection', {
        skipOptional: false,
        dryRun: false,
      });

      // Verify hooks warning was NOT shown
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('This collection includes Claude hooks')
      );
    });

    it('should pass fromCollection metadata to hook installs', async () => {
      const mockCollection = {
        id: 'hook-collection',
        name: 'Hook Collection',
        description: 'Collection with hooks',
        scope: 'collection',
        name_slug: 'hook-collection',
        version: '1.0.0',
        package_count: 1,
        downloads: 50,
        stars: 5,
      };

      const packagesToInstall = [
        {
          packageId: '@author/collection-hook',
          version: '1.0.0',
          format: 'claude',
          subtype: 'hook',
          required: true,
        },
      ];

      mockClient.installCollection.mockResolvedValue({
        collection: mockCollection,
        packagesToInstall,
      });

      await handleCollectionInstall('hook-collection', {
        skipOptional: false,
        dryRun: false,
      });

      // Verify hook install received fromCollection metadata
      expect(handleInstall).toHaveBeenCalledWith(
        '@author/collection-hook@1.0.0',
        expect.objectContaining({
          fromCollection: {
            scope: 'collection',
            name_slug: 'hook-collection',
            version: '1.0.0',
          },
        })
      );
    });

    it('should track hasClaudeHooks flag correctly', async () => {
      const mockCollection = {
        id: 'mixed-collection',
        name: 'Mixed Collection',
        description: 'Collection with mixed types',
        scope: 'collection',
        name_slug: 'mixed-collection',
        version: '1.0.0',
        package_count: 4,
        downloads: 200,
        stars: 20,
      };

      const packagesToInstall = [
        {
          packageId: '@author/skill1',
          version: '1.0.0',
          format: 'claude',
          subtype: 'skill',
          required: true,
        },
        {
          packageId: '@author/cursor-rule',
          version: '1.0.0',
          format: 'cursor',
          subtype: 'rule',
          required: true,
        },
        {
          packageId: '@author/kiro-hook',
          version: '1.0.0',
          format: 'kiro',
          subtype: 'hook',
          required: false,
        },
        {
          packageId: '@author/claude-hook',
          version: '1.0.0',
          format: 'claude',
          subtype: 'hook',
          required: false,
        },
      ];

      mockClient.installCollection.mockResolvedValue({
        collection: mockCollection,
        packagesToInstall,
      });

      await handleCollectionInstall('mixed-collection', {
        skipOptional: false,
        dryRun: false,
      });

      // Should show warning because there's at least one Claude hook
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('This collection includes Claude hooks')
      );

      // But not mention Kiro hooks (different type)
      const allLogs = (console.log as jest.Mock).mock.calls.map(call => call[0]).join(' ');
      expect(allLogs).toContain('.claude/settings.json');
    });

    it('should handle dry run with hooks', async () => {
      const mockCollection = {
        id: 'dryrun-collection',
        name: 'Dry Run Collection',
        description: 'Collection for dry run test',
        scope: 'collection',
        name_slug: 'dryrun-collection',
        version: '1.0.0',
        package_count: 2,
        downloads: 10,
        stars: 1,
      };

      const packagesToInstall = [
        {
          packageId: '@author/hook1',
          version: '1.0.0',
          format: 'claude',
          subtype: 'hook',
          required: true,
        },
        {
          packageId: '@author/hook2',
          version: '1.0.0',
          format: 'claude',
          subtype: 'hook',
          required: false,
        },
      ];

      mockClient.installCollection.mockResolvedValue({
        collection: mockCollection,
        packagesToInstall,
      });

      await handleCollectionInstall('dryrun-collection', {
        skipOptional: false,
        dryRun: true,
      });

      // Should not actually install
      expect(handleInstall).not.toHaveBeenCalled();

      // Should show what would be installed
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Dry run - would install'));
    });
  });

  describe('Error handling', () => {
    it('should continue installing other packages if optional hook fails', async () => {
      const mockCollection = {
        id: 'partial-collection',
        name: 'Partial Collection',
        description: 'Collection with failing optional hook',
        scope: 'collection',
        name_slug: 'partial-collection',
        version: '1.0.0',
        package_count: 3,
        downloads: 50,
        stars: 5,
      };

      const packagesToInstall = [
        {
          packageId: '@author/required-skill',
          version: '1.0.0',
          format: 'claude',
          subtype: 'skill',
          required: true,
        },
        {
          packageId: '@author/failing-hook',
          version: '1.0.0',
          format: 'claude',
          subtype: 'hook',
          required: false,
        },
        {
          packageId: '@author/another-skill',
          version: '1.0.0',
          format: 'claude',
          subtype: 'skill',
          required: true,
        },
      ];

      mockClient.installCollection.mockResolvedValue({
        collection: mockCollection,
        packagesToInstall,
      });

      // Make the hook install fail
      (handleInstall as jest.Mock).mockImplementation(async (packageSpec) => {
        if (packageSpec.includes('failing-hook')) {
          throw new Error('Hook installation failed');
        }
      });

      await handleCollectionInstall('partial-collection', {
        skipOptional: false,
        dryRun: false,
      });

      // Should still install other packages
      expect(handleInstall).toHaveBeenCalledTimes(3);

      // Should show failure but continue
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('failing-hook')
      );

      // Should still show success for installed packages
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Collection installed successfully')
      );
    });

    it('should fail if required hook fails to install', async () => {
      const mockCollection = {
        id: 'required-hook-collection',
        name: 'Required Hook Collection',
        description: 'Collection with required hook',
        scope: 'collection',
        name_slug: 'required-hook-collection',
        version: '1.0.0',
        package_count: 1,
        downloads: 10,
        stars: 1,
      };

      const packagesToInstall = [
        {
          packageId: '@author/required-hook',
          version: '1.0.0',
          format: 'claude',
          subtype: 'hook',
          required: true,
        },
      ];

      mockClient.installCollection.mockResolvedValue({
        collection: mockCollection,
        packagesToInstall,
      });

      (handleInstall as jest.Mock).mockRejectedValue(new Error('Required hook failed'));

      await expect(
        handleCollectionInstall('required-hook-collection', {
          skipOptional: false,
          dryRun: false,
        })
      ).rejects.toThrow('Failed to install required package');
    });
  });
});
