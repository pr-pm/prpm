# SSG Scaling Analysis: 2 Million Pages

## Executive Summary

**Current Approach: ❌ Not Suitable for 2M+ Pages**

The current Next.js Static Site Generation (SSG) approach works well for **~1,800 packages** but will face critical bottlenecks at **2 million pages**. Build time would exceed **30+ hours** with current implementation, requiring significant architectural changes.

---

## Current Performance Baseline (1,800 Pages)

### Observed Metrics
- **Build Time**: 10-15 minutes
- **Time per Page**: ~0.5 seconds/page (including fetch + render + write)
- **API Calls**:
  - Initial fetch: 18 requests (100 packages/request)
  - Per-page fetch: 1,800 requests for full package data
  - Total: ~1,818 API requests
- **Memory**: ~2-4 GB (Next.js default)
- **Disk**: ~500 MB output

---

## Projections for 2 Million Pages

### 🚨 Critical Issues

#### 1. **Build Time: 16-27 Hours**

**Linear Scaling:**
```
Current: 1,800 pages = 15 minutes (900 seconds)
Per-page: 900s / 1,800 = 0.5 seconds/page

Projected: 2,000,000 pages × 0.5s = 1,000,000 seconds
         = 277 hours (11.5 days) 🔴 UNACCEPTABLE
```

**With Optimizations (parallel builds):**
```
Assuming 10x parallelization: 27.7 hours
Assuming 20x parallelization: 13.8 hours
Best case: ~10-15 hours 🟡 BORDERLINE
```

#### 2. **API Request Volume: 2+ Million Requests**

```
Initial fetch: 2,000,000 / 100 = 20,000 requests
Per-page data: 2,000,000 requests
Total: ~2,020,000 API requests 🔴 CRITICAL
```

**Problems:**
- Registry will be hammered during build
- Potential rate limiting issues
- Network becomes primary bottleneck
- Database connection pool exhaustion

#### 3. **Memory Requirements: 50-100 GB**

**Next.js Memory Growth:**
```
Current: ~4 GB for 1,800 pages
Linear scaling: 4 GB × (2M / 1.8K) = ~4,444 GB 🔴 IMPOSSIBLE

Realistic (with optimizations): 50-100 GB 🟡 EXPENSIVE
```

**Why:**
- Next.js keeps build cache in memory
- Webpack compilation cache
- React component tree for each page
- Incremental build metadata

#### 4. **Disk Space: 100-500 GB**

```
Current output: ~500 MB for 1,800 pages
Per-page average: 500 MB / 1,800 = 278 KB/page

Projected: 278 KB × 2,000,000 = 556 GB 🟡 LARGE
```

**Breakdown:**
- HTML files: ~50 KB/page = 100 GB
- Next.js chunks: Shared across pages = ~50 GB
- Images/assets: Depends on content = ~100+ GB
- Build cache: ~100+ GB

#### 5. **GitHub Actions Limits: EXCEEDED**

```
Max build time: 6 hours 🔴 BLOCKED
Max disk: 14 GB 🔴 BLOCKED
Max memory: 7 GB (for free tier) 🔴 BLOCKED
```

**Verdict:** Cannot build on GitHub Actions

---

## Identified Bottlenecks

### 1. **Sequential API Fetches** 🔴 CRITICAL
**Current:**
```typescript
for (const packageName of allPackages) {
  const res = await fetch(`/api/v1/packages/${packageName}`)
  // Renders page sequentially
}
```

**Problem:** 2M sequential fetches = death

**Solution:** Batch fetching with parallelization

### 2. **Full Package Data Fetching** 🔴 CRITICAL
**Current:**
```typescript
// Each page fetches complete PackageInfo
const pkg: PackageInfo = await getPackage(name)
// Includes: versions[], author{}, readme, content, etc.
```

**Problem:**
- Fetching full data for 2M packages = massive payload
- Most data unused during SSG
- Network bandwidth bottleneck

**Solution:** Minimal data endpoint for SSG

### 3. **Next.js Build Process** 🟡 MAJOR
**Current:**
- Single-threaded rendering in many phases
- Webpack compilation for each page
- Build cache grows unbounded

**Problem:** Doesn't scale beyond ~100K pages

**Solution:** Alternative build systems

### 4. **Metadata Generation** 🟠 MODERATE
**Current:**
```typescript
export async function generateMetadata() {
  // Fetches package data AGAIN
  const res = await fetch(`/packages/${name}`)
}
```

**Problem:** Double-fetching for each page

**Solution:** Cache or reuse data from page component

### 5. **Monolithic Build** 🟡 MAJOR
**Current:** All-or-nothing build

**Problem:**
- Any failure = full rebuild
- No incremental updates for new packages
- Resource spike during scheduled builds

**Solution:** Incremental builds

---

## Proposed Solutions

### 🎯 Solution 1: Incremental Static Regeneration (ISR) - RECOMMENDED

