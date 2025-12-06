# Cross-Format Conversion Analysis: Gemini ↔ Claude ↔ Cursor

## Executive Summary

This document analyzes cross-format conversion opportunities between:
1. **Gemini Extensions** ↔ **Claude Plugins** (high compatibility)
2. **Multi-file packages** → **Cursor Rules** (with file embedding)

## 1. Gemini Extension ↔ Claude Plugin Conversion

### Structural Comparison

| Feature | Gemini Extension | Claude Plugin | Conversion Difficulty |
|---------|------------------|---------------|---------------------|
| Config format | JSON | JSON | ✅ Trivial |
| MCP servers | `mcpServers` object | `mcpServers` object | ✅ Nearly identical |
| Server transport | Inferred from `command`/`url` | Explicit `type` field | ⚠️ Easy (add/remove type) |
| Metadata | name, version, description, author | name, version, description, author, license, repository, homepage, keywords | ⚠️ Claude has more fields |
| Bundled content | Context files (markdown) | Agents, skills, commands (markdown) | ⚠️ Different paradigms |
| Variable substitution | `${extensionPath}`, `${home}` | None | ❌ Lossy (needs warning) |
| Tool exclusion | `excludeTools` array | Not supported | ❌ Lossy |
| Location | `~/.gemini/extensions/<name>/` | `.claude/plugins/<name>/` | N/A (install-time) |

### MCP Server Conversion Logic

#### Gemini → Claude

**Input (Gemini):**
```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${extensionPath}/workspace"],
      "env": { "SOME_VAR": "${CUSTOM_VAR}" },
      "disabled": false
    },
    "remote-api": {
      "command": "curl",
      "args": ["https://api.example.com/mcp"]
    }
  },
  "contextFileName": "CONTEXT.md",
  "excludeTools": ["dangerous-tool"]
}
```

**Output (Claude):**
```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${extensionPath}/workspace"],
      "env": { "SOME_VAR": "${CUSTOM_VAR}" }
    },
    "remote-api": {
      "type": "stdio",
      "command": "curl",
      "args": ["https://api.example.com/mcp"]
    }
  }
}
```

**Conversion Rules:**
1. Add `type: "stdio"` to all MCP servers (default)
2. Remove `disabled` field (not supported in Claude)
3. **WARNING**: Variable substitution `${extensionPath}` won't work in Claude
4. **WARNING**: `excludeTools` not supported in Claude
5. **WARNING**: `contextFileName` not directly supported (convert to agent/skill)
6. Optional: Convert context file → Claude skill

**Quality Score Reduction:**
- Variable substitution used: -10 points
- `excludeTools` present: -5 points
- `contextFileName` present: -5 points
- `disabled` servers: -5 points each

---

#### Claude → Gemini

**Input (Claude):**
```json
{
  "name": "dev-tools",
  "version": "2.0.0",
  "description": "Development tools bundle",
  "author": "Dev Team <dev@example.com>",
  "license": "MIT",
  "repository": "https://github.com/org/dev-tools",
  "keywords": ["development", "tools"],
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "postgresql://..." }
    },
    "remote-api": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

**Output (Gemini):**
```json
{
  "name": "dev-tools",
  "version": "2.0.0",
  "description": "Development tools bundle",
  "author": "Dev Team <dev@example.com>",
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  },
  "experimentalSettings": {
    "__prpm_original_format": "claude",
    "__prpm_lost_fields": {
      "license": "MIT",
      "repository": "https://github.com/org/dev-tools",
      "keywords": ["development", "tools"]
    },
    "__prpm_unsupported_servers": {
      "remote-api": {
        "type": "http",
        "url": "https://api.example.com/mcp",
        "reason": "Gemini only supports stdio MCP servers via command/args"
      }
    }
  }
}
```

**Conversion Rules:**
1. Remove `type` field (Gemini infers stdio from `command` presence)
2. **WARNING**: HTTP/SSE servers not supported - move to experimental
3. **PRESERVE**: Store `license`, `repository`, `keywords` in `experimentalSettings` for roundtrip
4. Optional: Suggest user moves unsupported servers to custom implementation

**Quality Score Reduction:**
- HTTP/SSE servers: -15 points per server
- Lost metadata fields: -5 points

---

### Bundled Content Conversion

#### Gemini Context Files → Claude Skills

**Gemini structure:**
```
~/.gemini/extensions/my-extension/
├── gemini-extension.json
├── GEMINI.md (or custom contextFileName)
└── commands/
    └── custom-cmd.toml
