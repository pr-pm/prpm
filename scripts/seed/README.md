# Package Seed Scripts

Scripts for bulk uploading scraped packages to the PRMP registry.

## Overview

These scripts support the bootstrap strategy of pre-populating the registry with high-quality packages and allowing original authors to claim ownership.

## Prerequisites

1. **Curator Account**: You need a special curator token with publishing privileges
2. **Scraped Data**: Run the scraper first to generate `scripts/scraped/cursor-rules.json`
3. **Registry Running**: The PRMP registry must be deployed and accessible

## Usage

### 1. Set Environment Variables

```bash
export PRMP_REGISTRY_URL="https://registry.promptpm.dev"
export PRMP_CURATOR_TOKEN="your-curator-token-here"
```

### 2. Run the Scraper (if not done)

```bash
cd scripts/scraper
npm install
export GITHUB_TOKEN="your-github-token"
npm run scrape  # or: tsx github-cursor-rules.ts
```

This creates `scripts/scraped/cursor-rules.json` with ~100-500 packages.

### 3. Upload Packages

```bash
cd scripts/seed
npm install
npm run upload  # or: tsx upload-packages.ts
```

The script will:
- Read scraped packages from `cursor-rules.json`
- Create proper manifests with `unclaimed: true` flag
- Generate tarballs with `.cursorrules` files
- Upload to registry in batches (5 at a time, 2s delay)
- Save results to `upload-results.json`

## Package Manifest Format

Each uploaded package includes:

```json
{
  "name": "package-name-author",
  "version": "1.0.0",
  "type": "cursor",
  "metadata": {
    "originalAuthor": "github-username",
    "githubUrl": "https://github.com/...",
    "stars": 123,
    "unclaimed": true,
    "curatedBy": "prmp-curator"
  }
}
```

The `unclaimed: true` flag enables the "claim your package" flow.

## Claiming Flow

Once packages are uploaded:

1. **Notification**: Email/DM original authors
   ```
   Hi! We published your cursor rules on PRMP Registry.
   Claim your package at: https://registry.promptpm.dev/claim/your-package
   ```

2. **Verification**: User logs in with GitHub OAuth
3. **Ownership Transfer**: System verifies GitHub ownership and transfers package
4. **Update Metadata**: Remove `unclaimed` flag, add verified badge

## Rate Limits

- **GitHub API**: 5,000 requests/hour (authenticated)
- **Registry Upload**: 5 packages per batch, 2 second delay
- **Estimated Time**: ~10-20 minutes for 100 packages

## Error Handling

The script tracks all failures in `upload-results.json`:

```json
{
  "timestamp": "2025-10-17T...",
  "total": 150,
  "successful": 147,
  "failed": 3,
  "results": [
    {"success": false, "package": "...", "error": "Validation failed"}
  ]
}
```

## Bootstrap Strategy

### Phase 1: Initial Upload (Week 1)
- Scrape top 100-200 cursor rules from GitHub
- Upload with `unclaimed: true` flag
- Mark packages with original author attribution

### Phase 2: Author Outreach (Week 2-3)
- Email/DM top 50 authors with >100 stars
- Invite to claim packages
- Offer early adopter benefits

### Phase 3: Community Growth (Week 4+)
- Launch on Product Hunt, Hacker News
- Highlight "500+ packages available"
- Showcase claimed packages and verified authors

## Curator Token

The curator token should:
- Have `curator` role in database
- Bypass normal user limits (rate limiting, package count)
- Allow publishing on behalf of others
- Mark packages with special metadata

Create via SQL:
```sql
INSERT INTO users (github_id, username, email, role)
VALUES (0, 'prmp-curator', 'curator@promptpm.dev', 'curator');

-- Generate token and add to secrets
```

## Testing

Test with a small batch first:

```bash
# Edit upload-packages.ts to limit packages
const packages = JSON.parse(scrapedData).slice(0, 5); // Test with 5

tsx upload-packages.ts
```

## Cleanup

If you need to remove uploaded packages:

```bash
# TODO: Create cleanup script
# For now, use SQL:
DELETE FROM packages WHERE metadata->>'curatedBy' = 'prmp-curator';
```

## Next Steps

After seeding:
1. Build package claiming UI in registry dashboard
2. Create email templates for author outreach
3. Set up analytics to track claims
4. Build admin panel for verifying packages
5. Create marketing materials (blog post, tweet thread)
