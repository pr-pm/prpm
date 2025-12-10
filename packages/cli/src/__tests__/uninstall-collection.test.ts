import { vi, describe, it, expect, beforeEach, afterEach, type MockedFunction } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { handleUninstall } from '../commands/uninstall';
import * as lockfileModule from '../core/lockfile';

// We need to mock the entire module to test the race condition fix
vi.mock('../core/lockfile', async () => {
  const actual = await vi.importActual('../core/lockfile') as typeof lockfileModule;
  return {
    ...actual,
    readLockfile: vi.fn(),
    writeLockfile: vi.fn(),
    removePackage: vi.fn(),
    getCollectionFromLockfile: actual.getCollectionFromLockfile,
    removeCollectionFromLockfile: actual.removeCollectionFromLockfile,
    parseLockfileKey: actual.parseLockfileKey,
    getLockfileKey: actual.getLockfileKey,
  };
});

describe('uninstall collection', () => {
  const readLockfileMock = lockfileModule.readLockfile as MockedFunction<typeof lockfileModule.readLockfile>;
  const writeLockfileMock = lockfileModule.writeLockfile as MockedFunction<typeof lockfileModule.writeLockfile>;
  const removePackageMock = lockfileModule.removePackage as MockedFunction<typeof lockfileModule.removePackage>;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(process.cwd(), '.uninstall-collection-test-'));
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'warn').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    removePackageMock.mockReset();
    readLockfileMock.mockReset();
    writeLockfileMock.mockReset();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('removes collection and all its packages from lockfile', async () => {
    const collectionKey = 'test-collection';
    const pkg1Path = path.join(tempDir, 'pkg1.md');
    const pkg2Path = path.join(tempDir, 'pkg2.md');

    await fs.writeFile(pkg1Path, '# Package 1');
    await fs.writeFile(pkg2Path, '# Package 2');

    const initialLockfile = {
      version: '1.0.0',
      lockfileVersion: 1,
      packages: {
        '@test/pkg1#claude': {
          version: '1.0.0',
          tarballUrl: 'https://example.com/pkg1',
          format: 'claude',
          subtype: 'skill',
          sourceFormat: 'claude',
          installedPath: pkg1Path,
          fromCollection: { name_slug: collectionKey },
        },
        '@test/pkg2#claude': {
          version: '1.0.0',
          tarballUrl: 'https://example.com/pkg2',
          format: 'claude',
          subtype: 'skill',
          sourceFormat: 'claude',
          installedPath: pkg2Path,
          fromCollection: { name_slug: collectionKey },
        },
      },
      collections: {
        [collectionKey]: {
          name_slug: collectionKey,
          version: '1.0.0',
          packages: ['@test/pkg1', '@test/pkg2'],
        },
      },
      generated: new Date().toISOString(),
    };

    // Track what removePackage removes to simulate the fresh lockfile
    const removedPackages: string[] = [];

    // First call returns initial lockfile (for collection lookup)
    // Subsequent calls return progressively updated lockfile (simulating removePackage writes)
    readLockfileMock.mockImplementation(async () => {
      // Return a fresh copy with removed packages deleted
      const lockfileCopy = JSON.parse(JSON.stringify(initialLockfile));
      for (const pkg of removedPackages) {
        delete lockfileCopy.packages[pkg];
      }
      return lockfileCopy;
    });

    // removePackage should return package info and track what was removed
    removePackageMock.mockImplementation(async (packageId: string) => {
      const pkg = initialLockfile.packages[packageId as keyof typeof initialLockfile.packages];
      if (pkg) {
        removedPackages.push(packageId);
        return pkg as any;
      }
      return null;
    });

    writeLockfileMock.mockResolvedValue(undefined);

    await handleUninstall(`collections/${collectionKey}`);

    // Verify removePackage was called for both packages
    expect(removePackageMock).toHaveBeenCalledWith('@test/pkg1#claude');
    expect(removePackageMock).toHaveBeenCalledWith('@test/pkg2#claude');

    // Verify writeLockfile was called (for collection removal)
    expect(writeLockfileMock).toHaveBeenCalled();

    // The final lockfile written should NOT have the packages
    // (because we re-read after removePackage calls)
    const lastWriteCall = writeLockfileMock.mock.calls[writeLockfileMock.mock.calls.length - 1];
    const writtenLockfile = lastWriteCall[0];

    // The written lockfile should have the packages removed (via removePackage)
    // and the collection removed (via removeCollectionFromLockfile)
    expect(writtenLockfile.packages['@test/pkg1#claude']).toBeUndefined();
    expect(writtenLockfile.packages['@test/pkg2#claude']).toBeUndefined();
    expect(writtenLockfile.collections?.[collectionKey]).toBeUndefined();

    // Files should be deleted
    await expect(fs.stat(pkg1Path)).rejects.toHaveProperty('code', 'ENOENT');
    await expect(fs.stat(pkg2Path)).rejects.toHaveProperty('code', 'ENOENT');
  });

  it('handles collection with no matching packages gracefully', async () => {
    const collectionKey = 'empty-collection';

    const initialLockfile = {
      version: '1.0.0',
      lockfileVersion: 1,
      packages: {},
      collections: {
        [collectionKey]: {
          name_slug: collectionKey,
          version: '1.0.0',
          packages: ['@test/nonexistent'],
        },
      },
      generated: new Date().toISOString(),
    };

    readLockfileMock.mockResolvedValue(initialLockfile);
    writeLockfileMock.mockResolvedValue(undefined);

    await handleUninstall(`collections/${collectionKey}`);

    // Should still remove the collection even if packages don't exist
    expect(writeLockfileMock).toHaveBeenCalled();
    const writtenLockfile = writeLockfileMock.mock.calls[0][0];
    expect(writtenLockfile.collections?.[collectionKey]).toBeUndefined();
  });

  it('throws error for non-existent collection', async () => {
    readLockfileMock.mockResolvedValue({
      version: '1.0.0',
      lockfileVersion: 1,
      packages: {},
      collections: {},
      generated: new Date().toISOString(),
    });

    await expect(handleUninstall('collections/nonexistent')).rejects.toThrow(
      'Collection "collections/nonexistent" not found'
    );
  });
});
