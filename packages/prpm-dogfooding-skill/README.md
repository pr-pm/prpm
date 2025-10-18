# PRPM Dogfooding Skill

**Dogfooding PRPM on itself** - A multi-file skill package that teaches AI assistants how to develop PRPM with IDE-specific optimizations.

## What is Dogfooding?

"Dogfooding" means using your own product. This skill package uses PRPM to distribute PRPM development knowledge, demonstrating:

1. **Multi-file packages**: 3 comprehensive skills per format
2. **IDE-specific variants**: Cursor (simple) vs Claude (MCP-enhanced)
3. **Format customization**: Different features for different tools
4. **Collections showcase**: How to bundle related skills

## Package Structure

```
prpm-dogfooding-skill/
├── cursor/                           # Cursor variant (simple)
│   ├── core-principles.cursorrules   # Architecture & principles
│   ├── format-conversion.cursorrules # Conversion expertise
│   ├── testing-patterns.cursorrules  # Testing with Vitest
│   └── package.json                  # Cursor package manifest
│
├── claude/                           # Claude variant (MCP-enhanced)
│   ├── core-principles.md            # Architecture + MCP usage
│   ├── format-conversion.md          # Conversion + MCP validation
│   ├── testing-patterns.md           # Testing + MCP automation
│   └── package.json                  # Claude package manifest
│
└── README.md                         # This file
```

## Skill Files

### 1. Core Principles
**What**: PRPM architecture, development principles, and best practices

**Cursor Variant**:
- Development philosophy
- Technical stack overview
- Code quality standards
- Common patterns

**Claude Variant (Enhanced)**:
- All Cursor content PLUS:
- MCP filesystem integration for code navigation
- MCP database integration for registry queries
- MCP web search for documentation lookup
- Real-time development workflow with MCP

**Use When**:
- Starting new features
- Designing APIs
- Making architectural decisions
- Reviewing code quality

### 2. Format Conversion
**What**: Expert knowledge for converting between AI prompt formats

**Cursor Variant**:
- Supported formats (Cursor, Claude, Continue, Windsurf)
- Conversion principles and quality scoring
- Section mapping strategies
- Lossless vs lossy conversions

**Claude Variant (Enhanced)**:
- All Cursor content PLUS:
- MCP-assisted conversion validation
- MCP filesystem for reading test fixtures
- MCP web search for conversion patterns
- Enhanced quality checks with MCP tools
- Claude-specific MCP server configuration
- Marketplace tool integration

**Use When**:
- Building format converters
- Testing conversion quality
- Debugging conversion issues
- Adding new format support

### 3. Testing Patterns
**What**: Testing strategies for PRPM with Vitest

**Cursor Variant**:
- Test organization and structure
- Converter testing patterns
- API and CLI testing
- Coverage goals and metrics

**Claude Variant (Enhanced)**:
- All Cursor content PLUS:
- MCP filesystem for loading test fixtures
- MCP bash for running tests and checking coverage
- MCP-assisted test execution
- Dynamic test generation
- Coverage analysis with MCP tools

**Use When**:
- Writing new tests
- Improving test coverage
- Debugging test failures
- Setting up test infrastructure

## Installation

### For Cursor Users

```bash
# Install via PRPM (when available)
prpm install @prpm/dogfooding-skill-cursor

# Manual installation
cp packages/prpm-dogfooding-skill/cursor/*.cursorrules .cursor/rules/
```

Files installed:
- `.cursor/rules/core-principles.cursorrules`
- `.cursor/rules/format-conversion.cursorrules`
- `.cursor/rules/testing-patterns.cursorrules`

### For Claude Code Users

```bash
# Install via PRPM (when available)
prpm install @prpm/dogfooding-skill-claude --as claude

# Manual installation
cp packages/prpm-dogfooding-skill/claude/*.md .claude/agents/
```

Files installed:
- `.claude/agents/core-principles.md`
- `.claude/agents/format-conversion.md`
- `.claude/agents/testing-patterns.md`

**MCP Servers Required**:
- `@modelcontextprotocol/server-filesystem`
- `@modelcontextprotocol/server-postgres` (optional, for database access)

## Features by Format

