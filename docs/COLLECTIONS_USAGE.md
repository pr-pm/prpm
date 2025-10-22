# Collections Usage Guide

Collections are curated bundles of packages designed to work together for specific use cases. They make it easy to install everything you need for a particular development workflow.

## What Makes Collections Special

### 1. IDE-Specific Customization

Collections can include different packages or variations based on your IDE/tool:

```json
{
  "packageId": "typescript-expert",
  "formatSpecific": {
    "cursor": "typescript-expert",           // Standard cursor rule
    "claude": "typescript-expert-with-mcp",  // Claude agent with MCP integration
    "continue": "typescript-expert-simple",  // Simplified for Continue
    "windsurf": "typescript-expert"          // Standard for Windsurf
  }
}
```

When you install a collection, PRPM automatically selects the right package variant for your IDE.

### 2. Claude-Specific Features

For Claude users, collections can include:

- **MCP Integrations**: Packages that connect to MCP servers
- **Marketplace Tools**: Pre-configured marketplace integrations
- **Skills**: Claude-specific skills and capabilities

Example:
```json
{
  "id": "@collection/claude-skills",
  "config": {
    "defaultFormat": "claude"
  },
  "packages": [
    {
      "packageId": "mcp-filesystem",
      "formatSpecific": {
        "claude": "mcp-filesystem-skill"  // Includes MCP server config
      }
    },
    {
      "packageId": "claude-marketplace",
      "formatSpecific": {
        "claude": "claude-marketplace-integration"  // Marketplace tools
      }
    }
  ]
}
```

### 3. Format-Aware Installation

Collections respect your project's format or allow override:

```bash
# Auto-detect from .cursor/, .claude/, etc.
prpm install @collection/typescript-fullstack

# Force specific format
prpm install @collection/typescript-fullstack --as claude

# Install with only required packages
prpm install @collection/typescript-fullstack --skip-optional
```

## PRPM Development Collections

This project uses the following collections to showcase the system:

### [@collection/typescript-fullstack](../registry/scripts/seed/prpm-collections.json)
**Purpose**: Core TypeScript patterns for building PRPM CLI and registry backend

Includes:
- `typescript-expert` - TypeScript best practices, strict mode, type safety
- `nodejs-backend` - Node.js server development with Express/Fastify
- `react-typescript` - React with TypeScript and hooks (for future web UI)

### [@collection/package-manager-dev](../registry/scripts/seed/prpm-collections.json)
**Purpose**: Essential for CLI development, npm publishing, and package management features

Includes:
- `cli-development` - CLI design patterns with Commander.js
  - Cursor: Standard CLI patterns
  - Claude: Includes MCP stdio integration patterns
- `npm-publishing` - Package publishing and versioning
- `semver-versioning` - Semantic versioning strategies
- `file-system-ops` - Safe file operations and tar archives
- `config-management` - Configuration files and user settings

### [@collection/registry-backend](../registry/scripts/seed/prpm-collections.json)
**Purpose**: Powers the PRPM registry with Fastify, PostgreSQL, Redis, and OAuth

Includes:
- `fastify-api` - High-performance API development
- `postgresql-advanced` - Triggers, views, full-text search
- `redis-caching` - Caching strategies and session management
- `oauth-github` - GitHub OAuth integration
- `search-elasticsearch` - Full-text search (optional)
  - Claude: Includes MCP Elasticsearch integration
- `analytics-tracking` - Usage analytics and metrics

### [@collection/testing-complete](../registry/scripts/seed/prpm-collections.json)
**Purpose**: Comprehensive testing with Vitest for format converters and API endpoints

Includes:
- `vitest-testing` - Unit and integration testing with coverage
- `typescript-testing` - TypeScript-specific testing patterns
- `api-testing` - REST API testing strategies
- `code-coverage` - Coverage reporting and quality gates

### [@collection/scraper-automation](../registry/scripts/seed/prpm-collections.json)
**Purpose**: Used for scraping cursor rules and Claude agents from GitHub repositories

Includes:
- `github-api` - GitHub API with rate limiting and pagination
- `web-scraping` - Web scraping patterns with cheerio/puppeteer
- `rate-limiting` - Rate limiting strategies and retry logic
- `data-extraction` - Data parsing and transformation
- `markdown-parsing` - Parse and extract data from markdown files

### [@collection/format-conversion](../registry/scripts/seed/prpm-collections.json)
**Purpose**: Critical for converting between Cursor, Claude, Continue, and Windsurf formats

Includes:
- `yaml-frontmatter` - Parse and generate YAML frontmatter
- `markdown-processing` - Markdown parsing and transformation
- `data-validation` - Schema validation with Zod/JSON Schema
- `json-transformation` - JSON parsing and normalization
- `quality-scoring` - Quality metrics and conversion scoring

### [@collection/claude-skills](../registry/scripts/seed/prpm-collections.json)
**Purpose**: Claude-specific skills and MCP integrations (Claude-optimized)

**Format**: `claude` (optimized for Claude Code)

Includes:
- `mcp-filesystem-skill` - MCP server for file operations
- `mcp-web-search-skill` - MCP integration for web search
- `mcp-database-skill` - MCP server for database operations
- `claude-marketplace-integration` - Access marketplace tools

## Creating Custom Collections

Create a collection JSON file:

```json
{
  "id": "my-collection",
  "scope": "username",
  "name": "My Custom Collection",
  "description": "Description of what this collection does",
  "version": "1.0.0",
  "category": "development",
  "tags": ["tag1", "tag2"],
  "icon": "🎯",
  "official": false,
  "config": {
    "defaultFormat": "cursor",
    "installOrder": "sequential"
  },
  "packages": [
    {
      "packageId": "package-name",
      "required": true,
      "reason": "Why this package is included",
      "formatSpecific": {
        "cursor": "package-name-cursor",
        "claude": "package-name-claude-mcp"
      }
    }
  ]
}
```

Publish it:
```bash
prpm publish-collection my-collection.json
```

## Collection Commands

```bash
# List all collections
prpm collections

# Filter by category
prpm collections list --category development

# Show official collections only
prpm collections list --official

# View collection details
prpm collection info @collection/typescript-fullstack

# Install a collection
prpm install @collection/typescript-fullstack

# Install with specific format
prpm install @collection/typescript-fullstack --as claude

# Install without optional packages
prpm install @collection/typescript-fullstack --skip-optional
```

## Benefits

1. **One Command Setup**: Install complete development environments with one command
2. **IDE-Optimized**: Automatically get the best version for your editor
3. **Curated**: Official collections maintained by PRPM team
4. **Discoverable**: Browse collections by category, tag, or framework
5. **Customizable**: Create your own collections for your team or workflow

## Example Workflow

```bash
# Starting a new Next.js project
prpm install @collection/nextjs-pro

# Building a CLI tool
prpm install @collection/package-manager-dev

# Setting up testing
prpm install @collection/testing-complete

# Claude-specific development
prpm install @collection/claude-skills --as claude
```

Each collection installs the right packages in the right format for your environment.
