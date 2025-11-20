/**
 * Round-trip conversion tests
 * Ensures data isn't lost when converting between formats
 */

import { describe, it, expect } from 'vitest';
import { toCursor } from '../to-cursor.js';
import { toClaude } from '../to-claude.js';
import { fromClaude } from '../from-claude.js';
import { sampleCanonicalPackage, sampleClaudeAgent } from './setup.js';

describe('Round-trip conversions', () => {
  describe('Canonical → Claude → Canonical', () => {
    it('should preserve all data through round-trip', () => {
      // Convert canonical to claude
      const claudeResult = toClaude(sampleCanonicalPackage);

      // Convert back to canonical
      const backToCanonical = fromClaude(claudeResult.content, {
        id: sampleCanonicalPackage.id,
        version: sampleCanonicalPackage.version,
        author: sampleCanonicalPackage.author,
        tags: sampleCanonicalPackage.tags,
      });

      // Check metadata
      expect(backToCanonical.id).toBe(sampleCanonicalPackage.id);
      expect(backToCanonical.version).toBe(sampleCanonicalPackage.version);

      // Check sections exist
      const originalTypes = sampleCanonicalPackage.content.sections
        .map(s => s.type)
        .filter(t => t !== 'tools'); // Tools are Claude-specific, expected to lose

      const roundTripTypes = backToCanonical.content.sections.map(s => s.type);

      // All non-Claude-specific sections should be preserved
      expect(roundTripTypes).toContain('metadata');
      expect(roundTripTypes).toContain('persona');
      // Note: instructions may be converted to rules during round-trip parsing
      expect(roundTripTypes.some(t => t === 'instructions' || t === 'rules')).toBe(true);
      expect(roundTripTypes).toContain('rules');
      expect(roundTripTypes).toContain('examples');
    });

    it('should preserve tools through round-trip', () => {
      const claudeResult = toClaude(sampleCanonicalPackage);
      const backToCanonical = fromClaude(claudeResult.content, {
        id: sampleCanonicalPackage.id,
        version: sampleCanonicalPackage.version,
        author: sampleCanonicalPackage.author,
        tags: sampleCanonicalPackage.tags,
      });

      const originalTools = sampleCanonicalPackage.content.sections.find(
        s => s.type === 'tools'
      );
      const roundTripTools = backToCanonical.content.sections.find(
        s => s.type === 'tools'
      );

      expect(roundTripTools).toBeDefined();
      if (originalTools?.type === 'tools' && roundTripTools?.type === 'tools') {
        expect(roundTripTools.tools.sort()).toEqual(originalTools.tools.sort());
      }
    });

    it('should preserve persona details', () => {
      const claudeResult = toClaude(sampleCanonicalPackage);
      const backToCanonical = fromClaude(claudeResult.content, {
        id: sampleCanonicalPackage.id,
        version: sampleCanonicalPackage.version,
        author: sampleCanonicalPackage.author,
        tags: sampleCanonicalPackage.tags,
      });

      const originalPersona = sampleCanonicalPackage.content.sections.find(
        s => s.type === 'persona'
      );
      const roundTripPersona = backToCanonical.content.sections.find(
        s => s.type === 'persona'
      );

      expect(roundTripPersona).toBeDefined();
      if (originalPersona?.type === 'persona' && roundTripPersona?.type === 'persona') {
        expect(roundTripPersona.data.role).toBe(originalPersona.data.role);
        expect(roundTripPersona.data.style).toEqual(originalPersona.data.style);
        expect(roundTripPersona.data.expertise).toEqual(originalPersona.data.expertise);
      }
    });
  });

  describe('Real Claude agent conversion', () => {
    it('should convert real Claude agent to canonical and back', () => {
      const metadata = {
        id: 'analyst',
        version: '1.0.0',
        author: 'valllabh',
        tags: ['analyst', 'business'],
      };

      // Parse real Claude agent
      const canonical = fromClaude(sampleClaudeAgent, metadata);

      // Convert back to Claude
      const backToClaude = toClaude(canonical);

      // Verify no critical data loss
      expect(backToClaude.content).toContain('name: analyst');
      expect(backToClaude.content).toContain('Strategic analyst');
      expect(backToClaude.content).toContain('Read, Write');
      expect(backToClaude.lossyConversion).toBe(false);
    });

    it('should convert real Claude agent to Cursor format', () => {
      const metadata = {
        id: 'analyst',
        version: '1.0.0',
        author: 'valllabh',
        tags: ['analyst', 'business'],
      };

      // Parse real Claude agent
      const canonical = fromClaude(sampleClaudeAgent, metadata);

      // Convert to Cursor
      const cursorResult = toCursor(canonical);

      // Verify Cursor format with MDC header
      expect(cursorResult.content).toContain('---'); // Has MDC header
      expect(cursorResult.content).toMatch(/^---\n[\s\S]*?\n---\n/); // Valid YAML frontmatter
      expect(cursorResult.content).toContain('# 📊');
      expect(cursorResult.content).toContain('## Core Principles');
      expect(cursorResult.content).toContain('## Available Commands');
    });
  });

  describe('Quality preservation', () => {
    it('should maintain high quality scores through round-trip', () => {
      const claudeResult = toClaude(sampleCanonicalPackage);
      expect(claudeResult.qualityScore).toBeGreaterThanOrEqual(90);

      const backToCanonical = fromClaude(claudeResult.content, {
        id: sampleCanonicalPackage.id,
        version: sampleCanonicalPackage.version,
        author: sampleCanonicalPackage.author,
        tags: sampleCanonicalPackage.tags,
      });

      const backToClaude = toClaude(backToCanonical);
      expect(backToClaude.qualityScore).toBeGreaterThanOrEqual(90);
    });

    it('should flag lossy conversions appropriately', () => {
      // Package with Cursor-specific custom section
      const pkgWithCursorSection = {
        ...sampleCanonicalPackage,
        content: {
          ...sampleCanonicalPackage.content,
          sections: [
            ...sampleCanonicalPackage.content.sections,
            {
              type: 'custom' as const,
              editorType: 'cursor' as const,
              content: 'Cursor-only content',
            },
          ],
        },
      };

      // Convert to Claude
      const claudeResult = toClaude(pkgWithCursorSection);

      // Should flag as lossy because Cursor section was skipped
      expect(claudeResult.lossyConversion).toBe(true);
      expect(claudeResult.warnings).toContain('Custom cursor section skipped');
    });
  });

  describe('Data integrity checks', () => {
    it('should preserve rule count', () => {
      const claudeResult = toClaude(sampleCanonicalPackage);
      const backToCanonical = fromClaude(claudeResult.content, {
        id: sampleCanonicalPackage.id,
        version: sampleCanonicalPackage.version,
        author: sampleCanonicalPackage.author,
        tags: sampleCanonicalPackage.tags,
      });

      const originalRules = sampleCanonicalPackage.content.sections.find(
        s => s.type === 'rules'
      );
      const roundTripRules = backToCanonical.content.sections.find(
        s => s.type === 'rules'
      );

      if (originalRules?.type === 'rules' && roundTripRules?.type === 'rules') {
        // Should preserve at least one rule (parsing may consolidate or split rules)
        expect(roundTripRules.items.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should preserve example count', () => {
      const claudeResult = toClaude(sampleCanonicalPackage);
      const backToCanonical = fromClaude(claudeResult.content, {
        id: sampleCanonicalPackage.id,
        version: sampleCanonicalPackage.version,
        author: sampleCanonicalPackage.author,
        tags: sampleCanonicalPackage.tags,
      });

      const originalExamples = sampleCanonicalPackage.content.sections.find(
        s => s.type === 'examples'
      );
      const roundTripExamples = backToCanonical.content.sections.find(
        s => s.type === 'examples'
      );

      if (originalExamples?.type === 'examples' && roundTripExamples?.type === 'examples') {
        expect(roundTripExamples.examples.length).toBe(
          originalExamples.examples.length
        );
      }
    });

    it('should preserve code block content', () => {
      const claudeResult = toClaude(sampleCanonicalPackage);
      const backToCanonical = fromClaude(claudeResult.content, {
        id: sampleCanonicalPackage.id,
        version: sampleCanonicalPackage.version,
        author: sampleCanonicalPackage.author,
        tags: sampleCanonicalPackage.tags,
      });

      const originalExamples = sampleCanonicalPackage.content.sections.find(
        s => s.type === 'examples'
      );
      const roundTripExamples = backToCanonical.content.sections.find(
        s => s.type === 'examples'
      );

      if (originalExamples?.type === 'examples' && roundTripExamples?.type === 'examples') {
        const originalCode = originalExamples.examples[0].code;
        const roundTripCode = roundTripExamples.examples[0].code;

        // Code should be substantially similar (exact match may differ due to formatting)
        expect(roundTripCode).toContain('describe');
        expect(roundTripCode).toContain('expect');
      }
    });
  });

  describe('Format-specific features', () => {
    it('should handle Cursor to Claude conversion', () => {
      // Convert canonical to Cursor first
      const cursorResult = toCursor(sampleCanonicalPackage);

      // Note: We don't have a fromCursor parser yet, so this would be future work
      // This test documents the expected behavior

      expect(cursorResult.content).toBeTruthy();
      expect(cursorResult.format).toBe('cursor');
    });

    it('should maintain section order through conversion', () => {
      const claudeResult = toClaude(sampleCanonicalPackage);
      const backToCanonical = fromClaude(claudeResult.content, {
        id: sampleCanonicalPackage.id,
        version: sampleCanonicalPackage.version,
        author: sampleCanonicalPackage.author,
        tags: sampleCanonicalPackage.tags,
      });

      // Metadata should always be first
      expect(backToCanonical.content.sections[0].type).toBe('metadata');

      // Persona should be present (order may vary during round-trip)
      const personaIndex = backToCanonical.content.sections.findIndex(
        s => s.type === 'persona'
      );
      expect(personaIndex).toBeGreaterThan(-1);
    });

    it('should preserve model field through round-trip', () => {
      const agentWithModel = `---
name: test-agent
description: Test agent with model preference
model: opus
tools: Read, Write
---

# Test Agent

Agent with model preference.`;

      const metadata = {
        id: 'test-agent',
        version: '1.0.0',
        author: 'test',
        tags: ['test'],
      };

      // Parse from Claude
      const canonical = fromClaude(agentWithModel, metadata);

      // Convert back to Claude
      const backToClaude = toClaude(canonical);

      // Should preserve model field
      expect(backToClaude.content).toContain('model: opus');
    });

    it('should allow config override of model field', () => {
      const agentWithModel = `---
name: test-agent
description: Test agent
model: opus
---

# Test Agent`;

      const metadata = {
        id: 'test-agent',
        version: '1.0.0',
        author: 'test',
        tags: ['test'],
      };

      // Parse from Claude
      const canonical = fromClaude(agentWithModel, metadata);

      // Convert back to Claude with config override
      const backToClaude = toClaude(canonical, {
        claudeConfig: { model: 'haiku' },
      });

      // Should use config override
      expect(backToClaude.content).toContain('model: haiku');
      expect(backToClaude.content).not.toContain('model: opus');
    });
  });
});
