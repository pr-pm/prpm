# 🔥 Karen Implementation Summary

## Overview

Karen is a brutally honest, AI-powered repository reviewer that generates viral "Karen Scores" (0-100) with market-aware assessments. Built for maximum viral potential to popularize PRPM.

## What Was Built

### 1. **Karen GitHub Action** (`packages/karen-action/`)

Complete TypeScript GitHub Action that:
- ✅ Scans entire repositories automatically
- ✅ Analyzes code across 5 dimensions (Bullshit Factor, Actually Works, Code Quality, Completion Honesty, Practical Value)
- ✅ Generates Karen Score (0-100) with grades and emojis
- ✅ Creates `.karen/` directory with score.json, review.md, and badges
- ✅ Posts automated PR comments with cynical reviews
- ✅ Generates shareable SVG badges
- ✅ Tracks historical reviews
- ✅ Configurable via `.karen/config.yml`

**Built on Anthropic Claude** for AI-powered analysis.

**Files Created:**
- `action.yml` - GitHub Action definition
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `src/index.ts` - Main entry point
- `src/karen-config.ts` - Scoring system & types
- `src/karen-prompt.ts` - AI prompts (market-aware)
- `src/karen-reviewer.ts` - Claude integration
- `src/repo-analyzer.ts` - Repository scanner
- `src/badge-generator.ts` - SVG badge creation
- `src/review-formatter.ts` - Markdown generation with hot take links
- `dist/index.js` - Compiled (2.6MB)
- `README.md` - Full documentation
- `examples/` - Example workflows

### 2. **Karen as Claude Skill** (`packages/karen-skill.md`)

Claude Code skill that enables:
- Interactive repository reviews from within Claude
- Market research using WebSearch
- Full `.karen/` directory generation
- Shareable hot takes and social snippets

**Tools Used:** Read, Glob, Grep, WebSearch, WebFetch

### 3. **Karen as Cursor Rule** (`.cursor/rules/karen-repo-reviewer.mdc`)

Cursor IDE rule that:
- Activates on user request for repository review
- Provides conditional context-aware reviews
- Generates Karen Scores in Cursor
- Creates shareable `.karen/` outputs

**Format:** `.mdc` with YAML frontmatter (new Cursor format)

### 4. **Enhanced Karen Agent** (`packages/karen-agent-enhanced.md`)

Market-aware Claude agent that:
- Includes WebSearch for competitive analysis
- Researches top 3-5 competitors before scoring
- Provides market gap assessment
- Recommends unique angles or pivots
- Generates viral-ready .karen/ packages

**Enhanced Features:**
- Competitor analysis
- Market saturation assessment
- "Just use X instead" recommendations
- Unique value proposition identification

### 5. **Karen Package Registry** (`karen-packages.json`)

5 packages ready for PRPM registry:
1. `karen-action` - GitHub Action
2. `karen-skill` - Claude Skill
3. `karen-cursor-rule` - Cursor Rule
4. `karen-agent` - Enhanced Claude Agent
5. `karen-collection` - Complete bundle

## Karen Scoring System

### 5 Dimensions (0-20 each, total 0-100)

1. **🎭 Bullshit Factor** (higher = better)
   - Penalizes over-engineering
   - Rewards appropriate simplicity
   - Flags enterprise patterns for simple problems

2. **⚙️ Actually Works** (0-20)
   - Verifies claimed functionality
   - Identifies mocks vs real features
   - Checks end-to-end functionality

3. **💎 Code Quality Reality** (0-20)
   - Maintainability (not theoretical best practices)
   - Error handling robustness
   - Developer experience

4. **✅ Completion Honesty** (0-20)
   - TODO count vs finished features
   - README accuracy
   - Feature completeness

5. **🎯 Practical Value** (0-20) - **Market Research Required**
   - Competitive landscape analysis
   - Market gap assessment
   - Real need vs resume-driven development
   - Uses WebSearch to research competitors

### Grade Scale

| Score | Grade | Emoji |
|-------|-------|-------|
| 90-100 | Surprisingly legit | 🏆 |
| 70-89 | Actually decent | ✅ |
| 50-69 | Meh, it works I guess | 😐 |
| 30-49 | Needs intervention | 🚨 |
| 0-29 | Delete this and start over | 💀 |

## Market Awareness Feature

**Before scoring Practical Value, Karen MUST:**

1. Use WebSearch to research competitors
2. Find top 3-5 existing solutions
3. Check GitHub stars / npm downloads / market adoption
4. Assess market gaps vs saturation
5. Provide recommendations:
   - Unique angle to pursue
   - OR "just use X instead"

**Included in review:**
```
Market Research:
- Competitor 1: [name] - [stars] - [analysis]
- Competitor 2: [name] - [stars] - [analysis]
- Market Gap: [Yes/No - reasoning]
- Recommendation: [unique angle or pivot]
```

## `.karen/` Directory Structure

When Karen reviews a repository, it creates:

```
.karen/
├── config.yml              # User configuration (optional)
├── score.json              # Current score + breakdown + market data
├── review.md               # Full hot take with file:line refs
├── share.md                # Viral social snippets
├── history/                # Historical reviews
│   └── 2025-10-18-12-30.md
└── badges/                 # Generated badges
    └── score-badge.svg
```

### score.json Format

