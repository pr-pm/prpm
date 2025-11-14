# @pr-pm/converters

Format converters for AI prompts - converts between different AI IDE formats and PRPM's canonical format.

## Overview

This package provides:

- **Format Converters** - Convert between Cursor, Claude Code, Continue, Windsurf, Copilot, Kiro, agents.md, and canonical formats
- **JSON Schemas** - Validate package structure for each format
- **Validation System** - Ensure packages match format specifications
- **Documentation** - Comprehensive specs for all supported formats

## Installation

```bash
npm install @pr-pm/converters
```

## Usage

### Converting Formats

```typescript
import { fromCursor, toClaude } from '@pr-pm/converters';

// Parse Cursor .cursor/rules to canonical format
const cursorContent = `---
description: React component standards
globs: ["src/**/*.tsx"]
---

# React Standards

Use functional components with hooks.
`;

const canonical = fromCursor(cursorContent, 'react-standards');

// Convert canonical to Claude format
const claudeResult = toClaude(canonical);
console.log(claudeResult.content);
```

### Validating Packages

```typescript
import { validateMarkdown, formatValidationErrors } from '@pr-pm/converters';

const result = validateMarkdown('cursor', fileContent);

if (!result.valid) {
  console.error(formatValidationErrors(result));
  // Output:
  // Validation Errors:
  //   - /frontmatter/description: must have required property 'description'
}
```

### Supported Conversions

All formats can convert to/from the canonical format:

```
Cursor ←→ Canonical ←→ Claude
Continue ←→ Canonical ←→ Windsurf
Copilot ←→ Canonical ←→ Kiro
agents.md ←→ Canonical
```

## Available Converters

### From Converters (Format → Canonical)

```typescript
import {
  fromCursor,
  fromClaude,
  fromContinue,
  fromWindsurf,
  fromCopilot,
  fromKiro,
  fromAgentsMd,
} from '@pr-pm/converters';
```

### To Converters (Canonical → Format)

```typescript
import {
  toCursor,
  toClaude,
  toContinue,
  toWindsurf,
  toCopilot,
  toKiro,
  toAgentsMd,
} from '@pr-pm/converters';
```

## Validation

### Functions

```typescript
// Validate markdown file with frontmatter
validateMarkdown(format: FormatType, markdown: string): ValidationResult

// Validate structured data
validateFormat(format: FormatType, data: unknown): ValidationResult

// Validate conversion output
validateConversion(
  format: FormatType,
  frontmatter: Record<string, unknown>,
  content: string
): ValidationResult

// Format errors for display
formatValidationErrors(result: ValidationResult): string
```

### Format Types

```typescript
type FormatType =
  | 'cursor'
  | 'claude'
  | 'continue'
  | 'windsurf'
  | 'copilot'
  | 'kiro'
  | 'agents-md'
  | 'canonical';
```

### Validation Result

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];    // Blocking issues
  warnings: ValidationError[];  // Non-blocking suggestions
}

interface ValidationError {
  path: string;      // JSON path to the error
  message: string;   // Human-readable error message
  value?: unknown;   // The invalid value
}
```

## Documentation

### Format Specifications

Detailed documentation for each format is available in [`docs/`](./docs/):

- [Cursor](./docs/cursor.md) - MDC format with YAML frontmatter
- [Claude Code](./docs/claude.md) - Agents, skills, commands, and hooks
- [Continue](./docs/continue.md) - Markdown with globs/regex
- [Windsurf](./docs/windsurf.md) - Plain markdown, 12k limit
- [GitHub Copilot](./docs/copilot.md) - Path-specific instructions
- [Kiro Steering](./docs/kiro.md) - Context-aware instructions
- [Kiro Hooks](./docs/kiro-hooks.md) - Event-driven automations
- [agents.md](./docs/agents-md.md) - OpenAI format

See [docs/README.md](./docs/README.md) for complete format comparison.

### JSON Schemas

All schemas are available in [`schemas/`](./schemas/):

- Base format schemas (cursor, claude, continue, etc.)
- Claude subtypes (skills, agents, commands, hooks)
- Kiro types (steering, hooks)
- Canonical format schema

See [schemas/README.md](./schemas/README.md) for schema documentation.

## Examples

### Round-trip Conversion

```typescript
import { fromCursor, toClaude, fromClaude, toCursor } from '@pr-pm/converters';

// Start with Cursor format
const original = `---
description: Testing standards
---
# Tests
Write tests first.`;

// Convert: Cursor → Canonical → Claude → Canonical → Cursor
const canonical1 = fromCursor(original, 'testing-standards');
const claude = toClaude(canonical1);
const canonical2 = fromClaude(claude.content, 'testing-standards');
const cursor = toCursor(canonical2);

// cursor.content should match original (lossless conversion)
```

### Quality Scoring

Converters return quality scores to indicate conversion fidelity:

```typescript
const result = toCursor(canonical);

console.log(result.qualityScore); // 0-100
console.log(result.lossyConversion); // true if information was lost
console.log(result.warnings); // Array of conversion warnings
```

### Validation in Publish Flow

```typescript
import { validateMarkdown } from '@pr-pm/converters';
import { readFile } from 'fs/promises';

async function validatePackage(filePath: string, format: string) {
  const content = await readFile(filePath, 'utf-8');
  const result = validateMarkdown(format, content);

  if (!result.valid) {
    throw new Error(`Invalid ${format} format:\n${formatValidationErrors(result)}`);
  }

  if (result.warnings.length > 0) {
    console.warn(`Warnings:\n${formatValidationErrors(result)}`);
  }
}
```

## TypeScript

Full TypeScript support with type definitions:

```typescript
import type {
  CanonicalPackage,
  ConversionResult,
  ValidationResult,
  FormatType,
} from '@pr-pm/converters';
```

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test              # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage
```

### Project Structure

```
src/
  from-*.ts           # Format → Canonical converters
  to-*.ts             # Canonical → Format converters
  validation.ts       # Validation system
  types/
    canonical.ts      # TypeScript types
  __tests__/
    from-*.test.ts    # Parser tests
    to-*.test.ts      # Generator tests
    validation.test.ts # Schema validation tests
    roundtrip.test.ts  # Round-trip conversion tests
    cross-format.test.ts # Cross-format conversion tests
docs/
  *.md               # Format specifications
  README.md          # Documentation index
schemas/
  *.schema.json      # JSON Schema definitions
  README.md          # Schema documentation
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

When adding support for a new format:

1. Create format specification in `docs/<format>.md`
2. Create JSON schema in `schemas/<format>.schema.json`
3. Implement parser in `src/from-<format>.ts`
4. Implement generator in `src/to-<format>.ts`
5. Add comprehensive tests
6. Update documentation and READMEs

## License

MIT - See [LICENSE](../../LICENSE) for details.
