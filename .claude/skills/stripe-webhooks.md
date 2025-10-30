---
name: "Stripe Webhook Integration"
description: "Production-ready Stripe webhook handling for subscriptions and payments with signature verification, idempotency, and error recovery"
version: "1.0.0"
globs:
  - "**/webhook*.{ts,js,py,go,rb}"
  - "**/stripe*.{ts,js,py,go,rb}"
  - "**/subscription*.{ts,js,py,go,rb}"
  - "**/payment*.{ts,js,py,go,rb}"
  - "**/billing*.{ts,js,py,go,rb}"
  - "**/*server*.{ts,js,py,go,rb}"
  - "**/*app*.{ts,js,py,go,rb}"
  - "**/main.{ts,js,py,go,rb}"
  - "**/index.{ts,js,py,go,rb}"
alwaysApply: false
---

# Stripe Webhook Integration Best Practices

Apply these patterns when integrating Stripe webhooks for subscription management and payment processing. Framework-agnostic patterns applicable to Node.js (Express/Fastify), Python (Flask/FastAPI), Go, Ruby (Rails/Sinatra), and more.

## 🎯 Core Principles

1. **Always verify webhook signatures** - never trust incoming requests
2. **Store raw request body** - required for Stripe signature verification
3. **Handle idempotency** - webhooks may be delivered multiple times
4. **Log all events** - essential for debugging and audit trails
5. **Fail gracefully** - return 200 even if processing fails (after logging)
6. **Use database transactions** - ensure data consistency

## 🔐 Critical: Raw Body Parsing

**THE PROBLEM:** Stripe webhooks require the raw request body to verify signatures. By default, web frameworks parse JSON bodies automatically, which modifies the body and breaks signature verification.

**THE SOLUTION:** Configure your framework to preserve the raw body while still parsing JSON for other endpoints.

**This is THE most common issue when integrating Stripe webhooks across ALL frameworks.**

### Framework-Specific Solutions

#### Node.js - Fastify

Add this BEFORE registering routes in your main server file:

```typescript
// Raw body parser for Stripe webhooks
server.addContentTypeParser('application/json', { parseAs: 'buffer' }, async (req: any, body: Buffer) => {
  // Store raw body for webhook signature verification
  req.rawBody = body;

  // Parse JSON normally for route handlers
  try {
    return JSON.parse(body.toString('utf8'));
  } catch (err) {
    throw new Error('Invalid JSON');
  }
});
```

**Why this works:**
- `parseAs: 'buffer'` - receives raw body as Buffer instead of parsed JSON
- `req.rawBody = body` - stores raw body for signature verification
- `JSON.parse(...)` - returns parsed body for normal route handling
- Applied to ALL `application/json` requests - webhook handler can access `req.rawBody`

#### Node.js - Express

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Use raw body parser ONLY for webhook endpoint
app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['stripe-signature'];

    try {
      // Raw body is in req.body (as Buffer)
      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Process event...
      res.json({ received: true });
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Use JSON parser for all other routes
app.use(express.json());
```

**Key:** Define webhook route BEFORE `express.json()` middleware.

#### Python - Flask

```python
import stripe
from flask import Flask, request

app = Flask(__name__)
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

@app.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    # Get raw body as bytes
    payload = request.data
    signature = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, webhook_secret
        )

        # Process event...
        return {'success': True}
    except ValueError as e:
        return {'error': 'Invalid payload'}, 400
    except stripe.error.SignatureVerificationError as e:
        return {'error': 'Invalid signature'}, 400
```

**Key:** Use `request.data` (bytes) not `request.json` (parsed).

#### Python - FastAPI

```python
from fastapi import FastAPI, Request, HTTPException
import stripe

app = FastAPI()
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

@app.post('/webhooks/stripe')
async def stripe_webhook(request: Request):
    # Get raw body as bytes
    payload = await request.body()
    signature = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, webhook_secret
        )

        # Process event...
        return {'success': True}
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid payload')
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail='Invalid signature')
```

**Key:** Use `await request.body()` (bytes) not `await request.json()`.

#### Go - net/http

```go
package main

