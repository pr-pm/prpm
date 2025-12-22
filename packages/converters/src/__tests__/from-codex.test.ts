/**
 * Tests for Codex format parser (Agent Skills SKILL.md format)
 * Based on Agent Skills specification: https://agentskills.io/specification
 */

import { describe, it, expect } from 'vitest';
import { fromCodex } from '../from-codex.js';
import type { CanonicalPackage } from '../types/canonical.js';

const baseMetadata = {
  id: 'test-skill',
  name: 'test-skill',
  version: '1.0.0',
  author: 'testauthor',
};

describe('fromCodex', () => {
  describe('basic parsing', () => {
    it('should parse SKILL.md with required fields only', () => {
      const content = `---
name: typescript-expert
description: Expert TypeScript development assistance with type safety and best practices.
---

You are an expert TypeScript developer.

## Guidelines

- Always use strict type checking
- Prefer \`unknown\` over \`any\`
`;

      const result = fromCodex(content, baseMetadata);

      expect(result.format).toBe('codex');
      expect(result.subtype).toBe('skill');
      expect(result.name).toBe('typescript-expert');
      expect(result.description).toBe('Expert TypeScript development assistance with type safety and best practices.');
    });

    it('should extract instructions from body content', () => {
      const content = `---
name: code-review
description: Reviews code for best practices and security.
---

Review code for the following:

## Process

1. Check for bugs
2. Review error handling
3. Assess security
`;

      const result = fromCodex(content, baseMetadata);

      const instructionsSection = result.content.sections.find(s => s.type === 'instructions');
      expect(instructionsSection).toBeDefined();
      expect(instructionsSection?.type === 'instructions' && instructionsSection.content).toContain('Review code');
      expect(instructionsSection?.type === 'instructions' && instructionsSection.content).toContain('## Process');
    });

    it('should handle content without frontmatter', () => {
      const content = `# Simple Skill

Just some instructions without frontmatter.
`;

      const result = fromCodex(content, baseMetadata);

      // Should use metadata from params
      expect(result.name).toBe('test-skill');
      expect(result.description).toBe('');
    });
  });

  describe('Agent Skills optional fields', () => {
    it('should parse license field', () => {
      const content = `---
name: pdf-processing
description: Process PDF documents.
license: MIT
---

Process PDFs.
`;

      const result = fromCodex(content, baseMetadata);

      expect(result.license).toBe('MIT');

      // Should be stored in agentSkills metadata for roundtrip
      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection?.type === 'metadata' && metadataSection.data.agentSkills?.license).toBe('MIT');
    });

    it('should parse compatibility field', () => {
      const content = `---
name: docker-expert
description: Docker container management.
compatibility: Requires docker, docker-compose
---

Docker instructions.
`;

      const result = fromCodex(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection?.type === 'metadata' && metadataSection.data.agentSkills?.compatibility).toBe('Requires docker, docker-compose');
    });

    it('should parse allowed-tools field', () => {
      const content = `---
name: git-expert
description: Git version control expertise.
allowed-tools: Bash(git:*) Read Write
---

Git instructions.
`;

      const result = fromCodex(content, baseMetadata);

      // Should create tools section
      const toolsSection = result.content.sections.find(s => s.type === 'tools');
      expect(toolsSection).toBeDefined();
      expect(toolsSection?.type === 'tools' && toolsSection.tools).toContain('Bash');
      expect(toolsSection?.type === 'tools' && toolsSection.tools).toContain('Read');
      expect(toolsSection?.type === 'tools' && toolsSection.tools).toContain('Write');

      // Should store original for roundtrip
      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection?.type === 'metadata' && metadataSection.data.agentSkills?.allowedTools).toBe('Bash(git:*) Read Write');
    });

    it('should deduplicate tools from allowed-tools patterns', () => {
      const content = `---
name: multi-bash
description: Uses multiple bash patterns.
allowed-tools: Bash(git:*) Bash(npm:*) Bash(yarn:*) Read
---

Instructions.
`;

      const result = fromCodex(content, baseMetadata);

      const toolsSection = result.content.sections.find(s => s.type === 'tools');
      expect(toolsSection?.type === 'tools' && toolsSection.tools).toEqual(['Bash', 'Read']);
    });

    it('should parse metadata object', () => {
      const content = `---
name: custom-skill
description: Skill with custom metadata.
metadata:
  category: development
  version: 2.0.0
  priority: high
---

Custom skill.
`;

      const result = fromCodex(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection?.type === 'metadata' && metadataSection.data.agentSkills?.metadata).toEqual({
        category: 'development',
        version: '2.0.0',
        priority: 'high',
      });
    });

    it('should parse all optional fields together', () => {
      const content = `---
name: full-featured-skill
description: A skill with all optional fields.
license: Apache-2.0
compatibility: Requires python3, pip
allowed-tools: Bash(python:*) Read Write WebFetch
metadata:
  category: data-science
  author: expert
---

Full featured skill instructions.
`;

      const result = fromCodex(content, baseMetadata);

      expect(result.license).toBe('Apache-2.0');

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      const agentSkills = metadataSection?.type === 'metadata' && metadataSection.data.agentSkills;

      expect(agentSkills).toBeDefined();
      expect(agentSkills?.license).toBe('Apache-2.0');
      expect(agentSkills?.compatibility).toBe('Requires python3, pip');
      expect(agentSkills?.allowedTools).toBe('Bash(python:*) Read Write WebFetch');
      expect(agentSkills?.metadata).toEqual({
        category: 'data-science',
        author: 'expert',
      });
    });
  });

  describe('name validation', () => {
    it('should accept valid skill names', () => {
      const validNames = [
        'skill',
        'my-skill',
        'skill-123',
        'a1-b2-c3',
      ];

      for (const name of validNames) {
        const content = `---
name: ${name}
description: Test skill.
---

Test.
`;
        const result = fromCodex(content, baseMetadata);
        expect(result.name).toBe(name);
      }
    });

    it('should preserve original name from frontmatter', () => {
      const content = `---
name: original-name
description: Test.
---

Test.
`;

      const result = fromCodex(content, {
        ...baseMetadata,
        name: 'different-name', // Metadata has different name
      });

      expect(result.name).toBe('original-name');
    });
  });

  describe('description handling', () => {
    it('should use frontmatter description over metadata', () => {
      const content = `---
name: test
description: Frontmatter description here.
---

Body content.
`;

      const result = fromCodex(content, {
        ...baseMetadata,
        description: 'Metadata description',
      });

      expect(result.description).toBe('Frontmatter description here.');
    });

    it('should fall back to metadata description if frontmatter missing', () => {
      const content = `---
name: test
---

Body content.
`;

      const result = fromCodex(content, {
        ...baseMetadata,
        description: 'Fallback description',
      });

      expect(result.description).toBe('Fallback description');
    });
  });

  describe('content structure', () => {
    it('should create proper canonical structure', () => {
      const content = `---
name: test-skill
description: Test description.
---

Body content.
`;

      const result = fromCodex(content, baseMetadata);

      expect(result.content.format).toBe('canonical');
      expect(result.content.version).toBe('1.0');
      expect(Array.isArray(result.content.sections)).toBe(true);
    });

    it('should include metadata section with agentSkills data', () => {
      const content = `---
name: test-skill
description: Test.
license: MIT
---

Body.
`;

      const result = fromCodex(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection).toBeDefined();
      expect(metadataSection?.type === 'metadata' && metadataSection.data.agentSkills).toBeDefined();
      expect(metadataSection?.type === 'metadata' && metadataSection.data.agentSkills?.name).toBe('test-skill');
    });
  });

  describe('taxonomy', () => {
    it('should set format to codex and subtype to skill', () => {
      const content = `---
name: test
description: Test.
---

Test.
`;

      const result = fromCodex(content, baseMetadata);

      expect(result.format).toBe('codex');
      expect(result.subtype).toBe('skill');
    });
  });

  describe('roundtrip preservation', () => {
    it('should preserve all Agent Skills fields for roundtrip conversion', () => {
      const content = `---
name: roundtrip-test
description: Testing roundtrip conversion.
license: BSD-3-Clause
compatibility: Requires node18+
allowed-tools: Bash(npm:*) Bash(node:*) Read Write
metadata:
  version: 1.2.3
  maintainer: devteam
---

Roundtrip test skill content.

## Features

- Feature 1
- Feature 2
`;

      const result = fromCodex(content, baseMetadata);

      const metadataSection = result.content.sections.find(s => s.type === 'metadata');
      const agentSkills = metadataSection?.type === 'metadata' && metadataSection.data.agentSkills;

      expect(agentSkills?.name).toBe('roundtrip-test');
      expect(agentSkills?.license).toBe('BSD-3-Clause');
      expect(agentSkills?.compatibility).toBe('Requires node18+');
      expect(agentSkills?.allowedTools).toBe('Bash(npm:*) Bash(node:*) Read Write');
      expect(agentSkills?.metadata?.version).toBe('1.2.3');
      expect(agentSkills?.metadata?.maintainer).toBe('devteam');
    });
  });
});
