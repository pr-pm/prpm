# PostHog Implementation Plan - Proper User Identification

**Goal**: Ensure all CLI and web app events are properly tracked with user identification so they appear correctly in PostHog dashboard.

---

## 🔍 **Current Issues**

### **1. CLI User Identification** ❌
**Problem**: CLI telemetry uses `sessionId` or `userId` from telemetry config, but doesn't persist the actual user ID from login.

**Current Code** (`packages/cli/src/core/telemetry.ts:174`):
```typescript
const distinctId = this.config.userId || this.config.sessionId || 'anonymous';
```

**Issue**: `this.config.userId` is never set, so all events use random sessionId → can't track users across sessions.

---

### **2. Web App Tracking** ❌
**Problem**: No PostHog client-side tracking at all in the web app.

**Current State**: Zero PostHog integration in `packages/webapp/`.

---

### **3. User Identification ($identify)** ❌
**Problem**: Neither CLI nor web app call PostHog's `$identify` to set user properties.

**Impact**: Can't see user metadata (email, username, verified_author, etc.) in PostHog dashboard.

---

## ✅ **Solution**

### **Phase 1: Fix CLI User Identification**

#### **1.1 Extract user_id from JWT on login**

**File**: `packages/cli/src/commands/login.ts`

```typescript
import jwt from 'jsonwebtoken';

// After successful login (line 270):
const decoded = jwt.decode(result.token) as {
  user_id: string;
  username: string;
  email: string;
  is_admin: boolean;
};

await saveConfig({
  ...config,
  token: result.token,
  username: result.username,
  userId: decoded.user_id,  // ✅ Add this
  email: decoded.email,      // ✅ Add this for $identify
});
```

---

#### **1.2 Update telemetry to use real user_id**

**File**: `packages/cli/src/core/telemetry.ts`

**Change 1**: Load userId from config
```typescript
private loadConfig(): TelemetryConfig {
  try {
    const data = require(this.configPath);
    return {
      enabled: data.enabled ?? true,
      userId: data.userId,  // ✅ Now properly loaded
      sessionId: data.sessionId || this.generateSessionId(),
    };
  } catch {
    return {
      enabled: true,
      sessionId: this.generateSessionId(),
    };
  }
}
```

**Change 2**: Add $identify call
```typescript
async identifyUser(userId: string, traits: Record<string, any>): Promise<void> {
  if (!this.posthog || !this.config.enabled) return;

  try {
    this.posthog.identify({
      distinctId: userId,
      properties: traits,
    });

    this.posthog.capture({
      distinctId: userId,
      event: '$identify',
      properties: traits,
    });
  } catch (error) {
    // Silently fail
  }
}
```

---

#### **1.3 Call $identify after login**

**File**: `packages/cli/src/commands/login.ts`

```typescript
// After saving config (line 275):
await telemetry.identifyUser(decoded.user_id, {
  username: result.username,
  email: decoded.email,
  cli_version: process.env.npm_package_version,
  platform: process.platform,
  first_login: new Date().toISOString(),
});

console.log('✅ Successfully logged in!\n');
```

---

### **Phase 2: Add Web App Tracking**

#### **2.1 Install PostHog React**

```bash
cd packages/webapp
npm install posthog-js
```

---

#### **2.2 Create PostHog provider**

**File**: `packages/webapp/src/providers/PostHogProvider.tsx`

```typescript
'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.opt_out_capturing(); // Disable in dev
      }
    },
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // Identify user
      posthog.identify(user.id, {
        username: user.username,
        email: user.email,
        verified_author: user.verified_author,
        prpm_plus_status: user.prpm_plus_status,
      });
    } else if (!user) {
      // Reset on logout
      posthog.reset();
    }
  }, [user]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

---

#### **2.3 Wrap app in provider**

**File**: `packages/webapp/src/app/layout.tsx`

```typescript
import { PostHogProvider } from '@/providers/PostHogProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
```

---

#### **2.4 Add environment variables**

**File**: `packages/webapp/.env.local`

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_aO5lXLILeylHfb1ynszVwKbQKSzO91UGdXNhN5Q0Snl
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

### **Phase 3: Track Key Events**

#### **3.1 CLI Events to Track**

**Already tracked** ✅:
- `prpm_install` - Package installation
- `prpm_search` - Search queries
- `prpm_playground` - Playground usage
- `prpm_login` - Login events

**Need to add** ⚠️:
- `prpm_publish` - Package publishing
- `prpm_init` - Project initialization
- `prpm_uninstall` - Package removal
- `prpm_update` - Package updates

**Implementation**: Add telemetry.track() calls in each command.

---

#### **3.2 Web App Events to Track**

**File**: `packages/webapp/src/hooks/useTracking.ts`

```typescript
'use client';

import { usePostHog } from 'posthog-js/react';

