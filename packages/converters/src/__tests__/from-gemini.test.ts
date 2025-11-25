/**
 * Tests for Gemini format parser
 */

import { describe, it, expect } from 'vitest';
import { fromGemini } from '../from-gemini.js';

describe('fromGemini', () => {
  describe('basic parsing', () => {
    it('should parse simple Gemini TOML command', () => {
      const toml = `prompt = "Review the code for potential bugs and suggest improvements."
description = "Code review assistant"`;

      const result = fromGemini(toml, {
        id: 'code-review',
        name: 'Code Review',
        version: '1.0.0',
        author: 'test',
        tags: ['code-review'],
      });

      expect(result.format).toBe('gemini');
      expect(result.subtype).toBe('slash-command');
      expect(result.description).toBe('Code review assistant');
    });

    it('should parse command with only prompt (no description)', () => {
      const toml = `prompt = "Generate unit tests for the code"`;

      const result = fromGemini(toml, {
        id: 'test-gen',
        name: 'Test Generator',
        version: '1.0.0',
      });

      expect(result.format).toBe('gemini');
      expect(result.content.sections).toHaveLength(2); // metadata + instructions
    });

    it('should parse multiline prompt', () => {
      const toml = `prompt = """
Review the code carefully.
Check for:
- Security issues
- Performance problems
- Best practices violations
"""
description = "Comprehensive code review"`;

      const result = fromGemini(toml, {
        id: 'review',
      });

      expect(result.format).toBe('gemini');
      const instructionsSection = result.content.sections.find(s => s.type === 'instructions');
      expect(instructionsSection).toBeDefined();
      if (instructionsSection?.type === 'instructions') {
        expect(instructionsSection.content).toContain('Security issues');
        expect(instructionsSection.content).toContain('Performance problems');
      }
    });
  });

  describe('error handling', () => {
    it('should throw on invalid TOML', () => {
      const invalidToml = `prompt = "Missing closing quote`;

      expect(() => {
        fromGemini(invalidToml, { id: 'test' });
      }).toThrow('Failed to parse Gemini TOML');
    });

    it('should throw on missing prompt field', () => {
      const toml = `description = "No prompt field"`;

      expect(() => {
        fromGemini(toml, { id: 'test' });
      }).toThrow('Gemini command must have a "prompt" field');
    });
  });

  describe('canonical conversion', () => {
    it('should create proper metadata section', () => {
      const toml = `prompt = "Test prompt"
description = "Test description"`;

      const result = fromGemini(toml, {
        id: 'test-pkg',
        name: 'Test Package',
        version: '2.0.0',
        author: 'testuser',
      });

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection).toBeDefined();
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.title).toBe('Test Package');
        expect(metadataSection.data.description).toBe('Test description');
      }
    });

    it('should create instructions section with high priority', () => {
      const toml = `prompt = "Important instructions here"`;

      const result = fromGemini(toml, { id: 'test' });

      const instructionsSection = result.content.sections.find(s => s.type === 'instructions');
      expect(instructionsSection).toBeDefined();
      if (instructionsSection?.type === 'instructions') {
        expect(instructionsSection.title).toBe('Prompt');
        expect(instructionsSection.priority).toBe('high');
        expect(instructionsSection.content).toBe('Important instructions here');
      }
    });

    it('should set sourceFormat correctly', () => {
      const toml = `prompt = "Test"`;

      const result = fromGemini(toml, { id: 'test' });

      expect(result.sourceFormat).toBe('gemini');
    });
  });

  describe('explicit subtype', () => {
    it('should use explicit subtype when provided', () => {
      const toml = `prompt = "Test prompt"`;

      const result = fromGemini(toml, { id: 'test' }, 'prompt');

      expect(result.subtype).toBe('prompt');
    });

    it('should default to slash-command when no explicit subtype', () => {
      const toml = `prompt = "Test prompt"`;

      const result = fromGemini(toml, { id: 'test' });

      expect(result.subtype).toBe('slash-command');
    });
  });
});
