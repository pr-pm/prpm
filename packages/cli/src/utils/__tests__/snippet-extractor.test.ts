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
      await writeFile(join(testDir, 'prompt.md'), content);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['prompt.md'],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBe(content.trim());
    });

    it('should truncate content from large files', async () => {
      const longContent = 'A'.repeat(3000);
      await writeFile(join(testDir, 'long-prompt.md'), longContent);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['long-prompt.md'],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toContain('[... content truncated ...]');
      expect(snippet!.length).toBeLessThan(longContent.length);
      expect(snippet!.length).toBeGreaterThan(2000);
    });

    it('should break at newline when possible', async () => {
      const content = 'Line 1\n'.repeat(100) + 'A'.repeat(1000) + '\nFinal line';
      await writeFile(join(testDir, 'prompt.md'), content);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['prompt.md'],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toContain('[... content truncated ...]');
      // Should end at a newline, not in the middle of the 'A' string
      expect(snippet!.split('\n').pop()).toBe('[... content truncated ...]');
    });

    it('should prefer main file over first file', async () => {
      await writeFile(join(testDir, 'file1.md'), 'First file content');
      await writeFile(join(testDir, 'file2.md'), 'Second file content');

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['file1.md', 'file2.md'],
        main: 'file2.md',
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
        files: ['nonexistent.md'],
      };

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBeNull();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should return null when path is a directory', async () => {
      await mkdir(join(testDir, 'subdir'));

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['subdir'],
      };

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('directory'));

      warnSpy.mockRestore();
    });

    it('should handle file metadata objects', async () => {
      await writeFile(join(testDir, 'prompt.md'), 'Test content');

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: [
          {
            path: 'prompt.md',
            type: 'prompt',
          },
        ],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBe('Test content');
    });

    it('should trim whitespace from extracted content', async () => {
      const content = '\n\n  Prompt content with whitespace  \n\n';
      await writeFile(join(testDir, 'prompt.md'), content);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['prompt.md'],
      };

      const snippet = await extractSnippet(manifest);

      expect(snippet).toBe('Prompt content with whitespace');
    });

    it('should handle UTF-8 content correctly', async () => {
      const content = '这是中文内容\n日本語コンテンツ\nEmoji: 🚀 📦 ✨';
      await writeFile(join(testDir, 'prompt.md'), content);

      const manifest: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['prompt.md'],
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
