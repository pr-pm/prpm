/**
 * Tests for Gemini format converter
 */

import { describe, it, expect } from 'vitest';
import { toGemini } from '../to-gemini.js';
import { sampleCanonicalPackage, minimalCanonicalPackage } from './setup.js';

describe('toGemini', () => {
  describe('basic conversion', () => {
    it('should convert canonical to Gemini TOML format', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.format).toBe('gemini');
      expect(result.content).toBeTruthy();
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should generate valid TOML', () => {
      const result = toGemini(sampleCanonicalPackage);

      // Should have prompt field
      expect(result.content).toContain('prompt = ');
      // Should have description field
      expect(result.content).toContain('description = ');
    });

    it('should handle minimal package', () => {
      const result = toGemini(minimalCanonicalPackage);

      expect(result.content).toContain('prompt = ');
      expect(result.qualityScore).toBe(100);
    });
  });

  describe('prompt generation', () => {
    it('should include instructions in prompt', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.content).toContain('Always write comprehensive tests');
    });

    it('should include rules in prompt', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.content).toContain('Testing Guidelines');
      expect(result.content).toContain('Write tests before code (TDD)');
    });

    it('should include examples in prompt', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.content).toContain('Code Examples');
      expect(result.content).toContain('Good test structure');
    });

    it('should include persona in prompt', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.content).toContain('Role');
      expect(result.content).toContain('TestBot');
      expect(result.content).toContain('Testing Assistant');
    });

    it('should include context in prompt', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.content).toContain('Background');
      expect(result.content).toContain('This agent was created to assist with testing tasks');
    });
  });

  describe('description field', () => {
    it('should use package description when available', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.content).toContain('description = "A test package for conversion"');
    });

    it('should use metadata description as fallback', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        description: '',
        metadata: {
          description: 'Metadata description',
        },
      };

      const result = toGemini(pkg);

      expect(result.content).toContain('description = "Metadata description"');
    });
  });

  describe('lossy conversion warnings', () => {
    it('should warn about tools section', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('Tools section skipped'))).toBe(true);
    });

    it('should set lossyConversion flag when tools are present', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.lossyConversion).toBe(true);
    });

    it('should reduce quality score for lossy conversion', () => {
      const result = toGemini(sampleCanonicalPackage);

      expect(result.qualityScore).toBeLessThan(100);
    });

    it('should warn about hook sections', () => {
      const pkgWithHook = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'hook' as const,
              event: 'session-start' as const,
              language: 'bash' as const,
              code: 'echo "test"',
            },
          ],
        },
      };

      const result = toGemini(pkgWithHook);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('Hook section skipped'))).toBe(true);
    });
  });

  describe('custom sections', () => {
    it('should include gemini-specific custom sections', () => {
      const pkgWithCustom = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'custom' as const,
              editorType: 'gemini' as const,
              content: 'Gemini-specific instructions',
            },
          ],
        },
      };

      const result = toGemini(pkgWithCustom);

      expect(result.content).toContain('Gemini-specific instructions');
    });

    it('should skip non-gemini custom sections', () => {
      const pkgWithCustom = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'custom' as const,
              editorType: 'cursor' as const,
              content: 'Cursor-specific content',
            },
          ],
        },
      };

      const result = toGemini(pkgWithCustom);

      expect(result.content).not.toContain('Cursor-specific content');
      expect(result.warnings?.some(w => w.includes('Custom cursor section skipped'))).toBe(true);
    });
  });

  describe('TOML formatting', () => {
    it('should generate valid TOML string', () => {
      const result = toGemini(minimalCanonicalPackage);

      // Should be parseable TOML (basic check)
      expect(result.content).toMatch(/^[a-z_]+ = /);
      expect(result.content).not.toContain('undefined');
      expect(result.content).not.toContain('null');
    });

    it('should handle multiline prompts correctly', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections.filter(s => s.type === 'metadata'),
            {
              type: 'instructions' as const,
              title: 'Instructions',
              content: 'Line 1\nLine 2\nLine 3',
              priority: 'high' as const,
            },
          ],
        },
      };

      const result = toGemini(pkg);

      expect(result.content).toContain('prompt = ');
      expect(result.content).toContain('Line 1');
      expect(result.content).toContain('Line 2');
      expect(result.content).toContain('Line 3');
    });
  });
});
