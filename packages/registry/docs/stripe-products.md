# Stripe Products Configuration

This document describes the Stripe products that need to be configured for PRPM registry subscriptions.

## Verified Organizations

### Product Details

**Name:** Verified Organizations
**Description:** Verified organization status for PRPM registry with exclusive benefits

**Key Features:**
- ✅ Verified badge displayed on organization profile
- 🔒 Publish private packages (organization-only access)
- 📦 Unlimited public packages
- 🏷️ Custom organization branding
- 📊 Advanced analytics and insights
- 🛡️ Priority support
- 🎯 Featured package placement eligibility
- 💎 Discounted PRPM+ for team members

**Use Case:**
For organizations that need to distribute internal packages, maintain brand credibility, and access advanced registry features.

### Pricing

**Recommended Tiers:**

#### Starter
- **Price:** $29/month (or $290/year - save 17%)
- **Billing:** Monthly or Annual
- **Includes:**
  - Verified badge
  - Unlimited private packages
  - Unlimited public packages
  - Basic analytics
  - Email support

#### Professional
- **Price:** $99/month (or $990/year - save 17%)
- **Billing:** Monthly or Annual
- **Includes:**
  - Everything in Starter
  - Advanced analytics
  - Priority email support
  - Custom organization page

#### Enterprise
- **Price:** Custom pricing
- **Billing:** Annual contract
- **Includes:**
  - Everything in Professional
  - Dedicated support
  - SLA guarantees
  - On-premise deployment options
  - Custom integration support

### Setup Instructions

#### 1. Create Product in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Click "Add Product"
3. Fill in the details:
   - **Name:** `Verified Organizations`
   - **Description:** Verified organization status for PRPM registry with exclusive benefits including private packages, verified badge, and priority support
   - **Statement descriptor:** `PRPM Registry`

#### 2. Create Pricing Plans

For each tier (Starter, Professional, Enterprise):

1. Click "Add pricing"
2. Select **Recurring**
3. Configure:
   - **Price:** (see pricing above)
   - **Billing period:** Monthly or Yearly
   - **Usage type:** Licensed (per organization)
4. Copy the **Price ID**

#### 3. Set Environment Variables

Add the Price IDs to your environment configuration:

```bash
# .env or environment variables
STRIPE_SECRET_KEY=sk_live_...
STRIPE_VERIFIED_PLAN_PRICE_ID=price_...  # Starter Monthly price ID

# For multiple tiers (optional)
STRIPE_VERIFIED_STARTER_MONTHLY=price_...
STRIPE_VERIFIED_STARTER_YEARLY=price_...
STRIPE_VERIFIED_PROFESSIONAL_MONTHLY=price_...
STRIPE_VERIFIED_PROFESSIONAL_YEARLY=price_...
```

#### 4. Configure Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://registry.prpm.dev/api/v1/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_method.attached`
4. Copy the **Webhook signing secret**
5. Add to environment: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Verification Logic

When a subscription is active:
- `subscription_status` = `'active'` or `'trialing'`
- `is_verified` = `true`
- `subscription_plan` = `'verified'`

Organizations with `is_verified = true` can:
1. Display verified badge on their profile
2. Publish private packages (enforced at publish time)
3. Access premium features

### Database Schema

The following fields in the `organizations` table track verification status:

```sql
-- Subscription tracking
stripe_customer_id VARCHAR(255)           -- Stripe customer ID
stripe_subscription_id VARCHAR(255)        -- Active subscription ID
subscription_status VARCHAR(50)            -- active, canceled, past_due, etc.
subscription_plan VARCHAR(50)              -- 'free' or 'verified'
subscription_start_date TIMESTAMP          -- Subscription start
subscription_end_date TIMESTAMP            -- Current period end
subscription_cancel_at_period_end BOOLEAN  -- Cancel scheduled
is_verified BOOLEAN DEFAULT false          -- Verified status
```

### Testing

#### Test Mode Setup

1. Use Stripe test mode keys: `sk_test_...`
2. Create test product and prices
3. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0027 6000 3184`

#### Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

### Monitoring

Monitor subscription health in Stripe Dashboard:
- **Active subscriptions:** Track growth
- **Churn rate:** Monitor cancellations
- **MRR (Monthly Recurring Revenue):** Track revenue
- **Failed payments:** Follow up on past_due subscriptions

### Support & Troubleshooting

**Common Issues:**

1. **Verification not applying after payment**
   - Check webhook delivery in Stripe Dashboard
   - Verify `STRIPE_WEBHOOK_SECRET` is correct
   - Check application logs for webhook processing errors

2. **Private package publish still blocked**
   - Verify `is_verified = true` in database
   - Check subscription status is `'active'` or `'trialing'`
   - Confirm organization ID matches subscription metadata

3. **Subscription shows as canceled but still active**
   - Check `subscription_cancel_at_period_end` field
   - Subscription remains active until `subscription_end_date`
   - Update messaging to show "Cancels on [date]"

### References

- [Stripe Subscriptions Documentation](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhook Events](https://stripe.com/docs/api/events/types)
- [Stripe Testing](https://stripe.com/docs/testing)
