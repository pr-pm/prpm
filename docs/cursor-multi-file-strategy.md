# Cursor Multi-File Package Strategy

## Discovery: Cursor's @file Reference Support

**Cursor DOES support @file references in rules!**

From official Cursor documentation:
- Use `@filename.ts` to include files in your rule's context
- Referenced files are included as additional context when the rule triggers
- You can chain multiple rules together using @file references

**Example from Cursor docs:**
```markdown
---
description: API service template
---

# API Service Pattern

Follow the pattern in the template:

@service-template.ts
```

This changes EVERYTHING for multi-file packages in Cursor!

---

## PRPM Multi-File Package Strategy

### Approach 1: Native @file References (PREFERRED)

When installing a multi-file package to Cursor, create actual separate files and use @file references.

#### Example: Installing a Claude Skill with Examples as Cursor Rule

**Source Package Structure (Claude):**
```
.claude/skills/api-patterns/
├── SKILL.md (main instructions)
├── examples/
│   ├── client.ts
│   ├── client.test.ts
│   └── error-handling.ts
```

**Installed to Cursor:**
```
.cursor/rules/
├── api-patterns.mdc (main rule)
└── api-patterns/
    ├── client-example.ts
    ├── client-test-example.ts
    └── error-handling-example.ts
```

**Contents of `.cursor/rules/api-patterns.mdc`:**
```markdown
---
description: API client patterns with examples
---

# API Client Patterns

Follow the patterns shown in the example files.

## Client Implementation

See the client implementation pattern:

@api-patterns/client-example.ts

## Testing Pattern

Follow this testing approach:

@api-patterns/client-test-example.ts

## Error Handling

Proper error handling example:

@api-patterns/error-handling-example.ts

## Guidelines

1. Use the client pattern for all API interactions
2. Follow the testing structure shown in the test example
3. Always implement error handling as demonstrated
```

**Benefits:**
- ✅ Uses Cursor's native @file feature
- ✅ Files can be syntax-highlighted in IDE
- ✅ Files can be edited independently
- ✅ Most flexible for users
- ✅ Cursor can intelligently include context

---

### Approach 2: Embedded File Sections (FALLBACK)

For backward compatibility or when @file references aren't suitable, embed files directly.

**Same package embedded:**
```markdown
---
description: API client patterns with examples
---

# API Client Patterns

Follow the patterns shown in the example files.

## 📁 Included Files

### client-example.ts

Client implementation pattern

\`\`\`typescript
export class APIClient {
  constructor(private baseUrl: string) {}

  async fetch(endpoint: string) {
    try {
      const response = await fetch(\`\${this.baseUrl}/\${endpoint}\`);
      if (!response.ok) {
        throw new APIError(\`HTTP \${response.status}\`, response);
      }
      return await response.json();
    } catch (error) {
      throw new APIError('Fetch failed', error);
    }
  }
}
\`\`\`

### client-test-example.ts

Testing pattern

\`\`\`typescript
describe('APIClient', () => {
  it('should fetch data successfully', async () => {
    const client = new APIClient('https://api.example.com');
    const data = await client.fetch('users');
    expect(data).toBeDefined();
  });

  it('should handle errors', async () => {
    const client = new APIClient('https://api.example.com');
    await expect(client.fetch('invalid')).rejects.toThrow(APIError);
  });
});
\`\`\`

### error-handling-example.ts

Error handling

\`\`\`typescript
export class APIError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'APIError';
  }
}
\`\`\`
```

**When to use embedded:**
- User explicitly requests single-file installation
- Target environment doesn't support companion files
- Package has many small code snippets (< 20 lines each)

---

## Implementation in PRPM

### Canonical Format Extension

Add a new section type to support multi-file packages:

```typescript
export interface FileReferenceSection {
  type: 'file-references';
  files: Array<{
    path: string;           // Relative path: "examples/client.ts"
    content: string;        // Actual file content
    description?: string;   // Optional description
    language?: string;      // File language/extension hint
  }>;
}
```

**Why separate from existing sections?**
- Clear intent: these are companion files, not inline examples
- Conversion logic can choose between @file references vs embedding
- Preserves file structure information

---

### Converter Updates

#### from-cursor.ts

Detect both @file references AND embedded files:

```typescript
export function fromCursor(content: string, metadata: PackageMetadata): CanonicalPackage {
  const { frontmatter, body } = parseFrontmatter(content);

  // Extract @file references
  const fileReferences = extractFileReferences(body);

  // Extract embedded files (📁 sections)
  const embeddedFiles = extractEmbeddedFiles(body);

  const sections: Section[] = [];

  // Add file references section if found
  if (fileReferences.length > 0 || embeddedFiles.length > 0) {
    sections.push({
      type: 'file-references',
      files: [...fileReferences, ...embeddedFiles],
    });
  }

  // ... rest of conversion
}

function extractFileReferences(markdown: string): FileReference[] {
  const references: FileReference[] = [];
  const regex = /@([\w\-\/\.]+\.\w+)/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    references.push({
      path: match[1],
      content: '', // Will be populated during install if files exist
      description: extractContextAroundReference(markdown, match.index),
    });
  }

  return references;
}

function extractEmbeddedFiles(markdown: string): FileReference[] {
  const files: FileReference[] = [];
  const sectionRegex = /###\s+(.+?)\n\n(?:(.+?)\n\n)?```(\w+)?\n([\s\S]+?)```/g;
  let match;

  while ((match = sectionRegex.exec(markdown)) !== null) {
    files.push({
      path: match[1].trim(),
      description: match[2]?.trim(),
      language: match[3],
      content: match[4].trim(),
    });
  }

  return files;
}
```

#### to-cursor.ts

Generate @file references OR embedded files based on options:

```typescript
export function toCursor(
  pkg: CanonicalPackage,
  options?: {
    embedFiles?: boolean  // Default: false (use @file references)
  }
): ConversionResult {
  const fileRefSection = pkg.content.sections.find(s => s.type === 'file-references');

  if (fileRefSection && fileRefSection.type === 'file-references') {
    if (options?.embedFiles) {
      // Generate embedded file sections
      content += generateEmbeddedFiles(fileRefSection.files);
    } else {
      // Generate @file references (PREFERRED)
      content += generateFileReferences(fileRefSection.files);
    }
  }

  return {
    content,
    format: 'cursor',
    // Return companion files for installation
    companionFiles: fileRefSection?.files.map(f => ({
      path: f.path,
      content: f.content,
    })),
  };
}

function generateFileReferences(files: FileReference[]): string {
  const lines: string[] = [];

  for (const file of files) {
    if (file.description) {
      lines.push(`## ${file.description}\n`);
    }
    lines.push(`@${file.path}\n`);
  }

  return lines.join('\n');
}

function generateEmbeddedFiles(files: FileReference[]): string {
  const lines: string[] = ['## 📁 Included Files\n'];

  for (const file of files) {
    lines.push(`### ${file.path}\n`);
    if (file.description) {
      lines.push(`${file.description}\n\n`);
    }
    const ext = file.language || file.path.split('.').pop() || '';
    lines.push(`\`\`\`${ext}\n${file.content}\n\`\`\`\n\n`);
  }

  return lines.join('');
}
```

---

### CLI Install Command Updates

When installing with companion files:

```typescript
// packages/cli/src/commands/install.ts

async function installCursorRule(pkg: CanonicalPackage, options: InstallOptions) {
  const result = toCursor(pkg, { embedFiles: options.embedFiles });

  // Install main rule file
  const mainPath = `.cursor/rules/${pkg.name}.mdc`;
  await saveFile(mainPath, result.content);

  // Install companion files if using @file references
  if (!options.embedFiles && result.companionFiles) {
    const companionDir = `.cursor/rules/${pkg.name}`;
    await ensureDirectoryExists(companionDir);

    for (const file of result.companionFiles) {
      const filePath = path.join(companionDir, file.path);
      await ensureDirectoryExists(path.dirname(filePath));
      await saveFile(filePath, file.content);
    }

    console.log(`✓ Installed rule with ${result.companionFiles.length} companion files`);
  }
}
```

**CLI Flags:**

```bash
# Install with @file references (default)
prpm install @user/api-patterns --as cursor

# Install with embedded files
prpm install @user/api-patterns --as cursor --embed-files

