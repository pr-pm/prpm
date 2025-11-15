# Enhanced Discovery & AI Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build hierarchical taxonomy, use-case browsing, and AI-powered semantic search to improve package discovery and drive PRPM+ conversions at $19/month.

**Architecture:** Three-layer approach: (1) Relational taxonomy with pgvector embeddings in Postgres, (2) OpenAI text-embedding-3-small for semantic matching, (3) Multi-stage ranking pipeline combining similarity, quality, and popularity scores.

**Tech Stack:** PostgreSQL 17.4 + pgvector, OpenAI Embeddings API, Fastify (backend), Next.js 14 (frontend), TypeScript

---

## WEEK 1: FOUNDATION & SCHEMA

### Task 1: Enable pgvector Extension

**Files:**
- Create: `packages/registry/migrations/037_enable_pgvector.sql`

**Step 1: Create migration file**

Create the file with:

```sql
-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

**Step 2: Test migration locally**

Run: `npm run migrate:latest --workspace=@pr-pm/registry`

Expected: Migration runs successfully, shows "vector" extension installed

**Step 3: Commit**

```bash
git add packages/registry/migrations/037_enable_pgvector.sql
git commit -m "feat: enable pgvector extension for AI search"
```

---

### Task 2: Create Categories Table

**Files:**
- Create: `packages/registry/migrations/038_create_taxonomy_tables.sql`

**Step 1: Create categories table migration**

```sql
-- Hierarchical category system (2-3 levels max)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for hierarchy traversal
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Use cases for discovery
CREATE TABLE use_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  example_query TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_use_cases_slug ON use_cases(slug);
CREATE INDEX idx_use_cases_display_order ON use_cases(display_order);

-- Many-to-many: packages to categories
CREATE TABLE package_categories (
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (package_id, category_id)
);

CREATE INDEX idx_package_categories_package ON package_categories(package_id);
CREATE INDEX idx_package_categories_category ON package_categories(category_id);

-- Many-to-many: packages to use cases
CREATE TABLE package_use_cases (
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (package_id, use_case_id)
);

CREATE INDEX idx_package_use_cases_package ON package_use_cases(package_id);
CREATE INDEX idx_package_use_cases_use_case ON package_use_cases(use_case_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_use_cases_updated_at BEFORE UPDATE ON use_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Run migration**

Run: `npm run migrate:latest --workspace=@pr-pm/registry`

Expected: Tables created successfully

**Step 3: Verify tables exist**

Run in psql:
```sql
\dt categories
\dt use_cases
\dt package_categories
\dt package_use_cases
```

Expected: All four tables listed

**Step 4: Commit**

```bash
git add packages/registry/migrations/038_create_taxonomy_tables.sql
git commit -m "feat: add taxonomy tables for categories and use cases"
```

---

### Task 3: Create Package Embeddings Table

**Files:**
- Create: `packages/registry/migrations/039_create_package_embeddings.sql`

**Step 1: Create embeddings table migration**

```sql
-- AI embeddings and enriched content for semantic search
CREATE TABLE package_embeddings (
  package_id UUID PRIMARY KEY REFERENCES packages(id) ON DELETE CASCADE,

  -- AI-generated enriched content
  ai_use_case_description TEXT,
  ai_problem_statement TEXT,
  ai_similar_to TEXT[] DEFAULT '{}',
  ai_best_for TEXT,

  -- Vector embedding (OpenAI text-embedding-3-small = 1536 dimensions)
  embedding vector(1536),

  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Track what content was used to generate embedding
  embedding_source_hash VARCHAR(64) -- SHA256 of source content
);

-- Vector similarity index using IVFFlat algorithm
-- Lists parameter: sqrt(row_count) is a good starting point
-- For 4500 packages: sqrt(4500) ≈ 67, round to 100 for growth
CREATE INDEX idx_package_embeddings_vector
  ON package_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for looking up by package
CREATE INDEX idx_package_embeddings_package ON package_embeddings(package_id);

-- Index for finding stale embeddings
CREATE INDEX idx_package_embeddings_updated ON package_embeddings(updated_at);

-- Trigger to update updated_at
CREATE TRIGGER update_package_embeddings_updated_at
  BEFORE UPDATE ON package_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Run migration**

Run: `npm run migrate:latest --workspace=@pr-pm/registry`

Expected: package_embeddings table created with vector index

**Step 3: Verify vector type works**

Run in psql:
```sql
-- Test inserting a dummy vector
INSERT INTO package_embeddings (package_id, embedding)
VALUES (
  (SELECT id FROM packages LIMIT 1),
  array_fill(0.1, ARRAY[1536])::vector
);

-- Test similarity query works
SELECT package_id, embedding <=> array_fill(0.1, ARRAY[1536])::vector as distance
FROM package_embeddings
LIMIT 1;
```

Expected: Insert and query succeed

**Step 4: Clean up test data**

Run: `DELETE FROM package_embeddings;`

**Step 5: Commit**

```bash
git add packages/registry/migrations/039_create_package_embeddings.sql
git commit -m "feat: add package_embeddings table with pgvector support"
```

---

### Task 4: Add TypeScript Types for Taxonomy

**Files:**
- Create: `packages/types/src/taxonomy.ts`
- Modify: `packages/types/src/index.ts`

**Step 1: Create taxonomy types file**

Create `packages/types/src/taxonomy.ts`:

```typescript
/**
 * Taxonomy types for hierarchical categories and use cases
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  level: number; // 1, 2, or 3
  description: string | null;
  icon: string | null;
  display_order: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  package_count?: number;
}

export interface UseCase {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  example_query: string | null;
  display_order: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface UseCaseWithPackages extends UseCase {
  package_count?: number;
}

export interface PackageCategory {
  package_id: string;
  category_id: string;
  created_at: Date | string;
}

export interface PackageUseCase {
  package_id: string;
  use_case_id: string;
  created_at: Date | string;
}

/**
 * Request/response types
 */

export interface CategoryTree {
  categories: CategoryWithChildren[];
  total_packages: number;
}

export interface UseCaseList {
  use_cases: UseCaseWithPackages[];
  total: number;
}
```

**Step 2: Export from index**

Add to `packages/types/src/index.ts`:

```typescript
export * from './taxonomy'
```

**Step 3: Build types package**

Run: `npm run build --workspace=@pr-pm/types`

Expected: Build succeeds, taxonomy types exported

**Step 4: Commit**

```bash
git add packages/types/src/taxonomy.ts packages/types/src/index.ts
git commit -m "feat: add TypeScript types for taxonomy system"
```

---

### Task 5: Add TypeScript Types for Package Embeddings

**Files:**
- Create: `packages/types/src/embeddings.ts`
- Modify: `packages/types/src/index.ts`

**Step 1: Create embeddings types file**

Create `packages/types/src/embeddings.ts`:

```typescript
/**
 * Package embeddings and AI search types
 */

export interface PackageEmbedding {
  package_id: string;
  ai_use_case_description: string | null;
  ai_problem_statement: string | null;
  ai_similar_to: string[];
  ai_best_for: string | null;
  embedding: number[] | null; // Float array
  generated_at: Date | string;
  updated_at: Date | string;
  embedding_source_hash: string | null;
}

export interface AISearchQuery {
  query: string;
  filters?: {
    format?: string;
    subtype?: string;
    language?: string;
    framework?: string;
    min_quality?: number;
  };
  limit?: number;
}

export interface AISearchResult {
  package_id: string;
  name: string;
  description: string | null;
  format: string;
  subtype: string;
  quality_score: number | string | null;
  total_downloads: number;
  ai_use_case_description: string | null;
  ai_best_for: string | null;
  similarity_score: number; // 0-1, higher is better
  final_score: number; // Weighted combination
}

export interface AISearchResponse {
  results: AISearchResult[];
  query: string;
  total_matches: number;
  execution_time_ms: number;
}

/**
 * Embedding generation types
 */

export interface EmbeddingGenerationRequest {
  package_id: string;
  force_regenerate?: boolean;
}

export interface EmbeddingGenerationResult {
  package_id: string;
  success: boolean;
  error?: string;
  generated_at?: Date | string;
}

export interface EnrichedPackageContent {
  ai_use_case_description: string;
  ai_problem_statement: string;
  ai_similar_to: string[];
  ai_best_for: string;
  suggested_categories: string[]; // Category slugs
  suggested_use_cases: string[]; // Use case slugs
}
```

**Step 2: Export from index**

Add to `packages/types/src/index.ts`:

```typescript
export * from './embeddings'
```

**Step 3: Build types package**

Run: `npm run build --workspace=@pr-pm/types`

Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/types/src/embeddings.ts packages/types/src/index.ts
git commit -m "feat: add TypeScript types for embeddings and AI search"
```

---

### Task 6: Create Taxonomy Generation Script Structure

**Files:**
- Create: `packages/registry/scripts/generate-taxonomy.ts`

**Step 1: Create script file**

Create `packages/registry/scripts/generate-taxonomy.ts`:

```typescript
/**
 * Generate taxonomy (categories and use cases) from existing packages
 *
 * Usage:
 *   npm run script:generate-taxonomy
 *
 * Process:
 * 1. Load seed categories from config
 * 2. Analyze all packages with OpenAI
 * 3. Generate proposed subcategories and use cases
 * 4. Output JSON for manual review
 * 5. After approval, insert into database
 */

import { db } from '../src/db'
import OpenAI from 'openai'

const SEED_CATEGORIES = [
  { name: 'Backend Development', icon: 'server' },
  { name: 'Frontend Development', icon: 'layout' },
  { name: 'Testing & Quality', icon: 'check-circle' },
  { name: 'DevOps & Infrastructure', icon: 'cloud' },
  { name: 'AI & Machine Learning', icon: 'brain' },
  { name: 'Data Engineering', icon: 'database' },
  { name: 'Mobile Development', icon: 'smartphone' },
  { name: 'Security', icon: 'shield' },
  { name: 'Documentation', icon: 'book' },
  { name: 'Code Quality', icon: 'code' },
]

interface ProposedSubcategory {
  name: string
  description: string
  package_count: number
  specific_categories?: string[] // Level 3
}

interface ProposedTaxonomy {
  [topLevel: string]: {
    subcategories: { [name: string]: ProposedSubcategory }
    use_cases: string[]
  }
}

async function main() {
  console.log('🚀 Starting taxonomy generation...\n')

  // Step 1: Verify OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable required')
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Step 2: Load all packages from database
  console.log('📦 Loading packages from database...')
  const packages = await db.query(`
    SELECT
      id, name, description, format, subtype,
      tags, keywords, category, language, framework,
      total_downloads, quality_score
    FROM packages
    WHERE visibility = 'public' AND deprecated = false
    ORDER BY total_downloads DESC
  `)

  console.log(`✓ Loaded ${packages.rows.length} packages\n`)

  // Step 3: For each seed category, analyze and propose structure
  const proposedTaxonomy: ProposedTaxonomy = {}

  for (const seed of SEED_CATEGORIES) {
    console.log(`🔍 Analyzing: ${seed.name}...`)

    // TODO: Next task will implement the AI analysis
    // For now, just create the structure
    proposedTaxonomy[seed.name] = {
      subcategories: {},
      use_cases: []
    }
  }

  // Step 4: Output to JSON file for review
  const outputPath = 'scripts/output/proposed-taxonomy.json'
  console.log(`\n💾 Saving proposed taxonomy to: ${outputPath}`)

  // TODO: Implement JSON output and database insertion in next tasks

  console.log('\n✅ Taxonomy generation complete!')
  console.log('📝 Review the output and run with --approve flag to insert into database')

  await db.end()
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
```

**Step 2: Add script command to package.json**

Add to `packages/registry/package.json` scripts:

```json
{
  "scripts": {
    "script:generate-taxonomy": "tsx scripts/generate-taxonomy.ts"
  }
}
```

**Step 3: Create output directory**

Run: `mkdir -p packages/registry/scripts/output`

**Step 4: Test script runs**

Run: `npm run script:generate-taxonomy --workspace=@pr-pm/registry`

Expected: Script runs and shows seed categories

**Step 5: Commit**

```bash
git add packages/registry/scripts/generate-taxonomy.ts packages/registry/package.json
git commit -m "feat: add taxonomy generation script structure"
```

---

## WEEK 2: TAXONOMY INTEGRATION

### Task 7: Implement AI Taxonomy Analysis

**Files:**
- Modify: `packages/registry/scripts/generate-taxonomy.ts:55-75`

**Step 1: Implement package grouping by seed category**

Replace the TODO section in generate-taxonomy.ts with:

```typescript
  for (const seed of SEED_CATEGORIES) {
    console.log(`🔍 Analyzing: ${seed.name}...`)

    // Group packages that match this category
    const relevantPackages = packages.rows.filter(pkg => {
      const text = `${pkg.name} ${pkg.description} ${pkg.tags?.join(' ')} ${pkg.keywords?.join(' ')} ${pkg.category || ''}`
      return matchesSeedCategory(text, seed.name)
    })

    console.log(`  Found ${relevantPackages.length} relevant packages`)

    if (relevantPackages.length === 0) {
      proposedTaxonomy[seed.name] = {
        subcategories: {},
        use_cases: []
      }
      continue
    }

    // Prepare package summary for AI
    const packageSummary = relevantPackages.slice(0, 100).map(pkg => ({
      name: pkg.name,
      description: pkg.description?.substring(0, 200),
      tags: pkg.tags,
      format: pkg.format,
      subtype: pkg.subtype
    }))

    // Ask AI to propose subcategories
    const prompt = `You are analyzing a package registry for AI tools and prompts.

Category: ${seed.name}
Package Count: ${relevantPackages.length}

Sample packages (top 100 by downloads):
${JSON.stringify(packageSummary, null, 2)}

Based on these packages, propose:
1. 3-7 subcategories (level 2) that logically group these packages
2. For each subcategory, suggest 0-3 specific categories (level 3) if needed
3. 3-5 use case descriptions (what users are trying to accomplish)

Return JSON in this format:
{
  "subcategories": {
    "Subcategory Name": {
      "description": "What this covers",
      "specific_categories": ["Specific 1", "Specific 2"] // optional
    }
  },
  "use_cases": [
    "Building REST APIs",
    "Setting up authentication"
  ]
}

Focus on developer intent and practical use cases, not just technology names.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    const analysis = JSON.parse(response.choices[0].message.content!)

    proposedTaxonomy[seed.name] = {
      subcategories: analysis.subcategories || {},
      use_cases: analysis.use_cases || []
    }

    console.log(`  ✓ Proposed ${Object.keys(analysis.subcategories || {}).length} subcategories`)
  }
