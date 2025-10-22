# PRMP Scraping Summary

**Generated**: 2025-10-18 06:30 UTC
**Status**: Partial completion - GitHub rate limit reached

---

## ✅ Successfully Scraped

### 1. Claude Agents (34 packages)
- **File**: `claude-agents.json`
- **Sources**:
  - valllabh/claude-agents: 8 agents
  - wshobson/agents: 26 agents (partial - rate limited)
- **Categories**: Engineering, Design, Code Review, Security, DevOps, API Development, Testing
- **Top agents**:
  - analyst, architect, developer, product-manager
  - frontend-developer, backend-architect, api-documenter
  - performance-engineer, observability-engineer
  - blockchain-developer, business-analyst

### 2. Subagents.cc (6 packages)
- **File**: `subagents.json`
- **Source**: Manual curation from subagents.cc
- **Top agents**:
  - Frontend Developer (656 downloads)
  - Backend Architect (496 downloads)
  - UI Designer (489 downloads)
  - Code Reviewer (384 downloads)
  - Debugger (287 downloads)
  - UX Researcher (240 downloads)

**Total Scraped**: 40 packages (34 Claude agents + 6 Subagents)

---

## ⏸️ Partially Scraped (Rate Limited)

### 3. Cursor Rules (0 packages)
- **File**: Not created yet
- **Status**: GitHub API rate limit exceeded
- **Found**: 159 unique repositories identified
- **Top repos found**:
  - x1xhlol/system-prompts-and-models-of-ai-tools (91,718 ⭐)
  - [Additional repos not yet processed]

**Rate Limit Details**:
- Limit: 60 requests/hour (unauthenticated)
- Reset time: 2025-10-18 07:15:15 UTC (~45 minutes from now)
- With GitHub token: 5,000 requests/hour

---

## 📊 Summary Statistics

| Metric | Value |
|--------|-------|
| Total packages scraped | 40 |
| Claude agents | 34 |
| Subagents | 6 |
| Cursor rules | 0 (pending) |
| Cursor repos identified | 159 |
| Estimated total after full scrape | 200-300 packages |

---

## 🎯 Next Steps

### Option 1: Wait for Rate Limit Reset (45 minutes)
Run at 07:15 UTC:
```bash
npx tsx scripts/scraper/github-cursor-rules.ts
```

### Option 2: Use GitHub Token (Recommended)
Get token from: https://github.com/settings/tokens

Required scopes: `public_repo` (read-only)

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
npx tsx scripts/scraper/github-cursor-rules.ts
```

This will allow:
- 5,000 requests/hour (vs 60)
- Full scraping of all 159 repos
- Estimated 150-200 cursor rules packages

### Option 3: Continue with Existing Data
You have 40 high-quality packages ready to upload:
- 34 Claude agents from reputable sources
- 6 popular Subagents with download stats

This is enough to:
1. Test the upload pipeline
2. Validate package format
3. Deploy initial registry
4. Start author outreach

---

## 📁 File Locations

```
scripts/scraped/
├── claude-agents.json      (34 packages, 321KB)
├── subagents.json         (6 packages, 8.5KB)
└── cursor-rules.json      (not yet created)
```

---

## 🔍 Data Quality

### Claude Agents
- ✅ Full content extracted from GitHub
- ✅ Proper attribution (author, source URL)
- ✅ Categorized and tagged
- ✅ Markdown format preserved
- ⚠️ Some agents from wshobson/agents missed due to rate limit (~37 remaining)

### Subagents
- ✅ Manual curation (high quality)
- ✅ Download stats included
- ✅ Category information
- ✅ Full descriptions
- ℹ️ Small sample size (6 agents)

### Cursor Rules
- ⏸️ Not yet scraped
- ✅ 159 repositories identified
- ✅ Sorted by stars (high quality first)
- ⏸️ Waiting for rate limit reset or GitHub token

---

## 💡 Recommendations

1. **For immediate testing**: Use the 40 existing packages
2. **For full launch**: Get GitHub token and complete cursor rules scrape
3. **For best results**:
   - Complete wshobson/agents scraping (37 more agents)
   - Scrape all 159 cursor rules repos
   - Target: 200-300 total packages for launch

---

## 🚀 Ready to Use

The scraped data is ready for:
- Upload to registry (via seed script)
- Package validation
- Tarball generation
- Author attribution
- Claiming system setup

All packages include:
- Name, description, content
- Source URL (for claiming)
- Author information
- Tags and categories
- Package type (claude/claude-skill)

---

## ⏰ Rate Limit Status

**Current**: 0/60 requests remaining
**Resets**: 2025-10-18 07:15:15 UTC
**Next scrape**: After reset or with GitHub token

---

## 📝 Notes

- All scrapers now support running without GitHub token (with reduced rate limits)
- Data format is consistent across all sources
- Ready for immediate upload to registry
- Claiming metadata can be added during upload
- All source attributions preserved for author outreach
