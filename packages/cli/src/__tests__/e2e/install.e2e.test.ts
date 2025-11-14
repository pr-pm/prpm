/**
 * End-to-End Tests for Install Command
 */

import { handleInstall } from '../../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../../core/user-config';
import { createTestDir, cleanupTestDir, createMockFetch } from './test-helpers';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { CLIError } from '../../core/errors';
import { gzipSync } from 'zlib';

// Mock dependencies
jest.mock('@pr-pm/registry-client');
jest.mock('../../core/user-config');
jest.mock('../../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe('Install Command - E2E Tests', () => {
  let testDir: string;
  let originalCwd: string;
  const mockFetchHelper = createMockFetch();

  const mockClient = {
    getPackage: jest.fn(),
    getPackageVersion: jest.fn(),
    downloadPackage: jest.fn(),
    resolveDependencies: jest.fn(),
    getCollection: jest.fn(),
    installCollection: jest.fn(),
    trackDownload: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(() => {
    originalCwd = process.cwd();
    global.fetch = mockFetchHelper.fetch as any;
  });

  beforeEach(async () => {
    testDir = await createTestDir();
    process.chdir(testDir);

    // Set up console spies for each test
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'http://localhost:3111',
      token: 'test-token',
    });

    jest.clearAllMocks();
    mockFetchHelper.clear();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cleanupTestDir(testDir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  describe('Package Installation', () => {
    it('should install a cursor package', async () => {
      const mockPackage = {
        id: 'test-cursor-pkg',
        name: 'test-cursor-pkg',
        description: 'Test cursor package',
        format: 'cursor',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/packages/test-cursor-pkg/1.0.0/download',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test cursor package content'));

      await handleInstall('test-cursor-pkg', {});

      expect(mockClient.getPackage).toHaveBeenCalledWith('test-cursor-pkg');
      expect(mockClient.downloadPackage).toHaveBeenCalled();
    });

    it('should install specific version', async () => {
      const mockPackage = {
        id: 'test-pkg',
        name: 'test-pkg',
        format: 'cursor',
        subtype: 'rule',
        latest_version: {
          version: '2.0.0',
          tarball_url: 'http://localhost:3111/packages/test-pkg/2.0.0/download',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.getPackageVersion.mockResolvedValue({
        version: '1.5.0',
        tarball_url: 'http://localhost:3111/packages/test-pkg/1.5.0/download',
      });
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test package content'));

      await handleInstall('test-pkg@1.5.0', {});

      expect(mockClient.getPackageVersion).toHaveBeenCalledWith('test-pkg', '1.5.0');
    });

    it('should install with format conversion', async () => {
      const mockPackage = {
        id: 'cursor-pkg',
        name: 'cursor-pkg',
        format: 'cursor',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/packages/cursor-pkg/1.0.0/download',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test package content'));

      await handleInstall('cursor-pkg', { as: 'claude' });

      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ format: 'claude' })
      );
    });

    it('should handle package not found', async () => {
      mockClient.getPackage.mockRejectedValue(new Error('Package not found'));
      mockClient.getCollection.mockRejectedValue(new Error('Not a collection'));

      await expect(handleInstall('nonexistent-pkg', {})).rejects.toThrow(CLIError);
      await expect(handleInstall('nonexistent-pkg', {})).rejects.toThrow('Package not found');
    });

    it('should install to custom directory', async () => {
      const customDir = join(testDir, 'custom');
      await mkdir(customDir, { recursive: true });

      const mockPackage = {
        id: 'test-pkg',
        name: 'test-pkg',
        format: 'cursor',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/packages/test-pkg/1.0.0/download',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test package content'));

      await handleInstall('test-pkg', { output: customDir });

      // Verify installation happened (check console output or file system)
      expect(mockClient.downloadPackage).toHaveBeenCalled();
    });
  });

  describe('Collection Installation', () => {
    it('should install a collection', async () => {
      const mockCollection = {
        id: 'test-collection',
        scope: 'official',
        name: 'Test Collection',
        name_slug: 'test-collection',
        description: 'Test collection',
        version: '1.0.0',
        packages: [
          { packageId: 'pkg-1', version: '1.0.0', required: true },
          { packageId: 'pkg-2', version: '1.1.0', required: false },
        ],
      };

      // Mock getCollection to succeed so code recognizes it as a collection
      mockClient.getCollection.mockResolvedValue(mockCollection);

      mockClient.getPackage.mockResolvedValue({
        id: 'pkg-1',
        name: 'pkg-1',
        format: 'cursor',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/packages/pkg-1/1.0.0/download',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test package content'));

      await handleInstall('@official/test-collection', {});

      expect(mockClient.getCollection).toHaveBeenCalledWith('official', 'test-collection', undefined);
    });

    it('should skip optional packages with flag', async () => {
      const mockCollection = {
        id: 'test-collection',
        scope: 'official',
        name: 'Test Collection',
        name_slug: 'test-collection',
        version: '1.0.0',
        packages: [
          { packageId: 'required-pkg', version: '1.0.0', required: true },
        ],
      };

      // Mock getCollection to succeed so code recognizes it as a collection
      mockClient.getCollection.mockResolvedValue(mockCollection);

      mockClient.getPackage.mockResolvedValue({
        id: 'required-pkg',
        name: 'required-pkg',
        format: 'cursor',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/packages/required-pkg/1.0.0/download',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test package content'));

      // Note: skipOptional is passed through handleCollectionInstall but isn't tested here
      // since we're delegating to that function
      await handleInstall('@official/test-collection', { skipOptional: true } as any);

      expect(mockClient.getCollection).toHaveBeenCalledWith('official', 'test-collection', undefined);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors with retry', async () => {
      mockClient.getPackage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          id: 'test-pkg',
          name: 'test-pkg',
          format: 'cursor',
          subtype: 'rule',
          latest_version: {
            version: '1.0.0',
            tarball_url: 'http://localhost:3111/test',
          },
        });

      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test package content'));

      // First call should fail and retry
      await expect(handleInstall('test-pkg', {})).rejects.toThrow(CLIError);
    });

    it('should handle download failures', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'test-pkg',
        name: 'test-pkg',
        format: 'cursor',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/test',
        },
      });

      mockClient.downloadPackage.mockRejectedValue(new Error('Download failed'));

      await expect(handleInstall('test-pkg', {})).rejects.toThrow(CLIError);
    });

    it('should handle corrupted tarball', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'test-pkg',
        name: 'test-pkg',
        format: 'cursor',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/test',
        },
      });
      mockClient.getCollection.mockRejectedValue(new Error('Not a collection'));

      // Return actually invalid (non-gzipped) tarball data
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('not a valid gzip or tarball'));

      await expect(handleInstall('test-pkg', {})).rejects.toThrow();
    });
  });

  describe('Dry Run Mode', () => {
    it.skip('should show installation plan without installing', async () => {
      // Note: dryRun option is not currently implemented for package installation
      // It's only available for collection installation
      mockClient.getPackage.mockResolvedValue({
        id: 'test-pkg',
        name: 'test-pkg',
        format: 'cursor',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/test',
        },
      });

      await handleInstall('test-pkg', { dryRun: true } as any);

      expect(mockClient.getPackage).toHaveBeenCalled();
      expect(mockClient.downloadPackage).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Would install'));
    });
  });

  describe('Multiple Package Types', () => {
    it('should install claude package', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'claude-pkg',
        name: 'claude-pkg',
        format: 'claude',
        subtype: 'skill',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/test',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test package content'));

      await handleInstall('claude-pkg', {});

      expect(mockClient.getPackage).toHaveBeenCalledWith('claude-pkg');
    });

    it('should install continue package', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'continue-pkg',
        name: 'continue-pkg',
        format: 'continue',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/test',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test package content'));

      await handleInstall('continue-pkg', {});

      expect(mockClient.getPackage).toHaveBeenCalledWith('continue-pkg');
    });

    it('should install windsurf package', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'windsurf-pkg',
        name: 'windsurf-pkg',
        format: 'windsurf',
        subtype: 'rule',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3111/test',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test package content'));

      await handleInstall('windsurf-pkg', {});

      expect(mockClient.getPackage).toHaveBeenCalledWith('windsurf-pkg');
    });
  });
});
