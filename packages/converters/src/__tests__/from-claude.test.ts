/**
 * Tests for Claude format parser
 */

import { describe, it, expect } from 'vitest';
import { fromClaude } from '../from-claude.js';
import { sampleClaudeAgent } from './setup.js';

describe('fromClaude', () => {
  const metadata = {
    id: 'test-agent',
    version: '1.0.0',
    author: 'testauthor',
    tags: ['test', 'analyst'],
  };

  describe('frontmatter parsing', () => {
    it('should parse frontmatter correctly', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      expect(result.name).toBe('analyst');
      expect(result.description).toContain('Strategic analyst');
    });

    it('should extract tools from frontmatter', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const toolsSection = result.content.sections.find(s => s.type === 'tools');
      expect(toolsSection).toBeDefined();
      expect(toolsSection?.type).toBe('tools');
      if (toolsSection?.type === 'tools') {
        expect(toolsSection.tools).toContain('Read');
        expect(toolsSection.tools).toContain('Write');
        expect(toolsSection.tools).toContain('WebSearch');
      }
    });

    it('should extract icon from frontmatter', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const metadataSection = result.content.sections.find(
        s => s.type === 'metadata'
      );
      expect(metadataSection?.type).toBe('metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.icon).toBe('📊');
      }
    });

    it('should extract model field from frontmatter', () => {
      const agentWithModel = `---
name: test-agent
description: Test agent with model
model: opus
---

# Test Agent`;

      const result = fromClaude(agentWithModel, metadata);

      const metadataSection = result.content.sections.find(
        s => s.type === 'metadata'
      );
      expect(metadataSection?.type).toBe('metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.claudeAgent?.model).toBe('opus');
      }
    });

    it('should handle agents without model field', () => {
      const agentWithoutModel = `---
name: test-agent
description: Test agent without model
---

# Test Agent`;

      const result = fromClaude(agentWithoutModel, metadata);

      const metadataSection = result.content.sections.find(
        s => s.type === 'metadata'
      );
      expect(metadataSection?.type).toBe('metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.claudeAgent).toBeUndefined();
      }
    });
  });

  describe('persona parsing', () => {
    it('should parse persona from preamble', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const personaSection = result.content.sections.find(
        s => s.type === 'persona'
      );
      expect(personaSection).toBeDefined();
      expect(personaSection?.type).toBe('persona');
      if (personaSection?.type === 'persona') {
        expect(personaSection.data.role).toContain('business analyst');
      }
    });

    it('should extract style from persona', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const personaSection = result.content.sections.find(
        s => s.type === 'persona'
      );
      if (personaSection?.type === 'persona') {
        expect(personaSection.data.style).toBeDefined();
        expect(personaSection.data.style).toContain('analytical');
        expect(personaSection.data.style).toContain('creative');
      }
    });

    it('should extract expertise areas', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const personaSection = result.content.sections.find(
        s => s.type === 'persona'
      );
      if (personaSection?.type === 'persona') {
        expect(personaSection.data.expertise).toBeDefined();
        expect(personaSection.data.expertise).toContain('Market research and analysis');
      }
    });
  });

  describe('section detection', () => {
    it('should detect instructions sections', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      // Core Principles is detected as a rules section due to its bulleted structure
      const principlesSection = result.content.sections.find(
        s => s.type === 'rules' && s.title === 'Core Principles'
      );
      expect(principlesSection).toBeDefined();
      if (principlesSection?.type === 'rules') {
        expect(principlesSection.items.some(item =>
          item.content.includes('verifiable data') || item.content.includes('Objective')
        )).toBe(true);
      }
    });

    it('should detect rules sections', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const rulesSection = result.content.sections.find(
        s => s.type === 'rules' && s.title === 'Core Principles'
      );
      // The sample has bullet points in Core Principles
      expect(rulesSection).toBeDefined();
    });

    it('should detect examples sections', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const examplesSection = result.content.sections.find(
        s => s.type === 'examples'
      );
      expect(examplesSection).toBeDefined();
      if (examplesSection?.type === 'examples') {
        expect(examplesSection.examples.length).toBeGreaterThan(0);
      }
    });

    it('should detect context sections', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const contextSection = result.content.sections.find(
        s => s.type === 'context' && s.title === 'Background'
      );
      expect(contextSection).toBeDefined();
    });
  });

  describe('rules parsing', () => {
    it('should parse bulleted rules', () => {
      const content = `---
name: test
---

## Guidelines

- First rule
- Second rule
- Third rule
`;

      const result = fromClaude(content, metadata);

      const rulesSection = result.content.sections.find(s => s.type === 'rules');
      expect(rulesSection).toBeDefined();
      if (rulesSection?.type === 'rules') {
        expect(rulesSection.items.length).toBe(3);
        expect(rulesSection.items[0].content).toBe('First rule');
      }
    });

    it('should parse numbered rules', () => {
      const content = `---
name: test
---

## Guidelines

1. First rule
2. Second rule
3. Third rule
`;

      const result = fromClaude(content, metadata);

      const rulesSection = result.content.sections.find(s => s.type === 'rules');
      expect(rulesSection).toBeDefined();
      if (rulesSection?.type === 'rules') {
        expect(rulesSection.items.length).toBe(3);
      }
    });

    it('should parse rules with rationale', () => {
      const content = `---
name: test
---

## Guidelines

- Use TypeScript
  *Rationale: Better type safety*
`;

      const result = fromClaude(content, metadata);

      const rulesSection = result.content.sections.find(s => s.type === 'rules');
      if (rulesSection?.type === 'rules') {
        expect(rulesSection.items[0].content).toBe('Use TypeScript');
        expect(rulesSection.items[0].rationale).toBe('Better type safety');
      }
    });

    it('should parse rules with examples', () => {
      const content = `---
name: test
---

## Guidelines

- Use const
  Example: \`const x = 1;\`
`;

      const result = fromClaude(content, metadata);

      const rulesSection = result.content.sections.find(s => s.type === 'rules');
      if (rulesSection?.type === 'rules') {
        expect(rulesSection.items[0].examples).toBeDefined();
        expect(rulesSection.items[0].examples![0]).toContain('const x = 1;');
      }
    });
  });

  describe('examples parsing', () => {
    it('should parse good examples', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const examplesSection = result.content.sections.find(
        s => s.type === 'examples'
      );
      if (examplesSection?.type === 'examples') {
        const goodExample = examplesSection.examples.find(e => e.good === true);
        expect(goodExample).toBeDefined();
        expect(goodExample?.description).toContain('Good research approach');
      }
    });

    it('should parse bad examples', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const examplesSection = result.content.sections.find(
        s => s.type === 'examples'
      );
      if (examplesSection?.type === 'examples') {
        const badExample = examplesSection.examples.find(e => e.good === false);
        expect(badExample).toBeDefined();
        expect(badExample?.description).toContain('Skipping validation');
      }
    });

    it('should extract code from examples', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      const examplesSection = result.content.sections.find(
        s => s.type === 'examples'
      );
      if (examplesSection?.type === 'examples') {
        const example = examplesSection.examples[0];
        expect(example.code).toBeTruthy();
        expect(example.language).toBe('markdown');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle content without frontmatter', () => {
      const content = `# Test Agent

You are a test agent.

## Instructions

Follow these guidelines.
`;

      const result = fromClaude(content, metadata);

      expect(result.id).toBe(metadata.id);
      expect(result.content.sections.length).toBeGreaterThan(0);
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---

# Content
`;

      const result = fromClaude(content, metadata);

      expect(result.id).toBe(metadata.id);
      expect(result.name).toBe(metadata.id);
    });

    it('should handle content without sections', () => {
      const content = `---
name: test
---

Just some plain text.
`;

      const result = fromClaude(content, metadata);

      const instructionsSection = result.content.sections.find(
        s => s.type === 'instructions'
      );
      expect(instructionsSection).toBeDefined();
    });

    it('should handle sections without content', () => {
      const content = `---
name: test
---

## Empty Section

## Another Empty Section
`;

      const result = fromClaude(content, metadata);

      expect(result.content.sections.length).toBeGreaterThan(0);
    });
  });

  describe('metadata extraction', () => {
    it('should use frontmatter name over metadata id', () => {
      const content = `---
name: custom-name
---

# Agent
`;

      const result = fromClaude(content, metadata);

      expect(result.name).toBe('custom-name');
    });

    it('should fallback to metadata id if no frontmatter name', () => {
      const content = `---
description: Test
---

# Agent
`;

      const result = fromClaude(content, metadata);

      expect(result.name).toBe(metadata.id);
    });

    it('should set sourceFormat to claude', () => {
      const result = fromClaude(sampleClaudeAgent, metadata);

      expect(result.sourceFormat).toBe('claude');
    });

    it('should set type to agent when explicitly provided', () => {
      // Subtype should be determined from file path context by the CLI
      const result = fromClaude(sampleClaudeAgent, metadata, 'claude', 'agent');

      expect(result.format).toBe('claude');
      expect(result.subtype).toBe('agent');
    });

    it('should default to rule when no explicit subtype', () => {
      // Without explicit subtype, defaults to 'rule'
      const result = fromClaude(sampleClaudeAgent, metadata);

      expect(result.format).toBe('claude');
      expect(result.subtype).toBe('rule');
    });
  });

  describe('Agent Skills frontmatter preservation (for codex conversion)', () => {
    const skillMetadata = { id: 'self-improving', name: 'self-improving', version: '1.0.0', author: 'prpm' };

    const claudeSkillContent = `---
name: self-improving
description: Searches PRPM registry for relevant expertise packages.
license: MIT
compatibility: Designed for Claude Code
allowed-tools: Read, Write, Bash
metadata:
  author: prpm
  version: "1.1.0"
---

# Self-Improving with PRPM

Automatically search and install PRPM packages.
`;

    it('should store agentSkills metadata for skill subtype', () => {
      const result = fromClaude(claudeSkillContent, skillMetadata, 'claude', 'skill');

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection?.type).toBe('metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.agentSkills).toBeDefined();
        expect(metadataSection.data.agentSkills?.name).toBe('self-improving');
      }
    });

    it('should normalize allowed-tools from comma-separated to space-delimited', () => {
      // Agent Skills spec requires space-delimited; Claude frontmatter uses comma-separated
      const result = fromClaude(claudeSkillContent, skillMetadata, 'claude', 'skill');

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.agentSkills?.allowedTools).toBe('Read Write Bash');
        expect(metadataSection.data.agentSkills?.allowedTools).not.toContain(',');
      }
    });

    it('should preserve license and compatibility fields', () => {
      const result = fromClaude(claudeSkillContent, skillMetadata, 'claude', 'skill');

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.agentSkills?.license).toBe('MIT');
        expect(metadataSection.data.agentSkills?.compatibility).toBe('Designed for Claude Code');
      }
    });

    it('should guard against non-object metadata field', () => {
      const contentWithStringMetadata = `---
name: my-skill
description: A skill.
metadata: "this is a string not an object"
---
Content.
`;
      expect(() => fromClaude(contentWithStringMetadata, skillMetadata, 'claude', 'skill')).not.toThrow();

      const result = fromClaude(contentWithStringMetadata, skillMetadata, 'claude', 'skill');
      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.agentSkills?.metadata).toBeUndefined();
      }
    });

    it('should not set agentSkills for non-skill subtypes', () => {
      const result = fromClaude(claudeSkillContent, skillMetadata, 'claude', 'agent');

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.agentSkills).toBeUndefined();
      }
    });

    it('should produce correct name in codex SKILL.md when converted via toCodex', async () => {
      // Regression: H1 title "Self-Improving with PRPM" was used as skill name
      // instead of the frontmatter name "self-improving"
      const { toCodex } = await import('../to-codex.js');

      const canonical = fromClaude(claudeSkillContent, skillMetadata, 'claude', 'skill');
      const result = toCodex(canonical);

      expect(result.content).toContain('name: self-improving');
      expect(result.content).not.toContain('name: self-improving-with-prpm');
    });
  });
});
