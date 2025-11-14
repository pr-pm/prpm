# Kiro Hooks Format Specification

**File Location:** `.kiro/hooks/*.json`
**Format:** JSON configuration
**Official Docs:** https://kiro.dev/docs/hooks/

## Overview

Kiro hooks are event-driven automations that trigger actions when specific file system events occur. Unlike steering files (which are markdown), hooks are JSON configuration files that define when and how to respond to events.

## Hook Structure

```json
{
  "name": "Hook Name",
  "description": "What this hook does",
  "version": "1",
  "when": {
    "type": "eventType",
    "patterns": ["glob", "patterns"]
  },
  "then": {
    "type": "actionType",
    "prompt": "Instructions for agent"
  }
}
```

## Required Fields

- **`name`** (string): Human-readable name for the hook
- **`description`** (string): Explanation of what the hook does
- **`version`** (string): Hook version (typically "1")
- **`when`** (object): Event trigger configuration
  - **`type`** (string): Event type (e.g., "fileCreated", "fileModified", "fileDeleted")
  - **`patterns`** (array of strings): Glob patterns to match files
- **`then`** (object): Action to take when event occurs
  - **`type`** (string): Action type (e.g., "askAgent", "runCommand")
  - Additional fields depend on action type

## Event Types

### fileCreated
Triggers when new files are created matching the patterns.

```json
{
  "when": {
    "type": "fileCreated",
    "patterns": [
      "src/components/**/*.tsx",
      "src/pages/**/*.tsx"
    ]
  }
}
```

### fileModified
Triggers when files are modified.

```json
{
  "when": {
    "type": "fileModified",
    "patterns": ["package.json", "tsconfig.json"]
  }
}
```

### fileDeleted
Triggers when files are deleted.

```json
{
  "when": {
    "type": "fileDeleted",
    "patterns": ["src/**/*.ts"]
  }
}
```

## Action Types

### askAgent
Asks the Kiro agent to perform a task with a specific prompt.

```json
{
  "then": {
    "type": "askAgent",
    "prompt": "Analyze the new file and suggest improvements"
  }
}
```

### runCommand
Executes a shell command.

```json
{
  "then": {
    "type": "runCommand",
    "command": "npm run lint"
  }
}
```

## Examples

### Automatic Test File Creation

```json
{
  "name": "Auto Test Files",
  "description": "Creates test files for new components",
  "version": "1",
  "when": {
    "type": "fileCreated",
    "patterns": ["src/components/**/*.tsx"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "A new component was created. Create a corresponding test file following our testing patterns. Use React Testing Library and include tests for rendering and key interactions."
  }
}
```

### Image Asset Indexer

```json
{
  "name": "Image Asset Indexer",
  "description": "Automatically adds references to newly added image files in the assets folder to the index.ts file",
  "version": "1",
  "when": {
    "type": "fileCreated",
    "patterns": [
      "client/src/assets/*.png",
      "client/src/assets/*.jpg",
      "client/src/assets/*.jpeg",
      "client/src/assets/*.gif",
      "client/src/assets/*.svg"
    ]
  },
  "then": {
    "type": "askAgent",
    "prompt": "A new image file has been added to the assets folder. Please update the index.ts file in the assets folder to include a reference to this new image. First, check the current structure of the index.ts file to understand how images are referenced. Then add an appropriate export statement for the new image file following the existing pattern. Make sure to maintain alphabetical order if that's the current convention."
  }
}
```

### Dependency Update Checker

```json
{
  "name": "Dependency Update Checker",
  "description": "Checks for breaking changes when package.json is modified",
  "version": "1",
  "when": {
    "type": "fileModified",
    "patterns": ["package.json"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "package.json was modified. Check if any dependencies were updated and review the changelog for breaking changes. Suggest any code updates needed."
  }
}
```

## Best Practices

1. **Specific patterns**: Use precise glob patterns to avoid triggering unnecessarily
2. **Clear prompts**: Write detailed agent prompts explaining the context and desired outcome
3. **Idempotent actions**: Ensure hooks can run multiple times safely
4. **Performance**: Avoid hooks on frequently modified files
5. **Testing**: Test hooks in isolation before deploying

## Conversion Notes

### From Canonical

- Hooks are a distinct package type with hookType metadata
- JSON structure extracted from code blocks or metadata
- Event types and patterns mapped to when configuration
- Action prompts extracted to then configuration

### To Canonical

- JSON structure parsed into metadata
- Event configuration becomes hookType metadata
- Hook prompt becomes primary content
- Version preserved in package version

## Limitations

- Event types are Kiro-specific (no direct equivalents in other tools)
- Glob patterns only (no regex support)
- Limited to file system events
- Agent prompts must be strings (no complex instructions)

## Differences from Other Formats

**vs Kiro Steering Files:**
- JSON format (not markdown)
- Event-driven (not context-based)
- Automation focus (not guidance)
- Separate file location (.kiro/hooks/ vs .kiro/steering/)

**vs Claude Hooks:**
- JSON configuration (Claude hooks are executable scripts)
- Event-based triggers (Claude hooks use lifecycle events)
- Agent-driven actions (Claude hooks run arbitrary code)

**vs GitHub Actions:**
- File-based events (not git events)
- Agent prompts (not workflow steps)
- Local execution (not CI/CD)

## Migration Tips

1. **Identify automation opportunities**: Look for repetitive tasks after file changes
2. **Start with file creation hooks**: Most useful for scaffolding
3. **Clear agent instructions**: Provide context about project patterns
4. **Test incrementally**: Add hooks one at a time
5. **Monitor performance**: Ensure hooks don't slow down development
