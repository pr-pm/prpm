# OpenCode Format Specification

**File Locations:**
- Agents: `.opencode/agent/*.md` or `~/.config/opencode/agent/*.md`
- Skills: `.opencode/skills/${name}/SKILL.md` or `~/.config/opencode/skills/${name}/SKILL.md`
- Slash Commands: `.opencode/command/*.md` or `~/.config/opencode/command/*.md`
- Config: `opencode.json` or `opencode.jsonc` (JSON format alternative)

**Format:** Markdown with YAML frontmatter
**Official Docs:** https://opencode.ai/docs

## Overview

OpenCode is an AI coding assistant that uses specialized agents and slash commands to enhance developer productivity. Agents are AI assistants configured for specific tasks, while slash commands are user-triggered prompts with predefined templates.

**Key Features:**
- **Primary agents**: Main assistants for direct interaction (switchable via Tab key)
- **Subagents**: Specialized assistants invoked by primary agents or @ mentions
- **Skills**: Reusable instruction sets using Agent Skills spec (compatible with Codex, Copilot)
- **Slash commands**: Quick commands with template placeholders and dynamic content injection
- **Fine-grained permissions**: Tool access control with ask/allow/deny modes
- **Model flexibility**: Per-agent and per-command model overrides

## Agent Format

### Frontmatter Fields

#### Required Fields

- **`description`** (string): Brief explanation of the agent's purpose and use cases
- **`mode`** (string): Determines how the agent can be used
  - `"primary"` - Main assistant for direct interaction
  - `"subagent"` - Specialized assistant invoked by primary agents or @mentions
  - `"all"` - Default; usable in both contexts

#### Optional Fields

- **`model`** (string): Override default model (e.g., `"anthropic/claude-sonnet-4-20250514"`)
- **`temperature`** (number): Controls response randomness (0.0-1.0)
  - 0.0-0.2: Focused, analytical tasks
  - 0.6-1.0: Creative work
  - Defaults to model-specific values (typically 0, or 0.55 for Qwen models)
- **`prompt`** (string): Path to custom system prompt file using `{file:./path}` syntax
- **`maxSteps`** (number): Maximum number of iterations the agent can run. Unlimited if not set.
- **`tools`** (object): Enable/disable specific tools
  - Supports wildcards: `"mymcp_*": false` disables all MCP tools starting with `mymcp_`
  - Example: `{ "write": true, "edit": false, "bash": false }`
- **`permission`** (object): Manages tool access with values `"ask"`, `"allow"`, or `"deny"`
  - Can specify per-command bash permissions: `{ "bash": { "git push": "ask", "*": "allow" } }`
- **`disable`** (boolean): When `true`, deactivates the agent

#### Provider-Specific Fields

The schema allows additional properties to pass through to the model provider. Examples include:
- **`reasoningEffort`** (OpenAI): Controls reasoning depth
- **`textVerbosity`** (OpenAI): Controls response length

Note: Any additional fields not listed above will be passed to the model provider as-is.

### Agent Example

```markdown
---
description: Expert code reviewer focused on best practices and security
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  write: false
  edit: true
  bash: false
permission:
  edit: ask
---

# Code Review Agent

You are an expert code reviewer with deep knowledge of software engineering principles.

## Instructions

- Check for code smells and anti-patterns
- Verify test coverage
- Ensure documentation exists
- Review error handling and security
- Suggest improvements with examples

## Review Checklist

- [ ] Code follows project conventions
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities
- [ ] Documentation is clear
```

## Skill Format

OpenCode skills use the **Agent Skills spec** (shared with Codex and GitHub Copilot). Skills are reusable instruction sets discovered on-demand via the native skill tool.

**Directory:** `.opencode/skills/${name}/SKILL.md`

### Frontmatter Fields

#### Required Fields

