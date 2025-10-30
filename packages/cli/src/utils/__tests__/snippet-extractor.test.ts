/**
 * Tests for snippet-extractor utilities
 */

import { extractSnippet, validateSnippet } from '../snippet-extractor';
import type { PackageManifest } from '../../types/registry';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('snippet-extractor', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Create test directory
    testDir = join(tmpdir(), `prpm-snippet-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(testDir, { recursive: true, force: true });
  });

  describe('extractSnippet', () => {
    it('should extract full content from small files', async () => {
      const content = 'This is a short prompt file.\nIt has multiple lines.\nBut is under 2000 characters.';
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/test-package.mdc'), content);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: ['.cursor/rules/test-package.mdc'],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBe(content.trim());
    });

    it('should truncate content from large files', async () => {
      const longContent = 'A'.repeat(3000);
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/test-package.mdc'), longContent);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: ['.cursor/rules/test-package.mdc'],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toContain('[... content truncated ...]');
      expect(snippet!.length).toBeLessThan(longContent.length);
      expect(snippet!.length).toBeGreaterThan(2000);
    });

    it('should break at newline when possible', async () => {
      const content = 'Line 1\n'.repeat(300) + 'A'.repeat(1000) + '\nFinal line';
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/test-package.mdc'), content);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: ['.cursor/rules/test-package.mdc'],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toContain('[... content truncated ...]');
      // Should end at a newline, not in the middle of the 'A' string
      expect(snippet!.split('\n').pop()).toBe('[... content truncated ...]');
    });

    it('should prefer main file over first file', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/file1.mdc'), 'First file content');
      await writeFile(join(testDir, '.cursor/rules/file2.mdc'), 'Second file content');

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: ['.cursor/rules/file1.mdc', '.cursor/rules/file2.mdc'],
        main: '.cursor/rules/file2.mdc',
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBe('Second file content');
    });

    it('should return null when no files in manifest', async () => {
      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: [],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBeNull();
    });

    it('should return null when file does not exist', async () => {
      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: ['.cursor/rules/nonexistent.mdc'],
      };

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBeNull();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should return null when path is a directory', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await mkdir(join(testDir, '.cursor/rules/subdir'));

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: ['.cursor/rules/subdir'],
      };

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('directory'));

      warnSpy.mockRestore();
    });

    it('should handle file metadata objects', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/test-package.mdc'), 'Test content');

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: [
          {
            path: '.cursor/rules/test-package.mdc',
            type: 'prompt',
          },
        ],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBe('Test content');
    });

    it('should trim whitespace from extracted content', async () => {
      const content = '\n\n  Prompt content with whitespace  \n\n';
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/test-package.mdc'), content);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: ['.cursor/rules/test-package.mdc'],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBe('Prompt content with whitespace');
    });

    it('should handle UTF-8 content correctly', async () => {
      const content = '这是中文内容\n日本語コンテンツ\nEmoji: 🚀 📦 ✨';
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/test-package.mdc'), content);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        files: ['.cursor/rules/test-package.mdc'],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBe(content.trim());
    });
  });

  describe('validateSnippet', () => {
    let warnSpy: jest.SpyInstance;
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      logSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      warnSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('should warn when snippet is null', () => {
      validateSnippet(null, 'test-package');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No content snippet'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('test-package'));
    });

    it('should log snippet length when snippet exists', () => {
      const snippet = 'This is a test snippet';

      validateSnippet(snippet, 'test-package');

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('22 characters'));
    });

    it('should provide helpful message when snippet missing', () => {
      validateSnippet(null, 'test-package');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('preview snippet'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('before installing'));
    });
  });
});
