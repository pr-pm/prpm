# Production Seeding TODO

## Current Situation

### Scraped Packages Status
- **Location**: ~4,500+ packages sitting as untracked files in repository root
- **Files**:
  - `converted-cursor-skills-enhanced.json`
  - `scraped-cursor-directory-enhanced.json`
  - `scraped-windsurf-packages-enhanced.json`
  - `scraped-mcp-packages-enhanced.json`
  - `scraped-additional-agents-enhanced.json`
  - `scraped-claude-skills-enhanced.json`
  - `scraped-volt-agent-subagents-enhanced.json`
  - And many more...

### Seed Script Issue
- Seed script at `packages/registry/scripts/seed-packages.ts` references `../../../data/scraped/*.json`
- The `data/scraped/` directory **does not exist**
- Scraped files are not committed to git
- Production deployment won't have these packages

## Action Required Before Production

### Step 1: Organize Scraped Data
```bash
# Create data directory structure
mkdir -p data/scraped

# Move all scraped packages into it
mv *-enhanced.json data/scraped/ 2>/dev/null
mv scraped-*.json data/scraped/ 2>/dev/null
mv converted-*.json data/scraped/ 2>/dev/null
mv new-*.json data/scraped/ 2>/dev/null

# Update .gitignore if needed (these should be committed)
# Remove data/ from .gitignore if present
```

### Step 2: Verify Seed Script Alignment
Ensure `packages/registry/scripts/seed-packages.ts` file paths match the actual files in `data/scraped/`:
- Check line 41-62 for file list
- Verify all referenced files exist
- Add any missing files to the list

### Step 3: Commit to Repository
```bash
git add data/scraped/
git commit -m "Add 4,500+ production seed packages"
git push origin v2
```

## Production Seeding Strategy

### Option A: One-Time SSH Seed (For Initial Launch)
**Best for**: First production deployment

```bash
# After Beanstalk deployment
eb ssh prpm-prod-env

# Navigate to application
cd /var/app/current

# Run migrations and seed
npm run migrate
npm run seed:packages
npm run seed:collections
```

**Pros**:
- Full control over timing
- Can monitor progress
- Easy to retry if issues

**Cons**:
- Manual process
- Requires SSH access
- One-time only

### Option B: Automated Seed via Beanstalk
**Best for**: Continuous deployments with incremental updates

Create `packages/registry/.ebextensions/02-seed-database.config`:

```yaml
container_commands:
  01_run_migrations:
    command: "npm run migrate"
    leader_only: true
  02_seed_packages:
    command: "npm run seed:packages"
    leader_only: true
    ignoreErrors: true  # Don't fail if packages already exist (ON CONFLICT DO NOTHING)
  03_seed_collections:
    command: "npm run seed:collections"
    leader_only: true
    ignoreErrors: true
```

**Pros**:
- Fully automated
- Runs on every deployment
- Idempotent (ON CONFLICT DO NOTHING)
- No manual intervention

**Cons**:
- Increases deployment time (~2-3 minutes)
- Less visibility into seeding progress
- All-or-nothing per deployment

### Option C: Hybrid Approach (RECOMMENDED)
1. **Initial launch**: Use Option A for first seed
2. **Future updates**: Use Option B for incremental packages
3. **Large batch updates**: SSH in and run seed manually

## Recommended Approach

### Phase 1: Pre-Production (Do This Now)
1. ✅ Organize all scraped files into `data/scraped/`
2. ✅ Verify seed script references correct files
3. ✅ Test seed locally: `npm run seed:packages`
4. ✅ Commit to git
5. ✅ Push to v2 branch

### Phase 2: Initial Production Deploy
1. Deploy infrastructure via GitHub Actions
2. SSH into Beanstalk: `eb ssh prpm-prod-env`
3. Run migrations: `cd /var/app/current && npm run migrate`
4. Run seed: `npm run seed:packages` (monitor progress)
5. Verify: `curl https://registry.prpm.dev/api/v1/packages?limit=10`

### Phase 3: Ongoing
1. Add automated seed config (Option B)
2. New packages added to `data/scraped/` auto-seed on deploy
3. Large batch imports done manually via SSH

## Package Inventory

Based on GAP_ANALYSIS_V2.md:

- **Claude Skills**: 241 packages
- **Cursor Rules**: 2,854 packages
- **MCP Servers**: 3,676 packages
- **Windsurf**: 127 packages
- **Continue**: 64 packages
- **Agents**: 147 packages
- **Collections**: 43 curated collections

**Total**: ~4,561 packages ready for production

## Testing Before Production

```bash
# 1. Local test with Docker
docker-compose up -d postgres
npm run migrate
npm run seed:packages
npm run seed:collections

# 2. Verify package count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM packages;"

# 3. Verify collections
psql $DATABASE_URL -c "SELECT COUNT(*) FROM collections;"

# 4. Test search
curl http://localhost:3001/api/v1/search?q=python&limit=5 | jq

# 5. Test collections
curl http://localhost:3001/api/v1/collections | jq
```

## Post-Deployment Verification

```bash
# Health check
curl https://registry.prpm.dev/health

# Package count
curl "https://registry.prpm.dev/api/v1/packages?limit=1" | jq '.total'

# Collections count
curl https://registry.prpm.dev/api/v1/collections | jq '. | length'

# Search test
curl "https://registry.prpm.dev/api/v1/search?q=python&limit=5" | jq

# Stats
curl https://registry.prpm.dev/api/v1/stats | jq
```

## Rollback Plan

If seeding fails in production:

```bash
# SSH into Beanstalk
eb ssh prpm-prod-env

# Check logs
tail -f /var/log/eb-engine.log

# Manually fix and retry
cd /var/app/current
npm run seed:packages

# Or rollback database
npm run migrate:rollback
npm run migrate
```

## Future Enhancements

1. **Incremental Seeding**: Track last seed timestamp, only add new packages
2. **Seed API Endpoint**: POST /admin/seed for on-demand seeding
3. **Seed Status Dashboard**: Monitor seeding progress in real-time
4. **Validation**: Check package quality before adding to prod
5. **Staging Environment**: Test seed on staging before prod

## Notes

- Seed script uses `ON CONFLICT (id) DO NOTHING` - safe to run multiple times
- Package IDs are namespaced: `@author/package-name`
- All scraped packages are public data (safe to commit)
- Seed time: ~2-3 minutes for 4,500 packages
- Database size: ~100MB for packages + content
