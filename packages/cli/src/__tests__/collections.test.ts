/**
 * Tests for collections command
 */

import { handleCollectionsList, handleCollectionInfo } from '../commands/collections';
import { getRegistryClient } from '@prmp/registry-client';
import { getConfig } from '../core/user-config';

// Mock dependencies
jest.mock('@prmp/registry-client');
jest.mock('../core/user-config');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
  },
}));

describe('collections command', () => {
  const mockClient = {
    getCollections: jest.fn(),
    getCollection: jest.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  beforeEach(() => {
    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue(mockConfig);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('handleCollectionsList', () => {
    it('should list collections', async () => {
      const mockCollections = {
        collections: [
          {
            id: 'react-essentials',
            scope: 'official',
            name: 'React Essentials',
            description: 'Essential React packages',
            version: '1.0.0',
            author: 'prmp',
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
            id: 'official-coll',
            scope: 'official',
            name: 'Official Collection',
            description: 'An official collection',
            version: '1.0.0',
            author: 'prmp',
            official: true,
            verified: true,
            tags: [],
            packages: [],
            downloads: 1000,
            stars: 50,
            package_count: 5,
          },
          {
            id: 'community-coll',
            scope: 'user',
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
        author: 'prmp',
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
        author: 'prmp',
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
        author: 'prmp',
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

    it('should handle invalid collection format', async () => {
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
});
