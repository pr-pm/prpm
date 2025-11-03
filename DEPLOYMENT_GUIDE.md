# PRPM Playground - Production Deployment Guide

**Last Updated:** 2025-11-03
**Status:** ✅ Ready for Production Deployment

---

## Pre-Deployment Checklist

### ✅ Critical Fixes Completed

- [x] Token-based pricing (1 credit = 5,000 tokens)
- [x] Request size limits (20,000 tokens max)
- [x] Opus pricing (5x multiplier)
- [x] Subscription pricing adjustment ($6 individual, $3 org)
- [x] Cost tracking system
- [x] User throttling mechanism
- [x] Cost analytics dashboard
- [x] Automated monitoring

### ⚙️ Stripe Configuration Required

**1. Create Subscription Products in Stripe Dashboard**

```
Product 1: PRPM+ Individual
- Price: $6.00/month (recurring)
- Currency: USD
- Billing interval: Monthly
- Copy the Price ID: price_xxxxxxxxxxxxx

Product 2: PRPM+ Org Member
- Price: $3.00/month (recurring)
- Currency: USD
- Billing interval: Monthly
- Copy the Price ID: price_yyyyyyyyyyy

Product 3-5: One-Time Credit Purchases
- Small Pack: $5.00 (100 credits)
- Medium Pack: $10.00 (250 credits)
- Large Pack: $20.00 (600 credits)
```

**2. Create Webhook Endpoint**

```
URL: https://yourdomain.com/api/v1/playground/webhooks/stripe/credits
Events to listen for:
  ✓ customer.subscription.created
  ✓ customer.subscription.updated
  ✓ customer.subscription.deleted
  ✓ payment_intent.succeeded
  ✓ charge.refunded

Copy the Webhook Secret: whsec_zzzzzzzzzzzzzz
```

### 🔐 Environment Variables

Add these to your `.env` or deployment environment:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PRPM_PLUS_PRICE_ID=price_xxxxxxxxxxxxx           # $6/month individual
STRIPE_PRPM_PLUS_ORG_MEMBER_PRICE_ID=price_yyyyyyyyyyy  # $3/month org member
STRIPE_PLAYGROUND_WEBHOOK_SECRET=whsec_zzzzzzzzzzzzzz

# Optional: One-time purchase price IDs
STRIPE_SMALL_PACK_PRICE_ID=price_aaaaaaaaaaaa   # $5/100 credits
STRIPE_MEDIUM_PACK_PRICE_ID=price_bbbbbbbbbbbb  # $10/250 credits
STRIPE_LARGE_PACK_PRICE_ID=price_cccccccccccc   # $20/600 credits

# API Keys (already configured)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

---

## Database Migration

### Run Migrations

```bash
# Navigate to registry package
cd packages/registry

# Run all pending migrations (includes 029_add_cost_tracking_and_throttling.sql)
npm run migrate

# Verify migrations
psql $DATABASE_URL -c "SELECT * FROM cost_limits_config;"
```

**Expected output:**
```
           tier_name            | monthly_cost_limit | daily_cost_limit | hourly_request_limit
--------------------------------+--------------------+------------------+----------------------
 free                           |               0.50 |             0.10 |                   10
 prpm_plus_individual           |               5.00 |             1.00 |                  100
 prpm_plus_org                  |               2.50 |             0.50 |                  100
 unlimited                      |          999999.99 |           (null) |               (null)
```

---

## Cron Jobs Setup

### Required Cron Jobs

**1. Monthly Cost Reset (Daily at 00:00 UTC)**
```bash
0 0 * * * psql $DATABASE_URL -c "SELECT reset_monthly_api_costs();" >> /var/log/prpm-monthly-reset.log 2>&1
```

**2. Analytics Refresh (Hourly)**
```bash
0 * * * * psql $DATABASE_URL -c "SELECT refresh_user_cost_analytics();" >> /var/log/prpm-analytics-refresh.log 2>&1
```

**3. Monthly Credit Reset (Daily at 00:05 UTC)**
```bash
5 0 * * * curl -X POST https://yourdomain.com/api/v1/playground/credits/cron/reset >> /var/log/prpm-credit-reset.log 2>&1
```

**4. Rollover Expiration (Daily at 00:10 UTC)**
```bash
10 0 * * * curl -X POST https://yourdomain.com/api/v1/playground/credits/cron/expire >> /var/log/prpm-rollover-expire.log 2>&1
```

### Alternative: Use Node Cron Package

If you prefer in-app cron:

```typescript
import cron from 'node-cron';

// In your server startup
cron.schedule('0 0 * * *', async () => {
  await costMonitoring.resetMonthlyCosts();
  server.log.info('Monthly costs reset');
});

cron.schedule('0 * * * *', async () => {
  await costMonitoring.refreshAnalytics();
  server.log.info('Analytics refreshed');
});
```

---

## Post-Deployment Testing

### Test Checklist

**1. Cost Limits Enforcement**
```bash
# Test user throttling
curl -X GET https://yourdomain.com/api/v1/playground/execute \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -d '{"package_id":"...", "input":"test"}'

# Verify cost is tracked
psql $DATABASE_URL -c "SELECT current_month_api_cost FROM users WHERE id='$TEST_USER_ID';"
```

**2. Subscription Flow**
```bash
# Create PRPM+ subscription
curl -X POST https://yourdomain.com/api/v1/playground/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"successUrl":"https://yourdomain.com/success","cancelUrl":"https://yourdomain.com/cancel"}'

# Complete checkout in Stripe
# Verify webhook received
# Check user status
```

**3. Credit Purchases**
```bash
# Purchase credits
curl -X POST https://yourdomain.com/api/v1/playground/credits/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"package":"small","successUrl":"...","cancelUrl":"..."}'
```

