# PRMP Bootstrap Guide

Complete guide to bootstrapping the PRMP registry from zero to launch.

## Overview

This guide walks through the "silent launch" strategy where we:
1. Scrape 100-200 high-quality cursor rules from GitHub
2. Publish them to the registry with full attribution
3. Contact authors to claim ownership
4. Launch publicly with 500+ packages

**Timeline**: 1-2 weeks from start to public launch

---

## Phase 1: Scraping (Day 1)

### Prerequisites
- GitHub Personal Access Token (for API access)
- Node.js 20+ installed
- Git repository cloned

### Steps

#### 1. Install Scraper Dependencies
```bash
cd scripts/scraper
npm install
```

#### 2. Set GitHub Token
```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

Get token from: https://github.com/settings/tokens
- Scopes needed: `public_repo`, `read:user`

#### 3. Run Scraper
```bash
npm run scrape
# or: tsx github-cursor-rules.ts
```

This will:
- Search GitHub for cursor rules repositories
- Search for `.cursorrules` files across repos
- Extract content, metadata, and tags
- Save to `scripts/scraped/cursor-rules.json`

**Expected output:**
```
🕷️  Starting cursor rules scraper...

🔍 Searching GitHub for cursor rules repositories...
Found 45 repos for ".cursorrules"
Found 32 repos for "cursor rules"
Found 28 repos for "cursor ai rules"
Found 19 repos for "cursor prompts"

Found 87 unique repositories

📦 Processing PatrickJS/awesome-cursorrules (1234 ⭐)
   ✓ Extracted react-patrickjs
   ✓ Extracted typescript-patrickjs
   ...

✅ Scraping complete!
   Scraped 156 packages
   Saved to: /path/to/scripts/scraped/cursor-rules.json

📊 Stats:
   Top authors: PatrickJS, pontusab, ...
   Total stars: 12,345
   Top tags: react, typescript, nextjs, python, ...
```

#### 4. Review Scraped Data

```bash
cat scripts/scraped/cursor-rules.json | jq '.[] | {name, author, stars}' | head -20
```

Verify:
- Package names are valid (lowercase, alphanumeric + hyphens)
- Descriptions are meaningful
- Content looks legitimate (not empty or garbage)
- Tags are reasonable

**Quality Checks:**
- Remove any packages with suspicious content
- Deduplicate if needed
- Verify attribution is correct

---

## Phase 2: Deploy Infrastructure (Day 1-2)

### Prerequisites
- AWS Account with admin access
- AWS CLI configured: `aws configure`
- Pulumi installed: `brew install pulumi` or `curl -fsSL https://get.pulumi.com | sh`

### Steps

#### 1. Install Infra Dependencies
```bash
cd infra
npm install
```

#### 2. Configure Pulumi Stack
```bash
pulumi login  # Or: pulumi login --local for file-based state

pulumi stack init dev
pulumi config set aws:region us-east-1
pulumi config set prmp:environment dev
pulumi config set --secret prmp:jwtSecret "$(openssl rand -base64 32)"
pulumi config set --secret prmp:githubClientSecret "your-github-oauth-secret"
```

#### 3. Deploy Infrastructure
```bash
pulumi up
```

This creates (~20 minutes):
- VPC with public/private subnets
- RDS PostgreSQL 15 database
- ElastiCache Redis 7 cluster
- S3 bucket for packages
- ECS Fargate cluster
- Application Load Balancer
- CloudWatch monitoring

**Save the outputs:**
```bash
pulumi stack output --json > ../outputs.json
```

You'll need:
- `registryUrl` - API endpoint
- `databaseEndpoint` - RDS host
- `bucketName` - S3 bucket

---

## Phase 3: Deploy Registry (Day 2)

### Prerequisites
- Infrastructure deployed (Phase 2)
- Docker installed
- ECR repository created

### Steps

#### 1. Build and Push Docker Image
```bash
cd registry

# Get ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t prmp-registry .

# Tag and push
docker tag prmp-registry:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/prmp-registry:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/prmp-registry:latest
```

Or use GitHub Actions:
```bash
git push origin main  # Triggers registry-deploy.yml workflow
```

#### 2. Run Database Migrations
```bash
# Via ECS task
aws ecs run-task \
  --cluster prmp-dev-cluster \
  --task-definition prmp-registry-task \
  --launch-type FARGATE \
  --network-configuration "..." \
  --overrides '{"containerOverrides":[{"name":"prmp-registry","command":["npm","run","migrate"]}]}'

# Or locally (if you have DB access)
cd registry
npm run migrate
```

#### 3. Create Curator Account

Connect to database:
```bash
psql -h your-rds-endpoint.rds.amazonaws.com -U prmp -d prmp
```