```

**Step 2: Add helper function**

Add before main():

```typescript
function matchesSeedCategory(text: string, category: string): boolean {
  const lower = text.toLowerCase()
  const categoryLower = category.toLowerCase()

  // Simple keyword matching - can be improved
  const keywords = {
    'Backend Development': ['backend', 'api', 'server', 'rest', 'graphql', 'database', 'orm'],
    'Frontend Development': ['frontend', 'react', 'vue', 'angular', 'ui', 'component'],
    'Testing & Quality': ['test', 'testing', 'qa', 'quality', 'lint', 'coverage'],
    'DevOps & Infrastructure': ['devops', 'docker', 'kubernetes', 'ci/cd', 'deploy', 'infrastructure'],
    'AI & Machine Learning': ['ai', 'ml', 'machine learning', 'llm', 'gpt', 'claude'],
    'Data Engineering': ['data', 'etl', 'pipeline', 'analytics', 'warehouse'],
    'Mobile Development': ['mobile', 'ios', 'android', 'react native', 'flutter'],
    'Security': ['security', 'auth', 'authentication', 'encryption', 'oauth'],
    'Documentation': ['docs', 'documentation', 'readme', 'guide'],
    'Code Quality': ['quality', 'lint', 'format', 'style', 'refactor']
  }

  const categoryKeywords = keywords[category as keyof typeof keywords] || []
  return categoryKeywords.some(kw => lower.includes(kw))
}
```

**Step 3: Test with API key**

Run with OpenAI API key:
```bash
OPENAI_API_KEY=your_key npm run script:generate-taxonomy --workspace=@pr-pm/registry
```

Expected: Script analyzes packages and shows proposed subcategories

**Step 4: Commit**

```bash
git add packages/registry/scripts/generate-taxonomy.ts
git commit -m "feat: implement AI-powered taxonomy analysis"
```

---

### Task 8: Save Taxonomy Proposal to JSON

**Files:**
- Modify: `packages/registry/scripts/generate-taxonomy.ts:140-160`

**Step 1: Implement JSON output**

Replace the TODO section with:

```typescript
  // Step 4: Output to JSON file for review
  const fs = require('fs')
  const path = require('path')

  const outputDir = path.join(__dirname, 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, 'proposed-taxonomy.json')

  // Add metadata
  const output = {
    generated_at: new Date().toISOString(),
    total_packages: packages.rows.length,
    seed_categories: SEED_CATEGORIES,
    proposed_taxonomy: proposedTaxonomy
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`\n💾 Saved proposed taxonomy to: ${outputPath}`)
  console.log(`\n📊 Summary:`)

  let totalSubcategories = 0
  let totalUseCases = 0

  for (const [category, data] of Object.entries(proposedTaxonomy)) {
    const subCount = Object.keys(data.subcategories).length
    const ucCount = data.use_cases.length
    totalSubcategories += subCount
    totalUseCases += ucCount
    console.log(`  ${category}: ${subCount} subcategories, ${ucCount} use cases`)
  }

  console.log(`\n  Total: ${totalSubcategories} subcategories, ${totalUseCases} use cases`)
