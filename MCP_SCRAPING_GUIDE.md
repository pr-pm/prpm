# MCP Server Scraping Guide - Scale to 10,000 Servers

## Goal: 10,000 MCP Servers 🎯

Current: **108 servers** → Target: **10,000 servers**

## Quick Start

### 1. Get a GitHub Token (REQUIRED for 10K servers)

**Why?** Rate limits:
- ❌ Without token: 60 requests/hour (would take 167 hours for 10K servers!)
- ✅ With token: 5,000 requests/hour (takes ~2 hours for 10K servers)

**How to get token:**

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a name: `PRPM MCP Scraper`
4. Select scopes:
   - ✅ `public_repo` (read public repositories)
   - ✅ `read:org` (read organization data)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)

Example token: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Set Environment Variable

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Or add to `.env`:
```bash
echo "GITHUB_TOKEN=ghp_your_token_here" >> .env
```

### 3. Run the Scraper

```bash
node scripts/scrape-mcp-github.js
```

## What Gets Scraped

### Official Sources (7,260+ servers)
1. **TensorBlock/awesome-mcp-servers** - 7,260 servers
2. **wong2/awesome-mcp-servers** - Curated list
3. **punkpeye/awesome-mcp-servers** - Community collection
4. **MobinX/awesome-mcp-list** - Concise list
5. **habitoai/awesome-mcp-servers** - AI-focused
6. **appcypher/awesome-mcp-servers** - Comprehensive list

### GitHub Search Queries
1. `"mcp server"` - 500 results
2. `"model context protocol"` - 500 results
3. `"anthropic mcp"` - 200 results
4. Could add more: `"mcp-server"`, `"mcp integration"`, etc.

### What's Tracked

For each server:
```json
{
  "id": "@owner/repo-name",
  "display_name": "Server Name",
  "description": "What it does",
  "type": "mcp",
  "category": "database|cloud|ai|communication|...",
  "tags": ["keyword1", "keyword2"],
  "repository_url": "https://github.com/...",
  "npm_package": "@scope/package",
  "remote_server": true,      // ← NEW: Supports remote connections
  "remote_url": "ws://...",    // ← NEW: Remote connection URL
  "transport_type": "websocket", // ← NEW: stdio|sse|websocket
  "stars": 123,
  "forks": 45,
  "last_updated": "2025-10-19",
  "language": "TypeScript",
  "quality_score": 85
}
```

## Remote MCP Servers 🌐

Some MCP servers support remote connections (not just local stdio). We track:

- `remote_server`: Boolean flag
- `remote_url`: Connection URL
- `transport_type`:
  - `stdio` - Local process communication (most common)
  - `sse` - Server-Sent Events (HTTP-based)
  - `websocket` - WebSocket (real-time bidirectional)

### Filter Remote Servers

```bash
prpm search database --type mcp
# Shows both local and remote

# In the future:
prpm search database --type mcp --remote
# Shows only remote-capable servers
```

## Scaling to 10,000 Servers

### Strategy 1: Scrape All Awesome Lists (Est. 7,500 servers)

```bash
# Run the main scraper (covers 6 awesome lists)
node scripts/scrape-mcp-github.js

# This will take ~90 minutes with token
# Progress:
# - TensorBlock: 7,260 servers
# - Other lists: 500+ servers
# = ~7,500+ unique servers
```

### Strategy 2: Broader GitHub Searches (Est. 2,500 servers)

Add more search queries to `scrape-mcp-github.js`:

```javascript
// Current searches (1,200 results)
await searchGitHub('mcp server', 500);
await searchGitHub('model context protocol', 500);
await searchGitHub('anthropic mcp', 200);

// Add these for 10K total:
await searchGitHub('mcp-server', 500);
await searchGitHub('mcp integration', 300);
await searchGitHub('context protocol server', 300);
await searchGitHub('mcp npm', 200);
await searchGitHub('mcp typescript', 200);
await searchGitHub('mcp python', 200);
await searchGitHub('mcp rust', 200);
await searchGitHub('mcp go', 200);
```

### Strategy 3: NPM Package Search (Est. 1,000 servers)

Many MCP servers are published to npm:

```bash
# Search npm registry
npm search mcp server --json | jq
npm search model-context-protocol --json | jq
npm search @modelcontextprotocol --json | jq
```

Create `scrape-mcp-npm.js` to fetch from npm registry API.

### Strategy 4: Language-Specific Searches

```javascript
// TypeScript/JavaScript
await searchGitHub('language:typescript mcp server', 500);
await searchGitHub('language:javascript mcp', 500);

// Python
await searchGitHub('language:python mcp server', 500);
await searchGitHub('language:python model context protocol', 500);

// Rust
await searchGitHub('language:rust mcp', 300);

// Go
await searchGitHub('language:go mcp server', 300);
```

