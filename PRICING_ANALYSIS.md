# PRPM Playground Pricing Analysis

**Date:** 2025-11-03
**Status:** ⚠️ **FINANCIALLY PROBLEMATIC** - Margins are too thin or negative

---

## Executive Summary

After analyzing the PRPM playground pricing structure, there are **significant financial viability concerns**:

1. **Credit-to-Cost Ratio is Unclear** - No clear mapping between 1 credit and actual API costs
2. **PRPM+ Subscription May Be Loss-Leader** - $5/month for 100 credits vs. potential API costs
3. **One-Time Purchase Margins Unknown** - Need to calculate actual API costs per credit
4. **Org Member Discount (60% off) is Very Aggressive** - $2/month may not cover costs

---

## Current Pricing Structure

### One-Time Credit Purchases

| Package | Credits | Price | $/Credit | Value Proposition |
|---------|---------|-------|----------|-------------------|
| Small   | 100     | $5.00 | $0.050   | Entry level       |
| Medium  | 250     | $10.00| $0.040   | Most Popular (20% savings) |
| Large   | 600     | $20.00| $0.033   | Best Value (33% savings) |

### PRPM+ Subscription (Recurring Monthly)

| Tier | Price/Month | Credits/Month | $/Credit | Discount |
|------|-------------|---------------|----------|----------|
| Individual | $5.00 | 100 | $0.050 | - |
| Org Member | $2.00 | 100 | $0.050 | 60% off subscription price |

**Key Features:**
- Credits roll over (max 200 total, expire after 1 month if unused)
- Purchased credits never expire
- Monthly credits reset at billing cycle

---

## Credit Cost Calculation

### Current Credit Pricing Logic

From `packages/registry/src/services/playground.ts`:

```typescript
estimateCredits(promptLength, userInputLength, model, conversationHistory) {
  // Calculate approximate tokens
  const totalChars = promptLength + userInputLength + (historyTokens * 4);
  const estimatedTokens = (totalChars / 4) * 1.3; // 30% buffer for response

  // Model-specific pricing
  if (model === 'opus') return 3;      // Claude Opus
  if (model === 'gpt-4o') return 2;     // GPT-4o
  // Default (Sonnet, GPT-4o-mini, etc.)
  return 1;  // 1 credit per request
}
```

**⚠️ PROBLEM: This pricing is request-based, NOT token-based!**

- **1 credit** = 1 request for Sonnet/GPT-4o-mini (regardless of size!)
- **2 credits** = 1 request for GPT-4o
- **3 credits** = 1 request for Opus

This is **extremely risky** because:
1. Users can send huge prompts and pay the same flat rate
2. No protection against long conversations with large context
3. No dynamic pricing based on actual token usage

---

## Actual API Costs (As of 2025)

### Anthropic Pricing

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Typical Request Cost |
|-------|----------------------|------------------------|----------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 | $0.003 - $0.05 |
| Claude 3 Opus | $15.00 | $75.00 | $0.015 - $0.25 |

### OpenAI Pricing

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Typical Request Cost |
|-------|----------------------|------------------------|----------------------|
| GPT-4o | $2.50 | $10.00 | $0.0025 - $0.04 |
| GPT-4o-mini | $0.15 | $0.60 | $0.0002 - $0.003 |
| GPT-4 Turbo | $10.00 | $30.00 | $0.01 - $0.12 |

**Typical Request Assumptions:**
- Input: 1,000 - 5,000 tokens (prompt + user input + context)
- Output: 500 - 2,000 tokens (model response)
- Average total: 1,500 - 7,000 tokens per request

---

## Financial Viability Analysis

### Scenario 1: Small Prompts (1,500 tokens total)

**Cost per Request:**
- Sonnet: ~$0.003 (1,000 input + 500 output)
- GPT-4o: ~$0.0025
- Opus: ~$0.015

**PRPM Charges:**
- Sonnet: 1 credit = $0.05 → **Profit: $0.047** ✅
- GPT-4o: 2 credits = $0.10 → **Profit: $0.0975** ✅
- Opus: 3 credits = $0.15 → **Profit: $0.135** ✅

