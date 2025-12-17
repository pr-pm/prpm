/**
 * Tests for OpenCode format parser (fromOpencode)
 */

import { describe, it, expect } from 'vitest';
import { fromOpencode } from '../from-opencode.js';

const baseMetadata = {
  id: 'test-package',
  name: 'Test Package',
  version: '1.0.0',
  author: 'testauthor',
};

describe('fromOpencode', () => {
  describe('agent detection', () => {
    it('should detect agent subtype when no template field present', () => {
      const content = `---
description: A helpful code review agent
mode: subagent
model: anthropic/claude-sonnet-4
---

# Code Reviewer

You are an expert code reviewer.

## Instructions

- Check for bugs
- Suggest improvements
`;

      const result = fromOpencode(content, baseMetadata);

      expect(result.subtype).toBe('agent');
      expect(result.format).toBe('opencode');
    });

    it('should preserve agent-specific fields for roundtrip', () => {
      const content = `---
description: Expert assistant
mode: primary
model: anthropic/claude-opus-4
temperature: 0.2
disable: false
permission:
  edit: ask
  bash: deny
---

# Expert Agent

Expert instructions here.
`;

      const result = fromOpencode(content, baseMetadata);

      expect(result.subtype).toBe('agent');
      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection?.type).toBe('metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.opencode).toEqual({
          mode: 'primary',
          model: 'anthropic/claude-opus-4',
          temperature: 0.2,
          permission: { edit: 'ask', bash: 'deny' },
          disable: false,
        });
      }
    });

    it('should convert tools from OpenCode format', () => {
      const content = `---
description: Agent with tools
mode: all
tools:
  read: true
  write: true
  bash: false
  websearch: true
---

# Tool Agent

Has specific tools enabled.
`;

      const result = fromOpencode(content, baseMetadata);

      const toolsSection = result.content.sections.find(s => s.type === 'tools');
      expect(toolsSection?.type).toBe('tools');
      if (toolsSection?.type === 'tools') {
        expect(toolsSection.tools).toContain('Read');
        expect(toolsSection.tools).toContain('Write');
        expect(toolsSection.tools).toContain('WebSearch');
        expect(toolsSection.tools).not.toContain('Bash');
      }
    });
  });

  describe('slash-command detection', () => {
    it('should detect slash-command subtype when template field present', () => {
      const content = `---
template: Run tests for $1 and report results
description: Execute tests for a file
---

# Test Runner

Runs tests for specified files.
`;

      const result = fromOpencode(content, baseMetadata);

      expect(result.subtype).toBe('slash-command');
      expect(result.format).toBe('opencode');
    });

    it('should preserve slash-command specific fields for roundtrip', () => {
      const content = `---
template: "Deploy $1 to $2 environment"
description: Deploy application
agent: deploy-agent
model: anthropic/claude-sonnet-4
subtask: true
---

# Deploy Command

Deploys the application.
`;

      const result = fromOpencode(content, baseMetadata);

      expect(result.subtype).toBe('slash-command');
      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection?.type).toBe('metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.opencodeSlashCommand).toEqual({
          template: 'Deploy $1 to $2 environment',
          description: 'Deploy application',
          agent: 'deploy-agent',
          model: 'anthropic/claude-sonnet-4',
          subtask: true,
        });
      }
    });

    it('should handle template with complex placeholders', () => {
      const content = `---
template: |
  Search for $ARGUMENTS in the codebase.
  Include files matching: @$1
  Exclude: $2
description: Search code
---

# Code Search

Search the codebase.
`;

      const result = fromOpencode(content, baseMetadata);

      expect(result.subtype).toBe('slash-command');
      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.opencodeSlashCommand?.template).toContain('$ARGUMENTS');
        expect(metadataSection.data.opencodeSlashCommand?.template).toContain('@$1');
      }
    });

    it('should detect slash-command even with minimal frontmatter', () => {
      const content = `---
template: Hello $1
---

# Greeting

Says hello.
`;

      const result = fromOpencode(content, baseMetadata);

      expect(result.subtype).toBe('slash-command');
    });

    it('should treat empty string template as agent (not slash-command)', () => {
      const content = `---
template: ""
description: Agent with empty template field
mode: all
---

# Agent
`;

      const result = fromOpencode(content, baseMetadata);

      expect(result.subtype).toBe('agent');
    });

    it('should treat whitespace-only template as agent (not slash-command)', () => {
      const content = `---
template: "   "
description: Agent with whitespace template
mode: subagent
---

# Agent
`;

      const result = fromOpencode(content, baseMetadata);

      expect(result.subtype).toBe('agent');
    });
  });

  describe('content parsing', () => {
    it('should extract body as instructions section', () => {
      const content = `---
description: Test agent
mode: all
---

# Test Agent

This is the main content.

## Section One

Some instructions here.

## Section Two

More instructions.
`;

      const result = fromOpencode(content, baseMetadata);

      const instructionsSection = result.content.sections.find(s => s.type === 'instructions');
      expect(instructionsSection?.type).toBe('instructions');
      if (instructionsSection?.type === 'instructions') {
        expect(instructionsSection.content).toContain('This is the main content');
        expect(instructionsSection.content).toContain('## Section One');
        expect(instructionsSection.content).toContain('## Section Two');
      }
    });

    it('should handle empty body', () => {
      const content = `---
description: Empty agent
mode: subagent
---
`;

      const result = fromOpencode(content, baseMetadata);

      const instructionsSection = result.content.sections.find(s => s.type === 'instructions');
      expect(instructionsSection).toBeUndefined();
    });

    it('should handle content without frontmatter', () => {
      const content = `# Just Markdown

No frontmatter here, just plain markdown content.
`;

      const result = fromOpencode(content, baseMetadata);

      // Should still work, defaulting to agent
      expect(result.subtype).toBe('agent');
      const instructionsSection = result.content.sections.find(s => s.type === 'instructions');
      if (instructionsSection?.type === 'instructions') {
        expect(instructionsSection.content).toContain('Just Markdown');
      }
    });
  });

  describe('metadata extraction', () => {
    it('should use description from frontmatter', () => {
      const content = `---
description: A very detailed description of this agent
mode: all
---

# Agent
`;

      const result = fromOpencode(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.description).toBe('A very detailed description of this agent');
      }
    });

    it('should fallback to package metadata description', () => {
      const content = `---
mode: all
---

# Agent
`;

      const result = fromOpencode(content, {
        ...baseMetadata,
        description: 'Fallback description',
      });

      expect(result.description).toBe('Fallback description');
    });

    it('should preserve package metadata in result', () => {
      const content = `---
description: Test
mode: all
---

# Test
`;

      const result = fromOpencode(content, {
        ...baseMetadata,
        tags: ['test', 'example'],
      });

      expect(result.id).toBe('test-package');
      expect(result.name).toBe('Test Package');
      expect(result.version).toBe('1.0.0');
      expect(result.author).toBe('testauthor');
      expect(result.tags).toEqual(['test', 'example']);
    });
  });

  describe('edge cases', () => {
    it('should handle mode: all (default)', () => {
      const content = `---
description: Default mode agent
mode: all
---

# Agent
`;

      const result = fromOpencode(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.opencode?.mode).toBe('all');
      }
    });

    it('should handle mode: primary', () => {
      const content = `---
description: Primary agent
mode: primary
---

# Agent
`;

      const result = fromOpencode(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.opencode?.mode).toBe('primary');
      }
    });

    it('should handle mode: subagent', () => {
      const content = `---
description: Subagent
mode: subagent
---

# Agent
`;

      const result = fromOpencode(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.opencode?.mode).toBe('subagent');
      }
    });

    it('should handle bash permission with per-command rules', () => {
      const content = `---
description: Bash controlled agent
mode: all
permission:
  bash:
    "git *": ask
    "npm *": allow
    "*": deny
---

# Agent
`;

      const result = fromOpencode(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.opencode?.permission?.bash).toEqual({
          'git *': 'ask',
          'npm *': 'allow',
          '*': 'deny',
        });
      }
    });
  });
});
