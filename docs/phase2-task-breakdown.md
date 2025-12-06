# Phase 2: Detailed Task Breakdown

## Branch Setup

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create new branch from main (after PR #197 is merged)
git checkout -b cross-format-enhancements

# Verify clean state
git status
npm run build
npm test
```

---

## Task Checklist

### 🔧 Setup & Infrastructure (2 hours)

- [ ] **SETUP-1**: Create branch `cross-format-enhancements`
- [ ] **SETUP-2**: Create directory `packages/converters/src/cross-converters/`
- [ ] **SETUP-3**: Create directory `packages/converters/src/utils/`
- [ ] **SETUP-4**: Set up test fixtures directory for cross-format tests
- [ ] **SETUP-5**: Update .gitignore if needed

**Verification**: Directory structure exists, branch created

---

## Part A: Gemini ↔ Claude Conversion (20 hours)

### 📦 MCP Transformer Utility (4 hours)

#### **TASK-A1**: Create mcp-transformer.ts (2 hours)

**File**: `packages/converters/src/cross-converters/mcp-transformer.ts`

**Subtasks**:
- [ ] Create file with TypeScript interfaces
- [ ] Implement `MCPTransformOptions` interface
- [ ] Implement `MCPTransformResult` interface
- [ ] Implement `transformMCPServers()` main function skeleton
- [ ] Add JSDoc comments

**Code Template**:
```typescript
/**
 * MCP Server Transformer
 * Handles bidirectional MCP server config transformation between Gemini and Claude
 */

export interface MCPTransformOptions {
  sourceFormat: 'gemini' | 'claude';
  targetFormat: 'gemini' | 'claude';
  preserveUnsupported?: boolean;
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
): MCPTransformResult {
  // TODO: Implement
  return {
    servers: {},
    warnings: [],
    qualityScore: 100,
  };
}
```

**Verification**: TypeScript compiles, exports work

---

#### **TASK-A2**: Implement Gemini → Claude transformation (1 hour)

**Subtasks**:
- [ ] Add `transformGeminiToClaude()` helper function
- [ ] Loop through servers and transform each
- [ ] Add `type: "stdio"` field to each server
- [ ] Remove `disabled` field, add warning if present
- [ ] Detect variable substitution (`${extensionPath}`), add warning
- [ ] Calculate quality score based on warnings

**Code**:
```typescript
function transformGeminiToClaude(
  geminiServers: Record<string, any>
): MCPTransformResult {
  const claudeServers: Record<string, any> = {};
  const warnings: string[] = [];
  let qualityScore = 100;

  for (const [name, server] of Object.entries(geminiServers)) {
    // Handle disabled servers
    if (server.disabled) {
      warnings.push(`Server "${name}" is disabled but Claude doesn't support disabled servers`);
      qualityScore -= 5;
      continue;
    }

    // Transform server
    claudeServers[name] = {
      type: 'stdio',
      command: server.command,
      args: server.args,
      env: server.env,
    };

    // Check for variable substitution
    if (hasVariableSubstitution(server)) {
      warnings.push(`Server "${name}" uses Gemini variable substitution which won't work in Claude`);
      qualityScore -= 10;
    }
  }

  return { servers: claudeServers, warnings, qualityScore };
}

function hasVariableSubstitution(server: any): boolean {
  const str = JSON.stringify(server);
  return str.includes('${extensionPath}') || str.includes('${home}');
}
```

**Verification**: Unit test passes for Gemini → Claude

---

#### **TASK-A3**: Implement Claude → Gemini transformation (1 hour)

**Subtasks**:
- [ ] Add `transformClaudeToGemini()` helper function
- [ ] Loop through servers and transform each
- [ ] Remove `type` field
- [ ] Filter out HTTP/SSE servers, add to unsupported
- [ ] Store unsupported servers if `preserveUnsupported` is true
- [ ] Calculate quality score based on unsupported servers

**Code**:
```typescript
function transformClaudeToGemini(
  claudeServers: Record<string, any>,
  preserveUnsupported: boolean = true
): MCPTransformResult {
  const geminiServers: Record<string, any> = {};
  const unsupportedServers: Record<string, any> = {};
  const warnings: string[] = [];
  let qualityScore = 100;

  for (const [name, server] of Object.entries(claudeServers)) {
    // Filter HTTP/SSE servers
    if (server.type === 'http' || server.type === 'sse') {
      warnings.push(`Server "${name}" uses ${server.type} transport which Gemini doesn't support`);
      qualityScore -= 15;

      if (preserveUnsupported) {
        unsupportedServers[name] = {
          ...server,
          __prpm_reason: 'Gemini only supports stdio servers',
        };
      }
      continue;
    }

    // Transform server (remove type field)
    geminiServers[name] = {
      command: server.command,
      args: server.args,
      env: server.env,
    };
  }

  return {
    servers: geminiServers,
    warnings,
    unsupportedServers: Object.keys(unsupportedServers).length > 0 ? unsupportedServers : undefined,
    qualityScore,
  };
}
```

**Verification**: Unit test passes for Claude → Gemini

---

#### **TASK-A4**: Write mcp-transformer tests (30 min)

**File**: `packages/converters/src/__tests__/mcp-transformer.test.ts`

**Test Cases**:
```typescript
describe('transformMCPServers', () => {
  describe('Gemini → Claude', () => {
    it('should add type: stdio to all servers');
    it('should remove disabled servers and warn');
    it('should detect variable substitution and warn');
    it('should preserve command, args, env');
    it('should calculate quality score correctly');
  });

  describe('Claude → Gemini', () => {
    it('should remove type field');
    it('should filter HTTP servers and warn');
    it('should filter SSE servers and warn');
    it('should preserve stdio servers');
    it('should store unsupported in result');
    it('should calculate quality score correctly');
  });
});
```

- [ ] Write all test cases
- [ ] Run tests: `npm test -- mcp-transformer.test.ts`
- [ ] Ensure 100% coverage for mcp-transformer.ts

**Verification**: All tests pass, coverage > 95%

---

### 🔄 Gemini → Claude Converter (6 hours)

#### **TASK-A5**: Create gemini-to-claude.ts skeleton (1 hour)

**File**: `packages/converters/src/cross-converters/gemini-to-claude.ts`

**Subtasks**:
- [ ] Create file and import types
- [ ] Define `GeminiToClaudeOptions` interface
- [ ] Define `GeminiToClaudeResult` interface
- [ ] Create main `geminiToClaudePlugin()` function skeleton
- [ ] Add JSDoc comments

**Code Template**:
```typescript
import type { ClaudePluginJson } from '../from-claude-plugin.js';
import type { GeminiExtensionConfig } from '../from-gemini-plugin.js';
import { transformMCPServers } from './mcp-transformer.js';

export interface GeminiToClaudeOptions {
  convertContextToSkill?: boolean;
  preserveMetadata?: boolean;
}

export interface GeminiToClaudeResult {
  pluginJson: ClaudePluginJson;
  skillContent?: string;
  warnings: string[];
  qualityScore: number;
}

export function geminiToClaudePlugin(
  geminiConfig: GeminiExtensionConfig,
  contextFile?: string,
  options: GeminiToClaudeOptions = {}
): GeminiToClaudeResult {
  // TODO: Implement
  return {
    pluginJson: { name: geminiConfig.name },
    warnings: [],
    qualityScore: 100,
  };
}
```

**Verification**: TypeScript compiles

---

#### **TASK-A6**: Implement metadata extraction (1 hour)

**Subtasks**:
- [ ] Extract name, version, description, author from Gemini config
- [ ] Build base ClaudePluginJson object
- [ ] Handle optional fields (keywords from tags)

**Code**:
```typescript
export function geminiToClaudePlugin(
  geminiConfig: GeminiExtensionConfig,
  contextFile?: string,
  options: GeminiToClaudeOptions = {}
): GeminiToClaudeResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  // Build base plugin.json
  const pluginJson: ClaudePluginJson = {
    name: geminiConfig.name,
    version: geminiConfig.version,
    description: geminiConfig.description,
    author: geminiConfig.author,
  };

  // ... rest of implementation
}
```

**Verification**: Basic metadata converts correctly

---

#### **TASK-A7**: Implement MCP server transformation (1 hour)

**Subtasks**:
- [ ] Call `transformMCPServers()` if MCP servers present
- [ ] Add transformed servers to pluginJson
- [ ] Merge warnings from transformer
- [ ] Adjust quality score

**Code**:
```typescript
// Transform MCP servers
if (geminiConfig.mcpServers && Object.keys(geminiConfig.mcpServers).length > 0) {
  const mcpResult = transformMCPServers(geminiConfig.mcpServers, {
    sourceFormat: 'gemini',
    targetFormat: 'claude',
    preserveUnsupported: false,
  });

  pluginJson.mcpServers = mcpResult.servers;
  warnings.push(...mcpResult.warnings);
  qualityScore = Math.min(qualityScore, mcpResult.qualityScore);
}
```

**Verification**: MCP servers transform correctly

---

#### **TASK-A8**: Implement context file conversion (1 hour)

**Subtasks**:
- [ ] If `convertContextToSkill` is true and context provided
- [ ] Generate Claude skill markdown with frontmatter
- [ ] Return skill content in result

**Code**:
```typescript
let skillContent: string | undefined;

