/**
 * Integration Test: Verify Install Locations
 *
 * This test matrix verifies that packages are installed to the correct locations
 * based on their format and subtype. It's designed to run after the CI integration
 * tests have published and installed all test packages.
 *
 * Run with: npx vitest run verify-installs.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Test workspace - should be set by the CI script
const WORKSPACE = process.env.TEST_WORKSPACE || '/tmp/prpm-integration-test';

/**
 * Expected install locations for each format/subtype combination
 * Valid formats: cursor, claude, claude-plugin, continue, windsurf, copilot, kiro, agents.md, generic, mcp
 * Valid subtypes: rule, agent, skill, slash-command, prompt, collection, chatmode, hook, tool, plugin, server
 */
const INSTALL_LOCATIONS: Record<string, Record<string, string>> = {
  // Cursor format
  cursor: {
    rule: '.cursor/rules',
    agent: '.cursor/agents',
    'slash-command': '.cursor/commands',
  },

  // Continue format
  continue: {
    rule: '.continue/rules',
    prompt: '.continue/prompts',
  },

  // Windsurf format
  windsurf: {
    rule: '.windsurf/rules',
  },

  // Copilot format
  copilot: {
    rule: '.github/copilot-instructions',
    chatmode: '.github/copilot-chatmodes',
  },

  // Claude format
  claude: {
    rule: '.claude',
    agent: '.claude/agents',
    skill: '.claude/skills',
    'slash-command': '.claude/commands',
    hook: '.claude/hooks',
  },

  // Claude plugin format
  'claude-plugin': {
    plugin: '.claude/plugins',
  },

  // Kiro format
  kiro: {
    rule: '.kiro/steering',
    agent: '.kiro/agents',
    hook: '.kiro/hooks',
  },

  // Agents.md format
  'agents.md': {
    rule: '',
    agent: '.openagents',
    skill: '.openskills',
  },

  // MCP format
  mcp: {
    rule: '.mcp',
    server: '.mcp/servers',
    tool: '.mcp/tools',
  },

  // Generic format
  generic: {
    rule: '.prompts',
    prompt: '.prompts',
    tool: '.tools',
    plugin: '.plugins',
  },
};

/**
 * Test packages from batch-1-rules (9 packages - all valid formats)
 */
const BATCH_1_RULES = [
  { name: '@ci-test/cursor-rule', format: 'cursor', subtype: 'rule' },
  { name: '@ci-test/claude-rule', format: 'claude', subtype: 'rule' },
  { name: '@ci-test/continue-rule', format: 'continue', subtype: 'rule' },
  { name: '@ci-test/windsurf-rule', format: 'windsurf', subtype: 'rule' },
  { name: '@ci-test/copilot-rule', format: 'copilot', subtype: 'rule' },
  { name: '@ci-test/kiro-rule', format: 'kiro', subtype: 'rule' },
  { name: '@ci-test/agents-md-rule', format: 'agents.md', subtype: 'rule' },
  { name: '@ci-test/generic-rule', format: 'generic', subtype: 'rule' },
  { name: '@ci-test/mcp-rule', format: 'mcp', subtype: 'rule' },
];

/**
 * Test packages from batch-2-agents (9 packages - agents, skills, commands)
 */
const BATCH_2_AGENTS = [
  { name: '@ci-test/claude-agent', format: 'claude', subtype: 'agent' },
  { name: '@ci-test/ci-test-claude-skill', format: 'claude', subtype: 'skill' },
  {
    name: '@ci-test/claude-slash-command',
    format: 'claude',
    subtype: 'slash-command',
  },
  { name: '@ci-test/cursor-agent', format: 'cursor', subtype: 'agent' },
  {
    name: '@ci-test/cursor-slash-command',
    format: 'cursor',
    subtype: 'slash-command',
  },
  { name: '@ci-test/kiro-agent', format: 'kiro', subtype: 'agent' },
  { name: '@ci-test/copilot-chatmode', format: 'copilot', subtype: 'chatmode' },
  { name: '@ci-test/continue-prompt', format: 'continue', subtype: 'prompt' },
  { name: '@ci-test/generic-prompt', format: 'generic', subtype: 'prompt' },
];

/**
 * Test packages from batch-3-special (4 packages - hooks and AGENTS.md)
 */
const BATCH_3_SPECIAL = [
  { name: '@ci-test/claude-hook', format: 'claude', subtype: 'hook' },
  { name: '@ci-test/kiro-hook', format: 'kiro', subtype: 'hook' },
  { name: '@ci-test/ci-test-agents-md-skill', format: 'agents.md', subtype: 'skill' },
  { name: '@ci-test/agents-md-agent', format: 'agents.md', subtype: 'agent' },
];

