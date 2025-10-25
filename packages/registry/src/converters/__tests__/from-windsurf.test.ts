/**
 * Tests for Windsurf format parser
 */

import { describe, it, expect } from 'vitest';
import { fromWindsurf } from '../from-windsurf.js';

describe('fromWindsurf', () => {
  const basicMetadata = {
    id: 'test-windsurf',
    name: 'Test Windsurf Rules',
    version: '1.0.0',
  };

  describe('basic parsing', () => {
    it('should parse basic windsurf rules', () => {
      const content = `# Testing Rules

Write comprehensive tests for all code.

## Guidelines

- Always test edge cases
- Maintain high coverage
`;

      const result = fromWindsurf(content, basicMetadata);

      expect(result.id).toBe('test-windsurf');
      expect(result.sourceFormat).toBe('windsurf');
      expect(result.content.sections.length).toBeGreaterThan(0);
    });

    it('should extract title from H1', () => {
      const content = `# Best Practices

Follow these guidelines.
`;

      const result = fromWindsurf(content, basicMetadata);

      expect(result.metadata?.title).toBe('Best Practices');
    });

    it('should extract description from first paragraph', () => {
      const content = `# Testing Guide

This is a comprehensive guide for testing.

## Guidelines

- Write tests first
`;

      const result = fromWindsurf(content, basicMetadata);

      expect(result.description).toBe('This is a comprehensive guide for testing.');
    });
  });

  describe('section parsing', () => {
    it('should parse H2 headers as section titles', () => {
      const content = `# Main Title

## Instructions

Follow these guidelines.

## Examples

Here are some examples.
`;

      const result = fromWindsurf(content, basicMetadata);

      const sections = result.content.sections;
      expect(sections.some(s => s.title === 'Instructions')).toBe(true);
      expect(sections.some(s => s.title === 'Examples')).toBe(true);
    });

    it('should parse bullet lists', () => {
      const content = `# Rules

## Guidelines

- Always write tests
- Use TypeScript
- Follow conventions
`;

      const result = fromWindsurf(content, basicMetadata);

      const guidelineSection = result.content.sections.find(s => s.title === 'Guidelines');
      expect(guidelineSection).toBeDefined();
      expect(guidelineSection?.content.items).toBeDefined();
      expect(guidelineSection?.content.items?.length).toBeGreaterThan(0);
    });

    it('should parse code blocks', () => {
      const content = `# Example

## Usage

\`\`\`typescript
function test() {
  return true;
}
\`\`\`
`;

      const result = fromWindsurf(content, basicMetadata);

      expect(result.content.sections.length).toBeGreaterThan(0);
    });

    it('should infer section types from titles', () => {
      const content = `# Guide

## Instructions

Follow these.

## Rules

These are mandatory.

## Examples

Here are some.
`;

      const result = fromWindsurf(content, basicMetadata);

      const instructionsSection = result.content.sections.find(s => s.title === 'Instructions');
      expect(instructionsSection?.type).toBe('instructions');

      const rulesSection = result.content.sections.find(s => s.title === 'Rules');
      expect(rulesSection?.type).toBe('rules');

      const examplesSection = result.content.sections.find(s => s.title === 'Examples');
      expect(examplesSection?.type).toBe('examples');
    });
  });

  describe('rule parsing', () => {
    it('should parse rules with rationale', () => {
      const content = `# Rules

## Testing Guidelines

- Write tests before code (TDD)
   - *Rationale: Ensures better design and prevents bugs*
- Test edge cases thoroughly
`;

      const result = fromWindsurf(content, basicMetadata);

      const rulesSection = result.content.sections.find(s => s.title === 'Testing Guidelines');
      expect(rulesSection).toBeDefined();
      expect(rulesSection?.content.items).toBeDefined();

      const firstRule = rulesSection?.content.items?.[0];
      expect(firstRule?.text).toContain('Write tests before code');
      expect(firstRule?.rationale).toBe('Ensures better design and prevents bugs');
    });

    it('should parse rules with examples', () => {
      const content = `# Rules

## Best Practices

- Use descriptive names
   - Example: getUserById() not get()
`;

      const result = fromWindsurf(content, basicMetadata);

      const section = result.content.sections.find(s => s.title === 'Best Practices');
      const firstRule = section?.content.items?.[0];
      expect(firstRule?.text).toContain('Use descriptive names');
      expect(firstRule?.example).toBe('getUserById() not get()');
    });
  });

  describe('persona parsing', () => {
    it('should parse persona section', () => {
      const content = `# Assistant

## Role

🤖 **CodeBot** - Programming Assistant

**Style:** precise, helpful
`;

      const result = fromWindsurf(content, basicMetadata);

      const roleSection = result.content.sections.find(s => s.title === 'Role');
      expect(roleSection?.type).toBe('persona');
    });
  });

  describe('metadata extraction', () => {
    it('should set sourceFormat to windsurf', () => {
      const content = `# Test

Some content.
`;

      const result = fromWindsurf(content, basicMetadata);

      expect(result.sourceFormat).toBe('windsurf');
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

      const result = fromWindsurf(content, metadata);

      expect(result.author).toBe('test-author');
      expect(result.tags).toContain('testing');
    });
  });
});
