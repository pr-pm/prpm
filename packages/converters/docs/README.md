# AI Prompt Format Documentation

Comprehensive documentation for all supported AI prompt formats in PRPM.

## Format Matrix

Complete overview of all supported formats, their subtypes, and official documentation links.

| Format | Subtype | Description | Official Docs |
|--------|---------|-------------|---------------|
| **Cursor** | `rule` | MDC format with YAML frontmatter for context rules | [cursor.com](https://cursor.com/docs/context/rules) |
| | `agent` | Custom agent configurations | [cursor.com](https://cursor.com/docs/context/rules#agentsmd) |
| | `slash-command` | Executable slash commands | [cursor.com](https://cursor.com/docs/context/rules) |
| **Claude Code** | `agent` | AI agents with specific roles and capabilities | [code.claude.com](https://code.claude.com/docs/en/sub-agents) |
| | `skill` | Specialized skills for Claude agents | [code.claude.com](https://code.claude.com/docs/en/skills) |
| | `slash-command` | Custom slash commands for workflows | [code.claude.com](https://code.claude.com/docs/en/slash-commands) |
| | `hook` | Event-driven automations | [code.claude.com](https://code.claude.com/docs/en/hooks) |
| **Continue** | `rule` | Context rules with globs and regex matching | [docs.continue.dev](https://docs.continue.dev/customize/deep-dives/rules) |
| **Windsurf** | `rule` | Plain markdown rules (12k character limit) | [docs.windsurf.com](https://docs.windsurf.com/windsurf/cascade/memories#rules) |
| **GitHub Copilot** | `repository` | Repository-level instructions | [docs.github.com](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) |
| | `path` | Path-specific instructions with excludeAgent | [docs.github.com](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) |
| **Kiro** | `steering` | Steering files with inclusion modes (always/fileMatch/manual) | [kiro.dev](https://kiro.dev/docs/steering/) |
| | `hook` | Event-driven shell commands (JSON) | [kiro.dev](https://kiro.dev/docs/hooks/) |
| | `agent` | Custom AI agent configurations with MCP servers and tools | [kiro.dev](https://kiro.dev/docs/cli/custom-agents/) |
| **Ruler** | `rule` | Plain markdown for centralized management (no frontmatter) | [okigu.com/ruler](https://okigu.com/ruler) |
| **Factory Droid** | `skill` | Reusable workflows with YAML frontmatter | [docs.factory.ai](https://docs.factory.ai/cli/configuration/skills) |
| | `slash-command` | Custom slash commands with argument hints | [docs.factory.ai](https://docs.factory.ai/cli/configuration/custom-slash-commands) |
| | `agents-md` | Agent configurations in markdown | [docs.factory.ai](https://docs.factory.ai/cli/configuration/agents-md) |
| **OpenCode** | `agent` | AI agents with mode, tools, and permissions | [opencode.ai](https://opencode.ai/docs/agents/) |
| | `slash-command` | User-triggered prompts with templates and placeholders | [opencode.ai](https://opencode.ai/docs/commands/) |
| **Gemini CLI** | `slash-command` | Custom slash commands in TOML format | [geminicli.com](https://geminicli.com/docs/commands/) |
| | `extension` | Extensions with MCP servers and context files | [geminicli.com](https://geminicli.com/docs/extensions/) |
| **agents.md** | `agent` | OpenAI format, single file plain markdown | [github.com/openai](https://github.com/openai/agents.md) |
| **Trae** | `rule` | Plain markdown user and project rules (NO frontmatter) | [docs.trae.ai](https://docs.trae.ai/ide/rules) |
| **Aider** | `rule` | Plain markdown coding conventions (NO frontmatter) | [aider.chat](https://aider.chat/docs/usage/conventions.html) |
| **Zencoder** | `rule` | Markdown with optional YAML frontmatter (description, globs, alwaysApply) | [docs.zencoder.ai](https://docs.zencoder.ai/rules-context/zen-rules) |
| **Replit** | `rule` | Plain markdown project configuration (NO frontmatter) | [docs.replit.com](https://docs.replit.com/replitai/replit-dot-md) |
| **Amp** | `skill` | Reusable patterns with bundled tools and MCP servers | [ampcode.com](https://ampcode.com/manual) |
| | `slash-command` | Custom commands extending prompt input | [ampcode.com](https://ampcode.com/manual#custom-commands) |
| | `rule` | AGENTS.md with optional glob filtering | [ampcode.com](https://ampcode.com/manual#agents-md) |

## Format Specifications

This directory contains detailed specifications for each AI IDE/tool format that PRPM supports. Each document includes:

- File locations and naming conventions
- Format structure (frontmatter, content, etc.)
- Required and optional fields
- Examples and best practices
- Conversion notes (from/to canonical format)
- Limitations and differences from other formats
- Official documentation links

## Available Formats

### IDE Formats

| Format | File | Description | Official Docs |
|--------|------|-------------|---------------|
| **Cursor** | [cursor.md](./cursor.md) | MDC format with YAML frontmatter, 4 rule types | [cursor.com/docs](https://cursor.com/docs/context/rules) |
| **Claude Code** | [claude.md](./claude.md) | Agents, skills, commands, and hooks | [docs.claude.com](https://docs.claude.com/claude-code) |
| **Continue** | [continue.md](./continue.md) | Markdown with globs, regex, and alwaysApply | [continue.dev/docs](https://docs.continue.dev/customize/deep-dives/rules) |
| **Windsurf** | [windsurf.md](./windsurf.md) | Plain markdown, 12k character limit | [windsurf.com/docs](https://docs.windsurf.com/windsurf/cascade/memories#rules) |
| **GitHub Copilot** | [copilot.md](./copilot.md) | Path-specific instructions with excludeAgent | [docs.github.com](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions) |
| **Kiro** | [kiro.md](./kiro.md) | Steering files with optional frontmatter | [kiro.dev/docs](https://kiro.dev/docs/steering/) |
| **Kiro Hooks** | [kiro-hooks.md](./kiro-hooks.md) | Event-driven automations (JSON) | [kiro.dev/docs](https://kiro.dev/docs/hooks/) |
| **Kiro Agents** | [kiro-agents.md](./kiro-agents.md) | Custom AI agent configurations (JSON) | [kiro.dev/docs](https://kiro.dev/docs/cli/custom-agents/) |
| **Ruler** | [ruler.md](./ruler.md) | Plain markdown rules, centralized management | [okigu.com/ruler](https://okigu.com/ruler) |
| **Factory Droid** | [factory-droid.md](./factory-droid.md) | Skills, slash commands, and hooks | [docs.factory.ai](https://docs.factory.ai/) |
| **OpenCode** | [opencode.md](./opencode.md) | Agents and slash commands with YAML frontmatter | [opencode.ai/docs](https://opencode.ai/docs/) |
| **Gemini CLI** | [gemini-plugin.md](./gemini-plugin.md) | Extensions with MCP servers and custom commands | [geminicli.com/docs](https://geminicli.com/docs/extensions/) |
| **agents.md** | [agents-md.md](./agents-md.md) | OpenAI format, plain markdown | [github.com/openai/agents.md](https://github.com/openai/agents.md) |
| **Trae** | [trae.md](./trae.md) | Plain markdown rules, no frontmatter | [docs.trae.ai](https://docs.trae.ai/ide/rules) |
| **Aider** | [aider.md](./aider.md) | Plain markdown coding conventions | [aider.chat](https://aider.chat/docs/usage/conventions.html) |
| **Zencoder** | [zencoder.md](./zencoder.md) | Markdown with optional YAML frontmatter | [docs.zencoder.ai](https://docs.zencoder.ai/rules-context/zen-rules) |
| **Replit** | [replit.md](./replit.md) | Plain markdown project configuration | [docs.replit.com](https://docs.replit.com/replitai/replit-dot-md) |
| **Amp** | [amp.md](./amp.md) | Skills, commands, and AGENTS.md with optional globs | [ampcode.com](https://ampcode.com/manual) |

## Schema Validation

Each format has a corresponding JSON Schema in `../schemas/` that defines the structure and validates packages. These schemas ensure package integrity, validate required fields, and provide helpful error messages during publishing and conversion.

### How Validation Works

1. **During Publishing**: When you run `prpm publish`, the CLI validates your package against the appropriate schema
2. **During Conversion**: When converting between formats, PRPM validates both input and output
3. **Subtype-Specific**: Formats with subtypes (agent, skill, slash-command, hook) use specialized schemas for stricter validation

### Schema Organization

**Base Format Schemas:**
- `cursor.schema.json` - Cursor rules
- `claude.schema.json` - Claude Code (base)
- `continue.schema.json` - Continue rules
- `windsurf.schema.json` - Windsurf rules
- `copilot.schema.json` - GitHub Copilot instructions
- `kiro-steering.schema.json` - Kiro steering files
- `droid.schema.json` - Factory Droid (base)
- `opencode.schema.json` - OpenCode agents
- `gemini.schema.json` - Gemini CLI
- `ruler.schema.json` - Ruler rules
- `agents-md.schema.json` - OpenAI agents.md format
- `trae.schema.json` - Trae rules
- `aider.schema.json` - Aider conventions
- `zencoder.schema.json` - Zencoder rules
- `replit.schema.json` - Replit configuration
- `amp.schema.json` - Amp AGENTS.md format
- `canonical.schema.json` - PRPM universal format

**Claude Code Subtypes:**
- `claude-agent.schema.json` - AI agents with tools and permissions
- `claude-skill.schema.json` - Specialized skills
- `claude-slash-command.schema.json` - Custom slash commands
- `claude-hook.schema.json` - Event-driven hooks

**Cursor Subtypes:**
- `cursor-command.schema.json` - Cursor slash commands

**Kiro Subtypes:**
- `kiro-agent.schema.json` - Custom AI agents
- `kiro-hooks.schema.json` - Event hooks (JSON)

**Factory Droid Subtypes:**
- `droid-skill.schema.json` - Reusable workflows
- `droid-slash-command.schema.json` - Custom slash commands
- `droid-hook.schema.json` - Event-driven automations (JSON)

**OpenCode Subtypes:**
- `opencode-slash-command.schema.json` - Template-based commands

**Amp Subtypes:**
- `amp-skill.schema.json` - Reusable skills with bundled tools
- `amp-command.schema.json` - Custom slash commands

**Gemini CLI Subtypes:**
- `gemini-extension.schema.json` - Extensions with MCP servers

### Accessing Schemas

All schemas are available in three locations:

1. **Source**: `packages/converters/schemas/` (development)
2. **Runtime**: `packages/cli/dist/schemas/` (bundled with CLI)
3. **Registry API**:
   - Base format schemas: `https://registry.prpm.dev/api/v1/schemas/{format}.json`
   - Subtype schemas: `https://registry.prpm.dev/api/v1/schemas/{format}/{subtype}.json`

### Using Schemas in Your Code

```typescript
import { validateMarkdown, validateFormat } from '@pr-pm/converters';

// Validate markdown with frontmatter
const result = validateMarkdown('claude', content, 'agent');
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Validate structured data
const data = { frontmatter: {...}, content: '...' };
const result2 = validateFormat('claude', data, 'agent');
```

## Using This Documentation

### For Package Authors

When creating packages for a specific format, reference the appropriate documentation to ensure your package structure matches the format's requirements.

### For Contributors

When adding support for new formats or updating existing ones:

1. Update the format specification document in `docs/`
2. Update or create the JSON schema in `schemas/`
3. Update the converter implementation in `src/`
4. Add tests in `src/__tests__/`
5. Update this README to include the new format

### For Developers

These specifications serve as the source of truth for:
- **Converter implementation** - How to parse and generate each format
- **Validation logic** - What makes a valid package for each format
- **Quality scoring** - Format-specific quality criteria
- **Documentation generation** - User-facing package documentation

## Format Comparison

### Frontmatter Support

| Format | Frontmatter | Required Fields | Optional Fields |
|--------|-------------|-----------------|-----------------|
| Cursor | YAML (required) | `description` | `globs`, `alwaysApply` |
| Claude | YAML (required) | `name`, `description` | `icon`, `tools`, `model` |
| Continue | YAML (optional) | none | `name`, `globs`, `regex`, `alwaysApply` |
| Windsurf | None | none | none |
| Copilot | Markdown headers | none | `applyTo`, `excludeAgent` |
| Kiro | YAML (optional) | none | `inclusion`, `fileMatchPattern`, `domain` |
| Factory Droid | YAML (required) | `name`, `description` | `argument-hint`, `allowed-tools` |
| OpenCode Agents | YAML (required) | `description`, `mode` | `model`, `temperature`, `prompt`, `tools`, `permission`, `disable` |
| OpenCode Commands | YAML (required) | `template` | `description`, `agent`, `model`, `subtask` |
| Gemini Extension | JSON (required) | `name`, `version` | `description`, `author`, `mcpServers`, `contextFileName`, `excludeTools`, `experimentalSettings` |
| agents.md | None | none | none |
| Trae | None | none | none |
| Aider | None | none | none |
| Zencoder | YAML (optional) | none | `description`, `globs`, `alwaysApply` |
| Replit | None | none | none |
| Amp Skills | YAML (required) | `name`, `description` | `argument-hint`, `disable-model-invocation` |
| Amp AGENTS.md | YAML (optional) | none | `globs` |

### File Organization

| Format | Location | Structure |
|--------|----------|-----------|
| Cursor | `.cursor/rules/` | Multiple files in directory |
| Claude | `.claude/{agents,skills,commands,hooks}/` | Organized by type |
| Continue | `.continue/rules/*.md` | Multiple files |
| Windsurf | `.windsurf/rules` | Single file |
| Copilot | `.github/**/*.instructions.md` | Path-specific |
| Kiro | `.kiro/steering/*.md` | Multiple files |
| Kiro Hooks | `.kiro/hooks/*.json` | Multiple JSON files |
| Factory Droid | `.factory/skills/*/SKILL.md`, `.factory/commands/*.md` | Skills in subdirs, commands as files |
| OpenCode | `.opencode/agent/*.md`, `.opencode/command/*.md` | Agents and commands as separate files |
| Gemini CLI | `.gemini/extensions/*/gemini-extension.json` | Extensions in subdirectories with JSON config |
| agents.md | `agents.md` | Single file |
| Trae | `.trae/rules/*.md` | Multiple files in directory |
| Aider | `CONVENTIONS.md` | Single file |
| Zencoder | `.zencoder/rules/*.md` | Multiple files in directory |
| Replit | `replit.md` | Single file |
| Amp | `.agents/skills/*/SKILL.md`, `.agents/commands/*.md` | Skills in subdirs, commands as files |

## Conversion Notes

All formats can be converted to/from the **canonical format**, which is PRPM's universal internal representation. The canonical format preserves:

- Package metadata (name, version, description)
- Format-specific features (in metadata section)
- Content and structure
- Taxonomy information (tags, categories)

### Lossless vs Lossy Conversions

**Lossless conversions** (full round-trip):
- Cursor ↔ Canonical (with PRPM extensions)
- Claude ↔ Canonical
- Continue ↔ Canonical

**Lossy conversions** (information loss):
- Windsurf → others (no metadata preserved)
- agents.md → others (no frontmatter)
- Complex formats → simpler formats (features not supported)

## Maintaining Documentation

When format specifications change:

1. **Check official docs** - Verify changes are official
2. **Update spec document** - Reflect new features/requirements
3. **Update JSON schema** - Add/modify validation rules
4. **Update converters** - Implement support for changes
5. **Add tests** - Cover new features/edge cases
6. **Update this README** - Keep comparison tables current

## Contributing

See the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines on contributing to PRPM.

For format documentation specifically:

- Use official documentation as the source of truth
- Include real-world examples from actual packages
- Document both common patterns and edge cases
- Note version-specific features when applicable
- Keep conversion notes up to date

## References

- [PRPM Documentation](https://prpm.dev/docs)
- [Format Converter Package](../)
- [JSON Schema Specifications](../schemas/)
- [Converter Tests](../src/__tests__/)
