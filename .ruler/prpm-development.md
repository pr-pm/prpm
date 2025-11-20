<!-- Package: prpm-development -->
<!-- Author: user -->
<!-- Description: Use when developing PRPM (Prompt Package Manager) - comprehensive knowledge base covering architecture, format conversion, package types, collections, quality standards, testing, and deployment -->

# Individual package

Use when developing PRPM (Prompt Package Manager) - comprehensive knowledge base covering architecture, format conversion, package types, collections, quality standards, testing, and deployment

## Mission

Build the npm/cargo/pip equivalent for AI development artifacts. Enable developers to discover, install, share, and manage prompts across Cursor, Claude Code, Continue, Windsurf, and future AI editors.

## Core Architecture

### Git Workflow - CRITICAL RULES

```bash
git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
```

## Package Types

- Knowledge and guidelines for AI assistants

- `.claude/skills/`, `.cursor/rules/`

- `@prpm/pulumi-troubleshooting`, `@typescript/best-practices`

- Autonomous AI agents for multi-step tasks

- `.claude/agents/`, `.cursor/agents/`

- `@prpm/code-reviewer`, `@cursor/debugging-agent`

- Specific instructions or constraints for AI behavior

- `.cursor/rules/`, `.cursorrules`

- `@cursor/react-conventions`, `@cursor/test-first`

- Extensions that add functionality

- `.cursor/plugins/`, `.claude/plugins/`

- Reusable prompt templates

- `.prompts/`, project-specific directories

- Multi-step automation workflows

- `.workflows/`, `.github/workflows/`

- Executable utilities and scripts

- `scripts/`, `tools/`, `.bin/`

- Reusable file and project templates

- `templates/`, project-specific directories

- Model Context Protocol servers

- `.mcp/servers/`

## Format Conversion System

- Cursor (.mdc)

- MDC frontmatter with `ruleType`, `alwaysApply`, `description`

- Markdown body

- Simple, focused on coding rules

- No structured tools/persona definitions

- Claude (agent format)

- YAML frontmatter: `name`, `description`

- Optional: `tools` (comma-separated), `model` (sonnet/opus/haiku/inherit)

- Markdown body

- Supports persona, examples, instructions

- Continue (JSON)

- JSON configuration

- Simple prompts, context rules

- Limited metadata support

- Windsurf

- Similar to Cursor

- Markdown-based

- Basic structure

- Missing tools: -10 points

- Missing persona: -5 points

- Missing examples: -5 points

- Unsupported sections: -10 points each

- Format-specific features lost: -5 points

- **Canonical ↔ Claude**: Nearly lossless (95-100%)

- **Canonical ↔ Cursor**: Lossy on tools/persona (70-85%)

- **Canonical ↔ Continue**: Most lossy (60-75%)

## Collections System

### Collection Structure

```json
{
  "id": "@collection/nextjs-pro",
  "name": "Next.js Professional Setup",
  "description": "Complete Next.js development setup",
  "category": "frontend",
  "packages": [
    {
      "packageId": "react-best-practices",
      "required": true,
      "reason": "Core React patterns"
    },
    {
      "packageId": "typescript-strict",
      "required": true,
      "reason": "Type safety"
    },
    {
      "packageId": "tailwind-helper",
      "required": false,
      "reason": "Styling utilities"
    }
  ]
}
```

### Installation Formats (Priority Order)

```bash
prpm install collections/nextjs-pro
prpm install collections/nextjs-pro@2.0.0
```

### Registry Resolution Logic

```typescript
// When scope is 'collection' (default from CLI for collections/* prefix):
if (scope === 'collection') {
  // Search across ALL scopes, prioritize by:
  // 1. Official collections (official = true)
  // 2. Verified authors (verified = true)
  // 3. Most downloads
  // 4. Most recent
  SELECT * FROM collections
  WHERE name_slug = $1
  ORDER BY official DESC, verified DESC, downloads DESC, created_at DESC
  LIMIT 1
} else {
  // Explicit scope: exact match only
  SELECT * FROM collections
  WHERE scope = $1 AND name_slug = $2
  ORDER BY created_at DESC
  LIMIT 1
}
```