import (
    "io"
    "net/http"
    "github.com/stripe/stripe-go/v74"
    "github.com/stripe/stripe-go/v74/webhook"
)

func stripeWebhook(w http.ResponseWriter, r *http.Request) {
    // Read raw body
    payload, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Error reading request", 400)
        return
    }

    signature := r.Header.Get("Stripe-Signature")

    // Verify signature
    event, err := webhook.ConstructEvent(
        payload,
        signature,
        os.Getenv("STRIPE_WEBHOOK_SECRET"),
    )
    if err != nil {
        http.Error(w, "Invalid signature", 400)
        return
    }

    // Process event...
    w.WriteHeader(200)
}
```

**Key:** Read body with `io.ReadAll()` before any middleware parses it.

#### Ruby - Rails

```ruby
class WebhooksController < ApplicationController
  # Skip CSRF protection for webhooks
  skip_before_action :verify_authenticity_token

  def stripe
    # Get raw body
    payload = request.body.read
    signature = request.headers['Stripe-Signature']

    begin
      event = Stripe::Webhook.construct_event(
        payload,
        signature,
        ENV['STRIPE_WEBHOOK_SECRET']
      )

      # Process event...
      render json: { success: true }
    rescue JSON::ParserError => e
      render json: { error: 'Invalid payload' }, status: 400
    rescue Stripe::SignatureVerificationError => e
      render json: { error: 'Invalid signature' }, status: 400
    end
  end
end
```

**Key:** Use `request.body.read` (string) not `params` (parsed).

### General Pattern

Regardless of framework, the pattern is:

1. **Get raw body BEFORE any JSON parsing**
2. **Pass raw body to `stripe.webhooks.constructEvent()`**
3. **Use the parsed event object returned by Stripe**

```
Raw Body → Stripe Verification → Parsed Event
   ↓              ↓                    ↓
 (bytes)    (verify signature)    (use this)
```

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Route Not Found (404)

**Problem:** Webhook endpoint returns 404 when Stripe sends events.

**Root Cause:** Webhook routes registered outside API prefix block.

**Wrong:**
```typescript
export async function registerRoutes(server: FastifyInstance) {
  server.register(async (api) => {
    await api.register(subscriptionRoutes, { prefix: '/subscriptions' });
  }, { prefix: '/api/v1' });

  // ❌ This creates /webhooks/stripe instead of /api/v1/webhooks/stripe
  await server.register(webhookRoutes, { prefix: '/webhooks' });
}
```

**Correct:**
```typescript
export async function registerRoutes(server: FastifyInstance) {
  server.register(async (api) => {
    await api.register(subscriptionRoutes, { prefix: '/subscriptions' });
    await api.register(webhookRoutes, { prefix: '/webhooks' }); // ✅ Inside api block
  }, { prefix: '/api/v1' });
}
```

**Result:** Endpoint is now at `POST /api/v1/webhooks/stripe`

### Pitfall 2: Raw Body Not Available

**Problem:** `req.rawBody` is undefined, signature verification fails.

**Root Cause:** Custom content type parser not configured or configured after routes.

**Solution:** Add raw body parser BEFORE `registerRoutes()`:

```typescript
async function buildServer() {
  const server = Fastify({ logger: true });

  // Register other plugins (cors, helmet, etc.)

  // ✅ Add raw body parser BEFORE routes
  server.addContentTypeParser('application/json', { parseAs: 'buffer' },
    async (req: any, body: Buffer) => {
      req.rawBody = body;
      return JSON.parse(body.toString('utf8'));
    }
  );

  // Now register routes
  await registerRoutes(server);

  return server;
}
```

### Pitfall 3: URI Validation Errors

**Problem:** Stripe checkout fails with `"body/successUrl must match format 'uri'"`.

**Root Cause:** Organization names or other data with spaces not URL-encoded.

**Wrong:**
```typescript
const successUrl = `${window.location.origin}/orgs?name=${orgName}&subscription=success`;
// If orgName = "Broke Org", this becomes: /orgs?name=Broke Org&... ❌
```

**Correct:**
```typescript
const successUrl = `${window.location.origin}/orgs?name=${encodeURIComponent(orgName)}&subscription=success`;
// Result: /orgs?name=Broke%20Org&... ✅
```

**Apply to all URLs:**
- Checkout success/cancel URLs
- Portal return URLs
- Any URL with dynamic data

### Pitfall 4: Subscription Period Fields Missing

**Problem:** Webhook handler crashes with `TypeError: Cannot read property 'current_period_start' of undefined`.

**Root Cause:** Stripe subscription object structure differs from TypeScript types. Period dates are nested in `items.data[0]`, not at root level.

**Wrong:**
```typescript
// ❌ These fields don't exist on subscription object
new Date(subscription.current_period_start * 1000)
new Date(subscription.current_period_end * 1000)
```

**Correct:**
```typescript
// ✅ Get period dates from first subscription item
const firstItem = subscription.items.data[0] as any;
const currentPeriodStart = firstItem?.current_period_start || subscription.billing_cycle_anchor;
const currentPeriodEnd = firstItem?.current_period_end || subscription.billing_cycle_anchor;

