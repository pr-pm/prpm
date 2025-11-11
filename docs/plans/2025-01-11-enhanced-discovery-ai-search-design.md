# Enhanced Package Discovery & AI-Powered Search

**Date:** January 11, 2025
**Status:** Approved
**Timeline:** 4 weeks

## Executive Summary

Transform PRPM's package discovery with hierarchical taxonomy, use-case based browsing, and AI-powered semantic search. This positions PRPM+ as a premium $19/month developer toolkit with intelligent package discovery at its core.

**Key Goals:**
1. Improve discoverability for 4,500+ packages through better taxonomy and filters
2. Launch AI semantic search as premium PRPM+ feature to drive conversions
3. Reposition PRPM+ from $6/month to $19/month with expanded feature set

## Problem Statement

**Current Pain Points:**
- Too many packages to sift through without effective filtering
- Users don't know what tags/categories to filter by
- Single-level category system doesn't scale to 4,500+ packages
- No way to search by natural language intent ("I want to build a Flask API")
- PRPM+ at $6/month has zero conversions - under-priced and under-featured

## Solution Overview

### Part 1: Enhanced Discovery (Free for All Users)

**Hierarchical Categories (2-3 levels)**
- Replace single category string with tree structure
- Example: Backend Development → API Development → REST APIs
- Multiple categories per package
- AI-generated taxonomy from existing packages

**Use Case Browsing**
- Organize by what users are trying to accomplish
- Examples: "Building REST APIs", "Setting up CI/CD", "Testing React components"
- Entry point for discovery, leads to relevant categories

**Tag Clusters**
- Group related tags visually (Languages, Frameworks, Purpose)
- Makes filtering intuitive and discoverable

### Part 2: AI-Powered Search (PRPM+ Premium)

**Semantic Search**
- Natural language queries: "Python Flask REST API with authentication"
- Embeddings-based matching using OpenAI text-embedding-3-small
- Multi-stage ranking: semantic similarity + quality + popularity
- Available in web UI and CLI

**AI-Enriched Content**
- Generate use case descriptions, problem statements for each package
- Identify similar packages automatically
- Optimize for how users naturally search

## Architecture

### Database Schema

```sql
-- Hierarchical category system
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Use cases for discovery
CREATE TABLE use_cases (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  example_query TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Many-to-many relationships
CREATE TABLE package_categories (
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, category_id)
);

CREATE TABLE package_use_cases (
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, use_case_id)
);

-- AI embeddings and enriched content
CREATE TABLE package_embeddings (
  package_id UUID PRIMARY KEY REFERENCES packages(id) ON DELETE CASCADE,
  ai_use_case_description TEXT,
  ai_problem_statement TEXT,
  ai_similar_to TEXT[],
  ai_best_for TEXT,
  embedding vector(1536),
  generated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON package_embeddings USING ivfflat (embedding vector_cosine_ops);
```

**Dependencies:**
- PostgreSQL 17.4 (current version - compatible)
- pgvector extension (supported by RDS)
- OpenAI API for embeddings

### AI Search Pipeline

```typescript
async function aiSearch(query: string, filters?: Filters) {
  // 1. Paywall check
  if (!user.isPRPMPlus) throw new Error('AI Search requires PRPM+');

  // 2. Embed user query
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });

  // 3. Vector similarity search (top 50)
  const candidates = await db.query(`
    SELECT p.*, pe.*,
           1 - (pe.embedding <=> $1::vector) as similarity_score
    FROM packages p
    JOIN package_embeddings pe ON p.id = pe.package_id
    WHERE p.visibility = 'public'
      AND p.deprecated = false
      ${applyOptionalFilters(filters)}
    ORDER BY pe.embedding <=> $1::vector
    LIMIT 50
  `, [embedding]);

  // 4. Rerank by combined score
  const scored = candidates.map(pkg => ({
    ...pkg,
    final_score:
      (pkg.similarity_score * 0.5) +              // 50% semantic match
      ((pkg.quality_score / 5) * 0.3) +           // 30% quality
      (Math.log10(pkg.total_downloads + 1) / 6 * 0.2) // 20% popularity
  }));

  // 5. Return top 10
  return scored.sort((a, b) => b.final_score - a.final_score).slice(0, 10);
}
```

**Cost Estimates:**
- Initial embedding generation: $10-15 for 4,500 packages
- Per package: ~$0.00004 per new package
- Per search: ~$0.000001 per query
- Monthly operating cost: <$5 for expected search volume

## User Experience

### Web Interface

**Search Page with AI Toggle:**
- PRPM+ members: Toggle between traditional and AI search
- Non-members: AI search box visible with upgrade prompt on click
- Results show match score, quality, downloads with AI indicator

**Use Case Landing:**
- Homepage shows popular use cases as entry points
- Click use case → see relevant categories → filter by tags
- Progressive disclosure from broad to specific

**Upgrade Prompts:**
- Inline CTAs when non-members try AI search
- "✨ This is a PRPM+ feature" modal with benefits
- 14-day free trial to reduce friction

### CLI Integration

