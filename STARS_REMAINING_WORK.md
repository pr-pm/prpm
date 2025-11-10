# Stars Implementation - Remaining Work

## Completed ✅
- Database migration for `package_stars` table
- Backend API endpoints:
  - POST `/api/v1/packages/:packageId/star` - Star/unstar packages
  - POST `/api/v1/collections/:scope/:nameSlug/star` - Star/unstar collections (already existed)
  - GET `/api/v1/packages/starred` - Get user's starred packages
  - GET `/api/v1/collections/starred` - Get user's starred collections
- Frontend API client functions in `packages/webapp/src/lib/api.ts`
- Reusable `StarButton` component in `packages/webapp/src/components/StarButton.tsx`

## Remaining Work 🚧

### 1. Add StarButton to Package Pages
**File**: `packages/webapp/src/app/packages/[author]/[...package]/page.tsx`

Add the StarButton component to the package stats section (around line 254-288):

```tsx
import StarButton from '@/components/StarButton'

// In the stats section, after weekly_downloads:
<StarButton
  type="package"
  id={pkg.id}
  initialStarred={false} // TODO: Check if user has starred this
  initialStars={pkg.stars || 0}
/>
```

**Note**: Need to fetch user's star status. Options:
1. Add to SSG data with optional auth
2. Fetch client-side on mount
3. Add to dynamic package fetch

### 2. Add StarButton to Collection Pages
**File**: `packages/webapp/src/app/collections/[slug]/page.tsx`

Replace the static star display (line 217-224) with:

```tsx
import StarButton from '@/components/StarButton'

<StarButton
  type="collection"
  id={collection.id}
  scope={collection.scope}
  nameSlug={collection.name_slug}
  initialStarred={false} // TODO: Check if user has starred
  initialStars={collection.stars || 0}
/>
```

### 3. Create Starred Items Page
**File**: `packages/webapp/src/app/(app)/starred/page.tsx` (NEW)

Create a page to show all starred packages and collections:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getStarredPackages, getStarredCollections } from '@/lib/api'
// Show tabs for Packages vs Collections
// Display cards with star counts
// Link to package/collection pages
```

Add navigation link in the header/sidebar to access `/starred`

### 4. CLI Commands for Starred Items
**File**: `packages/cli/src/commands/starred.ts` (NEW)

Create new CLI command:

```bash
prpm starred                    # List all starred items
prpm starred --packages         # Only packages
prpm starred --collections      # Only collections
prpm starred --format cursor    # Filter by format
```

Implementation:
1. Create `packages/cli/src/commands/starred.ts`
2. Use registry client to call `/api/v1/packages/starred` and `/api/v1/collections/starred`
3. Format output similar to `prpm search` or `prpm list`
4. Register command in `packages/cli/src/index.ts`

**File**: `packages/cli/src/commands/index.ts`
- Export the new starred command

**File**: `packages/cli/src/index.ts`
- Add command registration: `.command('starred', 'List your starred packages and collections', ...)`

### 5. Check User Star Status
Currently StarButton uses `initialStarred={false}` hardcoded. Need to:

**Option A - Add to package/collection queries**:
Modify backend queries to include `user_has_starred` when authenticated:

```sql
-- In packages query with optional user_id:
LEFT JOIN package_stars ps ON ps.package_id = p.id AND ps.user_id = $user_id
-- Return ps.package_id IS NOT NULL as user_has_starred
```

**Option B - Separate endpoint**:
Create `GET /api/v1/packages/:id/star-status` that returns `{ starred: boolean }`

**Option C - Client-side check**:
Fetch starred list on page load and check if current item is in it

### 6. Add to Package/Collection Types
**File**: `packages/types/src/package.ts` and `collections.ts`

Add optional field:
```typescript
export interface Package {
  // ... existing fields
  user_has_starred?: boolean
}
```

### 7. Update Search Results
Add star buttons to search result cards:
- `packages/webapp/src/components/SharedResults.tsx`
- `packages/webapp/src/components/FeaturedResults.tsx`
- `packages/webapp/src/app/(app)/search/page.tsx`

### 8. Analytics/Telemetry
Consider tracking:
- Star/unstar events for popular packages
- Most starred packages over time
- User engagement with stars

### 9. Testing
- Test database migration runs cleanly
- Test API endpoints with authentication
- Test star counts update correctly via triggers
- Test UI star/unstar flow
- Test CLI commands
- Test edge cases (starring twice, unstarring not-starred, etc.)

## Nice-to-Have Enhancements 💡

1. **Email notifications** - Notify package authors when someone stars their package
2. **Star history** - Track when items were starred
3. **Export starred list** - Download as JSON/CSV
4. **Star from CLI** - `prpm star @author/package`
5. **Trending by stars** - Sort search results by recent star growth
6. **Star badges** - Show "100 stars" badge on package cards
7. **Social sharing** - "Share your starred packages" feature

## Migration
Run the migration before deploying:
```bash
cd packages/registry
npm run migrate
```