```

**Claude structure:**
```
.claude/plugins/my-extension/
├── plugin.json
├── skills/
│   └── extension-context.md
└── commands/
    └── custom-cmd.md
```

**Conversion:**
1. Take `GEMINI.md` → Create `.claude/plugins/<name>/skills/context.md`
2. Add frontmatter:
   ```yaml
   ---
   name: <extension-name>-context
   description: <from extension description>
   ---
   ```
3. Add context file content as markdown body

#### Claude Agents/Skills → Gemini Context File

**Merge strategy:**
1. Concatenate all agents and skills into single `GEMINI.md`
2. Use markdown sections to separate:
   ```markdown
   # My Extension Context

   ## Agent: Code Reviewer
   [agent content]

   ## Skill: Refactor Helper
   [skill content]
   ```
3. **WARNING**: Tool restrictions from agents lost
4. **WARNING**: Agent modes (subagent/primary) lost

---

## 2. Multi-File Packages → Cursor Rules

### Problem Statement

Cursor rules are **single markdown files** with no native support for:
- Including other files via `@file`
- Multi-file rule packages
- Nested content structures

**Users want:**
- Skills that reference multiple example files
- Agents with separate instruction sets
- Reusable components across rules

### Solution: Embedded File Sections

Add a new canonical section type: `FilesSection`

```typescript
export interface FilesSection {
  type: 'files';
  files: Array<{
    path: string;
    content: string;
    description?: string;
  }>;
}
```

#### Canonical Representation

```json
{
  "format": "canonical",
  "version": "1.0",
  "sections": [
    {
      "type": "metadata",
      "data": { "title": "Multi-File Skill" }
    },
    {
      "type": "instructions",
      "title": "Main Instructions",
      "content": "Follow the patterns in the example files below."
    },
    {
      "type": "files",
      "files": [
        {
          "path": "examples/api-client.ts",
          "description": "Example API client implementation",
          "content": "export class APIClient { ... }"
        },
        {
          "path": "examples/test-pattern.ts",
          "description": "Testing pattern",
          "content": "describe('APIClient', () => { ... })"
        }
      ]
    }
  ]
}
```

#### Conversion to Cursor Rule

**Output:**
```markdown
---
description: Multi-File Skill with embedded examples
---

# Multi-File Skill

Follow the patterns in the example files below.

## 📁 Included Files

### examples/api-client.ts

Example API client implementation

\`\`\`typescript
export class APIClient {
  // implementation
}
\`\`\`

### examples/test-pattern.ts

Testing pattern

\`\`\`typescript
describe('APIClient', () => {
  // tests
});
\`\`\`
```

**Benefits:**
- Single file (Cursor compatible)
- Clear file boundaries
- Syntax highlighting preserved
- Can reference "see examples/api-client.ts above"

---

### Cursor Rule → Multi-File Package

**Detection:** Parse markdown for file sections

```markdown
## 📁 File: utils/helper.ts

\`\`\`typescript
export function helper() {}
\`\`\`

## 📁 File: tests/helper.test.ts

\`\`\`typescript
import { helper } from '../utils/helper';
\`\`\`
```

**Extract to:**
- `FilesSection` in canonical
- Actual files when installing to Claude/Gemini

---

## 3. Implementation Roadmap

### Phase 1: Gemini ↔ Claude Plugin Conversion (HIGH VALUE)

**Files to create/modify:**
1. ✅ `from-gemini-plugin.ts` (exists)
2. ✅ `to-gemini-plugin.ts` (exists)
3. ✅ `from-claude-plugin.ts` (exists)
4. ✅ `to-claude-plugin.ts` (exists)
5. **NEW**: Add cross-converter that bridges them:
   - `gemini-to-claude-plugin.ts`
   - `claude-to-gemini-plugin.ts`

