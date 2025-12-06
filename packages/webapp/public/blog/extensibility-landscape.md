# The Extensibility Landscape: Which AI Coding Assistants Support Plugins and Extensions?

Not all AI coding assistants are created equal when it comes to extensibility. Some offer rich plugin ecosystems with event hooks, MCP servers, and custom tools. Others stick to simple rules files with no native extension support.

This guide compares 10 major AI coding assistants across their extensibility features—from Claude Code's skills and plugins to Cursor's rules-only approach. If you're a package publisher or power user, you need to know which systems let you build custom capabilities and which ones don't.

## The Extensibility Spectrum

AI coding assistants fall into three categories:

**Fully Extensible** (Plugins + Hooks + Tools)
- Claude Code
- Zed
- OpenCode
- Kiro
- Droid

**Partially Extensible** (Rules + Limited Extensions)
- Gemini CLI

**Rules-Only** (No Native Extensions)
- Cursor
- Continue
- Windsurf
- GitHub Copilot

Let's break down each system.

---

## 1. Claude Code: Skills, Plugins, and Agents

**Extensibility:** Full (Skills, Plugins, Agents, Hooks, MCP Servers)

### File Locations

- **Skills**: `.claude/skills/<skill-name>/SKILL.md`
- **Plugins**: `.claude/plugins/<plugin-name>/PLUGIN.md`
- **Agents**: `.claude/agents/<agent-name>/AGENT.md`
- **Hooks**: `.claude/hooks/hooks.json` (config) + scripts

### Formats

All Claude content uses Markdown with YAML frontmatter:

```markdown
---
name: react-expert
description: Expert React developer for component architecture
tools: Read, Write, Edit, Bash
---

# React Expert Skill

You are an expert React developer specializing in component architecture...
```

### Capabilities

**Skills**: Step-by-step procedures for specific tasks
- Multi-file workflows
- Context-aware instructions
- Reusable across projects

**Plugins**: Add custom tools and capabilities
- MCP server integrations
- Custom tool definitions
- Extended functionality beyond built-in tools

**Agents**: Autonomous AI assistants with personality
- Custom personas
- Tool restrictions
- Specialized workflows

**Hooks**: Event-driven automation with 4 events
- `session-start`: Initialize workflows when Claude starts
- `user-prompt-submit`: Pre-process user prompts
- `tool-call`: Intercept tool usage
- `assistant-response`: Post-process Claude's responses

### Installation

```bash
# Install from PRPM
prpm install @username/react-expert --as claude

# Manual installation
cp react-expert.md .claude/skills/react-expert/SKILL.md
```

### Publishing

Claude packages are published through PRPM with format-specific metadata:

```json
{
  "name": "@username/react-expert",
  "version": "1.0.0",
  "format": "claude",
  "subtype": "skill"
}
```

### Developer Experience

**Pros:**
- Rich feature set with skills, plugins, agents, and hooks
- Strong ecosystem emerging around PRPM
- Format-agnostic conversion (works with other tools via PRPM)

**Cons:**
- Requires YAML frontmatter knowledge
- Hooks limited to 4 events vs other systems

---

## 2. Zed: Extensions, Slash Commands, and MCP Servers

**Extensibility:** Full (Rust/WASM Extensions, Slash Commands, MCP)

### File Locations

- **Rules**: `.rules` (or `.cursorrules`, `AGENTS.md`, etc.)
- **Extensions**: `~/Library/Application Support/Zed/extensions` (macOS)
- **Extension Manifest**: `extension.toml`

### Format

**Rules**: Plain Markdown (NO frontmatter)

```markdown
# TypeScript Development Guidelines

Follow these standards when working with TypeScript code.

## Code Style

- Use const over let
- Prefer functional components
- Always add explicit types
```

**Extensions**: Rust + WASM with TOML manifest

```toml
id = "my-extension"
name = "My Extension"
version = "0.1.0"
license = "MIT"

[slash_commands.echo]
description = "echoes the provided input"
requires_argument = true
```

### Capabilities

**Slash Commands in Rules**: Dynamic content injection (text threads only)
- `/file` - Insert file contents
- `/diagnostics` - Add language server errors
- `/fetch` - Retrieve webpage content
- `/terminal` - Insert terminal output
- 6 more built-in commands

**Extensions**: Full Rust/WASM plugins
- Language support (syntax, LSP, tree-sitter)
- Custom slash commands
- MCP server integrations
- Themes and debuggers

