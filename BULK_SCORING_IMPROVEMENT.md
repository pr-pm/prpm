# Future Improvement: Bulk AI Scoring for Package Quality Evaluation

## Problem Statement

Currently, the AI-powered quality scoring system evaluates packages one at a time, making individual API calls to Anthropic's Claude API for each package. When processing many packages (e.g., during initial seeding, batch re-scoring, or high-traffic publish periods), this approach results in:

1. **High API costs** - Each package = 1 API call
2. **Slow processing** - Sequential evaluation takes significant time
3. **Rate limiting risks** - Many rapid requests may hit provider limits
4. **Inefficient use of context** - Cannot leverage batch optimizations

## Proposed Solution: Bulk Scoring

### Implementation Approach

#### 1. Batch Evaluation API

Create a new function that evaluates multiple prompts in a single API request:

```typescript
/**
 * Evaluate multiple prompts in a single AI request
 * More cost-effective and faster than individual evaluations
 */
export async function evaluatePromptsInBulk(
  prompts: Array<{ id: string; content: any }>,
  server: FastifyInstance
): Promise<Map<string, number>> {
  // Build a single structured prompt with multiple packages
  const bulkPrompt = buildBulkEvaluationPrompt(prompts);

  // Single API call evaluates all prompts
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096, // More tokens for multiple evaluations
    messages: [{ role: 'user', content: bulkPrompt }]
  });

  // Parse response with scores for each package
  return parseBulkEvaluationResponse(response, prompts);
}
```

#### 2. Structured Bulk Prompt Format

```
You are evaluating multiple AI prompts. For each prompt, provide:
- ID: [package-id]
- SCORE: [0.0-1.0]
- BRIEF: [one sentence reasoning]

PROMPT 1 (ID: react-best-practices):
---
[prompt content here]
---

PROMPT 2 (ID: typescript-patterns):
---
[prompt content here]
---

Evaluate each prompt on: Clarity (25%), Structure (25%), Effectiveness (30%), Best Practices (20%).
Return scores in order.
```

#### 3. Batch Processing Strategy

**Optimal Batch Sizes:**
- **Small batch**: 5-10 packages per API call
- **Medium batch**: 10-20 packages (balance cost/speed)
- **Large batch**: 20-50 packages (max context efficiency)

**Processing Flow:**
```typescript
async function updateQualityScoresInBulk(packageIds: string[]) {
  const BATCH_SIZE = 20;
  const batches = chunkArray(packageIds, BATCH_SIZE);

  for (const batch of batches) {
    // Fetch all package contents
    const packages = await fetchPackageContents(batch);

    // Single AI call for entire batch
    const scores = await evaluatePromptsInBulk(packages, server);

    // Update all scores in database (single transaction)
    await updateScoresInDatabase(scores);

    // Brief delay between batches
    await sleep(200);
  }
}
```

### Cost Analysis

**Current Approach (Individual):**
- 1000 packages = 1000 API calls
- Estimated cost: $10-20 (depending on prompt sizes)
- Time: ~30-60 minutes (with delays)

**Bulk Approach (Batch of 20):**
- 1000 packages = 50 API calls
- Estimated cost: $2-4 (20x reduction)
- Time: ~5-10 minutes (6x faster)

**Savings:**
- **80-90% cost reduction**
- **5-10x speed improvement**
- **Fewer rate limit issues**

## Implementation Plan

### Phase 1: Prototype Bulk Evaluator
1. Create `evaluatePromptsInBulk()` function
2. Test with small batches (5-10 packages)
3. Validate score accuracy vs individual evaluation
4. Measure cost/speed improvements

### Phase 2: Optimize Prompt Engineering
1. Design compact bulk evaluation prompt
2. Test different batch sizes for optimal token usage
3. Implement parallel parsing of bulk responses
4. Add error handling for partial batch failures

### Phase 3: Integration
1. Update `updateAllQualityScores()` to use bulk evaluation
2. Add configuration: `AI_BULK_EVALUATION_ENABLED=true`
3. Set optimal batch size: `AI_BULK_BATCH_SIZE=20`
4. Maintain backward compatibility with single evaluation

### Phase 4: Monitoring
1. Track bulk vs individual evaluation accuracy
2. Monitor API costs and usage patterns
3. A/B test different batch sizes
4. Measure impact on scoring quality

## Alternative Approaches

### Option A: Anthropic's Batch API
- Use official batch processing API (if available)
- Submit jobs, retrieve results asynchronously
- Lower cost but higher latency
- Best for: Background re-scoring of existing packages

### Option B: Hybrid Approach
- Individual evaluation for new publishes (low latency)
- Bulk evaluation for batch operations (cost-effective)
- Smart routing based on urgency and volume
- Best for: Production with mixed workloads

### Option C: OpenAI Batch API
- OpenAI offers 50% discount for batch processing
- 24-hour turnaround time
- Best for: Non-urgent bulk re-scoring
- Could support both Anthropic and OpenAI

## Technical Considerations

### Challenges

1. **Context Window Limits**
   - Claude Sonnet: ~200K tokens
   - Average prompt: 1-2K tokens
   - Realistic batch: 20-50 prompts per call

