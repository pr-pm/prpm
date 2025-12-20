# Amp Format Specification

**File Locations:**
- AGENTS.md: CWD and parent directories (up to `$HOME`), subtree directories, `~/.config/amp/AGENTS.md`, `~/.config/AGENTS.md`
- Skills: `.agents/skills/<skill-name>/SKILL.md` or `~/.config/amp/skills/<skill-name>/SKILL.md`
- Commands: `.agents/commands/<command>.md` or `~/.config/amp/commands/<command>.md`
- Settings: `~/.config/amp/settings.json`

**Format:** Markdown with optional YAML frontmatter
**Official Docs:** https://ampcode.com/manual

## Overview

Amp is an AI-powered code editor by Sourcegraph. It uses AGENTS.md files for project guidance, skills for reusable patterns, and custom commands for extending functionality.

**Key Features:**
- **AGENTS.md files**: Project-specific guidance with optional glob-based filtering
- **Skills**: Reusable patterns with bundled tools and MCP servers
- **Custom commands**: Markdown or executable files that extend prompt input
- **@-mentions**: File inclusion syntax for referencing other files
- **Claude Code compatibility**: Accepts AGENT.md or CLAUDE.md as fallbacks

## AGENTS.md Format

AGENTS.md files provide project-specific guidance to Amp. They are plain markdown with optional YAML frontmatter.

### File Resolution Order

1. Current working directory and parent directories (up to `$HOME`)
2. Subtree directories (included when agent reads files in subtree)
3. `$HOME/.config/amp/AGENTS.md`
4. `$HOME/.config/AGENTS.md`

**Fallback files**: If no AGENTS.md exists, Amp accepts `AGENT.md` or `CLAUDE.md`.

### Frontmatter Fields (Optional)

- **`globs`** (string | string[]): Glob patterns for conditional inclusion
  - Files with `globs` are only included when matching file types are accessed
  - Globs implicitly prefix with `**/` unless they start with `../` or `./`

### Content Format

- Plain markdown with project-specific instructions
- Supports @-mentions for including other files (e.g., `@doc/conventions.md`)
- Relative paths are interpreted relative to the agent file location
- Glob patterns supported in @-mentions (e.g., `@doc/*.md`)

### AGENTS.md Example

```markdown
---
globs:
  - '**/*.ts'
  - '**/*.tsx'
---

# TypeScript Guidelines

These rules apply when working with TypeScript files.

## Coding Standards

- Use strict null checks
- Prefer interfaces over type aliases
- Export types explicitly

## Architecture

See @docs/architecture.md for details.

@docs/api-conventions.md
```

## Skills Format

Skills are reusable patterns stored in dedicated directories with a required SKILL.md file.

### Directory Structure

```
.agents/skills/my-skill/
├── SKILL.md (required, case-insensitive)
├── tools/ (optional, for executables)
└── mcp.json (optional, for bundled MCP servers)
```

### Installation Locations

- `.agents/skills/` (workspace root, recommended)
- `~/.config/amp/skills/` (home directory)
- `.claude/skills/` (Claude Code compatibility)
- `~/.claude/skills/` (Claude Code compatibility)

### Frontmatter Fields

#### Required Fields

- **`name`** (string): Skill identifier (lowercase letters, numbers, hyphens only)
- **`description`** (string): Brief overview of functionality and when to use it

#### Optional Fields

- **`argument-hint`** (string): Hint shown for skill invocation (e.g., `"[query]"`)
- **`disable-model-invocation`** (boolean): When `true`, prevents the model from auto-invoking this skill (default: `false`)

### Skill Example

```markdown
---
name: code-review
description: Reviews code for best practices, security issues, and improvements
argument-hint: "[file or directory]"
---

# Code Review Skill

You are an expert code reviewer focused on quality and security.

## Review Process

1. Check for code smells and anti-patterns
2. Verify error handling
3. Look for security vulnerabilities
4. Suggest improvements with examples

## Output Format

Provide a structured review with:
- Summary of findings
- Specific issues with line numbers
- Suggested fixes
```

### Bundled Tools

Skills can include executable tools in a `tools/` directory. Tools follow the same input/output format as Amp toolbox tools (JSON on stdin/stdout).

### Bundled MCP Servers

Skills can bundle MCP server configurations via `mcp.json`:

