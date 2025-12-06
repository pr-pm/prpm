/**
 * Security-specific tests for converters package
 * Tests defensive measures against malicious inputs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { geminiToClaudeMCPServers, validateMCPServer } from '../cross-converters/mcp-transformer.js';
import { toCursor } from '../to-cursor.js';
import { fromCursor } from '../from-cursor.js';

describe('Security Tests', () => {
  describe('MCP Transformer - Type Safety', () => {
    it('should handle non-string env values safely', () => {

      const geminiConfig = {
        mcpServers: {
          'test-server': {
            command: 'node',
            args: ['server.js'],
            env: {
              STRING_VAR: '${extensionPath}/bin',
              NUMBER_VAR: 12345 as any, // Malicious non-string value
              OBJECT_VAR: { nested: 'value' } as any, // Malicious object
              NULL_VAR: null as any, // Malicious null
              UNDEFINED_VAR: undefined as any, // Malicious undefined
            },
          },
        },
      };

      // Should not throw error
      expect(() => {
        const result = geminiToClaudeMCPServers(geminiConfig);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should validate env is not null', () => {
      const serverWithNullEnv = {
        command: 'node',
        args: ['server.js'],
        env: null as any,
      };

      const errors = validateMCPServer(serverWithNullEnv, 'test');

      expect(errors).toContain('MCP server env must be an object');
    });

    it('should handle null env in transformation', () => {
      const geminiConfig = {
        mcpServers: {
          'test-server': {
            command: 'node',
            args: ['server.js'],
            env: null as any,
          },
        },
      };

      // Should handle gracefully
      const result = geminiToClaudeMCPServers(geminiConfig);
      expect(result.servers['test-server']).toBeDefined();
    });
  });

  describe('Progressive Disclosure - Error Resilience', () => {
    let originalReadFileSync: any;
    let mockFs: any;

    beforeEach(() => {
      // Mock fs to simulate file read errors
      mockFs = require('fs');
      originalReadFileSync = mockFs.readFileSync;
    });

    afterEach(() => {
      // Restore original fs
      if (originalReadFileSync) {
        mockFs.readFileSync = originalReadFileSync;
      }
    });

    it('should handle missing format-capabilities.json file', () => {
      // Simulate file not found
      mockFs.readFileSync = () => {
        throw new Error('ENOENT: no such file or directory');
      };

      // Re-import to trigger module initialization with mocked fs
      delete require.cache[require.resolve('../utils/progressive-disclosure.js')];

      // Should not crash, should use fallback
      expect(() => {
        require('../utils/progressive-disclosure.js');
      }).not.toThrow();
    });

    it('should handle invalid JSON in format-capabilities.json', () => {
      // Simulate invalid JSON
      mockFs.readFileSync = () => {
        return '{ invalid json syntax';
      };

      delete require.cache[require.resolve('../utils/progressive-disclosure.js')];

      expect(() => {
        require('../utils/progressive-disclosure.js');
      }).not.toThrow();
    });

    it('should handle missing required fields in JSON', () => {
      // Simulate incomplete data
      mockFs.readFileSync = () => {
        return JSON.stringify({
          // Missing agentsMdSupport
          formats: {}
        });
      };

      delete require.cache[require.resolve('../utils/progressive-disclosure.js')];

      expect(() => {
        require('../utils/progressive-disclosure.js');
      }).not.toThrow();
    });

    it('should provide fallback capabilities on error', () => {
      // Simulate file read error
      mockFs.readFileSync = () => {
        throw new Error('Permission denied');
      };

      delete require.cache[require.resolve('../utils/progressive-disclosure.js')];

      const pd = require('../utils/progressive-disclosure.js');

      // Should have fallback data
      expect(pd.AGENTS_MD_SUPPORTED_FORMATS).toBeDefined();
      expect(Array.isArray(pd.AGENTS_MD_SUPPORTED_FORMATS)).toBe(true);
      expect(pd.AGENTS_MD_SUPPORTED_FORMATS.length).toBeGreaterThan(0);
    });

    it('should validate JSON structure before use', () => {
      // Simulate non-object JSON
      mockFs.readFileSync = () => {
        return '"just a string"';
      };

      delete require.cache[require.resolve('../utils/progressive-disclosure.js')];

      expect(() => {
        require('../utils/progressive-disclosure.js');
      }).not.toThrow();
    });
  });

  describe('From-Cursor - Error Handling', () => {
    it('should handle file loading errors gracefully', () => {
      const cursorContent = `
# Test Rule

See @nonexistent-file.md for details
`;

      const metadata = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        author: { name: 'Test' },
      };

      // Should not throw even if file loading fails
      expect(() => {
        const result = fromCursor(cursorContent, metadata, {
          resolveFiles: true,
          basePath: '/nonexistent/path',
        });
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should continue conversion when file references fail', () => {
      const cursorContent = `
# Test Rule

Instructions here.
`;

      const metadata = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        author: { name: 'Test' },
      };

      const result = fromCursor(cursorContent, metadata, {
        resolveFiles: true,
        basePath: '/invalid/path',
      });

      expect(result).toBeDefined();
      expect(result.format).toBe('cursor');
      expect(result.content).toBeDefined();
    });
  });

  describe('Combined Security Scenarios', () => {
    it('should handle multiple security issues in single conversion', () => {
      const maliciousPkg: any = {
        id: 'malicious',
        name: 'Malicious Package',
        version: '1.0.0',
        format: 'canonical',
        sourceFormat: 'claude',
        subtype: 'rule',
        author: { name: 'Attacker' },
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'Multiple Attacks',
              path: '/absolute/../../etc/passwd\nwith\nnewlines',
              content: 'malicious',
              category: 'injection--> <script>alert("XSS")</script> <!--',
            },
            {
              type: 'file-reference',
              title: 'Path Traversal',
              path: '../../../../etc/shadow',
              content: 'sensitive',
              category: 'attack',
            },
          ],
        },
        metadata: {},
      };

      const result = toCursor(maliciousPkg);

      // Should complete without crashing
      expect(result).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);

      // All security issues should be mitigated
      expect(result.content).not.toContain('../');
      expect(result.content).not.toContain('/etc/');
      expect(result.content).not.toContain('-->');
      expect(result.content).not.toContain('<script>');
      expect(result.content).not.toMatch(/[\r\n].*@file/);
    });
  });
});
