# Factory Droid Format

Factory Droid is an AI coding assistant that uses skills, slash commands, and hooks to enhance developer productivity.

## Overview

Factory Droid organizes AI capabilities into three main types:

1. **Skills** - Reusable workflows stored in `.factory/skills/<skill-name>/SKILL.md`
2. **Slash Commands** - Quick commands stored in `.factory/commands/*.md`
3. **Hooks** - Event-driven scripts stored in `.factory/hooks/` or configured in `hooks.json`

## File Structure

### Skills

Skills are stored in dedicated subdirectories with a `SKILL.md` file:

```
.factory/
  skills/
    summarize-diff/
      SKILL.md
    code-review/
      SKILL.md
```

**Format:**
```markdown
---
name: skill-name
description: Brief description of what the skill does
---

# Skill Title

## Instructions
Step-by-step workflow for the skill
```

### Slash Commands

Slash commands are markdown files in the `.factory/commands/` directory:

```
.factory/
  commands/
    review.md
    test.md
```

**Format:**
```markdown
---
name: command-name
description: What this command does
argument-hint: <optional-usage-hint>
---

Command instructions and workflow
```

### Hooks

Hooks can be either:
- Executable scripts in `.factory/hooks/`
- Configuration in `.factory/hooks.json`

**Executable Hook:**
```bash
#!/usr/bin/env bash
# .factory/hooks/pre-commit.sh
# Hook logic here
```

## Frontmatter Fields

### Required Fields

- `name` - Unique identifier for the skill/command/hook
- `description` - Brief explanation of purpose

### Optional Fields

- `argument-hint` - Usage hint for slash commands (e.g., `<file-path>`)
- `allowed-tools` - Reserved for future use, specifies which tools can be used

## Conversion to PRPM

### From Factory Droid to Canonical

The `fromDroid()` converter:
1. Parses YAML frontmatter
2. Extracts `name` and `description`
3. Detects subtype (skill, slash-command, or hook)
4. Preserves Factory Droid-specific metadata for roundtrip conversion
5. Converts body content to instructions section

**Subtype Detection:**
- If `argument-hint` is present → `slash-command`
- If content contains hook patterns → `hook`
- Otherwise → `skill` (default)

### From Canonical to Factory Droid

The `toDroid()` converter:
1. Generates YAML frontmatter with `name` and `description`
2. Restores Factory Droid-specific fields (`argument-hint`, `allowed-tools`)
3. Converts sections to markdown:
   - `metadata` → frontmatter
   - `instructions` → body content
   - `rules` → markdown list
   - `examples` → code blocks
   - `persona` → "# Role" heading
4. Warns about unsupported sections (tools, context, etc.)

## PRPM Integration

### Installation

Install Factory Droid packages with:

```bash
prpm install <package-name> --format droid
```

Packages are installed to:
- Skills: `.factory/skills/<skill-name>/SKILL.md`
- Slash Commands: `.factory/commands/<command-name>.md`
- Hooks: `.factory/hooks/<hook-name>`

### Publishing

Publish Factory Droid packages:

```bash
# From .factory/ directory
prpm publish
```

Your `prpm.json` should specify:

```json
{
  "name": "@username/package-name",
  "version": "1.0.0",
  "format": "droid",
  "subtype": "skill",
  "description": "Package description",
  "files": [".factory/**/*.md"]
}
```

### Conversion

Convert between Factory Droid and other formats:

```bash
# Convert Factory Droid skill to Claude skill
prpm convert skill.md --from droid --to claude

# Convert Claude skill to Factory Droid
prpm convert skill.md --from claude --to droid
```

## Supported Subtypes

- `skill` - Reusable workflows and multi-step processes
- `slash-command` - Quick commands with optional arguments
- `hook` - Event-driven scripts for automation

## Features

### ✅ Fully Supported

- Frontmatter (name, description, argument-hint, allowed-tools)
- Instructions/body content
- Rules (converted to markdown lists)
- Examples (converted to code blocks)
- Persona (converted to "# Role" heading)

### ⚠️ Partial Support

- Tools section (not directly supported, warning issued)
- Context section (not directly supported, warning issued)

### ❌ Not Supported

- Custom sections beyond those listed above

## Best Practices

1. **Skills**: Use descriptive names and clear step-by-step instructions
2. **Slash Commands**: Include `argument-hint` to show expected usage
3. **Hooks**: Prefer executable scripts over JSON configuration for better version control
4. **Naming**: Use kebab-case for skill/command names (e.g., `code-review`, `summarize-diff`)
5. **Structure**: Organize skills into subdirectories for supporting files (schemas, checklists)

## Examples

### Skill Example

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

## Success Criteria

- All tests pass
- Error handling covers edge cases
- Documentation is updated
```

### Slash Command Example

```markdown
---
name: quick-test
description: Run tests for a specific file
argument-hint: <file-path>
---

Run tests for the specified file:

1. Identify the test file corresponding to the source file
2. Execute the test suite
3. Report results
```

### Hook Example

```bash
#!/usr/bin/env bash
# .factory/hooks/pre-tool-use.sh
#
# Validate tool usage before execution

TOOL_NAME=$1
TOOL_ARGS=$2

if [ "$TOOL_NAME" = "Bash" ]; then
  echo "Validating Bash command: $TOOL_ARGS"
  # Add validation logic
fi

exit 0
```

## Related Documentation

- [Factory Droid Skills Documentation](https://docs.factory.ai/cli/configuration/skills)
- [Factory Droid Hooks Reference](https://docs.factory.ai/reference/hooks-reference)
- [Factory Droid Slash Commands](https://docs.factory.ai/cli/configuration/custom-slash-commands)
- [PRPM Format Guide](../../docs/formats.mdx)

## Changelog

- **2025-01**: Initial Factory Droid format support
  - Added fromDroid and toDroid converters
  - Support for skills, slash commands, and hooks
  - Roundtrip conversion with metadata preservation
