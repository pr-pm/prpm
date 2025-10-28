# Claude marketplace.json Support

PRPM supports publishing packages using Claude's `marketplace.json` format, allowing you to publish your Claude marketplace packages to PRPM without creating a separate `prpm.json` file.

## What is marketplace.json?

`marketplace.json` is the manifest format used by Claude Code for publishing agents, skills, and slash commands to Claude's marketplace. If you've already created a marketplace.json for Claude, you can use it directly with PRPM.

## Location

PRPM looks for marketplace.json at either:
```
.claude/marketplace.json
```
or
```
.claude-plugin/marketplace.json
```

Both locations are supported to accommodate different Claude marketplace formats.

## Publishing with marketplace.json

When you run `prpm publish`, PRPM automatically checks for manifest files in this order:

1. **`prpm.json`** (PRPM's native format)
2. **`.claude/marketplace.json`** (Claude's format - auto-converted)
3. **`.claude-plugin/marketplace.json`** (Claude's format - alternative location, auto-converted)

If none of these files exist, publishing will fail.

```bash
# If you have .claude/marketplace.json, just run:
prpm publish

# PRPM will automatically detect and convert it
```

## marketplace.json Format

Here's an example marketplace.json file:

```json
{
  "name": "My Plugin Collection",
  "owner": "username",
  "description": "Collection of AI prompts and tools",
  "version": "1.0.0",
  "githubUrl": "https://github.com/username/repo",
  "websiteUrl": "https://example.com",
  "keywords": ["ai", "productivity"],
  "plugins": [
    {
      "name": "Test Plugin",
      "source": "plugin.md",
      "description": "My testing plugin",
      "version": "1.0.0",
      "author": "Your Name",
      "keywords": ["testing", "quality"],
      "category": "development",
      "agents": [
        {
          "name": "Test Generator",
          "description": "Generates comprehensive tests",
          "source": ".claude/agents/test-generator.md"
        }
      ],
      "skills": [
        {
          "name": "TDD Workflow",
          "description": "Test-driven development guide",
          "source": ".claude/skills/tdd.md"
        }
      ],
      "commands": [
        {
          "name": "review",
          "description": "Code review assistant",
          "source": ".claude/commands/review.md"
        }
      ]
    }
  ]
}
```

## Conversion to PRPM Format

When PRPM detects a marketplace.json, it automatically converts it to PRPM's manifest format:

### Field Mapping

| marketplace.json | prpm.json | Notes |
|-----------------|-----------|-------|
| `plugins[0].name` | `name` | Sanitized to lowercase-hyphen format with owner scope |
| `plugins[0].version` or `version` | `version` | Plugin version preferred over root version |
| `plugins[0].description` | `description` | |
| `plugins[0].author` or `owner` | `author` | Plugin author preferred |
| `githubUrl` | `repository` | |
| `websiteUrl` | `homepage` | |
| `plugins[0].category` | `category` | |
| `keywords` + `plugins[0].keywords` | `keywords` | Combined, max 20 |
| `keywords` (first 10) | `tags` | Max 10 tags |
| Detected from content | `type` | `claude` if has agents/skills/commands |

### Package Naming

Package names are automatically generated in PRPM format:

```
owner: "username"
plugin.name: "Test Plugin"
→ PRPM name: "@username/test-plugin"
```

### File Collection

All referenced files are collected:
- Plugin source file
- All agent sources
- All skill sources
- All command sources
- Standard files (README.md, LICENSE, .claude/marketplace.json)

### Main File Detection

PRPM automatically determines the main entry file:
- If there's exactly one agent → that's the main file
- If there's exactly one skill → that's the main file
- If there's exactly one command → that's the main file
- If multiple items → no main file set

## Multiple Plugins

If your marketplace.json has multiple plugins, PRPM currently converts and publishes **only the first plugin**.

To publish additional plugins:
1. Extract each plugin into its own marketplace.json
2. Publish separately

Or create a `prpm.json` manually for better control.

## Limitations

### What's Supported ✅
- Single plugin per marketplace.json
- Agents, skills, and commands
- Metadata (name, description, keywords, etc.)
- GitHub and website URLs
- File paths (local files only)

### What's Not Supported ❌
- Multiple plugins in one publish
- HTTP URLs for sources (only local file paths)
- Custom PRPM-specific fields (dependencies, peer dependencies, etc.)

## When to Use marketplace.json vs prpm.json

### Use marketplace.json when:
- You're already publishing to Claude's marketplace
- You have a simple Claude-only package
- You want to maintain a single manifest file
- You don't need PRPM-specific features

### Use prpm.json when:
- You need to publish multiple plugins separately
- You want to mix different IDE formats (Claude + Cursor + Continue)
- You need dependencies or peer dependencies
- You want per-file metadata (tags, descriptions)
- You need fine-grained control over package metadata

## Example Workflow

### Scenario: Publishing a Claude marketplace package to PRPM

```bash
# 1. You already have .claude/marketplace.json for Claude marketplace
cat .claude/marketplace.json
{
  "name": "Testing Suite",
  "owner": "myusername",
  "description": "Complete testing tools",
  "version": "1.0.0",
  "plugins": [
    {
      "name": "Testing Tools",
      "version": "1.0.0",
      "author": "My Name",
      "description": "Testing agents and skills",
      "agents": [
        {
          "name": "Test Generator",
          "source": ".claude/agents/test-gen.md"
        }
      ],
      "skills": [
        {
          "name": "TDD",
          "source": ".claude/skills/tdd.md"
        }
      ]
    }
  ]
}

# 2. Login to PRPM
prpm login

# 3. Publish (PRPM auto-detects marketplace.json)
prpm publish

# Output:
# 📦 Publishing package...
# 🔍 Validating package manifest...
#    Source: .claude/marketplace.json
#    Package: @myusername/testing-tools@1.0.0
#    Type: claude
#    Description: Testing agents and skills
#
# 📦 Creating package tarball...
# 🚀 Publishing to registry...
# ✅ Package published successfully!
```

## Conversion Validation

The converted manifest is validated against PRPM's JSON schema before publishing:
- Package name format
- Semver version
- Description length
- Required fields

If conversion produces an invalid manifest, publishing will fail with clear error messages.

## Getting Help

If you encounter issues with marketplace.json conversion:

```bash
# Check what PRPM will convert it to (dry run)
prpm publish --dry-run

# Get the PRPM schema for reference
prpm schema > schema.json
```

## Related Documentation

- [Enhanced Manifest Format](./enhanced-manifest.md) - PRPM's native format
- [Schema Documentation](../schemas/README.md) - JSON schema reference
- [Publishing Guide](./publishing.md) - General publishing guide

## Source Code

The marketplace.json converter is in:
```
packages/cli/src/core/marketplace-converter.ts
```

Tests are in:
```
packages/cli/src/__tests__/marketplace-converter.test.ts
```