```

**Step 2: Test output**

Run: `npm run script:generate-taxonomy --workspace=@pr-pm/registry`

Expected: Creates `scripts/output/proposed-taxonomy.json` with full taxonomy

**Step 3: Review output file**

Run: `cat packages/registry/scripts/output/proposed-taxonomy.json | jq '.proposed_taxonomy | keys'`

Expected: Shows all seed categories

**Step 4: Commit**

```bash
git add packages/registry/scripts/generate-taxonomy.ts
git commit -m "feat: save taxonomy proposal to JSON for review"
```

---

### Task 9: Add Taxonomy Approval and Database Insertion

**Files:**
- Modify: `packages/registry/scripts/generate-taxonomy.ts`

**Step 1: Add approval flag support**

Add at top of main():

```typescript
  const args = process.argv.slice(2)
  const shouldApprove = args.includes('--approve')
  const inputFile = args.find(arg => arg.startsWith('--input='))?.split('=')[1]
```

**Step 2: Add database insertion function**

Add before main():

```typescript
async function insertTaxonomy(taxonomy: ProposedTaxonomy, seedCategories: typeof SEED_CATEGORIES) {
  console.log('\n📥 Inserting taxonomy into database...\n')

  try {
    await db.query('BEGIN')

    // Insert top-level categories (level 1)
    let displayOrder = 0
    const categoryMap = new Map<string, string>() // name -> id

    for (const seed of seedCategories) {
      const result = await db.query(`
        INSERT INTO categories (name, slug, parent_id, level, description, icon, display_order)
        VALUES ($1, $2, NULL, 1, $3, $4, $5)
        RETURNING id
      `, [
        seed.name,
        slugify(seed.name),
        null,
        seed.icon,
        displayOrder++
      ])

      categoryMap.set(seed.name, result.rows[0].id)
      console.log(`  ✓ Created: ${seed.name}`)
    }

    // Insert subcategories (level 2) and specific categories (level 3)
    for (const [topLevel, data] of Object.entries(taxonomy)) {
      const parentId = categoryMap.get(topLevel)
      if (!parentId) continue

      let subDisplayOrder = 0
      for (const [subName, subData] of Object.entries(data.subcategories)) {
        const subResult = await db.query(`
          INSERT INTO categories (name, slug, parent_id, level, description, icon, display_order)
          VALUES ($1, $2, $3, 2, $4, NULL, $5)
          RETURNING id
        `, [
          subName,
          slugify(subName),
          parentId,
          subData.description,
          subDisplayOrder++
        ])

        const subId = subResult.rows[0].id
        console.log(`    ✓ Created: ${topLevel} > ${subName}`)

        // Insert level 3 if exists
        if (subData.specific_categories && subData.specific_categories.length > 0) {
          let specificOrder = 0
          for (const specific of subData.specific_categories) {
            await db.query(`
              INSERT INTO categories (name, slug, parent_id, level, description, icon, display_order)
              VALUES ($1, $2, $3, 3, NULL, NULL, $4)
            `, [
              specific,
              slugify(specific),
              subId,
              specificOrder++
            ])

            console.log(`      ✓ Created: ${topLevel} > ${subName} > ${specific}`)
          }
        }
      }
    }

    // Insert use cases
    displayOrder = 0
    for (const [topLevel, data] of Object.entries(taxonomy)) {
      for (const useCase of data.use_cases) {
        await db.query(`
          INSERT INTO use_cases (name, slug, description, icon, example_query, display_order)
          VALUES ($1, $2, $3, NULL, NULL, $4)
        `, [
          useCase,
          slugify(useCase),
          `Packages for ${useCase.toLowerCase()}`,
          displayOrder++
        ])

        console.log(`  ✓ Created use case: ${useCase}`)
      }
    }

    await db.query('COMMIT')
    console.log('\n✅ Taxonomy inserted successfully!')

  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
```

**Step 3: Add approval logic at end of main()**

Replace the last console.log with:

```typescript
  console.log('\n✅ Taxonomy generation complete!')

  if (shouldApprove) {
    console.log('\n🚀 Approval flag detected, inserting into database...')
    await insertTaxonomy(proposedTaxonomy, SEED_CATEGORIES)
  } else if (inputFile) {
    console.log(`\n🚀 Loading taxonomy from ${inputFile}...`)
    const inputData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'))
    await insertTaxonomy(inputData.proposed_taxonomy, inputData.seed_categories)
  } else {
    console.log('\n📝 Review the output file and run with --approve flag to insert:')
    console.log(`   npm run script:generate-taxonomy --workspace=@pr-pm/registry -- --approve`)
    console.log('\n   Or edit the JSON and use:')
    console.log(`   npm run script:generate-taxonomy --workspace=@pr-pm/registry -- --input=scripts/output/proposed-taxonomy.json`)
  }
```

**Step 4: Test approval flow**

Run: `npm run script:generate-taxonomy --workspace=@pr-pm/registry -- --approve`

Expected: Inserts all categories and use cases into database

**Step 5: Verify in database**

Run in psql:
```sql
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM use_cases;
SELECT level, COUNT(*) FROM categories GROUP BY level;
```

Expected: Shows counts for each level

**Step 6: Commit**

```bash
git add packages/registry/scripts/generate-taxonomy.ts
git commit -m "feat: add taxonomy approval and database insertion"
```

---

### Task 10: Create Category API Endpoints

**Files:**
- Create: `packages/registry/src/routes/categories.ts`
- Modify: `packages/registry/src/index.ts`

**Step 1: Create categories route file**

Create `packages/registry/src/routes/categories.ts`:

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db } from '../db'
import { Category, CategoryWithChildren, CategoryTree } from '@pr-pm/types'

export async function categoriesRoutes(server: FastifyInstance) {

  // GET /api/v1/categories - Get all categories as tree
  server.get('/categories', {
    schema: {
      tags: ['categories'],
      description: 'Get hierarchical category tree',
      response: {
        200: {
          type: 'object',
          properties: {
            categories: { type: 'array' },
            total_packages: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get all categories
      const categoriesResult = await db.query(`
        SELECT
          c.*,
          COUNT(DISTINCT pc.package_id) as package_count
        FROM categories c
        LEFT JOIN package_categories pc ON c.id = pc.category_id
        LEFT JOIN packages p ON pc.package_id = p.id
          AND p.visibility = 'public'
          AND p.deprecated = false
        GROUP BY c.id
        ORDER BY c.display_order, c.name
      `)

      // Build tree structure
      const categories = buildCategoryTree(categoriesResult.rows)

      // Get total packages
      const totalResult = await db.query(`
        SELECT COUNT(DISTINCT id) as total
        FROM packages
        WHERE visibility = 'public' AND deprecated = false
      `)

      const response: CategoryTree = {
        categories,
        total_packages: parseInt(totalResult.rows[0].total)
      }

      reply.send(response)

    } catch (error) {
      server.log.error(error)
      reply.status(500).send({ error: 'Failed to fetch categories' })
    }
  })

  // GET /api/v1/categories/:slug - Get single category with packages
  server.get('/categories/:slug', {
    schema: {
      tags: ['categories'],
      description: 'Get category details with packages',
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const { slug } = request.params

      // Get category
      const categoryResult = await db.query(`
        SELECT * FROM categories WHERE slug = $1
      `, [slug])

      if (categoryResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Category not found' })
      }

      const category = categoryResult.rows[0]

      // Get packages in this category
      const packagesResult = await db.query(`
        SELECT DISTINCT p.*
        FROM packages p
        JOIN package_categories pc ON p.id = pc.package_id
        WHERE pc.category_id = $1
          AND p.visibility = 'public'
          AND p.deprecated = false
        ORDER BY p.total_downloads DESC
        LIMIT 100
      `, [category.id])

      reply.send({
        category,
        packages: packagesResult.rows
      })

    } catch (error) {
      server.log.error(error)
      reply.status(500).send({ error: 'Failed to fetch category' })
    }
  })
}

function buildCategoryTree(categories: any[]): CategoryWithChildren[] {
  const map = new Map<string, CategoryWithChildren>()
  const roots: CategoryWithChildren[] = []

  // First pass: create map
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] })
  })

  // Second pass: build tree
  categories.forEach(cat => {
    const node = map.get(cat.id)!

    if (cat.parent_id === null) {
      roots.push(node)
    } else {
      const parent = map.get(cat.parent_id)
      if (parent) {
        parent.children!.push(node)
      }
    }
  })

  return roots
}
```

**Step 2: Register routes**

Add to `packages/registry/src/index.ts` after other route registrations:

```typescript
import { categoriesRoutes } from './routes/categories'

// ... in the async start function:
await server.register(categoriesRoutes, { prefix: '/api/v1' })
```

**Step 3: Test category tree endpoint**

Run: `curl http://localhost:3001/api/v1/categories | jq '.categories[0]'`

Expected: Returns hierarchical category structure

**Step 4: Test single category endpoint**

Run: `curl http://localhost:3001/api/v1/categories/backend-development | jq '.category.name'`

Expected: Returns "Backend Development"

**Step 5: Commit**

```bash
git add packages/registry/src/routes/categories.ts packages/registry/src/index.ts
git commit -m "feat: add category API endpoints"
```

---

### Task 11: Create Use Case API Endpoints

**Files:**
- Create: `packages/registry/src/routes/use-cases.ts`
- Modify: `packages/registry/src/index.ts`

**Step 1: Create use cases route file**

Create `packages/registry/src/routes/use-cases.ts`:

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db } from '../db'
import { UseCase, UseCaseList } from '@pr-pm/types'

export async function useCasesRoutes(server: FastifyInstance) {

  // GET /api/v1/use-cases - Get all use cases
  server.get('/use-cases', {
    schema: {
      tags: ['use-cases'],
      description: 'Get all use cases with package counts',
      response: {
        200: {
          type: 'object',
          properties: {
            use_cases: { type: 'array' },
            total: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await db.query(`
        SELECT
          uc.*,
          COUNT(DISTINCT puc.package_id) as package_count
        FROM use_cases uc
        LEFT JOIN package_use_cases puc ON uc.id = puc.use_case_id
        LEFT JOIN packages p ON puc.package_id = p.id
          AND p.visibility = 'public'
          AND p.deprecated = false
        GROUP BY uc.id
        ORDER BY uc.display_order, uc.name
      `)

      const response: UseCaseList = {
        use_cases: result.rows,
        total: result.rows.length
      }

      reply.send(response)

    } catch (error) {
      server.log.error(error)
      reply.status(500).send({ error: 'Failed to fetch use cases' })
    }
  })

  // GET /api/v1/use-cases/:slug - Get single use case with packages
  server.get('/use-cases/:slug', {
    schema: {
      tags: ['use-cases'],
      description: 'Get use case details with packages',
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const { slug } = request.params

      // Get use case
      const useCaseResult = await db.query(`
        SELECT * FROM use_cases WHERE slug = $1
      `, [slug])

      if (useCaseResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Use case not found' })
      }

      const useCase = useCaseResult.rows[0]

      // Get packages for this use case
      const packagesResult = await db.query(`
        SELECT DISTINCT p.*
        FROM packages p
        JOIN package_use_cases puc ON p.id = puc.package_id
        WHERE puc.use_case_id = $1
          AND p.visibility = 'public'
          AND p.deprecated = false
        ORDER BY p.total_downloads DESC
        LIMIT 100
      `, [useCase.id])

      reply.send({
        use_case: useCase,
        packages: packagesResult.rows
      })

    } catch (error) {
      server.log.error(error)
      reply.status(500).send({ error: 'Failed to fetch use case' })
    }
  })
}
```

**Step 2: Register routes**

Add to `packages/registry/src/index.ts`:

```typescript
import { useCasesRoutes } from './routes/use-cases'

// ... in the async start function:
await server.register(useCasesRoutes, { prefix: '/api/v1' })
```

**Step 3: Test use cases endpoint**

Run: `curl http://localhost:3001/api/v1/use-cases | jq '.use_cases[0]'`

Expected: Returns use cases with package counts

**Step 4: Commit**

```bash
git add packages/registry/src/routes/use-cases.ts packages/registry/src/index.ts
git commit -m "feat: add use case API endpoints"
```

---

### Task 12: Create Package Categorization Script

**Files:**
- Create: `packages/registry/scripts/categorize-packages.ts`

**Step 1: Create categorization script**

Create `packages/registry/scripts/categorize-packages.ts`:

```typescript
/**
 * Categorize existing packages using AI
 *
 * Usage:
 *   npm run script:categorize-packages
 *   npm run script:categorize-packages -- --batch-size=50
 *
 * Process:
 * 1. Load all uncategorized packages
 * 2. For each package, use AI to:
 *    - Generate enriched content
 *    - Suggest categories and use cases
 * 3. Insert package_categories and package_use_cases associations
 */

import { db } from '../src/db'
import OpenAI from 'openai'

interface PackageData {
  id: string
  name: string
  description: string | null
  format: string
  subtype: string
  tags: string[]
  keywords: string[]
  category: string | null
  language: string | null
  framework: string | null
  readme?: string
}

async function main() {
  const args = process.argv.slice(2)
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '50')

  console.log('🚀 Starting package categorization...\n')

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable required')
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Load all packages without categories
  const packagesResult = await db.query(`
    SELECT
      p.id, p.name, p.description, p.format, p.subtype,
      p.tags, p.keywords, p.category, p.language, p.framework
    FROM packages p
    LEFT JOIN package_categories pc ON p.id = pc.package_id
    WHERE p.visibility = 'public'
      AND p.deprecated = false
      AND pc.package_id IS NULL
    ORDER BY p.total_downloads DESC
  `)

  console.log(`📦 Found ${packagesResult.rows.length} uncategorized packages\n`)

  // Load available categories and use cases
  const categoriesResult = await db.query(`
    SELECT id, name, slug, level, parent_id FROM categories ORDER BY level, name
  `)

  const useCasesResult = await db.query(`
    SELECT id, name, slug FROM use_cases ORDER BY name
  `)

  const categories = categoriesResult.rows
  const useCases = useCasesResult.rows

  console.log(`📁 Loaded ${categories.length} categories and ${useCases.length} use cases\n`)

  // Process in batches
  let processed = 0
  let errors = 0

  for (let i = 0; i < packagesResult.rows.length; i += batchSize) {
    const batch = packagesResult.rows.slice(i, i + batchSize)
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(packagesResult.rows.length / batchSize)}...`)

    for (const pkg of batch) {
      try {
        await categorizePackage(pkg, categories, useCases, openai)
        processed++

        if (processed % 10 === 0) {
          console.log(`  ✓ Processed ${processed}/${packagesResult.rows.length}`)
        }
      } catch (error) {
        errors++
        console.error(`  ✗ Error categorizing ${pkg.name}:`, error.message)
      }
    }

    // Rate limiting: wait 1 second between batches
    if (i + batchSize < packagesResult.rows.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`\n✅ Categorization complete!`)
  console.log(`   Processed: ${processed}`)
  console.log(`   Errors: ${errors}`)

  await db.end()
}

async function categorizePackage(
  pkg: PackageData,
  categories: any[],
  useCases: any[],
  openai: OpenAI
) {
  // Build prompt with package info and available taxonomy
  const prompt = `You are categorizing a package in an AI tools registry.

Package: ${pkg.name}
Description: ${pkg.description || 'No description'}
Format: ${pkg.format}
Subtype: ${pkg.subtype}
Tags: ${pkg.tags?.join(', ') || 'none'}
Keywords: ${pkg.keywords?.join(', ') || 'none'}
Language: ${pkg.language || 'unknown'}
Framework: ${pkg.framework || 'unknown'}

Available Categories (choose 1-3 that best match):
${categories.map(c => `- ${c.name} (slug: ${c.slug}, level: ${c.level})`).join('\n')}

Available Use Cases (choose 1-3 that best match):
${useCases.map(uc => `- ${uc.name} (slug: ${uc.slug})`).join('\n')}

Based on the package details, suggest:
1. The most appropriate categories (1-3 category slugs, prefer more specific)
2. The most relevant use cases (1-3 use case slugs)

Return JSON:
{
  "categories": ["category-slug-1", "category-slug-2"],
  "use_cases": ["use-case-slug-1"]
}

Be conservative - only suggest categories/use cases that clearly apply.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2
  })

  const suggestions = JSON.parse(response.choices[0].message.content!)

  // Insert category associations
  if (suggestions.categories && suggestions.categories.length > 0) {
    for (const categorySlug of suggestions.categories) {
      const category = categories.find(c => c.slug === categorySlug)
      if (category) {
        await db.query(`
          INSERT INTO package_categories (package_id, category_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [pkg.id, category.id])
      }
    }
  }

  // Insert use case associations
  if (suggestions.use_cases && suggestions.use_cases.length > 0) {
    for (const useCaseSlug of suggestions.use_cases) {
      const useCase = useCases.find(uc => uc.slug === useCaseSlug)
      if (useCase) {
        await db.query(`
          INSERT INTO package_use_cases (package_id, use_case_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [pkg.id, useCase.id])
      }
    }
  }
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
```

**Step 2: Add script command**

Add to `packages/registry/package.json` scripts:

```json
"script:categorize-packages": "tsx scripts/categorize-packages.ts"
```

**Step 3: Test with small batch**

Run: `npm run script:categorize-packages --workspace=@pr-pm/registry -- --batch-size=5`

Expected: Categorizes first 5 packages

**Step 4: Verify categorizations**

Run in psql:
```sql
SELECT p.name, c.name as category
FROM packages p
JOIN package_categories pc ON p.id = pc.package_id
JOIN categories c ON pc.category_id = c.id
LIMIT 10;
```

Expected: Shows packages with assigned categories

**Step 5: Commit**

```bash
git add packages/registry/scripts/categorize-packages.ts packages/registry/package.json
git commit -m "feat: add AI-powered package categorization script"
```

---

## WEEK 3: EMBEDDINGS GENERATION

### Task 13: Create Embedding Generation Service

**Files:**
- Create: `packages/registry/src/services/embeddings.ts`

**Step 1: Create embeddings service file**

Create `packages/registry/src/services/embeddings.ts`:

```typescript
import OpenAI from 'openai'
import { db } from '../db'
import crypto from 'crypto'
import { EnrichedPackageContent } from '@pr-pm/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export class EmbeddingsService {

  /**
   * Generate AI-enriched content for a package
   */
  async generateEnrichedContent(packageData: any): Promise<EnrichedPackageContent> {
    const prompt = `You are analyzing a package in an AI tools registry to help users discover it through natural language search.

Package: ${packageData.name}
Description: ${packageData.description || 'No description'}
Format: ${packageData.format} (${packageData.subtype})
Tags: ${packageData.tags?.join(', ') || 'none'}
Language: ${packageData.language || 'unknown'}
Framework: ${packageData.framework || 'unknown'}
README excerpt: ${packageData.readme?.substring(0, 1000) || 'No README'}

Generate the following to help users discover this package:

1. **Use Case Description** (2-3 sentences): Explain what this package helps developers accomplish. Write in second person ("This package helps you..."). Focus on the practical outcome, not technical details.

2. **Problem Statement** (1 sentence): What specific problems or pain points does this solve? (e.g., "Solves: boilerplate setup, authentication complexity, API documentation")

3. **Similar To** (2-4 items): List comparable tools, frameworks, or packages that users might know (e.g., ["express.js", "fastapi", "django-rest"]). Be specific.

4. **Best For** (1-2 sentences): What scenarios, team sizes, or use cases is this particularly well-suited for? (e.g., "Small to medium Flask APIs, microservices, rapid prototyping")

5. **Suggested Categories** (1-3): Based on available categories, suggest the most specific category slugs that apply.

6. **Suggested Use Cases** (1-3): Suggest use case names that match what users would search for.

Return JSON:
{
  "ai_use_case_description": "...",
  "ai_problem_statement": "...",
  "ai_similar_to": ["tool1", "tool2"],
  "ai_best_for": "...",
  "suggested_categories": ["category-slug"],
  "suggested_use_cases": ["Building REST APIs"]
}

Be concise, specific, and focus on how users naturally describe what they're trying to build.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    return JSON.parse(response.choices[0].message.content!)
  }

  /**
   * Generate vector embedding for package content
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    })

    return response.data[0].embedding
  }

  /**
   * Generate and store embedding for a package
   */
  async generatePackageEmbedding(packageId: string, forceRegenerate = false): Promise<void> {
    // Load package data
    const pkgResult = await db.query(`
      SELECT
        id, name, description, format, subtype,
        tags, keywords, language, framework,
        quality_score, total_downloads
      FROM packages
      WHERE id = $1
    `, [packageId])

    if (pkgResult.rows.length === 0) {
      throw new Error(`Package ${packageId} not found`)
    }

    const pkg = pkgResult.rows[0]

    // Load README if available (assume it's stored or fetched elsewhere)
    // For now, we'll just use description + metadata
    const packageData = {
      ...pkg,
      readme: pkg.description // TODO: Load actual README
    }

    // Check if embedding already exists and is up-to-date
    const sourceContent = this.buildSourceContent(packageData)
    const sourceHash = crypto.createHash('sha256').update(sourceContent).digest('hex')

    if (!forceRegenerate) {
      const existingResult = await db.query(`
        SELECT embedding_source_hash
        FROM package_embeddings
        WHERE package_id = $1
      `, [packageId])

      if (existingResult.rows.length > 0 && existingResult.rows[0].embedding_source_hash === sourceHash) {
        // Embedding is up-to-date
        return
      }
    }

    // Generate enriched content
    const enriched = await this.generateEnrichedContent(packageData)

    // Build combined text for embedding
    const embeddingText = this.buildEmbeddingText(packageData, enriched)

    // Generate embedding vector
    const embedding = await this.generateEmbedding(embeddingText)

    // Store in database
    await db.query(`
      INSERT INTO package_embeddings (
        package_id,
        ai_use_case_description,
        ai_problem_statement,
        ai_similar_to,
        ai_best_for,
        embedding,
        embedding_source_hash,
        generated_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (package_id) DO UPDATE SET
        ai_use_case_description = EXCLUDED.ai_use_case_description,
        ai_problem_statement = EXCLUDED.ai_problem_statement,
        ai_similar_to = EXCLUDED.ai_similar_to,
        ai_best_for = EXCLUDED.ai_best_for,
        embedding = EXCLUDED.embedding,
        embedding_source_hash = EXCLUDED.embedding_source_hash,
        updated_at = NOW()
    `, [
      packageId,
      enriched.ai_use_case_description,
      enriched.ai_problem_statement,
      enriched.ai_similar_to,
      enriched.ai_best_for,
      `[${embedding.join(',')}]`, // Convert to Postgres array format
      sourceHash
    ])
  }

  /**
   * Build source content for hash comparison
   */
  private buildSourceContent(pkg: any): string {
    return JSON.stringify({
      name: pkg.name,
      description: pkg.description,
      tags: pkg.tags,
      keywords: pkg.keywords,
      readme: pkg.readme
    })
  }

  /**
   * Build text to be embedded
   */
  private buildEmbeddingText(pkg: any, enriched: EnrichedPackageContent): string {
    return `${pkg.name}

${enriched.ai_use_case_description}

${enriched.ai_problem_statement}

${pkg.description || ''}

Tags: ${pkg.tags?.join(', ') || 'none'}
Keywords: ${pkg.keywords?.join(', ') || 'none'}
Format: ${pkg.format} ${pkg.subtype}
Language: ${pkg.language || ''}
Framework: ${pkg.framework || ''}

Similar to: ${enriched.ai_similar_to.join(', ')}
Best for: ${enriched.ai_best_for}

${pkg.readme || ''}`.trim()
  }
}

export const embeddingsService = new EmbeddingsService()
```

**Step 2: Test service initialization**

Run: `npm run build --workspace=@pr-pm/registry`

Expected: Compiles successfully

**Step 3: Commit**

```bash
git add packages/registry/src/services/embeddings.ts
git commit -m "feat: add embeddings generation service"
```

---

### Task 14: Create Batch Embedding Generation Script

**Files:**
- Create: `packages/registry/scripts/generate-embeddings.ts`

**Step 1: Create embedding generation script**

Create `packages/registry/scripts/generate-embeddings.ts`:

```typescript
/**
 * Generate embeddings for all packages
 *
 * Usage:
 *   npm run script:generate-embeddings
 *   npm run script:generate-embeddings -- --batch-size=50 --force
 *
 * Process:
 * 1. Load all packages without embeddings
 * 2. Generate enriched content + embeddings in batches
 * 3. Store in package_embeddings table
 */

import { db } from '../src/db'
import { embeddingsService } from '../src/services/embeddings'

async function main() {
  const args = process.argv.slice(2)
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '50')
  const force = args.includes('--force')

  console.log('🚀 Starting embedding generation...\n')

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable required')
  }

  // Load packages needing embeddings
  const query = force
    ? `SELECT id, name FROM packages WHERE visibility = 'public' AND deprecated = false`
    : `
      SELECT p.id, p.name
      FROM packages p
      LEFT JOIN package_embeddings pe ON p.id = pe.package_id
      WHERE p.visibility = 'public'
        AND p.deprecated = false
        AND pe.package_id IS NULL
    `

  const packagesResult = await db.query(query)

  console.log(`📦 Found ${packagesResult.rows.length} packages ${force ? '(forced regeneration)' : 'needing embeddings'}\n`)

  if (packagesResult.rows.length === 0) {
    console.log('✅ All packages already have embeddings!')
    await db.end()
    return
  }

  // Estimate cost
  const estimatedTokens = packagesResult.rows.length * 2000 // ~2K tokens per package
  const estimatedCost = (estimatedTokens / 1_000_000) * 0.02 // $0.02 per 1M tokens

  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(2)} (${(estimatedTokens / 1000).toFixed(0)}K tokens)\n`)

  // Process in batches
  let processed = 0
  let errors = 0
  const startTime = Date.now()

  for (let i = 0; i < packagesResult.rows.length; i += batchSize) {
    const batch = packagesResult.rows.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(packagesResult.rows.length / batchSize)

    console.log(`📊 Processing batch ${batchNum}/${totalBatches} (${batch.length} packages)...`)

    for (const pkg of batch) {
      try {
        await embeddingsService.generatePackageEmbedding(pkg.id, force)
        processed++

        if (processed % 10 === 0) {
          const elapsed = (Date.now() - startTime) / 1000
          const rate = processed / elapsed
          const remaining = packagesResult.rows.length - processed
          const eta = remaining / rate

          console.log(`  ✓ Processed ${processed}/${packagesResult.rows.length} (${rate.toFixed(1)}/s, ETA: ${Math.round(eta / 60)}m)`)
        }
      } catch (error) {
        errors++
        console.error(`  ✗ Error processing ${pkg.name}:`, error.message)
      }
    }

    // Rate limiting: wait 2 seconds between batches to avoid hitting OpenAI limits
    if (i + batchSize < packagesResult.rows.length) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  const totalTime = (Date.now() - startTime) / 1000

  console.log(`\n✅ Embedding generation complete!`)
  console.log(`   Total time: ${Math.round(totalTime / 60)} minutes`)
  console.log(`   Processed: ${processed}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Rate: ${(processed / totalTime).toFixed(1)} packages/second`)

  await db.end()
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
```