**Approach:** Only generate a subset statically, rest on-demand

```typescript
export async function generateStaticParams() {
  // Only generate top 10,000 most popular packages
  const topPackages = await fetchTopPackages(10000)
  return topPackages.map(name => ({ name }))
}

export const dynamicParams = true // Allow on-demand generation
export const revalidate = 3600 // Revalidate every hour
```

**Pros:**
✅ Build time: ~1-2 hours (only popular packages)
✅ Rest generated on first visit + cached
✅ Works with Next.js out of the box
✅ Automatic cache invalidation

**Cons:**
❌ First visitor sees slow load (cold start)
❌ Requires server (can't use pure S3)
❌ Cache warming needed

**Infrastructure:**
- Deploy to Vercel, AWS Amplify, or self-hosted Next.js server
- CloudFront in front for caching
- Warm cache for top packages

---

### 🎯 Solution 2: Distributed Build System

**Approach:** Split build across multiple machines

```bash
# Machine 1: Packages 1-500K
npm run build:static -- --range=0:500000

# Machine 2: Packages 500K-1M
npm run build:static -- --range=500000:1000000

# Machine 3: Packages 1M-1.5M
npm run build:static -- --range=1000000:1500000

# Machine 4: Packages 1.5M-2M
npm run build:static -- --range=1500000:2000000
```

**Merge outputs:**
```bash
aws s3 sync ./out-1/ s3://prpm-static/
aws s3 sync ./out-2/ s3://prpm-static/
aws s3 sync ./out-3/ s3://prpm-static/
aws s3 sync ./out-4/ s3://prpm-static/
```

**Pros:**
✅ Parallelization reduces time to ~4-6 hours
✅ Still uses S3 (no server needed)
✅ Can use spot instances (cost-effective)

**Cons:**
❌ Complex orchestration
❌ Need to coordinate builds
❌ Merge conflicts possible

**Implementation:**
```typescript
// scripts/build-static.ts
const rangeArg = args.find(arg => arg.startsWith('--range='))
const [start, end] = rangeArg.split('=')[1].split(':').map(Number)

export async function generateStaticParams() {
  const allPackages = await fetchAllPackages()
  return allPackages.slice(start, end).map(name => ({ name }))
}
```

---

### 🎯 Solution 3: Hybrid - Static Index + Server-Rendered Pages

**Approach:** Static sitemap/index, server-render individual pages

```typescript
// Static: Homepage, search, sitemap
// Server-rendered: /packages/[name]

export const dynamic = 'force-dynamic' // SSR for package pages
```

**Pros:**
✅ No massive build needed
✅ Always up-to-date content
✅ Fast initial deployment
✅ Lower infrastructure costs initially

**Cons:**
❌ Slower page loads (no pre-render)
❌ Higher server costs at scale
❌ SEO slightly worse (but still good)

**Best for:** Rapid growth phase before full SSG

---

### 🎯 Solution 4: Custom Static Site Generator

**Approach:** Replace Next.js with purpose-built generator

```typescript
// Custom generator with:
// - Parallel page generation (100+ concurrent)
// - Minimal templates (no React overhead)
// - Efficient caching
// - Resumable builds

async function generatePages() {
  const packages = await fetchAllPackages()

  await Promise.all(
    chunk(packages, 1000).map(async (batch) => {
      const results = await fetchBatch(batch) // Batch API calls
      await Promise.all(
        results.map(pkg => renderTemplate(pkg)) // Parallel render
      )
    })
  )
}
```

**Pros:**
✅ 10-20x faster than Next.js (~1-2 hours)
✅ Lower memory usage (~10-20 GB)
✅ Full control over process
✅ Optimized for scale

**Cons:**
❌ Significant development effort
❌ Lose Next.js ecosystem benefits
❌ Maintenance burden

**Tech Stack:**
- Template engine: Handlebars or Nunjucks
- Parallel processing: Worker threads
- Batch fetching: Custom API client

---

## Optimizations for Current Approach

### 1. Batch API Fetching
```typescript
// Instead of 2M individual requests
async function fetchPackagesBatch(names: string[]) {
  return fetch('/api/v1/packages/batch', {
    method: 'POST',
    body: JSON.stringify({ names })
  })
}

// Fetch in batches of 100
const batches = chunk(allPackages, 100)
for (const batch of batches) {
  const packages = await fetchPackagesBatch(batch)
  // Generate pages from batch
}
```

**Reduces API calls:** 2M → 20K (100x improvement)

### 2. Minimal SSG Endpoint
```typescript
// packages/registry/src/routes/search.ts
server.get('/seo/packages-full', async (req, res) => {
  // Return minimal data needed for SSG
  const packages = await query(`
    SELECT
      name,
      description,
      tags,
      format,
      subtype,
      total_downloads,
      -- Exclude: content, versions, readme
    FROM packages
    WHERE visibility = 'public'
  `)
  return { packages }
})
```

**Reduces payload:** ~1 MB/package → ~10 KB/package (100x improvement)

### 3. Parallel Page Generation
```typescript
// Use Next.js experimental parallel builds
// next.config.js
module.exports = {
  experimental: {
    workerThreads: true,
    cpus: 16 // Max CPU cores
  }
}
```

**Speeds up build:** 2x-4x improvement

### 4. Incremental Builds
```typescript
// Only regenerate changed/new packages
const lastBuild = await getLastBuildTimestamp()
const newPackages = await fetchPackagesSince(lastBuild)

// Only generate pages for new/updated packages
export async function generateStaticParams() {
  return newPackages.map(name => ({ name }))
}
```

**Reduces rebuild time:** Hours → Minutes

---

## Recommended Architecture for 2M Pages

### **Phase 1: 0-50K Packages (Current)**
✅ Current SSG approach
- Build time: <30 minutes
- GitHub Actions: Works fine
- Cost: Minimal

### **Phase 2: 50K-500K Packages**
🔄 Switch to **ISR** (Solution 1)
- Pre-generate top 10K packages
- Rest on-demand + cache
- Deploy to Vercel/AWS Amplify
- Build time: ~1 hour
- Cost: ~$100-500/month

### **Phase 3: 500K-2M Packages**
🔄 Switch to **Distributed Build** (Solution 2) OR **Custom Generator** (Solution 4)

**Option A: Distributed Build**
- 10 machines × 200K pages each
- Parallel build: ~4-6 hours
- Cost: ~$50-100/build (spot instances)

**Option B: Custom Generator**
- Single beefy machine (64 cores, 128 GB RAM)
- Optimized generator: ~2-3 hours
- Cost: ~$20-40/build (spot instance)

---

## Resource Requirements for 2M Pages

### Compute
| Approach | CPUs | RAM | Build Time | Cost/Build |
|----------|------|-----|------------|------------|
| Current (sequential) | 4 | 8 GB | 277 hours | N/A (timeout) |
| Current (optimized) | 16 | 32 GB | 27 hours | $50-100 |
| ISR (top 10K only) | 8 | 16 GB | 1 hour | $5-10 |
| Distributed (10 machines) | 40 | 160 GB | 6 hours | $50-100 |
| Custom Generator | 64 | 128 GB | 2 hours | $20-40 |

### Storage
| Component | Size |
|-----------|------|
| HTML Output | 100 GB |
| Build Cache | 100 GB |
| Assets | 50 GB |
| **Total** | **~250 GB** |

### Network
| Phase | Bandwidth |
|-------|-----------|
| Fetch package list | ~200 MB |
| Fetch full data (2M × 100 KB) | ~200 GB |
| Upload to S3 | ~100 GB |
| **Total** | **~300 GB** |

---

## Cost Analysis

### Option 1: ISR (Recommended for Growth)
**Monthly Cost:**
- Vercel Pro: $20/user + usage
- Edge requests (10M): ~$40
- Edge bandwidth (100 GB): ~$10
- **Total: ~$100-200/month**

### Option 2: Distributed SSG Builds
**Per Build Cost:**
- 10 × c5.4xlarge spot instances: ~$5/hour × 6 hours = $30
- S3 storage (250 GB): ~$6/month
- CloudFront: ~$20/month
- **Total: $30/build + $26/month**
- **Monthly (4 builds): ~$150/month**

### Option 3: Custom Generator
**Per Build Cost:**
- 1 × c5.18xlarge spot instance: ~$7/hour × 2 hours = $14
- S3 storage: ~$6/month
- CloudFront: ~$20/month
- **Total: $14/build + $26/month**
- **Monthly (4 builds): ~$80/month**

---

## Immediate Action Items

### Short Term (Now - 10K packages)
1. ✅ Keep current approach
2. ✅ Monitor build times
3. ✅ Add build time metrics

### Medium Term (10K - 100K packages)
1. 🔄 Implement batch API endpoints
2. 🔄 Add ISR for new packages
3. 🔄 Deploy to Vercel/Amplify
4. 🔄 Set up cache warming

### Long Term (100K+ packages)
1. 📋 Evaluate ISR performance
2. 📋 If needed, implement distributed builds OR custom generator
3. 📋 Set up build farm infrastructure
4. 📋 Implement incremental build system

---

## Conclusion

**Current Approach Verdict:** ❌ **Will NOT scale to 2M pages**

**Recommended Path:**
1. **Now (1.8K)**: Current SSG ✅
2. **10K-100K**: Switch to ISR 🔄
3. **100K-2M**: Custom generator or distributed builds 📋

**Key Takeaways:**
- Next.js SSG is not designed for 1M+ pages
- ISR is the pragmatic solution for growth
- Custom generator is the ultimate solution for scale
- Plan architecture evolution based on growth trajectory

**Next Steps:**
1. Monitor package growth rate
2. Plan ISR migration when approaching 10K packages
3. Prototype custom generator for future scale