await query(server,
  `UPDATE organizations
   SET subscription_start_date = $1,
       subscription_end_date = $2
   WHERE id = $3`,
  [
    new Date(currentPeriodStart * 1000),
    new Date(currentPeriodEnd * 1000),
    orgId,
  ]
);
```

**Why this happens:**
- Stripe API returns `current_period_start` and `current_period_end` inside subscription items
- TypeScript `@stripe/stripe-js` types don't include these fields on `SubscriptionItem`
- Need to cast to `any` or create custom interface
- Fallback to `billing_cycle_anchor` if item data missing

**Webhook payload structure:**
```json
{
  "subscription": {
    "billing_cycle_anchor": 1761858187,
    "items": {
      "data": [
        {
          "current_period_start": 1761858187,
          "current_period_end": 1764536587
        }
      ]
    }
  }
}
```

### Pitfall 5: Environment Variables Not Set

**Problem:** Webhook signature verification fails in production but works in test mode.

**Root Cause:** `STRIPE_WEBHOOK_SECRET` not set or using wrong secret (test vs live).

**Solution:** Always set environment-specific secrets:

```bash
# Development (.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_VERIFIED_PLAN_PRICE_ID=price_test_...

# Production (environment variables)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_VERIFIED_PLAN_PRICE_ID=price_live_...
```

**Verification:**
```typescript
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!STRIPE_WEBHOOK_SECRET) {
  server.log.error('STRIPE_WEBHOOK_SECRET not configured');
  return reply.status(500).send({
    error: 'Configuration Error',
    message: 'Webhook secret not configured',
  });
}
```

## 📋 Complete Implementation Checklist

### Server Setup

- [ ] Configure raw body parser for `application/json`
- [ ] Add raw body parser BEFORE registering routes
- [ ] Register webhook routes inside API prefix block
- [ ] Set all required environment variables
- [ ] Configure Stripe API with correct version

### Webhook Route

- [ ] Validate `stripe-signature` header exists
- [ ] Verify webhook secret is configured
- [ ] Access raw body from `request.rawBody`
- [ ] Verify signature with `stripe.webhooks.constructEvent()`
- [ ] Handle `StripeSignatureVerificationError` separately
- [ ] Log all events with event ID and type
- [ ] Return 200 for successfully received webhooks
- [ ] Use database transactions for data updates

### Event Handlers

- [ ] Handle `customer.subscription.created`
- [ ] Handle `customer.subscription.updated`
- [ ] Handle `customer.subscription.deleted`
- [ ] Handle `invoice.paid`
- [ ] Handle `invoice.payment_failed`
- [ ] Handle `payment_method.attached`
- [ ] Store organization ID in subscription metadata
- [ ] Update organization verification status
- [ ] **CRITICAL:** Get period dates from `subscription.items.data[0]`, not root object
- [ ] Cast subscription item to `any` to access period fields
- [ ] Fallback to `billing_cycle_anchor` if item missing
- [ ] Log all events to `subscription_events` table

### Frontend Integration

- [ ] URL-encode all dynamic parameters in checkout URLs
- [ ] URL-encode organization names in success/cancel URLs
- [ ] URL-encode portal return URLs
- [ ] Handle checkout session creation errors
- [ ] Redirect to Stripe checkout URL after creation
- [ ] Handle subscription success/cancel callbacks

### Testing

- [ ] Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
- [ ] Login: `stripe login`
- [ ] Forward webhooks: `stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe`
- [ ] Trigger test events: `stripe trigger customer.subscription.created`
- [ ] Verify signature validation works
- [ ] Test with invalid signatures
- [ ] Test idempotency (send same event twice)
- [ ] Test error handling

## 🏗️ Example Implementation

### 1. Server Setup (index.ts)

```typescript
import Fastify from 'fastify';

