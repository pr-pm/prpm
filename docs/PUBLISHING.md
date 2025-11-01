# Publishing to PRPM Registry

Complete guide for publishing packages and collections to the PRPM registry.

## Prerequisites

Before publishing, ensure you have:

1. **PRPM CLI installed**: `npm install -g prpm`
2. **GitHub account**: Required for authentication
3. **Valid prpm.json**: Package manifest in your repository

## Authentication

Login to PRPM registry using GitHub:

```bash
prpm login
```

This will:
- Open GitHub OAuth flow in your browser
- Save authentication token locally
- Allow publishing under your GitHub username

Check authentication status:

```bash
prpm whoami
```

Logout when needed:

```bash
prpm logout
```

---

## Publishing Packages

### Single Package

For publishing a single package, create a `prpm.json` in your repository root:

```json
{
  "name": "my-typescript-rules",
  "version": "1.0.0",
  "description": "TypeScript best practices and strict type safety",
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "repository": "https://github.com/username/repo",
  "format": "cursor",
  "subtype": "rule",
  "tags": ["typescript", "best-practices", "type-safety"],
  "files": [
    ".cursor/rules/typescript-rules.mdc"
  ]
}
```

**Publish it:**

```bash
prpm publish
```

### Multiple Packages

For repositories containing multiple packages, use the `packages` array:

```json
{
  "name": "my-prompts-repo",
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "repository": "https://github.com/username/repo",
  "packages": [
    {
      "name": "typescript-cursor-rules",
      "version": "1.0.0",
      "description": "TypeScript rules for Cursor",
      "format": "cursor",
      "subtype": "rule",
      "tags": ["typescript", "cursor"],
      "files": [".cursor/rules/typescript.mdc"]
    },
    {
      "name": "python-claude-skill",
      "version": "1.0.0",
      "description": "Python best practices skill for Claude",
      "format": "claude",
      "subtype": "skill",
      "tags": ["python", "claude", "best-practices"],
      "files": [".claude/skills/python-expert/SKILL.md"]
    }
  ]
}
```

**Publish all packages:**

```bash
prpm publish
```

**Publish specific package only:**

When you have multiple packages and only one has changed, you can publish just that package:

```bash
# Only publish the package that changed
prpm publish --package typescript-cursor-rules
```

This is useful for:
- Publishing updates to a single package without bumping versions on others
- Testing a specific package before publishing the whole set
- Selective releases when working on one package at a time

**Important:** When publishing selectively, only bump the version of the package you're publishing. Other packages in the manifest can stay at their current versions.

### Inherited Fields

When using the `packages` array, top-level fields are inherited by all packages:

```json
{
  "author": "Shared Author",
  "license": "MIT",
  "repository": "https://github.com/username/repo",
  "packages": [
    {
      "name": "package-one",
      // Inherits author, license, repository
      "version": "1.0.0",
      "format": "cursor",
      "subtype": "rule",
      "files": [".cursor/rules/package-one.mdc"]
    },
    {
      "name": "package-two",
      // Can override inherited fields
      "author": "Different Author",
      "version": "1.0.0",
      "format": "claude",
      "subtype": "skill",
      "files": [".claude/skills/package-two/SKILL.md"]
    }
  ]
}
```

**Inherited fields:**
- `author`
- `license`
- `repository`

**Package-specific (required in each package):**
- `name`
- `version`
- `description`
- `format`
- `subtype`
- `tags`
- `files`

---

## Publishing Collections

Collections bundle multiple packages together for easier installation. They are defined in prpm.json using the `collections` array.

### Collection Structure

Add collections to your prpm.json alongside packages:

```json
{
  "name": "my-prompts-repo",
  "author": "Your Name",
  "license": "MIT",
  "repository": "https://github.com/username/repo",
  "packages": [
    {
      "name": "typescript-rules",
      "version": "1.0.0",
      "description": "TypeScript coding standards",
      "format": "cursor",
      "subtype": "rule",
      "tags": ["typescript"],
      "files": [".cursor/rules/typescript.mdc"]
    }
  ],
  "collections": [
    {
      "id": "my-dev-setup",
      "name": "My Development Setup",
      "description": "Complete development setup with TypeScript and React",
      "version": "1.0.0",
      "category": "development",
      "tags": ["typescript", "react", "development"],
      "icon": "⚡",
      "packages": [
        {
          "packageId": "typescript-strict",
          "version": "^1.0.0",
          "required": true,
          "reason": "Enforces strict TypeScript type safety"
        },
        {
          "packageId": "react-best-practices",
          "version": "^2.0.0",
          "required": true,
          "reason": "React component patterns and best practices"
        }
      ]
    }
  ]
}
```

