---
name: adding-new-ai-format
description: Step-by-step guide for adding support for a new AI editor format to PRPM - covers types, converters, schemas, CLI, webapp, and testing
---

# Adding a New AI Format to PRPM

Complete process for adding support for a new AI editor format (like OpenCode, Cursor, Claude, etc.) to PRPM.

## Overview

This skill documents the systematic process for adding a new AI format to PRPM, based on the OpenCode integration. Follow these steps in order to ensure complete integration across all packages.

## Prerequisites

- Format documentation (understand file structure, frontmatter, directory conventions)
- Example files from the format
- Understanding of format-specific features (tools, agents, commands, etc.)

## Step 1: Types Package (`packages/types/`)

**File**: `src/package.ts`

Add the format to the Format type and FORMATS array:

```typescript
export type Format =
  | 'cursor'
  | 'claude'
  | 'continue'
  | 'windsurf'
  | 'copilot'
  | 'kiro'
  | 'agents.md'
  | 'gemini.md'
  | 'claude.md'
  | 'gemini'
  | 'opencode'  // Add new format here
  | 'ruler'
  | 'generic'
  | 'mcp';

export const FORMATS: readonly Format[] = [
  'cursor',
  'claude',
  // ... other formats
  'opencode',  // Add here too
  'ruler',
  'generic',
  'mcp',
] as const;
```

**Build and verify**:
```bash
npm run build --workspace=@pr-pm/types
```

## Step 2: Converters Package - Schema (`packages/converters/schemas/`)

Create JSON schema file: `{format}.schema.json`

Example structure:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://prpm.dev/schemas/opencode.schema.json",
  "title": "OpenCode Agent Format",
  "description": "JSON Schema for OpenCode Agents",
  "type": "object",
  "required": ["frontmatter", "content"],
  "properties": {
    "frontmatter": {
      "type": "object",
      "required": ["description"],
      "properties": {
        "description": { "type": "string" },
        // Format-specific fields
      }
    },
    "content": {
      "type": "string",
      "description": "Body content as markdown"
    }
  }
}
```

## Step 3: Converters Package - Canonical Types

**File**: `packages/converters/src/types/canonical.ts`

### 3a. Add format to CanonicalPackage.format union:

```typescript
format: 'cursor' | 'claude' | ... | 'opencode' | 'ruler' | 'generic' | 'mcp';
```

### 3b. Add format-specific metadata (if needed):

```typescript
// In CanonicalPackage.metadata
metadata?: {
  // ... existing configs
  opencode?: {
    mode?: 'subagent' | 'primary' | 'all';
    model?: string;
    temperature?: number;
    permission?: Record<string, any>;
    disable?: boolean;
  };
};
```

### 3c. Add to MetadataSection.data (if storing format-specific data):

```typescript
export interface MetadataSection {
  type: 'metadata';
  data: {
    title: string;
    description: string;
    // ... existing fields
    opencode?: {
      // Same structure as above
    };
  };
}
```

### 3d. Add to formatScores and sourceFormat:

```typescript
formatScores?: {
  cursor?: number;
  // ... others
  opencode?: number;
};

sourceFormat?: 'cursor' | 'claude' | ... | 'opencode' | ... | 'generic';
```

## Step 4: Converters Package - From Converter

**File**: `packages/converters/src/from-{format}.ts`

Create converter that parses format → canonical:

```typescript
import type {
  CanonicalPackage,
  PackageMetadata,
  Section,
  MetadataSection,
  ToolsSection,
} from './types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';
import yaml from 'js-yaml';  // If using YAML frontmatter

// Define format-specific interfaces
interface FormatFrontmatter {
  // Format-specific frontmatter structure
}

// Parse frontmatter if needed
function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  body: string
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter = yaml.load(match[1]) as Record<string, any>;
  const body = match[2];

  return { frontmatter, body };
}