**Step 2: Add script command**

Add to `packages/registry/package.json` scripts:

```json
"script:generate-embeddings": "tsx scripts/generate-embeddings.ts"
```

**Step 3: Test with small batch**

Run: `npm run script:generate-embeddings --workspace=@pr-pm/registry -- --batch-size=5`

Expected: Generates embeddings for first 5 packages

**Step 4: Verify embeddings in database**

Run in psql:
```sql
SELECT
  p.name,
  pe.ai_use_case_description,
  array_length(string_to_array(trim(both '[]' from pe.embedding::text), ','), 1) as vector_dimensions
FROM packages p
JOIN package_embeddings pe ON p.id = pe.package_id
LIMIT 3;
```

Expected: Shows packages with 1536-dimension vectors

**Step 5: Commit**

```bash
git add packages/registry/scripts/generate-embeddings.ts packages/registry/package.json
git commit -m "feat: add batch embedding generation script"
```

---

## WEEK 4: AI SEARCH & LAUNCH

### Task 15: Create AI Search Endpoint

**Files:**
- Create: `packages/registry/src/routes/ai-search.ts`
- Modify: `packages/registry/src/index.ts`

**Step 1: Create AI search route file**

Create `packages/registry/src/routes/ai-search.ts`:

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db } from '../db'
import { optionalAuth, requireAuth } from '../middleware/auth'
import { AISearchQuery, AISearchResponse, AISearchResult } from '@pr-pm/types'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function aiSearchRoutes(server: FastifyInstance) {

  // POST /api/v1/search/ai - AI-powered semantic search
  server.post('/search/ai', {
    onRequest: [requireAuth], // PRPM+ only
    schema: {
      tags: ['search'],
      description: 'AI-powered semantic package search (PRPM+ only)',
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 3 },
          filters: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              subtype: { type: 'string' },
              language: { type: 'string' },
              framework: { type: 'string' },
              min_quality: { type: 'number', minimum: 0, maximum: 5 }
            }
          },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            results: { type: 'array' },
            query: { type: 'string' },
            total_matches: { type: 'number' },
            execution_time_ms: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: AISearchQuery }>, reply: FastifyReply) => {
    const startTime = Date.now()

    try {
      const user = (request as any).user

      // Check PRPM+ membership
      if (user.prpm_plus_status !== 'active') {
        return reply.status(403).send({
          error: 'AI Search requires PRPM+ membership',
          upgrade_url: '/pricing'
        })
      }

      const { query, filters = {}, limit = 10 } = request.body

      // Step 1: Generate embedding for query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float'
      })

      const queryEmbedding = embeddingResponse.data[0].embedding

      // Step 2: Build SQL query with filters
      let filterConditions = []
      let filterParams = []
      let paramIndex = 2 // $1 is embedding

      if (filters.format) {
        filterConditions.push(`p.format = $${paramIndex}`)
        filterParams.push(filters.format)
        paramIndex++
      }

      if (filters.subtype) {
        filterConditions.push(`p.subtype = $${paramIndex}`)
        filterParams.push(filters.subtype)
        paramIndex++
      }

      if (filters.language) {
        filterConditions.push(`p.language = $${paramIndex}`)
        filterParams.push(filters.language)
        paramIndex++
      }

      if (filters.framework) {
        filterConditions.push(`p.framework = $${paramIndex}`)
        filterParams.push(filters.framework)
        paramIndex++
      }

      if (filters.min_quality) {
        filterConditions.push(`p.quality_score >= $${paramIndex}`)
        filterParams.push(filters.min_quality)
        paramIndex++
      }

      const filterClause = filterConditions.length > 0
        ? `AND ${filterConditions.join(' AND ')}`
        : ''

      // Step 3: Vector similarity search (top 50 candidates)
      const candidatesQuery = `
        SELECT
          p.id,
          p.name,
          p.description,
          p.format,
          p.subtype,
          COALESCE(p.quality_score, 0) as quality_score,
          p.total_downloads,
          pe.ai_use_case_description,
          pe.ai_best_for,
          1 - (pe.embedding <=> $1::vector) as similarity_score
        FROM packages p
        JOIN package_embeddings pe ON p.id = pe.package_id
        WHERE p.visibility = 'public'
          AND p.deprecated = false
          ${filterClause}
        ORDER BY pe.embedding <=> $1::vector
        LIMIT 50
      `

      const candidatesResult = await db.query(
        candidatesQuery,
        [`[${queryEmbedding.join(',')}]`, ...filterParams]
      )

      // Step 4: Rerank by combined score
      const results: AISearchResult[] = candidatesResult.rows.map(pkg => {
        // Normalize scores to 0-1 range
        const normalizedQuality = typeof pkg.quality_score === 'string'
          ? parseFloat(pkg.quality_score) / 5.0
          : (pkg.quality_score || 0) / 5.0

        const normalizedPopularity = Math.min(
          Math.log10(pkg.total_downloads + 1) / 6, // log scale, cap at 1M downloads
          1.0
        )

        // Weighted combination
        const finalScore =
          (pkg.similarity_score * 0.5) +      // 50% semantic relevance
          (normalizedQuality * 0.3) +          // 30% quality
          (normalizedPopularity * 0.2)         // 20% popularity

        return {
          ...pkg,
          similarity_score: Math.round(pkg.similarity_score * 100) / 100,
          final_score: Math.round(finalScore * 100) / 100
        }
      })

      // Step 5: Sort by final score and limit
      results.sort((a, b) => b.final_score - a.final_score)
      const topResults = results.slice(0, limit)

      const response: AISearchResponse = {
        results: topResults,
        query,
        total_matches: candidatesResult.rows.length,
        execution_time_ms: Date.now() - startTime
      }

      reply.send(response)

    } catch (error) {
      server.log.error(error)
      reply.status(500).send({ error: 'AI search failed' })
    }
  })
}
```

**Step 2: Register routes**

Add to `packages/registry/src/index.ts`:

```typescript
import { aiSearchRoutes } from './routes/ai-search'

