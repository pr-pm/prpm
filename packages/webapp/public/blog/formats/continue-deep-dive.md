# Continue Dev Prompts: A Technical Deep Dive

**Published**: 2025-01-XX
**Author**: PRPM Team
**Format**: Continue (`.continue/prompts/*.md`)
**Status**: Production

---

## Table of Contents

1. [Introduction](#introduction)
2. [Format Specification](#format-specification)
3. [Prompts vs Context Providers](#prompts-vs-context-providers)
4. [PRPM's Implementation](#prpms-implementation)
5. [Conversion & Taxonomy](#conversion--taxonomy)
6. [Technical Design Decisions](#technical-design-decisions)
7. [Best Practices](#best-practices)
8. [Future Enhancements](#future-enhancements)

---

## Introduction

Continue is a VS Code extension that brings ChatGPT-style AI assistance directly into your editor. Unlike other AI coding tools, Continue emphasizes **customizable prompts** and **context providers** to give developers full control over AI interactions.

Continue's prompt system is:
- **Slash command-based**: Invoke prompts with `/command-name`
- **Context-aware**: Attach code, files, docs to prompts
- **Developer-friendly**: Simple markdown format
- **Composable**: Combine prompts with context providers

The philosophy: **Give developers building blocks to create their own AI workflows**.

---

## Format Specification

### Directory Structure

Continue prompts live in `.continue/prompts/`:

```
.continue/
└── prompts/
    ├── explain-code.md
    ├── write-tests.md
    ├── refactor-function.md
    └── review-pr.md
```

**Key conventions**:
- One file per prompt
- Filename becomes slash command (e.g., `explain-code.md` → `/explain-code`)
- Files use `.md` extension
- Prompts are markdown with YAML frontmatter

### File Structure

Continue prompts use markdown with YAML frontmatter:

```markdown
---
name: explain-code
description: Explain what the selected code does in simple terms
temperature: 0.3
---

# Explain Code

You are a code documentation expert. Explain the following code clearly and concisely.

Focus on:
- What the code does (high-level purpose)
- How it works (key logic)
- Why certain approaches were used
- Any potential issues or improvements

{{selectedCode}}

Provide your explanation in markdown format with code examples where helpful.
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Prompt identifier (matches filename) |
| `description` | string | Yes | Short description shown in autocomplete |
| `temperature` | number | No | Model temperature (0.0-1.0) |
| `maxTokens` | number | No | Maximum response length |
| `systemMessage` | string | No | Override default system message |

### Template Variables

Continue supports template variables for dynamic content:

```markdown
{{selectedCode}}        # Currently selected code
{{currentFile}}         # Full content of current file
{{currentFileName}}     # Name of current file
{{currentFilePath}}     # Path of current file
{{clipboardContent}}    # Content from clipboard
{{userInput}}           # User's input after slash command
```

**Example with variables**:
```markdown
---
name: add-tests
description: Generate unit tests for selected function
---

# Generate Unit Tests

Create comprehensive unit tests for this function:

\`\`\`{{currentFileLanguage}}
{{selectedCode}}
\`\`\`

**File**: {{currentFileName}}

Generate tests that cover:
- Happy path scenarios
- Edge cases
- Error handling
- Invalid inputs

Use the same testing framework as the rest of the project.
```

---

## Prompts vs Context Providers

Continue has two main customization types:

### Prompts (`.continue/prompts/*.md`)

**Purpose**: Pre-defined AI instructions invoked via slash commands
**Format**: Markdown with YAML frontmatter
**Activation**: User types `/prompt-name`
**Use case**: Reusable AI workflows

**Examples**:
- `/explain-code` - Explain selected code
- `/write-tests` - Generate unit tests
- `/refactor` - Suggest refactoring
- `/review` - Review code changes

### Context Providers

**Purpose**: Dynamic data sources attached to prompts
**Format**: TypeScript/JavaScript plugins
**Activation**: Automatically or via `@provider-name`
**Use case**: Inject project-specific context

**Examples**:
- `@docs` - Fetch documentation
- `@codebase` - Search codebase semantically
- `@git` - Include git history
- `@terminal` - Include terminal output

**Combining them**:
```
/explain-code @docs @codebase

This will:
1. Run the "explain-code" prompt
2. Attach relevant documentation (@docs)
3. Attach similar code from codebase (@codebase)
```

---

## PRPM's Implementation

### Format Aliasing to Claude

Continue uses the same markdown + YAML format as Claude, so PRPM aliases the parsers:

```typescript
// from-continue.ts
export { fromClaude as fromContinue } from './from-claude.js';

// to-continue.ts
export { toClaude as toContinue } from './to-claude.js';
```

**Why this works**:
- Both use YAML frontmatter
- Both use markdown body
- Frontmatter fields overlap (name, description)
- Template variables are preserved in markdown

### Parsing Continue Prompts

Since Continue aliases to Claude, the parsing logic is identical:

```typescript
export function fromContinue(
  content: string,
  metadata: {
    id: string;
    version?: string;
    author?: string;
    tags?: string[];
  }
): CanonicalPackage {
  // Uses fromClaude internally
  return fromClaude(content, metadata);
}
```

**What gets parsed**:
1. YAML frontmatter → metadata section
2. Markdown body → instructions/rules/examples sections
3. Template variables → preserved as-is in content
4. Subtype detection → defaults to 'prompt'

### Converting to Continue Format

```typescript
export function toContinue(
  pkg: CanonicalPackage,
  options: { continueConfig?: { temperature?: number; maxTokens?: number } } = {}
): ConversionResult {
  // Uses toClaude internally
  const result = toClaude(pkg, options);

  // Customize for Continue if needed
  return {
    ...result,
    format: 'continue',
  };
}
```

### Template Variable Preservation

Template variables are preserved during conversion:

```markdown
# Before (canonical)
## Instructions
Explain this code:
{{selectedCode}}

# After (Continue)
---
name: explain-code
description: Explain selected code
---

# Explain Code
Explain this code:
{{selectedCode}}
```

**Implementation**:
- Template variables are just text in markdown
- No parsing or substitution during conversion
- Variables are preserved exactly as written

---

## Conversion & Taxonomy

### Taxonomy Mapping

```typescript
{
  format: 'continue',
  subtype: 'prompt',  // Continue files are slash commands (prompts)
  tags: [
    'continue',
    'code-explanation',  // From content analysis
    'documentation'
  ]
}
```

### Subtype Detection

Continue prompts are always subtype `'prompt'`:

```typescript
// All Continue files are prompts (slash commands)
if (pkg.sourceFormat === 'continue') {
  setTaxonomy(pkg, 'continue', 'prompt');
}
```

### Cross-Format Conversion

#### Cursor → Continue

```markdown
# Before (.cursor/rules/explain-code.mdc)
---
title: Code Explanation
description: Explains code clearly
globs:
  - "**/*.ts"
  - "**/*.tsx"
---

# Code Explanation

Explain code with examples.

# After (.continue/prompts/explain-code.md)
---
name: explain-code
description: Explains code clearly
temperature: 0.3
---

# Code Explanation

Explain code with examples.

Use {{selectedCode}} to reference the code.
```

**Changes**:
- ✅ Frontmatter converted (title → name)
- ✅ Added Continue-specific fields (temperature)
- ✅ Added template variable hint
- ⚠️ **Lost**: `globs` (Continue doesn't have conditional application)

#### Claude → Continue

```markdown
# Before (.claude/skills/code-explainer/SKILL.md)
---
name: code-explainer
description: Explains code in simple terms
tags: documentation, explanation
---

# Code Explainer

Explain code clearly and concisely.

# After (.continue/prompts/code-explainer.md)
---
name: code-explainer
description: Explains code in simple terms
---

# Code Explainer

Explain code clearly and concisely.

**Selected code:**
{{selectedCode}}
```

**Changes**:
- ✅ Frontmatter mostly compatible
- ✅ Added template variable for selected code
- ⚠️ **Lost**: `tags` (Continue has no tags field)

#### Kiro → Continue

```markdown
# Before (.kiro/steering/code-review.md)
---
inclusion: manual
---

# Code Review Checklist

- Check for type safety
- Verify error handling
- Review test coverage

# After (.continue/prompts/code-review.md)
---
name: code-review
description: Comprehensive code review checklist
---

# Code Review Checklist

Review the following code:
{{selectedCode}}

Check for:
- Type safety
- Error handling
- Test coverage
```

**Changes**:
- ✅ Manual inclusion → slash command (both on-demand)
- ✅ Added template variable
- ✅ Added clear frontmatter
- ⚠️ **Lost**: `inclusion` mode (Continue doesn't have this concept)

---

## Technical Design Decisions

### Decision 1: Alias to Claude Parser

**Problem**: Continue uses markdown + YAML just like Claude. Build separate parser?

**Options**:
1. Duplicate Claude parser code
2. Alias to Claude parser
3. Build shared base parser

**Decision**: Option 2 - Alias to Claude parser

**Rationale**:
- Formats are structurally identical
- Same frontmatter fields (name, description)
- Both use markdown for content
- Reduces maintenance burden

**Implementation**:
```typescript
export { fromClaude as fromContinue } from './from-claude.js';
export { toClaude as toContinue } from './to-claude.js';
```

**Trade-offs**:
- ✅ Zero code duplication
- ✅ Consistent parsing behavior
- ⚠️ Continue-specific quirks must be handled via config
- ⚠️ Less visibility into Continue-specific usage patterns

### Decision 2: Template Variable Handling

**Problem**: Continue uses template variables like `{{selectedCode}}`. Parse or preserve?

**Options**:
1. Parse and substitute during conversion
2. Parse into special section type
3. Preserve as plain text

**Decision**: Option 3 - Preserve as plain text

**Rationale**:
- Variables are runtime-substituted by Continue, not build-time
- Parsing would require knowing available variables
- Plain text preservation is lossless
- Users can add/modify variables freely

**Implementation**:
- Template variables are just text in markdown
- No special handling during parsing
- Variables survive roundtrip conversion

**Example**:
```markdown
# Input
Explain: {{selectedCode}}

# Canonical (instructions section)
content: "Explain: {{selectedCode}}"

# Output to Continue
Explain: {{selectedCode}}
```

### Decision 3: Subtype Classification

**Problem**: Are Continue prompts "prompts", "slash-commands", or "rules"?

**Decision**: Classify as `'prompt'` subtype

**Rationale**:
- Continue calls them "prompts"
- They're invoked via slash commands, but that's the mechanism
- "prompt" is more semantic (what they are) vs "slash-command" (how they're invoked)
- Consistent with PRPM taxonomy

**Implementation**:
```typescript
if (pkg.sourceFormat === 'continue') {
  setTaxonomy(pkg, 'continue', 'prompt');
}
```

### Decision 4: Temperature and Model Config

**Problem**: Continue supports `temperature` and `maxTokens` in frontmatter. How to store?

**Decision**: Store in metadata, allow config override on conversion

**Rationale**:
- These are Continue-specific runtime configs
- Should survive roundtrip conversion
- Users may want to override per-installation

**Implementation**:
```typescript
// Parse from frontmatter
if (frontmatter.temperature !== undefined) {
  metadataSection.data.continueConfig = {
    temperature: frontmatter.temperature,
    maxTokens: frontmatter.maxTokens
  };
}

// Convert back
const temperature = options?.continueConfig?.temperature ||
                   pkg.metadata?.continueConfig?.temperature;
if (temperature !== undefined) {
  lines.push(`temperature: ${temperature}`);
}
```

### Decision 5: Filename to Slash Command Mapping

**Problem**: Continue derives slash command from filename. How to preserve?

**Decision**: Store original filename in metadata, suggest on conversion

**Rationale**:
- Filename is semantic (readable slash command)
- Package ID may differ from filename
- Users should know suggested filename

**Implementation**:
```typescript
// On parse
pkg.metadata.continueConfig = {
  suggestedFilename: originalFilename  // e.g., "explain-code.md"
};

// On convert
const filename = options?.filename ||
                pkg.metadata?.continueConfig?.suggestedFilename ||
                `${pkg.id}.md`;

return {
  content,
  filename,  // Include in conversion result
  format: 'continue'
};
```

---

## Best Practices

### 1. Use Descriptive Slash Command Names

**❌ Bad**: Generic names
```
/explain
/help
/do
```

**✅ Good**: Specific, actionable names
```
/explain-code
/generate-tests
/review-pr
/refactor-function
```

**Why**: Clear names make prompts discoverable and predictable.

### 2. Provide Template Variable Guidance

**❌ Bad**: Assume user knows variables
```markdown
Explain the code and suggest improvements.
```

**✅ Good**: Show available variables
```markdown
Explain the following code and suggest improvements:

\`\`\`
{{selectedCode}}
\`\`\`

**File**: {{currentFileName}}
**Path**: {{currentFilePath}}
```

**Why**: Users need to know what context is available.

### 3. Set Appropriate Temperature

**❌ Bad**: Default temperature for all tasks
```yaml
# No temperature set, uses default
```

**✅ Good**: Match temperature to task

```yaml
# Creative tasks (code generation, brainstorming)
temperature: 0.7

# Deterministic tasks (explanation, review)
temperature: 0.3

# Highly consistent tasks (formatting, linting)
temperature: 0.0
```

**Guidelines**:
- **0.0-0.3**: Deterministic tasks (explanation, analysis, review)
- **0.4-0.6**: Balanced tasks (refactoring, optimization)
- **0.7-1.0**: Creative tasks (code generation, architecture design)

### 4. Include Clear Instructions

**❌ Bad**: Vague prompt
```markdown
Review this code.
```

**✅ Good**: Specific criteria
```markdown
# Code Review

Review the following code for:

## Security
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection

## Performance
- [ ] Unnecessary loops
- [ ] Inefficient algorithms
- [ ] Memory leaks

## Code Quality
- [ ] Type safety
- [ ] Error handling
- [ ] Test coverage

**Code:**
\`\`\`
{{selectedCode}}
\`\`\`
```

### 5. Combine Prompts with Context Providers

**❌ Bad**: Prompt in isolation
```
/explain-code
```

**✅ Good**: Prompt with relevant context
```
/explain-code @docs @codebase

This gives the AI:
- Your selected code
- Relevant documentation (@docs)
- Similar code patterns (@codebase)
```

**Common combinations**:
- `/review-pr @git` - Include git diff
- `/write-tests @codebase` - Reference existing test patterns
- `/debug-error @terminal` - Include error logs
- `/explain-code @docs` - Reference official documentation

---

## Future Enhancements

### 1. Multi-Step Prompts

**Idea**: Chain prompts together

```markdown
---
name: full-feature
description: Build complete feature with tests
steps:
  - generate-code
  - write-tests
  - review-code
---

# Build Full Feature

This prompt will:
1. Generate implementation code
2. Create unit tests
3. Review both for issues
```

### 2. Prompt Parameters

**Idea**: Accept runtime parameters

```markdown
---
name: generate-component
description: Generate React component with props
parameters:
  - name: componentName
    type: string
    required: true
  - name: withTests
    type: boolean
    default: true
---

# Generate Component: {{componentName}}

\`\`\`tsx
export function {{componentName}}() {
  // Component implementation
}
\`\`\`

{{#if withTests}}
// Generate tests
{{/if}}
```

**Usage**: `/generate-component componentName="UserCard" withTests=true`

### 3. Prompt Library Discovery

**Idea**: Browse and install community prompts

```bash
# Search Continue prompt registry
prpm search continue-prompts

# Install popular prompt
prpm install @continue/code-reviewer --as continue

# Installs to .continue/prompts/code-reviewer.md
```

### 4. Smart Variable Detection

**Idea**: Suggest variables based on content

```markdown
# Prompt with no variables
Explain the selected code.

# Continue suggests:
💡 Add {{selectedCode}} to show the code being explained
💡 Add {{currentFileName}} to provide file context
```

### 5. Prompt Testing Framework

**Idea**: Test prompts with fixtures

```yaml
# .continue/prompts/explain-code.test.yml
prompt: explain-code
fixtures:
  - name: simple-function
    selectedCode: |
      function add(a, b) { return a + b; }
    expectedOutput:
      - contains: "adds two numbers"
      - contains: "returns the sum"
```

---

## Conclusion

Continue's prompt system represents a **developer-first** approach to AI coding assistance:

- **Slash commands** provide familiar CLI-like UX
- **Template variables** enable dynamic context injection
- **Markdown format** keeps prompts simple and readable
- **Context providers** add powerful composability

PRPM's implementation leverages format similarity:
- ✅ Aliases to Claude parser (zero duplication)
- ✅ Template variable preservation (lossless)
- ✅ Temperature and config storage (roundtrip-safe)
- ✅ Filename to slash command mapping
- ✅ Format detection and classification

The format's main strengths:
- Simple, familiar markdown
- Developer-friendly slash command UX
- Powerful context provider system
- Easy to version control

The format's main limitations:
- No built-in conditional application (unlike Kiro)
- Limited frontmatter compared to Cursor MDC
- No built-in CSO like Claude skills

As Continue evolves, we expect:
- Richer prompt composition
- Better context provider integration
- Prompt marketplace/registry
- Testing and validation tools

PRPM will continue to support these enhancements and ensure seamless conversion across all formats.

---

## Additional Resources

- [Continue Documentation](https://continue.dev/docs)
- [Continue Prompt Examples](https://github.com/continuedev/continue/tree/main/extensions/vscode/prompts)
- [PRPM Continue Format Examples](https://github.com/pr-pm/prpm/tree/main/examples/continue)
- [PRPM Format Conversion System](/docs/FORMAT_CONVERSION.md)

---

**Questions or feedback?** Open an issue on [GitHub](https://github.com/pr-pm/prpm/issues) or join our [Discord community](https://discord.gg/prpm).
