import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, type MockedFunction, type MockInstance } from 'vitest'; type Mock = ReturnType<typeof vi.fn>;
/**
 * Tests for Claude hooks installation, tracking, and removal
 */

import { gzipSync } from 'zlib';
import { promises as fs } from 'fs';

// Mock dependencies
vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');

// Mock filesystem module
vi.mock('../core/filesystem');

// Import after mocks are set up
import { handleInstall } from '../commands/install';
import { handleUninstall } from '../commands/uninstall';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { readLockfile, writeLockfile, createLockfile, addToLockfile, removePackage } from '../core/lockfile';

// Import mocked functions
import { saveFile, deleteFile, fileExists, ensureDirectoryExists, getDestinationDir } from '../core/filesystem';

// Cast to jest mocks
const mockSaveFile = saveFile as Mock;
const mockDeleteFile = deleteFile as Mock;
const mockFileExists = fileExists as Mock;
const mockEnsureDirectoryExists = ensureDirectoryExists as Mock;
const mockGetDestinationDir = getDestinationDir as Mock;
vi.mock('../core/lockfile', async () => {
  const actual = await vi.importActual('../core/lockfile');
  return {
    ...actual,
    readLockfile: vi.fn(),
    writeLockfile: vi.fn(),
    addToLockfile: vi.fn(),
    createLockfile: vi.fn(() => ({ packages: {}, version: '1.0.0', lockfileVersion: 1, generated: new Date().toISOString() })),
    setPackageIntegrity: vi.fn(),
    getLockedVersion: vi.fn(() => null),
    removePackage: vi.fn(),
  };
});
vi.mock('../core/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    shutdown: vi.fn(),
  },
}));
// Create shared mock functions for fs.promises
const actualFsPromises = await vi.importActual('fs/promises');
const mockFsReadFile = vi.fn();
const mockFsWriteFile = vi.fn();
const mockFsStat = vi.fn();
const mockFsRm = vi.fn((...args: any[]) => actualFsPromises.rm(...args));
const mockFsUnlink = vi.fn();
const mockFsMkdtemp = vi.fn((...args: any[]) => actualFsPromises.mkdtemp(...args));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    promises: {
      readFile: (...args: any[]) => mockFsReadFile(...args),
      writeFile: (...args: any[]) => mockFsWriteFile(...args),
      stat: (...args: any[]) => mockFsStat(...args),
      rm: (...args: any[]) => mockFsRm(...args),
      unlink: (...args: any[]) => mockFsUnlink(...args),
      mkdtemp: (...args: any[]) => mockFsMkdtemp(...args),
    },
    constants: {
      O_CREAT: 0o100,
      O_TRUNC: 0o1000,
      O_WRONLY: 0o1,
      O_RDONLY: 0o0,
      O_RDWR: 0o2,
    },
  };
});

// Also mock fs/promises module for dynamic imports
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  const mockModule = {
    ...actual,
    readFile: (...args: any[]) => mockFsReadFile(...args),
    writeFile: (...args: any[]) => mockFsWriteFile(...args),
    stat: (...args: any[]) => mockFsStat(...args),
    rm: (...args: any[]) => mockFsRm(...args),
    unlink: (...args: any[]) => mockFsUnlink(...args),
    mkdtemp: (...args: any[]) => mockFsMkdtemp(...args),
  };
  return {
    ...mockModule,
    default: mockModule,
  };
});

