# Common Slash Command Patterns

Reusable patterns for building effective slash commands.

## Pattern Categories

- **Workflow Automation** - Multi-step processes
- **Code Generation** - Boilerplate and scaffolding
- **Analysis & Review** - Code quality checks
- **Information Retrieval** - Contextual queries
- **Transformation** - Format and refactor code

---

## Workflow Automation Patterns

### Multi-Step Sequential Pattern

**Use when:** Commands need to execute steps in order

```markdown
---
description: Deploy application
allowed-tools: Bash(npm *), Bash(git *)
---

Deployment workflow:

## Step 1: Pre-flight
!`git status`
!`npm test`

## Step 2: Build
!`npm run build`

## Step 3: Deploy
!`npm run deploy`

## Step 4: Verify
Check deployment health

Each step must complete successfully before proceeding.
```

### Conditional Workflow Pattern

**Use when:** Different paths based on conditions

```markdown
---
description: Smart commit and push
allowed-tools: Bash(git *)
---

Check current branch:
!`git branch --show-current`

If on main/master:
  - Warn about committing to main
  - Suggest creating feature branch

Otherwise:
  - Stage changes: !`git add .`
  - Generate commit message
  - Commit and push
```

### Rollback-Safe Pattern

**Use when:** Operations need undo capability

```markdown
---
description: Update dependencies
allowed-tools: Bash(npm *), Bash(cp *)
disable-model-invocation: true
---

Safe dependency update:

## Backup
!`cp package-lock.json package-lock.json.backup`

## Update
!`npm update`

## Test
!`npm test`

## Rollback if needed
If tests fail:
!`cp package-lock.json.backup package-lock.json`
!`npm install`
```

---

## Code Generation Patterns

### Template with Substitution Pattern

**Use when:** Generating files from templates

```markdown
---
description: Create React component
argument-hint: [component-name] <type: class|functional>
allowed-tools: Write
---

Generate $1 component (${2:-functional}):

\`\`\`typescript
import React from 'react'

interface $1Props {
  // Add props here
}

export const $1: React.FC<$1Props> = (props) => {
  return (
    <div className="$1">
      {/* Component content */}
    </div>
  )
}
\`\`\`

Save to: `src/components/$1.tsx`
```

### Scaffolding Pattern

**Use when:** Creating multiple related files

```markdown
---
description: Create feature module
argument-hint: [feature-name]
allowed-tools: Write
---

Generate feature module for $1:

## Files to create:

1. `src/features/$1/index.ts` - Barrel export
2. `src/features/$1/$1.tsx` - Component
3. `src/features/$1/$1.test.tsx` - Tests
4. `src/features/$1/$1.styles.ts` - Styles
5. `src/features/$1/types.ts` - TypeScript types

Provide complete implementation for each file.
```

### Variant Pattern

**Use when:** Different templates for different types

```markdown
---
description: Generate test file
argument-hint: [file-path] <type: unit|integration|e2e>
allowed-tools: Read, Write
---

Generate ${2:-unit} test for @$1:

For unit tests:
  - Test individual functions
  - Mock dependencies
  - Fast execution

For integration tests:
  - Test component interaction
  - Minimal mocking
  - Database/API calls

For e2e tests:
  - Test full user flows
  - Real browser
  - Complete stack
```

---

## Analysis & Review Patterns

### Checklist Pattern

**Use when:** Systematic evaluation needed

```markdown
---
description: Security review
argument-hint: [file-path]
allowed-tools: Read, Grep
---

Security checklist for @$1:

- [ ] Input validation present
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS protection (escaped output)
- [ ] CSRF tokens used
- [ ] Authentication checked
- [ ] Authorization verified
- [ ] Secrets not hardcoded
- [ ] Error messages safe (no stack traces)
- [ ] Rate limiting implemented
- [ ] HTTPS enforced

For each issue, provide:
- Severity: Critical/High/Medium/Low
- Location: file:line
- Fix: Specific code change
```

