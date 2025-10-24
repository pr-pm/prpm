/**
 * End-to-End Tests for Publish Command
 */

import { handlePublish } from '../../commands/publish';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../../core/user-config';
import { createTestDir, cleanupTestDir, createMockPackage } from './test-helpers';
import { writeFile } from 'fs/promises';
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

describe.skip('Publish Command - E2E Tests', () => {
  let testDir: string;
  let originalCwd: string;

  const mockClient = {
    publish: jest.fn(),
  };

  beforeAll(() => {
    originalCwd = process.cwd();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  beforeEach(async () => {
    testDir = await createTestDir();
    process.chdir(testDir);

    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue({
      registryUrl: 'http://localhost:3000',
      token: 'test-token-123',
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestDir(testDir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  describe('Successful Publishing', () => {
    it('should publish a valid package', async () => {
      await createMockPackage(testDir, 'test-package', 'cursor', '1.0.0');

      mockClient.publish.mockResolvedValue({
        package_id: 'test-package-uuid',
        version: '1.0.0',
        message: 'Package published successfully',
      });

      await handlePublish({});

      expect(mockClient.publish).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Package published successfully')
      );
    });

    it('should publish all package types', async () => {
      const types = ['cursor', 'claude', 'continue', 'windsurf', 'generic'];

      for (const type of types) {
        jest.clearAllMocks();
        await cleanupTestDir(testDir);
        testDir = await createTestDir();
        process.chdir(testDir);

        await createMockPackage(testDir, `${type}-package`, type, '1.0.0');

        mockClient.publish.mockResolvedValue({
          package_id: `${type}-package-uuid`,
          version: '1.0.0',
        });

        await handlePublish({});

        expect(mockClient.publish).toHaveBeenCalled();
        const publishCall = mockClient.publish.mock.calls[0];
        const manifest = publishCall[0];
        expect(manifest.type).toBe(type);
      }
    });

    it('should create tarball with correct files', async () => {
      await createMockPackage(testDir, 'test-package', 'cursor');
      await writeFile(join(testDir, 'README.md'), '# Test Package\n');
      await writeFile(join(testDir, 'LICENSE'), 'MIT License\n');

      mockClient.publish.mockResolvedValue({
        package_id: 'test-uuid',
        version: '1.0.0',
      });

      await handlePublish({});

      const publishCall = mockClient.publish.mock.calls[0];
      const tarball = publishCall[1];
      expect(Buffer.isBuffer(tarball)).toBe(true);
      expect(tarball.length).toBeGreaterThan(0);
    });

    it('should include custom files from manifest', async () => {
      const manifestPath = join(testDir, 'prpm.json');
      await writeFile(
        manifestPath,
        JSON.stringify({
          name: 'custom-files-pkg',
          version: '1.0.0',
          description: 'Package with custom files',
          type: 'cursor',
          files: ['prpm.json', '.cursorrules', 'custom-file.txt'],
        })
      );
      await writeFile(join(testDir, '.cursorrules'), '# Rules\n');
      await writeFile(join(testDir, 'custom-file.txt'), 'Custom content\n');

      mockClient.publish.mockResolvedValue({
        package_id: 'custom-uuid',
        version: '1.0.0',
      });

      await handlePublish({});

      expect(mockClient.publish).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should reject package without prpm.json', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('prpm.json not found')
      );

      mockExit.mockRestore();
    });

    it('should validate package name format', async () => {
      const manifestPath = join(testDir, 'prpm.json');
      await writeFile(
        manifestPath,
        JSON.stringify({
          name: 'Invalid_Package_Name',
          version: '1.0.0',
          description: 'Test',
          type: 'cursor',
        })
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Package name must be lowercase')
      );

      mockExit.mockRestore();
    });

    it('should validate version format', async () => {
      const manifestPath = join(testDir, 'prpm.json');
      await writeFile(
        manifestPath,
        JSON.stringify({
          name: 'test-package',
          version: 'invalid-version',
          description: 'Test',
          type: 'cursor',
        })
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Version must be semver format')
      );

      mockExit.mockRestore();
    });

    it('should validate package type', async () => {
      const manifestPath = join(testDir, 'prpm.json');
      await writeFile(
        manifestPath,
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test',
          type: 'invalid-type',
        })
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Type must be one of')
      );

      mockExit.mockRestore();
    });

    it('should reject packages over size limit', async () => {
      await createMockPackage(testDir, 'huge-package', 'cursor');

      // Create a large file (> 10MB)
      const largeContent = Buffer.alloc(11 * 1024 * 1024, 'x');
      await writeFile(join(testDir, 'large-file.txt'), largeContent);

      // Update manifest to include the large file
      const manifest = JSON.parse(await (await import('fs/promises')).readFile(join(testDir, 'prpm.json'), 'utf-8'));
      manifest.files = ['prpm.json', '.cursorrules', 'large-file.txt'];
      await writeFile(join(testDir, 'prpm.json'), JSON.stringify(manifest));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('exceeds 10MB limit')
      );

      mockExit.mockRestore();
    });
  });

  describe('Authentication', () => {
    it('should require authentication token', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
        token: undefined,
      });

      await createMockPackage(testDir, 'test-package', 'cursor');

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication required')
      );

      mockExit.mockRestore();
    });
  });

  describe('Dry Run', () => {
    it('should validate without publishing', async () => {
      await createMockPackage(testDir, 'test-package', 'cursor');

      await handlePublish({ dryRun: true });

      expect(mockClient.publish).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
    });

    it('should show package info in dry run', async () => {
      await createMockPackage(testDir, 'test-package', 'cursor', '2.5.0');

      await handlePublish({ dryRun: true });

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test-package'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2.5.0'));
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      await createMockPackage(testDir, 'test-package', 'cursor');

      mockClient.publish.mockRejectedValue(new Error('Network error'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );

      mockExit.mockRestore();
    });

    it('should handle package already exists error', async () => {
      await createMockPackage(testDir, 'existing-package', 'cursor');

      mockClient.publish.mockRejectedValue(new Error('Package already exists'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Package already exists')
      );

      mockExit.mockRestore();
    });

    it('should handle permission errors', async () => {
      await createMockPackage(testDir, 'test-package', 'cursor');

      mockClient.publish.mockRejectedValue(new Error('Permission denied'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });
  });

  describe('Scoped Packages', () => {
    it('should publish scoped package', async () => {
      const manifestPath = join(testDir, 'prpm.json');
      await writeFile(
        manifestPath,
        JSON.stringify({
          name: '@myorg/test-package',
          version: '1.0.0',
          description: 'Scoped package',
          type: 'cursor',
        })
      );
      await writeFile(join(testDir, '.cursorrules'), '# Rules\n');

      mockClient.publish.mockResolvedValue({
        package_id: 'scoped-uuid',
        version: '1.0.0',
      });

      await handlePublish({});

      expect(mockClient.publish).toHaveBeenCalled();
      const manifest = mockClient.publish.mock.calls[0][0];
      expect(manifest.name).toBe('@myorg/test-package');
    });
  });
});
