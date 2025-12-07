/**
 * Tests for progressive disclosure integration with fromCursor
 */

import { describe, it, expect } from 'vitest';
import {
  supportsAgentsMd,
  AGENTS_MD_SUPPORTED_FORMATS,
  getConversionStrategy,
} from './utils/progressive-disclosure.js';
import type { Format } from '@pr-pm/types';

describe('Progressive disclosure - agents.md support', () => {
  describe('supportsAgentsMd', () => {
    it('should identify formats that support agents.md', () => {
      expect(supportsAgentsMd('cursor')).toBe(true);
      expect(supportsAgentsMd('copilot')).toBe(true);
      expect(supportsAgentsMd('kiro')).toBe(true);
      expect(supportsAgentsMd('opencode')).toBe(true);
      expect(supportsAgentsMd('ruler')).toBe(true);
      expect(supportsAgentsMd('droid')).toBe(true);
      expect(supportsAgentsMd('replit')).toBe(true);
      expect(supportsAgentsMd('agents.md')).toBe(true);
      expect(supportsAgentsMd('generic')).toBe(true);
    });

    it('should identify formats that do not support agents.md', () => {
      expect(supportsAgentsMd('claude')).toBe(false);
      expect(supportsAgentsMd('continue')).toBe(false);
      expect(supportsAgentsMd('windsurf')).toBe(false);
      expect(supportsAgentsMd('aider')).toBe(false);
      expect(supportsAgentsMd('zencoder')).toBe(false);
      expect(supportsAgentsMd('trae')).toBe(false);
      expect(supportsAgentsMd('gemini')).toBe(false);
    });
  });

  describe('AGENTS_MD_SUPPORTED_FORMATS', () => {
    it('should be a readonly array', () => {
      expect(Array.isArray(AGENTS_MD_SUPPORTED_FORMATS)).toBe(true);
      expect(AGENTS_MD_SUPPORTED_FORMATS.length).toBeGreaterThan(0);
    });

    it('should include all expected formats', () => {
      const expected: Format[] = [
        'cursor',
        'copilot',
        'kiro',
        'opencode',
        'ruler',
        'droid',
        'replit',
        'agents.md',
        'generic',
      ];

      for (const format of expected) {
        expect(AGENTS_MD_SUPPORTED_FORMATS).toContain(format);
      }
    });

    it('should not include formats that do not support agents.md', () => {
      const notSupported: Format[] = [
        'claude',
        'continue',
        'windsurf',
        'aider',
        'zencoder',
        'trae',
        'gemini',
      ];

      for (const format of notSupported) {
        expect(AGENTS_MD_SUPPORTED_FORMATS).not.toContain(format);
      }
    });
  });

  describe('Integration with conversion strategy', () => {
    it('should recommend agents.md fallback for Cursor when converting skills', () => {
      const strategy = getConversionStrategy('cursor', 'skill');

      expect(strategy.strategy).toBe('progressive');
      expect(strategy.fallbackFilename).toBe('agents.md');
      expect(strategy.warnings).toHaveLength(1);
      expect(strategy.warnings[0]).toContain("cursor doesn't support skill");
    });

    it('should recommend agents.md fallback for Continue when converting agents', () => {
      const strategy = getConversionStrategy('continue', 'agent');

      expect(strategy.strategy).toBe('progressive');
      expect(strategy.fallbackFilename).toBe('agents.md');
    });

    it('should recommend agents.md fallback for Windsurf when converting plugins', () => {
      const strategy = getConversionStrategy('windsurf', 'plugin');

      expect(strategy.strategy).toBe('progressive');
      expect(strategy.fallbackFilename).toBe('agents.md');
    });

    it('should use native format for Claude when converting skills', () => {
      const strategy = getConversionStrategy('claude', 'skill');

      expect(strategy.strategy).toBe('native');
      expect(strategy.primaryFormat).toBe('claude');
      expect(strategy.qualityScore).toBe(100);
    });

    it('should use native format for agents.md when converting agents', () => {
      const strategy = getConversionStrategy('agents.md', 'agent');

      expect(strategy.strategy).toBe('native');
      expect(strategy.primaryFormat).toBe('agents.md');
      expect(strategy.qualityScore).toBe(100);
    });
  });

  describe('Universal fallback preference', () => {
    it('should use agents.md when preferUniversal is true', () => {
      const strategy = getConversionStrategy('cursor', 'rule', {
        preferUniversal: true,
      });

      expect(strategy.strategy).toBe('universal');
      expect(strategy.primaryFormat).toBe('markdown');
      expect(strategy.primaryFilename).toBe('agents.md');
      expect(strategy.qualityScore).toBe(75);
      expect(strategy.warnings).toContain(
        'Using universal agents.md format for maximum compatibility'
      );
    });

    it('should prefer agents.md even when native format would work', () => {
      const strategy = getConversionStrategy('claude', 'skill', {
        preferUniversal: true,
      });

      expect(strategy.strategy).toBe('universal');
      expect(strategy.primaryFilename).toBe('agents.md');
      expect(strategy.qualityScore).toBe(75);
    });
  });

  describe('Progressive disclosure for multi-file packages', () => {
    it('should recommend progressive disclosure for Cursor with file references', () => {
      // Cursor doesn't support skills, so converting a multi-file skill package
      // should use progressive disclosure with cursor-rules.md + agents.md fallback
      const strategy = getConversionStrategy('cursor', 'skill');

      expect(strategy.strategy).toBe('progressive');
      expect(strategy.primaryFormat).toBe('markdown');
      expect(strategy.primaryFilename).toBe('cursor-rules.md');
      expect(strategy.fallbackFilename).toBe('agents.md');
    });

    it('should use native format for formats that support agents directly', () => {
      // Kiro supports agents, so no progressive disclosure needed
      const strategy = getConversionStrategy('kiro', 'agent');

      expect(strategy.strategy).toBe('native');
      expect(strategy.primaryFormat).toBe('kiro');
    });
  });

  describe('Format-specific markdown fallbacks', () => {
    it('should prioritize CLAUDE.md for Claude format', () => {
      const strategy = getConversionStrategy('claude', 'extension', {
        forceMarkdown: true,
      });

      expect(strategy.strategy).toBe('progressive');
      expect(strategy.primaryFormat).toBe('markdown');
      expect(strategy.primaryFilename).toBe('CLAUDE.md');
    });

    it('should prioritize cursor-rules.md for Cursor format', () => {
      const strategy = getConversionStrategy('cursor', 'skill', {
        forceMarkdown: true,
      });

      expect(strategy.strategy).toBe('progressive');
      expect(strategy.primaryFilename).toBe('cursor-rules.md');
    });

    it('should prioritize continue-prompts.md for Continue format', () => {
      const strategy = getConversionStrategy('continue', 'agent', {
        forceMarkdown: true,
      });

      expect(strategy.strategy).toBe('progressive');
      expect(strategy.primaryFilename).toBe('continue-prompts.md');
    });
  });
});
