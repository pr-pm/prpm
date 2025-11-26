import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, type MockedFunction, type MockInstance } from 'vitest'; type Mock = ReturnType<typeof vi.fn>;
/**
 * Tests for defaultFormat configuration in install command
 */

import { handleInstall } from '../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { autoDetectFormat, saveFile } from '../core/filesystem';
import { gzipSync } from 'zlib';
import * as tar from 'tar';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock dependencies
vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');
vi.mock('../core/filesystem', async () => {
  const actual = await vi.importActual('../core/filesystem');
  return {
    ...actual,
    autoDetectFormat: vi.fn(),
    saveFile: vi.fn().mockResolvedValue(undefined),
    ensureDirectoryExists: vi.fn().mockResolvedValue(undefined),
    fileExists: vi.fn().mockResolvedValue(false),
  };
});
vi.mock('../core/lockfile', () => ({
  readLockfile: vi.fn().mockResolvedValue(null),
  writeLockfile: vi.fn(),
  createLockfile: vi.fn(() => ({ packages: {} })),
  addToLockfile: vi.fn(),
  setPackageIntegrity: vi.fn(),
  verifyPackageIntegrity: vi.fn(() => true),
  getLockedVersion: vi.fn(() => null),
  getLockfileKey: vi.fn((packageId: string, format?: string) => format ? `${packageId}#${format}` : packageId),
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

describe('install command - defaultFormat config', () => {
  const mockClient = {
    getPackage: vi.fn(),
    getPackageVersion: vi.fn(),
    downloadPackage: vi.fn(),
    trackDownload: vi.fn(),
  };

  const mockPackage = {
    id: 'test-package',
    name: 'Test Package',
    description: 'A test package',
    format: 'cursor',
    subtype: 'rule',
    tags: ['test'],
    total_downloads: 100,
    official: false,
    latest_version: {
      version: '1.0.0',
      tarball_url: 'https://example.com/package.tar.gz',
    },
  };

  beforeEach(() => {
    (getRegistryClient as Mock).mockReturnValue(mockClient);
    mockClient.getPackage.mockResolvedValue(mockPackage);
    mockClient.trackDownload.mockResolvedValue(undefined);

    // Create a simple tarball with test content
    const tmpDir = mkdtempSync(join(tmpdir(), 'test-'));
    const contentFile = join(tmpDir, 'test.md');
    writeFileSync(contentFile, '# Test Content');

    // Mock downloadPackage to return gzipped content
    mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Content'));

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();

    // Mock process.exit to prevent actual exit during tests
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`Process exited with code ${code}`);
    }) as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should use CLI --as flag over config defaultFormat', async () => {
    (getConfig as Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'claude',
    });
    (autoDetectFormat as Mock).mockResolvedValue(null);

    await handleInstall('test-package', { as: 'windsurf' });

    // Should download native format (conversion happens client-side)
    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String)
    );
    // Should convert and save in windsurf format
    expect(saveFile).toHaveBeenCalledWith(
      expect.stringContaining('.windsurf'),
      expect.any(String)
    );
  });

  it('should use config defaultFormat over auto-detected format', async () => {
    (getConfig as Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'cursor',
    });
    (autoDetectFormat as Mock).mockResolvedValue('claude');

    await handleInstall('test-package', {});

    // Should download native format (conversion happens client-side)
    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String)
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Using default format from config: cursor')
    );
    // Should save in cursor format
    expect(saveFile).toHaveBeenCalledWith(
      expect.stringContaining('.cursor'),
      expect.any(String)
    );
  });

  it('should use defaultFormat from config when no CLI flag and no auto-detection', async () => {
    (getConfig as Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'windsurf',
    });
    (autoDetectFormat as Mock).mockResolvedValue(null);

    await handleInstall('test-package', {});

    // Should download native format
    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String)
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Using default format from config: windsurf')
    );
    // Should save in windsurf format
    expect(saveFile).toHaveBeenCalledWith(
      expect.stringContaining('.windsurf'),
      expect.any(String)
    );
  });

  it('should fall back to package native format when no config, CLI flag, or auto-detection', async () => {
    (getConfig as Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      // No defaultFormat in config
    });
    (autoDetectFormat as Mock).mockResolvedValue(null);

    await handleInstall('test-package', {});

    // Should download native format
    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String)
    );
    // Should save in package's native format (cursor)
    expect(saveFile).toHaveBeenCalledWith(
      expect.stringContaining('.cursor'),
      expect.any(String)
    );
  });

  it('should respect defaultFormat for all supported formats', async () => {
    const formats: Array<'cursor' | 'claude' | 'continue' | 'windsurf'> = [
      'cursor',
      'claude',
      'continue',
      'windsurf',
    ];

    for (const format of formats) {
      // Reset mocks between iterations
      vi.clearAllMocks();

      // Re-setup process.exit mock after clearAllMocks
      vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      }) as any);

      // Re-setup console mocks
      vi.spyOn(console, 'log').mockImplementation();
      vi.spyOn(console, 'error').mockImplementation();

      (getConfig as Mock).mockResolvedValue({
        registryUrl: 'https://test-registry.com',
        defaultFormat: format,
      });
      (autoDetectFormat as Mock).mockResolvedValue(null);

      await handleInstall('test-package', {});

      // Should download native format
      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        expect.any(String)
      );
    }
  });

  it('should use defaultFormat from repo .prpmrc over user ~/.prpmrc', async () => {
    // This tests the config merging behavior
    // Repo config should override user config
    (getConfig as Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'windsurf', // This would be from repo .prpmrc
    });
    (autoDetectFormat as Mock).mockResolvedValue(null);

    await handleInstall('test-package', {});

    // Should download native format
    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String)
    );
    // Should save in windsurf format from repo config
    expect(saveFile).toHaveBeenCalledWith(
      expect.stringContaining('.windsurf'),
      expect.any(String)
    );
  });

  it('should display correct console output when using defaultFormat', async () => {
    (getConfig as Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'claude',
    });
    (autoDetectFormat as Mock).mockResolvedValue(null);

    await handleInstall('test-package', {});

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('⚙️  Using default format from config: claude')
    );
  });
});
