/**
 * Tests for MCP Transformer
 */

import { describe, it, expect } from 'vitest';
import {
  geminiToClaudeMCP,
  claudeToGeminiMCP,
  kiroToClaudeMCP,
  claudeToKiroMCP,
  kiroToGeminiMCP,
  geminiToKiroMCP,
  validateMCPServer,
  mergeMCPServers,
  translateEnvVar,
  translateMCPServerEnv,
  type GeminiMCPServers,
  type ClaudeMCPServers,
  type KiroMCPServers,
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

  describe('kiroToClaudeMCP', () => {
    it('should transform basic Kiro MCP server config', () => {
      const kiro: KiroMCPServers = {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
        },
      };

      const result = kiroToClaudeMCP(kiro);

      expect(result.servers.filesystem).toEqual({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
      });
      expect(result.warnings).toHaveLength(0);
      expect(result.lossless).toBe(true);
    });

    it('should warn about timeout field loss', () => {
      const kiro: KiroMCPServers = {
        slowServer: {
          command: 'python',
          args: ['server.py'],
          timeout: 10000,
        },
      };

      const result = kiroToClaudeMCP(kiro);

      expect(result.servers.slowServer.timeout).toBeUndefined();
      expect(result.lossless).toBe(false);
      expect(result.warnings).toContain(
        `MCP server 'slowServer' has timeout=10000ms which is not supported in Claude format. This field will be lost.`
      );
    });

    it('should preserve env and disabled fields', () => {
      const kiro: KiroMCPServers = {
        server: {
          command: 'node',
          args: ['index.js'],
          env: { API_KEY: 'secret' },
          disabled: true,
        },
      };

      const result = kiroToClaudeMCP(kiro);

      expect(result.servers.server.env).toEqual({ API_KEY: 'secret' });
      expect(result.servers.server.disabled).toBe(true);
      expect(result.lossless).toBe(true);
    });
  });

  describe('claudeToKiroMCP', () => {
    it('should transform Claude MCP config to Kiro', () => {
      const claude: ClaudeMCPServers = {
        github: {
          command: 'npx',
          args: ['-y', '@anthropic/mcp-server-github'],
          env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
        },
      };

      const result = claudeToKiroMCP(claude);

      expect(result.servers.github).toEqual({
        command: 'npx',
        args: ['-y', '@anthropic/mcp-server-github'],
        env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
      });
      expect(result.lossless).toBe(true);
    });
  });

  describe('kiroToGeminiMCP', () => {
    it('should transform Kiro to Gemini with timeout warning', () => {
      const kiro: KiroMCPServers = {
        server: {
          command: 'deno',
          args: ['run', 'server.ts'],
          timeout: 5000,
        },
      };

      const result = kiroToGeminiMCP(kiro);

      expect(result.servers.server.timeout).toBeUndefined();
      expect(result.lossless).toBe(false);
      expect(result.warnings).toContain(
        `MCP server 'server' has timeout=5000ms which is not supported in Gemini format. This field will be lost.`
      );
    });
  });

  describe('geminiToKiroMCP', () => {
    it('should transform Gemini to Kiro', () => {
      const gemini: GeminiMCPServers = {
        postgres: {
          command: 'uvx',
          args: ['mcp-server-postgres'],
          env: { DATABASE_URL: 'postgresql://localhost/db' },
        },
      };

      const result = geminiToKiroMCP(gemini);

      expect(result.servers.postgres).toEqual({
        command: 'uvx',
        args: ['mcp-server-postgres'],
        env: { DATABASE_URL: 'postgresql://localhost/db' },
      });
      expect(result.lossless).toBe(true);
    });

    it('should warn about Gemini-specific variable substitutions', () => {
      const gemini: GeminiMCPServers = {
        customServer: {
          command: 'node',
          args: ['${extensionPath}/server.js'],
          env: { HOME: '${home}' },
        },
      };

      const result = geminiToKiroMCP(gemini);

      expect(result.lossless).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Gemini variable substitutions');
    });
  });

  describe('translateEnvVar', () => {
    it('should translate Gemini to Claude variables', () => {
      const result = translateEnvVar('${extensionPath}/config.json', 'gemini-to-claude');

      expect(result.value).toBe('${CLAUDE_EXTENSIONS_PATH}/config.json');
      expect(result.translated).toBe(true);
    });

    it('should translate Claude to Gemini variables', () => {
      const result = translateEnvVar('${HOME}/.config', 'claude-to-gemini');

      expect(result.value).toBe('${home}/.config');
      expect(result.translated).toBe(true);
    });

    it('should handle Windows-style paths', () => {
      const result = translateEnvVar('%APPDATA%/data', 'claude-to-gemini');

      expect(result.value).toBe('${home}/data');
      expect(result.translated).toBe(true);
    });

    it('should not translate when no matching variables', () => {
      const result = translateEnvVar('/absolute/path', 'gemini-to-claude');

      expect(result.value).toBe('/absolute/path');
      expect(result.translated).toBe(false);
    });
  });

  describe('translateMCPServerEnv', () => {
    it('should translate all env vars in config', () => {
      const config: MCPServerConfig = {
        command: 'node',
        env: {
          PATH1: '${extensionPath}/bin',
          PATH2: '${home}/.local',
          API_KEY: 'secret',
        },
      };

      const result = translateMCPServerEnv(config, 'gemini-to-claude');

      expect(result.config.env).toEqual({
        PATH1: '${CLAUDE_EXTENSIONS_PATH}/bin',
        PATH2: '${HOME}/.local',
        API_KEY: 'secret',
      });
      expect(result.warnings).toContain('Environment variables were automatically translated for target format');
    });

    it('should handle missing env gracefully', () => {
      const config: MCPServerConfig = {
        command: 'node',
      };

      const result = translateMCPServerEnv(config, 'gemini-to-claude');

      expect(result.config).toEqual(config);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
