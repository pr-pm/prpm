/**
 * Tests for Kiro Agent format parser
 */

import { describe, it, expect } from 'vitest';
import { fromKiroAgent } from '../from-kiro-agent.js';
import type { CanonicalPackage } from '../types/canonical.js';

describe('fromKiroAgent', () => {
  it('should parse basic kiro agent JSON', () => {
    const agentJson = JSON.stringify({
      name: 'backend-specialist',
      description: 'Expert in Node.js and Express',
      prompt: 'You are a backend developer expert.',
      tools: ['fs_read', 'fs_write'],
    });

    const result = fromKiroAgent(agentJson);

    expect(result.format).toBe('canonical');
    expect(result.content).toBeTruthy();

    const pkg: CanonicalPackage = JSON.parse(result.content);
    expect(pkg.name).toBe('backend-specialist');
    expect(pkg.description).toBe('Expert in Node.js and Express');
    expect(pkg.subtype).toBe('agent');
  });

  it('should extract tools from agent', () => {
    const agentJson = JSON.stringify({
      name: 'test-agent',
      description: 'Test',
      tools: ['fs_read', 'fs_write', 'execute_bash'],
    });

    const result = fromKiroAgent(agentJson);
    const pkg: CanonicalPackage = JSON.parse(result.content);

    expect(pkg.metadata?.tools).toEqual(['fs_read', 'fs_write', 'execute_bash']);
  });

  it('should extract MCP servers', () => {
    const agentJson = JSON.stringify({
      name: 'test',
      description: 'Test',
      mcpServers: {
        fetch: {
          command: 'mcp-server-fetch',
          args: [],
        },
      },
    });

    const result = fromKiroAgent(agentJson);
    const pkg: CanonicalPackage = JSON.parse(result.content);

    expect(pkg.metadata?.mcpServers).toBeDefined();
    expect(pkg.metadata?.mcpServers.fetch).toBeDefined();
  });

  it('should handle file:// prompt references', () => {
    const agentJson = JSON.stringify({
      name: 'test',
      description: 'Test',
      prompt: 'file://./prompts/expert.md',
    });

    const result = fromKiroAgent(agentJson);
    const pkg: CanonicalPackage = JSON.parse(result.content);

    expect(pkg.content.sections.some(s =>
      s.type === 'instructions' && s.content.includes('file://')
    )).toBe(true);
  });

  it('should parse structured prompts', () => {
    const agentJson = JSON.stringify({
      name: 'test',
      description: 'Test',
      prompt: 'You are an expert.\n\n## Instructions\n\nFollow these steps.\n\n## Rules\n\n### Rule 1\n\nBe concise.',
    });

    const result = fromKiroAgent(agentJson);
    const pkg: CanonicalPackage = JSON.parse(result.content);

    // Should have parsed sections
    const hasInstructions = pkg.content.sections.some(s => s.type === 'instructions');
    expect(hasInstructions).toBe(true);
  });

  it('should set sourceFormat metadata', () => {
    const agentJson = JSON.stringify({
      name: 'test',
      description: 'Test',
    });

    const result = fromKiroAgent(agentJson);
    const pkg: CanonicalPackage = JSON.parse(result.content);

    expect(pkg.metadata?.sourceFormat).toBe('kiro');
  });

  it('should handle hooks', () => {
    const agentJson = JSON.stringify({
      name: 'test',
      description: 'Test',
      hooks: {
        agentSpawn: ['echo "Starting"'],
        userPromptSubmit: ['git status'],
      },
    });

    const result = fromKiroAgent(agentJson);
    const pkg: CanonicalPackage = JSON.parse(result.content);

    expect(pkg.metadata?.hooks).toBeDefined();
    expect(pkg.metadata?.hooks.agentSpawn).toEqual(['echo "Starting"']);
  });

  it('should handle toolsSettings', () => {
    const agentJson = JSON.stringify({
      name: 'test',
      description: 'Test',
      toolsSettings: {
        fs_write: {
          allowedPaths: ['src/**', 'tests/**'],
        },
      },
    });

    const result = fromKiroAgent(agentJson);
    const pkg: CanonicalPackage = JSON.parse(result.content);

    expect(pkg.metadata?.toolsSettings).toBeDefined();
    expect(pkg.metadata?.toolsSettings.fs_write.allowedPaths).toEqual(['src/**', 'tests/**']);
  });

  it('should handle invalid JSON gracefully', () => {
    const result = fromKiroAgent('not valid json');

    expect(result.format).toBe('canonical');
    expect(result.warnings).toBeDefined();
    expect(result.lossyConversion).toBe(true);
    expect(result.qualityScore).toBe(0);
  });
});
