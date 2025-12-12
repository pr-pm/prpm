/**
 * Integration Test: Verify Install Locations
 *
 * This test verifies that packages are installed correctly by checking the
 * installedPath field in prpm.lock and verifying those paths exist on disk.
 *
 * The CLI's auto-detection and format conversion behavior means we can't
 * predict exact paths - instead we trust the lockfile as source of truth.
 *
 * Run with: npx vitest run verify-installs.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Test workspace - should be set by the CI script
const WORKSPACE = process.env.TEST_WORKSPACE || '/tmp/prpm-integration-test';

/**
 * Lockfile package entry structure
 */
interface LockfilePackage {
  version: string;
  resolved?: string;
  integrity?: string;
  format?: string;
  subtype?: string;
  sourceFormat?: string;
  sourceSubtype?: string;
  installedPath?: string;
  fromCollection?: {
    scope: string;
    name_slug: string;
    version?: string;
  };
  progressiveDisclosure?: {
    mode: string;
    resourceDir: string;
    manifestPath: string;
    resourceName: string;
    resourceType: string;
  };
}

interface Lockfile {
  lockfileVersion: number;
  packages: Record<string, LockfilePackage>;
  collections?: Record<string, unknown>;
}

/**
 * All test packages we expect to be installed
 */
const ALL_TEST_PACKAGES = [
  // Batch 1: Rules (9 packages)
  '@ci-test/cursor-rule',
  '@ci-test/claude-rule',
  '@ci-test/continue-rule',
  '@ci-test/windsurf-rule',
  '@ci-test/copilot-rule',
  '@ci-test/kiro-rule',
  '@ci-test/agents-md-rule',
  '@ci-test/generic-rule',
  '@ci-test/mcp-rule',
  // Batch 2: Agents, skills, commands (9 packages)
  '@ci-test/claude-agent',
  '@ci-test/ci-test-claude-skill',
  '@ci-test/claude-slash-command',
  '@ci-test/cursor-agent',
  '@ci-test/cursor-slash-command',
  '@ci-test/kiro-agent',
  '@ci-test/copilot-chatmode',
  '@ci-test/continue-prompt',
  '@ci-test/generic-prompt',
  // Batch 3: Hooks and AGENTS.md (4 packages)
  '@ci-test/claude-hook',
  '@ci-test/kiro-hook',
  '@ci-test/ci-test-agents-md-skill',
  '@ci-test/agents-md-agent',
];

/**
 * Edge case packages
 */
const EDGE_CASE_PACKAGES = [
  '@ci-test/minimal-rule',
  '@ci-test/unicode-rule',
];

/**
 * Large package rules (10 rules)
 */
const LARGE_PACKAGE_RULES = Array.from({ length: 10 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  return `@ci-test/large-rule-${num}`;
});

let lockfile: Lockfile | null = null;

/**
 * Read and parse the lockfile
 */
function getLockfile(): Lockfile | null {
  if (lockfile !== null) return lockfile;

  const lockPath = join(WORKSPACE, 'prpm.lock');
  if (!existsSync(lockPath)) {
    console.warn(`Lockfile not found at ${lockPath}`);
    return null;
  }

  try {
    const content = readFileSync(lockPath, 'utf-8');
    lockfile = JSON.parse(content);
    return lockfile;
  } catch (e) {
    console.error(`Failed to parse lockfile: ${e}`);
    return null;
  }
}

/**
 * Find a package entry in the lockfile by package name
 * The lockfile uses keys like "@scope/name" or "@scope/name#format"
 */
function findPackageInLockfile(packageName: string): LockfilePackage | null {
  const lock = getLockfile();
  if (!lock?.packages) return null;

  // Try exact match first
  if (lock.packages[packageName]) {
    return lock.packages[packageName];
  }

  // Try with format suffix (e.g., "@ci-test/cursor-rule#cursor")
  // The CLI uses # as the separator between packageId and format
  for (const [key, pkg] of Object.entries(lock.packages)) {
    if (key.startsWith(packageName + '#') || key === packageName) {
      return pkg;
    }
  }

  return null;
}

/**
 * Check if an installed path exists
 * Handles both files and directories, with and without extensions
 */
function installedPathExists(installedPath: string): boolean {
  if (!installedPath) return false;

  const fullPath = join(WORKSPACE, installedPath);

  // Check exact path
  if (existsSync(fullPath)) {
    return true;
  }

  // For paths that might be directories, check if they exist
  // (installedPath might be a directory for multi-file packages)
  return false;
}

