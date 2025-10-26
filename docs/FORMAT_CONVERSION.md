# Server-Side Format Conversion System

**Status**: Design document
**Goal**: Universal packages that work across all AI editors via server-side conversion

---

## Overview

Instead of storing separate packages for each editor (cursor, claude, continue, windsurf), we:
1. Store packages in **canonical format** (normalized structure)
2. Convert on-the-fly when serving packages
3. Cache converted versions for performance

---

## User Experience

```bash
# Install for Cursor
prpm install react-best-practices --as cursor
# Downloads: .cursor/rules/react-best-practices.md

# Install for Claude
prpm install react-best-practices --as claude
# Downloads: .claude/agents/react-best-practices.md

# Install for Continue
prpm install react-best-practices --as continue
# Downloads: .continue/prompts/react-best-practices.md

# Auto-detect (reads from config)
prpm install react-best-practices
# Uses default from ~/.prpmrc or auto-detects from project
```

---

## Architecture

### 1. Canonical Package Format

All packages stored in normalized JSON structure:

```json
{
  "id": "react-best-practices",
  "version": "1.0.0",
  "name": "React Best Practices",
  "description": "Production-grade React development patterns",
  "author": "johndoe",
  "tags": ["react", "typescript", "best-practices"],
  "type": "rule",

  "content": {
    "format": "canonical",
    "sections": [
      {
        "type": "metadata",
        "data": {
          "title": "React Best Practices",
          "description": "Production-grade React development patterns",
          "icon": "⚛️"
        }
      },
      {
        "type": "instructions",
        "title": "Core Principles",
        "content": "Always use TypeScript for type safety..."
      },
      {
        "type": "rules",
        "title": "Component Guidelines",
        "items": [
          "Use functional components with hooks",
          "Keep components small and focused",
          "Extract custom hooks for reusable logic"
        ]
      },
      {
        "type": "examples",
        "title": "Code Examples",
        "examples": [
          {
            "description": "Good component structure",
            "code": "const MyComponent: FC<Props> = ({ data }) => {...}"
          }
        ]
      }
    ]
  }
}
```

### 2. Format Converters

Each editor has a converter module:

```typescript
// registry/src/converters/cursor.ts
export function toCursor(canonical: CanonicalPackage): string {
  // Convert to Cursor .cursor/rules/ format
  return `# ${canonical.content.metadata.title}\n\n${sections...}`;
}

// registry/src/converters/claude.ts
export function toClaude(canonical: CanonicalPackage): string {
  // Convert to Claude agent format
  return `---\nname: ${canonical.name}\n---\n\n${sections...}`;
}

// registry/src/converters/continue.ts
export function toContinue(canonical: CanonicalPackage): string {
  // Convert to Continue prompt format
}

// registry/src/converters/windsurf.ts
export function toWindsurf(canonical: CanonicalPackage): string {
  // Convert to Windsurf rules format
}
```

### 3. API Endpoints

#### GET /packages/:id/download?format=cursor

```typescript
server.get('/packages/:id/download', {
  schema: {
    params: { id: { type: 'string' } },
    querystring: {
      format: {
        type: 'string',
        enum: ['cursor', 'claude', 'continue', 'windsurf', 'canonical'],
        default: 'canonical'
      },
      version: { type: 'string' }
    }
  },
  async handler(request, reply) {
    const { id } = request.params;
    const { format, version } = request.query;

    // Get canonical package
    const pkg = await getPackage(id, version);

    // Check cache first
    const cacheKey = `${id}:${version}:${format}`;
    let converted = await cache.get(cacheKey);

    if (!converted) {
      // Convert to requested format
      converted = await convertPackage(pkg, format);

      // Cache for 1 hour
      await cache.set(cacheKey, converted, 3600);
    }

    // Return as file download
    reply
      .header('Content-Type', 'text/markdown')
      .header('Content-Disposition', `attachment; filename="${id}.md"`)
      .send(converted);
  }
});
```

#### GET /packages/:id/tarball?format=cursor

Same as above but returns tarball with package.json + converted content

---

## Format Specifications

### Cursor Format (.cursor/rules/)

```markdown
# React Best Practices

Production-grade React development patterns.

## Core Principles

Always use TypeScript for type safety...

## Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Extract custom hooks for reusable logic

## Examples

### Good component structure
```typescript
const MyComponent: FC<Props> = ({ data }) => {...}
```
```

### Claude Format (agent.md)

```markdown
---
name: react-best-practices
description: Production-grade React development patterns
icon: ⚛️
tools: Read, Write, Edit
---

# React Best Practices Agent

