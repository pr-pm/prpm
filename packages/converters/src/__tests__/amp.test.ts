/**
 * Tests for Amp format converters (fromAmp and toAmp)
 */

import { describe, it, expect } from 'vitest';
import { fromAmp } from '../from-amp.js';
import { toAmp } from '../to-amp.js';
import type { CanonicalPackage } from '../types/canonical.js';

const baseMetadata = {
  id: 'test-package',
  name: 'Test Package',
  version: '1.0.0',
  author: 'testauthor',
};

describe('fromAmp', () => {
  describe('skill detection', () => {
    it('should detect skill subtype when name and description present', () => {
      const content = `---
name: code-review
description: Reviews code for best practices and potential issues
argument-hint: "[file or directory]"
---

# Code Review Skill

You are an expert code reviewer.

## Review Process

1. Check for code smells
2. Verify error handling
3. Suggest improvements
`;

      const result = fromAmp(content, baseMetadata);

      expect(result.subtype).toBe('skill');
      expect(result.format).toBe('amp');
      expect(result.name).toBe('code-review');
    });

    it('should preserve skill-specific fields for roundtrip', () => {
      const content = `---
name: test-runner
description: Runs tests for the project
argument-hint: "[test file]"
disable-model-invocation: true
---

# Test Runner

Runs tests.
`;

      const result = fromAmp(content, baseMetadata);

      expect(result.subtype).toBe('skill');
      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection?.type).toBe('metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.amp).toEqual({
          argumentHint: '[test file]',
          disableModelInvocation: true,
        });
      }
    });
  });

  describe('rule/agent detection', () => {
    it('should detect rule subtype when globs present', () => {
      const content = `---
globs:
  - '**/*.ts'
  - '**/*.tsx'
---

# TypeScript Guidelines

These rules apply when working with TypeScript files.
`;

      const result = fromAmp(content, baseMetadata);

      expect(result.subtype).toBe('rule');
      expect(result.format).toBe('amp');
    });

    it('should preserve globs for roundtrip', () => {
      const content = `---
globs: '**/*.py'
---

# Python Guidelines

Python-specific rules.
`;

      const result = fromAmp(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      if (metadataSection?.type === 'metadata') {
        expect(metadataSection.data.amp?.globs).toEqual(['**/*.py']);
      }
    });

    it('should default to rule for plain markdown', () => {
      const content = `# Project Guidelines

No frontmatter here, just plain markdown content.
`;

      const result = fromAmp(content, baseMetadata);

      expect(result.subtype).toBe('rule');
    });
  });

  describe('slash-command detection', () => {
    it('should detect slash-command with subtypeHint', () => {
      const content = `---
description: Deploy the application
---

# Deploy Command

Deploy the application with the following steps:
1. Run tests
2. Build
3. Deploy
`;

      const result = fromAmp(content, baseMetadata, 'slash-command');

      expect(result.subtype).toBe('slash-command');
      expect(result.format).toBe('amp');
    });
  });

  describe('content parsing', () => {
    it('should extract body as instructions section', () => {
      const content = `---
name: test-skill
description: Test skill
---

# Test Skill

This is the main content.

## Section One

Some instructions here.
`;

      const result = fromAmp(content, baseMetadata);

      const instructionsSection = result.content.sections.find(s => s.type === 'instructions');
      expect(instructionsSection?.type).toBe('instructions');
      if (instructionsSection?.type === 'instructions') {
        expect(instructionsSection.content).toContain('This is the main content');
        expect(instructionsSection.content).toContain('## Section One');
      }
    });
  });
});

describe('toAmp', () => {
  describe('skill conversion', () => {
    it('should generate valid skill frontmatter', () => {
      const pkg: CanonicalPackage = {
        id: 'test-skill',
        name: 'Test Skill',
        version: '1.0.0',
        author: 'testauthor',
        description: 'A test skill',
        tags: [],
        format: 'amp',
        subtype: 'skill',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test Skill',
                description: 'A test skill',
                version: '1.0.0',
                author: 'testauthor',
                amp: {
                  argumentHint: '[file]',
                },
              },
            },
            {
              type: 'instructions',
              title: 'Instructions',
              content: 'Do something helpful.',
            },
          ],
        },
      };

      const result = toAmp(pkg);

      expect(result.format).toBe('amp');
      expect(result.content).toContain('name: test-skill');
      expect(result.content).toContain('description: A test skill');
      // YAML may use single or double quotes
      expect(result.content).toMatch(/argument-hint: ['"]?\[file\]['"]?/);
      expect(result.content).toContain('Do something helpful.');
    });
  });

  describe('rule conversion', () => {
    it('should generate frontmatter with globs when present', () => {
      const pkg: CanonicalPackage = {
        id: 'ts-rules',
        name: 'TypeScript Rules',
        version: '1.0.0',
        author: 'testauthor',
        description: 'TypeScript guidelines',
        tags: [],
        format: 'amp',
        subtype: 'rule',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'TypeScript Rules',
                description: 'TypeScript guidelines',
                version: '1.0.0',
                author: 'testauthor',
                amp: {
                  globs: ['**/*.ts', '**/*.tsx'],
                },
              },
            },
            {
              type: 'instructions',
              title: 'Instructions',
              content: 'Follow TypeScript best practices.',
            },
          ],
        },
      };

      const result = toAmp(pkg);

      expect(result.format).toBe('amp');
      expect(result.content).toContain('globs:');
      expect(result.content).toContain('**/*.ts');
      expect(result.content).toContain('**/*.tsx');
    });

    it('should omit frontmatter when no amp metadata', () => {
      const pkg: CanonicalPackage = {
        id: 'plain-rules',
        name: 'Plain Rules',
        version: '1.0.0',
        author: 'testauthor',
        description: 'Plain guidelines',
        tags: [],
        format: 'amp',
        subtype: 'rule',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Plain Rules',
                description: 'Plain guidelines',
                version: '1.0.0',
                author: 'testauthor',
              },
            },
            {
              type: 'instructions',
              title: 'Instructions',
              content: 'Just some rules.',
            },
          ],
        },
      };

      const result = toAmp(pkg);

      expect(result.content).not.toContain('---');
      expect(result.content).toContain('Just some rules.');
    });
  });

  describe('slash-command conversion', () => {
    it('should generate command with description', () => {
      const pkg: CanonicalPackage = {
        id: 'deploy-cmd',
        name: 'Deploy Command',
        version: '1.0.0',
        author: 'testauthor',
        description: 'Deploy the application',
        tags: [],
        format: 'amp',
        subtype: 'slash-command',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Deploy Command',
                description: 'Deploy the application',
                version: '1.0.0',
                author: 'testauthor',
              },
            },
            {
              type: 'instructions',
              title: 'Instructions',
              content: 'Deploy steps here.',
            },
          ],
        },
      };

      const result = toAmp(pkg);

      expect(result.format).toBe('amp');
      expect(result.content).toContain('description: Deploy the application');
      expect(result.content).toContain('Deploy steps here.');
    });
  });

  describe('roundtrip conversion', () => {
    it('should roundtrip skill correctly', () => {
      const originalContent = `---
name: code-review
description: Reviews code for best practices
argument-hint: "[file]"
---

# Code Review

Review code for best practices.
`;

      const parsed = fromAmp(originalContent, baseMetadata);
      const result = toAmp(parsed);

      expect(result.content).toContain('name: code-review');
      expect(result.content).toContain('description: Reviews code for best practices');
      // YAML may use single or double quotes
      expect(result.content).toMatch(/argument-hint: ['"]?\[file\]['"]?/);
      expect(result.content).toContain('Review code for best practices.');
    });
  });
});