describe('Claude Hooks', () => {
  const mockClient = {
    getPackage: vi.fn(),
    getPackageVersion: vi.fn(),
    downloadPackage: vi.fn(),
    trackDownload: vi.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Set up registry and config mocks
    (getRegistryClient as Mock).mockReturnValue(mockClient);
    (getConfig as Mock).mockResolvedValue(mockConfig);

    // Set up lockfile mocks
    (readLockfile as Mock).mockResolvedValue(null);
    (writeLockfile as Mock).mockResolvedValue(undefined);
    (createLockfile as Mock).mockReturnValue({
      version: '1.0.0',
      lockfileVersion: 1,
      packages: {},
      generated: new Date().toISOString()
    });
    (addToLockfile as Mock).mockImplementation(() => {});

    // Set up filesystem mocks with implementations
    mockGetDestinationDir.mockImplementation((format, subtype, name) => {
      if (format === 'claude' && subtype === 'hook') {
        return '.claude';
      }
      return '.claude/skills';
    });
    mockSaveFile.mockResolvedValue(undefined);
    mockFileExists.mockResolvedValue(false);
    mockEnsureDirectoryExists.mockResolvedValue(undefined);
    mockDeleteFile.mockResolvedValue(undefined);

    // Set up client mocks
    mockClient.trackDownload.mockResolvedValue(undefined);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();
    vi.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Installation', () => {
    it('should install Claude hook and merge into settings.json', async () => {
      const mockHookPackage = {
        id: '@author/test-hook',
        name: 'Test Hook',
        description: 'A test hook for PreToolUse',
        format: 'claude',
        subtype: 'hook',
        tags: ['test', 'hook'],
        total_downloads: 10,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/hook.tar.gz',
        },
      };

      const hookConfig = JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Write',
              hooks: [
                {
                  type: 'command',
                  command: 'echo "Pre-write hook"',
                },
              ],
            },
          ],
        },
      });

      mockClient.getPackage.mockResolvedValue(mockHookPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(hookConfig));

      // Mock empty settings.json initially (no existing file)
      mockFileExists.mockResolvedValue(false);

      await handleInstall('@author/test-hook', {});

      // Verify saveFile was called with merged settings
      expect(mockSaveFile).toHaveBeenCalledWith(
        '.claude/settings.json',
        expect.stringContaining('"__prpm_hook_id": "@author/test-hook@1.0.0"')
      );

      // Verify lockfile was updated with hook metadata
      expect(addToLockfile).toHaveBeenCalledWith(
        expect.anything(),
        '@author/test-hook',
        expect.objectContaining({
          format: 'claude',
          subtype: 'hook',
          installedPath: '.claude/settings.json',
          hookMetadata: {
            events: ['PreToolUse'],
            hookId: '@author/test-hook@1.0.0',
          },
        })
      );
    });

    it('should merge hook into existing settings.json', async () => {
      const mockHookPackage = {
        id: '@author/new-hook',
        name: 'New Hook',
        description: 'Another test hook',
        format: 'claude',
        subtype: 'hook',
        tags: ['test'],
        total_downloads: 5,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/hook.tar.gz',
        },
      };

      const newHookConfig = JSON.stringify({
        hooks: {
          PostToolUse: [
            {
              matcher: 'Read',
              hooks: [
                {
                  type: 'command',
                  command: 'echo "Post-read hook"',
                },
              ],
            },
          ],
        },
      });

      const existingSettings = JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Write',
              hooks: [{ type: 'command', command: 'existing' }],
              __prpm_hook_id: '@author/old-hook@1.0.0',
            },
          ],
        },
      });

      mockClient.getPackage.mockResolvedValue(mockHookPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(newHookConfig));

      // Mock existing settings.json file
      mockFileExists.mockResolvedValue(true);
      mockFsReadFile.mockResolvedValue(existingSettings);

      await handleInstall('@author/new-hook', {});

      // Verify both hooks are present
      const savedContent = mockSaveFile.mock.calls[0][1];
      const savedSettings = JSON.parse(savedContent);

      expect(savedSettings.hooks.PreToolUse).toHaveLength(1);
      expect(savedSettings.hooks.PostToolUse).toHaveLength(1);
      expect(savedSettings.hooks.PreToolUse[0].__prpm_hook_id).toBe('@author/old-hook@1.0.0');
      expect(savedSettings.hooks.PostToolUse[0].__prpm_hook_id).toBe('@author/new-hook@1.0.0');
    });

    it('should show informational message for standalone hook install', async () => {
      const mockHookPackage = {
        id: '@author/test-hook',
        name: 'Test Hook',
        description: 'A test hook',
        format: 'claude',
        subtype: 'hook',
        tags: ['test'],
        total_downloads: 10,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/hook.tar.gz',
        },
      };

      const hookConfig = JSON.stringify({
        hooks: {
          PreToolUse: [{ matcher: 'Write', hooks: [{ type: 'command', command: 'echo test' }] }],
        },
      });

      mockClient.getPackage.mockResolvedValue(mockHookPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(hookConfig));

      await handleInstall('@author/test-hook', {});

      // Verify informational message was shown
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Installing Claude Hook'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Hooks execute shell commands automatically'));
    });

    it('should show brief message for collection hook install', async () => {
      const mockHookPackage = {
        id: '@author/collection-hook',
        name: 'Collection Hook',
        description: 'A hook from collection',
        format: 'claude',
        subtype: 'hook',
        tags: ['test'],
        total_downloads: 10,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/hook.tar.gz',
        },
      };

      const hookConfig = JSON.stringify({
        hooks: {
          PreToolUse: [{ matcher: 'Write', hooks: [{ type: 'command', command: 'echo test' }] }],
        },
      });

      mockClient.getPackage.mockResolvedValue(mockHookPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(hookConfig));

      await handleInstall('@author/collection-hook', {
        fromCollection: {
          scope: 'collection',
          name_slug: 'test-collection',
          version: '1.0.0',
        },
      });

      // Verify brief message was shown instead of full warning
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Hook (merges into .claude/settings.json)'));
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Installing Claude Hook'));
    });
  });

  describe('Uninstallation', () => {
    it('should remove hook from settings.json by hookId', async () => {
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Write',
              hooks: [{ type: 'command', command: 'hook1' }],
              __prpm_hook_id: '@author/hook1@1.0.0',
            },
            {
              matcher: 'Read',
              hooks: [{ type: 'command', command: 'hook2' }],
              __prpm_hook_id: '@author/hook2@1.0.0',
            },
          ],
          PostToolUse: [
            {
              matcher: 'Edit',
              hooks: [{ type: 'command', command: 'hook1-post' }],
              __prpm_hook_id: '@author/hook1@1.0.0',
            },
          ],
        },
      };

      const mockPackageInfo = {
        version: '1.0.0',
        resolved: 'https://example.com/hook.tar.gz',
        integrity: 'sha256-abc123',
        format: 'claude',
        subtype: 'hook',
        installedPath: '.claude/settings.json',
        hookMetadata: {
          events: ['PreToolUse', 'PostToolUse'],
          hookId: '@author/hook1@1.0.0',
        },
      };

      // Mock readLockfile for new uninstall flow
      (readLockfile as Mock).mockResolvedValue({
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@author/hook1': mockPackageInfo,
        },
        generated: new Date().toISOString(),
      });

      (removePackage as Mock).mockResolvedValue(mockPackageInfo);
      mockFsReadFile.mockResolvedValue(JSON.stringify(existingSettings));

      await handleUninstall('@author/hook1');

      // Verify settings were updated
      expect(mockFsWriteFile).toHaveBeenCalledWith(
        '.claude/settings.json',
        expect.any(String),
        'utf-8'
      );

      const writtenContent = (mockFsWriteFile as Mock).mock.calls[0][1];
      const updatedSettings = JSON.parse(writtenContent);

      // hook1 should be removed
      expect(updatedSettings.hooks.PreToolUse).toHaveLength(1);
      expect(updatedSettings.hooks.PreToolUse[0].__prpm_hook_id).toBe('@author/hook2@1.0.0');

      // PostToolUse should be completely removed (was only hook1)
      expect(updatedSettings.hooks.PostToolUse).toBeUndefined();
    });

    it('should handle missing settings.json gracefully', async () => {
      const mockPackageInfo = {
        version: '1.0.0',
        resolved: 'https://example.com/hook.tar.gz',
        integrity: 'sha256-abc123',
        format: 'claude',
        subtype: 'hook',
        installedPath: '.claude/settings.json',
        hookMetadata: {
          events: ['PreToolUse'],
          hookId: '@author/missing-hook@1.0.0',
        },
      };

      // Mock readLockfile for new uninstall flow
      (readLockfile as Mock).mockResolvedValue({
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@author/missing-hook': mockPackageInfo,
        },
        generated: new Date().toISOString(),
      });

      (removePackage as Mock).mockResolvedValue(mockPackageInfo);
      mockFsReadFile.mockRejectedValue({ code: 'ENOENT' });

      await handleUninstall('@author/missing-hook');

      // Should warn but not fail
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Settings file not found'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Successfully uninstalled'));
    });

    it('should clean up empty event arrays', async () => {
      const existingSettings = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Write',
              hooks: [{ type: 'command', command: 'only-hook' }],
              __prpm_hook_id: '@author/only-hook@1.0.0',
            },
          ],
          PostToolUse: [
            {
              matcher: 'Read',
              hooks: [{ type: 'command', command: 'other-hook' }],
              __prpm_hook_id: '@author/other-hook@1.0.0',
            },
          ],
        },
      };

      const mockPackageInfo = {
        version: '1.0.0',
        resolved: 'https://example.com/hook.tar.gz',
        integrity: 'sha256-abc123',
        format: 'claude',
        subtype: 'hook',
        installedPath: '.claude/settings.json',
        hookMetadata: {
          events: ['PreToolUse'],
          hookId: '@author/only-hook@1.0.0',
        },
      };

      // Mock readLockfile for new uninstall flow
      (readLockfile as Mock).mockResolvedValue({
        version: '1.0.0',
        lockfileVersion: 1,
        packages: {
          '@author/only-hook': mockPackageInfo,
        },
        generated: new Date().toISOString(),
      });

      (removePackage as Mock).mockResolvedValue(mockPackageInfo);
      mockFsReadFile.mockResolvedValue(JSON.stringify(existingSettings));

      await handleUninstall('@author/only-hook');

      const writtenContent = (mockFsWriteFile as Mock).mock.calls[0][1];
      const updatedSettings = JSON.parse(writtenContent);

      // PreToolUse should be removed entirely (no hooks left)
      expect(updatedSettings.hooks.PreToolUse).toBeUndefined();
      // PostToolUse should still exist
      expect(updatedSettings.hooks.PostToolUse).toHaveLength(1);
    });
  });

  describe('Multiple hooks in same event', () => {
    it('should handle multiple hooks in same event from different packages', async () => {
      const mockHookPackage = {
        id: '@author/second-hook',
        name: 'Second Hook',
        description: 'Another PreToolUse hook',
        format: 'claude',
        subtype: 'hook',
        tags: ['test'],
        total_downloads: 10,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/hook.tar.gz',
        },
      };

      const newHookConfig = JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Edit',
              hooks: [{ type: 'command', command: 'echo "second hook"' }],
            },
          ],
        },
      });

      const existingSettings = JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Write',
              hooks: [{ type: 'command', command: 'echo "first hook"' }],
              __prpm_hook_id: '@author/first-hook@1.0.0',
            },
          ],
        },
      });

      mockClient.getPackage.mockResolvedValue(mockHookPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(newHookConfig));

      // Mock existing settings.json file from first hook
      mockFileExists.mockResolvedValue(true);
      mockFsReadFile.mockResolvedValue(existingSettings);

      await handleInstall('@author/second-hook', {});

      const savedContent = mockSaveFile.mock.calls[0][1];
      const savedSettings = JSON.parse(savedContent);

      // Both hooks should be in PreToolUse
      expect(savedSettings.hooks.PreToolUse).toHaveLength(2);
      expect(savedSettings.hooks.PreToolUse[0].__prpm_hook_id).toBe('@author/first-hook@1.0.0');
      expect(savedSettings.hooks.PreToolUse[1].__prpm_hook_id).toBe('@author/second-hook@1.0.0');
    });
  });
});