**4. Admin Dashboard**
```bash
# Get cost analytics
curl -X GET https://yourdomain.com/api/v1/admin/cost-analytics/summary \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response:
{
  "totalMonthlyRevenue": 120.00,
  "totalMonthlyCost": 8.50,
  "overallMargin": 92.92,
  "activeUsers": 20,
  "throttledUsers": 0,
  "highRiskUsers": 1
}
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

**1. Cost Metrics (Check Hourly)**
- Total monthly API costs
- Users approaching 90% of limit
- Users who have been throttled
- Overall margin percentage

**Alert if:**
- Overall margin drops below 70%
- Any user exceeds their tier limit
- More than 5% of users are throttled

**2. Database Queries for Monitoring**

```sql
-- Users at risk of throttling (>75% of limit)
SELECT email, current_month_api_cost, tier_name, monthly_cost_limit
FROM users u
JOIN cost_limits_config c ON c.tier_name = (
  CASE
    WHEN u.prpm_plus_status = 'active' THEN
      CASE
        WHEN EXISTS (SELECT 1 FROM organization_members om WHERE om.user_id = u.id)
        THEN 'prpm_plus_org'
        ELSE 'prpm_plus_individual'
      END
    ELSE 'free'
  END
)
WHERE (u.current_month_api_cost / c.monthly_cost_limit) > 0.75;

-- High-risk users (expensive usage patterns)
SELECT * FROM user_cost_analytics
WHERE risk_level = 'high_risk'
ORDER BY current_month_api_cost DESC
LIMIT 10;

-- Overall health check
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_throttled) as throttled,
  ROUND(AVG(current_month_api_cost), 4) as avg_cost,
  ROUND(SUM(current_month_api_cost), 2) as total_cost
FROM users
WHERE current_month_api_cost > 0;
```

---

## Cost Limits Reference

| Tier | Monthly Revenue | Monthly Cost Limit | Margin Target | Throttle at | Alert at |
|------|-----------------|--------------------|--------------| ------------|----------|
| Free | $0.00 | $0.50 | N/A | $0.50 | $0.40 (80%) |
| Individual | $6.00 | $5.00 | 83% | $5.00 | $4.50 (90%) |
| Org Member | $3.00 | $2.50 | 83% | $2.50 | $2.25 (90%) |

### Adjustment Recommendations

**If margins drop below 70%:**
1. Reduce org cost limit to $2.00 (from $2.50)
2. Increase individual price to $7.00 (from $6.00)
3. Lower request size limit to 15,000 tokens (from 20,000)

**If too many users are throttled (>10%):**
1. Increase cost limits by 20%
2. Add new tier at $10/month with $8.00 limit
3. Send email warnings at 75% usage (not just 90%)

---

## Financial Projections

### Expected Margins (Based on Testing)

**Scenario: 100 Active Users**
- 60 PRPM+ Individual @ $6/month = $360
- 30 PRPM+ Org @ $3/month = $90
- 10 Free users = $0

**Total Revenue:** $450/month

**Expected API Costs:**
- Individual users avg $0.92/month = $55.20
- Org users avg $0.60/month = $18.00
- Free users avg $0.15/month = $1.50

**Total Costs:** $74.70/month

**Profit:** $375.30/month
**Overall Margin:** 83.4% ✅

---

## Rollback Plan

If issues arise after deployment:

**1. Disable throttling temporarily**
```sql
UPDATE users SET is_throttled = FALSE;
UPDATE cost_limits_config SET throttle_on_exceed = FALSE;
```

**2. Revert pricing (if needed)**
```sql
-- Revert to old pricing in code, then redeploy
-- Old: $5 individual, $2 org
```

**3. Emergency cost cap**
```sql
-- Hard limit all users to $10/month
UPDATE cost_limits_config SET monthly_cost_limit = 10.00;
```

---

## Support & Troubleshooting

### Common Issues

**1. User reports "throttled" error but hasn't used credits**
```sql
-- Check their actual cost
SELECT current_month_api_cost, is_throttled, throttled_reason
FROM users WHERE email = 'user@example.com';

-- Manual unthrottle if false positive
UPDATE users SET is_throttled = FALSE WHERE email = 'user@example.com';
```

**2. Cost analytics not updating**
```sql
-- Manually refresh
SELECT refresh_user_cost_analytics();

-- Check last refresh time
SELECT NOW() - created_at FROM user_cost_analytics LIMIT 1;
```

**3. Webhook not receiving events**
- Check Stripe Dashboard → Webhooks → Events
- Verify webhook secret matches env var
- Check server logs for errors

---

## Success Criteria

✅ **Deployment is successful when:**

1. 10 test subscriptions created without errors
2. Cost tracking shows accurate API costs (±5%)
3. User throttling works (tested with free tier user)
4. Admin dashboard shows correct metrics
5. Webhook events processed successfully
6. Overall margin is 80%+ across all users
7. No users throttled unexpectedly
8. Cron jobs running successfully

---

## Next Steps After Deployment

**Week 1:**
- Monitor margins daily
- Review throttled users (should be <1%)
- Adjust cost limits if needed

**Week 2:**
- Analyze usage patterns
- Identify high-value use cases
- Consider adding premium tiers

**Month 1:**
- Review overall profitability
- Adjust pricing if margins <70%
- Implement prompt caching (potential 90% savings)

---

**Questions or Issues?**
- Check logs: `tail -f /var/log/prpm-*.log`
- Database health: Run queries in "Monitoring" section
- Stripe issues: Check Stripe Dashboard → Webhooks → Events

**Deployment completed by:** _________________
**Date:** _________________
**Verified by:** _________________