```bash
# New explicit command
prpm ai-search "Python Flask REST API with authentication"

# Flag on existing search
prpm search --ai "describe what you need"

# Output format
✨ AI Search Results (10 matches)

1. @prpm/flask-rest-boilerplate ⭐ 4.8 📦 1.2K
   🤖 92% match - Best for: Small to medium Flask APIs
   Building REST APIs with built-in auth and documentation

2. @author/flask-api-starter ⭐ 4.5 📦 890
   🤖 89% match - Best for: Rapid prototyping
   ...
```

## Updated PRPM+ Pricing

### New Plan: $19/month

**🤖 AI-Powered Discovery**
- Unlimited AI semantic search
- Natural language package discovery
- AI-powered recommendations
- "Similar packages" suggestions

**🎯 Enhanced Discovery**
- Advanced filters (quality, framework, use case)
- Save searches & get notifications
- Full-text search across package content
- Hierarchical category browsing

**🎮 Playground Access**
- 100 monthly credits (rollover to 200)
- Test packages with real AI models
- Custom prompts & configurations
- Save and share playground sessions

**👤 Author Benefits**
- Verified author badge
- Package analytics dashboard

**💬 Priority Support**
- Email support with 24h response
- Direct feedback channel

### Migration Strategy

- Current $6/month members: Grandfathered OR upgrade offer at $13/month
- New members: Full $19/month
- 14-day free trial for all new subscriptions
- Annual plan: $190/year (17% savings)

## Implementation Plan

### Week 1: Foundation & Schema

**Database:**
- Create pgvector extension migration
- Create taxonomy tables (categories, use_cases, junctions)
- Create package_embeddings table
- Add appropriate indexes

**Scripts:**
- Build taxonomy generation script
- Generate initial taxonomy proposal using AI analysis
- Review and approval process

### Week 2: Taxonomy Integration

**Backend:**
- Insert approved taxonomy into database
- Create category/use-case browsing endpoints
- Update search to filter by categories
- Run AI categorization for all packages

**Frontend:**
- Add hierarchical category navigation
- Add use case browsing page
- Update search filters with taxonomy
- Deploy taxonomy features (FREE for all)

### Week 3: Embeddings Generation

**Backend:**
- Build embedding generation service
- Generate AI-enriched content for packages:
  - ai_use_case_description
  - ai_problem_statement
  - ai_similar_to
  - ai_best_for
- Create embeddings for 4,500 packages in batches
- Set up webhook for new package embeddings

**Infrastructure:**
- Batch processing with rate limiting
- Error handling and retry logic
- Progress tracking and logging

### Week 4: AI Search & Launch

**Backend:**
- Build AI search endpoint with multi-stage pipeline
- Add PRPM+ paywall middleware
- Update Stripe with new $19/month plan
- Add usage tracking for analytics

**Frontend:**
- Build AI search UI with upgrade prompts
- Add search mode toggle for PRPM+ members
- Update pricing page with new features
- Add conversion CTAs throughout app

**CLI:**
- Add `prpm ai-search` command
- Add `--ai` flag to existing search
- Add upgrade prompts for non-members
- Update help documentation

**Launch:**
- Email existing users with feature announcement
- Offer upgrade incentive for current members
- Enable 14-day free trial
- Monitor conversion metrics

## Success Metrics

**Discovery Improvements (Week 2 onwards):**
- Search success rate (did user find what they wanted?)
- Category usage vs old single-category
- Average time to find package (should decrease)

**AI Search Adoption (Week 4 onwards):**
- AI search queries per PRPM+ member
- Conversion rate from AI search prompt to upgrade
- Search result click-through rate (AI vs traditional)

**Revenue Impact:**
- PRPM+ conversion rate at $19/month
- Current member upgrade rate
- Trial to paid conversion rate
- Target: 5-10 conversions in first month

## Risks & Mitigations

**Risk: Taxonomy doesn't match user mental models**
- Mitigation: Iterative refinement based on search analytics
- Mitigation: Use case browsing provides alternative navigation

**Risk: AI search quality not good enough**
- Mitigation: Start with enriched content + README (comprehensive context)
- Mitigation: Reranking by quality/popularity ensures good results surface
- Mitigation: Can iterate on ranking weights based on feedback

**Risk: $19 price point too high for conversions**
- Mitigation: 14-day free trial reduces commitment friction
- Mitigation: Feature set justifies price (comparable to other dev tools)
- Mitigation: Can adjust if data shows resistance

**Risk: Embedding generation costs spiral**
- Mitigation: Batch processing with clear cost monitoring
- Mitigation: Only regenerate on package updates, not queries
- Mitigation: text-embedding-3-small is extremely cheap (<$15 total)

## Future Enhancements

**Post-Launch Opportunities:**
- Personalized recommendations based on user's stack/history
- "Packages you might have missed" notifications
- AI-generated package comparisons
- Conversational search refinement
- Team/organization package collections
- Integration with IDE extensions

## Appendix: Seed Taxonomy

**Proposed Top-Level Categories:**
1. Backend Development
2. Frontend Development
3. Testing & Quality
4. DevOps & Infrastructure
5. AI & Machine Learning
6. Data Engineering
7. Mobile Development
8. Security
9. Documentation
10. Code Quality

(Subcategories to be generated by AI analysis and reviewed)
