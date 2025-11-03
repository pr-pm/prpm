# Package Manifest (prpm.json)

Guide for creating `prpm.json` package manifests to publish your prompts, rules, skills, and agents to the PRPM registry.

## Overview

`prpm.json` is a manifest file that describes packages you want to publish to the PRPM registry. It's **only needed if you're publishing packages** - regular users installing packages don't need this file.

### Who Needs This File?

- ✅ Package authors publishing to the PRPM registry
- ✅ Organizations sharing internal prompts/rules
- ✅ Developers creating collections of packages
- ❌ Regular users installing packages (use `.prpmrc` instead)

## Quick Start

### Single Package

Create `prpm.json` in your repository root:

```json
{
  "name": "my-awesome-skill",
  "version": "1.0.0",
  "description": "Clear, concise description of what this package does",
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "repository": "https://github.com/username/repo",
  "format": "claude",
  "subtype": "skill",
  "tags": ["typescript", "best-practices", "code-quality"],
  "files": [
    ".claude/skills/my-awesome-skill/SKILL.md"
  ]
}
```

### Multi-Package Repository

For repositories with multiple packages:

```json
{
  "name": "my-packages",
  "author": "Your Name",
  "license": "MIT",
  "repository": "https://github.com/username/repo",
  "organization": "your-org",
  "packages": [
    {
      "name": "package-one",
      "version": "1.0.0",
      "description": "First package",
      "format": "claude",
      "subtype": "agent",
      "tags": ["automation", "workflows"],
      "files": [".claude/agents/package-one.md"]
    },
    {
      "name": "package-two",
      "version": "1.0.0",
      "description": "Second package",
      "format": "cursor",
      "subtype": "rule",
      "tags": ["best-practices", "cursor"],
      "files": [".cursor/rules/package-two.mdc"]
    }
  ]
}
```

## Required Fields

### Single Package

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Unique package name (kebab-case) | `"typescript-type-safety"` |
| `version` | string | Semantic version | `"1.0.0"` |
| `description` | string | Clear package description | `"Enforce strict TypeScript type safety"` |
| `author` | string | Author name and optional email | `"John Doe <john@example.com>"` |
| `license` | string | SPDX license identifier | `"MIT"`, `"Apache-2.0"` |
| `format` | string | Target AI tool format | `"claude"`, `"cursor"`, `"windsurf"` |
| `subtype` | string | Package type | `"skill"`, `"agent"`, `"rule"` |
| `files` | string[] | **Full paths** from project root | `[".claude/skills/my-skill/SKILL.md"]` |

### Multi-Package

When using a `packages` array, top-level fields can be inherited:

```json
{
  "name": "repository-name",
  "author": "Shared Author",
  "license": "MIT",
  "repository": "https://github.com/username/repo",
  "packages": [
    {
      "name": "individual-package",
      "version": "1.0.0",
      "description": "Package-specific description",
      "format": "claude",
      "subtype": "skill",
      "files": [".claude/skills/my-skill/SKILL.md"]
    }
  ]
}
```

Packages inherit `author`, `license`, and `repository` unless overridden.

## File Paths

**CRITICAL:** File paths must be **full paths from project root** (where `prpm.json` lives).

### Why Full Paths?

File paths in `prpm.json` are used for:
1. **Tarball creation** - Reads files directly from these paths
2. **Snippet extraction** - Shows file preview before install
3. **Installation** - CLI derives destination from format/subtype

### Correct Path Format

**✅ Correct - Full paths from project root:**

```json
{
  "format": "claude",
  "subtype": "agent",
  "files": [".claude/agents/my-agent.md"]
}
```

```json
{
  "format": "claude",
  "subtype": "skill",
  "files": [
    ".claude/skills/my-skill/SKILL.md",
    ".claude/skills/my-skill/EXAMPLES.md",
    ".claude/skills/my-skill/README.md"
  ]
}
```

```json
{
  "format": "cursor",
  "subtype": "rule",
  "files": [".cursor/rules/my-rule.mdc"]
}
```

```json
{
  "format": "claude",
  "subtype": "slash-command",
  "files": [".claude/commands/git/commit.md"]
}
```

**❌ Wrong - Relative paths without directory prefix:**

```json
{
  "files": ["agents/my-agent.md"]  // Missing .claude/ prefix
}
```

```json
{
  "files": ["SKILL.md"]  // Missing full path
}
```

