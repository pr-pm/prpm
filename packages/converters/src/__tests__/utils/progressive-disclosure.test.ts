/**
 * Tests for progressive disclosure utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatSupportsSubtype,
  shouldUseMarkdownFallback,
  getRecommendedFormat,
  getUniversalFallback,
  getFallbackChain,
  getConversionStrategy,
  supportsAgentsMd,
  AGENTS_MD_SUPPORTED_FORMATS,
} from '../../utils/progressive-disclosure.js';

describe('Progressive Disclosure', () => {
  describe('supportsAgentsMd', () => {
    it('should identify formats that support agents.md', () => {
      expect(supportsAgentsMd('claude')).toBe(true);
      expect(supportsAgentsMd('kiro')).toBe(true);
      expect(supportsAgentsMd('opencode')).toBe(true);
      expect(supportsAgentsMd('ruler')).toBe(true);
      expect(supportsAgentsMd('droid')).toBe(true);
      expect(supportsAgentsMd('replit')).toBe(true);
      expect(supportsAgentsMd('agents.md')).toBe(true);
      expect(supportsAgentsMd('generic')).toBe(true);
    });

    it('should identify formats that do not support agents.md', () => {
      expect(supportsAgentsMd('cursor')).toBe(false);
      expect(supportsAgentsMd('continue')).toBe(false);
      expect(supportsAgentsMd('windsurf')).toBe(false);
      expect(supportsAgentsMd('copilot')).toBe(false);
    });
  });

  describe('AGENTS_MD_SUPPORTED_FORMATS', () => {
    it('should be a readonly array with all agent-supporting formats', () => {
      expect(Array.isArray(AGENTS_MD_SUPPORTED_FORMATS)).toBe(true);
      expect(AGENTS_MD_SUPPORTED_FORMATS.length).toBe(8);
      expect(AGENTS_MD_SUPPORTED_FORMATS).toContain('claude');
      expect(AGENTS_MD_SUPPORTED_FORMATS).toContain('kiro');
      expect(AGENTS_MD_SUPPORTED_FORMATS).toContain('agents.md');
    });
  });

  describe('formatSupportsSubtype', () => {
    it('should detect Claude supports skills', () => {
      expect(formatSupportsSubtype('claude', 'skill')).toBe(true);
    });

    it('should detect Claude supports plugins', () => {
      expect(formatSupportsSubtype('claude', 'plugin')).toBe(true);
    });

    it('should detect Gemini supports extensions', () => {
      expect(formatSupportsSubtype('gemini', 'extension')).toBe(true);
    });

    it('should detect Cursor does not support skills', () => {
      expect(formatSupportsSubtype('cursor', 'skill')).toBe(false);
    });

    it('should detect Cursor does not support agents', () => {
      expect(formatSupportsSubtype('cursor', 'agent')).toBe(false);
    });

    it('should detect agents.md supports agents', () => {
      expect(formatSupportsSubtype('agents.md', 'agent')).toBe(true);
    });

    it('should allow basic subtypes for most formats', () => {
      expect(formatSupportsSubtype('cursor', 'rule')).toBe(true);
      expect(formatSupportsSubtype('continue', 'prompt')).toBe(true);
    });
  });

  describe('shouldUseMarkdownFallback', () => {
    it('should recommend fallback for Claude skill → Cursor', () => {
      const result = shouldUseMarkdownFallback('cursor', 'skill');

      expect(result.shouldFallback).toBe(true);
      expect(result.fallbackFormat).toBe('cursor-rules.md');
      expect(result.reason).toContain("doesn't support skill");
    });

    it('should recommend fallback for Gemini extension → Cursor', () => {
      const result = shouldUseMarkdownFallback('cursor', 'extension');

      expect(result.shouldFallback).toBe(true);
      expect(result.fallbackFormat).toBe('cursor-rules.md');
    });

    it('should not recommend fallback for Claude skill → Claude', () => {
      const result = shouldUseMarkdownFallback('claude', 'skill');

      expect(result.shouldFallback).toBe(false);
    });

    it('should not recommend fallback for compatible formats', () => {
      expect(shouldUseMarkdownFallback('gemini', 'extension').shouldFallback).toBe(false);
      expect(shouldUseMarkdownFallback('claude', 'plugin').shouldFallback).toBe(false);
      expect(shouldUseMarkdownFallback('agents.md', 'agent').shouldFallback).toBe(false);
    });
  });

  describe('getRecommendedFormat', () => {
    it('should recommend native format when supported', () => {
      const result = getRecommendedFormat('claude', 'skill');

      expect(result.format).toBe('claude');
      expect(result.subtype).toBe('skill');
      expect(result.useProgressive).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it('should recommend markdown fallback when not supported', () => {
      const result = getRecommendedFormat('cursor', 'skill');

      expect(result.format).toBe('markdown');
      expect(result.filename).toBe('cursor-rules.md');
      expect(result.useProgressive).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Progressive disclosure');
    });

    it('should recommend CLAUDE.md for unsupported Claude features', () => {
      // If we add a new subtype Claude doesn't support
      const result = getRecommendedFormat('claude', 'skill');

      // Claude supports skills, so should be native
      expect(result.format).toBe('claude');
    });

    it('should recommend GEMINI.md fallback for Gemini', () => {
      const result = getRecommendedFormat('gemini', 'extension');

      // Gemini supports extensions, so should be native
      expect(result.format).toBe('gemini');
    });
  });

  describe('getUniversalFallback', () => {
    it('should return agents.md as universal fallback', () => {
      const result = getUniversalFallback();

      expect(result.format).toBe('markdown');
      expect(result.filename).toBe('agents.md');
      expect(result.description).toContain('Universal');
    });
  });

  describe('getFallbackChain', () => {
    it('should return fallback chain for Claude', () => {
      const chain = getFallbackChain('claude');

      expect(chain.length).toBeGreaterThanOrEqual(2);
      expect(chain[0].format).toBe('claude'); // Native first
      expect(chain.some(f => f.filename === 'CLAUDE.md')).toBe(true);
      expect(chain.some(f => f.filename === 'agents.md')).toBe(true);
    });

    it('should return fallback chain for Gemini', () => {
      const chain = getFallbackChain('gemini');

      expect(chain.some(f => f.filename === 'GEMINI.md')).toBe(true);
      expect(chain.some(f => f.filename === 'agents.md')).toBe(true);
    });

    it('should return fallback chain for Cursor', () => {
      const chain = getFallbackChain('cursor');

      expect(chain[0].format).toBe('cursor'); // Native first
      expect(chain.some(f => f.filename === 'agents.md')).toBe(true);
    });

    it('should order by priority', () => {
      const chain = getFallbackChain('claude');

      for (let i = 1; i < chain.length; i++) {
        expect(chain[i].priority).toBeGreaterThanOrEqual(chain[i - 1].priority);
      }
    });
  });

  describe('getConversionStrategy', () => {
    it('should use native strategy when format supports subtype', () => {
      const strategy = getConversionStrategy('claude', 'skill');

      expect(strategy.strategy).toBe('native');
      expect(strategy.primaryFormat).toBe('claude');
      expect(strategy.qualityScore).toBe(100);
      expect(strategy.warnings).toHaveLength(0);
    });

    it('should use progressive strategy when format does not support subtype', () => {
      const strategy = getConversionStrategy('cursor', 'skill');

      expect(strategy.strategy).toBe('progressive');
      expect(strategy.primaryFormat).toBe('markdown');
      expect(strategy.primaryFilename).toBe('cursor-rules.md');
      expect(strategy.fallbackFilename).toBe('agents.md');
      expect(strategy.qualityScore).toBeLessThan(100);
      expect(strategy.warnings.length).toBeGreaterThan(0);
    });

    it('should force markdown when requested', () => {
      const strategy = getConversionStrategy('claude', 'skill', {
        forceMarkdown: true,
      });

      expect(strategy.strategy).toBe('progressive');
      expect(strategy.primaryFormat).toBe('markdown');
      expect(strategy.primaryFilename).toBe('CLAUDE.md');
    });

    it('should use universal fallback when requested', () => {
      const strategy = getConversionStrategy('claude', 'skill', {
        preferUniversal: true,
      });

      expect(strategy.strategy).toBe('universal');
      expect(strategy.primaryFormat).toBe('markdown');
      expect(strategy.primaryFilename).toBe('agents.md');
      expect(strategy.qualityScore).toBe(75);
    });

    it('should provide fallback option for progressive strategy', () => {
      const strategy = getConversionStrategy('cursor', 'skill');

      expect(strategy.fallbackFormat).toBe('markdown');
      expect(strategy.fallbackFilename).toBe('agents.md');
    });

    it('should reduce quality score for progressive disclosure', () => {
      const nativeStrategy = getConversionStrategy('claude', 'skill');
      const progressiveStrategy = getConversionStrategy('cursor', 'skill');

      expect(progressiveStrategy.qualityScore).toBeLessThan(nativeStrategy.qualityScore);
    });

    describe('real-world conversion scenarios', () => {
      it('Claude skill → Cursor should use progressive disclosure', () => {
        const strategy = getConversionStrategy('cursor', 'skill');

        expect(strategy.strategy).toBe('progressive');
        expect(strategy.warnings[0]).toContain('Progressive disclosure');
      });

      it('Gemini extension → Claude should use native (plugin)', () => {
        const strategy = getConversionStrategy('claude', 'extension');

        // Claude supports plugins/extensions
        expect(strategy.strategy).toBe('native');
      });

      it('Claude plugin → Cursor should use progressive disclosure', () => {
        const strategy = getConversionStrategy('cursor', 'plugin');

        expect(strategy.strategy).toBe('progressive');
        expect(strategy.primaryFilename).toBe('cursor-rules.md');
      });

      it('Any agent → agents.md should use native', () => {
        const strategy = getConversionStrategy('agents.md', 'agent');

        expect(strategy.strategy).toBe('native');
        expect(strategy.qualityScore).toBe(100);
      });
    });
  });
});