**Margin:** 90%+ 💰 **Very Profitable**

---

### Scenario 2: Medium Prompts (5,000 tokens total)

**Cost per Request:**
- Sonnet: ~$0.012 (3,000 input + 2,000 output)
- GPT-4o: ~$0.0125
- Opus: ~$0.06

**PRPM Charges:**
- Sonnet: 1 credit = $0.05 → **Profit: $0.038** ✅
- GPT-4o: 2 credits = $0.10 → **Profit: $0.0875** ✅
- Opus: 3 credits = $0.15 → **Profit: $0.09** ✅

**Margin:** 75-85% 💰 **Still Profitable**

---

### Scenario 3: Large Prompts (15,000 tokens total)

**Cost per Request:**
- Sonnet: ~$0.035 (10,000 input + 5,000 output)
- GPT-4o: ~$0.0375
- Opus: ~$0.175

**PRPM Charges:**
- Sonnet: 1 credit = $0.05 → **Profit: $0.015** ⚠️ Thin margin
- GPT-4o: 2 credits = $0.10 → **Profit: $0.0625** ✅
- Opus: 3 credits = $0.15 → **LOSS: -$0.025** ❌ **UNPROFITABLE**

**Margin:** 30% to -14% ⚠️ **Break-even or loss territory**

---

### Scenario 4: Very Large Context (50,000 tokens - Max context window)

**Cost per Request:**
- Sonnet: ~$0.12 (35,000 input + 15,000 output)
- GPT-4o: ~$0.13
- Opus: ~$0.60

**PRPM Charges:**
- Sonnet: 1 credit = $0.05 → **LOSS: -$0.07** ❌
- GPT-4o: 2 credits = $0.10 → **LOSS: -$0.03** ❌
- Opus: 3 credits = $0.15 → **LOSS: -$0.45** ❌

**Margin:** -60% to -75% 🔥 **MAJOR LOSSES**

---

## PRPM+ Subscription Analysis

### Individual Plan: $5/month for 100 credits

**Best Case (small prompts only):**
- User uses 100 credits on Sonnet (100 small requests)
- Cost to PRPM: 100 × $0.003 = **$0.30**
- Revenue: $5.00
- Profit: **$4.70** ✅
- **Margin: 94%** 💰

**Worst Case (abusive usage):**
- User uses 100 credits on Sonnet (100 large context requests)
- Cost to PRPM: 100 × $0.12 = **$12.00**
- Revenue: $5.00
- **Loss: -$7.00** ❌
- **Margin: -140%** 🔥

**Average Case (mixed usage):**
- 70 small-medium Sonnet requests ($0.007 avg) = $0.49
- 20 GPT-4o requests (2 credits each, $0.0125 avg) = $0.25
- 3 Opus requests (3 credits each, $0.06 avg) = $0.18
- Total cost: **$0.92**
- Profit: **$4.08**
- **Margin: 82%** ✅

### Org Member Plan: $2/month for 100 credits

**Best Case:** Profit: $1.70 (85% margin) ✅

**Average Case:** Profit: $1.08 (54% margin) ⚠️ Thin but viable

**Worst Case:** Loss: -$10.00 (-500% margin) ❌

---

## Risk Assessment

### 🔴 HIGH RISKS

1. **No Token Usage Limits**
   - Users can send 50,000+ token requests for 1 credit
   - No rate limiting on context size
   - **Mitigation:** Add token caps per request (e.g., max 10,000 tokens = 1 credit)

2. **Opus Pricing is Break-Even at Best**
   - 3 credits ($0.15) barely covers medium-sized Opus requests
   - Large Opus requests will lose money
   - **Mitigation:** Increase Opus to 5-10 credits, or remove Opus from PRPM+ entirely

3. **Org Member Discount Too Aggressive**
   - 60% off ($2/month) leaves only $1-2 profit margin on average usage
   - Single abusive user can wipe out margins
   - **Mitigation:** Reduce discount to 40% ($3/month) or add stricter usage limits

