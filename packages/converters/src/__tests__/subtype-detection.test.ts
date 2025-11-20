/**
 * Comprehensive tests for subtype detection across all formats
 */

import { describe, it, expect } from 'vitest';
import { fromClaude } from '../from-claude.js';
import { fromCursor } from '../from-cursor.js';
import { fromContinue } from '../from-continue.js';

const metadata = {
  id: 'test-package',
  version: '1.0.0',
  author: 'test',
  tags: [],
};

describe('Subtype Detection', () => {
  describe('Claude Format', () => {
    it('should detect agent from explicit agentType field (backwards compat)', () => {
      const content = `---
name: test
description: Test agent
agentType: agent
---

# Test Agent`;

      const result = fromClaude(content, metadata);
      expect(result.subtype).toBe('agent');
    });

    it('should detect skill from explicit skillType field (backwards compat)', () => {
      const content = `---
name: test
description: Test skill
skillType: skill
---

# Test Skill`;

      const result = fromClaude(content, metadata);
      expect(result.subtype).toBe('skill');
    });

    it('should detect slash-command from explicit commandType field (backwards compat)', () => {
      const content = `---
name: test
description: Test command
commandType: slash-command
---

# Test Command`;

      const result = fromClaude(content, metadata);
      expect(result.subtype).toBe('slash-command');
    });

    it('should default to rule without explicit markers', () => {
      const content = `---
name: test
description: Test rule
allowed-tools: Read, Write
---

# Test Rule

You are a helpful assistant.`;

      const result = fromClaude(content, metadata);
      // Even with tools and persona, defaults to 'rule' without explicit subtype
      expect(result.subtype).toBe('rule');
    });

    it('should use explicit subtype parameter over detection', () => {
      const content = `---
name: test
description: Test
---

# Test`;

      const result = fromClaude(content, metadata, 'claude', 'agent');
      expect(result.subtype).toBe('agent');
    });

    it('should detect agent subtype from file path context', () => {
      // Simulating .claude/agents/test.md
      const content = `---
name: test-agent
description: Test agent
allowed-tools: Read, Write
---

# Test Agent`;

      const result = fromClaude(content, metadata, 'claude', 'agent');
      expect(result.subtype).toBe('agent');
      expect(result.format).toBe('claude');
    });

    it('should detect skill subtype from file path context', () => {
      // Simulating .claude/skills/test.md
      const content = `---
name: test-skill
description: Test skill
---

# Test Skill`;

      const result = fromClaude(content, metadata, 'claude', 'skill');
      expect(result.subtype).toBe('skill');
      expect(result.format).toBe('claude');
    });

    it('should detect slash-command subtype from file path context', () => {
      // Simulating .claude/commands/test.md
      const content = `---
name: test-command
description: Test command
---

# Test Command`;

      const result = fromClaude(content, metadata, 'claude', 'slash-command');
      expect(result.subtype).toBe('slash-command');
      expect(result.format).toBe('claude');
    });
  });

  describe('Cursor Format', () => {
    it('should detect agent from explicit agentType field (backwards compat)', () => {
      const content = `---
name: test
description: Test agent
agentType: agent
---

# Test Agent`;

      const result = fromCursor(content, metadata);
      expect(result.subtype).toBe('agent');
    });

    it('should detect slash-command from explicit commandType field (backwards compat)', () => {
      const content = `---
name: test
description: Test command
commandType: slash-command
---

# Test Command`;

      const result = fromCursor(content, metadata);
      expect(result.subtype).toBe('slash-command');
    });

    it('should default to rule without explicit markers', () => {
      const content = `---
description: "Test rule"
globs:
  - "**/*.ts"
alwaysApply: false
---

# Test Rule`;

      const result = fromCursor(content, metadata);
      expect(result.subtype).toBe('rule');
    });

    it('should detect agent subtype from file path context', () => {
      // Simulating .cursor/agents/test.md (if Cursor had agents)
      const content = `---
description: "Test agent"
---

# Test Agent`;

      const result = fromCursor(content, metadata, 'agent');
      expect(result.subtype).toBe('agent');
      expect(result.format).toBe('cursor');
    });

    it('should detect slash-command subtype from file path context', () => {
      // Simulating .cursor/commands/test.md
      const content = `# Test Command

Generate tests for the selected code.`;

      const result = fromCursor(content, metadata, 'slash-command');
      expect(result.subtype).toBe('slash-command');
      expect(result.format).toBe('cursor');
    });
  });

  describe('Continue Format', () => {
    it('should default to rule without explicit markers', () => {
      const content = `---
name: Test Rule
description: "Test rule"
globs: "**/*.ts"
---

# Test Rule`;

      const result = fromContinue(content, metadata);
      expect(result.subtype).toBe('rule');
    });

    it('should detect prompt subtype from file path context', () => {
      // Simulating .continue/prompts/test.md
      const content = `---
name: Test Prompt
description: "Test prompt"
---

# Test Prompt`;

      const result = fromContinue(content, metadata, 'prompt');
      expect(result.subtype).toBe('prompt');
      expect(result.format).toBe('continue');
    });

    it('should detect slash-command subtype from file path context', () => {
      // Simulating .continue/prompts/test.md (Continue calls them prompts, not slash-commands)
      const content = `---
name: Test Command
description: "Test slash command"
---

# Test Command`;

      const result = fromContinue(content, metadata, 'slash-command');
      expect(result.subtype).toBe('slash-command');
      expect(result.format).toBe('continue');
    });
  });

  describe('Explicit Subtype Priority', () => {
    it('should prioritize explicit subtype over frontmatter markers', () => {
      const content = `---
name: test
description: Test
agentType: agent
skillType: skill
---

# Test`;

      // Explicit subtype should override conflicting markers
      const result = fromClaude(content, metadata, 'claude', 'slash-command');
      expect(result.subtype).toBe('slash-command');
    });

    it('should use frontmatter markers when no explicit subtype provided', () => {
      const content = `---
name: test
description: Test
skillType: skill
---

# Test`;

      const result = fromClaude(content, metadata);
      expect(result.subtype).toBe('skill');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty frontmatter', () => {
      const content = `---
---

# Test`;

      const result = fromClaude(content, metadata);
      expect(result.subtype).toBe('rule');
    });

    it('should handle no frontmatter', () => {
      const content = `# Test

Just markdown content.`;

      const result = fromClaude(content, metadata);
      expect(result.subtype).toBe('rule');
    });

    it('should handle multiple type fields (first wins)', () => {
      const content = `---
name: test
description: Test
type: agent
skillType: skill
---

# Test`;

      const result = fromClaude(content, metadata);
      // type: agent is checked first
      expect(result.subtype).toBe('agent');
    });
  });
});
