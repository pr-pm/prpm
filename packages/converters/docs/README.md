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
| **Ruler** | `rule` | Plain markdown rules for centralized management | [okigu.com/ruler](https://okigu.com/ruler) |
| | `agent` | Agent instructions in plain markdown | [okigu.com/ruler](https://okigu.com/ruler) |
| | `tool` | Tool usage guidelines in plain markdown | [okigu.com/ruler](https://okigu.com/ruler) |
| **agents.md** | `agent` | OpenAI format, single file plain markdown | [github.com/openai](https://github.com/openai/agents.md) |

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
| **agents.md** | [agents-md.md](./agents-md.md) | OpenAI format, plain markdown | [github.com/openai/agents.md](https://github.com/openai/agents.md) |

## Schema Validation

Each format has a corresponding JSON Schema in `../schemas/` that defines the structure and validates packages.

**Base Schemas:**
- `cursor.schema.json`
- `claude.schema.json`
- `continue.schema.json`
- `windsurf.schema.json`
- `copilot.schema.json`
- `kiro-steering.schema.json`
- `kiro-hooks.schema.json`
- `agents-md.schema.json`
- `canonical.schema.json` (PRPM universal format)

**Claude Subtypes:**
- `claude-skill.schema.json`
- `claude-agent.schema.json`
- `claude-slash-command.schema.json`
- `claude-hook.schema.json`

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
| agents.md | None | none | none |

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
| agents.md | `agents.md` | Single file |

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