export function fromFormat(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  const { frontmatter, body } = parseFrontmatter(content);
  const fm = frontmatter as FormatFrontmatter;

  const sections: Section[] = [];

  // 1. Create metadata section
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: metadata.name || metadata.id,
      description: fm.description || metadata.description || '',
      version: metadata.version || '1.0.0',
      author: metadata.author,
    },
  };

  // Store format-specific data for roundtrip
  if (/* has format-specific fields */) {
    metadataSection.data.formatName = {
      // Format-specific data
    };
  }

  sections.push(metadataSection);

  // 2. Extract tools (if applicable)
  if (fm.tools) {
    const enabledTools = Object.entries(fm.tools)
      .filter(([_, enabled]) => enabled === true)
      .map(([tool, _]) => {
        // Normalize tool names to canonical format
        return normalizeToolName(tool);
      });

    if (enabledTools.length > 0) {
      sections.push({
        type: 'tools',
        tools: enabledTools,
      });
    }
  }

  // 3. Add body as instructions
  if (body.trim()) {
    sections.push({
      type: 'instructions',
      title: 'Instructions',
      content: body.trim(),
    });
  }

  // 4. Build canonical package
  const canonicalContent: CanonicalPackage['content'] = {
    format: 'canonical',
    version: '1.0',
    sections
  };

  const pkg: CanonicalPackage = {
    ...metadata,
    id: metadata.id,
    name: metadata.name || metadata.id,
    version: metadata.version,
    author: metadata.author,
    description: metadata.description || fm.description || '',
    tags: metadata.tags || [],
    format: 'formatname',
    subtype: 'agent', // Or detect from content
    content: canonicalContent,
  };

  setTaxonomy(pkg, 'formatname', 'agent');
  return pkg;
}
```

**Key points**:
- Import yaml if format uses YAML frontmatter
- Extract all format-specific metadata for roundtrip conversion
- Normalize tool names to canonical format (Write, Edit, Bash, etc.)
- Always include `format: 'canonical'` and `version: '1.0'` in content
- InstructionsSection requires `title` field
- Call `setTaxonomy()` before returning

## Step 5: Converters Package - To Converter

**File**: `packages/converters/src/to-{format}.ts`

Create converter that converts canonical → format:

```typescript
import type {
  CanonicalPackage,
  ConversionResult,
} from './types/canonical.js';
import yaml from 'js-yaml';

