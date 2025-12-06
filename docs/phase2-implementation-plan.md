# Phase 2 Implementation Plan: Cross-Format Conversions & Multi-File Support

## Overview

This phase implements two major features:
1. **Gemini Extension ↔ Claude Plugin** bidirectional conversion
2. **Cursor @file References** for multi-file packages

**Branch**: `cross-format-enhancements`
**Estimated Effort**: 3-4 days
**Risk Level**: Medium (touching converters, requires extensive testing)

---

## Prerequisites

✅ PR #197 merged (Gemini extension format support)
✅ All tests passing on main branch
✅ Clean working directory

---

## Architecture Overview

### New Components

```
packages/converters/src/
├── cross-converters/              # NEW DIRECTORY
│   ├── gemini-to-claude.ts       # Gemini → Claude direct conversion
│   ├── claude-to-gemini.ts       # Claude → Gemini direct conversion
│   └── mcp-transformer.ts        # Shared MCP server transformation logic
├── types/
│   └── canonical.ts              # ADD: FileReferenceSection
└── utils/
    └── file-references.ts        # NEW: @file reference utilities
```

### Modified Components

```
packages/converters/src/
├── from-cursor.ts                # ADD: @file reference detection
├── to-cursor.ts                  # ADD: @file reference generation
├── from-claude.ts                # ADD: Multi-file skill detection
└── to-claude.ts                  # ADD: Multi-file skill generation

packages/cli/src/commands/
└── install.ts                    # ADD: Companion file installation

packages/converters/schemas/
└── canonical.schema.json         # UPDATE: Add file-references section
```

---

## Phase 2A: Gemini ↔ Claude Plugin Conversion

### Step 1: MCP Transformer Utility

**File**: `packages/converters/src/cross-converters/mcp-transformer.ts`

**Purpose**: Shared logic for transforming MCP servers between formats

```typescript
export interface MCPTransformOptions {
  sourceFormat: 'gemini' | 'claude';
  targetFormat: 'gemini' | 'claude';
  preserveUnsupported?: boolean; // Store in experimentalSettings
}

export interface MCPTransformResult {
  servers: Record<string, any>;
  warnings: string[];
  unsupportedServers?: Record<string, any>;
  qualityScore: number;
}

export function transformMCPServers(
  servers: Record<string, any>,
  options: MCPTransformOptions
): MCPTransformResult;
```

**Implementation Tasks**:
- [ ] Create mcp-transformer.ts
- [ ] Implement Gemini → Claude transformation
  - [ ] Add `type: "stdio"` to all servers
  - [ ] Remove `disabled` field (with warning)
  - [ ] Detect variable substitution (warn)
- [ ] Implement Claude → Gemini transformation
  - [ ] Remove `type` field
  - [ ] Filter HTTP/SSE servers (warn, store in experimental)
  - [ ] Preserve metadata in experimentalSettings
- [ ] Add quality scoring logic
- [ ] Write unit tests (15+ test cases)

**Test Cases**:
```typescript
describe('transformMCPServers', () => {
  describe('Gemini → Claude', () => {
    it('should add type: stdio to all servers')
    it('should remove disabled field and warn')
    it('should warn about variable substitution')
    it('should preserve command, args, env')
  });

  describe('Claude → Gemini', () => {
    it('should remove type field')
    it('should filter HTTP servers and warn')
    it('should filter SSE servers and warn')
    it('should preserve stdio servers')
    it('should store unsupported servers in experimental')
  });
});
```

**Estimated**: 4 hours

---

### Step 2: Gemini → Claude Direct Converter

**File**: `packages/converters/src/cross-converters/gemini-to-claude.ts`

**Purpose**: Convert Gemini extension directly to Claude plugin (bypassing canonical)

```typescript
export interface GeminiToClaudeOptions {
  convertContextToSkill?: boolean; // Convert GEMINI.md → skill
  preserveMetadata?: boolean;      // Store in experimentalSettings
}

export function geminiToClaudePlugin(
  geminiConfig: GeminiExtensionConfig,
  contextFile?: string,
  options?: GeminiToClaudeOptions
): ClaudePluginConversionResult;
```

