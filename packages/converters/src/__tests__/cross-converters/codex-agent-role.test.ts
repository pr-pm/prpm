/**
 * Integration tests for Codex agent role (TOML format)
 *
 * Covers:
 * - Full roundtrip: canonical → TOML → canonical
 * - Cross-format: Claude skill/agent → Codex agent role
 * - Schema validation against codex-agent-role.schema.json
 * - Quality scoring and lossy conversion tracking
 * - All sandbox_mode enum values
 * - Data integrity through conversion
 *
 * @see https://developers.openai.com/codex/multi-agent/#agent-roles
 */

import { describe, it, expect } from 'vitest';
import toml from '@iarna/toml';
import { fromCodexAgentRole } from '../../from-codex.js';
import { toCodex } from '../../to-codex.js';
import { fromClaude } from '../../from-claude.js';
import { validateFormat } from '../../validation.js';
import type { CanonicalPackage } from '../../types/canonical.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseMetadata = {
  id: 'reviewer',
  name: 'reviewer',
  version: '1.0.0',
  author: 'testauthor',
  description: 'Find security, correctness, and test risks in code.',
};

const fullAgentRoleToml = `
model = "o3"
model_reasoning_effort = "high"
sandbox_mode = "read-only"
developer_instructions = "Focus on security vulnerabilities, correctness issues, and missing test coverage. Flag high-priority risks only."
`.trim();

const minimalAgentRoleToml = `
developer_instructions = "You are a code explorer."
`.trim();

function makeAgentCanonical(overrides: Partial<CanonicalPackage> = {}): CanonicalPackage {
  return {
    id: 'reviewer',
    name: 'reviewer',
    version: '1.0.0',
    author: 'testauthor',
    description: 'Find security issues in code.',
    format: 'codex',
    subtype: 'agent',
    tags: [],
    content: {
      format: 'canonical',
      version: '1.0',
      sections: [
        {
          type: 'metadata',
          data: {
            title: 'Reviewer',
            description: 'Find security issues in code.',
            codexAgent: {
              model: 'o3',
              modelReasoningEffort: 'high',
              sandboxMode: 'read-only',
            },
          },
        },
        {
          type: 'instructions',
          title: 'Instructions',
          content: 'Focus on security vulnerabilities and correctness risks.',
        },
      ],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Roundtrip: canonical → TOML → canonical
// ---------------------------------------------------------------------------

describe('Codex Agent Role — roundtrip (canonical → TOML → canonical)', () => {
  it('should preserve model field through roundtrip', () => {
    const pkg = makeAgentCanonical();
    const toml = toCodex(pkg).content;
    const reparsed = fromCodexAgentRole(toml, baseMetadata);

    const meta = reparsed.content.sections.find(s => s.type === 'metadata');
    expect(meta?.type === 'metadata' && meta.data.codexAgent?.model).toBe('o3');
  });

  it('should preserve model_reasoning_effort through roundtrip', () => {
    const pkg = makeAgentCanonical();
    const toml = toCodex(pkg).content;
    const reparsed = fromCodexAgentRole(toml, baseMetadata);

    const meta = reparsed.content.sections.find(s => s.type === 'metadata');
    expect(meta?.type === 'metadata' && meta.data.codexAgent?.modelReasoningEffort).toBe('high');
  });

  it('should preserve sandbox_mode through roundtrip', () => {
    const pkg = makeAgentCanonical();
    const toml = toCodex(pkg).content;
    const reparsed = fromCodexAgentRole(toml, baseMetadata);

    const meta = reparsed.content.sections.find(s => s.type === 'metadata');
    expect(meta?.type === 'metadata' && meta.data.codexAgent?.sandboxMode).toBe('read-only');
  });

  it('should preserve developer_instructions through roundtrip', () => {
    const pkg = makeAgentCanonical();
    const toml = toCodex(pkg).content;
    const reparsed = fromCodexAgentRole(toml, baseMetadata);

    const instr = reparsed.content.sections.find(s => s.type === 'instructions');
    expect(instr?.type === 'instructions' && instr.content).toContain('security vulnerabilities');
  });

  it('should be lossless for a full agent role', () => {
    const pkg = makeAgentCanonical();
    const result = toCodex(pkg);

    expect(result.lossyConversion).toBe(false);
    expect(result.qualityScore).toBe(100);
  });

  it('should roundtrip all three sandbox_mode values', () => {
    const modes = ['read-only', 'workspace-write', 'danger-full-access'] as const;

    for (const mode of modes) {
      const pkg = makeAgentCanonical({
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Agent',
                description: 'Test.',
                codexAgent: { sandboxMode: mode },
              },
            },
          ],
        },
      });

      const toml = toCodex(pkg).content;
      const reparsed = fromCodexAgentRole(toml, baseMetadata);

      const meta = reparsed.content.sections.find(s => s.type === 'metadata');
      expect(meta?.type === 'metadata' && meta.data.codexAgent?.sandboxMode).toBe(mode);
    }
  });
});