```json
{
  "files": ["rules/my-rule.mdc"]  // Missing .cursor/ prefix
}
```

### Path Patterns by Format

| Format | Subtype | Path Pattern | Example |
|--------|---------|--------------|---------|
| `claude` | `agent` | `.claude/agents/name.md` | `.claude/agents/blog-writer.md` |
| `claude` | `skill` | `.claude/skills/name/SKILL.md` | `.claude/skills/typescript-safety/SKILL.md` |
| `claude` | `slash-command` | `.claude/commands/category/name.md` | `.claude/commands/git/commit.md` |
| `cursor` | `rule` | `.cursor/rules/name.mdc` | `.cursor/rules/best-practices.mdc` |
| `windsurf` | `rule` | `.windsurf/rules/name.md` | `.windsurf/rules/git-workflow.md` |
| `continue` | `prompt` | `.continue/prompts/name.md` | `.continue/prompts/refactor.md` |

## Formats and Subtypes

### Supported Formats

| Format | Description | File Extensions |
|--------|-------------|-----------------|
| `claude` | Claude Code (Anthropic) | `.md` |
| `cursor` | Cursor IDE | `.mdc`, `.md` |
| `windsurf` | Windsurf IDE | `.md` |
| `continue` | Continue.dev | `.md` |
| `copilot` | GitHub Copilot | `.md` |
| `kiro` | Kiro IDE | `.chatmode.md` |
| `agents.md` | Agents.md format | `.md` |
| `generic` | Universal format | `.md` |
| `mcp` | Model Context Protocol | `.json` |

### Supported Subtypes

| Subtype | Description | Best For |
|---------|-------------|----------|
| `agent` | Autonomous multi-step agents | Complex workflows, automation |
| `skill` | Specialized knowledge/capabilities | Domain expertise, best practices |
| `rule` | IDE rules and guidelines | Coding standards, conventions |
| `slash-command` | Executable commands | Quick actions, shortcuts |
| `prompt` | Reusable prompt templates | Common tasks, queries |
| `chatmode` | Chat modes | Kiro IDE interactions |
| `tool` | MCP tools | External integrations |

**Note:** Collections are not a package subtype. They are defined separately in the `collections` array in prpm.json. See the [Collections Guide](./COLLECTIONS.md).

## Tags

Tags make packages discoverable in the registry. Use 3-8 relevant tags per package.

### Tag Format

- Use **kebab-case**: `typescript`, `best-practices`, `code-review`
- Be **specific**: `react-hooks` not just `react`
- Mix **technology**, **domain**, and **purpose** tags

### Tag Categories

**Technology Tags:**
```json
["typescript", "python", "react", "nextjs", "postgresql", "docker"]
```

**Domain Tags:**
```json
["testing", "deployment", "security", "documentation", "ci-cd"]
```

**Purpose Tags:**
```json
["best-practices", "troubleshooting", "automation", "code-review"]
```

**Meta Tags:**
```json
["meta", "prpm-internal", "prpm-development"]
```

### Good vs Bad Tags

**✅ Good:**
```json
{
  "tags": [
    "typescript",
    "type-safety",
    "static-analysis",
    "code-quality",
    "best-practices"
  ]
}
```

**❌ Bad:**
```json
{
  "tags": [
    "code",           // Too generic
    "TypeScript",     // Wrong case (use kebab-case)
    "type_safety",    // Wrong format (use kebab-case)
    "stuff"           // Meaningless
  ]
}
```

## Versioning