**Implementation Tasks**:
- [ ] Create gemini-to-claude.ts
- [ ] Extract Gemini extension metadata
- [ ] Transform MCP servers using mcp-transformer
- [ ] Convert context file → Claude skill (optional)
- [ ] Handle excludeTools (warn, not supported)
- [ ] Handle contextFileName (convert or warn)
- [ ] Generate plugin.json
- [ ] Generate skill file if context provided
- [ ] Calculate quality score
- [ ] Write unit tests (10+ test cases)

**Test Cases**:
```typescript
describe('geminiToClaudePlugin', () => {
  it('should convert basic extension to plugin')
  it('should transform MCP servers correctly')
  it('should warn about excludeTools')
  it('should convert context file to skill')
  it('should preserve metadata in experimentalSettings')
  it('should handle variable substitution warnings')
  it('should calculate quality score correctly')
});
```

**Estimated**: 6 hours

---

### Step 3: Claude → Gemini Direct Converter

**File**: `packages/converters/src/cross-converters/claude-to-gemini.ts`

**Purpose**: Convert Claude plugin directly to Gemini extension

```typescript
export interface ClaudeToGeminiOptions {
  mergeSkillsToContext?: boolean; // Merge skills → GEMINI.md
  preserveMetadata?: boolean;      // Store in experimentalSettings
}

export function claudeToGeminiExtension(
  pluginJson: ClaudePluginJson,
  skills?: string[],
  options?: ClaudeToGeminiOptions
): GeminiExtensionConversionResult;
```

**Implementation Tasks**:
- [ ] Create claude-to-gemini.ts
- [ ] Extract Claude plugin metadata
- [ ] Transform MCP servers using mcp-transformer
- [ ] Merge skills → context file (optional)
- [ ] Store license/repository/keywords in experimental
- [ ] Generate gemini-extension.json
- [ ] Generate GEMINI.md if skills provided
- [ ] Calculate quality score
- [ ] Write unit tests (10+ test cases)

**Test Cases**:
```typescript
describe('claudeToGeminiExtension', () => {
  it('should convert basic plugin to extension')
  it('should transform MCP servers correctly')
  it('should filter HTTP/SSE servers')
  it('should merge skills to context file')
  it('should preserve metadata in experimental')
  it('should generate valid gemini-extension.json')
  it('should calculate quality score correctly')
});
```

**Estimated**: 6 hours

---

### Step 4: Integration with Existing Converters

**Files to modify**:
- `packages/converters/src/index.ts` - Export new converters
- `packages/cli/src/commands/convert.ts` - Add cross-format conversion
- `packages/cli/src/commands/install.ts` - Use cross-converters when applicable

**Implementation Tasks**:
- [ ] Export geminiToClaudePlugin, claudeToGeminiExtension
- [ ] Update CLI convert command to detect cross-format
- [ ] Add `--direct` flag for direct conversion (bypass canonical)
- [ ] Update install command to use cross-converters
- [ ] Add conversion warnings to CLI output
- [ ] Write integration tests

**CLI Usage**:
```bash
# Direct conversion (new)
prpm convert my-extension.json --from gemini --to claude --direct

# Via canonical (existing)
prpm convert my-extension.json --from gemini --to claude

# Install with cross-conversion
prpm install @user/claude-plugin --as gemini --subtype extension
```

**Estimated**: 4 hours

---

## Phase 2B: Cursor Multi-File Support

### Step 5: FileReferenceSection Type

**File**: `packages/converters/src/types/canonical.ts`

**Implementation Tasks**:
- [ ] Add FileReferenceSection interface
- [ ] Add to Section union type
- [ ] Update CanonicalContent type
- [ ] Add validation helpers

```typescript
export interface FileReferenceSection {
  type: 'file-references';
  files: Array<{
    path: string;           // Relative path: "examples/client.ts"
    content: string;        // Actual file content
    description?: string;   // Optional description
    language?: string;      // File language/extension hint
    isReference?: boolean;  // true if @file reference, false if embedded
  }>;
}

// Add to Section union
export type Section =
  | MetadataSection
  | PersonaSection
  | RulesSection
  | InstructionsSection
  | ExamplesSection
  | ContextSection
  | ToolsSection
  | FileReferenceSection  // NEW
  | ServersSection;
```