// ---------------------------------------------------------------------------
// Roundtrip: TOML → canonical → TOML
// ---------------------------------------------------------------------------

describe('Codex Agent Role — roundtrip (TOML → canonical → TOML)', () => {
  it('should reproduce equivalent TOML from a parsed agent role', () => {
    const canonical = fromCodexAgentRole(fullAgentRoleToml, baseMetadata);
    const tomlOut = toCodex(canonical).content;

    expect(tomlOut).toContain('model = ');
    expect(tomlOut).toContain('o3');
    expect(tomlOut).toContain('model_reasoning_effort = ');
    expect(tomlOut).toContain('high');
    expect(tomlOut).toContain('sandbox_mode = ');
    expect(tomlOut).toContain('read-only');
    expect(tomlOut).toContain('developer_instructions = ');
    expect(tomlOut).toContain('security vulnerabilities');
  });

  it('should produce valid TOML (no YAML frontmatter delimiters)', () => {
    const canonical = fromCodexAgentRole(fullAgentRoleToml, baseMetadata);
    const tomlOut = toCodex(canonical).content;

    expect(tomlOut).not.toContain('---');
    expect(tomlOut).not.toContain('name:');        // Agent Skills SKILL.md fields
    expect(tomlOut).not.toContain('description:'); // should not appear in TOML
  });
});

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe('Codex Agent Role — schema validation', () => {
  it('should produce schema-valid TOML for a full agent role', () => {
    const canonical = fromCodexAgentRole(fullAgentRoleToml, baseMetadata);
    const tomlOut = toCodex(canonical).content;

    // Parse back to object for schema validation
    const parsed = toml.parse(tomlOut);

    const result = validateFormat('codex', parsed, 'agent');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept valid sandbox_mode values per schema', () => {
    const validModes = ['read-only', 'workspace-write', 'danger-full-access'];

    for (const mode of validModes) {
      const result = validateFormat('codex', {
        name: 'test-agent',
        description: 'Test agent',
        developer_instructions: 'Do something.',
        sandbox_mode: mode,
      }, 'agent');
      expect(result.valid).toBe(true);
    }
  });

  it('should reject invalid sandbox_mode values per schema', () => {
    // Old incorrect values from before the fix
    for (const bad of ['strict', 'workspace']) {
      const result = validateFormat('codex', { sandbox_mode: bad }, 'agent');
      expect(result.valid).toBe(false);
    }
  });

  it('should accept an agent role with only required fields', () => {
    const result = validateFormat('codex', {
      name: 'test-agent',
      description: 'A test agent',
      developer_instructions: 'Follow instructions.',
    }, 'agent');
    expect(result.valid).toBe(true);
  });

  it('should reject an agent role missing required fields', () => {
    const result = validateFormat('codex', {}, 'agent');
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Subagent-specific fields: nickname_candidates, mcp_servers, skills.config
// ---------------------------------------------------------------------------

describe('Codex Agent Role — subagent fields', () => {
  it('should roundtrip nickname_candidates through conversion', () => {
    const tomlContent = `
name = "reviewer"
description = "Code reviewer"
developer_instructions = "Review code."
nickname_candidates = ["rev", "code-review"]
`.trim();

    const canonical = fromCodexAgentRole(tomlContent, baseMetadata);
    const meta = canonical.content.sections.find(s => s.type === 'metadata');
    expect(meta?.type === 'metadata' && meta.data.codexAgent?.nicknameCandidates).toEqual(['rev', 'code-review']);

    const result = toCodex(canonical);
    expect(result.content).toContain('nickname_candidates');
    expect(result.content).toContain('rev');
    expect(result.content).toContain('code-review');
  });

  it('should roundtrip mcp_servers through conversion', () => {
    const tomlContent = `
name = "agent-with-mcp"
description = "Agent with MCP"
developer_instructions = "Use MCP tools."

[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem"]

[mcp_servers.filesystem.env]
ROOT_DIR = "/tmp"
`.trim();

    const canonical = fromCodexAgentRole(tomlContent, baseMetadata);
    const meta = canonical.content.sections.find(s => s.type === 'metadata');
    expect(meta?.type === 'metadata' && meta.data.codexAgent?.mcpServers).toBeDefined();

    const result = toCodex(canonical);
    expect(result.content).toContain('mcp_servers');
    expect(result.content).toContain('filesystem');
  });

  it('should roundtrip skills.config through conversion', () => {
    const tomlContent = `
name = "skilled-agent"
description = "Agent with skills"
developer_instructions = "Use skills."

[skills.config]
search = true
analyze = false
`.trim();

    const canonical = fromCodexAgentRole(tomlContent, baseMetadata);
    const meta = canonical.content.sections.find(s => s.type === 'metadata');
    expect(meta?.type === 'metadata' && meta.data.codexAgent?.skillsConfig).toBeDefined();

    const result = toCodex(canonical);
    expect(result.content).toContain('skills');
    expect(result.content).toContain('config');
  });

  it('should validate a full subagent with all fields against schema', () => {
    const parsed = {
      name: 'full-agent',
      description: 'A fully configured subagent',
      developer_instructions: 'Do everything.',
      nickname_candidates: ['fa', 'full'],
      model: 'o3',
      model_reasoning_effort: 'high',
      sandbox_mode: 'workspace-write',
      mcp_servers: {
        fs: { command: 'npx', args: ['-y', 'fs-server'] },
      },
      skills: { config: { linting: true } },
    };

    const result = validateFormat('codex', parsed, 'agent');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should preserve name and description through roundtrip', () => {
    const tomlContent = `
name = "My Custom Agent"
description = "Does custom things"
developer_instructions = "Be custom."
`.trim();

    const canonical = fromCodexAgentRole(tomlContent, baseMetadata);
    const meta = canonical.content.sections.find(s => s.type === 'metadata');
    expect(meta?.type === 'metadata' && meta.data.codexAgent?.name).toBe('My Custom Agent');
    expect(meta?.type === 'metadata' && meta.data.codexAgent?.description).toBe('Does custom things');

    const result = toCodex(canonical);
    expect(result.content).toContain('My Custom Agent');
    expect(result.content).toContain('Does custom things');
  });
});

// ---------------------------------------------------------------------------
// Cross-format: Claude agent → Codex agent role
// ---------------------------------------------------------------------------

describe('Codex Agent Role — cross-format (Claude → Codex agent)', () => {
  const claudeAgentContent = `---
description: Find security vulnerabilities in code changes.
model: sonnet
---

# Security Reviewer

Review code for security issues, focusing on OWASP Top 10.
`;

  it('should convert a Claude agent to Codex agent TOML', () => {
    const canonical = fromClaude(claudeAgentContent, baseMetadata, 'claude', 'agent');
    const result = toCodex(canonical);

    expect(result.format).toBe('codex');
    expect(result.content).not.toContain('---');
    expect(result.content).toContain('developer_instructions');
  });

  it('should include developer instructions from body content', () => {
    const canonical = fromClaude(claudeAgentContent, baseMetadata, 'claude', 'agent');
    const result = toCodex(canonical);

    expect(result.content).toContain('security');
  });

  it('should flag lossy conversion when Claude-specific fields are dropped', () => {
    const claudeWithTools = `---
description: Reviewer.
tools: Read, Write, Bash
---
Review code.
`;
    const canonical = fromClaude(claudeWithTools, baseMetadata, 'claude', 'agent');
    const result = toCodex(canonical);

    // Tools are not representable in agent role TOML
    expect(result.warnings).toBeDefined();
    expect(result.lossyConversion).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Data integrity
// ---------------------------------------------------------------------------

describe('Codex Agent Role — data integrity', () => {
  it('should handle a minimal role with only developer_instructions', () => {
    const canonical = fromCodexAgentRole(minimalAgentRoleToml, baseMetadata);

    expect(canonical.format).toBe('codex');
    expect(canonical.subtype).toBe('agent');

    const instr = canonical.content.sections.find(s => s.type === 'instructions');
    expect(instr).toBeDefined();
  });

  it('should not include instructions section when developer_instructions is absent', () => {
    const tomlWithNoInstructions = `model = "o3"`;
    const canonical = fromCodexAgentRole(tomlWithNoInstructions, baseMetadata);

    const instr = canonical.content.sections.find(s => s.type === 'instructions');
    expect(instr).toBeUndefined();
  });

  it('should always include a metadata section', () => {
    const canonical = fromCodexAgentRole('', baseMetadata);

    const meta = canonical.content.sections.find(s => s.type === 'metadata');
    expect(meta).toBeDefined();
  });

  it('should use description from metadata when developer_instructions absent', () => {
    const pkg = makeAgentCanonical({
      description: 'Fallback description.',
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'metadata',
            data: { title: 'Agent', description: 'Fallback description.' },
          },
          // no instructions section
        ],
      },
    });

    const toml = toCodex(pkg).content;
    expect(toml).toContain('developer_instructions');
    expect(toml).toContain('Fallback description.');
  });
});
