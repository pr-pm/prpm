/**
 * Tests for Claude agent configuration
 */

import { hasClaudeHeader, applyClaudeConfig, parseClaudeFrontmatter } from '../claude-config';

describe('claude-config', () => {
  describe('hasClaudeHeader', () => {
    it('should detect Claude agent YAML frontmatter', () => {
      const content = `---
name: test-agent
description: Test agent
---

# Test Agent`;
      expect(hasClaudeHeader(content)).toBe(true);
    });

    it('should return false for content without frontmatter', () => {
      const content = '# Test Agent\n\nNo frontmatter here';
      expect(hasClaudeHeader(content)).toBe(false);
    });

    it('should return false for frontmatter without name field', () => {
      const content = `---
description: Test agent
---

# Test Agent`;
      expect(hasClaudeHeader(content)).toBe(false);
    });
  });

  describe('parseClaudeFrontmatter', () => {
    it('should parse frontmatter and body', () => {
      const content = `---
name: test-agent
description: A test agent
tools: Read, Write
---

# Test Agent

Body content here`;

      const result = parseClaudeFrontmatter(content);
      expect(result.frontmatter).toEqual({
        name: 'test-agent',
        description: 'A test agent',
        tools: 'Read, Write',
      });
      expect(result.body).toBe('\n# Test Agent\n\nBody content here');
    });

    it('should handle content without frontmatter', () => {
      const content = '# Test\n\nNo frontmatter';
      const result = parseClaudeFrontmatter(content);
      expect(result.frontmatter).toEqual({});
      expect(result.body).toBe(content);
    });
  });

  describe('applyClaudeConfig', () => {
    it('should add model field when config specifies it', () => {
      const content = `---
name: test-agent
description: A test agent
---

# Test Agent`;

      const result = applyClaudeConfig(content, { model: 'opus' });
      expect(result).toContain('model: opus');
    });

    it('should override tools field', () => {
      const content = `---
name: test-agent
description: A test agent
tools: Read, Write
---

# Test Agent`;

      const result = applyClaudeConfig(content, { tools: 'Read, Grep, Bash' });
      expect(result).toContain('tools: Read, Grep, Bash');
      expect(result).not.toContain('tools: Read, Write');
    });

    it('should add tools field when not present', () => {
      const content = `---
name: test-agent
description: A test agent
---

# Test Agent`;

      const result = applyClaudeConfig(content, { tools: 'Read, Write' });
      expect(result).toContain('tools: Read, Write');
    });

    it('should apply both tools and model', () => {
      const content = `---
name: test-agent
description: A test agent
---

# Test Agent`;

      const result = applyClaudeConfig(content, {
        tools: 'Read, Grep',
        model: 'haiku',
      });
      expect(result).toContain('tools: Read, Grep');
      expect(result).toContain('model: haiku');
    });

    it('should preserve field order (required fields first)', () => {
      const content = `---
name: test-agent
description: A test agent
tools: Read
---

# Test Agent`;

      const result = applyClaudeConfig(content, { model: 'sonnet' });
      const lines = result.split('\n');

      // Find indices
      const nameIndex = lines.findIndex(l => l.startsWith('name:'));
      const descIndex = lines.findIndex(l => l.startsWith('description:'));
      const toolsIndex = lines.findIndex(l => l.startsWith('tools:'));
      const modelIndex = lines.findIndex(l => l.startsWith('model:'));

      // Required fields should come first
      expect(nameIndex).toBeLessThan(descIndex);
      expect(descIndex).toBeLessThan(toolsIndex);
      expect(toolsIndex).toBeLessThan(modelIndex);
    });

    it('should preserve body content unchanged', () => {
      const content = `---
name: test-agent
description: A test agent
---

# Test Agent

This is the body content.
It has multiple lines.`;

      const result = applyClaudeConfig(content, { model: 'opus' });
      expect(result).toContain('# Test Agent');
      expect(result).toContain('This is the body content.');
      expect(result).toContain('It has multiple lines.');
    });

    it('should handle empty config (no changes)', () => {
      const content = `---
name: test-agent
description: A test agent
tools: Read, Write
---

# Test Agent`;

      const result = applyClaudeConfig(content, {});
      expect(result).toBe(content);
    });

    it('should return unchanged content if no frontmatter', () => {
      const content = '# Test\n\nNo frontmatter';
      const result = applyClaudeConfig(content, { model: 'opus' });
      expect(result).toBe(content);
    });

    it('should handle all valid model values', () => {
      const content = `---
name: test-agent
description: A test agent
---

# Test Agent`;

      const models: Array<'sonnet' | 'opus' | 'haiku' | 'inherit'> = [
        'sonnet',
        'opus',
        'haiku',
        'inherit',
      ];

      for (const model of models) {
        const result = applyClaudeConfig(content, { model });
        expect(result).toContain(`model: ${model}`);
      }
    });
  });
});
