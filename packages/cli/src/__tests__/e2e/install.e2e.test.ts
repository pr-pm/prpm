/**
 * End-to-End Tests for Install Command
 */

import { handleInstall } from '../../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../../core/user-config';
import { createTestDir, cleanupTestDir, createMockFetch, mockProcessExit } from './test-helpers';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

// Mock dependencies
jest.mock('@pr-pm/registry-client');
jest.mock('../../core/user-config');
jest.mock('../../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe.skip('Install Command - E2E Tests', () => {
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
  };

  beforeAll(() => {
    originalCwd = process.cwd();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    global.fetch = mockFetchHelper.fetch as any;
  });

  beforeEach(async () => {
    testDir = await createTestDir();
    process.chdir(testDir);

    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'http://localhost:3000',
      token: 'test-token',
    });

    jest.clearAllMocks();
    mockFetchHelper.clear();
  });

  afterEach(async () => {
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
        type: 'cursor',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/packages/test-cursor-pkg/1.0.0/download',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-tarball-data'));

      await handleInstall('test-cursor-pkg', {});

      expect(mockClient.getPackage).toHaveBeenCalledWith('test-cursor-pkg');
      expect(mockClient.downloadPackage).toHaveBeenCalled();
    });

    it('should install specific version', async () => {
      const mockPackage = {
        id: 'test-pkg',
        name: 'test-pkg',
        type: 'cursor',
        latest_version: {
          version: '2.0.0',
          tarball_url: 'http://localhost:3000/packages/test-pkg/2.0.0/download',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.getPackageVersion.mockResolvedValue({
        version: '1.5.0',
        tarball_url: 'http://localhost:3000/packages/test-pkg/1.5.0/download',
      });
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-data'));

      await handleInstall('test-pkg@1.5.0', {});

      expect(mockClient.getPackageVersion).toHaveBeenCalledWith('test-pkg', '1.5.0');
    });

    it('should install with format conversion', async () => {
      const mockPackage = {
        id: 'cursor-pkg',
        name: 'cursor-pkg',
        type: 'cursor',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/packages/cursor-pkg/1.0.0/download',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-data'));

      await handleInstall('cursor-pkg', { as: 'claude' });

      expect(mockClient.downloadPackage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ format: 'claude' })
      );
    });

    it('should handle package not found', async () => {
      mockClient.getPackage.mockRejectedValue(new Error('Package not found'));

      const mockExit = mockProcessExit();

      await expect(handleInstall('nonexistent-pkg', {})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Package not found')
      );

      mockExit.mockRestore();
    });

    it('should install to custom directory', async () => {
      const customDir = join(testDir, 'custom');
      await mkdir(customDir, { recursive: true });

      const mockPackage = {
        id: 'test-pkg',
        name: 'test-pkg',
        type: 'cursor',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/packages/test-pkg/1.0.0/download',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-data'));

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
        description: 'Test collection',
        version: '1.0.0',
        packages: [
          { packageId: 'pkg-1', version: '1.0.0', required: true },
          { packageId: 'pkg-2', version: '1.1.0', required: false },
        ],
      };

      const mockInstallPlan = {
        collection: mockCollection,
        packagesToInstall: [
          { packageId: 'pkg-1', version: '1.0.0', format: 'cursor', required: true },
          { packageId: 'pkg-2', version: '1.1.0', format: 'cursor', required: false },
        ],
      };

      mockClient.installCollection.mockResolvedValue(mockInstallPlan);
      mockClient.getPackage.mockResolvedValue({
        id: 'pkg-1',
        name: 'pkg-1',
        type: 'cursor',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/packages/pkg-1/1.0.0/download',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-data'));

      await handleInstall('@official/test-collection', {});

      expect(mockClient.installCollection).toHaveBeenCalled();
    });

    it('should skip optional packages with flag', async () => {
      const mockCollection = {
        id: 'test-collection',
        scope: 'official',
        name: 'Test Collection',
        version: '1.0.0',
        packages: [
          { packageId: 'required-pkg', required: true },
        ],
      };

      const mockInstallPlan = {
        collection: mockCollection,
        packagesToInstall: [
          { packageId: 'required-pkg', version: '1.0.0', format: 'cursor', required: true },
        ],
      };

      mockClient.installCollection.mockResolvedValue(mockInstallPlan);
      mockClient.getPackage.mockResolvedValue({
        id: 'required-pkg',
        name: 'required-pkg',
        type: 'cursor',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/packages/required-pkg/1.0.0/download',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-data'));

      await handleInstall('@official/test-collection', { skipOptional: true });

      expect(mockClient.installCollection).toHaveBeenCalledWith(
        expect.objectContaining({ skipOptional: true })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors with retry', async () => {
      mockClient.getPackage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          id: 'test-pkg',
          name: 'test-pkg',
          type: 'cursor',
          latest_version: {
            version: '1.0.0',
            tarball_url: 'http://localhost:3000/test',
          },
        });

      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-data'));

      // First call should fail and retry
      const mockExit = mockProcessExit();

      await expect(handleInstall('test-pkg', {})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should handle download failures', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'test-pkg',
        name: 'test-pkg',
        type: 'cursor',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/test',
        },
      });

      mockClient.downloadPackage.mockRejectedValue(new Error('Download failed'));

      const mockExit = mockProcessExit();

      await expect(handleInstall('test-pkg', {})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should handle corrupted tarball', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'test-pkg',
        name: 'test-pkg',
        type: 'cursor',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/test',
        },
      });

      // Return invalid tarball data
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('invalid-tarball'));

      const mockExit = mockProcessExit();

      await expect(handleInstall('test-pkg', {})).rejects.toThrow();

      mockExit.mockRestore();
    });
  });

  describe('Dry Run Mode', () => {
    it('should show installation plan without installing', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'test-pkg',
        name: 'test-pkg',
        type: 'cursor',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/test',
        },
      });

      await handleInstall('test-pkg', { dryRun: true });

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
        type: 'claude',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/test',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-data'));

      await handleInstall('claude-pkg', {});

      expect(mockClient.getPackage).toHaveBeenCalledWith('claude-pkg');
    });

    it('should install continue package', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'continue-pkg',
        name: 'continue-pkg',
        type: 'continue',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/test',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-data'));

      await handleInstall('continue-pkg', {});

      expect(mockClient.getPackage).toHaveBeenCalledWith('continue-pkg');
    });

    it('should install windsurf package', async () => {
      mockClient.getPackage.mockResolvedValue({
        id: 'windsurf-pkg',
        name: 'windsurf-pkg',
        type: 'windsurf',
        latest_version: {
          version: '1.0.0',
          tarball_url: 'http://localhost:3000/test',
        },
      });
      mockClient.downloadPackage.mockResolvedValue(Buffer.from('test-data'));

      await handleInstall('windsurf-pkg', {});

      expect(mockClient.getPackage).toHaveBeenCalledWith('windsurf-pkg');
    });
  });
});