Follow [Semantic Versioning](https://semver.org):

- **Major (1.0.0 → 2.0.0)**: Breaking changes
- **Minor (1.0.0 → 1.1.0)**: New features, backward compatible
- **Patch (1.0.0 → 1.0.1)**: Bug fixes, backward compatible

### When to Bump Versions

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Typo fix | Patch | 1.0.0 → 1.0.1 |
| Minor improvement | Patch | 1.0.0 → 1.0.1 |
| New section/feature | Minor | 1.0.0 → 1.1.0 |
| Additional examples | Minor | 1.0.0 → 1.1.0 |
| Complete rewrite | Major | 1.0.0 → 2.0.0 |
| Breaking change | Major | 1.0.0 → 2.0.0 |
| Renamed fields | Major | 1.0.0 → 2.0.0 |

## Organization

For multi-package repositories, organize packages logically:

### Recommended Order

1. **Privacy** - Private packages first
2. **Format** - Group by format (claude, cursor, etc.)
3. **Subtype** - Group by subtype (agent, skill, rule)

```json
{
  "packages": [
    // Private > Claude > Agents
    {
      "name": "internal-agent",
      "private": true,
      "format": "claude",
      "subtype": "agent"
    },

    // Private > Claude > Skills
    {
      "name": "internal-skill",
      "private": true,
      "format": "claude",
      "subtype": "skill"
    },

    // Private > Cursor > Rules
    {
      "name": "internal-rule",
      "private": true,
      "format": "cursor",
      "subtype": "rule"
    },

    // Public > Claude > Skills
    {
      "name": "public-skill",
      "format": "claude",
      "subtype": "skill"
    },

    // Public > Cursor > Rules
    {
      "name": "public-rule",
      "format": "cursor",
      "subtype": "rule"
    }
  ]
}
```

### Naming Conventions

**Package Names:**
- Use kebab-case: `typescript-type-safety`
- Be descriptive: `react-best-practices` not `react-bp`
- Avoid duplicates: If you have Claude and Cursor versions, use suffixes
  - `format-conversion-skill` (Claude skill)
  - `format-conversion` (Cursor rule)

## Private Packages

Mark packages as private to exclude them from the public registry:

```json
{
  "name": "internal-tool",
  "version": "1.0.0",
  "description": "Internal company tool",
  "private": true,
  "format": "claude",
  "subtype": "skill",
  "tags": ["internal", "company-specific"],
  "files": [".claude/skills/internal-tool/SKILL.md"]
}
```

Private packages:
- Won't appear in public registry searches
- Can still be published to private registries
- Useful for company-internal prompts/rules

## Publishing

### Prerequisites

1. Create `prpm.json` in your repository
2. Ensure all files in `files` arrays exist
3. Test locally:
   ```bash
   prpm publish --dry-run
   ```

### Publish Command

```bash
# Publish all packages
prpm publish

# Publish specific package
prpm publish --package my-skill

# Dry run (test without publishing)
prpm publish --dry-run
```

### Publishing Workflow

The CLI will:
1. Validate your `prpm.json`
2. Verify all files exist
3. Create package tarball(s)
4. Upload to registry
5. Make available for installation

## Validation

### Before Publishing

Run these checks:

```bash
# Validate JSON syntax
cat prpm.json | jq .

# Check for duplicate names
cat prpm.json | jq -r '.packages[].name' | sort | uniq -d

# Verify files exist
# (all files in "files" arrays should exist)
```

### Validation Checklist

**Required Fields:**
- [ ] All packages have `name`, `version`, `description`
- [ ] All packages have `format` and `subtype`
- [ ] All packages have `files` array with full paths
- [ ] Top-level has `author` and `license`

**File Verification:**
- [ ] All files in `files` arrays exist
- [ ] Paths use full paths from project root (start with `.claude/`, `.cursor/`, etc.)
- [ ] No absolute paths (no `/Users/...`)

**No Duplicates:**
- [ ] No duplicate package names

**Tags:**
- [ ] Tags use kebab-case
- [ ] 3-8 relevant tags per package
- [ ] Tags are specific and searchable

**Organization:**
- [ ] Private packages listed first (multi-package)
- [ ] Packages grouped by format and subtype (multi-package)

## Common Mistakes

### ❌ Missing Directory Prefix

```json
{
  "files": ["agents/my-agent.md"]
  // Should be: [".claude/agents/my-agent.md"]
}
```

### ❌ Relative Paths

```json
{
  "files": ["../other-dir/file.md"]
  // Should be absolute from project root
}
```

### ❌ Absolute Paths

```json
{
  "files": ["/Users/me/project/.claude/agents/my-agent.md"]
  // Should be: [".claude/agents/my-agent.md"]
}
```

### ❌ Duplicate Names

```json
{
  "packages": [
    { "name": "my-skill", "format": "claude" },
    { "name": "my-skill", "format": "cursor" }
    // Second should be: "my-skill-rule" or similar
  ]
}
```

### ❌ Wrong Tag Format

```json
{
  "tags": ["TypeScript", "Code_Quality", "bestPractices"]
  // Should be: ["typescript", "code-quality", "best-practices"]
}
```

### ❌ Missing Required Fields

```json
{
  "name": "my-skill"
  // Missing: version, description, author, license, format, subtype, files
}
```

## Examples

### Claude Skill

```json
{
  "name": "typescript-type-safety",
  "version": "1.0.0",
  "description": "Eliminate TypeScript any types and enforce strict type safety",
  "author": "PRPM Team <team@prpm.dev>",
  "license": "MIT",
  "repository": "https://github.com/pr-pm/prpm",
  "format": "claude",
  "subtype": "skill",
  "tags": [
    "typescript",
    "type-safety",
    "code-quality",
    "best-practices",
    "static-analysis"
  ],
  "files": [
    ".claude/skills/typescript-type-safety/SKILL.md"
  ]
}
```

### Cursor Rule

```json
{
  "name": "git-workflow",
  "version": "1.0.0",
  "description": "Best practices for Git commit messages and branch naming",
  "author": "PRPM Team",
  "license": "MIT",
  "format": "cursor",
  "subtype": "rule",
  "tags": [
    "git",
    "version-control",
    "best-practices",
    "workflow"
  ],
  "files": [
    ".cursor/rules/git-workflow.mdc"
  ]
}
```

### Multi-File Skill

```json
{
  "name": "slash-command-builder",
  "version": "1.0.0",
  "description": "Guide for creating effective Claude Code slash commands",
  "author": "PRPM Team",
  "license": "MIT",
  "format": "claude",
  "subtype": "skill",
  "tags": [
    "meta",
    "slash-commands",
    "claude-code",
    "documentation"
  ],
  "files": [
    ".claude/skills/slash-command-builder/SKILL.md",
    ".claude/skills/slash-command-builder/EXAMPLES.md",
    ".claude/skills/slash-command-builder/FRONTMATTER.md",
    ".claude/skills/slash-command-builder/PATTERNS.md"
  ]
}
```

### Collection

Collections are defined in the `collections` array within prpm.json:

```json
{
  "name": "my-prompts-repo",
  "author": "PRPM Team",
  "license": "MIT",
  "packages": [
    {
      "name": "typescript-rules",
      "version": "1.0.0",
      "description": "TypeScript coding standards",
      "format": "cursor",
      "subtype": "rule",
      "tags": ["typescript"],
      "files": [".cursor/rules/typescript.mdc"]
    }
  ],
  "collections": [
    {
      "id": "typescript-complete",
      "name": "Complete TypeScript Setup",
      "description": "Complete TypeScript development setup with best practices",
      "version": "1.0.0",
      "category": "development",
      "tags": ["typescript", "best-practices", "setup"],
      "packages": [
        {
          "packageId": "typescript-type-safety",
          "version": "^1.0.0",
          "required": true,
          "reason": "Enforces strict type checking"
        },
        {
          "packageId": "typescript-strict",
          "version": "^1.0.0",
          "required": true
        },
        {
          "packageId": "eslint-typescript",
          "version": "^1.0.0",
          "required": false,
          "reason": "Optional linting configuration"
        }
      ]
    }
  ]
}
```

See the [Collections Guide](./COLLECTIONS.md) for more details on creating collections.

## Schema Validation

PRPM validates packages against a JSON schema. Reference the schema in your `prpm.json`:

```json
{
  "$schema": "https://prpm.dev/schemas/manifest.json",
  "name": "my-package",
  ...
}
```

This enables:
- IDE autocomplete
- Real-time validation
- Error detection before publishing

## Best Practices

1. **Use semantic versioning** - Follow semver strictly
2. **Write clear descriptions** - Help users understand what your package does
3. **Tag appropriately** - Use 3-8 specific, searchable tags
4. **Test before publishing** - Always run `--dry-run` first
5. **Keep versions in sync** - For multi-package repos, update related packages together
6. **Document breaking changes** - Use major version bumps and document changes
7. **Organize logically** - Private → Format → Subtype for multi-package repos
8. **Verify file paths** - Ensure all files exist and use full paths from project root

## See Also

- [CLI Reference](./CLI.md) - Publishing commands
- [Package Types](./PACKAGE_TYPES.md) - Detailed subtype information
- [Collections Guide](./COLLECTIONS.md) - Creating package collections
- [Examples](./EXAMPLES.md) - Real-world usage examples

## Getting Help

- 💬 **[GitHub Discussions](https://github.com/pr-pm/prpm/discussions)** - Ask questions
- 🐛 **[GitHub Issues](https://github.com/pr-pm/prpm/issues)** - Report problems
- 📧 **Email**: team@prpm.dev

---

*Generated with [Claude Code](https://claude.com/claude-code)*
