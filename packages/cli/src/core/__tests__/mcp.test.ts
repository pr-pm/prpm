import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getMCPConfigPath,
  getCodexMCPConfigPath,
  getCursorMCPConfigPath,
  getWindsurfMCPConfigPath,
  getVSCodeMCPConfigPath,
  getGeminiMCPConfigPath,
  getOpenCodeMCPConfigPath,
  getKiroMCPConfigPath,
  getTraeMCPConfigPath,
  getAmpMCPConfigPath,
  getZedMCPConfigPath,
  getEditorMCPConfigPath,
  mergeMCPServers,
  mergeCodexMCPServers,
  mergeCursorMCPServers,
  mergeVSCodeMCPServers,
  mergeOpenCodeMCPServers,
  mergeKiroMCPServers,
  mergeTraeMCPServers,
  mergeAmpMCPServers,
  mergeZedMCPServers,
  mergeEditorMCPServers,
  removeMCPServers,
  removeCodexMCPServers,
  removeCursorMCPServers,
  removeVSCodeMCPServers,
  removeOpenCodeMCPServers,
  removeKiroMCPServers,
  removeTraeMCPServers,
  removeAmpMCPServers,
  removeZedMCPServers,
  removeEditorMCPServers,
  readCodexConfig,
  writeCodexConfig,
  readZedConfig,
  writeZedConfig,
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
    it('includes all supported editors', () => {
      expect(MCP_EDITORS).toContain('claude');
      expect(MCP_EDITORS).toContain('codex');
      expect(MCP_EDITORS).toContain('cursor');
      expect(MCP_EDITORS).toContain('windsurf');
      expect(MCP_EDITORS).toContain('vscode');
      expect(MCP_EDITORS).toContain('gemini');
      expect(MCP_EDITORS).toContain('opencode');
      expect(MCP_EDITORS).toContain('kiro');
      expect(MCP_EDITORS).toContain('trae');
      expect(MCP_EDITORS).toContain('amp');
      expect(MCP_EDITORS).toContain('zed');
      expect(MCP_EDITORS).toHaveLength(11);
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

  describe('getCursorMCPConfigPath', () => {
    it('returns local .cursor/mcp.json by default', () => {
      const path = getCursorMCPConfigPath(false, tempDir);
      expect(path).toBe(join(tempDir, '.cursor', 'mcp.json'));
    });

    it('returns global path when global is true', () => {
      const path = getCursorMCPConfigPath(true, tempDir);
      expect(path).toContain('.cursor/mcp.json');
    });
  });

  describe('getWindsurfMCPConfigPath', () => {
    it('always returns global path', () => {
      const path = getWindsurfMCPConfigPath();
      expect(path).toContain('.codeium/windsurf/mcp_config.json');
    });
  });

  describe('getVSCodeMCPConfigPath', () => {
    it('returns local .vscode/mcp.json by default', () => {
      const path = getVSCodeMCPConfigPath(false, tempDir);
      expect(path).toBe(join(tempDir, '.vscode', 'mcp.json'));
    });

    it('returns global path when global is true', () => {
      const path = getVSCodeMCPConfigPath(true, tempDir);
      expect(path).toContain('mcp.json');
    });
  });

  describe('getGeminiMCPConfigPath', () => {
    it('returns local .gemini/settings.json by default', () => {
      const path = getGeminiMCPConfigPath(false, tempDir);
      expect(path).toBe(join(tempDir, '.gemini', 'settings.json'));
    });

    it('returns global path when global is true', () => {
      const path = getGeminiMCPConfigPath(true, tempDir);
      expect(path).toContain('.gemini/settings.json');
    });
  });

  describe('getOpenCodeMCPConfigPath', () => {
    it('returns local opencode.json by default', () => {
      const path = getOpenCodeMCPConfigPath(false, tempDir);
      expect(path).toBe(join(tempDir, 'opencode.json'));
    });

    it('returns global path when global is true', () => {
      const path = getOpenCodeMCPConfigPath(true, tempDir);
      expect(path).toContain('.config/opencode/opencode.json');
    });
  });

  describe('getKiroMCPConfigPath', () => {
    it('returns local .kiro/settings/mcp.json by default', () => {
      const path = getKiroMCPConfigPath(false, tempDir);
      expect(path).toBe(join(tempDir, '.kiro', 'settings', 'mcp.json'));
    });

    it('returns global path when global is true', () => {
      const path = getKiroMCPConfigPath(true, tempDir);
      expect(path).toContain('.kiro/settings/mcp.json');
    });
  });

  describe('getTraeMCPConfigPath', () => {
    it('returns local .trae/mcp.json', () => {
      const path = getTraeMCPConfigPath(tempDir);
      expect(path).toBe(join(tempDir, '.trae', 'mcp.json'));
    });
  });

  describe('getAmpMCPConfigPath', () => {
    it('returns local .amp/settings.json by default', () => {
      const path = getAmpMCPConfigPath(false, tempDir);
      expect(path).toBe(join(tempDir, '.amp', 'settings.json'));
    });

    it('returns global path when global is true', () => {
      const path = getAmpMCPConfigPath(true, tempDir);
      expect(path).toContain('.amp/settings.json');
    });
  });

  describe('getZedMCPConfigPath', () => {
    it('returns global settings.json path', () => {
      const path = getZedMCPConfigPath();
      expect(path).toContain('zed/settings.json');
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

    it('returns Cursor path for cursor editor', () => {
      const path = getEditorMCPConfigPath('cursor', false, tempDir);
      expect(path).toBe(join(tempDir, '.cursor', 'mcp.json'));
    });

    it('returns Windsurf path for windsurf editor', () => {
      const path = getEditorMCPConfigPath('windsurf', false, tempDir);
      expect(path).toContain('.codeium/windsurf/mcp_config.json');
    });

    it('returns VS Code path for vscode editor', () => {
      const path = getEditorMCPConfigPath('vscode', false, tempDir);
      expect(path).toBe(join(tempDir, '.vscode', 'mcp.json'));
    });

    it('returns Gemini path for gemini editor', () => {
      const path = getEditorMCPConfigPath('gemini', false, tempDir);
      expect(path).toBe(join(tempDir, '.gemini', 'settings.json'));
    });

    it('returns OpenCode path for opencode editor', () => {
      const path = getEditorMCPConfigPath('opencode', false, tempDir);
      expect(path).toBe(join(tempDir, 'opencode.json'));
    });

    it('returns Kiro path for kiro editor', () => {
      const path = getEditorMCPConfigPath('kiro', false, tempDir);
      expect(path).toBe(join(tempDir, '.kiro', 'settings', 'mcp.json'));
    });

    it('returns Trae path for trae editor', () => {
      const path = getEditorMCPConfigPath('trae', false, tempDir);
      expect(path).toBe(join(tempDir, '.trae', 'mcp.json'));
    });

    it('returns Amp path for amp editor', () => {
      const path = getEditorMCPConfigPath('amp', false, tempDir);
      expect(path).toBe(join(tempDir, '.amp', 'settings.json'));
    });

    it('returns Zed path for zed editor', () => {
      const path = getEditorMCPConfigPath('zed', false, tempDir);
      expect(path).toContain('zed/settings.json');
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

  describe('mergeCursorMCPServers', () => {
    it('creates .cursor/mcp.json with servers', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'npx', args: ['-y', '@test/mcp-server'] },
      };

      const result = mergeCursorMCPServers(servers, false, tempDir);

      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.cursor', 'mcp.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.mcpServers['test-server']).toBeDefined();
      expect(config.mcpServers['test-server'].command).toBe('npx');
    });

    it('skips existing servers', async () => {
      const configPath = join(tempDir, '.cursor', 'mcp.json');
      await mkdir(join(tempDir, '.cursor'), { recursive: true });
      await writeFile(configPath, JSON.stringify({
        mcpServers: { 'existing': { command: 'existing' } },
      }));

      const result = mergeCursorMCPServers({ 'existing': { command: 'new' } }, false, tempDir);

      expect(result.skipped).toContain('existing');
    });
  });

  describe('removeCursorMCPServers', () => {
    it('removes unchanged servers from Cursor config', async () => {
      const server: MCPServer = { command: 'test', args: ['arg1'] };

      mergeCursorMCPServers({ 'test-server': server }, false, tempDir);
      const result = removeCursorMCPServers({ 'test-server': server }, false, tempDir);

      expect(result.removed).toContain('test-server');
    });
  });

  describe('mergeVSCodeMCPServers', () => {
    it('creates .vscode/mcp.json with servers key', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'npx', args: ['-y', '@test/mcp-server'] },
      };

      const result = mergeVSCodeMCPServers(servers, false, tempDir);

      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.vscode', 'mcp.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // VS Code uses "servers" key, not "mcpServers"
      expect(config.servers).toBeDefined();
      expect(config.mcpServers).toBeUndefined();
      expect(config.servers['test-server'].type).toBe('stdio');
    });

    it('auto-detects type as http for url-based servers', async () => {
      const servers: Record<string, MCPServer> = {
        'http-server': { url: 'https://example.com/mcp' },
      };

      const result = mergeVSCodeMCPServers(servers, false, tempDir);
      expect(result.added).toContain('http-server');

      const configPath = join(tempDir, '.vscode', 'mcp.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config.servers['http-server'].type).toBe('http');
    });

    it('preserves existing inputs section', async () => {
      const configPath = join(tempDir, '.vscode', 'mcp.json');
      await mkdir(join(tempDir, '.vscode'), { recursive: true });
      await writeFile(configPath, JSON.stringify({
        inputs: [{ type: 'promptString', id: 'api-key', description: 'API Key' }],
        servers: {},
      }));

      mergeVSCodeMCPServers({ 'test-server': { command: 'test' } }, false, tempDir);

      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      expect(config.inputs).toHaveLength(1);
      expect(config.servers['test-server']).toBeDefined();
    });
  });

  describe('removeVSCodeMCPServers', () => {
    it('removes unchanged servers from VS Code config', async () => {
      const server: MCPServer = { command: 'test', args: ['arg1'] };

      mergeVSCodeMCPServers({ 'test-server': server }, false, tempDir);
      const result = removeVSCodeMCPServers({ 'test-server': server }, false, tempDir);

      expect(result.removed).toContain('test-server');
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

    it('routes to Cursor for cursor editor', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'test' },
      };

      const result = mergeEditorMCPServers(servers, 'cursor', false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.cursor', 'mcp.json');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('mcpServers');
    });

    it('routes to VS Code for vscode editor', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'test' },
      };

      const result = mergeEditorMCPServers(servers, 'vscode', false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.vscode', 'mcp.json');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('"servers"');
      expect(content).not.toContain('"mcpServers"');
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

  describe('mergeOpenCodeMCPServers', () => {
    it('creates opencode.json with mcp key', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'npx', args: ['-y', '@test/mcp-server'] },
      };

      const result = mergeOpenCodeMCPServers(servers, false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, 'opencode.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.mcp).toBeDefined();
      expect(config.mcp['test-server'].type).toBe('local');
      expect(config.mcp['test-server'].command).toBe('npx');
    });
  });

  describe('removeOpenCodeMCPServers', () => {
    it('removes unchanged servers from OpenCode config', async () => {
      const server: MCPServer = { command: 'test', args: ['arg1'] };

      mergeOpenCodeMCPServers({ 'test-server': server }, false, tempDir);
      const result = removeOpenCodeMCPServers({ 'test-server': server }, false, tempDir);

      expect(result.removed).toContain('test-server');
    });
  });

  describe('mergeKiroMCPServers', () => {
    it('creates .kiro/settings/mcp.json with mcpServers key', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'npx', args: ['-y', '@test/mcp-server'] },
      };

      const result = mergeKiroMCPServers(servers, false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.kiro', 'settings', 'mcp.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.mcpServers['test-server']).toBeDefined();
      expect(config.mcpServers['test-server'].command).toBe('npx');
    });
  });

  describe('removeKiroMCPServers', () => {
    it('removes unchanged servers from Kiro config', async () => {
      const server: MCPServer = { command: 'test', args: ['arg1'] };

      mergeKiroMCPServers({ 'test-server': server }, false, tempDir);
      const result = removeKiroMCPServers({ 'test-server': server }, false, tempDir);

      expect(result.removed).toContain('test-server');
    });
  });

  describe('mergeTraeMCPServers', () => {
    it('creates .trae/mcp.json with mcpServers key', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'npx', args: ['-y', '@test/mcp-server'] },
      };

      const result = mergeTraeMCPServers(servers, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.trae', 'mcp.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.mcpServers['test-server']).toBeDefined();
      expect(config.mcpServers['test-server'].command).toBe('npx');
    });
  });

  describe('removeTraeMCPServers', () => {
    it('removes unchanged servers from Trae config', async () => {
      const server: MCPServer = { command: 'test', args: ['arg1'] };

      mergeTraeMCPServers({ 'test-server': server }, tempDir);
      const result = removeTraeMCPServers({ 'test-server': server }, tempDir);

      expect(result.removed).toContain('test-server');
    });
  });

  describe('mergeAmpMCPServers', () => {
    it('creates .amp/settings.json with amp.mcpServers key', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'npx', args: ['-y', '@test/mcp-server'] },
      };

      const result = mergeAmpMCPServers(servers, false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.amp', 'settings.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config['amp.mcpServers']).toBeDefined();
      expect(config['amp.mcpServers']['test-server'].command).toBe('npx');
    });

    it('skips existing servers', async () => {
      const configPath = join(tempDir, '.amp', 'settings.json');
      await mkdir(join(tempDir, '.amp'), { recursive: true });
      await writeFile(configPath, JSON.stringify({
        'amp.mcpServers': { 'existing': { command: 'existing' } },
      }));

      const result = mergeAmpMCPServers({ 'existing': { command: 'new' } }, false, tempDir);
      expect(result.skipped).toContain('existing');
    });
  });

  describe('removeAmpMCPServers', () => {
    it('removes unchanged servers from Amp config', async () => {
      const server: MCPServer = { command: 'test', args: ['arg1'] };

      mergeAmpMCPServers({ 'test-server': server }, false, tempDir);
      const result = removeAmpMCPServers({ 'test-server': server }, false, tempDir);

      expect(result.removed).toContain('test-server');
    });
  });

  describe('Zed config read/write', () => {
    it('readZedConfig returns empty context_servers for missing file', () => {
      const config = readZedConfig(join(tempDir, 'nonexistent.json'));
      expect(config.context_servers).toEqual({});
    });

    it('writeZedConfig creates file with context_servers', async () => {
      const configPath = join(tempDir, 'zed-settings.json');
      writeZedConfig(configPath, {
        context_servers: {
          'test-server': { command: 'npx', args: ['-y', '@test/mcp-server'] },
        },
      });

      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.context_servers).toBeDefined();
      expect(config.context_servers['test-server'].command).toBe('npx');
    });

    it('preserves other Zed settings when writing', async () => {
      const configPath = join(tempDir, 'zed-settings.json');
      await writeFile(configPath, JSON.stringify({
        theme: 'One Dark',
        buffer_font_size: 14,
        context_servers: {},
      }));

      const config = readZedConfig(configPath);
      config.context_servers = { 'new-server': { command: 'test' } };
      writeZedConfig(configPath, config);

      const content = await readFile(configPath, 'utf-8');
      const written = JSON.parse(content);
      expect(written.theme).toBe('One Dark');
      expect(written.buffer_font_size).toBe(14);
      expect(written.context_servers['new-server']).toBeDefined();
    });
  });

  describe('mergeEditorMCPServers routing', () => {
    it('routes to Gemini for gemini editor', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'test' },
      };

      const result = mergeEditorMCPServers(servers, 'gemini', false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.gemini', 'settings.json');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('mcpServers');
    });

    it('routes to OpenCode for opencode editor', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'test' },
      };

      const result = mergeEditorMCPServers(servers, 'opencode', false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, 'opencode.json');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('"mcp"');
    });

    it('routes to Kiro for kiro editor', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'test' },
      };

      const result = mergeEditorMCPServers(servers, 'kiro', false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.kiro', 'settings', 'mcp.json');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('mcpServers');
    });

    it('routes to Trae for trae editor', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'test' },
      };

      const result = mergeEditorMCPServers(servers, 'trae', false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.trae', 'mcp.json');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('mcpServers');
    });

    it('routes to Amp for amp editor', async () => {
      const servers: Record<string, MCPServer> = {
        'test-server': { command: 'test' },
      };

      const result = mergeEditorMCPServers(servers, 'amp', false, tempDir);
      expect(result.added).toContain('test-server');

      const configPath = join(tempDir, '.amp', 'settings.json');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('amp.mcpServers');
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
