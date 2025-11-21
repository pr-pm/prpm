# Kiro Agent Format Specification

**File Location:** `.kiro/agents/*.json`
**Format:** JSON configuration files
**Official Docs:** https://kiro.dev/docs/cli/custom-agents/

## Overview

Kiro agents are custom AI agent configurations stored as JSON files in `.kiro/agents/`. Each agent defines its personality, capabilities, tools, MCP servers, and event hooks to create specialized AI assistants for different tasks.

## Configuration Structure

### Core Fields

- **`name`** (string, optional): Agent name/identifier
  - Used for display and selection
  - Example: `"analyst"`, `"code-reviewer"`

- **`description`** (string, optional): Brief description of agent's purpose
  - Helps users understand when to use the agent
  - Example: `"Strategic analyst for market research and competitive analysis"`

- **`prompt`** (string or file reference, optional): Agent's core instructions
  - Can be inline string or file reference: `"file://./prompts/analyst.md"`
  - Defines persona, expertise, behavior, and guidelines
  - Supports markdown formatting

### Tools Configuration

- **`tools`** (array of strings, optional): Enabled tools for this agent
  - Available tools: `Read`, `Write`, `Edit`, `Grep`, `Glob`, `WebFetch`, `WebSearch`, `Bash`, etc.
  - Example: `["Read", "Write", "WebSearch"]`

- **`toolAliases`** (object, optional): Rename tools for agent context
  - Maps original tool name to agent-specific name
  - Example: `{ "Read": "ViewFile", "Write": "CreateFile" }`

- **`allowedTools`** (array of strings, optional): Whitelist of permitted tools
  - Restricts tool usage for security/safety
  - Example: `["Read", "Grep", "Glob"]` (read-only agent)

- **`toolsSettings`** (object, optional): Per-tool configuration
  - Customize tool behavior
  - Example: `{ "Bash": { "timeout": 30000 } }`

### MCP Servers

- **`mcpServers`** (object, optional): Model Context Protocol server configurations
  - Key: Server name
  - Value: Server configuration object with:
    - `command` (string, required): Executable command
    - `args` (array of strings, optional): Command arguments
    - `env` (object, optional): Environment variables
    - `timeout` (number, optional): Timeout in milliseconds

Example:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
      "timeout": 10000
    }
  }
}
```

### Resources

- **`resources`** (array of strings, optional): Context resources for the agent
  - File paths, URLs, or resource identifiers
  - Automatically loaded into agent context
  - Example: `["docs/architecture.md", "file://./context/product.md"]`

### Event Hooks

- **`hooks`** (object, optional): Event-driven automations
  - `agentSpawn` (array of strings): Run when agent starts
  - `userPromptSubmit` (array of strings): Run before user prompts
  - `preToolUse` (array of strings): Run before any tool use
  - `postToolUse` (array of strings): Run after any tool use
  - `stop` (array of strings): Run when agent stops

Example:
```json
{
  "hooks": {
    "agentSpawn": ["echo 'Agent started'"],
    "userPromptSubmit": ["git status"],
    "postToolUse": ["npm test"]
  }
}
```

### Additional Fields

- **`model`** (string, optional): Preferred model for this agent
  - Example: `"claude-3-5-sonnet-20241022"`

- **`useLegacyMcpJson`** (boolean, optional): Use legacy MCP JSON format
  - Default: `false`

## Complete Example

```json
{
  "name": "analyst",
  "description": "Strategic analyst specializing in market research and competitive analysis",
  "prompt": "file://./prompts/analyst.md",
  "tools": ["Read", "Write", "Edit", "Grep", "Glob", "WebFetch", "WebSearch"],
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  },
  "resources": [
    "docs/product-requirements.md",
    "docs/competitive-analysis.md"
  ],
  "hooks": {
    "agentSpawn": ["echo 'Analyst agent ready'"],
    "userPromptSubmit": ["git status"]
  },
  "model": "claude-3-5-sonnet-20241022"
}
```

## Prompt File Format

When using `file://` references, the prompt file is typically markdown:

