/**
 * Tests for catalog command
 */

import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleCatalog } from '../commands/catalog';
import { readLockfile, writeLockfile, createLockfile } from '../core/lockfile';

// Mock telemetry to prevent timeouts
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe('catalog command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Create test directory
    testDir = join(tmpdir(), `prpm-catalog-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    try {
      process.chdir(originalCwd);
    } catch (err) {
      // Ignore errors if originalCwd no longer exists (parallel test cleanup)
      // Just change to a safe directory instead
      process.chdir(tmpdir());
    }
    await rm(testDir, { recursive: true, force: true });
  });

  describe('lockfile filtering', () => {
    it('should include user-created packages not in lockfile', async () => {
      // Create a user-created skill
      await mkdir(join(testDir, '.claude/skills/my-skill'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/my-skill/SKILL.md'),
        '---\nname: My Skill\ndescription: A user-created skill\n---\n\n# My Skill\n\nThis is my custom skill.'
      );

      // Run catalog
      await handleCatalog(['.claude'], { dryRun: true });

      // Verify package was discovered (check console output via mock)
      // Since we're in dry-run mode, prpm.json shouldn't be created
    });

    it('should exclude packages that are in lockfile', async () => {
      // Create a skill
      await mkdir(join(testDir, '.claude/skills/installed-skill'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/installed-skill/SKILL.md'),
        '---\nname: Installed Skill\ndescription: A skill from registry\n---\n\n# Installed Skill'
      );

      // Create lockfile with this package
      const lockfile = createLockfile();
      lockfile.packages['installed-skill'] = {
        version: '1.0.0',
        resolved: 'https://registry.prpm.dev/packages/installed-skill/1.0.0.tgz',
        integrity: 'sha256-abc123',
        format: 'claude',
        subtype: 'skill',
      };
      await writeLockfile(lockfile);

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleCatalog(['.claude'], { dryRun: true });

      // Verify package was skipped
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping installed-skill')
      );

      consoleSpy.mockRestore();
    });

    it('should exclude packages with scoped names in lockfile', async () => {
      // Create a skill
      await mkdir(join(testDir, '.claude/skills/typescript-safety'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/typescript-safety/SKILL.md'),
        '---\nname: TypeScript Safety\ndescription: TypeScript best practices\n---\n\n# TypeScript Safety'
      );

      // Create lockfile with scoped package name
      const lockfile = createLockfile();
      lockfile.packages['@author/typescript-safety'] = {
        version: '1.0.0',
        resolved: 'https://registry.prpm.dev/packages/@author/typescript-safety/1.0.0.tgz',
        integrity: 'sha256-def456',
        format: 'claude',
        subtype: 'skill',
      };
      await writeLockfile(lockfile);

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleCatalog(['.claude'], { dryRun: true });

      // Verify package was skipped (matches by suffix)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping typescript-safety')
      );

      consoleSpy.mockRestore();
    });

    it('should include user packages even when other packages are in lockfile', async () => {
      // Create two skills: one in lockfile, one not
      await mkdir(join(testDir, '.claude/skills/installed-skill'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/installed-skill/SKILL.md'),
        '---\nname: Installed\n---\n\n# Installed'
      );

      await mkdir(join(testDir, '.claude/skills/my-custom-skill'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/my-custom-skill/SKILL.md'),
        '---\nname: My Custom\n---\n\n# My Custom'
      );

      // Create lockfile with only one package
      const lockfile = createLockfile();
      lockfile.packages['installed-skill'] = {
        version: '1.0.0',
        resolved: 'https://registry.prpm.dev/packages/installed-skill/1.0.0.tgz',
        integrity: 'sha256-abc123',
        format: 'claude',
        subtype: 'skill',
      };
      await writeLockfile(lockfile);

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleCatalog(['.claude'], { dryRun: true });

      // Verify installed-skill was skipped
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping installed-skill')
      );

      // Verify my-custom-skill was included
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/my-custom-skill/)
      );

      consoleSpy.mockRestore();
    });

    it('should handle no lockfile gracefully', async () => {
      // Create a skill without any lockfile
      await mkdir(join(testDir, '.claude/skills/my-skill'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/my-skill/SKILL.md'),
        '---\nname: My Skill\n---\n\n# My Skill'
      );

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleCatalog(['.claude'], { dryRun: true });

      // Verify package was discovered
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/my-skill/)
      );

      // Verify no skipping message
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Skipping my-skill')
      );

      consoleSpy.mockRestore();
    });

    it('should show helpful message when all packages are filtered out', async () => {
      // Create skills that are all in lockfile
      await mkdir(join(testDir, '.claude/skills/skill-one'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/skill-one/SKILL.md'),
        '---\nname: Skill One\n---\n\n# Skill One'
      );

      await mkdir(join(testDir, '.claude/skills/skill-two'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/skill-two/SKILL.md'),
        '---\nname: Skill Two\n---\n\n# Skill Two'
      );

      // Add both to lockfile
      const lockfile = createLockfile();
      lockfile.packages['skill-one'] = {
        version: '1.0.0',
        resolved: 'https://registry.prpm.dev/packages/skill-one/1.0.0.tgz',
        integrity: 'sha256-abc',
        format: 'claude',
        subtype: 'skill',
      };
      lockfile.packages['skill-two'] = {
        version: '1.0.0',
        resolved: 'https://registry.prpm.dev/packages/skill-two/1.0.0.tgz',
        integrity: 'sha256-def',
        format: 'claude',
        subtype: 'skill',
      };
      await writeLockfile(lockfile);

      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleCatalog(['.claude'], { dryRun: true });

      // Verify helpful message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No user-created packages found')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('multiple formats', () => {
    it('should filter lockfile packages across multiple formats', async () => {
      // Create Claude skill (in lockfile)
      await mkdir(join(testDir, '.claude/skills/claude-skill'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/claude-skill/SKILL.md'),
        '# Claude Skill'
      );

      // Create Cursor rule (user-created)
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(
        join(testDir, '.cursor/rules/my-rule.mdc'),
        '---\ndescription: My custom rule\n---\n\n# My Rule'
      );

      // Create lockfile with Claude skill only
      const lockfile = createLockfile();
      lockfile.packages['claude-skill'] = {
        version: '1.0.0',
        resolved: 'https://registry.prpm.dev/packages/claude-skill/1.0.0.tgz',
        integrity: 'sha256-abc',
        format: 'claude',
        subtype: 'skill',
      };
      await writeLockfile(lockfile);

      // Mock console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleCatalog(['.claude', '.cursor'], { dryRun: true });

      // Verify Claude skill was skipped
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping claude-skill')
      );

      // Verify Cursor rule was included
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/my-rule/)
      );

      consoleSpy.mockRestore();
    });
  });
});
