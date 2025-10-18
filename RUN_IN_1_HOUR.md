# Run Cursor Scraper in 1 Hour

**Current Time**: 2025-10-18 06:30 UTC
**Rate Limit Resets**: 2025-10-18 07:15 UTC
**Run After**: 2025-10-18 07:20 UTC (safe margin)

---

## Quick Command

In about 1 hour (after 07:20 UTC), run:

```bash
./scripts/run-cursor-scraper.sh
```

This will:
1. Check if rate limit has reset
2. Run the cursor rules scraper
3. Scrape ~150-200 cursor rules from 159 identified repositories
4. Save to `scripts/scraped/cursor-rules.json`
5. Show summary statistics

---

## Alternative: Use GitHub Token (Recommended)

For immediate scraping without waiting:

1. **Get GitHub token**: https://github.com/settings/tokens
   - Scopes needed: `public_repo` (read-only)
   - Rate limit: 5,000 requests/hour (vs 60/hour)

2. **Set token and run**:
   ```bash
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
   ./scripts/run-cursor-scraper.sh
   ```

---

## What Gets Scraped

The cursor rules scraper will fetch from **159 unique repositories**, including:

- `x1xhlol/system-prompts-and-models-of-ai-tools` (91,718 ⭐)
- Plus 158 other popular cursor rules repositories
- Sorted by stars (highest quality first)

**Expected output**:
- 150-200 cursor rules packages
- Complete with content, descriptions, authors
- Ready for registry upload

---

## After Scraping Completes

You'll have a total of **~200-250 packages**:
- 34 Claude agents (already scraped)
- 6 Subagents (already scraped)
- 150-200 Cursor rules (from this run)

### Next Steps:
1. Review scraped data: `cat scripts/scraped/cursor-rules.json | jq 'length'`
2. Test upload: `cd scripts/seed && tsx upload.ts`
3. Deploy to local registry: `cd registry && docker-compose up -d`
4. Test E2E: `bash scripts/test-e2e.sh`

---

## Timing Options

| Time (UTC) | Status | Action |
|------------|--------|--------|
| 06:30 | Current | Rate limited (0/60) |
| 07:15 | Reset | Rate limit resets to 60/60 |
| 07:20 | Safe | Run scraper (5 min buffer) |
| 07:30 | Latest | Should be complete by now |

---

## If Rate Limit Hits Again

With 60/hour limit, the scraper may not complete all 159 repos. Options:

1. **Get GitHub token** (best option - 5,000/hour)
2. **Wait and run again** (every hour until complete)
3. **Accept partial data** (whatever gets scraped is still valuable)

---

## Monitoring Progress

The scraper shows real-time progress:
```
🕷️  Starting cursor rules scraper...
🔍 Searching GitHub for cursor rules repositories...
Found 159 unique repositories
📦 Processing repo-name (1234 ⭐)
   ✓ Extracted: package-name
```

Watch for:
- ✓ Success markers
- ✗ Failure markers (rate limit, errors)
- Final package count
- File size

---

## What to Do Now

Set a reminder for **07:20 UTC** (1 hour from now), then run:

```bash
./scripts/run-cursor-scraper.sh
```

Or get a GitHub token and run immediately:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
./scripts/run-cursor-scraper.sh
```

---

**Status**: Waiting for rate limit reset
**Last Update**: 2025-10-18 06:30 UTC
