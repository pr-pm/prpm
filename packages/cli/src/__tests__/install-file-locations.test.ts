import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, type MockedFunction, type MockInstance } from 'vitest'; type Mock = ReturnType<typeof vi.fn>;
/**
 * Tests for install command - file location verification
 * Tests that packages are installed to the correct directories based on type and format
 */

import { handleInstall } from '../commands/install';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { saveFile, getDestinationDir } from '../core/filesystem';
import { readLockfile, writeLockfile, addToLockfile, createLockfile, setPackageIntegrity } from '../core/lockfile';
import { gzipSync } from 'zlib';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promptYesNo } from '../core/prompts';
import { addSkillToManifest } from '../core/agents-md-progressive.js';

vi.mock('../core/prompts', () => ({
  promptYesNo: vi.fn(),
}));

const promptYesNoMock = promptYesNo as MockedFunction<typeof promptYesNo>;
const addSkillToManifestMock = addSkillToManifest as MockedFunction<typeof addSkillToManifest>;

// Mock dependencies
vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');
vi.mock('../core/lockfile');
vi.mock('../core/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    shutdown: vi.fn(),
  },
}));

// Don't mock filesystem - we want to test actual file operations
vi.mock('../core/filesystem', async () => {
  const actual = await vi.importActual('../core/filesystem');
  return {
    ...actual,
    saveFile: vi.fn(actual.saveFile),
    ensureDirectoryExists: vi.fn(actual.ensureDirectoryExists),
  };
});

vi.mock('../core/agents-md-progressive.js', () => ({
  addSkillToManifest: vi.fn(),
}));

