# AI IDE Rules & Context Support

A comprehensive reference for AI-powered IDEs and their rules/context systems, including which formats PRPM currently supports and plans to support.

## Overview

This document tracks different AI IDEs, their documentation for rules/context configuration, and PRPM's support status for each format. The goal is to make PRPM the universal package manager for AI prompts across all major AI development tools.

## Quick Reference Table

| IDE | File Location | Format | PRPM Support | Documentation |
|-----|--------------|--------|--------------|---------------|
| **Cursor** | `.cursor/rules/` | Markdown with MDC frontmatter | ✅ Full | [Cursor Rules](https://docs.cursor.com/context/rules-for-ai) |
| **GitHub Copilot** | `.github/copilot-instructions.md`<br/>`.github/instructions/*.instructions.md` | Markdown with YAML frontmatter | ✅ Full | [Copilot Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) |
| **Windsurf** | `.windsurfrules` | Plain Markdown | ✅ Full | [Windsurf Docs](https://codeium.com/windsurf) |
| **Claude Code** | `.claude/` | Various (agents, skills, commands) | ✅ Full | [Claude Code Docs](https://docs.claude.com/en/docs/claude-code) |
| **Continue** | `.continue/` | JSON + Markdown | ✅ Full | [Continue Docs](https://docs.continue.dev/) |
| **Kiro** | `.kiro/steering/` | Markdown with YAML frontmatter | ✅ Full | [Kiro Docs](https://kiro.dev/docs/steering/) |
| **OpenAI Codex** | `AGENTS.md`<br/>`AGENTS.override.md` | Plain Markdown | ✅ Full | [AGENTS.md Spec](https://agents.md/) |
| **Aider** | `CONVENTIONS.md` (configurable) | Plain Markdown | 🔄 Planned | [Aider Conventions](https://aider.chat/docs/usage/conventions.html) |
| **Trae.ai** | `.trae/rules/project_rules.md`<br/>`user_rules.md` (settings) | Plain Markdown | 🔄 Planned | [Trae Rules](https://docs.trae.ai/ide/rules-for-ai) |
| **Zencoder** | TBD | TBD | 🔄 Planned | [Zencoder Rules](https://docs.zencoder.ai/rules-context/zen-rules) |
| **Cody (Sourcegraph)** | `.vscode/cody.json` | JSON | 🔄 Planned | [Cody Docs](https://sourcegraph.com/docs/cody) |
| **Tabnine** | `.tabnine/config.json` | JSON | 🔄 Planned | [Tabnine Docs](https://www.tabnine.com/code-review-agent) |
| **Amazon Q** | TBD | TBD | 🔄 Planned | [Amazon Q Docs](https://aws.amazon.com/q/developer/) |
| **Replit AI** | `.replit` | TOML | 🔄 Planned | [Replit Docs](https://docs.replit.com/replitai) |
| **Pieces** | TBD | TBD | 🔄 Planned | [Pieces Docs](https://docs.pieces.app/) |

## Currently Supported IDEs

### Cursor

**File Location**: `.cursor/rules/`
**Format**: Markdown with optional MDC frontmatter
**PRPM Support**: ✅ Full

Cursor uses markdown files with optional frontmatter for metadata like emoji and name. Rules can include instructions, examples, and references.

**PRPM Documentation**: [CURSOR.md](./CURSOR.md) (if exists)

**Official Documentation**:
- [Cursor Rules Documentation](https://docs.cursor.com/context/rules-for-ai)
- [Cursor Rules Repository](https://github.com/PatrickJS/awesome-cursorrules)

**Example Structure**:
```markdown
---
name: React Best Practices
emoji: ⚛️
---

# React Development Guidelines

## Component Structure
- Use functional components
- Implement proper TypeScript types
```

---

### GitHub Copilot

**File Location**:
- Repository-wide: `.github/copilot-instructions.md`
- Path-specific: `.github/instructions/*.instructions.md`

**Format**: Markdown with YAML frontmatter for path-specific rules
**PRPM Support**: ✅ Full

**PRPM Documentation**: [GITHUB_COPILOT.md](./GITHUB_COPILOT.md)

**Official Documentation**:
- [Adding Custom Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)

**Example Structure**:
```markdown
---
applyTo:
  - src/**/*.test.ts
---

# Testing Guidelines
Follow these rules for test files.
```

---

### Windsurf

**File Location**: `.windsurfrules`
**Format**: Plain Markdown (no frontmatter)
**PRPM Support**: ✅ Full

**PRPM Documentation**: [WINDSURF.md](./WINDSURF.md)

**Official Documentation**:
- [Windsurf Documentation](https://codeium.com/windsurf)

**Example Structure**:
```markdown
# Project Coding Standards

## TypeScript Guidelines
- Use strict mode
- Avoid any types
```

---

### Claude Code

**File Location**: `.claude/` directory
**Format**: Multiple formats (agents, skills, commands)
**PRPM Support**: ✅ Full

Claude Code supports multiple types of prompts:
- **Agents**: Specialized AI assistants (`.claude/agents/`)
- **Skills**: Reusable capabilities (`.claude/skills/`)
- **Commands**: Slash commands (`.claude/commands/`)

**Official Documentation**:
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)

---

### Continue

**File Location**: `.continue/` directory
**Format**: JSON configuration + Markdown prompts
**PRPM Support**: ✅ Full

Continue uses a JSON configuration file with references to markdown prompt files.

**Official Documentation**:
- [Continue Documentation](https://docs.continue.dev/)
- [Continue Customization](https://docs.continue.dev/customization/overview)

---

### Kiro

**File Location**: `.kiro/steering/` directory
**Format**: Markdown with YAML frontmatter
**PRPM Support**: ✅ Full

Kiro uses steering files to guide AI behavior with a domain-based organization system. Each file represents one domain (testing, security, architecture, etc.) with flexible inclusion modes.

**PRPM Documentation**: [KIRO.md](./KIRO.md)

**Official Documentation**:
- [Kiro Steering Documentation](https://kiro.dev/docs/steering/)

**Key Features**:
- **Three inclusion modes**:
  - `always` - Applied to all AI interactions
  - `fileMatch` - Applied based on glob patterns (e.g., `**/*.test.ts`)
  - `manual` - Applied only when explicitly requested
- **Domain-based organization** - One domain per file (testing.md, security.md, etc.)
- **Context-aware rules** - Rules activate based on file patterns

**Example Structure**:
```markdown
---
inclusion: fileMatch
fileMatchPattern: "**/*.test.ts"
domain: testing
---

# Testing Standards

## Test Structure
- Use describe blocks for test suites
- One test per behavior
- Clear, descriptive test names

## Best Practices
- Test behavior, not implementation
- Mock external dependencies
- Keep tests fast and isolated
```

**Installation Example**:
```bash
# Install as Kiro format
prpm install @prpm/testing-standards --as kiro

# Installs to: .kiro/steering/testing.md
```

---

### OpenAI Codex (AGENTS.md)

**File Location**:
- Global: `~/.codex/AGENTS.md` or `~/.codex/AGENTS.override.md`
- Project: `AGENTS.md` or `AGENTS.override.md` (repository root to working directory)

**Format**: Plain Markdown (no frontmatter required)
**PRPM Support**: ✅ Full

AGENTS.md is an open standard for guiding AI coding agents, created through collaboration between OpenAI, Google, Cursor, and others. It's a simple README-like file that tells AI tools how to work with your codebase.

**Official Documentation**:
- [AGENTS.md Specification](https://agents.md/)
- [OpenAI Codex Documentation](https://github.com/openai/codex/blob/main/docs/agents_md.md)

**Key Features**:
- **Simple format** - Just standard Markdown, no special syntax
- **Hierarchical precedence** - Files in deeper directories override parent guidance
- **Size limits** - Combined project documentation limited to 32 KiB by default
- **Fallback filenames** - Configurable alternatives (e.g., `TEAM_GUIDE.md`, `.agents.md`)
- **Universal standard** - Supported by multiple AI coding tools
- **Project-level only** - AGENTS.md is for project guidance; slash commands are global only

**What to Include**:
- **Project structure** - Directory organization, architecture decisions
- **Coding standards** - Style guidelines, naming conventions, best practices
- **Testing instructions** - How to run tests, frameworks used, coverage requirements
- **Development workflow** - Build commands, deployment procedures, conventions

**Example Structure**:
```markdown
# Project Name

## Architecture

This project uses a monorepo structure with:
- `/src` - Source code organized by feature
- `/tests` - Integration and unit tests
- `/docs` - Project documentation

## Coding Standards

- Use TypeScript with strict mode enabled
- Follow ESLint configuration in `.eslintrc.js`
- Components use PascalCase, utilities use camelCase
- All functions must have JSDoc comments

## Testing

Run tests with:
```bash
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:coverage # Coverage report
```

## Pull Requests

- Link to related issue
- Include test coverage
- Keep changes focused and atomic
```

**Precedence Order**:
1. Global `~/.codex/AGENTS.override.md` (or `AGENTS.md`)
2. Repository root `AGENTS.md`
3. Subdirectory `AGENTS.md` files (override parent guidance)

**Installation Example**:
```bash
# Install as AGENTS.md format
prpm install typescript-best-practices --format agents.md

# Installs to: AGENTS.md
```

**Cross-Tool Compatibility**:
AGENTS.md is designed to work with multiple AI coding tools:
- OpenAI Codex
- GitHub Copilot (can reference AGENTS.md)
- Cursor (has AGENTS.md support)
- And other tools adopting the standard

**Important: Slash Commands vs AGENTS.md**:

Codex distinguishes between project guidance and reusable commands:

| Feature | AGENTS.md | Slash Commands |
|---------|-----------|----------------|
| **Scope** | Project-specific | Global only |
| **Location** | Project directory | `~/.codex/prompts/` |
| **Purpose** | Project conventions, standards, architecture | Reusable commands across all projects |
| **Activation** | Automatic (based on context) | Manual invocation with `/prompts:<name>` |

**Example Use Cases**:
- **AGENTS.md**: "This project uses React with TypeScript. All components should use functional style."
- **Slash Commands**: Global commands like `/prompts:code-review` or `/prompts:write-tests` that work across all projects

For project-specific guidance, use AGENTS.md files. For global reusable commands, create custom prompts in `~/.codex/prompts/`.

**Official Documentation**:
- [Codex Slash Commands Guide](https://developers.openai.com/codex/guides/slash-commands)

---

## Planned Support

### Aider

**File Location**: `CONVENTIONS.md` (configurable via `.aider.conf.yml`)
**Format**: Plain Markdown (bullet-point format)
**PRPM Support**: 🔄 Planned

**Key Features**:
- Simple markdown file with coding preferences
- Can be loaded per-session or configured persistently
- Supports prompt caching when marked read-only
- Community repository for sharing conventions

**Official Documentation**:
- [Aider Conventions Guide](https://aider.chat/docs/usage/conventions.html)
- [Aider Conventions Repository](https://github.com/Aider-AI/conventions)

**Example Structure**:
```markdown
# Coding Conventions

- Prefer httpx over requests
- Use types everywhere possible
- Follow PEP 8 style guide
- Write docstrings for all functions
```

**Loading Methods**:
```bash
# Per-session
aider --read CONVENTIONS.md

# Persistent (in .aider.conf.yml)
read: CONVENTIONS.md
```

---

### Trae.ai

**File Location**:
- Project rules: `.trae/rules/project_rules.md`
- User rules: `user_rules.md` (in settings)

**Format**: Plain Markdown
**PRPM Support**: 🔄 Planned

**Key Features**:
- Two-level rules system (user-level and project-level)
- User rules apply across all projects
- Project rules are project-specific
- Automatic creation through IDE interface
- Immediate effect without restart

**Official Documentation**:
- [Trae.ai Rules Documentation](https://docs.trae.ai/ide/rules-for-ai)

**Example Structure**:
```markdown
# Project Rules

## Code Style
- Use 2-space indentation
- Prefer const over let

## Framework Preferences
- Use React with TypeScript
- Use Tailwind CSS for styling
```

---

### Zencoder

**File Location**: TBD
**Format**: TBD
**PRPM Support**: 🔄 Planned

**Official Documentation**:
- [Zencoder Rules Documentation](https://docs.zencoder.ai/rules-context/zen-rules)

*Note: Documentation currently inaccessible (403). Needs further research.*

---

### Cody (Sourcegraph)

**File Location**: `.vscode/cody.json`
**Format**: JSON
**PRPM Support**: 🔄 Planned

Sourcegraph's Cody AI assistant uses JSON configuration for custom commands and context.

**Official Documentation**:
- [Cody Documentation](https://sourcegraph.com/docs/cody)
- [Custom Commands](https://sourcegraph.com/docs/cody/capabilities/commands#custom-commands)

---

### Tabnine

**File Location**: `.tabnine/config.json`
**Format**: JSON
**PRPM Support**: 🔄 Planned

**Official Documentation**:
- [Tabnine Documentation](https://www.tabnine.com/code-review-agent)

---

### Amazon Q Developer

**File Location**: TBD
**Format**: TBD
**PRPM Support**: 🔄 Planned

AWS's AI coding assistant integrated with Amazon Q.

**Official Documentation**:
- [Amazon Q Developer Documentation](https://aws.amazon.com/q/developer/)

---

### Replit AI

**File Location**: `.replit`
**Format**: TOML
**PRPM Support**: 🔄 Planned

Replit's AI features can be configured through the `.replit` configuration file.

**Official Documentation**:
- [Replit AI Documentation](https://docs.replit.com/replitai)

---

### Pieces

**File Location**: TBD
**Format**: TBD
**PRPM Support**: 🔄 Planned

**Official Documentation**:
- [Pieces Documentation](https://docs.pieces.app/)

---

## PRPM Format Conversion

PRPM's key differentiator is **universal format conversion** - publish once, install for any AI IDE.

### How It Works

```bash
# Install for Cursor
prpm install react-best-practices --as cursor

# Install for GitHub Copilot
prpm install react-best-practices --as copilot

# Install for Windsurf
prpm install react-best-practices --as windsurf

# Install for Kiro
prpm install react-best-practices --as kiro

# Install for OpenAI Codex (AGENTS.md)
prpm install react-best-practices --format agents.md

# Install for Aider (when supported)
prpm install react-best-practices --as aider
```

### Supported Conversions

Current conversion matrix:

| Source → Target | Cursor | Copilot | Windsurf | Claude | Continue | Kiro | AGENTS.md |
|----------------|--------|---------|----------|--------|----------|------|-----------|
| **Cursor**     | ✅     | ✅      | ✅       | ✅     | ✅       | ✅   | ✅        |
| **Copilot**    | ✅     | ✅      | ✅       | ✅     | ✅       | ✅   | ✅        |
| **Windsurf**   | ✅     | ✅      | ✅       | ✅     | ✅       | ✅   | ✅        |
| **Claude**     | ✅     | ✅      | ✅       | ✅     | ✅       | ✅   | ✅        |
| **Continue**   | ✅     | ✅      | ✅       | ✅     | ✅       | ✅   | ✅        |
| **Kiro**       | ✅     | ✅      | ✅       | ✅     | ✅       | ✅   | ✅        |
| **AGENTS.md**  | ✅     | ✅      | ✅       | ✅     | ✅       | ✅   | ✅        |

See [FORMAT_CONVERSION.md](./FORMAT_CONVERSION.md) for technical details.

---

## Implementation Roadmap

### Phase 1: Research (Current)
- ✅ Document all major AI IDE formats
- ✅ Identify rule file locations and formats
- 🔄 Research Zencoder, Cody, Tabnine formats
- 🔄 Test format compatibility

### Phase 2: Aider Support
- [ ] Implement Aider format parser
- [ ] Add Aider format converter
- [ ] Support `.aider.conf.yml` configuration
- [ ] Test with Aider conventions repository
- [ ] Document Aider usage in PRPM

### Phase 3: Trae.ai Support
- [ ] Implement Trae.ai format parser
- [ ] Support both project and user rules
- [ ] Add Trae.ai format converter
- [ ] Document Trae.ai usage in PRPM

### Phase 4: Additional IDEs
- [ ] Zencoder support (pending format research)
- [ ] Cody (Sourcegraph) support
- [ ] Tabnine support
- [ ] Amazon Q support
- [ ] Replit AI support
- [ ] Pieces support

### Phase 5: Advanced Features
- [ ] Smart format detection
- [ ] Format-specific optimizations
- [ ] Quality scoring per format
- [ ] Community format contributions

---

## Contributing

Help us expand AI IDE support!

### Adding New IDE Support

1. **Research the IDE's format**:
   - File location(s)
   - File format (Markdown, JSON, TOML, etc.)
   - Frontmatter/metadata structure
   - Special features or syntax

2. **Document the format**:
   - Add to this document
   - Create dedicated docs (e.g., `AIDER.md`)
   - Include examples and best practices

3. **Implement support**:
   - Create format parser
   - Add format converter
   - Update CLI commands
   - Add tests

4. **Submit PR**:
   - Include documentation
   - Add tests
   - Update conversion matrix

### Format Research Template

When researching a new AI IDE, document:

```markdown
## IDE Name

**File Location**:
**Format**:
**PRPM Support**:

**Key Features**:
-
-

**Official Documentation**:
-

**Example Structure**:
```

---

## Resources

### PRPM Documentation
- [Format Conversion System](./FORMAT_CONVERSION.md)
- [Format Compatibility](./FORMAT_COMPATIBILITY.md)
- [GitHub Copilot Support](./GITHUB_COPILOT.md)
- [Windsurf Support](./WINDSURF.md)

### External Resources
- [Cursor Rules Awesome List](https://github.com/PatrickJS/awesome-cursorrules)
- [Aider Conventions Repository](https://github.com/Aider-AI/conventions)
- [Continue Documentation](https://docs.continue.dev/)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)

---

## Feedback & Suggestions

Have suggestions for AI IDEs we should support? Open an issue or PR!

- Missing an IDE? Let us know which ones you use.
- Found better documentation? Share the links.
- Want to help implement support? Check our contributing guide.

---

**Last Updated**: 2024-11-14
**Status**: Living document - continuously updated as new AI IDEs emerge
