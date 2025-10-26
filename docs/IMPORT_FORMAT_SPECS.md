# Import Format Specifications

This document outlines the expected file structure and format requirements for importing prompts from different AI coding assistants into PRPM. Use this as a reference when building import repositories or tools.

## Table of Contents

- [GitHub Copilot](#github-copilot)
- [Windsurf](#windsurf)
- [Kiro](#kiro)
- [General Requirements](#general-requirements)

---

## GitHub Copilot

### Overview

GitHub Copilot uses markdown files with optional YAML frontmatter to define instructions that customize its behavior.

### File Locations

| Type | Location | Purpose |
|------|----------|---------|
| Repository-wide | `.github/copilot-instructions.md` | Applies to entire repository |
| Path-specific | `.github/instructions/*.instructions.md` | Applies to specific file patterns |
| Chat modes | `.github/chatmodes/*.chatmode.md` | Custom chat personas for specific tasks |
| AGENTS.md | `AGENTS.md` (anywhere in repo) | Alternative format, nearest file takes precedence |
| CLAUDE.md | `CLAUDE.md` (root) | Alternative single-file format |
| GEMINI.md | `GEMINI.md` (root) | Alternative single-file format |

### File Formats

#### Repository-Wide Instructions

**File**: `.github/copilot-instructions.md`

```markdown
# React Best Practices

Follow these React guidelines throughout the project.

## Component Structure

- Use functional components with hooks
- Keep components small and focused
- Separate business logic from presentation

## State Management

- Use useState for local state
- Use useReducer for complex state logic
- Consider Context API for shared state
```

**Characteristics**:
- No frontmatter required
- Pure markdown content
- Applies globally to all files in repository

#### Path-Specific Instructions

**File**: `.github/instructions/<name>.instructions.md`

```markdown
---
applyTo:
  - src/**/*.test.ts
  - src/**/*.test.tsx
---

# Testing Guidelines

Apply these rules when working with test files.

## Test Structure

- Use describe blocks for grouping
- One assertion per test when possible
- Use meaningful test names

## Best Practices

- Test behavior, not implementation
- Mock external dependencies
- Maintain test independence
```

**Characteristics**:
- **Requires YAML frontmatter** with `applyTo` field
- `applyTo` can be a string or array of glob patterns
- Markdown content follows frontmatter

#### Custom Chat Modes

**File**: `.github/chatmodes/<name>.chatmode.md`

```markdown
---
description: Security-focused code reviewer
tools:
  - workspace
  - codebase
model: gpt-4
---

# Security Reviewer Mode

You are a security-focused code reviewer with deep expertise in secure coding practices.

## Your Role

- Identify potential security vulnerabilities
- Suggest secure alternatives
- Explain security implications

## Focus Areas

- Input validation and sanitization
- Authentication and authorization
- Data encryption and protection
- Secure API design
- OWASP Top 10 vulnerabilities

## Review Approach

1. Analyze code for security risks
2. Provide specific, actionable feedback
3. Reference security best practices
4. Suggest remediation strategies
```

**Frontmatter Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | `string` | No | Brief description of the chat mode's purpose |
| `tools` | `string[]` | No | Available tools (workspace, codebase, terminal, etc.) |
| `model` | `string` | No | Specific AI model to use (e.g., gpt-4, claude-3) |

**Content Guidelines**:
- Define the persona/role clearly
- Specify the mode's focus areas
- Provide behavioral guidelines
- Include example workflows if applicable

**Use Cases**:
- Security reviewer mode
- Architecture planning mode
- Refactoring assistant mode
- Documentation generator mode
- Test writing specialist mode

### Frontmatter Schema

#### Path-Specific Instructions

```yaml
---
applyTo: string | string[]  # Required for path-specific instructions
---
```

**Field Details**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `applyTo` | `string \| string[]` | Yes* | Glob pattern(s) for target files (*only for path-specific) |

**Glob Pattern Examples**:
- `src/**/*.ts` - All TypeScript files in src (recursive)
- `**/*.test.ts` - All test files anywhere
- `src/api/*.ts` - Files directly in src/api (non-recursive)
- Multiple patterns: `["src/**/*.ts", "lib/**/*.ts"]`

#### Chat Modes

```yaml
---
description: string  # Optional: Brief description
tools: string[]      # Optional: Available tools
model: string        # Optional: Specific model
---
```

**Field Details**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | `string` | No | Brief description of chat mode purpose |
| `tools` | `string[]` | No | Available tools (workspace, codebase, terminal) |
| `model` | `string` | No | Specific AI model to use |

### Content Guidelines

**Supported**:
- ✅ Instructions and guidelines
- ✅ Rules and best practices
- ✅ Code examples and snippets
- ✅ Reference documentation
- ✅ Markdown formatting (headings, lists, code blocks, etc.)
- ✅ Chat mode personas and roles

**Not Supported** (will be ignored/skipped):
- ❌ Custom variables or templating (beyond what Copilot supports)

### Example Structures

#### Complete Chat Mode Example

```
project/
└── .github/
    └── chatmodes/
        ├── security-review.chatmode.md
        ├── architecture-plan.chatmode.md
        └── test-writer.chatmode.md
```

**security-review.chatmode.md**:
```markdown
---
description: Security-focused code reviewer
tools:
  - workspace
  - codebase
---

# Security Reviewer

You are an expert in application security and secure coding practices.

## Your Expertise

- OWASP Top 10 vulnerabilities
- Secure authentication patterns
- Data protection and encryption
- API security best practices

## Review Process

1. Analyze code for security vulnerabilities
2. Identify potential attack vectors
3. Suggest secure alternatives
4. Explain security implications clearly

## Communication Style

- Be thorough but concise
- Provide specific code examples
- Reference security standards (OWASP, NIST)
- Prioritize critical issues first
```

### Import Expectations

When importing Copilot instructions into PRPM:

1. **Repository-wide files**:
   - Must be named `copilot-instructions.md`
   - No frontmatter required
   - Place in `.github/` directory

2. **Path-specific files**:
   - Must have `.instructions.md` extension
   - Must include `applyTo` in frontmatter
   - Place in `.github/instructions/` directory

3. **Chat mode files**:
   - Must have `.chatmode.md` extension
   - Optional frontmatter with `description`, `tools`, `model`
   - Place in `.github/chatmodes/` directory

4. **Manifest (`prpm.json`)**:
```json
{
  "name": "@org/package-name",
  "version": "1.0.0",
  "description": "Package description",
  "format": "copilot",
  "subtype": "tool",
  "files": [
    ".github/copilot-instructions.md",
    // or
    ".github/instructions/testing.instructions.md",
    // or
    ".github/chatmodes/security-review.chatmode.md"
  ]
}
```

---

## Windsurf

### Overview

Windsurf uses a radically simple approach: plain markdown files with no frontmatter, located at `.windsurf/rules`. The format emphasizes maximum impact with minimum syntax.

### File Location

| Location | Purpose |
|----------|---------|
| `.windsurf/rules` | Main rules file (workspace directory) |
| `<subdir>/.windsurf/rules` | Optional sub-directory specific rules |
| `<parent>/.windsurf/rules` | Parent directory rules (up to git root) |

### File Format

Windsurf rules files are pure markdown with these characteristics:

```markdown
# Project Guidelines

This is a TypeScript monorepo using pnpm workspaces.

## Code Style

- Use functional components with TypeScript
- Prefer named exports over default exports
- Keep functions pure when possible
- Extract custom hooks for reusable logic

## Testing

- Write tests using Vitest
- Co-locate tests with source files
- Use descriptive test names that explain behavior
```

**Format Characteristics**:
- **No frontmatter** - Pure markdown only
- **12,000 character limit** per file (enforced by Windsurf)
- **Hierarchical** - Rules can exist at multiple directory levels
- **Simple** - No YAML, no special directives, no configuration

### Format Guidelines

| Guideline | Description |
|-----------|-------------|
| **Character Limit** | 12,000 characters maximum per file |
| **Simplicity** | Keep rules simple, concise, and specific |
| **Formatting** | Use bullet points, numbered lists, and markdown |
| **Organization** | Optional XML tags can group similar rules |
| **Hierarchy** | Place rules at appropriate directory levels |

### Content Guidelines

**Supported**:
- ✅ Instructions and guidelines
- ✅ Rules and best practices
- ✅ Code examples and snippets
- ✅ Markdown formatting (headings, lists, code blocks)
- ✅ XML-style tags for grouping (optional)

**Not Supported**:
- ❌ YAML frontmatter
- ❌ Metadata fields
- ❌ Conditional application patterns
- ❌ Tool configurations

### Example Structure

#### Single Project Rules

```
project/
└── .windsurf/
    └── rules    ← 12,000 char limit
```

#### Hierarchical Rules

```
monorepo/
├── .windsurf/
│   └── rules           ← Project-wide rules
├── packages/
│   ├── frontend/
│   │   └── .windsurf/
│   │       └── rules   ← Frontend-specific rules
│   └── backend/
│       └── .windsurf/
│           └── rules   ← Backend-specific rules
```

### Example Content

**Simple Rules**:
```markdown
# Coding Guidelines

- My project's programming language is Python
- Use early returns when possible
- Always add documentation when creating new functions and classes
```

**With Organization**:
```markdown
# Development Standards

## Language & Type Safety

- Use TypeScript strict mode
- Avoid `any` type - prefer `unknown` for dynamic types
- Define interfaces for all API responses

## Testing

- Write unit tests for all business logic
- Use integration tests for API endpoints
- Aim for 80%+ code coverage

## Code Quality

- Run ESLint before committing
- Use Prettier for formatting
- Keep functions under 50 lines
```

**With XML Grouping** (optional):
```markdown
# Project Rules

<security>
- Always validate user inputs
- Use parameterized queries for database access
- Encrypt sensitive data at rest
</security>

<performance>
- Use lazy loading for large datasets
- Implement caching where appropriate
- Optimize database queries
</performance>
```

### Import Expectations

When importing Windsurf rules into PRPM:

1. **File location**:
   - Must be named `rules` (no extension)
   - Must be in `.windsurf/` directory
   - Can exist at multiple directory levels

2. **Content validation**:
   - Pure markdown (no frontmatter)
   - Must be ≤ 12,000 characters
   - Should use markdown formatting

3. **Manifest (`prpm.json`)**:
```json
{
  "name": "@org/package-name",
  "version": "1.0.0",
  "description": "Package description",
  "format": "windsurf",
  "subtype": "rule",
  "files": [
    ".windsurf/rules"
  ]
}
```

### Character Limit Handling

**During Import**:
- Warn if content exceeds 12,000 characters
- Store content as-is (don't truncate)
- Add warning to package metadata

**During Export**:
- Warn if generated content exceeds 12,000 characters
- Mark as lossy conversion if over limit
- Reduce quality score by 20 points

**Best Practice**:
- Keep rules concise and focused
- Split complex rules across hierarchical files
- Use sub-directory rules for context-specific guidance

---

## Kiro

### Overview

Kiro uses markdown files with YAML frontmatter to define steering instructions that guide AI behavior. Instructions are organized by domain and support flexible activation modes.

### File Location

| Location | Purpose |
|----------|---------|
| `.kiro/steering/*.md` | All steering files (one domain per file) |

### File Format

All Kiro steering files follow this structure:

```markdown
---
inclusion: manual | always | fileMatch
domain: string
fileMatchPattern: string  # Required if inclusion is "fileMatch"
---

# Domain Name

Guidelines and instructions for this domain.

## Section 1

Content...

## Section 2

Content...
```

### Frontmatter Schema

```yaml
---
inclusion: string           # Required: "manual" | "always" | "fileMatch"
domain: string             # Optional: inferred from filename if not provided
fileMatchPattern: string   # Conditional: required if inclusion is "fileMatch"
---
```

**Field Details**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inclusion` | `string` | **Yes** | Activation mode: `manual`, `always`, or `fileMatch` |
| `domain` | `string` | No | Domain/topic identifier (defaults to filename) |
| `fileMatchPattern` | `string` | Conditional* | Glob pattern (*required if `inclusion` is `fileMatch`) |

### Inclusion Modes

#### 1. Manual (`manual`)

Apply only when explicitly requested by the user.

```yaml
---
inclusion: manual
domain: security
---

# Security Audit Checklist

Use this checklist when performing security reviews.
```

**Use cases**:
- Security audits
- Performance reviews
- Code refactoring guides
- Specialized workflows

#### 2. Always (`always`)

Apply to all AI interactions in the project.

```yaml
---
inclusion: always
domain: coding-standards
---

# Project Code Style

These standards apply to all code in this project.
```

**Use cases**:
- Code formatting rules
- Project-wide conventions
- Architectural decisions
- Core principles

#### 3. File Match (`fileMatch`)

Apply when working with files matching a specific pattern.

```yaml
---
inclusion: fileMatch
fileMatchPattern: "**/*.test.ts"
domain: testing
---

# Testing Guidelines

Apply these rules when writing tests.
```

**Use cases**:
- Test file conventions
- Component-specific rules
- API route standards
- File-type specific guidelines

### Glob Patterns

Kiro uses `.gitignore`-style glob patterns:

| Pattern | Matches |
|---------|---------|
| `**/*.test.ts` | All test files at any depth |
| `src/**/*.ts` | All TypeScript files in src (recursive) |
| `src/api/*.ts` | Files directly in src/api (non-recursive) |
| `src/components/**/*.tsx` | All TSX files in components (recursive) |
| `*.config.js` | Config files in root only |

### Content Guidelines

**Supported**:
- ✅ Instructions and guidelines
- ✅ Rules and best practices
- ✅ Code examples and snippets
- ✅ Architecture decisions
- ✅ DO/DON'T examples
- ✅ Rationale and context
- ✅ Markdown formatting

**Not Supported** (will be ignored/skipped):
- ❌ Persona definitions
- ❌ Tool configurations
- ❌ Custom variables or templating

### File Organization

One domain per file, organized by concern:

```
project/
└── .kiro/
    └── steering/
        ├── testing.md           # Test guidelines (fileMatch)
        ├── security.md          # Security rules (manual)
        ├── architecture.md      # Architecture decisions (always)
        ├── api-design.md        # API design principles (fileMatch)
        ├── react-components.md  # React patterns (fileMatch)
        └── code-style.md        # Style guide (always)
```

### Import Expectations

When importing Kiro steering files into PRPM:

1. **All files**:
   - Must be in `.kiro/steering/` directory
   - Must have `.md` extension
   - Must include `inclusion` field in frontmatter
   - One domain per file

2. **File naming**:
   - Use descriptive names: `testing.md`, not `test.md`
   - Domain name typically matches filename
   - Kebab-case preferred: `api-design.md`

3. **Frontmatter validation**:
   - `inclusion` is required
   - `fileMatchPattern` is required when `inclusion: fileMatch`
   - YAML must be valid (proper indentation, quotes)

4. **Manifest (`prpm.json`)**:
```json
{
  "name": "@org/package-name",
  "version": "1.0.0",
  "description": "Package description",
  "format": "kiro",
  "subtype": "rule",
  "files": [
    ".kiro/steering/testing.md",
    ".kiro/steering/security.md"
  ]
}
```

---

## General Requirements

### Directory Structure

All formats expect specific directory structures:

```
project/
├── .github/                        # Copilot
│   ├── copilot-instructions.md    # Repository-wide
│   ├── instructions/               # Path-specific
│   │   └── *.instructions.md
│   └── chatmodes/                  # Chat modes
│       └── *.chatmode.md
│
├── .kiro/                          # Kiro
│   └── steering/
│       └── *.md
│
├── AGENTS.md                       # Alternative Copilot format
├── CLAUDE.md                       # Alternative Copilot format
├── GEMINI.md                       # Alternative Copilot format
│
└── prpm.json                       # PRPM manifest
```

### Manifest Requirements

All packages must include a `prpm.json` manifest:

```json
{
  "name": "@scope/package-name",
  "version": "1.0.0",
  "description": "Clear, concise description",
  "format": "copilot" | "kiro",
  "subtype": "tool" | "rule" | "prompt",
  "tags": ["tag1", "tag2"],
  "files": ["path/to/file.md"]
}
```

**Required fields**:
- `name`: Package identifier (with optional scope)
- `version`: Semantic version (e.g., "1.0.0")
- `description`: Human-readable description
- `format`: Target platform (`copilot`, `kiro`)
- `files`: Array of file paths to include

**Recommended fields**:
- `subtype`: Package subtype for better categorization
- `tags`: Searchable tags
- `author`: Author name or organization
- `license`: License identifier (e.g., "MIT")

### File Content Guidelines

#### Markdown Best Practices

1. **Use clear headings**: H1 for title, H2 for sections, H3 for subsections
2. **Include examples**: Show both good and bad patterns
3. **Be specific**: Actionable rules, not vague suggestions
4. **Provide context**: Explain WHY, not just WHAT
5. **Use formatting**: Lists, code blocks, emphasis

#### Code Examples

- Use proper syntax highlighting (```typescript, ```python, etc.)
- Show both correct and incorrect patterns
- Keep examples focused and minimal
- Include inline comments when necessary

### Validation Checklist

Before importing, ensure:

- [ ] Files are in correct directory structure
- [ ] Frontmatter YAML is valid (if required)
- [ ] Required frontmatter fields are present
- [ ] Glob patterns are properly formatted
- [ ] File extensions are correct (`.md`, `.instructions.md`, `.chatmode.md`)
- [ ] `prpm.json` manifest exists and is valid
- [ ] Content is in markdown format
- [ ] Code blocks use proper syntax highlighting
- [ ] No unsupported features are used

---

## Additional Resources

- [GitHub Copilot Instructions Documentation](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [GitHub Copilot Custom Chat Modes](https://code.visualstudio.com/docs/copilot/customization/custom-chat-modes)
- [Kiro Steering Documentation](https://kiro.dev/docs/steering/)
- [PRPM CLI Documentation](./CLI.md)
- [PRPM Package Format Documentation](./PACKAGES.md)

---

## Import Tool Requirements

If you're building an import tool or repository, ensure:

1. **File Discovery**:
   - Scan appropriate directories (`.github/`, `.kiro/`)
   - Match expected file patterns
   - Handle nested directories correctly

2. **Frontmatter Parsing**:
   - Parse YAML frontmatter correctly
   - Validate required fields
   - Handle missing optional fields gracefully

3. **Content Extraction**:
   - Preserve markdown formatting
   - Extract content after frontmatter
   - Maintain code block syntax

4. **Manifest Generation**:
   - Generate valid `prpm.json`
   - Infer metadata from content where possible
   - Include all required fields

5. **Validation**:
   - Validate glob patterns
   - Check file paths exist
   - Verify YAML syntax
   - Ensure format compliance

6. **Error Handling**:
   - Report missing required fields
   - Warn about unsupported features
   - Provide actionable error messages
   - Suggest fixes for common issues