**Test Cases**:
```typescript
describe('FileReferenceSection', () => {
  it('should validate file-references section')
  it('should require path and content')
  it('should allow optional description and language')
  it('should detect reference vs embedded files')
});
```

**Estimated**: 2 hours

---

### Step 6: File Reference Utilities

**File**: `packages/converters/src/utils/file-references.ts`

**Purpose**: Utilities for parsing and generating file references

```typescript
export interface FileReference {
  path: string;
  content: string;
  description?: string;
  language?: string;
  isReference: boolean;
}

// Parse @file references from markdown
export function extractFileReferences(markdown: string): FileReference[];

// Parse embedded files (📁 sections)
export function extractEmbeddedFiles(markdown: string): FileReference[];

// Generate @file references
export function generateFileReferences(files: FileReference[]): string;

// Generate embedded file sections
export function generateEmbeddedFiles(files: FileReference[]): string;

// Detect file language from extension
export function detectLanguage(filePath: string): string;
```

**Implementation Tasks**:
- [ ] Create file-references.ts
- [ ] Implement extractFileReferences (regex-based)
- [ ] Implement extractEmbeddedFiles (markdown parsing)
- [ ] Implement generateFileReferences
- [ ] Implement generateEmbeddedFiles
- [ ] Implement detectLanguage
- [ ] Write unit tests (20+ test cases)

**Test Cases**:
```typescript
describe('file-references utilities', () => {
  describe('extractFileReferences', () => {
    it('should extract @file.ts references')
    it('should extract @folder/file.ts references')
    it('should extract context around reference')
    it('should handle multiple references')
  });

  describe('extractEmbeddedFiles', () => {
    it('should extract files from 📁 sections')
    it('should parse description and language')
    it('should handle multiple files')
    it('should preserve code block content')
  });

  describe('generateFileReferences', () => {
    it('should generate @file syntax')
    it('should include descriptions')
    it('should handle paths correctly')
  });

  describe('generateEmbeddedFiles', () => {
    it('should generate 📁 sections')
    it('should include descriptions')
    it('should preserve syntax highlighting')
  });
});
```

**Estimated**: 6 hours

---

### Step 7: Update Cursor Converters

**File**: `packages/converters/src/from-cursor.ts`

**Implementation Tasks**:
- [ ] Import file-references utilities
- [ ] Detect @file references in markdown
- [ ] Detect embedded files (📁 sections)
- [ ] Create FileReferenceSection if found
- [ ] Add to CanonicalPackage sections
- [ ] Update tests

**Changes**:
```typescript
export function fromCursor(
  content: string,
  metadata: PackageMetadata
): CanonicalPackage {
  const { frontmatter, body } = parseFrontmatter(content);

  // NEW: Extract file references
  const fileRefs = extractFileReferences(body);
  const embeddedFiles = extractEmbeddedFiles(body);

  const sections: Section[] = [];

  // NEW: Add file references section
  if (fileRefs.length > 0 || embeddedFiles.length > 0) {
    sections.push({
      type: 'file-references',
      files: [...fileRefs, ...embeddedFiles],
    });
  }

  // ... rest of conversion
}
```

**Test Cases**:
```typescript
describe('fromCursor with file references', () => {
  it('should extract @file references')
  it('should extract embedded files')
  it('should create FileReferenceSection')
  it('should handle mixed references and embedded')
});
```

**Estimated**: 4 hours

---

**File**: `packages/converters/src/to-cursor.ts`

**Implementation Tasks**:
- [ ] Import file-references utilities
- [ ] Add embedFiles option
- [ ] Generate @file references (default)
- [ ] Generate embedded files (opt-in)
- [ ] Return companion files for installation
- [ ] Update tests

**Changes**:
```typescript
export interface CursorConversionOptions {
  embedFiles?: boolean; // Default: false (use @file)
}

export interface CursorConversionResult extends ConversionResult {
  companionFiles?: Array<{
    path: string;
    content: string;
  }>;
}

export function toCursor(
  pkg: CanonicalPackage,
  options?: CursorConversionOptions
): CursorConversionResult {
  // ... existing conversion

  const fileRefSection = pkg.content.sections.find(
    s => s.type === 'file-references'
  );

  if (fileRefSection?.type === 'file-references') {
    if (options?.embedFiles) {
      content += generateEmbeddedFiles(fileRefSection.files);
    } else {
      content += generateFileReferences(fileRefSection.files);
      // Return companion files for installation
      return {
        content,
        format: 'cursor',
        companionFiles: fileRefSection.files.map(f => ({
          path: f.path,
          content: f.content,
        })),
      };
    }
  }

  return { content, format: 'cursor' };
}
```

