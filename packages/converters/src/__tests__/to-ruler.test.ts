/**
 * Tests for Ruler format converter
 */

import { describe, it, expect } from 'vitest';
import { toRuler, isRulerFormat } from '../to-ruler.js';
import {
  sampleCanonicalPackage,
  minimalCanonicalPackage,
} from './setup.js';

describe('toRuler', () => {
  describe('basic conversion', () => {
    it('should convert canonical to ruler format', () => {
      const result = toRuler(sampleCanonicalPackage);

      expect(result.format).toBe('ruler');
      expect(result.content).toBeTruthy();
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should include package metadata as HTML comments', () => {
      const result = toRuler(sampleCanonicalPackage);

      expect(result.content).toContain('<!-- Package: Test Package -->');
      expect(result.content).toContain('<!-- Author: testauthor -->');
      expect(result.content).toContain('<!-- Description: A test package for conversion -->');
    });

    it('should include title and description', () => {
      const result = toRuler(sampleCanonicalPackage);

      expect(result.content).toContain('# Test Agent');
      expect(result.content).toContain('A test package for conversion');
    });

    it('should handle minimal package', () => {
      const result = toRuler(minimalCanonicalPackage);

      expect(result.content).toContain('# Minimal Rule');
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should not include frontmatter', () => {
      const result = toRuler(sampleCanonicalPackage);

      // Check that frontmatter delimiters don't appear after comments
      const withoutComments = result.content.replace(/<!--.*?-->/gs, '');
      expect(withoutComments).not.toMatch(/^---\n/);
    });
  });

  describe('section conversion', () => {
    it('should convert instructions section', () => {
      const result = toRuler(sampleCanonicalPackage);

      expect(result.content).toContain('## Core Principles');
      expect(result.content).toContain('Always write comprehensive tests');
    });

    it('should convert rules section', () => {
      const result = toRuler(sampleCanonicalPackage);

      expect(result.content).toContain('## Testing Guidelines');
    });

    it('should convert examples section', () => {
      const result = toRuler(sampleCanonicalPackage);

      expect(result.content).toContain('## Code Examples');
    });
  });

  describe('warnings for unsupported features', () => {
    it('should warn about slash commands', () => {
      const slashCommandPackage = {
        ...sampleCanonicalPackage,
        subtype: 'slash-command' as const,
      };

      const result = toRuler(slashCommandPackage);

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('Slash commands are not supported by Ruler');
      expect(result.qualityScore).toBeLessThan(85);
    });

    it('should warn about hooks', () => {
      const hookPackage = {
        ...sampleCanonicalPackage,
        subtype: 'hook' as const,
      };

      const result = toRuler(hookPackage);

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('Hooks are not supported by Ruler');
    });

    it('should warn about agents and workflows', () => {
      const agentPackage = {
        ...sampleCanonicalPackage,
        subtype: 'agent' as const,
      };

      const result = toRuler(agentPackage);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('may not be fully supported'))).toBe(true);
    });
  });

  describe('quality scoring', () => {
    it('should have high quality for well-structured package', () => {
      const result = toRuler(sampleCanonicalPackage);

      expect(result.qualityScore).toBeGreaterThanOrEqual(90);
      expect(result.lossyConversion).toBe(false);
    });

    it('should reduce quality for unsupported features', () => {
      const slashCommandPackage = {
        ...sampleCanonicalPackage,
        subtype: 'slash-command' as const,
      };

      const result = toRuler(slashCommandPackage);

      expect(result.qualityScore).toBeLessThan(90);
      expect(result.lossyConversion).toBe(true);
    });
  });
});

describe('isRulerFormat', () => {
  it('should identify plain markdown as ruler format', () => {
    const markdown = `# React Guidelines

## Conventions

- Use functional components
- Keep components small`;

    expect(isRulerFormat(markdown)).toBe(true);
  });

  it('should reject markdown with frontmatter', () => {
    const markdown = `---
title: Test
---

# Content`;

    expect(isRulerFormat(markdown)).toBe(false);
  });

  it('should identify markdown with rule keywords', () => {
    const markdown = `This is a coding rule for React development.`;

    expect(isRulerFormat(markdown)).toBe(true);
  });
});
