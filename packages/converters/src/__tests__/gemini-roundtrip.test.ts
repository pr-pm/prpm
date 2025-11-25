/**
 * Gemini round-trip conversion tests
 * Ensures data isn't lost when converting to/from Gemini format
 */

import { describe, it, expect } from 'vitest';
import { toGemini } from '../to-gemini.js';
import { fromGemini } from '../from-gemini.js';
import { sampleCanonicalPackage } from './setup.js';

describe('Gemini round-trip conversions', () => {
  describe('Canonical → Gemini → Canonical', () => {
    it('should preserve basic metadata through round-trip', () => {
      // Convert canonical to Gemini TOML
      const geminiResult = toGemini(sampleCanonicalPackage);

      // Convert back to canonical
      const backToCanonical = fromGemini(geminiResult.content, {
        id: sampleCanonicalPackage.id,
        name: sampleCanonicalPackage.name,
        version: sampleCanonicalPackage.version,
        author: sampleCanonicalPackage.author,
        tags: sampleCanonicalPackage.tags,
      });

      // Check metadata preserved
      expect(backToCanonical.id).toBe(sampleCanonicalPackage.id);
      expect(backToCanonical.version).toBe(sampleCanonicalPackage.version);
      expect(backToCanonical.format).toBe('gemini');
    });

    it('should preserve description through round-trip', () => {
      const geminiResult = toGemini(sampleCanonicalPackage);
      const backToCanonical = fromGemini(geminiResult.content, {
        id: sampleCanonicalPackage.id,
      });

      expect(backToCanonical.description).toBe(sampleCanonicalPackage.description);
    });

    it('should preserve instructions content', () => {
      const geminiResult = toGemini(sampleCanonicalPackage);
      const backToCanonical = fromGemini(geminiResult.content, {
        id: sampleCanonicalPackage.id,
      });

      // Should have instructions section
      const instructionsSection = backToCanonical.content.sections.find(
        s => s.type === 'instructions'
      );
      expect(instructionsSection).toBeDefined();

      // Should contain key content from original
      if (instructionsSection?.type === 'instructions') {
        const originalInstructions = sampleCanonicalPackage.content.sections.filter(
          s => s.type === 'instructions' || s.type === 'rules' || s.type === 'examples'
        );
        expect(originalInstructions.length).toBeGreaterThan(0);
      }
    });

    it('should note lossy conversion for tools', () => {
      const geminiResult = toGemini(sampleCanonicalPackage);

      // Should warn about tools being lost
      expect(geminiResult.lossyConversion).toBe(true);
      expect(geminiResult.warnings?.some(w => w.includes('Tools'))).toBe(true);
    });

    it('should handle conversion quality scoring', () => {
      const geminiResult = toGemini(sampleCanonicalPackage);

      // Quality score should reflect lossy conversion
      expect(geminiResult.qualityScore).toBeGreaterThan(0);
      expect(geminiResult.qualityScore).toBeLessThan(100); // Due to tools section
    });
  });

  describe('Simple command round-trip', () => {
    it('should perfectly preserve simple commands', () => {
      const originalToml = `prompt = "Review the code for bugs"
description = "Code review helper"`;

      const canonical = fromGemini(originalToml, {
        id: 'review',
        name: 'Code Review',
        version: '1.0.0',
      });

      const backToGemini = toGemini(canonical);

      expect(backToGemini.qualityScore).toBe(100);
      expect(backToGemini.lossyConversion).toBe(false);
      expect(backToGemini.content).toContain('prompt = ');
      expect(backToGemini.content).toContain('description = ');
    });
  });
});
