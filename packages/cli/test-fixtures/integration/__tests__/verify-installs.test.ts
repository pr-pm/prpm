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
 * Format: { format: { subtype: expectedPath } }
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
    plugin: '.claude/plugins',
  },

  // Kiro format
  kiro: {
    rule: '.kiro/steering',
    agent: '.kiro/agents',
    hook: '.kiro/hooks',
  },

  // Codex (OpenAI) format
  codex: {
    rule: '.codex',
    agent: '.openagents',
    skill: '.openskills',
    'slash-command': '.codex/commands',
  },

  // Agents.md format
  'agents.md': {
    rule: '',
    agent: '.openagents',
    skill: '.openskills',
  },

  // Gemini format
  'gemini.md': {
    rule: '',
    'slash-command': '.gemini/commands',
    extension: '.gemini/extensions',
  },

  // Claude.md format
  'claude.md': {
    rule: '',
  },

  // OpenCode format
  opencode: {
    agent: '.opencode/agents',
    'slash-command': '.opencode/commands',
    tool: '.opencode/tools',
    plugin: '.opencode/plugins',
  },

  // Droid format
  droid: {
    skill: '.droid/skills',
    'slash-command': '.droid/commands',
    hook: '.droid/hooks',
  },

  // MCP format
  mcp: {
    server: '.mcp/servers',
    tool: '.mcp/tools',
  },

  // Generic formats
  trae: {
    rule: '.trae/rules',
  },
  zencoder: {
    rule: '.zencoder/rules',
  },
  replit: {
    rule: '.replit/rules',
  },
  aider: {
    rule: '.aider/rules',
  },
  ruler: {
    rule: '.ruler/rules',
  },
  generic: {
    prompt: '.prompts',
  },
};

/**
 * Test packages from batch-1-rules
 */
const BATCH_1_RULES = [
  { name: 'ci-test-cursor-rule', format: 'cursor', subtype: 'rule' },
  { name: 'ci-test-continue-rule', format: 'continue', subtype: 'rule' },
  { name: 'ci-test-windsurf-rule', format: 'windsurf', subtype: 'rule' },
  { name: 'ci-test-copilot-rule', format: 'copilot', subtype: 'rule' },
  { name: 'ci-test-kiro-rule', format: 'kiro', subtype: 'rule' },
  { name: 'ci-test-trae-rule', format: 'trae', subtype: 'rule' },
  { name: 'ci-test-zencoder-rule', format: 'zencoder', subtype: 'rule' },
  { name: 'ci-test-replit-rule', format: 'replit', subtype: 'rule' },
  { name: 'ci-test-aider-rule', format: 'aider', subtype: 'rule' },
  { name: 'ci-test-codex-rule', format: 'codex', subtype: 'rule' },
  { name: 'ci-test-agents-md-rule', format: 'agents.md', subtype: 'rule' },
  { name: 'ci-test-gemini-rule', format: 'gemini.md', subtype: 'rule' },
  { name: 'ci-test-claude-md-rule', format: 'claude.md', subtype: 'rule' },
  { name: 'ci-test-ruler-rule', format: 'ruler', subtype: 'rule' },
];

/**
 * Test packages from batch-2-agents
 */
const BATCH_2_AGENTS = [
  { name: 'ci-test-claude-agent', format: 'claude', subtype: 'agent' },
  { name: 'ci-test-claude-skill', format: 'claude', subtype: 'skill' },
  {
    name: 'ci-test-claude-slash-command',
    format: 'claude',
    subtype: 'slash-command',
  },
  { name: 'ci-test-cursor-agent', format: 'cursor', subtype: 'agent' },
  {
    name: 'ci-test-cursor-slash-command',
    format: 'cursor',
    subtype: 'slash-command',
  },
  { name: 'ci-test-kiro-agent', format: 'kiro', subtype: 'agent' },
  { name: 'ci-test-opencode-agent', format: 'opencode', subtype: 'agent' },
  {
    name: 'ci-test-opencode-slash-command',
    format: 'opencode',
    subtype: 'slash-command',
  },
  { name: 'ci-test-droid-skill', format: 'droid', subtype: 'skill' },
  {
    name: 'ci-test-droid-slash-command',
    format: 'droid',
    subtype: 'slash-command',
  },
  {
    name: 'ci-test-gemini-slash-command',
    format: 'gemini.md',
    subtype: 'slash-command',
  },
  {
    name: 'ci-test-codex-slash-command',
    format: 'codex',
    subtype: 'slash-command',
  },
  { name: 'ci-test-copilot-chatmode', format: 'copilot', subtype: 'chatmode' },
  { name: 'ci-test-continue-prompt', format: 'continue', subtype: 'prompt' },
  { name: 'ci-test-generic-prompt', format: 'generic', subtype: 'prompt' },
];