### Scoring Pattern

**Use when:** Quantitative assessment needed

```markdown
---
description: Code quality score
allowed-tools: Read
---

Score current file (0-10 scale):

## Readability: X/10
- Naming clarity
- Function size
- Comment quality

## Maintainability: X/10
- DRY compliance
- SOLID principles
- Coupling level

## Performance: X/10
- Algorithm efficiency
- Resource usage
- Caching strategy

## Security: X/10
- Input validation
- Error handling
- Data protection

**Overall: X/40**

Top 3 improvements:
1. [Specific fix]
2. [Specific fix]
3. [Specific fix]
```

### Comparison Pattern

**Use when:** Evaluating alternatives

```markdown
---
description: Compare implementations
argument-hint: [file1] [file2]
allowed-tools: Read
---

Compare @$1 vs @$2:

## Approach
- File 1: [Describe approach]
- File 2: [Describe approach]

## Performance
- File 1: [Analysis]
- File 2: [Analysis]

## Readability
- File 1: [Score]
- File 2: [Score]

## Recommendation
Use [file] because [reasons]

Specific improvements for chosen approach:
- [Improvement 1]
- [Improvement 2]
```

---

## Information Retrieval Patterns

### Contextual Search Pattern

**Use when:** Finding specific information

```markdown
---
description: Find API usage
argument-hint: [api-name]
allowed-tools: Grep, Read
---

Find all usage of $1 API:

!`grep -r "$1" --include="*.ts" --include="*.tsx"`

For each usage:
- File and line number
- Context (function/component)
- Purpose
- Potential issues

Summary:
- Total uses: X
- Proper usage: Y
- Needs update: Z
```

### Dependency Analysis Pattern

**Use when:** Understanding relationships

```markdown
---
description: Analyze dependencies
argument-hint: [module-name]
allowed-tools: Grep, Read
---

Analyze dependencies for $1:

## Direct Dependencies
Files that import $1:
!`grep -r "from.*$1" --include="*.ts"`

## Transitive Dependencies
What $1 depends on:
Read @$1 and list imports

## Circular Dependencies
Check for cycles involving $1

## Impact Analysis
If $1 changes:
- X files directly affected
- Y files indirectly affected
- Breaking change risk: High/Medium/Low
```

---

## Transformation Patterns

### Format Conversion Pattern

**Use when:** Converting between formats

```markdown
---
description: Convert config format
argument-hint: [input-file] [output-format: json|yaml|toml]
allowed-tools: Read, Write
---

Convert @$1 to $2 format:

1. Read source file
2. Parse current format
3. Transform to $2
4. Validate output
5. Write new file

Output: `$1.$2`

Preserve:
- Comments (if supported)
- Structure
- Types
```

### Refactoring Pattern

**Use when:** Restructuring code

```markdown
---
description: Convert class to hooks
argument-hint: [component-file]
allowed-tools: Read, Write
---

Convert class component @$1 to hooks:

Transformations:
- `this.state` → `useState`
- `componentDidMount` → `useEffect`
- `this.method` → function
- `this.props` → props param

Maintain:
- Same props interface
- Same behavior
- Same exports
- Test compatibility
```

### Migration Pattern

**Use when:** Updating to new APIs

```markdown
---
description: Migrate to new API
argument-hint: [old-api] [new-api]
allowed-tools: Grep, Read, Edit
---

Migrate from $1 to $2:

## Find Usage
!`grep -r "$1" --include="*.ts"`

## For Each File
1. Read file
2. Identify usage pattern
3. Generate equivalent $2 code
4. Update imports
5. Update tests

## Breaking Changes
Document any behavioral differences:
- [Difference 1]
- [Difference 2]
```

---

## Composition Patterns

### Pipeline Pattern

**Use when:** Chaining transformations