`.kiro/prompts/analyst.md`:
```markdown
# Mary - Strategic Business Analyst

You are Mary, a strategic business analyst with expertise in market research, brainstorming, and competitive analysis.

## Expertise

- Market research and trend analysis
- Competitive intelligence gathering
- Strategic planning and roadmapping
- Data-driven decision making

## Communication Style

- Analytical and data-focused
- Inquisitive and thorough
- Creative problem-solver
- Strategic thinker

## Core Principles

1. **Evidence-Based Analysis**: Ground all findings in verifiable data
2. **Curiosity-Driven**: Ask probing questions to uncover insights
3. **Strategic Context**: Frame work within broader business goals

## Workflow

When conducting research:
1. Define clear research questions
2. Gather data from multiple credible sources
3. Analyze and synthesize findings
4. Present actionable insights

Always validate assumptions with data.
```

## Use Cases

### Code Review Agent

```json
{
  "name": "reviewer",
  "description": "Code review specialist focusing on quality and best practices",
  "prompt": "You are a code review expert. Review code for quality, bugs, performance, and security. Provide specific, actionable feedback.",
  "tools": ["Read", "Grep", "Glob"],
  "allowedTools": ["Read", "Grep", "Glob"],
  "hooks": {
    "agentSpawn": ["git diff --cached"]
  }
}
```

### Testing Agent

```json
{
  "name": "tester",
  "description": "Test automation specialist for comprehensive test coverage",
  "prompt": "file://./prompts/tester.md",
  "tools": ["Read", "Write", "Edit", "Bash"],
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./tests"]
    }
  },
  "hooks": {
    "postToolUse": ["npm test"]
  }
}
```

### Documentation Agent

```json
{
  "name": "doc-writer",
  "description": "Documentation specialist for technical writing",
  "prompt": "You are a technical documentation expert. Write clear, comprehensive documentation with examples.",
  "tools": ["Read", "Write", "Edit", "Grep", "Glob"],
  "resources": [
    "docs/style-guide.md",
    "docs/templates/"
  ]
}
```

### Research Agent

```json
{
  "name": "researcher",
  "description": "Research specialist with web access",
  "prompt": "You are a research expert. Gather information from multiple sources, analyze findings, and provide comprehensive reports.",
  "tools": ["Read", "Write", "WebFetch", "WebSearch"],
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

## Best Practices

1. **Clear Names**: Use descriptive agent names that indicate purpose
2. **Focused Roles**: Each agent should have a specific, well-defined role
3. **Minimal Tools**: Grant only tools needed for agent's specific tasks
4. **External Prompts**: Use `file://` references for complex prompts (easier to maintain)
5. **Security**: Use `allowedTools` to restrict capabilities for safety-critical agents
6. **Hooks for Automation**: Leverage event hooks for consistent workflows
7. **MCP Integration**: Connect relevant MCP servers for extended capabilities
8. **Model Selection**: Specify models when agent needs specific capabilities

## Conversion Notes

### From Canonical

- Extract agent name from `metadata.name`
- Use `content.sections` with type "instructions" for prompt
- Map tools from `content.sections` with type "tools"
- Convert persona to prompt instructions
- Extract MCP servers from metadata if present
- Generate inline prompt or file reference based on complexity

### To Canonical

- Parse JSON configuration
- Extract name and description to metadata
- Convert prompt (inline or file reference) to canonical sections
- Map tools to canonical tools section
- Store MCP servers in metadata
- Create persona section from prompt if structured appropriately

## Limitations

- JSON-only format (no YAML support)
- File references use specific `file://` protocol
- Hook commands are shell strings (no complex scripting)
- MCP server configuration is Kiro-specific
- No built-in versioning for agents

## Differences from Other Formats

**vs Claude Code:**
- JSON configuration (Claude uses markdown with frontmatter)
- MCP server integration (Claude has different tool system)
- Event hooks (Claude has different hook mechanism)
- Single file per agent (Claude separates agents/skills/commands)

**vs Cursor:**
- JSON configuration (Cursor uses MDC with frontmatter)
- Agent-centric (Cursor is rule-centric)
- Tool specifications (Cursor has no tool config)
- MCP servers (Cursor doesn't support MCP)

**vs Continue:**
- Agent configuration (Continue focuses on rules)
- MCP integration (Continue has different context system)
- Event hooks (Continue doesn't have hooks)

## Migration Tips

1. **Start with simple agents**: Begin with basic name, description, prompt
2. **Add tools incrementally**: Start minimal, add as needed
3. **Use file references**: Keep complex prompts in separate markdown files
4. **Leverage MCP**: Connect relevant MCP servers for extended capabilities
5. **Test hooks carefully**: Validate shell commands before adding to hooks
6. **Document agent purpose**: Clear descriptions help team understand when to use each agent
7. **Version prompts separately**: Keep prompt files in version control for tracking changes
