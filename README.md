# Prompt Package Manager (prmp)

**The Universal Prompt Orchestration Platform for AI Coding Tools**

A powerful CLI tool for installing, creating, testing, validating, and orchestrating prompts across multiple AI coding assistants. Features runtime integration via Model Context Protocol (MCP) for dynamic prompt discovery.

**v2.1** - Now with testing framework, role-based templates, and MCP server!

## Installation

### NPM (Recommended)
```bash
npm install -g prmp
```

### Homebrew (macOS)
```bash
# Direct installation (recommended)
brew install khaliqgant/homebrew-prmp/prmp

# Or manual tap installation
brew tap khaliqgant/homebrew-prmp
brew install prmp
```

### Direct Download
Download the latest binary from [GitHub Releases](https://github.com/khaliqgant/prompt-package-manager/releases).

## Features

### v2.1 - Orchestration & Testing
- **🧪 Prompt Testing**: Test prompts with actual AI tools (cursor, claude, aider, etc.)
- **🎭 Role System**: 10+ specialized roles (code-reviewer, planner, debugger, etc.)
- **🌐 MCP Server**: Runtime prompt discovery via Model Context Protocol
- **📊 Effectiveness Measurement**: Test scenarios and quality scoring

### v2.0 - Multi-Tool & Authoring
- **Multi-Tool Support**: Install prompts for Cursor, Claude, Windsurf, Continue, Aider, and Copilot
- **Cross-Tool Installation**: Install the same prompt to multiple tools at once
- **Package Creation**: Scaffold new packages from templates
- **Quality Validation**: Lint and score package quality
- **Format Conversion**: Convert packages between tool formats
- **Package Management**: Add, list, remove, and index packages

## Supported AI Tools

| Tool | Type | Directory |
|------|------|-----------|
| **Cursor** | Rules | `.cursor/rules/` |
| **Claude Code** | Agents | `.claude/agents/` |
| **Windsurf** | Rules | `.windsurf/rules/` |
| **Continue.dev** | Prompts | `.continue/prompts/` |
| **Aider** | Conventions | `.aider/` |
| **GitHub Copilot** | Instructions | `.github/copilot-instructions.md` |
| **Copilot (Path)** | Path-specific | `.github/instructions/` |
| **Copilot (Prompts)** | Reusable | `.github/prompts/` |

## Quick Start

### 1. Test Prompts with AI Tools (New in v2.1!)
```bash
# Test a prompt with an AI tool
prmp test .cursor/rules/my-rules.md --with cursor

# Test with custom scenarios
prmp test .claude/agents/reviewer.md --with claude --scenarios scenarios.json

# List available AI tools
prmp test list-tools
```

### 2. Create Role-Based Prompts (New in v2.1!)
```bash
# Create a specialized code reviewer
prmp create security-reviewer --type claude --role security-reviewer

# List all available roles
prmp create --list-roles

# Available roles: code-reviewer, security-reviewer, planner, debugger,
# tester, documenter, refactorer, performance-optimizer, api-designer, accessibility-reviewer
```

### 3. Start MCP Server (New in v2.1!)
```bash
# Start MCP server for runtime prompt discovery
prmp mcp start

# AI tools can now query: http://localhost:3000/mcp
# - Search prompts
# - Validate prompts
# - Suggest roles

# Get server info
prmp mcp info
```

## Usage

### Install a Package

Install to a single tool:
```bash
prmp add https://raw.githubusercontent.com/user/repo/main/rules.md --as cursor
```

Install to multiple tools at once:
```bash
prmp add https://raw.githubusercontent.com/user/repo/main/rules.md --for cursor,claude,windsurf
```

All supported tool types:
```bash
--as cursor              # Cursor rules
--as claude              # Claude Code agents
--as windsurf            # Windsurf rules
--as continue            # Continue.dev prompts
--as aider               # Aider conventions
--as copilot             # GitHub Copilot prompts
--as copilot-instructions # Copilot repo-wide instructions
--as copilot-path        # Copilot path-specific instructions
```

### Create a New Package

Create from a template:
```bash
prmp create my-react-rules --type cursor --template framework --description "React coding rules"
```

List available templates:
```bash
prmp create my-rules --type cursor --list
```

### Validate Package Quality

Lint a package:
```bash
prmp lint .cursor/rules/my-rules.md
```

Strict mode (fail if invalid or score < 60):
```bash
prmp lint .cursor/rules/my-rules.md --strict
```

### Convert Between Formats

Convert a package:
```bash
prmp convert .cursor/rules/my-rules.md --from cursor --to claude
```

Dry run (preview conversion):
```bash
prmp convert my-rules.md --from cursor --to windsurf --dry-run
```

List compatible formats:
```bash
prmp convert list-compatible cursor
```

### Manage Packages

List installed packages:
```bash
prmp list
```

Remove a package:
```bash
prmp remove my-rules
```

Index existing files:
```bash
# Scan tool directories and register unregistered files
prmp index
```

## How It Works

1. **Multi-Tool Architecture**: Intelligently maps packages to the correct directory for each AI tool
2. **Format Adaptation**: Automatically adjusts file extensions and formats for tool compatibility
3. **Quality Assurance**: Built-in validation ensures packages meet quality standards
4. **Cross-Tool Compatibility**: Convert and adapt packages between different AI tools
5. **Tracking**: Records all installations in `.promptpm.json` for easy management

## Quick Start Examples

**Install a prompt to multiple tools:**
```bash
prmp add https://raw.githubusercontent.com/acme/prompts/main/rules.md --for cursor,claude,windsurf
```

**Create a new package from a template:**
```bash
prmp create my-testing-rules --type cursor --template testing
```

**Validate your package:**
```bash
prmp lint .cursor/rules/my-testing-rules.md
```

**Convert between tools:**
```bash
prmp convert .cursor/rules/my-rules.md --from cursor --to claude
```

## Project Structure

After adding packages, your project will include:

```
my-project/
├── .cursor/rules/          # Cursor rules
├── .claude/agents/         # Claude agents
├── .windsurf/rules/        # Windsurf rules
├── .continue/prompts/      # Continue.dev prompts
├── .aider/                 # Aider conventions
├── .github/
│   ├── copilot-instructions.md    # Copilot repo-wide
│   ├── instructions/              # Copilot path-specific
│   └── prompts/                   # Copilot reusable prompts
└── .promptpm.json          # Package tracking
```

## Why Use prmp?

### 1. Multi-Tool Support
Unlike tool-specific solutions, prmp works across **all major AI coding assistants**. Install once, use everywhere.

### 2. Quality Assurance
Built-in validation and linting ensures your prompts are high-quality and effective:
- Syntax validation
- Best practice checks
- Quality scoring (0-100)
- Tool-specific recommendations

### 3. Package Authoring
Create professional packages with templates:
- Multiple templates per tool type
- Customizable scaffolding
- Consistent structure

### 4. Format Conversion
Easily adapt prompts between tools:
- Automatic syntax conversion
- Compatibility warnings
- Preview before saving

### 5. Ecosystem Ready
Designed for the future with planned features:
- Central package registry
- Package publishing
- Community templates
- AI-powered recommendations

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Build binaries for distribution
npm run build:binary

# Test the CLI
npm run dev add https://raw.githubusercontent.com/user/repo/main/example.md --as cursor
```

## Testing

The project includes comprehensive testing with:

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test command workflows and CLI interactions
- **Error Handling Tests**: Test edge cases and error scenarios
- **CLI Tests**: Test full command-line interface functionality

**Test Coverage**: 91%+ statement coverage across all modules

**Test Commands**:
- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ci` - Run tests for CI/CD environments

## Roadmap

PPM is currently in its early stages (v0.1.x) with basic package management functionality. We have ambitious plans to evolve it into a comprehensive package management ecosystem similar to npm.

**Key Future Features**:
- 🏪 **Central Registry** - Public package repository with search and discovery
- 📦 **Package Publishing** - Tools for authors to publish and manage packages
- 🔍 **Smart Discovery** - AI-powered package recommendations and search
- 🏢 **Enterprise Features** - Private registries, team management, and compliance
- 🤖 **AI Integration** - Intelligent package management and quality assessment

See [ROADMAP.md](ROADMAP.md) for detailed development plans and timeline.
