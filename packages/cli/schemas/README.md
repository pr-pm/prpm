# PRPM Manifest Schema

This directory contains the JSON Schema for validating `prpm.json` manifest files.

## Schema File

**Location**: `prpm-manifest.schema.json`

**Schema URL**: `https://prpm.dev/schemas/manifest.json`

## Alternative: marketplace.json

PRPM also supports Claude's `marketplace.json` format as an alternative to `prpm.json`. If you have a `.claude/marketplace.json` file, PRPM will automatically detect and convert it when you run `prpm publish`.

See [marketplace.json documentation](../docs/marketplace-json.md) for details.

## Using the Schema

### In Your Editor (VS Code, etc.)

Add this line to the top of your `prpm.json` file to get autocomplete and validation:

```json
{
  "$schema": "https://prpm.dev/schemas/manifest.json",
  "name": "@username/my-package",
  "version": "1.0.0",
  ...
}
```

### Programmatic Validation

The schema is automatically used by `prpm publish` to validate your manifest before publishing.

```typescript
import { validateManifestSchema } from '@prpm/cli/core/schema-validator';

const manifest = {
  name: 'my-package',
  version: '1.0.0',
  description: 'My package description',
  type: 'claude-skill',
  files: ['skill.md']
};

const result = validateManifestSchema(manifest);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### With JSON Schema Validators

You can use any JSON Schema validator (like AJV, jsonschema, etc.):

```javascript
const Ajv = require('ajv');
const schema = require('./prpm-manifest.schema.json');

const ajv = new Ajv();
const validate = ajv.compile(schema);

const valid = validate(manifest);
if (!valid) {
  console.log(validate.errors);
}
```

## Schema Features

### Required Fields

- `name` - Package name (lowercase, alphanumeric, hyphens)
- `version` - Semver version (e.g., `1.0.0`)
- `description` - Description (10-500 characters)
- `type` - Package type (`cursor`, `claude-skill`, `collection`, etc.)

### File Formats

The schema supports two formats for the `files` array:

#### Simple Format (strings)
```json
{
  "files": ["skill.md", "README.md", "LICENSE"]
}
```

#### Enhanced Format (objects with metadata)
```json
{
  "files": [
    {
      "path": ".claude/skills/tdd.md",
      "type": "claude-skill",
      "name": "Test-Driven Development",
      "description": "TDD workflow guide",
      "tags": ["testing", "tdd"]
    }
  ]
}
```

### Validation Rules

#### Package Name
- Pattern: `^(@[a-z0-9-]+\/)?[a-z0-9-]+$`
- Examples: `react-rules`, `@username/package`
- No uppercase, spaces, or special characters

#### Version
- Must be valid semver: `MAJOR.MINOR.PATCH`
- Supports prerelease: `1.0.0-beta.1`
- Supports build metadata: `1.0.0+20130313144700`

#### Description
- Minimum length: 10 characters
- Maximum length: 500 characters

#### Type
Valid types:
- `cursor` - Cursor IDE rules
- `claude` - Claude AI prompts
- `claude-skill` - Claude Code skills
- `claude-agent` - Claude Code agents
- `claude-slash-command` - Claude Code slash commands
- `continue` - Continue IDE rules
- `windsurf` - Windsurf IDE rules
- `generic` - Generic prompts
- `collection` - Mixed types (use only when files have multiple distinct types)

#### Tags & Keywords
- `tags`: Maximum 10 items
- `keywords`: Maximum 20 items
- Must be unique within array

#### URLs
The following fields must be valid URLs:
- `repository`
- `homepage`
- `documentation`
- `author.url`

#### Email
`author.email` must be valid email format

## Examples

See the `examples/` directory for complete manifest examples:

1. **Simple Package**: `examples/simple-package/prpm.json`
2. **Multi-File Same Type**: `examples/multi-file-single-type/prpm.json`
3. **Collection Package**: `examples/collection-package/prpm.json`
4. **Claude Skills**: `examples/claude-skills-multi-file/prpm.json`

## Schema Updates

When updating the schema:

1. **Edit** `prpm-manifest.schema.json`
2. **Test** with `npm test -- schema-validator`
3. **Update** this README if adding new features
4. **Version** the schema (update `$id` if making breaking changes)
5. **Document** any new validation rules

## Validation Errors

Common validation errors and how to fix them:

### "Missing required field: X"
Add the required field to your manifest.

### "Pattern mismatch" (name)
Package names must be lowercase alphanumeric with hyphens only. No spaces or special characters.

### "Pattern mismatch" (version)
Version must be valid semver (e.g., `1.0.0`, not `1.0` or `v1.0.0`).

### "minLength" (description)
Description must be at least 10 characters.

### "enum" (type)
Type must be one of the allowed values. Check for typos.

### "oneOf" (files)
Files array must be consistently either all strings OR all objects, not mixed.

### "format" (email/uri)
Email or URL is not in valid format. Check for typos and ensure proper formatting.

## Related Files

- **Validator**: `../src/core/schema-validator.ts`
- **Tests**: `../src/__tests__/schema-validator.test.ts`
- **Publish Command**: `../src/commands/publish.ts`
- **Documentation**: `../docs/enhanced-manifest.md`