- **`name`** (string): Skill identifier (1-64 chars)
  - Lowercase alphanumeric and hyphens only
  - Must match parent directory name
  - Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$`
- **`description`** (string): Explains what the skill does and when to use it (1-1024 chars)

#### Optional Fields

- **`license`** (string): Licensing terms (e.g., `"MIT"`)
- **`compatibility`** (string): Environment requirements (e.g., `"Requires git, docker"`)
- **`allowed-tools`** (string): Space-delimited list of pre-approved tools
- **`metadata`** (object): Arbitrary string key-value pairs

### Example Skill

```markdown
---
name: code-review
description: Reviews code for best practices, security issues, and improvements. Use when analyzing pull requests or conducting security audits.
license: MIT
compatibility: Requires git
allowed-tools: Bash(git:*) Read
metadata:
  category: development
  version: "1.0.0"
---

# Code Review Skill

You are an expert code reviewer.

## Instructions

- Check for code smells and anti-patterns
- Verify test coverage
- Identify security vulnerabilities
- Suggest improvements with examples
```

## Slash Command Format

### Frontmatter Fields

#### Required Fields

- **`template`** (string): The prompt text sent to the LLM when executed
  - Supports placeholders: `$ARGUMENTS`, `$1`, `$2`, `$3`, etc.
  - Bash injection: `` !`command` ``
  - File inclusion: `@filename`

#### Optional Fields

- **`description`** (string): Brief description shown in TUI when typing commands
- **`agent`** (string): Specifies which agent executes the command
- **`model`** (string): Overrides default model for this command
- **`subtask`** (boolean): Forces subagent invocation behavior

### Command Example

```markdown
---
description: Run tests for a specific file
template: |
  Run the tests for $1 and report the results.

  Test file: @$1

  Provide a summary of:
  - Pass/fail status
  - Coverage changes
  - Any failing tests with details
agent: test-runner
subtask: true
---

# Test Runner Command

Executes tests for the specified file and provides a detailed report.

## Usage

```
/test path/to/file.ts
```
```

### Template Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `$ARGUMENTS` | All passed arguments | `/cmd foo bar` → `"foo bar"` |
| `$1`, `$2`, `$3` | Positional arguments | `/cmd foo bar` → `$1="foo"`, `$2="bar"` |
| `` !`command` `` | Bash command output | `` !`git status` `` injects git output |
| `@filename` | File content | `@README.md` includes file content |

## Best Practices

### Agents

1. **Use descriptive modes**: Choose `primary`, `subagent`, or `all` based on intended usage
2. **Set appropriate temperature**:
   - 0.0-0.2 for code review, debugging, analysis
   - 0.6-1.0 for documentation, brainstorming
3. **Restrict tools when needed**: Disable `write` and `bash` for review-only agents
4. **Use glob patterns for bash**: `"git *": "ask"` for all git commands
5. **Leverage wildcards**: `"mymcp_*": false` to disable groups of tools
6. **Create specialized agents**: Dedicated agents for review, debug, docs, testing

### Slash Commands

1. **Include description**: Helps users understand command purpose in TUI
2. **Use argument placeholders**: Make commands flexible with `$1`, `$2`, etc.
3. **Leverage file inclusion**: Use `@filename` to include context
4. **Choose appropriate agent**: Assign commands to specialized agents
5. **Override built-ins when needed**: Custom commands can replace `/init`, `/undo`, etc.

## Conversion Notes

### From OpenCode to Canonical

The `fromOpencode()` converter:
1. Parses YAML frontmatter
2. Extracts agent-specific fields (`mode`, `temperature`, `tools`, `permission`)
3. Detects subtype (agent vs slash-command) based on presence of `template` field
4. Preserves OpenCode-specific metadata for roundtrip conversion
5. Converts markdown body to instructions section

**Subtype Detection:**
- If `template` field exists → `slash-command`
- Otherwise → `agent`

### From Canonical to OpenCode

The `toOpencode()` converter:
1. Generates YAML frontmatter with required fields
2. Restores OpenCode-specific fields from metadata
3. Converts sections to markdown:
   - `metadata` → frontmatter
   - `instructions` → body content
   - `tools` → tools object
   - `persona` → system prompt
4. Warns about unsupported sections

## Built-in Agents

OpenCode includes built-in agents:

| Agent | Mode | Description |
|-------|------|-------------|
| **Build** | primary | Default agent with all tools enabled |
| **Plan** | primary | Restricted agent for planning and analysis (ask permissions) |
| **General** | subagent | Multi-step research and file searching |

## Navigation & Usage

- **Tab key**: Switch between primary agents
- **@ mention**: Invoke subagents (e.g., `@general search for authentication function`)
- **<Leader>+Right/Left**: Navigate parent/child sessions created by subagents
- **Slash commands**: Type `/` to see available commands

## Plugins (Non-Convertible)

OpenCode supports plugins - JavaScript/TypeScript modules that hook into various events. **Plugins are not convertible** between formats due to fundamental architectural differences.

### Why Plugins Don't Convert

| Aspect | Claude Hooks | OpenCode Plugins |
|--------|--------------|------------------|
| **Format** | Executable scripts (bash/node) | JS/TS modules |
| **Events** | 4 types (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`) | 32+ granular events |
| **File Location** | `.claude/hooks/*` | `.opencode/plugin/*` |

