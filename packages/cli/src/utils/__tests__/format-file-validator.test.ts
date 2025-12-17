
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePackageFiles } from '../format-file-validator.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('content'),
}));

// Mock @pr-pm/converters
vi.mock('@pr-pm/converters', () => ({
  validateMarkdown: vi.fn(),
  validateFormat: vi.fn(),
}));

import { readFile } from 'fs/promises';
import { validateMarkdown, validateFormat } from '@pr-pm/converters';

describe('validatePackageFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (readFile as any).mockResolvedValue('content');
    (validateMarkdown as any).mockReturnValue({ valid: true, errors: [], warnings: [] });
    (validateFormat as any).mockReturnValue({ valid: true, errors: [], warnings: [] });
  });

  it('should validate Claude files', async () => {
    const manifest = {
      name: 'test',
      version: '1.0.0',
      format: 'claude',
      subtype: 'agent',
      files: ['.claude/agents/agent.md'],
    };

    await validatePackageFiles(manifest as any);

    expect(validateMarkdown).toHaveBeenCalledWith('claude', 'content', 'agent');
  });

  it('should validate Kiro hooks using validateFormat', async () => {
    const manifest = {
      name: 'test',
      version: '1.0.0',
      format: 'kiro',
      subtype: 'hook',
      files: ['hook.json'],
    };

    // Setup readFile for json
    (readFile as any).mockResolvedValue('{}');

    await validatePackageFiles(manifest as any);

    expect(validateFormat).toHaveBeenCalledWith('kiro', {}, 'hook');
  });

  it('should validate Kiro steering files using validateMarkdown', async () => {
    const manifest = {
      name: 'test',
      version: '1.0.0',
      format: 'kiro',
      files: ['steering.md'],
    };

    await validatePackageFiles(manifest as any);

    expect(validateMarkdown).toHaveBeenCalledWith('kiro', 'content', undefined); // Subtype undefined for steering
  });

  it('should warn for unknown formats', async () => {
    const manifest = {
      name: 'test',
      version: '1.0.0',
      format: 'unknown',
      files: ['file.md'],
    };

    const result = await validatePackageFiles(manifest as any);

    expect(result.warnings[0]).toContain('not recognized');
  });

  describe('Claude Skills - SKILL.md validation', () => {
    it('should validate SKILL.md for Claude skills', async () => {
      const manifest = {
        name: 'test-skill',
        version: '1.0.0',
        format: 'claude',
        subtype: 'skill',
        files: ['SKILL.md', 'README.md'],
      };

      await validatePackageFiles(manifest as any);

      expect(validateMarkdown).toHaveBeenCalledWith('claude', 'content', 'skill');
    });

    it('should only validate SKILL.md, not other .md files in skill packages', async () => {
      const manifest = {
        name: 'test-skill',
        version: '1.0.0',
        format: 'claude',
        subtype: 'skill',
        files: ['SKILL.md', 'helper.md', 'README.md'],
      };

      await validatePackageFiles(manifest as any);

      // Should only validate SKILL.md once
      expect(validateMarkdown).toHaveBeenCalledTimes(1);
      expect(validateMarkdown).toHaveBeenCalledWith('claude', 'content', 'skill');
    });

    it('should error when skill has no .md files', async () => {
      const manifest = {
        name: 'test-skill',
        version: '1.0.0',
        format: 'claude',
        subtype: 'skill',
        files: ['README.md', 'LICENSE'],
      };

      const result = await validatePackageFiles(manifest as any);

      expect(result.errors).toContainEqual(
        expect.stringContaining('Claude skills must contain a markdown file')
      );
    });

    it('should warn when single .md file will be auto-renamed', async () => {
      const manifest = {
        name: 'test-skill',
        version: '1.0.0',
        format: 'claude',
        subtype: 'skill',
        files: ['my-skill.md', 'README.md'],
      };

      const result = await validatePackageFiles(manifest as any);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('auto-renamed to SKILL.md')
      );
    });

    it('should error when multiple .md files without SKILL.md', async () => {
      const manifest = {
        name: 'test-skill',
        version: '1.0.0',
        format: 'claude',
        subtype: 'skill',
        files: ['skill1.md', 'skill2.md', 'README.md'],
      };

      const result = await validatePackageFiles(manifest as any);

      expect(result.errors).toContainEqual(
        expect.stringContaining('must use SKILL.md')
      );
    });

    it('should accept multiple .md files when SKILL.md is present', async () => {
      const manifest = {
        name: 'test-skill',
        version: '1.0.0',
        format: 'claude',
        subtype: 'skill',
        files: ['SKILL.md', 'helper.md', 'README.md'],
      };

      const result = await validatePackageFiles(manifest as any);

      // No errors about SKILL.md
      expect(result.errors).not.toContainEqual(
        expect.stringContaining('SKILL.md')
      );
    });

    it('should not validate markdown files for Claude hooks', async () => {
      const manifest = {
        name: 'test-hook',
        version: '1.0.0',
        format: 'claude',
        subtype: 'hook',
        files: ['hook.js', 'README.md'],
      };

      await validatePackageFiles(manifest as any);

      // Should not validate any markdown files for hooks
      expect(validateMarkdown).not.toHaveBeenCalled();
    });
  });
});