async function buildServer() {
  const server = Fastify({ logger: true });

  // Other plugins (cors, helmet, rate-limit, etc.)
  await server.register(cors);
  await server.register(helmet);

  // ✅ Raw body parser (BEFORE routes)
  server.addContentTypeParser('application/json', { parseAs: 'buffer' },
    async (req: any, body: Buffer) => {
      req.rawBody = body;
      return JSON.parse(body.toString('utf8'));
    }
  );

  // Setup database, auth, etc.
  await setupDatabase(server);
  await setupAuth(server);

  // Register routes
  await registerRoutes(server);

  return server;
}
```

### 2. Route Registration (routes/index.ts)

```typescript
export async function registerRoutes(server: FastifyInstance) {
  server.register(async (api) => {
    await api.register(authRoutes, { prefix: '/auth' });
    await api.register(subscriptionRoutes, { prefix: '/subscriptions' });
    await api.register(webhookRoutes, { prefix: '/webhooks' }); // ✅ Inside prefix
  }, { prefix: '/api/v1' });
}
```

### 3. Webhook Handler (routes/webhooks.ts)

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { stripe, handleWebhookEvent } from '../services/stripe.js';
import Stripe from 'stripe';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function webhookRoutes(server: FastifyInstance) {
  server.post('/stripe', {
    schema: {
      tags: ['webhooks'],
      description: 'Stripe webhook endpoint',
      hide: true, // Hide from Swagger docs
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers['stripe-signature'];

    // Validate signature header
    if (!signature || typeof signature !== 'string') {
      server.log.warn('Missing Stripe signature header');
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Missing Stripe signature',
      });
    }

    // Validate webhook secret configured
    if (!STRIPE_WEBHOOK_SECRET) {
      server.log.error('STRIPE_WEBHOOK_SECRET not configured');
      return reply.status(500).send({
        error: 'Configuration Error',
        message: 'Webhook secret not configured',
      });
    }

    try {
      // Get raw body for signature verification
      const rawBody = (request as any).rawBody;

      if (!rawBody) {
        server.log.error('Raw body not available for webhook verification');
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Raw body not available',
        });
      }

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      ) as Stripe.Event;

      server.log.info({
        eventId: event.id,
        eventType: event.type,
      }, '📬 Received Stripe webhook');

      // Handle the event
      await handleWebhookEvent(server, event);

      server.log.info({
        eventId: event.id,
        eventType: event.type,
      }, '✅ Webhook processed successfully');

      return reply.send({ received: true });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        server.log.warn({ error: error.message }, '⚠️  Invalid webhook signature');
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid signature',
        });
      }

      server.log.error({ error }, '❌ Webhook processing failed');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to process webhook',
      });
    }
  });
}
```

### 4. Event Handler (services/stripe.ts)