2. **Response Parsing**
   - Must reliably extract individual scores
   - Handle partial failures gracefully
   - Validate score format consistency

3. **Error Handling**
   - What if one prompt in batch fails evaluation?
   - Retry entire batch or just failed items?
   - Fallback to individual evaluation?

4. **Fairness**
   - Ensure first/last prompts in batch don't get biased scores
   - Randomize order or use structured format?
   - Validate consistency across batches

### Solutions

1. **Chunking Strategy**
   - Estimate token count before batching
   - Dynamic batch sizes based on prompt complexity
   - Reserve tokens for response and reasoning

2. **Structured Output**
   - Use JSON output format for reliable parsing
   - Include confidence scores
   - Request specific format in prompt

3. **Fallback Chain**
   ```
   Bulk Evaluation (20 prompts)
     ↓ (if fails)
   Medium Batch (10 prompts)
     ↓ (if fails)
   Small Batch (5 prompts)
     ↓ (if fails)
   Individual Evaluation
     ↓ (if fails)
   Heuristic Scoring
   ```

4. **Validation**
   - Sample 10% of bulk scores for individual verification
   - Alert if bulk scores deviate significantly
   - Periodic quality audits

## Expected Benefits

### Cost Savings
- **Immediate**: 80% reduction in API costs for bulk operations
- **Long-term**: $500-1000/month savings at scale (10K packages)

### Performance
- **Seed scripts**: 30 minutes → 5 minutes
- **Re-scoring**: Hours → 20-30 minutes
- **User experience**: Faster publish if using bulk background jobs

### Scalability
- Handle 10K+ packages efficiently
- Support rapid package submission periods
- Enable more frequent quality re-evaluation

### Quality
- More consistent scoring across similar prompts
- Comparative analysis within batches
- Better handling of edge cases

## Migration Path

### Step 1: Add Feature Flag
```typescript
const config = {
  ai: {
    bulkEvaluationEnabled: process.env.AI_BULK_EVALUATION_ENABLED === 'true',
    bulkBatchSize: parseInt(process.env.AI_BULK_BATCH_SIZE || '20'),
  }
};
```

### Step 2: Implement Side-by-Side
```typescript
// Keep both approaches
if (packages.length > 10 && config.ai.bulkEvaluationEnabled) {
  return await evaluatePromptsInBulk(packages, server);
} else {
  return await Promise.all(
    packages.map(pkg => evaluatePromptWithAI(pkg.content, server))
  );
}
```

### Step 3: Gradual Rollout
1. Week 1: Test on 10% of batch operations
2. Week 2: Increase to 50% with monitoring
3. Week 3: Compare cost/quality metrics
4. Week 4: Full rollout if successful

### Step 4: Deprecate Individual (Optional)
- Keep individual evaluation for real-time publish
- Use bulk for all background operations
- Document best practices for each approach

## Success Metrics

**Primary Goals:**
- [ ] 70%+ reduction in AI API costs for bulk operations
- [ ] 5x+ speed improvement for batch scoring
- [ ] <5% score deviation vs individual evaluation

**Secondary Goals:**
- [ ] Zero rate limit errors during bulk operations
- [ ] 99.9% successful batch processing rate
- [ ] <100ms additional latency for response parsing

**Quality Metrics:**
- [ ] Pearson correlation >0.95 between bulk and individual scores
- [ ] No systematic bias in batch evaluation order
- [ ] User-reported quality issues <1%

## References

### Related Files
- Current implementation: `packages/registry/src/scoring/ai-evaluator.ts`
- Quality scorer: `packages/registry/src/scoring/quality-scorer.ts`
- Batch update: `packages/registry/scripts/update-quality-scores.ts`

### Documentation
- Anthropic Batch API: https://docs.anthropic.com/en/docs/build-with-claude/batch-processing
- OpenAI Batch API: https://platform.openai.com/docs/guides/batch
- Cost optimization: `AI_QUALITY_SCORING.md`

### Prior Art
- Vector database bulk embeddings (similar pattern)
- Google Cloud Natural Language bulk analysis
- AWS Comprehend batch processing

## Timeline Estimate

**MVP (Bulk Evaluator):** 2-3 days
- Implement `evaluatePromptsInBulk()` function
- Test with small datasets
- Validate accuracy

**Production Ready:** 1 week
- Error handling and retry logic
- Configuration and feature flags
- Documentation and testing

**Full Rollout:** 2 weeks
- Monitoring and alerting
- A/B testing and validation
- Migration of existing operations

**Total:** 3-4 weeks for complete implementation

## Priority

**Urgency:** Medium-High
- Not critical for initial launch
- Becomes essential at scale (1000+ packages)
- Quick wins on cost optimization

**Impact:** High
- Significant cost reduction
- Better user experience
- Enables more aggressive quality re-evaluation

**Effort:** Medium
- Well-defined problem
- Existing patterns to follow
- Minimal infrastructure changes

**Recommendation:** Implement after initial launch, before reaching 500+ packages in registry.

---

*Document created: 2025-10-20*
*Status: Proposed Enhancement*
*Owner: To be assigned*
