/**
 * End-to-End Tests for Search Command
 */

import { handleSearch } from '../../commands/search';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../../core/user-config';
import { createTestDir, cleanupTestDir } from './test-helpers';

// Mock dependencies
jest.mock('@pr-pm/registry-client');
jest.mock('../../core/user-config');
jest.mock('../../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe.skip('Search Command - E2E Tests', () => {
  let testDir: string;
  let originalCwd: string;

  const mockClient = {
    search: jest.fn(),
  };

  beforeAll(() => {
    originalCwd = process.cwd();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  beforeEach(async () => {
    testDir = await createTestDir();
    process.chdir(testDir);

    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'http://localhost:3000',
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestDir(testDir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  describe('Basic Search', () => {
    it('should search for packages by query', async () => {
      const mockResults = {
        packages: [
          {
            id: 'react-cursor',
            name: 'react-cursor',
            description: 'React cursor rules',
            type: 'cursor',
            tags: ['react', 'javascript'],
            total_downloads: 1000,
            verified: true,
          },
          {
            id: 'react-typescript',
            name: 'react-typescript',
            description: 'React TypeScript rules',
            type: 'cursor',
            tags: ['react', 'typescript'],
            total_downloads: 800,
            verified: true,
          },
        ],
        total: 2,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('react', {});

      expect(mockClient.search).toHaveBeenCalledWith('react', expect.any(Object));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('react-cursor'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('react-typescript'));
    });

    it('should handle empty search results', async () => {
      mockClient.search.mockResolvedValue({
        packages: [],
        total: 0,
        offset: 0,
        limit: 20,
      });

      await handleSearch('nonexistent-query-xyz', {});

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No packages found'));
    });

    it('should display package details', async () => {
      const mockResults = {
        packages: [
          {
            id: 'test-pkg',
            name: 'test-pkg',
            description: 'A test package with details',
            type: 'cursor',
            tags: ['test', 'example'],
            total_downloads: 5000,
            verified: true,
            rating_average: 4.5,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('test-pkg', {});

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test-pkg'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('A test package'));
    });
  });

  describe('Filtered Search', () => {
    it('should filter by type', async () => {
      mockClient.search.mockResolvedValue({
        packages: [
          {
            id: 'cursor-pkg',
            name: 'cursor-pkg',
            type: 'cursor',
            tags: [],
            total_downloads: 100,
            verified: false,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      });

      await handleSearch('test', { type: 'cursor' });

      expect(mockClient.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ type: 'cursor' })
      );
    });

    it('should filter by tags', async () => {
      mockClient.search.mockResolvedValue({
        packages: [],
        total: 0,
        offset: 0,
        limit: 20,
      });

      await handleSearch('test', { tags: ['react', 'typescript'] });

      expect(mockClient.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ tags: ['react', 'typescript'] })
      );
    });

    it('should filter by author', async () => {
      mockClient.search.mockResolvedValue({
        packages: [
          {
            id: 'author-pkg',
            name: 'author-pkg',
            type: 'cursor',
            tags: [],
            total_downloads: 100,
            verified: false,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      });

      await handleSearch('test', { author: 'testauthor' });

      expect(mockClient.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ author: 'testauthor' })
      );
    });

    it('should combine multiple filters', async () => {
      mockClient.search.mockResolvedValue({
        packages: [],
        total: 0,
        offset: 0,
        limit: 20,
      });

      await handleSearch('react', {
        type: 'cursor',
        tags: ['javascript'],
        author: 'testauthor',
      });

      expect(mockClient.search).toHaveBeenCalledWith(
        'react',
        expect.objectContaining({
          type: 'cursor',
          tags: ['javascript'],
          author: 'testauthor',
        })
      );
    });
  });

  describe('Pagination', () => {
    it('should support pagination', async () => {
      mockClient.search.mockResolvedValue({
        packages: Array.from({ length: 10 }, (_, i) => ({
          id: `pkg-${i}`,
          name: `pkg-${i}`,
          type: 'cursor',
          tags: [],
          total_downloads: 100 - i,
          verified: false,
        })),
        total: 100,
        offset: 0,
        limit: 10,
      });

      await handleSearch('test', { limit: 10 });

      expect(mockClient.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ limit: 10 })
      );
    });

    it('should handle offset parameter', async () => {
      mockClient.search.mockResolvedValue({
        packages: [],
        total: 100,
        offset: 20,
        limit: 10,
      });

      await handleSearch('test', { limit: 10, offset: 20 });

      expect(mockClient.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ limit: 10, offset: 20 })
      );
    });

    it('should show pagination info', async () => {
      mockClient.search.mockResolvedValue({
        packages: [
          {
            id: 'pkg-1',
            name: 'pkg-1',
            type: 'cursor',
            tags: [],
            total_downloads: 100,
            verified: false,
          },
        ],
        total: 50,
        offset: 0,
        limit: 20,
      });

      await handleSearch('test', {});

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1'));
    });
  });

  describe('Error Handling', () => {
    it('should handle search API errors', async () => {
      mockClient.search.mockRejectedValue(new Error('API unavailable'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleSearch('test', {})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to search')
      );

      mockExit.mockRestore();
    });

    it('should handle network errors', async () => {
      mockClient.search.mockRejectedValue(new Error('Network error'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleSearch('test', {})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should handle rate limiting', async () => {
      mockClient.search.mockRejectedValue(new Error('Rate limit exceeded'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleSearch('test', {})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });
  });

  describe('Result Formatting', () => {
    it('should format verified packages', async () => {
      mockClient.search.mockResolvedValue({
        packages: [
          {
            id: 'verified-pkg',
            name: 'verified-pkg',
            type: 'cursor',
            tags: [],
            total_downloads: 10000,
            verified: true,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      });

      await handleSearch('verified', {});

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('verified-pkg'));
    });

    it('should show download counts', async () => {
      mockClient.search.mockResolvedValue({
        packages: [
          {
            id: 'popular-pkg',
            name: 'popular-pkg',
            type: 'cursor',
            tags: [],
            total_downloads: 50000,
            verified: false,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      });

      await handleSearch('popular', {});

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('50'));
    });

    it('should display tags', async () => {
      mockClient.search.mockResolvedValue({
        packages: [
          {
            id: 'tagged-pkg',
            name: 'tagged-pkg',
            type: 'cursor',
            tags: ['react', 'typescript', 'testing'],
            total_downloads: 1000,
            verified: false,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      });

      await handleSearch('tagged', {});

      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Package Types', () => {
    const packageTypes = ['cursor', 'claude', 'continue', 'windsurf', 'generic'];

    packageTypes.forEach(type => {
      it(`should search for ${type} packages`, async () => {
        mockClient.search.mockResolvedValue({
          packages: [
            {
              id: `${type}-pkg`,
              name: `${type}-pkg`,
              type,
              tags: [],
              total_downloads: 100,
              verified: false,
            },
          ],
          total: 1,
          offset: 0,
          limit: 20,
        });

        await handleSearch('test', { type: type as any });

        expect(mockClient.search).toHaveBeenCalledWith(
          'test',
          expect.objectContaining({ type })
        );
      });
    });
  });
});