```typescript
export async function handleWebhookEvent(
  server: FastifyInstance,
  event: Stripe.Event
): Promise<void> {
  const eventType = event.type;

  try {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(server, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(server, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(server, invoice);
        break;
      }

      // Handle other events...

      default:
        server.log.info({ eventType }, 'ℹ️  Unhandled webhook event type');
    }

    // Log event to database for audit trail
    const orgId = await getOrgIdFromEvent(server, event);
    if (orgId) {
      await logSubscriptionEvent(server, orgId, event);
    }
  } catch (error) {
    server.log.error({ error, eventType }, '❌ Error handling webhook event');
    throw error;
  }
}

async function handleSubscriptionUpdate(
  server: FastifyInstance,
  subscription: Stripe.Subscription
): Promise<void> {
  const orgId = subscription.metadata.org_id;

  if (!orgId) {
    server.log.warn({ subscriptionId: subscription.id },
      'Subscription missing org_id metadata');
    return;
  }

  // CRITICAL: Get period dates from subscription items, not root object
  // TypeScript types don't include these fields but they exist in API response
  const firstItem = subscription.items.data[0] as any;
  const currentPeriodStart = firstItem?.current_period_start || subscription.billing_cycle_anchor;
  const currentPeriodEnd = firstItem?.current_period_end || subscription.billing_cycle_anchor;

  // Use transaction for consistency
  await query(
    server,
    `UPDATE organizations
     SET stripe_subscription_id = $1,
         subscription_status = $2,
         subscription_plan = $3,
         subscription_start_date = $4,
         subscription_end_date = $5,
         subscription_cancel_at_period_end = $6,
         is_verified = $7
     WHERE id = $8`,
    [
      subscription.id,
      subscription.status,
      'verified',
      new Date(currentPeriodStart * 1000),
      new Date(currentPeriodEnd * 1000),
      subscription.cancel_at_period_end,
      subscription.status === 'active' || subscription.status === 'trialing',
      orgId,
    ]
  );

  server.log.info({ orgId, subscriptionId: subscription.id },
    '✅ Subscription updated');
}
```

### 5. Frontend URL Encoding (components/UpgradePrompt.tsx)

```typescript
async function handleUpgrade() {
  // ✅ Always encode dynamic parameters
  const successUrl = `${window.location.origin}/orgs?name=${encodeURIComponent(organizationName)}&subscription=success`;
  const cancelUrl = `${window.location.origin}/orgs?name=${encodeURIComponent(organizationName)}&subscription=canceled`;

  const response = await fetch(`${registryUrl}/api/v1/subscriptions/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      orgName: organizationName,
      successUrl,
      cancelUrl,
    }),
  });

  const data = await response.json();
  if (data.checkoutUrl) {
    window.location.href = data.checkoutUrl;
  }
}
```

## 🧪 Local Testing

### Setup Stripe CLI

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login (opens browser)
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

### Trigger Test Events

```bash
# Create subscription
stripe trigger customer.subscription.created

# Update subscription
stripe trigger customer.subscription.updated

# Invoice paid
stripe trigger invoice.paid

# Payment failed
stripe trigger invoice.payment_failed
```

### Monitor Logs

Watch your server logs for:
- `📬 Received Stripe webhook`
- `✅ Webhook processed successfully`
- `⚠️ Invalid webhook signature` (if testing with wrong secret)

## 📊 Production Monitoring

### Stripe Dashboard

1. Go to Developers → Webhooks
2. Check "Events" tab for delivery status
3. Monitor failed deliveries
4. Review event logs for errors

### Application Logs

Log key metrics:
- Total webhooks received
- Failed signature verifications
- Processing errors
- Event processing time

### Database Audit

Track all events in `subscription_events` table:

```sql
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  subscription_status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔒 Security Best Practices

1. **Always verify signatures** - never process unverified webhooks
2. **Use HTTPS in production** - Stripe only sends to HTTPS endpoints
3. **Rotate webhook secrets** - update if compromised
4. **Rate limit webhook endpoint** - prevent abuse
5. **Validate event data** - don't trust event payload blindly
6. **Use idempotency keys** - prevent duplicate processing
7. **Store minimal data** - don't log sensitive payment info

## 🎓 Key Takeaways

1. **Raw body is critical** - configure custom content type parser
2. **Route registration matters** - webhooks must be in API prefix
3. **Always URL-encode** - dynamic data in URLs must be encoded
4. **Verify signatures** - never skip signature verification
5. **Log everything** - webhooks are async, logs are essential
6. **Test locally** - use Stripe CLI before deploying
7. **Handle failures** - webhooks may fail, implement retry logic
8. **Use transactions** - ensure database consistency

## 📚 References

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
