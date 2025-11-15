# AI Search User Guide

AI-powered semantic search for finding the perfect packages in PRPM.

## Overview

PRPM's AI Search uses advanced semantic understanding to help you find packages based on intent, not just keywords. It's **free for all users** and available both in the CLI and web interface.

## Features

### 🧠 Semantic Understanding

AI Search understands what you're looking for, not just matching keywords:

```bash
# Traditional search might miss these
prpm ai-search "help me debug faster"
# → Finds: debugging tools, error tracking, systematic debugging

prpm ai-search "make my React code better"
# → Finds: react-best-practices, code-quality, performance-optimization
```

### 💡 Smart Results

Each result includes:
- **Match percentage** - How well it matches your query (color-coded)
- **Use case description** - AI-generated explanation of when to use it
- **Best for** - What scenarios this package excels at
- **Similar packages** - Related alternatives you might consider
- **Download stats** - Popularity indicators

### 🎯 Advanced Filtering

Narrow down results by format or package type:

```bash
# Find only Cursor rules
prpm ai-search "API testing" --format cursor

# Find only skills (not agents or rules)
prpm ai-search "code review" --subtype skill

# Limit results
prpm ai-search "Python" --limit 5
```

## Usage

### CLI Usage

```bash
# Basic search
prpm ai-search "your query here"

# With filters
prpm ai-search "React performance" --format cursor --limit 10

# Package type filtering
prpm ai-search "testing" --subtype agent
```

**Available Options:**
- `--format <format>` - Filter by editor (cursor, claude, windsurf, continue, copilot, kiro)
- `--subtype <type>` - Filter by package type (skill, agent, rule, slash-command, mcp-server)
- `--limit <n>` - Number of results (1-50, default: 10)

### Web Interface

