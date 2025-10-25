# PRPM Vision: Distributable Intelligence for AI-Assisted Development

## The Future of Software Development

Imagine a world where companies distribute **executable knowledge** instead of just shipping migration scripts. Where breaking changes come bundled with **AI agents, skills, and rules** that guide developers through complex code transformations. Where every API change, framework migration, and architectural shift includes the intelligence needed to implement it correctly.

This is the world PRPM is building.

## The Problem Today

Software companies face a recurring challenge with breaking changes and migrations:

**Traditional Approach: Scripts + Documentation**
- Ship a migration script that handles 80% of cases
- Write migration guides for the other 20%
- Hope developers can figure out the edge cases
- Field support requests for weeks

**Real Example: Nango's YAML → TypeScript Migration**

When Nango migrated from YAML-based integrations to TypeScript-based integrations, they provided:
- ✅ A migration script to convert basic YAML configs
- ✅ Documentation on the new TypeScript API
- ❌ But developers still had to manually:
  - Understand which TypeScript patterns to use
  - Handle complex YAML features not covered by the script
  - Migrate custom logic and edge cases
  - Debug type errors in the new system

**What was missing?** The deep contextual knowledge that would allow AI assistants to help developers complete the migration.

## The PRPM Solution

Technical companies ship a **complete suite** alongside their product:

**Traditional Stack:**
- 📚 Documentation (for humans to read)
- 🔧 Migration scripts (automates simple cases)
- 💬 Support channels (for when things break)

**PRPM-Enhanced Stack:**
- 📚 Documentation (for humans to read)
- 🔧 Migration scripts (automates simple cases)
- 🤖 **Rules** (AI applies patterns automatically)
- 🎯 **Skills** (AI executes specific tasks)
- 🚀 **Agents** (AI orchestrates complex workflows)
- 💬 Support channels (dramatically reduced load)

Instead of just shipping migration scripts, companies distribute **AI-readable packages** containing:

### 1. **Deep Rules** - Codified Migration Logic
```typescript
// Instead of documenting "how to migrate"
// Ship rules that AI can execute

@prpm/nango-yaml-to-ts-rules:
- YAML sync configs → TypeScript NangoSync classes
- YAML action configs → TypeScript NangoAction classes
- Environment variables → typed config objects
- Webhook handlers → strongly-typed event handlers
- Error handling patterns for the new API
- Type inference rules for YAML → TS conversion
```

### 2. **Specialized Skills** - Task-Specific Guidance
```typescript
// Skills that guide AI through specific migration tasks

@prpm/nango-migrate-sync-skill:
"When migrating a YAML sync configuration:
1. Analyze the sync frequency, models, and endpoints
2. Generate the equivalent NangoSync class structure
3. Convert YAML field mappings to TypeScript types
4. Preserve custom pagination logic
5. Add proper error handling
6. Generate tests for the migrated sync"
```

### 3. **Autonomous Agents** - End-to-End Migration Assistance
```typescript
// Agents that orchestrate complex multi-file migrations

@prpm/nango-migration-agent:
"I am a Nango migration specialist. I will:
1. Scan your codebase for YAML integration files
2. Analyze dependencies and custom logic
3. Generate TypeScript equivalents file-by-file
4. Update imports and references across your codebase
5. Identify edge cases requiring human review
6. Run the test suite and report issues
7. Provide a migration summary with recommendations"
```

### The PRPM Approach: Nango Migration Example

**What Nango ships:**
```bash
# Traditional approach
nango migrate yaml-to-ts
# Script runs, converts 80%, prints "See docs for edge cases"

# PRPM-enhanced approach
prpm install @nango/yaml-to-ts-migration-agent
prpm install @nango/typescript-patterns-rules
prpm install @nango/sync-migration-skill

# Now your AI assistant has:
# - Rules for every YAML → TS pattern
# - Skills for specific migration tasks
# - An agent that orchestrates the full migration
```

**Developer experience:**
```typescript
// Developer asks their AI assistant:
"Migrate integrations/salesforce.yaml to TypeScript"

// AI (with PRPM packages loaded):
// 1. Reads salesforce.yaml
// 2. Applies @nango/yaml-to-ts-rules to generate TS structure
// 3. Uses @nango/sync-migration-skill for sync-specific logic
// 4. Applies @nango/typescript-patterns-rules for Nango conventions
// 5. Generates salesforce.integration.ts with proper types
// 6. Updates imports in dependent files
// 7. Adds tests based on YAML test patterns

// Output: Complete, type-safe migration
// No script, no docs, just intelligent code generation
```

