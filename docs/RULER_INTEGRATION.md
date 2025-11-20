# Ruler Integration

PRPM now supports [Ruler](https://okigu.com/ruler) as a first-class output format. Ruler is a tool that centralizes and manages AI coding assistant instructions across multiple agents and platforms.

## Overview

**Ruler** manages AI instructions locally in `.ruler/` directory and distributes them to different AI agents.
**PRPM** provides the package registry and distribution layer for discovering and installing reusable Ruler configurations.

### How They Work Together

- **Ruler handles**: Local `.ruler/` configuration management and distribution to AI agents
- **PRPM handles**: Package discovery, versioning, and installation from a central registry

Think of it like: **Ruler is to PRPM what yarn is to npm**.

---

## Installing Packages for Ruler

### Basic Usage

Install any PRPM package as a Ruler rule:

```bash
# Install a single package for Ruler
prpm install @username/react-best-practices --as ruler

# This creates: .ruler/react-best-practices.md
```

The `--as ruler` flag converts the package to Ruler's plain markdown format.

### Installing Collections

Install complete Ruler setups with collections:

```bash
# Install a curated collection of Ruler rules
prpm install collections/ruler-typescript

# This installs multiple packages to .ruler/
# - typescript-strict.md
# - code-quality.md
# - testing-patterns.md
# - etc.
```

### Auto-Install to Ruler

If your project has a `.ruler/` directory, PRPM can auto-detect it:

```bash
# Auto-detects .ruler/ and installs there
prpm install @username/react-hooks
```

---

## Publishing Ruler Configurations

Share your `.ruler/` configurations with the community:

### Import Existing Ruler Rules

```bash
# Import your .ruler/ files to PRPM
prpm import --from-ruler .ruler/

# Publishes your Ruler rules as PRPM packages
prpm publish
```

### Create New Ruler-Compatible Packages

1. Create a canonical PRPM package (any format works)
2. PRPM automatically converts to Ruler format on installation

```bash
# Create package
prpm init my-coding-standards

# Users can install it as Ruler
prpm install @yourname/my-coding-standards --as ruler
```

---

## Verified Ruler Collections

PRPM provides verified collections specifically for Ruler users:

### Available Collections

```bash
# TypeScript development with Ruler
prpm install collections/ruler-typescript

# React development with Ruler
prpm install collections/ruler-react

# Python development with Ruler
prpm install collections/ruler-python

# Node.js backend with Ruler
prpm install collections/ruler-nodejs
```

### Creating Collections

Collection authors can create Ruler-specific bundles:

**Example: `collections/ruler-typescript.json`**
```json
{
  "id": "ruler-typescript",
  "name": "Ruler TypeScript Setup",
  "description": "Complete TypeScript development rules for Ruler",
  "category": "development",
  "tags": ["ruler", "typescript", "javascript"],
  "packages": [
    {
      "packageId": "@prpm/typescript-strict",
      "version": "^1.0.0",
      "required": true,
      "reason": "Core TypeScript rules"
    },
    {
      "packageId": "@prpm/code-quality",
      "version": "^2.1.0",
      "required": true,
      "reason": "General code quality guidelines"
    },
    {
      "packageId": "@prpm/testing-patterns",
      "version": "^1.5.0",
      "required": false,
      "reason": "Optional testing best practices"
    }
  ],
  "icon": "📏"
}
```

---

## Format Compatibility

### What Converts Well to Ruler

✅ **Fully Supported:**
- Rules and guidelines (core use case)
- Coding standards
- Best practices documentation
- Style guides
- Architecture patterns

⚠️ **Partially Supported:**
- Agents (converted to plain rules, may lose structure)
- Workflows (flattened to instructions)

❌ **Not Supported:**
- Slash commands (Ruler doesn't have this concept)
- Hooks (Ruler uses different mechanism)

### Conversion Quality

PRPM provides quality scores for conversions:

```bash
# See quality score before installing
prpm info @username/package-name --format ruler

# Quality Score: 95/100
# - Fully compatible with Ruler format
# - No lossy conversions
```

---

## Discovery and Search

### Finding Ruler-Compatible Packages

Search for packages that work well with Ruler:

```bash
# Search packages with "ruler" tag
prpm search ruler

# Search collections for Ruler
prpm collections search ruler

# Browse on prpm.dev
# https://prpm.dev/search?format=ruler
```

### Ruler Format Filter

On [prpm.dev](https://prpm.dev), filter by Ruler compatibility:

1. Go to [prpm.dev/search](https://prpm.dev/search)
2. Select "Ruler" from format dropdown
3. Browse 7,500+ packages that work with Ruler

---

## Integration Examples

### Example 1: React Project with Ruler

```bash
# Initialize Ruler in your project
mkdir .ruler

# Install React rules
prpm install collections/ruler-react --as ruler

# Ruler automatically distributes to your AI agents
# (according to your ruler.toml config)
```

### Example 2: Company Standards

```bash
# Create company-wide standards
prpm init @company/coding-standards

# Publish to PRPM
prpm publish

# Team members install via Ruler
prpm install @company/coding-standards --as ruler

# Everyone gets consistent rules across all AI tools
```

### Example 3: Multi-Tool Setup

```bash
# Install same package for both Ruler and Cursor
prpm install @username/react --as ruler --as cursor

# .ruler/react.md (Ruler manages distribution)
# .cursor/rules/react.md (Direct Cursor use)
```

---

## Technical Details

### Ruler Format Specification

Ruler uses plain markdown without frontmatter:

```markdown
<!-- Package: react-best-practices -->
<!-- Author: @username -->
<!-- Description: React coding standards -->

# React Best Practices

## Component Structure

- Use functional components
- Keep components small and focused

## Naming Conventions

- Use PascalCase for components
- Use camelCase for functions
```

### File Locations

```
your-project/
├── .ruler/
│   ├── ruler.toml          # Ruler config
│   ├── mcp.json            # MCP server settings
│   ├── react-rules.md      # ← PRPM installs here
│   ├── typescript.md       # ← PRPM installs here
│   └── testing.md          # ← PRPM installs here
├── src/
└── package.json
```

### Conversion Process

1. **PRPM stores** packages in canonical format
2. **On installation**, converts to Ruler's plain markdown
3. **Adds metadata** as HTML comments (package name, author, description)
4. **Ruler reads** files and distributes to AI agents

---

## FAQ

### Do I need Ruler to use PRPM?

No. PRPM works independently with Cursor, Claude, Continue, Windsurf, Copilot, and more.

### Do I need PRPM to use Ruler?

No. But PRPM provides a registry for discovering and sharing Ruler configurations.

### Can I use both Ruler and other tools?

Yes! Install packages for multiple tools:

```bash
prpm install @username/react --as ruler --as cursor --as claude
```

### How do updates work?

```bash
# Update Ruler packages
prpm update

# Ruler automatically redistributes updated rules
```

### Can I mix PRPM and manual Ruler files?

Yes. PRPM installs to `.ruler/` just like manual files. Ruler treats them the same.

---

## Resources

- **Ruler Documentation**: [okigu.com/ruler](https://okigu.com/ruler)
- **PRPM Documentation**: [docs.prpm.dev](https://docs.prpm.dev)
- **Browse Packages**: [prpm.dev/search?format=ruler](https://prpm.dev/search?format=ruler)
- **Report Issues**: [github.com/pr-pm/prpm/issues](https://github.com/pr-pm/prpm/issues)

---

## Contributing

Help improve Ruler integration:

1. **Create Ruler collections** - Curate useful rule bundles
2. **Tag packages** - Add `ruler` tag to compatible packages
3. **Share configs** - Publish your `.ruler/` setups
4. **Report issues** - File bugs or feature requests

**Together we're building the universal package manager for AI tools.**
