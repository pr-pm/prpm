# Paid Organizations with Stripe

This document describes the paid organizations feature that allows organizations to become verified through monthly subscriptions.

## Overview

Organizations can upgrade from a free plan to a verified plan ($20/month) to unlock premium features:

- ✅ **Custom Avatar URL** - Set a custom avatar image for your organization
- ✅ **Verified Badge** - Display a verified badge on your organization profile
- ✅ **Priority Support** - Get priority assistance from the PRPM team

## Architecture

### Database Schema

The feature adds the following tables and columns:

#### Organizations Table Extensions
- `stripe_customer_id` - Stripe Customer ID
- `stripe_subscription_id` - Stripe Subscription ID
- `subscription_status` - Current subscription status (active, canceled, past_due, etc.)
- `subscription_plan` - Plan level (free or verified)
- `subscription_start_date` - When the subscription started
- `subscription_end_date` - When the current period ends
- `subscription_cancel_at_period_end` - Whether subscription is set to cancel

#### New Tables
- **subscription_events** - Tracks all Stripe subscription events
- **payment_methods** - Stores organization payment methods
- **invoices** - Tracks billing invoices

### Backend Components

#### Stripe Service (`src/services/stripe.ts`)
Handles all Stripe integration:
- Customer creation and management
- Checkout session creation
- Customer portal sessions
- Subscription lifecycle management
- Webhook event processing

#### Subscription Routes (`src/routes/subscriptions.ts`)
API endpoints for subscription management:
- `POST /api/v1/subscriptions/checkout` - Create checkout session
- `POST /api/v1/subscriptions/portal` - Open customer portal
- `GET /api/v1/subscriptions/:orgName/status` - Get subscription status
- `POST /api/v1/subscriptions/:orgName/cancel` - Cancel subscription
- `POST /api/v1/subscriptions/:orgName/resume` - Resume canceled subscription

#### Webhook Routes (`src/routes/webhooks.ts`)
Stripe webhook endpoint:
- `POST /webhooks/stripe` - Handle Stripe webhook events

#### Organization Routes Updates
- Added verification check for avatar_url updates
- Only verified organizations can set custom avatar URLs

### Frontend Components

#### SubscriptionManagement Component
React component for managing subscriptions:
- Display current subscription status
- Upgrade to verified plan
- Manage existing subscription
- View benefits and billing information

#### EditOrganizationModal Updates
- Disabled avatar URL input for non-verified organizations
- Shows verification requirement message
- Visual indicator for verified-only features

## Setup

### 1. Stripe Configuration

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Create a product for "Verified Organization Plan"
4. Create a recurring price (e.g., $20/month)
5. Set up a webhook endpoint pointing to `https://your-domain.com/webhooks/stripe`

### 2. Environment Variables

Add to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_VERIFIED_PLAN_PRICE_ID=price_your_verified_plan_price_id
```

### 3. Run Migration

Run the database migration to add the new tables:

```bash
cd packages/registry
npm run migrate
```

This will run migration `024_add_paid_organizations.sql`.

### 4. Install Dependencies

The Stripe SDK is already added to package.json:

```bash
cd packages/registry
npm install
```

## Usage

### For Organizations

1. **Upgrading to Verified**
   - Navigate to organization settings
   - Click "Upgrade to Verified"
   - Complete Stripe checkout with payment details
   - Get redirected back with verified status

2. **Managing Subscription**
   - Click "Manage Subscription" to open Stripe Customer Portal
   - Update payment method
   - View invoices
   - Cancel or resume subscription

3. **Setting Custom Avatar**
   - Once verified, go to Edit Organization
   - Enter custom avatar URL
   - Changes are saved immediately

### For Developers

#### Checking Verification Status

```typescript
const org = await getOrganization(orgName)
if (org.is_verified) {
  // Allow premium features
}
```

#### Creating Checkout Session

```typescript
import { createCheckoutSession } from '../services/stripe'

const checkoutUrl = await createCheckoutSession(server, {
  orgId: organization.id,
  orgName: organization.name,
  successUrl: 'https://your-app.com/success',
  cancelUrl: 'https://your-app.com/canceled',
  customerEmail: user.email,
})
```

#### Handling Webhooks

Webhooks are automatically processed by the webhook handler. The system:
1. Verifies webhook signature
2. Processes the event
3. Updates organization status
4. Logs event to subscription_events table

## Webhook Events Handled

- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.paid` - Payment successful
- `invoice.payment_failed` - Payment failed
- `payment_method.attached` - New payment method added

## Automatic Verification

The database trigger `organization_verified_status_updated` automatically:
- Sets `is_verified = true` when subscription becomes active
- Maintains manual admin verifications (doesn't override them)
- Updates verification status based on subscription status

## Testing

### Test Mode
Use Stripe test mode for development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### Webhook Testing
Use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

### Subscription Testing

1. Create test checkout session
2. Use test card to complete payment
3. Verify subscription status in database
4. Test webhook events with Stripe CLI
5. Test subscription cancellation and resumption

## Security Considerations

1. **Webhook Verification** - All webhooks are verified using Stripe signature
2. **Authentication** - All subscription endpoints require JWT authentication
3. **Authorization** - Only org owners/admins can manage subscriptions
4. **Environment Variables** - Sensitive keys are stored in environment variables
5. **Error Handling** - Comprehensive error handling and logging

## Monitoring

### Logs
All Stripe operations are logged with structured logging:
- Customer creation
- Checkout sessions
- Subscription updates
- Webhook processing
- Errors and failures

### Database Tracking
- `subscription_events` table tracks all webhook events
- `invoices` table tracks all billing
- Automatic timestamp tracking on all tables

## Pricing

**Verified Plan**: $20/month
- Billed monthly
- Cancel anytime
- Immediate access to features
- Access continues until end of billing period after cancellation

## Future Enhancements

Potential future features:
- Annual billing option with discount
- Team size-based pricing tiers
- Advanced analytics for verified orgs
- API rate limit increases
- Custom branding options
- Dedicated support channels

## Troubleshooting

### Subscription Not Updating
1. Check webhook logs in Stripe Dashboard
2. Verify webhook secret is correct
3. Check server logs for webhook processing errors
4. Ensure webhook endpoint is publicly accessible

### Payment Failures
1. Check customer payment method is valid
2. Review invoice status in Stripe Dashboard
3. Check for bank/card declines
4. Verify customer email for Stripe communications

### Verification Not Applying
1. Check subscription status in database
2. Verify webhook was received and processed
3. Check organization_verified_status_updated trigger
4. Review server logs for processing errors

## Support

For issues with paid organizations:
1. Check this documentation
2. Review server logs
3. Check Stripe Dashboard
4. Contact support at support@prpm.dev
