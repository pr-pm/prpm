/**
 * Tests for package publishing flow
 */

import { handlePublish } from '../commands/publish';
import { getRegistryClient } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { readFile, writeFile, mkdir } from 'fs/promises';
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

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockGetRegistryClient = getRegistryClient as jest.MockedFunction<typeof getRegistryClient>;

describe('Publish Command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeAll(() => {
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  beforeEach(async () => {
    // Create test directory
    testDir = join(tmpdir(), `prpm-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Mock config
    mockGetConfig.mockResolvedValue({
      token: 'test-token',
      registryUrl: 'http://localhost:3000',
    });

    // Clear mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
  });

  describe('Manifest Validation', () => {
    it('should require prpm.json to exist', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should validate required fields', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          // missing version, description, type
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should validate package name format', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'Invalid_Package_Name',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should validate version format', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: 'invalid',
          description: 'Test package',
          type: 'cursor',
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should validate package type', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'invalid-type',
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should accept valid manifest', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
        })
      );

      await writeFile(join(testDir, '.cursorrules'), '# Test rules');

      const mockPublish = jest.fn().mockResolvedValue({
        package_id: 'test-package',
        version: '1.0.0',
      });

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({});

      expect(mockPublish).toHaveBeenCalled();
    });
  });

  describe('Authentication', () => {
    it('should require authentication token', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      mockGetConfig.mockResolvedValue({
        token: undefined,
        registryUrl: 'http://localhost:3000',
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should pass token to registry client', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
        })
      );

      await writeFile(join(testDir, '.cursorrules'), '# Test');

      const mockPublish = jest.fn().mockResolvedValue({
        package_id: 'test-package',
        version: '1.0.0',
      });

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({});

      expect(mockGetRegistryClient).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test-token',
        })
      );
    });
  });

  describe('Tarball Creation', () => {
    it('should include default files in tarball', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
        })
      );

      await writeFile(join(testDir, '.cursorrules'), '# Cursor rules');
      await writeFile(join(testDir, 'README.md'), '# README');

      const mockPublish = jest.fn().mockResolvedValue({
        package_id: 'test-package',
        version: '1.0.0',
      });

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({});

      expect(mockPublish).toHaveBeenCalled();
      const tarballArg = mockPublish.mock.calls[0][1];
      expect(tarballArg).toBeInstanceOf(Buffer);
      expect(tarballArg.length).toBeGreaterThan(0);
    });

    it('should respect manifest.files list', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
          files: ['prpm.json', 'custom-file.txt'],
        })
      );

      await writeFile(join(testDir, 'custom-file.txt'), 'Custom content');

      const mockPublish = jest.fn().mockResolvedValue({
        package_id: 'test-package',
        version: '1.0.0',
      });

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({});

      expect(mockPublish).toHaveBeenCalled();
    });

    it('should reject packages over 10MB', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
          files: ['prpm.json', 'large-file.txt'],
        })
      );

      // Create a file > 10MB
      const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
      await writeFile(join(testDir, 'large-file.txt'), largeContent);

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });

    it('should fail if no files to include', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
          files: ['non-existent.txt'],
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });
  });

  describe('Dry Run', () => {
    it('should validate without publishing', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
        })
      );

      await writeFile(join(testDir, '.cursorrules'), '# Test');

      const mockPublish = jest.fn();
      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({ dryRun: true });

      expect(mockPublish).not.toHaveBeenCalled();
      expect(telemetry.track).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'publish',
          success: true,
          data: expect.objectContaining({
            dryRun: true,
          }),
        })
      );
    });
  });

  describe('Publishing', () => {
    it('should successfully publish package', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
          author: 'test-author',
          license: 'MIT',
        })
      );

      await writeFile(join(testDir, '.cursorrules'), '# Test rules');
      await writeFile(join(testDir, 'README.md'), '# Test README');

      const mockPublish = jest.fn().mockResolvedValue({
        package_id: 'test-package',
        version: '1.0.0',
        message: 'Package published successfully',
      });

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({});

      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
        }),
        expect.any(Buffer)
      );

      expect(telemetry.track).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'publish',
          success: true,
          data: expect.objectContaining({
            packageName: 'test-package',
            version: '1.0.0',
          }),
        })
      );
    });

    it('should handle publish errors', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
        })
      );

      await writeFile(join(testDir, '.cursorrules'), '# Test');

      const mockPublish = jest.fn().mockRejectedValue(new Error('Package already exists'));

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(telemetry.track).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'publish',
          success: false,
          error: 'Package already exists',
        })
      );

      mockExit.mockRestore();
    });
  });

  describe('Package Types', () => {
    const packageTypes = ['cursor', 'claude', 'continue', 'windsurf', 'generic'];

    packageTypes.forEach((type) => {
      it(`should publish ${type} package`, async () => {
        await writeFile(
          join(testDir, 'prpm.json'),
          JSON.stringify({
            name: `test-${type}-package`,
            version: '1.0.0',
            description: `Test ${type} package`,
            type,
          })
        );

        // Create type-specific file
        const typeFiles: Record<string, string> = {
          cursor: '.cursorrules',
          claude: '.clinerules',
          continue: '.continuerc.json',
          windsurf: '.windsurfrules',
          generic: 'README.md',
        };

        await writeFile(join(testDir, typeFiles[type]), `# Test ${type}`);

        const mockPublish = jest.fn().mockResolvedValue({
          package_id: `test-${type}-package`,
          version: '1.0.0',
        });

        mockGetRegistryClient.mockReturnValue({
          publish: mockPublish,
        } as any);

        await handlePublish({});

        expect(mockPublish).toHaveBeenCalledWith(
          expect.objectContaining({
            type,
          }),
          expect.any(Buffer)
        );
      });
    });
  });

  describe('Scoped Packages', () => {
    it('should publish scoped package', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: '@myorg/test-package',
          version: '1.0.0',
          description: 'Test scoped package',
          type: 'cursor',
        })
      );

      await writeFile(join(testDir, '.cursorrules'), '# Test');

      const mockPublish = jest.fn().mockResolvedValue({
        package_id: '@myorg/test-package',
        version: '1.0.0',
      });

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({});

      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '@myorg/test-package',
        }),
        expect.any(Buffer)
      );
    });
  });

  describe('Telemetry', () => {
    it('should track successful publish', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
        })
      );

      await writeFile(join(testDir, '.cursorrules'), '# Test');

      const mockPublish = jest.fn().mockResolvedValue({
        package_id: 'test-package',
        version: '1.0.0',
      });

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({});

      expect(telemetry.track).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'publish',
          success: true,
          duration: expect.any(Number),
        })
      );

      expect(telemetry.shutdown).toHaveBeenCalled();
    });

    it('should track failed publish', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
          type: 'cursor',
        })
      );

      await writeFile(join(testDir, '.cursorrules'), '# Test');

      const mockPublish = jest.fn().mockRejectedValue(new Error('Network error'));

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await expect(handlePublish({})).rejects.toThrow('Process exited');

      expect(telemetry.track).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'publish',
          success: false,
          error: 'Network error',
        })
      );

      mockExit.mockRestore();
    });
  });
});
