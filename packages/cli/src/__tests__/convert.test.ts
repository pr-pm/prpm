/**
 * Tests for convert command
 */

import { mkdtemp, rm, writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleConvert, type ConvertOptions } from '../commands/convert';

describe('convert command', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    testDir = await mkdtemp(join(tmpdir(), 'prpm-convert-test-'));
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Claude to Ruler conversion', () => {
    it('should convert Claude agent to Ruler format', async () => {
      // Create a test Claude agent file
      const claudeContent = `---
name: test-agent
description: Test agent for conversion
allowed-tools: Read, Write
model: sonnet
---

# Test Agent

You are a test agent that helps with testing.

## Instructions

- Test things thoroughly
- Write clear tests
- Document your findings

## Examples

\`\`\`typescript
// Example code
const test = true;
\`\`\`
`;

      const sourcePath = join(testDir, 'test-agent.md');
      await writeFile(sourcePath, claudeContent);

      // Convert to ruler
      const outputPath = join(testDir, 'test-agent-ruler.md');
      const options: ConvertOptions = {
        to: 'ruler',
        output: outputPath,
        yes: true,
      };

      await handleConvert(sourcePath, options);

      // Read the converted file
      const rulerContent = await readFile(outputPath, 'utf-8');

      // Verify ruler format characteristics
      expect(rulerContent).toContain('<!-- Package:');
      expect(rulerContent).toContain('<!-- Author:');
      expect(rulerContent).toContain('<!-- Description:');
      expect(rulerContent).not.toContain('---\n'); // No YAML frontmatter
      expect(rulerContent).toContain('# Test Agent');
      expect(rulerContent).toContain('## Instructions');
      expect(rulerContent).toContain('- Test things thoroughly');
      expect(rulerContent).toContain('```typescript');
    });

    it('should convert Claude skill to Ruler format', async () => {
      const claudeContent = `---
name: test-skill
description: Test skill for conversion
---

# Test Skill

A skill that demonstrates ruler conversion.

## Guidelines

1. Be thorough
2. Test everything
3. Document clearly
`;

      const sourcePath = join(testDir, 'SKILL.md');
      await writeFile(sourcePath, claudeContent);

      const outputPath = join(testDir, 'test-skill-ruler.md');
      const options: ConvertOptions = {
        to: 'ruler',
        output: outputPath,
        yes: true,
      };

      await handleConvert(sourcePath, options);

      const rulerContent = await readFile(outputPath, 'utf-8');

      // Verify conversion
      expect(rulerContent).toContain('<!-- Package:');
      expect(rulerContent).not.toContain('---\n');
      expect(rulerContent).toContain('# Test Skill');
      expect(rulerContent).toContain('## Guidelines');
    });
  });

  describe('Cursor to Ruler conversion', () => {
    it('should convert Cursor rule to Ruler format', async () => {
      const cursorContent = `---
description: Test cursor rule
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
---

# TypeScript Best Practices

Always use strict TypeScript settings.

## Type Safety

- No any types
- Explicit return types
- Proper generics

## Example

\`\`\`typescript
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`
`;

      const sourcePath = join(testDir, 'typescript.mdc');
      await writeFile(sourcePath, cursorContent);

      const outputPath = join(testDir, 'typescript-ruler.md');
      const options: ConvertOptions = {
        to: 'ruler',
        output: outputPath,
        yes: true,
      };

      await handleConvert(sourcePath, options);

      const rulerContent = await readFile(outputPath, 'utf-8');

      // Verify conversion
      expect(rulerContent).toContain('<!-- Package:');
      expect(rulerContent).not.toContain('---\n');
      expect(rulerContent).toContain('# TypeScript Best Practices');
      expect(rulerContent).toContain('## Type Safety');
      expect(rulerContent).toContain('- No any types');
    });
  });

  describe('Ruler format detection', () => {
    it.skip('should detect ruler format from .ruler/ directory', async () => {
      const rulerContent = `# Test Rule

This is a plain markdown file for Ruler.

## Guidelines

- Keep it simple
- No frontmatter needed

## Examples

\`\`\`bash
prpm install package
\`\`\`
`;

      // Create .ruler directory first
      const rulerDir = join(testDir, '.ruler');
      await mkdir(rulerDir, { recursive: true });

      const sourcePath = join(rulerDir, 'test-rule.md');
      await writeFile(sourcePath, rulerContent);

      const outputPath = join(testDir, 'test-claude.md');
      const options: ConvertOptions = {
        to: 'claude',
        output: outputPath,
        yes: true,
      };

      await handleConvert(sourcePath, options);

      const claudeContent = await readFile(outputPath, 'utf-8');

      // Verify it was detected as ruler and converted to claude
      expect(claudeContent).toContain('---');
      expect(claudeContent).toContain('name:');
      expect(claudeContent).toContain('# Test Rule');
      expect(claudeContent).toContain('## Guidelines');
    });
  });

  describe('Default output paths', () => {
    it('should use .ruler/ as default output directory', async () => {
      const claudeContent = `---
name: default-path-test
description: Testing default paths
---

# Default Path Test

Testing that ruler files go to .ruler/ by default.
`;

      const sourcePath = join(testDir, 'test.md');
      await writeFile(sourcePath, claudeContent);

      // Convert without specifying output path
      const options: ConvertOptions = {
        to: 'ruler',
        yes: true,
      };

      // Change working directory to testDir for this test
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        await handleConvert(sourcePath, options);

        // Verify file was created in .ruler/
        const expectedPath = join(testDir, '.ruler', 'test.md');
        const content = await readFile(expectedPath, 'utf-8');
        expect(content).toContain('# Default Path Test');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Format validation', () => {
    it('should reject invalid target format', async () => {
      const sourcePath = join(testDir, 'test.md');
      await writeFile(sourcePath, '# Test');

      const options = {
        to: 'invalid-format' as any,
        yes: true,
      };

      await expect(handleConvert(sourcePath, options)).rejects.toThrow();
    });

    it('should accept ruler as valid format', async () => {
      const claudeContent = `---
name: format-test
description: Test format validation
---

# Format Test
`;

      const sourcePath = join(testDir, 'test.md');
      await writeFile(sourcePath, claudeContent);

      const outputPath = join(testDir, 'output.md');
      const options: ConvertOptions = {
        to: 'ruler',
        output: outputPath,
        yes: true,
      };

      // Should not throw
      await handleConvert(sourcePath, options);

      const content = await readFile(outputPath, 'utf-8');
      expect(content).toContain('# Format Test');
    });
  });

  describe('Round-trip conversions', () => {
    it('should preserve content through Claude -> Ruler -> Claude conversion', async () => {
      const originalContent = `---
name: round-trip-test
description: Testing round-trip conversion
---

# Round Trip Test

This tests that content is preserved through conversions.

## Section 1

Content here.

## Section 2

More content.
`;

      // Claude to Ruler
      const step1Source = join(testDir, 'original.md');
      await writeFile(step1Source, originalContent);

      const step1Output = join(testDir, 'ruler.md');
      await handleConvert(step1Source, {
        to: 'ruler',
        output: step1Output,
        yes: true,
      });

      // Ruler back to Claude
      const step2Output = join(testDir, 'final.md');
      await handleConvert(step1Output, {
        to: 'claude',
        output: step2Output,
        yes: true,
      });

      const finalContent = await readFile(step2Output, 'utf-8');

      // Check that key content is preserved
      expect(finalContent).toContain('# Round Trip Test');
      expect(finalContent).toContain('## Section 1');
      expect(finalContent).toContain('## Section 2');
      expect(finalContent).toContain('Content here.');
      expect(finalContent).toContain('More content.');
    });
  });

  describe('Metadata preservation', () => {
    it('should preserve package metadata in HTML comments', async () => {
      const claudeContent = `---
name: metadata-test
description: Testing metadata preservation in ruler format
---

# Metadata Test

This tests that metadata is preserved as HTML comments.
`;

      const sourcePath = join(testDir, 'test.md');
      await writeFile(sourcePath, claudeContent);

      const outputPath = join(testDir, 'ruler-metadata.md');
      await handleConvert(sourcePath, {
        to: 'ruler',
        output: outputPath,
        yes: true,
      });

      const rulerContent = await readFile(outputPath, 'utf-8');

      // Check for metadata HTML comments
      expect(rulerContent).toMatch(/<!--\s*Package:\s*\w+/);
      expect(rulerContent).toMatch(/<!--\s*Author:/);
      expect(rulerContent).toMatch(/<!--\s*Description:/);
      expect(rulerContent).toContain('Testing metadata preservation in ruler format');
    });
  });

  describe('Custom output name', () => {
    it('should use custom name when provided', async () => {
      const claudeContent = `---
name: original-name
description: Test custom naming
---

# Test Skill

This tests custom output naming.
`;

      const sourcePath = join(testDir, 'SKILL.md');
      await writeFile(sourcePath, claudeContent);

      // Change working directory to testDir for this test
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        const options: ConvertOptions = {
          to: 'ruler',
          name: 'custom-name',
          yes: true,
        };

        await handleConvert(sourcePath, options);

        // Verify file was created with custom name
        const expectedPath = join(testDir, '.ruler', 'custom-name.md');
        const content = await readFile(expectedPath, 'utf-8');
        expect(content).toContain('# Test Skill');
        expect(content).toContain('This tests custom output naming.');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should use custom name for different formats', async () => {
      const claudeContent = `---
name: test-agent
description: Test agent
allowed-tools: Read, Write
---

# Test Agent

Test content.
`;

      const sourcePath = join(testDir, 'test-agent.md');
      await writeFile(sourcePath, claudeContent);

      const outputPath = join(testDir, 'my-custom-agent.md');
      const options: ConvertOptions = {
        to: 'ruler',
        name: 'my-custom-agent',
        output: outputPath,
        yes: true,
      };

      await handleConvert(sourcePath, options);

      const content = await readFile(outputPath, 'utf-8');
      expect(content).toContain('# Test Agent');
    });

    it('should prefer custom name over source filename', async () => {
      const claudeContent = `---
name: original-name
description: Test cursor rule
---

# Original Rule

This has a generic filename like SKILL.md.
`;

      const sourcePath = join(testDir, 'SKILL.md');
      await writeFile(sourcePath, claudeContent);

      // Change working directory to testDir
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        await handleConvert(sourcePath, {
          to: 'ruler',
          name: 'descriptive-name',
          yes: true,
        });

        // Should use custom name, not SKILL.md
        const expectedPath = join(testDir, '.ruler', 'descriptive-name.md');
        const content = await readFile(expectedPath, 'utf-8');
        expect(content).toContain('# Original Rule');
        expect(content).toContain('This has a generic filename like SKILL.md.');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should work with explicit output path and ignore name option', async () => {
      const claudeContent = `---
name: test
description: Test
---

# Test
`;

      const sourcePath = join(testDir, 'test.md');
      await writeFile(sourcePath, claudeContent);

      // When output path is explicit, name option should be ignored
      const explicitOutput = join(testDir, 'explicit-path.md');
      await handleConvert(sourcePath, {
        to: 'ruler',
        name: 'should-be-ignored',
        output: explicitOutput,
        yes: true,
      });

      const content = await readFile(explicitOutput, 'utf-8');
      expect(content).toContain('# Test');
    });
  });
});
