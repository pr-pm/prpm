# Continue Format Specification

**File Location:** `.continuerules/*.md` or `config.yaml`
**Format:** Markdown with YAML frontmatter OR YAML configuration
**Official Docs:** https://docs.continue.dev/customize/deep-dives/rules

## Overview

Continue supports two formats for rules:
1. **Markdown files** (`.continuerules/*.md`) with YAML frontmatter
2. **YAML configuration** (`config.yaml`) with rules array

Rules can be context-aware using glob patterns, regex matching, or always-applied globally.

## Frontmatter Fields (Markdown Format)

### Required Fields

- **`name`** (string): Display name/title for the rule

### Optional Fields

- **`description`** (string): Description of when the rule should be used (agents may read this)
- **`globs`** (string or array): Glob pattern(s) to match files
  - Single: `"**/*.{ts,tsx}"`
  - Array: `["src/**/*.ts", "tests/**/*.ts"]`
- **`regex`** (string or array): Regex pattern(s) to match file content
  - Single: `"^import .* from '.*';$"`
  - Array: `["^import .*", "^export .*"]`
- **`alwaysApply`** (boolean or undefined): Controls rule inclusion
  - `true`: Always included, regardless of context
  - `false`: Included if globs match OR agent decides based on description
  - `undefined` (default): Included if no globs exist OR globs match
- **`version`** (string): Rule version (for YAML format)
- **`schema`** (string): Schema version (for YAML format)

## Content Format

Plain markdown content including:

- **H1 title**: Main heading
- **Sections**: Organized with H2/H3 headers
- **Lists**: For rules and guidelines
- **Code blocks**: For examples
- **Standard markdown**: Links, bold, italic, etc.

## Examples

### Markdown Format with Globs

```markdown
---
name: Documentation Standards
globs: docs/**/*.{md,mdx}
alwaysApply: false
description: Standards for writing and maintaining documentation
---

# Documentation Standards

## Structure

- Follow consistent heading hierarchy starting with h2 (##)
- Include YAML frontmatter with title, description, and keywords
- Use descriptive alt text for images

## Writing Style

- Keep paragraphs concise and scannable
- Use code blocks with appropriate language tags
- Include cross-references to related documentation
```

### Markdown Format with Regex

```markdown
---
name: React Component Standards
regex: "^import React"
globs: "**/*.{tsx,jsx}"
alwaysApply: false
description: Standards for React component development
---

# React Component Standards

## Component Structure

- Use functional components with hooks
- Keep components under 200 lines
- Extract logic into custom hooks when appropriate
- Co-locate styles with components

## Examples

\`\`\`typescript
// Good: Focused component
function UserProfile({ userId }: Props) {
  const user = useUser(userId);
  return <div>{user.name}</div>;
}
\`\`\`
```

### YAML Configuration Format

```yaml
name: API Development Rules
version: 1.0.0
schema: v1

rules:
  - name: REST API Standards
    globs:
      - "src/api/**/*.ts"
      - "src/routes/**/*.ts"
    alwaysApply: false
    rule: >
      ## REST Conventions

      - Use semantic HTTP methods (GET, POST, PUT, DELETE)
      - Return appropriate status codes (200, 201, 400, 404, 500)
      - Include error messages in response body
      - Version APIs using URL paths (/api/v1/)

  - name: TypeScript Standards
    globs: "**/*.{ts,tsx}"
    regex: "^import.*typescript"
    alwaysApply: false
    rule: >
      ## Type Safety

      - Always define explicit types for function parameters
      - Avoid using `any` type
      - Use strict mode in tsconfig.json
```

### Always-Applied Global Rules

```markdown
---
name: Code Quality Standards
alwaysApply: true
---

# Code Quality Standards

These standards apply to all code in the project.

## General Principles

- Write self-documenting code
- Keep functions under 50 lines
- Use meaningful variable names
- Add comments only for complex logic
```

## Best Practices

1. **Keep it simple**: Continue prefers plain markdown
2. **Be specific**: Target actual patterns in your codebase
3. **Include examples**: Show real code from your project
4. **Update regularly**: Keep rules in sync with codebase changes
5. **One concern per file**: Split large rule sets into focused files

## Conversion Notes

### From Canonical

- Minimal frontmatter (name only)
- Plain markdown content
- No special formatting requirements
- Sections converted directly to H2 headers

### To Canonical

- Extracts H1 as display title
- Frontmatter name becomes identifier
- All markdown content preserved
- No format-specific features to handle

## Limitations

- No path-specific rules (applies to all files)
- No tool specifications
- No persona definitions
- Limited metadata support
- Simple rule format compared to other editors

## Differences from Other Formats

**vs Cursor:**
- No globs or alwaysApply flags
- Simpler frontmatter
- No MDC features

**vs Claude:**
- No tools or model selection
- No agents/skills distinction
- Purely documentation-focused

**vs Copilot:**
- Requires frontmatter (Copilot doesn't)
- No path-specific support
- More structured format