## Rate Limit Management

### With Token: 5,000 requests/hour

```javascript
// Built-in rate limiting in scraper:
// - Pauses every 100 repos
// - Waits 60s if rate limit hit
// - Checks remaining quota

// Monitor rate limit:
await octokit.rateLimit.get();
// Response:
// {
//   rate: {
//     limit: 5000,
//     remaining: 4823,
//     reset: 1729348800
//   }
// }
```

### Time Estimates

- **7,500 servers** (awesome lists): ~90 minutes
- **2,500 servers** (GitHub search): ~30 minutes
- **Total 10,000 servers**: ~2 hours with token

## Database Schema Updates

New migration added: `005_add_mcp_remote_field.sql`

```sql
ALTER TABLE packages ADD COLUMN remote_server BOOLEAN DEFAULT FALSE;
ALTER TABLE packages ADD COLUMN remote_url TEXT;
ALTER TABLE packages ADD COLUMN transport_type VARCHAR(50);
ALTER TABLE packages ADD COLUMN mcp_config JSONB DEFAULT '{}';

CREATE INDEX idx_packages_remote_mcp
ON packages(type, remote_server)
WHERE type = 'mcp';
```

Run migration:
```bash
cd packages/registry
npm run migrate
```

## Seeding to Database

MCP servers are automatically included in main seed:

```bash
cd packages/registry
npx tsx scripts/seed-packages.ts
```

The script includes:
- `scraped-mcp-servers-all.json` (all servers)
- Automatically deduplicates by ID
- Updates existing, inserts new

## Quality Filtering

Servers are scored 0-100 based on:
- ⭐ Stars: >1000 (+20), >100 (+15), >10 (+10)
- 📚 Documentation: Wiki (+5), README (+5)
- 📝 Description (+5)
- ⚖️ License (+5)
- 📅 Recent updates: <30 days (+10), <90 days (+5)
- 🌐 Remote support (+5)

Filter by quality:
```sql
SELECT * FROM packages
WHERE type = 'mcp' AND quality_score >= 80
ORDER BY quality_score DESC, stars DESC;
```

## Output Files

After scraping:
- `scraped-mcp-servers-all.json` - All 10,000 servers
- `scraped-mcp-servers-remote.json` - Only remote servers
- `scraped-mcp-servers-official.json` - Official Anthropic servers (16)

## Progress Tracking

The scraper shows real-time progress:

```
🚀 Starting MCP server scraping with GitHub API
📊 Rate limit: 5,000 requests/hour with token

⏱️  Rate limit remaining: 5000/5000
⏰  Resets at: 3:45:00 PM

📖 Scraping TensorBlock/awesome-mcp-servers...
   ✅ @owner/repo-name - Server Name 🌐
   ✅ @owner/repo-name2 - Server Name 2
   ...
   ⏸️  Pausing for rate limit... (every 100 repos)

🔍 Searching GitHub for: "mcp server"...
   ✅ @owner/found-repo - MCP Server (⭐123) 🌐
   ⏭️  Skipping @owner/not-mcp (not MCP-related)
   ...

✅ Scraping complete!
📦 Total servers: 10,234
🆕 New servers: 10,126
🌐 Remote servers: 1,245
📁 Saved to scraped-mcp-servers-all.json
📁 Remote servers: scraped-mcp-servers-remote.json

⏱️  Rate limit remaining: 2,134/5,000
```

## Troubleshooting

### Rate Limit Hit

```
⏸️  Rate limit hit, waiting 60s...
```

**Solution**: Scraper auto-waits. Or stop and resume later (uses existing JSON as cache).

### Token Expired

```
❌ Bad credentials
```

**Solution**: Generate new token and update `GITHUB_TOKEN`.

### Server Not MCP-Related

```
⏭️  Skipping @owner/repo (not MCP-related)
```

**Solution**: Scraper checks README for "mcp" keyword. False positives are filtered.

## Next Steps

1. ✅ Generate GitHub token
2. ✅ Set `GITHUB_TOKEN` environment variable
3. ✅ Run `node scripts/scrape-mcp-github.js`
4. ⏰ Wait ~2 hours for 10K servers
5. ✅ Run database migration: `npm run migrate`
6. ✅ Seed to database: `npx tsx scripts/seed-packages.ts`
7. 🎉 Search for MCPs: `prpm search database --type mcp`

## Future Enhancements

- [ ] PyPI package search (Python MCP servers)
- [ ] crates.io search (Rust MCP servers)
- [ ] npm advanced search with download stats
- [ ] Periodic re-scraping (daily/weekly)
- [ ] Server health monitoring
- [ ] Remote server connectivity testing
- [ ] MCP capabilities extraction (tools, resources, prompts)
- [ ] Automatic categorization with AI