### License Requirements

Extensions MUST use one of these licenses:
- MIT
- Apache-2.0
- BSD-3-Clause
- GPL-3.0

### Installation

**Rules:**
```bash
prpm install @username/typescript-rules --as zed
# Installs to .rules
```

**Extensions:**
1. Fork `zed-industries/extensions`
2. Add extension as Git submodule
3. Update `extensions.toml`
4. Open pull request

### Developer Experience

**Pros:**
- Powerful Rust/WASM extension system
- Built-in slash commands for dynamic content
- MCP server support
- Plain markdown rules (no frontmatter complexity)

**Cons:**
- Extensions require Rust knowledge
- Rules can't define hooks or events
- Extension publishing requires PR to official repo
- No npm-style package manager for extensions

---

## 3. OpenCode: Agents, Slash Commands, and 40+ Event Hooks

**Extensibility:** Full (JS/TS Plugins with extensive hook system)

### File Locations

- **Agents**: `.opencode/agent/*.md`
- **Slash Commands**: `.opencode/command/*.md`
- **Plugins**: `.opencode/plugin/*.js` or `.opencode/plugin/*.ts`
- **Config**: `opencode.json` or `opencode.jsonc`

### Format

**Agents/Commands** - Markdown with YAML frontmatter:

```markdown
---
description: Expert code reviewer focused on best practices
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

You are an expert code reviewer...
```

**Plugins** - JavaScript/TypeScript modules:

```javascript
export const MyPlugin = async ({ project, client, $, directory, worktree }) => {
  return {
    onFileRead: async (event) => {
      if (event.path.endsWith('.env')) {
        throw new Error('Cannot read .env files for security');
      }
    },
    onCommandEnd: async (event) => {
      await client.notify(`Command completed: ${event.command}`);
    }
  }
}
```

### Capabilities

**Agents**: Two modes for different use cases
- **Primary agents**: Main assistants (switchable via Tab key)
- **Subagents**: Specialized assistants invoked by @ mentions
- **Model overrides**: Per-agent model configuration
- **Temperature control**: 0.0-1.0 for different tasks
- **Fine-grained permissions**: ask/allow/deny for each tool

**Slash Commands**: Template-based with placeholders
- `$ARGUMENTS` - All passed arguments
- `$1`, `$2`, `$3` - Positional arguments
- `` !`command` `` - Bash command injection
- `@filename` - File content inclusion

**Plugins**: JavaScript/TypeScript event hooks (40+ events)
- **File events**: Create, Read, Write, Delete, Change
- **Command events**: Start, End, Error
- **LSP events**: Start, Message, Error
- **Message events**: Send, Receive, Error
- **Permission events**: Request, Grant, Deny
- **Session events**: Start, End, Pause, Resume
- **Todo events**: Create, Update, Complete, Delete
- **Tool events**: Register, Call, Response, Error
- **TUI events**: Render, Input, Update

**Tools**: Granular control with wildcards
- Enable/disable specific tools per agent
- Wildcard patterns: `"mymcp_*": false` disables MCP tool groups
- Per-command bash permissions: `"git push": "ask"`

### Installation

```bash
prpm install @username/code-reviewer --as opencode
# Installs to .opencode/agent/code-reviewer.md
```

### Publishing

```json
{
  "name": "@username/code-reviewer",
  "version": "1.0.0",
  "format": "opencode",
  "subtype": "agent",
  "files": [".opencode/**/*.md"]
}
```

### Developer Experience

**Pros:**
- Most extensive hook system (40+ events)
- JS/TS plugin ecosystem (familiar to web developers)
- Rich permission model with ask/allow/deny
- Wildcard tool patterns
- Primary vs subagent modes for different workflows

**Cons:**
- Steeper learning curve due to many configuration options
- Requires understanding of mode system
- Documentation still evolving

---

## 4. Gemini CLI: Extensions with MCP Servers

**Extensibility:** Partial (Extensions via JSON config, MCP servers)

### File Locations

- **Extensions**: `~/.gemini/extensions/<extension-name>/gemini-extension.json`
- **Commands**: `~/.gemini/extensions/<extension-name>/commands/*.toml`
- **Context**: `~/.gemini/extensions/<extension-name>/GEMINI.md`

### Format

JSON configuration:

```json
{
  "name": "weather-extension",
  "version": "1.0.0",
  "description": "Weather data via MCP",
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-weather"],
      "env": {
        "WEATHER_API_KEY": "${WEATHER_API_KEY}"
      }
    }
  },
  "contextFileName": "GEMINI.md"
}
```

### Capabilities

**MCP Servers**: Model Context Protocol integrations
- Connect to external tools and APIs
- Environment variable support
- Variable substitution: `${extensionPath}`, `${home}`

**Context Files**: Markdown context per extension
- Default: `GEMINI.md`
- Customizable via `contextFileName`

**Configuration**: Extension management
- Tool exclusion: `excludeTools` array
- Experimental settings
- Per-extension metadata

### Installation

```bash
gemini extensions install <path>
gemini extensions list
gemini extensions enable <name>
```

### Developer Experience

**Pros:**
- Simple JSON configuration
- MCP server ecosystem
- Variable substitution for paths
- Built-in extension management commands

**Cons:**
- Limited to MCP servers (no custom hooks or events)
- No native slash command support in extensions
- TOML commands not yet supported in PRPM conversion
- Smaller ecosystem vs other systems

---

## 5. Cursor: No Native Extensions (Rules Only)

**Extensibility:** None (Rules files only)

### File Locations

- **Rules**: `.cursor/rules/*.mdc` (MDC format with frontmatter)

### Format

MDC (Markdown Components) with YAML frontmatter:

```markdown
---
description: React component best practices
globs:
  - "**/*.tsx"
  - "**/*.jsx"
alwaysApply: false
---

# React Component Rules

When writing React components:
- Use functional components with hooks
- Keep components under 200 lines
- Extract logic into custom hooks
```

### Capabilities

**Rules**: Declarative coding standards
- File pattern matching via `globs`
- Conditional application via `alwaysApply`
- Rich markdown instructions
- Code examples

**No Extensions**: Cursor has no plugin system
- Cannot add custom tools
- Cannot define event hooks
- Cannot create slash commands
- Limited to what Cursor provides out-of-box

### Installation

```bash
prpm install @username/react-rules --as cursor
# Installs to .cursor/rules/react-rules.mdc
```

### Developer Experience

**Pros:**
- Simple, focused on rules
- MDC format well-documented
- Glob patterns for targeted rules
- Fast and lightweight

**Cons:**
- No extensibility beyond rules
- Cannot add custom capabilities
- No hooks or automation
- Relies entirely on Cursor's built-in features

---

## 6. Continue: No Native Extensions (Rules Only)

**Extensibility:** None (Rules files only)

### File Locations

- **Rules**: `.continue/rules/*.md`

### Format

Markdown with YAML frontmatter:

```markdown
---
name: "React Best Practices"
description: "Production-grade React development patterns"
globs: "**/*.{ts,tsx}"
alwaysApply: false
---

# React Best Practices

You are a React expert. Always use TypeScript with proper typing.
```

### Capabilities

Same limitations as Cursor—rules only, no extensions.

**Rules**: Context for AI assistant
- File pattern matching
- Conditional application
- Markdown instructions

**No Extensions**: No plugin ecosystem

### Installation

```bash
prpm install @username/react-rules --as continue
# Installs to .continue/rules/react-rules.md
```

### Developer Experience

**Pros:**
- Simple markdown format
- Familiar frontmatter structure
- Easy to version control

**Cons:**
- Zero extensibility
- No hooks or automation
- Cannot add custom tools
- Limited to built-in Continue features

---

## 7. Windsurf: No Native Extensions (Rules Only)

**Extensibility:** None (Rules files only)

### File Locations

- **Rules**: `.windsurfrules`

### Format

Plain markdown (similar to Cursor):

```markdown
# TypeScript Development Guidelines

Follow these standards when working with TypeScript code.

## Code Style

- Use const over let
- Always add explicit types
```

### Capabilities

Identical to Cursor/Continue—rules only.

### Installation

```bash
prpm install @username/typescript-rules --as windsurf
# Installs to .windsurfrules
```

### Developer Experience

Same as Cursor and Continue: simple but not extensible.

---

## 8. GitHub Copilot: No Native Extensions (Instructions Only)

**Extensibility:** None (Instructions file only)

### File Locations

- **Instructions**: `.github/copilot-instructions.md`

### Format

Plain markdown:

```markdown
# Coding Standards

Use TypeScript for all new code. Follow these conventions:

- Prefer functional programming patterns
- Write comprehensive tests
- Document public APIs
```