// ... in the async start function:
await server.register(aiSearchRoutes, { prefix: '/api/v1' })
```

**Step 3: Test AI search (requires PRPM+ user)**

Create test request:
```bash
curl -X POST http://localhost:3001/api/v1/search/ai \
  -H "Authorization: Bearer YOUR_PRPM_PLUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Python Flask REST API with authentication",
    "limit": 5
  }'
```

Expected: Returns AI-ranked results with similarity scores

**Step 4: Test without PRPM+**

Run same curl without valid token

Expected: 403 error with upgrade message

**Step 5: Commit**

```bash
git add packages/registry/src/routes/ai-search.ts packages/registry/src/index.ts
git commit -m "feat: add AI-powered semantic search endpoint"
```

---

### Task 16: Add AI Search to Frontend API Client

**Files:**
- Modify: `packages/webapp/src/lib/api.ts`

**Step 1: Add AI search function**

Add to `packages/webapp/src/lib/api.ts`:

```typescript
import { AISearchQuery, AISearchResponse } from '@pr-pm/types'

/**
 * AI-powered semantic search (PRPM+ only)
 */
export async function aiSearchPackages(
  token: string,
  query: AISearchQuery
): Promise<AISearchResponse> {
  const response = await fetch(`${REGISTRY_URL}/api/v1/search/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(query)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'AI search failed' }))
    throw new Error(error.error || 'AI search failed')
  }

  return response.json()
}
```

**Step 2: Export types**

Ensure types are exported in `packages/webapp/src/lib/api.ts`:

```typescript
export type { AISearchQuery, AISearchResponse, AISearchResult } from '@pr-pm/types'
```

**Step 3: Build and test**

Run: `npm run build --workspace=@pr-pm/webapp`

Expected: Compiles successfully

**Step 4: Commit**

```bash
git add packages/webapp/src/lib/api.ts
git commit -m "feat: add AI search to frontend API client"
```

---

### Task 17: Create AI Search UI Component

**Files:**
- Create: `packages/webapp/src/components/AISearchBox.tsx`

**Step 1: Create AI search component**

Create `packages/webapp/src/components/AISearchBox.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { aiSearchPackages, AISearchResult } from '@/lib/api'
import Link from 'next/link'
import { getPackageUrl } from '@/lib/package-url'

interface AISearchBoxProps {
  token?: string | null
  isPRPMPlus?: boolean
  onUpgradeClick?: () => void
}

export default function AISearchBox({ token, isPRPMPlus, onUpgradeClick }: AISearchBoxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AISearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    // Show upgrade modal for non-PRPM+ users
    if (!isPRPMPlus) {
      setShowUpgradeModal(true)
      return
    }

    if (!token) {
      setError('Please sign in to use AI search')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await aiSearchPackages(token, { query })
      setResults(response.results)
      setExecutionTime(response.execution_time_ms)
    } catch (err: any) {
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✨</span>
          <span className="text-lg font-semibold text-white">AI Search</span>
          {isPRPMPlus && (
            <span className="px-2 py-0.5 text-xs bg-prpm-accent/20 text-prpm-accent rounded">
              PRPM+
            </span>
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe what you need: 'Python Flask REST API with JWT authentication'..."
          className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-prpm-accent text-lg"
          disabled={loading}
        />

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="absolute right-3 top-[52px] px-6 py-2 bg-prpm-accent hover:bg-prpm-accent/80 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Execution Time */}
      {executionTime !== null && results.length > 0 && (
        <p className="text-sm text-gray-400 mt-2">
          Found {results.length} results in {executionTime}ms
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold text-white">
            🤖 AI-Powered Results
          </h3>

          {results.map((result, index) => (
            <Link
              key={result.package_id}
              href={getPackageUrl(result.name, result.format)}
              className="block p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-mono text-prpm-accent">
                      {index + 1}. {result.name}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                      {result.format}
                    </span>
                    {result.quality_score && (
                      <span className="flex items-center gap-1 text-sm text-yellow-400">
                        ⭐ {typeof result.quality_score === 'string'
                          ? parseFloat(result.quality_score).toFixed(1)
                          : result.quality_score.toFixed(1)}
                      </span>
                    )}
                    <span className="text-sm text-gray-400">
                      📦 {result.total_downloads.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-prpm-green">
                      🤖 {Math.round(result.similarity_score * 100)}% match
                    </span>
                    {result.ai_best_for && (
                      <span className="text-sm text-gray-400">
                        • Best for: {result.ai_best_for}
                      </span>
                    )}
                  </div>

                  {result.ai_use_case_description && (
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {result.ai_use_case_description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-md w-full p-8 border border-prpm-accent/30">
            <div className="text-center mb-6">
              <span className="text-6xl mb-4 block">✨</span>
              <h2 className="text-2xl font-bold text-white mb-2">
                AI-Powered Package Discovery
              </h2>
              <p className="text-gray-400">
                Describe what you're building in natural language and get intelligent recommendations.
              </p>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-prpm-accent mt-0.5">✓</span>
                <span className="text-gray-300">Unlimited AI semantic search</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-prpm-accent mt-0.5">✓</span>
                <span className="text-gray-300">Smart recommendations based on your stack</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-prpm-accent mt-0.5">✓</span>
                <span className="text-gray-300">100 monthly playground credits</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-prpm-accent mt-0.5">✓</span>
                <span className="text-gray-300">Advanced filters and saved searches</span>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-white mb-1">$19</div>
              <div className="text-gray-400">per month</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Maybe Later
              </button>
              <Link
                href="/pricing"
                className="flex-1 px-4 py-3 bg-prpm-accent hover:bg-prpm-accent/80 text-white rounded-lg transition text-center font-semibold"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Test component compiles**

Run: `npm run build --workspace=@pr-pm/webapp`

Expected: Compiles successfully

**Step 3: Commit**

```bash
git add packages/webapp/src/components/AISearchBox.tsx
git commit -m "feat: add AI search UI component with upgrade modal"
```

---

### Task 18: Add CLI AI Search Command

**Files:**
- Create: `packages/cli/src/commands/ai-search.ts`
- Modify: `packages/cli/src/index.ts`

**Step 1: Create AI search command**

Create `packages/cli/src/commands/ai-search.ts`:

```typescript
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { registryClient } from '../core/registry-client'

export function aiSearchCommand(program: Command) {
  program
    .command('ai-search <query>')
    .description('AI-powered semantic package search (PRPM+ only)')
    .option('-f, --format <format>', 'Filter by format')
    .option('-s, --subtype <subtype>', 'Filter by subtype')
    .option('-l, --language <language>', 'Filter by language')
    .option('--limit <number>', 'Number of results', '10')
    .action(async (query: string, options) => {
      const spinner = ora('Searching with AI...').start()

      try {
        // Check if user is logged in
        const token = await registryClient.getAuthToken()
        if (!token) {
          spinner.fail(chalk.red('Please login first: prpm login'))
          process.exit(1)
        }

        // Build filters
        const filters: any = {}
        if (options.format) filters.format = options.format
        if (options.subtype) filters.subtype = options.subtype
        if (options.language) filters.language = options.language

        // Call AI search endpoint
        const response = await registryClient.aiSearch({
          query,
          filters,
          limit: parseInt(options.limit)
        })

        spinner.succeed(
          chalk.green(
            `Found ${response.results.length} results in ${response.execution_time_ms}ms`
          )
        )

        console.log()
        console.log(chalk.bold.white('✨ AI Search Results\n'))

        if (response.results.length === 0) {
          console.log(chalk.gray('No packages found matching your query.'))
          console.log(chalk.gray('Try different keywords or remove filters.'))
          return
        }

        response.results.forEach((result, index) => {
          console.log(
            chalk.bold.white(`${index + 1}. ${result.name}`) +
              chalk.gray(` [${result.format}]`)
          )

          // Match score
          const matchPercent = Math.round(result.similarity_score * 100)
          const matchColor =
            matchPercent >= 80 ? chalk.green : matchPercent >= 60 ? chalk.yellow : chalk.gray
          console.log(
            `   ${matchColor(`🤖 ${matchPercent}% match`)} • ` +
              `⭐ ${
                typeof result.quality_score === 'string'
                  ? parseFloat(result.quality_score).toFixed(1)
                  : result.quality_score?.toFixed(1) || 'N/A'
              } • ` +
              `📦 ${result.total_downloads.toLocaleString()}`
          )

          // Best for
          if (result.ai_best_for) {
            console.log(`   ${chalk.cyan('💡 Best for:')} ${result.ai_best_for}`)
          }

          // Description
          if (result.ai_use_case_description) {
            const desc =
              result.ai_use_case_description.length > 100
                ? result.ai_use_case_description.substring(0, 100) + '...'
                : result.ai_use_case_description
            console.log(`   ${chalk.gray(desc)}`)
          }

          console.log()
        })

        console.log(chalk.gray(`\nInstall with: prpm install <package-name>`))
      } catch (error: any) {
        spinner.fail(chalk.red('AI search failed'))

        if (error.message?.includes('PRPM+')) {
          console.log()
          console.log(chalk.yellow('✨ AI Search is a PRPM+ feature'))
          console.log()
          console.log('Upgrade to PRPM+ for:')
          console.log('  • Unlimited AI semantic search')
          console.log('  • 100 monthly playground credits')
          console.log('  • Advanced filters & recommendations')
          console.log()
          console.log(chalk.bold('$19/month - Learn more: https://prpm.dev/pricing'))
          console.log()
          console.log(chalk.gray('Subscribe with: prpm subscribe'))
        } else {
          console.error(chalk.red(`Error: ${error.message}`))
        }

        process.exit(1)
      }
    })
}
```

**Step 2: Add AI search method to registry client**

Add to `packages/cli/src/core/registry-client.ts`:

```typescript
import { AISearchQuery, AISearchResponse } from '@pr-pm/types'

// Add to RegistryClient class:
async aiSearch(query: AISearchQuery): Promise<AISearchResponse> {
  const token = await this.getAuthToken()
  if (!token) {
    throw new Error('Authentication required')
  }

  const response = await this.fetch('/api/v1/search/ai', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(query)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'AI search failed' }))
    throw new Error(error.error || 'AI search failed')
  }

  return response.json()
}
```

**Step 3: Register command**

Add to `packages/cli/src/index.ts`:

```typescript
import { aiSearchCommand } from './commands/ai-search'

