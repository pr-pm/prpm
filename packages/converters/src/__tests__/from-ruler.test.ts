/**
 * Tests for Ruler format parser
 */

import { describe, it, expect } from 'vitest';
import { fromRuler } from '../from-ruler.js';
import type { CanonicalPackage } from '../types/canonical.js';

describe('fromRuler', () => {
  describe('basic parsing', () => {
    it('should parse ruler markdown to canonical', () => {
      const markdown = `<!-- Package: react-rules -->
<!-- Author: @developer -->
<!-- Description: React best practices -->

# React Guidelines

Follow these conventions for React development.

## Component Structure

- Use functional components
- Keep components small and focused`;

      const result = fromRuler(markdown);

      expect(result.format).toBe('canonical');
      expect(result.content).toBeTruthy();

      const pkg: CanonicalPackage = JSON.parse(result.content);
      expect(pkg.name).toBe('react-rules');
      expect(pkg.author).toBe('@developer');
      expect(pkg.description).toBe('React best practices');
    });

    it('should handle markdown without metadata comments', () => {
      const markdown = `# Coding Standards

## Best Practices

- Write clean code
- Add comments`;

      const result = fromRuler(markdown);

      expect(result.format).toBe('canonical');

      const pkg: CanonicalPackage = JSON.parse(result.content);
      expect(pkg.name).toBe('ruler-rule');
      expect(pkg.metadata?.title).toBe('Coding Standards');
    });

    it('should extract title from first h1', () => {
      const markdown = `# TypeScript Guidelines

Use TypeScript for type safety.`;

      const result = fromRuler(markdown);
      const pkg: CanonicalPackage = JSON.parse(result.content);

      expect(pkg.metadata?.title).toBe('TypeScript Guidelines');
    });

    it('should extract sections from headers', () => {
      const markdown = `# Main Title

## Section One

Content for section one.

## Section Two

Content for section two.`;

      const result = fromRuler(markdown);
      const pkg: CanonicalPackage = JSON.parse(result.content);

      // First section is metadata, then the two content sections
      expect(pkg.content.sections).toHaveLength(3);
      const contentSections = pkg.content.sections.filter(s => s.type !== 'metadata');
      expect(contentSections).toHaveLength(2);
      expect((contentSections[0] as any).title).toBe('Section One');
      expect((contentSections[1] as any).title).toBe('Section Two');
    });
  });

  describe('content parsing', () => {
    it('should preserve code blocks', () => {
      const markdown = `# Examples

## Usage

\`\`\`typescript
function example() {
  return true;
}
\`\`\``;

      const result = fromRuler(markdown);
      const pkg: CanonicalPackage = JSON.parse(result.content);

      // Filter out metadata section to get actual content sections
      const contentSections = pkg.content.sections.filter(s => s.type !== 'metadata');
      expect(contentSections[0].content).toContain('```typescript');
      expect(contentSections[0].content).toContain('function example()');
    });

    it('should handle description before first header', () => {
      const markdown = `This is an introduction paragraph.

It has multiple lines.

# Main Title

Content here.`;

      const result = fromRuler(markdown);
      const pkg: CanonicalPackage = JSON.parse(result.content);

      expect(pkg.description).toContain('This is an introduction paragraph');
      expect(pkg.description).toContain('It has multiple lines');
    });

    it('should not treat headers in code blocks as sections', () => {
      const markdown = `# Main Title

\`\`\`markdown
# This is not a real header
\`\`\`

## Real Section

Content`;

      const result = fromRuler(markdown);
      const pkg: CanonicalPackage = JSON.parse(result.content);

      // Filter out metadata section to get actual content sections
      const contentSections = pkg.content.sections.filter(s => s.type !== 'metadata');
      expect(contentSections).toHaveLength(1);
      expect(contentSections[0].title).toBe('Real Section');
    });
  });

  describe('metadata extraction', () => {
    it('should extract all metadata fields', () => {
      const markdown = `<!-- Package: test-package -->
<!-- Author: Test Author -->
<!-- Description: Test description -->

# Content`;

      const result = fromRuler(markdown);
      const pkg: CanonicalPackage = JSON.parse(result.content);

      expect(pkg.name).toBe('test-package');
      expect(pkg.author).toBe('Test Author');
      expect(pkg.description).toBe('Test description');
    });

    it('should handle missing metadata gracefully', () => {
      const markdown = `# Just Content

No metadata here.`;

      const result = fromRuler(markdown);
      const pkg: CanonicalPackage = JSON.parse(result.content);

      expect(pkg.name).toBe('ruler-rule');
      expect(pkg.author).toBe('');
    });

    it('should set sourceFormat metadata', () => {
      const markdown = `# Test`;

      const result = fromRuler(markdown);
      const pkg: CanonicalPackage = JSON.parse(result.content);

      expect(pkg.sourceFormat).toBe('ruler');
    });
  });

  describe('error handling', () => {
    it('should handle empty content', () => {
      const result = fromRuler('');

      expect(result.format).toBe('canonical');
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should handle malformed markdown gracefully', () => {
      const markdown = `### Starting with h3

No h1 or h2`;

      const result = fromRuler(markdown);

      expect(result.format).toBe('canonical');
      expect(result.content).toBeTruthy();
    });
  });
});
