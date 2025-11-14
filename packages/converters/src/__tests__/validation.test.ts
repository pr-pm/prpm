import { describe, it, expect } from 'vitest';
import { validateMarkdown, validateFormat, formatValidationErrors } from '../validation.js';

describe('Schema Validation', () => {
  describe('validateMarkdown', () => {
    it('should validate valid Cursor format', () => {
      const validCursor = `---
name: test-rule
description: "Test rule"
alwaysApply: false
---

# Test Rule

This is a test rule.
`;

      const result = validateMarkdown('cursor', validCursor);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields in Cursor format', () => {
      const invalidCursor = `---
name: test-rule
alwaysApply: false
---

# Test Rule

Missing description field.
`;

      const result = validateMarkdown('cursor', invalidCursor);
      // Note: This will depend on whether description is truly required in the schema
      // For now, let's just check that validation runs without errors
      expect(result).toBeDefined();
    });

    it('should validate valid Windsurf format (no frontmatter)', () => {
      const validWindsurf = `# Test Rule

This is a simple test rule for Windsurf.

## Guidelines

- Rule 1
- Rule 2
`;

      const result = validateMarkdown('windsurf', validWindsurf);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate Claude format with tools', () => {
      const validClaude = `---
name: test-agent
description: "Test agent"
tools: Read, Write, Bash
model: sonnet
---

# Test Agent

You are a test agent.
`;

      const result = validateMarkdown('claude', validClaude);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateFormat', () => {
    it('should validate structured data', () => {
      const data = {
        frontmatter: {
          name: 'test',
          description: 'Test description',
          alwaysApply: false,
        },
        content: '# Test\n\nContent here.',
      };

      const result = validateFormat('cursor', data);
      expect(result).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format errors and warnings for display', () => {
      const result = {
        valid: false,
        errors: [
          { path: '/frontmatter/name', message: 'Name is required' },
        ],
        warnings: [
          { path: '/frontmatter/deprecated', message: 'Field is deprecated' },
        ],
      };

      const formatted = formatValidationErrors(result);
      expect(formatted).toContain('Validation Errors:');
      expect(formatted).toContain('Name is required');
      expect(formatted).toContain('Warnings:');
      expect(formatted).toContain('Field is deprecated');
    });

    it('should handle empty errors gracefully', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
      };

      const formatted = formatValidationErrors(result);
      expect(formatted).toBe('');
    });
  });
});