**Test Cases**:
```typescript
describe('toCursor with file references', () => {
  it('should generate @file references by default')
  it('should generate embedded files with embedFiles=true')
  it('should return companion files')
  it('should include descriptions in output')
});
```

**Estimated**: 4 hours

---

### Step 8: Update Claude Converters for Multi-File

**File**: `packages/converters/src/from-claude.ts`

**Implementation Tasks**:
- [ ] Detect multi-file skills (skills with examples/ subdirectory)
- [ ] Create FileReferenceSection for skills with examples
- [ ] Update tests

**Changes**:
```typescript
// When parsing a skill directory with examples/
if (hasExamplesDirectory(skillPath)) {
  const exampleFiles = readExamplesDirectory(skillPath);
  sections.push({
    type: 'file-references',
    files: exampleFiles.map(f => ({
      path: `examples/${f.name}`,
      content: f.content,
      language: detectLanguage(f.name),
      isReference: false, // Embedded in source
    })),
  });
}
```

**Estimated**: 3 hours

---

**File**: `packages/converters/src/to-claude.ts`

**Implementation Tasks**:
- [ ] Generate examples/ directory for FileReferenceSection
- [ ] Return companion files for installation
- [ ] Update tests

**Changes**:
```typescript
export interface ClaudeConversionResult extends ConversionResult {
  companionFiles?: Array<{
    path: string;      // e.g., "examples/client.ts"
    content: string;
  }>;
}

export function toClaude(pkg: CanonicalPackage): ClaudeConversionResult {
  // ... existing conversion

  const fileRefSection = pkg.content.sections.find(
    s => s.type === 'file-references'
  );

  if (fileRefSection?.type === 'file-references') {
    // Add reference to examples in main content
    content += '\n\nSee the examples directory for implementation patterns.\n';

    // Return companion files
    return {
      content,
      format: 'claude',
      companionFiles: fileRefSection.files,
    };
  }

  return { content, format: 'claude' };
}
```

**Estimated**: 3 hours

---

### Step 9: CLI Install Command Updates

**File**: `packages/cli/src/commands/install.ts`

**Implementation Tasks**:
- [ ] Add `--embed-files` flag
- [ ] Detect companion files in conversion result
- [ ] Install companion files to appropriate directories
- [ ] Update installation messages
- [ ] Write integration tests

**Changes**:
```typescript
interface InstallOptions {
  // ... existing options
  embedFiles?: boolean; // For Cursor: embed vs @file
}

async function installCursorRule(
  pkg: CanonicalPackage,
  options: InstallOptions
) {
  const result = toCursor(pkg, { embedFiles: options.embedFiles });

  // Install main rule
  const mainPath = `.cursor/rules/${pkg.name}.mdc`;
  await saveFile(mainPath, result.content);

  // Install companion files
  if (!options.embedFiles && result.companionFiles) {
    const companionDir = `.cursor/rules/${pkg.name}`;
    await ensureDirectoryExists(companionDir);

    for (const file of result.companionFiles) {
      const filePath = path.join(companionDir, file.path);
      await ensureDirectoryExists(path.dirname(filePath));
      await saveFile(filePath, file.content);
    }

    console.log(chalk.green(
      `✓ Installed with ${result.companionFiles.length} companion files`
    ));
  }
}

// Similar for Claude
async function installClaudeSkill(
  pkg: CanonicalPackage,
  options: InstallOptions
) {
  const result = toClaude(pkg);

  // Install main skill
  const mainPath = `.claude/skills/${pkg.name}.md`;
  await saveFile(mainPath, result.content);

  // Install companion files
  if (result.companionFiles) {
    const companionDir = `.claude/skills/${pkg.name}`;
    await ensureDirectoryExists(companionDir);

    for (const file of result.companionFiles) {
      const filePath = path.join(companionDir, file.path);
      await ensureDirectoryExists(path.dirname(filePath));
      await saveFile(filePath, file.content);
    }

    console.log(chalk.green(
      `✓ Installed with ${result.companionFiles.length} example files`
    ));
  }
}
```

