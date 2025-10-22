# PRPM Package Types

PRPM supports multiple package types to help you organize and discover the right tools for your AI workflow.

## Package Types

### 🎓 Skill
**Purpose**: Knowledge and guidelines for AI assistants to follow

**What it is**: A skill teaches an AI assistant how to perform specific tasks, follow best practices, or apply domain knowledge.

**Examples**:
- `@prpm/pulumi-troubleshooting` - Debugging Pulumi infrastructure errors
- `@prpm/postgres-migrations` - PostgreSQL migration patterns
- `@typescript/best-practices` - TypeScript coding standards

**When to use**: When you want Claude, Cursor, or other AI assistants to have specific knowledge or follow particular methodologies.

**Typical install location**: `.claude/skills/`, `.cursor/rules/`

---

### 🤖 Agent
**Purpose**: Autonomous AI agents that can perform multi-step tasks

**What it is**: An agent is a specialized AI entity configured to handle specific workflows or responsibilities.

**Examples**:
- `@volt/research-agent` - Conducts research and synthesizes information
- `@prpm/code-reviewer` - Reviews code for quality and security
- `@cursor/debugging-agent` - Systematic debugging workflows

**When to use**: When you need an AI to autonomously handle complex, multi-step processes.

**Typical install location**: `.claude/agents/`, `.cursor/agents/`

---

### 📋 Rule
**Purpose**: Specific instructions or constraints for AI behavior

**What it is**: Rules define how an AI should behave in specific contexts, often enforcing coding style, project conventions, or workflow patterns.

**Examples**:
- `@cursor/react-conventions` - React component naming and structure
- `@cursor/test-first` - Test-driven development rules
- `@prpm/commit-message-format` - Git commit message standards

**When to use**: When you want to enforce specific patterns or conventions in your project.

**Typical install location**: `.cursor/rules/`, `.cursorrules`

---

### 🔌 Plugin
**Purpose**: Extensions that add functionality to AI tools

**What it is**: Plugins extend the capabilities of AI assistants with new commands, integrations, or features.

**Examples**:
- `@cursor/git-integration` - Enhanced git workflow commands
- `@claude/search-plugin` - Web search capabilities
- `@prpm/deployment-helper` - Automated deployment workflows

**When to use**: When you need to add new capabilities beyond prompting.

**Typical install location**: `.cursor/plugins/`, `.claude/plugins/`

---

### 💬 Prompt
**Purpose**: Reusable prompt templates

**What it is**: Pre-written prompts optimized for specific tasks or outputs.

**Examples**:
- `@prompts/code-review-template` - Structured code review prompts
- `@prompts/commit-message` - Generate conventional commit messages
- `@prompts/bug-report` - Bug report generation template

**When to use**: When you frequently need to generate similar outputs or ask similar questions.

**Typical install location**: `.prompts/`, project-specific directories

---

### ⚡ Workflow
**Purpose**: Multi-step automation workflows

**What it is**: Workflows define sequences of actions that an AI or tool should perform to accomplish a goal.

**Examples**:
- `@workflows/pr-submission` - Complete PR submission workflow
- `@workflows/feature-development` - End-to-end feature development
- `@workflows/incident-response` - Incident handling workflow

**When to use**: When you have repeatable processes that involve multiple steps.

**Typical install location**: `.workflows/`, `.github/workflows/`

---

### 🔧 Tool
**Purpose**: Executable utilities and scripts

**What it is**: Tools are scripts, CLIs, or utilities that perform specific functions.

**Examples**:
- `@tools/migration-generator` - Database migration generator
- `@tools/test-fixture-creator` - Test data generator
- `@tools/changelog-builder` - Automated changelog generation

**When to use**: When you need executable code rather than AI instructions.

**Typical install location**: `scripts/`, `tools/`, `.bin/`

---

### 📄 Template
**Purpose**: Reusable file and project templates

**What it is**: Templates provide starting points for new files, components, or projects.

**Examples**:
- `@templates/react-component` - React component boilerplate
- `@templates/api-endpoint` - REST API endpoint template
- `@templates/github-action` - GitHub Actions workflow template

**When to use**: When you want consistent structure for new files or projects.

**Typical install location**: `templates/`, project-specific directories

---

### 🔗 MCP Server
**Purpose**: Model Context Protocol servers

**What it is**: MCP servers provide additional context and capabilities to AI assistants through the Model Context Protocol.

**Examples**:
- `@mcp/filesystem` - File system access for AI
- `@mcp/database` - Database query capabilities
- `@mcp/web-search` - Web search integration

**When to use**: When you want to give AI assistants access to external data or services.

**Typical install location**: `.mcp/servers/`

---

## How to Identify Package Types

### In Search Results

```bash
$ prpm search postgres

✨ Found 15 package(s):

[✓] PostgreSQL Migrations Skill 🏅
    Master PostgreSQL migrations with patterns for full-text search
    📦 @prpm/postgres-migrations | 🎓 Skill | 📥 1.2k | 🏷️  postgresql, database, migrations
```

The search output now shows:
- `🎓 Skill` - Package type icon and label
- `🏅` - Official PRPM package badge
- `[✓]` - Verified author

### During Installation

```bash
$ prpm install @prpm/pulumi-troubleshooting

📥 Installing @prpm/pulumi-troubleshooting@latest...
   �� Converting to cursor format...
   Pulumi Infrastructure Troubleshooting 🏅
   Comprehensive guide to solving common Pulumi TypeScript errors
   🎓 Type: Skill
   📦 Installing version 1.0.0
   ⬇️  Downloading...
   📂 Extracting...

✅ Successfully installed @prpm/pulumi-troubleshooting
   📁 Saved to: .claude/skills/pulumi-troubleshooting.md
```

The install command clearly shows:
- `🎓 Type: Skill` - Explicit type display
- `🏅` - Official package indicator
- Where the file will be saved

### In Package Info

```bash
$ prpm info @prpm/postgres-migrations

📦 @prpm/postgres-migrations
   🎓 Type: Skill
   📝 Description: Master PostgreSQL migrations...
   👤 Author: @prpm (Official)
   🏷️  Tags: postgresql, database, migrations, sql
   📥 Downloads: 1,234
   ⭐ Quality Score: 95/100
```

## Filtering by Type

You can filter search results by type:

```bash
# Find only skills
prpm search postgres --type skill

# Find only agents
prpm search debugging --type agent

# Find only rules
prpm search react --type rule
```

## Type Icons Reference

| Type | Icon | Label | Use Case |
|------|------|-------|----------|
| skill | 🎓 | Skill | Knowledge for AI |
| agent | 🤖 | Agent | Autonomous workflows |
| rule | 📋 | Rule | Behavioral constraints |
| plugin | 🔌 | Plugin | Tool extensions |
| prompt | 💬 | Prompt | Reusable templates |
| workflow | ⚡ | Workflow | Multi-step automation |
| tool | 🔧 | Tool | Executable utilities |
| template | 📄 | Template | File boilerplates |
| mcp | 🔗 | MCP Server | Context servers |

## Best Practices

1. **Choose the right type**: Select the type that best matches your package's purpose
2. **Be consistent**: Use the same type for similar packages
3. **Document clearly**: Explain what your package does and what type it is
4. **Tag appropriately**: Use tags that help users find your package

## Publishing Packages

When publishing, specify the type in your package metadata:

```json
{
  "id": "@your-org/package-name",
  "type": "skill",
  "category": "infrastructure",
  "tags": ["pulumi", "aws", "devops"]
}
```

See [PUBLISHING.md](./PUBLISHING.md) for complete publishing guidelines.