if (options.convertContextToSkill && contextFile) {
  // Generate skill markdown
  skillContent = `---
name: ${geminiConfig.name}-context
description: ${geminiConfig.description || 'Context from Gemini extension'}
---

${contextFile}
`;
}
```

**Verification**: Context file converts to skill

---

#### **TASK-A9**: Handle excludeTools and warnings (30 min)

**Subtasks**:
- [ ] Check for `excludeTools` field
- [ ] Add warning that it's not supported
- [ ] Reduce quality score

**Code**:
```typescript
// Handle excludeTools (not supported in Claude)
if (geminiConfig.excludeTools && geminiConfig.excludeTools.length > 0) {
  warnings.push(
    `excludeTools is not supported in Claude plugins. ` +
    `The following tools will be available: ${geminiConfig.excludeTools.join(', ')}`
  );
  qualityScore -= 5;
}
```

**Verification**: Warning appears when excludeTools present

---

#### **TASK-A10**: Write gemini-to-claude tests (1.5 hours)

**File**: `packages/converters/src/__tests__/gemini-to-claude.test.ts`

**Test Fixtures**: Create in `packages/converters/src/__tests__/fixtures/`
- `gemini-basic.json` - Basic extension
- `gemini-with-servers.json` - With MCP servers
- `gemini-with-context.md` - Context file
- `gemini-with-excludetools.json` - With excludeTools

**Test Cases**:
```typescript
describe('geminiToClaudePlugin', () => {
  it('should convert basic metadata');
  it('should transform MCP servers');
  it('should warn about excludeTools');
  it('should convert context file to skill');
  it('should warn about variable substitution');
  it('should calculate quality score correctly');
  it('should handle missing optional fields');
});
```

- [ ] Write all test cases
- [ ] Run tests: `npm test -- gemini-to-claude.test.ts`
- [ ] Ensure coverage > 90%

**Verification**: All tests pass

---

### 🔄 Claude → Gemini Converter (6 hours)

#### **TASK-A11**: Create claude-to-gemini.ts (Similar to A5-A10)

Follow same pattern as Gemini → Claude, but in reverse:

- [ ] **A11.1**: Create skeleton (1h)
- [ ] **A11.2**: Extract metadata (1h)
- [ ] **A11.3**: Transform MCP servers (1h)
- [ ] **A11.4**: Merge skills to context (1h)
- [ ] **A11.5**: Preserve metadata in experimental (30min)
- [ ] **A11.6**: Write tests (1.5h)

**Key Differences**:
- Merge multiple skills → single GEMINI.md
- Store license, repository, keywords in experimentalSettings
- Filter HTTP/SSE servers

**Verification**: All tests pass, quality scores correct

---

### 🔌 Integration (4 hours)

#### **TASK-A12**: Export new converters (15 min)

**File**: `packages/converters/src/index.ts`

**Subtasks**:
- [ ] Add exports for cross-converters
- [ ] Export types and interfaces

**Code**:
```typescript
// Cross-format converters
export { geminiToClaudePlugin } from './cross-converters/gemini-to-claude.js';
export { claudeToGeminiExtension } from './cross-converters/claude-to-gemini.js';
export { transformMCPServers } from './cross-converters/mcp-transformer.js';