## Technical Architecture

```
Company/OSS Project       PRPM Registry         Developer Environment
      │                        │                          │
      │  Publish packages:     │                          │
      │  - Rules (.md)         │                          │
      │  - Skills (.md)        │                          │
      │  - Agents (.md)        │                          │
      │─────────────────────> │                          │
      │                        │                          │
      │                        │   prpm install           │
      │                        │   @nango/migration-*     │
      │                        │ <────────────────────────│
      │                        │                          │
      │                        │   Install to .ai/        │
      │                        │ ─────────────────────────>
      │                        │                          │
      │                        │                    AI Assistant
      │                        │                    (Claude/Copilot/Cursor)
      │                        │                          │
      │                        │                    Loads packages
      │                        │                    from .ai/ directory
      │                        │                          │
      │                        │                    Applies rules,
      │                        │                    executes skills,
      │                        │                    runs agents
      │                        │                          │
      │                        │                    Generates code
      │                        │                          │
      │                        │                    Developer reviews
      │                        │                    and commits
```

### Package Types

**1. Rules** (Cursor/Windsurf/Generic format)
- Declarative constraints and patterns
- "Always use X pattern when Y condition"
- Enforced during code generation
- Examples:
  - API design patterns
  - Error handling conventions
  - Security requirements
  - Migration transformation rules

**2. Skills** (Claude Projects format)
- Procedural task guidance
- "To accomplish X, follow these steps"
- Invoked for specific tasks
- Examples:
  - "Migrate a YAML sync to TypeScript"
  - "Add OAuth to an integration"
  - "Generate integration tests"

**3. Agents** (Multi-platform format)
- Autonomous, multi-step workflows
- "I will accomplish X by doing Y, Z, and W"
- Orchestrate complex operations
- Examples:
  - Full codebase migrations
  - Architecture refactors
  - Dependency updates across repos

### Universal Format

PRPM converts between platform-specific formats:
```
Cursor Rule (.cursorrules) ──┐
                             │
Windsurf Rule (.windsurfrules)├─> PRPM Canonical Format ─> Any Platform
                             │
GitHub Copilot (.github/)   ─┤
                             │
Claude Skill (claude.ai)    ─┘
Kiro Rule (.kiro/)          ─┘
```

Write once, distribute to all AI coding platforms.

## Real-World Technical Examples

### Example 1: Nango's YAML → TypeScript Migration

**What Nango Ships (Complete Suite):**

