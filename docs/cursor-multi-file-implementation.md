# Cursor Multi-File Implementation Plan

## Overview

Enhanced Cursor conversion leveraging native `@file` references to create rich, multi-file packages. This transforms Cursor rules from simple single-file prompts into powerful composable packages.

## Vision

**Current State:**
```
.cursor/rules/typescript.cursorrules
```
Single file, ~200 lines, limited scope.

**Enhanced State:**
```
.cursor/rules/typescript/
├── main.cursorrules          # Main rule with @file references
├── patterns/
│   ├── naming.md             # @patterns/naming.md
│   ├── structure.md          # @patterns/structure.md
│   └── testing.md            # @patterns/testing.md
├── examples/
│   ├── good-api.ts           # @examples/good-api.ts
│   └── bad-api.ts            # @examples/bad-api.ts
└── context/
    ├── architecture.md       # @context/architecture.md
    └── standards.md          # @context/standards.md
```
Multi-file package, composable, maintainable, shareable.

---

## Phase 1: Foundation (Core Support)

### 1.1 Canonical Format Enhancement

**Add FileReference Section Type:**

```typescript
// packages/converters/src/types/canonical.ts

export interface FileReferenceSection {
  type: 'file-reference';
  title: string;
  /** Relative path within the package */
  path: string;
  /** File content */
  content: string;
  /** MIME type or language identifier */
  contentType?: string;
  /** Purpose/category (patterns, examples, context, etc.) */
  category?: 'pattern' | 'example' | 'context' | 'config' | 'data' | 'other';
  /** Optional description */
  description?: string;
}

// Update Section union
export type Section =
  | MetadataSection
  | InstructionsSection
  | RulesSection
  | ExamplesSection
  | ToolsSection
  | PersonaSection
  | ContextSection
  | HookSection
  | CursorHookSection
  | FileReferenceSection  // NEW
  | CustomSection;
```

**Update PackageMetadata:**

```typescript
export interface PackageMetadata {
  // ... existing fields ...

  /** File structure for multi-file packages */
  fileStructure?: {
    /** Main entry file */
    mainFile: string;
    /** Additional files referenced */
    files: Array<{
      path: string;
      category?: string;
      description?: string;
    }>;
    /** Directory structure (for display) */
    directories?: string[];
  };
}
```

### 1.2 Cursor Format Detection Enhancement

**Detect Multi-File Cursor Packages:**

```typescript
// packages/converters/src/cursor-detector.ts

export interface CursorPackageStructure {
  type: 'single-file' | 'multi-file';
  mainFile: string;
  referencedFiles?: string[];
  hasAtReferences?: boolean;
}

/**
 * Detect Cursor package structure
 */
export function detectCursorStructure(basePath: string): CursorPackageStructure {
  const mainFile = findMainCursorFile(basePath);
  const content = readFileSync(mainFile, 'utf-8');

  // Check for @file references
  const atReferences = extractAtReferences(content);

  if (atReferences.length > 0) {
    return {
      type: 'multi-file',
      mainFile,
      referencedFiles: atReferences,
      hasAtReferences: true,
    };
  }

  return {
    type: 'single-file',
    mainFile,
    hasAtReferences: false,
  };
}

/**
 * Extract @file references from content
 * Supports: @filename.ext, @dir/filename.ext, @./relative/path.ext
 */
export function extractAtReferences(content: string): string[] {
  const atRefRegex = /@([\w\-./]+\.\w+)/g;
  const matches = content.matchAll(atRefRegex);
  return Array.from(matches, m => m[1]);
}
```

### 1.3 Enhanced fromCursor Converter

**Support Multi-File Parsing:**

