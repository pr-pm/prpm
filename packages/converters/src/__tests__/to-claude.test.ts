/**
 * Tests for Claude format converter
 */

import { describe, it, expect } from 'vitest';
import { toClaude, isClaudeFormat, parseFrontmatter } from '../to-claude.js';
import {
  sampleCanonicalPackage,
  minimalCanonicalPackage,
  normalizeWhitespace,
} from './setup.js';

describe('toClaude', () => {
  describe('basic conversion', () => {
    it('should convert canonical to claude format', () => {
      const result = toClaude(sampleCanonicalPackage);

      expect(result.format).toBe('claude');
      expect(result.content).toBeTruthy();
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should include frontmatter', () => {
      const result = toClaude(sampleCanonicalPackage);

      expect(result.content).toMatch(/^---\n/);
      expect(result.content).toContain('name: Test Package'); // Uses pkg.name, not metadata.title
      expect(result.content).toContain('description: A test agent for conversion testing');
      expect(result.content).toContain('allowed-tools: Read, Write, Bash, WebSearch');
    });

    it('should include main title', () => {
      const result = toClaude(sampleCanonicalPackage);

      expect(result.content).toContain('# 🧪 Test Agent');
    });

    it('should handle minimal package', () => {
      const result = toClaude(minimalCanonicalPackage);

      expect(result.content).toContain('---');
      expect(result.content).toContain('name: Minimal Package'); // Uses pkg.name, not metadata.title
      expect(result.qualityScore).toBe(100);
    });
  });

  describe('section conversion', () => {
    it('should convert persona to claude style', () => {
      const result = toClaude(sampleCanonicalPackage);

      expect(result.content).toContain('You are TestBot, Testing Assistant.');
      expect(result.content).toContain(
        'Your communication style is precise, thorough, helpful.'
      );
      expect(result.content).toContain('Your areas of expertise include:');
      expect(result.content).toContain('- unit testing');
      expect(result.content).toContain('- integration testing');
    });

    it('should convert instructions section', () => {
      const result = toClaude(sampleCanonicalPackage);

      expect(result.content).toContain('## Core Principles');
      expect(result.content).toContain('**IMPORTANT:**');
      expect(result.content).toContain('Always write comprehensive tests');
    });

    it('should convert rules section', () => {
      const result = toClaude(sampleCanonicalPackage);

      expect(result.content).toContain('## Testing Guidelines');
      expect(result.content).toContain('1. Write tests before code (TDD)');
      expect(result.content).toContain(
        '*Ensures better design and prevents bugs*'
      );
    });

    it('should convert examples section', () => {
      const result = toClaude(sampleCanonicalPackage);

      expect(result.content).toContain('## Code Examples');
      expect(result.content).toContain('### ✓ Good test structure');
      expect(result.content).toContain('```typescript');
      expect(result.content).toContain('### ❌ Incorrect: Missing assertions');
    });

    it('should convert context section', () => {
      const result = toClaude(sampleCanonicalPackage);

      expect(result.content).toContain('## Background');
      expect(result.content).toContain(
        'This agent was created to assist with testing tasks'
      );
    });
  });

  describe('frontmatter generation', () => {
    it('should include tools in frontmatter', () => {
      const result = toClaude(sampleCanonicalPackage);

      expect(result.content).toContain('tools: Read, Write, Bash, WebSearch');
    });

    it('should handle package without tools', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: minimalCanonicalPackage.content.sections.filter(
            s => s.type !== 'tools'
          ),
        },
      };

      const result = toClaude(pkg);

      expect(result.content).not.toContain('tools:');
    });

    it('should handle package without icon', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            {
              type: 'metadata' as const,
              data: {
                title: 'No Icon',
                description: 'Test without icon',
              },
            },
          ],
        },
      };

      const result = toClaude(pkg);

      expect(result.content).not.toContain('icon:');
    });
  });

  describe('persona conversion', () => {
    it('should handle persona without name', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            {
              type: 'metadata' as const,
              data: { title: 'Test', description: 'Test' },
            },
            {
              type: 'persona' as const,
              data: {
                role: 'Test Assistant',
                style: ['helpful'],
              },
            },
          ],
        },
      };

      const result = toClaude(pkg);

      expect(result.content).toContain('You are Test Assistant.');
      expect(result.content).not.toContain('undefined');
    });

    it('should handle persona without style', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            {
              type: 'metadata' as const,
              data: { title: 'Test', description: 'Test' },
            },
            {
              type: 'persona' as const,
              data: {
                name: 'Bot',
                role: 'Assistant',
              },
            },
          ],
        },
      };

      const result = toClaude(pkg);

      expect(result.content).toContain('You are Bot, Assistant.');
      expect(result.content).not.toContain('Your communication style');
    });
  });

  describe('edge cases', () => {
    it('should skip custom cursor-specific section', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'custom' as const,
              editorType: 'cursor' as const,
              content: 'Cursor-only content',
            },
          ],
        },
      };

      const result = toClaude(pkg);

      expect(result.content).not.toContain('Cursor-only content');
      expect(result.warnings).toContain('Custom cursor section skipped');
    });

    it('should include custom claude-specific section', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'custom' as const,
              editorType: 'claude' as const,
              content: '## Custom Claude Feature\n\nClaude-specific content',
            },
          ],
        },
      };

      const result = toClaude(pkg);

      expect(result.content).toContain('## Custom Claude Feature');
      expect(result.content).toContain('Claude-specific content');
    });
  });

  describe('quality scoring', () => {
    it('should have quality score of 100 with no warnings', () => {
      const result = toClaude(minimalCanonicalPackage);

      expect(result.qualityScore).toBe(100);
      expect(result.lossyConversion).toBe(false);
    });

    it('should reduce quality score for skipped sections', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'custom' as const,
              editorType: 'cursor' as const,
              content: 'Cursor content',
            },
          ],
        },
      };

      const result = toClaude(pkg);

      expect(result.qualityScore).toBeLessThan(100);
      expect(result.lossyConversion).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle conversion errors gracefully', () => {
      // Create package with content that will cause an actual error during conversion
      const invalidPkg = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical' as const,
          version: '1.0' as const,
          sections: null as any, // This will cause an error when trying to iterate
        },
      };

      const result = toClaude(invalidPkg);

      expect(result.qualityScore).toBe(0);
      expect(result.lossyConversion).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      expect(result.warnings![0]).toContain('Conversion error');
    });
  });
});