export type {
  GeminiToClaudeOptions,
  GeminiToClaudeResult,
  ClaudeToGeminiOptions,
  ClaudeToGeminiResult,
  MCPTransformOptions,
  MCPTransformResult,
} from './cross-converters/index.js';
```

**Verification**: Imports work from CLI

---

#### **TASK-A13**: Update CLI convert command (2 hours)

**File**: `packages/cli/src/commands/convert.ts`

**Subtasks**:
- [ ] Add `--direct` flag
- [ ] Detect cross-format conversions (gemini ↔ claude)
- [ ] Use cross-converters when `--direct` is specified
- [ ] Display warnings to user
- [ ] Update help text

**Code**:
```typescript
// Detect cross-format
const isCrossFormat =
  (options.from === 'gemini' && options.to === 'claude') ||
  (options.from === 'claude' && options.to === 'gemini');

if (isCrossFormat && options.direct) {
  // Use direct cross-converter
  if (options.from === 'gemini') {
    const result = geminiToClaudePlugin(parsedContent);
    // Display warnings
    if (result.warnings.length > 0) {
      console.warn(chalk.yellow('⚠️  Conversion warnings:'));
      result.warnings.forEach(w => console.warn(`   ${w}`));
    }
    // Output result
    console.log(result.pluginJson);
  }
} else {
  // Use canonical conversion (existing code)
}
```

**Verification**: CLI converts correctly, warnings display

---

#### **TASK-A14**: Update CLI install command (1.5 hours)

**File**: `packages/cli/src/commands/install.ts`

**Subtasks**:
- [ ] Detect when installing cross-format (gemini → claude or vice versa)
- [ ] Use cross-converter if available
- [ ] Display conversion warnings
- [ ] Handle skill generation if context file present

**Code**:
```typescript
// In install command
if (pkg.format === 'gemini' && targetFormat === 'claude') {
  const geminiConfig = extractGeminiConfig(pkg);
  const result = geminiToClaudePlugin(geminiConfig, {
    convertContextToSkill: true,
  });

  // Install plugin.json
  await saveFile('.claude/plugins/plugin.json', JSON.stringify(result.pluginJson, null, 2));

  // Install skill if generated
  if (result.skillContent) {
    await saveFile(`.claude/skills/${pkg.name}.md`, result.skillContent);
  }

  // Show warnings
  if (result.warnings.length > 0) {
    console.warn(chalk.yellow('⚠️  Conversion warnings:'));
    result.warnings.forEach(w => console.warn(`   ${w}`));
  }
}
```

**Verification**: Install works with conversions

---

#### **TASK-A15**: Write integration tests (30 min)

**File**: `packages/converters/src/__tests__/cross-format-integration.test.ts`

**Test Cases**:
```typescript
describe('Cross-format integration', () => {
  it('should convert Gemini extension to Claude plugin end-to-end');
  it('should convert Claude plugin to Gemini extension end-to-end');
  it('should preserve MCP servers in roundtrip');
  it('should maintain quality score > 85%');
});
```

**Verification**: Integration tests pass

---

## Part B: Cursor Multi-File Support (18 hours)

### 📁 File Reference Types (2 hours)

#### **TASK-B1**: Add FileReferenceSection to canonical.ts (1 hour)

**File**: `packages/converters/src/types/canonical.ts`

**Subtasks**:
- [ ] Define `FileReferenceSection` interface
- [ ] Add to `Section` union type
- [ ] Update validation helpers

**Code**:
```typescript
export interface FileReferenceSection {
  type: 'file-references';
  files: Array<{
    path: string;
    content: string;
    description?: string;
    language?: string;
    isReference?: boolean;
  }>;
}

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