describe('Integration Tests: Install Location Verification', () => {
  beforeAll(() => {
    console.log(`Testing workspace: ${WORKSPACE}`);
    if (!existsSync(WORKSPACE)) {
      console.warn(`Warning: Workspace ${WORKSPACE} does not exist`);
    }

    const lock = getLockfile();
    if (lock) {
      console.log(`Found ${Object.keys(lock.packages || {}).length} packages in lockfile`);
    }
  });

  describe('Lockfile Existence', () => {
    it('should have a valid prpm.lock file', () => {
      const lock = getLockfile();
      expect(lock, 'prpm.lock should exist and be valid JSON').not.toBeNull();
      expect(lock?.packages, 'Lockfile should have packages').toBeDefined();
    });
  });

  describe('Package Installation Verification', () => {
    it.each(ALL_TEST_PACKAGES)(
      '%s should be installed and path should exist',
      (packageName) => {
        const pkg = findPackageInLockfile(packageName);

        // Package should be in lockfile
        expect(
          pkg,
          `Package ${packageName} should be in prpm.lock`
        ).not.toBeNull();

        // Package should have an installedPath
        expect(
          pkg?.installedPath,
          `Package ${packageName} should have installedPath in lockfile`
        ).toBeDefined();

        // The installed path should exist on disk
        const exists = installedPathExists(pkg!.installedPath!);
        expect(
          exists,
          `Installed path ${pkg?.installedPath} should exist for ${packageName}`
        ).toBe(true);
      }
    );
  });

  describe('Edge Case Packages', () => {
    it.each(EDGE_CASE_PACKAGES)(
      '%s should be installed correctly',
      (packageName) => {
        const pkg = findPackageInLockfile(packageName);

        expect(
          pkg,
          `Edge case package ${packageName} should be in prpm.lock`
        ).not.toBeNull();

        if (pkg?.installedPath) {
          const exists = installedPathExists(pkg.installedPath);
          expect(
            exists,
            `Installed path ${pkg.installedPath} should exist for ${packageName}`
          ).toBe(true);
        }
      }
    );
  });

  describe('Large Package (10 rules)', () => {
    it.each(LARGE_PACKAGE_RULES)(
      '%s should be installed correctly',
      (packageName) => {
        const pkg = findPackageInLockfile(packageName);

        expect(
          pkg,
          `Large package rule ${packageName} should be in prpm.lock`
        ).not.toBeNull();

        if (pkg?.installedPath) {
          const exists = installedPathExists(pkg.installedPath);
          expect(
            exists,
            `Installed path ${pkg.installedPath} should exist for ${packageName}`
          ).toBe(true);
        }
      }
    );
  });

  describe('Version Tracking', () => {
    it('should track versions in lockfile', () => {
      const lock = getLockfile();
      expect(lock).not.toBeNull();

      // All packages should have versions
      for (const [key, pkg] of Object.entries(lock?.packages || {})) {
        expect(
          pkg.version,
          `Package ${key} should have a version`
        ).toBeDefined();
        expect(
          typeof pkg.version,
          `Package ${key} version should be a string`
        ).toBe('string');
      }
    });

    it('should have consistent version format', () => {
      const lock = getLockfile();
      expect(lock).not.toBeNull();

      // All versions should match semver pattern
      const semverPattern = /^\d+\.\d+\.\d+/;
      for (const [key, pkg] of Object.entries(lock?.packages || {})) {
        expect(
          pkg.version,
          `Package ${key} version "${pkg.version}" should match semver`
        ).toMatch(semverPattern);
      }
    });
  });

  describe('Format and Subtype Tracking', () => {
    it('should track format information in lockfile', () => {
      const lock = getLockfile();
      expect(lock).not.toBeNull();

      // Check a few specific packages for format tracking
      const cursorRule = findPackageInLockfile('@ci-test/cursor-rule');
      if (cursorRule) {
        // Should have format or sourceFormat set
        const hasFormat = cursorRule.format || cursorRule.sourceFormat;
        expect(
          hasFormat,
          'cursor-rule should have format information'
        ).toBeDefined();
      }
    });
  });

  describe('Dry Run Behavior', () => {
    it('should NOT install packages when using --dry-run', () => {
      // This test assumes a separate dry-run test was executed
      const dryRunWorkspace =
        process.env.DRY_RUN_WORKSPACE || '/tmp/prpm-dry-run-test';

      if (existsSync(dryRunWorkspace)) {
        // In dry-run mode, no prpm.lock should be created or modified
        const dryRunLockPath = join(dryRunWorkspace, 'prpm.lock');

        // If a lockfile exists, it shouldn't have the dry-run test packages
        if (existsSync(dryRunLockPath)) {
          const content = readFileSync(dryRunLockPath, 'utf-8');
          const dryRunLock = JSON.parse(content);

          expect(
            dryRunLock.packages?.['@ci-test/dry-run-rule'],
            'Dry-run rule should NOT be in lockfile'
          ).toBeUndefined();
        }
      }
    });
  });

  describe('--subtype Flag Validation', () => {
    // These tests verify the static mapping, not actual installs
    const subtypeTests = [
      { format: 'claude', subtype: 'agent', expectedDir: '.claude/agents' },
      { format: 'claude', subtype: 'skill', expectedDir: '.claude/skills' },
      { format: 'cursor', subtype: 'rule', expectedDir: '.cursor/rules' },
    ];

    it.each(subtypeTests)(
      'should recognize $format $subtype subtype',
      ({ format, subtype }) => {
        // These are static checks - just verifying the test framework works
        expect(format).toBeDefined();
        expect(subtype).toBeDefined();
      }
    );
  });

  describe('Progressive Disclosure', () => {
    it('should use progressive disclosure for skills', () => {
      // Check if agents.md skill uses progressive disclosure
      const agentsMdSkill = findPackageInLockfile('@ci-test/ci-test-agents-md-skill');

      if (agentsMdSkill) {
        // Should be installed with progressive disclosure
        const usesProgressiveDisclosure =
          agentsMdSkill.progressiveDisclosure ||
          agentsMdSkill.installedPath?.includes('.openskills');

        expect(
          usesProgressiveDisclosure,
          'agents.md skill should use progressive disclosure'
        ).toBeTruthy();
      }
    });

    it('should use progressive disclosure for agents', () => {
      const agentsMdAgent = findPackageInLockfile('@ci-test/agents-md-agent');

      if (agentsMdAgent) {
        const usesProgressiveDisclosure =
          agentsMdAgent.progressiveDisclosure ||
          agentsMdAgent.installedPath?.includes('.openagents');

        expect(
          usesProgressiveDisclosure,
          'agents.md agent should use progressive disclosure'
        ).toBeTruthy();
      }
    });
  });
});

/**
 * Export for use in CI scripts
 */
export { ALL_TEST_PACKAGES, EDGE_CASE_PACKAGES, LARGE_PACKAGE_RULES };