### CLI Resolution Logic

```typescript
// Parse collection spec:
// - collections/nextjs-pro → scope='collection', name_slug='nextjs-pro'
// - khaliqgant/nextjs-pro → scope='khaliqgant', name_slug='nextjs-pro'
// - @khaliqgant/nextjs-pro → scope='khaliqgant', name_slug='nextjs-pro'
// - nextjs-pro → scope='collection', name_slug='nextjs-pro'

const matchWithScope = collectionSpec.match(/^@?([^/]+)\/([^/@]+)(?:@(.+))?$/);
if (matchWithScope) {
  [, scope, name_slug, version] = matchWithScope;
} else {
  // No scope: default to 'collection'
  [, name_slug, version] = collectionSpec.match(/^([^/@]+)(?:@(.+))?$/);
  scope = 'collection';
}
```

### Version Resolution

```bash
prpm install collections/nextjs-pro

prpm install collections/nextjs-pro@2.0.4

prpm install khaliqgant/nextjs-pro@2.0.4
```

### Error Handling

```bash
prpm install collections/nonexistent
```

## Quality & Ranking System

- (0-30 points):

- Total downloads (weighted by recency)

- Stars/favorites

- Trending velocity

- (0-30 points):

- User ratings (1-5 stars)

- Review sentiment

- Documentation completeness

- (0-20 points):

- Verified author badge

- Original creator vs fork

- Publisher reputation

- Security scan results

- (0-10 points):

- Last updated date (<30 days = 10 points)

- Release frequency

- Active maintenance

- (0-10 points):

- Has README

- Has examples

- Has tags

- Complete metadata

## Technical Stack

- **Commander.js**: CLI framework

- **Fastify Client**: HTTP client for registry

- **Tar**: Package tarball creation/extraction

- **Chalk**: Terminal colors

- **Ora**: Spinners for async operations

- **Fastify**: High-performance web framework

- **PostgreSQL**: Primary database with GIN indexes

- **Redis**: Caching layer for converted packages

- **GitHub OAuth**: Authentication provider

- **Docker**: Containerized deployment

- **Vitest**: Unit and integration tests

- **100% Coverage Goal**: Especially for format converters

- **Round-Trip Tests**: Ensure conversion quality

- **Fixtures**: Real-world package examples

## Testing Standards

### Key Testing Patterns

```typescript
// Format converter test
describe('toCursor', () => {
  it('preserves data in roundtrip', () => {
    const result = toCursor(canonical);
    const back = fromCursor(result.content);
    expect(back).toEqual(canonical);
  });
});

// CLI command test
describe('install', () => {
  it('downloads and installs package', async () => {
    await handleInstall('test-pkg', { as: 'cursor' });
    expect(fs.existsSync('.cursor/rules/test-pkg.md')).toBe(true);
  });
});
```

## Development Workflow

### Package Manager: npm (NOT pnpm)

```bash
npm install

npm install --workspace=@pr-pm/cli

npm test

npm run build

npm run dev --workspace=prpm
```

### Dependency Management Best Practices

```typescript
// BAD - tar-stream is imported dynamically at runtime
const tarStream = await import('tar-stream');
```

### Environment Variable Management

```bash
NEW_FEATURE_API_KEY=your-key-here
```

## Security Standards

- **No Secrets in DB**: Never store GitHub tokens, use session IDs

- **SQL Injection**: Parameterized queries only

- **Rate Limiting**: Prevent abuse of registry API

- **Content Security**: Validate package contents before publishing

## Performance Considerations

- **Batch Operations**: Use Promise.all for independent operations

- **Database Indexes**: GIN for full-text, B-tree for lookups

