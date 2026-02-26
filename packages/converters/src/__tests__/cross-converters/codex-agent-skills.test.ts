/**
 * Integration tests for Codex Agent Skills (SKILL.md format)
 *
 * Covers:
 * - Full roundtrip: canonical → SKILL.md → canonical
 * - Cross-format: Claude skill → Codex SKILL.md (slug regression, allowed-tools)
 * - Schema validation against agent-skills.schema.json
 * - Quality scoring and lossy conversion tracking
 * - Agent Skills spec compliance (name slug, description, optional fields)
 * - Data integrity: instructions, tools, license, compatibility, metadata
 *
 * @see https://agentskills.io/specification
 */

import { describe, it, expect } from 'vitest';
import { fromCodex } from '../../from-codex.js';
import { toCodex } from '../../to-codex.js';
import { fromClaude } from '../../from-claude.js';
import { validateFormat } from '../../validation.js';
import type { CanonicalPackage } from '../../types/canonical.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseMetadata = {
  id: 'typescript-expert',
  name: 'typescript-expert',
  version: '1.0.0',
  author: 'testauthor',
};

const fullSkillMd = `---
name: typescript-expert
description: Expert TypeScript development with strict type safety and modern patterns. Use when working on TypeScript files or when the user asks about types, generics, or type errors.
license: MIT
compatibility: Designed for Claude Code (or similar agentic coding products)
allowed-tools: Read Write Bash(tsc:*)
metadata:
  author: testauthor
  version: "1.0.0"
---

# TypeScript Expert

You are an expert TypeScript developer.

## Guidelines

- Always use strict type checking
- Prefer \`unknown\` over \`any\`
- Use generics for reusable code
`;

// Claude SKILL.md that mirrors the Agent Skills format
const claudeSkillMd = `---
name: self-improving
description: Searches PRPM registry for relevant expertise packages. Use when starting infrastructure, testing, or deployment tasks.
license: MIT
allowed-tools: Read, Write, Bash
---

# Self-Improving with PRPM

Automatically search and install PRPM packages to enhance capabilities.
`;