**Verification**: TypeScript compiles

---

#### **TASK-B2**: Update canonical schema (1 hour)

**File**: `packages/converters/schemas/canonical.schema.json`

**Subtasks**:
- [ ] Add `fileReferenceSection` definition
- [ ] Add to section oneOf
- [ ] Add examples
- [ ] Validate against test fixtures

**Verification**: Schema validates correctly

---

### 🛠️ File Reference Utilities (6 hours)

#### **TASK-B3**: Create file-references.ts (4 hours)

**File**: `packages/converters/src/utils/file-references.ts`

**Subtasks** (each ~1 hour):
- [ ] **B3.1**: Implement `extractFileReferences()` - Parse @file from markdown
- [ ] **B3.2**: Implement `extractEmbeddedFiles()` - Parse 📁 sections
- [ ] **B3.3**: Implement `generateFileReferences()` - Generate @file syntax
- [ ] **B3.4**: Implement `generateEmbeddedFiles()` - Generate 📁 sections

**Code Template**:
```typescript
export interface FileReference {
  path: string;
  content: string;
  description?: string;
  language?: string;
  isReference: boolean;
}

export function extractFileReferences(markdown: string): FileReference[] {
  const references: FileReference[] = [];
  const regex = /@([\w\-\/\.]+\.\w+)/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    references.push({
      path: match[1],
      content: '', // Will be populated during install
      isReference: true,
    });
  }

  return references;
}

export function extractEmbeddedFiles(markdown: string): FileReference[] {
  // Parse ### filename sections followed by ```code blocks
  // Return array of FileReference objects
}

