# Package Quality & Ranking System

**Problem**: With multiple sources (cursor rules, Claude agents, skills) and many contributors, there will inevitably be name conflicts and quality variations. How do we surface the best packages?

---

## The Problem

### Name Conflicts

Multiple packages with similar purposes:
- `react-rules` from 5 different authors
- `frontend-developer` agent from 3 sources
- `typescript-expert` skill in multiple variations

**Questions users ask:**
- Which `react-rules` is best?
- Who's the authoritative source?
- Which one should I trust?

### Quality Variations

- Some packages are actively maintained, others abandoned
- Different quality levels in documentation
- Varying levels of testing and validation
- Different levels of community trust

---

## Solution: Multi-Factor Ranking System

### 1. Package Scoring Algorithm

**Base Score Calculation:**
```typescript
interface PackageScore {
  total: number;           // 0-100
  breakdown: {
    popularity: number;    // 0-30 points
    quality: number;       // 0-30 points
    trust: number;         // 0-20 points
    recency: number;       // 0-10 points
    completeness: number;  // 0-10 points
  };
}
```

#### Factor 1: Popularity (0-30 points)

**Metrics:**
- Total downloads (weighted by recency)
- Stars/favorites
- Installation rate (installs / views)
- Trending velocity (downloads last 7 days vs previous 7)

**Algorithm:**
```typescript
function calculatePopularityScore(pkg: Package): number {
  const downloadScore = Math.min(Math.log10(pkg.totalDownloads + 1) * 3, 15);
  const trendingScore = Math.min((pkg.downloadsLast7Days / 10), 10);
  const installRate = (pkg.installs / pkg.views) * 5;

  return Math.min(downloadScore + trendingScore + installRate, 30);
}
```

#### Factor 2: Quality (0-30 points)

**Metrics:**
- User ratings (1-5 stars)
- Review sentiment
- Issue/bug reports
- Documentation completeness
- Code quality (if open source)

**Algorithm:**
```typescript
function calculateQualityScore(pkg: Package): number {
  const ratingScore = (pkg.averageRating / 5) * 15;
  const reviewCount = Math.min(Math.log10(pkg.reviewCount + 1) * 5, 10);
  const docScore = pkg.hasReadme ? 5 : 0;

  return Math.min(ratingScore + reviewCount + docScore, 30);
}
```

#### Factor 3: Trust (0-20 points)

**Metrics:**
- Verified author badge
- Original creator vs fork
- Publisher reputation
- Security scan results
- Community endorsements

**Algorithm:**
```typescript
function calculateTrustScore(pkg: Package): number {
  let score = 0;

  // Verified author
  if (pkg.author.verified) score += 10;

  // Original creator (not a fork/copy)
  if (pkg.metadata.isOriginal) score += 5;

  // Publisher reputation
  score += Math.min(pkg.author.publishedPackages / 5, 3);

  // Security passed
  if (pkg.securityCheck?.passed) score += 2;

  return Math.min(score, 20);
}
```

#### Factor 4: Recency (0-10 points)

**Metrics:**
- Last updated date
- Release frequency
- Active maintenance

**Algorithm:**
```typescript
function calculateRecencyScore(pkg: Package): number {
  const daysSinceUpdate = (Date.now() - pkg.updatedAt) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 30) return 10;
  if (daysSinceUpdate < 90) return 7;
  if (daysSinceUpdate < 180) return 5;
  if (daysSinceUpdate < 365) return 3;
  return 1;
}
```

#### Factor 5: Completeness (0-10 points)

**Metrics:**
- Has README
- Has examples
- Has tags
- Has valid semver
- Complete metadata

**Algorithm:**
```typescript
function calculateCompletenessScore(pkg: Package): number {
  let score = 0;

  if (pkg.readme) score += 3;
  if (pkg.examples?.length > 0) score += 2;
  if (pkg.tags?.length >= 3) score += 2;
  if (pkg.validSemver) score += 2;
  if (pkg.description?.length > 50) score += 1;

  return score;
}
```

---

## 2. Name Conflict Resolution

### Strategy A: Namespacing (npm-style)

**Format:** `@author/package-name`

**Examples:**
- `@galpert/frontend-developer`
- `@wshobson/frontend-developer`
- `@cursor-rules-org/react-rules`

**Pros:**
- Clear ownership
- No conflicts
- Familiar to developers

**Cons:**
- Longer names
- Requires username lookup

### Strategy B: Suffixing (current approach)

**Format:** `package-name-author`

