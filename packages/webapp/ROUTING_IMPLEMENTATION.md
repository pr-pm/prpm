# PRPM Webapp Routing Implementation

## Overview

Successfully implemented a dual-domain architecture for PRPM webapp:

- **Main Domain** (`prpm.dev`): Marketing landing page, authentication flows
- **App Subdomain** (`app.prpm.dev`): Authenticated application experience

## Changes Made

### 1. Route Restructuring

Created Next.js route groups to separate concerns:

```
src/app/
├── (app)/                    # App subdomain routes (route group - no URL segment)
│   ├── layout.tsx           # App navigation wrapper
│   ├── dashboard/           # User dashboard
│   ├── search/              # Package search
│   └── authors/             # Author directory
├── page.tsx                 # Landing page (root /)
├── login/                   # Login page
├── signup/                  # Signup page
├── claim/                   # Username claiming
└── auth/                    # OAuth callbacks
```

**Route Group Benefits:**
- `(app)` directory doesn't add `/app` to URLs
- Allows shared layout for app pages
- Clean separation of marketing vs app routes

### 2. Middleware for Subdomain Routing

**File:** `src/middleware.ts`

**Logic:**
1. Detects if request is from `app.*` subdomain
2. In production:
   - App routes (`/dashboard`, `/search`, `/authors`) → redirect to `app.prpm.dev`
   - Marketing routes on app subdomain → redirect to main `prpm.dev`
3. In localhost:
   - All routes accessible without redirects (easier development)

**Hostname Detection:**
```typescript
const isAppSubdomain = hostParts[0] === 'app'
const isLocalhost = hostname.includes('localhost')
```

### 3. Authentication Flow Updates

Updated three authentication entry points to redirect to app subdomain:

**Files Modified:**
- `src/app/login/page.tsx` - Email/password + GitHub OAuth login
- `src/app/signup/page.tsx` - Registration
- `src/app/auth/callback/page.tsx` - OAuth callback handler

**Redirect Logic:**
```typescript
const hostname = window.location.hostname

if (!hostname.includes('localhost') && !hostname.startsWith('app.')) {
  const appHostname = hostname.replace(/^(www\.)?/, 'app.')
  window.location.href = `${window.location.protocol}//${appHostname}${returnTo}`
} else {
  router.push(returnTo) // Localhost or already on app subdomain
}
```

### 4. App Layout with Navigation

**File:** `src/app/(app)/layout.tsx`

Provides:
- Sticky navigation bar with PRPM branding
- Quick links: Search, Authors, Dashboard
- GitHub link
- Account menu placeholder
- Consistent max-width container

Applied to all routes in `(app)` directory automatically.

## URL Structure

### Marketing Domain (`prpm.dev`)

| Route | Purpose |
|-------|---------|
| `/` | Landing page with hero, features, CLI examples |
| `/login` | Email/password + GitHub OAuth login |
| `/signup` | Account registration |
| `/claim` | Username claim flow |
| `/claim/[token]` | Invite-based username claiming |

### App Subdomain (`app.prpm.dev`)

| Route | Purpose |
|-------|---------|
| `/dashboard` | User dashboard, package management |
| `/search` | Package search and discovery |
| `/authors` | Author directory and profiles |

### Shared Routes (accessible on both)

| Route | Purpose |
|-------|---------|
| `/auth/callback` | OAuth callback (GitHub) |

## Development Workflow

### Local Development (Recommended)

```bash
npm run dev
```

Access at `http://localhost:3001`:
- Landing: `http://localhost:3001/`
- Dashboard: `http://localhost:3001/dashboard`
- Search: `http://localhost:3001/search`

All routes work without subdomain setup. Middleware allows passthrough for localhost.

### Testing Subdomain Behavior Locally

Add to `/etc/hosts`:
```
127.0.0.1 prpm.local
127.0.0.1 app.prpm.local
```

Then access:
- Marketing: `http://prpm.local:3001/`
- App: `http://app.prpm.local:3001/dashboard`