### Capabilities

**Instructions**: Context for Copilot
- Single markdown file
- No frontmatter
- No file patterns
- No conditional logic

**No Extensions**: No plugin system whatsoever

### Installation

```bash
prpm install @username/standards --as copilot
# Installs to .github/copilot-instructions.md
```

### Developer Experience

**Pros:**
- Dead simple
- No learning curve
- Works in GitHub

**Cons:**
- Most limited of all systems
- Single file only
- No extensibility
- No automation
- No hooks or events

---

## 9. Droid: Skills, Slash Commands, and Hooks

**Extensibility:** Full (Skills, Slash Commands, Hooks)

### File Locations

- **Skills**: `.factory/skills/<skill-name>/SKILL.md`
- **Slash Commands**: `.factory/commands/*.md`
- **Hooks**: `.factory/hooks/` (executable scripts) or `.factory/hooks.json`

### Format

Markdown with YAML frontmatter:

**Skills:**
```markdown
---
name: api-integration
description: Integrate a new API endpoint with proper error handling
---

# API Integration Skill

## Steps

1. Define the API endpoint specification
2. Create the service layer function
3. Add error handling and validation
4. Write unit tests
5. Update API documentation
```

**Slash Commands:**
```markdown
---
name: quick-test
description: Run tests for a specific file
argument-hint: <file-path>
---

Run tests for the specified file:

1. Identify the test file
2. Execute the test suite
3. Report results
```

**Hooks** (executable):
```bash
#!/usr/bin/env bash
# .factory/hooks/pre-tool-use.sh

TOOL_NAME=$1
TOOL_ARGS=$2

if [ "$TOOL_NAME" = "Bash" ]; then
  echo "Validating Bash command: $TOOL_ARGS"
fi
```

### Capabilities

**Skills**: Multi-step workflows
- Subdirectories for supporting files
- Reusable procedures
- Clear step-by-step instructions

**Slash Commands**: Quick actions with arguments
- `argument-hint` for usage documentation
- Template-based execution

**Hooks**: Event-driven automation
- Executable scripts (preferred)
- JSON configuration (legacy)
- Standard hook events

### Installation

```bash
prpm install @username/api-workflow --as droid
# Installs to .factory/skills/api-workflow/SKILL.md
```

### Developer Experience

**Pros:**
- Well-organized file structure
- Skills in subdirectories (clean)
- Executable hooks (better version control)
- Familiar markdown format

**Cons:**
- Smaller ecosystem than Claude Code or OpenCode
- Hook events less extensive than OpenCode
- Documentation still growing

---

## 10. Kiro: Agents, Tools, Hooks, and Steering Files

**Extensibility:** Full (Agents, Tools, Hooks, Steering)

### File Locations

- **Agents**: `.kiro/agents/*.json`
- **Steering**: `.kiro/steering/*.md`
- **Hooks**: Configured in agent JSON files

### Format

**Agents** (JSON):
```json
{
  "name": "analyst",
  "description": "Strategic analyst for market research",
  "prompt": "file://./prompts/analyst.md",
  "tools": ["Read", "Write", "WebSearch"],
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  },
  "hooks": {
    "agentSpawn": ["echo 'Agent started'"],
    "userPromptSubmit": ["git status"],
    "preToolUse": ["npm test"]
  }
}
```

**Steering Files** (Markdown with optional frontmatter):
```markdown
---
inclusion: fileMatch
fileMatchPattern: "components/**/*.tsx"
---

# React Component Guidelines

Applied automatically when working with React components.

## Component Standards

- Use functional components with hooks
- Keep components under 200 lines
```

### Capabilities

**Agents**: JSON configuration for specialized AI
- Custom prompts (inline or file references)
- Tool whitelisting with `allowedTools`
- Tool aliasing for context-specific names
- MCP server integrations
- Per-agent resource loading

**Steering Files**: Context-aware instructions
- **`always`** inclusion (default): Loaded in all contexts
- **`fileMatch`** inclusion: Loaded based on glob patterns
- **`manual`** inclusion: User-triggered
- Special foundational files: `product.md`, `tech.md`, `structure.md`

**Hooks**: 5 event types
- `agentSpawn` - When agent starts
- `userPromptSubmit` - Before user prompts
- `preToolUse` - Before tool execution
- `postToolUse` - After tool execution
- `stop` - When agent stops

