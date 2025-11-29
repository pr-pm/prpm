/**
 * Tests for Cursor hooks format conversion
 */

import { describe, it, expect } from 'vitest';
import { fromCursorHooks } from '../from-cursor-hooks.js';
import { toCursorHooks, isCursorHooksFormat } from '../to-cursor-hooks.js';
import type { CanonicalPackage } from '../types/canonical.js';

describe('Cursor Hooks Format', () => {
  const metadata = {
    id: 'test-cursor-hooks',
    name: 'test-hooks',
    version: '1.0.0',
    author: 'testauthor',
  };

  const sampleHooksJson = JSON.stringify({
    beforeShellExecution: './scripts/audit-shell.sh',
    afterFileEdit: './scripts/format-code.js',
    beforeSubmitPrompt: './scripts/check-pii.py',
  }, null, 2);

  describe('fromCursorHooks', () => {
    it('should parse hooks.json correctly', () => {
      const result = fromCursorHooks(sampleHooksJson, metadata);

      expect(result.format).toBe('cursor-hooks');
      expect(result.subtype).toBe('hook');
      expect(result.sourceFormat).toBe('cursor-hooks');
    });

    it('should extract hook sections', () => {
      const result = fromCursorHooks(sampleHooksJson, metadata);

      const hookSections = result.content.sections.filter(s => s.type === 'cursor-hook');
      expect(hookSections).toHaveLength(3);

      const beforeShell = hookSections.find(s =>
        s.type === 'cursor-hook' && s.hookType === 'beforeShellExecution'
      );
      expect(beforeShell).toBeDefined();
      if (beforeShell?.type === 'cursor-hook') {
        expect(beforeShell.scriptPath).toBe('./scripts/audit-shell.sh');
      }

      const afterEdit = hookSections.find(s =>
        s.type === 'cursor-hook' && s.hookType === 'afterFileEdit'
      );
      expect(afterEdit).toBeDefined();
      if (afterEdit?.type === 'cursor-hook') {
        expect(afterEdit.scriptPath).toBe('./scripts/format-code.js');
      }
    });

    it('should reject invalid hook types', () => {
      const invalidJson = JSON.stringify({
        invalidHookType: './scripts/test.sh',
      });

      expect(() => fromCursorHooks(invalidJson, metadata)).toThrow('Invalid hook type');
    });

    it('should handle empty hooks.json', () => {
      const emptyJson = '{}';
      const result = fromCursorHooks(emptyJson, metadata);

      expect(result.content.sections).toHaveLength(0);
    });

    it('should reject invalid JSON', () => {
      const invalidJson = 'not valid json';
      expect(() => fromCursorHooks(invalidJson, metadata)).toThrow('Invalid Cursor hooks JSON');
    });
  });

  describe('toCursorHooks', () => {
    it('should convert canonical to hooks.json format', () => {
      const canonical = fromCursorHooks(sampleHooksJson, metadata);
      const result = toCursorHooks(canonical);

      expect(result.format).toBe('cursor-hooks');
      expect(result.lossyConversion).toBe(false);

      const parsed = JSON.parse(result.content);
      expect(parsed.beforeShellExecution).toBe('./scripts/audit-shell.sh');
      expect(parsed.afterFileEdit).toBe('./scripts/format-code.js');
      expect(parsed.beforeSubmitPrompt).toBe('./scripts/check-pii.py');
    });

    it('should warn when no hook sections found', () => {
      const canonical: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'test',
        tags: [],
        format: 'cursor-hooks',
        subtype: 'hook',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
      };

      const result = toCursorHooks(canonical);
      expect(result.warnings).toContain('No cursor-hook sections found in package');
      expect(result.qualityScore).toBeLessThan(100);
    });

    it('should skip non-hook sections', () => {
      const canonical: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'test',
        tags: [],
        format: 'cursor-hooks',
        subtype: 'hook',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'cursor-hook',
              hookType: 'beforeShellExecution',
              scriptPath: './test.sh',
            },
            {
              type: 'instructions',
              title: 'Instructions',
              content: 'Some instructions',
            },
          ],
        },
      };

      const result = toCursorHooks(canonical);
      expect(result.warnings).toContain('1 non-hook sections skipped (not supported in hooks.json format)');
    });

    it('should warn when converting Claude hooks to Cursor hooks', () => {
      const canonical: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'test',
        tags: [],
        format: 'claude',
        subtype: 'hook',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'hook',
              event: 'session-start',
              language: 'bash',
              code: 'echo "Session started"',
            },
          ],
        },
      };

      const result = toCursorHooks(canonical);
      expect(result.warnings?.some(w => w.includes('Claude hook(s) found but cannot be converted'))).toBe(true);
      expect(result.lossyConversion).toBe(true);
      expect(result.qualityScore).toBeLessThan(70);
    });

    it('should warn when converting Kiro hooks to Cursor hooks', () => {
      const canonical: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'test',
        tags: [],
        format: 'kiro',
        subtype: 'hook',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          kiroAgent: {
            hooks: {
              agentSpawn: ['./spawn.sh'],
              userPromptSubmit: ['./prompt.sh'],
            },
          },
        },
      };

      const result = toCursorHooks(canonical);
      expect(result.warnings?.some(w => w.includes('Kiro hooks found in metadata'))).toBe(true);
      expect(result.warnings?.some(w => w.includes('agentSpawn, userPromptSubmit'))).toBe(true);
      expect(result.lossyConversion).toBe(true);
      expect(result.qualityScore).toBeLessThan(70);
    });
  });

  describe('isCursorHooksFormat', () => {
    it('should detect valid hooks.json format', () => {
      expect(isCursorHooksFormat(sampleHooksJson)).toBe(true);
    });

    it('should reject non-object JSON', () => {
      expect(isCursorHooksFormat('[]')).toBe(false);
      expect(isCursorHooksFormat('"string"')).toBe(false);
      expect(isCursorHooksFormat('null')).toBe(false);
    });

    it('should reject objects without valid hook types', () => {
      const invalidJson = JSON.stringify({ foo: 'bar' });
      expect(isCursorHooksFormat(invalidJson)).toBe(false);
    });

    it('should reject invalid JSON', () => {
      expect(isCursorHooksFormat('not json')).toBe(false);
    });

    it('should accept objects with at least one valid hook type', () => {
      const validJson = JSON.stringify({
        beforeShellExecution: './test.sh',
        invalidKey: 'ignored',
      });
      expect(isCursorHooksFormat(validJson)).toBe(true);
    });
  });

  describe('roundtrip', () => {
    it('should maintain data through roundtrip conversion', () => {
      const original = fromCursorHooks(sampleHooksJson, metadata);
      const converted = toCursorHooks(original);
      const roundtrip = fromCursorHooks(converted.content, metadata);

      expect(roundtrip.content.sections).toHaveLength(original.content.sections.length);

      const originalHooks = original.content.sections.filter(s => s.type === 'cursor-hook');
      const roundtripHooks = roundtrip.content.sections.filter(s => s.type === 'cursor-hook');

      expect(roundtripHooks).toHaveLength(originalHooks.length);

      for (const originalHook of originalHooks) {
        if (originalHook.type === 'cursor-hook') {
          const matchingHook = roundtripHooks.find(h =>
            h.type === 'cursor-hook' && h.hookType === originalHook.hookType
          );
          expect(matchingHook).toBeDefined();
          if (matchingHook?.type === 'cursor-hook') {
            expect(matchingHook.scriptPath).toBe(originalHook.scriptPath);
          }
        }
      }
    });
  });
});
