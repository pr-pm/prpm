# Playground Viral Loop Implementation

## Overview

This document describes the viral growth features implemented for the PRPM Playground to turn it into a growth engine.

## What Was Implemented (Phase 1)

### 1. **Open Graph Image Generation** ✅
**File:** `packages/webapp/src/app/api/og/playground/route.tsx`

**What it does:**
- Generates beautiful 1200x630px images for shared playground results
- Automatically pulled by Twitter, LinkedIn, Facebook, Slack, Discord when links are shared
- Shows: Package name, user input, AI response preview, model used, view count, helpful count
- Branded with PRPM colors and logo

**Technical Details:**
- Uses `@vercel/og` for edge-optimized image generation
- Fetches session data from registry API
- Truncates text intelligently for readability
- Renders with Tailwind-like styling

**URL Format:**
```
/api/og/playground?token=<share_token>
```

### 2. **Rich Social Metadata** ✅
**File:** `packages/webapp/src/app/(app)/playground/shared/layout.tsx`

**What it does:**
- Adds Open Graph and Twitter Card metadata to shared result pages
- Fetches session data server-side for SEO optimization
- Generates dynamic titles and descriptions based on actual content

**Metadata Included:**
- Title: `{package_name} Playground Result | PRPM`
- Description: User input preview + package name
- OG Image: Dynamic image from API route
- Twitter: Large image card with creator attribution (@prpm_dev)
- Canonical URL for SEO

### 3. **Enhanced Sharing UX** ✅
**File:** `packages/webapp/src/app/(app)/playground/shared/page.tsx`

**What it does:**
- "Try This Yourself" button → Pre-fills playground with same input
- Social share buttons for Twitter, LinkedIn
- One-click copy link to clipboard
- Better visual hierarchy for conversion

**User Flow:**
```
1. User sees shared result on Twitter (with OG image)
2. Clicks → Lands on /playground/shared?token=xyz
3. Sees the conversation + stats
4. Clicks "Try This Yourself"
5. → Redirected to /playground?package={id}&input={encoded}
6. Input is pre-filled → Just hit "Run"
7. Uses free credit → Signup prompt
```

## Viral Loop Mechanics

### Before This Implementation
```
User runs playground → Can share link → Link shows generic preview → Low CTR
```

### After This Implementation
```
User runs playground
  → Shares link with beautiful OG image
  → 3-5x higher CTR on social media
  → Visitor sees result + "Try This" button
  → Pre-filled input lowers friction
  → Uses free anonymous credit
  → Signup prompt to continue
  → New user acquires → Loop repeats
```

## Expected Impact

### Metrics to Track
1. **Share Rate**: % of playground runs that result in shares
   - Baseline: Unknown (likely <5%)
   - Target: 15-25% with better UX

2. **Share-to-Click Rate**: CTR on shared links
   - Baseline: ~2-3% (generic links)
   - Target: 8-15% (with OG images)

3. **Click-to-Try Rate**: % of visitors who click "Try This"
   - Target: 30-50% (pre-filled input is huge)

4. **Try-to-Signup Rate**: % who use free credit → signup
   - Target: 10-20%

5. **Viral Coefficient**: New users per existing user
   - Target: > 0.5 (50% viral growth)
   - Breakeven: 1.0 (self-sustaining)

### Business Impact
- **User Acquisition Cost**: Decreases as virality increases
- **Organic Traffic**: Increases from social shares + backlinks
- **Package Discovery**: More eyeballs on quality packages
- **Author Engagement**: Recognition drives more publishing

## Next Steps (Phase 2)

### Quick Wins (1-2 days each)
1. **Add "Share" button in main playground**
   - Currently only on shared results page
   - Add to playground interface after each run
   - "Share this result" → Create share link

2. **Toast notification improvements**
   - Replace `alert('Link copied!')` with nice toast
   - Show preview of what the OG image looks like

3. **Analytics tracking**
   - Track share button clicks (PlayHQ/PostHog)
   - Track "Try This" button clicks
   - Measure conversion funnel

### Medium Impact Features (3-5 days)
4. **Featured Results on Package Pages**
   - Use existing `is_featured_by_author` flag
   - Show curated examples on package detail pages
   - One-click to try each example

5. **Playground Leaderboard**
   - `/playground/leaderboard` page
   - Most tested packages this week
   - Highest rated results
   - Most shared results

6. **Embed Widget**
   - Generate `<iframe>` code for blogs/docs
   - Authors can embed playground in their websites
   - Each embed = backlink + viral spread

### Long-term Features (1-2 weeks)
7. **"Fork This Package" Flow**
   - One-click to duplicate package
   - Edit prompt in web editor
   - Publish under user's namespace
   - **Instant publishers!**

8. **GitHub App Integration**
   - Scan repos for `.cursorrules`, `AGENTS.md`
   - Auto-publish to PRPM (with permission)
   - Add README badge
   - Comment on PRs with installation link

9. **Package Collections Discovery**
   - Playground "challenges" (e.g., "Best TypeScript Rules")
   - Users try multiple packages
   - Gamification elements

## Implementation Details

### Environment Variables Needed
```env
NEXT_PUBLIC_BASE_URL=https://prpm.dev  # For OG image URLs
NEXT_PUBLIC_REGISTRY_URL=https://registry.prpm.dev  # For fetching sessions
```

### API Requirements
- `GET /api/v1/playground/shared/{token}` must be public (no auth)
- Response must include: package_name, conversation, model, view_count, helpful_count

### Testing Checklist
- [ ] OG image renders correctly for different content lengths
- [ ] Metadata appears in Twitter Card Validator
- [ ] LinkedIn preview works
- [ ] "Try This" button pre-fills input correctly
- [ ] Share buttons work on mobile
- [ ] Copy link works in all browsers

### Testing URLs
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/
- Facebook: https://developers.facebook.com/tools/debug/
- Slack: Just paste link in any channel

## Success Criteria

**Phase 1 Success** (4 weeks after deployment):
- Share rate: >10% of playground runs
- Social CTR: >5% on shared links
- "Try This" conversion: >25%
- 100+ new signups attributed to viral loop

**Phase 2 Success** (8 weeks):
- Viral coefficient: >0.7
- 500+ new signups from virality
- 50+ packages featured with curated results
- 10+ authors using embed widgets

## Notes

- All features are additive (no breaking changes)
- Works with existing playground credit system
- Compatible with anonymous free runs
- SEO-friendly (server-side metadata generation)

## Related Files
- OG Image API: `packages/webapp/src/app/api/og/playground/route.tsx`
- Metadata Layout: `packages/webapp/src/app/(app)/playground/shared/layout.tsx`
- Shared Page: `packages/webapp/src/app/(app)/playground/shared/page.tsx`
- Playground API: `packages/registry/src/routes/playground.ts`
- Service: `packages/registry/src/services/playground.ts`

---

**Created:** 2025-01-13
**Status:** Phase 1 Complete ✅
**Next Review:** 2 weeks post-deployment