| Feature | Cursor | Claude |
|---------|--------|--------|
| Core development principles | ✅ | ✅ |
| Format conversion expertise | ✅ | ✅ |
| Testing patterns | ✅ | ✅ |
| MCP filesystem integration | ❌ | ✅ |
| MCP database access | ❌ | ✅ |
| MCP web search | ❌ | ✅ |
| MCP bash automation | ❌ | ✅ |
| Test execution via MCP | ❌ | ✅ |
| Coverage analysis via MCP | ❌ | ✅ |

## Why Multi-File?

Each skill focuses on a specific domain:

1. **Core Principles** - Architecture and development philosophy
2. **Format Conversion** - Specialized conversion knowledge
3. **Testing Patterns** - Testing strategies and best practices

This modular approach:
- Keeps context focused and relevant
- Allows selective loading
- Makes skills easier to maintain
- Demonstrates multi-file package capabilities

## Why Different Variants?

### Cursor Variant
- **Simple and focused**: No MCP complexity
- **Markdown-based**: Easy to read and edit
- **Lightweight**: Just the essential knowledge
- **Fast loading**: Minimal context overhead

### Claude Variant
- **MCP-enhanced**: Leverage filesystem, database, bash tools
- **Interactive**: Execute commands and validate results
- **Powerful**: Direct access to codebase and database
- **Advanced workflows**: Automated testing, coverage analysis

## Usage Examples

### Cursor: Reviewing Format Conversion
```
User: "How should I handle tools when converting to Cursor format?"

Assistant reads: format-conversion.cursorrules
- Sees that tools are lossy in Cursor
- Recommends converting to text descriptions
- Suggests warning users about quality loss
```

### Claude: Testing with MCP
```
User: "Run the converter tests and show me coverage"

Assistant uses:
1. core-principles.md - Understands test goals
2. testing-patterns.md - Knows how to use MCP bash
3. MCP bash - Executes: npm run test:coverage
4. MCP filesystem - Reads coverage report
5. Reports results with detailed analysis
```

## Demonstrating PRPM Features

This dogfooding skill showcases:

### ✅ Multi-File Packages
- 3 files per format variant
- Organized by domain (principles, conversion, testing)
- Collective 25KB+ of expert knowledge

### ✅ Format-Specific Variants
- Cursor: 3 .cursorrules files
- Claude: 3 .md files with YAML frontmatter
- Same core knowledge, different optimizations

### ✅ IDE-Specific Features
- Cursor: Simple, focused markdown
- Claude: Enhanced with MCP server configs

### ✅ Installation Tracking
- Documented in `prmp.json`
- Shows which files are installed where
- Tracks MCP servers for Claude variant

### ✅ Collections Integration
Could be part of a larger collection:
```json
{
  "id": "@collection/prpm-development-complete",
  "packages": [
    {
      "packageId": "dogfooding-skill",
      "formatSpecific": {
        "cursor": "@prpm/dogfooding-skill-cursor",
        "claude": "@prpm/dogfooding-skill-claude"
      }
    }
  ]
}
```

## Package Metadata

**Cursor Variant** (`packages/prpm-dogfooding-skill/cursor/package.json`):
- Type: `cursor`
- Files: 3 .cursorrules
- Install location: `.cursor/rules/`
- Multi-file: `true`

**Claude Variant** (`packages/prpm-dogfooding-skill/claude/package.json`):
- Type: `claude`
- Files: 3 .md (with YAML frontmatter)
- Install location: `.claude/agents/`
- Multi-file: `true`
- MCP integration: `true`
- Required MCP servers: `filesystem`, `database`, `web_search`, `bash`

## Development

This skill is actively used to develop PRPM itself. When you contribute to PRPM:

1. **Read core-principles** to understand architecture
2. **Reference format-conversion** when working on converters
3. **Follow testing-patterns** when writing tests

## Benefits of Dogfooding

1. **Real-world testing**: Find issues in PRPM by using it
2. **Better UX**: Experience user pain points firsthand
3. **Documentation**: Skills document actual development practices
4. **Showcase**: Demonstrate PRPM's capabilities to users
5. **Quality**: Improve what we use ourselves

## Version History

- **1.0.0** - Initial dogfooding skill with Cursor and Claude variants

## License

MIT - Same as PRPM itself