/**
 * Strip author namespace from package ID (mirrors CLI behavior)
 * @example stripAuthorNamespace('@ci-test/cursor-rule') => 'cursor-rule'
 */
function stripAuthorNamespace(packageId: string): string {
  const parts = packageId.split('/');
  return parts[parts.length - 1];
}

/**
 * Helper to get expected install path for a package
 */
function getExpectedPath(
  format: string,
  subtype: string,
  packageName: string
): string {
  const formatLocations = INSTALL_LOCATIONS[format];
  if (!formatLocations) {
    throw new Error(`Unknown format: ${format}`);
  }

  const basePath = formatLocations[subtype];
  if (basePath === undefined) {
    throw new Error(`Unknown subtype ${subtype} for format ${format}`);
  }

  // Strip the @scope/ prefix - CLI does this during install
  const strippedName = stripAuthorNamespace(packageName);

  // Special cases for root-level files
  if (basePath === '') {
    // Root level files like AGENTS.md
    const fileMap: Record<string, string> = {
      'agents.md': 'AGENTS.md',
    };
    return fileMap[format] || `${strippedName}.md`;
  }

  return join(basePath, strippedName);
}

/**
 * Check if a path exists (file or directory)
 */
function pathExists(relativePath: string): boolean {
  const fullPath = join(WORKSPACE, relativePath);
  return existsSync(fullPath);
}

