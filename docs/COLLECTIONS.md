# PRPM Collections

Collections are curated bundles of packages that work together for specific development workflows. Instead of installing packages one by one, collections let you set up complete environments with a single command.

## What is a Collection?

A collection is a special type of package that bundles multiple related packages together. Think of it as a "meta-package" or "starter kit" for a specific use case.

**Instead of:**
```bash
prpm install typescript-strict
prpm install react-best-practices
prpm install tailwind-config
prpm install testing-patterns
prpm install code-review-rules
```

**You can do:**
```bash
prpm install collections/my-react-setup
```

Or simply:
```bash
prpm install my-react-setup
```

---

## How Collections Work

Collections use the `dependencies` field to specify which packages to install.

**Note:** Collections are NOT packages themselves - they're a separate entity that bundles packages together.

```json
{
  "id": "my-react-setup",
  "name": "My React Setup",
  "description": "Complete React development setup with TypeScript and testing",
  "version": "1.0.0",
  "category": "development",
  "tags": ["react", "typescript", "testing"],
  "packages": [
    {
      "packageId": "typescript-strict",
      "version": "^1.0.0",
      "required": true
    },
    {
      "packageId": "react-best-practices",
      "version": "^2.0.0",
      "required": true
    },
    {
      "packageId": "tailwind-config",
      "version": "^1.5.0",
      "required": false
    }
  ]
}
```

When you install this collection, PRPM automatically installs all the packages listed.

---

## Installing Collections

### Basic Installation

```bash
# Install a collection (recommended: use collections/ prefix for clarity)
prpm install collections/my-react-setup

# Or install without prefix
prpm install my-react-setup

# View collection details before installing
prpm collection info my-react-setup

# Search for collections
prpm collections search react
```

### Installation Options

```bash
# Install for specific IDE/tool (use collections/ prefix for clarity)
prpm install collections/my-react-setup --as cursor

# Auto-detect IDE from your project
prpm install collections/my-react-setup

# Install only required packages (skip optional)
prpm install collections/my-react-setup --skip-optional

# Preview what would be installed (dry run)
prpm install collections/my-react-setup --dry-run
```

---

## Creating Your Own Collection

### 1. Add Collection to prpm.json

Collections are defined in your prpm.json file using the `collections` array, alongside your packages:

```json
{
  "name": "my-prompts-repo",
  "author": "Your Name",
  "license": "MIT",
  "repository": "https://github.com/username/repo",
  "packages": [
    {
      "name": "my-typescript-rules",
      "version": "1.0.0",
      "description": "My TypeScript rules",
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
      "description": "My personal development setup with TypeScript and React",
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
        },
        {
          "packageId": "eslint-config",
          "version": "^1.5.0",
          "required": false,
          "reason": "Optional linting configuration"
        }
      ]
    }
  ]
}
```

### 2. Key Fields for Collections

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique collection identifier (kebab-case) |
| `name` | Yes | Display name of the collection |
| `description` | Yes | What this collection provides |
| `version` | Yes | Semantic version (e.g., 1.0.0) |
| `category` | No | Category (development, testing, etc.) |
| `tags` | No | Tags for discoverability |
| `icon` | No | Emoji or icon for the collection |
| `packages` | Yes | Array of packages to install |

### 3. Specify Packages

Each package in the `packages` array should have:

```json
{
  "packageId": "package-name",    // Required: package identifier
  "version": "^1.0.0",           // Optional: version range (default: "latest")
  "required": true,               // Optional: if false, can be skipped with --skip-optional
  "reason": "Why included"        // Optional: explanation for users
}
```

**Version ranges:**
- `^1.0.0` - Compatible with version 1.x.x (recommended)
- `~1.2.0` - Compatible with version 1.2.x
- `1.0.0` - Exact version only
- `latest` or omit - Always use latest available version

### 4. Publish Your Collection

Collections are now published alongside packages using the same `prpm publish` command:

```bash
# Login to PRPM registry
prpm login

# Publish all packages and collections from prpm.json
prpm publish

# Or publish only a specific collection
prpm publish --collection my-dev-setup
```

**Note:** Collections are defined in prpm.json and published with `prpm publish`, just like packages.

See [Publishing Guide](./PUBLISHING.md) for more details.

---

## Collection Organization

### Recommended Structure

Organize your collection manifest to make it easy to maintain:

**1. Group by category**
```json
{
  "dependencies": {
    // Core TypeScript tools
    "typescript-strict": "^1.0.0",
    "typescript-patterns": "^2.0.0",

    // React ecosystem
    "react-best-practices": "^2.0.0",
    "react-hooks": "^1.5.0",

    // Testing
    "vitest-config": "^1.0.0",
    "testing-patterns": "^1.0.0"
  }
}
```

