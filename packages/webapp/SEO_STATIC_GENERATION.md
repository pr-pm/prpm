# SEO & Static Site Generation

## Problem Statement

The PRPM webapp generates 1,862+ static package pages during build time. Each page currently makes an individual API call to fetch package data, which causes:

1. **Rate limiting**: Registry API has 100 requests/minute limit
2. **Build failures**: 1,862 parallel requests in ~30 seconds = HTTP 429 errors
3. **404 pages generated**: Failed fetches return `null` → `notFound()` → all static HTML files contain 404 error pages instead of actual content

### Evidence
- Build logs show: `[Package Fetch] Failed for @jhonma82/nextjs-react-tailwind: 429`
- All generated HTML files in `.next/server/app/packages/` contain `__next_error__` and `NEXT_NOT_FOUND`
- Production URLs like https://prpm.dev/packages/jhonma82/nextjs-react-tailwind serve 404 content

## Solution Overview

**Two-part solution:**

1. **Lambda function** (in infrastructure repo): Fetches all package/collection data from database → uploads to S3
2. **Next.js changes** (this repo): Read from S3 JSON files instead of making individual API calls

## Architecture Flow

```
GitHub Actions Deploy Workflow
  ↓
1. Invoke Lambda function
   └─> Connect to PostgreSQL
   └─> Fetch all packages + collections
   └─> Upload to S3: seo-data/packages.json, seo-data/collections.json
  ↓
2. Next.js Static Build
   └─> Read from S3 (not API)
   └─> generateStaticParams() gets all package names
   └─> Each page reads package data from JSON
   └─> Generate 1,862 HTML files with actual content
  ↓
3. Deploy to S3 + CloudFront
```

## Required Changes in This Repo

### 1. Update Package Page (`src/app/packages/[author]/[...package]/page.tsx`)

**Current (Broken)**:
```typescript
// Fetches from API → rate limited → 429 → null → notFound()
async function getPackage(name: string): Promise<PackageInfo | null> {
  const encodedName = encodeURIComponent(name);
  const url = `${REGISTRY_URL}/api/v1/packages/${encodedName}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`[Package Fetch] Failed for ${name}: ${res.status}`);
    return null;
  }

  return res.json();
}
```

**Proposed (Fixed)**:
```typescript
// Global cache for packages data
let packagesCache: PackageInfo[] | null = null;

async function getAllPackagesFromS3(): Promise<PackageInfo[]> {
  if (packagesCache) {
    return packagesCache;
  }

  // Fetch from S3 (no rate limiting)
  const s3Url = process.env.NEXT_PUBLIC_S3_SEO_DATA_URL ||
    'https://prpm-prod-packages.s3.amazonaws.com/seo-data/packages.json';

  const res = await fetch(s3Url, {
    cache: 'force-cache',
    next: { revalidate: 300 } // 5 minutes
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch packages from S3: ${res.status}`);
  }

  packagesCache = await res.json();
  return packagesCache;
}

async function getPackage(name: string): Promise<PackageInfo | null> {
  const packages = await getAllPackagesFromS3();
  return packages.find(pkg => pkg.name === name) || null;
}
```

**Also update `generateStaticParams()`**:
```typescript
export async function generateStaticParams() {
  console.log('[generateStaticParams] Fetching all packages from S3...');

  const packages = await getAllPackagesFromS3();

  console.log(`[generateStaticParams] Found ${packages.length} packages`);

  return packages.map(pkg => {
    if (pkg.name.startsWith('@')) {
      const [author, ...packageParts] = pkg.name.substring(1).split('/');
      return { author, package: packageParts };
    }
    return { author: 'prpm', package: [pkg.name] };
  });
}
```

### 2. Update Collections Page (`src/app/collections/[slug]/page.tsx`)

Similar changes needed for collections:

```typescript
let collectionsCache: CollectionInfo[] | null = null;

async function getAllCollectionsFromS3(): Promise<CollectionInfo[]> {
  if (collectionsCache) {
    return collectionsCache;
  }

  const s3Url = process.env.NEXT_PUBLIC_S3_SEO_DATA_URL?.replace('packages.json', 'collections.json') ||
    'https://prpm-prod-packages.s3.amazonaws.com/seo-data/collections.json';

  const res = await fetch(s3Url, {
    cache: 'force-cache',
    next: { revalidate: 300 }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch collections from S3: ${res.status}`);
  }

  collectionsCache = await res.json();
  return collectionsCache;
}

