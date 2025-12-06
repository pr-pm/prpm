/**
 * Tests for MCP Transformer
 */

import { describe, it, expect } from 'vitest';
import {
  geminiToClaudeMCP,
  claudeToGeminiMCP,
  validateMCPServer,
  mergeMCPServers,
  type GeminiMCPServers,
  type ClaudeMCPServers,
  type MCPServerConfig,
} from '../../cross-converters/mcp-transformer.js';

describe('MCP Transformer', () => {
  describe('geminiToClaudeMCP', () => {
    it('should transform basic MCP server config', () => {
      const gemini: GeminiMCPServers = {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        },
      };

      const result = geminiToClaudeMCP(gemini);

      expect(result.servers.filesystem).toEqual({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      });
      expect(result.warnings).toHaveLength(0);
      expect(result.lossless).toBe(true);
    });

    it('should preserve environment variables', () => {
      const gemini: GeminiMCPServers = {
        github: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_TOKEN: 'ghp_xxx',
          },
        },
      };

      const result = geminiToClaudeMCP(gemini);

      expect(result.servers.github.env).toEqual({
        GITHUB_TOKEN: 'ghp_xxx',
      });
      expect(result.lossless).toBe(true);
    });

    it('should warn about Gemini-specific variable substitution', () => {
      const gemini: GeminiMCPServers = {
        custom: {
          command: 'node',
          args: ['${extensionPath}/server.js'],
          env: {
            HOME: '${home}',
          },
        },
      };

      const result = geminiToClaudeMCP(gemini);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Gemini variable substitutions');
      expect(result.lossless).toBe(false);
    });

    it('should preserve disabled flag', () => {
      const gemini: GeminiMCPServers = {
        old_server: {
          command: 'old-command',
          disabled: true,
        },
      };

      const result = geminiToClaudeMCP(gemini);

      expect(result.servers.old_server.disabled).toBe(true);
    });

    it('should handle multiple servers', () => {
      const gemini: GeminiMCPServers = {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
        },
        github: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
        },
        slack: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-slack'],
        },
      };

      const result = geminiToClaudeMCP(gemini);

      expect(Object.keys(result.servers)).toHaveLength(3);
      expect(result.servers.filesystem).toBeDefined();
      expect(result.servers.github).toBeDefined();
      expect(result.servers.slack).toBeDefined();
    });
  });

  describe('claudeToGeminiMCP', () => {
    it('should transform basic MCP server config', () => {
      const claude: ClaudeMCPServers = {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        },
      };

      const result = claudeToGeminiMCP(claude);

      expect(result.servers.filesystem).toEqual({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      });
      expect(result.warnings).toHaveLength(0);
      expect(result.lossless).toBe(true);
    });

    it('should preserve environment variables', () => {
      const claude: ClaudeMCPServers = {
        postgres: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-postgres'],
          env: {
            DATABASE_URL: 'postgresql://localhost/mydb',
          },
        },
      };

      const result = claudeToGeminiMCP(claude);

      expect(result.servers.postgres.env).toEqual({
        DATABASE_URL: 'postgresql://localhost/mydb',
      });
      expect(result.lossless).toBe(true);
    });

    it('should warn about Claude-specific patterns', () => {
      const claude: ClaudeMCPServers = {
        custom: {
          command: 'node',
          env: {
            CONFIG_PATH: '${CLAUDE_CONFIG}/settings.json',
            DATA_DIR: '%APPDATA%/claude',
          },
        },
      };

      const result = claudeToGeminiMCP(claude);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Claude-specific patterns');
      expect(result.lossless).toBe(false);
    });

    it('should preserve disabled flag', () => {
      const claude: ClaudeMCPServers = {
        deprecated: {
          command: 'old-server',
          disabled: true,
        },
      };

      const result = claudeToGeminiMCP(claude);

      expect(result.servers.deprecated.disabled).toBe(true);
    });

    it('should handle empty servers object', () => {
      const claude: ClaudeMCPServers = {};

      const result = claudeToGeminiMCP(claude);

      expect(result.servers).toEqual({});
      expect(result.warnings).toHaveLength(0);
      expect(result.lossless).toBe(true);
    });
  });

  describe('validateMCPServer', () => {
    it('should validate correct config', () => {
      const config: MCPServerConfig = {
        command: 'npx',
        args: ['-y', 'server'],
        env: { KEY: 'value' },
      };

      const errors = validateMCPServer(config);

      expect(errors).toHaveLength(0);
    });

    it('should require command', () => {
      const config = {
        args: ['test'],
      } as MCPServerConfig;

      const errors = validateMCPServer(config);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('must have a command');
    });

    it('should validate args is array', () => {
      const config = {
        command: 'test',
        args: 'not-an-array',
      } as any;

      const errors = validateMCPServer(config);

      expect(errors).toContain('MCP server args must be an array');
    });

    it('should validate env is object', () => {
      const config = {
        command: 'test',
        env: 'not-an-object',
      } as any;

      const errors = validateMCPServer(config);

      expect(errors).toContain('MCP server env must be an object');
    });

    it('should validate disabled is boolean', () => {
      const config = {
        command: 'test',
        disabled: 'yes',
      } as any;

      const errors = validateMCPServer(config);

      expect(errors).toContain('MCP server disabled must be a boolean');
    });

    it('should allow minimal config', () => {
      const config: MCPServerConfig = {
        command: 'test',
      };

      const errors = validateMCPServer(config);

      expect(errors).toHaveLength(0);
    });
  });

  describe('mergeMCPServers', () => {
    it('should merge multiple server configs', () => {
      const servers1: GeminiMCPServers = {
        filesystem: {
          command: 'npx',
          args: ['-y', 'fs-server'],
        },
      };

      const servers2: GeminiMCPServers = {
        github: {
          command: 'npx',
          args: ['-y', 'github-server'],
        },
      };

      const result = mergeMCPServers(servers1, servers2);

      expect(Object.keys(result.servers)).toHaveLength(2);
      expect(result.servers.filesystem).toBeDefined();
      expect(result.servers.github).toBeDefined();
      expect(result.lossless).toBe(true);
    });

    it('should warn about duplicate server names', () => {
      const servers1: GeminiMCPServers = {
        filesystem: {
          command: 'old-command',
        },
      };

      const servers2: GeminiMCPServers = {
        filesystem: {
          command: 'new-command',
        },
      };

      const result = mergeMCPServers(servers1, servers2);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('defined multiple times');
      expect(result.servers.filesystem.command).toBe('new-command');
      expect(result.lossless).toBe(false);
    });

    it('should handle empty merge', () => {
      const result = mergeMCPServers();

      expect(result.servers).toEqual({});
      expect(result.warnings).toHaveLength(0);
      expect(result.lossless).toBe(true);
    });

    it('should preserve all properties when merging', () => {
      const servers1: GeminiMCPServers = {
        server1: {
          command: 'cmd1',
          args: ['arg1'],
          env: { KEY1: 'val1' },
          disabled: false,
        },
      };

      const servers2: GeminiMCPServers = {
        server2: {
          command: 'cmd2',
          args: ['arg2'],
          env: { KEY2: 'val2' },
          disabled: true,
        },
      };

      const result = mergeMCPServers(servers1, servers2);

      expect(result.servers.server1).toEqual(servers1.server1);
      expect(result.servers.server2).toEqual(servers2.server2);
    });
  });

  describe('roundtrip conversions', () => {
    it('should be lossless for basic configs', () => {
      const original: GeminiMCPServers = {
        filesystem: {
          command: 'npx',
          args: ['-y', 'server'],
          env: { PATH: '/usr/bin' },
        },
      };

      const toClaude = geminiToClaudeMCP(original);
      const backToGemini = claudeToGeminiMCP(toClaude.servers);

      expect(backToGemini.servers).toEqual(original);
      expect(toClaude.lossless).toBe(true);
      expect(backToGemini.lossless).toBe(true);
    });

    it('should detect lossy conversion with variables', () => {
      const original: GeminiMCPServers = {
        custom: {
          command: 'node',
          env: { CONFIG: '${extensionPath}/config.json' },
        },
      };

      const toClaude = geminiToClaudeMCP(original);

      expect(toClaude.lossless).toBe(false);
      expect(toClaude.warnings.length).toBeGreaterThan(0);
    });
  });
});
