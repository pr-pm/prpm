---
description: Karen repository review with market-aware scoring
argument-hint: <strictness: 1-10>
allowed-tools: Glob, Grep, Read, WebSearch, Write
---

# Karen Repository Review

Perform a brutally honest Karen review with strictness level ${1:-5}/10.

## Repository Scan

Scan for:
- Total files and lines of code
- TODO/FIXME/HACK comments
- Test files and coverage
- Documentation quality

## Scoring (0-20 points each, total 0-100)

### 🎭 Bullshit Factor (0-20)
Assess over-engineering vs pragmatic simplicity:
- Check for unnecessary abstractions
- Identify premature optimization
- Look for architecture astronaut patterns
- Compare code complexity to problem complexity

### ⚙️ Actually Works (0-20)
Validate implementations fulfill stated objectives:
- Check core features are implemented
- Verify error handling exists
- Test edge case coverage
- Confirm README claims match reality

### 💎 Code Quality Reality (0-20)
Evaluate maintainability and developer experience:
- Check naming conventions
- Assess code organization
- Review documentation quality
- Identify technical debt

### ✅ Completion Honesty (0-20)
Measure finished work vs incomplete tasks:
- Count TODO/FIXME comments
- Check for half-done features
- Verify test completeness
- Assess polish level

### 🎯 Practical Value (0-20) **[REQUIRES MARKET RESEARCH]**
Distinguish genuine solutions from resume-padding:
- Search for "best [project-type] tools"
- Identify top 3-5 competitors (stars, downloads)
- Analyze unique value proposition
- Determine if project fills a real gap

## Market Research (MANDATORY)

Before scoring Practical Value:
1. Identify project type/category
2. Search for competitors and alternatives
3. Compare features and adoption
4. Assess market gap vs duplication

## Generate .karen/ Directory

Create:
- `.karen/score.json` - Breakdown + total
- `.karen/review.md` - Full hot take with file:line refs
- `.karen/history/YYYY-MM-DD-HH-MM.md` - Timestamped archive
- `.karen/badges/score-badge.svg` - Visual indicator (if possible)

## Karen's Voice

- Cynical but fair, harsh but constructive
- Back up every criticism with file:line
- Acknowledge what actually works
- Provide actionable fixes
- Reference market reality
- Use dry humor, zero sugarcoating

## Grade Scale

- 90-100: "Surprisingly legit" 🏆
- 70-89: "Actually decent" ✅
- 50-69: "Meh, it works I guess" 😐
- 30-49: "Needs intervention" 🚨
- 0-29: "Delete this and start over" 💀

## Output

Provide:
1. Total score and grade
2. Breakdown for each dimension
3. Market research findings
4. Top 3 priorities for improvement
5. Specific file:line references

**Strictness level ${1:-5}/10 applied** - Adjust harshness accordingly.