**Logic:**
```typescript
// Gemini → Canonical → Claude
export function geminiPluginToClaudePlugin(geminiExt: GeminiExtensionConfig): ClaudePluginJson {
  // 1. Parse Gemini extension
  const canonical = fromGeminiPlugin(geminiExtContent, metadata);

  // 2. Transform MCP servers
  const transformedCanonical = transformMCPServers(canonical, 'gemini', 'claude');

  // 3. Convert to Claude plugin
  const claudeResult = toClaudePlugin(transformedCanonical);

  return claudeResult;
}

function transformMCPServers(pkg: CanonicalPackage, from: 'gemini' | 'claude', to: 'gemini' | 'claude') {
  const geminiExt = pkg.metadata?.geminiExtension;
  const claudePlug = pkg.metadata?.claudePlugin;

  if (from === 'gemini' && to === 'claude' && geminiExt?.mcpServers) {
    // Add type: stdio, remove disabled, warn about variables
    const claudeServers = {};
    for (const [name, server] of Object.entries(geminiExt.mcpServers)) {
      if (server.disabled) {
        warnings.push(`Server "${name}" is disabled in Gemini but Claude doesn't support disabled servers`);
        continue;
      }
      claudeServers[name] = {
        type: 'stdio',
        command: server.command,
        args: server.args,
        env: server.env,
      };
      if (hasVariableSubstitution(server)) {
        warnings.push(`Server "${name}" uses Gemini variable substitution which won't work in Claude`);
      }
    }

    pkg.metadata.claudePlugin = {
      ...pkg.metadata.claudePlugin,
      mcpServers: claudeServers,
    };
  }

  if (from === 'claude' && to === 'gemini' && claudePlug?.mcpServers) {
    // Remove type, filter HTTP/SSE, store in experimental
    const geminiServers = {};
    const unsupportedServers = {};

    for (const [name, server] of Object.entries(claudePlug.mcpServers)) {
      if (server.type === 'http' || server.type === 'sse') {
        unsupportedServers[name] = {
          ...server,
          reason: 'Gemini only supports stdio servers',
        };
        warnings.push(`Server "${name}" uses ${server.type} which Gemini doesn't support`);
        continue;
      }

      geminiServers[name] = {
        command: server.command,
        args: server.args,
        env: server.env,
      };
    }

    pkg.metadata.geminiExtension = {
      ...pkg.metadata.geminiExtension,
      mcpServers: geminiServers,
      experimentalSettings: {
        __prpm_unsupported_servers: unsupportedServers,
      },
    };
  }

  return pkg;
}
```

**Tests needed:**
- Roundtrip: Gemini → Claude → Gemini
- Roundtrip: Claude → Gemini → Claude
- MCP server transformation
- Variable substitution warnings
- HTTP/SSE server handling

---

### Phase 2: Cursor Multi-File Support (MEDIUM VALUE)

**Files to create/modify:**
1. `packages/converters/src/types/canonical.ts` - Add `FilesSection`
2. `packages/converters/src/from-cursor.ts` - Detect embedded files
3. `packages/converters/src/to-cursor.ts` - Generate embedded file sections
4. `packages/converters/schemas/cursor.schema.json` - Document pattern (no schema change needed)

**Detection regex:**
```typescript
const FILE_SECTION_REGEX = /^##\s+📁\s+(?:File:\s+)?(.+?)\s*$/gm;
const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;

