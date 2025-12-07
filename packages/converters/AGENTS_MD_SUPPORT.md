# agents.md Support Documentation

## Overview

The `format-capabilities.json` file serves as the **single source of truth** for which formats support agents.md for progressive disclosure. Every format has a `supportsAgentsMd` boolean flag clearly indicating support.

## How to Check agents.md Support

### 1. In the JSON Schema

Each format entry in `src/utils/format-capabilities.json` has a `supportsAgentsMd` field:

```json
{
  "claude": {
    "name": "Claude Code",
    "supportsSkills": true,
    "supportsPlugins": true,
    "supportsExtensions": false,
    "supportsAgents": true,
    "supportsAgentsMd": true,  // ← Clearly marked!
    "markdownFallback": "CLAUDE.md",
    "notes": "Claude Code supports skills, agents, and plugins. Full agents.md support for progressive disclosure."
  }
}
```

### 2. In Code

Use the `supportsAgentsMd()` helper function:

```typescript
import { supportsAgentsMd } from './utils/progressive-disclosure.js';

if (supportsAgentsMd('claude')) {
  // Use agents.md for progressive disclosure
}
```

### 3. Get All Supported Formats

Access the `AGENTS_MD_SUPPORTED_FORMATS` constant:

```typescript
import { AGENTS_MD_SUPPORTED_FORMATS } from './utils/progressive-disclosure.js';

console.log(AGENTS_MD_SUPPORTED_FORMATS);
// ['claude', 'kiro', 'opencode', 'ruler', 'droid', 'replit', 'agents.md', 'generic']
```

## Formats Supporting agents.md

**8 formats** support agents.md for progressive disclosure:

| Format | Name | supportsAgentsMd | Notes |
|--------|------|------------------|-------|
| **claude** | Claude Code | ✅ `true` | Full agents.md support for progressive disclosure |
| **kiro** | Kiro AI | ✅ `true` | Kiro supports agents in .kiro/agents/ directory |
| **opencode** | OpenCode | ✅ `true` | OpenCode supports agents with mode/model/temperature config |
| **ruler** | Ruler | ✅ `true` | Ruler supports agents in .ruler/agents/ directory |
| **droid** | Factory Droid | ✅ `true` | Factory Droid supports both skills and agents |
| **replit** | Replit Agent | ✅ `true` | Replit Agent supports agents in .replit_agent_instructions.md |
| **agents.md** | agents.md (Universal) | ✅ `true` | Native agents.md format |
| **generic** | Generic (Markdown) | ✅ `true` | Generic markdown format for maximum compatibility |

## Formats NOT Supporting agents.md

**9 formats** do NOT support agents.md:

| Format | Name | supportsAgentsMd | Notes |
|--------|------|------------------|-------|
| **cursor** | Cursor | ❌ `false` | Uses simple .cursorrules files |
| **continue** | Continue | ❌ `false` | Uses simple prompt files |
| **windsurf** | Windsurf | ❌ `false` | Markdown rules with 12K character limit |
| **copilot** | GitHub Copilot | ❌ `false` | Uses simple instruction files |
| **gemini** | Gemini Code Assist | ❌ `false` | Uses extensions in gemini_extensions.json |
| **trae** | Trae | ❌ `false` | Uses simple markdown rules |
| **aider** | Aider | ❌ `false` | Uses CONVENTIONS.md for coding standards |
| **zencoder** | Zencoder | ❌ `false` | Uses simple rules with glob patterns |
| **mcp** | Model Context Protocol | ❌ `false` | Server protocol, not a package format |

## Validation

The `format-capabilities-validation.test.ts` file contains **19 comprehensive tests** that ensure:

1. ✅ All formats have `supportsAgentsMd` boolean field
2. ✅ `agentsMdSupport.formats` array matches individual flags
3. ✅ `AGENTS_MD_SUPPORTED_FORMATS` constant matches JSON
4. ✅ `supportsAgentsMd()` function returns correct values
5. ✅ Notes mention 'agent' for formats with support
6. ✅ No conflicting capability flags
7. ✅ Specific format validations (claude, droid, gemini, cursor)

Run validation tests:

```bash
npm test -- format-capabilities-validation
```

## Adding a New Format

To add a new format with agents.md support:

1. Add entry to `src/utils/format-capabilities.json`:

```json
{
  "newformat": {
    "name": "New Format",
    "supportsSkills": false,
    "supportsPlugins": false,
    "supportsExtensions": false,
    "supportsAgents": true,
    "supportsAgentsMd": true,  // ← Set to true!
    "markdownFallback": "newformat-rules.md",
    "notes": "New Format supports agents. Full agents.md support."
  }
}
```

2. Add to `agentsMdSupport.formats` array:

```json
{
  "agentsMdSupport": {
    "description": "Formats that intelligently support agents.md for progressive disclosure",
    "formats": [
      "claude",
      "kiro",
      "opencode",
      "ruler",
      "droid",
      "replit",
      "agents.md",
      "generic",
      "newformat"  // ← Add here!
    ]
  }
}
```

3. Run validation tests to ensure consistency:

```bash
npm test -- format-capabilities-validation
```

The validation tests will catch any inconsistencies between the `supportsAgentsMd` flag and the `agentsMdSupport.formats` array.

## Progressive Disclosure Strategy

When converting from a format that supports advanced features (skills, plugins) to a format that doesn't:

1. **Check target format capabilities**: Use `supportsAgentsMd(targetFormat)`
2. **If supported**: Generate both format-specific file AND agents.md fallback
3. **If not supported**: Only generate format-specific fallback (e.g., cursor-rules.md)

Example:

```typescript
import { getConversionStrategy } from './utils/progressive-disclosure.js';

const strategy = getConversionStrategy('cursor', 'skill');
// Returns:
// {
//   strategy: 'progressive',
//   primaryFormat: 'markdown',
//   primaryFilename: 'cursor-rules.md',
//   fallbackFilename: 'agents.md',
//   qualityScore: 85
// }
```

This ensures intelligent fallback behavior based on format capabilities defined in the JSON schema.