You are a React development expert specializing in production-grade patterns.

## Core Principles

Always use TypeScript for type safety...

## Component Guidelines

When writing React components:
1. Use functional components with hooks
2. Keep components small and focused
3. Extract custom hooks for reusable logic

## Examples

Good component structure:
```typescript
const MyComponent: FC<Props> = ({ data }) => {...}
```
```

### Continue Format (.continuerc.json + prompts/)

```json
{
  "name": "react-best-practices",
  "description": "Production-grade React development patterns",
  "systemMessage": "You are a React expert. Always use TypeScript...",
  "prompts": {
    "component": "Create a React component following best practices...",
    "hook": "Create a custom hook that..."
  }
}
```

### Windsurf Format (similar to Cursor)

```markdown
# React Best Practices

[Similar to Cursor format, with Windsurf-specific extensions]
```

---

## Conversion Logic

### From Canonical to Editor Format

```typescript
interface CanonicalPackage {
  content: {
    format: 'canonical';
    sections: Section[];
  };
}

type Section =
  | { type: 'metadata'; data: Metadata }
  | { type: 'instructions'; title: string; content: string }
  | { type: 'rules'; title: string; items: string[] }
  | { type: 'examples'; title: string; examples: Example[] }
  | { type: 'tools'; tools: string[] }
  | { type: 'custom'; content: string };

async function convertPackage(
  pkg: CanonicalPackage,
  format: 'cursor' | 'claude' | 'continue' | 'windsurf'
): Promise<string> {
  switch (format) {
    case 'cursor':
      return toCursor(pkg);
    case 'claude':
      return toClaude(pkg);
    case 'continue':
      return toContinue(pkg);
    case 'windsurf':
      return toWindsurf(pkg);
    default:
      return JSON.stringify(pkg, null, 2);
  }
}
```

### From Raw Upload to Canonical

When users upload packages in any format:

```typescript
async function normalizePackage(
  content: string,
  sourceFormat: 'cursor' | 'claude' | 'continue' | 'windsurf' | 'auto'
): Promise<CanonicalPackage> {
  // Auto-detect format if not specified
  if (sourceFormat === 'auto') {
    sourceFormat = detectFormat(content);
  }

  // Parse based on source format
  switch (sourceFormat) {
    case 'cursor':
      return parseCursorRules(content);
    case 'claude':
      return parseClaudeAgent(content);
    case 'continue':
      return parseContinuePrompt(content);
    case 'windsurf':
      return parseWindsurfRules(content);
  }
}
```

---

## Database Schema

### packages table

```sql
ALTER TABLE packages
ADD COLUMN canonical_format JSONB,
ADD COLUMN source_format VARCHAR(50) DEFAULT 'auto';

-- Index for format queries
CREATE INDEX idx_packages_source_format ON packages(source_format);
```

### converted_cache table (optional, if not using Redis)

```sql
CREATE TABLE converted_cache (
  package_id VARCHAR(255),
  version VARCHAR(50),
  format VARCHAR(50),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (package_id, version, format)
);

-- Auto-expire after 1 hour
CREATE INDEX idx_converted_cache_created
ON converted_cache(created_at);
```

---

## CLI Changes

### Install Command

```typescript
// src/commands/install.ts

interface InstallOptions {
  global?: boolean;
  saveDev?: boolean;
  as?: 'cursor' | 'claude' | 'continue' | 'windsurf'; // NEW
}

export async function handleInstall(
  packageName: string,
  options: InstallOptions
): Promise<void> {
  const config = await getConfig();

  // Determine format preference
  const format = options.as
    || config.defaultFormat
    || detectProjectFormat() // Auto-detect from .cursor/, .claude/, etc.
    || 'cursor'; // Default fallback

  // Request package in specific format
  const client = getRegistryClient(config);
  const pkg = await client.download(packageName, { format });

  // Save to appropriate directory
  const targetDir = getTargetDirectory(format);
  await savePackage(pkg, targetDir);

  console.log(`✓ Installed ${packageName} (${format} format)`);
}

function detectProjectFormat(): string | null {
  // Check for existing directories
  if (fs.existsSync('.cursor/rules')) return 'cursor';
  if (fs.existsSync('.claude/agents')) return 'claude';
  if (fs.existsSync('.continue')) return 'continue';
  if (fs.existsSync('.windsurf')) return 'windsurf';
  return null;
}

