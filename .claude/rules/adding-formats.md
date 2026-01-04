---
description: Checklist for adding new AI format support
paths:
  - "packages/types/src/package.ts"
  - "packages/converters/src/format-registry.json"
  - "packages/converters/src/from-*.ts"
  - "packages/converters/src/to-*.ts"
---

# Adding a New AI Format

When adding a new format (e.g., a new AI coding assistant), ALL of these locations must be updated. Missing any will cause runtime errors or incomplete functionality.

## Required Changes Checklist

### 1. Types Package (`packages/types/src/package.ts`)

```typescript
// Add to Format type
export type Format =
  | "cursor"
  | "claude"
  | "new-format"  // ADD HERE
  | ...;

// Add to FORMATS array (same order as type)
export const FORMATS: readonly Format[] = [
  "cursor",
  "claude",
  "new-format",  // ADD HERE
  ...
] as const;

// Add to FORMAT_SUBTYPES (what can be installed as)
export const FORMAT_SUBTYPES: Record<Format, readonly Subtype[]> = {
  "new-format": ["rule", "skill", "agent"],  // ADD HERE
  ...
};

// Add to FORMAT_NATIVE_SUBTYPES (what has native support)
export const FORMAT_NATIVE_SUBTYPES: Partial<Record<Format, readonly Subtype[]>> = {
  "new-format": ["rule"],  // Only list NATIVE subtypes
  ...
};
```

### 2. Format Registry (`packages/converters/src/format-registry.json`)

```json
{
  "new-format": {
    "name": "New Format",
    "description": "New AI coding assistant",
    "documentationUrl": "https://example.com/docs",
    "subtypes": {
      "rule": {
        "directory": ".new-format/rules",
        "filePatterns": ["*.md"],
        "fileExtension": ".md"
      }
    }
  }
}
```

### 3. Create Converters

- `packages/converters/src/from-new-format.ts` - Parse format to canonical
- `packages/converters/src/to-new-format.ts` - Convert canonical to format

### 4. Export Converters (`packages/converters/src/index.ts`)

```typescript
export { fromNewFormat } from './from-new-format.js';
export { toNewFormat, type NewFormatConfig } from './to-new-format.js';
```

### 5. CLI Format Mappings (`packages/cli/src/commands/install.ts`)

Add format icons/labels if applicable.

### 6. Tests

- Unit tests for from/to converters
- Security tests for user-controlled input
- Roundtrip tests (from -> to -> from)

## Progressive Disclosure

If the format doesn't have native skill/agent support, it uses progressive disclosure:

1. Skills go to `.openskills/` with AGENTS.md reference
2. Agents go to `.openagents/` with AGENTS.md reference
3. The format registry determines native vs progressive