```typescript
// packages/converters/src/from-cursor.ts (enhanced)

export function fromCursor(
  content: string,
  metadata: PackageMetadata,
  options?: {
    basePath?: string;  // NEW: For resolving @file references
    resolveFiles?: boolean;  // NEW: Whether to load referenced files
  }
): CanonicalPackage {
  const sections: Section[] = [];

  // Detect @file references
  const atReferences = extractAtReferences(content);

  if (options?.resolveFiles && atReferences.length > 0 && options.basePath) {
    // Load all referenced files
    const fileRefs = loadReferencedFiles(atReferences, options.basePath);

    // Add file reference sections
    for (const ref of fileRefs) {
      sections.push({
        type: 'file-reference',
        title: ref.path,
        path: ref.path,
        content: ref.content,
        contentType: detectContentType(ref.path),
        category: categorizeFile(ref.path),
        description: ref.description,
      });
    }

    // Update metadata
    metadata.fileStructure = {
      mainFile: 'main.cursorrules',
      files: fileRefs.map(r => ({
        path: r.path,
        category: categorizeFile(r.path),
      })),
      directories: extractDirectories(fileRefs.map(r => r.path)),
    };
  }

  // Add main content as rules section
  sections.push({
    type: 'rules',
    title: 'Main Rules',
    content: content,
  });

  // ... rest of conversion
}

function categorizeFile(path: string): string {
  if (path.includes('/patterns/')) return 'pattern';
  if (path.includes('/examples/')) return 'example';
  if (path.includes('/context/')) return 'context';
  if (path.includes('/config/')) return 'config';
  return 'other';
}
```

### 1.4 Enhanced toCursor Converter

**Generate Multi-File Cursor Packages:**

```typescript
// packages/converters/src/to-cursor.ts (enhanced)

export function toCursor(
  pkg: CanonicalPackage,
  options?: {
    multiFile?: boolean;  // NEW: Generate multi-file structure
    useAtReferences?: boolean;  // NEW: Use @file syntax
  }
): ConversionResult {
  // Check if package has file references
  const fileRefs = pkg.content.sections.filter(
    s => s.type === 'file-reference'
  ) as FileReferenceSection[];

  if (options?.multiFile && fileRefs.length > 0) {
    return generateMultiFileCursor(pkg, fileRefs);
  }

  // Single file conversion (existing logic)
  return generateSingleFileCursor(pkg);
}

function generateMultiFileCursor(
  pkg: CanonicalPackage,
  fileRefs: FileReferenceSection[]
): ConversionResult {
  const files: Array<{ path: string; content: string }> = [];

  // Generate main file with @references
  const mainContent = buildMainCursorFile(pkg, fileRefs);
  files.push({
    path: `${pkg.name}/main.cursorrules`,
    content: mainContent,
  });

  // Generate referenced files
  for (const ref of fileRefs) {
    files.push({
      path: `${pkg.name}/${ref.path}`,
      content: ref.content,
    });
  }

  return {
    content: mainContent,  // Primary content
    files,  // All files for installation
    format: 'cursor',
    warnings: [],
    lossyConversion: false,
    qualityScore: 100,
  };
}

function buildMainCursorFile(
  pkg: CanonicalPackage,
  fileRefs: FileReferenceSection[]
): string {
  const lines: string[] = [];

  // Add package description
  if (pkg.description) {
    lines.push(`# ${pkg.name}`);
    lines.push('');
    lines.push(pkg.description);
    lines.push('');
  }

  // Add @file references by category
  const byCategory = groupBy(fileRefs, r => r.category || 'other');

  if (byCategory.pattern) {
    lines.push('## Patterns');
    for (const ref of byCategory.pattern) {
      lines.push(`@${ref.path}  # ${ref.description || ref.title}`);
    }
    lines.push('');
  }

  if (byCategory.example) {
    lines.push('## Examples');
    for (const ref of byCategory.example) {
      lines.push(`@${ref.path}  # ${ref.description || ref.title}`);
    }
    lines.push('');
  }

  if (byCategory.context) {
    lines.push('## Context');
    for (const ref of byCategory.context) {
      lines.push(`@${ref.path}  # ${ref.description || ref.title}`);
    }
    lines.push('');
  }

  // Add main rules
  const rulesSection = pkg.content.sections.find(s => s.type === 'rules');
  if (rulesSection && rulesSection.type === 'rules') {
    lines.push('## Rules');
    lines.push(rulesSection.content);
  }

  return lines.join('\n');
}
```

---

## Phase 2: CLI & Installation Support

### 2.1 Install Command Enhancement

**Support Multi-File Installation:**

```typescript
// packages/cli/src/commands/install.ts (enhanced)