export function useTracking() {
  const posthog = usePostHog();

  return {
    trackPackageView: (packageId: string, packageName: string) => {
      posthog.capture('package_view', {
        package_id: packageId,
        package_name: packageName,
      });
    },

    trackPackageInstall: (packageId: string, packageName: string, method: string) => {
      posthog.capture('package_install_click', {
        package_id: packageId,
        package_name: packageName,
        method, // 'cli', 'curl', 'npm'
      });
    },

    trackSearch: (query: string, resultCount: number, filters?: Record<string, any>) => {
      posthog.capture('package_search', {
        query,
        result_count: resultCount,
        filters,
      });
    },

    trackPlaygroundRun: (packageId: string, model: string, creditsSpent: number) => {
      posthog.capture('playground_run', {
        package_id: packageId,
        model,
        credits_spent: creditsSpent,
      });
    },

    trackCustomPromptRun: (model: string, creditsSpent: number) => {
      posthog.capture('custom_prompt_run', {
        model,
        credits_spent: creditsSpent,
        feature: 'custom_prompt',
      });
    },

    trackCreditPurchase: (amount: number, price: number) => {
      posthog.capture('credit_purchase', {
        amount,
        price,
        currency: 'USD',
      });
    },

    trackSubscription: (plan: string, price: number) => {
      posthog.capture('subscription_started', {
        plan,
        price,
        currency: 'USD',
      });
    },
  };
}
```

---

#### **3.3 Integrate tracking in components**

**Example**: `packages/webapp/src/components/playground/PlaygroundInterface.tsx`

```typescript
import { useTracking } from '@/hooks/useTracking';

export default function PlaygroundInterface() {
  const { trackPlaygroundRun, trackCustomPromptRun } = useTracking();

  const runPlayground = async () => {
    const result = await fetch('/api/v1/playground/run', {
      method: 'POST',
      body: JSON.stringify({ package_id, input, model }),
    });

    const data = await result.json();

    // Track event
    if (isCustomPrompt) {
      trackCustomPromptRun(model, data.credits_spent);
    } else {
      trackPlaygroundRun(package_id, model, data.credits_spent);
    }
  };
}
```

---

### **Phase 4: Consistent Event Tagging**

#### **4.1 Event Naming Convention**

**CLI Events**: `prpm_{command}`
- `prpm_install`
- `prpm_search`
- `prpm_playground`
- `prpm_publish`
- `prpm_login`

**Web Events**: `{action}_{resource}`
- `package_view`
- `package_install_click`
- `package_search`
- `playground_run`
- `custom_prompt_run`
- `credit_purchase`

---

#### **4.2 Required Properties for All Events**

```typescript
{
  // User context (auto-added by PostHog)
  distinct_id: string,  // user_id or session_id

  // Event metadata
  timestamp: string,    // ISO 8601
  source: 'cli' | 'web' | 'api',

  // System context (for CLI)
  platform?: string,    // darwin, linux, win32
  version?: string,     // CLI version
  node_version?: string,

  // Feature flags
  $feature/{feature_name}: boolean,
}
```

---

#### **4.3 User Properties (set via $identify)**

```typescript
{
  // Identity
  username: string,
  email: string,
  user_id: string,  // Also the distinct_id

  // Roles
  verified_author: boolean,
  is_admin: boolean,
  prpm_plus_status: 'active' | 'inactive' | null,

  // Metadata
  created_at: string,
  first_seen: string,
  last_seen: string,

  // Stats
  packages_published: number,
  total_downloads: number,
  playground_runs: number,
  credits_balance: number,
}
```

---

## 📊 **PostHog Dashboard Views**

### **View 1: User Activity**
```
Insight Type: Trends
Event: * (all events)
Group by: distinct_id
Filter: is_authenticated = true
Breakdown: event name
```

### **View 2: Package Funnel**
```
Insight Type: Funnel
Steps:
1. package_view
2. package_install_click
3. prpm_install (CLI completion)
```

### **View 3: Playground Usage**
```
Insight Type: Trends
Events: playground_run, custom_prompt_run
Properties:
- credits_spent (sum)
- model (breakdown)
Filter: distinct_id != 'anonymous'
```

---

## ✅ **Testing Checklist**

### **CLI**:
- [ ] Login → user_id saved to config
- [ ] After login → $identify event sent
- [ ] Install package → event has user_id
- [ ] Search → event has user_id
- [ ] Playground → event has user_id
- [ ] Events appear in PostHog with correct user

### **Web App**:
- [ ] Login → $identify called
- [ ] View package → event tracked
- [ ] Search → event tracked
- [ ] Run playground → event tracked with user_id
- [ ] Purchase credits → event tracked
- [ ] Events appear in PostHog dashboard

### **Dashboard**:
- [ ] Can filter events by specific user (by email/username)
- [ ] User properties populated (verified_author, etc.)
- [ ] Events have consistent naming
- [ ] Funnels work correctly
- [ ] No "anonymous" events for logged-in users

---

## 🚀 **Implementation Order**

1. ✅ **Fix CLI user identification** (30 min)
   - Extract user_id from JWT
   - Save to telemetry config
   - Add $identify call

2. ✅ **Add web PostHog provider** (15 min)
   - Install package
   - Create provider
   - Wrap app

3. ✅ **Add useTracking hook** (20 min)
   - Create hook with event methods
   - Consistent event naming

4. ✅ **Integrate tracking in components** (1-2 hours)
   - PlaygroundInterface
   - Search
   - Package pages
   - Credit purchases

5. ✅ **Test in PostHog** (30 min)
   - Verify events appear
   - Check user identification
   - Validate properties

**Total Time**: 3-4 hours

---

## 📝 **Files to Modify**

### **CLI** (3 files):
1. `packages/cli/src/commands/login.ts` - Extract user_id from JWT
2. `packages/cli/src/core/telemetry.ts` - Add identifyUser method
3. `packages/cli/src/core/user-config.ts` - Add userId to config type

### **Web App** (5 new files + integrations):
1. `packages/webapp/src/providers/PostHogProvider.tsx` - NEW
2. `packages/webapp/src/hooks/useTracking.ts` - NEW
3. `packages/webapp/src/app/layout.tsx` - Modified
4. `packages/webapp/.env.local` - Modified
5. Various component files - Add tracking calls

---

**Priority**: High - This is blocking proper analytics and user behavior tracking.