function extractEmbeddedFiles(markdown: string): FilesSection | null {
  const files: FileEntry[] = [];
  const sections = markdown.split(FILE_SECTION_REGEX);

  for (let i = 1; i < sections.length; i += 2) {
    const path = sections[i].trim();
    const content = sections[i + 1];

    // Extract code block
    const codeMatch = CODE_BLOCK_REGEX.exec(content);
    if (codeMatch) {
      files.push({
        path,
        content: codeMatch[2],
        description: content.slice(0, codeMatch.index).trim(),
      });
    }
  }

  return files.length > 0 ? { type: 'files', files } : null;
}
```

**Generation:**
```typescript
function generateEmbeddedFiles(filesSection: FilesSection): string {
  const parts = ['## 📁 Included Files\n'];

  for (const file of filesSection.files) {
    parts.push(`### ${file.path}\n`);
    if (file.description) {
      parts.push(`${file.description}\n\n`);
    }
    const ext = file.path.split('.').pop();
    parts.push(`\`\`\`${ext}\n${file.content}\n\`\`\`\n\n`);
  }

  return parts.join('');
}
```

---

### Phase 3: Enhanced Conversions (LOW PRIORITY)

1. **Claude Plugin → Cursor**: Convert agents to rules, preserve tool restrictions
2. **Gemini Extension → Cursor**: Convert context file to rule
3. **Multi-format bundles**: Single PRPM package → Multiple formats

---

## 4. Quality Scoring Matrix

| Conversion | Lossless? | Quality Score | Notes |
|------------|-----------|---------------|-------|
| Gemini → Claude (stdio only) | ✅ Yes | 95 | Minor: variable substitution warnings |
| Gemini → Claude (with exclusions) | ⚠️ Partial | 85 | Lost: excludeTools, disabled servers |
| Claude → Gemini (stdio only) | ✅ Yes | 95 | Lost: license, repository, keywords (stored in experimental) |
| Claude → Gemini (with HTTP/SSE) | ❌ No | 70 | Lost: HTTP/SSE servers |
| Multi-file → Cursor | ✅ Yes | 100 | Embedded files preserve all content |
| Cursor → Multi-file | ✅ Yes | 100 | If file markers present |
| Claude Plugin → Gemini Extension | ⚠️ Partial | 80 | Lost: agents/skills structure, tool restrictions |
| Gemini Extension → Claude Plugin | ⚠️ Partial | 85 | Context file → skill conversion |

---

## 5. User-Facing Documentation

### Converting Between Formats

#### Gemini Extension → Claude Plugin

```bash
# Install Gemini extension as Claude plugin
prpm install @user/my-extension --as claude --subtype plugin

# Warnings you might see:
# ⚠️  Server "filesystem" uses Gemini variable substitution ${extensionPath}
#     In Claude, you'll need to use absolute paths or update the server configuration
# ⚠️  excludeTools not supported in Claude - tools will be available
```

#### Claude Plugin → Gemini Extension

```bash
# Install Claude plugin as Gemini extension
prpm install @user/dev-tools --as gemini --subtype extension

# Warnings you might see:
# ⚠️  Server "api-server" uses HTTP transport which Gemini doesn't support
#     Only stdio servers will be installed
# ℹ️  License, repository, and keywords stored in experimentalSettings for roundtrip
```

#### Multi-File Package → Cursor Rule

```bash
# Install Claude skill with examples as single Cursor rule
prpm install @user/api-patterns --as cursor --subtype rule

# Result: Single .cursor/rules/api-patterns.md with embedded example files
```

---

## 6. Breaking Changes & Migrations

**None** - All conversions are additive:
- Existing converters unchanged
- New `FilesSection` is optional
- Cross-format converters are new functionality

---

## 7. Success Metrics

**Phase 1 (Gemini ↔ Claude):**
- ✅ 95%+ roundtrip quality for stdio servers
- ✅ Clear warnings for lossy conversions
- ✅ 100+ test cases covering edge cases

**Phase 2 (Cursor Multi-File):**
- ✅ Can embed 10+ files in single rule
- ✅ Proper syntax highlighting preserved
- ✅ Easy to reference files in instructions

---

## Appendix: Examples

### Example 1: Full Gemini → Claude Conversion

**Input: `~/.gemini/extensions/playwright-mcp/gemini-extension.json`**
```json
{
  "name": "playwright-mcp",
  "version": "1.2.0",
  "description": "Browser automation via Playwright MCP server",
  "author": "Automation Team",
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  },
  "contextFileName": "PLAYWRIGHT.md"
}
```

**Input: `~/.gemini/extensions/playwright-mcp/PLAYWRIGHT.md`**
```markdown
# Playwright Automation Guide