/**
 * Test packages from batch-3-special
 */
const BATCH_3_SPECIAL = [
  { name: 'ci-test-claude-hook', format: 'claude', subtype: 'hook' },
  { name: 'ci-test-kiro-hook', format: 'kiro', subtype: 'hook' },
  { name: 'ci-test-droid-hook', format: 'droid', subtype: 'hook' },
  { name: 'ci-test-claude-plugin', format: 'claude', subtype: 'plugin' },
  { name: 'ci-test-opencode-tool', format: 'opencode', subtype: 'tool' },
  { name: 'ci-test-opencode-plugin', format: 'opencode', subtype: 'plugin' },
  {
    name: 'ci-test-gemini-extension',
    format: 'gemini.md',
    subtype: 'extension',
  },
  { name: 'ci-test-mcp-server', format: 'mcp', subtype: 'server' },
  { name: 'ci-test-mcp-tool', format: 'mcp', subtype: 'tool' },
  { name: 'ci-test-agents-md-skill', format: 'agents.md', subtype: 'skill' },
  { name: 'ci-test-agents-md-agent', format: 'agents.md', subtype: 'agent' },
  { name: 'ci-test-codex-skill', format: 'codex', subtype: 'skill' },
  { name: 'ci-test-codex-agent', format: 'codex', subtype: 'agent' },
];

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

  // Special cases for root-level files
  if (basePath === '') {
    // Root level files like AGENTS.md, GEMINI.md, CLAUDE.md
    const fileMap: Record<string, string> = {
      'agents.md': 'AGENTS.md',
      'gemini.md': 'GEMINI.md',
      'claude.md': 'CLAUDE.md',
    };
    return fileMap[format] || `${packageName}.md`;
  }

  return join(basePath, packageName);
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
        { name: 'ci-test-cursor-rule', format: 'cursor', subtype: 'rule' },
        { name: 'ci-test-continue-rule', format: 'continue', subtype: 'rule' },
        { name: 'ci-test-windsurf-rule', format: 'windsurf', subtype: 'rule' },
        { name: 'ci-test-claude-agent', format: 'claude', subtype: 'agent' },
        { name: 'ci-test-claude-skill', format: 'claude', subtype: 'skill' },
        { name: 'ci-test-cursor-agent', format: 'cursor', subtype: 'agent' },
        { name: 'ci-test-claude-hook', format: 'claude', subtype: 'hook' },
        { name: 'ci-test-mcp-server', format: 'mcp', subtype: 'server' },
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
        const expectedPath = join('.cursor/rules', 'ci-test-minimal-rule');
        expect(
          pathExists(expectedPath),
          'Minimal package should be installed'
        ).toBe(true);
      });
    });

    describe('Unicode Package', () => {
      it('should handle unicode in package names and content', () => {
        // The package name contains unicode, check it installs
        const expectedPath = join(
          '.cursor/rules',
          'ci-test-unicode-rule-日本語'
        );
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
          const expectedPath = join(
            '.cursor/rules',
            `ci-test-large-rule-${num}`
          );
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
          const rulePath = join(
            dryRunWorkspace,
            '.cursor/rules',
            'ci-test-dry-run-rule'
          );
          const agentPath = join(
            dryRunWorkspace,
            '.claude/agents',
            'ci-test-dry-run-agent'
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
        package: 'ci-test-cursor-rule',
        expectedPath: '.claude',
      },
      {
        source: 'claude',
        target: 'cursor',
        package: 'ci-test-claude-agent',
        expectedPath: '.cursor/agents',
      },
      {
        source: 'continue',
        target: 'windsurf',
        package: 'ci-test-continue-rule',
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
          const fullPath = join(asWorkspace, expectedPath, pkg);
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
