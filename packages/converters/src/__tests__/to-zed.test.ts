import { describe, it, expect } from 'vitest';
import { toZed, isZedFormat, generateFilename } from '../to-zed.js';
import type { CanonicalPackage } from '../types/canonical.js';

const minimalCanonicalPackage: CanonicalPackage = {
  id: 'test-pkg',
  name: 'test-package',
  version: '1.0.0',
  author: 'Test Author',
  description: 'A test package for Zed conversion',
  format: 'canonical',
  sourceFormat: 'canonical',
  subtype: 'rule',
  content: {
    sections: [],
  },
};

describe('toZed', () => {
  it('should convert minimal canonical package to Zed format', () => {
    const result = toZed(minimalCanonicalPackage);

    expect(result.format).toBe('zed');
    expect(result.content).toContain('# test-package');
    expect(result.content).toContain('A test package for Zed conversion');
    expect(result.lossyConversion).toBe(false);
    expect(result.qualityScore).toBe(100);
  });

  it('should convert instructions section', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      content: {
        sections: [
          {
            type: 'instructions' as const,
            title: 'Coding Guidelines',
            content: 'Follow these coding standards:\n\n- Use TypeScript\n- Write tests',
          },
        ],
      },
    };

    const result = toZed(pkg);

    expect(result.content).toContain('## Coding Guidelines');
    expect(result.content).toContain('Follow these coding standards');
    expect(result.content).toContain('- Use TypeScript');
    expect(result.content).toContain('- Write tests');
  });

  it('should convert rules section', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      content: {
        sections: [
          {
            type: 'rules' as const,
            title: 'Best Practices',
            items: [
              { content: 'Always use const over let' },
              { content: 'Prefer functional components', rationale: 'Easier to test' },
              { content: 'Use meaningful names', examples: ['getUserById', 'calculateTotal'] },
            ],
          },
        ],
      },
    };

    const result = toZed(pkg);

    expect(result.content).toContain('## Best Practices');
    expect(result.content).toContain('- Always use const over let');
    expect(result.content).toContain('- Prefer functional components');
    expect(result.content).toContain('Rationale: Easier to test');
    expect(result.content).toContain('Example: `getUserById`');
    expect(result.content).toContain('Example: `calculateTotal`');
  });

  it('should convert examples section', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      content: {
        sections: [
          {
            type: 'examples' as const,
            title: 'Code Examples',
            examples: [
              {
                description: 'Good component structure',
                code: 'function UserProfile() {\n  return <div>Profile</div>;\n}',
                language: 'tsx',
                good: true,
              },
              {
                description: 'Bad component structure',
                code: 'const UserProfile = () => <div>Profile</div>;',
                language: 'tsx',
                good: false,
              },
            ],
          },
        ],
      },
    };

    const result = toZed(pkg);

    expect(result.content).toContain('## Code Examples');
    expect(result.content).toContain('### ✅ Preferred: Good component structure');
    expect(result.content).toContain('### ❌ Avoid: Bad component structure');
    expect(result.content).toContain('```tsx');
    expect(result.content).toContain('function UserProfile()');
  });

  it('should skip persona section with warning', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      content: {
        sections: [
          {
            type: 'persona' as const,
            data: {
              name: 'Expert Developer',
              role: 'Senior TypeScript Developer',
            },
          },
        ],
      },
    };

    const result = toZed(pkg);

    expect(result.warnings).toContain('Persona section skipped (not supported by Zed)');
    expect(result.content).not.toContain('Expert Developer');
  });

  it('should skip tools section with warning', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      content: {
        sections: [
          {
            type: 'tools' as const,
            tools: [{ name: 'read_file', description: 'Read a file' }],
          },
        ],
      },
    };

    const result = toZed(pkg);

    expect(result.warnings).toContain('Tools section skipped (not supported by Zed)');
    expect(result.content).not.toContain('read_file');
  });

  it('should include generic custom sections', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      content: {
        sections: [
          {
            type: 'custom' as const,
            content: '## Custom Guidelines\n\nCustom content here',
          },
        ],
      },
    };

    const result = toZed(pkg);

    expect(result.content).toContain('## Custom Guidelines');
    expect(result.content).toContain('Custom content here');
  });

  it('should skip editor-specific custom sections', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      content: {
        sections: [
          {
            type: 'custom' as const,
            editorType: 'cursor' as const,
            content: 'Cursor-specific content',
          },
        ],
      },
    };

    const result = toZed(pkg);

    expect(result.warnings).toContain('Custom cursor section skipped');
    expect(result.content).not.toContain('Cursor-specific content');
  });

  it('should include zed-specific custom sections', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      content: {
        sections: [
          {
            type: 'custom' as const,
            editorType: 'zed' as const,
            content: '## Zed-Specific\n\nZed custom content',
          },
        ],
      },
    };

    const result = toZed(pkg);

    expect(result.content).toContain('## Zed-Specific');
    expect(result.content).toContain('Zed custom content');
    expect(result.warnings).toBeUndefined();
  });

  it('should use metadata.title if available', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      description: undefined, // Remove package description so metadata.description is used
      metadata: {
        title: 'TypeScript Best Practices',
        description: 'Guidelines for TypeScript development',
      },
    };

    const result = toZed(pkg);

    expect(result.content).toContain('# TypeScript Best Practices');
    expect(result.content).toContain('Guidelines for TypeScript development');
  });

  it('should generate plain markdown without frontmatter', () => {
    const pkg = {
      ...minimalCanonicalPackage,
      content: {
        sections: [
          {
            type: 'instructions' as const,
            title: 'Guidelines',
            content: 'Follow best practices',
          },
        ],
      },
    };

    const result = toZed(pkg);

    // Should NOT have YAML frontmatter
    expect(result.content).not.toContain('---');
    expect(result.content).not.toContain('description:');
    expect(result.content).not.toContain('globs:');

    // Should be plain markdown
    expect(result.content).toContain('# test-package');
    expect(result.content).toContain('## Guidelines');
  });

  it('should handle conversion errors gracefully', () => {
    const invalidPkg = {
      ...minimalCanonicalPackage,
      content: null as any,
    };

    const result = toZed(invalidPkg);

    expect(result.format).toBe('zed');
    expect(result.content).toBe('');
    expect(result.lossyConversion).toBe(true);
    expect(result.qualityScore).toBe(0);
    expect(result.warnings?.[0]).toContain('Conversion error');
  });
});