Create curator:
```sql
INSERT INTO users (id, github_id, username, email, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  0,
  'prmp-curator',
  'curator@prmp.dev',
  'curator',
  NOW()
);
```

Generate curator token (run in registry directory):
```bash
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '00000000-0000-0000-0000-000000000001', username: 'prmp-curator', role: 'curator' },
  process.env.JWT_SECRET,
  { expiresIn: '365d' }
);
console.log(token);
"
```

Save this token for the next phase.

#### 4. Verify Registry is Running
```bash
curl https://your-registry-url.com/health

# Should return: {"status":"healthy"}
```

---

## Phase 4: Seed Registry (Day 2-3)

### Prerequisites
- Registry deployed and healthy
- Curator token created
- Scraped data ready (`cursor-rules.json`)

### Steps

#### 1. Install Seed Dependencies
```bash
cd scripts/seed
npm install
```

#### 2. Configure Environment
```bash
export PRMP_REGISTRY_URL="https://your-registry-url.com"
export PRMP_CURATOR_TOKEN="your-curator-jwt-token"
```

#### 3. Test Upload (Small Batch)

Edit `upload-packages.ts` temporarily:
```typescript
// Line ~210: Limit to 5 packages for testing
const packages: ScrapedPackage[] = JSON.parse(scrapedData).slice(0, 5);
```

Run:
```bash
npm run upload
```

Expected output:
```
📦 PRMP Package Uploader

📂 Loading packages from .../cursor-rules.json...
   Found 5 packages

🚀 Uploading batch 1/1...
   [1/5] react-patrickjs...
   ✓ react-patrickjs uploaded successfully
   [2/5] typescript-patrickjs...
   ✓ typescript-patrickjs uploaded successfully
   ...

============================================================
📊 Upload Summary
============================================================
✓ Successful: 5/5
✗ Failed: 0/5

💾 Results saved to: .../upload-results.json

✅ Upload complete!
```

#### 4. Verify Test Uploads
```bash
npm run check
```

Should show all 5 packages verified.

Also test via CLI:
```bash
prmp search react
prmp info react-patrickjs
```

#### 5. Full Upload

Remove the `.slice(0, 5)` edit and run full upload:
```bash
npm run upload
```

This will upload all 100-200 packages in batches of 5 with 2 second delays.

**Expected time**: 10-20 minutes for 150 packages

#### 6. Final Verification
```bash
npm run check

# Should show: ✓ Verified: 147/147 (or similar)
```

Test search:
```bash
prmp search typescript
prmp trending
```

---

## Phase 5: Author Outreach (Week 2)

### Prepare Contact List

From scraped data, extract top authors:
```bash
cd scripts/seed

# Get top 50 authors by stars
cat ../scraped/cursor-rules.json | \
  jq -r 'sort_by(.stars) | reverse | .[0:50] | .[] | "\(.author),\(.githubUrl),\(.stars),\(.name)"' \
  > top-authors.csv
```

### Contact Strategy

**Week 1: Top 20 (100+ stars)**
- Method: GitHub Issues + Twitter DM
- Template: `email-templates.md` Template 1
- Personal touch: Mention specific feature of their rules

**Week 2: Next 30 (50-100 stars)**
- Method: GitHub Issues only
- Template: `email-templates.md` Template 1 (standard)

**Week 3: Long tail**
- Method: Batch via GitHub Issues API
- Template: Automated issue creation

### GitHub Issue Example

For each author in `top-authors.csv`:

1. Go to their repo: `https://github.com/{author}/{repo}/issues/new`
2. Use Template 1 from `email-templates.md`
3. Customize with their package details
4. Submit issue
5. Track in spreadsheet (author, contacted date, response, claimed)

**Automation Script** (Optional):
```bash
# TODO: Create scripts/outreach/create-issues.ts
# Uses GitHub API to create issues in bulk
```

### Track Responses

Create spreadsheet with columns:
- Author
- GitHub URL
- Stars
- Package Name
- Contacted Date
- Response Date
- Claimed (Y/N)
- Notes

---

## Phase 6: Public Launch (Week 3)

### Pre-Launch Checklist

- [ ] 100+ packages published
- [ ] 20+ packages claimed by authors
- [ ] CLI working end-to-end
- [ ] Registry deployed to production
- [ ] Landing page ready
- [ ] Blog post written
- [ ] Product Hunt account created
- [ ] Twitter/X account ready
- [ ] Reddit accounts with karma

### Launch Day Plan

#### Morning (6 AM PST)
1. **Product Hunt**: Submit at 12:01 AM PST for maximum visibility
   - Title: "PRMP - npm for AI Prompts (Cursor Rules, Claude Agents)"
   - Tagline: "Install, share, and manage AI prompts via CLI. 500+ packages available."
   - Screenshots: CLI in action, registry search, package details
   - Video: 30-second demo

