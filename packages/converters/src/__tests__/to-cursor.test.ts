/**
 * Tests for Cursor format converter
 */

import { describe, it, expect } from 'vitest';
import { toCursor, isCursorFormat } from '../to-cursor.js';
import {
  sampleCanonicalPackage,
  minimalCanonicalPackage,
  normalizeWhitespace,
} from './setup.js';

describe('toCursor', () => {
  describe('basic conversion', () => {
    it('should convert canonical to cursor format', () => {
      const result = toCursor(sampleCanonicalPackage);

      expect(result.format).toBe('cursor');
      expect(result.content).toBeTruthy();
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should include metadata title and icon', () => {
      const result = toCursor(sampleCanonicalPackage);

      expect(result.content).toContain('# 🧪 Test Agent');
      expect(result.content).toContain('A test agent for conversion testing');
    });

    it('should handle minimal package', () => {
      const result = toCursor(minimalCanonicalPackage);

      expect(result.content).toContain('# Minimal Rule');
      expect(result.content).toContain('## Instructions');
      expect(result.qualityScore).toBe(100);
    });
  });

  describe('section conversion', () => {
    it('should convert persona section', () => {
      const result = toCursor(sampleCanonicalPackage);

      expect(result.content).toContain('## Role');
      expect(result.content).toContain('🤖 **TestBot** - Testing Assistant');
      expect(result.content).toContain('**Style:** precise, thorough, helpful');
      expect(result.content).toContain('**Expertise:**');
      expect(result.content).toContain('- unit testing');
    });

    it('should convert instructions section', () => {
      const result = toCursor(sampleCanonicalPackage);

      expect(result.content).toContain('## Core Principles');
      expect(result.content).toContain('**Important:**');
      expect(result.content).toContain('Always write comprehensive tests');
    });

    it('should convert rules section with rationale', () => {
      const result = toCursor(sampleCanonicalPackage);

      expect(result.content).toContain('## Testing Guidelines');
      expect(result.content).toContain('1. Write tests before code (TDD)');
      expect(result.content).toContain(
        '   - *Rationale: Ensures better design and prevents bugs*'
      );
      expect(result.content).toContain('2. Test edge cases thoroughly');
      expect(result.content).toContain('3. Maintain 100% code coverage');
    });

    it('should convert rules with examples', () => {
      const result = toCursor(sampleCanonicalPackage);

      expect(result.content).toMatch(
        /Example:.*test\("should work"/
      );
    });

    it('should convert examples section', () => {
      const result = toCursor(sampleCanonicalPackage);

      expect(result.content).toContain('## Code Examples');
      expect(result.content).toContain('### ✅ Good: Good test structure');
      expect(result.content).toContain('```typescript');
      expect(result.content).toContain('describe("feature"');
      expect(result.content).toContain('### ❌ Bad: Missing assertions');
    });

    it('should skip tools section (Claude-specific)', () => {
      const result = toCursor(sampleCanonicalPackage);

      expect(result.content).not.toContain('Read, Write, Bash');
      expect(result.warnings).toContain('Tools section skipped (Claude-specific)');
    });

    it('should convert context section', () => {
      const result = toCursor(sampleCanonicalPackage);

      expect(result.content).toContain('## Background');
      expect(result.content).toContain(
        'This agent was created to assist with testing tasks'
      );
    });

    it('should convert file-reference section to @file syntax', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          sections: [
            {
              type: 'file-reference' as const,
              title: 'Naming Patterns',
              path: 'patterns/naming.md',
              content: '# Naming conventions...',
              description: 'Additional naming pattern rules',
              category: 'pattern' as const
            },
            {
              type: 'file-reference' as const,
              title: 'TypeScript Patterns',
              path: 'patterns/typescript.md',
              content: '# TypeScript guidelines...',
              category: 'example' as const
            }
          ]
        }
      };

      const result = toCursor(pkg);

      // Should include @file references
      expect(result.content).toContain('@file patterns/naming.md');
      expect(result.content).toContain('@file patterns/typescript.md');

      // Should include PRPM marker comments
      expect(result.content).toContain('<!-- PRPM: File reference from pattern -->');
      expect(result.content).toContain('<!-- PRPM: File reference from example -->');

      // Should include section header and description when provided
      expect(result.content).toContain('## Naming Patterns');
      expect(result.content).toContain('Additional naming pattern rules');

      // Should not include the actual file content (just the reference)
      expect(result.content).not.toContain('# Naming conventions');
      expect(result.content).not.toContain('# TypeScript guidelines');
    });
  });

  describe('edge cases', () => {
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

      const result = toCursor(pkg);

      expect(result.content).toContain('# No Icon');
      expect(result.content).not.toContain('undefined');
    });

    it('should handle unordered rules', () => {
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
              type: 'rules' as const,
              title: 'Rules',
              items: [{ content: 'Rule 1' }, { content: 'Rule 2' }],
              ordered: false,
            },
          ],
        },
      };

      const result = toCursor(pkg);

      expect(result.content).toContain('- Rule 1');
      expect(result.content).toContain('- Rule 2');
      expect(result.content).not.toContain('1. Rule 1');
    });

    it('should handle custom cursor-specific section', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'custom' as const,
              editorType: 'cursor' as const,
              content: '## Custom Cursor Feature\n\nCursor-specific content',
            },
          ],
        },
      };

      const result = toCursor(pkg);

      expect(result.content).toContain('## Custom Cursor Feature');
      expect(result.content).toContain('Cursor-specific content');
    });

    it('should skip custom claude-specific section', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'custom' as const,
              editorType: 'claude' as const,
              content: 'Claude-only content',
            },
          ],
        },
      };

      const result = toCursor(pkg);

      expect(result.content).not.toContain('Claude-only content');
      expect(result.warnings).toContain('Custom claude section skipped');
    });

    it('should handle unknown section type', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'unknown',
              data: {},
            } as any,
          ],
        },
      } as any;

      const result = toCursor(pkg);

      expect(result.warnings).toContain('Unknown section type: unknown');
    });
  });

  describe('quality scoring', () => {
    it('should have quality score of 100 with no warnings', () => {
      const result = toCursor(minimalCanonicalPackage);

      expect(result.qualityScore).toBe(100);
      expect(result.lossyConversion).toBe(false);
    });

    it('should reduce quality score for lossy conversion', () => {
      const pkg = {
        ...minimalCanonicalPackage,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            ...minimalCanonicalPackage.content.sections,
            {
              type: 'tools' as const,
              tools: ['Read', 'Write'],
            },
          ],
        },
      };

      const result = toCursor(pkg);

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

      const result = toCursor(invalidPkg);

      expect(result.qualityScore).toBe(0);
      expect(result.lossyConversion).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      expect(result.warnings![0]).toContain('Conversion error');
    });
  });

  describe('slash commands', () => {
    it('should generate plain markdown without frontmatter for slash commands', () => {
      const slashCommandPkg = {
        ...minimalCanonicalPackage,
        subtype: 'slash-command' as const,
        content: {
          ...minimalCanonicalPackage.content,
          sections: [
            {
              type: 'metadata' as const,
              data: {
                title: 'Review Code',
                description: 'Review code for best practices',
              },
            },
            {
              type: 'instructions' as const,
              title: 'Instructions',
              content: 'Review the selected code for:\n- Code quality\n- Potential bugs',
            },
          ],
        },
      };

      const result = toCursor(slashCommandPkg);

      // Should not have frontmatter
      expect(result.content).not.toContain('---');
      expect(result.content).not.toContain('description:');
      expect(result.content).not.toContain('alwaysApply:');

      // Should have the content
      expect(result.content).toContain('# Review Code');
      expect(result.content).toContain('Review the selected code for:');
    });

    it('should include frontmatter for non-slash-command rules', () => {
      const result = toCursor(minimalCanonicalPackage);

      // Should have frontmatter
      expect(result.content).toContain('---');
      expect(result.content).toContain('description:');
      expect(result.content).toContain('alwaysApply:');
    });
  });
});

