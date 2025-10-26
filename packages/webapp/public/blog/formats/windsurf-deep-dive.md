# Windsurf Rules: A Technical Deep Dive

**Published**: 2025-01-XX
**Author**: PRPM Team
**Format**: Windsurf (`.windsurfrules`)
**Status**: Production

---

## Table of Contents

1. [Introduction](#introduction)
2. [Format Specification](#format-specification)
3. [Simplicity as Design](#simplicity-as-design)
4. [PRPM's Implementation](#prpms-implementation)
5. [Conversion & Taxonomy](#conversion--taxonomy)
6. [Technical Design Decisions](#technical-design-decisions)
7. [Best Practices](#best-practices)
8. [Future Enhancements](#future-enhancements)

---

## Introduction

Windsurf is an AI-first code editor that takes a **radically simple** approach to configuration: a single `.windsurfrules` file at your project root containing plain markdown. No frontmatter, no special syntax, no configuration files - just markdown.

This minimalist philosophy makes Windsurf rules:
- **Zero-configuration**: Drop a markdown file in your repo
- **Git-friendly**: Plain text, easy to diff and review
- **Universal**: Works for any language, framework, or project type
- **Approachable**: Anyone who knows markdown can contribute

The core principle: **Maximum impact with minimum syntax**.

---

## Format Specification

### File Location

Windsurf uses a **single file** at the project root:

```
your-project/
├── .windsurfrules    # ← The entire configuration
├── src/
├── tests/
└── package.json
```

**That's it.** No directories, no multiple files, no config files.

### File Format

Pure markdown without frontmatter:

```markdown
# React Best Practices

Follow these guidelines when working with React code.

## Component Structure

- Use functional components with hooks
- Keep components small and focused
- Separate business logic from presentation

## State Management

- Use useState for local state
- Use useReducer for complex state logic
- Consider Context API for shared state

## Code Style

- Always use TypeScript
- Prefer const over let
- Use descriptive variable names
```

**No YAML frontmatter**. No special directives. Just markdown.

### Supported Markdown Features

Windsurf parses standard markdown:

```markdown
# Headers (H1-H6)

## Lists

- Bulleted lists
- With multiple items
  - Nested items

1. Numbered lists
2. Are also supported

## Code Blocks

\`\`\`typescript
// Language-specific syntax highlighting
function example() {
  return "Hello, Windsurf!";
}
\`\`\`

## Emphasis

**Bold text** for important rules
*Italic text* for rationale and notes

## Links

[Documentation](https://example.com)
```

### Rationale Pattern

Windsurf recognizes a **rationale pattern** for explaining rules:

```markdown
## Rules

- Write tests before code (TDD)
   - *Rationale: Ensures better design and prevents bugs*
- Test edge cases thoroughly
   - *Rationale: Edge cases are where bugs hide*
```

**Pattern**: Rule text followed by indented `*Rationale: explanation*`

### Example Pattern

Similarly, Windsurf recognizes **example patterns**:

```markdown
## Naming Conventions

- Use descriptive function names
   - Example: getUserById() not get()
- Use camelCase for variables
   - Example: userId not user_id
```

**Pattern**: Rule text followed by indented `Example: code snippet`

---

## Simplicity as Design

Windsurf's minimalism is **intentional design**, not a limitation.

### Advantages of Simplicity

#### 1. Zero Learning Curve

**Other formats**:
```yaml
# Learn YAML syntax
---
name: example
description: "Need to escape: quotes and special chars"
globs:
  - "**/*.ts"
tags: [typescript, rules]
---
```

**Windsurf**:
```markdown
# Example

Just write markdown. That's it.
```

#### 2. No Configuration Overhead

**Other formats**: Need to know frontmatter fields, glob syntax, inclusion modes, etc.

**Windsurf**: Write rules. Done.

#### 3. Universal Compatibility

No special parsing requirements:
- View on GitHub → Renders perfectly
- View in any markdown editor → Works
- View in plain text → Still readable
- Copy/paste anywhere → Just works

#### 4. Git-Friendly

```diff
# Simple, clear diffs
- Use useState for state
+ Use useState for local state
+ Use useReducer for complex state
```

No frontmatter noise, no YAML formatting changes, no special characters.

### Trade-offs of Simplicity

#### No Conditional Application

**Other formats** have conditional rules:
- Cursor: `globs: ["**/*.ts"]`
- Kiro: `fileMatchPattern: "**/*.test.ts"`
- Claude: CSO-based relevance

**Windsurf**: All rules apply to entire project, always.

**Mitigation**: Use section headers to organize by context
```markdown
## TypeScript-Specific Rules
[Rules that only apply to TS files]

## React Component Rules
[Rules for React components]

## API Route Rules
[Rules for API endpoints]
```

#### No Metadata

**Other formats** store:
- Author, version, tags
- Model preferences
- Tool configurations

**Windsurf**: No metadata storage. Rules are just rules.

**Mitigation**: Store metadata externally (e.g., in `prpm.json` for PRPM packages)

#### No Format-Specific Features

**Other formats**:
- Claude: Tools, model selection
- Cursor: Rule types, always apply
- Kiro: Inclusion modes, domains

**Windsurf**: Pure markdown content only.

**Mitigation**: Focus on clear, self-contained rule documentation

---

## PRPM's Implementation

### Parsing Windsurf Rules

Windsurf's simplicity means minimal parsing logic:

```typescript
export function fromWindsurf(
  content: string,
  metadata: {
    id: string;
    version?: string;
    author?: string;
    tags?: string[];
  }
): CanonicalPackage {
  const sections: Section[] = [];

  // Windsurf format is simple markdown - treat whole content as instructions
  const instructionsSection: InstructionsSection = {
    type: 'instructions',
    title: 'Windsurf Rules',
    content: content.trim(),
  };

  sections.push(instructionsSection);

  // Build canonical package
  const pkg: Partial<CanonicalPackage> = {
    id: metadata.id,
    name: metadata.id,
    version: metadata.version || '1.0.0',
    description: 'Windsurf rules',
    author: metadata.author || 'unknown',
    tags: metadata.tags || [],
    sourceFormat: 'windsurf',
    content: {
      format: 'canonical',
      version: '1.0',
      sections,
    },
  };

  // Set taxonomy
  setTaxonomy(pkg, 'windsurf', 'rule');

  return pkg as CanonicalPackage;
}
```

**Key insight**: Content is preserved as-is. No complex parsing needed.

### Format Detection

Detecting Windsurf format is straightforward:

```typescript
export function isWindsurfFormat(content: string): boolean {
  const trimmed = content.trim();

  // If it starts with YAML frontmatter, it's NOT Windsurf
  if (trimmed.startsWith('---')) {
    return false;
  }

  // Check for common markdown patterns
  const hasMarkdown = /^#+ /.test(trimmed) ||      // Headers
                      /^- /.test(trimmed) ||        // Lists
                      /^[0-9]+\. /.test(trimmed);   // Numbered lists

  return hasMarkdown || trimmed.length > 0;
}
```

**Logic**:
1. Frontmatter (---) → NOT Windsurf (probably Cursor/Claude)
2. Has markdown patterns → Likely Windsurf
3. Has content → Could be Windsurf

### Converting to Windsurf

Conversion is about **simplification** - stripping metadata:

```typescript
export function toWindsurf(pkg: CanonicalPackage): ConversionResult {
  const lines: string[] = [];
  const warnings: string[] = [];
  let qualityScore = 100;

  // Add title (without icon)
  const title = pkg.metadata?.title || pkg.name;
  lines.push(`# ${title}`);
  lines.push('');

  // Add description
  if (pkg.description || pkg.metadata?.description) {
    lines.push(pkg.description || pkg.metadata?.description || '');
    lines.push('');
  } else {
    qualityScore -= 10;
    warnings.push('No description provided');
  }

  // Convert sections
  for (const section of pkg.content.sections) {
    // Skip metadata section
    if (section.type === 'metadata') {
      continue;
    }

    // Add section title
    if ('title' in section && section.title) {
      lines.push(`## ${section.title}`);
      lines.push('');
    }

    // Convert based on section type
    switch (section.type) {
      case 'instructions':
      case 'context':
        if (section.content) {
          lines.push(section.content);
          lines.push('');
        }
        break;

      case 'rules':
        // Convert to bulleted/numbered list
        for (let i = 0; i < section.items.length; i++) {
          const rule = section.items[i];
          const prefix = section.ordered ? `${i + 1}.` : '-';

          lines.push(`${prefix} ${rule.content}`);

          // Add rationale pattern
          if (rule.rationale) {
            lines.push(`   - *Rationale: ${rule.rationale}*`);
          }

          // Add example pattern
          if (rule.examples && rule.examples.length > 0) {
            for (const example of rule.examples) {
              lines.push(`   - Example: ${example}`);
            }
          }
        }
        lines.push('');
        break;

      case 'examples':
        // Convert to markdown code blocks
        for (const example of section.examples) {
          if (example.description) {
            lines.push(example.description);
            lines.push('');
          }

          if (example.code) {
            const language = example.language || '';
            lines.push(`\`\`\`${language}`);
            lines.push(example.code);
            lines.push('```');
            lines.push('');
          }
        }
        break;

      case 'tools':
        warnings.push('Tools configuration may not be supported by Windsurf');
        qualityScore -= 10;
        break;

      case 'persona':
        // Convert persona to text description
        if (section.data.name && section.data.role) {
          const icon = section.data.icon || '🤖';
          lines.push(`${icon} **${section.data.name}** - ${section.data.role}`);
          lines.push('');
        }
        break;
    }
  }

  return {
    content: lines.join('\n').trim(),
    format: 'windsurf',
    filename: '.windsurfrules',
    warnings: warnings.length > 0 ? warnings : undefined,
    qualityScore,
  };
}
```

**Conversion strategy**:
- ✅ Preserve markdown structure
- ✅ Convert sections to appropriate markdown
- ✅ Use rationale and example patterns
- ⚠️ Warn when dropping format-specific features

---

## Conversion & Taxonomy

### Taxonomy Mapping

```typescript
{
  format: 'windsurf',
  subtype: 'rule',  // All Windsurf files are rules
  tags: [
    'windsurf',
    // Additional tags from package metadata
  ]
}
```

### Cross-Format Conversion

#### Cursor → Windsurf

```markdown
# Before (.cursor/rules/react-patterns.mdc)
---
title: React Patterns
description: React best practices
tags: [react, typescript]
globs:
  - "**/*.tsx"
  - "**/*.jsx"
ruleType: always
alwaysApply: true
---

# React Patterns

## Component Structure
- Use functional components
- Keep components small

# After (.windsurfrules)
# React Patterns

React best practices

## Component Structure
- Use functional components
- Keep components small
```

**Changes**:
- ✅ Frontmatter stripped (pure markdown)
- ✅ Content preserved
- ⚠️ **Lost**: All metadata (tags, globs, ruleType)
- ⚠️ **Lost**: Conditional application (globs)

#### Claude → Windsurf

```markdown
# Before (.claude/skills/testing/SKILL.md)
---
name: testing-patterns
description: Unit testing best practices
tags: testing, jest, vitest
---

# Testing Patterns

## Test Structure
- Use describe blocks
- One assertion per test

# After (.windsurfrules)
# Testing Patterns

Unit testing best practices

## Test Structure
- Use describe blocks
- One assertion per test
```

**Changes**:
- ✅ Frontmatter stripped
- ✅ Description becomes subtitle
- ⚠️ **Lost**: Tags, name metadata
- ⚠️ **Lost**: CSO optimization

#### Kiro → Windsurf

```markdown
# Before (.kiro/steering/api-design.md)
---
inclusion: fileMatch
fileMatchPattern: "src/api/**/*.ts"
domain: backend
---

# API Design Principles

- Use RESTful conventions
- Version your APIs

# After (.windsurfrules)
# API Design Principles

## API Guidelines
- Use RESTful conventions
- Version your APIs
```

**Changes**:
- ✅ Frontmatter stripped
- ✅ Content preserved
- ⚠️ **Lost**: Inclusion mode, file pattern, domain
- ⚠️ **Lost**: Context-specific activation

---

## Technical Design Decisions

### Decision 1: Single InstructionsSection

**Problem**: Should we parse markdown structure into multiple sections?

**Options**:
1. Parse headers → separate sections
2. Parse lists → rules sections
3. Keep as single instructions section

**Decision**: Option 3 - Single instructions section

**Rationale**:
- Windsurf doesn't define section semantics
- Markdown structure is user-defined
- Preserves user's exact formatting
- Simplifies parsing logic

**Implementation**:
```typescript
const instructionsSection: InstructionsSection = {
  type: 'instructions',
  title: 'Windsurf Rules',
  content: content.trim(),  // Entire file as-is
};
```

### Decision 2: Format Detection Heuristics

**Problem**: How to reliably detect Windsurf vs plain markdown?

**Decision**: Negative detection - NOT Windsurf if has frontmatter

**Rationale**:
- Windsurf is distinguished by LACK of frontmatter
- Presence of frontmatter indicates Cursor/Claude/etc.
- Markdown patterns are too generic

**Implementation**:
```typescript
// Primary check: No frontmatter
if (trimmed.startsWith('---')) {
  return false;  // Has frontmatter → NOT Windsurf
}

// Secondary check: Has markdown content
const hasMarkdown = /^#+ /.test(trimmed) ||
                    /^- /.test(trimmed) ||
                    /^[0-9]+\. /.test(trimmed);

return hasMarkdown;
```

**Trade-off**:
- ✅ Simple, reliable detection
- ⚠️ Plain text file without markdown patterns might be misclassified

### Decision 3: Metadata Loss During Conversion

**Problem**: Converting from Cursor/Claude loses metadata. Store it somewhere?

**Options**:
1. Add frontmatter (breaks Windsurf format)
2. Store in comments
3. Accept metadata loss, warn user

**Decision**: Option 3 - Accept loss, provide warnings

**Rationale**:
- Adding frontmatter violates Windsurf's simplicity
- Comments clutter the file
- Users can store metadata in `prpm.json`

**Implementation**:
```typescript
if (pkg.metadata?.tags) {
  warnings.push('Tags will be lost (Windsurf has no metadata)');
  qualityScore -= 5;
}

if (pkg.metadata?.globs) {
  warnings.push('File patterns will be lost (Windsurf applies to all files)');
  qualityScore -= 10;
}
```

### Decision 4: Rationale and Example Patterns

**Problem**: Windsurf recognizes `*Rationale:*` and `Example:` patterns. Generate them?

**Decision**: Generate patterns when canonical has rationale/examples

**Rationale**:
- Preserves semantic meaning
- Uses Windsurf conventions
- Improves readability

**Implementation**:
```typescript
lines.push(`${prefix} ${rule.content}`);

// Add rationale pattern
if (rule.rationale) {
  lines.push(`   - *Rationale: ${rule.rationale}*`);
}

// Add example pattern
if (rule.examples && rule.examples.length > 0) {
  for (const example of rule.examples) {
    lines.push(`   - Example: ${example}`);
  }
}
```

### Decision 5: Quality Scoring for Simplicity

**Problem**: How to score Windsurf conversions when features are lost?

**Decision**: Deduct for lost features, but don't penalize too heavily

**Rationale**:
- Feature loss is expected (simplicity is the goal)
- Some packages convert better than others
- Users need to know conversion quality

**Scoring**:
```typescript
let qualityScore = 100;

if (!pkg.description) {
  qualityScore -= 10;  // Missing description
}

if (hasTools) {
  qualityScore -= 10;  // Tools not supported
}

if (hasComplexFrontmatter) {
  qualityScore -= 5;   // Metadata lost
}

// Even with losses, score stays reasonable
// 75-85 is typical for complex → simple conversion
```

---

## Best Practices

### 1. Use Clear Section Headers

**❌ Bad**: Flat structure
```markdown
# Rules

- Use TypeScript
- Write tests
- Document code
- Use ESLint
- Handle errors
```

**✅ Good**: Organized sections
```markdown
# Development Guidelines

## Language & Type Safety
- Use TypeScript for all new code
- Enable strict mode in tsconfig.json

## Testing
- Write tests before code (TDD)
- Aim for 80%+ code coverage

## Code Quality
- Document public APIs
- Use ESLint with recommended config
- Handle all errors explicitly
```

### 2. Include Context with Rules

**❌ Bad**: Rules without explanation
```markdown
## Guidelines
- Use functional components
- Avoid class components
- Use hooks
```

**✅ Good**: Rules with rationale
```markdown
## Component Guidelines

- Use functional components with hooks
   - *Rationale: Simpler code, better reusability, modern React standard*
- Avoid class components
   - *Rationale: Deprecated pattern, more boilerplate, harder to test*
```

### 3. Provide Code Examples

**❌ Bad**: Abstract advice
```markdown
- Handle errors properly
```

**✅ Good**: Concrete examples
```markdown
## Error Handling

Always use try-catch for async operations:

\`\`\`typescript
try {
  const data = await fetchData();
  return { success: true, data };
} catch (error) {
  logger.error('Fetch failed', error);
  return { success: false, error };
}
\`\`\`
```

### 4. Organize by Domain

```markdown
# Project Guidelines

## TypeScript
[TypeScript-specific rules]

## React Components
[React-specific rules]

## API Routes
[Backend API rules]

## Database
[Database access rules]

## Testing
[Testing conventions]
```

### 5. Keep It Concise

**❌ Bad**: Novel-length rules
```markdown
# Testing Guidelines

When writing tests you should always make sure that you follow best practices which include writing tests before you write code because this ensures that you think about the design of your code before implementing it and this leads to better code quality and fewer bugs in the long run and you should also make sure that you test edge cases because...
```

**✅ Good**: Scannable points
```markdown
# Testing Guidelines

- Write tests before code (TDD)
- Test edge cases thoroughly
- Maintain 80%+ code coverage
- Use descriptive test names
- Keep tests isolated
```

---

## Future Enhancements

### 1. Optional Frontmatter

**Idea**: Support **optional** minimal frontmatter

```markdown
---
version: 1.0.0
---

# Rules

[Rules content]
```

**Benefits**:
- Version tracking
- Still 99% markdown
- Backwards compatible (files without frontmatter still work)

### 2. Inline Metadata Comments

**Idea**: Use HTML comments for metadata

```markdown
<!--
  @windsurf-version: 1.0.0
  @tags: typescript, react
  @author: team
-->

# Rules

[Rules content]
```

**Benefits**:
- Invisible when rendered
- Machine-readable
- Doesn't break simplicity

### 3. Multi-File Support

**Idea**: Support `.windsurfrules/` directory

```
.windsurfrules/
├── typescript.md
├── react.md
└── testing.md
```

**Benefits**:
- Better organization for large projects
- Modular rules files
- Still plain markdown

### 4. Rule Templates

**Idea**: Standard templates for common scenarios

```bash
prpm init windsurf --template typescript-node
# Generates .windsurfrules with Node.js + TypeScript rules

prpm init windsurf --template react-spa
# Generates .windsurfrules with React SPA rules
```

---

## Conclusion

Windsurf's single-file, plain-markdown approach represents **simplicity as a feature**:

- **Zero configuration**: Just drop a markdown file in your repo
- **Universal compatibility**: Works everywhere markdown works
- **Git-friendly**: Clear, simple diffs
- **Approachable**: Anyone can contribute

PRPM's implementation respects this simplicity:
- ✅ Minimal parsing (content preserved as-is)
- ✅ Lossless roundtrip for simple content
- ✅ Clear warnings when features are lost
- ✅ Quality scoring reflects conversion fidelity

The format's main strengths:
- Simplest possible syntax
- No learning curve
- Perfect for small-to-medium projects
- Great for open source (anyone can contribute)

The format's main limitations:
- No conditional application
- No metadata storage
- No format-specific features
- Less suitable for complex, multi-domain projects

As Windsurf evolves, we expect:
- Potential optional frontmatter
- Multi-file organization
- Better tooling integration
- Template library

PRPM will continue to support Windsurf's evolution while preserving its core simplicity.

---

## Additional Resources

- [Windsurf Documentation](https://windsurf.ai/docs)
- [PRPM Windsurf Examples](https://github.com/pr-pm/prpm/tree/main/examples/windsurf)
- [PRPM Format Conversion System](/docs/FORMAT_CONVERSION.md)

---

**Questions or feedback?** Open an issue on [GitHub](https://github.com/pr-pm/prpm/issues) or join our [Discord community](https://discord.gg/prpm).
