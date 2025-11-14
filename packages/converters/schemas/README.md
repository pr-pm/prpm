# AI Prompt Format JSON Schemas

This directory contains JSON Schema definitions for all supported AI prompt formats in PRPM.

## Overview

These schemas are used to:

1. **Validate packages at publish time** - Ensure files match their declared format
2. **Validate conversions** - Verify converted output is valid for target format
3. **Generate documentation** - Auto-generate format specifications
4. **IDE support** - Provide autocomplete and validation in editors

## Schema Files

### Base Formats

| Schema | Format | Description |
|--------|--------|-------------|
| `cursor.schema.json` | Cursor | MDC format with YAML frontmatter (description required) |
| `claude.schema.json` | Claude Code | Base Claude format (name + description required) |
| `continue.schema.json` | Continue Dev | Optional frontmatter with globs/regex/alwaysApply |
| `windsurf.schema.json` | Windsurf | Plain markdown content only (no frontmatter) |
| `copilot.schema.json` | GitHub Copilot | Path-specific with applyTo and excludeAgent |
| `kiro-steering.schema.json` | Kiro Steering | Optional frontmatter with inclusion modes |
| `kiro-hooks.schema.json` | Kiro Hooks | JSON event-driven automations |
| `agents-md.schema.json` | agents.md | Plain markdown content only |
| `canonical.schema.json` | PRPM Canonical | Universal internal format |

### Claude Subtypes

| Schema | Subtype | Requirements |
|--------|---------|--------------|
| `claude-skill.schema.json` | skill | name (max 64 chars), description (max 1024 chars) |
| `claude-agent.schema.json` | agent | name, description, optional tools/model |
| `claude-slash-command.schema.json` | slash-command | name, description |
| `claude-hook.schema.json` | hook | name, description, event type |

## Schema Structure

All schemas follow this general pattern:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://prpm.dev/schemas/<format>.schema.json",
  "title": "Format Name",
  "description": "Format description",
  "type": "object",
  "required": ["frontmatter", "content"],
  "properties": {
    "frontmatter": {
      "type": "object",
      "required": [...],
      "properties": {...}
    },
    "content": {
      "type": "string"
    }
  }
}
```

### Special Cases

**Formats without frontmatter** (Windsurf, agents.md):
```json
{
  "type": "object",
  "required": ["content"],
  "properties": {
    "content": { "type": "string" }
  }
}
```

**JSON formats** (Kiro hooks):
```json
{
  "type": "object",
  "required": ["name", "description", "when", "then"],
  "properties": {...}
}
```

## Using Schemas

### Programmatic Validation

```typescript
import { validateMarkdown, validateFormat } from '@pr-pm/converters';

// Validate a markdown file
const result = validateMarkdown('cursor', fileContent);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Validate structured data
const result = validateFormat('kiro-hooks', jsonData);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### IDE Integration

Many editors support JSON Schema for validation and autocomplete:

**VS Code** - Add to settings.json:
```json
{
  "json.schemas": [
    {
      "fileMatch": [".cursor/rules/*.md"],
      "url": "./schemas/cursor.schema.json"
    }
  ]
}
```

**Schema Store** - These schemas can be submitted to https://schemastore.org for automatic IDE integration.

## Validation Features

### Error Types

- **Required field missing** - Field marked as required but not present
- **Invalid type** - Value type doesn't match schema (string vs number)
- **Invalid enum** - Value not in allowed list
- **Pattern mismatch** - String doesn't match regex pattern
- **Min/max violations** - String length, array size, or number out of range

### Conditional Validation

Some schemas use `if/then` for conditional requirements:

```json
{
  "if": {
    "properties": {
      "inclusion": { "const": "fileMatch" }
    }
  },
  "then": {
    "required": ["fileMatchPattern"]
  }
}
```

This enforces: "If `inclusion` is `fileMatch`, then `fileMatchPattern` is required"

## Schema Development

### Adding a New Format Schema

1. **Create schema file** - `<format>.schema.json` in this directory
2. **Define structure** - Base on official format documentation
3. **Add validation rules** - Required fields, types, patterns
4. **Include examples** - Valid format examples in schema
5. **Update README** - Add to tables above
6. **Add tests** - Validate test cases in `src/__tests__/validation.test.ts`

### Schema Best Practices

- **Use descriptive descriptions** - Help users understand each field
- **Include examples** - Show valid usage
- **Reference official docs** - Link to authoritative sources in `$id`
- **Version schemas** - Track changes to format specifications
- **Test edge cases** - Ensure validation catches common mistakes

## Maintenance

### When Format Specifications Change

1. **Verify official docs** - Confirm the change is official
2. **Update schema** - Modify required/optional fields, types, patterns
3. **Update format docs** - Sync `docs/<format>.md` with schema changes
4. **Run tests** - Ensure existing packages still validate
5. **Version bump** - Update package version if breaking change

### Backward Compatibility

When possible, maintain backward compatibility:

- **Make fields optional first** - Don't immediately require new fields
- **Deprecate gracefully** - Warn before removing support
- **Support multiple versions** - Use `oneOf` for version variations

## Resources

- [JSON Schema Official Site](https://json-schema.org/)
- [Understanding JSON Schema](https://json-schema.org/understanding-json-schema/)
- [ajv Documentation](https://ajv.js.org/) - The validator we use
- [Schema Store](https://schemastore.org/) - Public schema registry
- [Format Documentation](../docs/README.md) - Human-readable specs

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for general guidelines.

For schema contributions:

1. Base schemas on official documentation
2. Test with real-world packages
3. Include comprehensive examples
4. Document all fields with clear descriptions
5. Consider backward compatibility
