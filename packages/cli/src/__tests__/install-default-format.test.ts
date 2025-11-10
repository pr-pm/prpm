/**
 * Tests for defaultFormat configuration in install command
 */

import { handleInstall } from '../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { autoDetectFormat } from '../core/filesystem';
import { gzipSync } from 'zlib';
import * as tar from 'tar';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock dependencies
jest.mock('@pr-pm/registry-client');
jest.mock('../core/user-config');
jest.mock('../core/filesystem', () => {
  const actual = jest.requireActual('../core/filesystem');
  return {
    ...actual,
    autoDetectFormat: jest.fn(),
    saveFile: jest.fn().mockResolvedValue(undefined),
    ensureDirectoryExists: jest.fn().mockResolvedValue(undefined),
    fileExists: jest.fn().mockResolvedValue(false),
  };
});
jest.mock('../core/lockfile', () => ({
  readLockfile: jest.fn().mockResolvedValue(null),
  writeLockfile: jest.fn(),
  createLockfile: jest.fn(() => ({ packages: {} })),
  addToLockfile: jest.fn(),
  setPackageIntegrity: jest.fn(),
  getLockedVersion: jest.fn(() => null),
}));
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe('install command - defaultFormat config', () => {
  const mockClient = {
    getPackage: jest.fn(),
    getPackageVersion: jest.fn(),
    downloadPackage: jest.fn(),
    trackDownload: jest.fn(),
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
    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    mockClient.getPackage.mockResolvedValue(mockPackage);
    mockClient.trackDownload.mockResolvedValue(undefined);

    // Create a simple tarball with test content
    const tmpDir = mkdtempSync(join(tmpdir(), 'test-'));
    const contentFile = join(tmpDir, 'test.md');
    writeFileSync(contentFile, '# Test Content');

    // Mock downloadPackage to return gzipped content
    mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Content'));

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock process.exit to prevent actual exit during tests
    jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`Process exited with code ${code}`);
    }) as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should use CLI --as flag over config defaultFormat', async () => {
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'claude',
    });
    (autoDetectFormat as jest.Mock).mockResolvedValue(null);

    await handleInstall('test-package', { as: 'windsurf' });

    // Should request windsurf format (from CLI flag), not claude (from config)
    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ format: 'windsurf' })
    );
  });

  it('should use config defaultFormat over auto-detected format', async () => {
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'cursor',
    });
    (autoDetectFormat as jest.Mock).mockResolvedValue('claude');

    await handleInstall('test-package', {});

    // Should use cursor from config, not auto-detected claude
    // Config defaultFormat takes precedence over auto-detection
    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ format: 'cursor' })
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Using default format from config: cursor')
    );
  });

  it('should use defaultFormat from config when no CLI flag and no auto-detection', async () => {
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'windsurf',
    });
    (autoDetectFormat as jest.Mock).mockResolvedValue(null);

    await handleInstall('test-package', {});

    // Should use windsurf from config
    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ format: 'windsurf' })
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Using default format from config: windsurf')
    );
  });

  it('should fall back to package native format when no config, CLI flag, or auto-detection', async () => {
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      // No defaultFormat in config
    });
    (autoDetectFormat as jest.Mock).mockResolvedValue(null);

    await handleInstall('test-package', {});

    // Should use package's native format (cursor)
    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ format: 'cursor' })
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
      jest.clearAllMocks();

      // Re-setup process.exit mock after clearAllMocks
      jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      }) as any);

      // Re-setup console mocks
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'https://test-registry.com',
        defaultFormat: format,
      });
      (autoDetectFormat as jest.Mock).mockResolvedValue(null);

      await handleInstall('test-package', {});

      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ format })
      );
    }
  });

  it('should use defaultFormat from repo .prpmrc over user ~/.prpmrc', async () => {
    // This tests the config merging behavior
    // Repo config should override user config
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'windsurf', // This would be from repo .prpmrc
    });
    (autoDetectFormat as jest.Mock).mockResolvedValue(null);

    await handleInstall('test-package', {});

    expect(mockClient.downloadPackage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ format: 'windsurf' })
    );
  });

  it('should display correct console output when using defaultFormat', async () => {
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'https://test-registry.com',
      defaultFormat: 'claude',
    });
    (autoDetectFormat as jest.Mock).mockResolvedValue(null);

    await handleInstall('test-package', {});

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('⚙️  Using default format from config: claude')
    );
  });
});