// ... in main():
aiSearchCommand(program)
```

**Step 4: Add --ai flag to existing search**

Modify `packages/cli/src/commands/search.ts` to add:

```typescript
.option('--ai', 'Use AI-powered semantic search (PRPM+ only)')

// In action handler:
if (options.ai) {
  // Redirect to AI search
  const { aiSearchCommand } = await import('./ai-search')
  // Call AI search with same query
  return
}
```

**Step 5: Build and test**

Run: `npm run build --workspace=@pr-pm/cli`

Expected: Compiles successfully

**Step 6: Test command**

Run: `prpm ai-search "python flask api"`

Expected: Shows upgrade prompt or results if PRPM+

**Step 7: Commit**

```bash
git add packages/cli/src/commands/ai-search.ts packages/cli/src/core/registry-client.ts packages/cli/src/index.ts
git commit -m "feat: add AI search command to CLI"
```

---

### Task 19: Update Pricing Page with New Features

**Files:**
- Modify: `packages/webapp/src/app/pricing/page.tsx`

**Step 1: Update pricing to $19/month**

Replace the PRPM+ pricing section with:

```typescript
<div className="text-4xl font-bold text-white mb-1">
  $19
  <span className="text-xl text-gray-400 font-normal">/month</span>
</div>
<p className="text-sm text-gray-400 mb-6">or $190/year (save 17%)</p>
```

**Step 2: Update feature list**

Replace the feature list with:

```typescript
<div className="space-y-6 mb-8">
  {/* AI Discovery */}
  <div>
    <h4 className="text-sm font-bold text-prpm-accent mb-2">🤖 AI-Powered Discovery</h4>
    <ul className="space-y-2 text-gray-300 text-sm">
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Unlimited AI semantic search
      </li>
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Natural language package discovery
      </li>
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        AI-powered recommendations
      </li>
    </ul>
  </div>

  {/* Enhanced Discovery */}
  <div>
    <h4 className="text-sm font-bold text-prpm-accent mb-2">🎯 Enhanced Discovery</h4>
    <ul className="space-y-2 text-gray-300 text-sm">
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Advanced filters & saved searches
      </li>
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Full-text search across package content
      </li>
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Hierarchical category browsing
      </li>
    </ul>
  </div>

  {/* Playground */}
  <div>
    <h4 className="text-sm font-bold text-prpm-accent mb-2">🎮 Playground Access</h4>
    <ul className="space-y-2 text-gray-300 text-sm">
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        100 monthly credits (rollover to 200)
      </li>
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Test packages with AI models
      </li>
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Save and share playground sessions
      </li>
    </ul>
  </div>

  {/* Author Benefits */}
  <div>
    <h4 className="text-sm font-bold text-prpm-accent mb-2">👤 Author Benefits</h4>
    <ul className="space-y-2 text-gray-300 text-sm">
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Verified author badge
      </li>
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Package analytics dashboard
      </li>
    </ul>
  </div>

  {/* Support */}
  <div>
    <h4 className="text-sm font-bold text-prpm-accent mb-2">💬 Priority Support</h4>
    <ul className="space-y-2 text-gray-300 text-sm">
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Email support with 24h response
      </li>
      <li className="flex items-center gap-2">
        <svg className="w-4 h-4 text-prpm-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Direct feedback channel
      </li>
    </ul>
  </div>
