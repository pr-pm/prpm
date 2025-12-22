---
description: Shared types package conventions
paths:
  - "packages/types/**/*.ts"
---

# Types Package Rules

## Purpose

The `@pr-pm/types` package is the single source of truth for all TypeScript types used across the monorepo.

## Type Definition Patterns

### Const Arrays with Derived Types

Always define const arrays alongside union types:

```typescript
// Type definition
export type Format = "cursor" | "claude" | "continue";

// Const array for runtime use
export const FORMATS: readonly Format[] = [
  "cursor",
  "claude",
  "continue",
] as const;
```

### Mapping Types

Use `Record` for format-to-configuration mappings (must include all Format keys):

```typescript
export const FORMAT_SUBTYPES: Record<Format, readonly Subtype[]> = {
  cursor: ["rule", "slash-command", "hooks"],
  claude: ["skill", "agent", "slash-command", "hook"],
  continue: ["rule"],
  windsurf: ["rule"],
  // ... all Format keys required
};
```

### Partial Records

Use `Partial<Record<>>` when not all formats have entries:

```typescript
export const FORMAT_NATIVE_SUBTYPES: Partial<Record<Format, readonly Subtype[]>> = {
  cursor: ["rule"],  // Only formats with native support
  claude: ["skill", "agent"],
};
```

## Type Guards

Provide type guards for union types:

```typescript
export function isMultiPackageManifest(
  manifest: Manifest
): manifest is MultiPackageManifest {
  return "packages" in manifest && Array.isArray(manifest.packages);
}
```

## Building

The types package uses tsup for dual ESM/CJS output:

```bash
tsup src/index.ts --format esm,cjs --dts
```

## Importing in Other Packages

Other packages should always import from `@pr-pm/types`:

```typescript
// Correct
import type { Format, Subtype, CanonicalPackage } from '@pr-pm/types';
import { FORMATS, FORMAT_SUBTYPES } from '@pr-pm/types';

// Wrong - direct import from source
import { Format } from '../../../types/src/package';  // NO!
```

## Adding New Types

When adding new types:
1. Add to the appropriate file in `packages/types/src/`
2. Export from `packages/types/src/index.ts`
3. Rebuild the package: `npm run build -w @pr-pm/types`
4. Update dependent packages if needed