export function toFormat(pkg: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const content = convertContent(pkg, warnings);

    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content,
      format: 'formatname',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'formatname',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

function convertContent(pkg: CanonicalPackage, warnings: string[]): string {
  const lines: string[] = [];

  // Extract sections
  const metadata = pkg.content.sections.find(s => s.type === 'metadata');
  const tools = pkg.content.sections.find(s => s.type === 'tools');
  const instructions = pkg.content.sections.find(s => s.type === 'instructions');

  // Build frontmatter
  const frontmatter: Record<string, any> = {};

  if (metadata?.type === 'metadata') {
    frontmatter.description = metadata.data.description;
  }

  // Restore format-specific metadata (for roundtrip)
  const formatData = metadata?.type === 'metadata' ? metadata.data.formatName : undefined;
  if (formatData) {
    Object.assign(frontmatter, formatData);
  }

  // Convert tools
  if (tools?.type === 'tools' && tools.tools.length > 0) {
    frontmatter.tools = convertToolsToFormatStructure(tools.tools);
  }

  // Generate YAML frontmatter (if applicable)
  lines.push('---');
  lines.push(yaml.dump(frontmatter, { indent: 2, lineWidth: -1 }).trim());
  lines.push('---');
  lines.push('');

  // Add body content
  if (instructions?.type === 'instructions') {
    lines.push(instructions.content);
  }

  return lines.join('\n').trim() + '\n';
}
```

**Section type handling**:
- **PersonaSection**: `section.data.role` (NOT `section.content`)
- **RulesSection**: `section.items` (NOT `section.rules`), each item has `rule.content`
- **InstructionsSection**: `section.content` and `section.title`
- **ExamplesSection**: `section.examples` array with `description` and `code`

## Step 6: Converters Package - Exports and Validation

**File**: `packages/converters/src/index.ts`

Add to exports:
```typescript
// From converters
export { fromFormat } from './from-format.js';

// To converters
export { toFormat } from './to-format.js';
```

**File**: `packages/converters/src/validation.ts`

Add to FormatType:
```typescript
export type FormatType =
  | 'cursor'
  | 'claude'
  // ... others
  | 'opencode'
  | 'canonical';
```

Add to schema map:
```typescript
const schemaMap: Record<FormatType, string> = {
  'cursor': 'cursor.schema.json',
  // ... others
  'opencode': 'opencode.schema.json',
  'canonical': 'canonical.schema.json',
};
```

**File**: `packages/converters/src/taxonomy-utils.ts`

Add to Format type:
```typescript
export type Format = 'cursor' | 'claude' | ... | 'opencode' | ... | 'mcp';
```

Add to normalizeFormat:
```typescript
export function normalizeFormat(sourceFormat: string): Format {
  const normalized = sourceFormat.toLowerCase();

  if (normalized.includes('cursor')) return 'cursor';
  // ... others
  if (normalized.includes('opencode')) return 'opencode';

  return 'generic';
}
```

**Build converters**:
```bash
npm run build --workspace=@pr-pm/converters
```

## Step 7: CLI Package - Filesystem

**File**: `packages/cli/src/core/filesystem.ts`

### 7a. Add to getDestinationDir:

```typescript
export function getDestinationDir(format: Format, subtype: Subtype, name?: string): string {
  const packageName = stripAuthorNamespace(name);

  switch (format) {
    // ... existing cases

    case 'opencode':
      // OpenCode supports agents, slash commands, and custom tools
      // Agents: .opencode/agent/*.md
      // Commands: .opencode/command/*.md
      // Tools: .opencode/tool/*.ts or *.js
      if (subtype === 'agent') return '.opencode/agent';
      if (subtype === 'slash-command') return '.opencode/command';
      if (subtype === 'tool') return '.opencode/tool';
      return '.opencode/agent';  // Default

    // ... rest
  }
}
```

### 7b. Add to autoDetectFormat:

```typescript
const formatDirs: Array<{ format: Format; dir: string }> = [
  { format: 'cursor', dir: '.cursor' },
  // ... others
  { format: 'opencode', dir: '.opencode' },
  { format: 'agents.md', dir: '.agents' },
];
```

## Step 8: CLI Package - Format Mappings

**Files**: `packages/cli/src/commands/search.ts` and `packages/cli/src/commands/install.ts`

Add to both files:

### 8a. formatIcons:

```typescript
const formatIcons: Record<Format, string> = {
  'claude': '🤖',
  'cursor': '📋',
  // ... others
  'opencode': '⚡',  // Choose appropriate emoji
  'gemini.md': '✨',  // Don't forget format aliases
  'claude.md': '🤖',
  'ruler': '📏',
  'generic': '📦',
};
```

### 8b. formatLabels:

```typescript
const formatLabels: Record<Format, string> = {
  'claude': 'Claude',
  'cursor': 'Cursor',
  // ... others
  'opencode': 'OpenCode',
  'gemini.md': 'Gemini',  // Format aliases
  'claude.md': 'Claude',
  'ruler': 'Ruler',
  'generic': '',
};
```

## Step 9: Webapp - Format Subtypes

**File**: `packages/webapp/src/app/(app)/search/SearchClient.tsx`

Add to FORMAT_SUBTYPES:

```typescript
const FORMAT_SUBTYPES: Record<Format, Subtype[]> = {
  'cursor': ['rule', 'agent', 'slash-command', 'tool'],
  'claude': ['skill', 'agent', 'slash-command', 'tool', 'hook'],
  'claude.md': ['agent'],  // Format aliases
  'gemini.md': ['slash-command'],
  // ... others
  'opencode': ['agent', 'slash-command', 'tool'],  // List all supported subtypes
  'ruler': ['rule', 'agent', 'tool'],
  'generic': ['rule', 'agent', 'skill', 'slash-command', 'tool', 'chatmode', 'hook'],
};
```

## Step 10: Testing and Validation

### 10a. Run typecheck:
```bash
npm run typecheck
```

Fix any TypeScript errors:
- Missing format in type unions
- Format aliases ('gemini.md', 'claude.md')
- Section structure (use correct field names)

### 10b. Build all packages:
```bash
npm run build
```

### 10c. Run converter tests:
```bash
npm test --workspace=@pr-pm/converters
```

### 10d. Create test fixtures (recommended):
```typescript
// packages/converters/src/__tests__/opencode.test.ts
describe('OpenCode Format', () => {
  it('should convert from OpenCode to canonical', () => {
    const opencodeContent = `---
description: Test agent
mode: subagent
---
Test instructions`;

    const result = fromOpencode(opencodeContent, {
      id: 'test',
      name: 'test',
      version: '1.0.0',
      author: 'test',
    });

    expect(result.format).toBe('opencode');
    expect(result.subtype).toBe('agent');
  });

  it('should convert canonical to OpenCode', () => {
    const canonical: CanonicalPackage = {
      // ... build test package
    };

    const result = toOpencode(canonical);
    expect(result.format).toBe('opencode');
    expect(result.content).toContain('---');
  });
});
```

## Step 11: Documentation

Create documentation at appropriate location:
- User-facing: Add to Mintlify docs or README
- Internal: Add notes to `docs/development/` if needed
- Decision logs: Document any architectural decisions in `docs/decisions/`

## Common Pitfalls

### 1. Missing Format Aliases
Formats like 'gemini.md' and 'claude.md' are aliases that MUST be included in all format mappings.

### 2. Incorrect Section Structure
- PersonaSection uses `data.role`, not `content`
- RulesSection uses `items`, not `rules`
- InstructionsSection requires `title` field
- Each Rule has `content`, not `description`

### 3. CanonicalContent Requirements
Must always include:
```typescript
{
  format: 'canonical',
  version: '1.0',
  sections: [...]
}
```

### 4. setTaxonomy Signature
```typescript
setTaxonomy(pkg, 'formatname', 'subtype');  // Returns void
return pkg;  // Return the package separately
```

### 5. Tool Name Normalization
Map format-specific tool names to canonical:
- `write` → `Write`
- `edit` → `Edit`
- `bash` → `Bash`

### 6. YAML Import
If using YAML frontmatter:
```typescript
import yaml from 'js-yaml';  // Top-level import
// NOT: const yaml = await import('js-yaml');
```

## Checklist

Before submitting:

- [ ] Added format to types/src/package.ts (Format type and FORMATS array)
- [ ] Created schema file in converters/schemas/
- [ ] Updated converters/src/types/canonical.ts (all 4 places: format union, metadata, MetadataSection.data, formatScores, sourceFormat)
- [ ] Created from-{format}.ts converter
- [ ] Created to-{format}.ts converter
- [ ] Updated converters/src/index.ts exports
- [ ] Updated converters/src/validation.ts (FormatType and schemaMap)
- [ ] Updated converters/src/taxonomy-utils.ts (Format type and normalizeFormat)
- [ ] Updated cli/src/core/filesystem.ts (getDestinationDir and autoDetectFormat)
- [ ] Updated cli/src/commands/search.ts (formatIcons and formatLabels, including aliases)
- [ ] Updated cli/src/commands/install.ts (formatIcons and formatLabels, including aliases)
- [ ] Updated webapp SearchClient.tsx (FORMAT_SUBTYPES, including aliases)
- [ ] Ran typecheck successfully
- [ ] Built all packages successfully
- [ ] Wrote tests for converters
- [ ] Documented the integration

## Example: OpenCode Integration

See the following files for reference:
- `packages/converters/src/from-opencode.ts`
- `packages/converters/src/to-opencode.ts`
- `packages/converters/schemas/opencode.schema.json`
- Git commit history for the OpenCode integration PR

## Summary

Adding a new format requires changes across 5 packages:
1. **types** - Add to Format type
2. **converters** - Schema, from/to converters, canonical types, validation, taxonomy
3. **cli** - Filesystem and format mappings
4. **webapp** - Format subtypes
5. **tests** - Verify everything works

Follow the steps systematically, use existing format implementations as reference, and always run typecheck and tests before submitting.
