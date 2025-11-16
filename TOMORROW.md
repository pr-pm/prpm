# PRPM - Next Steps

---

## ✅ Search Improvements Completed

### 1. Optimized Full-Text Search
**Files Modified:**
- `packages/registry/src/search/postgres.ts` - Now uses `search_vector` column
- `packages/registry/migrations/054_enhance_search_vector.sql` - Enhanced search_vector

**Changes:**
- ✅ Using pre-computed `search_vector` GIN index (faster)
- ✅ Weighted fields: Name (A) → Description/Category (B) → Tags (C) → Keywords (D)
- ✅ Boosted ranking: Name 10x, exact tags +5, featured +2, verified +1
- ✅ `ts_rank_cd` with document length normalization
- ✅ Combined trigram + full-text for fuzzy + exact matching

### 2. Materialized View Auto-Refresh
**Files Modified:**
- `packages/registry/src/services/cron-scheduler.ts`

**Changes:**
- ✅ Refresh every 6 hours (midnight, 6am, noon, 6pm UTC)
- ✅ Keeps search rankings current automatically

### 3. Enhanced Search Vector
**Migration:** `054_enhance_search_vector.sql`

**New Fields:**
- ✅ `display_name` (weight A)
- ✅ `category` (weight B)
- ✅ Enhanced materialized view with format/subtype/official
- ✅ Updated `search_packages()` function

### 4. Smart Autocomplete
**New Endpoint:** `GET /api/v1/search/autocomplete?q=react&limit=10`

**Features:**
- ✅ Package names (by similarity + downloads)
- ✅ Tags (with counts)
- ✅ Categories (with counts)
- ✅ Cached 10 minutes

### 5. "Did You Mean?" Suggestions
**Modified:** `packages/registry/src/search/postgres.ts`

**Features:**
- ✅ Suggests similar names when 0 results
- ✅ Trigram similarity (30% threshold)
- ✅ Example: "curser" → suggests "cursor"

**To Deploy:** Run migrations 054-056, restart registry service

---

## ⚡ Additional Performance Optimizations (DONE)

### 6. Composite Indexes
**Migration:** `055_search_performance_indexes.sql`
- ✅ Format + search_vector composite
- ✅ Subtype + search_vector composite
- ✅ Category + downloads + quality
- ✅ Name prefix for autocomplete
- ✅ Tags overlap index

### 7. Enhanced Redis Caching
**Modified:** `packages/registry/src/routes/search.ts`
- ✅ Deterministic cache keys
- ✅ First page: 15min, others: 5min
- ✅ Autocomplete: 1 hour (was 10min)

### 8. Database Query Optimization
**Migration:** `056_search_query_optimization.sql`
- ✅ work_mem = 64MB
- ✅ JIT compilation enabled
- ✅ Statistics target 10x increase
- ✅ Aggressive autovacuum (5%)
- ✅ Parallel queries (4 workers)

### 9. Query Hints & Optimizations
**Modified:** `packages/registry/src/search/postgres.ts`
- ✅ Index scan hints
- ✅ Optimized did-you-mean
- ✅ Skip suggestions when filtered

### 10. Cache Warming
**Modified:** `packages/registry/src/services/cron-scheduler.ts`
- ✅ Pre-warms top 10 searches every 30min
- ✅ Keeps PostgreSQL buffers hot

## 🎯 Expected Performance
- Cold query: <100ms
- Cached query: <10ms
- Autocomplete: <20ms
- Cache hit rate: 80-90%

---

# Taxonomy Implementation - Next Steps

## Context
Currently working on implementing hierarchical category taxonomy for package search and discovery. The taxonomy generation script exists and can analyze packages using OpenAI to create meaningful category hierarchies.

## Immediate Next Steps

1. **Generate Taxonomy Data (User Action)**
   - Run locally: `npm run script:generate-taxonomy`
   - This will create: `packages/registry/scripts/output/proposed-taxonomy.json`
   - Review the output to ensure categories make sense
   - Run with approval: `npm run script:generate-taxonomy -- --approve` (if testing locally)

2. **Create Seed Migration (Assistant Task)**
   - Take the generated JSON file
   - Create a new migration file with INSERT statements
   - This migration will pre-populate the `categories` and `use_cases` tables
   - Migration will run automatically on production deployment

3. **Update Frontend UI**
   - Replace hardcoded categories in `packages/webapp/src/app/(app)/search/page.tsx:961-967`
   - Load categories dynamically from taxonomy API: `getCategories()` from `packages/webapp/src/lib/api.ts:1231`
   - Add hierarchical navigation (level 1 → level 2 → level 3)
   - Optional: Add use cases filter dropdown

## Current State

### Database
- ✅ Migration exists: `049_create_taxonomy_tables.sql`
- ✅ Tables created: `categories`, `use_cases`, `package_categories`, `package_use_cases`
- ✅ Supports 3-level hierarchy

### Backend
- ✅ API endpoints: `/api/v1/taxonomy/categories`, `/api/v1/taxonomy/use-cases`
- ✅ Service: `TaxonomyService` in `packages/registry/src/services/taxonomy.ts`
- ✅ Routes: `packages/registry/src/routes/taxonomy.ts`

### Frontend
- ✅ API client: `getCategories()` in `packages/webapp/src/lib/api.ts:1229`
- ❌ UI: Still hardcoded categories at line 961-967

### Scripts
- ✅ Generation script: `packages/registry/scripts/generate-taxonomy.ts`
- Uses OpenAI to analyze packages and propose categories
- Outputs JSON for review
- Can insert into DB with `--approve` flag

## Files to Modify

1. **New migration file** (to be created)
   - Path: `packages/registry/migrations/0XX_seed_taxonomy_data.sql`
   - Contains: INSERT statements from generated JSON

2. **Search page** (to be updated)
   - Path: `packages/webapp/src/app/(app)/search/page.tsx`
   - Lines: 950-969 (category filter section)
   - Change: Load categories from API instead of hardcoded values

## Production Deployment Plan

1. Migration `049_create_taxonomy_tables.sql` creates empty tables
2. New migration `0XX_seed_taxonomy_data.sql` populates with categories/use cases
3. Frontend loads categories dynamically
4. Optional: Add cron job to refresh taxonomy periodically

## Questions to Consider

- Should taxonomy regeneration be automated (cron) or manual?
- Should we support user-suggested categories?
- How to handle packages that don't fit existing categories?
- Should we show category hierarchy in breadcrumbs on package pages?

## Related Documentation

- `docs/AI_SEARCH_IMPLEMENTATION.md` - AI search features
- `packages/registry/scripts/generate-taxonomy.ts` - Generation script
- `packages/registry/migrations/049_create_taxonomy_tables.sql` - Schema
