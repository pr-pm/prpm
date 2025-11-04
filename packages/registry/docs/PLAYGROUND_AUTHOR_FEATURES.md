# Playground Author Features

This document describes the author-focused features for PRPM Playground that help package authors showcase their packages and guide users to successful testing experiences.

## Phase 1: Suggested Test Inputs + Featured Results

### Overview

Phase 1 provides authors with two powerful tools:

1. **Suggested Test Inputs**: Curate example prompts that guide users to try your package with realistic, high-quality inputs
2. **Featured Results**: Highlight your best playground test results to showcase what your package can do

### Suggested Test Inputs

#### What are Suggested Test Inputs?

Suggested Test Inputs are author-curated example prompts that appear on your package page. They help users:
- Understand how to use your package effectively
- Get started quickly without guessing what to try
- See different use cases and difficulty levels
- Experience your package at its best

#### Features

- **Categorization**: Organize inputs by category (code-review, documentation, bug-fix, feature, refactoring, testing)
- **Difficulty Levels**: Mark inputs as beginner, intermediate, or advanced
- **Credit Estimation**: Show users approximately how many credits each test will consume
- **Model Recommendations**: Suggest which AI model works best for each input
- **Usage Tracking**: See how many people try each suggested input
- **Display Ordering**: Control which inputs appear first

#### Creating Suggested Inputs

##### Via Web Dashboard

1. Navigate to your dashboard
2. Look for the "Suggested Test Inputs" section
3. Click "Create Suggested Input"
4. Fill in the form:
   - **Package**: Select which package this input is for
   - **Title**: Short, descriptive title (e.g., "Review a React component")
   - **Description**: Optional explanation of what this demonstrates
   - **Suggested Input**: The actual text users will test with
   - **Category**: Choose the most relevant category
   - **Difficulty**: Beginner, Intermediate, or Advanced
   - **Estimated Credits**: Rough estimate (1-10)
   - **Recommended Model**: Optional model preference
   - **Display Order**: Lower numbers show first

##### Via API

```bash
curl -X POST https://registry.prpm.dev/api/v1/suggested-inputs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": "package-uuid",
    "title": "Review a React component",
    "description": "Example of reviewing a functional React component for best practices",
    "suggested_input": "Review this React component:\n\nfunction UserProfile({ user }) {\n  return (\n    <div>\n      <h1>{user.name}</h1>\n      <p>{user.email}</p>\n    </div>\n  );\n}",
    "category": "code-review",
    "difficulty": "beginner",
    "estimated_credits": 2,
    "recommended_model": "sonnet"
  }'
```

#### Bulk Generation with AI

For existing packages, we provide a script that uses AI to automatically generate suggested inputs:

```bash
# Navigate to registry package
cd packages/registry

# Generate for all packages
npm run generate-suggested-inputs

# Test with limited packages first
npm run generate-suggested-inputs -- --limit 10

# Regenerate even if inputs already exist
npm run generate-suggested-inputs -- --force

# Continue on errors
npm run generate-suggested-inputs -- --skip-errors
```

**How it works:**
1. Fetches all active packages with content
2. For each package, uses Claude Sonnet to analyze the package and generate 3-5 relevant test inputs
3. AI considers the package's format, subtype, category, and content
4. Generates realistic, specific inputs across different difficulty levels
5. Saves inputs to the database with appropriate metadata

**Rate Limiting:**
- Script includes 1.2-second delays between API calls
- Stays within Claude API rate limits (50 requests/minute)
- For 100 packages, expect ~2-3 minutes runtime

#### Best Practices

1. **Be Specific**: Don't use generic inputs like "test this". Include actual code, text, or specific scenarios
2. **Show Variety**: Cover different use cases and difficulty levels
3. **Start Simple**: Put beginner-friendly examples first (lower display_order)
4. **Be Realistic**: Use inputs that represent actual user needs
5. **Update Regularly**: Refresh inputs based on usage statistics and user feedback

#### Example: Good vs. Bad Inputs

❌ **Bad** (too generic):
```
Title: "Test my code"
Input: "Can you review this?"
```

✅ **Good** (specific and realistic):
```
Title: "Review a React component for accessibility"
Input: "Review this React button component for WCAG 2.1 AA compliance:

function Button({ onClick, children }) {
  return <div onClick={onClick}>{children}</div>;
}"
```

### Featured Results

#### What are Featured Results?

Featured Results let you highlight the best playground test results for your package. They appear at the top of your package page with a star icon and "Featured" badge.

#### Features

- **Author Control**: Only package authors can feature results
- **Description**: Add context explaining why this result is exemplary
- **Display Order**: Control the order of featured results
- **Public Only**: Only publicly shared results can be featured

#### Featuring a Result

##### Via API

