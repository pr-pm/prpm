# SSG Data Directory

This directory contains SEO data used for static site generation (SSG) of package and collection pages.

## Files

### Generated Files (not committed to git)
- `packages.json` - Full list of packages for SSG (generated during build)
- `collections.json` - Full list of collections for SSG (generated during build)

### Example Files (committed to git)
- `packages.example.json` - Example structure for package data
- `collections.example.json` - Example structure for collection data

## How it Works

### During CI/CD Build
1. `prepare-ssg-data.sh` script runs
2. Downloads latest `packages.json` and `collections.json` from S3
3. Next.js uses these files to generate static pages for all packages/collections

### During Local Development
1. Run `prepare-ssg-data.sh` to download data from S3 (requires AWS credentials)
2. OR the script will use fallback mock data if S3 is unavailable
3. Then run `npm run build` to build the site

### Fallback Data
If S3 download fails, the script creates minimal mock files with realistic examples:
- 5 sample packages
- 3 sample collections

This allows local builds to work without AWS credentials or a running registry.

## Commands

```bash
# From project root
./scripts/prepare-ssg-data.sh

# With debug output
DEBUG=true ./scripts/prepare-ssg-data.sh

# Then build
cd packages/webapp
npm run build
```

## Why These Files Aren't Committed

- `packages.json` (~16MB) and `collections.json` (~4MB) are too large for git
- They're regenerated on every build anyway
- They're available from S3 when needed
- Local fallback data is available for offline development