**CLI Examples**:
```bash
# Cursor with @file references (default)
prpm install @user/api-patterns --as cursor
# Result:
# .cursor/rules/api-patterns.mdc (with @file references)
# .cursor/rules/api-patterns/client.ts
# .cursor/rules/api-patterns/test.ts

# Cursor with embedded files
prpm install @user/api-patterns --as cursor --embed-files
# Result:
# .cursor/rules/api-patterns.mdc (with embedded file sections)

# Claude with examples
prpm install @user/api-patterns --as claude --subtype skill
# Result:
# .claude/skills/api-patterns.md
# .claude/skills/api-patterns/examples/client.ts
# .claude/skills/api-patterns/examples/test.ts
```

**Estimated**: 6 hours

---

### Step 10: Update Canonical Schema

**File**: `packages/converters/schemas/canonical.schema.json`

**Implementation Tasks**:
- [ ] Add file-references section definition
- [ ] Add validation for required fields
- [ ] Update examples
- [ ] Validate schema against test fixtures

**Changes**:
```json
{
  "definitions": {
    "section": {
      "oneOf": [
        { "$ref": "#/definitions/metadataSection" },
        { "$ref": "#/definitions/fileReferenceSection" }
      ]
    },
    "fileReferenceSection": {
      "type": "object",
      "required": ["type", "files"],
      "properties": {
        "type": { "const": "file-references" },
        "files": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["path", "content"],
            "properties": {
              "path": { "type": "string" },
              "content": { "type": "string" },
              "description": { "type": "string" },
              "language": { "type": "string" },
              "isReference": { "type": "boolean" }
            }
          }
        }
      }
    }
  }
}
```

**Estimated**: 2 hours

---

## Testing Strategy

### Unit Tests

**New test files**:
- `mcp-transformer.test.ts` (15 tests)
- `gemini-to-claude.test.ts` (10 tests)
- `claude-to-gemini.test.ts` (10 tests)
- `file-references.test.ts` (20 tests)
- Updates to existing converter tests (30+ tests)

**Coverage target**: 95%+ for new code

### Integration Tests

**New test files**:
- `cross-format-conversion.test.ts` - Full conversion flows
- `multi-file-install.test.ts` - CLI installation with companion files
- `roundtrip.test.ts` - Gemini → Claude → Gemini, Cursor → Multi → Cursor

**Scenarios**:
```typescript
describe('Cross-format conversion', () => {
  it('should convert Gemini extension to Claude plugin')
  it('should convert Claude plugin to Gemini extension')
  it('should preserve MCP servers in roundtrip')
  it('should warn about lossy conversions')
});

describe('Multi-file installation', () => {
  it('should install Cursor rule with @file references')
  it('should install Cursor rule with embedded files')
  it('should install Claude skill with examples')
  it('should create proper directory structure')
});

describe('Roundtrip conversions', () => {
  it('should roundtrip Gemini → Claude → Gemini')
  it('should roundtrip Claude → Gemini → Claude')
  it('should roundtrip Cursor multi-file packages')
  it('should maintain quality scores > 90%')
});
```

### Manual Testing Checklist

**Gemini ↔ Claude**:
- [ ] Install real Gemini extension, convert to Claude
- [ ] Install real Claude plugin, convert to Gemini
- [ ] Verify MCP servers work in both formats
- [ ] Check warning messages are clear
- [ ] Verify metadata preservation

**Cursor Multi-File**:
- [ ] Install multi-file package as Cursor rule with @file
- [ ] Verify @file references work in Cursor IDE
- [ ] Install multi-file package as Cursor rule embedded
- [ ] Install Cursor multi-file rule as Claude skill
- [ ] Check file structure and content preservation

---

## Risk Mitigation

### High Risk Areas

1. **MCP Server Transformation**
   - Risk: Breaking existing MCP configurations
   - Mitigation: Extensive unit tests, manual testing with real servers
   - Rollback: Can revert converter changes, canonical unchanged