describe('install command - file locations', () => {
  const testDir = path.join(__dirname, '../../.test-install');
  const mockClient = {
    getPackage: vi.fn(),
    getPackageVersion: vi.fn(),
    downloadPackage: vi.fn(),
    trackDownload: vi.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
    // Don't set defaultFormat so tests can verify native format installation
  };

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterAll(async () => {
    // Clean up test directory
    process.chdir(path.join(__dirname, '../../../'));
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Clean up any existing directories (including all format directories to prevent auto-detection)
    const dirs = [
      '.claude', '.cursor', '.continue', '.windsurf', '.prompts', '.agents',
      '.github', '.kiro', '.gemini', '.opencode', '.factory', '.droid',
      '.trae', '.zencoder', '.mcp', '.openskills', '.openagents', '.opencommands',
      'AGENTS.md', 'GEMINI.md', 'CLAUDE.md', 'CONVENTIONS.md', 'replit.md', 'custom'
    ];
    for (const dir of dirs) {
      await fs.rm(path.join(testDir, dir), { recursive: true, force: true }).catch(() => {});
    }

    promptYesNoMock.mockReset();
    addSkillToManifestMock.mockReset();

    (getRegistryClient as Mock).mockReturnValue(mockClient);
    (getConfig as Mock).mockResolvedValue(mockConfig);
    (readLockfile as Mock).mockResolvedValue(null);
    (writeLockfile as Mock).mockResolvedValue(undefined);
    (addToLockfile as Mock).mockImplementation(() => {});
    (createLockfile as Mock).mockReturnValue({ packages: {} });
    (setPackageIntegrity as Mock).mockImplementation(() => {});
    mockClient.trackDownload.mockResolvedValue(undefined);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();

    // Mock process.exit to prevent test from exiting
    vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit called with ${code}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Aider format', () => {
    it('installs aider skill to .openskills/<name>/SKILL.md and updates CONVENTIONS.md manifest', async () => {
      const mockPackage = {
        id: 'test-aider-skill',
        name: 'test-aider-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 10,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Aider Skill'));

      await handleInstall('test-aider-skill', { as: 'aider' });

      expect(saveFile).toHaveBeenCalledWith('.openskills/test-aider-skill/SKILL.md', expect.any(String));
      expect(addSkillToManifestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-aider-skill',
          skillPath: '.openskills/test-aider-skill',
          mainFile: 'SKILL.md',
        }),
        'CONVENTIONS.md'
      );
    });
  });

  describe('Gemini manifest format', () => {
    it('installs gemini.md skill to .openskills/<name>/SKILL.md and updates GEMINI.md manifest', async () => {
      const mockPackage = {
        id: 'test-gemini-skill',
        name: 'test-gemini-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 10,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Gemini Skill'));

      await handleInstall('test-gemini-skill', { as: 'gemini.md' });

      expect(saveFile).toHaveBeenCalledWith('.openskills/test-gemini-skill/SKILL.md', expect.any(String));
      expect(addSkillToManifestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-gemini-skill',
          skillPath: '.openskills/test-gemini-skill',
          mainFile: 'SKILL.md',
        }),
        'GEMINI.md'
      );
    });
  });

  describe('Droid format', () => {
    it('installs droid skill to .factory/skills/<name>/SKILL.md', async () => {
      const mockPackage = {
        id: 'test-droid-skill',
        name: 'test-droid-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 5,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Droid Skill'));

      await handleInstall('test-droid-skill', { as: 'droid' });

      expect(saveFile).toHaveBeenCalledWith('.factory/skills/test-droid-skill/SKILL.md', expect.any(String));
    });
  });

  describe('Copilot format', () => {
    it('installs copilot skill to .github/skills/<name>/SKILL.md', async () => {
      const mockPackage = {
        id: 'test-copilot-skill',
        name: 'test-copilot-skill',
        format: 'copilot',
        subtype: 'skill',
        tags: [],
        total_downloads: 10,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(`---
name: test-copilot-skill
description: A test Copilot skill
---

# Test Copilot Skill

This is a test skill for GitHub Copilot.
`));

      await handleInstall('test-copilot-skill', {});

      expect(saveFile).toHaveBeenCalledWith('.github/skills/test-copilot-skill/SKILL.md', expect.any(String));
    });

    it('installs copilot rule to .github/instructions/', async () => {
      const mockPackage = {
        id: 'test-copilot-rule',
        name: 'test-copilot-rule',
        format: 'copilot',
        subtype: 'rule',
        tags: [],
        total_downloads: 10,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync(`---
applyTo:
  - "**/*.ts"
---

# TypeScript Guidelines

Follow TypeScript best practices.
`));

      await handleInstall('test-copilot-rule', {});

      expect(saveFile).toHaveBeenCalledWith('.github/instructions/test-copilot-rule.instructions.md', expect.any(String));
    });
  });

  describe('Claude package types', () => {
    it('should install claude-skill to .claude/skills', async () => {
      const mockPackage = {
        id: 'test-skill',
        name: 'test-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Skill\n\nThis is a test skill.'));

      await handleInstall('test-skill', {});

      // Verify file was saved to correct location (relative path)
      const expectedPath = '.claude/skills/test-skill/SKILL.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      // Verify directory exists
      const destDir = getDestinationDir('claude', 'skill', 'test-skill');
      expect(destDir).toBe('.claude/skills/test-skill');
    });

    it('should install claude-agent to .claude/agents', async () => {
      const mockPackage = {
        id: 'test-agent',
        name: 'test-agent',
        format: 'claude',
        subtype: 'agent',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Agent\n\nThis is a test agent.'));

      await handleInstall('test-agent', {});

      const expectedPath = '.claude/agents/test-agent.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('claude', 'agent');
      expect(destDir).toBe('.claude/agents');
    });

    it('should install claude-slash-command to .claude/commands', async () => {
      const mockPackage = {
        id: 'test-command',
        name: 'test-command',
        format: 'claude',
        subtype: 'slash-command',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Command\n\nThis is a test command.'));

      await handleInstall('test-command', {});

      const expectedPath = '.claude/commands/test-command.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('claude', 'slash-command');
      expect(destDir).toBe('.claude/commands');
    });
  });

  describe('Format conversions with --as', () => {
    it('should install cursor package with --as claude to .claude/agents', async () => {
      const mockPackage = {
        id: 'test-cursor-rule',
        name: 'test-cursor-rule',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Rule\n\nThis is a test rule.'));

      await handleInstall('test-cursor-rule', { as: 'claude' });

      // Generic cursor type maps to claude-agent when using --as claude
      const expectedPath = '.claude/agents/test-cursor-rule.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it('should install skill with --as cursor to .openskills (progressive disclosure)', async () => {
      const mockPackage = {
        id: 'test-skill',
        name: 'test-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Skill\n\nThis is a test skill.'));

      await handleInstall('test-skill', { as: 'cursor' });

      // Cursor doesn't have native skill support - uses progressive disclosure
      const expectedPath = '.openskills/test-skill/SKILL.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it('should install cursor package to .cursor/rules by default', async () => {
      const mockPackage = {
        id: 'test-cursor',
        name: 'test-cursor',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await handleInstall('test-cursor', {});

      const expectedPath = '.cursor/rules/test-cursor.mdc';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('cursor', 'rule');
      expect(destDir).toBe('.cursor/rules');
    });

    it('should install cursor package to nested .cursor directory when --location is provided', async () => {
      const mockPackage = {
        id: 'nested-cursor',
        name: 'nested-cursor',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Nested Cursor Rule'));

      await handleInstall('nested-cursor', { as: 'cursor', location: 'backend/server' });

      const nestedPath = path.join('backend/server', '.cursor/rules/nested-cursor.mdc');
      expect(saveFile).toHaveBeenCalledWith(nestedPath, expect.any(String));
    });

    it('should install continue package to .continue/rules', async () => {
      const mockPackage = {
        id: 'test-continue',
        name: 'test-continue',
        format: 'continue',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Continue Rule\n\nThis is a test rule.'));

      await handleInstall('test-continue', {});

      const expectedPath = '.continue/rules/test-continue.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('continue', 'rule');
      expect(destDir).toBe('.continue/rules');
    });

    it('should install windsurf package to .windsurf/rules', async () => {
      const mockPackage = {
        id: 'test-windsurf',
        name: 'test-windsurf',
        format: 'windsurf',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Windsurf Rule\n\nThis is a test rule.'));

      await handleInstall('test-windsurf', {});

      const expectedPath = '.windsurf/rules/test-windsurf.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('windsurf', 'rule');
      expect(destDir).toBe('.windsurf/rules');
    });

    it('should install agents.md package to project root AGENTS.md', async () => {
      const mockPackage = {
        id: 'test-agents',
        name: 'test-agents',
        format: 'agents.md',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Agents.md Rule\n\nThis is a test rule.'));

      await handleInstall('test-agents', {});

      const expectedPath = 'AGENTS.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));

      const destDir = getDestinationDir('agents.md', 'rule');
      expect(destDir).toBe('.');
    });

    it('should install package with --as agents.md to project root AGENTS.md', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await handleInstall('test-cursor-to-agents', { as: 'agents.md' });

      const expectedPath = 'AGENTS.md';
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it('should install agents.md package to custom location when --location is provided', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await handleInstall('test-cursor-to-agents', { as: 'agents.md', location: 'custom/dir' });

      const expectedPath = path.join('custom/dir', 'AGENTS.override.md');
      expect(saveFile).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it('should prompt before overwriting existing AGENTS.md', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await fs.writeFile(path.join(testDir, 'AGENTS.md'), '# Existing file');
      promptYesNoMock.mockResolvedValueOnce(false);

      await handleInstall('test-cursor-to-agents', { as: 'agents.md' });

      expect(promptYesNoMock).toHaveBeenCalled();
      expect(saveFile).not.toHaveBeenCalled();
    });

    it('should overwrite AGENTS.md when user confirms prompt', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await fs.writeFile(path.join(testDir, 'AGENTS.md'), '# Existing file');
      promptYesNoMock.mockResolvedValueOnce(true);

      await handleInstall('test-cursor-to-agents', { as: 'agents.md' });

      expect(promptYesNoMock).toHaveBeenCalled();
      expect(saveFile).toHaveBeenCalledWith('AGENTS.md', expect.any(String));
    });

    it('should prompt before overwriting custom location AGENTS.override.md', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await fs.mkdir(path.join(testDir, 'custom/dir'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'custom/dir/AGENTS.override.md'), '# Existing file');
      promptYesNoMock.mockResolvedValueOnce(false);

      await handleInstall('test-cursor-to-agents', { as: 'agents.md', location: 'custom/dir' });

      expect(promptYesNoMock).toHaveBeenCalled();
      expect(saveFile).not.toHaveBeenCalled();
    });

    it('should skip prompt when force option is provided', async () => {
      const mockPackage = {
        id: 'test-cursor-to-agents',
        name: 'test-cursor-to-agents',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Rule\n\nThis is a test rule.'));

      await fs.writeFile(path.join(testDir, 'AGENTS.md'), '# Existing file');

      await handleInstall('test-cursor-to-agents', { as: 'agents.md', force: true });

      expect(promptYesNoMock).not.toHaveBeenCalled();
      expect(saveFile).toHaveBeenCalledWith('AGENTS.md', expect.any(String));
    });
  });

  describe('Progressive disclosure - partial native support', () => {
    it('installs cursor agent to .openagents/<name>/AGENT.md and updates AGENTS.md manifest', async () => {
      // Cursor has native rules/commands but no native agents
      const mockPackage = {
        id: 'test-cursor-agent',
        name: 'test-cursor-agent',
        format: 'claude',
        subtype: 'agent',
        tags: [],
        total_downloads: 10,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Agent'));

      await handleInstall('test-cursor-agent', { as: 'cursor' });

      expect(saveFile).toHaveBeenCalledWith('.openagents/test-cursor-agent/AGENT.md', expect.any(String));
      expect(addSkillToManifestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-cursor-agent',
          skillPath: '.openagents/test-cursor-agent',
          mainFile: 'AGENT.md',
          resourceType: 'agent',
        }),
        'AGENTS.md'
      );
    });

    it('installs opencode skill to native .opencode/skill/<name>/<name>.md (native skill support)', async () => {
      // OpenCode has native skill support - should NOT use progressive disclosure
      const mockPackage = {
        id: 'test-opencode-skill',
        name: 'test-opencode-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 10,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test OpenCode Skill'));

      await handleInstall('test-opencode-skill', { as: 'opencode' });

      // OpenCode has native skill support - installs to .opencode/skill/<name>/
      expect(saveFile).toHaveBeenCalledWith('.opencode/skill/test-opencode-skill/test-opencode-skill.md', expect.any(String));
      // No progressive disclosure manifest update for native format
      expect(addSkillToManifestMock).not.toHaveBeenCalled();
    });

    it('installs opencode agent to native .opencode/agent/<name>.md (no progressive disclosure)', async () => {
      // OpenCode has native agent support - should NOT use progressive disclosure
      const mockPackage = {
        id: 'test-opencode-agent',
        name: 'test-opencode-agent',
        format: 'claude',
        subtype: 'agent',
        tags: [],
        total_downloads: 10,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test OpenCode Agent'));

      await handleInstall('test-opencode-agent', { as: 'opencode' });

      expect(saveFile).toHaveBeenCalledWith('.opencode/agent/test-opencode-agent.md', expect.any(String));
      // Should NOT call addSkillToManifest for native agent support
      expect(addSkillToManifestMock).not.toHaveBeenCalled();
    });

    it('installs droid agent to .openagents/<name>/AGENT.md and updates AGENTS.md manifest', async () => {
      // Factory Droid has native skills/commands/hooks but no native agents
      const mockPackage = {
        id: 'test-droid-agent',
        name: 'test-droid-agent',
        format: 'claude',
        subtype: 'agent',
        tags: [],
        total_downloads: 10,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Droid Agent'));

      await handleInstall('test-droid-agent', { as: 'droid' });

      expect(saveFile).toHaveBeenCalledWith('.openagents/test-droid-agent/AGENT.md', expect.any(String));
      expect(addSkillToManifestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-droid-agent',
          skillPath: '.openagents/test-droid-agent',
          mainFile: 'AGENT.md',
          resourceType: 'agent',
        }),
        'AGENTS.md'
      );
    });

    it('installs cursor skill to .openskills with progressive disclosure (no native skill support)', async () => {
      // Cursor does NOT have native skill support - skills use progressive disclosure
      const mockPackage = {
        id: 'test-cursor-skill',
        name: 'test-cursor-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 10,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Cursor Skill'));

      await handleInstall('test-cursor-skill', { as: 'cursor' });

      // Skills go to .openskills/ with AGENTS.md reference (progressive disclosure)
      expect(saveFile).toHaveBeenCalledWith('.openskills/test-cursor-skill/SKILL.md', expect.any(String));
      // SHOULD call addSkillToManifest for progressive disclosure
      expect(addSkillToManifestMock).toHaveBeenCalled();
    });
  });

  describe('MCP server packages', () => {
    const mcpServerJson = JSON.stringify({
      name: 'Test MCP Server',
      mcpServers: {
        'test-server': {
          command: 'npx',
          args: ['-y', '@test/mcp-server'],
          env: { API_URL: 'https://api.test.dev' },
        },
      },
    });

    // Helper to create a proper gzipped tar archive with a JSON file inside
    async function createMCPTarball(content: string): Promise<Buffer> {
      const tmpDir = path.join(testDir, '.tmp-tar');
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.writeFile(path.join(tmpDir, 'mcp-server.json'), content);
      const tar = await import('tar');
      const tarPath = path.join(testDir, '.tmp-archive.tar.gz');
      await tar.create({ gzip: true, file: tarPath, cwd: tmpDir }, ['mcp-server.json']);
      const tarball = await fs.readFile(tarPath);
      await fs.rm(tmpDir, { recursive: true, force: true });
      await fs.rm(tarPath, { force: true });
      return tarball;
    }

    it('installs MCP server (subtype: server) to .codex/config.toml with --as codex (via editor option)', async () => {
      const mockPackage = {
        id: '@test/mcp-server',
        name: '@test/mcp-server',
        format: 'mcp',
        subtype: 'server',
        tags: ['mcp'],
        total_downloads: 5,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(await createMCPTarball(mcpServerJson));

      await handleInstall('@test/mcp-server', { editor: 'codex' });

      // Should write to .codex/config.toml, not agents.md or any other format
      const codexConfig = await fs.readFile(path.join(testDir, '.codex', 'config.toml'), 'utf-8');
      expect(codexConfig).toContain('[mcp_servers.test-server]');
      expect(codexConfig).toContain('command = "npx"');
    });

    it('installs MCP tool (subtype: tool) to .codex/config.toml with --as codex (via editor option)', async () => {
      const mockPackage = {
        id: '@test/mcp-tool',
        name: '@test/mcp-tool',
        format: 'mcp',
        subtype: 'tool',
        tags: ['mcp'],
        total_downloads: 5,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(await createMCPTarball(mcpServerJson));

      await handleInstall('@test/mcp-tool', { editor: 'codex' });

      // subtype: tool should also use the MCP install path
      const codexConfig = await fs.readFile(path.join(testDir, '.codex', 'config.toml'), 'utf-8');
      expect(codexConfig).toContain('[mcp_servers.test-server]');
    });

    it('installs MCP package to .mcp.json with default editor (claude)', async () => {
      const mockPackage = {
        id: '@test/mcp-default',
        name: '@test/mcp-default',
        format: 'mcp',
        subtype: 'tool',
        tags: ['mcp'],
        total_downloads: 5,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(await createMCPTarball(mcpServerJson));

      await handleInstall('@test/mcp-default', {});

      // Default editor is claude, which writes to .mcp.json
      const mcpConfig = JSON.parse(await fs.readFile(path.join(testDir, '.mcp.json'), 'utf-8'));
      expect(mcpConfig.mcpServers['test-server']).toBeDefined();
      expect(mcpConfig.mcpServers['test-server'].command).toBe('npx');
    });

    it('installs MCP server to .codex/config.toml when --as codex is used (as + editor)', async () => {
      // This tests the real CLI path: --as codex sets both as: 'codex' and editor: 'codex'
      const mockPackage = {
        id: '@test/mcp-as-codex',
        name: '@test/mcp-as-codex',
        format: 'mcp',
        subtype: 'server',
        tags: ['mcp'],
        total_downloads: 5,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(await createMCPTarball(mcpServerJson));

      // The CLI passes both as and editor when --as codex is used
      await handleInstall('@test/mcp-as-codex', { as: 'codex', editor: 'codex' });

      // Should write to .codex/config.toml, NOT to AGENTS.md
      const codexConfig = await fs.readFile(path.join(testDir, '.codex', 'config.toml'), 'utf-8');
      expect(codexConfig).toContain('[mcp_servers.test-server]');
      expect(codexConfig).toContain('command = "npx"');

      // Should NOT have saved any AGENTS.md content
      expect(saveFile).not.toHaveBeenCalledWith(expect.stringContaining('AGENTS.md'), expect.any(String));
    });

    it('installs MCP tool to .cursor/mcp.json when --as cursor is used (as + editor)', async () => {
      const mockPackage = {
        id: '@test/mcp-as-cursor',
        name: '@test/mcp-as-cursor',
        format: 'mcp',
        subtype: 'tool',
        tags: ['mcp'],
        total_downloads: 5,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(await createMCPTarball(mcpServerJson));

      await handleInstall('@test/mcp-as-cursor', { as: 'cursor', editor: 'cursor' });

      const cursorConfig = JSON.parse(await fs.readFile(path.join(testDir, '.cursor', 'mcp.json'), 'utf-8'));
      expect(cursorConfig.mcpServers['test-server']).toBeDefined();
      expect(cursorConfig.mcpServers['test-server'].command).toBe('npx');
    });

    it('preserves MCP format even when auto-detection would pick agents.md', async () => {
      // Create .agents.md directory to trigger auto-detection
      await fs.mkdir(path.join(testDir, '.agents.md'), { recursive: true });

      const mockPackage = {
        id: '@test/mcp-autodetect',
        name: '@test/mcp-autodetect',
        format: 'mcp',
        subtype: 'tool',
        tags: ['mcp'],
        total_downloads: 5,
        verified: false,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(await createMCPTarball(mcpServerJson));

      await handleInstall('@test/mcp-autodetect', { editor: 'codex' });

      // Should install as MCP server, NOT as agents.md
      const codexConfig = await fs.readFile(path.join(testDir, '.codex', 'config.toml'), 'utf-8');
      expect(codexConfig).toContain('[mcp_servers.test-server]');

      // Should NOT have created/modified AGENTS.md
      expect(saveFile).not.toHaveBeenCalledWith('AGENTS.md', expect.any(String));
    });
  });

  describe('Lockfile metadata', () => {
    it('should record both installed and source formats in lockfile', async () => {
      const mockPackage = {
        id: 'test-skill',
        name: 'test-skill',
        format: 'claude',
        subtype: 'skill',
        tags: [],
        total_downloads: 100,
        verified: true,
        latest_version: {
          version: '1.0.0',
          tarball_url: 'https://example.com/package.tar.gz',
        },
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockResolvedValue(gzipSync('# Test Skill'));

      await handleInstall('test-skill', { as: 'cursor' });

      // Format/subtype should reflect installed version, source fields preserve original metadata
      expect(addToLockfile).toHaveBeenCalledWith(
        expect.any(Object),
        'test-skill',
        expect.objectContaining({
          format: 'cursor',
          subtype: 'skill',
          sourceFormat: 'claude',
          sourceSubtype: 'skill',
        })
      );
    });
  });
});
