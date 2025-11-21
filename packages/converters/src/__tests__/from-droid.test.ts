import { describe, it, expect } from 'vitest';
import { fromDroid } from '../from-droid.js';

describe('fromDroid', () => {
  it('should convert Factory Droid skill to canonical format', () => {
    const droidContent = `---
name: summarize-diff
description: Summarize the staged git diff in 3–5 bullets
---

# Summarize Git Diff

## Instructions
1. Run \`git diff --staged\`
2. Analyze the changes
3. Create 3-5 bullet points summarizing the changes
4. Focus on what changed and why`;

    const result = fromDroid(droidContent, {
      id: 'test-skill',
      name: 'test-skill',
      version: '1.0.0',
      author: 'test-author',
    });

    expect(result.format).toBe('droid');
    expect(result.subtype).toBe('skill');
    expect(result.content.format).toBe('canonical');
    expect(result.content.version).toBe('1.0');

    const metadata = result.content.sections.find(s => s.type === 'metadata');
    expect(metadata).toBeDefined();
    expect(metadata?.type).toBe('metadata');
    if (metadata?.type === 'metadata') {
      expect(metadata.data.title).toBe('summarize-diff');
      expect(metadata.data.description).toBe('Summarize the staged git diff in 3–5 bullets');
    }

    const instructions = result.content.sections.find(s => s.type === 'instructions');
    expect(instructions).toBeDefined();
    expect(instructions?.type).toBe('instructions');
    if (instructions?.type === 'instructions') {
      expect(instructions.content).toContain('Summarize Git Diff');
      expect(instructions.content).toContain('Run `git diff --staged`');
    }
  });

  it('should convert Factory Droid slash command to canonical format', () => {
    const droidContent = `---
name: code-review
description: Review code for best practices
argument-hint: <file-path>
---

Review the specified file for:
- Code quality
- Best practices
- Security issues
- Performance concerns`;

    const result = fromDroid(droidContent, {
      id: 'test-command',
      name: 'test-command',
      version: '1.0.0',
      author: 'test-author',
    });

    expect(result.format).toBe('droid');
    expect(result.subtype).toBe('slash-command');

    const metadata = result.content.sections.find(s => s.type === 'metadata');
    if (metadata?.type === 'metadata') {
      expect(metadata.data.droid?.argumentHint).toBe('<file-path>');
    }

    expect(result.metadata?.droid?.argumentHint).toBe('<file-path>');
  });

  it('should preserve allowed-tools metadata for roundtrip conversion', () => {
    const droidContent = `---
name: file-analyzer
description: Analyze file structure and dependencies
allowed-tools:
  - Read
  - Grep
  - Bash
---

Analyze the project structure and dependencies.`;

    const result = fromDroid(droidContent, {
      id: 'test-analyzer',
      name: 'test-analyzer',
      version: '1.0.0',
      author: 'test-author',
    });

    const metadata = result.content.sections.find(s => s.type === 'metadata');
    if (metadata?.type === 'metadata') {
      expect(metadata.data.droid?.allowedTools).toEqual(['Read', 'Grep', 'Bash']);
    }

    expect(result.metadata?.droid?.allowedTools).toEqual(['Read', 'Grep', 'Bash']);
  });

  it('should handle skill without frontmatter', () => {
    const droidContent = `Just some instructions without frontmatter.`;

    const result = fromDroid(droidContent, {
      id: 'simple-skill',
      name: 'simple-skill',
      version: '1.0.0',
      author: 'test-author',
    });

    expect(result.format).toBe('droid');
    expect(result.subtype).toBe('skill'); // Default subtype

    const instructions = result.content.sections.find(s => s.type === 'instructions');
    expect(instructions).toBeDefined();
    if (instructions?.type === 'instructions') {
      expect(instructions.content).toBe('Just some instructions without frontmatter.');
    }
  });

  it('should detect hook subtype from content patterns', () => {
    const droidContent = `---
name: pre-tool-use-hook
description: Validate before tool execution
---

This hook validates tool execution before running.

Handle the following events:
- Pre Tool Use
- Post Tool Use
- Session Start`;

    const result = fromDroid(droidContent, {
      id: 'validation-hook',
      name: 'validation-hook',
      version: '1.0.0',
      author: 'test-author',
    });

    expect(result.format).toBe('droid');
    expect(result.subtype).toBe('hook');
  });

  it('should use explicit subtype from metadata when provided', () => {
    const droidContent = `---
name: test-skill
description: A test skill
---

Some content.`;

    const result = fromDroid(droidContent, {
      id: 'test',
      name: 'test',
      version: '1.0.0',
      author: 'test-author',
      subtype: 'hook', // Explicitly specify as hook
    } as any);

    expect(result.subtype).toBe('hook');
  });
});
