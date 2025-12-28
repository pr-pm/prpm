/**
 * Integration tests for snippet package install/uninstall
 */

import { vi, describe, it, expect, beforeEach, afterEach, type MockedFunction, type MockInstance } from 'vitest'; type Mock = ReturnType<typeof vi.fn>;
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleInstall } from '../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile, fileExists } from '../core/filesystem';
import { readLockfile, writeLockfile, addPackage, addToLockfile, createLockfile, getLockedVersion } from '../core/lockfile';
import { gzipSync } from 'zlib';
import { CLIError } from '../core/errors';

// Mock registry client
vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');
vi.mock('../core/filesystem', () => ({
  getDestinationDir: vi.fn(() => '.cursor/rules'),
  ensureDirectoryExists: vi.fn(),
  saveFile: vi.fn(),
  deleteFile: vi.fn(),
  fileExists: vi.fn(() => Promise.resolve(false)),
  generateId: vi.fn((name) => name),
  stripAuthorNamespace: vi.fn((name) => name.split('/').pop() || name),
  autoDetectFormat: vi.fn(() => Promise.resolve('cursor')),
}));
vi.mock('../core/lockfile', () => ({
  readLockfile: vi.fn(),
  writeLockfile: vi.fn(),
  createLockfile: vi.fn(() => ({ packages: {}, lockfileVersion: 1, version: '1.0.0', generated: new Date().toISOString() })),
  addPackage: vi.fn(),
  addToLockfile: vi.fn(),
  getLockedVersion: vi.fn(),
  removePackage: vi.fn(),
  setPackageIntegrity: vi.fn(),
  getLockfileKey: vi.fn((packageId, format) => format ? `${packageId}@${format}` : packageId),
  parseLockfileKey: vi.fn((key) => {
    const parts = key.split('@');
    if (parts.length >= 3) {
      return { packageId: `${parts[0]}@${parts[1]}`, format: parts[2] };
    }
    return { packageId: parts[0], format: parts[1] };
  }),
}));