```markdown
---
description: Process data pipeline
argument-hint: [input-file]
allowed-tools: Read, Write, Bash(node *)
---

Data pipeline for @$1:

Step 1: Extract
!`node scripts/extract.js $1`

Step 2: Transform
!`node scripts/transform.js $1.extracted`

Step 3: Validate
!`node scripts/validate.js $1.transformed`

Step 4: Load
!`node scripts/load.js $1.validated`

Output: `$1.processed`
```

### Aggregation Pattern

**Use when:** Combining multiple sources

```markdown
---
description: Generate status report
allowed-tools: Bash(git *), Bash(npm *), Grep
---

Project status report:

## Git Status
!`git status --short`

## Test Results
!`npm test -- --reporter=json`

## Code Coverage
!`npm run coverage -- --json`

## Dependency Health
!`npm audit --json`

## Metrics
- Files changed: X
- Tests passing: Y/Z
- Coverage: N%
- Vulnerabilities: M

Overall health: Good/Fair/Poor
```

---

## Error Handling Patterns

### Graceful Degradation Pattern

**Use when:** Command should work despite partial failures

```markdown
---
description: Comprehensive lint check
allowed-tools: Bash(npm run lint:*), Bash(npx *)
---

Run all linters (continue on failure):

TypeScript:
!`npm run lint:ts || echo "TS linting failed"`

ESLint:
!`npm run lint:es || echo "ESLint failed"`

Prettier:
!`npm run lint:format || echo "Format check failed"`

Summary:
- Passed: [list]
- Failed: [list]
- Action required: Fix failures above
```

### Validation Pattern

**Use when:** Input needs verification

```markdown
---
description: Validated deployment
argument-hint: [environment]
allowed-tools: Bash(git *), Bash(npm *)
disable-model-invocation: true
---

Deploy to $1 with validation:

## Pre-checks
1. Valid environment? ($1 in: dev, staging, prod)
2. Clean working directory?
   !`git status --porcelain`
3. Tests passing?
   !`npm test`

If ANY check fails:
  STOP - Do not deploy

Otherwise:
  Proceed with deployment
```

---

## Performance Patterns

### Caching Pattern

**Use when:** Expensive operations can be cached

```markdown
---
description: Cached expensive analysis
argument-hint: [file-path]
allowed-tools: Read, Write, Bash(ls *)
---

Analyze @$1 (with caching):

Check cache:
!`ls .cache/$1.analysis.json 2>/dev/null`

If cached and file unchanged:
  Return cached results

Otherwise:
  Run analysis
  Save to cache
  Return results

Cache validity: 1 hour
```

### Batch Processing Pattern

**Use when:** Operations on multiple items

```markdown
---
description: Batch update imports
argument-hint: [old-import] [new-import]
allowed-tools: Grep, Read, Edit
---

Update imports: $1 → $2

Find all files:
!`grep -rl "from '$1'" --include="*.ts"`

For each file (batch process):
  - Read file
  - Replace import
  - Update references
  - Save file

Progress: X/Y files updated
```

---

## Best Practices

### 1. Single Responsibility
Each command does ONE thing well

### 2. Idempotency
Running command multiple times has same effect

### 3. Clear Output
Always indicate success/failure clearly

### 4. Helpful Errors
When things fail, explain why and how to fix

### 5. Safe Defaults
Choose safe options when arguments omitted

### 6. Progressive Enhancement
Start simple, add features incrementally

### 7. Documentation
Include examples in command descriptions

### 8. Testing
Test commands with various inputs before deployment

---

## Anti-Patterns to Avoid

### ❌ Swiss Army Knife
Command tries to do too many things

### ❌ Silent Failure
Errors occur but aren't reported

### ❌ Destructive Defaults
Dangerous operations without confirmation

### ❌ Unclear Arguments
Users don't know what to pass

### ❌ No Error Handling
Crashes on unexpected input

### ❌ Hardcoded Values
Environment-specific details baked in

### ❌ Missing Context
Command works in IDE but not terminal

### ❌ Over-Engineering
Complex solution for simple problem
