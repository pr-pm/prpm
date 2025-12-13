# AI Assistant Benchmark Test Plan

**Manual Testing Protocol for PRPM Benchmarks**

This document outlines the practical, manual approach to running benchmarks using real PRPM packages.

## Philosophy: Quality Over Automation

**Why manual testing:**
- Human evaluation catches nuances (explanation quality, edge case handling)
- More credible: "I personally tested each AI assistant"
- Faster to start: No automation infrastructure needed
- Better stories: Real insights vs. robotic scores
- Flexibility: Adjust methodology as you learn

**Time investment:** ~30 minutes per assistant per test = 10 hours for 20 tests × 1 assistant

## Test Selection Strategy

### Criteria for Good Benchmark Tests

1. **Clear success criteria**: Easy to judge if code works
2. **Realistic use case**: Developers actually do this
3. **Showcases PRPM packages**: Each test links to a real package
4. **Difficulty range**: Mix of easy (3/10) to hard (8/10)
5. **Category diversity**: Code gen, debugging, refactoring, etc.

### Recommended PRPM Packages to Test Against

Based on EXAMPLES.md, here are the best packages for benchmarks:

#### Tier 1: Must-Test (High visibility, clear criteria)

1. **react-patterns** (Code Generation)
   - Test: "Generate a custom hook for data fetching with loading/error states"
   - Success: Hook works, follows React best practices, has TypeScript types
   - Difficulty: 4/10

2. **nextjs-pro** (Code Generation)
   - Test: "Create a Next.js API route with rate limiting and error handling"
   - Success: Route works, handles errors, uses Next.js patterns correctly
   - Difficulty: 5/10

3. **test-driven-development** (Testing)
   - Test: "Write comprehensive tests for a user authentication service"
   - Success: Tests cover edge cases, use proper mocking, follow TDD patterns
   - Difficulty: 6/10

4. **karen-skill** (Explanation + Code Review)
   - Test: "Review this codebase and identify 3 major issues with solutions"
   - Success: Identifies real issues, provides actionable fixes, follows Karen's framework
   - Difficulty: 7/10

5. **typescript-fullstack** (Refactoring)
   - Test: "Migrate this JavaScript Express API to TypeScript with proper types"
   - Success: Full type coverage, no `any`, follows TS best practices
   - Difficulty: 6/10

#### Tier 2: Should-Test (Good variety)

6. **python-data** (Code Generation)
   - Test: "Create a pandas pipeline to clean and analyze CSV data"
   - Success: Pipeline works, handles missing data, efficient operations
   - Difficulty: 5/10

7. **backend-patterns** (Code Generation)
   - Test: "Implement a repository pattern for database access with caching"
   - Success: Clean separation of concerns, cache invalidation, type-safe
   - Difficulty: 6/10

8. **devops-complete** (Explanation)
   - Test: "Explain the difference between Docker and Kubernetes and when to use each"
   - Success: Clear explanation, practical examples, correct technical details
   - Difficulty: 4/10

#### Tier 3: Nice-to-Have (Show breadth)

9. **tailwind-helpers** (Code Generation)
   - Test: "Build a responsive navigation with mobile menu using Tailwind"
   - Success: Works on all screen sizes, accessible, clean utility usage
   - Difficulty: 4/10

10. **api-design-guides** (Code Generation)
   - Test: "Design a REST API for a blog with proper status codes and pagination"
   - Success: RESTful conventions, error handling, clear documentation
   - Difficulty: 5/10

## Manual Testing Workflow

### Setup (One-time, 30 minutes)

1. **Create test document**
```bash
# Create a Google Sheet or Notion doc with columns:
# - Test ID
# - Package
# - Prompt
# - Assistant
# - Generated Code
# - Correctness (0-100)
# - Quality (0-100)
# - Context (0-100)
# - Speed (seconds)
# - Total Score
# - Notes
```

2. **Install test assistants**
```bash
# Make sure you have:
- Cursor (latest version)
- Claude Code (latest)
- GitHub Copilot (latest)
```

3. **Prepare test prompts**
```bash
# For each package, craft a specific prompt
# Example for react-patterns:

"Using React best practices, create a custom hook called useFetch that:
- Accepts a URL string
- Returns { data, loading, error }
- Handles loading states properly
- Cleans up on unmount to prevent memory leaks
- Uses TypeScript with proper generic types
- Includes error handling for failed requests"
```

### Running a Test (5-10 minutes per test per assistant)

**For each assistant (Cursor, Claude, Copilot):**

#### Step 1: Setup (30 seconds)
```bash
# Open assistant
# Create new file (e.g., useFetch.ts)
# Start timer
```

#### Step 2: Prompt (30 seconds)
```bash
# Paste prepared prompt
# Let AI generate code
# Stop timer when code is complete
```