```json
{
  "total": 67,
  "grade": "Meh, it works I guess",
  "emoji": "😐",
  "breakdown": {
    "bullshitFactor": 14,
    "actuallyWorks": 16,
    "codeQualityReality": 13,
    "completionHonesty": 12,
    "practicalValue": 12
  },
  "timestamp": "2025-10-18T20:00:00Z",
  "marketResearch": {
    "competitors": ["tool1", "tool2", "tool3"],
    "marketGap": "Crowded space, needs unique angle",
    "recommendation": "Focus on X or contribute to Y"
  },
  "hotTakeUrl": ".karen/review.md"
}
```

## Viral Marketing Elements

### 1. **Shareable Badges**

```markdown
![Karen Score](.karen/badges/score-badge.svg)
```

Dynamic SVG with emoji and score color-coded.

### 2. **PR Comments**

Karen automatically comments on PRs:

> 🔥 **Karen has entered the chat**
>
> **Karen Score:** 😐 **67/100** - "Meh, it works I guess" (📉 -15)
>
> ### The Reality Check
> [Cynical summary]
>
> ### Issues Found
> - 🚨 Over-engineering in src/factory.ts:89
> - ⚠️ Missing tests for auth module
>
> **[Full Review](.karen/review.md)**

### 3. **Social Sharing**

Auto-generated tweets:

```
Karen just roasted my project and gave it a 67/100 😐

"Meh, it works I guess"

Full brutal review: [link]

#KarenScore #PRPM
```

### 4. **Hot Take Links**

Karen Score badges link directly to full hot take:

```markdown
📄 [Full Hot Take](.karen/review.md)
🐦 [Share on Twitter](link)
```

## Installation via PRPM

Users can install Karen in any format:

```bash
# GitHub Action
prpm install karen-action

# Claude Skill
prpm install karen-skill

# Cursor Rule
prpm install karen-cursor-rule

# Enhanced Agent
prpm install karen-agent

# Complete collection
prpm install karen-collection
```

## Usage Examples

### GitHub Action

```yaml
name: Karen Code Review

on:
  pull_request:
    branches: [main]

jobs:
  karen-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Karen Review
        uses: your-org/karen-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          post_comment: true
          generate_badge: true
          min_score: 50
```

### Claude Code

```
User: "Give me a Karen review of this repository"

Karen: [Scans repo, researches market, generates score]

🔥 Karen Review Complete!

📊 Karen Score: 67/100 - "Meh, it works I guess" 😐

[Full review with market research and prescriptions]
```

### Cursor IDE

When user asks for repository review, Karen rule activates automatically.

## Configuration

### `.karen/config.yml`

```yaml
weights:
  bullshitFactor: 0.25
  actuallyWorks: 0.25
  codeQualityReality: 0.20
  completionHonesty: 0.15
  practicalValue: 0.15

strictness: 7  # 1-10

ignore:
  - node_modules
  - dist
  - "*.lock"

focus:
  - src
  - lib

checks:
  overEngineering: true
  missingTests: true
  incompleteTodos: true
  deadCode: true
```

## Karen's Voice

**Characteristics:**
- Cynical but fair
- Brutally honest but constructive
- Like a senior dev tired of same mistakes
- Sharp wit, dry humor, zero sugarcoating
- Market-aware and data-driven
- Backs up every criticism with file:line refs

**Example Reviews:**

**High Score (85):**
> "Actually impressed. Clean architecture, solves a real problem that [competitor] doesn't address. Market shows genuine gap in [area]. A few rough edges but solid work."

**Low Score (28):**
> "Delete this and start over. Half the features are TODOs, the market has 5 better solutions already. This is textbook resume-driven development."

## Testing

To test Karen on this repo:

```bash
cd packages/karen-action
npm run build
node dist/index.js  # (with proper env vars)
```

Or create GitHub workflow and push.

## Next Steps

1. ✅ **Built** - Complete Karen system across all formats
2. ⏭️ **Test** - Run Karen on this repository
3. ⏭️ **Publish** - Add packages to PRPM registry
4. ⏭️ **Deploy** - GitHub Action to marketplace
5. ⏭️ **Market** - Launch campaign with Karen hot takes
6. ⏭️ **Leaderboard** - Build karen.prpm.dev with scores

## Files Summary

**Total Files Created: 18**

### Core Implementation (10 files)
- `packages/karen-action/` (GitHub Action - 10 TypeScript files)

### Package Variants (4 files)
- `packages/karen-skill.md` (Claude Skill)
- `.cursor/rules/karen-repo-reviewer.mdc` (Cursor Rule)
- `packages/karen-agent-enhanced.md` (Enhanced Agent)
- `scraped-darcyegb-agents.json` (Original agent - updated)

### Configuration & Docs (4 files)
- `packages/karen-action/.karen/config.yml` (Example config)
- `packages/karen-action/README.md` (Documentation)
- `packages/karen-action/examples/` (3 workflow examples)
- `karen-packages.json` (Registry entries)

## Technical Stack

- **Language:** TypeScript
- **Runtime:** Node.js 20
- **AI:** Anthropic Claude (Sonnet 4)
- **Platforms:** GitHub Actions, Claude Code, Cursor IDE
- **Build:** @vercel/ncc
- **Package Manager:** npm

---

**🔥 Karen is ready to roast repositories and go viral! 🔥**