**Examples:**
- `frontend-developer-galpert`
- `frontend-developer-wshobson`
- `react-rules-cursor-org`

**Pros:**
- Shorter than namespacing
- Clear differentiation
- Search-friendly

**Cons:**
- Not standard
- Can be confusing

### Strategy C: Canonical Names (recommended hybrid)

**Allow both namespace and suffix:**
- Canonical: `frontend-developer` (highest scoring package)
- Namespaced: `@galpert/frontend-developer`
- Suffixed: `frontend-developer-galpert`

**Resolution Order:**
1. Check for exact match
2. Check for namespace match
3. Check for suffix match
4. Show all matches, sorted by score

**Implementation:**
```typescript
async function resolvePackageName(name: string): Promise<Package> {
  // Exact match
  const exact = await db.findPackage({ name });
  if (exact) return exact;

  // Namespace match (@author/name)
  if (name.startsWith('@')) {
    const [author, pkgName] = name.split('/');
    return await db.findPackage({
      name: pkgName,
      'author.username': author.slice(1)
    });
  }

  // Find all similar packages
  const similar = await db.findPackages({
    name: { $regex: name, $options: 'i' }
  });

  // Return highest scoring
  return similar.sort((a, b) => b.score.total - a.score.total)[0];
}
```

---

## 3. Search Ranking

### Default Sort: Relevance + Score

**Algorithm:**
```typescript
function calculateSearchScore(pkg: Package, query: string): number {
  const relevanceScore = calculateRelevance(pkg, query); // 0-100
  const qualityScore = pkg.score.total; // 0-100

  // Weight: 60% relevance, 40% quality
  return (relevanceScore * 0.6) + (qualityScore * 0.4);
}

function calculateRelevance(pkg: Package, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Exact name match
  if (pkg.name.toLowerCase() === queryLower) score += 50;

  // Name contains query
  else if (pkg.name.toLowerCase().includes(queryLower)) score += 30;

  // Description contains query
  if (pkg.description?.toLowerCase().includes(queryLower)) score += 20;

  // Tags contain query
  if (pkg.tags?.some(t => t.toLowerCase().includes(queryLower))) score += 30;

  return Math.min(score, 100);
}
```

### Sort Options

Users can override default sort:
- **Relevance** (default) - Best match for query
- **Popular** - Most downloads
- **Trending** - Fastest growing
- **Recent** - Recently updated
- **Rating** - Highest rated
- **Name** - Alphabetical

---

## 4. Badges & Trust Indicators

### Badge System

**Verified Author ✓**
- GitHub OAuth verified
- Email verified
- Original package creator

**Official 🏆**
- Recognized authority (e.g., @cursor-rules-org)
- Verified by PRMP team
- Industry standard

**Popular ⭐**
- 1,000+ downloads
- 4.5+ average rating
- Top 10% in category

**Maintained 🔄**
- Updated in last 30 days
- Active issue responses
- Regular releases

**Secure 🔒**
- Security scan passed
- No known vulnerabilities
- Code reviewed

**Featured 🌟**
- Curated by PRMP team
- High quality example
- Recommended for beginners

### Badge Display

**In Search Results:**
```
[✓🏆⭐] react-rules
by cursor-rules-org • 10k downloads • ⭐ 4.8

[✓🔄] react-rules-advanced
by patrickjs • 2k downloads • ⭐ 4.5

react-rules-custom
by john-doe • 50 downloads • ⭐ 3.2
```

**In Package Info:**
```
react-rules v2.1.0

✓ Verified Author (cursor-rules-org)
🏆 Official Package
⭐ Popular (10,234 downloads)
🔄 Actively Maintained (updated 2 days ago)
🔒 Security Verified

Score: 92/100 (Top 1%)
```

---

## 5. Discovery & Recommendations

### "Similar Packages" Feature

When viewing a package, show similar ones:

**Algorithm:**
```typescript
async function findSimilarPackages(pkg: Package): Promise<Package[]> {
  // Find packages with:
  // 1. Overlapping tags
  // 2. Same category
  // 3. Similar description (embedding similarity)

  const candidates = await db.findPackages({
    $or: [
      { tags: { $in: pkg.tags } },
      { category: pkg.category },
      { type: pkg.type }
    ],
    _id: { $ne: pkg._id }
  });

  // Score by similarity
  const scored = candidates.map(c => ({
    package: c,
    similarity: calculateSimilarity(pkg, c)
  }));

  // Return top 5, sorted by similarity then quality
  return scored
    .sort((a, b) => {
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }
      return b.package.score.total - a.package.score.total;
    })
    .slice(0, 5)
    .map(s => s.package);
}
```