export function generateFileReferences(files: FileReference[]): string {
  // Generate @file syntax for each file
}

export function generateEmbeddedFiles(files: FileReference[]): string {
  // Generate 📁 sections with code blocks
}
```

**Verification**: Each function works correctly

---

#### **TASK-B4**: Write file-references tests (2 hours)

**File**: `packages/converters/src/__tests__/file-references.test.ts`

**Test Cases** (20+ tests):
```typescript
describe('extractFileReferences', () => {
  it('should extract @file.ts');
  it('should extract @folder/file.ts');
  it('should handle multiple references');
  it('should extract context around reference');
});

describe('extractEmbeddedFiles', () => {
  it('should extract files from 📁 sections');
  it('should parse description');
  it('should detect language from code block');
  it('should handle multiple files');
});

describe('generateFileReferences', () => {
  it('should generate @file syntax');
  it('should include descriptions');
  it('should handle nested paths');
});

describe('generateEmbeddedFiles', () => {
  it('should generate 📁 sections');
  it('should preserve syntax highlighting');
  it('should include descriptions');
});
```

**Verification**: All tests pass, coverage > 90%

---

### 🔄 Update Cursor Converters (4 hours)

#### **TASK-B5**: Update from-cursor.ts (2 hours)

**File**: `packages/converters/src/from-cursor.ts`

**Subtasks**:
- [ ] Import file-references utilities
- [ ] Extract @file references from body
- [ ] Extract embedded files from body
- [ ] Create FileReferenceSection if found
- [ ] Add to sections array
- [ ] Update tests

**Code**:
```typescript
import { extractFileReferences, extractEmbeddedFiles } from './utils/file-references.js';

export function fromCursor(/* ... */) {
  // ... existing code

  // Extract file references
  const fileRefs = extractFileReferences(body);
  const embeddedFiles = extractEmbeddedFiles(body);

  if (fileRefs.length > 0 || embeddedFiles.length > 0) {
    sections.push({
      type: 'file-references',
      files: [...fileRefs, ...embeddedFiles],
    });
  }

  // ... rest of conversion
}
```

**Verification**: from-cursor extracts file references

---

#### **TASK-B6**: Update to-cursor.ts (2 hours)

**File**: `packages/converters/src/to-cursor.ts`

**Subtasks**:
- [ ] Import file-references utilities
- [ ] Add `CursorConversionOptions` interface
- [ ] Add `embedFiles` option
- [ ] Generate @file references (default)
- [ ] Generate embedded files (opt-in)
- [ ] Return companion files
- [ ] Update tests

**Code**:
```typescript
import { generateFileReferences, generateEmbeddedFiles } from './utils/file-references.js';

export interface CursorConversionOptions {
  embedFiles?: boolean;
}

export interface CursorConversionResult extends ConversionResult {
  companionFiles?: Array<{ path: string; content: string }>;
}

