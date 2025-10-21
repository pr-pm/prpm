# New Troubleshooting Skills Added to PRPM

Two comprehensive troubleshooting skills have been added to the PRPM registry.

## 1. Pulumi Infrastructure Troubleshooting (@prpm/pulumi-troubleshooting)

**Category**: Infrastructure
**Quality Score**: 95/100
**Skill Level**: Intermediate

### What It Covers

- **10+ Common Pulumi TypeScript Errors** with solutions
- Pulumi Output handling patterns (including nested Outputs)
- AWS Beanstalk configuration
- GitHub Actions Pulumi workflows
- ACM certificate validation
- Cost optimization tips

### Key Error Solutions

1. "This expression is not callable. Type 'never' has no call signatures"
2. "Modifiers cannot appear here" (export in conditional blocks)
3. "Configuration key is not namespaced by the project"
4. Stack not found errors
5. Property does not exist on Output errors

### Use Cases

- Debugging Pulumi TypeScript compilation errors
- Fixing GitHub Actions Pulumi workflows
- Understanding Output and nested Output handling
- Configuring AWS infrastructure with Pulumi
- Setting up automated deployments

### Installation

```bash
prpm install @prpm/pulumi-troubleshooting
```

### File Location

- Source: `pulumi-troubleshooting-skill.md`
- Install to: `.claude/skills/pulumi-troubleshooting.md`

---

## 2. PostgreSQL Migrations Skill (@prpm/postgres-migrations)

**Category**: Database
**Quality Score**: 95/100
**Skill Level**: Intermediate

### What It Covers

- **10+ Common PostgreSQL Migration Errors** with solutions
- Full-text search optimization with GIN indexes
- IMMUTABLE functions and generated columns
- Idempotent migration patterns
- Composite indexes for performance
- Materialized views
- Common Table Expressions (CTEs)

### Key Error Solutions

1. "Subquery uses ungrouped column from outer query"
2. "Functions in index expression must be marked IMMUTABLE"
3. "Relation does not exist" (extension issues)
4. Circular dependency handling
5. Generated column constraints

### Common Patterns Included

- Full-text search with `tsvector` and GIN indexes
- Generated columns with IMMUTABLE wrapper functions
- Soft delete pattern
- Auto-updating timestamps with triggers
- JSON/JSONB indexing
- Enum types (CHECK vs ENUM)

### Use Cases

- Writing safe, idempotent migrations
- Optimizing PostgreSQL full-text search
- Fixing migration errors in CI/CD
- Creating performant indexes
- Understanding PostgreSQL function volatility

### Installation

```bash
prpm install @prpm/postgres-migrations
```

### File Location

- Source: `postgres-migrations-skill.md`
- Install to: `.claude/skills/postgres-migrations.md`

---

## Why These Skills?

These skills were created while building PRPM itself - they document real issues we encountered and solved during development:

1. **Pulumi Skill**: Created after fixing 7+ Pulumi TypeScript compilation errors in GitHub Actions workflows
2. **Postgres Skill**: Created after fixing 4 migration files with various PostgreSQL errors

Both skills are **production-tested** and contain solutions that actually worked in our deployment pipeline.

## Metadata

Both packages include rich metadata:

```json
{
  "errors_covered": 10,
  "topics": [...],
  "use_cases": [...],
  "skill_level": "intermediate",
  "patterns_included": [...]
}
```

## How to Use

### With Claude Code

```bash
prpm install @prpm/pulumi-troubleshooting
prpm install @prpm/postgres-migrations
```

Files will be installed to `.claude/skills/` directory.

### With Cursor

Convert to Cursor rules:

```bash
prpm install @prpm/pulumi-troubleshooting --format cursor
prpm install @prpm/postgres-migrations --format cursor
```

Files will be installed to `.cursor/rules/` directory.

## Seeding to Database

To add these skills to your local PRPM registry:

```bash
cd packages/registry

# Start database
docker-compose up -d postgres

# Run migrations
npm run migrate

# Seed new skills
npm run seed:skills

# Or seed everything (includes new skills)
npx tsx scripts/seed-packages.ts
```

## Official Packages

Both skills are marked as:
- `official: true` - Official PRPM packages
- `verified_author: true` - Verified @prpm author
- `visibility: public` - Publicly available

## Links

- [Pulumi Troubleshooting Skill Source](./pulumi-troubleshooting-skill.md)
- [PostgreSQL Migrations Skill Source](./postgres-migrations-skill.md)
- [Package Definitions](./packages/registry/scripts/seed/new-skills.json)
- [Seed Script](./packages/registry/scripts/seed-new-skills.ts)