### "People Also Installed" Feature

Track co-installations:

```sql
-- Track what users install together
CREATE TABLE installation_pairs (
  package_a VARCHAR(255),
  package_b VARCHAR(255),
  count INTEGER,
  PRIMARY KEY (package_a, package_b)
);

-- When user installs package A, suggest packages often installed with A
SELECT package_b, count
FROM installation_pairs
WHERE package_a = 'react-rules'
ORDER BY count DESC
LIMIT 5;
```

### Category Leaders

Show top packages in each category:

```typescript
interface CategoryLeader {
  category: string;
  topPackages: Package[];
}

async function getCategoryLeaders(): Promise<CategoryLeader[]> {
  const categories = ['cursor', 'claude', 'claude-skill', 'continue', 'windsurf'];

  return Promise.all(categories.map(async category => {
    const topPackages = await db.findPackages({ type: category })
      .sort({ 'score.total': -1 })
      .limit(10);

    return { category, topPackages };
  }));
}
```

---

## 6. User Ratings & Reviews

### Rating System

**5-Star Rating:**
- 1 star: Doesn't work / Harmful
- 2 stars: Poor quality / Not useful
- 3 stars: Works but has issues
- 4 stars: Good quality, useful
- 5 stars: Excellent, highly recommend

**Review Requirements:**
- Must have installed the package
- Minimum 100 characters for written review
- Rate limit: 1 review per package per user

### Review Quality Scoring

Helpful reviews get promoted:

```typescript
interface Review {
  userId: string;
  rating: number;
  text: string;
  helpful: number;      // Upvotes
  notHelpful: number;   // Downvotes
  verified: boolean;    // Actually installed
}

function calculateReviewScore(review: Review): number {
  const helpfulRatio = review.helpful / (review.helpful + review.notHelpful + 1);
  const lengthBonus = Math.min(review.text.length / 100, 2);
  const verifiedBonus = review.verified ? 2 : 0;

  return helpfulRatio * 10 + lengthBonus + verifiedBonus;
}
```

### Preventing Gaming

**Detection:**
- Sudden spike in 5-star reviews
- Reviews from new accounts
- Similar review text (copy-paste)
- Reviews all from same IP range

**Mitigation:**
- Verified installs only
- Rate limiting
- Require diverse reviewers
- Manual review for suspicious activity

---

## 7. Implementation Plan

### Phase 1: Basic Scoring (Week 1-2)

```sql
-- Add scoring columns to packages table
ALTER TABLE packages ADD COLUMN score_total INTEGER DEFAULT 0;
ALTER TABLE packages ADD COLUMN score_popularity INTEGER DEFAULT 0;
ALTER TABLE packages ADD COLUMN score_quality INTEGER DEFAULT 0;
ALTER TABLE packages ADD COLUMN score_trust INTEGER DEFAULT 0;
ALTER TABLE packages ADD COLUMN score_recency INTEGER DEFAULT 0;
ALTER TABLE packages ADD COLUMN score_completeness INTEGER DEFAULT 0;

-- Create index for sorting
CREATE INDEX idx_packages_score ON packages(score_total DESC);
```

### Phase 2: Ratings & Reviews (Week 3-4)

```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY,
  package_id VARCHAR(255) REFERENCES packages(id),
  user_id VARCHAR(255) REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  helpful INTEGER DEFAULT 0,
  not_helpful INTEGER DEFAULT 0,
  verified_install BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(package_id, user_id)
);

CREATE INDEX idx_ratings_package ON ratings(package_id);
CREATE INDEX idx_ratings_helpful ON ratings(helpful DESC);
```

### Phase 3: Badges & Trust (Week 5-6)

```sql
CREATE TABLE badges (
  package_id VARCHAR(255) REFERENCES packages(id),
  badge_type VARCHAR(50),  -- verified, official, popular, etc.
  awarded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  PRIMARY KEY (package_id, badge_type)
);
```

### Phase 4: Recommendations (Week 7-8)