**Tools**: Rich configuration
- `toolAliases`: Rename tools per agent
- `allowedTools`: Whitelist for security
- `toolsSettings`: Per-tool customization

### Installation

```bash
prpm install @username/analyst-agent --as kiro
# Installs to .kiro/agents/analyst-agent.json
```

### Developer Experience

**Pros:**
- JSON configuration (familiar to devs)
- File reference support for prompts
- Steering files with conditional inclusion
- Tool aliasing for better UX
- MCP server support

**Cons:**
- JSON can be verbose
- Requires understanding inclusion modes
- Hook events fewer than OpenCode (5 vs 40+)

---

## Comparison Table

### Feature Support Matrix

| System | Extensions | Hooks | MCP Servers | Slash Commands | Format |
|--------|-----------|-------|-------------|----------------|--------|
| **Claude Code** | ✅ Plugins | ✅ 4 events | ✅ Via plugins | ❌ | MD + YAML |
| **Zed** | ✅ Rust/WASM | ❌ | ✅ | ✅ In rules | Plain MD / TOML |
| **OpenCode** | ✅ JS/TS | ✅ 40+ events | ✅ | ✅ | MD + YAML |
| **Gemini CLI** | ✅ JSON config | ❌ | ✅ | ⚠️ TOML (limited) | JSON |
| **Cursor** | ❌ | ❌ | ❌ | ❌ | MDC + YAML |
| **Continue** | ❌ | ❌ | ❌ | ❌ | MD + YAML |
| **Windsurf** | ❌ | ❌ | ❌ | ❌ | Plain MD |
| **GitHub Copilot** | ❌ | ❌ | ❌ | ❌ | Plain MD |
| **Droid** | ✅ Skills | ✅ Scripts | ❌ | ✅ | MD + YAML |
| **Kiro** | ✅ Agents | ✅ 5 events | ✅ | ❌ | JSON + MD |

### Installation Locations

| System | Primary Location | Alternative Locations |
|--------|------------------|----------------------|
| **Claude Code** | `.claude/skills/`, `.claude/plugins/`, `.claude/agents/` | None |
| **Zed** | `.rules` | `.cursorrules`, `AGENTS.md`, `CLAUDE.md`, etc. |
| **OpenCode** | `.opencode/agent/`, `.opencode/command/`, `.opencode/plugin/` | `~/.config/opencode/` |
| **Gemini CLI** | `~/.gemini/extensions/` | None |
| **Cursor** | `.cursor/rules/` | None |
| **Continue** | `.continue/rules/` | None |
| **Windsurf** | `.windsurfrules` | None |
| **GitHub Copilot** | `.github/copilot-instructions.md` | None |
| **Droid** | `.factory/skills/`, `.factory/commands/`, `.factory/hooks/` | None |
| **Kiro** | `.kiro/agents/`, `.kiro/steering/` | None |

### Programming Languages

| System | Plugin Language | Config Format | Notes |
|--------|----------------|---------------|-------|
| **Claude Code** | N/A (declarative) | YAML + Markdown | MCP servers can be any language |
| **Zed** | Rust (compiles to WASM) | TOML + Markdown | Extensions are Rust crates |
| **OpenCode** | JavaScript/TypeScript | YAML + Markdown | Plugin API is JS/TS with 40+ events |
| **Gemini CLI** | N/A (config only) | JSON | MCP servers can be any language |
| **Cursor** | N/A (no extensions) | YAML + Markdown | Rules only |
| **Continue** | N/A (no extensions) | YAML + Markdown | Rules only |
| **Windsurf** | N/A (no extensions) | Markdown | Rules only |
| **GitHub Copilot** | N/A (no extensions) | Markdown | Instructions only |
| **Droid** | Bash (hooks) | YAML + Markdown | Hooks are shell scripts |
| **Kiro** | N/A (config-driven) | JSON + Markdown | MCP servers can be any language |

---

## Community Publishing

Which systems let you publish packages for others to use?

### ✅ Full Publishing Support (via PRPM)

All systems can publish packages through PRPM:

```bash
# Publish for any format
prpm publish --format claude
prpm publish --format opencode
prpm publish --format kiro
```

PRPM's universal registry supports all 10 systems with automatic format conversion.

### ⚠️ Native Publishing Options

- **Zed Extensions**: PR to `zed-industries/extensions` repo
- **Others**: No native package registry (PRPM fills this gap)

### 📦 PRPM Ecosystem