4. **No Protection Against API Cost Spikes**
   - If Anthropic/OpenAI raise prices, margins disappear immediately
   - **Mitigation:** Build in 50% price buffer or implement pass-through pricing

### 🟡 MEDIUM RISKS

1. **Credit Rollover Accumulation**
   - Users can bank 200 credits and potentially abuse large requests
   - **Mitigation:** Lower rollover cap to 100 or reduce expiration to 2 weeks

2. **No Fraud Detection**
   - Bots could purchase small packs and run maximum context requests
   - **Mitigation:** Add behavioral analysis and flag suspicious patterns

3. **Chargeback Risk on Credit Purchases**
   - User could purchase $20 pack, use all credits, then chargeback
   - **Mitigation:** Stripe fraud detection + automated blocking on chargeback

### 🟢 LOW RISKS

1. **Subscription Economics Generally Sound**
   - Most users will use small-medium requests
   - Natural usage patterns favor profitability

2. **Purchased Credits Don't Expire**
   - Low risk - users pre-paid, no ongoing liability

---

## Recommendations

### 🔥 CRITICAL (Implement Before Launch)

1. **Add Token-Based Pricing**
   ```typescript
   // Instead of flat 1/2/3 credits
   function calculateCredits(tokens: number, model: string): number {
     const baseCredits = Math.ceil(tokens / 5000); // 1 credit per 5K tokens
     const modelMultiplier = {
       'sonnet': 1.0,
       'gpt-4o': 1.5,
       'opus': 3.0,
       'gpt-4o-mini': 0.5
     };
     return Math.max(1, Math.ceil(baseCredits * modelMultiplier[model]));
   }
   ```

2. **Add Request Size Limits**
   - Max 10,000 tokens per request for Sonnet/GPT-4o (1 credit)
   - Max 20,000 tokens per request for Opus (3 credits)
   - Charge additional credits for larger requests

3. **Increase Opus Pricing**
   - **Minimum 5 credits** for Opus (up from 3)
   - Or remove Opus from PRPM+ subscription entirely (purchase-only)

4. **Reduce Org Member Discount**
   - Change from 60% off ($2) to **40% off ($3)**
   - Or keep $2 but add stricter usage caps (50 credits/month instead of 100)

### ⚠️ IMPORTANT (Implement Within 3 Months)

1. **Add Usage Monitoring Dashboard**
   - Track cost-per-user metrics
   - Alert when users exceed expected cost thresholds
   - Auto-throttle accounts with abnormal usage

2. **Implement Fair Use Policy**
   - Document acceptable use in ToS
   - Reserve right to limit accounts with excessive token usage
   - Auto-downgrade abusive users to pay-per-use only

3. **Create Tiered PRPM+ Plans**
   ```
   Basic:   $5/month  → 50 credits  (safer margins)
   Pro:     $10/month → 150 credits (better economics)
   Premium: $20/month → 400 credits (best value)
   ```

4. **Add Cost Alerts for Users**
   - Show estimated token count before execution
   - Warn users when request will use multiple credits
   - Suggest optimizations to reduce costs

### 💡 NICE TO HAVE (Future Enhancements)

1. **Dynamic Pricing Based on Actual Costs**
   - Pass through API price changes automatically
   - Adjust credit pricing quarterly based on usage data

2. **Volume Discounts for Enterprise**
   - $50/month → 1,500 credits (better than $100 for 600 × 2.5)
   - Requires volume commitments to ensure margins

3. **Model-Specific Subscriptions**
   - "Sonnet Unlimited" - $10/month, only Sonnet/GPT-4o-mini
   - "Multi-Model" - $15/month, includes Opus/GPT-4o

---

## Competitive Benchmarking

### Direct Competitors

