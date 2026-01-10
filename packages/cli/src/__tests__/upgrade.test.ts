import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
type Mock = ReturnType<typeof vi.fn>;

/**
 * Tests for upgrade command
 */

import { handleUpgrade } from '../commands/upgrade';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import {
  listPackages,
  readLockfile,
  writeLockfile,
  parseLockfileKey,
  addCollectionToLockfile,
  listCollectionsFromLockfile,
} from '../core/lockfile';
import { handleInstall } from '../commands/install';

// Mock dependencies
vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');
vi.mock('../commands/install');
vi.mock('../core/lockfile', () => ({
  listPackages: vi.fn(),
  readLockfile: vi.fn(),
  writeLockfile: vi.fn(),
  parseLockfileKey: vi.fn((key: string) => {
    const parts = key.split('#');
    return { packageId: parts[0], format: parts[1] };
  }),
  addCollectionToLockfile: vi.fn(),
  listCollectionsFromLockfile: vi.fn(() => []),
}));
vi.mock('../core/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    shutdown: vi.fn(),
  },
}));

describe('upgrade command', () => {
  const mockClient = {
    getPackage: vi.fn(),
    getCollection: vi.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  beforeEach(() => {
    (getRegistryClient as Mock).mockReturnValue(mockClient);
    (getConfig as Mock).mockResolvedValue(mockConfig);
    (handleInstall as Mock).mockResolvedValue(undefined);
    (readLockfile as Mock).mockResolvedValue(null);
    (writeLockfile as Mock).mockResolvedValue(undefined);
    (listCollectionsFromLockfile as Mock).mockReturnValue([]);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('format preservation', () => {
    it('should preserve format from lockfile when upgrading', async () => {
      // Setup: package installed as claude format
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@nango/action-builder-skill#claude',
          version: '1.0.3',
          format: 'claude',
          sourceFormat: 'claude',
          installedPath: '.claude/skills/action-builder-skill/SKILL.md',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: '@nango/action-builder-skill',
        name: '@nango/action-builder-skill',
        latest_version: {
          version: '1.1.0',
        },
      });

      await handleUpgrade();

      // Should call handleInstall with the format from lockfile
      expect(handleInstall).toHaveBeenCalledWith(
        '@nango/action-builder-skill@1.1.0',
        { as: 'claude' }
      );
    });

    it('should preserve format from lockfile key as fallback for older lockfiles', async () => {
      // Setup: older lockfile where pkg.format might be undefined but key has format
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@nango/action-builder-skill#claude',
          version: '1.0.3',
          // format is undefined (older lockfile)
          sourceFormat: 'claude',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: '@nango/action-builder-skill',
        name: '@nango/action-builder-skill',
        latest_version: {
          version: '1.1.0',
        },
      });

      await handleUpgrade();

      // Should fall back to keyFormat from lockfile key
      expect(handleInstall).toHaveBeenCalledWith(
        '@nango/action-builder-skill@1.1.0',
        { as: 'claude' }
      );
    });

    it('should not auto-detect format when upgrading (prevents wrong location)', async () => {
      // This tests the bug fix: previously format was only preserved when
      // installedFormat !== sourceFormat. When they were equal (claude === claude),
      // it would auto-detect and potentially install to wrong location.
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@nango/build-actions#claude',
          version: '1.0.2',
          format: 'claude',
          sourceFormat: 'claude', // Same as format
          installedPath: '.claude/commands/build-actions.md',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: '@nango/build-actions',
        name: '@nango/build-actions',
        latest_version: {
          version: '1.0.3',
        },
      });

      await handleUpgrade();

      // Should still pass format even when format === sourceFormat
      expect(handleInstall).toHaveBeenCalledWith(
        '@nango/build-actions@1.0.3',
        { as: 'claude' }
      );
    });

    it('should handle packages without format (allow auto-detect)', async () => {
      // Setup: package without format in lockfile
      (listPackages as Mock).mockResolvedValue([
        {
          id: 'some-package',
          version: '1.0.0',
          // No format
        },
      ]);

      // parseLockfileKey returns no format for keys without #
      (parseLockfileKey as Mock).mockReturnValue({
        packageId: 'some-package',
        format: undefined,
      });

      mockClient.getPackage.mockResolvedValue({
        id: 'some-package',
        name: 'some-package',
        latest_version: {
          version: '2.0.0',
        },
      });

      await handleUpgrade();

      // Should pass undefined format (allows auto-detect)
      expect(handleInstall).toHaveBeenCalledWith(
        'some-package@2.0.0',
        { as: undefined }
      );
    });
  });

  describe('collection upgrades', () => {
    it('should install new packages when collection version changes', async () => {
      // Setup: existing packages from collection
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@nango/action-builder-skill#claude',
          version: '1.0.3',
          format: 'claude',
          fromCollection: {
            name_slug: 'nango-integration-builder',
            version: '1.0.4',
          },
        },
        {
          id: '@nango/build-actions#claude',
          version: '1.0.2',
          format: 'claude',
          fromCollection: {
            name_slug: 'nango-integration-builder',
            version: '1.0.4',
          },
        },
      ]);

      // Both packages are at latest version
      mockClient.getPackage
        .mockResolvedValueOnce({
          id: '@nango/action-builder-skill',
          latest_version: { version: '1.0.3' },
        })
        .mockResolvedValueOnce({
          id: '@nango/build-actions',
          latest_version: { version: '1.0.2' },
        });

      // Setup: lockfile with collection
      const mockLockfile = {
        packages: {},
        collections: {
          'nango-integration-builder': {
            name_slug: 'nango-integration-builder',
            version: '1.0.4',
            packages: ['@nango/action-builder-skill', '@nango/build-actions'],
          },
        },
      };
      (readLockfile as Mock).mockResolvedValue(mockLockfile);
      (listCollectionsFromLockfile as Mock).mockReturnValue([
        {
          key: 'nango-integration-builder',
          name_slug: 'nango-integration-builder',
          version: '1.0.4',
          packages: ['@nango/action-builder-skill', '@nango/build-actions'],
        },
      ]);

      // Collection has new version with additional package
      mockClient.getCollection.mockResolvedValue({
        name_slug: 'nango-integration-builder',
        version: '1.0.5',
        packages: [
          { package: { name: '@nango/action-builder-skill' }, version: '1.0.3' },
          { package: { name: '@nango/build-actions' }, version: '1.0.2' },
          { package: { name: '@nango/new-package' }, version: '1.0.0' }, // New package
        ],
      });

      await handleUpgrade();

      // Should install the new package with same format as existing collection packages
      expect(handleInstall).toHaveBeenCalledWith(
        '@nango/new-package@1.0.0',
        {
          as: 'claude',
          fromCollection: {
            name_slug: 'nango-integration-builder',
            version: '1.0.5',
          },
        }
      );

      // Should update collection in lockfile
      expect(addCollectionToLockfile).toHaveBeenCalledWith(
        mockLockfile,
        'nango-integration-builder',
        {
          name_slug: 'nango-integration-builder',
          version: '1.0.5',
          packages: [
            '@nango/action-builder-skill',
            '@nango/build-actions',
            '@nango/new-package',
          ],
        }
      );
    });

    it('should not check collections when upgrading specific package', async () => {
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@nango/action-builder-skill#claude',
          version: '1.0.3',
          format: 'claude',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: '@nango/action-builder-skill',
        latest_version: { version: '1.1.0' },
      });

      // Upgrade specific package
      await handleUpgrade('@nango/action-builder-skill');

      // Should NOT check collections
      expect(readLockfile).not.toHaveBeenCalled();
      expect(mockClient.getCollection).not.toHaveBeenCalled();
    });

    it('should preserve format from existing collection packages for new packages', async () => {
      // Setup: existing collection package installed as cursor
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@scope/existing-pkg#cursor',
          version: '1.0.0',
          format: 'cursor',
          fromCollection: {
            name_slug: 'my-collection',
            version: '1.0.0',
          },
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: '@scope/existing-pkg',
        latest_version: { version: '1.0.0' },
      });

      const mockLockfile = { packages: {}, collections: {} };
      (readLockfile as Mock).mockResolvedValue(mockLockfile);
      (listCollectionsFromLockfile as Mock).mockReturnValue([
        {
          key: 'my-collection',
          name_slug: 'my-collection',
          version: '1.0.0',
          packages: ['@scope/existing-pkg'],
        },
      ]);

      mockClient.getCollection.mockResolvedValue({
        name_slug: 'my-collection',
        version: '2.0.0',
        packages: [
          { package: { name: '@scope/existing-pkg' }, version: '1.0.0' },
          { package: { name: '@scope/new-pkg' }, version: '1.0.0' },
        ],
      });

      await handleUpgrade();

      // New package should use cursor format (from existing collection package)
      expect(handleInstall).toHaveBeenCalledWith(
        '@scope/new-pkg@1.0.0',
        expect.objectContaining({ as: 'cursor' })
      );
    });

    it('should handle collection with no new packages gracefully', async () => {
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@scope/pkg#claude',
          version: '1.0.0',
          format: 'claude',
          fromCollection: { name_slug: 'my-collection', version: '1.0.0' },
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: '@scope/pkg',
        latest_version: { version: '1.0.0' },
      });

      const mockLockfile = { packages: {}, collections: {} };
      (readLockfile as Mock).mockResolvedValue(mockLockfile);
      (listCollectionsFromLockfile as Mock).mockReturnValue([
        {
          key: 'my-collection',
          name_slug: 'my-collection',
          version: '1.0.0',
          packages: ['@scope/pkg'],
        },
      ]);

      // Collection version changed but no new packages
      mockClient.getCollection.mockResolvedValue({
        name_slug: 'my-collection',
        version: '1.0.1',
        packages: [
          { package: { name: '@scope/pkg' }, version: '1.0.0' },
        ],
      });

      await handleUpgrade();

      // Should only update collection metadata, not install anything new
      expect(handleInstall).not.toHaveBeenCalled();
      expect(addCollectionToLockfile).toHaveBeenCalledWith(
        mockLockfile,
        'my-collection',
        expect.objectContaining({ version: '1.0.1' })
      );
    });
  });

  describe('error handling', () => {
    it('should continue upgrading other packages when one fails', async () => {
      (listPackages as Mock).mockResolvedValue([
        { id: 'pkg1#claude', version: '1.0.0', format: 'claude' },
        { id: 'pkg2#claude', version: '1.0.0', format: 'claude' },
      ]);

      mockClient.getPackage
        .mockResolvedValueOnce({ id: 'pkg1', latest_version: { version: '2.0.0' } })
        .mockResolvedValueOnce({ id: 'pkg2', latest_version: { version: '2.0.0' } });

      (handleInstall as Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      await handleUpgrade();

      // Should have attempted both packages
      expect(handleInstall).toHaveBeenCalledTimes(2);
    });

    it('should handle collection fetch errors gracefully', async () => {
      (listPackages as Mock).mockResolvedValue([]);

      const mockLockfile = { packages: {}, collections: {} };
      (readLockfile as Mock).mockResolvedValue(mockLockfile);
      (listCollectionsFromLockfile as Mock).mockReturnValue([
        { key: 'my-collection', name_slug: 'my-collection', version: '1.0.0', packages: [] },
      ]);

      mockClient.getCollection.mockRejectedValue(new Error('Collection not found'));

      // Should not throw, just log warning
      await expect(handleUpgrade()).resolves.not.toThrow();
    });
  });
});