- **Caching Strategy**: Cache converted packages, not raw data

- **Lazy Loading**: Don't load full package data until needed

- **Connection Pooling**: Reuse PostgreSQL connections

## Deployment

### Webapp (S3 Static Export) ⚠️ CRITICAL

```typescript
// ❌ Dynamic route (doesn't work with 'use client')
     // /app/shared/[token]/page.tsx
     const params = useParams();
     const token = params.token;

     // ✅ Query string with Suspense (works with 'use client')
     // /app/shared/page.tsx
     import { Suspense } from 'react';

     function Content() {
       const searchParams = useSearchParams();
       const token = searchParams.get('token');
       // ... component logic
     }

     export default function Page() {
       return (
         <Suspense fallback={<div>Loading...</div>}>
           <Content />
         </Suspense>
       );
     }
```

### Publishing PRPM to NPM

```bash
npm version patch --workspace=prpm --workspace=@prpm/registry-client

npm version minor --workspace=prpm
```

## Common Patterns

### CLI Command Structure

```typescript
export async function handleCommand(args: Args, options: Options) {
  const startTime = Date.now();
  try {
    const config = await loadUserConfig();
    const client = getRegistryClient(config);
    const result = await client.fetchData();
    console.log('✅ Success');
    await telemetry.track({ command: 'name', success: true });
  } catch (error) {
    console.error('❌ Failed:', error.message);
    await telemetry.track({ command: 'name', success: false });
    process.exit(1);
  }
}
```

### Registry Route Structure

```typescript
server.get('/:id', {
  schema: { /* OpenAPI schema */ },
}, async (request, reply) => {
  const { id } = request.params;
  if (!id) return reply.code(400).send({ error: 'Missing ID' });
  const result = await server.pg.query('SELECT...');
  return result.rows[0];
});
```

### Format Converter Structure

```typescript
export function toFormat(pkg: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;
  const content = convertSections(pkg.content.sections, warnings);
  const lossyConversion = warnings.some(w => w.includes('not supported'));
  if (lossyConversion) qualityScore -= 10;
  return { content, format: 'target', warnings, qualityScore, lossyConversion };
}
```

## Naming Conventions

- **Files**: kebab-case (`registry-client.ts`, `to-cursor.ts`)

- **Types**: PascalCase (`CanonicalPackage`, `ConversionResult`)

- **Functions**: camelCase (`getPackage`, `convertToFormat`)

- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_REGISTRY_URL`)

- **Database**: snake_case (`package_id`, `created_at`)

- **API Requests/Responses**: snake_case (`package_id`, `session_id`, `created_at`)

- **Important**: All API request and response fields use snake_case to match PostgreSQL database conventions

- Internal service methods may use camelCase, but must convert to snake_case at API boundaries

- TypeScript interfaces for API types should use snake_case fields

- Examples: `PlaygroundRunRequest.package_id`, `CreditBalance.reset_at`

## Documentation Standards

- **Inline Comments**: Explain WHY, not WHAT

- **JSDoc**: Required for public APIs

- **README**: Keep examples up-to-date

- **Markdown Docs**: Use code blocks with language tags

- **Changelog**: Follow Keep a Changelog format

- **Continuous Accuracy**: Documentation must be continuously updated and tended to for accuracy

- When adding features, update relevant docs immediately

- When fixing bugs, check if docs need corrections

- When refactoring, verify examples still work

- Review docs quarterly for outdated information

- Keep CLI docs, README, and Mintlify docs in sync

## Overview

Complete knowledge base for developing PRPM - the universal package manager for AI prompts, agents, and rules.

## Reference Documentation

- `format-conversion.md` - Complete format conversion specs

- `package-types.md` - All package types with examples

- `collections.md` - Collections system and examples

- `quality-ranking.md` - Quality and ranking algorithms

- `testing-guide.md` - Testing patterns and standards

- `deployment.md` - Deployment procedures