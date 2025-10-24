/**
 * Tests for GitHub Copilot format parser
 */

import { describe, it, expect } from 'vitest';
import { fromCopilot } from '../from-copilot.js';

describe('fromCopilot', () => {
  const basicMetadata = {
    id: 'test-copilot',
    name: 'Test Copilot Instruction',
    version: '1.0.0',
  };

  describe('repository-wide instructions', () => {
    it('should parse basic instruction without frontmatter', () => {
      const content = `# Testing Instructions

Write comprehensive tests for all code.

## Guidelines

- Always test edge cases
- Maintain high coverage
`;

      const result = fromCopilot(content, basicMetadata);

      expect(result.id).toBe('test-copilot');
      expect(result.sourceFormat).toBe('copilot');
      expect(result.content.sections.length).toBeGreaterThan(0);
    });

    it('should extract description from first paragraph', () => {
      const content = `# Testing Guide

This is a comprehensive guide for testing.

## Guidelines

- Write tests first
`;

      const result = fromCopilot(content, basicMetadata);

      expect(result.description).toBe('This is a comprehensive guide for testing.');
    });
  });

  describe('path-specific instructions', () => {
    it('should parse frontmatter with applyTo', () => {
      const content = `---
applyTo:
  - src/**/*.ts
  - test/**/*.ts
---

# TypeScript Testing

Apply these rules to TypeScript files.
`;

      const result = fromCopilot(content, basicMetadata);

      expect(result.metadata?.copilotConfig?.applyTo).toContain('src/**/*.ts');
      expect(result.metadata?.copilotConfig?.applyTo).toContain('test/**/*.ts');
    });

    it('should handle single applyTo pattern', () => {
      const content = `---
applyTo:
  - src/**/*.ts
---

# TypeScript Rules

Rules for TypeScript.
`;

      const result = fromCopilot(content, basicMetadata);

      expect(result.metadata?.copilotConfig?.applyTo).toContain('src/**/*.ts');
    });
  });

  describe('section parsing', () => {
    it('should parse headers as section titles', () => {
      const content = `# Main Title

## Instructions

Follow these guidelines.

## Examples

Here are some examples.
`;

      const result = fromCopilot(content, basicMetadata);

      const sections = result.content.sections;
      expect(sections.some(s => s.title === 'Instructions')).toBe(true);
      expect(sections.some(s => s.title === 'Examples')).toBe(true);
    });

    it('should parse lists as rules', () => {
      const content = `# Rules

- Always write tests
- Use TypeScript
- Follow conventions
`;

      const result = fromCopilot(content, basicMetadata);

      expect(result.content.sections.length).toBeGreaterThan(0);
    });

    it('should parse code blocks', () => {
      const content = `# Example

\`\`\`typescript
function test() {
  return true;
}
\`\`\`
`;

      const result = fromCopilot(content, basicMetadata);

      expect(result.content.sections.length).toBeGreaterThan(0);
    });
  });

  describe('metadata extraction', () => {
    it('should set sourceFormat to copilot', () => {
      const content = `# Test

Some content.
`;

      const result = fromCopilot(content, basicMetadata);

      expect(result.sourceFormat).toBe('copilot');
    });

    it('should preserve provided metadata', () => {
      const content = `# Test

Content here.
`;

      const metadata = {
        ...basicMetadata,
        author: 'test-author',
        tags: ['testing', 'typescript'],
      };

      const result = fromCopilot(content, metadata);

      expect(result.metadata?.author).toBe('test-author');
      expect(result.metadata?.tags).toContain('testing');
    });
  });

  describe('quality inference', () => {
    it('should infer tags from content', () => {
      const content = `# TypeScript Testing Guide

Guidelines for testing TypeScript applications.

## Rules

- Write unit tests
- Use Jest
`;

      const result = fromCopilot(content, basicMetadata);

      expect(result.metadata?.tags).toBeDefined();
    });
  });
});
