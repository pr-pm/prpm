# Quality Scoring Logging Guide

## Overview

Comprehensive logging for the AI-powered quality scoring system provides full visibility into how packages are evaluated. Every step of the scoring process is logged with colored, emoji-enriched output for easy debugging and analysis.

## Logging Flow

### 1. Package Publish Triggers Scoring

When a package is published, the quality scoring automatically runs:

```
[INFO] 📦 Publishing package: react-best-practices@1.0.0
[INFO] 🎯 Starting quality score calculation
    packageId: "react-best-practices"
```

### 2. Package Metadata Retrieved

```
[INFO] 📋 Package metadata retrieved
    packageId: "react-best-practices"
    packageName: "React Best Practices"
    type: "metadata"
    verified: true
    official: false
    downloads: 150
    stars: 25
    versions: 5
```

### 3. AI Evaluation Process

#### 3a. AI Evaluation Starts
```
[INFO] 🤖 Starting AI prompt evaluation...
```

#### 3b. Prompt Text Extraction
```
[INFO] 📊 Extracted prompt text for AI evaluation
    promptLength: 2450
    hasStructure: true
    sectionCount: 5
```

#### 3c. AI API Call
```
[INFO] ✅ AI evaluation completed: 0.850/1.000 (1250ms)
    score: 0.85
    reasoning: "Well-structured prompt with clear instructions and examples. Good use of sections..."
    strengths: 3
    weaknesses: 2
    promptLength: 2450
    apiDuration: 1250
    hasStructure: true
```

### 4. Score Calculation

```
[INFO] 📊 Base score calculated
    packageId: "react-best-practices"
    baseScore: "2.35"
    calculationTime: 1275
```

### 5. Author Bonus Applied

```
[INFO] 👤 Author bonus applied
    packageId: "react-best-practices"
    authorId: "user-123"
    authorBonus: "0.15"
```

### 6. Final Score

```
[INFO] ✅ Quality score updated: 2.50/5.00
    packageId: "react-best-practices"
    packageName: "React Best Practices"
    finalScore: 2.5
    scoreBreakdown: {
      base: "2.35",
      authorBonus: "0.15",
      total: "2.50"
    }
    totalTime: 1350
```

## Fallback Scenarios

### AI Evaluation Disabled

```
[INFO] 🤖 AI evaluation disabled, using heuristic scoring
```

### Short Prompt Content

```
[INFO] ⚠️  Prompt too short for AI evaluation, using fallback
    promptLength: 35
    minRequired: 50
```

### AI API Failure

```
[WARN] ⚠️  AI evaluation failed, falling back to heuristic scoring
    error: "Request timeout"
    errorType: "TimeoutError"
    stack: "Error: Request timeout at..."
```

## Complete Example Flow

### High-Quality Package with AI Evaluation

```bash
# Package Publish Initiated
[INFO] ➡️  POST /api/v1/packages/react-best-practices/publish
    method: "POST"
    url: "/api/v1/packages/react-best-practices/publish"
    ip: "192.168.1.100"

[INFO] 📦 Publishing package: react-best-practices@1.0.0

# Quality Scoring Starts
[INFO] 🎯 Starting quality score calculation
    packageId: "react-best-practices"

[INFO] 📋 Package metadata retrieved
    packageId: "react-best-practices"
    packageName: "React Best Practices"
    verified: true
    official: false
    downloads: 150
    stars: 25
    versions: 5

# AI Evaluation
[INFO] 🤖 Starting AI prompt evaluation...

[INFO] 📊 Extracted prompt text for AI evaluation
    promptLength: 2450
    hasStructure: true
    sectionCount: 5

[INFO] ✅ AI evaluation completed: 0.850/1.000 (1250ms)
    score: 0.85
    reasoning: "Well-structured prompt with clear instructions and comprehensive examples..."
    strengths: 3
    weaknesses: 2
    promptLength: 2450
    apiDuration: 1250

# Score Calculation
[INFO] 📊 Base score calculated
    packageId: "react-best-practices"
    baseScore: "2.35"
    calculationTime: 1275

[INFO] 👤 Author bonus applied
    packageId: "react-best-practices"
    authorId: "user-123"
    authorBonus: "0.15"

[INFO] ✅ Quality score updated: 2.50/5.00
    packageId: "react-best-practices"
    packageName: "React Best Practices"
    finalScore: 2.5
    scoreBreakdown: {
      base: "2.35",
      authorBonus: "0.15",
      total: "2.50"
    }
    totalTime: 1350

[INFO] 📦 Updated quality score after publish
    packageId: "react-best-practices"
    qualityScore: 2.5

[INFO] ⬅️  POST /api/v1/packages/react-best-practices/publish - 200 (2500ms)
    method: "POST"
    statusCode: 200
    responseTime: 2500
```

