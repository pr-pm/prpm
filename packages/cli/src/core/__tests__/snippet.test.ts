/**
 * Tests for snippet utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  generateSnippetMarkers,
  wrapSnippetContent,
  installSnippet,
  uninstallSnippet,
  listSnippetsInFile,
  isSnippetInstalled,
} from '../snippet.js';

describe('snippet utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(join(tmpdir(), 'prpm-snippet-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('generateSnippetMarkers', () => {
    it('should generate correct start and end markers', () => {
      const markers = generateSnippetMarkers('@prpm/my-snippet', '1.0.0');
      expect(markers.start).toBe('<!-- prpm:snippet:start @prpm/my-snippet@1.0.0 -->');
      expect(markers.end).toBe('<!-- prpm:snippet:end @prpm/my-snippet@1.0.0 -->');
    });

    it('should handle scoped packages', () => {
      const markers = generateSnippetMarkers('@org/package-name', '2.1.3');
      expect(markers.start).toBe('<!-- prpm:snippet:start @org/package-name@2.1.3 -->');
      expect(markers.end).toBe('<!-- prpm:snippet:end @org/package-name@2.1.3 -->');
    });
  });

  describe('wrapSnippetContent', () => {
    it('should wrap content with markers', () => {
      const wrapped = wrapSnippetContent('Test content', '@prpm/test', '1.0.0');
      expect(wrapped).toContain('<!-- prpm:snippet:start @prpm/test@1.0.0 -->');
      expect(wrapped).toContain('Test content');
      expect(wrapped).toContain('<!-- prpm:snippet:end @prpm/test@1.0.0 -->');
    });

    it('should add header when provided', () => {
      const wrapped = wrapSnippetContent('Test content', '@prpm/test', '1.0.0', 'My Section');
      expect(wrapped).toContain('## My Section');
      expect(wrapped).toContain('Test content');
    });

    it('should trim content', () => {
      const wrapped = wrapSnippetContent('  Test content  \n\n', '@prpm/test', '1.0.0');
      expect(wrapped).toContain('Test content');
      expect(wrapped).not.toContain('Test content  \n\n');
    });
  });

  describe('installSnippet', () => {
    it('should create new file if target does not exist', async () => {
      const targetPath = join(testDir, 'AGENTS.md');

      const result = await installSnippet('Test content', '@prpm/test', '1.0.0', {
        target: targetPath,
      });

      expect(result.created).toBe(true);
      expect(result.targetPath).toBe(targetPath);

      const content = await fs.readFile(targetPath, 'utf-8');
      expect(content).toContain('<!-- prpm:snippet:start @prpm/test@1.0.0 -->');
      expect(content).toContain('Test content');
    });

    it('should append to existing file by default', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, '# Existing Content\n\nSome text here.\n', 'utf-8');

      const result = await installSnippet('New snippet', '@prpm/test', '1.0.0', {
        target: targetPath,
        position: 'append',
      });

      expect(result.created).toBe(false);
      expect(result.position).toBe('append');

      const content = await fs.readFile(targetPath, 'utf-8');
      expect(content).toContain('# Existing Content');
      expect(content).toContain('New snippet');
      // Snippet should be after existing content
      const existingIndex = content.indexOf('# Existing Content');
      const snippetIndex = content.indexOf('New snippet');
      expect(snippetIndex).toBeGreaterThan(existingIndex);
    });

    it('should prepend to existing file', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, '# Existing Content\n', 'utf-8');

      const result = await installSnippet('Prepended snippet', '@prpm/test', '1.0.0', {
        target: targetPath,
        position: 'prepend',
      });

      expect(result.position).toBe('prepend');

      const content = await fs.readFile(targetPath, 'utf-8');
      const existingIndex = content.indexOf('# Existing Content');
      const snippetIndex = content.indexOf('Prepended snippet');
      expect(snippetIndex).toBeLessThan(existingIndex);
    });

    it('should insert after section header', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, `# Title

## Section One

Content of section one.

## Section Two

Content of section two.
`, 'utf-8');

      const result = await installSnippet('Inserted snippet', '@prpm/test', '1.0.0', {
        target: targetPath,
        position: 'section:## Section One',
      });

      expect(result.position).toContain('Section One');

      const content = await fs.readFile(targetPath, 'utf-8');
      // Snippet should be between Section One content and Section Two header
      const sectionOneIndex = content.indexOf('Content of section one');
      const snippetIndex = content.indexOf('Inserted snippet');
      const sectionTwoIndex = content.indexOf('## Section Two');
      expect(snippetIndex).toBeGreaterThan(sectionOneIndex);
      expect(snippetIndex).toBeLessThan(sectionTwoIndex);
    });

    it('should append if section not found', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, '# Existing Content\n', 'utf-8');

      const result = await installSnippet('Snippet', '@prpm/test', '1.0.0', {
        target: targetPath,
        position: 'section:## Non-existent Section',
      });

      expect(result.position).toContain('section not found');

      const content = await fs.readFile(targetPath, 'utf-8');
      expect(content).toContain('Snippet');
    });

    it('should update existing snippet with same package ID', async () => {
      const targetPath = join(testDir, 'AGENTS.md');

      // Install first version
      await installSnippet('Version 1', '@prpm/test', '1.0.0', {
        target: targetPath,
      });

      // Install second version (should replace)
      await installSnippet('Version 2', '@prpm/test', '2.0.0', {
        target: targetPath,
      });

      const content = await fs.readFile(targetPath, 'utf-8');
      expect(content).not.toContain('Version 1');
      expect(content).toContain('Version 2');
      expect(content).toContain('@prpm/test@2.0.0');
    });

    it('should add header to snippet', async () => {
      const targetPath = join(testDir, 'AGENTS.md');

      await installSnippet('Snippet content', '@prpm/test', '1.0.0', {
        target: targetPath,
        header: 'Custom Instructions',
      });

      const content = await fs.readFile(targetPath, 'utf-8');
      expect(content).toContain('## Custom Instructions');
      expect(content).toContain('Snippet content');
    });

    it('should create nested directories if needed', async () => {
      const targetPath = join(testDir, 'nested', 'path', 'AGENTS.md');

      await installSnippet('Content', '@prpm/test', '1.0.0', {
        target: targetPath,
      });

      const content = await fs.readFile(targetPath, 'utf-8');
      expect(content).toContain('Content');
    });
  });

  describe('uninstallSnippet', () => {
    it('should remove snippet from file', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, `# Title

<!-- prpm:snippet:start @prpm/test@1.0.0 -->
Snippet content
<!-- prpm:snippet:end @prpm/test@1.0.0 -->

# More content
`, 'utf-8');

      const removed = await uninstallSnippet(targetPath, '@prpm/test');

      expect(removed).toBe(true);

      const content = await fs.readFile(targetPath, 'utf-8');
      expect(content).not.toContain('Snippet content');
      expect(content).not.toContain('prpm:snippet:start');
      expect(content).toContain('# Title');
      expect(content).toContain('# More content');
    });

    it('should return false if snippet not found', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, '# Content without snippets\n', 'utf-8');

      const removed = await uninstallSnippet(targetPath, '@prpm/nonexistent');

      expect(removed).toBe(false);
    });

    it('should return false if file does not exist', async () => {
      const targetPath = join(testDir, 'nonexistent.md');

      const removed = await uninstallSnippet(targetPath, '@prpm/test');

      expect(removed).toBe(false);
    });

    it('should delete file if it becomes empty after removal', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, `<!-- prpm:snippet:start @prpm/test@1.0.0 -->
Only snippet content
<!-- prpm:snippet:end @prpm/test@1.0.0 -->
`, 'utf-8');

      await uninstallSnippet(targetPath, '@prpm/test');

      await expect(fs.access(targetPath)).rejects.toThrow();
    });

    it('should remove snippet regardless of version', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, `<!-- prpm:snippet:start @prpm/test@2.5.0 -->
Content
<!-- prpm:snippet:end @prpm/test@2.5.0 -->
`, 'utf-8');

      const removed = await uninstallSnippet(targetPath, '@prpm/test');

      expect(removed).toBe(true);
    });
  });

  describe('listSnippetsInFile', () => {
    it('should list all snippets in file', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, `# Title

<!-- prpm:snippet:start @prpm/snippet-a@1.0.0 -->
Content A
<!-- prpm:snippet:end @prpm/snippet-a@1.0.0 -->

<!-- prpm:snippet:start @prpm/snippet-b@2.0.0 -->
Content B
<!-- prpm:snippet:end @prpm/snippet-b@2.0.0 -->
`, 'utf-8');

      const snippets = await listSnippetsInFile(targetPath);

      expect(snippets).toHaveLength(2);
      expect(snippets).toContainEqual({ packageId: '@prpm/snippet-a', version: '1.0.0' });
      expect(snippets).toContainEqual({ packageId: '@prpm/snippet-b', version: '2.0.0' });
    });

    it('should return empty array if no snippets', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, '# No snippets here\n', 'utf-8');

      const snippets = await listSnippetsInFile(targetPath);

      expect(snippets).toEqual([]);
    });

    it('should return empty array if file does not exist', async () => {
      const targetPath = join(testDir, 'nonexistent.md');

      const snippets = await listSnippetsInFile(targetPath);

      expect(snippets).toEqual([]);
    });
  });

  describe('isSnippetInstalled', () => {
    it('should return true if snippet is installed', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, `<!-- prpm:snippet:start @prpm/test@1.0.0 -->
Content
<!-- prpm:snippet:end @prpm/test@1.0.0 -->
`, 'utf-8');

      const installed = await isSnippetInstalled(targetPath, '@prpm/test');

      expect(installed).toBe(true);
    });

    it('should return false if snippet not installed', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, '# No snippets\n', 'utf-8');

      const installed = await isSnippetInstalled(targetPath, '@prpm/test');

      expect(installed).toBe(false);
    });

    it('should return false if file does not exist', async () => {
      const targetPath = join(testDir, 'nonexistent.md');

      const installed = await isSnippetInstalled(targetPath, '@prpm/test');

      expect(installed).toBe(false);
    });

    it('should detect snippet with any version', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, `<!-- prpm:snippet:start @prpm/test@5.2.1 -->
Content
<!-- prpm:snippet:end @prpm/test@5.2.1 -->
`, 'utf-8');

      const installed = await isSnippetInstalled(targetPath, '@prpm/test');

      expect(installed).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple snippets in one file', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      await fs.writeFile(targetPath, '# My Agent Instructions\n', 'utf-8');

      // Install three snippets
      await installSnippet('Content A', '@prpm/snippet-a', '1.0.0', { target: targetPath });
      await installSnippet('Content B', '@prpm/snippet-b', '1.0.0', { target: targetPath });
      await installSnippet('Content C', '@prpm/snippet-c', '1.0.0', { target: targetPath });

      let snippets = await listSnippetsInFile(targetPath);
      expect(snippets).toHaveLength(3);

      // Remove middle snippet
      await uninstallSnippet(targetPath, '@prpm/snippet-b');

      snippets = await listSnippetsInFile(targetPath);
      expect(snippets).toHaveLength(2);
      expect(snippets.map(s => s.packageId)).toContain('@prpm/snippet-a');
      expect(snippets.map(s => s.packageId)).toContain('@prpm/snippet-c');
      expect(snippets.map(s => s.packageId)).not.toContain('@prpm/snippet-b');

      const content = await fs.readFile(targetPath, 'utf-8');
      expect(content).toContain('Content A');
      expect(content).not.toContain('Content B');
      expect(content).toContain('Content C');
    });

    it('should preserve file content during install/uninstall cycle', async () => {
      const targetPath = join(testDir, 'AGENTS.md');
      const originalContent = `# My Instructions

This is important content that should be preserved.

## Section One

Content here.

## Section Two

More content.
`;
      await fs.writeFile(targetPath, originalContent, 'utf-8');

      // Install snippet
      await installSnippet('Temporary snippet', '@prpm/temp', '1.0.0', {
        target: targetPath,
        position: 'section:## Section One',
      });

      // Uninstall snippet
      await uninstallSnippet(targetPath, '@prpm/temp');

      const finalContent = await fs.readFile(targetPath, 'utf-8');

      // Original sections should still exist
      expect(finalContent).toContain('# My Instructions');
      expect(finalContent).toContain('This is important content');
      expect(finalContent).toContain('## Section One');
      expect(finalContent).toContain('## Section Two');
      // Snippet should be gone
      expect(finalContent).not.toContain('Temporary snippet');
      expect(finalContent).not.toContain('prpm:snippet');
    });
  });
});