async function getCollection(slug: string): Promise<CollectionInfo | null> {
  const collections = await getAllCollectionsFromS3();
  return collections.find(c => c.name_slug === slug) || null;
}
```

### 3. Update Dynamic Sitemap (`src/app/sitemap.ts`)

**Current**:
```typescript
// Fetches from API endpoints
const packagesRes = await fetch(`${REGISTRY_URL}/api/v1/search?limit=10000`);
const collectionsRes = await fetch(`${REGISTRY_URL}/api/v1/search/seo/collections`);
```

**Proposed**:
```typescript
// Fetch from S3 instead
const packagesUrl = process.env.NEXT_PUBLIC_S3_SEO_DATA_URL ||
  'https://prpm-prod-packages.s3.amazonaws.com/seo-data/packages.json';
const collectionsUrl = packagesUrl.replace('packages.json', 'collections.json');

const [packagesRes, collectionsRes] = await Promise.all([
  fetch(packagesUrl, { cache: 'force-cache' }),
  fetch(collectionsUrl, { cache: 'force-cache' })
]);
```

### 4. Environment Variables

Add to `.env.local` and `.env.production`:

```bash
# S3 URL for SEO data (fetched by Lambda from database)
NEXT_PUBLIC_S3_SEO_DATA_URL=https://prpm-prod-packages.s3.amazonaws.com/seo-data/packages.json

# Registry URL (still used for non-static pages)
NEXT_PUBLIC_REGISTRY_URL=https://registry.prpm.dev
```

### 5. GitHub Actions Workflow Updates

Add Lambda invocation step **before** the Next.js build in `.github/workflows/deploy.yml`:

```yaml
- name: Fetch SEO Data from Database
  env:
    AWS_REGION: us-east-1
  run: |
    echo "Invoking Lambda to fetch package data from database..."

    aws lambda invoke \
      --function-name prpm-prod-seo-data-fetcher \
      --payload '{"bucketName":"prpm-prod-packages","keyPrefix":"seo-data"}' \
      response.json

    echo "Lambda response:"
    cat response.json

    # Verify success
    if ! grep -q '"success":true' response.json; then
      echo "❌ Lambda invocation failed"
      cat response.json
      exit 1
    fi

    echo "✅ SEO data fetched successfully"

- name: Build Next.js Static Site
  env:
    NEXT_PUBLIC_S3_SEO_DATA_URL: https://prpm-prod-packages.s3.amazonaws.com/seo-data/packages.json
    NEXT_PUBLIC_REGISTRY_URL: https://registry.prpm.dev
  run: |
    cd packages/webapp
    npm run build
```

## Testing Locally

### 1. Run Lambda locally (or use production S3 data)

Option A: Use production S3 data (simplest):
```bash
curl https://prpm-prod-packages.s3.amazonaws.com/seo-data/packages.json | jq
```

Option B: Run Lambda locally:
```bash
cd ../../infrastructure/lambda/seo-data-fetcher
npm install
npm run build

# Test with SAM
sam local invoke SeoDataFetcher --event test-event.json
```

### 2. Build Next.js with S3 data

```bash
cd packages/webapp

# Set environment variable
export NEXT_PUBLIC_S3_SEO_DATA_URL=https://prpm-prod-packages.s3.amazonaws.com/seo-data/packages.json

# Build
npm run build

# Check if pages were generated successfully
ls -la .next/server/app/packages/ | head -20

# Look for actual content (not 404s)
# Should see files with size > 1KB, not tiny error pages
```

### 3. Verify generated pages

```bash
# Check a specific package page HTML
cat .next/server/app/packages/jhonma82/nextjs-react-tailwind.html