async function installCursorPackage(
  pkg: CanonicalPackage,
  targetPath: string
): Promise<void> {
  const fileStructure = pkg.metadata?.fileStructure;

  if (fileStructure && fileStructure.files.length > 0) {
    // Multi-file installation
    console.log(`📦 Installing multi-file package: ${pkg.name}`);
    console.log(`   Files: ${fileStructure.files.length + 1}`);

    // Create directory structure
    const packageDir = join(targetPath, pkg.name);
    await mkdir(packageDir, { recursive: true });

    // Install main file
    const mainResult = toCursor(pkg, { multiFile: true });

    if (mainResult.files) {
      for (const file of mainResult.files) {
        const filePath = join(targetPath, file.path);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, file.content);
        console.log(`   ✓ ${file.path}`);
      }
    }
  } else {
    // Single file installation (existing logic)
    installSingleFile(pkg, targetPath);
  }
}
```

### 2.2 Publish Command Enhancement

**Bundle Multi-File Packages:**

```typescript
// packages/cli/src/commands/publish.ts (enhanced)

async function validatePackageStructure(
  pkg: CanonicalPackage
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for multi-file structure
  const fileRefs = pkg.content.sections.filter(
    s => s.type === 'file-reference'
  );

  if (fileRefs.length > 0) {
    console.log(`📁 Multi-file package detected: ${fileRefs.length} files`);

    // Validate all referenced files exist
    for (const ref of fileRefs) {
      if (!ref.content || ref.content.trim().length === 0) {
        errors.push(`Referenced file empty: ${ref.path}`);
      }
    }

    // Validate file structure
    if (!pkg.metadata?.fileStructure) {
      warnings.push('Multi-file package missing fileStructure metadata');
    }
  }

  return { errors, warnings };
}
```

---

## Phase 3: Cross-Format Conversion

### 3.1 File References → Other Formats

**Convert to Claude Skills:**

```typescript
// packages/converters/src/cross-converters/cursor-to-claude.ts

export function cursorToClaudeSkill(pkg: CanonicalPackage): ConversionResult {
  const fileRefs = pkg.content.sections.filter(
    s => s.type === 'file-reference'
  ) as FileReferenceSection[];

  if (fileRefs.length === 0) {
    // Simple conversion (existing logic)
    return simpleConversion(pkg);
  }

  // Multi-file Cursor → Claude skill with multiple sections
  const sections: Section[] = [];

  // Group files by category
  const patterns = fileRefs.filter(r => r.category === 'pattern');
  const examples = fileRefs.filter(r => r.category === 'example');
  const context = fileRefs.filter(r => r.category === 'context');

  // Convert patterns to rules section
  if (patterns.length > 0) {
    sections.push({
      type: 'rules',
      title: 'Patterns',
      content: patterns.map(p => p.content).join('\n\n---\n\n'),
    });
  }

  // Convert examples to examples section
  if (examples.length > 0) {
    sections.push({
      type: 'examples',
      title: 'Examples',
      content: examples.map(e => e.content).join('\n\n---\n\n'),
    });
  }

  // Convert context to context section
  if (context.length > 0) {
    sections.push({
      type: 'context',
      title: 'Context',
      content: context.map(c => c.content).join('\n\n---\n\n'),
    });
  }

  return {
    claudePackage: {
      ...pkg,
      format: 'claude',
      subtype: 'skill',
      content: {
        format: 'canonical',
        version: '1.0',
        sections,
      },
    },
    warnings: [],
    lossyConversion: false,
    qualityScore: 95,
  };
}
```

**Convert to Gemini Extension:**

```typescript
// packages/converters/src/cross-converters/cursor-to-gemini.ts