</div>
```

**Step 3: Add free trial badge**

Add after the subscribe button:

```typescript
<p className="text-center text-sm text-gray-400 mt-4">
  ✨ 14-day free trial • Cancel anytime
</p>
```

**Step 4: Build and preview**

Run: `npm run dev --workspace=@pr-pm/webapp`

Visit: http://localhost:5173/pricing

Expected: Shows new $19/month pricing with full feature list

**Step 5: Commit**

```bash
git add packages/webapp/src/app/pricing/page.tsx
git commit -m "feat: update pricing page to $19/month with new features"
```

---

### Task 20: Final Testing & Deployment Checklist

**Files:**
- Create: `docs/DEPLOYMENT_CHECKLIST.md`

**Step 1: Create deployment checklist**

Create `docs/DEPLOYMENT_CHECKLIST.md`:

```markdown
# Enhanced Discovery & AI Search - Deployment Checklist

## Pre-Deployment Verification

### Database
- [ ] pgvector extension enabled in production
- [ ] All migrations run successfully (037-039)
- [ ] Taxonomy tables created and populated
- [ ] Sample embeddings generated for top packages
- [ ] Vector index created and working

### Backend (Registry)
- [ ] OpenAI API key configured in production
- [ ] Category API endpoints tested
- [ ] Use case API endpoints tested
- [ ] AI search endpoint tested with PRPM+ user
- [ ] Rate limiting working correctly
- [ ] Error handling verified

