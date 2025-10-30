# Real-World Slash Command Examples

Production-ready slash command examples for common development workflows.

## Code Quality & Review

### `/review-pr` - Pull Request Review

**File:** `.claude/commands/review-pr.md`

```markdown
---
description: Comprehensive pull request review
argument-hint: [pr-number]
allowed-tools: Bash(gh *), Bash(git *), Read
---

Review PR #$1 comprehensively:

Get PR details:
!`gh pr view $1`

Get changed files:
!`gh pr diff $1`

Review for:

## 1. Code Quality
- Clean, readable code
- Proper naming conventions
- DRY principle followed
- Appropriate abstractions

## 2. Security
- Input validation present
- SQL injection prevented
- XSS vulnerabilities checked
- Secrets not committed

## 3. Performance
- No O(n²) algorithms
- Efficient data structures
- No memory leaks
- Appropriate caching

## 4. Testing
- Unit tests included
- Edge cases covered
- Integration tests present
- Test names are descriptive

## 5. Documentation
- README updated if needed
- Code comments for complex logic
- API docs complete
- CHANGELOG updated

Provide specific file:line references for all issues found.
```

### `/code-quality` - Quick Quality Check

**File:** `.claude/commands/code-quality.md`

```markdown
---
description: Analyze code quality in current file
model: claude-3-5-haiku-20241022
---

Analyze current file for:

1. **Complexity** - Cyclomatic complexity, nested levels
2. **Readability** - Naming, structure, comments
3. **Maintainability** - DRY, SOLID principles
4. **Performance** - Obvious inefficiencies
5. **Security** - Basic vulnerability check

Provide a score (1-10) for each category and specific improvements.
```

## Git Workflows

### `/feature` - Create Feature Branch

**File:** `.claude/commands/git/feature.md`

```markdown
---
description: Create and push feature branch
argument-hint: [feature-name]
allowed-tools: Bash(git *)
---

Create feature branch:

!`git checkout main`
!`git pull origin main`
!`git checkout -b feature/$1`
!`git push -u origin feature/$1`

✅ Branch `feature/$1` created and pushed to origin.

Next steps:
1. Make your changes
2. Commit with: `/commit`
3. Create PR with: `/pr $1`
```

### `/commit` - Smart Git Commit

**File:** `.claude/commands/git/commit.md`

```markdown
---
description: Create smart git commit
allowed-tools: Bash(git *)
---

Generate commit from staged changes:

Staged files:
!`git diff --cached --name-only`

Changes:
!`git diff --cached`

I'll create a commit message following Conventional Commits:

Format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructure
- `test:` - Tests
- `chore:` - Maintenance

Then execute:
!`git commit -m "..."`
```

### `/sync` - Sync with Main

**File:** `.claude/commands/git/sync.md`

```markdown
---
description: Sync current branch with main
allowed-tools: Bash(git *)
---

Sync current branch with main:

!`git fetch origin`
!`git merge origin/main`

If conflicts occur, I'll help resolve them.

Current status:
!`git status`
```

## Testing

### `/test-gen` - Generate Tests

**File:** `.claude/commands/testing/test-gen.md`

```markdown
---
description: Generate test cases for file
argument-hint: [file-path]
allowed-tools: Read, Write
---

Generate comprehensive tests for:

@$1

Test coverage:

1. **Happy Path**
   - Normal inputs
   - Expected outputs
   - Standard workflows

2. **Edge Cases**
   - Empty inputs
   - Null/undefined
   - Boundary values
   - Large datasets

3. **Error Cases**
   - Invalid inputs
   - Type mismatches
   - Network failures
   - Permission errors

4. **Integration**
   - Component interaction
   - API calls
   - Database operations
   - External dependencies

Use existing test framework and naming conventions.
```

### `/test-fix` - Fix Failing Tests

**File:** `.claude/commands/testing/test-fix.md`

```markdown
---
description: Analyze and fix failing tests
allowed-tools: Bash(npm test:*), Read, Edit
---

Run tests:
!`npm test`

Analyze failures and fix:

1. Read failing test files
2. Understand expected vs actual behavior
3. Identify root cause
4. Propose fix
5. Update code
6. Re-run tests

For each failure, provide:
- **Cause:** Why it failed
- **Fix:** What to change
- **Code:** Updated implementation
```

