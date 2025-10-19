# PRPM Web Application - Complete Roadmap

## Phase 1: MVP - Author Claims (✅ COMPLETED)

**Goal:** Allow invited authors to claim their verified usernames

### Features Implemented
- ✅ Landing page with project overview
- ✅ Invite token validation
- ✅ GitHub OAuth integration
- ✅ Author invite claiming flow
- ✅ Success confirmation page
- ✅ Responsive Tailwind UI

### Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Registry API integration

---

## Phase 2: Package Discovery (Next Priority)

**Goal:** Browse and search packages in the registry

### 2.1 Package List & Search
- [ ] Package listing page with pagination
- [ ] Search functionality (by name, tags, type)
- [ ] Filter by package type (cursor, claude, continue, windsurf)
- [ ] Sort options (downloads, stars, recent)
- [ ] Tag-based filtering

### 2.2 Package Details
- [ ] Individual package page (`/packages/:id`)
- [ ] Package metadata display
  - Name, version, description
  - Author with verified badge
  - Download count, stars
  - Tags, category
- [ ] README rendering (Markdown)
- [ ] Version history
- [ ] Installation instructions
- [ ] Download button

### 2.3 Collections
- [ ] Collections listing page (`/collections`)
- [ ] Collection details page
- [ ] Package list within collection
- [ ] Installation instructions for collections

### Components to Build
```
components/
├── PackageCard.tsx          # Package preview card
├── PackageList.tsx          # Paginated list
├── SearchBar.tsx            # Search input with filters
├── FilterSidebar.tsx        # Filter controls
├── MarkdownRenderer.tsx     # README display
├── VersionSelector.tsx      # Version dropdown
└── InstallCommand.tsx       # Copy-to-clipboard install command
```

---

## Phase 3: User Profiles & Authentication

**Goal:** Full user accounts and profiles

### 3.1 User Authentication
- [ ] Login page (`/login`)
- [ ] Logout functionality
- [ ] Auth state management (Context/Zustand)
- [ ] Protected routes
- [ ] Session persistence

### 3.2 User Profiles
- [ ] Public profile page (`/users/:username`)
- [ ] Profile information
  - Avatar, bio, GitHub link
  - Verified author badge
  - Package count, total downloads
- [ ] User's published packages
- [ ] User's collections

### 3.3 User Dashboard
- [ ] Private dashboard (`/dashboard`)
- [ ] My packages overview
- [ ] Analytics summary
- [ ] Quick actions (publish, create collection)

### Components to Build
```
components/
├── AuthProvider.tsx         # Auth context
├── UserAvatar.tsx          # Avatar component
├── VerifiedBadge.tsx       # Verified author badge
├── ProfileCard.tsx         # Profile summary
└── DashboardStats.tsx      # Stats widgets
```

---

## Phase 4: Package Management

**Goal:** Allow authors to manage their packages via web

### 4.1 Package Publishing
- [ ] Publish package page (`/publish`)
- [ ] Form for package manifest
  - Name, version, description
  - Type, tags, category
- [ ] File upload (tarball or individual files)
- [ ] Validation and preview
- [ ] Publish confirmation

### 4.2 Package Editing
- [ ] Edit package page (`/packages/:id/edit`)
- [ ] Update description, tags
- [ ] Publish new version
- [ ] Deprecate versions
- [ ] Delete package (with confirmation)

### 4.3 Collection Management
- [ ] Create collection page (`/collections/new`)
- [ ] Edit collection
- [ ] Add/remove packages
- [ ] Set installation order
- [ ] Mark packages as required/optional

### Components to Build
```
components/
├── PackageForm.tsx         # Package manifest form
├── FileUploader.tsx        # Drag-drop file upload
├── VersionPublisher.tsx    # New version form
├── CollectionEditor.tsx    # Collection package list editor
└── ConfirmDialog.tsx       # Confirmation modals
```

---

## Phase 5: Analytics & Insights

**Goal:** Provide download and usage analytics

### 5.1 Package Analytics
- [ ] Analytics page (`/packages/:id/analytics`)
- [ ] Download charts (daily, weekly, monthly)
- [ ] Version distribution
- [ ] Geographic distribution
- [ ] Referrer sources

### 5.2 Author Analytics
- [ ] Author analytics page (`/dashboard/analytics`)
- [ ] Total downloads across all packages
- [ ] Top packages by downloads
- [ ] Growth trends
- [ ] Download heatmap

### 5.3 Global Stats
- [ ] Public stats page (`/stats`)
- [ ] Total packages, downloads, authors
- [ ] Trending packages
- [ ] Popular tags
- [ ] Activity timeline

### Components to Build
```
components/
├── DownloadChart.tsx       # Chart.js/Recharts integration
├── GeoMap.tsx             # Geographic distribution
├── StatsCard.tsx          # Stat display widget
├── TrendIndicator.tsx     # Growth indicator
└── ActivityFeed.tsx       # Recent activity list
```

