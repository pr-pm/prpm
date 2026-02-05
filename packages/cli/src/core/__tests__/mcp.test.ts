import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getMCPConfigPath,
  getCodexMCPConfigPath,
  getEditorMCPConfigPath,
  mergeMCPServers,
  mergeCodexMCPServers,
  mergeEditorMCPServers,
  removeMCPServers,
  removeCodexMCPServers,
  removeEditorMCPServers,
  readCodexConfig,
  writeCodexConfig,
  type MCPServer,
  type MCPEditor,
  MCP_EDITORS,
} from '../mcp.js';

describe('MCP utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'prpm-mcp-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('MCP_EDITORS', () => {
    it('includes claude and codex', () => {
      expect(MCP_EDITORS).toContain('claude');
      expect(MCP_EDITORS).toContain('codex');
    });
  });

  describe('getMCPConfigPath', () => {
    it('returns local path by default', () => {
      const path = getMCPConfigPath(false, tempDir);
      expect(path).toBe(join(tempDir, '.mcp.json'));
    });

    it('returns global path when global is true', () => {
      const path = getMCPConfigPath(true, tempDir);
      expect(path).toContain('.claude/settings.json');
    });
  });

  describe('getCodexMCPConfigPath', () => {
    it('returns local codex.toml by default', () => {
      const path = getCodexMCPConfigPath(false, tempDir);
      expect(path).toBe(join(tempDir, 'codex.toml'));
    });

    it('returns global path when global is true', () => {
      const path = getCodexMCPConfigPath(true, tempDir);
      expect(path).toContain('.codex/config.toml');
    });
  });

  describe('getEditorMCPConfigPath', () => {
    it('returns Claude path for claude editor', () => {
      const path = getEditorMCPConfigPath('claude', false, tempDir);
      expect(path).toBe(join(tempDir, '.mcp.json'));
    });

    it('returns Codex path for codex editor', () => {
      const path = getEditorMCPConfigPath('codex', false, tempDir);
      expect(path).toBe(join(tempDir, 'codex.toml'));
    });
  });

  describe('mergeMCPServers (Claude)', () => {
    it('creates new .mcp.json with servers', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': {
          command: 'npx',
          args: ['-y', '@test/mcp-server'],
          env: { API_KEY: '${API_KEY}' },
        },
      };

      const result = mergeMCPServers(servers, false, tempDir);

      expect(result.added).toContain('test-server');
      expect(result.skipped).toHaveLength(0);

      const configPath = join(tempDir, '.mcp.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.mcpServers['test-server']).toBeDefined();
      expect(config.mcpServers['test-server'].command).toBe('npx');
    });

    it('skips existing servers', async () => {
      // Create initial config
      const configPath = join(tempDir, '.mcp.json');
      await writeFile(configPath, JSON.stringify({
        mcpServers: {
          'existing-server': { command: 'existing' },
        },
      }));

      const servers: Record<string, MCPServer> = {
        'existing-server': { command: 'new' },
        'new-server': { command: 'new' },
      };

      const result = mergeMCPServers(servers, false, tempDir);

      expect(result.added).toContain('new-server');
      expect(result.skipped).toContain('existing-server');

      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Existing server should be unchanged
      expect(config.mcpServers['existing-server'].command).toBe('existing');
    });
  });

  describe('mergeCodexMCPServers', () => {
    it('creates new codex.toml with servers', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': {
          command: 'npx',
          args: ['-y', '@test/mcp-server'],
          env: { API_KEY: 'test-key' },
        },
      };

      const result = mergeCodexMCPServers(servers, false, tempDir);

      expect(result.added).toContain('test-server');
      expect(result.skipped).toHaveLength(0);

      const configPath = join(tempDir, 'codex.toml');
      const content = await readFile(configPath, 'utf-8');

      // Verify TOML format
      expect(content).toContain('[mcp_servers.test-server]');
      expect(content).toContain('command = "npx"');
    });

    it('handles HTTP servers', async () => {
      const servers: Record<string, MCPServer> = {
        'http-server': {
          url: 'https://example.com/mcp',
          bearer_token_env_var: 'API_TOKEN',
        },
      };

      const result = mergeCodexMCPServers(servers, false, tempDir);

      expect(result.added).toContain('http-server');

      const configPath = join(tempDir, 'codex.toml');
      const content = await readFile(configPath, 'utf-8');

      expect(content).toContain('url = "https://example.com/mcp"');
      expect(content).toContain('bearer_token_env_var = "API_TOKEN"');
    });

    it('skips existing servers in Codex config', async () => {
      // Create initial Codex config
      const configPath = join(tempDir, 'codex.toml');
      await writeFile(configPath, `[mcp_servers.existing-server]
command = "existing"
`);

      const servers: Record<string, MCPServer> = {
        'existing-server': { command: 'new' },
        'new-server': { command: 'new' },
      };

      const result = mergeCodexMCPServers(servers, false, tempDir);

      expect(result.added).toContain('new-server');
      expect(result.skipped).toContain('existing-server');
    });
  });

  describe('mergeEditorMCPServers', () => {
    it('routes to Claude for claude editor', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'test' },
      };

      const result = mergeEditorMCPServers(servers, 'claude', false, tempDir);

      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.mcp.json');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('mcpServers');
    });

    it('routes to Codex for codex editor', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'test' },
      };

      const result = mergeEditorMCPServers(servers, 'codex', false, tempDir);

      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, 'codex.toml');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('mcp_servers');
    });
  });

  describe('removeMCPServers', () => {
    it('removes unchanged servers', async () => {
      const server: MCPServer = { command: 'test', args: ['arg1'] };

      // First install
      mergeMCPServers({ 'test-server': server }, false, tempDir);

      // Then remove
      const result = removeMCPServers({ 'test-server': server }, false, tempDir);

      expect(result.removed).toContain('test-server');

      const configPath = join(tempDir, '.mcp.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.mcpServers).toBeUndefined();
    });

    it('keeps modified servers', async () => {
      const original: MCPServer = { command: 'test' };
      const modified: MCPServer = { command: 'modified' };

      // Create config with modified server
      const configPath = join(tempDir, '.mcp.json');
      await writeFile(configPath, JSON.stringify({
        mcpServers: { 'test-server': modified },
      }));

      // Try to remove with original config
      const result = removeMCPServers({ 'test-server': original }, false, tempDir);

      expect(result.kept).toContain('test-server');
      expect(result.removed).toHaveLength(0);
    });
  });

  describe('removeCodexMCPServers', () => {
    it('removes unchanged servers from Codex config', async () => {
      const server: MCPServer = { command: 'test', args: ['arg1'] };

      // First install
      mergeCodexMCPServers({ 'test-server': server }, false, tempDir);

      // Then remove
      const result = removeCodexMCPServers({ 'test-server': server }, false, tempDir);

      expect(result.removed).toContain('test-server');

      const configPath = join(tempDir, 'codex.toml');
      const content = await readFile(configPath, 'utf-8');

      // Should not contain the server anymore
      expect(content).not.toContain('test-server');
    });
  });

  describe('removeEditorMCPServers', () => {
    it('routes to correct editor for removal', async () => {
      const server: MCPServer = { command: 'test' };

      // Install for Codex
      mergeEditorMCPServers({ 'test-server': server }, 'codex', false, tempDir);

      // Remove for Codex
      const result = removeEditorMCPServers({ 'test-server': server }, 'codex', false, tempDir);

      expect(result.removed).toContain('test-server');
    });
  });

  describe('readCodexConfig / writeCodexConfig', () => {
    it('handles empty/missing config', () => {
      const config = readCodexConfig(join(tempDir, 'nonexistent.toml'));
      expect(config.mcp_servers).toEqual({});
    });

    it('reads existing TOML config', async () => {
      const configPath = join(tempDir, 'config.toml');
      await writeFile(configPath, `[mcp_servers.test]
command = "test"
args = ["a", "b"]
`);

      const config = readCodexConfig(configPath);

      expect(config.mcp_servers).toBeDefined();
      expect(config.mcp_servers?.test).toBeDefined();
    });

    it('writes valid TOML config', async () => {
      const configPath = join(tempDir, 'config.toml');
      const config = {
        mcp_servers: {
          test: {
            command: 'test',
            args: ['a', 'b'],
          },
        },
      };

      writeCodexConfig(configPath, config);

      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('[mcp_servers.test]');
      expect(content).toContain('command = "test"');
    });
  });
});
