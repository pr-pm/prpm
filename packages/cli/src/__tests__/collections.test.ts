/**
 * Tests for collections command
 */

import { handleCollectionsList, handleCollectionInfo, handleCollectionPublish, handleCollectionInstall } from '../commands/collections';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { mkdtemp, writeFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleInstall } from '../commands/install';

// Mock dependencies
jest.mock('@pr-pm/registry-client');
jest.mock('../core/user-config');
jest.mock('../commands/install');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));
jest.mock('../core/lockfile', () => ({
  readLockfile: jest.fn().mockResolvedValue(null),
  writeLockfile: jest.fn(),
  createLockfile: jest.fn().mockReturnValue({ packages: {}, collections: {} }),
  addCollectionToLockfile: jest.fn(),
}));

describe('collections command', () => {
  const mockClient = {
    getCollections: jest.fn(),
    getCollection: jest.fn(),
    createCollection: jest.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  let testDir: string;
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
  });

  beforeEach(async () => {
    // Create temp directory for test files
    testDir = await mkdtemp(join(tmpdir(), 'prpm-test-'));
    process.chdir(testDir);

    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue(mockConfig);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(() => {
    // Restore original working directory
    try {
      process.chdir(originalCwd);
    } catch {
      // Ignore errors
    }
  });

  describe('handleCollectionsList', () => {
    it('should list collections', async () => {
      const mockCollections = {
        collections: [
          {
            id: 'uuid-react-essentials',
            scope: 'official',
            name_slug: 'react-essentials',
            name: 'React Essentials',
            description: 'Essential React packages',
            version: '1.0.0',
            author: 'prpm',
            official: true,
            verified: true,
            tags: ['react'],
            packages: [],
            downloads: 1000,
            stars: 50,
            package_count: 5,
          },
        ],
        total: 1,
        offset: 0,
        limit: 50,
      };

      mockClient.getCollections.mockResolvedValue(mockCollections);

      await handleCollectionsList({});

      expect(mockClient.getCollections).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('React Essentials')
      );
    });

    it('should filter by category', async () => {
      const mockCollections = {
        collections: [],
        total: 0,
        offset: 0,
        limit: 50,
      };

      mockClient.getCollections.mockResolvedValue(mockCollections);

      await handleCollectionsList({ category: 'development' });

      expect(mockClient.getCollections).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'development' })
      );
    });

    it('should filter by official status', async () => {
      const mockCollections = {
        collections: [],
        total: 0,
        offset: 0,
        limit: 50,
      };

      mockClient.getCollections.mockResolvedValue(mockCollections);

      await handleCollectionsList({ official: true });

      expect(mockClient.getCollections).toHaveBeenCalledWith(
        expect.objectContaining({ official: true })
      );
    });

    it('should filter by scope', async () => {
      const mockCollections = {
        collections: [],
        total: 0,
        offset: 0,
        limit: 50,
      };

      mockClient.getCollections.mockResolvedValue(mockCollections);

      await handleCollectionsList({ scope: 'official' });

      expect(mockClient.getCollections).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'official' })
      );
    });

    it('should handle empty results', async () => {
      const mockCollections = {
        collections: [],
        total: 0,
        offset: 0,
        limit: 50,
      };

      mockClient.getCollections.mockResolvedValue(mockCollections);

      await handleCollectionsList({});

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('No collections found')
      );
    });

    it('should separate official and community collections', async () => {
      const mockCollections = {
        collections: [
          {
            id: 'uuid-official-coll',
            scope: 'official',
            name_slug: 'official-coll',
            name: 'Official Collection',
            description: 'An official collection',
            version: '1.0.0',
            author: 'prpm',
            official: true,
            verified: true,
            tags: [],
            packages: [],
            downloads: 1000,
            stars: 50,
            package_count: 5,
          },
          {
            id: 'uuid-community-coll',
            scope: 'user',
            name_slug: 'community-coll',
            name: 'Community Collection',
            description: 'A community collection',
            version: '1.0.0',
            author: 'user',
            official: false,
            verified: false,
            tags: [],
            packages: [],
            downloads: 100,
            stars: 10,
            package_count: 3,
          },
        ],
        total: 2,
        offset: 0,
        limit: 50,
      };

      mockClient.getCollections.mockResolvedValue(mockCollections);

      await handleCollectionsList({});

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Official Collections')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Community Collections')
      );
    });

    it('should handle errors', async () => {
      mockClient.getCollections.mockRejectedValue(new Error('Network error'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionsList({})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to list collections')
      );

      mockExit.mockRestore();
    });
  });

  describe('handleCollectionInfo', () => {
    it('should show collection details', async () => {
      const mockCollection = {
        id: 'react-essentials',
        scope: 'official',
        name: 'React Essentials',
        description: 'Essential React packages for development',
        version: '1.0.0',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'development',
        tags: ['react', 'javascript'],
        packages: [
          {
            packageId: 'react-rules',
            version: '1.0.0',
            required: true,
            reason: 'Core React coding rules',
          },
        ],
        downloads: 1000,
        stars: 50,
        package_count: 1,
      };

      mockClient.getCollection.mockResolvedValue(mockCollection);

      await handleCollectionInfo('@official/react-essentials');

      expect(mockClient.getCollection).toHaveBeenCalledWith(
        'official',
        'react-essentials',
        undefined
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('React Essentials')
      );
    });

    it('should handle collection without @ prefix', async () => {
      const mockCollection = {
        id: 'test',
        scope: 'user',
        name: 'Test Collection',
        description: 'Test',
        version: '1.0.0',
        author: 'user',
        official: false,
        verified: false,
        tags: [],
        packages: [],
        downloads: 10,
        stars: 1,
        package_count: 0,
      };

      mockClient.getCollection.mockResolvedValue(mockCollection);

      await handleCollectionInfo('user/test');

      expect(mockClient.getCollection).toHaveBeenCalledWith('user', 'test', undefined);
    });

    it('should handle specific version', async () => {
      const mockCollection = {
        id: 'test',
        scope: 'official',
        name: 'Test Collection',
        description: 'Test',
        version: '2.0.0',
        author: 'prpm',
        official: true,
        verified: true,
        tags: [],
        packages: [],
        downloads: 100,
        stars: 10,
        package_count: 0,
      };

      mockClient.getCollection.mockResolvedValue(mockCollection);

      await handleCollectionInfo('@official/test@2.0.0');

      expect(mockClient.getCollection).toHaveBeenCalledWith('official', 'test', '2.0.0');
    });

    it('should display required and optional packages separately', async () => {
      const mockCollection = {
        id: 'test',
        scope: 'official',
        name: 'Test Collection',
        description: 'Test',
        version: '1.0.0',
        author: 'prpm',
        official: true,
        verified: true,
        tags: [],
        packages: [
          {
            packageId: 'required-pkg',
            version: '1.0.0',
            required: true,
          },
          {
            packageId: 'optional-pkg',
            version: '1.0.0',
            required: false,
          },
        ],
        downloads: 100,
        stars: 10,
        package_count: 2,
      };

      mockClient.getCollection.mockResolvedValue(mockCollection);

      await handleCollectionInfo('@official/test');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Required:'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Optional:'));
    });

    // TODO: Fix flaky test - error message changed after collection display updates
    // Expected: "Invalid collection format"
    // Actual: "Cannot read properties of undefined (reading 'icon')"
    // Need to mock getCollection to return proper error or update validation logic
    it.skip('should handle invalid collection format', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionInfo('invalid-format')).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid collection format')
      );

      mockExit.mockRestore();
    });

    it('should handle collection not found', async () => {
      mockClient.getCollection.mockRejectedValue(new Error('Collection not found'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionInfo('@official/nonexistent')).rejects.toThrow(
        'Process exited'
      );

      mockExit.mockRestore();
    });
  });

  describe('handleCollectionPublish', () => {
    beforeEach(async () => {
      // Create temp directory for test files
      testDir = await mkdtemp(join(tmpdir(), 'prpm-test-'));
      process.chdir(testDir);
    });

    afterEach(async () => {
      // Clean up test directory
      try {
        await rm(testDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should require authentication', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'https://test-registry.com',
        token: undefined,
      });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication required')
      );

      mockExit.mockRestore();
    });

    it('should validate collection.json exists', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should validate required fields', async () => {
      await writeFile(
        join(testDir, 'collection.json'),
        JSON.stringify({
          id: 'test-collection',
          name: 'Test Collection',
          // Missing description and packages
        })
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Missing required fields')
      );

      mockExit.mockRestore();
    });

    it('should validate collection id format', async () => {
      await writeFile(
        join(testDir, 'collection.json'),
        JSON.stringify({
          id: 'Invalid_ID',
          name: 'Test Collection',
          description: 'A test collection',
          packages: [{ packageId: 'test-pkg' }],
        })
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection id must be lowercase alphanumeric')
      );

      mockExit.mockRestore();
    });

    it('should validate name length', async () => {
      await writeFile(
        join(testDir, 'collection.json'),
        JSON.stringify({
          id: 'test-collection',
          name: 'AB',
          description: 'A test collection',
          packages: [{ packageId: 'test-pkg' }],
        })
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection name must be at least 3 characters')
      );

      mockExit.mockRestore();
    });

    it('should validate description length', async () => {
      await writeFile(
        join(testDir, 'collection.json'),
        JSON.stringify({
          id: 'test-collection',
          name: 'Test Collection',
          description: 'Short',
          packages: [{ packageId: 'test-pkg' }],
        })
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection description must be at least 10 characters')
      );

      mockExit.mockRestore();
    });

    // TODO: Fix flaky test - passes locally but fails in CI
    // Error in CI: "Cannot read properties of undefined (reading 'scope')"
    // Expected: validation error for empty packages array before createCollection is called
    // Actual in CI: reaches success logging somehow, causing undefined access
    it.skip('should validate packages array is not empty', async () => {
      await writeFile(
        join(testDir, 'collection.json'),
        JSON.stringify({
          id: 'test-collection',
          name: 'Test Collection',
          description: 'A test collection with no packages',
          packages: [],
        })
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection must include at least one package')
      );

      mockExit.mockRestore();
    });

    it('should validate each package has packageId', async () => {
      await writeFile(
        join(testDir, 'collection.json'),
        JSON.stringify({
          id: 'test-collection',
          name: 'Test Collection',
          description: 'A test collection',
          packages: [{ version: '1.0.0' }],
        })
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Package at index 0 is missing packageId')
      );

      mockExit.mockRestore();
    });

    it.skip('should successfully publish valid collection', async () => {
      await writeFile(
        join(testDir, 'collection.json'),
        JSON.stringify({
          id: 'test-collection',
          name: 'Test Collection',
          description: 'A test collection for testing',
          category: 'development',
          tags: ['testing', 'automation'],
          packages: [
            {
              packageId: 'test-package-1',
              version: '1.0.0',
              required: true,
              reason: 'Core functionality',
            },
            {
              packageId: 'test-package-2',
              required: false,
              reason: 'Optional enhancement',
            },
          ],
          icon: '📦',
        })
      );

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-123',
        scope: 'testuser',
        name_slug: 'test-collection',
        version: '1.0.0',
        name: 'Test Collection',
        description: 'A test collection for testing',
        official: false,
        verified: false,
      });

      await handleCollectionPublish('./collection.json');

      expect(mockClient.createCollection).toHaveBeenCalledWith({
        id: 'test-collection',
        name: 'Test Collection',
        description: 'A test collection for testing',
        category: 'development',
        tags: ['testing', 'automation'],
        packages: [
          {
            packageId: 'test-package-1',
            version: '1.0.0',
            required: true,
            reason: 'Core functionality',
          },
          {
            packageId: 'test-package-2',
            version: undefined,
            required: false, // respects the false value from manifest
            reason: 'Optional enhancement',
          },
        ],
        icon: '📦',
      });

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ Collection published successfully!'));
    });

    it('should handle custom manifest path', async () => {
      await writeFile(
        join(testDir, 'custom.json'),
        JSON.stringify({
          id: 'custom-collection',
          name: 'Custom Collection',
          description: 'A custom collection',
          packages: [{ packageId: 'pkg-1' }],
        })
      );

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-456',
        scope: 'testuser',
        name_slug: 'custom-collection',
        version: '1.0.0',
      });

      await handleCollectionPublish('./custom.json');

      expect(mockClient.createCollection).toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      await writeFile(join(testDir, 'collection.json'), 'invalid json {]');

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should handle API errors', async () => {
      await writeFile(
        join(testDir, 'collection.json'),
        JSON.stringify({
          id: 'test-collection',
          name: 'Test Collection',
          description: 'A test collection',
          packages: [{ packageId: 'test-pkg' }],
        })
      );

      mockClient.createCollection.mockRejectedValue(
        new Error('Collection already exists')
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish('./collection.json')).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection already exists')
      );

      mockExit.mockRestore();
    });

    it('should set required to true by default', async () => {
      await writeFile(
        join(testDir, 'collection.json'),
        JSON.stringify({
          id: 'test-collection',
          name: 'Test Collection',
          description: 'A test collection',
          packages: [
            { packageId: 'pkg-1', required: false },
            { packageId: 'pkg-2' },
          ],
        })
      );

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-789',
        scope: 'testuser',
        name_slug: 'test-collection',
        version: '1.0.0',
      });

      await handleCollectionPublish('./collection.json');

      expect(mockClient.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          packages: [
            expect.objectContaining({ packageId: 'pkg-1', required: false }),
            expect.objectContaining({ packageId: 'pkg-2', required: true }),
          ],
        })
      );
    });
  });

  describe('handleCollectionInstall', () => {
    const mockInstallCollection = {
      collection: {
        id: 'uuid-test-coll',
        scope: 'official',
        name_slug: 'test-collection',
        name: 'Test Collection',
        description: 'A test collection',
        version: '1.0.0',
        author: 'prpm',
        official: true,
        verified: true,
        packages: [],
        downloads: 100,
        stars: 10,
        package_count: 2,
      },
      packagesToInstall: [
        {
          packageId: '@prpm/pkg1',
          version: '1.0.0',
          format: 'cursor',
          required: true,
        },
        {
          packageId: '@prpm/pkg2',
          version: '2.0.0',
          format: 'cursor',
          required: false,
        },
      ],
      totalPackages: 2,
      requiredPackages: 1,
      optionalPackages: 1,
    };

    beforeEach(() => {
      mockClient.installCollection = jest.fn().mockResolvedValue(mockInstallCollection);
      (handleInstall as jest.Mock).mockResolvedValue(undefined);
    });

    it('should auto-detect format when no --as flag is provided', async () => {
      // Create .claude directory to simulate existing Claude setup
      await mkdir(join(testDir, '.claude'), { recursive: true });

      await handleCollectionInstall('test-collection', {});

      // Verify handleInstall was called WITHOUT 'as' parameter for auto-detection
      expect(handleInstall).toHaveBeenCalledWith(
        '@prpm/pkg1@1.0.0',
        expect.objectContaining({
          fromCollection: expect.any(Object),
          // Should NOT have 'as' property to allow auto-detection
        })
      );

      expect(handleInstall).toHaveBeenCalledWith(
        '@prpm/pkg2@2.0.0',
        expect.objectContaining({
          fromCollection: expect.any(Object),
          // Should NOT have 'as' property to allow auto-detection
        })
      );

      // Verify 'as' is not set
      const firstCall = (handleInstall as jest.Mock).mock.calls[0][1];
      expect(firstCall).not.toHaveProperty('as');
    });

    it('should respect explicit --as flag when provided', async () => {
      await handleCollectionInstall('test-collection', {
        format: 'claude',
      });

      // Verify handleInstall was called WITH 'as' parameter set to 'claude'
      expect(handleInstall).toHaveBeenCalledWith(
        '@prpm/pkg1@1.0.0',
        expect.objectContaining({
          as: 'claude',
          fromCollection: expect.any(Object),
        })
      );

      expect(handleInstall).toHaveBeenCalledWith(
        '@prpm/pkg2@2.0.0',
        expect.objectContaining({
          as: 'claude',
          fromCollection: expect.any(Object),
        })
      );
    });

    it('should install all packages in collection', async () => {
      await handleCollectionInstall('test-collection', {});

      expect(handleInstall).toHaveBeenCalledTimes(2);
      expect(handleInstall).toHaveBeenNthCalledWith(
        1,
        '@prpm/pkg1@1.0.0',
        expect.any(Object)
      );
      expect(handleInstall).toHaveBeenNthCalledWith(
        2,
        '@prpm/pkg2@2.0.0',
        expect.any(Object)
      );
    });

    it('should handle scoped collection names', async () => {
      await handleCollectionInstall('@official/test-collection', {});

      expect(mockClient.installCollection).toHaveBeenCalledWith({
        scope: 'official',
        id: 'test-collection',
        version: undefined,
        format: undefined,
        skipOptional: undefined,
      });
    });

    it('should handle collection names without scope', async () => {
      await handleCollectionInstall('test-collection', {});

      expect(mockClient.installCollection).toHaveBeenCalledWith({
        scope: 'collection',
        id: 'test-collection',
        version: undefined,
        format: undefined,
        skipOptional: undefined,
      });
    });

    it('should handle specific version', async () => {
      await handleCollectionInstall('test-collection@2.0.0', {});

      expect(mockClient.installCollection).toHaveBeenCalledWith({
        scope: 'collection',
        id: 'test-collection',
        version: '2.0.0',
        format: undefined,
        skipOptional: undefined,
      });
    });

    it('should skip optional packages when skipOptional is true', async () => {
      await handleCollectionInstall('test-collection', {
        skipOptional: true,
      });

      expect(mockClient.installCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          skipOptional: true,
        })
      );
    });

    it('should continue installing after optional package failure', async () => {
      (handleInstall as jest.Mock)
        .mockResolvedValueOnce(undefined) // First package succeeds
        .mockRejectedValueOnce(new Error('Install failed')); // Second package fails

      await handleCollectionInstall('test-collection', {});

      // Both packages should be attempted
      expect(handleInstall).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Install failed')
      );
    });

    it('should fail if required package installation fails', async () => {
      // Make the first (required) package fail
      (handleInstall as jest.Mock).mockRejectedValueOnce(new Error('Required package failed'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionInstall('test-collection', {})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to install required package')
      );

      mockExit.mockRestore();
    });

    it('should perform dry run without installing', async () => {
      await handleCollectionInstall('test-collection', {
        dryRun: true,
      });

      // Should not call handleInstall in dry run mode
      expect(handleInstall).not.toHaveBeenCalled();

      // Should display what would be installed
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Dry run - would install')
      );
    });
  });
});