### Libraries to Add
- `recharts` or `chart.js` - Charts
- `react-map-gl` - Geographic maps (optional)

---

## Phase 6: Social Features

**Goal:** Community engagement and interaction

### 6.1 Stars & Favorites
- [ ] Star packages
- [ ] View starred packages (`/dashboard/starred`)
- [ ] Star count display
- [ ] Popular packages by stars

### 6.2 Comments & Reviews
- [ ] Comment on packages
- [ ] Reply to comments
- [ ] Markdown support
- [ ] Moderation tools

### 6.3 Following
- [ ] Follow authors
- [ ] Following feed (`/dashboard/feed`)
- [ ] Notifications for new packages from followed authors

### Components to Build
```
components/
├── StarButton.tsx         # Star/unstar button
├── CommentList.tsx        # Comments display
├── CommentForm.tsx        # Add comment form
├── FollowButton.tsx       # Follow/unfollow button
└── NotificationBell.tsx   # Notification icon
```

---

## Phase 7: Advanced Features

**Goal:** Power user features and integrations

### 7.1 Package Dependencies
- [ ] Dependency graph visualization
- [ ] Dependency tree
- [ ] Update notifications for dependencies
- [ ] Compatibility checker

### 7.2 CLI Integration
- [ ] Generate CLI commands
- [ ] One-click install links
- [ ] VSCode extension deep links
- [ ] Cursor IDE integration

### 7.3 API Keys & Webhooks
- [ ] API key management (`/dashboard/api-keys`)
- [ ] Generate/revoke API tokens
- [ ] Webhook configuration
- [ ] Webhook logs

### 7.4 Teams & Organizations
- [ ] Organization pages (`/orgs/:name`)
- [ ] Team package management
- [ ] Member roles and permissions
- [ ] Shared package namespaces

### Components to Build
```
components/
├── DependencyGraph.tsx    # D3.js graph visualization
├── APIKeyManager.tsx      # API key CRUD
├── WebhookForm.tsx        # Webhook configuration
└── TeamManager.tsx        # Team member management
```

---

## Phase 8: Documentation & Help

**Goal:** Comprehensive documentation and support

### 8.1 Documentation Site
- [ ] Getting started guide
- [ ] CLI documentation
- [ ] API reference
- [ ] Package publishing guide
- [ ] Best practices

### 8.2 Help Center
- [ ] FAQ page
- [ ] Troubleshooting guides
- [ ] Video tutorials
- [ ] Support contact form

### 8.3 Blog
- [ ] Blog listing (`/blog`)
- [ ] Blog post page
- [ ] Announcements
- [ ] Community highlights

### Pages to Build
```
app/
├── docs/
│   ├── getting-started/page.tsx
│   ├── cli/page.tsx
│   ├── api/page.tsx
│   └── publishing/page.tsx
├── help/
│   ├── faq/page.tsx
│   └── contact/page.tsx
└── blog/
    ├── page.tsx
    └── [slug]/page.tsx
```

---

## Technical Enhancements

### Performance
- [ ] Image optimization (next/image)
- [ ] Static generation for package pages (ISR)
- [ ] Edge caching (Vercel Edge)
- [ ] Code splitting
- [ ] Lazy loading

### SEO
- [ ] Dynamic meta tags
- [ ] OpenGraph tags
- [ ] Twitter cards
- [ ] Sitemap generation
- [ ] robots.txt

### Accessibility
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast compliance
- [ ] Focus management

### Internationalization
- [ ] i18n setup (next-intl)
- [ ] Language switcher
- [ ] Translated content
- [ ] RTL support

### Testing
- [ ] Unit tests (Jest)
- [ ] Component tests (React Testing Library)
- [ ] E2E tests (Playwright)
- [ ] Visual regression tests

---

## Design System

### Core Components Library
```
components/ui/
├── Button.tsx             # Primary, secondary, ghost, danger
├── Input.tsx              # Text, email, password, textarea
├── Select.tsx             # Dropdown select
├── Checkbox.tsx           # Checkbox input
├── Radio.tsx              # Radio input
├── Switch.tsx             # Toggle switch
├── Badge.tsx              # Status badges
├── Card.tsx               # Content card
├── Modal.tsx              # Dialog/modal
├── Toast.tsx              # Notifications
├── Tooltip.tsx            # Hover tooltips
├── Tabs.tsx               # Tab navigation
├── Dropdown.tsx           # Dropdown menu
├── Pagination.tsx         # Pagination controls
├── Spinner.tsx            # Loading spinner
└── Progress.tsx           # Progress bar
```

### Layout Components
```
components/layout/
├── Header.tsx             # Top navigation
├── Footer.tsx             # Site footer
├── Sidebar.tsx            # Side navigation
├── Container.tsx          # Content container
└── PageHeader.tsx         # Page title section
```

---

## Technology Additions by Phase

