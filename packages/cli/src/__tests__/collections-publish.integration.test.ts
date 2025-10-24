/**
 * Integration tests for collection publishing with real fixtures
 */

import { handleCollectionPublish } from '../commands/collections';
import { getRegistryClient } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';
import { readFile, mkdir, writeFile, rm, copyFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock dependencies
jest.mock('@prpm/registry-client');
jest.mock('../core/user-config');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe('Collection Publishing - Integration Tests with Fixtures', () => {
  const mockClient = {
    createCollection: jest.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  let testDir: string;
  let originalCwd: string;
  const fixturesDir = join(__dirname, 'fixtures', 'collections');

  beforeAll(() => {
    originalCwd = process.cwd();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    // Mock process.exit to prevent it from terminating the test process
    jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit called with code ${code}`);
    });
  });

  beforeEach(async () => {
    // Create temp directory for test files
    testDir = join(tmpdir(), `prpm-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    process.chdir(testDir);

    // Clear mocks first
    jest.clearAllMocks();

    // Then set up mocks (after clearing)
    (getRegistryClient as jest.Mock).mockReturnValue(mockClient);
    (getConfig as jest.Mock).mockResolvedValue(mockConfig);

    // Re-spy on console methods for each test
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(async () => {
    // Restore working directory before cleanup
    try {
      process.chdir(originalCwd);
    } catch {
      // Ignore errors
    }

    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(() => {
    // Restore original working directory
    try {
      process.chdir(originalCwd);
    } catch {
      // Ignore errors
    }
  });

  describe('Valid Collections', () => {
    it('should publish valid-collection.json fixture', async () => {
      const fixturePath = join(fixturesDir, 'valid-collection.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      const fixtureContent = JSON.parse(await readFile(fixturePath, 'utf-8'));

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-react-essentials',
        scope: 'testuser',
        name_slug: 'react-essentials',
        version: '1.0.0',
        name: 'React Essentials',
        description: fixtureContent.description,
        official: false,
        verified: false,
      });

      await handleCollectionPublish(testPath);

      expect(mockClient.createCollection).toHaveBeenCalledWith({
        id: 'react-essentials',
        name: 'React Essentials',
        description: 'Essential React development packages for modern web applications',
        category: 'development',
        tags: ['react', 'javascript', 'frontend'],
        packages: [
          {
            packageId: 'react-cursor-rules',
            version: '1.0.0',
            required: true,
            reason: 'Core React coding standards and best practices',
          },
          {
            packageId: 'typescript-rules',
            version: '2.1.0',
            required: true,
            reason: 'TypeScript configuration for React projects',
          },
          {
            packageId: 'react-testing-utils',
            version: undefined,
            required: false,
            reason: 'Optional testing utilities for React components',
          },
        ],
        icon: '⚛️',
      });

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ Collection published successfully!'));
    });

    it('should publish minimal-collection.json fixture', async () => {
      const fixturePath = join(fixturesDir, 'minimal-collection.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-minimal',
        scope: 'testuser',
        name_slug: 'minimal',
        version: '1.0.0',
      });

      await handleCollectionPublish(testPath);

      expect(mockClient.createCollection).toHaveBeenCalledWith({
        id: 'minimal',
        name: 'Minimal Collection',
        description: 'A minimal valid collection with only required fields',
        category: undefined,
        tags: undefined,
        packages: [
          {
            packageId: 'single-package',
            version: undefined,
            required: true, // defaults to true
            reason: undefined,
          },
        ],
        icon: undefined,
      });

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ Collection published successfully!'));
    });

    it('should publish complex-collection.json fixture with multiple packages', async () => {
      const fixturePath = join(fixturesDir, 'complex-collection.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      const fixtureContent = JSON.parse(await readFile(fixturePath, 'utf-8'));

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-full-stack',
        scope: 'testuser',
        name_slug: 'full-stack-dev',
        version: '1.0.0',
      });

      await handleCollectionPublish(testPath);

      expect(mockClient.createCollection).toHaveBeenCalled();
      const callArgs = mockClient.createCollection.mock.calls[0][0];

      // Verify structure
      expect(callArgs.id).toBe('full-stack-dev');
      expect(callArgs.name).toBe('Full Stack Development Suite');
      expect(callArgs.packages).toHaveLength(8);

      // Verify required vs optional packages
      const requiredPackages = callArgs.packages.filter((p: any) => p.required);
      const optionalPackages = callArgs.packages.filter((p: any) => !p.required);

      expect(requiredPackages).toHaveLength(4);
      expect(optionalPackages).toHaveLength(4);

      // Verify package order is preserved
      expect(callArgs.packages[0].packageId).toBe('react-cursor-rules');
      expect(callArgs.packages[7].packageId).toBe('monitoring-setup');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Packages: 8'));
    });
  });

  describe('Invalid Collections', () => {
    it('should reject invalid-missing-fields.json fixture', async () => {
      const fixturePath = join(fixturesDir, 'invalid-missing-fields.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Missing required fields')
      );

      mockExit.mockRestore();
    });

    it('should reject invalid-id-format.json fixture', async () => {
      const fixturePath = join(fixturesDir, 'invalid-id-format.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection id must be lowercase alphanumeric')
      );

      mockExit.mockRestore();
    });

    it('should reject invalid-short-name.json fixture', async () => {
      const fixturePath = join(fixturesDir, 'invalid-short-name.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection name must be at least 3 characters')
      );

      mockExit.mockRestore();
    });

    it('should reject invalid-short-description.json fixture', async () => {
      const fixturePath = join(fixturesDir, 'invalid-short-description.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection description must be at least 10 characters')
      );

      mockExit.mockRestore();
    });

    it('should reject invalid-empty-packages.json fixture', async () => {
      const fixturePath = join(fixturesDir, 'invalid-empty-packages.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection must include at least one package')
      );

      mockExit.mockRestore();
    });

    it('should reject invalid-package-missing-id.json fixture', async () => {
      const fixturePath = join(fixturesDir, 'invalid-package-missing-id.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Package at index 0 is missing packageId')
      );

      mockExit.mockRestore();
    });

    it('should reject invalid-json.json fixture', async () => {
      const fixturePath = join(fixturesDir, 'invalid-json.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish collection')
      );

      mockExit.mockRestore();
    });
  });

  describe.skip('Fixture Content Validation', () => {
    it('should verify all valid fixtures have required fields', async () => {
      const validFixtures = [
        'valid-collection.json',
        'minimal-collection.json',
        'complex-collection.json',
      ];

      for (const fixture of validFixtures) {
        const fixturePath = join(fixturesDir, fixture);
        const content = JSON.parse(await readFile(fixturePath, 'utf-8'));

        expect(content).toHaveProperty('id');
        expect(content).toHaveProperty('name');
        expect(content).toHaveProperty('description');
        expect(content).toHaveProperty('packages');
        expect(Array.isArray(content.packages)).toBe(true);
        expect(content.packages.length).toBeGreaterThan(0);
      }
    });

    it('should verify all invalid fixtures fail validation', async () => {
      const invalidFixtures = [
        'invalid-missing-fields.json',
        'invalid-id-format.json',
        'invalid-short-name.json',
        'invalid-short-description.json',
        'invalid-empty-packages.json',
        'invalid-package-missing-id.json',
      ];

      for (const fixture of invalidFixtures) {
        const fixturePath = join(fixturesDir, fixture);
        const testPath = join(testDir, fixture);
        await copyFile(fixturePath, testPath);

        const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
          throw new Error(`Process exited with code ${code}`);
        });

        await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

        mockExit.mockRestore();
      }
    });

    it('should verify fixture package structures', async () => {
      const fixturePath = join(fixturesDir, 'valid-collection.json');
      const content = JSON.parse(await readFile(fixturePath, 'utf-8'));

      // Verify package structure
      content.packages.forEach((pkg: any) => {
        expect(pkg).toHaveProperty('packageId');
        expect(typeof pkg.packageId).toBe('string');

        if (pkg.version !== undefined) {
          expect(typeof pkg.version).toBe('string');
        }

        if (pkg.required !== undefined) {
          expect(typeof pkg.required).toBe('boolean');
        }

        if (pkg.reason !== undefined) {
          expect(typeof pkg.reason).toBe('string');
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle collection with only required packages', async () => {
      const manifest = {
        id: 'required-only',
        name: 'Required Only Collection',
        description: 'Collection with only required packages',
        packages: [
          { packageId: 'pkg1', required: true },
          { packageId: 'pkg2', required: true },
          { packageId: 'pkg3', required: true },
        ],
      };

      const testPath = join(testDir, 'collection.json');
      await writeFile(testPath, JSON.stringify(manifest));

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-required',
        scope: 'testuser',
        name_slug: 'required-only',
        version: '1.0.0',
      });

      await handleCollectionPublish(testPath);

      const callArgs = mockClient.createCollection.mock.calls[0][0];
      expect(callArgs.packages.every((p: any) => p.required)).toBe(true);
    });

    it('should handle collection with only optional packages', async () => {
      const manifest = {
        id: 'optional-only',
        name: 'Optional Only Collection',
        description: 'Collection with only optional packages',
        packages: [
          { packageId: 'pkg1', required: false },
          { packageId: 'pkg2', required: false },
        ],
      };

      const testPath = join(testDir, 'collection.json');
      await writeFile(testPath, JSON.stringify(manifest));

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-optional',
        scope: 'testuser',
        name_slug: 'optional-only',
        version: '1.0.0',
      });

      await handleCollectionPublish(testPath);

      const callArgs = mockClient.createCollection.mock.calls[0][0];
      expect(callArgs.packages.every((p: any) => !p.required)).toBe(true);
    });

    it('should handle collection with mixed required states', async () => {
      const manifest = {
        id: 'mixed-required',
        name: 'Mixed Required Collection',
        description: 'Collection with mixed required and optional packages',
        packages: [
          { packageId: 'pkg1', required: true },
          { packageId: 'pkg2' }, // defaults to true
          { packageId: 'pkg3', required: false },
          { packageId: 'pkg4' }, // defaults to true
        ],
      };

      const testPath = join(testDir, 'collection.json');
      await writeFile(testPath, JSON.stringify(manifest));

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-mixed',
        scope: 'testuser',
        name_slug: 'mixed-required',
        version: '1.0.0',
      });

      await handleCollectionPublish(testPath);

      const callArgs = mockClient.createCollection.mock.calls[0][0];
      expect(callArgs.packages[0].required).toBe(true);
      expect(callArgs.packages[1].required).toBe(true); // default
      expect(callArgs.packages[2].required).toBe(false);
      expect(callArgs.packages[3].required).toBe(true); // default
    });

    it('should handle collection with maximum length fields', async () => {
      const longDescription = 'A'.repeat(500);
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);

      const manifest = {
        id: 'long-fields',
        name: 'Collection with Long Fields',
        description: longDescription,
        tags: manyTags,
        packages: [{ packageId: 'pkg1' }],
      };

      const testPath = join(testDir, 'collection.json');
      await writeFile(testPath, JSON.stringify(manifest));

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-long',
        scope: 'testuser',
        name_slug: 'long-fields',
        version: '1.0.0',
      });

      await handleCollectionPublish(testPath);

      const callArgs = mockClient.createCollection.mock.calls[0][0];
      expect(callArgs.description).toBe(longDescription);
      expect(callArgs.tags).toEqual(manyTags);
    });

    it('should handle special characters in text fields', async () => {
      const manifest = {
        id: 'special-chars',
        name: 'Collection with "Quotes" & Symbols',
        description: 'Description with émojis 🎉, quotes "test", and symbols: @#$%',
        packages: [
          {
            packageId: 'pkg1',
            reason: 'Reason with special chars: "quotes", &lt;html&gt;, emoji 🚀',
          },
        ],
      };

      const testPath = join(testDir, 'collection.json');
      await writeFile(testPath, JSON.stringify(manifest));

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-special',
        scope: 'testuser',
        name_slug: 'special-chars',
        version: '1.0.0',
      });

      await handleCollectionPublish(testPath);

      const callArgs = mockClient.createCollection.mock.calls[0][0];
      expect(callArgs.name).toContain('"Quotes"');
      expect(callArgs.description).toContain('🎉');
      expect(callArgs.packages[0].reason).toContain('🚀');
    });

    it('should preserve package order from manifest', async () => {
      const packages = [
        { packageId: 'zzz-last-alphabetically' },
        { packageId: 'aaa-first-alphabetically' },
        { packageId: 'mmm-middle-alphabetically' },
      ];

      const manifest = {
        id: 'order-test',
        name: 'Package Order Test',
        description: 'Test that package order is preserved',
        packages,
      };

      const testPath = join(testDir, 'collection.json');
      await writeFile(testPath, JSON.stringify(manifest));

      mockClient.createCollection.mockResolvedValue({
        id: 'uuid-order',
        scope: 'testuser',
        name_slug: 'order-test',
        version: '1.0.0',
      });

      await handleCollectionPublish(testPath);

      const callArgs = mockClient.createCollection.mock.calls[0][0];
      expect(callArgs.packages[0].packageId).toBe('zzz-last-alphabetically');
      expect(callArgs.packages[1].packageId).toBe('aaa-first-alphabetically');
      expect(callArgs.packages[2].packageId).toBe('mmm-middle-alphabetically');
    });
  });

  describe('API Error Scenarios', () => {
    it('should handle collection already exists error', async () => {
      const fixturePath = join(fixturesDir, 'valid-collection.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      mockClient.createCollection.mockRejectedValue(
        new Error('Collection already exists with this name')
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Collection already exists')
      );

      mockExit.mockRestore();
    });

    it('should handle network errors', async () => {
      const fixturePath = join(fixturesDir, 'minimal-collection.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      mockClient.createCollection.mockRejectedValue(
        new Error('Network request failed')
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Network request failed')
      );

      mockExit.mockRestore();
    });

    it('should handle package not found errors', async () => {
      const fixturePath = join(fixturesDir, 'valid-collection.json');
      const testPath = join(testDir, 'collection.json');
      await copyFile(fixturePath, testPath);

      mockClient.createCollection.mockRejectedValue(
        new Error('Package not found: react-cursor-rules')
      );

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleCollectionPublish(testPath)).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Package not found')
      );

      mockExit.mockRestore();
    });
  });
});