2. **Hacker News**: Submit at 8 AM PST
   - Title: "Show HN: PRMP - Package manager for AI prompts and cursor rules"
   - URL: GitHub repo or blog post

#### Midday (12 PM PST)
3. **Reddit**: Post to relevant subreddits
   - r/cursor
   - r/LocalLLaMA
   - r/ChatGPT
   - r/programming
   - r/webdev
   - Use Template 4 from `email-templates.md`

4. **Twitter/X**: Launch thread
   ```
   🚀 Launching PRMP today!

   npm for AI prompts - install cursor rules, Claude agents, etc via CLI

   Instead of:
   ❌ Copy-pasting from GitHub
   ❌ Managing dozens of .md files
   ❌ Manually updating rules

   Just:
   ✅ prmp install react-rules

   500+ packages available: https://registry.prmp.dev

   🧵 Thread...
   ```

#### Evening (6 PM PST)
5. **Dev.to / Hashnode**: Publish detailed blog post
   - How we built it
   - Technical architecture
   - Bootstrap strategy
   - Invite contributors

6. **Newsletter**: Send to email list (if you have one)

### Post-Launch

**Day 1-3**:
- Respond to all comments/questions
- Fix urgent bugs
- Monitor analytics
- Thank supporters

**Week 1**:
- Follow up with authors who claimed packages
- Add most-requested features
- Write follow-up blog posts

**Week 2-4**:
- Partner with Cursor, Continue, etc.
- Add organizational support
- Implement requested features
- Scale infrastructure if needed

---

## Success Metrics

### Week 1 Targets
- [ ] 100+ packages published ✅
- [ ] Registry live with <100ms response time
- [ ] CLI published to npm
- [ ] 10+ packages claimed by authors

### Week 2 Targets
- [ ] 50+ authors contacted
- [ ] 20+ packages claimed
- [ ] 1,000+ CLI installs
- [ ] 100+ daily active users

### Month 1 Targets
- [ ] 500+ packages
- [ ] 5,000+ CLI installs
- [ ] 500+ daily active users
- [ ] Product Hunt top 10
- [ ] 100+ GitHub stars
- [ ] 3+ integration partnerships

---

## Troubleshooting

### Scraper Issues

**Error: "rate limit exceeded"**
- Wait 1 hour or use different token
- Reduce queries in `searchCursorRules()`

**Error: "content too large"**
- Add size check: skip files >100KB
- Edit line 100: check `content.data.size`

### Upload Issues

**Error: "authentication failed"**
- Verify curator token is valid: `jwt.io`
- Check token hasn't expired
- Ensure curator user exists in database

**Error: "manifest validation failed"**
- Check package name format (lowercase, alphanumeric + hyphens)
- Verify all required fields present
- Test manifest with Zod schema

**Error: "S3 upload failed"**
- Check S3 bucket exists and is accessible
- Verify IAM role has PutObject permission
- Check bucket policy allows uploads

### Registry Issues

**Registry returns 500 errors**
- Check database connection: `psql -h...`
- View logs: `aws logs tail /ecs/prmp-registry --follow`
- Check secrets are configured

**Packages not appearing in search**
- Run check script: `npm run check`
- Verify packages in database: `SELECT * FROM packages LIMIT 10;`
- Check cache: may need to invalidate Redis

---

## Next Steps After Bootstrap

1. **Author Claiming UI**
   - Build dashboard for authors
   - OAuth flow for verification
   - Transfer ownership functionality

2. **Package Quality System**
   - Automated testing
   - Malware scanning
   - Community ratings

3. **Format Conversion**
   - cursor ↔ claude ↔ continue
   - Automatic format detection
   - Preview rendered output

4. **Preview Mode**
   - Local LLM integration
   - Test prompts before installing
   - Compare different packages

5. **Enterprise Features**
   - Private registries
   - Team management
   - Usage analytics
   - SSO/SAML support

---

## Support

If you run into issues:
1. Check PROGRESS_NOTES.md for known issues
2. Review GitHub Actions logs
3. Check AWS CloudWatch logs
4. Open GitHub issue with details

Happy bootstrapping! 🚀

#### 3B. Run Claude Agent Scrapers

```bash
# Scrape from GitHub repos (valllabh, wshobson)
tsx claude-agents-scraper.ts

# Scrape from subagents.cc (manual curation)
tsx subagents-scraper.ts
```

**Output:**
- `scripts/scraped/claude-agents.json` - ~85+ agents from GitHub
- `scripts/scraped/subagents.json` - 6 curated agents

**Sources:**
- valllabh/claude-agents - 8 agents (full dev lifecycle)
- wshobson/agents - 85+ agents (63 plugins, 23 categories)
- subagents.cc - 6 top agents (manual curation)

See `docs/CLAUDE_AGENTS_SOURCES.md` for partnership strategies.
