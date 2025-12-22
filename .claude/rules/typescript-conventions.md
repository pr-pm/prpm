---
description: TypeScript conventions for the PRPM monorepo
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Conventions

## ES Module Imports

Always use `.js` extensions in imports (TypeScript compiles to ESM):

```typescript
// Correct
import { toCursor } from './to-cursor.js';
import { validateMarkdown } from '../validation.js';

// Wrong - will fail at runtime
import { toCursor } from './to-cursor';
```

## JSON Imports

Use import assertions for JSON files:

```typescript
import formatRegistryData from "./format-registry.json" with { type: "json" };
```

## Type Imports

Import types from `@pr-pm/types`, never duplicate locally:

```typescript
// Correct
import type { Format, Subtype, CanonicalPackage } from '@pr-pm/types';

// Wrong - duplicating types
type Format = 'cursor' | 'claude';  // NO!
```

## Const Arrays with Type Derivation

Define const arrays alongside types for runtime validation:

```typescript
export type Format = "cursor" | "claude" | "continue";
export const FORMATS: readonly Format[] = ["cursor", "claude", "continue"] as const;
```

## Options Pattern

Use `Partial<T>` with required fields:

```typescript
function convert(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version'>
): ConversionResult
```

## Barrel Exports

Each package must have comprehensive re-exports in `index.ts`:

```typescript
// packages/converters/src/index.ts
export { fromCursor } from './from-cursor.js';
export { toCursor } from './to-cursor.js';
export type { CursorMDCConfig } from './to-cursor.js';
```
