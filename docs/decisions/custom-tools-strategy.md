# Custom Tools Strategy

**Date:** 2025-01-21
**Status:** Decided
**Decision:** Do nothing special for custom tools in format conversion

## Context

OpenCode (and potentially other formats) support custom tools - executable TypeScript/JavaScript functions that agents can invoke. This raises the question: should PRPM try to convert these tools between formats?

## Decision

**Ship OpenCode support with no special handling for custom tools.**

When converting packages with custom tools:
- Drop tools during conversion
- Warn users clearly about the loss
- Quality score reflects missing tools (existing penalty system)
- Tag packages that contain custom tools in metadata

## Rationale

1. **Avoid premature optimization** - We don't know yet if tool conversion is a real user pain point
2. **Keep scope manageable** - Focus on shipping OpenCode support, not solving theoretical problems
3. **Learn first** - See how users actually use custom tools before investing in conversion
4. **MCP exists** - The cross-editor tool problem has existing solutions we don't need to compete with
5. **Simple and honest** - Clear warnings about what's lost is better than half-working conversions

## Future Alternatives (If Needed)

### Option 1: Tool Marketplace + Transparent Loss

**What:** Excel at discovery and transparency rather than conversion.

**How:**
- Search/filter by tool capabilities
- Clear warnings during installation: "This package contains 3 custom tools that won't work in Claude"
- Suggest format-specific alternatives
- Let community publish format-specific versions

**Effort:** Low - mostly UI/UX improvements
**Value:** Better expectations, reduced friction

**Example:**
```bash
prpm install @company/db-agent --as claude
⚠️  Warning: This package contains 2 custom tools that won't work in Claude format:
- getDatabaseSchema()
- runSafeQuery()

Consider these alternatives:
- Install as opencode format (requires OpenCode editor)
- Find a Claude-native equivalent: prpm search "database" --format claude
```

### Option 2: PRPM Standard Library

**What:** Build common tool abstractions that work across formats.

**How:**
- Create `@prpm/stdlib-opencode`, `@prpm/stdlib-claude`, `@prpm/stdlib-cursor`
- Publishers use stdlib instead of custom implementations
- PRPM converts stdlib calls automatically
- Custom tools still get dropped with warnings

**Effort:** High - requires building and maintaining stdlib for multiple formats
**Value:** Real portability for common cases, unique differentiator

**Scope (common tools only):**
- HTTP requests (GET, POST with auth)
- File operations (read, write, exists)
- Shell commands (safe subset)
- Key-value storage (persist data between runs)

**Example:**
```typescript
// Publisher writes
import { http, file } from '@prpm/stdlib-opencode';

export const tool = {
  execute: async () => {
    const data = await http.get('https://api.example.com');
    await file.write('output.json', data);
  }
};

// PRPM converts to Claude using @prpm/stdlib-claude
// OR drops with clear warning if custom tool
```

**Conversion result:**
```bash
prpm install @company/api-tester --as claude
✓ Converted successfully (Quality: 92/100)
✓ 2/2 tools converted using PRPM stdlib
  - http.post → @prpm/stdlib-claude
  - file.read → @prpm/stdlib-claude
```

## When to Revisit

Revisit this decision if:
1. Users frequently request tool conversion functionality
2. Multiple editors adopt custom tool support (increasing conversion demand)
3. Tool incompatibility becomes a major barrier to package adoption
4. Competitors ship tool conversion features successfully

## Related

- OpenCode integration: `docs/development/adding-opencode-support.md` (to be created)
- Format conversion system: `docs/development/format-conversion.md`
- Quality scoring: Referenced in `packages/converters/` code
