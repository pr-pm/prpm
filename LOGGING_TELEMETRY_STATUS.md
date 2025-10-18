# Logging & Telemetry Status Report

## Current State Analysis

### ✅ CLI Telemetry (Implemented)

**Location**: `src/core/telemetry.ts`

**Features**:
- ✅ PostHog integration with API key configured
- ✅ Event tracking for all CLI commands
- ✅ User opt-in/opt-out capability
- ✅ Session tracking
- ✅ Local event storage (last 100 events)
- ✅ Platform, version, and system info tracking
- ✅ Success/failure tracking
- ✅ Duration tracking
- ✅ Error tracking
- ✅ Command-specific data tracking

**What's Tracked**:
```typescript
{
  command: string;          // e.g., "install", "search"
  success: boolean;         // Did it succeed?
  error?: string;           // Error message if failed
  duration?: number;        // How long it took
  version: string;          // PRMP version
  platform: string;         // OS platform
  arch: string;             // CPU architecture
  nodeVersion: string;      // Node.js version
  data: {                   // Command-specific data
    packageId?: string;
    packageCount?: number;
    searchQuery?: string;
    // etc.
  }
}
```

**PostHog Configuration**:
- API Key: `phc_aO5lXLILeylHfb1ynszVwKbQKSzO91UGdXNhN5Q0Snl`
- Host: `https://app.posthog.com`
- Distinct ID: `userId` or `sessionId`
- Event naming: `prmp_{command}`

### ❌ Registry Telemetry (NOT IMPLEMENTED)

**Current State**: Only basic Fastify logging

**What's Missing**:
- ❌ No API endpoint usage tracking
- ❌ No user behavior analytics
- ❌ No package download tracking
- ❌ No search query analytics
- ❌ No performance metrics
- ❌ No error rate monitoring
- ❌ No geographic analytics
- ❌ No retention metrics

### ⚠️ Registry Logging (Basic Only)

**Current State**: Fastify's built-in logger (pino)

**What Exists**:
- Basic info/warn/error logging
- Database connection status
- Redis connection status
- Cache operations (40 log statements)

**What's Missing**:
- ❌ Structured logging
- ❌ Log aggregation
- ❌ Request/response logging
- ❌ Performance logging
- ❌ User action logging
- ❌ Error tracking with stack traces
- ❌ Correlation IDs
- ❌ Log levels per environment

---

## Recommendations

### Priority 1: Add Registry Analytics

**What to Track**:

1. **API Usage**
   - Endpoint hits (which routes are most used)
   - Request duration
   - Status codes (200, 400, 404, 500)
   - Error rates
   - Response sizes

2. **Package Analytics**
   - Package downloads (by package, version, type)
   - Search queries (what users search for)
   - Popular packages
   - Trending calculations
   - Install success/failure rates

3. **User Behavior**
   - Active users (DAU/MAU)
   - User retention
   - Registration flow
   - Authentication patterns
   - API token usage

4. **Performance Metrics**
   - Response times by endpoint
   - Database query performance
   - Cache hit rates
   - Slow queries
   - Memory usage
   - CPU usage

5. **Business Metrics**
   - Total packages
   - Total downloads
   - Total users
   - Growth rates
   - Popular categories/tags
   - Collection usage

### Priority 2: Structured Logging

**Implement**:
- Request ID tracking
- User ID tracking
- Structured JSON logs
- Log levels (debug, info, warn, error)
- Environment-based logging
- Log rotation
- Error stack traces
- Performance logging

### Priority 3: Monitoring & Alerting

**Set Up**:
- Application Performance Monitoring (APM)
- Error tracking (Sentry/Rollbar)
- Uptime monitoring
- Database monitoring
- Cache monitoring
- Alert rules for critical errors
- Dashboard for key metrics

---

## Implementation Plan

### Phase 1: Add PostHog to Registry ✅ READY

**Steps**:
1. Install PostHog Node SDK
2. Create telemetry middleware
3. Track API requests
4. Track package downloads
5. Track user actions
6. Track errors

**Code Structure**:
```typescript
// registry/src/telemetry/index.ts
- Initialize PostHog client
- Create tracking middleware
- Export tracking functions

// registry/src/middleware/analytics.ts
- Request tracking middleware
- Response time tracking
- Error tracking

// Integration points
- Routes (track endpoint usage)
- Package downloads (track downloads)
- Search (track queries)
- User actions (track auth, tokens)
```

### Phase 2: Enhance Logging ⏳ PENDING

**Steps**:
1. Configure pino with better formatting
2. Add request ID generation
3. Add correlation tracking
4. Add structured logging helpers
5. Configure log levels
6. Add error context

### Phase 3: Add External Services ⏳ PENDING

**Services to Consider**:
- **Sentry**: Error tracking and performance monitoring
- **Datadog/New Relic**: APM and infrastructure monitoring
- **LogDNA/Loggly**: Log aggregation
- **Grafana**: Metrics visualization
- **PagerDuty**: Alerting

---

## Current Gaps

### CLI (Good)
- ✅ Comprehensive telemetry
- ✅ PostHog integration
- ✅ User opt-in/opt-out
- ✅ Event tracking
- ⚠️ Could add more granular events