**2. Add comments (if using JSON5)**
```json5
{
  dependencies: {
    // Essential packages (always installed)
    "typescript-strict": "^1.0.0",
    "react-best-practices": "^2.0.0",

    // Optional enhancements
    "performance-patterns": "^1.0.0",
    "accessibility-rules": "^1.0.0"
  }
}
```

---

## Discovery & Search

### Finding Collections

```bash
# Search for React collections
prpm search react --type collection

# Search by tag
prpm search --tag typescript --type collection

# Browse all collections
prpm search --type collection

# View collection details
prpm info collection-name
```

### Collection Metadata

Collections show useful information when you view them:

```bash
prpm info my-react-setup
```

**Output:**
```
📦 my-react-setup v1.0.0

Complete React development setup with TypeScript and testing

Dependencies (5):
  ✓ typescript-strict@^1.0.0
  ✓ react-best-practices@^2.0.0
  ✓ tailwind-config@^1.5.0
  ✓ testing-patterns@^1.0.0
  ✓ code-review-rules@^1.0.0

Tags: collection, react, typescript, testing
Downloads: 1,234
License: MIT
```

---

## Use Cases

### 1. Starter Kits

Create collections for new projects:

```json
{
  "name": "nextjs-starter",
  "description": "Complete Next.js starter with TypeScript, Tailwind, and testing",
  "dependencies": {
    "nextjs-patterns": "^1.0.0",
    "typescript-strict": "^1.0.0",
    "tailwind-config": "^3.0.0",
    "react-testing": "^1.0.0"
  }
}
```

### 2. Team Standards

Share your team's development standards:

```json
{
  "name": "acme-standards",
  "description": "ACME Corp development standards",
  "dependencies": {
    "acme-git-workflow": "^1.0.0",
    "acme-code-review": "^1.0.0",
    "acme-testing": "^1.0.0",
    "acme-security": "^1.0.0"
  }
}
```

### 3. Technology Stacks

Bundle complete technology stacks:

```json
{
  "name": "python-ml-stack",
  "description": "Python machine learning development stack",
  "dependencies": {
    "python-best-practices": "^1.0.0",
    "tensorflow-patterns": "^1.0.0",
    "pytorch-helpers": "^1.0.0",
    "jupyter-config": "^1.0.0",
    "data-science-tools": "^1.0.0"
  }
}
```

### 4. Personal Workflows

Create your own development workflow:

```json
{
  "name": "my-workflow",
  "description": "My personal development workflow",
  "dependencies": {
    "git-shortcuts": "^1.0.0",
    "code-snippets": "^1.0.0",
    "productivity-tips": "^1.0.0"
  }
}
```

---

## Advanced Features

### Optional Dependencies

Mark packages as optional so users can skip them:

```json
{
  "dependencies": {
    "typescript-strict": "^1.0.0",      // Required
    "react-best-practices": "^2.0.0"    // Required
  },
  "optionalDependencies": {
    "tailwind-config": "^1.5.0",        // Optional
    "storybook-setup": "^1.0.0"         // Optional
  }
}
```

Users can skip optional dependencies:
```bash
prpm install my-collection --skip-optional
```

### Documentation

Include documentation with your collection:

**Create `.prompts/collections/my-collection.md`:**
```markdown
# My Collection

This collection includes:
- TypeScript strict mode configuration
- React best practices
- Testing setup with Vitest

## Usage

After installing, you'll have access to:
- Strict TypeScript type checking
- React component patterns
- Pre-configured test runners

## Configuration

To customize...
```

Reference it in your manifest:
```json
{
  "files": [
    ".prompts/collections/my-collection.md"
  ]
}
```

### Versioning Collections

When updating collections:

**Patch (1.0.0 → 1.0.1):**
- Update dependency versions
- Fix documentation typos

**Minor (1.0.0 → 1.1.0):**
- Add new optional dependencies
- Add new documentation

**Major (1.0.0 → 2.0.0):**
- Remove dependencies
- Change required dependencies
- Breaking changes to collection structure

---

## Best Practices

### 1. Use Semantic Version Ranges

**✅ Recommended:**
```json
{
  "dependencies": {
    "package-name": "^1.0.0"  // Allows 1.x.x updates
  }
}
```

**❌ Avoid:**
```json
{
  "dependencies": {
    "package-name": "1.0.0"  // Too strict, no updates allowed
  }
}
```

### 2. Group Related Packages

Organize dependencies logically:
```json
{
  "dependencies": {
    // Core language
    "typescript-strict": "^1.0.0",

    // Framework
    "react-best-practices": "^2.0.0",

    // Tooling
    "eslint-config": "^1.0.0",

    // Testing
    "vitest-config": "^1.0.0"
  }
}
```

### 3. Provide Clear Descriptions

Help users understand what your collection does:

**✅ Good:**
```json
{
  "description": "Complete Next.js development setup with TypeScript, Tailwind CSS, ESLint, and Vitest testing"
}
```

**❌ Vague:**
```json
{
  "description": "My stuff"
}
```

### 4. Use Appropriate Tags