describe('isCursorFormat', () => {
  it('should detect cursor format', () => {
    const cursorContent = '# Test\n\nSome content\n\n## Section\n\nMore content';

    expect(isCursorFormat(cursorContent)).toBe(true);
  });

  it('should reject claude format (has frontmatter)', () => {
    const claudeContent = '---\nname: test\n---\n\n# Content';

    expect(isCursorFormat(claudeContent)).toBe(false);
  });

  it('should reject continue format (has JSON)', () => {
    const continueContent = '{"systemMessage": "test"}';

    expect(isCursorFormat(continueContent)).toBe(false);
  });

  it('should reject content without headers', () => {
    const plainContent = 'Just some text without any headers';

    expect(isCursorFormat(plainContent)).toBe(false);
  });
});

describe('toCursor - security', () => {
  describe('path sanitization', () => {
    it('should reject absolute paths in file references', () => {
      const pkgWithAbsolutePath: any = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'Malicious File',
              path: '/etc/passwd',
              content: 'secret data',
              category: 'config',
            },
          ],
        },
      };

      const result = toCursor(pkgWithAbsolutePath);

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('Rejected absolute path: /etc/passwd - converted to relative path');
      expect(result.content).not.toContain('@file /etc/passwd');
      expect(result.content).toContain('@file etc/passwd');
    });

    it('should reject Windows absolute paths in file references', () => {
      const pkgWithWindowsPath: any = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'Windows Path',
              path: 'C:/Windows/System32/config',
              content: 'data',
              category: 'config',
            },
          ],
        },
      };

      const result = toCursor(pkgWithWindowsPath);

      expect(result.warnings).toContain('Rejected absolute path: C:/Windows/System32/config - converted to relative path');
      expect(result.content).not.toContain('@file C:/');
    });

    it('should remove parent directory traversal from paths', () => {
      const pkgWithTraversal: any = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'Traversal Attack',
              path: '../../etc/passwd',
              content: 'secret',
              category: 'config',
            },
          ],
        },
      };

      const result = toCursor(pkgWithTraversal);

      expect(result.warnings).toContain('Rejected parent traversal in path: ../../etc/passwd - removed traversal segments');
      expect(result.content).not.toContain('../');
      expect(result.content).toContain('@file etc/passwd');
    });

    it('should reject control characters in paths', () => {
      const pkgWithControlChars: any = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'Control Chars',
              path: 'file\nwith\rnewlines\t.txt',
              content: 'data',
              category: 'doc',
            },
          ],
        },
      };

      const result = toCursor(pkgWithControlChars);

      expect(result.warnings).toContain('Rejected control characters in path: file\nwith\rnewlines\t.txt');
      // Check only the @file line (not the entire content which includes frontmatter with newlines)
      const fileLine = result.content.split('\n').find(line => line.startsWith('@file'));
      expect(fileLine).toBeDefined();
      expect(fileLine).toContain('@file filewithnewlines.txt');
      // Verify the sanitized path in the @file line has no control chars
      const pathPart = fileLine!.substring(6); // Remove '@file '
      expect(pathPart).not.toMatch(/[\r\n\t]/);
    });

    it('should handle multiple path violations at once', () => {
      const pkgWithMultipleIssues: any = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'Multiple Issues',
              path: '/absolute/../path\nwith\ttabs',
              content: 'data',
              category: 'test',
            },
          ],
        },
      };

      const result = toCursor(pkgWithMultipleIssues);

      expect(result.warnings?.length).toBeGreaterThan(0);

      // Check only the @file line (not the entire content which includes frontmatter)
      const fileLine = result.content.split('\n').find(line => line.startsWith('@file'));
      expect(fileLine).toBeDefined();
      expect(fileLine).not.toContain('../');
      const pathPart = fileLine!.substring(6); // Remove '@file '
      expect(pathPart).not.toMatch(/[\r\n\t]/);
    });
  });

  describe('HTML comment injection prevention', () => {
    it('should escape --> in category field', () => {
      const pkgWithInjection: any = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'Injection Attempt',
              path: 'safe.txt',
              content: 'data',
              category: 'malicious--> <script>alert("XSS")</script> <!--',
            },
          ],
        },
      };

      const result = toCursor(pkgWithInjection);

      // Check that the dangerous --> is escaped (becomes --&gt;)
      expect(result.content).toContain('--&gt;');
      // Check that HTML comment injection is prevented by finding the comment line
      const commentLine = result.content.split('\n').find(line => line.includes('<!-- PRPM: File reference from'));
      expect(commentLine).toBeDefined();
      expect(commentLine).toContain('malicious--&gt;'); // --> is escaped
      expect(commentLine).toContain('&lt;script&gt;'); // <script> is escaped
    });

    it('should escape < and > in category field', () => {
      const pkgWithTags: any = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'HTML Tags',
              path: 'file.txt',
              content: 'data',
              category: '<div>category</div>',
            },
          ],
        },
      };

      const result = toCursor(pkgWithTags);

      expect(result.content).toContain('&lt;div&gt;category&lt;/div&gt;');
      expect(result.content).not.toContain('<div>');
    });

    it('should handle missing category field safely', () => {
      const pkgWithoutCategory: any = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'No Category',
              path: 'file.txt',
              content: 'data',
            },
          ],
        },
      };

      const result = toCursor(pkgWithoutCategory);

      expect(result.content).toContain('<!-- PRPM: File reference from converted package -->');
    });
  });

  describe('combined security scenarios', () => {
    it('should handle file reference with all security issues', () => {
      const dangerousPkg: any = {
        ...minimalCanonicalPackage,
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'file-reference',
              title: 'Kitchen Sink Attack',
              path: '/absolute/../../etc/passwd\nwith\nnewlines',
              content: 'malicious content',
              category: 'attack--> <script>alert(1)</script> <!--',
            },
          ],
        },
      };

      const result = toCursor(dangerousPkg);

      // Should have multiple warnings
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);

      // Extract @file line to check path sanitization
      const fileLine = result.content.split('\n').find(line => line.startsWith('@file'));
      expect(fileLine).toBeDefined();

      // Path should be sanitized
      expect(fileLine).not.toContain('/absolute');
      expect(fileLine).not.toContain('../');
      const pathPart = fileLine!.substring(6); // Remove '@file '
      expect(pathPart).not.toMatch(/[\r\n]/);

      // HTML should be escaped in comment line
      const commentLine = result.content.split('\n').find(line => line.includes('<!-- PRPM: File reference from'));
      expect(commentLine).toBeDefined();
      expect(commentLine).toContain('--&gt;');
      expect(commentLine).toContain('&lt;script&gt;');

      // Sanitization doesn't reduce quality score - it's defensive security, not lossy conversion
      // The conversion is still accurate, just safer
      expect(result.qualityScore).toBe(100);
    });
  });
});
