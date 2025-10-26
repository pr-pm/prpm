/**
 * Tests for package publishing flow
 *
 * Note: These tests are currently skipped due to issues with mocking process.exit
 * in Jest parallel workers. Re-enable when jest.mock() setup is fixed.
 */

import { handlePublish } from '../commands/publish';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock dependencies
jest.mock('@pr-pm/registry-client');
jest.mock('../core/user-config');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockGetRegistryClient = getRegistryClient as jest.MockedFunction<typeof getRegistryClient>;

describe.skip('Publish Command', () => {
  let testDir: string;
  let originalCwd: string;
  let exitMock: jest.SpyInstance;
  let consoleMock: jest.SpyInstance;
  let consoleErrorMock: jest.SpyInstance;

  beforeAll(() => {
    // Mock console methods (persist across tests)
    consoleMock = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();
    // Mock process.exit to prevent tests from actually exiting
    exitMock = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`Process exited with code ${code}`);
    }) as any);
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

    // Clear registry client mock only, not the global mocks
    mockGetRegistryClient.mockClear();
    mockGetConfig.mockClear();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
  });

  describe('Manifest Validation', () => {
    it('should require prpm.json to exist', async () => {

      await expect(handlePublish({})).rejects.toThrow('Process exited');

    });

    it('should validate required fields', async () => {

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          // missing version, description, type
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

    });

    it('should validate package name format', async () => {

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'Invalid_Package_Name',
          version: '1.0.0',
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

    });

    it('should validate version format', async () => {

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: 'invalid',
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

    });

    it('should validate package type', async () => {

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package for testing purposes',
          type: 'invalid-type',
          files: ['.cursorrules'],
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

    });

    it('should accept valid manifest', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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

    it('should reject Claude skills without SKILL.md file', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-skill',
          version: '1.0.0',
          description: 'Test Claude skill',
          format: 'claude',
          subtype: 'skill',
          files: ['.claude/skills/test-skill/skill.md'], // Wrong filename (should be SKILL.md)
        })
      );

      await mkdir(join(testDir, '.claude/skills/test-skill'), { recursive: true });
      await writeFile(join(testDir, '.claude/skills/test-skill/skill.md'), '# Test skill');

      await expect(handlePublish({})).rejects.toThrow(/SKILL\.md/);
    });

    it('should accept Claude skills with SKILL.md file', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-skill',
          version: '1.0.0',
          description: 'Test Claude skill',
          format: 'claude',
          subtype: 'skill',
          files: ['.claude/skills/test-skill/SKILL.md'], // Correct filename
        })
      );

      await mkdir(join(testDir, '.claude/skills/test-skill'), { recursive: true });
      await writeFile(join(testDir, '.claude/skills/test-skill/SKILL.md'), '# Test skill');

      const mockPublish = jest.fn().mockResolvedValue({
        package_id: 'test-skill',
        version: '1.0.0',
      });

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({});

      expect(mockPublish).toHaveBeenCalled();
    });

    it('should reject Claude skills with name longer than 64 characters', async () => {
      const longName = 'a'.repeat(65); // 65 characters
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: longName,
          version: '1.0.0',
          description: 'Test Claude skill with name that exceeds the 64 character limit',
          format: 'claude',
          subtype: 'skill',
          files: ['.claude/skills/test/SKILL.md'],
        })
      );

      await mkdir(join(testDir, '.claude/skills/test'), { recursive: true });
      await writeFile(join(testDir, '.claude/skills/test/SKILL.md'), '# Test skill');

      await expect(handlePublish({})).rejects.toThrow(/64 character limit/);
    });

    it('should reject Claude skills with invalid name characters', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'Test_Skill_Invalid', // Uppercase and underscores not allowed
          version: '1.0.0',
          description: 'Test Claude skill with invalid name format',
          format: 'claude',
          subtype: 'skill',
          files: ['.claude/skills/test/SKILL.md'],
        })
      );

      await mkdir(join(testDir, '.claude/skills/test'), { recursive: true });
      await writeFile(join(testDir, '.claude/skills/test/SKILL.md'), '# Test skill');

      await expect(handlePublish({})).rejects.toThrow(/invalid characters/);
    });

    it('should reject Claude skills with description longer than 1024 characters', async () => {
      const longDescription = 'a'.repeat(1025); // 1025 characters
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-skill',
          version: '1.0.0',
          description: longDescription,
          format: 'claude',
          subtype: 'skill',
          files: ['.claude/skills/test-skill/SKILL.md'],
        })
      );

      await mkdir(join(testDir, '.claude/skills/test-skill'), { recursive: true });
      await writeFile(join(testDir, '.claude/skills/test-skill/SKILL.md'), '# Test skill');

      await expect(handlePublish({})).rejects.toThrow(/1024 character limit/);
    });

    it('should warn about short descriptions for Claude skills', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-skill',
          version: '1.0.0',
          description: 'Too short', // Only 9 characters
          format: 'claude',
          subtype: 'skill',
          files: ['.claude/skills/test-skill/SKILL.md'],
        })
      );

      await mkdir(join(testDir, '.claude/skills/test-skill'), { recursive: true });
      await writeFile(join(testDir, '.claude/skills/test-skill/SKILL.md'), '# Test skill');

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockPublish = jest.fn().mockResolvedValue({
        package_id: 'test-skill',
        version: '1.0.0',
      });

      mockGetRegistryClient.mockReturnValue({
        publish: mockPublish,
      } as any);

      await handlePublish({});

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('only 9 characters')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Authentication', () => {
    it('should require authentication token', async () => {

      mockGetConfig.mockResolvedValue({
        token: undefined,
        registryUrl: 'http://localhost:3000',
      });

      await expect(handlePublish({})).rejects.toThrow('Process exited');

    });

    it('should pass token to registry client', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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
          description: 'Test package for testing purposes',
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

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['prpm.json', 'large-file.txt'],
        })
      );

      // Create a file > 10MB
      const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
      await writeFile(join(testDir, 'large-file.txt'), largeContent);

      await expect(handlePublish({})).rejects.toThrow('Process exited');

    });

    it('should fail if no files to include', async () => {

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['non-existent.txt'],
        })
      );

      await expect(handlePublish({})).rejects.toThrow('Process exited');

    });
  });

  describe('Dry Run', () => {
    it('should validate without publishing', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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

    });
  });

  describe('Package Types', () => {
    const packageTypes = ['cursor', 'claude', 'continue', 'windsurf', 'generic'];

    packageTypes.forEach((type) => {
      it(`should publish ${type} package`, async () => {
        // Create type-specific file first
        const typeFiles: Record<string, string> = {
          cursor: '.cursorrules',
          claude: '.clinerules',
          continue: '.continuerc.json',
          windsurf: '.windsurfrules',
          generic: 'README.md',
        };

        await writeFile(
          join(testDir, 'prpm.json'),
          JSON.stringify({
            name: `test-${type}-package`,
            version: '1.0.0',
            description: `Test ${type} package for testing purposes`,
            type,
            files: [typeFiles[type]],
          })
        );

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
          description: 'Test scoped package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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

      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package for testing purposes',
          type: 'cursor',
          files: ['.cursorrules'],
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

    });
  });
});