Include relevant, searchable tags:

**✅ Good:**
```json
{
  "tags": [
    "collection",
    "nextjs",
    "typescript",
    "tailwind",
    "testing"
  ]
}
```

**❌ Generic:**
```json
{
  "tags": ["collection", "dev", "stuff"]
}
```

### 5. Test Before Publishing

Always test your collection:

```bash
# Validate manifest
prpm publish --dry-run

# Test installation locally
prpm install ./path/to/collection

# Verify all dependencies exist
prpm info dependency-name
```

### 6. Document Your Collection

Include a README or documentation file:
- What's included
- How to use it
- Configuration instructions
- Examples

### 7. Keep It Focused

Don't try to include everything:

**✅ Focused:**
```json
{
  "name": "react-testing-setup",
  "description": "React testing with Vitest, Testing Library, and coverage",
  "dependencies": {
    "react-testing-library": "^1.0.0",
    "vitest-react": "^1.0.0",
    "coverage-config": "^1.0.0"
  }
}
```

**❌ Too broad:**
```json
{
  "name": "everything-dev",
  "description": "Everything you need for development",
  "dependencies": {
    // 30+ packages from different ecosystems
  }
}
```

---

## Common Questions

### Q: Can collections include other collections?

Yes! Collections can depend on other collections:

```json
{
  "name": "my-super-collection",
  "dependencies": {
    "typescript-complete": "^1.0.0",     // This is a collection
    "react-testing-setup": "^1.0.0",     // This is also a collection
    "custom-linting": "^1.0.0"           // Regular package
  }
}
```

### Q: What happens if a dependency doesn't exist?

PRPM will:
1. Validate all dependencies exist before installation
2. Show an error if any are missing
3. Prevent installation until all dependencies are available

### Q: Can I update just one package in a collection?

Yes! After installing a collection, you can update individual packages:

```bash
# Update specific package
prpm install typescript-strict@2.0.0

# Update all packages
prpm update
```

### Q: How do I share my collection privately?

Collections inherit privacy settings from your prpm.json. Mark the entire repository as private, or control collection visibility through your organization settings.

---

## Examples

### Simple Collection in prpm.json

```json
{
  "name": "my-prompts-repo",
  "author": "Your Name",
  "license": "MIT",
  "collections": [
    {
      "id": "cursor-typescript",
      "name": "Cursor TypeScript Setup",
      "description": "TypeScript setup for Cursor IDE",
      "version": "1.0.0",
      "tags": ["cursor", "typescript"],
      "packages": [
        {
          "packageId": "typescript-strict",
          "version": "^1.0.0",
          "required": true
        },
        {
          "packageId": "cursor-typescript-rules",
          "version": "^1.0.0",
          "required": true
        }
      ]
    }
  ]
}
```

### Complex Collection with Multiple Packages

```json
{
  "name": "my-prompts-repo",
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "repository": "https://github.com/username/repo",
  "collections": [
    {
      "id": "fullstack-nextjs",
      "name": "Full-Stack Next.js",
      "description": "Complete full-stack Next.js setup with TypeScript, Prisma, and testing",
      "version": "2.0.0",
      "category": "development",
      "tags": ["nextjs", "typescript", "fullstack", "prisma", "testing"],
      "icon": "⚡",
      "packages": [
        {
          "packageId": "nextjs-patterns",
          "version": "^2.0.0",
          "required": true,
          "reason": "Next.js best practices and patterns"
        },
        {
          "packageId": "typescript-strict",
          "version": "^1.0.0",
          "required": true,
          "reason": "Strict TypeScript configuration"
        },
        {
          "packageId": "react-best-practices",
          "version": "^2.0.0",
          "required": true,
          "reason": "React component patterns"
        },
        {
          "packageId": "prisma-patterns",
          "version": "^1.0.0",
          "required": true,
          "reason": "Prisma ORM best practices"
        },
        {
          "packageId": "tailwind-config",
          "version": "^3.0.0",
          "required": false,
          "reason": "Optional Tailwind CSS configuration"
        },
        {
          "packageId": "storybook-nextjs",
          "version": "^1.0.0",
          "required": false,
          "reason": "Optional Storybook setup"
        }
      ]
    }
  ]
}
```

---

## See Also

- [Publishing Guide](./PUBLISHING.md) - How to publish collections
- [Package Manifest](./PACKAGE_MANIFEST.md) - Complete manifest reference
- [Installation Guide](./INSTALLATION.md) - Installing packages and collections
- [CLI Reference](./CLI.md) - Command-line usage

---

## Getting Help

- 💬 **[GitHub Discussions](https://github.com/pr-pm/prpm/discussions)** - Ask questions
- 🐛 **[GitHub Issues](https://github.com/pr-pm/prpm/issues)** - Report problems
- 📧 **Email**: team@prpm.dev

---

*Generated with [Claude Code](https://claude.com/claude-code)*