export function cursorToGeminiExtension(pkg: CanonicalPackage): ConversionResult {
  const fileRefs = pkg.content.sections.filter(
    s => s.type === 'file-reference'
  ) as FileReferenceSection[];

  // Combine all context files into single contextFileName
  const contextFiles = fileRefs.filter(r => r.category === 'context');
  const contextContent = contextFiles.map(c => c.content).join('\n\n---\n\n');

  const geminiConfig: GeminiExtensionConfig = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    contextFileName: contextFiles.length > 0 ? 'context.md' : undefined,
  };

  const sections: Section[] = [
    {
      type: 'metadata',
      data: {
        title: pkg.name,
        description: pkg.description || '',
        geminiExtension: geminiConfig,
      },
    },
  ];

  if (contextContent) {
    sections.push({
      type: 'context',
      title: 'Extension Context',
      content: contextContent,
    });
  }

  return {
    geminiPackage: {
      ...pkg,
      format: 'gemini',
      subtype: 'extension',
      content: {
        format: 'canonical',
        version: '1.0',
        sections,
      },
    },
    warnings: ['Multi-file Cursor structure flattened into single context file'],
    lossyConversion: true,
    qualityScore: 75,
  };
}
```

---

## Phase 4: Package Templates & Examples

### 4.1 Package Template Generator

**CLI Command:**

```bash
prpm init cursor-multi-file
```

**Generated Structure:**

```
.cursor/rules/my-rule/
├── main.cursorrules
├── patterns/
│   └── .gitkeep
├── examples/
│   └── .gitkeep
└── context/
    └── .gitkeep
```

**Template Files:**

```typescript
// packages/cli/src/templates/cursor-multi-file.ts

export const cursorMultiFileTemplate = {
  'main.cursorrules': `# {{packageName}}

{{description}}

## Patterns
@patterns/naming.md  # Naming conventions
@patterns/structure.md  # Code structure patterns

## Examples
@examples/good.ts  # Good example
@examples/bad.ts  # Anti-patterns

## Context
@context/architecture.md  # Architecture overview

## Rules

Follow the patterns and examples above. Apply these principles:

1. **Naming**: Use clear, descriptive names (see @patterns/naming.md)
2. **Structure**: Maintain consistent organization (see @patterns/structure.md)
3. **Examples**: Reference good examples, avoid anti-patterns

When implementing features:
- Review @examples/good.ts for best practices
- Check @context/architecture.md for system design
- Follow all patterns consistently
`,

  'patterns/naming.md': `# Naming Conventions

## Variables
- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use SCREAMING_SNAKE_CASE for constants

## Files
- Use kebab-case for file names
- Match file name to primary export

## Examples
\`\`\`typescript
// Good
const userName = 'Alice';
class UserService {}
const MAX_RETRIES = 3;

// Bad
const user_name = 'Alice';
class userService {}
const maxRetries = 3;
\`\`\`
`,

  'patterns/structure.md': `# Code Structure

## File Organization
\`\`\`
src/
├── components/     # React components
├── services/       # Business logic
├── utils/          # Utility functions
└── types/          # TypeScript types
\`\`\`

## Component Structure
\`\`\`typescript
// imports
// types
// component
// styles
\`\`\`
`,

  'examples/good.ts': `// Good Example: Well-structured component

import React from 'react';

interface UserCardProps {
  name: string;
  email: string;
}

export function UserCard({ name, email }: UserCardProps) {
  return (
    <div className="user-card">
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
}
`,

  'examples/bad.ts': `// Bad Example: Anti-patterns

import React from 'react';

// ❌ No type safety
export function UserCard(props) {
  // ❌ Unclear variable names
  const n = props.name;
  const e = props.email;

  // ❌ Inline styles, no separation of concerns
  return (
    <div style={{ padding: '10px', border: '1px solid black' }}>
      <h3>{n}</h3>
      <p>{e}</p>
    </div>
  );
}
`,

  'context/architecture.md': `# Architecture Overview

This project uses a layered architecture:

1. **Presentation Layer**: React components
2. **Business Logic**: Services and hooks
3. **Data Layer**: API clients and state management

## Key Principles
- Separation of concerns
- Single responsibility
- DRY (Don't Repeat Yourself)
`,
};
```

### 4.2 Real-World Example Packages

**Example 1: TypeScript Best Practices**

```
typescript-best-practices/
├── main.cursorrules
├── patterns/
│   ├── types.md              # Type patterns
│   ├── generics.md           # Generic usage
│   └── async.md              # Async patterns
├── examples/
│   ├── good-types.ts
│   ├── bad-types.ts
│   ├── good-async.ts
│   └── bad-async.ts
└── context/
    └── typescript-config.md
```

**Example 2: React Component Library**

```
react-components/
├── main.cursorrules
├── patterns/
│   ├── component-structure.md
│   ├── hooks-usage.md
│   └── testing-patterns.md
├── examples/
│   ├── button-component.tsx
│   ├── form-component.tsx
│   └── list-component.tsx
└── context/
    ├── design-system.md
    └── accessibility.md