# Should contain actual package content, NOT:
# - "__next_error__"
# - "NEXT_NOT_FOUND"
# - "404" or "This page could not be found"
```

## Rollback Plan

If S3 approach doesn't work:

1. **Temporary fix**: Increase registry rate limits
   ```typescript
   // packages/registry/src/index.ts
   await server.register(rateLimit, {
     max: 500, // Increased from 100
     timeWindow: '1 minute',
   });
   ```

2. **Alternative**: Use build-time database scripts
   - Run `scripts/fetch-packages.ts` in CI
   - Requires DATABASE_URL in GitHub Actions (less ideal)
   - See `scripts/fetch-packages.ts` for implementation

3. **Last resort**: Switch to ISR (requires Node.js server)
   - Defeats purpose of static S3 hosting
   - Would need AWS Lambda/Vercel/CloudFront Functions

## Success Criteria

### Build Time
- [x] No 429 rate limit errors in build logs
- [x] Build completes without API failures
- [x] All 1,862 pages generate successfully

### Generated Content
- [x] HTML files contain actual package data (not 404 pages)
- [x] File sizes are reasonable (>1KB, not tiny error pages)
- [x] No `__next_error__` or `NEXT_NOT_FOUND` in HTML

### Production
- [x] Package pages like https://prpm.dev/packages/jhonma82/nextjs-react-tailwind show real content
- [x] SEO metadata is correct (title, description, Open Graph)
- [x] Sitemap includes all packages
- [x] Google can index pages

## Performance Expectations

**Before (Broken)**:
- 1,862 API calls during build
- 18.6 requests/second (assuming 100 second build)
- Hits 100 req/min rate limit immediately
- Build fails with 429 errors
- Generates 1,862 404 pages

**After (Fixed)**:
- 2 S3 reads during build (packages.json + collections.json)
- No rate limiting
- Build succeeds
- Generates 1,862 pages with real content
- Build time: ~2-3 minutes (same as before)

## File Locations

### Files to Modify (webapp)
- `src/app/packages/[author]/[...package]/page.tsx` - Package detail pages
- `src/app/collections/[slug]/page.tsx` - Collection pages
- `src/app/sitemap.ts` - Dynamic sitemap
- `.env.production` - Production environment variables
- `.github/workflows/deploy.yml` - Add Lambda invocation step

### Related Files (infrastructure)
- `infrastructure/lambda/seo-data-fetcher/index.ts` - Lambda handler
- `infrastructure/lambda/seo-data-fetcher/README.md` - Lambda documentation
- `infrastructure/modules/seo-lambda.ts` - Pulumi module (to be created)

### Deprecated Files (can be removed)
- `scripts/fetch-packages.ts` - Build-time script (replaced by Lambda)
- `scripts/fetch-collections.ts` - Build-time script (replaced by Lambda)

## Current Status

### ✅ Completed (Infrastructure)
- [x] Lambda function handler created
- [x] Lambda package.json and dependencies
- [x] Lambda documentation

### 🚧 In Progress
- [ ] Pulumi infrastructure for Lambda deployment
- [ ] Lambda IAM roles and VPC configuration

### ⏳ Todo (Webapp - This Repo)
- [ ] Update package page to read from S3
- [ ] Update collections page to read from S3
- [ ] Update sitemap to read from S3
- [ ] Add environment variables
- [ ] Update GitHub Actions workflow
- [ ] Test local build with S3 data
- [ ] Verify generated pages contain real content
- [ ] Deploy and verify production

## Questions & Debugging

### Q: How do I know if the Lambda is working?
A: Check the S3 bucket for `seo-data/packages.json` and `seo-data/collections.json`

### Q: What if S3 data is stale?
A: Lambda should be invoked before every deploy. Check GitHub Actions logs.

### Q: Can I test without deploying Lambda?
A: Yes, use production S3 URLs in local development.

### Q: How do I verify pages have real content?
A: Look for package names, descriptions in generated HTML. No `__next_error__`.

### Q: What if build still fails?
A: Check:
1. S3 data exists and is accessible
2. Environment variables are set correctly
3. No network issues fetching from S3
4. Build logs for specific errors

## Related Documentation

- Lambda README: `../../infrastructure/lambda/seo-data-fetcher/README.md`
- Infrastructure README: `../../infrastructure/README.md`
- Next.js Static Export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- AWS Lambda: https://docs.aws.amazon.com/lambda/
