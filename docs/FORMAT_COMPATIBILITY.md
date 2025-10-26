# Format Compatibility Guide

This document maps PRPM formats to the AI coding tools that support them, helping you choose the right format for your workflow.

## Quick Reference

| PRPM Format | Compatible Tools | Philosophy | Best For |
|------------|------------------|------------|----------|
| `cursor` | Cursor IDE | Vendor-specific | Cursor-only teams |
| `claude` | Claude Desktop, Claude Code | Vendor-specific | Claude-only teams |
| `continue` | Continue (VS Code/JetBrains) | Open-source | Continue users |
| `windsurf` | Windsurf | Vendor-specific | Windsurf-only teams |
| `copilot` | GitHub Copilot, OpenAI Codex | Vendor-specific | GitHub-centric teams |
| `agents.md` | **OpenAI Codex, GitHub Copilot, Google Gemini Code Assist**, any tool adopting the standard | **Open standard** | **Multi-tool teams, future-proofing** |
| `kiro` | Kiro AI | Vendor-specific | Kiro users |
| `mcp` | Any MCP-compatible tool | Open protocol | Tool integrations |
| `generic` | Manual integration | Universal | Custom workflows |

## Detailed Compatibility

### `agents.md` - Open Standard (Recommended for Multi-Tool Teams)

**What is it?**
An open standard created through collaboration between OpenAI, Google, and other major AI companies for AI coding agent instructions.

**Compatible Tools:**
- ✅ **OpenAI Codex** - The foundational model (direct support)
- ✅ **GitHub Copilot** - Reads `agents.md` in addition to `.github/copilot-instructions.md`
- ✅ **Google Gemini Code Assist** - Committed to supporting the standard
- ✅ **Any future tool** that adopts the open standard

**File Location:**
```
project-root/
└── agents.md
```

**Why Choose This:**
- ✅ Works with multiple tools (no vendor lock-in)
- ✅ Future-proof (open standard with major backing)
- ✅ Simple (single file in project root)
- ✅ Tool-agnostic (works everywhere the standard is adopted)

**When to Use:**
- Teams using multiple AI coding tools
- Organizations avoiding vendor lock-in
- Projects that want future compatibility
- Cross-tool collaboration

**Example:**
```bash
# Install for agents.md format
prpm install @sanjeed5/typescript-best-practices --format agents.md

# Result: Creates agents.md in project root
# Works with: Codex, Copilot, Gemini, and more
```

---

### `copilot` - GitHub Copilot (GitHub-Specific)

**What is it?**
GitHub's official format for Copilot instructions.

**Compatible Tools:**
- ✅ **GitHub Copilot** (VS Code, JetBrains, Visual Studio, etc.)
- ✅ **OpenAI Codex** (underlying model)

**File Locations:**
```
.github/
├── copilot-instructions.md              # Repository-wide
├── instructions/
│   └── *.instructions.md                # Path-specific
└── chatmodes/
    └── *.chatmode.md                    # Custom chat modes
```

**Why Choose This:**
- ✅ GitHub-optimized features (path-specific instructions, chat modes)
- ✅ Native VS Code integration
- ✅ Advanced features (AGENTS.md, CLAUDE.md, GEMINI.md variants)
- ❌ Vendor lock-in (GitHub-specific)

**When to Use:**
- Teams all-in on GitHub ecosystem
- Need path-specific instructions
- Want custom chat modes
- Already using VS Code with Copilot

---

### `cursor` - Cursor IDE

**Compatible Tools:**
- ✅ **Cursor IDE** only

**File Location:**
```
.cursor/
└── rules
```

**When to Use:**
- Team exclusively uses Cursor
- Need Cursor-specific features
- Cursor is primary development environment

---

### `claude` - Claude Desktop/Code

**Compatible Tools:**
- ✅ **Claude Desktop** (desktop app)
- ✅ **Claude Code** (IDE integration)

**File Location:**
```
.claude/
└── skills/
    └── */SKILL.md
```

**When to Use:**
- Team uses Anthropic's Claude tools
- Need Claude-specific skills/agents
- Using Claude Desktop or Claude Code

---

### `continue` - Continue Extension