```json
{
  "server-name": {
    "command": "npx",
    "args": ["-y", "package@latest"],
    "includeTools": ["tool_pattern_*"]
  }
}
```

## Custom Commands Format

Custom commands extend the prompt with additional content.

### File Locations

- `.agents/commands/` (workspace)
- `~/.config/amp/commands/` (home directory)

### File Types

1. **Markdown files** (`.md` extension): Content appended directly to prompt
2. **Executable files**: Must have execute bit set or shebang on first line; output (max 50k characters) appended to prompt

### Frontmatter Fields (Optional)

- **`description`** (string): Brief description shown when listing commands

### Command Example

```markdown
---
description: Deploy the application to production
---

# Deploy Command

Deploy the application with the following steps:

1. Run all tests
2. Build the production bundle
3. Deploy to production server
4. Verify deployment health
5. Notify team in Slack
```

## MCP Configuration

Amp supports Model Context Protocol (MCP) servers.

### Settings Location

MCP servers are configured in `~/.config/amp/settings.json` under the `amp.mcpServers` key.

### Local Server Format

```json
{
  "amp.mcpServers": {
    "server-name": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {"VAR": "value"}
    }
  }
}
```

### Remote Server Format

```json
{
  "amp.mcpServers": {
    "server-name": {
      "url": "https://example.com/mcp",
      "headers": {"Authorization": "token ${TOKEN_VAR}"}
    }
  }
}
```

## Best Practices

### AGENTS.md

1. Keep instructions concise and actionable
2. Use `globs` to apply rules only to relevant file types
3. Use @-mentions to include shared documentation
4. Place specific rules in subtree AGENTS.md files

### Skills

1. Choose descriptive names following `lowercase-with-hyphens` pattern
2. Write clear descriptions for discoverability
3. Use `argument-hint` to guide users on expected input
4. Bundle tools and MCP servers when skills need external functionality
5. Keep skills focused on a single responsibility

### Commands

1. Include a `description` for discoverability
2. Use markdown files for static prompts
3. Use executable files when dynamic content is needed
4. Keep output under 50k characters for executables

## Conversion Notes

### From Amp to Canonical

The `fromAmp()` converter:
1. Parses optional YAML frontmatter
2. Detects subtype based on frontmatter fields:
   - `name` + `description` → `skill`
   - `globs` only or no frontmatter → `rule` (agent/guidance)
3. Preserves Amp-specific metadata for roundtrip conversion
4. Converts markdown body to instructions section

### From Canonical to Amp

The `toAmp()` converter:
1. Generates YAML frontmatter based on subtype
2. Restores Amp-specific fields from metadata
3. Converts sections to markdown:
   - `metadata` → frontmatter (name, description)
   - `instructions` → body content
4. Handles skill-specific fields (argument-hint, disable-model-invocation)

## Limitations

- @-mentions in content are not processed during conversion (kept as-is)
- Bundled tools/ directory and mcp.json are not included in package content
- Executable commands cannot be converted (only markdown commands)
- Glob patterns in frontmatter are file-type specific

## PRPM Integration

### Installation

Install Amp packages with:

```bash
prpm install <package-name> --format amp
```

Packages are installed to:
- Skills: `.agents/skills/<skill-name>/SKILL.md`
- Commands: `.agents/commands/<command-name>.md`
- Rules/Agents: `AGENTS.md` (merged or created)

### Publishing

Publish Amp packages:

```bash
# From project directory
prpm publish
```

Your `prpm.json` should specify:

```json
{
  "name": "@username/package-name",
  "version": "1.0.0",
  "format": "amp",
  "subtype": "skill",
  "description": "Package description",
  "files": [".agents/skills/my-skill/SKILL.md"]
}
```

### Conversion

Convert between Amp and other formats:

```bash
# Convert Amp skill to Claude skill
prpm convert SKILL.md --from amp --to claude

# Convert Claude skill to Amp
prpm convert skill.md --from claude --to amp
```

## Related Documentation

- [Amp Manual](https://ampcode.com/manual)
- [Amp Skills](https://ampcode.com/manual#skills)
- [Amp Custom Commands](https://ampcode.com/manual#custom-commands)
- [PRPM Format Guide](../../docs/formats.mdx)

## Changelog

- **2025-12**: Initial Amp format support
  - Added fromAmp and toAmp converters
  - Support for skills and commands
  - AGENTS.md with glob-based filtering
  - JSON schemas for validation
