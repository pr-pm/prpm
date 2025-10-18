# Quality & Ranking System Summary

**Problem**: Name conflicts and quality variations with multiple sources

**Solution**: Comprehensive multi-factor scoring and discovery system

---

## The Challenge

With 3+ sources of Claude agents, cursor rules, and skills:
- Multiple packages with same names (e.g., "react-rules" from 5 authors)
- Quality varies widely
- Users don't know which to trust
- No clear "best" indicator

---

## The Solution

### 1. Multi-Factor Scoring (0-100 points)

**Breakdown:**
- **Popularity**: 30 points (downloads, trending, install rate)
- **Quality**: 30 points (ratings, reviews, documentation)
- **Trust**: 20 points (verified author, security, reputation)
- **Recency**: 10 points (last updated, maintenance)
- **Completeness**: 10 points (README, examples, tags)

**Example Scores:**
- Official package: 92/100 (Top 1%)
- Quality fork: 78/100 (Top 10%)
- New package: 45/100 (Average)

### 2. Name Conflict Resolution

**Three Approaches:**

**A. Namespacing** (npm-style)
```
@cursor-rules-org/react-rules
@patrickjs/react-rules
```

**B. Suffixing** (current)
```
react-rules-cursor-org
react-rules-patrickjs
```

**C. Canonical** (recommended)
- Highest scoring package gets canonical name
- Others use namespace/suffix
- Search resolves intelligently

**Resolution Order:**
1. Exact match → Return immediately
2. Namespace match → Check @author/name
3. Suffix match → Check name-author
4. Multiple matches → Show all, sorted by score

### 3. Badge System

**Six Badge Types:**

| Badge | Criteria | Display |
|-------|----------|---------|
| Verified Author | GitHub OAuth verified | ✓ |
| Official | Recognized authority | 🏆 |
| Popular | 1k+ downloads, 4.5+ rating | ⭐ |
| Maintained | Updated <30 days | 🔄 |
| Secure | Security scan passed | 🔒 |
| Featured | PRPM curated | 🌟 |

**Search Display:**
```
[✓🏆⭐] react-rules
by cursor-rules-org • 10k downloads • ⭐ 4.8

[✓🔄] react-rules-advanced  
by patrickjs • 2k downloads • ⭐ 4.5

react-rules-custom
by john-doe • 50 downloads • ⭐ 3.2
```

### 4. Discovery Features

**Similar Packages:**
- Based on tag overlap
- Same category
- Description similarity
- Sorted by similarity + quality

**People Also Installed:**
- Track co-installations
- "Users who installed X also installed Y"
- Top 5 recommendations

**Category Leaders:**
- Top 10 packages per type
- Cursor, Claude, Claude Skills, etc.
- Updated daily

### 5. Rating & Review System

**5-Star Ratings:**
- 1 star: Doesn't work
- 2 stars: Poor quality
- 3 stars: Works but has issues
- 4 stars: Good quality
- 5 stars: Excellent

**Requirements:**
- Must have installed package
- Minimum 100 characters for review
- 1 review per package per user

**Review Quality:**
- Upvotes/downvotes for helpfulness
- Verified install badge
- Top reviews surface first

### 6. Gaming Prevention

**Detection:**
- Sudden review spikes
- New account reviews
- Similar review text
- Same IP range

**Mitigation:**
- Rate limits (10 packages/day, 5 reviews/day)
- Verified installs only
- Manual review for suspicious activity
- Cooldown periods

---

## Database Schema

### New Tables

```sql
-- Package badges
badges (package_id, badge_type, awarded_at, expires_at)

-- User ratings and reviews
ratings (id, package_id, user_id, rating, review, helpful, verified_install)

-- Review helpfulness
review_votes (review_id, user_id, vote)

-- Installation tracking
installations (id, user_id, package_id, installed_at)

-- Co-installation tracking
installation_pairs (package_a, package_b, pair_count)
```

### New Package Columns

```sql
-- Scoring
score_total (0-100)
score_popularity (0-30)
score_quality (0-30)
score_trust (0-20)
score_recency (0-10)
score_completeness (0-10)

-- Metrics
view_count
install_count
install_rate
downloads_last_7_days
trending_score
```

### PostgreSQL Functions

```sql
calculate_package_score(pkg_id) -- Returns score breakdown
update_package_score()          -- Trigger on updates
```

---

## CLI Integration

### Search with Quality

```bash
$ prmp search react

[✓🏆⭐] react-rules
by @cursor-rules-org • 10k downloads • ⭐ 4.8 • Score: 92/100
Official React best practices

[✓🔄] react-expert-skill
by @patrickjs • 2k downloads • ⭐ 4.5 • Score: 78/100
Expert React guidance
```

### Install with Disambiguation

```bash
$ prmp install react-rules

Multiple packages found:
1. [✓🏆] react-rules (recommended) Score: 92/100
2. [✓] react-rules-advanced Score: 78/100
3. react-rules-custom Score: 45/100

Install which? [1]:
```

### Package Info

```bash
$ prmp info react-rules

react-rules v2.1.0

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
```

---

## Implementation Timeline

### Phase 1: Basic Scoring (Week 1-2)
- Add score columns to database
- Implement calculate_package_score()
- Update search to sort by score
- Show scores in CLI

### Phase 2: Ratings & Reviews (Week 3-4)
- Add ratings table
- Implement review system
- Add review voting
- Show ratings in search/info

### Phase 3: Badges (Week 5-6)
- Implement badge system
- Auto-award badges (popular, maintained)
- Manual badges (official, featured)
- Display in CLI and web

### Phase 4: Discovery (Week 7-8)
- Similar packages
- "People also installed"
- Category leaders
- Recommendations engine

---

## Success Metrics

### User Experience
- Reduce "which package?" questions by 80%
- Increase confidence in choices
- Faster discovery of quality packages

### Quality Improvement
- Top 10% packages get 80% of installs
- User ratings correlate with quality scores
- Verified packages preferred 3:1

### Gaming Prevention
- <1% suspicious activity detected
- <0.1% false positives
- Quick resolution of issues

---

## Files Created

1. **docs/QUALITY_AND_RANKING.md** (500+ lines)
   - Complete system design
   - All algorithms documented
   - CLI integration examples
   - Gaming prevention strategies

2. **registry/migrations/002_add_quality_scoring.sql** (300+ lines)
   - All new tables
   - Score columns
   - PostgreSQL functions
   - Indexes and triggers

---

## Next Steps

1. **Review & Feedback** (Week 1)
   - Get feedback on scoring algorithm
   - Adjust weights if needed
   - Test with sample data

2. **Implement Phase 1** (Week 2-3)
   - Run migration
   - Implement scoring in registry API
   - Update CLI to show scores
   - Test with real packages

3. **Launch** (Month 2)
   - Enable in production
   - Monitor metrics
   - Adjust based on usage
   - Iterate on weights

---

## Key Benefits

✅ **Clear Quality Indicators** - Users know which packages to trust
✅ **Conflict Resolution** - Multiple "react-rules" no longer confusing
✅ **Discovery** - Find similar and complementary packages
✅ **Trust** - Verified authors, official badges, security
✅ **Fairness** - Multi-factor prevents gaming
✅ **Transparency** - Users see why packages rank higher

---

**Status**: ✅ Designed and ready for implementation

**Priority**: HIGH (Month 2-3 after initial launch)

**See**: `docs/QUALITY_AND_RANKING.md` for complete details
