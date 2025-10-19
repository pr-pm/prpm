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
            display_name: 'Test Skill',
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
          type: 'claude',
          tags: ['claude-skill'],
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
          display_name: 'MCP Server',
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
          type: 'generic',
          tags: ['mcp', 'mcp-server'],
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

    it('should map "skill" to claude type with claude-skill tag', async () => {
      const mockResults = { packages: [], total: 0, offset: 0, limit: 20 };
      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('python', { type: 'skill' });

      expect(mockClient.search).toHaveBeenCalledWith(
        'python',
        expect.objectContaining({
          type: 'claude',
          tags: ['claude-skill'],
        })
      );
    });

    it('should map "agent" to claude type without tags', async () => {
      const mockResults = { packages: [], total: 0, offset: 0, limit: 20 };
      mockClient.search.mockResolvedValue(mockResults);

      await handleSearch('coding', { type: 'agent' });

      expect(mockClient.search).toHaveBeenCalledWith(
        'coding',
        expect.objectContaining({
          type: 'claude',
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
    it('should show [Official] badge for official packages', async () => {
      const mockResults = {
        packages: [
          {
            id: 'official-package',
            display_name: 'Official Package',
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
      const hasOfficialBadge = logCalls.some(call =>
        call[0] && call[0].includes('[Official]')
      );
      expect(hasOfficialBadge).toBe(true);
    });

    it('should show [Verified] badge for verified but not official packages', async () => {
      const mockResults = {
        packages: [
          {
            id: 'verified-package',
            display_name: 'Verified Package',
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
        call[0] && call[0].includes('[Verified]')
      );
      expect(hasVerifiedBadge).toBe(true);
    });

    it('should prioritize Official over Verified badge', async () => {
      const mockResults = {
        packages: [
          {
            id: 'official-verified-package',
            display_name: 'Official and Verified',
            type: 'cursor',
            tags: [],
            total_downloads: 2000,
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
      const hasOfficialBadge = logCalls.some(call =>
        call[0] && call[0].includes('[Official]')
      );
      const hasOnlyVerifiedBadge = logCalls.some(call =>
        call[0] && call[0].includes('[Verified]') && !call[0].includes('[Official]')
      );

      expect(hasOfficialBadge).toBe(true);
      expect(hasOnlyVerifiedBadge).toBe(false);
    });

    it('should show no badges for unverified packages', async () => {
      const mockResults = {
        packages: [
          {
            id: 'regular-package',
            display_name: 'Regular Package',
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
        call[0] && (call[0].includes('[Official]') || call[0].includes('[Verified]'))
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
            display_name: 'MCP Server',
            type: 'generic',
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
      const packageLine = logCalls.find(call =>
        call[0] && call[0].includes('📦 test-mcp')
      );

      expect(packageLine).toBeDefined();
      expect(packageLine[0]).toContain('📦'); // Package ID line
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
