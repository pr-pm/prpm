---
description: Converter development patterns for format conversion
globs:
  - "packages/converters/**/*.ts"
---

# Converter Package Rules

## Converter Structure

All converters follow the canonical intermediate format pattern:
```
Source Format -> fromX() -> CanonicalPackage -> toY() -> Target Format
```

### From Converter Signature

```typescript
export function fromFormat(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>,
  options?: OptionsType
): CanonicalPackage
```

### To Converter Signature

```typescript
export function toFormat(
  pkg: CanonicalPackage,
  options?: Partial<ConversionOptions & { formatConfig?: FormatConfig }>
): ConversionResult
```

## Quality Scoring Requirements

Every converter MUST implement quality scoring:

1. Start `qualityScore` at 100
2. Decrement for warnings (typically -5 to -10 per issue)
3. Track lossy conversion (when data cannot be represented)
4. Separate validation errors from warnings
5. On error, return quality 0, not throw

```typescript
export function toFormat(pkg: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    // Check for unsupported features
    if (pkg.metadata?.someFeature) {
      warnings.push('Feature X not supported by Format Y');
      qualityScore -= 5;
    }

    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content: result,
      format: 'target-format',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore: Math.max(0, qualityScore),
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'target-format',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}
```

## Security Requirements

All converters handling user-controlled input MUST:

1. Prevent path traversal (`../`)
2. Reject absolute paths (`/etc/passwd`, `C:/`)
3. Sanitize control characters
4. Prevent HTML comment injection

```typescript
// Validate paths before use
if (path.includes('..') || path.startsWith('/') || /^[A-Z]:/i.test(path)) {
  throw new Error('Invalid path');
}
```

## Format Registry Usage

Never hardcode format paths. Use format-registry.json:

```typescript
import { getDestinationDirectory, formatSupportsSubtype } from './format-registry.js';

const destDir = getDestinationDirectory(format, subtype, packageName);
```

## Required Exports in index.ts

When adding a new converter, add exports:

```typescript
export { fromNewFormat, type NewFormatOptions } from './from-new-format.js';
export { toNewFormat, type NewFormatConfig } from './to-new-format.js';
```