**Key fields for collections:**

- `id`: Unique collection identifier (kebab-case, required)
- `name`: Display name of the collection (required)
- `description`: What this collection provides (required)
- `version`: Semantic version (optional, defaults to 1.0.0)
- `category`: Category like "development", "testing" (optional)
- `tags`: Tags for discoverability (optional)
- `icon`: Emoji or icon for the collection (optional)
- `packages`: Array of packages to include (required)

### Collection Packages

Each package in the `packages` array should specify:

```json
{
  "packageId": "package-name",    // Required: package identifier
  "version": "^1.0.0",           // Optional: version range (default: "latest")
  "required": true,               // Optional: if false, can be skipped with --skip-optional
  "reason": "Why included"        // Optional: explanation for users
}
```

**Version ranges:**
- `"^1.0.0"`: Compatible with 1.x.x (recommended)
- `"~1.2.0"`: Compatible with 1.2.x
- `"1.0.0"`: Exact version only
- `"latest"` or omit: Always use latest version

### Publishing Collections

Publish all packages and collections together:

```bash
prpm publish
```

Or publish a specific collection only:

```bash
prpm publish --collection my-dev-setup
```

The CLI will:
1. Validate your collection manifest
2. Verify all package IDs exist in the registry
3. Create collection entry
4. Upload to registry

---

## File Paths

**CRITICAL**: File paths must be **full paths from your project root**.

### Correct Path Format

```json
{
  "format": "claude",
  "subtype": "skill",
  "files": [
    ".claude/skills/my-skill/SKILL.md",
    ".claude/skills/my-skill/EXAMPLES.md"
  ]
}
```

```json
{
  "format": "cursor",
  "subtype": "rule",
  "files": [
    ".cursor/rules/typescript-rules.mdc"
  ]
}
```

### Path Patterns by Format

| Format | Subtype | Path Pattern |
|--------|---------|--------------|
| `claude` | `agent` | `.claude/agents/name.md` |
| `claude` | `skill` | `.claude/skills/name/SKILL.md` |
| `claude` | `slash-command` | `.claude/commands/category/name.md` |
| `cursor` | `rule` | `.cursor/rules/name.mdc` |
| `windsurf` | `rule` | `.windsurf/rules/name.md` |
| `continue` | `prompt` | `.continue/prompts/name.md` |

### Common Path Mistakes

**❌ Wrong:**
```json
{
  "files": ["agents/my-agent.md"]  // Missing .claude/ prefix
}
```

**✅ Correct:**
```json
{
  "files": [".claude/agents/my-agent.md"]
}
```

---

## Validation

### Pre-Publish Checks

Before publishing, run:

```bash
# Dry run - validates without publishing
prpm publish --dry-run
```

This will check:
- ✓ prpm.json syntax is valid
- ✓ All required fields are present
- ✓ All files in `files` arrays exist
- ✓ No duplicate package names
- ✓ Tags are properly formatted
- ✓ Version follows semver

### Manual Validation

**Check JSON syntax:**
```bash
cat prpm.json | jq .
```

**Find duplicate package names:**
```bash
cat prpm.json | jq -r '.packages[].name' | sort | uniq -d
```

**Verify files exist:**
```bash
# All paths in "files" arrays should exist relative to project root
ls -l .cursor/rules/my-rule.mdc
```

### Validation Checklist

- [ ] All packages have `name`, `version`, `description`
- [ ] All packages have `format` and `subtype`
- [ ] All packages have `files` array with full paths
- [ ] Top-level has `author` and `license`
- [ ] All files in `files` arrays exist
- [ ] No duplicate package names
- [ ] Tags use kebab-case
- [ ] Version follows semver (e.g., `1.0.0`)

---

## Versioning