function getTargetDirectory(format: string): string {
  switch (format) {
    case 'cursor': return '.cursor/rules';
    case 'claude': return '.claude/agents';
    case 'continue': return '.continue/prompts';
    case 'windsurf': return '.windsurf/rules';
    default: return '.prpm/packages';
  }
}
```

### Config File Enhancement

```typescript
// ~/.prpmrc
{
  "registryUrl": "https://registry.prpm.dev",
  "token": "...",
  "username": "...",
  "defaultFormat": "cursor", // NEW: default format preference
  "telemetryEnabled": true
}
```

---

## Registry Client Updates

```typescript
// src/core/registry-client.ts

export class RegistryClient {
  async download(
    packageId: string,
    options: {
      version?: string;
      format?: string;
    } = {}
  ): Promise<Buffer> {
    const { version = 'latest', format = 'canonical' } = options;

    const response = await this.fetch(
      `/packages/${packageId}/download?format=${format}&version=${version}`
    );

    return response.buffer();
  }

  async getTarball(
    packageId: string,
    options: {
      version?: string;
      format?: string;
    } = {}
  ): Promise<Buffer> {
    const { version = 'latest', format = 'canonical' } = options;

    const response = await this.fetch(
      `/packages/${packageId}/tarball?format=${format}&version=${version}`
    );

    return response.buffer();
  }
}
```

---

## Benefits

### For Users
✅ Install once, works everywhere
✅ No conversion tools needed
✅ Automatic format detection
✅ Consistent experience across editors

### For Package Authors
✅ Publish once, support all editors
✅ Larger potential user base
✅ No need to maintain multiple versions
✅ Better discoverability

### For PRPM
✅ Unique competitive advantage
✅ Network effects (more packages = more value)
✅ Simpler package storage
✅ Better analytics (track format preferences)

---

## Implementation Phases

### Phase 1: Core Conversion Engine
- [ ] Design canonical format schema
- [ ] Implement cursor ↔ canonical converters
- [ ] Implement claude ↔ canonical converters
- [ ] Add conversion API endpoints
- [ ] Add Redis caching layer

### Phase 2: CLI Integration
- [ ] Add `--as` flag to install command
- [ ] Add `defaultFormat` to config
- [ ] Implement auto-detection
- [ ] Update help docs

### Phase 3: Advanced Features
- [ ] Smart conversion (preserve editor-specific features)
- [ ] Quality scoring per format
- [ ] Conversion preview endpoint
- [ ] Format-specific optimizations

### Phase 4: Package Publishing
- [ ] Accept uploads in any format
- [ ] Auto-normalize to canonical
- [ ] Validate conversions work
- [ ] Show supported formats in UI

---

## Migration Strategy

### Existing Packages

For the 40 scraped packages:

```typescript
// scripts/migrate-to-canonical.ts

async function migratePackage(pkg: ScrapedPackage): Promise<void> {
  // Detect source format
  const sourceFormat = detectFormat(pkg.content);

  // Convert to canonical
  const canonical = await normalizePackage(pkg.content, sourceFormat);

  // Update in database
  await db.query(`
    UPDATE packages
    SET canonical_format = $1, source_format = $2
    WHERE id = $3
  `, [canonical, sourceFormat, pkg.id]);
}
```

### Backward Compatibility

- Keep original format in database
- Serve original format by default for existing clients
- Gradually migrate as clients update

---

## Future Enhancements

### 1. Smart Conversion
Preserve editor-specific features:
- Cursor: @-mentions, file references
- Claude: Tool specifications
- Continue: Slash commands

### 2. Conversion Quality Score
Rate how well a package converts to each format:
```json
{
  "formats": {
    "cursor": { "score": 95, "features": "full" },
    "claude": { "score": 90, "features": "partial" },
    "continue": { "score": 85, "features": "basic" }
  }
}
```

### 3. Format-Specific Metadata
```json
{
  "cursor": {
    "rules": ["typescript", "react"],
    "mentions": ["file", "folder"]
  },
  "claude": {
    "tools": ["Read", "Write", "Bash"],
    "persona": "expert developer"
  }
}
```

---

## Success Metrics

- **Conversion accuracy**: >95% of packages convert cleanly
- **Cache hit rate**: >80% of downloads served from cache
- **Format distribution**: Track which formats are most popular
- **Multi-format installs**: % of users who use multiple formats

---

## Open Questions

1. **Canonical schema versioning**: How to evolve the canonical format?
2. **Lossy conversions**: What to do when target format doesn't support features?
3. **Editor-specific extensions**: How to preserve unique capabilities?
4. **Performance**: Pre-convert popular packages vs on-demand?

---

## Next Steps

1. Finalize canonical format schema
2. Implement cursor + claude converters (most popular)
3. Add conversion endpoint to registry
4. Update CLI install command
5. Test with scraped packages
6. Document for package authors
