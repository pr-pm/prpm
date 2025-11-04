/**
 * OpenSkills Format Tests
 */

import { describe, it, expect } from 'vitest';
import { fromOpenSkills } from '../from-openskills.js';
import { toOpenSkills } from '../to-openskills.js';
import type { CanonicalPackage } from '../../types/canonical.js';

describe('OpenSkills Format', () => {
  describe('fromOpenSkills', () => {
    it('parses basic SKILL.md format', () => {
      const content = `---
name: my-skill
description: Example skill demonstrating SKILL.md format
---

# My Skill

This is a test skill.

## Instructions

Follow these steps:

1. First step
2. Second step
3. Third step
`;

      const pkg = fromOpenSkills(content, {
        id: 'test-skill',
        version: '1.0.0',
        author: 'testuser',
        tags: ['test'],
      });

      expect(pkg.format).toBe('openskills');
      expect(pkg.subtype).toBe('skill');
      expect(pkg.name).toBe('my-skill');
      expect(pkg.description).toBe('Example skill demonstrating SKILL.md format');
      expect(pkg.content.sections).toHaveLength(2);
      expect(pkg.content.sections[0].type).toBe('metadata');
      expect(pkg.content.sections[1].type).toBe('instructions');
    });

    it('handles missing frontmatter gracefully', () => {
      const content = `# Just Markdown

No frontmatter here.
`;

      const pkg = fromOpenSkills(content, {
        id: 'test-skill',
        version: '1.0.0',
      });

      expect(pkg.format).toBe('openskills');
      expect(pkg.subtype).toBe('skill');
      expect(pkg.name).toBe('test-skill');
      expect(pkg.content.sections).toHaveLength(2);
    });

    it('extracts H1 title from body', () => {
      const content = `---
name: skill-name
description: Skill description
---

# Extracted Title

Content here.
`;

      const pkg = fromOpenSkills(content, {
        id: 'test',
        version: '1.0.0',
      });

      const metadataSection = pkg.content.sections.find(s => s.type === 'metadata');
      expect(metadataSection?.type === 'metadata' && metadataSection.data.title).toBe('Extracted Title');
    });

    it('handles complex YAML with multiline strings', () => {
      const content = `---
name: complex-skill
description: >
  This is a multi-line
  description that spans
  multiple lines
tags:
  - python
  - testing
  - best-practices
---

# Complex Skill

Content here.
`;

      const pkg = fromOpenSkills(content, {
        id: 'test',
        version: '1.0.0',
      });

      expect(pkg.name).toBe('complex-skill');
      expect(pkg.description).toContain('multi-line');
    });

    it('handles YAML with nested objects', () => {
      const content = `---
name: nested-skill
description: Skill with nested config
config:
  level: advanced
  duration: 30min
  prerequisites:
    - basic-python
    - git-fundamentals
---

# Nested Config Skill

Content here.
`;

      const pkg = fromOpenSkills(content, {
        id: 'test',
        version: '1.0.0',
      });

      expect(pkg.name).toBe('nested-skill');
      expect(pkg.format).toBe('openskills');
    });

    it('handles YAML with quoted strings containing colons', () => {
      const content = `---
name: quoted-skill
description: "This description: contains a colon"
example: "Use like: prpm install"
---

# Quoted String Skill

Content here.
`;

      const pkg = fromOpenSkills(content, {
        id: 'test',
        version: '1.0.0',
      });

      expect(pkg.name).toBe('quoted-skill');
      expect(pkg.description).toBe('This description: contains a colon');
    });

    it('handles malformed YAML gracefully', () => {
      const content = `---
name: bad-skill
description: This is valid
  but this line: has bad indentation
    and this: is worse
---

# Malformed YAML Skill

Content should still be parsed.
`;

      const pkg = fromOpenSkills(content, {
        id: 'test',
        version: '1.0.0',
      });

      // Should use fallback metadata when YAML fails to parse
      expect(pkg.format).toBe('openskills');
      expect(pkg.subtype).toBe('skill');
      expect(pkg.content.sections.length).toBeGreaterThan(0);
    });
  });

  describe('toOpenSkills', () => {
    it('converts canonical to SKILL.md format', () => {
      const canonical: CanonicalPackage = {
        id: 'test-skill',
        version: '1.0.0',
        name: 'test-skill',
        description: 'Test skill description',
        author: 'testuser',
        tags: ['test'],
        format: 'openskills',
        subtype: 'skill',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test Skill',
                description: 'Test skill description',
              },
            },
            {
              type: 'instructions',
              content: 'Follow these instructions:\n\n1. Step 1\n2. Step 2',
            },
          ],
        },
      };

      const result = toOpenSkills(canonical);

      expect(result.format).toBe('openskills');
      expect(result.content).toContain('---');
      expect(result.content).toContain('name: test-skill');
      expect(result.content).toContain('description: Test skill description');
      expect(result.content).toContain('# Test Skill');
      expect(result.content).toContain('Follow these instructions');
      expect(result.qualityScore).toBe(100);
      expect(result.lossyConversion).toBe(false);
    });

    it('handles tools section with warning', () => {
      const canonical: CanonicalPackage = {
        id: 'test-skill',
        version: '1.0.0',
        name: 'test-skill',
        description: 'Test skill',
        author: 'testuser',
        tags: [],
        format: 'openskills',
        subtype: 'skill',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: {
                title: 'Test Skill',
                description: 'Test skill',
              },
            },
            {
              type: 'tools',
              tools: ['bash', 'python'],
            },
          ],
        },
      };

      const result = toOpenSkills(canonical);

      expect(result.warnings).toContain('OpenSkills does not have explicit tools support - converted to markdown section');
      expect(result.qualityScore).toBe(90);
      expect(result.lossyConversion).toBe(true);
      expect(result.content).toContain('## Tools');
      expect(result.content).toContain('bash, python');
    });

    it('handles rules and examples sections', () => {
      const canonical: CanonicalPackage = {
        id: 'test-skill',
        version: '1.0.0',
        name: 'test-skill',
        description: 'Test skill',
        author: 'testuser',
        tags: [],
        format: 'openskills',
        subtype: 'skill',
        content: {
          format: 'canonical',
          version: '1.0',
          sections: [
            {
              type: 'metadata',
              data: { title: 'Test', description: 'Test' },
            },
            {
              type: 'rules',
              rules: [
                { title: 'Rule 1', content: 'Always do this' },
                { title: 'Rule 2', content: 'Never do that' },
              ],
            },
            {
              type: 'examples',
              examples: [
                { title: 'Example 1', content: 'Example code here' },
              ],
            },
          ],
        },
      };

      const result = toOpenSkills(canonical);

      expect(result.content).toContain('## Rules');
      expect(result.content).toContain('### Rule 1');
      expect(result.content).toContain('Always do this');
      expect(result.content).toContain('## Examples');
      expect(result.content).toContain('### Example 1');
      expect(result.qualityScore).toBe(100);
    });
  });

  describe('round-trip conversion', () => {
    it('preserves content through round-trip', () => {
      const original = `---
name: roundtrip-skill
description: Testing round-trip conversion
---

# Round-Trip Skill

This tests round-trip conversion.

## Instructions

1. Parse this
2. Convert to canonical
3. Convert back to OpenSkills
4. Verify it matches
`;

      const canonical = fromOpenSkills(original, {
        id: 'roundtrip-skill',
        version: '1.0.0',
        author: 'tester',
        tags: [],
      });

      const result = toOpenSkills(canonical);

      expect(result.content).toContain('name: roundtrip-skill');
      expect(result.content).toContain('description: Testing round-trip conversion');
      expect(result.content).toContain('# Round-Trip Skill');
      expect(result.content).toContain('This tests round-trip conversion');
      expect(result.qualityScore).toBe(100);
      expect(result.lossyConversion).toBe(false);
    });
  });
});