describe('isZedFormat', () => {
  it('should detect plain markdown as Zed format', () => {
    const content = `# Project Guidelines

Follow these rules:

- Use TypeScript
- Write tests`;

    expect(isZedFormat(content)).toBe(true);
  });

  it('should reject content with YAML frontmatter', () => {
    const content = `---
description: Test
---

# Guidelines`;

    expect(isZedFormat(content)).toBe(false);
  });

  it('should reject JSON content', () => {
    const content = `{
  "name": "test",
  "rules": []
}`;

    expect(isZedFormat(content)).toBe(false);
  });

  it('should reject array JSON', () => {
    const content = `[
  "rule1",
  "rule2"
]`;

    expect(isZedFormat(content)).toBe(false);
  });
});

describe('generateFilename', () => {
  it('should generate default .rules filename', () => {
    const filename = generateFilename(minimalCanonicalPackage);
    expect(filename).toBe('.rules');
  });

  it('should generate .cursorrules when specified', () => {
    const filename = generateFilename(minimalCanonicalPackage, {
      useAlternativeFile: 'cursorrules',
    });
    expect(filename).toBe('.cursorrules');
  });

  it('should generate .windsurfrules when specified', () => {
    const filename = generateFilename(minimalCanonicalPackage, {
      useAlternativeFile: 'windsurfrules',
    });
    expect(filename).toBe('.windsurfrules');
  });

  it('should generate .clinerules when specified', () => {
    const filename = generateFilename(minimalCanonicalPackage, {
      useAlternativeFile: 'clinerules',
    });
    expect(filename).toBe('.clinerules');
  });

  it('should generate AGENTS.md when specified', () => {
    const filename = generateFilename(minimalCanonicalPackage, {
      useAlternativeFile: 'agents',
    });
    expect(filename).toBe('AGENTS.md');
  });

  it('should generate CLAUDE.md when specified', () => {
    const filename = generateFilename(minimalCanonicalPackage, {
      useAlternativeFile: 'claude',
    });
    expect(filename).toBe('CLAUDE.md');
  });

  it('should generate GEMINI.md when specified', () => {
    const filename = generateFilename(minimalCanonicalPackage, {
      useAlternativeFile: 'gemini',
    });
    expect(filename).toBe('GEMINI.md');
  });
});