**Compatible Tools:**
- ✅ **Continue** (VS Code extension)
- ✅ **Continue** (JetBrains IDEs)

**File Location:**
```
.continue/
└── rules
```

**When to Use:**
- Using Continue extension
- Want open-source AI coding assistant
- Multi-IDE support (VS Code + JetBrains)

---

### `windsurf` - Windsurf IDE

**Compatible Tools:**
- ✅ **Windsurf IDE** only

**File Location:**
```
.windsurf/
└── rules
```

**When to Use:**
- Team uses Windsurf
- Need hierarchical rules support
- Windsurf is primary IDE

---

### `kiro` - Kiro AI

**Compatible Tools:**
- ✅ **Kiro** steering system

**File Location:**
```
.kiro/
└── steering/
    └── *.md
```

**When to Use:**
- Using Kiro AI platform
- Need steering file functionality
- Want inclusion mode features

---

### `mcp` - Model Context Protocol

**Compatible Tools:**
- ✅ Any tool implementing MCP (Claude, potentially others)

**File Location:**
```
mcp.json (configuration)
+ tool-specific server implementations
```

**When to Use:**
- Building tool integrations
- Need server/client architecture
- Want protocol-level compatibility

---

### `generic` - Universal/Manual

**Compatible Tools:**
- Manual integration with any tool

**File Location:**
Flexible (you decide)

**When to Use:**
- Custom workflow
- Tool not listed above
- Manual prompt management

---

## Multi-Tool Strategy

### Scenario: Team Using Multiple Tools

**Problem:**
Team uses GitHub Copilot, Claude Desktop, and wants future compatibility.

**Solution 1: Open Standard (Recommended)**
```bash
prpm install @my-org/project-guidelines --format agents.md
```
✅ Works with Codex (powers Copilot)
✅ Can be read by future tools
⚠️ May miss tool-specific features

**Solution 2: Multi-Format (Advanced)**
```bash
# Install for each tool
prpm install @my-org/project-guidelines --format copilot
prpm install @my-org/project-guidelines --format claude
prpm install @my-org/project-guidelines --format agents.md  # Fallback
```
✅ Maximum compatibility
✅ Tool-specific features
❌ More maintenance

---

## Format Aliases

PRPM supports aliases so users can filter by tool name:

```bash
# Search by format
prpm search typescript --format agents.md

# Future: Search by tool name (alias)
prpm search typescript --tool codex      # Returns agents.md packages
prpm search typescript --tool copilot    # Returns copilot + agents.md packages
prpm search typescript --tool gemini     # Returns agents.md packages
```

---

## Choosing a Format

### Decision Tree

```
Are you using multiple AI tools?
├─ Yes → Choose `agents.md` (open standard)
│
└─ No → Are you using GitHub Copilot?
    ├─ Yes → Need advanced features (chat modes, path-specific)?
    │   ├─ Yes → Choose `copilot`
    │   └─ No → Choose `agents.md` (future-proof)
    │
    └─ No → Choose your tool's specific format:
        ├─ Cursor → `cursor`
        ├─ Claude → `claude`
        ├─ Continue → `continue`
        ├─ Windsurf → `windsurf`
        ├─ Kiro → `kiro`
        └─ Other → `generic`
```

---

## Conversion Between Formats

PRPM can convert between formats:

```bash
# Convert Cursor rules to agents.md
prpm install @cursor-org/react-rules --as agents.md

# Convert agents.md to Copilot format
prpm install @openai-org/python-guide --as copilot
```

**Quality Scores:**
- Some conversions are lossless (high quality)
- Some are lossy (features may be lost)
- PRPM provides quality scores for each conversion

---

## Resources

- **agents.md Specification**: https://github.com/openai/agents.md
- **GitHub Copilot Docs**: https://docs.github.com/copilot
- **PRPM Format Conversion Guide**: [FORMAT_CONVERSION.md](./FORMAT_CONVERSION.md)
- **PRPM Import Format Specs**: [IMPORT_FORMAT_SPECS.md](./IMPORT_FORMAT_SPECS.md)

---

## Contributing

Found a tool that supports `agents.md` or another format? Please open a PR to update this guide!