function makeSkillCanonical(overrides: Partial<CanonicalPackage> = {}): CanonicalPackage {
  return {
    id: 'typescript-expert',
    name: 'typescript-expert',
    version: '1.0.0',
    author: 'testauthor',
    description: 'Expert TypeScript development with strict type safety.',
    format: 'codex',
    subtype: 'skill',
    tags: [],
    content: {
      format: 'canonical',
      version: '1.0',
      sections: [
        {
          type: 'metadata',
          data: {
            title: 'TypeScript Expert',
            description: 'Expert TypeScript development with strict type safety.',
            agentSkills: {
              name: 'typescript-expert',
              license: 'MIT',
              compatibility: 'Designed for Claude Code',
              allowedTools: 'Read Write Bash',
            },
          },
        },
        {
          type: 'instructions',
          title: 'Instructions',
          content: 'Always use strict type checking. Prefer `unknown` over `any`.',
        },
      ],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Roundtrip: SKILL.md → canonical → SKILL.md
// ---------------------------------------------------------------------------

describe('Codex Agent Skills — roundtrip (SKILL.md → canonical → SKILL.md)', () => {
  it('should preserve name field through roundtrip', () => {
    const canonical = fromCodex(fullSkillMd, baseMetadata);
    const result = toCodex(canonical);

    expect(result.content).toContain('name: typescript-expert');
  });

  it('should preserve description field through roundtrip', () => {
    const canonical = fromCodex(fullSkillMd, baseMetadata);
    const result = toCodex(canonical);

    expect(result.content).toContain('description:');
    expect(result.content).toContain('Expert TypeScript development');
  });

  it('should preserve license through roundtrip', () => {
    const canonical = fromCodex(fullSkillMd, baseMetadata);
    const result = toCodex(canonical);

    expect(result.content).toContain('license: MIT');
  });

  it('should preserve compatibility through roundtrip', () => {
    const canonical = fromCodex(fullSkillMd, baseMetadata);
    const result = toCodex(canonical);

    expect(result.content).toContain('compatibility:');
    expect(result.content).toContain('Claude Code');
  });

  it('should preserve allowed-tools through roundtrip', () => {
    const canonical = fromCodex(fullSkillMd, baseMetadata);
    const result = toCodex(canonical);

    expect(result.content).toContain('allowed-tools:');
    expect(result.content).toContain('Read');
    expect(result.content).toContain('Write');
  });

  it('should preserve instruction body content through roundtrip', () => {
    const canonical = fromCodex(fullSkillMd, baseMetadata);
    const result = toCodex(canonical);

    expect(result.content).toContain('strict type checking');
  });

  it('should be lossless for a full skill', () => {
    const canonical = fromCodex(fullSkillMd, baseMetadata);
    const result = toCodex(canonical);

    expect(result.lossyConversion).toBe(false);
    expect(result.qualityScore).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Roundtrip: canonical → SKILL.md → canonical
// ---------------------------------------------------------------------------

describe('Codex Agent Skills — roundtrip (canonical → SKILL.md → canonical)', () => {
  it('should produce a SKILL.md with YAML frontmatter', () => {
    const pkg = makeSkillCanonical();
    const result = toCodex(pkg);

    expect(result.content).toMatch(/^---\n/);
    expect(result.content).toContain('name: typescript-expert');
    expect(result.content).toContain('description:');
    expect(result.content).toContain('---\n');
  });

  it('should recover all metadata sections when re-parsed', () => {
    const pkg = makeSkillCanonical();
    const skillMd = toCodex(pkg).content;
    const reparsed = fromCodex(skillMd, baseMetadata);

    expect(reparsed.format).toBe('codex');
    expect(reparsed.subtype).toBe('skill');

    const meta = reparsed.content.sections.find(s => s.type === 'metadata');
    expect(meta?.type === 'metadata' && meta.data.agentSkills?.name).toBe('typescript-expert');
    expect(meta?.type === 'metadata' && meta.data.agentSkills?.license).toBe('MIT');
  });

  it('should recover instructions when re-parsed', () => {
    const pkg = makeSkillCanonical();
    const skillMd = toCodex(pkg).content;
    const reparsed = fromCodex(skillMd, baseMetadata);

    const instr = reparsed.content.sections.find(s => s.type === 'instructions');
    expect(instr).toBeDefined();
    expect(instr?.type === 'instructions' && instr.content).toContain('strict type checking');
  });
});

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe('Codex Agent Skills — schema validation', () => {
  it('should produce schema-valid SKILL.md frontmatter', () => {
    const pkg = makeSkillCanonical();
    const skillMd = toCodex(pkg).content;
    const reparsed = fromCodex(skillMd, baseMetadata);

    const meta = reparsed.content.sections.find(s => s.type === 'metadata');
    const frontmatterData = {
      frontmatter: {
        name: meta?.type === 'metadata' ? meta.data.agentSkills?.name : '',
        description: pkg.description,
        license: meta?.type === 'metadata' ? meta.data.agentSkills?.license : undefined,
      },
      content: 'Instructions here.',
    };

    const result = validateFormat('codex', frontmatterData, 'skill');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation when name is missing', () => {
    const result = validateFormat('codex', {
      frontmatter: { description: 'A skill.' },
      content: 'Instructions.',
    }, 'skill');

    expect(result.valid).toBe(false);
  });

  it('should fail validation when description is missing', () => {
    const result = validateFormat('codex', {
      frontmatter: { name: 'my-skill' },
      content: 'Instructions.',
    }, 'skill');

    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cross-format: Claude skill → Codex SKILL.md
// ---------------------------------------------------------------------------

describe('Codex Agent Skills — cross-format (Claude → Codex)', () => {
  it('should convert a Claude skill to SKILL.md format', () => {
    const canonical = fromClaude(claudeSkillMd, {
      id: 'self-improving', name: 'self-improving', version: '1.0.0', author: 'prpm',
    }, 'claude', 'skill');
    const result = toCodex(canonical);

    expect(result.content).toMatch(/^---\n/);
    expect(result.content).toContain('name: self-improving');
    expect(result.content).toContain('description:');
  });

  it('should use the original frontmatter name slug, not the H1 title', () => {
    // Regression: H1 "Self-Improving with PRPM" was used instead of "self-improving"
    // This violates the Agent Skills spec: name must match parent directory name
    const canonical = fromClaude(claudeSkillMd, {
      id: 'self-improving', name: 'self-improving', version: '1.0.0', author: 'prpm',
    }, 'claude', 'skill');
    const result = toCodex(canonical);

    expect(result.content).toContain('name: self-improving');
    expect(result.content).not.toContain('name: self-improving-with-prpm');
  });

  it('should normalize allowed-tools from comma-separated to space-delimited', () => {
    // Claude uses comma-separated; Agent Skills spec requires space-delimited
    const canonical = fromClaude(claudeSkillMd, {
      id: 'self-improving', name: 'self-improving', version: '1.0.0', author: 'prpm',
    }, 'claude', 'skill');
    const result = toCodex(canonical);

    if (result.content.includes('allowed-tools:')) {
      // Must not contain comma-separated tools
      const toolsLine = result.content.split('\n').find(l => l.startsWith('allowed-tools:'));
      expect(toolsLine).not.toContain(',');
    }
  });

  it('should strip author namespace from name when converting namespaced package', () => {
    const canonical = fromClaude(claudeSkillMd, {
      id: '@prpm/self-improving', name: '@prpm/self-improving', version: '1.0.0', author: 'prpm',
    }, 'claude', 'skill');
    const result = toCodex(canonical);

    // agentSkills.name from frontmatter takes priority, but namespace must not appear
    expect(result.content).not.toContain('name: prpm-self-improving');
  });

  it('should preserve body instructions in the output', () => {
    const canonical = fromClaude(claudeSkillMd, {
      id: 'self-improving', name: 'self-improving', version: '1.0.0', author: 'prpm',
    }, 'claude', 'skill');
    const result = toCodex(canonical);

    expect(result.content).toContain('PRPM packages');
  });

  it('should produce a quality score of 100 for a clean Claude skill conversion', () => {
    const canonical = fromClaude(claudeSkillMd, {
      id: 'self-improving', name: 'self-improving', version: '1.0.0', author: 'prpm',
    }, 'claude', 'skill');
    const result = toCodex(canonical);

    expect(result.qualityScore).toBe(100);
    expect(result.lossyConversion).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Agent Skills spec compliance
// ---------------------------------------------------------------------------

describe('Codex Agent Skills — spec compliance', () => {
  it('name must be lowercase alphanumeric with hyphens only', () => {
    const skills = [
      { input: 'My Skill', expected: 'my-skill' },
      { input: 'TypeScript Expert', expected: 'typescript-expert' },
      { input: 'skill_with_underscores', expected: 'skill-with-underscores' },
    ];

    for (const { input, expected } of skills) {
      const pkg = makeSkillCanonical({ name: input, content: {
        format: 'canonical', version: '1.0',
        sections: [{ type: 'metadata', data: { title: input, description: 'Test.' } }],
      }});
      const result = toCodex(pkg);
      const nameLine = result.content.split('\n').find(l => l.startsWith('name:'));
      expect(nameLine).toBe(`name: ${expected}`);
    }
  });

  it('description should be capped at 1024 characters', () => {
    const longDesc = 'A'.repeat(2000);
    const pkg = makeSkillCanonical({ description: longDesc, content: {
      format: 'canonical', version: '1.0',
      sections: [{
        type: 'metadata',
        data: { title: 'Test', description: longDesc },
      }],
    }});
    const result = toCodex(pkg);

    const descLine = result.content.split('\n').find(l => l.startsWith('description:'));
    expect(descLine?.length).toBeLessThanOrEqual(1024 + 'description: '.length);
    expect(result.content).toContain('...');
  });

  it('output should contain YAML frontmatter block', () => {
    const pkg = makeSkillCanonical();
    const result = toCodex(pkg);

    expect(result.content).toMatch(/^---\n[\s\S]+?\n---/);
  });

  it('name in frontmatter should match the package slug used for directory naming', () => {
    // The Agent Skills spec requires name === parent directory name
    // getDestinationDir uses stripAuthorNamespace(pkg.name) as the directory
    // So toCodex must produce the same slug
    const pkg = makeSkillCanonical({ name: 'typescript-expert' });
    const result = toCodex(pkg);

    const nameLine = result.content.split('\n').find(l => l.startsWith('name:'));
    const nameValue = nameLine?.replace('name: ', '').trim();

    expect(nameValue).toBe('typescript-expert');
  });
});

// ---------------------------------------------------------------------------
// Data integrity
// ---------------------------------------------------------------------------

describe('Codex Agent Skills — data integrity', () => {
  it('should handle a skill with no optional fields', () => {
    const minimal = `---
name: my-skill
description: Does something useful.
---
Instructions here.
`;
    const canonical = fromCodex(minimal, { id: 'my-skill', name: 'my-skill', version: '1.0.0', author: 'test' });
    const result = toCodex(canonical);

    expect(result.content).toContain('name: my-skill');
    expect(result.content).not.toContain('license:');
    expect(result.content).not.toContain('compatibility:');
    expect(result.content).not.toContain('allowed-tools:');
    expect(result.lossyConversion).toBe(false);
  });

  it('should warn and flag lossy conversion when persona section present', () => {
    const pkg = makeSkillCanonical({
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          { type: 'metadata', data: { title: 'Test', description: 'Test.' } },
          { type: 'persona', data: { role: 'Expert developer' } },
          { type: 'instructions', title: 'Instructions', content: 'Do things.' },
        ],
      },
    });

    const result = toCodex(pkg);

    expect(result.warnings?.some(w => w.includes('Persona section skipped'))).toBe(true);
    expect(result.lossyConversion).toBe(true);
    expect(result.qualityScore).toBeLessThan(100);
  });

  it('should preserve custom metadata key-value pairs', () => {
    const pkg = makeSkillCanonical({
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'metadata',
            data: {
              title: 'Test',
              description: 'Test.',
              agentSkills: {
                name: 'typescript-expert',
                metadata: { team: 'platform', channel: 'typescript' },
              },
            },
          },
        ],
      },
    });

    const result = toCodex(pkg);

    expect(result.content).toContain('metadata:');
    expect(result.content).toContain('platform');
    expect(result.content).toContain('channel');
  });
});