### Low-Quality Package with Heuristic Fallback

```bash
[INFO] 🎯 Starting quality score calculation
    packageId: "minimal-prompt"

[INFO] 📋 Package metadata retrieved
    packageId: "minimal-prompt"
    packageName: "Minimal Prompt"
    verified: false
    official: false
    downloads: 0
    stars: 0
    versions: 1

[INFO] 🤖 Starting AI prompt evaluation...

[INFO] ⚠️  Prompt too short for AI evaluation, using fallback
    promptLength: 25
    minRequired: 50

[INFO] 📊 Base score calculated
    packageId: "minimal-prompt"
    baseScore: "0.45"
    calculationTime: 15

[INFO] ✅ Quality score updated: 0.45/5.00
    packageId: "minimal-prompt"
    packageName: "Minimal Prompt"
    finalScore: 0.45
    scoreBreakdown: {
      base: "0.45",
      authorBonus: "0.00",
      total: "0.45"
    }
    totalTime: 45
```

## Emoji Legend

### Scoring Process
- 🎯 **Quality Calculation** - Starting scoring process
- 📋 **Metadata** - Package metadata retrieved
- 🤖 **AI Evaluation** - AI-powered scoring in progress
- 📊 **Score Calculation** - Computing scores
- 👤 **Author Bonus** - Author credibility bonus applied
- ✅ **Success** - Scoring completed successfully

### Status Indicators
- ⚡ **Fast Path** - Cache hit or optimized path
- ⚠️ **Warning** - Fallback or non-critical issue
- ❌ **Error** - Scoring failed

### Content Analysis
- 📝 **Content Quality** - Analyzing prompt content
- 🔍 **Structure Check** - Checking canonical format
- 💬 **Text Extraction** - Extracting prompt text
- 🧮 **Calculation** - Computing component scores

## Log Filtering Examples

### View All Scoring Activity
```bash
npm run dev 2>&1 | grep "🎯\|🤖\|📊\|✅"
```

### View AI Evaluations Only
```bash
npm run dev 2>&1 | grep "🤖"
```

### View High Scores (>4.0)
```bash
npm run dev 2>&1 | grep "Quality score updated" | grep -E "4\.[0-9]|5\.0"
```

### View Warnings and Errors
```bash
npm run dev 2>&1 | grep -E "WARN|ERROR|⚠️|❌"
```

### View Timing Information
```bash
npm run dev 2>&1 | grep -E "apiDuration|calculationTime|totalTime"
```

## Score Breakdown Components

### Content Quality (40% = 2.0 points)
- **Prompt Content (AI)**: 1.0 points - Main factor
- **Prompt Length**: 0.3 points
- **Examples**: 0.2 points
- **Documentation**: 0.2 points
- **Description**: 0.2 points
- **Repository/Metadata**: 0.1 points

### Author Credibility (30% = 1.5 points)
- **Verified Author**: 0.5 points
- **Author Package Count**: 0.3 points
- **Official Package**: 0.7 points

### Engagement (20% = 1.0 points)
- **Downloads**: 0.4 points (logarithmic)
- **Stars**: 0.3 points
- **Ratings**: 0.3 points

### Maintenance (10% = 0.5 points)
- **Recency**: 0.3 points
- **Version Count**: 0.2 points

## Performance Metrics

### Timing Breakdown

**With AI Evaluation:**
```
Prompt Extraction: ~10ms
AI API Call: ~800-2000ms
Score Calculation: ~5ms
Database Update: ~10ms
Total: ~1000-2500ms
```