1. **Documentation** (https://docs.nango.dev)
   - Migration guide explaining YAML → TypeScript
   - API reference for new TypeScript classes
   - Examples and tutorials

2. **Migration Script**
   ```bash
   $ nango migrate yaml-to-ts
   # Handles 70% of common cases automatically
   ```

3. **PRPM Packages** (for AI-assisted development)
   ```bash
   # Published to PRPM registry
   @nango/yaml-to-ts-migration-agent     # Orchestrates full migration
   @nango/typescript-integration-rules   # TypeScript patterns & conventions
   @nango/sync-config-skill              # Migrates sync configurations
   @nango/action-config-skill            # Migrates action configurations
   @nango/webhook-migration-skill        # Migrates webhook handlers
   ```

**Developer Experience Without PRPM:**
```bash
# Step 1: Run migration script
$ nango migrate yaml-to-ts

✓ Converted integrations/salesforce.yaml
✗ Warning: Manual migration required for custom fields
✗ Warning: Complex pagination logic needs review
✗ Warning: See docs for webhook migration

# Step 2: Read docs for 30 minutes
# Step 3: Manually convert edge cases
# Step 4: Fix TypeScript errors by trial and error
# Step 5: Hope patterns match Nango's expectations
# Total time: 2-4 hours
```

**Developer Experience With PRPM:**
```bash
# Step 1: Run migration script (handles basics)
$ nango migrate yaml-to-ts

# Step 2: Install Nango's AI packages
$ prpm install @nango/yaml-to-ts-migration-agent
$ prpm install @nango/typescript-integration-rules
$ prpm install @nango/sync-config-skill

# Step 3: Ask AI to handle the rest
"Migrate all my YAML integrations to TypeScript, handling edge cases"

# AI (with Nango's packages loaded):
# ✓ Scans all YAML files
# ✓ Converts sync configs using @nango/sync-config-skill
# ✓ Applies @nango/typescript-integration-rules for patterns
# ✓ Handles pagination logic correctly (knows Nango patterns!)
# ✓ Migrates webhooks with proper typing
# ✓ Updates imports across codebase
# ✓ Generates tests matching Nango conventions
# ✓ Reports: "Migrated 12 integrations, 2 require review (see files marked)"

# Step 4: Review the 2 edge cases AI flagged, commit
# Total time: 30 minutes

# The difference: AI has Nango's deep knowledge through PRPM packages
```

### Example 2: Stripe API v3 → v4 Migration

**What Stripe Ships (Complete Suite):**

1. **Documentation**
   - v3 → v4 migration guide
   - Breaking changes changelog
   - API reference with examples

2. **Codemod**
   ```bash
   $ npx @stripe/codemods v3-to-v4
   # Handles basic syntax changes
   ```

3. **PRPM Packages**
   ```bash
   @stripe/api-v4-migration-agent        # Full migration orchestration
   @stripe/v4-patterns-rules             # v4 API patterns and conventions
   @stripe/payment-intent-skill          # PaymentIntent migration
   @stripe/subscription-migration-skill  # Subscription API changes
   @stripe/error-handling-skill          # New error handling patterns
   @stripe/webhook-v4-skill              # Webhook signature verification
   ```

**Developer Experience:**

```bash
# Step 1: Run Stripe's codemod
$ npx @stripe/codemods v3-to-v4
✓ Updated basic syntax
✗ Manual review needed: 47 instances

# Step 2: Install Stripe's PRPM packages
$ prpm install @stripe/api-v4-migration-agent

# Step 3: Let AI handle the complex migration
"Migrate my Stripe integration to v4, fixing all error handling and webhooks"

# AI (with Stripe's packages):
# ✓ Updates PaymentIntent creation to v4 patterns
# ✓ Migrates subscription webhooks to new format
# ✓ Applies v4 error handling (knows about new error codes!)
# ✓ Updates webhook signature verification
# ✓ Fixes idempotency key handling
# ✓ Updates test mocks to match v4 responses
# ✓ Complete: All 47 instances migrated

# Stripe's deep knowledge encoded in PRPM packages = perfect migration
```

### Example 3: Next.js App Router Migration

**What Vercel Ships (Complete Suite):**

1. **Documentation**
   - App Router migration guide
   - Server Components documentation
   - Incremental adoption guide

2. **Codemod**
   ```bash
   $ npx @next/codemod@latest app-router-migration
   # Creates basic app/ directory structure
   ```

3. **PRPM Packages**
   ```bash
   @vercel/nextjs-app-router-agent       # Orchestrates full migration
   @vercel/server-component-rules        # Server vs Client component rules
   @vercel/data-fetching-skill           # getServerSideProps → async components
   @vercel/layout-migration-skill        # _app.tsx → layout.tsx
   @vercel/metadata-skill                # Head → Metadata API
   @vercel/route-handler-skill           # API routes → route handlers
   ```

**Developer Experience:**

```bash
# Step 1: Run Next.js codemod
$ npx @next/codemod@latest app-router-migration
✓ Created app/ directory
✓ Moved some pages
✗ Manual migration needed for complex pages

# Step 2: Install Vercel's PRPM packages
$ prpm install @vercel/nextjs-app-router-agent

# Step 3: AI handles the complex parts
"Migrate my Next.js app to App Router, preserving all data fetching logic"

# AI (with Vercel's packages):
# ✓ Converts getServerSideProps to async Server Components
# ✓ Migrates _app.tsx to root layout.tsx
# ✓ Converts Head to Metadata API
# ✓ Identifies client components (adds 'use client')
# ✓ Migrates API routes to route handlers
# ✓ Preserves middleware and rewrites
# ✓ Updates all imports and references

# Vercel's engineering knowledge → AI → Your codebase
```

### Example 4: Company-Specific Architecture Migration

**Without PRPM:**
```
Company migrates from REST to GraphQL:
- Internal wiki with migration guide
- Example PRs to reference
- Slack channel for questions
- Each team figures it out independently
```

**With PRPM:**
```bash
$ prpm install @company/rest-to-graphql-agent
$ prpm install @company/graphql-patterns-rules
$ prpm install @company/api-client-skill

# Published once, used by every team
# Encodes company-specific patterns:
# - Authentication headers
# - Error handling conventions
# - Pagination standards
# - Caching strategies

# Every team gets consistent migrations
# No knowledge loss between teams
```

## The Complete Technical Package: Docs + Scripts + AI Intelligence

Every technical company should ship:

| Component | Format | For | Purpose |
|-----------|--------|-----|---------|
| **Documentation** | Markdown, website | Humans | Learn concepts, understand "why" |
| **Migration Scripts** | CLI tools, codemods | Automation | Handle 60-80% of mechanical changes |
| **Rules** | PRPM packages | AI | Enforce patterns during code generation |
| **Skills** | PRPM packages | AI | Execute specific migration tasks |
| **Agents** | PRPM packages | AI | Orchestrate complex multi-step workflows |

### Example: Complete Nango Migration Suite

```
Nango's Breaking Change: YAML → TypeScript integrations

Traditional Approach:
├── 📚 docs.nango.dev/migration-guide
├── 🔧 `nango migrate yaml-to-ts`
└── 💬 Discord support channel

PRPM-Enhanced Approach:
├── 📚 docs.nango.dev/migration-guide
├── 🔧 `nango migrate yaml-to-ts`
├── 🤖 @nango/typescript-integration-rules
├── 🎯 @nango/sync-config-skill
├── 🎯 @nango/action-config-skill
├── 🎯 @nango/webhook-migration-skill
├── 🚀 @nango/yaml-to-ts-migration-agent
└── 💬 Discord support channel (90% less traffic!)
```

**The workflow:**
1. Developer runs `nango migrate yaml-to-ts` (handles basics)
2. Developer installs `@nango/yaml-to-ts-migration-agent`
3. AI (loaded with Nango's rules/skills) handles the remaining 30%
4. Developer reviews, done

**Why this matters:**
- Migration script: 70% automated
- PRPM packages: Additional 25% AI-assisted
- Manual review: 5% edge cases
- **Total: 95% automated vs 70% with scripts alone**

## Impact Across the Ecosystem

### For Library/Framework Authors

**Traditional Release Cycle:**
```
Release v2 with breaking changes:
1. Write migration script (handles 60-80%)
2. Write migration docs (hope users read them)
3. Answer hundreds of support questions
4. Watch adoption lag for months
5. Maintain v1 for years because migration is painful
```

**With PRPM (Complete Suite):**
```
Release v2 with breaking changes:
1. Write migration script (handles 60-80%)
2. Publish PRPM packages with rules/skills/agents
3. Documentation references PRPM packages
4. AI handles remaining 20-40% contextually
5. Users migrate faster with fewer issues
6. Support load drops 80%+
7. Deprecate v1 sooner because migration is smooth
```

**Real packages framework authors ship:**
- `@react/class-to-hooks-agent` - Automated class component conversion
- `@vue/vue2-to-vue3-migration-agent` - Composition API migration
- `@angular/standalone-components-skill` - NgModule → standalone
- `@rails/rails7-upgrade-rules` - Ruby on Rails upgrade patterns
- `@python/python2to3-agent` - Python 2 → 3 with contextual fixes

### For SaaS Companies

**Traditional API evolution:**
```
v1 → v2 breaking changes:
- Publish changelog
- Provide codemods for common cases
- Field support requests for weeks
- Some users never migrate
```

**With PRPM:**
```
v1 → v2 with intelligence:
- Publish @company/api-v2-migration-agent
- Users install package
- AI performs contextual migration
- Edge cases clearly identified
- 95% adoption in days, not months
```

**Real value:**
- Faster API evolution without breaking users
- Deprecate old versions sooner
- Reduce support burden
- Better developer experience

### For Enterprise Internal Tools

**Problem: Tribal knowledge doesn't scale**
```
Company coding standards:
- Wiki documentation (outdated)
- Example repos (never quite match your use case)
- Code reviews (inconsistent feedback)
- New developers take months to learn patterns
```

**Solution: Codified knowledge**
```bash
$ prpm install @company/api-design-rules
$ prpm install @company/error-handling-rules
$ prpm install @company/database-patterns-rules
$ prpm install @company/testing-standards-rules

# Every developer gets:
# - Instant access to company standards
# - Consistent code generation
# - AI that knows company patterns
# - Onboarding in days, not months
```

### For Open Source Maintainers

**Current challenge:**
```
"How do I help contributors write code that matches our patterns?"
- Contributing guide (long, often unread)
- PR reviews (time-consuming)
- CI checks (catch issues late)
```

**PRPM solution:**
```bash
# In your README:
prpm install @yourproject/contributor-rules
prpm install @yourproject/pr-guidelines-skill

# Contributors get:
# - AI that knows your patterns
# - Code generated in your style
# - PRs that pass review faster
# - Less maintainer burden
```

## Technical Comparison: PRPM vs Alternatives

| Dimension | Traditional Codemods | AI Prompts | PRPM |
|-----------|---------------------|------------|------|
| **Scope** | Syntax-level AST transforms | Ad-hoc conversational guidance | Packaged, versioned intelligence |
| **Reusability** | Limited to specific transforms | Copy-paste prompts | Install once, use everywhere |
| **Complexity** | Handles simple cases only | Limited by context window | Agents handle multi-step workflows |
| **Distribution** | Scripts in repos or npm | Gists, docs, tribal knowledge | Centralized registry |
| **Versioning** | Manual version management | No versioning | Semantic versioning built-in |
| **Platform** | Language-specific | Platform-specific prompts | Universal, works across AI tools |
| **Maintenance** | Breaks with language changes | Prompts rot over time | Packages maintained and updated |
| **Testing** | Unit test the codemod | No testing | Can test rules/skills/agents |

## Why This Matters Now

### The AI Coding Revolution is Here

```
2020: "Maybe AI will help with autocomplete"
2023: "AI can write full functions"
2024: "AI can refactor entire codebases"
2025: "AI needs distributed knowledge to do it RIGHT"
      ↑
    PRPM fills this gap
```

**The missing piece:** AI assistants are powerful, but they lack:
1. **Company-specific context** - Your coding standards, architecture patterns
2. **Framework-specific depth** - Migration nuances beyond documentation
3. **Domain expertise** - Business logic, compliance requirements
4. **Consistent application** - Same patterns across teams/projects

PRPM provides the infrastructure to distribute this knowledge.

### The Opportunity

**For tool vendors (Anthropic, GitHub, Cursor, Windsurf):**
- Better AI assistants through richer knowledge packages
- Ecosystem play: "Our AI works with 10,000+ PRPM packages"
- Reduced support burden as companies codify their own guidance

**For framework authors (React, Next.js, Vue, Rails):**
- Smooth breaking changes with intelligent migrations
- Faster adoption of new features
- Community-contributed best practices distributed as packages

**For enterprises:**
- Codified institutional knowledge
- Faster onboarding
- Consistent code quality
- Knowledge that survives team turnover

## Technical Implementation: How To Ship PRPM Packages

### For Nango's YAML → TypeScript Migration

```bash
# Directory structure
nango-migration-packages/
├── rules/
│   ├── yaml-to-ts-patterns.md          # Cursor/Windsurf rules
│   └── typescript-conventions.md       # Type patterns, naming
├── skills/
│   ├── migrate-sync-config.md          # Claude skill for sync migration
│   ├── migrate-action-config.md        # Claude skill for actions
│   └── migrate-webhooks.md             # Webhook conversion skill
├── agents/
│   └── full-migration-agent.md         # Orchestrates entire migration
└── prpm.json                           # Package metadata

# Publish to PRPM
$ prpm publish

# Users install
$ prpm install @nango/yaml-to-ts-migration
```

### What goes in each package:

**rules/yaml-to-ts-patterns.md:**
```markdown
---
format: cursor
subtype: rule
---

# Nango YAML to TypeScript Conversion Rules

When converting Nango YAML integrations to TypeScript:

## Sync Configurations
- YAML `sync` → TypeScript class extending `NangoSync`
- `models` array → generic type parameter `NangoSync<Model>`
- `frequency` → `@Frequency` decorator
- `auto_start` → class-level config

## Examples

YAML:
```yaml
sync:
  name: salesforce-contacts
  frequency: 1h
  auto_start: true
  models:
    - Contact
```

TypeScript:
```typescript
@Frequency('1h')
export class SalesforceContacts extends NangoSync<Contact> {
  async run() {
    // Sync logic
  }
}
```

[... detailed patterns for every YAML feature ...]
```

**agents/full-migration-agent.md:**
```markdown
---
format: generic
subtype: agent
---

# Nango YAML to TypeScript Migration Agent

I am a specialized agent for migrating Nango YAML integrations to TypeScript.

## My Process

1. **Discovery**: Scan the codebase for YAML integration files
2. **Analysis**: Parse each YAML file and identify patterns
3. **Generation**: Create TypeScript equivalents using rules from @nango/yaml-to-ts-patterns
4. **Integration**: Update imports, dependencies, and references
5. **Testing**: Generate test files based on YAML test patterns
6. **Reporting**: Provide summary with edge cases requiring review

## When to use me

Invoke me when you need to:
- Migrate a single YAML integration to TypeScript
- Migrate your entire integrations directory
- Understand what the TypeScript equivalent should look like

## What I need

- Access to your YAML integration files
- The @nango/yaml-to-ts-patterns rules package
- The @nango/sync-migration-skill and @nango/action-migration-skill

[... detailed agent behavior ...]
```

## The Path Forward

### Phase 1: Foundation (Now)
- ✅ PRPM registry and CLI
- ✅ Format conversion (Cursor ↔ Claude ↔ Copilot ↔ Kiro)
- ✅ Package publishing and discovery
- 🚧 Integration with major AI platforms

### Phase 2: Ecosystem Growth (2025)
- Framework-specific migration packages
- Community-contributed best practices
- Enterprise private registries
- Package testing and validation

### Phase 3: Intelligence Layer (2026+)
- AI-generated rules from existing codebases
- Automatic package updates when frameworks change
- Cross-package dependencies and composition
- Quality scoring and package recommendations

## Get Involved

### For Framework/Library Authors
```bash
# Ship your next breaking change with intelligence
prpm init
# Create migration rules, skills, and agents
prpm publish @yourframework/v2-migration
```

### For Enterprises
```bash
# Codify your standards
prpm init --private
# Create internal rules and skills
prpm publish @company/coding-standards --registry=company.prpm.dev
```

### For Developers
```bash
# Use the ecosystem
prpm install @react/hooks-migration
prpm install @stripe/api-v4-migration
prpm install @company/api-patterns
# Let AI use these packages to write better code
```

---

## The Complete Suite: A New Standard for Technical Companies

**Every company that ships APIs, frameworks, or platforms should provide:**

### 1. Documentation (For Humans)
Traditional written guides, API references, tutorials
- `docs.yourcompany.com`

### 2. Migration Scripts (For Automation)
Codemods, CLI tools, automated transforms for common cases
- `npx @yourcompany/migrate`
- Handles 60-80% of mechanical changes

### 3. PRPM Packages (For AI)
Rules, skills, and agents that encode your engineering knowledge
- `prpm install @yourcompany/migration-agent`
- AI handles the remaining 20-40% contextually
- Reduces support burden by 80%+

**This is the complete stack.** Documentation teaches, scripts automate, PRPM packages guide AI to handle the nuanced, context-specific work that scripts can't.

## Why Now?

**The AI coding assistant is the new compiler.**

Just like every language needed:
- Documentation (how to write code)
- Compiler/interpreter (how to run code)
- Package manager (how to share code)

Every AI coding platform needs:
- Documentation (what to build)
- Migration scripts (basic automation)
- **PRPM packages** (how to build it correctly)

We're building the missing piece.

---

**This is the future of software development:** Intelligence as code, distributed through packages, applied by AI.

**Ready to build it?** [prpm.dev](https://prpm.dev) | [GitHub](https://github.com/prpm/prpm) | [Discord](https://discord.gg/prpm)

---

## Summary: The PRPM Value Proposition

**For Technical Companies:**
- Ship docs + scripts + PRPM packages as a complete suite
- Reduce support burden by 80%+
- Enable faster breaking changes and deprecations
- Codify institutional knowledge

**For Developers:**
- Install AI intelligence packages for frameworks you use
- Let AI handle complex migrations contextually
- Reduce migration time from hours to minutes
- Get company-specific patterns automatically

**For the Ecosystem:**
- Universal format works across all AI coding tools
- Versioned, tested, maintained intelligence packages
- Community-contributed best practices
- Knowledge that compounds over time

**The bottom line:** Technical companies provide docs + scripts + PRPM packages. Developers install packages. AI applies deep knowledge. Everyone wins.