### Frontend (Webapp)
- [ ] AI search component renders correctly
- [ ] Upgrade modal appears for non-PRPM+ users
- [ ] Search results display properly
- [ ] Pricing page updated to $19/month
- [ ] Category browsing UI implemented
- [ ] Static build completes successfully

### CLI
- [ ] `prpm ai-search` command works
- [ ] `prpm search --ai` flag works
- [ ] Upgrade prompts display correctly
- [ ] Results format properly in terminal

### Scripts
- [ ] Taxonomy generation script tested
- [ ] Package categorization script tested
- [ ] Embedding generation script tested
- [ ] All scripts have error handling

## Deployment Steps

### Step 1: Deploy Registry (Backend)
```bash
# Build and test locally
cd packages/registry
npm run build
npm test

# Deploy to production
git push origin main
# Wait for deployment pipeline
# Verify health: curl https://registry.prpm.dev/health
```

### Step 2: Run Migrations
```bash
# SSH to production DB or use migration tool
npm run migrate:latest --workspace=@pr-pm/registry

# Verify:
# - pgvector extension exists
# - Taxonomy tables exist
# - package_embeddings table exists
```

### Step 3: Generate Taxonomy
```bash
# On production or staging
cd packages/registry
OPENAI_API_KEY=xxx npm run script:generate-taxonomy

# Review output JSON
# Edit if needed, then approve:
npm run script:generate-taxonomy -- --approve

# Verify categories exist:
curl https://registry.prpm.dev/api/v1/categories | jq '.categories | length'
```

### Step 4: Categorize Packages
```bash
# This will take ~30-60 minutes for 4500 packages
OPENAI_API_KEY=xxx npm run script:categorize-packages

# Monitor progress and check for errors
# Verify:
SELECT COUNT(*) FROM package_categories;
# Should have thousands of associations
```

### Step 5: Generate Embeddings
```bash
# This will take 2-3 hours for 4500 packages
# Estimated cost: $10-15
OPENAI_API_KEY=xxx npm run script:generate-embeddings

# Monitor progress
# Verify:
SELECT COUNT(*) FROM package_embeddings;
# Should have ~4500 rows

# Test vector search works:
SELECT package_id, embedding <=> '[0.1,0.2,...]'::vector as distance
FROM package_embeddings
ORDER BY distance
LIMIT 5;
```

### Step 6: Update Stripe Pricing
- [ ] Create new $19/month price in Stripe dashboard
- [ ] Update subscription product with new features
- [ ] Test checkout flow in staging
- [ ] Update production price ID in env vars

### Step 7: Deploy Webapp
```bash
cd packages/webapp
npm run build:static

# Test locally
npm run preview

# Deploy
git push origin main
# Wait for deployment pipeline
# Verify: https://prpm.dev
```

### Step 8: Deploy CLI
```bash
cd packages/cli
npm run build

# Publish to npm (if applicable)
npm publish

# Verify:
prpm --version
prpm ai-search "test query"
```

## Post-Deployment Verification

### Smoke Tests
- [ ] Visit https://prpm.dev - homepage loads
- [ ] Browse categories at /categories
- [ ] Browse use cases
- [ ] Traditional search works
- [ ] AI search shows upgrade prompt for free users
- [ ] Login as PRPM+ user, AI search works
- [ ] Pricing page shows $19/month
- [ ] CLI AI search command works

### Monitor
- [ ] Check error logs for any issues
- [ ] Monitor OpenAI API usage and costs
- [ ] Track AI search usage metrics
- [ ] Monitor conversion rates

### Analytics Tracking
Add tracking for:
- AI search queries (by user, by query)
- Upgrade button clicks from AI search modal
- Category browsing usage
- Use case browsing usage
- PRPM+ conversion rate at $19/month

## Rollback Plan

If issues occur:

1. **Database**: Migrations are additive, should be safe
2. **Backend**: Revert to previous deployment
3. **Frontend**: Revert to previous build
4. **Pricing**: Can revert in Stripe dashboard

Critical tables to backup before deployment:
- packages
- users
- subscriptions

## Success Metrics

Week 1:
- [ ] All packages categorized
- [ ] All embeddings generated
- [ ] Zero critical errors in production

Week 2:
- [ ] 10+ AI searches performed
- [ ] Category browsing used by 50+ users
- [ ] At least 1 upgrade from $6 to $19

Month 1:
- [ ] 5-10 new PRPM+ subscriptions at $19/month
- [ ] AI search used by 80%+ of PRPM+ members
- [ ] < $50/month OpenAI costs
```

**Step 2: Review checklist**

Read through and identify any missing steps

**Step 3: Commit**

```bash
git add docs/DEPLOYMENT_CHECKLIST.md
git commit -m "docs: add deployment checklist for enhanced discovery"
```

---

## Plan Complete

All implementation tasks are now documented with:
- Exact file paths
- Complete code examples
- Testing steps
- Commit messages
- 4-week timeline

**Total estimated time:** 4 weeks (160 hours)
- Week 1 (Foundation): 40 hours
- Week 2 (Taxonomy): 40 hours
- Week 3 (Embeddings): 40 hours
- Week 4 (AI Search & Launch): 40 hours

**Total estimated cost:**
- OpenAI embeddings: $10-15 one-time
- OpenAI categorization: $5-10 one-time
- Ongoing AI search: ~$10-20/month (1000+ searches)

**Next steps:**
1. Review plan for completeness
2. Execute tasks sequentially or use subagent-driven development
3. Follow deployment checklist for production launch
