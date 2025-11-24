# OpenCode Format Specification

**File Locations:**
- Agents: `.opencode/agent/*.md` or `~/.config/opencode/agent/*.md`
- Slash Commands: `.opencode/command/*.md` or `~/.config/opencode/command/*.md`
- Config: `opencode.json` or `opencode.jsonc` (JSON format alternative)

**Format:** Markdown with YAML frontmatter
**Official Docs:** https://opencode.ai/docs

## Overview

OpenCode is an AI coding assistant that uses specialized agents and slash commands to enhance developer productivity. Agents are AI assistants configured for specific tasks, while slash commands are user-triggered prompts with predefined templates.

**Key Features:**
- **Primary agents**: Main assistants for direct interaction (switchable via Tab key)
- **Subagents**: Specialized assistants invoked by primary agents or @ mentions
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

## Limitations

- Agent mode cannot be changed after creation (requires recreation)
- Slash commands execute in project root directory
- Custom commands override built-in commands with same name
- File locations are fixed (`.opencode/agent/` and `.opencode/command/`)

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
- [OpenCode Slash Commands](https://opencode.ai/docs/commands/)
- [OpenCode Tools](https://opencode.ai/docs/tools/)
- [PRPM Format Guide](../../docs/formats.mdx)

## Changelog

- **2025-01**: Initial OpenCode format support
  - Added fromOpencode and toOpencode converters
  - Support for agents and slash commands
  - Roundtrip conversion with metadata preservation
  - JSON schemas for validation