### Phase 2 (Package Discovery)
- `@tanstack/react-query` - Data fetching
- `react-markdown` - Markdown rendering
- `react-syntax-highlighter` - Code highlighting

### Phase 3 (Auth & Profiles)
- `zustand` or `jotai` - State management
- `react-hook-form` - Form handling
- `zod` - Validation

### Phase 5 (Analytics)
- `recharts` - Charts
- `date-fns` - Date formatting
- `react-map-gl` - Maps (optional)

### Phase 6 (Social)
- `@tiptap/react` - Rich text editor
- `react-timeago` - Relative timestamps

### Phase 7 (Advanced)
- `d3` - Graph visualization
- `react-flow` - Dependency graphs

---

## Deployment Strategy

### Development
```bash
npm run dev          # Local development (localhost:5173)
```

### Preview Deployments
- Every PR gets preview deployment on Vercel
- Automatic branch previews

### Production
```bash
npm run build        # Build for production
npm start            # Start production server
```

**Hosting Options:**
1. **Vercel** (Recommended)
   - Zero-config deployment
   - Automatic SSL
   - Edge functions
   - Analytics

2. **Netlify**
   - Easy setup
   - Good DX
   - Form handling

3. **Self-hosted (Docker)**
   - Full control
   - Custom infrastructure
   - Cost-effective at scale

---

## Environment Variables

### Development
```env
NEXT_PUBLIC_REGISTRY_URL=http://localhost:3000
```

### Production
```env
NEXT_PUBLIC_REGISTRY_URL=https://registry.prpm.dev
NEXT_PUBLIC_SITE_URL=https://prpm.dev
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX          # Google Analytics
NEXT_PUBLIC_SENTRY_DSN=https://...       # Error tracking
```

---

## Database Considerations

The webapp is **read-heavy** and mostly uses the registry API. For some features, we may want to add:

### Caching Layer
- Redis for API response caching
- Reduce load on registry
- Faster page loads

### User Preferences
Option 1: Store in registry database (extend users table)
Option 2: Separate webapp database for UI preferences

**Recommendation:** Use registry database to keep architecture simple.

---

## Monitoring & Observability

### Analytics
- **Plausible** or **Google Analytics** - Page views
- **PostHog** - Product analytics
- Custom events for key actions

### Error Tracking
- **Sentry** - Error monitoring
- Source maps for production debugging

### Performance
- **Vercel Analytics** - Web vitals
- **Lighthouse CI** - Performance regression

---

## Timeline Estimates

| Phase | Scope | Time Estimate | Priority |
|-------|-------|---------------|----------|
| Phase 1 | Author Claims | ✅ Done | High |
| Phase 2 | Package Discovery | 2-3 weeks | High |
| Phase 3 | Auth & Profiles | 2 weeks | High |
| Phase 4 | Package Management | 3 weeks | Medium |
| Phase 5 | Analytics | 2 weeks | Medium |
| Phase 6 | Social Features | 2-3 weeks | Low |
| Phase 7 | Advanced Features | 3-4 weeks | Low |
| Phase 8 | Documentation | Ongoing | Medium |

**Total Estimated Time:** 14-18 weeks for full feature set

**Recommended Approach:**
- Ship Phase 1 (Done ✅)
- Ship Phase 2 ASAP (package browsing is critical)
- Iterate based on user feedback
- Prioritize features that drive engagement

---

## Success Metrics

### Phase 2 (Discovery)
- Package page views
- Search usage
- Time on package pages
- Install button clicks

### Phase 3 (Profiles)
- User registrations
- Login frequency
- Profile views

### Phase 4 (Management)
- Packages published via web
- Package edits
- Collections created

### Phase 5 (Analytics)
- Analytics page views
- Time in analytics
- Export usage

### Phase 6 (Social)
- Stars per package
- Comments per package
- Follow actions

---

## Open Questions

1. **Do we want a separate analytics dashboard?**
   - Option A: Integrated into package pages
   - Option B: Dedicated analytics app
   - **Recommendation:** Start with Option A

2. **Should packages have ratings/reviews?**
   - Pros: Quality signal, user feedback
   - Cons: Moderation overhead, potential abuse
   - **Recommendation:** Start with stars only, add reviews later

3. **Team/Org features priority?**
   - Many packages from individual authors
   - May not need immediately
   - **Recommendation:** Phase 7 (later)

4. **Monetization?**
   - All packages free (like npm)
   - Premium features for authors?
   - Sponsorships?
   - **Recommendation:** Keep free, revisit later

---

## Quick Start (Current MVP)

```bash
# Install dependencies
cd packages/webapp
npm install

# Run development server
npm run dev

# Visit http://localhost:5173
```

**Current Routes:**
- `/` - Home page
- `/claim` - Enter invite token
- `/claim/:token` - Claim specific token
- `/auth/callback` - OAuth callback

**Next Steps:**
- Start Phase 2 (Package Discovery)
- Build package listing page
- Implement search functionality