### Registry (Needs Work)
- ❌ No analytics at all
- ❌ Basic logging only
- ❌ No monitoring
- ❌ No alerting
- ❌ No performance tracking
- ❌ No user behavior tracking

---

## Proposed Solution

### Immediate (Add Registry Analytics)

Install PostHog:
```bash
cd registry
npm install posthog-node
```

Create telemetry service:
```typescript
// registry/src/telemetry/index.ts
import { PostHog } from 'posthog-node';

export class RegistryTelemetry {
  private posthog: PostHog;

  constructor() {
    this.posthog = new PostHog(
      'phc_aO5lXLILeylHfb1ynszVwKbQKSzO91UGdXNhN5Q0Snl',
      { host: 'https://app.posthog.com' }
    );
  }

  trackRequest(event: {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    userId?: string;
  }) {
    this.posthog.capture({
      distinctId: event.userId || 'anonymous',
      event: 'api_request',
      properties: event,
    });
  }

  trackDownload(event: {
    packageId: string;
    version: string;
    userId?: string;
  }) {
    this.posthog.capture({
      distinctId: event.userId || 'anonymous',
      event: 'package_download',
      properties: event,
    });
  }

  // ... more tracking methods
}
```

Add middleware:
```typescript
// registry/src/middleware/analytics.ts
export function analyticsMiddleware(telemetry: RegistryTelemetry) {
  return async (request, reply) => {
    const start = Date.now();

    reply.addHook('onResponse', () => {
      telemetry.trackRequest({
        endpoint: request.routerPath,
        method: request.method,
        statusCode: reply.statusCode,
        duration: Date.now() - start,
        userId: request.user?.userId,
      });
    });
  };
}
```

### Short-term (Better Logging)

Configure pino:
```typescript
// registry/src/index.ts
const server = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          headers: req.headers,
          hostname: req.hostname,
          remoteAddress: req.ip,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  },
});
```

### Long-term (Full Observability Stack)

Set up:
1. **Sentry** for error tracking
2. **Datadog** for APM
3. **Grafana** for dashboards
4. **Prometheus** for metrics
5. **ELK Stack** for logs

---

## Metrics You Can Track

### User Metrics
- Daily/Monthly Active Users (DAU/MAU)
- New user signups
- User retention rate
- Churn rate
- User cohorts
- Feature adoption

### Package Metrics
- Total packages published
- Packages by type (cursor, claude, etc.)
- Average package size
- Download counts (total, daily, weekly)
- Most popular packages
- Trending packages
- Package growth rate

### API Metrics
- Requests per second
- Response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- Endpoint usage distribution
- Geographic distribution
- API token usage

### Search Metrics
- Search queries per day
- Popular search terms
- Search result relevance
- No-result searches
- Click-through rates

### Performance Metrics
- Database query time
- Cache hit/miss rates
- Memory usage
- CPU usage
- Disk usage
- Network traffic

### Business Metrics
- Revenue (if applicable)
- API rate limit hits
- Storage usage
- Bandwidth usage
- Cost per request

---

## Privacy Considerations

### Current Implementation (CLI)
- ✅ User can opt-out
- ✅ No PII collected by default
- ✅ Anonymous by default (sessionId)
- ✅ User ID only if logged in

### Should Implement (Registry)
- ⚠️ GDPR compliance
- ⚠️ Cookie consent (if web app)
- ⚠️ Data retention policy
- ⚠️ Right to be forgotten
- ⚠️ Privacy policy
- ⚠️ Terms of service

### Data to AVOID Collecting
- ❌ Email addresses (unless user consent)
- ❌ IP addresses (or anonymize)
- ❌ Personal information
- ❌ Package contents
- ❌ User tokens/secrets

### Data to Collect (Safe)
- ✅ Package IDs
- ✅ Version numbers
- ✅ Download counts
- ✅ Search queries (anonymized)
- ✅ API endpoint usage
- ✅ Error rates
- ✅ Performance metrics
- ✅ Platform/version info

---

## Next Steps

### Immediate Actions Needed
1. ✅ Document current state (this document)
2. ⏳ Add PostHog to registry
3. ⏳ Implement tracking middleware
4. ⏳ Add key event tracking
5. ⏳ Set up PostHog dashboard

### Short-term (1-2 weeks)
1. Enhance logging with structured logs
2. Add error tracking (Sentry)
3. Create monitoring dashboards
4. Set up alerts for critical errors

### Long-term (1-3 months)
1. Full APM implementation
2. Custom analytics dashboard
3. Advanced user behavior tracking
4. A/B testing infrastructure
5. Performance optimization based on metrics

---

## Conclusion

**Current Status**:
- CLI has good telemetry ✅
- Registry has NO telemetry ❌

**Recommendation**:
**IMMEDIATELY** add PostHog to the registry to start tracking:
1. API usage
2. Package downloads
3. Search queries
4. User behavior
5. Errors and performance

This will give you critical insights into:
- How users are using the product
- Which features are popular
- Where users encounter issues
- Performance bottlenecks
- Growth metrics

**Estimated Implementation Time**: 4-8 hours for basic analytics setup

---

**Created**: October 18, 2025
**Status**: Current gaps identified, implementation plan ready
