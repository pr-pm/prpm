/**
 * Tests to validate format-capabilities.json consistency
 */

import { describe, it, expect } from 'vitest';
import {
  getAllFormatCapabilities,
  AGENTS_MD_SUPPORTED_FORMATS,
  supportsAgentsMd,
} from '../../utils/progressive-disclosure.js';

describe('Format Capabilities JSON Validation', () => {
  const allCapabilities = getAllFormatCapabilities();

  describe('Schema consistency', () => {
    it('should have all required top-level fields', () => {
      expect(allCapabilities).toHaveProperty('version');
      expect(allCapabilities).toHaveProperty('description');
      expect(allCapabilities).toHaveProperty('formats');
      expect(allCapabilities).toHaveProperty('agentsMdSupport');
    });

    it('should have valid version format', () => {
      expect(allCapabilities.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have at least 10 formats defined', () => {
      const formatCount = Object.keys(allCapabilities.formats).length;
      expect(formatCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Format entry validation', () => {
    it('should have all required fields for each format', () => {
      Object.entries(allCapabilities.formats).forEach(([formatName, capability]) => {
        expect(capability).toHaveProperty('name');
        expect(capability).toHaveProperty('supportsSkills');
        expect(capability).toHaveProperty('supportsPlugins');
        expect(capability).toHaveProperty('supportsExtensions');
        expect(capability).toHaveProperty('supportsAgents');
        expect(capability).toHaveProperty('supportsAgentsMd');

        // All fields should be booleans
        expect(typeof capability.supportsSkills).toBe('boolean');
        expect(typeof capability.supportsPlugins).toBe('boolean');
        expect(typeof capability.supportsExtensions).toBe('boolean');
        expect(typeof capability.supportsAgents).toBe('boolean');
        expect(typeof capability.supportsAgentsMd).toBe('boolean');
      });
    });

    it('should have markdownFallback for most formats', () => {
      const formatsWithFallback = Object.values(allCapabilities.formats)
        .filter(c => c.markdownFallback);

      expect(formatsWithFallback.length).toBeGreaterThan(10);
    });
  });

  describe('agents.md support consistency', () => {
    it('should have agentsMdSupport.formats array match individual format flags', () => {
      // Get all formats where supportsAgentsMd is true
      const formatsWithAgentsMd = Object.entries(allCapabilities.formats)
        .filter(([, capability]) => capability.supportsAgentsMd)
        .map(([formatName]) => formatName);

      // Should match the agentsMdSupport.formats array
      expect(formatsWithAgentsMd.sort()).toEqual(
        allCapabilities.agentsMdSupport.formats.sort()
      );
    });

    it('should match AGENTS_MD_SUPPORTED_FORMATS constant', () => {
      const jsonFormats = allCapabilities.agentsMdSupport.formats.sort();
      const constantFormats = [...AGENTS_MD_SUPPORTED_FORMATS].sort();

      expect(jsonFormats).toEqual(constantFormats);
    });

    it('should correctly identify formats via supportsAgentsMd()', () => {
      // Test all formats listed in agentsMdSupport
      allCapabilities.agentsMdSupport.formats.forEach(format => {
        expect(supportsAgentsMd(format as any)).toBe(true);
      });

      // Test formats NOT in agentsMdSupport
      const allFormats = Object.keys(allCapabilities.formats);
      const nonSupportedFormats = allFormats.filter(
        f => !allCapabilities.agentsMdSupport.formats.includes(f)
      );

      nonSupportedFormats.forEach(format => {
        expect(supportsAgentsMd(format as any)).toBe(false);
      });
    });

    it('should have at least 8 formats supporting agents.md', () => {
      expect(allCapabilities.agentsMdSupport.formats.length).toBeGreaterThanOrEqual(8);
    });

    it('should include claude, kiro, and droid in agents.md support', () => {
      const agentsMdFormats = allCapabilities.agentsMdSupport.formats;

      expect(agentsMdFormats).toContain('cursor');
      expect(agentsMdFormats).toContain('kiro');
      expect(agentsMdFormats).toContain('droid');
      expect(agentsMdFormats).toContain('agents.md');
    });
  });

  describe('Notes documentation', () => {
    it('should have notes for all formats', () => {
      Object.entries(allCapabilities.formats).forEach(([formatName, capability]) => {
        expect(capability.notes).toBeDefined();
        expect(capability.notes).not.toBe('');
      });
    });

    it('should mention agents.md in notes for formats that support it', () => {
      allCapabilities.agentsMdSupport.formats.forEach(formatName => {
        const capability = allCapabilities.formats[formatName];
        // Notes should mention 'agents.md' or 'agents' or 'agent'
        expect(capability.notes?.toLowerCase()).toMatch(/agent/);
      });
    });
  });

  describe('Logical consistency', () => {
    it('should not have conflicting capability flags', () => {
      Object.entries(allCapabilities.formats).forEach(([formatName, capability]) => {
        // If supportsAgentsMd is true, it should at least have some advanced support
        if (capability.supportsAgentsMd) {
          const hasAdvancedSupport =
            capability.supportsSkills ||
            capability.supportsPlugins ||
            capability.supportsExtensions ||
            capability.supportsAgents;

          // Most formats with agents.md support should have some advanced features
          // (agents.md, generic, and cursor are exceptions - cursor supports AGENTS.md without native advanced features)
          if (formatName !== 'agents.md' && formatName !== 'generic' && formatName !== 'cursor') {
            expect(hasAdvancedSupport).toBe(true);
          }
        }
      });
    });

    it('should have claude, continue, and windsurf NOT supporting agents.md', () => {
      expect(supportsAgentsMd('claude')).toBe(false);
      expect(supportsAgentsMd('continue')).toBe(false);
      expect(supportsAgentsMd('windsurf')).toBe(false);
    });

    it('should have gemini NOT supporting agents.md', () => {
      // Gemini uses extensions, not agents.md
      expect(supportsAgentsMd('gemini')).toBe(false);
      expect(allCapabilities.formats.gemini.supportsExtensions).toBe(true);
    });
  });

  describe('Format-specific validations', () => {
    it('claude should support skills, plugins, agents, but NOT agents.md', () => {
      const claude = allCapabilities.formats.claude;

      expect(claude.supportsSkills).toBe(true);
      expect(claude.supportsPlugins).toBe(true);
      expect(claude.supportsAgents).toBe(true);
      expect(claude.supportsAgentsMd).toBe(false);
    });

    it('droid should support skills, agents, and agents.md', () => {
      const droid = allCapabilities.formats.droid;

      expect(droid.supportsSkills).toBe(true);
      expect(droid.supportsAgents).toBe(true);
      expect(droid.supportsAgentsMd).toBe(true);
    });

    it('gemini should only support extensions', () => {
      const gemini = allCapabilities.formats.gemini;

      expect(gemini.supportsExtensions).toBe(true);
      expect(gemini.supportsSkills).toBe(false);
      expect(gemini.supportsPlugins).toBe(false);
      expect(gemini.supportsAgents).toBe(false);
      expect(gemini.supportsAgentsMd).toBe(false);
    });

    it('cursor should support agents.md but not other advanced features', () => {
      const cursor = allCapabilities.formats.cursor;

      expect(cursor.supportsSkills).toBe(false);
      expect(cursor.supportsPlugins).toBe(false);
      expect(cursor.supportsExtensions).toBe(false);
      expect(cursor.supportsAgents).toBe(false);
      expect(cursor.supportsAgentsMd).toBe(true);
    });
  });
});
