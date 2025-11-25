/**
 * Tests for starred command
 */

import { handleStarred } from '../starred';
import type { StarredOptions } from '../starred';
import { getConfig } from '../../core/user-config';

// Mock dependencies
jest.mock('../../core/user-config', () => ({
  getConfig: jest.fn(),
}));

jest.mock('../../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    trackCommand: jest.fn(),
    shutdown: jest.fn(),
  },
}));

jest.mock('@pr-pm/registry-client', () => ({
  getRegistryClient: jest.fn(() => ({})),
}));

// Cast mocks
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

// Mock fetch globally
global.fetch = jest.fn() as any;

describe('starred command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to suppress output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Set up default getConfig mock
    mockGetConfig.mockResolvedValue({
      token: 'test-token',
      registryUrl: 'https://test-registry.prpm.dev',
    } as any);
  });

  describe('handleStarred', () => {
    it('should fetch and display starred packages', async () => {
      const mockPackages = {
        packages: [
          {
            id: 'pkg1',
            name: '@author1/package-1',
            description: 'First package',
            format: 'cursor',
            stars: 10,
            total_downloads: 100,
          },
          {
            id: 'pkg2',
            name: '@author2/package-2',
            description: 'Second package',
            format: 'claude',
            stars: 20,
            total_downloads: 200,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackages,
      });

      const options: StarredOptions = {
        packages: true,
      };

      await handleStarred(options);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-registry.prpm.dev/api/v1/packages/starred?limit=100',
        {
          headers: { Authorization: 'Bearer test-token' },
        }
      );

      expect(console.log).toHaveBeenCalled();
    });

    it('should fetch and display starred collections', async () => {
      const mockCollections = {
        collections: [
          {
            id: 'col1',
            scope: 'collection',
            name_slug: 'test-collection',
            name: 'Test Collection',
            description: 'A test collection',
            stars: 30,
            package_count: 5,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packages: [] }),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections,
      });

      const options: StarredOptions = {};

      await handleStarred(options);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalled();
    });

    it('should filter packages by format', async () => {
      const mockPackages = {
        packages: [
          {
            id: 'pkg1',
            name: '@author1/cursor-package',
            description: 'Cursor package',
            format: 'cursor',
            stars: 10,
            total_downloads: 100,
          },
          {
            id: 'pkg2',
            name: '@author2/claude-package',
            description: 'Claude package',
            format: 'claude',
            stars: 20,
            total_downloads: 200,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackages,
      });

      const options: StarredOptions = {
        packages: true,
        format: 'cursor',
      };

      await handleStarred(options);

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle empty starred list', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packages: [] }),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collections: [] }),
      });

      const options: StarredOptions = {};

      await handleStarred(options);

      expect(console.log).toHaveBeenCalledWith('\nNo starred items found.');
    });

    it('should respect limit option', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packages: [] }),
      });

      const options: StarredOptions = {
        packages: true,
        limit: 50,
      };

      await handleStarred(options);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-registry.prpm.dev/api/v1/packages/starred?limit=50',
        {
          headers: { Authorization: 'Bearer test-token' },
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const options: StarredOptions = {
        packages: true,
      };

      // Should not throw - errors are caught and logged
      await handleStarred(options);

      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should show only packages when --packages flag is used', async () => {
      const mockPackages = {
        packages: [
          {
            id: 'pkg1',
            name: '@author1/package-1',
            description: 'Package',
            format: 'cursor',
            stars: 10,
            total_downloads: 100,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackages,
      });

      const options: StarredOptions = {
        packages: true,
      };

      await handleStarred(options);

      // Should only call packages endpoint, not collections
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should show only collections when --collections flag is used', async () => {
      const mockCollections = {
        collections: [
          {
            id: 'col1',
            scope: 'collection',
            name_slug: 'test-collection',
            name: 'Test Collection',
            description: 'Collection',
            stars: 30,
            package_count: 5,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollections,
      });

      const options: StarredOptions = {
        collections: true,
      };

      await handleStarred(options);

      // Should only call collections endpoint, not packages
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