# Result:
# .cursor/rules/api-patterns.mdc (with @file references)
# .cursor/rules/api-patterns/
#   ├── client-example.ts
#   ├── client-test-example.ts
#   └── error-handling-example.ts
```

---

## Cross-Format File Reference Mapping

| Source Format | File Support | PRPM Strategy |
|---------------|-------------|---------------|
| **Cursor** | `@file` references | Extract → FileReferenceSection |
| **Claude** | Skills/agents in subdirs | Multi-file → FileReferenceSection |
| **Gemini** | Context files | Single → inline, multiple → FileReferenceSection |
| **Continue** | Single rules | Embed if converting FROM multi-file |
| **Windsurf** | Single rules | Embed if converting FROM multi-file |

### Example: Claude Skill → Cursor Rule

**Source: `.claude/skills/database-patterns/SKILL.md`**
```markdown
---
name: database-patterns
description: Database interaction patterns
---

# Database Patterns

See the repository pattern implementation in the examples directory.

The migration pattern is in migrations-example.ts.
```

**Source: `.claude/skills/database-patterns/examples/repository.ts`**
```typescript
export class Repository<T> {
  // implementation
}
```

**Source: `.claude/skills/database-patterns/examples/migrations.ts`**
```typescript
export class MigrationRunner {
  // implementation
}
```

**Installed to Cursor:**

`.cursor/rules/database-patterns.mdc`:
```markdown
---
description: Database interaction patterns
---

# Database Patterns

## Repository Pattern

See the repository pattern implementation:

@database-patterns/repository.ts

## Migration Pattern

The migration pattern:

@database-patterns/migrations.ts
```

`.cursor/rules/database-patterns/repository.ts`:
```typescript
export class Repository<T> {
  // implementation
}
```

`.cursor/rules/database-patterns/migrations.ts`:
```typescript
export class MigrationRunner {
  // implementation
}
```

---

## Benefits Summary

### Native @file References
✅ **Best user experience** - files are separate, editable
✅ **Cursor's native feature** - AI understands context better
✅ **Syntax highlighting** - in IDE and Cursor
✅ **Modular** - users can modify individual files
✅ **Scalable** - can have many example files

### Embedded Files
✅ **Portable** - single file contains everything
✅ **Backward compatible** - works in any markdown viewer
✅ **Simple** - easier to share/copy-paste
⚠️ **Less flexible** - harder to edit individual examples

---

## Migration Plan

### Phase 1: Add FileReferenceSection to Canonical
- Update `canonical.ts` types
- Add validation in schema

### Phase 2: Update Cursor Converters
- `from-cursor.ts`: Detect @file and embedded files
- `to-cursor.ts`: Generate @file references (default) or embedded

### Phase 3: Update CLI Install
- Add `--embed-files` flag
- Handle companion file installation
- Update destination directory logic

### Phase 4: Update Other Converters
- `from-claude.ts`: Detect multi-file skills/agents
- `to-claude.ts`: Generate proper directory structure
- Similar for Gemini, if multi-file extensions detected

### Phase 5: Documentation
- User guide for multi-file packages
- Examples in docs
- Best practices

---

## Quality Scoring

| Conversion | @file References | Embedded | Notes |
|------------|------------------|----------|-------|
| Multi-file → Cursor (@file) | 100 | 95 | @file is native, embedded is workaround |
| Multi-file → Cursor (embedded) | N/A | 100 | Fully preserves content |
| Cursor (@file) → Multi-file | 100 | N/A | Perfect mapping |
| Cursor (embedded) → Multi-file | N/A | 100 | Extract to separate files |
| Claude skill → Cursor | 100 | 95 | Can preserve file structure |
| Gemini extension → Cursor | 90 | 90 | Context file → @file or embed |

---

## Future Enhancements

1. **Smart file detection**: Auto-detect when to use @file vs embed
2. **Relative paths**: Support nested directory structures
3. **File watchers**: Sync companion files when updated
4. **Template variables**: Support placeholder substitution in files
5. **Conditional files**: Include files based on globs/conditions

---

## Conclusion

Cursor's @file support makes multi-file packages a **first-class feature** in PRPM!

**Key Decision:**
- **Default**: Use @file references (better UX, native feature)
- **Option**: Embed files for portability

This positions PRPM as the only package manager that can:
1. Convert multi-file Claude skills → Cursor rules with @file references
2. Convert Gemini extensions → Cursor rules with context files
3. Preserve file structure across all formats
