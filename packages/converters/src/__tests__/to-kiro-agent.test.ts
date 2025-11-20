/**
 * Tests for Kiro Agent format converter
 */

import { describe, it, expect } from 'vitest';
import { toKiroAgent, isKiroAgentFormat } from '../to-kiro-agent.js';
import type { CanonicalPackage } from '../types/canonical.js';

describe('toKiroAgent', () => {
  const minimalPackage: CanonicalPackage = {
    id: 'test-agent',
    version: '1.0.0',
    name: 'test-agent',
    description: 'A test Kiro agent',
    author: 'testauthor',
    tags: [],
    format: 'kiro',
    subtype: 'agent',
    content: {
      format: 'canonical',
      version: '1.0',
      sections: [
        {
          type: 'metadata',
          data: {
            title: 'Test Agent',
            description: 'A test agent',
          },
        },
        {
          type: 'instructions',
          title: 'Core Instructions',
          content: 'You are a helpful assistant.',
        },
      ],
    },
  };

  it('should convert canonical to kiro agent JSON', () => {
    const result = toKiroAgent(minimalPackage);

    expect(result.format).toBe('kiro');
    expect(result.content).toBeTruthy();
    expect(result.qualityScore).toBeGreaterThan(0);

    // Verify it's valid JSON
    const parsed = JSON.parse(result.content);
    expect(parsed.name).toBe('test-agent');
    expect(parsed.description).toBe('A test Kiro agent');
  });

  it('should include prompt from instructions', () => {
    const result = toKiroAgent(minimalPackage);
    const parsed = JSON.parse(result.content);

    expect(parsed.prompt).toContain('helpful assistant');
  });

  it('should handle tools from metadata', () => {
    const pkgWithTools: CanonicalPackage = {
      ...minimalPackage,
      metadata: {
        tools: ['fs_read', 'fs_write', 'execute_bash'],
      },
    };

    const result = toKiroAgent(pkgWithTools);
    const parsed = JSON.parse(result.content);

    expect(parsed.tools).toEqual(['fs_read', 'fs_write', 'execute_bash']);
  });

  it('should warn about slash commands', () => {
    const slashPackage: CanonicalPackage = {
      ...minimalPackage,
      subtype: 'slash-command',
    };

    const result = toKiroAgent(slashPackage);

    expect(result.warnings).toBeDefined();
    expect(result.warnings?.some(w => w.includes('not directly supported'))).toBe(true);
    expect(result.qualityScore).toBeLessThan(100);
  });

  it('should include mcpServers from metadata', () => {
    const pkgWithMcp: CanonicalPackage = {
      ...minimalPackage,
      metadata: {
        mcpServers: {
          fetch: {
            command: 'mcp-server-fetch',
            args: [],
          },
        },
      },
    };

    const result = toKiroAgent(pkgWithMcp);
    const parsed = JSON.parse(result.content);

    expect(parsed.mcpServers).toBeDefined();
    expect(parsed.mcpServers.fetch).toBeDefined();
  });
});

describe('isKiroAgentFormat', () => {
  it('should identify valid kiro agent JSON', () => {
    const valid = JSON.stringify({
      name: 'test',
      description: 'test agent',
      prompt: 'You are helpful',
    });

    expect(isKiroAgentFormat(valid)).toBe(true);
  });

  it('should reject invalid JSON', () => {
    expect(isKiroAgentFormat('not json')).toBe(false);
  });

  it('should reject JSON without agent fields', () => {
    const invalid = JSON.stringify({
      random: 'data',
    });

    expect(isKiroAgentFormat(invalid)).toBe(false);
  });

  it('should accept JSON with just name and tools', () => {
    const valid = JSON.stringify({
      name: 'test',
      tools: ['fs_read'],
    });

    expect(isKiroAgentFormat(valid)).toBe(true);
  });
});