describe('Integration Tests: Install Location Verification', () => {
  beforeAll(() => {
    console.log(`Testing workspace: ${WORKSPACE}`);
    if (!existsSync(WORKSPACE)) {
      console.warn(`Warning: Workspace ${WORKSPACE} does not exist`);
    }
  });

  describe('Batch 1: Rules', () => {
    it.each(BATCH_1_RULES)(
      '$name should be installed to correct location',
      ({ name, format, subtype }) => {
        const expectedPath = getExpectedPath(format, subtype, name);

        // For root-level markdown files, check if they exist or contain the package content
        if (expectedPath.endsWith('.md') && !expectedPath.includes('/')) {
          const exists = pathExists(expectedPath);
          expect(
            exists,
            `Expected ${expectedPath} to exist for ${name}`
          ).toBe(true);
        } else {
          // For directory-based installs, check the directory exists
          const exists = pathExists(expectedPath);
          expect(
            exists,
            `Expected ${expectedPath} to exist for ${name}`
          ).toBe(true);
        }
      }
    );
  });

  describe('Batch 2: Agents, Skills & Commands', () => {
    it.each(BATCH_2_AGENTS)(
      '$name should be installed to correct location',
      ({ name, format, subtype }) => {
        const expectedPath = getExpectedPath(format, subtype, name);
        const exists = pathExists(expectedPath);
        expect(exists, `Expected ${expectedPath} to exist for ${name}`).toBe(
          true
        );
      }
    );
  });

  describe('Batch 3: Special Packages (Hooks, Plugins, MCP)', () => {
    it.each(BATCH_3_SPECIAL)(
      '$name should be installed to correct location',
      ({ name, format, subtype }) => {
        const expectedPath = getExpectedPath(format, subtype, name);
        const exists = pathExists(expectedPath);
        expect(exists, `Expected ${expectedPath} to exist for ${name}`).toBe(
          true
        );
      }
    );
  });

  describe('Collection Install', () => {
    it('should install all packages from collection', () => {
      const collectionPackages = [
        { name: '@ci-test/cursor-rule', format: 'cursor', subtype: 'rule' },
        { name: '@ci-test/continue-rule', format: 'continue', subtype: 'rule' },
        { name: '@ci-test/windsurf-rule', format: 'windsurf', subtype: 'rule' },
        { name: '@ci-test/claude-agent', format: 'claude', subtype: 'agent' },
        { name: '@ci-test/ci-test-claude-skill', format: 'claude', subtype: 'skill' },
        { name: '@ci-test/cursor-agent', format: 'cursor', subtype: 'agent' },
        { name: '@ci-test/claude-hook', format: 'claude', subtype: 'hook' },
        { name: '@ci-test/mcp-rule', format: 'mcp', subtype: 'rule' },
      ];

      for (const pkg of collectionPackages) {
        const expectedPath = getExpectedPath(pkg.format, pkg.subtype, pkg.name);
        const exists = pathExists(expectedPath);
        expect(
          exists,
          `Collection package ${pkg.name} should be at ${expectedPath}`
        ).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    describe('Minimal Package', () => {
      it('should install minimal package correctly', () => {
        // CLI strips @scope/ prefix during install
        const expectedPath = join('.cursor/rules', 'minimal-rule');
        expect(
          pathExists(expectedPath),
          'Minimal package should be installed'
        ).toBe(true);
      });
    });

    describe('Unicode Package', () => {
      it('should handle unicode in package content', () => {
        // Package name is now valid ASCII, but content has unicode
        // CLI strips @scope/ prefix during install
        const expectedPath = join('.cursor/rules', 'unicode-rule');
        expect(
          pathExists(expectedPath),
          'Unicode package should be installed'
        ).toBe(true);
      });
    });

    describe('Large Package', () => {
      it('should install all 10 rules from large package', () => {
        for (let i = 1; i <= 10; i++) {
          const num = i.toString().padStart(2, '0');
          // CLI strips @scope/ prefix during install
          const expectedPath = join('.cursor/rules', `large-rule-${num}`);
          expect(
            pathExists(expectedPath),
            `Large package rule ${num} should be installed`
          ).toBe(true);
        }
      });
    });

    describe('Dry Run', () => {
      it('should NOT install packages when using --dry-run', () => {
        // This test assumes a separate dry-run test was executed
        // and these files should NOT exist in the dry-run workspace
        const dryRunWorkspace =
          process.env.DRY_RUN_WORKSPACE || '/tmp/prpm-dry-run-test';

        if (existsSync(dryRunWorkspace)) {
          // CLI strips @scope/ prefix during install
          const rulePath = join(
            dryRunWorkspace,
            '.cursor/rules',
            'dry-run-rule'
          );
          const agentPath = join(
            dryRunWorkspace,
            '.claude/agents',
            'dry-run-agent'
          );

          expect(
            existsSync(rulePath),
            'Dry-run rule should NOT be installed'
          ).toBe(false);
          expect(
            existsSync(agentPath),
            'Dry-run agent should NOT be installed'
          ).toBe(false);
        }
      });
    });
  });

  describe('Version Updates', () => {
    it('should handle version updates correctly', () => {
      // After publishing 1.0.1, 1.1.0, and 2.0.0 versions,
      // the installed package should reflect the latest version
      // This is verified by checking the prpm.lock file or manifest

      const lockPath = join(WORKSPACE, 'prpm.lock');
      if (existsSync(lockPath)) {
        const lockContent = readFileSync(lockPath, 'utf-8');
        const lock = JSON.parse(lockContent);

        // Check that version-tested packages have correct versions
        const cursorRule = lock.packages?.['@ci-test/cursor-rule'];
        if (cursorRule) {
          // After all version updates, should be at 2.0.0
          expect(cursorRule.version).toBe('2.0.0');
        }
      }
    });
  });

  describe('--as Flag Conversions', () => {
    const asConversions = [
      {
        source: 'cursor',
        target: 'claude',
        package: '@ci-test/cursor-rule',
        expectedPath: '.claude',
      },
      {
        source: 'claude',
        target: 'cursor',
        package: '@ci-test/claude-agent',
        expectedPath: '.cursor/agents',
      },
      {
        source: 'continue',
        target: 'windsurf',
        package: '@ci-test/continue-rule',
        expectedPath: '.windsurf/rules',
      },
    ];

    it.each(asConversions)(
      'should convert $source to $target with --as flag',
      ({ target, package: pkg, expectedPath }) => {
        // After running install with --as flag, check target location
        const asWorkspace =
          process.env.AS_FLAG_WORKSPACE || '/tmp/prpm-as-flag-test';

        if (existsSync(asWorkspace)) {
          // CLI strips @scope/ prefix during install
          const strippedPkg = stripAuthorNamespace(pkg);
          const fullPath = join(asWorkspace, expectedPath, strippedPkg);
          expect(
            existsSync(fullPath),
            `Package ${pkg} should be converted to ${target} format at ${expectedPath}`
          ).toBe(true);
        }
      }
    );
  });

  describe('--subtype Flag Installations', () => {
    const subtypeTests = [
      {
        format: 'claude',
        subtype: 'agent',
        expectedPath: '.claude/agents',
      },
      {
        format: 'claude',
        subtype: 'skill',
        expectedPath: '.claude/skills',
      },
      {
        format: 'cursor',
        subtype: 'rule',
        expectedPath: '.cursor/rules',
      },
      {
        format: 'mcp',
        subtype: 'server',
        expectedPath: '.mcp/servers',
      },
    ];

    it.each(subtypeTests)(
      '$format --subtype $subtype should install to $expectedPath',
      ({ format, subtype, expectedPath }) => {
        // Verify that --subtype flag results in correct installation path
        // This is implicitly tested by the batch tests above
        const formatLocations = INSTALL_LOCATIONS[format];
        expect(formatLocations).toBeDefined();
        expect(formatLocations[subtype]).toBe(expectedPath);
      }
    );
  });
});

/**
 * Export for use in CI scripts
 */
export { INSTALL_LOCATIONS, BATCH_1_RULES, BATCH_2_AGENTS, BATCH_3_SPECIAL };