Over 7,000+ packages available:
- Install for any AI assistant
- Automatic format conversion
- Version management
- Discovery via search
- Author verification
- Download analytics

```bash
# Search packages
prpm search "react hooks"

# Install for your editor
prpm install @sanjeed5/react-best-practices --as cursor
prpm install @sanjeed5/react-best-practices --as claude
prpm install @sanjeed5/react-best-practices --as kiro
```

---

## Recommendations by Use Case

### For Maximum Extensibility

**Choose: OpenCode or Claude Code**

- OpenCode: 40+ event hooks, JS/TS plugins, rich permission model
- Claude Code: Skills/plugins/agents/hooks, growing ecosystem

Both offer the most complete extension capabilities.

### For Performance and Simplicity

**Choose: Zed**

- Rust/WASM extensions (blazing fast)
- Plain markdown rules (no frontmatter)
- Slash commands in text threads
- MCP server support

### For Configuration-Driven Workflows

**Choose: Kiro**

- JSON agent definitions
- Conditional steering files (fileMatch patterns)
- Tool aliasing and whitelisting
- MCP servers with environment variables

### For Minimal Complexity

**Choose: Cursor, Continue, or Windsurf**

- Just rules, nothing more
- Fast to learn
- Easy to version control
- No plugin overhead

### For GitHub Integration

**Choose: GitHub Copilot**

- Native GitHub integration
- Simple instructions file
- Works in GitHub Codespaces

### For Bash Hook Automation

**Choose: Droid**

- Executable hook scripts
- Skills in subdirectories
- Clean file organization
- Version control friendly

---

## Format Conversion with PRPM

PRPM converts between all formats automatically:

```bash
# Convert Claude skill to OpenCode agent
prpm convert skill.md --from claude --to opencode

# Convert Kiro agent to Cursor rules
prpm install @user/analyst-agent --as cursor

# Convert with hook mapping control
prpm convert claude-hooks.md --as cursor-hooks --hook-mapping auto
```

### Hook Mapping Strategies

When converting between hook-enabled systems:

- **`auto`** (default): Best semantic matches with warnings
- **`strict`**: Only direct matches (fails on semantic mismatches)
- **`manual`**: Interactive prompt for each mapping
- **`skip`**: Preserve original format, skip hook conversion

Example semantic mappings:

| Source (Claude) | Target (Kiro) | Mapping Quality |
|-----------------|---------------|-----------------|
| `session-start` | `agentSpawn` | Semantic match |
| `user-prompt-submit` | `userPromptSubmit` | Direct match |
| `tool-call` | `preToolUse` | Semantic match |
| `assistant-response` | ❌ No equivalent | Lossy conversion |

See [Hook Mappings Documentation](https://docs.prpm.dev/guides/hook-mappings) for complete mapping tables.

---

## Conclusion

The AI coding assistant landscape is fragmented when it comes to extensibility:

**Fully Extensible** (5 systems): Claude Code, Zed, OpenCode, Kiro, Droid
- Build custom capabilities
- Event-driven automation
- MCP server integrations
- Rich configuration options

**Rules-Only** (4 systems): Cursor, Continue, Windsurf, GitHub Copilot
- Simple, focused on instructions
- No hooks or plugins
- Limited to built-in features
- Easier to learn but less flexible

**Hybrid** (1 system): Gemini CLI
- MCP servers but no hooks
- Extension config but limited capabilities

Choose based on your needs:
- **Power users building tools**: OpenCode, Claude Code, Zed
- **Teams wanting automation**: Kiro, Droid, Claude Code
- **Developers who want simplicity**: Cursor, Continue, Windsurf
- **GitHub-first teams**: GitHub Copilot

No matter which system you choose, PRPM bridges the gap—publish once, install anywhere, with automatic format conversion across all 10 platforms.

---

## Further Reading

- [PRPM Format Specifications Guide](https://prpm.dev/blog/format-specifications-guide)
- [Claude Hooks Best Practices](https://prpm.dev/blog/claude-hooks-best-practices)
- [JSON Schemas for AI Prompts](https://prpm.dev/blog/json-schemas-for-ai-prompts)
- [Hook Mapping Documentation](https://docs.prpm.dev/guides/hook-mappings)
- [PRPM Installation Guide](https://docs.prpm.dev/getting-started/installation)

**Want to explore packages?** Browse 7,000+ AI coding tools at [prpm.dev/search](https://prpm.dev/search)