Visit [prpm.dev/search](https://prpm.dev/search) and use the search bar:

- **Autocomplete suggestions** - Popular searches appear as you type
- **Match explanations** - See why each result matched
- **Source badges** - Understand if results came from semantic, keyword, or hybrid matching
- **Keyboard navigation** - Use arrow keys and Enter to navigate

## Example Queries

### Finding Solutions

```bash
# Problem-based queries work great
prpm ai-search "my API calls are too slow"
prpm ai-search "need help organizing React components"
prpm ai-search "want to improve TypeScript types"
```

### Conceptual Searches

```bash
# Understand concepts
prpm ai-search "what is test-driven development"
prpm ai-search "REST API best practices"
prpm ai-search "microservices patterns"
```

### Technology Stack

```bash
# Find tools for your stack
prpm ai-search "Next.js with TypeScript"
prpm ai-search "Python FastAPI backend"
prpm ai-search "Vue 3 composition API"
```

### Workflow Improvements

```bash
# Improve your process
prpm ai-search "faster code reviews"
prpm ai-search "better git workflows"
prpm ai-search "automated testing"
```

## Understanding Results

### Match Percentage

- 🟢 **80-100%** - Excellent match (green)
- 🟡 **60-79%** - Good match (yellow)
- 🔵 **40-59%** - Related match (cyan)

### Result Information

```
1. @user/react-performance-optimizer 94% match

   💡 Optimizes React applications by analyzing render patterns and
       suggesting performance improvements

   ✨ Best for: Large React apps with performance issues

   📦 cursor rule | 📥 5.2k downloads

   🔗 Similar to: react-profiler, performance-analyzer
```

- **Package name** - Full package identifier
- **Match score** - How well it matches your query
- **Use case** - AI-generated description
- **Best for** - Ideal scenarios
- **Type & downloads** - Package metadata
- **Similar packages** - Related alternatives

### Source Badges (Web Only)

- **Hybrid** - Matched via semantic + keyword + quality scoring
- **Vector** - Matched via AI semantic understanding
- **Keyword** - Matched via traditional full-text search

## Tips for Better Results

### Be Descriptive

❌ Bad: `prpm ai-search "testing"`
✅ Good: `prpm ai-search "integration testing for REST APIs"`

### Use Natural Language

❌ Keywords: `prpm ai-search "react component state management hooks"`
✅ Natural: `prpm ai-search "help me manage state in React components"`

### Describe Your Goal

❌ Technology only: `prpm ai-search "Python"`
✅ Goal-oriented: `prpm ai-search "Python web scraping with async support"`

### Try Different Phrasings

If you don't find what you need, rephrase:

```bash
# Try 1
prpm ai-search "debug JavaScript errors"

# Try 2
prpm ai-search "find bugs in JS code faster"

# Try 3
prpm ai-search "JavaScript error tracking tools"
```

## How It Works

### Hybrid Ranking

AI Search combines multiple signals:

1. **Semantic similarity** (40%) - AI understanding of meaning
2. **Quality score** (30%) - Package quality metrics
3. **Popularity** (20%) - Download count and usage
4. **Keyword boost** (10%) - Exact keyword matches

### Query Enhancement

Your query is automatically enhanced with:
- **Synonyms** - Related terms (e.g., "fast" → "performance", "quick", "efficient")
- **Concepts** - Extracted technical concepts
- **Format suggestions** - Recommended editor formats for your query

### Privacy & Rate Limits

- **No authentication required** - Search anonymously
- **Generous limits** - 300 searches per 15 minutes
- **No tracking** - Queries are not stored or associated with you

## Comparison with Regular Search

| Feature | AI Search | Regular Search |
|---------|-----------|----------------|
| **Understanding** | Semantic meaning | Keyword matching |
| **Natural language** | ✅ Excellent | ⚠️ Limited |
| **Synonyms** | ✅ Auto-detected | ❌ No |
| **Use case info** | ✅ AI-generated | ❌ No |
| **Match scoring** | ✅ Percentage | ❌ No |
| **Similar packages** | ✅ Suggested | ❌ No |
| **Rate limit** | 300/15min | Unlimited |
| **Speed** | ~50-200ms | ~10-30ms |

**When to use each:**

- **AI Search** - When exploring, learning, or solving problems
- **Regular Search** - When you know the exact package name

## Web Features

The web interface at [prpm.dev/search](https://prpm.dev/search) includes:

### Query Autocomplete

Type to see popular searches:
- Based on last 30 days of searches
- Keyboard navigation (↑↓ arrows)
- Press Enter to select

### Match Explanations

Expanded cards show:
- Why this package matched your query
- Full description
- Author information
- Installation command

### Keyboard Shortcuts

- `↑↓` - Navigate suggestions/results
- `Enter` - Select suggestion or view package
- `Esc` - Close autocomplete

## Frequently Asked Questions

### Is AI Search free?

Yes! AI Search is completely free for all users. No login required.

### How many searches can I do?

You can perform 300 searches every 15 minutes. That's about 1 search every 3 seconds.

### Do I need to be logged in?

No. AI Search works anonymously without authentication.

### Why use AI Search vs regular search?

Use AI Search when:
- You're exploring and don't know exact package names
- You want to understand what packages do
- You're solving a problem and need suggestions
- You want to learn about related technologies

Use regular search when:
- You know the exact package name
- You're filtering by specific tags/categories
- You want faster results

### Can I use AI Search programmatically?

Yes! The API endpoint is public:

```bash
curl -X POST https://registry.prpm.dev/api/v1/ai-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "React performance optimization",
    "limit": 10
  }'
```

### What AI models power the search?

- **Embeddings** - OpenAI `text-embedding-3-small`
- **Query enhancement** - OpenAI GPT models
- **Vector search** - PostgreSQL pgvector

### Is my search history saved?

No. Search queries are processed in real-time and not stored or associated with your account.

## Troubleshooting

### No results found

Try:
1. Broaden your query
2. Use more general terms
3. Check spelling
4. Try synonyms

### Results seem irrelevant

Try:
1. Be more specific
2. Add context to your query
3. Use filters (--format, --subtype)
4. Rephrase using different words

### Rate limit error

If you hit the 300/15min limit:
1. Wait a few minutes
2. The limit resets on a rolling window
3. Consider using regular search for some queries

### Slow response

AI Search typically responds in 50-200ms. If slower:
1. Check your internet connection
2. Try again in a moment
3. Use regular search as fallback

## See Also

- [CLI Reference](./CLI.md#prpm-ai-search) - Command-line usage
- [Search Documentation](./SEARCHING_COLLECTIONS.md) - Regular search features
- [Web Interface](https://prpm.dev/search) - Browser-based search
- [API Reference](../packages/registry/README.md) - Programmatic access

## Feedback

Found a bug or have suggestions?

- [Open an issue](https://github.com/pr-pm/prpm/issues)
- [Discussions](https://github.com/pr-pm/prpm/discussions)
- Email: team@prpm.dev

---

**Last updated:** January 2025