## Documentation

### `/docs-api` - Generate API Docs

**File:** `.claude/commands/docs/api.md`

```markdown
---
description: Generate API documentation
argument-hint: [file-path]
allowed-tools: Read, Write
---

Generate API docs for:

@$1

Include:

## Functions

For each exported function:

### `functionName(param1, param2)`

**Description:** What it does

**Parameters:**
- `param1` (type): Description
- `param2` (type): Description

**Returns:** Type and description

**Example:**
\`\`\`typescript
// Usage example
\`\`\`

**Throws:**
- ErrorType: When this happens

## Classes

For each class:

### `ClassName`

**Description:** Purpose

**Constructor:**
\`\`\`typescript
new ClassName(options)
\`\`\`

**Methods:**
- `method()` - Description

**Properties:**
- `property` - Description

**Example:**
\`\`\`typescript
// Usage example
\`\`\`
```

### `/readme` - Generate/Update README

**File:** `.claude/commands/docs/readme.md`

```markdown
---
description: Generate or update README
allowed-tools: Read, Write, Bash(git *)
---

Generate comprehensive README.md:

## Project Info
!`git remote get-url origin`
!`ls package.json && cat package.json`

## Structure

# Project Name

Brief description

## Features
- Feature 1
- Feature 2

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`typescript
// Example code
\`\`\`

## API

[Link to full API docs]

## Configuration

Environment variables and config options

## Development

\`\`\`bash
npm run dev
npm test
\`\`\`

## Contributing

Guidelines for contributors

## License

[License type]
```

## Refactoring

### `/extract-component` - Extract React Component

**File:** `.claude/commands/refactor/extract-component.md`

```markdown
---
description: Extract React component from selection
argument-hint: [component-name] [file-path]
allowed-tools: Read, Write, Edit
---

Extract component $1 from @$2:

1. Identify JSX block to extract
2. Determine props needed
3. Create new component file
4. Generate TypeScript interface for props
5. Replace original code with component usage
6. Add imports

New file: `src/components/$1.tsx`

\`\`\`typescript
interface $1Props {
  // Props
}

export const $1: React.FC<$1Props> = (props) => {
  // Component
}
\`\`\`

Updated original file with:
\`\`\`typescript
import { $1 } from './components/$1'

// Usage: <$1 prop={value} />
\`\`\`
```

### `/split-file` - Split Large File

**File:** `.claude/commands/refactor/split-file.md`

```markdown
---
description: Split large file into modules
argument-hint: [file-path]
allowed-tools: Read, Write
---

Split large file into logical modules:

Analyze: @$1

Strategy:
1. Group related functions/classes
2. Identify dependencies
3. Create module files
4. Extract code with minimal changes
5. Update imports/exports
6. Create index.ts barrel export

Proposed structure:
\`\`\`
src/
├── module1.ts  # Group 1
├── module2.ts  # Group 2
├── module3.ts  # Group 3
└── index.ts    # Barrel exports
\`\`\`

Each module will have clear responsibilities and minimal coupling.
```

## Deployment

### `/deploy` - Deploy to Environment

**File:** `.claude/commands/deploy.md`

```markdown
---
description: Deploy to specified environment
argument-hint: [env: dev|staging|prod]
allowed-tools: Bash(git *), Bash(npm *), Bash(docker *)
disable-model-invocation: true
---

Deploy to $1 environment:

## Pre-flight Checks

!`git status`
!`npm test`

## Build

!`npm run build`

## Deploy

!`npm run deploy:$1`

## Verify

Check deployment status:
!`curl https://$1.example.com/health`

## Rollback (if needed)

If deployment fails:
!`npm run rollback:$1`

Deployment to $1 complete. Monitor logs for issues.
```

## Database

### `/migrate` - Run Database Migrations

**File:** `.claude/commands/db/migrate.md`

```markdown
---
description: Run database migrations
argument-hint: <direction: up|down> <steps>
allowed-tools: Bash(npm run migrate:*), Bash(npx *)
---

Run database migrations ${1:-up} ${2:+$2 steps}:

## Current State

!`npm run migrate:status`

## Run Migration