```

**Example 3: API Development**

```
api-development/
├── main.cursorrules
├── patterns/
│   ├── rest-api.md
│   ├── error-handling.md
│   └── validation.md
├── examples/
│   ├── good-endpoint.ts
│   ├── bad-endpoint.ts
│   ├── good-error-handling.ts
│   └── good-validation.ts
└── context/
    ├── api-design.md
    └── security.md
```

---

## Phase 5: Testing & Quality

### 5.1 Test Coverage

**Unit Tests:**
```typescript
// packages/converters/src/__tests__/cursor-multi-file.test.ts

describe('Cursor Multi-File Support', () => {
  it('should detect @file references', () => {
    const content = '@patterns/naming.md\n@examples/good.ts';
    const refs = extractAtReferences(content);
    expect(refs).toEqual(['patterns/naming.md', 'examples/good.ts']);
  });

  it('should load referenced files', () => {
    // Test file loading logic
  });

  it('should generate multi-file structure', () => {
    // Test conversion to multi-file
  });

  it('should preserve file references in roundtrip', () => {
    // Test roundtrip conversion
  });
});
```

### 5.2 Integration Tests

**End-to-End Flow:**
```typescript
describe('Multi-File Package Installation', () => {
  it('should install multi-file Cursor package correctly', async () => {
    // 1. Create test package with file references
    // 2. Publish to test registry
    // 3. Install to test directory
    // 4. Verify all files created
    // 5. Verify @references work in Cursor
  });
});
```

---

## Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Add FileReferenceSection to canonical types
- [ ] Update PackageMetadata with fileStructure
- [ ] Implement extractAtReferences function
- [ ] Enhance fromCursor with file resolution
- [ ] Enhance toCursor with multi-file generation
- [ ] Write unit tests (20+ tests)

### Phase 2: CLI Support ✅
- [ ] Update install command for multi-file
- [ ] Update publish command validation
- [ ] Add progress indicators for multi-file ops
- [ ] Write CLI integration tests

### Phase 3: Cross-Format ✅
- [ ] Implement cursor-to-claude converter
- [ ] Implement cursor-to-gemini converter
- [ ] Add quality scoring for conversions
- [ ] Write conversion tests (15+ tests)

### Phase 4: Templates & Examples ✅
- [ ] Create multi-file template generator
- [ ] Build 3 example packages
- [ ] Add template CLI command
- [ ] Document template usage

### Phase 5: Testing & Documentation ✅
- [ ] Achieve 90%+ test coverage
- [ ] Write user documentation
- [ ] Create video tutorial
- [ ] Publish example packages

---

## Success Metrics

1. **Adoption**: 50+ multi-file Cursor packages published in first month
2. **Quality**: Average quality score of 90+ for conversions
3. **Complexity**: Support packages with 10+ files
4. **Performance**: Install 20-file package in <2 seconds
5. **Roundtrip**: 95%+ fidelity for Cursor → Canonical → Cursor

---

## Future Enhancements

1. **Smart File Categorization**: AI-powered automatic categorization
2. **Dependency Resolution**: Handle @file references between packages
3. **Visual Editor**: GUI for managing multi-file structures
4. **Hot Reloading**: Live reload when referenced files change
5. **Package Analytics**: Track which files are most referenced
6. **Template Marketplace**: Community-contributed templates

---

## Technical Debt & Risks

### Risks
1. **Cursor API Changes**: @file syntax could change
2. **Performance**: Large packages with many files
3. **Compatibility**: Different Cursor versions
4. **Complexity**: Users may find multi-file confusing

### Mitigation
1. Monitor Cursor changelog, version detection
2. Lazy loading, caching, chunking
3. Version compatibility matrix, fallbacks
4. Excellent docs, templates, examples

---

## Timeline Estimate

- **Phase 1 (Foundation)**: 2-3 days
- **Phase 2 (CLI Support)**: 1-2 days
- **Phase 3 (Cross-Format)**: 2-3 days
- **Phase 4 (Templates)**: 1-2 days
- **Phase 5 (Testing)**: 2-3 days

**Total**: 8-13 days (1.5-2.5 weeks)

With current Phase 2A complete, we can start this immediately or bundle it into Phase 2B!