**Without AI (Heuristic):**
```
Heuristic Scoring: ~5ms
Score Calculation: ~5ms
Database Update: ~10ms
Total: ~20-50ms
```

### Expected Durations

| Operation | Typical | Acceptable | Slow |
|-----------|---------|------------|------|
| AI Evaluation | 1-2s | <3s | >5s |
| Heuristic Scoring | <50ms | <100ms | >200ms |
| Total Scoring | 1-2s | <3s | >5s |

## Debugging Scenarios

### Package Not Scoring

**Check logs for:**
```bash
# Package found?
grep "Package metadata retrieved" | grep "packageId: \"your-package\""

# AI evaluation attempted?
grep "Starting AI prompt evaluation" | grep -A 5 "your-package"

# Score calculation completed?
grep "Quality score updated" | grep "your-package"
```

### Low Score Investigation

```bash
# View complete scoring flow
grep "packageId: \"your-package\"" | grep -E "🎯|📋|🤖|📊|✅"

# Check AI reasoning
grep "AI evaluation completed" | grep "your-package" -A 10

# Check score breakdown
grep "scoreBreakdown" | grep "your-package" -A 3
```

### AI Evaluation Failures

```bash
# Count failures
grep "AI evaluation failed" | wc -l

# View failure reasons
grep "AI evaluation failed" | jq '.error'

# Check fallback usage
grep "using fallback" | wc -l
```

## Monitoring Best Practices

### Development
- Set `LOG_LEVEL=info` for standard visibility
- Use `LOG_LEVEL=debug` for detailed troubleshooting
- Watch for warning messages during scoring

### Production
- Monitor AI evaluation success rate
- Track average scoring duration
- Alert on failures exceeding threshold (>10% failure rate)
- Monitor API costs (AI evaluation usage)

### Performance Optimization
```bash
# Average AI evaluation time
grep "apiDuration" | jq '.apiDuration' | awk '{sum+=$1; count++} END {print sum/count}'

# Success rate
total=$(grep "AI evaluation" | wc -l)
success=$(grep "AI evaluation completed" | wc -l)
echo "Success rate: $((success * 100 / total))%"

# Fallback usage
grep -c "using fallback"
```

## Configuration

### Enable/Disable AI Logging

The logging verbosity is controlled by `LOG_LEVEL`:

```bash
# Maximum verbosity (includes debug messages)
LOG_LEVEL=debug npm run dev

# Standard verbosity (info + warnings + errors)
LOG_LEVEL=info npm run dev

# Minimal verbosity (warnings + errors only)
LOG_LEVEL=warn npm run dev
```

### Production Logging

In production (`NODE_ENV=production`), logs are JSON-formatted without colors:

```json
{
  "level": 30,
  "time": 1729407600000,
  "msg": "AI evaluation completed: 0.850/1.000 (1250ms)",
  "score": 0.85,
  "reasoning": "Well-structured prompt...",
  "promptLength": 2450,
  "apiDuration": 1250
}
```

## Integration with Monitoring Tools

### Datadog
```javascript
// Logs are automatically structured for Datadog
// Query examples:
// - @msg:"Quality score updated" @finalScore:>4
// - @msg:"AI evaluation failed"
// - @apiDuration:>3000
```

### CloudWatch
```javascript
// Filter patterns:
// - { $.msg = "Quality score updated" && $.finalScore > 4 }
// - { $.level = "WARN" && $.msg = "*AI evaluation failed*" }
```

### Custom Metrics
```javascript
// Extract metrics from logs:
// - Average score: grep "finalScore" | jq '.finalScore' | awk '{sum+=$1; n++} END {print sum/n}'
// - AI usage: grep "AI evaluation completed" | wc -l
// - Failure rate: grep "AI evaluation failed" | wc -l
```

## Summary

✅ **Comprehensive logging** at every step of scoring process
✅ **Colored output** with emoji indicators for quick scanning
✅ **Structured data** for analysis and monitoring
✅ **Performance metrics** (timing, durations)
✅ **Score breakdowns** showing contribution of each factor
✅ **Error tracking** with fallback indicators
✅ **Production-ready** JSON logs for aggregation

The scoring logging system provides complete visibility into how packages are evaluated, making it easy to debug issues, analyze score distributions, and monitor system performance.
