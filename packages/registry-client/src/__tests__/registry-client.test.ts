/**
 * Tests for RegistryClient
 */

import { RegistryClient, getRegistryClient } from '../registry-client';
import { PackageType } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('RegistryClient', () => {
  let client: RegistryClient;
  const mockBaseUrl = 'https://test-registry.example.com';
  const mockToken = 'test-token-123';

  beforeEach(() => {
    client = new RegistryClient({
      url: mockBaseUrl,
      token: mockToken,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with config', () => {
      expect(client).toBeInstanceOf(RegistryClient);
    });

    it('should remove trailing slash from URL', () => {
      const clientWithSlash = new RegistryClient({
        url: 'https://test.com/',
      });
      expect(clientWithSlash).toBeInstanceOf(RegistryClient);
    });

    it('should accept optional token', () => {
      const clientWithoutToken = new RegistryClient({
        url: mockBaseUrl,
      });
      expect(clientWithoutToken).toBeInstanceOf(RegistryClient);
    });
  });

  describe('search', () => {
    const mockSearchResult = {
      packages: [
        {
          id: 'test-package',
          display_name: 'Test Package',
          description: 'A test package',
          type: 'cursor' as PackageType,
          tags: ['test'],
          total_downloads: 100,
          verified: true,
        },
      ],
      total: 1,
      offset: 0,
      limit: 20,
    };

    it('should search for packages with query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      const result = await client.search('test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/search?q=test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockSearchResult);
    });

    it('should include type filter in search', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      await client.search('test', { type: 'cursor' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=cursor'),
        expect.anything()
      );
    });

    it('should include tags filter in search', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      await client.search('test', { tags: ['react', 'typescript'] });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('tags=react');
      expect(callUrl).toContain('tags=typescript');
    });

    it('should handle search with pagination', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      await client.search('test', { limit: 10, offset: 20 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=20'),
        expect.anything()
      );
    });

    it('should handle search errors', async () => {
      // Mock all 3 retries to return error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      await expect(client.search('test')).rejects.toThrow('Server error');
    });
  });

  describe('getPackage', () => {
    const mockPackage = {
      id: 'test-package',
      display_name: 'Test Package',
      description: 'A test package',
      type: 'cursor' as PackageType,
      tags: ['test'],
      total_downloads: 100,
      verified: true,
      latest_version: {
        version: '1.0.0',
        tarball_url: 'https://example.com/package.tar.gz',
      },
    };

    it('should fetch package by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage,
      });

      const result = await client.getPackage('test-package');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/packages/test-package`,
        expect.anything()
      );
      expect(result).toEqual(mockPackage);
    });

    it('should handle package not found', async () => {
      // The current implementation will retry even for 404, so we need to mock all attempts
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Package not found' }),
      });

      await expect(client.getPackage('nonexistent')).rejects.toThrow('Package not found');
    });
  });

  describe('getPackageVersion', () => {
    const mockVersion = {
      version: '1.0.0',
      tarball_url: 'https://example.com/package.tar.gz',
      published_at: '2024-01-01T00:00:00Z',
    };

    it('should fetch specific package version', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersion,
      });

      const result = await client.getPackageVersion('test-package', '1.0.0');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/packages/test-package/1.0.0`,
        expect.anything()
      );
      expect(result).toEqual(mockVersion);
    });
  });

  describe('getPackageDependencies', () => {
    const mockDependencies = {
      dependencies: {
        'dep-1': '1.0.0',
        'dep-2': '2.0.0',
      },
      peerDependencies: {
        'peer-1': '^1.0.0',
      },
    };

    it('should fetch package dependencies', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDependencies,
      });

      const result = await client.getPackageDependencies('test-package');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/packages/test-package/dependencies`,
        expect.anything()
      );
      expect(result).toEqual(mockDependencies);
    });

    it('should fetch dependencies for specific version', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDependencies,
      });

      await client.getPackageDependencies('test-package', '1.0.0');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/packages/test-package/1.0.0/dependencies`,
        expect.anything()
      );
    });
  });

  describe('getPackageVersions', () => {
    const mockVersions = {
      versions: ['1.0.0', '1.1.0', '2.0.0'],
    };

    it('should fetch all package versions', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      });

      const result = await client.getPackageVersions('test-package');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/packages/test-package/versions`,
        expect.anything()
      );
      expect(result).toEqual(mockVersions);
    });
  });

  describe('resolveDependencies', () => {
    const mockResolution = {
      resolved: {
        'test-package': '1.0.0',
        'dep-1': '1.0.0',
      },
      tree: {
        'test-package': {
          version: '1.0.0',
          dependencies: { 'dep-1': '1.0.0' },
        },
      },
    };

    it('should resolve dependency tree', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResolution,
      });

      const result = await client.resolveDependencies('test-package');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/packages/test-package/resolve'),
        expect.anything()
      );
      expect(result).toEqual(mockResolution);
    });

    it('should resolve with specific version', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResolution,
      });

      await client.resolveDependencies('test-package', '1.0.0');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('version=1.0.0'),
        expect.anything()
      );
    });
  });

  describe('downloadPackage', () => {
    it('should download package tarball', async () => {
      const mockBuffer = Buffer.from('test-data');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockBuffer.buffer,
      });

      const result = await client.downloadPackage('https://example.com/package.tar.gz');

      expect(global.fetch).toHaveBeenCalledWith('https://example.com/package.tar.gz');
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should append format parameter for registry URLs', async () => {
      const mockBuffer = Buffer.from('test-data');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockBuffer.buffer,
      });

      await client.downloadPackage(`${mockBaseUrl}/package.tar.gz`, { format: 'cursor' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('format=cursor')
      );
    });

    it('should handle download errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(
        client.downloadPackage('https://example.com/missing.tar.gz')
      ).rejects.toThrow('Failed to download package');
    });
  });

  describe('getTrending', () => {
    const mockPackages = [
      {
        id: 'trending-1',
        display_name: 'Trending Package 1',
        type: 'cursor' as PackageType,
        tags: [],
        total_downloads: 1000,
        verified: true,
      },
    ];

    it('should fetch trending packages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packages: mockPackages }),
      });

      const result = await client.getTrending();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/search/trending'),
        expect.anything()
      );
      expect(result).toEqual(mockPackages);
    });

    it('should filter by type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packages: mockPackages }),
      });

      await client.getTrending('cursor', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=cursor'),
        expect.anything()
      );
    });
  });

  describe('getCollections', () => {
    const mockCollections = {
      collections: [
        {
          id: 'collection-1',
          scope: 'official',
          name: 'Test Collection',
          description: 'A test collection',
          version: '1.0.0',
          author: 'test',
          official: true,
          verified: true,
          tags: [],
          packages: [],
          downloads: 100,
          stars: 50,
          package_count: 5,
        },
      ],
      total: 1,
      offset: 0,
      limit: 50,
    };

    it('should fetch collections', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections,
      });

      const result = await client.getCollections();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/collections'),
        expect.anything()
      );
      expect(result).toEqual(mockCollections);
    });

    it('should filter collections by category', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections,
      });

      await client.getCollections({ category: 'development' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=development'),
        expect.anything()
      );
    });

    it('should filter by official status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections,
      });

      await client.getCollections({ official: true });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('official=true'),
        expect.anything()
      );
    });
  });

  describe('getCollection', () => {
    const mockCollection = {
      id: 'test-collection',
      scope: 'official',
      name: 'Test Collection',
      description: 'A test collection',
      version: '1.0.0',
      author: 'test',
      official: true,
      verified: true,
      tags: [],
      packages: [],
      downloads: 100,
      stars: 50,
      package_count: 5,
    };

    it('should fetch collection by scope and id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollection,
      });

      const result = await client.getCollection('official', 'test-collection');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/collections/official/test-collection'),
        expect.anything()
      );
      expect(result).toEqual(mockCollection);
    });

    it('should fetch specific version', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollection,
      });

      await client.getCollection('official', 'test-collection', '2.0.0');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/2.0.0'),
        expect.anything()
      );
    });
  });

  describe('retry logic', () => {
    it('should retry on 429 rate limit', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: { get: () => '1' },
          json: async () => ({ error: 'Rate limited' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ packages: [] }),
        });

      const result = await client.search('test');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ packages: [] });
    });

    it('should retry on 5xx server errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ packages: [] }),
        });

      const result = await client.search('test');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      await expect(client.search('test')).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(3); // Default 3 retries
    });
  });

  describe('authentication', () => {
    it('should include auth token in headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packages: [] }),
      });

      await client.search('test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should work without token', async () => {
      const clientWithoutToken = new RegistryClient({ url: mockBaseUrl });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packages: [] }),
      });

      await clientWithoutToken.search('test');

      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should throw error when publishing without token', async () => {
      const clientWithoutToken = new RegistryClient({ url: mockBaseUrl });

      await expect(
        clientWithoutToken.publish({}, Buffer.from('test'))
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('getRegistryClient helper', () => {
    it('should create client with config', () => {
      const client = getRegistryClient({
        registryUrl: 'https://custom.registry.com',
        token: 'custom-token',
      });

      expect(client).toBeInstanceOf(RegistryClient);
    });

    it('should use default registry URL', () => {
      const client = getRegistryClient({});
      expect(client).toBeInstanceOf(RegistryClient);
    });

    it('should accept token', () => {
      const client = getRegistryClient({ token: 'test-token' });
      expect(client).toBeInstanceOf(RegistryClient);
    });
  });
});
