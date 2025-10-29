# Building the Static Site

This document explains how to build and test the static site generation (SSG) for the PRPM webapp.

## Overview

The webapp uses Next.js with static site generation to pre-render all package and collection pages at build time. This creates SEO-friendly, fully crawlable HTML pages.

## Build Scripts

### Production Build
Builds using the production registry (`https://registry.prpm.dev`):
```bash
npm run build:static
```

### Local Build
Builds using your local registry (`http://localhost:3111`):
```bash
npm run build:static:local
```

**Prerequisites:**
- Local registry must be running: `npm run dev:registry` (from root)
- Registry must have packages/collections to generate pages for

### Staging Build
Builds using the staging registry (`https://staging-registry.prpm.dev`):
```bash
npm run build:static:staging
```

## Testing Locally

### 1. Start the Local Registry
From the repository root:
```bash
npm run dev:registry
```

The registry will be available at `http://localhost:3111`

### 2. Seed Test Data (Optional)
If your local database is empty, seed some test data:
```bash
# From root
npm run seed:all
```

### 3. Build the Static Site
```bash
cd packages/webapp
npm run build:static:local
```

This will:
1. Check if the registry is healthy
2. Generate sitemap.xml with all URLs
3. Fetch all package/collection names from `/api/v1/search/seo/*` endpoints
4. Generate static HTML for each package and collection
5. Output to `./out` directory

### 4. Serve and Test
Use any static file server to test the built site:

```bash
# Option 1: Using serve
npx serve out

# Option 2: Using Python
python -m http.server 3000 -d out

# Option 3: Using Node http-server
npx http-server out -p 3000
```

Then open http://localhost:3111 and test:
- Individual package pages: `/packages/[package-name]`
- Individual collection pages: `/collections/[collection-slug]`
- Search page: `/search`

## What Gets Generated

For **~1800 packages** and **~X collections**, the build generates:

```
out/
├── index.html                      # Homepage
├── search.html                     # Search page
├── sitemap.xml                     # SEO sitemap with all URLs
├── robots.txt                      # Search engine crawler instructions
├── packages/
│   ├── package1.html              # Individual package pages
│   ├── package2.html
│   └── ...
├── collections/
│   ├── collection1.html           # Individual collection pages
│   ├── collection2.html
│   └── ...
└── _next/                         # Next.js assets
```

## Build Features

### Environment Detection
The build script automatically:
- Checks registry health (for local/staging)
- Sets correct environment variables
- Validates registry accessibility

### SEO Optimizations
Each page includes:
- ✅ Full meta tags (title, description, keywords)
- ✅ OpenGraph and Twitter cards
- ✅ JSON-LD structured data
- ✅ Complete package content/prompt
- ✅ All metadata (quality scores, ratings, stats)
- ✅ Internal links (tags, related packages)

### Sitemap Generation
The build automatically generates `sitemap.xml` including:
- ✅ All static pages (home, search, blog posts, etc.)
- ✅ All package pages (`/packages/*`)
- ✅ All collection pages (`/collections/*`)
- ✅ Priority and change frequency hints for search engines
- ✅ Last modified dates

You can also generate the sitemap separately:
```bash
npm run generate-sitemap:local   # For local testing
npm run generate-sitemap          # For production
```

### Performance
- Lightweight SEO endpoints (only returns names/slugs)
- Paginated fetching (100 at a time)
- Cached responses (1 hour)
- Optimized for ~1800+ pages

## Troubleshooting

### "Registry not accessible"
**Problem:** Build fails with registry health check error

**Solution:**
- Make sure registry is running: `npm run dev:registry`
- Check registry is accessible: `curl http://localhost:3111/health`
- Verify correct environment: `--env=local` for local registry

### "No packages found"
**Problem:** Build succeeds but generates no package pages

**Solution:**
- Seed test data: `npm run seed:all` (from root)
- Verify packages exist: `curl http://localhost:3111/api/v1/search/seo/packages`

### Build is slow
**Expected:** Building 1800+ pages takes 5-15 minutes

**Optimization tips:**
- Subsequent builds are faster (Next.js caching)
- Use `--env=local` with subset of data for testing
- Production builds run on GitHub Actions with better resources

## CI/CD

The production build runs automatically:
- **On push to main** (if webapp files changed)
- **Every 6 hours** (scheduled rebuild to pick up new packages)
- **Manual trigger** via GitHub Actions UI

The workflow:
1. Runs `npm run build:static` (production registry)
2. Verifies build output
3. Uploads to S3
4. Invalidates CloudFront cache

## Environment Variables

The build script uses these environment variables:

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| `REGISTRY_URL` | `http://localhost:3111` | `https://staging-registry.prpm.dev` | `https://registry.prpm.dev` |
| `NEXT_PUBLIC_REGISTRY_URL` | `http://localhost:3111` | `https://staging-registry.prpm.dev` | `https://registry.prpm.dev` |
| `NODE_ENV` | `production` | `production` | `production` |

You can also override manually:
```bash
REGISTRY_URL=http://localhost:3111 npm run build
```

## Testing Checklist

Before deploying, test:

- [ ] Homepage loads (`/`)
- [ ] Search page loads (`/search`)
- [ ] Individual package page loads (`/packages/[name]`)
- [ ] Package content is visible (full prompt/rule)
- [ ] Individual collection page loads (`/collections/[slug]`)
- [ ] Meta tags are present (view source)
- [ ] JSON-LD structured data is present (view source)
- [ ] Links work (tags, related packages, breadcrumbs)
- [ ] No 404s for existing packages
- [ ] Static files are served correctly
- [ ] Sitemap is accessible (`/sitemap.xml`)
- [ ] Sitemap includes all package/collection URLs
- [ ] robots.txt is accessible (`/robots.txt`)

## Monitoring Build Time

Track build performance:

```bash
time npm run build:static:local
```

Expected times (approximate):
- **Local** (100 packages): ~2-3 minutes
- **Staging** (500 packages): ~5-7 minutes
- **Production** (1800 packages): ~10-15 minutes

## Next Steps

After successful local testing:
1. Push changes to a feature branch
2. Create PR (triggers CI checks)
3. Merge to main (triggers production deployment)
4. Monitor GitHub Actions for successful deployment
5. Verify on production: https://prpm.dev