Use Playwright MCP for browser automation tasks.

## Common Patterns

- Use `page.goto()` for navigation
- `page.click()` for interactions
- `page.screenshot()` for debugging
```

**Output: `.claude/plugins/playwright-mcp/plugin.json`**
```json
{
  "name": "playwright-mcp",
  "version": "1.2.0",
  "description": "Browser automation via Playwright MCP server",
  "author": "Automation Team",
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

**Output: `.claude/plugins/playwright-mcp/skills/playwright-context.md`**
```markdown
---
name: playwright-automation
description: Browser automation via Playwright MCP server
---

# Playwright Automation Guide

Use Playwright MCP for browser automation tasks.

## Common Patterns

- Use `page.goto()` for navigation
- `page.click()` for interactions
- `page.screenshot()` for debugging
```

**Conversion summary:**
- ✅ MCP server converted (added type: stdio)
- ✅ Context file → Claude skill
- ✅ Quality score: 95/100
- ℹ️  No warnings

---

### Example 2: Claude Plugin → Gemini with Unsupported Server

**Input: `.claude/plugins/api-tools/plugin.json`**
```json
{
  "name": "api-tools",
  "version": "1.0.0",
  "description": "API development tools",
  "mcpServers": {
    "local-db": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@example/db-server"]
    },
    "remote-api": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

**Output: `~/.gemini/extensions/api-tools/gemini-extension.json`**
```json
{
  "name": "api-tools",
  "version": "1.0.0",
  "description": "API development tools",
  "mcpServers": {
    "local-db": {
      "command": "npx",
      "args": ["-y", "@example/db-server"]
    }
  },
  "experimentalSettings": {
    "__prpm_original_format": "claude",
    "__prpm_unsupported_servers": {
      "remote-api": {
        "type": "http",
        "url": "https://api.example.com/mcp",
        "reason": "Gemini only supports stdio MCP servers"
      }
    }
  }
}
```

**Conversion summary:**
- ⚠️  Server "remote-api" uses HTTP transport which Gemini doesn't support
- ✅ Local stdio server converted successfully
- ✅ Unsupported server preserved in experimentalSettings for roundtrip
- ✅ Quality score: 80/100

---

### Example 3: Multi-File Skill → Cursor Rule

**Input: Canonical package with FilesSection**
```json
{
  "name": "api-client-pattern",
  "format": "claude",
  "subtype": "skill",
  "content": {
    "sections": [
      {
        "type": "instructions",
        "content": "Follow the API client pattern shown in the examples."
      },
      {
        "type": "files",
        "files": [
          {
            "path": "examples/client.ts",
            "description": "Main API client class",
            "content": "export class APIClient {\n  async fetch() {}\n}"
          },
          {
            "path": "examples/client.test.ts",
            "description": "Test pattern",
            "content": "describe('APIClient', () => {})"
          }
        ]
      }
    ]
  }
}
```

**Output: `.cursor/rules/api-client-pattern.md`**
```markdown
---
description: Follow the API client pattern shown in the examples
---

# API Client Pattern

Follow the API client pattern shown in the examples.

## 📁 Included Files

### examples/client.ts

Main API client class

\`\`\`ts
export class APIClient {
  async fetch() {}
}
\`\`\`

### examples/client.test.ts

Test pattern

\`\`\`ts
describe('APIClient', () => {})
\`\`\`
```

**Conversion summary:**
- ✅ All files embedded in single rule
- ✅ Syntax highlighting preserved
- ✅ Quality score: 100/100
- ✅ Lossless conversion

---

## Conclusion

**High Priority:** Gemini ↔ Claude plugin conversion (nearly identical structures, high user value)

**Medium Priority:** Cursor multi-file support (user-requested feature, good UX)

**Implementation Complexity:**
- Phase 1: Medium (MCP server transformation logic)
- Phase 2: Low (markdown parsing/generation)

**Estimated LOC:**
- Phase 1: ~400 lines (converters + tests)
- Phase 2: ~200 lines (file section support)
