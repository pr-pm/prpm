import { describe, it, expect } from 'vitest';
import { fromZed, isZedFormat } from '../from-zed.js';

const minimalMetadata = {
  id: 'test-zed',
  name: 'test-zed-package',
  version: '1.0.0',
  author: 'Test Author',
};

describe('fromZed', () => {
  it('should parse plain markdown Zed file', () => {
    const content = `# TypeScript Guidelines

Follow these best practices when writing TypeScript code.

## Code Style

- Use const over let
- Prefer functional components
- Always add types

## Testing

Write comprehensive tests for all business logic.`;

    const pkg = fromZed(content, minimalMetadata);

    expect(pkg.format).toBe('zed');
    expect(pkg.sourceFormat).toBe('zed');
    expect(pkg.name).toBe('test-zed-package');
    expect(pkg.content.sections.length).toBeGreaterThan(0);
  });

  it('should parse Zed file with code examples', () => {
    const content = `# API Development Standards

## Example

\`\`\`typescript
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const user = await db.users.findOne({ id });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
\`\`\``;

    const pkg = fromZed(content, minimalMetadata);

    expect(pkg.format).toBe('zed');
    expect(pkg.sourceFormat).toBe('zed');
    const content_str = JSON.stringify(pkg.content);
    expect(content_str).toContain('typescript');
  });

  it('should parse simple bullet list rules', () => {
    const content = `# Project Rules

- Use TypeScript strict mode
- Write unit tests
- Follow ESLint rules
- Document public APIs`;

    const pkg = fromZed(content, minimalMetadata);

    expect(pkg.format).toBe('zed');
    expect(pkg.sourceFormat).toBe('zed');
  });

  it('should parse numbered list rules', () => {
    const content = `# Development Process

1. Write tests first
2. Implement the feature
3. Refactor if needed
4. Update documentation`;

    const pkg = fromZed(content, minimalMetadata);

    expect(pkg.format).toBe('zed');
    expect(pkg.sourceFormat).toBe('zed');
  });

  it('should handle explicit subtype', () => {
    const content = `# Coding Standards

Follow these standards in all code.`;

    const pkg = fromZed(content, minimalMetadata, 'rule');

    expect(pkg.format).toBe('zed');
    expect(pkg.subtype).toBe('rule');
  });

  it('should parse multi-section Zed file', () => {
    const content = `# React Development Guide

## Component Structure

Use functional components with hooks.

## Styling

Use CSS modules or styled-components.

## Testing

Write tests with React Testing Library.

## Example

\`\`\`tsx
function UserProfile({ userId }: Props) {
  const user = useUser(userId);
  return <div>{user.name}</div>;
}
\`\`\``;

    const pkg = fromZed(content, minimalMetadata);

    expect(pkg.format).toBe('zed');
    expect(pkg.sourceFormat).toBe('zed');
  });

  it('should handle empty content', () => {
    const content = '';

    const pkg = fromZed(content, minimalMetadata);

    expect(pkg.format).toBe('zed');
    expect(pkg.sourceFormat).toBe('zed');
  });

  it('should handle content with only title', () => {
    const content = '# Project Guidelines';

    const pkg = fromZed(content, minimalMetadata);

    expect(pkg.format).toBe('zed');
    expect(pkg.sourceFormat).toBe('zed');
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

  it('should detect plain markdown with headings', () => {
    const content = `## Guidelines

Some content here.`;

    expect(isZedFormat(content)).toBe(true);
  });

  it('should detect plain markdown with lists', () => {
    const content = `
- Rule 1
- Rule 2
- Rule 3
`;

    expect(isZedFormat(content)).toBe(true);
  });

  it('should reject JSON-like content', () => {
    const content = '{ "test": true }';
    expect(isZedFormat(content)).toBe(false);
  });
});
