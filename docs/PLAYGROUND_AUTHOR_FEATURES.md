# PRPM Playground Author Features

Comprehensive guide to author-focused features for PRPM Playground that help package authors showcase their packages, guide users to successful testing experiences, and track engagement metrics.

---

## Table of Contents

- [Overview](#overview)
- [Phase 1: Suggested Test Inputs + Featured Results](#phase-1-suggested-test-inputs--featured-results)
- [Phase 2: Analytics Dashboard](#phase-2-analytics-dashboard)
- [Future Phases](#future-phases)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [CLI Tools](#cli-tools)
- [Best Practices](#best-practices)
- [Metrics & Success Criteria](#metrics--success-criteria)

---

## Overview

The Playground Author Features provide a complete toolkit for package authors to:

1. **Guide users** with curated test inputs
2. **Showcase best results** through featured examples
3. **Track engagement** with comprehensive analytics
4. **Optimize packages** based on real usage data
5. **Build confidence** in package quality

### Key Benefits

**For Authors:**
- Increase package discovery and adoption
- Guide users to successful testing experiences
- Track which inputs perform best
- Identify improvement opportunities
- Build social proof through featured results

**For Users:**
- Get started quickly with suggested inputs
- See real examples of package capabilities
- Learn from curated, high-quality results
- Make informed decisions before installing

---

## Phase 1: Suggested Test Inputs + Featured Results

**Status**: ✅ Complete
**Delivered**: November 2025

### Suggested Test Inputs

#### What are Suggested Test Inputs?

Author-curated example prompts that appear on package pages to guide users toward successful testing experiences.

#### Features

- **Categories**: Organize inputs by type (code-review, documentation, bug-fix, feature, refactoring, testing)
- **Difficulty Levels**: Mark as beginner, intermediate, or advanced
- **Credit Estimates**: Show approximate cost for each test
- **Model Recommendations**: Suggest optimal model for each input
- **Usage Tracking**: See how many users try each input
- **One-Click Testing**: "Try This" button auto-populates playground

#### Creating Suggested Inputs

**Via Web UI**:
1. Navigate to dashboard
2. Find "Suggested Test Inputs" section
3. Click "Create Suggested Input"
4. Fill in:
   - Package (dropdown of your packages)
   - Title (max 100 chars, descriptive)
   - Description (optional, 1-2 sentences)
   - Suggested Input (the actual test text)
   - Category (optional)
   - Difficulty (beginner/intermediate/advanced)
   - Estimated Credits (1-10)
   - Recommended Model (optional)
   - Display Order (lower = shown first)

**Via API**:
```bash
curl -X POST https://registry.prpm.dev/api/v1/suggested-inputs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": "uuid-here",
    "title": "Review a React component for best practices",
    "description": "Example showing component code review capabilities",
    "suggested_input": "Review this React component:\n\nfunction UserProfile({ user }) {\n  return (\n    <div>\n      <h1>{user.name}</h1>\n      <p>{user.email}</p>\n    </div>\n  );\n}",
    "category": "code-review",
    "difficulty": "beginner",
    "estimated_credits": 2,
    "recommended_model": "sonnet"
  }'
```

#### Best Practices for Suggested Inputs

✅ **Good Examples**:
- Specific, realistic inputs with actual code/text
- Cover different difficulty levels
- Demonstrate clear use cases
- Include edge cases and common scenarios
- Use proper formatting and structure

❌ **Bad Examples**:
- Generic "test this" or "review my code"
- Vague or unclear requirements
- Missing context or examples
- Overly complex for beginners
- No clear expected outcome

#### Bulk Generation with AI

Generate suggested inputs for all packages automatically:

```bash
cd packages/registry

# Test with limited packages first
npm run generate-suggested-inputs -- --limit 10

# Generate for all packages
npm run generate-suggested-inputs

# Force regenerate existing inputs
npm run generate-suggested-inputs -- --force

# Skip errors and continue
npm run generate-suggested-inputs -- --skip-errors
```

**How it works:**
- Uses Claude Sonnet 4 to analyze package content
- Generates 3-5 realistic, specific inputs per package
- Covers different categories and difficulty levels
- Includes rate limiting (1.2s between requests)
- Saves directly to database

**Expected runtime**: ~2-3 minutes for 100 packages

---

### Featured Results

#### What are Featured Results?

Author-curated playground test results that showcase your package at its best. Featured results appear prominently at the top of package pages with a star icon.

#### Features

- **Author Control**: Only package authors can feature results
- **Custom Descriptions**: Add context explaining why it's exceptional
- **Display Ordering**: Control which results appear first
- **Public Only**: Only publicly shared results can be featured
- **Star Badges**: Visual indicators to highlight featured content

#### Featuring a Result

**Via API**:
```bash
# Feature a result
curl -X PATCH https://registry.prpm.dev/api/v1/playground/sessions/SESSION_ID/feature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_featured": true,
    "feature_description": "Perfect example of complex refactoring with comprehensive explanations",
    "feature_display_order": 0
  }'

# Unfeature a result
curl -X PATCH https://registry.prpm.dev/api/v1/playground/sessions/SESSION_ID/feature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{"is_featured": false}'
```

#### Workflow

1. Users test your package in playground
2. They share exceptional results (get public share link)
3. You browse community shared results for your packages
4. Feature the best ones with descriptive context
5. Featured results appear at top of package page

#### Best Practices

- Feature 3-5 results maximum (quality > quantity)
- Write clear descriptions explaining what makes each special
- Show diversity (different use cases, difficulty levels)
- Keep results current (update as package evolves)
- Feature results that highlight key capabilities

---

## Phase 2: Analytics Dashboard

**Status**: ✅ Complete
**Delivered**: November 2025

### Overview

Comprehensive analytics dashboard providing insights into playground usage, suggested input performance, and user engagement.

### Key Metrics

#### High-Level Dashboard

- **Total Playground Sessions**: All-time sessions across your packages
- **Unique Users**: Number of different users who tested
- **Credits Spent**: Total credits consumed in testing
- **Sessions Last 30 Days**: Recent activity trend
- **Suggested Inputs**: Total created vs currently active
- **Shared Results**: Number of publicly shared sessions
- **Featured Results**: Number of curated examples
- **Share Views**: Total views on shared results
- **Top Package**: Your most-tested package

#### Per-Package Metrics

- Total sessions for this package
- Unique users who tested
- Average credits per session
- Sessions in last 7/30 days
- Active suggested inputs count
- Featured results count
- Shared sessions count
- Total share views

#### Suggested Input Performance

For each suggested input, track:
- **Total Clicks**: How many "Try This" clicks
- **Completions**: How many actually ran the test
- **Conversion Rate**: Clicks → Completions (%)
- **Unique Users**: Number of different users who clicked
- **Recent Activity**: Clicks in last 7/30 days
- **Last Clicked**: Most recent engagement timestamp

#### Conversion Rate Indicators

Color-coded for quick insights:
- 🟢 **Green** (70%+): Excellent conversion
- 🟡 **Yellow** (40-70%): Good conversion
- 🔴 **Red** (<40%): Needs improvement

### Time-Series Data

Visual charts showing daily trends (30-90 days):
- Sessions per day
- Unique users per day
- Credits spent per day
- Shared results per day

### Analytics API Endpoints

```bash
# Get author summary
GET /api/v1/analytics/author/summary

# Get package details
GET /api/v1/analytics/package/:packageId

# Get suggested inputs performance
GET /api/v1/analytics/suggested-inputs/package/:packageId

# Get time-series (default 30 days, max 90)
GET /api/v1/analytics/time-series/playground/:packageId?days=30

# Get input-specific time-series
GET /api/v1/analytics/time-series/suggested-inputs/:inputId?days=30

# Manually refresh analytics
POST /api/v1/analytics/refresh
```

### Analytics Refresh

Analytics are powered by materialized views for performance:

**Automatic**: Materialized views refresh hourly (via cron job)

**Manual**: Click "Refresh Data" button in dashboard or call API:
```bash
curl -X POST https://registry.prpm.dev/api/v1/analytics/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Analytics to Improve

**High Conversion Rates** (70%+):
- These inputs work well - create similar ones
- Consider featuring test results from these inputs
- Use as templates for other packages

**Low Conversion Rates** (<40%):
- Review input clarity and specificity
- Check if estimated credits are accurate
- Consider adjusting difficulty level
- Add more context in description

**Declining Trends**:
- Package may need updates
- Suggested inputs becoming outdated
- Competition from newer packages
- Consider refreshing examples

**Growing Engagement**:
- Identify what's working
- Double down on successful patterns
- Create more inputs in popular categories
- Share success stories

---

## Future Phases

See `PLAYGROUND_ROADMAP.md` for complete roadmap.

### Phase 3: Advanced Analytics & Exports
**Priority**: High | **Effort**: 3-5 days

- Custom date ranges
- Filter by model, category, difficulty
- CSV export functionality
- Comparative analytics (package vs package)
- Enhanced visualizations (line charts, funnels, heatmaps)
- Scheduled email reports

### Phase 4: A/B Testing
**Priority**: Medium | **Effort**: 5-7 days

- Create multiple variants of suggested inputs
- Split traffic between variants
- Track performance separately
- Statistical significance testing
- Automatic winner detection
- Experiment history and learnings

### Phase 5: Test Suites & Regression Testing
**Priority**: High | **Effort**: 7-10 days

- Group inputs into test suites
- Define pass/fail criteria
- Automated execution on schedule
- Regression detection
- CI/CD integration
- Quality score badges

### Phase 6-10

Lower priority phases covering:
- Community Challenges & Gamification
- Interactive Tutorials & Onboarding
- Advanced Prompt Engineering Insights
- Collaboration & Sharing
- Real-Time & Live Features

---

## Database Schema

### Tables

#### `suggested_test_inputs`
```sql
CREATE TABLE suggested_test_inputs (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES packages(id),
  author_id UUID REFERENCES users(id),

  title VARCHAR(100) NOT NULL,
  description TEXT,
  suggested_input TEXT NOT NULL,

  category VARCHAR(50),
  difficulty VARCHAR(20) DEFAULT 'beginner',
  estimated_credits INTEGER DEFAULT 1,
  recommended_model VARCHAR(50),

  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `suggested_input_usage`
```sql
CREATE TABLE suggested_input_usage (
  id UUID PRIMARY KEY,
  suggested_input_id UUID REFERENCES suggested_test_inputs(id),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES playground_sessions(id),

  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_test BOOLEAN DEFAULT FALSE,
  ip_hash VARCHAR(64) -- SHA-256 for privacy
);
```

#### `playground_sessions` (added columns)
```sql
ALTER TABLE playground_sessions
  ADD COLUMN is_featured_by_author BOOLEAN DEFAULT FALSE,
  ADD COLUMN featured_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN featured_by_user_id UUID REFERENCES users(id),
  ADD COLUMN feature_description TEXT,
  ADD COLUMN feature_display_order INTEGER DEFAULT 0;
```

### Materialized Views

#### `suggested_input_analytics`
Pre-aggregated metrics for each suggested input:
- Total clicks and completions
- Unique users
- Conversion rate (clicks → completions)
- Recent activity (7/30 days)
- Last clicked timestamp

#### `package_playground_analytics`
Package-level aggregations:
- Total sessions, public sessions, featured sessions
- Unique users
- Credits and tokens consumed
- Recent activity
- Suggested inputs count
- Sharing metrics

#### `author_dashboard_summary`
High-level author statistics:
- Total packages
- Overall playground sessions
- Total unique users
- Credits spent
- Suggested inputs count
- Engagement metrics
- Top performing package

### Time-Series Views

#### `playground_usage_time_series`
Daily usage data for last 90 days:
- Sessions per day
- Unique users per day
- Credits spent
- Shares created

#### `suggested_input_usage_time_series`
Daily click-through data:
- Clicks per day
- Completions per day
- Unique users per day

---

## API Reference

### Suggested Test Inputs

#### List Suggested Inputs (Public)
```
GET /api/v1/suggested-inputs/package/:packageId
Query: ?category=X&difficulty=Y
```

Returns all active suggested inputs for a package with optional filtering.

#### Create Suggested Input (Author Only)
```
POST /api/v1/suggested-inputs
Body: {
  package_id, title, description, suggested_input,
  category, difficulty, estimated_credits,
  recommended_model, display_order
}
```

#### Update Suggested Input (Author Only)
```
PATCH /api/v1/suggested-inputs/:id
Body: { title?, description?, ... }
```

#### Deactivate Suggested Input (Author Only)
```
DELETE /api/v1/suggested-inputs/:id
```

Soft delete - sets `is_active = FALSE`.

#### Record Usage
```
POST /api/v1/suggested-inputs/record-usage
Body: { suggested_input_id, user_id? }
```

Tracks when user clicks "Try This".

#### Mark Test Complete
```
POST /api/v1/suggested-inputs/mark-complete
Body: { usage_id, session_id }
```

Links suggested input to completed playground session.

#### Get Author's Inputs (Author Only)
```
GET /api/v1/suggested-inputs/author/:authorId
```

Returns all inputs with usage statistics.

### Featured Results

#### Feature Session (Author Only)
```
PATCH /api/v1/playground/sessions/:sessionId/feature
Body: {
  is_featured: boolean,
  feature_description?: string,
  feature_display_order?: number
}
```

#### Get Featured Results (Public)
```
GET /api/v1/playground/packages/:packageId/featured
```

Returns featured results ordered by display order and date.

### Analytics

#### Get Author Summary (Author Only)
```
GET /api/v1/analytics/author/summary
```

Returns high-level dashboard statistics.

#### Get Package Analytics (Author Only)
```
GET /api/v1/analytics/package/:packageId
```

Returns detailed package metrics.

#### Get Suggested Inputs Performance (Author Only)
```
GET /api/v1/analytics/suggested-inputs/package/:packageId
```

Returns performance table with conversion rates.

#### Get Time-Series Data (Author Only)
```
GET /api/v1/analytics/time-series/playground/:packageId?days=30
GET /api/v1/analytics/time-series/suggested-inputs/:inputId?days=30
```

Returns daily usage data (max 90 days).

#### Refresh Analytics (Author Only)
```
POST /api/v1/analytics/refresh
```

Manually refresh materialized views.

---

## CLI Tools

### Generate Suggested Inputs

```bash
cd packages/registry

# Test with limited packages
npm run generate-suggested-inputs -- --limit 10

# Run for all packages
npm run generate-suggested-inputs

# Force regenerate existing
npm run generate-suggested-inputs -- --force

# Continue on errors
npm run generate-suggested-inputs -- --skip-errors
```

### Run Migrations

```bash
cd packages/registry
npm run build
npm run migrate
```

This will run migrations 031 and 032, creating all necessary tables and views.

---

## Best Practices

### For Suggested Inputs

1. **Be Specific**: Include actual code, text, or detailed scenarios
2. **Show Variety**: Cover different use cases and difficulty levels
3. **Start Simple**: Put beginner examples first (low display_order)
4. **Be Realistic**: Use inputs that represent real user needs
5. **Provide Context**: Use descriptions to explain what each demonstrates
6. **Update Regularly**: Refresh based on analytics and user feedback
7. **Test Yourself**: Try each input before publishing
8. **Estimate Accurately**: Set realistic credit estimates

### For Featured Results

1. **Quality Over Quantity**: Feature 3-5 maximum
2. **Add Context**: Write clear descriptions
3. **Show Diversity**: Different use cases and complexity
4. **Keep Current**: Update as package evolves
5. **Highlight Strengths**: Feature results showing key capabilities

### For Analytics

1. **Review Weekly**: Check dashboard regularly
2. **Track Trends**: Monitor conversion rates over time
3. **Act on Data**: Improve low-performing inputs
4. **Experiment**: Try different phrasings and approaches
5. **Document Learnings**: Keep notes on what works

---

## Metrics & Success Criteria

### Phase 1 & 2 Success Metrics

**Adoption**:
- 50%+ of active authors create suggested inputs
- Average 3-5 inputs per package

**Usage**:
- 30%+ overall conversion rate (clicks → completions)
- 2x increase in playground sessions for packages with inputs

**Engagement**:
- Authors check analytics dashboard weekly
- Featured results get 3x more views than non-featured

**Quality**:
- Inputs with descriptions have 20% higher conversion
- Beginner inputs have highest completion rates

### Monitoring & Alerts

**Track**:
- Suggested inputs creation rate
- Conversion rate trends
- Analytics dashboard usage
- Featured results performance
- API endpoint usage

**Alert On**:
- Sudden drop in conversion rates (>20% decline)
- Analytics refresh failures
- Spike in low-quality inputs (spam detection)
- API errors or timeouts

---

## Support & Feedback

### Getting Help

- **Documentation**: https://docs.prpm.dev
- **GitHub Issues**: https://github.com/pr-pm/prpm/issues
- **Discord**: https://discord.gg/prpm
- **Email**: team@prpm.dev

### Feature Requests

Submit feature requests via:
- GitHub Issues with `enhancement` label
- Discord #feature-requests channel
- Email with subject "Feature Request: ..."

### Reporting Bugs

Include:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs
- Package ID (if relevant)
- Browser/environment details

---

## Appendix

### Database Functions

```sql
-- Refresh all analytics views
SELECT refresh_playground_analytics();

-- Get author analytics
SELECT * FROM get_author_analytics('author-uuid');

-- Get package analytics
SELECT * FROM get_package_analytics('package-uuid');

-- Record suggested input usage
SELECT increment_suggested_input_usage(
  'input-uuid',
  'user-uuid',
  'ip-hash'
);

-- Mark test complete
SELECT mark_suggested_input_test_complete(
  'usage-uuid',
  'session-uuid'
);
```

### Migration Numbers

- **031**: Suggested inputs + Featured results tables
- **032**: Analytics materialized views and functions

### Environment Variables

No new environment variables required. Uses existing:
- `ANTHROPIC_API_KEY` - For AI generation script
- `DATABASE_URL` - For database operations
- `REDIS_URL` - For caching

---

*Last Updated: 2025-11-04*
*Version: 2.0*
*Phases Complete: 1-2 of 10*
