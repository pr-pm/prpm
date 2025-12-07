/**
 * Tests for fromCursor multi-file support
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fromCursor, type FromCursorOptions } from './from-cursor.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import type { FileReferenceSection } from './types/canonical.js';

describe('fromCursor - Multi-file support', () => {
  const testDir = join(process.cwd(), 'test-cursor-multifile');
  const metadata = {
    id: '@test/cursor-multifile',
    name: 'cursor-multifile',
    version: '1.0.0',
    author: 'Test Author',
  };

  beforeEach(() => {
    // Create test directory structure
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, 'patterns'), { recursive: true });
    mkdirSync(join(testDir, 'examples'), { recursive: true });
    mkdirSync(join(testDir, 'context'), { recursive: true });

    // Create test files
    writeFileSync(
      join(testDir, 'patterns', 'naming.md'),
      '# Naming Conventions\n\nUse camelCase for variables.\n'
    );
    writeFileSync(
      join(testDir, 'patterns', 'error-handling.md'),
      '# Error Handling\n\nAlways use try-catch blocks.\n'
    );
    writeFileSync(
      join(testDir, 'examples', 'good-code.ts'),
      'const userName = "John";\ntry {\n  // code\n} catch (error) {\n  // handle\n}\n'
    );
    writeFileSync(
      join(testDir, 'context', 'architecture.md'),
      '# Architecture\n\nThis is a modular monorepo.\n'
    );
  });

  afterEach(() => {
    // Clean up test directory
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('Basic multi-file parsing', () => {
    it('should parse content without @file references when resolveFiles is disabled', () => {
      const content = `---
description: Test rule
---

# Test Rule

Follow these patterns: @patterns/naming.md
`;

      const pkg = fromCursor(content, metadata);

      expect(pkg.format).toBe('cursor');
      expect(pkg.sourceFormat).toBe('cursor');
      expect(pkg.content.sections.length).toBeGreaterThan(0);

      // Should not have file-reference sections
      const fileRefSections = pkg.content.sections.filter(
        s => s.type === 'file-reference'
      );
      expect(fileRefSections.length).toBe(0);
    });

    it('should detect and load @file references when resolveFiles is enabled', () => {
      const content = `---
description: Test rule with file references
---

# Test Rule

Follow these patterns: @patterns/naming.md

See examples: @examples/good-code.ts
`;

      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);

      expect(pkg.format).toBe('cursor');

      // Should have 2 file-reference sections
      const fileRefSections = pkg.content.sections.filter(
        s => s.type === 'file-reference'
      ) as FileReferenceSection[];

      expect(fileRefSections.length).toBe(2);

      // Check patterns/naming.md
      const namingSection = fileRefSections.find(
        s => s.path === 'patterns/naming.md'
      );
      expect(namingSection).toBeDefined();
      expect(namingSection?.content).toContain('Naming Conventions');
      expect(namingSection?.content).toContain('camelCase');
      expect(namingSection?.category).toBe('pattern');
      expect(namingSection?.contentType).toBe('text/markdown');

      // Check examples/good-code.ts
      const exampleSection = fileRefSections.find(
        s => s.path === 'examples/good-code.ts'
      );
      expect(exampleSection).toBeDefined();
      expect(exampleSection?.content).toContain('const userName');
      expect(exampleSection?.category).toBe('example');
      expect(exampleSection?.contentType).toBe('typescript');
    });

    it('should populate fileStructure metadata', () => {
      const content = `---
description: Test rule
---

# Test Rule

@patterns/naming.md
@examples/good-code.ts
`;

      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);

      expect(pkg.metadata?.fileStructure).toBeDefined();
      expect(pkg.metadata?.fileStructure?.mainFile).toBe('rule.md');
      expect(pkg.metadata?.fileStructure?.files).toHaveLength(2);

      const files = pkg.metadata?.fileStructure?.files || [];
      expect(files.some(f => f.path === 'patterns/naming.md')).toBe(true);
      expect(files.some(f => f.path === 'examples/good-code.ts')).toBe(true);
    });

    it('should extract directories from file references', () => {
      const content = `---
description: Test rule
---

@patterns/naming.md
@examples/good-code.ts
@context/architecture.md
`;

      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);

      expect(pkg.metadata?.fileStructure?.directories).toBeDefined();
      const dirs = pkg.metadata?.fileStructure?.directories || [];

      expect(dirs).toContain('patterns');
      expect(dirs).toContain('examples');
      expect(dirs).toContain('context');
    });
  });

  describe('Backward compatibility', () => {
    it('should accept explicitSubtype as string (old API)', () => {
      const content = `---
description: Test rule
---

# Test Rule
`;

      const pkg = fromCursor(content, metadata, 'rule');

      expect(pkg.format).toBe('cursor');
      expect(pkg.subtype).toBe('rule');
    });

    it('should accept FromCursorOptions (new API)', () => {
      const content = `---
description: Test rule
---

# Test Rule
`;

      const options: FromCursorOptions = {
        explicitSubtype: 'rule',
        resolveFiles: false,
      };

      const pkg = fromCursor(content, metadata, options);

      expect(pkg.format).toBe('cursor');
      expect(pkg.subtype).toBe('rule');
    });
  });

  describe('File categorization', () => {
    it('should correctly categorize pattern files', () => {
      const content = '@patterns/naming.md';
      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);
      const fileSection = pkg.content.sections.find(
        s => s.type === 'file-reference'
      ) as FileReferenceSection;

      expect(fileSection.category).toBe('pattern');
    });

    it('should correctly categorize example files', () => {
      const content = '@examples/good-code.ts';
      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);
      const fileSection = pkg.content.sections.find(
        s => s.type === 'file-reference'
      ) as FileReferenceSection;

      expect(fileSection.category).toBe('example');
    });

    it('should correctly categorize context files', () => {
      const content = '@context/architecture.md';
      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);
      const fileSection = pkg.content.sections.find(
        s => s.type === 'file-reference'
      ) as FileReferenceSection;

      expect(fileSection.category).toBe('context');
    });
  });

  describe('Content type detection', () => {
    it('should detect TypeScript files', () => {
      const content = '@examples/good-code.ts';
      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);
      const fileSection = pkg.content.sections.find(
        s => s.type === 'file-reference'
      ) as FileReferenceSection;

      expect(fileSection.contentType).toBe('typescript');
    });

    it('should detect Markdown files', () => {
      const content = '@patterns/naming.md';
      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);
      const fileSection = pkg.content.sections.find(
        s => s.type === 'file-reference'
      ) as FileReferenceSection;

      expect(fileSection.contentType).toBe('text/markdown');
    });
  });

  describe('Multiple references', () => {
    it('should handle multiple @file references in content', () => {
      const content = `---
description: Comprehensive rule
---

# Best Practices

Follow these patterns:
- @patterns/naming.md
- @patterns/error-handling.md

See examples:
- @examples/good-code.ts

Architecture context: @context/architecture.md
`;

      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);

      const fileRefSections = pkg.content.sections.filter(
        s => s.type === 'file-reference'
      );

      expect(fileRefSections.length).toBe(4);
    });

    it('should deduplicate repeated @file references', () => {
      const content = `---
description: Test rule
---

# Test

@patterns/naming.md
@patterns/naming.md
@patterns/naming.md
`;

      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);

      const fileRefSections = pkg.content.sections.filter(
        s => s.type === 'file-reference'
      );

      // Should only load the file once
      expect(fileRefSections.length).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle content with no @file references', () => {
      const content = `---
description: Simple rule
---

# Simple Rule

No file references here.
`;

      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);

      const fileRefSections = pkg.content.sections.filter(
        s => s.type === 'file-reference'
      );

      expect(fileRefSections.length).toBe(0);
      expect(pkg.metadata?.fileStructure).toBeUndefined();
    });

    it('should handle missing basePath gracefully', () => {
      const content = '@patterns/naming.md';

      const options: FromCursorOptions = {
        resolveFiles: true,
        // basePath intentionally omitted
      };

      const pkg = fromCursor(content, metadata, options);

      // Should not load files without basePath
      const fileRefSections = pkg.content.sections.filter(
        s => s.type === 'file-reference'
      );
      expect(fileRefSections.length).toBe(0);
    });

    it('should handle nonexistent files gracefully', () => {
      const content = '@patterns/nonexistent.md';

      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      // Should not throw - loadReferencedFiles handles missing files
      expect(() => fromCursor(content, metadata, options)).not.toThrow();

      const pkg = fromCursor(content, metadata, options);
      const fileRefSections = pkg.content.sections.filter(
        s => s.type === 'file-reference'
      );

      // File should be skipped
      expect(fileRefSections.length).toBe(0);
    });
  });

  describe('Integration with existing sections', () => {
    it('should preserve existing sections when adding file references', () => {
      const content = `---
description: Test rule
tools: read, write
---

# Test Rule

## Instructions

Follow these instructions.

## Rules

- Rule 1
- Rule 2

See also: @patterns/naming.md
`;

      const options: FromCursorOptions = {
        resolveFiles: true,
        basePath: testDir,
      };

      const pkg = fromCursor(content, metadata, options);

      // Should have metadata, instructions, rules, and file-reference sections
      expect(pkg.content.sections.some(s => s.type === 'metadata')).toBe(true);
      expect(pkg.content.sections.some(s => s.type === 'instructions')).toBe(true);
      expect(pkg.content.sections.some(s => s.type === 'rules')).toBe(true);
      expect(pkg.content.sections.some(s => s.type === 'file-reference')).toBe(true);
      expect(pkg.content.sections.some(s => s.type === 'tools')).toBe(true);
    });
  });
});