```bash
# Feature a result
curl -X PATCH https://registry.prpm.dev/api/v1/playground/sessions/SESSION_ID/feature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_featured": true,
    "feature_description": "Perfect example of how this package handles complex refactoring scenarios",
    "feature_display_order": 0
  }'

# Unfeature a result
curl -X PATCH https://registry.prpm.dev/api/v1/playground/sessions/SESSION_ID/feature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_featured": false
  }'
```

##### Process

1. Users test your package in the playground
2. They share exceptional results (get a share link)
3. You browse shared results for your package
4. Feature the best ones with optional description
5. Featured results appear at the top of your package page

#### Best Practices

1. **Quality Over Quantity**: Only feature truly exceptional results (3-5 max)
2. **Add Context**: Use descriptions to explain what makes the result special
3. **Keep Fresh**: Update featured results as your package evolves
4. **Show Diversity**: Feature results showing different use cases

## Database Schema

### suggested_test_inputs

```sql
CREATE TABLE suggested_test_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  title VARCHAR(100) NOT NULL,
  description TEXT,
  suggested_input TEXT NOT NULL,

  category VARCHAR(50), -- "code-review", "documentation", etc.
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

### suggested_input_usage

```sql
CREATE TABLE suggested_input_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggested_input_id UUID REFERENCES suggested_test_inputs(id),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES playground_sessions(id),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_test BOOLEAN DEFAULT FALSE,
  ip_hash VARCHAR(64) -- SHA-256 hashed IP for privacy
);
```

### playground_sessions (new columns)

```sql
ALTER TABLE playground_sessions
  ADD COLUMN is_featured_by_author BOOLEAN DEFAULT FALSE,
  ADD COLUMN featured_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN featured_by_user_id UUID REFERENCES users(id),
  ADD COLUMN feature_description TEXT,
  ADD COLUMN feature_display_order INTEGER DEFAULT 0;
```

## API Endpoints

### Suggested Test Inputs

#### Get Suggested Inputs for Package (Public)
```
GET /api/v1/suggested-inputs/package/:packageId?category=X&difficulty=Y
```

#### Create Suggested Input (Author Only)
```
POST /api/v1/suggested-inputs
Body: {
  package_id, title, description, suggested_input,
  category, difficulty, estimated_credits, recommended_model, display_order
}
```

#### Update Suggested Input (Author Only)
```
PATCH /api/v1/suggested-inputs/:id
Body: { title, description, ... }
```

#### Deactivate Suggested Input (Author Only)
```
DELETE /api/v1/suggested-inputs/:id
```

#### Record Usage
```
POST /api/v1/suggested-inputs/record-usage
Body: { suggested_input_id, user_id? }
```

#### Mark Test Complete
```
POST /api/v1/suggested-inputs/mark-complete
Body: { usage_id, session_id }
```

#### Get Author's Suggested Inputs (Author Only)
```
GET /api/v1/suggested-inputs/author/:authorId
```

### Featured Results

#### Feature a Playground Session (Author Only)
```
PATCH /api/v1/playground/sessions/:sessionId/feature
Body: { is_featured, feature_description?, feature_display_order? }
```

#### Get Featured Results for Package (Public)
```
GET /api/v1/playground/packages/:packageId/featured
```

## Frontend Components

### SuggestedTestInputs.tsx
Displays suggested test inputs on package pages with:
- Category and difficulty filtering
- "Try This" button that opens playground with pre-filled input
- Usage statistics
- Responsive grid layout

### FeaturedResults.tsx
Shows author-curated featured results with:
- Star icon and "Featured" badge
- Author's description
- Link to full shared result

### SuggestedInputsManager.tsx
Author dashboard for managing suggested inputs:
- Create/edit/deactivate inputs
- View usage statistics
- Filter by package

## Running the Migration

```bash
cd packages/registry
npm run build
npm run migrate
```

This will create the `suggested_test_inputs` and `suggested_input_usage` tables, and add the featured columns to `playground_sessions`.

## Metrics and Analytics

### Available Metrics

For each suggested input, track:
- **Total Clicks**: How many times users clicked "Try This"
- **Completed Tests**: How many actually ran the test in playground
- **Conversion Rate**: Clicks → Completed Tests
- **Session Links**: Which playground sessions used this input

### Viewing Your Stats

Stats are shown in:
1. Author dashboard (SuggestedInputsManager component)
2. API response from `/api/v1/suggested-inputs/author/:authorId`

## What's Next: Phase 2

Phase 2 will add comprehensive analytics:
- Visual dashboards with charts
- Conversion funnels
- Popular inputs ranking
- Time-series usage data
- Comparative analytics across packages
- Export to CSV

## Support

For questions or issues:
- GitHub Issues: https://github.com/pr-pm/prpm/issues
- Documentation: https://docs.prpm.dev
- Discord: https://discord.gg/prpm
