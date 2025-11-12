/**
 * Tests for Claude hooks installation, tracking, and removal
 */

import { handleInstall } from '../commands/install';
import { handleUninstall } from '../commands/uninstall';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile } from '../core/filesystem';
import { readLockfile, writeLockfile, createLockfile, addToLockfile, removePackage } from '../core/lockfile';
import { gzipSync } from 'zlib';
import { promises as fs } from 'fs';

// Mock dependencies
jest.mock('@pr-pm/registry-client');
jest.mock('../core/user-config');
jest.mock('../core/filesystem', () => ({
  getDestinationDir: jest.fn((format, subtype) => {
    if (format === 'claude' && subtype === 'hook') {
      return '.claude';
    }
    return '.claude/skills';
  }),
  ensureDirectoryExists: jest.fn(),
  saveFile: jest.fn(),
  deleteFile: jest.fn(),
  fileExists: jest.fn(() => Promise.resolve(false)),
  generateId: jest.fn((name) => name),
  stripAuthorNamespace: jest.fn((name) => name.split('/').pop() || name),
  autoDetectFormat: jest.fn(() => Promise.resolve('claude')),
}));
jest.mock('../core/lockfile');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn(),
    rm: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('Claude Hooks', () => {
  const mockClient = {
    getPackage: jest.fn(),
    getPackageVersion: jest.fn(),
    downloadPackage: jest.fn(),
    trackDownload: jest.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  beforeEach(() => {
    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue(mockConfig);
    (readLockfile as jest.Mock).mockResolvedValue(null);
    (writeLockfile as jest.Mock).mockResolvedValue(undefined);
    (saveFile as jest.Mock).mockResolvedValue(undefined);
    (createLockfile as jest.Mock).mockReturnValue({
      version: '1.0.0',
      lockfileVersion: 1,
      packages: {},
      generated: new Date().toISOString()
    });
    (addToLockfile as jest.Mock).mockImplementation(() => {});
    mockClient.trackDownload.mockResolvedValue(undefined);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

      // Mock empty settings.json initially
      const { fileExists } = require('../core/filesystem');
      (fileExists as jest.Mock).mockResolvedValue(false);

      await handleInstall('@author/test-hook', {});

      // Verify saveFile was called with merged settings
      expect(saveFile).toHaveBeenCalledWith(
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

      const { fileExists } = require('../core/filesystem');
      (fileExists as jest.Mock).mockResolvedValue(true);
      (fs.readFile as jest.Mock).mockResolvedValue(existingSettings);

      await handleInstall('@author/new-hook', {});

      // Verify both hooks are present
      const savedContent = (saveFile as jest.Mock).mock.calls[0][1];
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

      (removePackage as jest.Mock).mockResolvedValue(mockPackageInfo);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(existingSettings));

      await handleUninstall('@author/hook1');

      // Verify settings were updated
      expect(fs.writeFile).toHaveBeenCalledWith(
        '.claude/settings.json',
        expect.any(String),
        'utf-8'
      );

      const writtenContent = (fs.writeFile as jest.Mock).mock.calls[0][1];
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

      (removePackage as jest.Mock).mockResolvedValue(mockPackageInfo);
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

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

      (removePackage as jest.Mock).mockResolvedValue(mockPackageInfo);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(existingSettings));

      await handleUninstall('@author/only-hook');

      const writtenContent = (fs.writeFile as jest.Mock).mock.calls[0][1];
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

      const { fileExists } = require('../core/filesystem');
      (fileExists as jest.Mock).mockResolvedValue(true);
      (fs.readFile as jest.Mock).mockResolvedValue(existingSettings);

      await handleInstall('@author/second-hook', {});

      const savedContent = (saveFile as jest.Mock).mock.calls[0][1];
      const savedSettings = JSON.parse(savedContent);

      // Both hooks should be in PreToolUse
      expect(savedSettings.hooks.PreToolUse).toHaveLength(2);
      expect(savedSettings.hooks.PreToolUse[0].__prpm_hook_id).toBe('@author/first-hook@1.0.0');
      expect(savedSettings.hooks.PreToolUse[1].__prpm_hook_id).toBe('@author/second-hook@1.0.0');
    });
  });
});
