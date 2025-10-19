---
name: PRPM Development - Core Principles
version: 1.0.0
description: Core development principles for building PRPM with MCP integrations
author: PRPM Team
tools:
  - filesystem
  - web_search
  - database
mcpServers:
  filesystem:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-filesystem"
      - "/home/khaliqgant/projects/prompt-package-manager"
  database:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-postgres"
    env:
      DATABASE_URL: "postgresql://prpm:password@localhost:5432/prpm_registry"
---

# PRPM Development - Core Principles

You are developing **PRPM (Prompt Package Manager)**, a universal package manager for AI prompts, agents, and cursor rules across all AI code editors. You have access to filesystem and database MCP servers for efficient development.

## Available MCP Tools

### Filesystem MCP
- **Read/Write Files**: Direct file operations via MCP
- **Search Code**: Find patterns across codebase
- **List Directories**: Navigate project structure
- **Watch Files**: Monitor file changes

Use filesystem MCP for:
- Reading package manifests
- Analyzing code structure
- Creating new files
- Updating configurations

### Database MCP
- **Query PostgreSQL**: Direct database access
- **Schema Inspection**: View table structures
- **Data Analysis**: Query registry data
- **Migrations**: Test database changes

Use database MCP for:
- Checking package data
- Testing queries
- Analyzing usage metrics
- Debugging registry issues

### Web Search MCP
- **Search Documentation**: Find API docs, examples
- **Check NPM**: Look up package info
- **Research Patterns**: Find best practices
- **Troubleshoot**: Search for error solutions

## Mission

Build the npm/cargo/pip equivalent for AI development artifacts. Enable developers to discover, install, share, and manage prompts across Cursor, Claude Code, Continue, Windsurf, and future AI editors.

## Core Architecture Principles

### 1. Universal Format Philosophy
- **Canonical Format**: All packages stored in a universal canonical format
- **Smart Conversion**: Server-side format conversion with quality scoring
- **Zero Lock-In**: Users can convert between any format without data loss
- **Format-Specific Optimization**: IDE-specific variants (e.g., Claude MCP integrations)

**Example**: When converting to Claude format, include MCP server configurations that Cursor format cannot support.

### 2. Package Manager Best Practices
- **Semantic Versioning**: Strict semver for all packages
- **Dependency Resolution**: Smart conflict resolution like npm/cargo
- **Lock Files**: Reproducible installs with version locking
- **Registry-First**: All operations through central registry API
- **Caching**: Redis caching for converted packages (1-hour TTL)

### 3. Developer Experience
- **One Command Install**: `prpm install @collection/nextjs-pro` gets everything
- **Auto-Detection**: Detect IDE from directory structure (.cursor/, .claude/)
- **Format Override**: `--as claude` to force specific format
- **Telemetry Opt-Out**: Privacy-first with easy opt-out
- **Beautiful CLI**: Clear progress indicators and colored output

### 4. Registry Design
- **GitHub OAuth**: Single sign-on, no password management
- **Full-Text Search**: PostgreSQL GIN indexes + optional Elasticsearch
- **Package Discovery**: Trending, featured, categories, tags
- **Quality Metrics**: Download counts, stars, verified badges
- **Analytics**: Track usage patterns while respecting privacy

### 5. Collections System
- **Curated Bundles**: Official collections maintained by PRPM team
- **IDE-Specific**: Different package variants per editor
  - Cursor: Simple cursor rules
  - Claude: Includes MCP integrations and marketplace tools
  - Continue: Minimal configuration
- **Required + Optional**: Core packages + optional enhancements
- **Installation Order**: Sequential or parallel package installation
- **Reason Documentation**: Every package explains why it's included

## MCP Integration Patterns

### When Creating Claude Packages
Always consider adding MCP servers for enhanced functionality:

```yaml
---
name: Package Name
tools:
  - filesystem
  - web_search
mcpServers:
  filesystem:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/project/path"]
  custom_tool:
    command: node
    args: ["./scripts/mcp-server.js"]
---
```

### Collection Format Variants
Use `formatSpecific` in collections to provide Claude-optimized versions:

```json
{
  "packageId": "typescript-expert",
  "formatSpecific": {
    "cursor": "typescript-expert",
    "claude": "typescript-expert-with-mcp"
  }
}
```

### Testing MCP Integration
When testing packages with MCP:
1. Verify MCP server connectivity
2. Test tool availability
3. Check filesystem permissions
4. Validate database connections

## Development Workflow with MCP

### 1. Use Filesystem MCP for Code Navigation
Instead of manually reading files, use MCP:
- Search for function definitions
- List files in directory
- Read multiple files efficiently
- Watch for changes

### 2. Use Database MCP for Registry Queries
Query registry directly:
```sql
SELECT id, name, downloads
FROM packages
WHERE category = 'development'
ORDER BY downloads DESC
LIMIT 10;
```

### 3. Use Web Search for Research
- Look up TypeScript best practices
- Find Fastify documentation
- Research PostgreSQL features
- Check npm package versions

## Quality Standards

### Code Quality
- **TypeScript Strict Mode**: No implicit any, strict null checks
- **Error Handling**: Proper error messages with context
- **Retry Logic**: Exponential backoff for network requests
- **Input Validation**: Validate all user inputs and API responses

### Format Conversion
- **Lossless When Possible**: Preserve all semantic information
- **Quality Scoring**: 0-100 score for conversion quality
- **Warnings**: Clear warnings about lossy conversions
- **Round-Trip Testing**: Test canonical → format → canonical

### Security
- **No Secrets in DB**: Never store GitHub tokens, use session IDs
- **SQL Injection**: Parameterized queries only (use Database MCP safely)
- **Rate Limiting**: Prevent abuse of registry API
- **Content Security**: Validate package contents before publishing

## Claude-Specific Features

### Marketplace Integration
Claude packages can integrate with marketplace:
- Link to marketplace tools in package metadata
- Include marketplace tool configurations
- Document marketplace dependencies

### Skills and Capabilities
Claude packages can define specialized skills:
- Code analysis skills
- Testing automation skills
- Documentation generation skills
- Format conversion skills

### Context Management
Optimize for Claude's context window:
- Keep core principles concise
- Link to detailed docs via MCP filesystem
- Use examples efficiently
- Leverage MCP for on-demand information

## Performance with MCP

- **Batch Operations**: Use MCP for parallel file reads
- **Database Pooling**: Reuse MCP database connections
- **Caching**: Cache MCP responses when appropriate
- **Lazy Loading**: Only use MCP when needed

## Common MCP Patterns

### Read Package Manifest
```typescript
// Use filesystem MCP
const manifest = await mcp.filesystem.readFile('package.json');
const parsed = JSON.parse(manifest);
```

### Query Package Stats
```typescript
// Use database MCP
const stats = await mcp.database.query(`
  SELECT * FROM package_stats WHERE package_id = $1
`, [packageId]);
```

### Research Best Practice
```typescript
// Use web search MCP
const results = await mcp.webSearch.search('TypeScript strict mode best practices');
```

Remember: PRPM is infrastructure. It must be rock-solid, fast, and trustworthy like npm or cargo. With MCP integration, Claude users get enhanced development capabilities.