export function toCursor(
  pkg: CanonicalPackage,
  options?: CursorConversionOptions
): CursorConversionResult {
  // ... existing conversion

  const fileRefSection = pkg.content.sections.find(s => s.type === 'file-references');

  if (fileRefSection?.type === 'file-references') {
    if (options?.embedFiles) {
      content += generateEmbeddedFiles(fileRefSection.files);
    } else {
      content += generateFileReferences(fileRefSection.files);
      return {
        content,
        format: 'cursor',
        companionFiles: fileRefSection.files,
      };
    }
  }

  return { content, format: 'cursor' };
}
```

**Verification**: to-cursor generates both formats

---

### 🔄 Update Claude Converters (3 hours)

#### **TASK-B7**: Update from-claude.ts (1.5 hours)

**File**: `packages/converters/src/from-claude.ts`

**Subtasks**:
- [ ] Detect skills with examples/ subdirectory
- [ ] Read example files
- [ ] Create FileReferenceSection
- [ ] Update tests

**Verification**: Multi-file skills detected

---

#### **TASK-B8**: Update to-claude.ts (1.5 hours)

**File**: `packages/converters/src/to-claude.ts`

**Subtasks**:
- [ ] Generate examples/ directory structure
- [ ] Return companion files
- [ ] Update tests

**Verification**: Generates multi-file skills

---

### 🖥️ CLI Updates (3 hours)

#### **TASK-B9**: Update install command for companion files (3 hours)

**File**: `packages/cli/src/commands/install.ts`

**Subtasks**:
- [ ] Add `--embed-files` flag
- [ ] Detect companion files in conversion result
- [ ] Install companion files to correct directories
- [ ] Create subdirectories as needed
- [ ] Update success messages
- [ ] Write integration tests

**Code**:
```typescript
async function installCursorRule(pkg: CanonicalPackage, options: InstallOptions) {
  const result = toCursor(pkg, { embedFiles: options.embedFiles });

  // Install main rule
  await saveFile(`.cursor/rules/${pkg.name}.mdc`, result.content);

  // Install companion files
  if (!options.embedFiles && result.companionFiles) {
    for (const file of result.companionFiles) {
      const filePath = `.cursor/rules/${pkg.name}/${file.path}`;
      await ensureDirectoryExists(path.dirname(filePath));
      await saveFile(filePath, file.content);
    }
    console.log(chalk.green(`✓ Installed with ${result.companionFiles.length} companion files`));
  }
}
```

**Verification**: Companion files install correctly

---

## Testing & Documentation (8 hours)

### 🧪 Integration Tests (4 hours)

#### **TASK-TEST-1**: Write roundtrip tests (2 hours)

**File**: `packages/converters/src/__tests__/roundtrip-cross-format.test.ts`

**Test Cases**:
```typescript
describe('Roundtrip conversions', () => {
  it('Gemini → Claude → Gemini maintains quality > 90%');
  it('Claude → Gemini → Claude maintains quality > 90%');
  it('Cursor multi-file → Canonical → Cursor preserves files');
});
```

**Verification**: All roundtrips successful

---

#### **TASK-TEST-2**: Write CLI integration tests (2 hours)

**File**: `packages/cli/src/__tests__/multi-file-install.test.ts`

**Test Cases**:
```typescript
describe('Multi-file installation', () => {
  it('should install Cursor rule with @file references');
  it('should install Cursor rule with embedded files');
  it('should install Claude skill with examples');
  it('should create proper directory structure');
});
```

**Verification**: CLI installs correctly

---

### 📚 Documentation (4 hours)

#### **TASK-DOC-1**: Update converter docs (2 hours)

**Files**:
- `packages/converters/docs/README.md` - Add cross-format section
- `packages/converters/docs/gemini-plugin.md` - Add conversion examples
- `packages/converters/docs/claude.md` - Add multi-file examples

**Verification**: Docs are comprehensive

---

#### **TASK-DOC-2**: Write user guide (2 hours)

**File**: Create `docs/guides/multi-file-packages.md`

**Sections**:
- What are multi-file packages?
- Using @file references in Cursor
- Converting between formats
- Examples and best practices

**Verification**: User guide is clear

---

## Final Checklist

### Before Creating PR

- [ ] All tasks marked complete
- [ ] All tests passing (npm test)
- [ ] All builds passing (npm run build)
- [ ] Linter passing (npm run lint)
- [ ] Coverage > 90% for new code
- [ ] Manual testing complete
- [ ] Documentation updated
- [ ] Commit messages follow conventional commits
- [ ] Branch rebased on latest main

### PR Creation

- [ ] Create PR with comprehensive description
- [ ] Link to implementation plan
- [ ] Add examples and screenshots
- [ ] Request review from team
- [ ] Monitor CI/CD pipeline

---

## Time Tracking Template

Use this to track actual time spent:

```
TASK-A1: Create mcp-transformer.ts
Estimated: 2h
Actual: ___h
Notes: ___

TASK-A2: Implement Gemini → Claude
Estimated: 1h
Actual: ___h
Notes: ___

[Continue for all tasks]

Total Estimated: 58h
Total Actual: ___h
Variance: ___h
```

---

## Emergency Rollback Procedure

If something breaks:

1. **Stop immediately** - Don't commit broken code
2. **Identify issue** - Run failing test, check error
3. **Quick fix** - If < 15min, fix immediately
4. **Otherwise** - Revert last commit, create issue
5. **Document** - Note what broke and why

---

## Daily Progress Template

```markdown
## Day 1 Progress (Date: ___)

### Completed
- [ ] TASK-A1
- [ ] TASK-A2

### In Progress
- [ ] TASK-A3 (50% done)

### Blocked
- None

### Notes
- MCP transformer working well
- Need to adjust quality scoring

### Tomorrow
- Complete TASK-A3
- Start TASK-A4
```
