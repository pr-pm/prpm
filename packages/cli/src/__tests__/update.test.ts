import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
type Mock = ReturnType<typeof vi.fn>;

/**
 * Tests for update command - format preservation
 */

import { handleUpdate } from '../commands/update';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import {
  listPackages,
  parseLockfileKey,
} from '../core/lockfile';
import { handleInstall } from '../commands/install';

// Mock dependencies
vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');
vi.mock('../commands/install');
vi.mock('../core/lockfile', () => ({
  listPackages: vi.fn(),
  readLockfile: vi.fn(),
  writeLockfile: vi.fn(),
  parseLockfileKey: vi.fn((key: string) => {
    const parts = key.split('#');
    return { packageId: parts[0], format: parts[1] };
  }),
}));
vi.mock('../core/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    shutdown: vi.fn(),
  },
}));

describe('update command', () => {
  const mockClient = {
    getPackage: vi.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  beforeEach(() => {
    (getRegistryClient as Mock).mockReturnValue(mockClient);
    (getConfig as Mock).mockResolvedValue(mockConfig);
    (handleInstall as Mock).mockResolvedValue(undefined);

    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('format preservation', () => {
    it('should always pass format to handleInstall to prevent auto-detection', async () => {
      // Bug: when format === sourceFormat, the old code skipped passing `as`,
      // causing auto-detection which installed to .openskills/ instead of the correct location
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@agent-relay/writing-agent-relay-workflows#claude',
          version: '1.0.2',
          format: 'claude',
          sourceFormat: 'claude', // Same as format - this was the bug trigger
          installedPath: '.claude/skills/writing-agent-relay-workflows/SKILL.md',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: '@agent-relay/writing-agent-relay-workflows',
        latest_version: { version: '1.0.6' },
      });

      await handleUpdate();

      expect(handleInstall).toHaveBeenCalledWith(
        '@agent-relay/writing-agent-relay-workflows@1.0.6',
        { as: 'claude' }
      );
    });

    it('should preserve codex format when updating a converted package', async () => {
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@agent-relay/writing-agent-relay-workflows#codex',
          version: '1.0.2',
          format: 'codex',
          sourceFormat: 'claude',
          installedPath: '.agents/skills/writing-agent-relay-workflows/SKILL.md',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: '@agent-relay/writing-agent-relay-workflows',
        latest_version: { version: '1.0.6' },
      });

      await handleUpdate();

      expect(handleInstall).toHaveBeenCalledWith(
        '@agent-relay/writing-agent-relay-workflows@1.0.6',
        { as: 'codex' }
      );
    });

    it('should fall back to key format for older lockfiles without pkg.format', async () => {
      (listPackages as Mock).mockResolvedValue([
        {
          id: '@scope/my-skill#cursor',
          version: '1.0.0',
          // format is undefined (older lockfile)
          sourceFormat: 'claude',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: '@scope/my-skill',
        latest_version: { version: '1.0.1' },
      });

      await handleUpdate();

      expect(handleInstall).toHaveBeenCalledWith(
        '@scope/my-skill@1.0.1',
        { as: 'cursor' }
      );
    });

    it('should handle packages without any format (allow auto-detect)', async () => {
      (listPackages as Mock).mockResolvedValue([
        {
          id: 'some-package',
          version: '1.0.0',
        },
      ]);

      (parseLockfileKey as Mock).mockReturnValue({
        packageId: 'some-package',
        format: undefined,
      });

      mockClient.getPackage.mockResolvedValue({
        id: 'some-package',
        latest_version: { version: '1.0.1' },
      });

      await handleUpdate();

      expect(handleInstall).toHaveBeenCalledWith(
        'some-package@1.0.1',
        { as: undefined }
      );
    });
  });

  describe('version filtering', () => {
    it('should skip major version updates', async () => {
      (listPackages as Mock).mockResolvedValue([
        {
          id: 'pkg#claude',
          version: '1.0.0',
          format: 'claude',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: 'pkg',
        latest_version: { version: '2.0.0' },
      });

      await handleUpdate();

      expect(handleInstall).not.toHaveBeenCalled();
    });

    it('should update minor versions', async () => {
      (listPackages as Mock).mockResolvedValue([
        {
          id: 'pkg#claude',
          version: '1.0.0',
          format: 'claude',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: 'pkg',
        latest_version: { version: '1.1.0' },
      });

      await handleUpdate();

      expect(handleInstall).toHaveBeenCalledWith(
        'pkg@1.1.0',
        { as: 'claude' }
      );
    });

    it('should skip packages already at latest version', async () => {
      (listPackages as Mock).mockResolvedValue([
        {
          id: 'pkg#claude',
          version: '1.1.0',
          format: 'claude',
        },
      ]);

      mockClient.getPackage.mockResolvedValue({
        id: 'pkg',
        latest_version: { version: '1.1.0' },
      });

      await handleUpdate();

      expect(handleInstall).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should continue updating other packages when one fails', async () => {
      (listPackages as Mock).mockResolvedValue([
        { id: 'pkg1#claude', version: '1.0.0', format: 'claude' },
        { id: 'pkg2#claude', version: '1.0.0', format: 'claude' },
      ]);

      mockClient.getPackage
        .mockResolvedValueOnce({ id: 'pkg1', latest_version: { version: '1.1.0' } })
        .mockResolvedValueOnce({ id: 'pkg2', latest_version: { version: '1.1.0' } });

      (handleInstall as Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      await handleUpdate();

      expect(handleInstall).toHaveBeenCalledTimes(2);
    });
  });
});
