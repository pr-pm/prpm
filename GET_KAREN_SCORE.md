# 🔥 Get Your Karen Score

## The Easiest Way (3 Steps)

### 1. Add This File

Create `.github/workflows/karen.yml` in your repo:

```yaml
name: Karen Review
on: [push, pull_request]

jobs:
  karen:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: khaliqgant/karen-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 2. Add Your API Key

**Option A: Anthropic (Recommended)**
1. Get key: https://console.anthropic.com/
2. Add as `ANTHROPIC_API_KEY` in repo secrets

**Option B: OpenAI**
1. Get key: https://platform.openai.com/
2. Add as `OPENAI_API_KEY` in repo secrets

### 3. Push Code

Karen automatically:
- ✅ Reviews your code
- ✅ Generates Karen Score (0-100)
- ✅ Comments on PRs
- ✅ Creates `.karen/` directory with full review
- ✅ Includes market research on competitors

---

## That's It!

Your next push will trigger Karen. She'll:

1. Scan your entire repository
2. Research competitors in your space
3. Generate a brutally honest Karen Score
4. Create shareable badges and hot takes
5. Comment on pull requests

---

## Example Output

**Karen Score: 78/100 ✅ "Actually decent"**

```
🎭 Bullshit Factor: 17/20 - Clean code, no over-engineering
⚙️ Actually Works: 16/20 - Core functionality solid
💎 Code Quality: 15/20 - Some rough edges
✅ Completion Honesty: 14/20 - A few TODOs
🎯 Practical Value: 16/20 - First-mover advantage

Market Research:
- Analyzed 3 competitors
- Identified genuine market gap
- Recommendation: Focus on unique angle X

Bottom Line: "First-mover advantage, but move fast"
```

See live example: [PRPM's Karen Review](.karen/review.md)

---

## Advanced Options

### Custom Strictness

Create `.karen/config.yml`:

```yaml
strictness: 8  # 1-10 (default: 7)
weights:
  bullshitFactor: 0.25
  actuallyWorks: 0.25
  codeQualityReality: 0.20
  completionHonesty: 0.15
  practicalValue: 0.15
```

### Require Minimum Score

```yaml
- uses: khaliqgant/karen-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    min_score: 70  # Fail if score < 70
```

### Badge in README

```markdown
[![Karen Score](.karen/badges/score-badge.svg)](.karen/review.md)
```

---

## Pricing

**Anthropic Claude:**
- ~$0.10-0.50 per review (depending on repo size)
- Free tier available

**OpenAI GPT-4:**
- ~$0.20-0.80 per review
- Pay per use

---

## Why Karen?

**For Projects:**
- Get honest assessment vs echo chamber praise
- Identify over-engineering and incomplete work
- Understand market fit and competitors
- Generate viral content (Karen hot takes)

**For Teams:**
- Reality check on "done" features
- Catch BS task completions
- Market-aware development decisions
- Fun way to improve code quality

**For Marketing:**
- Shareable Karen Scores
- Viral .karen/ hot takes
- Proof of quality
- Stand out from competitors

---

## FAQ

**Q: Will Karen roast my code?**
A: Yes. That's the point. But she's constructive, not cruel.

**Q: Is it accurate?**
A: Karen uses AI (Claude or GPT-4) for analysis. Backed by market research, not random criticism.

**Q: Can I customize it?**
A: Yes! Configure strictness, weights, focus areas in `.karen/config.yml`

**Q: Will this fail my CI?**
A: Only if you set `min_score`. Otherwise, Karen just reviews.

**Q: Is my code private?**
A: Sent to Anthropic/OpenAI API (same as Cursor/Copilot). See their privacy policies.

**Q: How much does it cost?**
A: $0.10-0.80 per review. Free tier available from Anthropic.

---

## Share Your Score

Once you have a Karen Score:

```markdown
# Twitter
Karen just reviewed my project: 78/100 ✅

"Actually decent - first-mover advantage"

#KarenScore #PRPM

# README
[![Karen Score](.karen/badges/score-badge.svg)](.karen/review.md)
```

---

**🔥 Get roasted. Get better. Get your Karen Score today! 🔥**

[GitHub Action](https://github.com/marketplace/actions/karen-code-review) | [Docs](https://github.com/khaliqgant/karen-action) | [Example Review](.karen/review.md)
