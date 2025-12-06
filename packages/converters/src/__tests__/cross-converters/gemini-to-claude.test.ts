/**
 * Tests for Gemini → Claude converter
 */

import { describe, it, expect } from 'vitest';
import {
  geminiToClaudePlugin,
  isGeminiExtension,
  shouldConvert,
  type ConversionResult,
} from '../../cross-converters/gemini-to-claude.js';
import type { CanonicalPackage } from '../../types/canonical.js';

describe('Gemini to Claude Converter', () => {
  describe('geminiToClaudePlugin', () => {
    it('should convert basic Gemini extension to Claude plugin', () => {
      const geminiPkg: CanonicalPackage = {
        id: 'test-extension',
        name: 'test-extension',
        version: '1.0.0',
        author: 'test-author',
        description: 'Test extension',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              title: 'Extension Metadata',
              data: {
                geminiExtension: {
                  mcpServers: {
                    filesystem: {
                      command: 'npx',
                      args: ['-y', '@modelcontextprotocol/server-filesystem'],
                    },
                  },
                },
              },
            },
          ],
        },
        metadata: {
          geminiExtension: {
            mcpServers: {
              filesystem: {
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-filesystem'],
              },
            },
          },
        },
      };

      const result = geminiToClaudePlugin(geminiPkg);

      expect(result.claudePackage.format).toBe('claude');
      expect(result.claudePackage.subtype).toBe('plugin');
      expect(result.claudePackage.name).toBe('test-extension');
      expect(result.claudePackage.version).toBe('1.0.0');
      expect(result.warnings).toHaveLength(1); // No instructions warning
      expect(result.lossyConversion).toBe(false);
    });

    it('should transform MCP servers correctly', () => {
      const geminiPkg: CanonicalPackage = {
        id: 'mcp-test',
        name: 'mcp-test',
        version: '1.0.0',
        author: 'test',
        description: 'MCP test',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          geminiExtension: {
            mcpServers: {
              github: {
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-github'],
                env: {
                  GITHUB_TOKEN: 'ghp_xxx',
                },
              },
              postgres: {
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-postgres'],
                env: {
                  DATABASE_URL: 'postgresql://localhost/db',
                },
              },
            },
          },
        },
      };

      const result = geminiToClaudePlugin(geminiPkg);

      const claudePlugin = result.claudePackage.metadata?.claudePlugin;
      expect(claudePlugin?.mcpServers).toBeDefined();
      expect(claudePlugin?.mcpServers?.github).toBeDefined();
      expect(claudePlugin?.mcpServers?.postgres).toBeDefined();
      expect(claudePlugin?.mcpServers?.github.env?.GITHUB_TOKEN).toBe('ghp_xxx');
    });

    it('should convert context file to instructions', () => {
      const geminiPkg: CanonicalPackage = {
        id: 'context-test',
        name: 'context-test',
        version: '1.0.0',
        author: 'test',
        description: 'Context test',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'context',
              title: 'Extension Context',
              content: 'This is the context content for the extension.',
            },
          ],
        },
        metadata: {
          geminiExtension: {
            contextFileName: 'context.md',
            mcpServers: {},
          },
        },
      };

      const result = geminiToClaudePlugin(geminiPkg);

      const claudePlugin = result.claudePackage.metadata?.claudePlugin;
      expect(claudePlugin?.instructions).toBe('This is the context content for the extension.');

      // Should have instructions section
      const instructionsSection = result.claudePackage.content.sections.find(
        s => s.type === 'instructions'
      );
      expect(instructionsSection).toBeDefined();
      expect(instructionsSection?.content).toBe('This is the context content for the extension.');
    });

    it('should warn about missing context file content', () => {
      const geminiPkg: CanonicalPackage = {
        id: 'missing-context',
        name: 'missing-context',
        version: '1.0.0',
        author: 'test',
        description: 'Missing context',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          geminiExtension: {
            contextFileName: 'missing.md',
            mcpServers: {},
          },
        },
      };

      const result = geminiToClaudePlugin(geminiPkg);

      expect(result.warnings.some(w => w.includes('content not found'))).toBe(true);
      expect(result.lossyConversion).toBe(true);
      expect(result.qualityScore).toBeLessThan(100);
    });

    it('should warn about excludeTools not supported in Claude', () => {
      const geminiPkg: CanonicalPackage = {
        id: 'exclude-test',
        name: 'exclude-test',
        version: '1.0.0',
        author: 'test',
        description: 'Exclude test',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          geminiExtension: {
            excludeTools: ['dangerous-tool', 'deprecated-tool'],
            mcpServers: {},
          },
        },
      };

      const result = geminiToClaudePlugin(geminiPkg);

      expect(result.warnings.some(w => w.includes('excludes tools'))).toBe(true);
      expect(result.warnings.some(w => w.includes('dangerous-tool'))).toBe(true);
      expect(result.lossyConversion).toBe(true);
      expect(result.qualityScore).toBeLessThan(100);
    });

    it('should preserve experimental settings in metadata', () => {
      const geminiPkg: CanonicalPackage = {
        id: 'experimental-test',
        name: 'experimental-test',
        version: '1.0.0',
        author: 'test',
        description: 'Experimental test',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          geminiExtension: {
            experimentalSettings: {
              betaFeature: true,
              customSetting: 'value',
            },
            mcpServers: {},
          },
        },
      };

      const result = geminiToClaudePlugin(geminiPkg);

      const claudePlugin = result.claudePackage.metadata?.claudePlugin;
      expect(claudePlugin?._geminiMetadata?.experimentalSettings).toEqual({
        betaFeature: true,
        customSetting: 'value',
      });
      expect(result.warnings.some(w => w.includes('experimental settings'))).toBe(true);
    });

    it('should calculate quality score correctly', () => {
      // High quality: has MCP servers and instructions
      const highQualityPkg: CanonicalPackage = {
        id: 'high-quality',
        name: 'high-quality',
        version: '1.0.0',
        author: 'test',
        description: 'High quality',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'context',
              title: 'Context',
              content: 'Instructions here',
            },
          ],
        },
        metadata: {
          geminiExtension: {
            contextFileName: 'context.md',
            mcpServers: {
              filesystem: {
                command: 'npx',
                args: ['-y', 'server'],
              },
            },
          },
        },
      };

      const highResult = geminiToClaudePlugin(highQualityPkg);
      expect(highResult.qualityScore).toBeGreaterThanOrEqual(80);

      // Low quality: no MCP servers, excludeTools
      const lowQualityPkg: CanonicalPackage = {
        id: 'low-quality',
        name: 'low-quality',
        version: '1.0.0',
        author: 'test',
        description: 'Low quality',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          geminiExtension: {
            excludeTools: ['tool1', 'tool2'],
            mcpServers: {},
          },
        },
      };

      const lowResult = geminiToClaudePlugin(lowQualityPkg);
      expect(lowResult.qualityScore).toBeLessThan(70);
    });

    it('should throw error if no Gemini extension metadata found', () => {
      const invalidPkg: CanonicalPackage = {
        id: 'invalid',
        name: 'invalid',
        version: '1.0.0',
        author: 'test',
        description: 'Invalid',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
      };

      expect(() => geminiToClaudePlugin(invalidPkg)).toThrow('No Gemini extension metadata found');
    });
  });

  describe('isGeminiExtension', () => {
    it('should identify Gemini extension', () => {
      const pkg: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'Test',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
      };

      expect(isGeminiExtension(pkg)).toBe(true);
    });

    it('should reject Gemini slash-command', () => {
      const pkg: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'Test',
        format: 'gemini',
        subtype: 'slash-command',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
      };

      expect(isGeminiExtension(pkg)).toBe(false);
    });

    it('should reject other formats', () => {
      const pkg: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'Test',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
      };

      expect(isGeminiExtension(pkg)).toBe(false);
    });
  });

  describe('shouldConvert', () => {
    it('should recommend conversion for extension with MCP servers', () => {
      const pkg: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'Test',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          geminiExtension: {
            mcpServers: {
              filesystem: {
                command: 'npx',
                args: ['-y', 'server'],
              },
            },
          },
        },
      };

      const result = shouldConvert(pkg);

      expect(result.recommended).toBe(true);
      expect(result.score).toBeGreaterThan(50);
      expect(result.reasons.some(r => r.includes('MCP server'))).toBe(true);
    });

    it('should not recommend conversion for non-Gemini package', () => {
      const pkg: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'Test',
        format: 'cursor',
        subtype: 'rule',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
      };

      const result = shouldConvert(pkg);

      expect(result.recommended).toBe(false);
      expect(result.score).toBe(0);
      expect(result.reasons[0]).toContain('not a Gemini extension');
    });

    it('should lower score for extensions with excludeTools', () => {
      const pkg: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'Test',
        format: 'gemini',
        subtype: 'extension',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          geminiExtension: {
            mcpServers: {
              fs: { command: 'npx' },
            },
            excludeTools: ['dangerous'],
          },
        },
      };

      const result = shouldConvert(pkg);

      expect(result.reasons.some(r => r.includes('tool exclusions'))).toBe(true);
    });
  });
});