### OpenCode Plugin Events

Plugins can hook into events across multiple categories:
- **command**: `command.executed`
- **file**: `file.edited`, `file.watcher.updated`
- **lsp**: `lsp.client.diagnostics`, `lsp.updated`
- **message**: `message.part.removed`, `message.part.updated`, `message.removed`, `message.updated`
- **permission**: `permission.replied`, `permission.updated`
- **session**: `session.created`, `session.idle`, `session.error`, etc.
- **tool**: `tool.execute.before`, `tool.execute.after`
- **tui**: `tui.prompt.append`, `tui.command.execute`, `tui.toast.show`

### Plugin Example

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const EnvProtection: Plugin = async ({ project, client, $, directory }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        throw new Error("Do not read .env files")
      }
    },
  }
}
```

### Claude Code Event Mapping

For plugins that need Claude Code-like behavior, these event mappings apply:

| Claude Hook | OpenCode Event |
|-------------|----------------|
| `PreToolUse` | `tool.execute.before` |
| `PostToolUse` | `tool.execute.after` |
| `UserPromptSubmit` | Custom handling via `message.*` events |
| `SessionEnd` | `session.idle` |

While PRPM can't directly convert Claude hooks to OpenCode plugins due to architectural differences, understanding these mappings helps when manually porting functionality.

## Limitations

- Agent mode cannot be changed after creation (requires recreation)
- Slash commands execute in project root directory
- Custom commands override built-in commands with same name
- File locations are fixed (`.opencode/agent/` and `.opencode/command/`)
- **Plugins are non-convertible** - different event models and formats prevent cross-platform conversion

## PRPM Integration

### Installation

Install OpenCode packages with:

```bash
prpm install <package-name> --format opencode
```

Packages are installed to:
- Agents: `.opencode/agent/<agent-name>.md`
- Slash Commands: `.opencode/command/<command-name>.md`

### Publishing

Publish OpenCode packages:

```bash
# From .opencode/ directory
prpm publish
```

Your `prpm.json` should specify:

```json
{
  "name": "@username/package-name",
  "version": "1.0.0",
  "format": "opencode",
  "subtype": "agent",
  "description": "Package description",
  "files": [".opencode/**/*.md"]
}
```

### Conversion

Convert between OpenCode and other formats:

```bash
# Convert OpenCode agent to Claude agent
prpm convert agent.md --from opencode --to claude

# Convert Claude agent to OpenCode
prpm convert agent.md --from claude --to opencode
```

## Related Documentation

- [OpenCode Agents](https://opencode.ai/docs/agents/)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [OpenCode Slash Commands](https://opencode.ai/docs/commands/)
- [OpenCode Tools](https://opencode.ai/docs/tools/)
- [PRPM Format Guide](../../docs/formats.mdx)

## Changelog

- **2025-12**: Added native skill support
  - Skills use Agent Skills spec (same as Codex, Copilot)
  - Directory: `.opencode/skills/${name}/SKILL.md`
  - Required fields: `name`, `description`
  - Optional fields: `license`, `compatibility`, `allowed-tools`, `metadata`
  - Uses `agent-skills.schema.json` for validation
- **2025-01**: Initial OpenCode format support
  - Added fromOpencode and toOpencode converters
  - Support for agents and slash commands
  - Roundtrip conversion with metadata preservation
  - JSON schemas for validation