| Service | Pricing | Model | Notes |
|---------|---------|-------|-------|
| **Cursor** | $20/month | 500 requests + unlimited autocomplete | Claude Sonnet, GPT-4 |
| **GitHub Copilot** | $10/month | Unlimited | GPT-4, Claude |
| **Claude Pro** | $20/month | Unlimited | Claude Sonnet + Opus |
| **ChatGPT Plus** | $20/month | Unlimited | GPT-4o + GPT-4 Turbo |
| **PRPM+ Individual** | $5/month | 100 credits (~100 requests) | Multiple models |
| **PRPM+ Org Member** | $2/month | 100 credits (~100 requests) | Multiple models |

**Analysis:**
- PRPM is **4-10x cheaper** than competitors
- But provides **significantly fewer requests** (100 vs. 500-unlimited)
- **Value prop unclear** - why would users choose PRPM over Cursor/Claude Pro?

**Positioning Options:**
1. **Budget Option:** Keep $5/month but emphasize lower usage / experimentation
2. **Premium Pricing:** Increase to $15-20/month and offer unlimited small requests
3. **Freemium + Upsell:** Free tier (10 credits/month) → Paid ($15/month unlimited)

---

## Revised Pricing Recommendation

### Option A: Token-Based Pricing (Safest)

**One-Time Purchases:**
- Small: 100 credits @ $5 = $0.05/credit
- Medium: 300 credits @ $10 = $0.033/credit
- Large: 750 credits @ $20 = $0.027/credit

**Credit Calculation:**
- 1 credit = 5,000 tokens (Sonnet/GPT-4o-mini)
- GPT-4o: 1.5x multiplier
- Opus: 3.0x multiplier

**PRPM+ Subscription:**
- Individual: $10/month → 200 credits (same $/credit, better margins)
- Org Member: $5/month → 100 credits (50% off instead of 60%)

**Margins:** 60-80% across all usage patterns ✅

---

### Option B: Tiered Unlimited (Most Competitive)

**PRPM+ Tiers:**
- **Starter:** $5/month → Unlimited Sonnet/GPT-4o-mini (max 10K tokens/request)
- **Pro:** $15/month → Unlimited Sonnet/GPT-4o + limited Opus (10/month)
- **Org Bundle:** $50/month → Covers 5 team members (Starter tier each)

**Credit Purchases:** Remove entirely (subscription-only model)

**Margins:** 40-60% if usage patterns match competitors ✅

---

### Option C: Hybrid Model (Recommended)

**Free Tier:**
- 10 credits/month (Sonnet only, max 5K tokens/request)
- Designed for experimentation

**PRPM+ Individual:**
- $10/month → 150 credits
- Token-based pricing (1 credit = 5K tokens)
- All models available

**PRPM+ Org Member:**
- $5/month → 100 credits (50% off)
- Same token-based pricing

**One-Time Purchases:**
- Keep existing tiers but implement token-based charging

**Margins:** 70-85% across tiers ✅
**Market Position:** Premium experimentation platform, not direct Cursor competitor

---

## Conclusion

### Current State: ⚠️ **NOT FINANCIALLY VIABLE**

The current pricing has **serious financial risks**:
1. Flat per-request pricing allows abuse
2. Opus pricing is break-even or negative
3. Org member discount (60%) is too aggressive
4. No protection against large context requests

### Minimum Viable Changes (Before Launch):

1. ✅ **Implement token-based pricing** (1 credit = 5,000 tokens)
2. ✅ **Add request size limits** (max 10K-20K tokens per request)
3. ✅ **Increase Opus pricing** to 5 credits minimum
4. ✅ **Reduce org discount** to 50% ($5/month) or increase price to $10/month for individuals

### Long-Term Strategy:

- **Position as experimentation platform**, not production AI access
- **Target developers testing prompts**, not replacing ChatGPT/Cursor
- **Upsell to verified orgs** for team-wide usage
- **Monitor usage patterns closely** and adjust pricing quarterly

**Estimated Implementation Time:** 1-2 weeks to add token-based pricing and limits

---

**Last Updated:** 2025-11-03
**Status:** ⚠️ Requires immediate attention before production launch
