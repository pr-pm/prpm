import { describe, it, expect } from 'vitest';
import { toDroid } from '../to-droid.js';
import type { CanonicalPackage } from '../types/canonical.js';

describe('toDroid', () => {
  it('should convert canonical skill to Factory Droid format', () => {
    const canonical: CanonicalPackage = {
      id: 'test-skill',
      name: 'test-skill',
      version: '1.0.0',
      author: 'test-author',
      description: 'A test skill',
      tags: [],
      format: 'droid',
      subtype: 'skill',
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'metadata',
            data: {
              title: 'summarize-diff',
              description: 'Summarize git diff in bullets',
            },
          },
          {
            type: 'instructions',
            title: 'Instructions',
            content: '# Summarize Git Diff\n\n1. Run git diff\n2. Analyze changes\n3. Create bullets',
          },
        ],
      },
    };

    const result = toDroid(canonical);

    expect(result.format).toBe('droid');
    expect(result.content).toContain('---');
    expect(result.content).toContain('name: summarize-diff');
    expect(result.content).toContain('description: Summarize git diff in bullets');
    expect(result.content).toContain('# Summarize Git Diff');
    expect(result.lossyConversion).toBe(false);
    expect(result.qualityScore).toBe(100);
  });

  it('should preserve Factory Droid metadata for roundtrip conversion', () => {
    const canonical: CanonicalPackage = {
      id: 'test-command',
      name: 'test-command',
      version: '1.0.0',
      author: 'test-author',
      description: 'A test slash command',
      tags: [],
      format: 'droid',
      subtype: 'slash-command',
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'metadata',
            data: {
              title: 'code-review',
              description: 'Review code',
              droid: {
                argumentHint: '<file-path>',
                allowedTools: ['Read', 'Grep'],
              },
            },
          },
          {
            type: 'instructions',
            title: 'Instructions',
            content: 'Review the code.',
          },
        ],
      },
    };

    const result = toDroid(canonical);

    expect(result.content).toContain('argument-hint: <file-path>');
    expect(result.content).toContain('allowed-tools:');
    expect(result.content).toContain('- Read');
    expect(result.content).toContain('- Grep');
  });

  it('should include rules section as markdown list', () => {
    const canonical: CanonicalPackage = {
      id: 'test',
      name: 'test',
      version: '1.0.0',
      author: 'test-author',
      description: 'Test',
      tags: [],
      format: 'droid',
      subtype: 'skill',
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'metadata',
            data: {
              title: 'test',
              description: 'Test skill',
            },
          },
          {
            type: 'rules',
            title: 'Best Practices',
            items: [
              { content: 'Always validate inputs' },
              { content: 'Handle errors gracefully' },
            ],
          },
        ],
      },
    };

    const result = toDroid(canonical);

    expect(result.content).toContain('## Best Practices');
    expect(result.content).toContain('- Always validate inputs');
    expect(result.content).toContain('- Handle errors gracefully');
  });

  it('should include examples section with code blocks', () => {
    const canonical: CanonicalPackage = {
      id: 'test',
      name: 'test',
      version: '1.0.0',
      author: 'test-author',
      description: 'Test',
      tags: [],
      format: 'droid',
      subtype: 'skill',
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'metadata',
            data: {
              title: 'test',
              description: 'Test skill',
            },
          },
          {
            type: 'examples',
            title: 'Examples',
            examples: [
              {
                description: 'Basic usage',
                code: 'const x = 5;',
                language: 'typescript',
              },
            ],
          },
        ],
      },
    };

    const result = toDroid(canonical);

    expect(result.content).toContain('## Examples');
    expect(result.content).toContain('### Basic usage');
    expect(result.content).toContain('```typescript');
    expect(result.content).toContain('const x = 5;');
  });

  it('should handle persona section', () => {
    const canonical: CanonicalPackage = {
      id: 'test',
      name: 'test',
      version: '1.0.0',
      author: 'test-author',
      description: 'Test',
      tags: [],
      format: 'droid',
      subtype: 'skill',
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'metadata',
            data: {
              title: 'test',
              description: 'Test skill',
            },
          },
          {
            type: 'persona',
            data: {
              role: 'You are an expert code reviewer',
            },
          },
        ],
      },
    };

    const result = toDroid(canonical);

    expect(result.content).toContain('# Role');
    expect(result.content).toContain('You are an expert code reviewer');
    expect(result.warnings).toContain('Persona section converted to Role heading');
  });

  it('should warn about unsupported sections', () => {
    const canonical: CanonicalPackage = {
      id: 'test',
      name: 'test',
      version: '1.0.0',
      author: 'test-author',
      description: 'Test',
      tags: [],
      format: 'droid',
      subtype: 'skill',
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'metadata',
            data: {
              title: 'test',
              description: 'Test skill',
            },
          },
          {
            type: 'tools',
            tools: ['Read', 'Write'],
          },
          {
            type: 'context',
            content: 'Some context',
          },
        ],
      },
    };

    const result = toDroid(canonical);

    expect(result.warnings).toBeDefined();
    expect(result.warnings?.some(w => w.includes('not support'))).toBe(true);
    expect(result.warnings?.some(w => w.includes('tools'))).toBe(true);
    expect(result.warnings?.some(w => w.includes('context'))).toBe(true);
  });

  it('should use package-level metadata when section metadata is missing', () => {
    const canonical: CanonicalPackage = {
      id: 'test',
      name: 'test-skill',
      version: '1.0.0',
      author: 'test-author',
      description: 'A test skill description',
      tags: [],
      format: 'droid',
      subtype: 'skill',
      metadata: {
        title: 'Test Skill',
        description: 'A test skill',
        droid: {
          argumentHint: '--verbose',
        },
      },
      content: {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'instructions',
            title: 'Main',
            content: 'Do something',
          },
        ],
      },
    };

    const result = toDroid(canonical);

    expect(result.content).toContain('name: test-skill');
    expect(result.content).toContain('description: A test skill description');
    expect(result.content).toContain('argument-hint: --verbose');
  });
});
