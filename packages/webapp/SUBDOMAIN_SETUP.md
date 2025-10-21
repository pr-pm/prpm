# Subdomain Routing Setup

PRPM webapp uses a dual-domain architecture:

- **Main domain** (`prpm.dev`): Landing page, marketing content, login/signup
- **App subdomain** (`app.prpm.dev`): Authenticated app experience (dashboard, search, authors)

## Architecture

### Route Structure

```
/                    → Landing page (marketing)
/login               → Login page
/signup              → Sign up page
/claim               → Username claim page
/claim/[token]       → Claim with invite token

/dashboard           → App: User dashboard
/search              → App: Package search
/authors             → App: Author directory
```

### Middleware Logic

The middleware (`src/middleware.ts`) handles:

1. **Subdomain detection** - Checks if request is from `app.*` subdomain
2. **Route protection** - Redirects app routes to app subdomain in production
3. **Marketing protection** - Redirects marketing pages to main domain if accessed from app subdomain
4. **Localhost passthrough** - Allows all routes on localhost for development

## Local Development

### Option 1: Standard Localhost (Recommended)

Just use `localhost:3001` - middleware allows all routes:

```bash
npm run dev
```

Access:
- Landing: `http://localhost:3001/`
- Dashboard: `http://localhost:3001/dashboard`
- Search: `http://localhost:3001/search`

### Option 2: Subdomain Testing

To test subdomain behavior locally, add to `/etc/hosts`:

```bash
127.0.0.1 prpm.local
127.0.0.1 app.prpm.local
```

Then access:
- Landing: `http://prpm.local:3001/`
- App: `http://app.prpm.local:3001/dashboard`

**Note:** The middleware checks for `localhost` in hostname, so `.local` domains trigger subdomain redirects.

## Production Deployment

### DNS Configuration

Set up DNS records:

```
A     prpm.dev        → <server-ip>
A     www.prpm.dev    → <server-ip>
A     app.prpm.dev    → <server-ip>
```

### Environment Variables

```bash
# Production
NEXT_PUBLIC_APP_DOMAIN=app.prpm.dev
NEXT_PUBLIC_MAIN_DOMAIN=prpm.dev
```

### Authentication Flow

1. User visits `prpm.dev` and clicks "Sign In"
2. User logs in at `prpm.dev/login`
3. After authentication, redirected to `app.prpm.dev/dashboard`
4. All authenticated features accessible at `app.prpm.dev/*`

### Wildcard Subdomains (Future)

To support user-specific subdomains (e.g., `username.prpm.dev`):

```
CNAME *.prpm.dev → prpm.dev
```

Update middleware to handle dynamic subdomain routing.

## Files Modified

- `src/middleware.ts` - Subdomain detection and routing
- `src/app/(app)/layout.tsx` - App navigation wrapper
- `src/app/login/page.tsx` - Login with subdomain redirect
- `src/app/signup/page.tsx` - Signup with subdomain redirect
- `src/app/auth/callback/page.tsx` - OAuth callback with subdomain redirect

## Testing

### Test Landing Page
```bash
curl http://localhost:3001/
# Should return marketing landing page
```

### Test App Routes
```bash
curl http://localhost:3001/dashboard
# Should return dashboard page (in dev)
# In production, would redirect to app.prpm.dev/dashboard
```

### Test Authentication Flow
1. Visit `/login`
2. Enter credentials
3. Observe redirect to `/dashboard` (localhost) or `app.prpm.dev/dashboard` (production)

## Troubleshooting

### Issue: "Cannot GET /dashboard"
- Check that middleware is running: `src/middleware.ts` exists
- Verify app routes are in `src/app/(app)/` directory
- Check Next.js middleware config matcher

### Issue: Infinite redirect loop
- Check hostname detection logic in middleware
- Ensure localhost check is working: `hostname.includes('localhost')`
- Verify subdomain regex: `/^app\./`

### Issue: Authentication redirect fails
- Check window.location.hostname in browser console
- Verify returnTo path is valid
- Check localStorage for `prpm_return_to` key

## Future Enhancements

- [ ] User-specific subdomains (`username.prpm.dev`)
- [ ] API subdomain (`api.prpm.dev`)
- [ ] CDN subdomain (`cdn.prpm.dev`)
- [ ] Staging environments (`app.staging.prpm.dev`)
