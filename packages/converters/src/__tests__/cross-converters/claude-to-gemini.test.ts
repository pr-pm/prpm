/**
 * Tests for Claude → Gemini converter
 */

import { describe, it, expect } from 'vitest';
import {
  claudeToGeminiExtension,
  isClaudePlugin,
  shouldConvert,
  type ConversionResult,
} from '../../cross-converters/claude-to-gemini.js';
import type { CanonicalPackage } from '../../types/canonical.js';

describe('Claude to Gemini Converter', () => {
  describe('claudeToGeminiExtension', () => {
    it('should convert basic Claude plugin to Gemini extension', () => {
      const claudePkg: CanonicalPackage = {
        id: 'test-plugin',
        name: 'test-plugin',
        version: '1.0.0',
        author: 'test-author',
        description: 'Test plugin',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'test-plugin',
                description: 'Test plugin',
                claudePlugin: {
                  name: 'test-plugin',
                  version: '1.0.0',
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
          claudePlugin: {
            name: 'test-plugin',
            version: '1.0.0',
            mcpServers: {
              filesystem: {
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-filesystem'],
              },
            },
          },
        },
      };

      const result = claudeToGeminiExtension(claudePkg);

      expect(result.geminiPackage.format).toBe('gemini');
      expect(result.geminiPackage.subtype).toBe('extension');
      expect(result.geminiPackage.name).toBe('test-plugin');
      expect(result.geminiPackage.version).toBe('1.0.0');
      expect(result.warnings).toHaveLength(1); // No instructions warning
    });

    it('should transform MCP servers correctly', () => {
      const claudePkg: CanonicalPackage = {
        id: 'mcp-test',
        name: 'mcp-test',
        version: '1.0.0',
        author: 'test',
        description: 'MCP test',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          claudePlugin: {
            name: 'mcp-test',
            version: '1.0.0',
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

      const result = claudeToGeminiExtension(claudePkg);

      const geminiExt = result.geminiPackage.metadata?.geminiExtension;
      expect(geminiExt?.mcpServers).toBeDefined();
      expect(geminiExt?.mcpServers?.github).toBeDefined();
      expect(geminiExt?.mcpServers?.postgres).toBeDefined();
      expect(geminiExt?.mcpServers?.github.env?.GITHUB_TOKEN).toBe('ghp_xxx');
    });

    it('should convert instructions to context file', () => {
      const claudePkg: CanonicalPackage = {
        id: 'instructions-test',
        name: 'instructions-test',
        version: '1.0.0',
        author: 'test',
        description: 'Instructions test',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          claudePlugin: {
            name: 'instructions-test',
            version: '1.0.0',
            instructions: 'This is the plugin instructions.',
            mcpServers: {},
          },
        },
      };

      const result = claudeToGeminiExtension(claudePkg);

      const geminiExt = result.geminiPackage.metadata?.geminiExtension;
      expect(geminiExt?.contextFileName).toBe('context.md');

      // Should have context section
      const contextSection = result.geminiPackage.content.sections.find(
        s => s.type === 'context'
      );
      expect(contextSection).toBeDefined();
      expect(contextSection?.content).toBe('This is the plugin instructions.');
    });

    it('should preserve original contextFileName from metadata', () => {
      const claudePkg: CanonicalPackage = {
        id: 'preserved-context',
        name: 'preserved-context',
        version: '1.0.0',
        author: 'test',
        description: 'Preserved context',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          claudePlugin: {
            name: 'preserved-context',
            version: '1.0.0',
            instructions: 'Plugin instructions',
            mcpServers: {},
            _geminiMetadata: {
              contextFileName: 'custom-context.md',
            },
          },
        },
      };

      const result = claudeToGeminiExtension(claudePkg);

      const geminiExt = result.geminiPackage.metadata?.geminiExtension;
      expect(geminiExt?.contextFileName).toBe('custom-context.md');
      expect(result.warnings.some(w => w.includes('not preserved'))).toBe(false);
    });

    it('should restore excludeTools from metadata', () => {
      const claudePkg: CanonicalPackage = {
        id: 'exclude-test',
        name: 'exclude-test',
        version: '1.0.0',
        author: 'test',
        description: 'Exclude test',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          claudePlugin: {
            name: 'exclude-test',
            version: '1.0.0',
            mcpServers: {},
            _geminiMetadata: {
              excludeTools: ['dangerous-tool', 'deprecated-tool'],
            },
          },
        },
      };

      const result = claudeToGeminiExtension(claudePkg);

      const geminiExt = result.geminiPackage.metadata?.geminiExtension;
      expect(geminiExt?.excludeTools).toEqual(['dangerous-tool', 'deprecated-tool']);
      expect(result.warnings.some(w => w.includes('Restored tool exclusions'))).toBe(true);
    });

    it('should restore experimental settings from metadata', () => {
      const claudePkg: CanonicalPackage = {
        id: 'experimental-test',
        name: 'experimental-test',
        version: '1.0.0',
        author: 'test',
        description: 'Experimental test',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          claudePlugin: {
            name: 'experimental-test',
            version: '1.0.0',
            mcpServers: {},
            _geminiMetadata: {
              experimentalSettings: {
                betaFeature: true,
                customSetting: 'value',
              },
            },
          },
        },
      };

      const result = claudeToGeminiExtension(claudePkg);

      const geminiExt = result.geminiPackage.metadata?.geminiExtension;
      expect(geminiExt?.experimentalSettings).toEqual({
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
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          claudePlugin: {
            name: 'high-quality',
            version: '1.0.0',
            instructions: 'Good instructions here',
            mcpServers: {
              filesystem: {
                command: 'npx',
                args: ['-y', 'server'],
              },
            },
          },
        },
      };

      const highResult = claudeToGeminiExtension(highQualityPkg);
      expect(highResult.qualityScore).toBeGreaterThanOrEqual(80);

      // Low quality: no MCP servers, no instructions
      const lowQualityPkg: CanonicalPackage = {
        id: 'low-quality',
        name: 'low-quality',
        version: '1.0.0',
        author: 'test',
        description: 'Low quality',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          claudePlugin: {
            name: 'low-quality',
            version: '1.0.0',
            mcpServers: {},
          },
        },
      };

      const lowResult = claudeToGeminiExtension(lowQualityPkg);
      expect(lowResult.qualityScore).toBeLessThanOrEqual(70);
    });

    it('should warn about missing context filename in lossy conversion', () => {
      const claudePkg: CanonicalPackage = {
        id: 'lossy-test',
        name: 'lossy-test',
        version: '1.0.0',
        author: 'test',
        description: 'Lossy test',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          claudePlugin: {
            name: 'lossy-test',
            version: '1.0.0',
            instructions: 'Some instructions',
            mcpServers: {},
          },
        },
      };

      const result = claudeToGeminiExtension(claudePkg);

      expect(result.lossyConversion).toBe(true);
      expect(result.warnings.some(w => w.includes('context.md'))).toBe(true);
      expect(result.qualityScore).toBeLessThan(100);
    });

    it('should throw error if no Claude plugin metadata found', () => {
      const invalidPkg: CanonicalPackage = {
        id: 'invalid',
        name: 'invalid',
        version: '1.0.0',
        author: 'test',
        description: 'Invalid',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
      };

      expect(() => claudeToGeminiExtension(invalidPkg)).toThrow('No Claude plugin metadata found');
    });
  });

  describe('isClaudePlugin', () => {
    it('should identify Claude plugin', () => {
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

      expect(isClaudePlugin(pkg)).toBe(true);
    });

    it('should reject Claude agent', () => {
      const pkg: CanonicalPackage = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        author: 'test',
        description: 'Test',
        format: 'claude',
        subtype: 'agent',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
      };

      expect(isClaudePlugin(pkg)).toBe(false);
    });

    it('should reject other formats', () => {
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

      expect(isClaudePlugin(pkg)).toBe(false);
    });
  });

  describe('shouldConvert', () => {
    it('should recommend conversion for plugin with MCP servers', () => {
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
        metadata: {
          claudePlugin: {
            name: 'test',
            version: '1.0.0',
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

    it('should not recommend conversion for non-Claude package', () => {
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
      expect(result.reasons[0]).toContain('not a Claude plugin');
    });

    it('should give high score for plugins with preserved Gemini metadata', () => {
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
        metadata: {
          claudePlugin: {
            name: 'test',
            version: '1.0.0',
            mcpServers: {
              fs: { command: 'npx' },
            },
            instructions: 'Some instructions',
            _geminiMetadata: {
              contextFileName: 'context.md',
              excludeTools: ['dangerous'],
            },
          },
        },
      };

      const result = shouldConvert(pkg);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.reasons.some(r => r.includes('Gemini metadata'))).toBe(true);
      expect(result.reasons.some(r => r.includes('roundtrip'))).toBe(true);
    });

    it('should increase score for plugins with instructions', () => {
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
        metadata: {
          claudePlugin: {
            name: 'test',
            version: '1.0.0',
            instructions: 'Plugin instructions',
            mcpServers: {},
          },
        },
      };

      const result = shouldConvert(pkg);

      expect(result.reasons.some(r => r.includes('instructions'))).toBe(true);
      expect(result.reasons.some(r => r.includes('context file'))).toBe(true);
    });
  });

  describe('roundtrip conversions', () => {
    it('should preserve metadata through roundtrip conversion', () => {
      const original: CanonicalPackage = {
        id: 'roundtrip-test',
        name: 'roundtrip-test',
        version: '1.0.0',
        author: 'test',
        description: 'Roundtrip test',
        format: 'claude',
        subtype: 'plugin',
        tags: [],
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [],
        },
        metadata: {
          claudePlugin: {
            name: 'roundtrip-test',
            version: '1.0.0',
            mcpServers: {
              filesystem: {
                command: 'npx',
                args: ['-y', 'server'],
              },
            },
            instructions: 'Test instructions',
            _geminiMetadata: {
              contextFileName: 'my-context.md',
              excludeTools: ['tool1', 'tool2'],
              experimentalSettings: {
                feature: true,
              },
            },
          },
        },
      };

      const toGemini = claudeToGeminiExtension(original);
      const geminiExt = toGemini.geminiPackage.metadata?.geminiExtension;

      expect(geminiExt?.contextFileName).toBe('my-context.md');
      expect(geminiExt?.excludeTools).toEqual(['tool1', 'tool2']);
      expect(geminiExt?.experimentalSettings).toEqual({ feature: true });
      expect(toGemini.lossyConversion).toBe(false);
    });
  });
});