!`npm run migrate:${1:-up} ${2:+-- --steps=$2}`

## New State

!`npm run migrate:status`

Migration complete. Check database schema.
```

## Performance

### `/benchmark` - Performance Benchmark

**File:** `.claude/commands/perf/benchmark.md`

```markdown
---
description: Benchmark function performance
argument-hint: [file-path] [function-name]
allowed-tools: Read, Write
---

Create performance benchmark for $2 in @$1:

Generate benchmark file: `benchmarks/$2.bench.ts`

\`\`\`typescript
import { $2 } from '@$1'

const iterations = 100000

// Small input
console.time('Small')
for (let i = 0; i < iterations; i++) {
  $2(/* small input */)
}
console.timeEnd('Small')

// Medium input
console.time('Medium')
for (let i = 0; i < iterations; i++) {
  $2(/* medium input */)
}
console.timeEnd('Medium')

// Large input
console.time('Large')
for (let i = 0; i < iterations; i++) {
  $2(/* large input */)
}
console.timeEnd('Large')
\`\`\`

Run with: `ts-node benchmarks/$2.bench.ts`
```

## Security

### `/security-scan` - Security Vulnerability Scan

**File:** `.claude/commands/security/scan.md`

```markdown
---
description: Scan for security vulnerabilities
allowed-tools: Bash(npm audit:*), Bash(git *), Read, Grep
---

Security scan:

## Dependency Vulnerabilities

!`npm audit`

## Secrets in Code

!`git grep -E "(password|secret|api[_-]?key|token)" --cached`

## Common Issues

Checking for:
- SQL injection patterns
- XSS vulnerabilities
- Insecure randomness
- Hardcoded credentials
- Unvalidated redirects
- CORS misconfigurations

Report format:
- **Critical:** Immediate action required
- **High:** Fix soon
- **Medium:** Schedule fix
- **Low:** Consider fixing
```

## AI/LLM Development

### `/prompt-engineer` - Improve LLM Prompt

**File:** `.claude/commands/ai/prompt-engineer.md`

```markdown
---
description: Optimize LLM prompt
argument-hint: [current-prompt-file]
---

Improve LLM prompt in @$1:

Analysis:

1. **Clarity** - Is intent clear?
2. **Specificity** - Enough detail?
3. **Structure** - Well organized?
4. **Examples** - Few-shot learning?
5. **Constraints** - Output format specified?

Improvements:

### Enhanced Prompt

\`\`\`
[Improved version with:]
- Clearer instructions
- Better structure
- Relevant examples
- Output format
- Edge case handling
\`\`\`

### Why It's Better

- Point 1: Improvement
- Point 2: Improvement

### Test Cases

Example inputs to validate:
1. Normal case
2. Edge case
3. Error case
```

---

## Tips for Creating Your Own Commands

### Start Simple
```markdown
---
description: Format JSON
---

Format the current file as pretty-printed JSON.
```

### Add Arguments Gradually
```markdown
---
description: Format JSON
argument-hint: <indent: 2|4>
---

Format as JSON with ${1:-2}-space indentation.
```

### Refine with Tool Permissions
```markdown
---
description: Format JSON
argument-hint: <indent: 2|4>
allowed-tools: Read, Write
---

Format @current-file as JSON with ${1:-2}-space indentation.
```

### Optimize Model Choice
```markdown
---
description: Format JSON
argument-hint: <indent: 2|4>
allowed-tools: Read, Write
model: claude-3-5-haiku-20241022
---

Format @current-file as JSON with ${1:-2}-space indentation.
```

---

## Command Collections

Organize related commands in subdirectories:

```
.claude/commands/
├── git/
│   ├── feature.md       → /feature (project:git)
│   ├── commit.md        → /commit (project:git)
│   ├── sync.md          → /sync (project:git)
│   └── pr.md            → /pr (project:git)
├── testing/
│   ├── test-gen.md      → /test-gen (project:testing)
│   ├── test-fix.md      → /test-fix (project:testing)
│   └── coverage.md      → /coverage (project:testing)
└── docs/
    ├── api.md           → /api (project:docs)
    └── readme.md        → /readme (project:docs)
```

This creates organized, discoverable command collections for your team.