describe('isClaudeFormat', () => {
  it('should detect claude format with frontmatter', () => {
    const claudeContent = '---\nname: test\ndescription: Test\n---\n\n# Content';

    expect(isClaudeFormat(claudeContent)).toBe(true);
  });

  it('should reject content without frontmatter', () => {
    const cursorContent = '# Title\n\nContent';

    expect(isClaudeFormat(cursorContent)).toBe(false);
  });

  it('should reject frontmatter without name', () => {
    const content = '---\ndescription: Test\n---\n\n# Content';

    expect(isClaudeFormat(content)).toBe(false);
  });
});

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter', () => {
    const content = '---\nname: test\ndescription: A test\ntools: Read, Write\n---\n\n# Body content';

    const result = parseFrontmatter(content);

    expect(result.frontmatter.name).toBe('test');
    expect(result.frontmatter.description).toBe('A test');
    expect(result.frontmatter.tools).toBe('Read, Write');
    expect(result.body).toContain('# Body content');
  });

  it('should handle content without frontmatter', () => {
    const content = '# Just content';

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe(content);
  });

  it('should handle empty frontmatter', () => {
    const content = '---\n---\n\n# Content';

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({});
    expect(result.body).toContain('# Content');
  });

  it('should ignore lines without colons', () => {
    const content = '---\nname: test\ninvalid line\ndescription: desc\n---\n\nBody';

    const result = parseFrontmatter(content);

    expect(result.frontmatter.name).toBe('test');
    expect(result.frontmatter.description).toBe('desc');
    expect(result.frontmatter.invalid).toBeUndefined();
  });
});
