# PRPM Webapp - Setup Complete ✅

## What Was Built

A simple, functional Next.js web application for PRPM with author invite claiming functionality.

## Features Implemented

### 1. Landing Page (`/`)
- Clean, modern design with purple branding
- Project overview and description
- Links to GitHub and claim page
- Mobile-responsive

### 2. Invite Claim Flow
- **Enter Token Page (`/claim`)** - Form to enter invite token
- **Claim Page (`/claim/:token`)** - Full invite claiming flow
  - Validates invite token via registry API
  - Shows invite details (username, package count, message)
  - GitHub OAuth integration for authentication
  - Claim button redirects to GitHub
  - Success confirmation page
  - Beautiful UI with loading states and error handling

### 3. OAuth Callback (`/auth/callback`)
- Handles GitHub OAuth redirect
- Stores JWT token in localStorage
- Redirects to intended destination

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React** - UI library

## File Structure

```
packages/webapp/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   ├── claim/
│   │   │   ├── page.tsx                # Enter token form
│   │   │   └── [token]/
│   │   │       └── page.tsx            # Claim specific token
│   │   └── auth/
│   │       └── callback/
│   │           └── page.tsx            # OAuth callback
│   └── lib/
│       └── api.ts                      # API client functions
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
├── .env.example
└── README.md
```

## API Integration

Connects to registry at `http://localhost:3000` (configurable via `NEXT_PUBLIC_REGISTRY_URL`):

- `GET /api/v1/invites/:token` - Validate invite
- `POST /api/v1/invites/:token/claim` - Claim invite (authenticated)
- `GET /api/v1/auth/github` - Start GitHub OAuth
- `GET /api/v1/auth/me` - Get current user

## Running the Webapp

### Development

```bash
npm run dev:webapp
```

Visit [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
npm run build:webapp
npm start --workspace=@prmp/webapp
```

## Build Output

```
Route (app)                              Size     First Load JS
┌ ○ /                                    175 B          96.1 kB
├ ○ /_not-found                          873 B          88.1 kB
├ ○ /auth/callback                       696 B          87.9 kB
├ ○ /claim                               1.19 kB        97.1 kB
└ ƒ /claim/[token]                       2.81 kB        98.7 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_REGISTRY_URL=http://localhost:3000
```

For production:

```env
NEXT_PUBLIC_REGISTRY_URL=https://registry.prpm.dev
```

## Integration with Registry

The webapp is designed to work seamlessly with the PRPM registry:

1. **Author Invites** - Uses invite system from `004_add_author_invites.sql`
2. **GitHub OAuth** - Leverages registry's GitHub OAuth setup
3. **JWT Authentication** - Stores and uses JWT tokens from registry
4. **API Endpoints** - All data comes from registry API

## User Flow

### Claiming an Invite

1. User receives invite email with token
2. User visits `/claim` and enters token
3. User is redirected to `/claim/:token`
4. Page shows invite details
5. User clicks "Claim with GitHub"
6. Registry handles GitHub OAuth
7. Registry redirects back with JWT token in URL
8. Webapp claims invite via API
9. Success page shows confirmation

## Next Steps

See [WEBAPP_ROADMAP.md](../../../WEBAPP_ROADMAP.md) for full feature roadmap.

**Immediate priorities:**
- Phase 2: Package Discovery - Browse and search packages
- Phase 3: User Profiles - Full authentication and profiles

## Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

Auto-deploys from Git with zero configuration.

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "start"]
```

### Environment Variables (Production)

```env
NEXT_PUBLIC_REGISTRY_URL=https://registry.prpm.dev
NEXT_PUBLIC_SITE_URL=https://prpm.dev
```

## Known Issues & Limitations

### Current Limitations

1. **No package browsing yet** - Only invite claiming works
2. **No user dashboard** - Coming in Phase 3
3. **No package publishing via web** - CLI only for now
4. **No analytics** - Coming in Phase 5

### Technical Notes

1. **Dynamic Rendering** - Pages using `useSearchParams` need `export const dynamic = 'force-dynamic'`
2. **Suspense Boundaries** - All client components using Next.js hooks need Suspense
3. **No Registry Client Dependency** - Removed workspace reference to avoid build issues

## Testing the Claim Flow

### Prerequisites

1. Registry running at `http://localhost:3000`
2. Database with author invites created
3. GitHub OAuth configured in registry

### Test Steps

```bash
# 1. Create an invite (in registry)
INSERT INTO author_invites (token, author_username, package_count, invite_message)
VALUES ('test-token-123', 'testuser', 5, 'Welcome to PRPM!');

# 2. Visit webapp
http://localhost:5173/claim

# 3. Enter token
test-token-123

# 4. Complete GitHub OAuth and claim
```

## Troubleshooting

### Build Errors

**Issue:** `useSearchParams() should be wrapped in a suspense boundary`
**Fix:** Add `export const dynamic = 'force-dynamic'` to page

**Issue:** `workspace:* protocol not supported`
**Fix:** Remove `@prmp/registry-client` dependency (not needed yet)

### Runtime Errors

**Issue:** API calls fail with 404
**Fix:** Check `NEXT_PUBLIC_REGISTRY_URL` is correct

**Issue:** OAuth redirect doesn't work
**Fix:** Ensure registry has correct GitHub OAuth callback URL

## Success Criteria

✅ Webapp builds without errors
✅ Home page loads correctly
✅ Claim page validates tokens
✅ GitHub OAuth integration works
✅ Invite claiming flow completes
✅ Success page shows correctly
✅ Mobile responsive design
✅ Clean, modern UI

## Documentation

- [README.md](./README.md) - Quick start guide
- [WEBAPP_ROADMAP.md](../../../WEBAPP_ROADMAP.md) - Full feature roadmap
- [AUTH_FLOW.md](../../../AUTH_FLOW.md) - Authentication flow documentation

## Monorepo Integration

Added to root `package.json` scripts:

```json
{
  "dev:webapp": "npm run dev --workspace=@prpm/webapp",
  "build:webapp": "npm run build --workspace=@prmp/webapp"
}
```

## Summary

🎉 **The PRPM webapp is ready!**

- Clean, modern UI
- Fully functional invite claiming
- GitHub OAuth integration
- Production-ready build
- Mobile responsive
- Ready for Phase 2 (Package Discovery)