describe('snippet package installation', () => {
  let testDir: string;
  let originalCwd: string;

  const mockClient = {
    getPackage: vi.fn(),
    getPackageVersion: vi.fn(),
    downloadPackage: vi.fn(),
    trackDownload: vi.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
    defaultFormat: 'cursor',
  };

  beforeEach(async () => {
    // Create temp directory and change to it
    testDir = await fs.mkdtemp(join(tmpdir(), 'prpm-snippet-install-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Reset all mocks
    vi.clearAllMocks();

    // Setup mocks
    (getRegistryClient as Mock).mockReturnValue(mockClient);
    (getConfig as Mock).mockResolvedValue(mockConfig);
    (readLockfile as Mock).mockResolvedValue(null);
    (writeLockfile as Mock).mockResolvedValue(undefined);
    (saveFile as Mock).mockResolvedValue(undefined);
    (addPackage as Mock).mockResolvedValue(undefined);
    (addToLockfile as Mock).mockImplementation(() => {});
    (createLockfile as Mock).mockReturnValue({ packages: {}, lockfileVersion: 1, version: '1.0.0', generated: new Date().toISOString() });
    mockClient.trackDownload.mockResolvedValue(undefined);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();
    vi.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(async () => {
    // Change back to original directory and clean up
    process.chdir(originalCwd);
    await fs.rm(testDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  /**
   * Create a simple gzipped tarball with snippet content
   * The tarball format for PRPM packages is a single content file
   */
  const createSnippetTarball = (content: string): Buffer => {
    // For snippet packages, content is just the raw content
    // The tarball is expected to have a single file
    return gzipSync(content);
  };

  describe('snippet subtype detection', () => {
    it('should identify snippet packages correctly', async () => {
      const mockPackage = {
        id: '@prpm/coding-standards',
        name: 'coding-standards',
        description: 'Coding standards snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: ['snippet', 'standards'],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
        snippet: {
          target: 'AGENTS.md',
          position: 'append',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('# Standards'));

      await handleInstall('@prpm/coding-standards', {});

      // Verify addToLockfile was called with snippet metadata
      expect(addToLockfile).toHaveBeenCalled();
      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].subtype).toBe('snippet');
      expect(lockfileCall[2].snippetMetadata).toBeDefined();
      expect(lockfileCall[2].snippetMetadata.targetPath).toBe('AGENTS.md');
    });

    it('should handle snippet packages without explicit snippet config', async () => {
      const mockPackage = {
        id: '@prpm/simple-snippet',
        name: 'simple-snippet',
        description: 'Simple snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 50,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
        // No snippet config - should use defaults
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Default content'));

      await handleInstall('@prpm/simple-snippet', {});

      // Should default to AGENTS.md
      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].snippetMetadata.targetPath).toBe('AGENTS.md');
    });
  });

  describe('snippet lockfile tracking', () => {
    it('should store snippet metadata in lockfile', async () => {
      const mockPackage = {
        id: '@prpm/test-snippet',
        name: 'test-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 10,
        verified: true,
        latest_version: {
          version: '2.0.0',
          tarball_url: 'https://example.com/test.tar.gz',
        },
        snippet: {
          target: 'CLAUDE.md',
          position: 'prepend',
          header: 'Custom Header',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Test'));

      await handleInstall('@prpm/test-snippet', {});

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      const metadata = lockfileCall[2].snippetMetadata;

      expect(metadata.targetPath).toBe('CLAUDE.md');
      expect(metadata.config.target).toBe('CLAUDE.md');
      expect(metadata.config.position).toBe('prepend');
      expect(metadata.config.header).toBe('Custom Header');
    });

    it('should track version in lockfile', async () => {
      const mockPackage = {
        id: '@prpm/versioned-snippet',
        name: 'versioned-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 5,
        verified: true,
        latest_version: {
          version: '3.2.1',
          tarball_url: 'https://example.com/versioned.tar.gz',
        },
        snippet: {
          target: 'AGENTS.md',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Content'));

      await handleInstall('@prpm/versioned-snippet', {});

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].version).toBe('3.2.1');
    });
  });

  describe('snippet file targets', () => {
    it('should support AGENTS.md as target', async () => {
      const mockPackage = {
        id: '@prpm/agents-snippet',
        name: 'agents-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 1,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/agents.tar.gz',
        },
        snippet: {
          target: 'AGENTS.md',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Agent content'));

      await handleInstall('@prpm/agents-snippet', {});

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].snippetMetadata.targetPath).toBe('AGENTS.md');
    });

    it('should support CLAUDE.md as target', async () => {
      const mockPackage = {
        id: '@prpm/claude-snippet',
        name: 'claude-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 1,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/claude.tar.gz',
        },
        snippet: {
          target: 'CLAUDE.md',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Claude content'));

      await handleInstall('@prpm/claude-snippet', {});

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].snippetMetadata.targetPath).toBe('CLAUDE.md');
    });

    it('should support custom target files', async () => {
      const mockPackage = {
        id: '@prpm/custom-snippet',
        name: 'custom-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 1,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/custom.tar.gz',
        },
        snippet: {
          target: 'CONVENTIONS.md',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Custom content'));

      await handleInstall('@prpm/custom-snippet', {});

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].snippetMetadata.targetPath).toBe('CONVENTIONS.md');
    });
  });

  describe('snippet positions', () => {
    it('should track append position', async () => {
      const mockPackage = {
        id: '@prpm/append-snippet',
        name: 'append-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 1,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/append.tar.gz',
        },
        snippet: {
          target: 'AGENTS.md',
          position: 'append',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Appended'));

      await handleInstall('@prpm/append-snippet', {});

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].snippetMetadata.config.position).toBe('append');
    });

    it('should track prepend position', async () => {
      const mockPackage = {
        id: '@prpm/prepend-snippet',
        name: 'prepend-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 1,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/prepend.tar.gz',
        },
        snippet: {
          target: 'AGENTS.md',
          position: 'prepend',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Prepended'));

      await handleInstall('@prpm/prepend-snippet', {});

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].snippetMetadata.config.position).toBe('prepend');
    });

    it('should track section position', async () => {
      const mockPackage = {
        id: '@prpm/section-snippet',
        name: 'section-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 1,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/section.tar.gz',
        },
        snippet: {
          target: 'AGENTS.md',
          position: 'section:## Tools',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Section content'));

      await handleInstall('@prpm/section-snippet', {});

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].snippetMetadata.config.position).toBe('section:## Tools');
    });
  });

  describe('snippet header', () => {
    it('should track header in metadata', async () => {
      const mockPackage = {
        id: '@prpm/header-snippet',
        name: 'header-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 1,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/header.tar.gz',
        },
        snippet: {
          target: 'AGENTS.md',
          header: 'My Custom Section',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Header content'));

      await handleInstall('@prpm/header-snippet', {});

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].snippetMetadata.config.header).toBe('My Custom Section');
    });

    it('should allow --location to override target file', async () => {
      const mockPackage = {
        id: '@prpm/override-snippet',
        name: 'override-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 10,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/override.tar.gz',
        },
        snippet: {
          target: 'AGENTS.md', // Default target
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Override content'));

      // Use --location to override target to CLAUDE.md
      await handleInstall('@prpm/override-snippet', { location: 'CLAUDE.md' });

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      // The target should be overridden to CLAUDE.md
      expect(lockfileCall[2].snippetMetadata.targetPath).toBe('CLAUDE.md');
    });

    it('should use --location for snippet even with generic format', async () => {
      const mockPackage = {
        id: '@prpm/generic-snippet',
        name: 'generic-snippet',
        format: 'generic',
        subtype: 'snippet',
        tags: [],
        total_downloads: 10,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/generic.tar.gz',
        },
        // No snippet config - should default to AGENTS.md but be overridable
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(createSnippetTarball('Generic content'));

      // Override to custom file
      await handleInstall('@prpm/generic-snippet', { location: 'CONVENTIONS.md' });

      const lockfileCall = (addToLockfile as Mock).mock.calls[0];
      expect(lockfileCall[2].snippetMetadata.targetPath).toBe('CONVENTIONS.md');
    });
  });
});
