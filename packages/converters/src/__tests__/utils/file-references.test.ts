/**
 * Tests for file reference utilities
 */

import { describe, it, expect } from 'vitest';
import {
  extractAtReferences,
  categorizeFile,
  detectContentType,
  extractDirectories,
  hasAtReferences,
  groupByCategory,
} from '../../utils/file-references.js';

describe('File Reference Utilities', () => {
  describe('extractAtReferences', () => {
    it('should extract simple @file references', () => {
      const content = 'See @patterns/naming.md for details';
      const refs = extractAtReferences(content);

      expect(refs).toEqual(['patterns/naming.md']);
    });

    it('should extract multiple @file references', () => {
      const content = `
        See @patterns/naming.md and @examples/good.ts
        Also check @context/architecture.md
      `;
      const refs = extractAtReferences(content);

      expect(refs).toEqual([
        'patterns/naming.md',
        'examples/good.ts',
        'context/architecture.md',
      ]);
    });

    it('should handle references with relative paths', () => {
      const content = '@./config/settings.json and @../shared/utils.ts';
      const refs = extractAtReferences(content);

      expect(refs).toContain('./config/settings.json');
      expect(refs).toContain('../shared/utils.ts');
    });

    it('should handle references with dashes and underscores', () => {
      const content = '@my-patterns/snake_case_file.md';
      const refs = extractAtReferences(content);

      expect(refs).toEqual(['my-patterns/snake_case_file.md']);
    });

    it('should require file extension', () => {
      const content = '@patterns/naming @noextension';
      const refs = extractAtReferences(content);

      // Should not match references without extensions
      expect(refs).toHaveLength(0);
    });

    it('should remove duplicate references', () => {
      const content = `
        @patterns/naming.md
        @patterns/naming.md
        @patterns/naming.md
      `;
      const refs = extractAtReferences(content);

      expect(refs).toEqual(['patterns/naming.md']);
    });

    it('should handle empty content', () => {
      const refs = extractAtReferences('');

      expect(refs).toEqual([]);
    });

    it('should handle content with no references', () => {
      const content = 'This is some content without any @ references';
      const refs = extractAtReferences(content);

      expect(refs).toEqual([]);
    });

    it('should extract references from real Cursor content', () => {
      const content = `# TypeScript Rules

## Patterns
@patterns/naming.md  # Naming conventions
@patterns/structure.md  # Code structure

## Examples
@examples/good-api.ts
@examples/bad-api.ts

## Context
@context/architecture.md
`;
      const refs = extractAtReferences(content);

      expect(refs).toHaveLength(5);
      expect(refs).toContain('patterns/naming.md');
      expect(refs).toContain('examples/good-api.ts');
    });
  });

  describe('categorizeFile', () => {
    it('should categorize pattern files', () => {
      expect(categorizeFile('patterns/naming.md')).toBe('pattern');
      expect(categorizeFile('pattern/naming.md')).toBe('pattern');
      expect(categorizeFile('src/patterns/api.md')).toBe('pattern');
    });

    it('should categorize example files', () => {
      expect(categorizeFile('examples/good.ts')).toBe('example');
      expect(categorizeFile('example/bad.ts')).toBe('example');
    });

    it('should categorize context files', () => {
      expect(categorizeFile('context/architecture.md')).toBe('context');
      expect(categorizeFile('contexts/design.md')).toBe('context');
    });

    it('should categorize config files', () => {
      expect(categorizeFile('config/settings.json')).toBe('config');
      expect(categorizeFile('configs/database.yaml')).toBe('config');
    });

    it('should categorize data files', () => {
      expect(categorizeFile('data/users.json')).toBe('data');
    });

    it('should categorize documentation files', () => {
      expect(categorizeFile('docs/README.md')).toBe('documentation');
      expect(categorizeFile('documentation/api.md')).toBe('documentation');
      expect(categorizeFile('README.md')).toBe('documentation'); // root-level .md
    });

    it('should default to other for unknown categories', () => {
      expect(categorizeFile('random/file.txt')).toBe('other');
      expect(categorizeFile('utils/helper.ts')).toBe('other');
      expect(categorizeFile('some/path/guide.md')).toBe('other'); // .md in unknown dir
    });

    it('should be case-insensitive', () => {
      expect(categorizeFile('Patterns/Naming.md')).toBe('pattern');
      expect(categorizeFile('EXAMPLES/good.ts')).toBe('example');
    });
  });

  describe('detectContentType', () => {
    it('should detect markdown files', () => {
      expect(detectContentType('file.md')).toBe('text/markdown');
    });

    it('should detect TypeScript files', () => {
      expect(detectContentType('component.ts')).toBe('typescript');
      expect(detectContentType('component.tsx')).toBe('typescriptreact');
    });

    it('should detect JavaScript files', () => {
      expect(detectContentType('script.js')).toBe('javascript');
      expect(detectContentType('component.jsx')).toBe('javascriptreact');
    });

    it('should detect JSON files', () => {
      expect(detectContentType('config.json')).toBe('application/json');
    });

    it('should detect YAML files', () => {
      expect(detectContentType('config.yaml')).toBe('text/yaml');
      expect(detectContentType('config.yml')).toBe('text/yaml');
    });

    it('should detect various programming languages', () => {
      expect(detectContentType('script.py')).toBe('python');
      expect(detectContentType('script.rb')).toBe('ruby');
      expect(detectContentType('main.go')).toBe('go');
      expect(detectContentType('lib.rs')).toBe('rust');
      expect(detectContentType('Main.java')).toBe('java');
    });

    it('should detect shell scripts', () => {
      expect(detectContentType('script.sh')).toBe('shellscript');
      expect(detectContentType('script.bash')).toBe('shellscript');
      expect(detectContentType('script.zsh')).toBe('shellscript');
    });

    it('should detect web files', () => {
      expect(detectContentType('page.html')).toBe('text/html');
      expect(detectContentType('styles.css')).toBe('text/css');
      expect(detectContentType('styles.scss')).toBe('scss');
    });

    it('should default to text/plain for unknown extensions', () => {
      expect(detectContentType('file.unknown')).toBe('text/plain');
      expect(detectContentType('noextension')).toBe('text/plain');
    });

    it('should be case-insensitive', () => {
      expect(detectContentType('FILE.MD')).toBe('text/markdown');
      expect(detectContentType('SCRIPT.JS')).toBe('javascript');
    });
  });

  describe('extractDirectories', () => {
    it('should extract unique directories', () => {
      const paths = [
        'patterns/naming.md',
        'patterns/structure.md',
        'examples/good.ts',
      ];

      const dirs = extractDirectories(paths);

      expect(dirs).toEqual(['examples', 'patterns']);
    });

    it('should extract nested directories', () => {
      const paths = [
        'src/patterns/naming.md',
        'src/examples/good.ts',
      ];

      const dirs = extractDirectories(paths);

      expect(dirs).toEqual(['src', 'src/examples', 'src/patterns']);
    });

    it('should handle deeply nested paths', () => {
      const paths = [
        'a/b/c/file.txt',
      ];

      const dirs = extractDirectories(paths);

      expect(dirs).toEqual(['a', 'a/b', 'a/b/c']);
    });

    it('should ignore root-level files', () => {
      const paths = ['file.txt'];

      const dirs = extractDirectories(paths);

      expect(dirs).toEqual([]);
    });

    it('should handle empty array', () => {
      const dirs = extractDirectories([]);

      expect(dirs).toEqual([]);
    });

    it('should sort directories', () => {
      const paths = [
        'z/file.txt',
        'a/file.txt',
        'm/file.txt',
      ];

      const dirs = extractDirectories(paths);

      expect(dirs).toEqual(['a', 'm', 'z']);
    });
  });

  describe('hasAtReferences', () => {
    it('should return true when @references exist', () => {
      const content = 'See @patterns/naming.md';

      expect(hasAtReferences(content)).toBe(true);
    });

    it('should return false when no @references exist', () => {
      const content = 'This has no references';

      expect(hasAtReferences(content)).toBe(false);
    });

    it('should return false for empty content', () => {
      expect(hasAtReferences('')).toBe(false);
    });
  });

  describe('groupByCategory', () => {
    it('should group files by category', () => {
      const files = [
        { path: 'file1.md', category: 'pattern' },
        { path: 'file2.md', category: 'pattern' },
        { path: 'file3.ts', category: 'example' },
        { path: 'file4.md', category: 'context' },
      ];

      const grouped = groupByCategory(files);

      expect(grouped.pattern).toHaveLength(2);
      expect(grouped.example).toHaveLength(1);
      expect(grouped.context).toHaveLength(1);
    });

    it('should handle files without category', () => {
      const files = [
        { path: 'file1.md' },
        { path: 'file2.md', category: 'pattern' },
      ];

      const grouped = groupByCategory(files);

      expect(grouped.other).toHaveLength(1);
      expect(grouped.pattern).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const grouped = groupByCategory([]);

      expect(grouped).toEqual({});
    });
  });
});