Middleware will enforce subdomain redirects (since hostname doesn't contain "localhost").

## Production Deployment

### DNS Setup

Configure three A records pointing to your server:

```
A     prpm.dev        → <server-ip>
A     www.prpm.dev    → <server-ip>
A     app.prpm.dev    → <server-ip>
```

### Environment Variables

```bash
# Next.js
NODE_ENV=production
NEXT_PUBLIC_REGISTRY_URL=https://api.prpm.dev

# Optional: explicit domain config
NEXT_PUBLIC_MAIN_DOMAIN=prpm.dev
NEXT_PUBLIC_APP_DOMAIN=app.prpm.dev
```

### User Journey (Production)

1. **Discovery:** User visits `https://prpm.dev`
2. **Registration:** Clicks "Sign Up" → `https://prpm.dev/signup`
3. **Authentication:** Completes signup with email or GitHub OAuth
4. **Redirect:** Automatically redirected to `https://app.prpm.dev/dashboard`
5. **App Usage:** All authenticated features at `https://app.prpm.dev/*`

## Benefits of This Architecture

### 1. Clear Separation of Concerns
- Marketing content doesn't clutter app namespace
- App routes get dedicated subdomain
- Easier to track analytics (GA4 can differentiate subdomains)

### 2. Performance
- Can cache marketing and app content differently
- App subdomain can have stricter CSP headers
- Marketing pages can be statically generated

### 3. Security
- App subdomain can require authentication at CDN level (future)
- Separate cookie domains possible
- Rate limiting can differ between marketing and app

### 4. Scalability
- App and marketing can scale independently
- Can serve from different regions/CDNs
- Future: user-specific subdomains (`username.prpm.dev`)

### 5. Developer Experience
- Localhost works seamlessly (no subdomain setup required)
- Route groups keep file structure clean
- Single Next.js app (no need for separate projects)

## Technical Details

### Next.js Route Groups

Using `(app)` as a route group:
- Parentheses indicate route group (not a URL segment)
- Allows shared layouts without affecting URLs
- `src/app/(app)/dashboard/page.tsx` → `/dashboard` (not `/app/dashboard`)

### Middleware Configuration

```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

Runs on all routes except:
- API routes (`/api/*`)
- Static files (`/_next/static/*`)
- Image optimization (`/_next/image/*`)
- Favicon

### Future Enhancements

**Planned:**
- [ ] User-specific subdomains (`@username.prpm.dev`)
- [ ] API subdomain (`api.prpm.dev`) with CORS config
- [ ] CDN subdomain (`cdn.prpm.dev`) for assets
- [ ] Staging environment (`app.staging.prpm.dev`)
- [ ] Admin panel (`admin.prpm.dev`)

**Possible:**
- Internationalization subdomains (`fr.prpm.dev`)
- Documentation site (`docs.prpm.dev`)
- Status page (`status.prpm.dev`)

## Testing Checklist

- [x] Landing page loads at `/`
- [x] Login redirects to `/dashboard` after auth
- [x] Signup redirects to `/dashboard` after registration
- [x] OAuth callback redirects to `/dashboard`
- [x] App routes (`/dashboard`, `/search`, `/authors`) accessible
- [x] App layout wraps all app routes
- [x] Middleware doesn't break localhost development
- [ ] Production subdomain redirects work (requires DNS setup)
- [ ] Cross-subdomain authentication persists (requires cookie config)

## Files Summary

**New Files:**
- `src/middleware.ts` - Subdomain routing logic
- `src/app/(app)/layout.tsx` - App navigation wrapper
- `SUBDOMAIN_SETUP.md` - Developer setup guide
- `ROUTING_IMPLEMENTATION.md` - This document

**Modified Files:**
- `src/app/login/page.tsx` - Added subdomain redirect after login
- `src/app/signup/page.tsx` - Added subdomain redirect after signup
- `src/app/auth/callback/page.tsx` - Added subdomain redirect after OAuth

**Moved Files:**
- `src/app/dashboard/` → `src/app/(app)/dashboard/`
- `src/app/search/` → `src/app/(app)/search/`
- `src/app/authors/` → `src/app/(app)/authors/`

**Unchanged:**
- `src/app/page.tsx` - Landing page (already perfect)
- `src/app/layout.tsx` - Root layout
- `src/app/claim/` - Username claim pages
- `src/lib/api.ts` - API client

## Rollback Plan

If issues arise, rollback is straightforward:

1. Delete `src/middleware.ts`
2. Move files back: `(app)/*` → `app/root`
3. Remove subdomain redirect logic from auth files
4. Redeploy

Or keep structure and disable middleware redirects by updating matcher to `matcher: []`.