2. **File Reference Parsing**
   - Risk: Regex parsing fails on edge cases
   - Mitigation: Comprehensive test fixtures, fuzzing
   - Rollback: Feature flag for @file vs embedded

3. **CLI Installation**
   - Risk: File system operations fail, incomplete installs
   - Mitigation: Transaction-like install (backup → install → verify)
   - Rollback: Restore from backup on failure

### Medium Risk Areas

1. **Schema Changes**
   - Risk: Breaking existing canonical packages
   - Mitigation: Optional FileReferenceSection, backward compatible
   - Rollback: Schema is additive, no breaking changes

2. **Converter Integration**
   - Risk: Breaking existing conversions
   - Mitigation: All existing tests must pass, new tests for new features
   - Rollback: Feature-flagged cross-converters

---

## Implementation Timeline

### Day 1: MCP Transformation & Gemini ↔ Claude
- Morning: MCP transformer utility (4h)
- Afternoon: Gemini → Claude converter (6h)
- Evening: Claude → Gemini converter (6h)

### Day 2: File References & Cursor Updates
- Morning: FileReferenceSection type (2h)
- Mid-morning: File reference utilities (6h)
- Afternoon: Update Cursor converters (8h)

### Day 3: Claude Multi-File & CLI Updates
- Morning: Update Claude converters (6h)
- Afternoon: CLI install updates (6h)
- Evening: Schema updates (2h)

### Day 4: Testing & Documentation
- Morning: Write integration tests (4h)
- Afternoon: Manual testing (4h)
- Evening: Documentation updates, PR preparation (4h)

**Total**: 58 hours estimated (realistic: 3-4 days with interruptions)

---

## Definition of Done

### Code Complete
- [ ] All new files created and implemented
- [ ] All modified files updated
- [ ] All exports added to index.ts files
- [ ] TypeScript compiles with no errors
- [ ] Linter passes with no warnings

### Tests Complete
- [ ] 95+ new unit tests written and passing
- [ ] All existing tests still passing (442+ tests)
- [ ] Integration tests written and passing
- [ ] Roundtrip tests achieve 90%+ quality scores
- [ ] Coverage > 90% for new code

### Documentation Complete
- [ ] JSDoc comments on all new public functions
- [ ] Updated converter docs with cross-format examples
- [ ] CLI help text updated with new flags
- [ ] User guide with multi-file package examples
- [ ] Migration guide for existing packages

### Manual Testing Complete
- [ ] Tested Gemini → Claude conversion with real extension
- [ ] Tested Claude → Gemini conversion with real plugin
- [ ] Tested Cursor @file installation
- [ ] Tested Cursor embedded file installation
- [ ] Tested Claude multi-file installation
- [ ] Verified all warnings display correctly
- [ ] Verified file structure is correct

### PR Ready
- [ ] Branch rebased on latest main
- [ ] Commit messages follow conventional commits
- [ ] PR description is comprehensive
- [ ] Breaking changes documented (if any)
- [ ] Migration path provided (if needed)

---

## Rollback Plan

If critical issues found after merge:

1. **Immediate**: Feature flag cross-converters
   ```typescript
   const ENABLE_CROSS_CONVERTERS = process.env.PRPM_CROSS_CONVERTERS === 'true';
   ```

2. **Short-term**: Revert PR, fix issues, re-submit

3. **Long-term**: None needed - all changes are additive

---

## Success Metrics

Post-merge metrics to track:

- [ ] Zero regression bugs in existing conversions
- [ ] Cross-format conversions achieve 85%+ quality scores
- [ ] Multi-file packages install correctly 100% of time
- [ ] User adoption of @file references (track via analytics)
- [ ] Community feedback positive

---

## Notes

- Keep PR size manageable (~2000 LOC max)
- If too large, split into 2 PRs:
  - PR 2A: Gemini ↔ Claude conversion
  - PR 2B: Cursor multi-file support
- Daily standups to track progress
- Code reviews incremental (don't wait until end)

---

## Next Steps After This Phase

**Phase 3** (Future):
- Gemini extension → Cursor rule conversion
- Claude plugin → Cursor rule conversion
- Auto-detection of multi-file vs single-file
- Smart file merging/splitting
- Template variable substitution in files