Follow [Semantic Versioning](https://semver.org):

**Format:** `MAJOR.MINOR.PATCH`

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix, typo | Patch | 1.0.0 → 1.0.1 |
| New feature (backward compatible) | Minor | 1.0.0 → 1.1.0 |
| Breaking change | Major | 1.0.0 → 2.0.0 |

### Examples

**Patch (1.0.0 → 1.0.1):**
- Fixed typos in documentation
- Minor wording improvements
- Bug fixes

**Minor (1.0.0 → 1.1.0):**
- Added new examples
- New optional features
- Additional best practices
- Expanded documentation

**Major (1.0.0 → 2.0.0):**
- Complete rewrite
- Removed/renamed required fields
- Changed behavior significantly
- Breaking API changes

---

## Tags

Tags make packages discoverable. Use 3-8 relevant tags per package.

### Tag Format

- **kebab-case only**: `typescript`, `best-practices`, `code-review`
- **Be specific**: `react-hooks` not just `react`
- **Mix categories**: technology + domain + purpose

### Tag Categories

**Technology:**
```json
["typescript", "python", "react", "nextjs", "postgresql"]
```

**Domain:**
```json
["testing", "deployment", "security", "documentation"]
```

**Purpose:**
```json
["best-practices", "troubleshooting", "automation", "code-review"]
```

### Good vs Bad Tags

**✅ Good:**
```json
{
  "tags": [
    "typescript",
    "type-safety",
    "code-quality",
    "best-practices",
    "static-analysis"
  ]
}
```

**❌ Bad:**
```json
{
  "tags": [
    "code",           // Too generic
    "TypeScript",     // Wrong case
    "type_safety",    // Use kebab-case
    "stuff"           // Meaningless
  ]
}
```

---

## Privacy

Mark packages as private to exclude them from the public registry:

```json
{
  "name": "internal-company-tool",
  "version": "1.0.0",
  "private": true,
  "format": "claude",
  "subtype": "skill",
  "files": [".claude/skills/internal-tool/SKILL.md"]
}
```

Private packages:
- Won't appear in public registry searches
- Can be published to private registries
- Useful for company-internal prompts

---

## Publishing Workflow

### First-Time Publishing

1. **Create prpm.json**
   ```bash
   # In your repository root
   touch prpm.json
   ```

2. **Edit prpm.json**
   - Add required fields (see examples above)
   - Verify file paths are correct

3. **Test locally**
   ```bash
   prpm publish --dry-run
   ```

4. **Login to PRPM**
   ```bash
   prpm login
   ```

5. **Publish**
   ```bash
   prpm publish
   ```

### Updating Existing Packages

1. **Update version** in prpm.json
   ```json
   {
     "version": "1.1.0"  // Was 1.0.0
   }
   ```

2. **Test changes**
   ```bash
   prpm publish --dry-run
   ```

3. **Publish update**
   ```bash
   prpm publish
   ```

### Publishing from CI/CD

Store your PRPM token as a secret and publish automatically:

```yaml
# .github/workflows/publish.yml
name: Publish to PRPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install PRPM
        run: npm install -g prpm

      - name: Publish to PRPM
        env:
          PRPM_TOKEN: ${{ secrets.PRPM_TOKEN }}
        run: prpm publish
```

To get your token:
```bash
prpm login
cat ~/.prpmrc | grep token
```

---

## Common Publishing Errors

### "Package already exists"

**Error:**
```
Error: Package 'my-package@1.0.0' already exists
```

**Solution:** Bump the version number in prpm.json

```json
{
  "version": "1.0.1"  // Was 1.0.0
}
```

### "File not found"

**Error:**
```
Error: File not found: .cursor/rules/my-rule.mdc
```

**Solution:** Check file paths are correct and files exist
```bash
ls -l .cursor/rules/my-rule.mdc
```

### "Invalid version"

**Error:**
```
Error: Version must follow semver format
```

**Solution:** Use proper semver format
```json
{
  "version": "1.0.0"  // Not "v1.0" or "1.0"
}
```

### "Missing required field"

**Error:**
```
Error: Missing required field: description
```

**Solution:** Add all required fields
```json
{
  "name": "my-package",
  "version": "1.0.0",
  "description": "Add this field",
  "author": "Your Name",
  "license": "MIT",
  "format": "cursor",
  "subtype": "rule",
  "files": [".cursor/rules/my-rule.mdc"]
}
```

---

## Best Practices

1. **Use semantic versioning** - Follow semver strictly
2. **Write clear descriptions** - Help users understand your package
3. **Tag appropriately** - Use 3-8 specific, searchable tags
4. **Test before publishing** - Always run `--dry-run` first
5. **Document changes** - Include README or changelog
6. **Verify file paths** - Use full paths from project root
7. **Keep versions in sync** - Update related packages together
8. **Use inherited fields** - Share common fields across packages

---

## Examples

See complete examples in:
- [Package Manifest Guide](./PACKAGE_MANIFEST.md)
- [Examples Directory](./EXAMPLES.md)

---

## Getting Help

- 💬 **[GitHub Discussions](https://github.com/pr-pm/prpm/discussions)** - Ask questions
- 🐛 **[GitHub Issues](https://github.com/pr-pm/prpm/issues)** - Report problems
- 📧 **Email**: team@prpm.dev

---

*Generated with [Claude Code](https://claude.com/claude-code)*
