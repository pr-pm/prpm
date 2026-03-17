# Cursor Plugin Format Specification

**File Location:** `.cursor-plugin/plugin.json` (manifest)
**Format:** JSON manifest with component directories
**Official Docs:** https://cursor.com/docs/plugins/building

## Overview

Cursor plugins are bundles containing rules, skills, agents, commands, hooks, and MCP server configurations. Each plugin is defined by a `plugin.json` manifest inside a `.cursor-plugin/` directory, with component files organized in conventional directories.

## Plugin Structure

```
my-plugin/
├── .cursor-plugin/
│   └── plugin.json        # Required manifest
├── rules/                 # .mdc files with YAML frontmatter
├── skills/                # Subdirectories with SKILL.md
├── agents/                # Markdown files
├── commands/              # Markdown or text files
├── hooks/                 # hooks.json configuration
├── .mcp.json              # MCP server definitions
├── assets/                # Logo and static files
└── README.md
```

## Manifest Fields (plugin.json)

### Required Fields

- **`name`** (string): Unique identifier, lowercase kebab-case with alphanumerics, hyphens, and periods

### Optional Fields

- **`description`** (string): Brief explanation of plugin functionality
- **`version`** (string): Semantic versioning (e.g., 1.0.0)
- **`author`** (object): `{ name: string, email?: string }`
- **`homepage`** (string): Plugin homepage URL
- **`repository`** (string): Repository URL
- **`license`** (string): SPDX license identifier
- **`keywords`** (string[]): Discovery/categorization tags
- **`logo`** (string): Relative path to SVG or absolute URL
- **`rules`** (string | string[]): Path(s) to rule files/directories
- **`agents`** (string | string[]): Path(s) to agent files/directories
- **`skills`** (string | string[]): Path(s) to skill directories
- **`commands`** (string | string[]): Path(s) to command files/directories
- **`hooks`** (string | object): Path to hooks.json or inline config
- **`mcpServers`** (string | object | string[]): Path to .mcp.json, inline config, or array

## Component Types

### Rules (.mdc files in `rules/`)

```yaml
---
description: Brief rule explanation
alwaysApply: true
globs: "**/*.ts"
---
Rule content in markdown.
```

### Skills (`skills/{name}/SKILL.md`)

```yaml
---
name: skill-identifier
description: When to use this skill
---
Skill instructions.
```

### Agents (markdown files in `agents/`)

```yaml
---
name: agent-identifier
description: Agent purpose
---
Agent instructions.
```

### Commands (markdown files in `commands/`)

```yaml
---
name: command-identifier
description: What the command does
---
Command instructions.
```

### Hooks (`hooks/hooks.json`)

```json
{
  "hooks": {
    "sessionStart": [{ "command": "./scripts/setup.sh" }],
    "afterFileEdit": [{ "command": "./scripts/lint.sh", "matcher": "*.ts" }]
  }
}
```

### MCP Servers (`.mcp.json`)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

## Auto-Discovery

When manifest paths aren't specified, plugins use folder-based discovery:
- Rules: `rules/` (`.md`, `.mdc`, `.markdown` files)
- Skills: `skills/` (subdirectories containing `SKILL.md`)
- Agents: `agents/` (markdown files)
- Commands: `commands/` (`.md`, `.mdc`, `.markdown`, `.txt` files)
- Hooks: `hooks/hooks.json`
- MCP Servers: `.mcp.json`

## Conversion Notes

### From Cursor Plugin to Canonical

- `name` maps to package name/id
- `author` object is serialized to `"Name <email>"` string format
- `mcpServers` (inline objects only) stored in `cursorPlugin` metadata for roundtrip
- Component file paths stored in `cursorPlugin.contents`
- `description` becomes an instructions section

### From Canonical to Cursor Plugin

- Author string is parsed back to `{ name, email }` object
- `cursorPlugin` metadata is restored to plugin.json fields
- Tags map to `keywords`

## Limitations

- String/array path references for `mcpServers` are not resolved (only inline objects)
- Plugin component files (rules, agents, etc.) are tracked by path, not content
- Multi-plugin repositories (`marketplace.json`) are not yet supported

## Examples

### Minimal Plugin

```json
{
  "name": "my-plugin"
}
```

### Full Plugin

```json
{
  "name": "dev-toolkit",
  "description": "Development toolkit with linting and testing support",
  "version": "1.0.0",
  "author": { "name": "Jane Doe", "email": "jane@example.com" },
  "keywords": ["typescript", "testing", "linting"],
  "license": "MIT",
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

## Related Documentation

- [Cursor Plugin Docs](https://cursor.com/docs/plugins/building)
- [Cursor Rules](https://cursor.com/docs/context/rules)
- [Claude Plugin Format](./claude-plugin.md)

## Changelog

- **2026-02-18**: Initial Cursor plugin format support
