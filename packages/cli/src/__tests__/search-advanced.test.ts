/**
 * Advanced tests for search command - testing new features
 */

import { handleSearch } from '../commands/search';
import { getRegistryClient } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';

// Mock dependencies
jest.mock('@prpm/registry-client');
jest.mock('../core/user-config');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe('search command - advanced features', () => {
  const mockClient = {
    search: jest.fn(),
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

  describe('empty query with type filter', () => {
    it('should allow searching with only --type (no query)', async () => {
      const mockResults = {
        packages: [
          {
            id: 'skill-1',
            description: 'A test skill',
            type: 'claude',
            tags: ['claude-skill'],
            total_downloads: 100,
            verified: true,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('', { type: 'skill' });

      expect(mockClient.search).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          type: 'claude-skill',
        })
      );

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Listing skill packages'));
    });

    it('should reject empty query without type filter', async () => {
      await handleSearch('', {});

      expect(mockClient.search).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Please provide a search query'));
    });

    it('should list all MCPs when using --type mcp', async () => {
      const mockResults = {
        packages: Array(5).fill({
          id: 'mcp-server',
          type: 'generic',
          tags: ['mcp', 'mcp-server'],
          total_downloads: 50,
          verified: false,
        }),
        total: 5,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('', { type: 'mcp' });

      expect(mockClient.search).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          type: 'mcp',
        })
      );
    });
  });

  describe('CLI type mapping', () => {
    it('should map "rule" to cursor type with cursor-rule tag', async () => {
      const mockResults = { packages: [], total: 0, offset: 0, limit: 20 };
      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('react', { type: 'rule' });

      expect(mockClient.search).toHaveBeenCalledWith(
        'react',
        expect.objectContaining({
          type: 'cursor',
          tags: ['cursor-rule'],
        })
      );
    });

    it('should map "skill" to claude-skill type', async () => {
      const mockResults = { packages: [], total: 0, offset: 0, limit: 20 };
      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('python', { type: 'skill' });

      expect(mockClient.search).toHaveBeenCalledWith(
        'python',
        expect.objectContaining({
          type: 'claude-skill',
        })
      );
    });

    it('should map "agent" to claude-agent type', async () => {
      const mockResults = { packages: [], total: 0, offset: 0, limit: 20 };
      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('coding', { type: 'agent' });

      expect(mockClient.search).toHaveBeenCalledWith(
        'coding',
        expect.objectContaining({
          type: 'claude-agent',
        })
      );
    });

    it('should map generic types (plugin, prompt, workflow, tool, template)', async () => {
      const mockResults = { packages: [], total: 0, offset: 0, limit: 20 };
      mockClient.search.mockResolvedValue(mockResults);

      const genericTypes = ['plugin', 'prompt', 'workflow', 'tool', 'template'] as const;

      for (const cliType of genericTypes) {
        mockClient.search.mockClear();
        await handleSearch('test', { type: cliType });

        expect(mockClient.search).toHaveBeenCalledWith(
          'test',
          expect.objectContaining({
            type: 'generic',
            tags: [cliType],
          })
        );
      }
    });
  });

  describe('badge display', () => {
    it('should show ✅ Verified badge for official packages', async () => {
      const mockResults = {
        packages: [
          {
            id: 'official-package',
            name: 'official-package',
            type: 'cursor',
            tags: [],
            total_downloads: 1000,
            verified: true,
            official: true,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);
      await handleSearch('test', {});

      const logCalls = (console.log as jest.Mock).mock.calls;
      const hasVerifiedBadge = logCalls.some(call =>
        call[0] && call[0].includes('✅ Verified')
      );
      expect(hasVerifiedBadge).toBe(true);
    });

    it('should show ✅ Verified badge for verified but not official packages', async () => {
      const mockResults = {
        packages: [
          {
            id: 'verified-package',
            name: 'verified-package',
            type: 'cursor',
            tags: [],
            total_downloads: 500,
            verified: true,
            official: false,
            featured: false,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);
      await handleSearch('test', {});

      const logCalls = (console.log as jest.Mock).mock.calls;
      const hasVerifiedBadge = logCalls.some(call =>
        call[0] && call[0].includes('✅ Verified')
      );
      expect(hasVerifiedBadge).toBe(true);
    });

    it('should show ✅ Verified badge for featured packages', async () => {
      const mockResults = {
        packages: [
          {
            id: 'featured-package',
            name: 'featured-package',
            type: 'cursor',
            tags: [],
            total_downloads: 2000,
            verified: false,
            official: false,
            featured: true,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);
      await handleSearch('test', {});

      const logCalls = (console.log as jest.Mock).mock.calls;
      const hasVerifiedBadge = logCalls.some(call =>
        call[0] && call[0].includes('✅ Verified')
      );
      expect(hasVerifiedBadge).toBe(true);
    });

    it('should show no badges for unverified packages', async () => {
      const mockResults = {
        packages: [
          {
            id: 'regular-package',
            name: 'regular-package',
            type: 'cursor',
            tags: [],
            total_downloads: 100,
            verified: false,
            official: false,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);
      await handleSearch('test', {});

      const logCalls = (console.log as jest.Mock).mock.calls;
      const hasBadge = logCalls.some(call =>
        call[0] && call[0].includes('✅ Verified')
      );
      expect(hasBadge).toBe(false);
    });
  });

  describe('type icons and labels', () => {
    it('should display correct icons for each package type', async () => {
      const mockResults = {
        packages: [
          {
            id: 'test-mcp',
            name: 'test-mcp',
            type: 'mcp',
            tags: ['mcp'],
            total_downloads: 100,
            verified: false,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);
      await handleSearch('test', {});

      const logCalls = (console.log as jest.Mock).mock.calls;
      // Check that the package name appears in output
      const packageLine = logCalls.find(call =>
        call[0] && call[0].includes('test-mcp')
      );

      expect(packageLine).toBeDefined();
      // Check that MCP icon appears in the type line
      const typeLine = logCalls.find(call =>
        call[0] && call[0].includes('🔗')
      );
      expect(typeLine).toBeDefined();
    });
  });

  describe('combined query and type filter', () => {
    it('should search with both query and type filter', async () => {
      const mockResults = {
        packages: [],
        total: 0,
        offset: 0,
        limit: 20,
      };

      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('react', { type: 'rule' });

      expect(mockClient.search).toHaveBeenCalledWith(
        'react',
        expect.objectContaining({
          type: 'cursor',
          tags: ['cursor-rule'],
          limit: 20,
        })
      );

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Searching for "react"'));
    });

    it('should respect custom limit with type filter', async () => {
      const mockResults = {
        packages: [],
        total: 0,
        offset: 0,
        limit: 50,
      };

      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('', { type: 'skill', limit: 50 });

      expect(mockClient.search).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          limit: 50,
        })
      );
    });
  });
});