#### Step 3: Evaluate Correctness (2-3 minutes)
```bash
# Does it run without errors? (+50 points)
# Does it meet all requirements? (+30 points)
# Does it handle edge cases? (+20 points)

# Example scoring:
✅ Hook returns correct shape: +10
✅ Handles loading state: +10
✅ Handles error state: +10
✅ Cleanup function present: +15
✅ No infinite loops: +15
✅ TypeScript compiles: +20
✅ Generic types work: +10
⚠️ Missing AbortController: -10

Score: 90/100
```

#### Step 4: Evaluate Quality (2-3 minutes)
```bash
# TypeScript quality (+30 points)
# Best practices (+30 points)
# Code cleanliness (+20 points)
# Security/safety (+20 points)

# Example scoring:
✅ Proper TypeScript generics: +25
✅ No `any` types: +5
✅ Follows React hooks rules: +20
✅ Clean, readable code: +15
✅ Good variable names: +5
⚠️ Could use useCallback: -5
⚠️ No JSDoc comments: -5

Score: 85/100
```

#### Step 5: Evaluate Context Understanding (1-2 minutes)
```bash
# Did it understand the package's patterns? (+50 points)
# Did it follow instructions precisely? (+30 points)
# Did it add relevant context? (+20 points)

# Example:
✅ Used React patterns correctly: +40
✅ Followed all requirements: +30
✅ Added helpful comments: +10
⚠️ Didn't reference cleanup pattern: -5

Score: 90/100
```

#### Step 6: Evaluate Speed (automatic)
```bash
# Response time to score conversion:
# 0-2s: 100 points
# 2-5s: 90 points
# 5-10s: 75 points
# 10-20s: 50 points
# 20s+: 25 points

# Example: 3.2 seconds = 88 points
```

#### Step 7: Calculate Total Score
```bash
Total = (Correctness × 0.4) + (Quality × 0.3) + (Context × 0.2) + (Speed × 0.1)
Total = (90 × 0.4) + (85 × 0.3) + (90 × 0.2) + (88 × 0.1)
Total = 36 + 25.5 + 18 + 8.8
Total = 88.3/100
```

#### Step 8: Record Notes
```bash
# Key observations:
- "Cursor nailed the cleanup logic immediately"
- "Added useCallback optimization without being asked"
- "Missed AbortController for fetch cancellation"
- "Code is very clean and readable"
```

### Batch Processing Strategy

**Don't do all 20 tests at once!** Break it into batches:

**Week 1: Tier 1 Tests (5 tests × 3 assistants = 15 runs)**
- Focus on most important packages
- Get early data for blog post
- Time investment: ~5 hours

**Week 2: Tier 2 Tests (5 tests × 3 assistants = 15 runs)**
- Add more variety
- Refine scoring methodology
- Time investment: ~4 hours (faster with practice)

**Week 3: Tier 3 Tests + Refinement**
- Complete the suite
- Re-test any edge cases
- Time investment: ~3 hours

**Total time: 12 hours over 3 weeks**

## Scoring Rubric Details

### Correctness (40% weight)

**90-100**: Perfect or near-perfect
- Runs without errors
- Meets all requirements
- Handles edge cases
- Production-ready

**70-89**: Good, minor issues
- Works correctly
- Meets most requirements
- Minor edge case gaps
- Needs small fixes

**50-69**: Functional but flawed
- Core functionality works
- Missing some requirements
- Significant edge case issues
- Needs moderate refactoring

**0-49**: Broken or incomplete
- Doesn't run
- Major bugs
- Missing core requirements
- Not usable

### Quality (30% weight)

**90-100**: Exceptional quality
- Perfect TypeScript types
- Follows all best practices
- Clean, maintainable code
- No security issues

**70-89**: Good quality
- Proper types (minimal `any`)
- Follows most best practices
- Readable code
- No major issues

**50-69**: Acceptable quality
- Some type issues
- Misses some best practices
- Somewhat messy code
- Minor code smells

**0-49**: Poor quality
- Type errors or heavy `any` usage
- Ignores best practices
- Hard to read/maintain
- Security concerns

### Context Understanding (20% weight)

**90-100**: Perfect understanding
- Follows package patterns exactly
- Understands implicit requirements
- Adds relevant context
- Demonstrates deep comprehension

**70-89**: Good understanding
- Follows most patterns
- Meets explicit requirements
- Some relevant additions
- Generally correct approach

**50-69**: Partial understanding
- Misses some patterns
- Literal interpretation only
- Minimal context awareness
- Basic approach

**0-49**: Poor understanding
- Doesn't follow patterns
- Misunderstands requirements
- Ignores package context
- Wrong approach

### Speed (10% weight)