```sql
CREATE TABLE installation_pairs (
  package_a VARCHAR(255),
  package_b VARCHAR(255),
  pair_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (package_a, package_b)
);

-- Materialized view for similar packages
CREATE MATERIALIZED VIEW similar_packages AS
SELECT
  p1.id as package_id,
  p2.id as similar_package_id,
  COUNT(DISTINCT t.tag) as tag_overlap
FROM packages p1
JOIN package_tags t1 ON p1.id = t1.package_id
JOIN package_tags t2 ON t1.tag = t2.tag
JOIN packages p2 ON t2.package_id = p2.id
WHERE p1.id != p2.id
GROUP BY p1.id, p2.id
HAVING COUNT(DISTINCT t.tag) >= 2;

REFRESH MATERIALIZED VIEW similar_packages;
```

---

## 8. CLI Integration

### Search with Quality Indicators

```bash
$ prpm search react

Results for "react":

1. [✓🏆⭐] react-rules
   by @cursor-rules-org • 10k downloads • ⭐ 4.8 • Score: 92/100
   Official React best practices and patterns

2. [✓🔄] react-expert-skill
   by @patrickjs • 2k downloads • ⭐ 4.5 • Score: 78/100
   Expert-level React guidance and optimization

3. [✓] react-typescript-rules
   by @typescript-team • 1.5k downloads • ⭐ 4.3 • Score: 72/100
   React with TypeScript best practices

4. react-hooks-guide
   by @modern-react • 500 downloads • ⭐ 4.0 • Score: 65/100
   Modern React hooks patterns

Showing 4 of 24 results. Use --all to see more.
```

### Installing with Disambiguation

```bash
$ prpm install react-rules

Multiple packages found for "react-rules":

1. [✓🏆] react-rules (recommended)
   by cursor-rules-org • Score: 92/100

2. [✓] react-rules-advanced
   by patrickjs • Score: 78/100

3. react-rules-custom
   by john-doe • Score: 45/100

Install which one? [1]:
```

### Package Info with Scores

```bash
$ prpm info react-rules

react-rules v2.1.0

Description:
  Official React best practices, patterns, and modern conventions

Author: cursor-rules-org ✓
Type: cursor
Downloads: 10,234
Rating: ⭐⭐⭐⭐⭐ 4.8 (156 reviews)

Quality Score: 92/100 (Top 1%)
  Popularity:    28/30 ⭐⭐⭐⭐⭐
  Quality:       29/30 ⭐⭐⭐⭐⭐
  Trust:         20/20 ⭐⭐⭐⭐⭐
  Recency:       10/10 ⭐⭐⭐⭐⭐
  Completeness:  10/10 ⭐⭐⭐⭐⭐

Badges:
  ✓ Verified Author
  🏆 Official Package
  ⭐ Popular (10k+ downloads)
  🔄 Actively Maintained
  🔒 Security Verified

Install: prpm install react-rules
Repository: github.com/cursor-rules-org/react-rules
```

---

## 9. Web Dashboard Features

### Package Page

**Quality Indicators:**
- Score breakdown (radar chart)
- Trend graph (downloads over time)
- Review highlights (top positive/negative)
- Similar packages sidebar
- "People also installed" section

### Compare Feature

Allow users to compare packages side-by-side:

```
Compare: react-rules vs react-rules-advanced

                    react-rules     react-rules-advanced
Score               92/100 ✓        78/100
Downloads           10,234          2,145
Rating              4.8 ⭐          4.5 ⭐
Last Updated        2 days ago      1 week ago
Verified            Yes ✓           Yes ✓
Official            Yes 🏆          No

Reviews say:
react-rules:        "Best practices"  "Very complete"
react-advanced:     "More advanced"   "Good for experts"

Recommendation: react-rules for most users
```

---

## 10. Gaming Prevention

### Rate Limiting

- Max 10 packages per user per day
- Max 5 reviews per user per day
- Cooldown period between reviews

### Quality Checks

- Flag packages with identical content
- Detect name squatting
- Monitor for fake reviews
- Track suspicious download patterns

### Manual Review

Packages flagged for:
- Rapid downloads from single IP
- Identical code to existing package
- Misleading name/description
- Security concerns

---

## Summary

### Key Principles

1. **Multi-factor scoring** - No single metric determines quality
2. **Transparency** - Show users WHY a package ranks higher
3. **User choice** - Allow sorting by different criteria
4. **Trust indicators** - Badges, verification, reviews
5. **Discovery** - Recommendations, similar packages
6. **Prevent gaming** - Rate limits, detection, manual review

### Expected Outcomes

- **Users find best packages faster**
- **Quality content rises to top**
- **Conflicts resolved intelligently**
- **Trust in the ecosystem**
- **Less confusion, more confidence**

---

**Implementation Priority: HIGH**

This should be implemented in Phase 2 (Month 2-3) after initial launch.