**Conversion table:**
```
Response Time → Score
0-2s         → 100
2-3s         → 95
3-4s         → 90
4-5s         → 85
5-7s         → 75
7-10s        → 65
10-15s       → 50
15-20s       → 35
20-30s       → 25
30s+         → 10
```

## Data Recording Template

### Spreadsheet Structure

```
| Test ID | Package | Category | Difficulty | Assistant | Version | Correctness | Quality | Context | Speed (s) | Speed Score | Total | Notes |
|---------|---------|----------|------------|-----------|---------|-------------|---------|---------|-----------|-------------|-------|-------|
| T001 | react-patterns | code-gen | 4 | cursor | 0.42.3 | 90 | 85 | 90 | 3.2 | 88 | 88.3 | Great cleanup logic |
| T001 | react-patterns | code-gen | 4 | claude-code | 4.5 | 95 | 92 | 88 | 4.5 | 85 | 91.3 | Added AbortController |
| T001 | react-patterns | code-gen | 4 | copilot | latest | 85 | 80 | 75 | 2.1 | 98 | 82.8 | Fast but basic |
```

### Export to Registry

After each batch, submit to PRPM registry:

```bash
# Create benchmark run
curl -X POST https://registry.prpm.ai/api/v1/benchmarks/runs \
  -H "Authorization: Bearer $PRPM_TOKEN" \
  -d '{
    "suite_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "assistant_name": "cursor",
    "assistant_version": "0.42.3"
  }'

# Submit each test result
curl -X POST https://registry.prpm.ai/api/v1/benchmarks/results \
  -H "Authorization: Bearer $PRPM_TOKEN" \
  -d '{
    "run_id": "run-123",
    "test_id": "T001",
    "correctness_score": 90,
    "quality_score": 85,
    "context_score": 90,
    "speed_score": 88,
    "response_time_ms": 3200,
    "test_passed": true,
    "generated_code": "...",
    "evaluation_notes": "Great cleanup logic, missed AbortController"
  }'

# Mark run complete
curl -X PATCH https://registry.prpm.ai/api/v1/benchmarks/runs/run-123 \
  -H "Authorization: Bearer $PRPM_TOKEN" \
  -d '{"status": "completed"}'
```

## Content Creation from Results

### Week 1: Tier 1 Results (5 tests)

**Blog post**: "We Tested 3 AI Coding Assistants on React. Here's What We Found."

**Key findings:**
- Cursor: Best at React hooks patterns (avg 87.5)
- Claude Code: Best explanations and edge cases (avg 89.2)
- Copilot: Fastest but more basic (avg 81.3)

**Tweet**: "Just tested Cursor vs Claude Code vs Copilot on React hooks. Claude Code wins on quality (89.2) but Cursor is close (87.5). Copilot is fastest but most basic. Full data: [link]"

### Week 2: Full Results (10 tests)

**Blog post**: "The Definitive AI Coding Assistant Benchmark: 10 Real-World Tests"

**Reddit post** (r/programming, r/webdev):
```markdown
I spent 15 hours testing Cursor, Claude Code, and GitHub Copilot on 10 real coding tasks.

Here's what I found:

🥇 Claude Code: 88.7 overall (best at complex tasks)
🥈 Cursor: 86.4 overall (best at React/frontend)
🥉 Copilot: 82.1 overall (fastest, good for simple tasks)

Detailed breakdown: [link]

Methodology: [link to benchmark docs]
Raw data: [link to spreadsheet]

AMA about the results!
```

### Week 3: Launch

**Press release**: "PRPM Releases First Community-Driven AI Coding Assistant Benchmark"

**Hacker News post**: "Show HN: AI Coding Assistant Benchmarks on Real Packages"

## Success Metrics

**After Week 1:**
- [ ] 5 tests completed for 3 assistants (15 data points)
- [ ] First blog post published
- [ ] 1K+ blog views
- [ ] 100+ social shares

**After Week 2:**
- [ ] 10 tests completed (30 data points)
- [ ] Leaderboard published
- [ ] 5K+ unique visitors
- [ ] First media mention

**After Week 3:**
- [ ] 20 tests completed (60 data points)
- [ ] Full benchmark launch
- [ ] 10K+ visitors
- [ ] 3+ media mentions
- [ ] 500+ backlinks

## Next Steps

1. **This week**: Pick 5 Tier 1 packages from your registry
2. **Create test prompts**: Write specific, detailed prompts for each
3. **Run first batch**: Test Cursor on all 5 (2-3 hours)
4. **Refine methodology**: Adjust scoring based on learnings
5. **Complete first round**: Test Claude Code and Copilot
6. **Publish**: Write blog post with initial findings

---

**The goal isn't perfect automation - it's authentic, high-quality data that developers trust.**
