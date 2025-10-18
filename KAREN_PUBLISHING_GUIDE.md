# Publishing Karen to GitHub Actions Marketplace

## The Easiest User Experience

Once published, repos get Karen scores in **3 simple steps**:

### 1. Add Workflow File
```yaml
# .github/workflows/karen.yml
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

### 2. Add API Key
Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to repository secrets.

### 3. Push Code
Karen automatically reviews and comments on PRs!

---

## Publishing Steps

### Option A: New Dedicated Repository (Recommended)

**Why:** GitHub Marketplace requires actions to be in repository root, not subdirectories.

#### Steps:

1. **Create New Repo**
```bash
# On GitHub, create: khaliqgant/karen-action
# Description: "🔥 Brutally honest AI code reviews - Get your Karen Score"
# Public repo
```

2. **Prepare Files**
```bash
cd /tmp
git clone https://github.com/khaliqgant/karen-action.git karen-action
cd karen-action

# Copy all karen-action files to root
cp -r /path/to/prompt-package-manager/packages/karen-action/* .

# Ensure dist/ is committed (required for actions)
git add dist/

# Clean up
rm -rf packages/
```

3. **Update Package References**

Update `action.yml`:
```yaml
name: 'Karen Code Review'
description: '🔥 Brutally honest AI code reviews with Karen Scores (0-100). Market-aware, works with Claude or GPT-4.'
author: 'khaliqgant'
branding:
  icon: 'alert-circle'
  color: 'yellow'
```

4. **Create Release**
```bash
# Commit everything
git add .
git commit -m "Initial Karen Action release"
git push origin main

# Create release tag
git tag -a v1 -m "Karen Action v1.0.0"
git tag -a v1.0.0 -m "Karen Action v1.0.0"
git push origin v1 v1.0.0
```

5. **Publish to Marketplace**
- Go to https://github.com/khaliqgant/karen-action
- Click "Releases" → "Create a new release"
- Select tag `v1.0.0`
- Title: "Karen Action v1.0.0 - Brutally Honest Code Reviews"
- Description: See below
- Check: ✅ "Publish this Action to the GitHub Marketplace"
- Select category: "Code quality"
- Publish!

**Release Description Template:**
```markdown
# 🔥 Karen Action v1.0.0

Get brutally honest, AI-powered code reviews with Karen Scores (0-100).

## What Karen Does

- Analyzes your entire repository
- Generates Karen Score (0-100) across 5 dimensions
- Posts cynical but constructive PR comments
- Creates shareable badges and hot takes
- Includes market research on competitors

## Quick Start

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

## Features

✅ Works with Anthropic Claude OR OpenAI GPT-4
✅ Market-aware competitive analysis
✅ Automatic PR comments
✅ Shareable Karen Score badges
✅ Configurable strictness

See README for full documentation.
```

---

### Option B: Subtree Extract (Preserves History)

```bash
# In prompt-package-manager repo
cd /home/khaliqgant/projects/prompt-package-manager

# Create orphan branch with just karen-action
git subtree split --prefix=packages/karen-action -b karen-action-split

# Create new remote
git remote add karen-action-repo git@github.com:khaliqgant/karen-action.git

# Push to new repo
git push karen-action-repo karen-action-split:main

# Clean up
git branch -D karen-action-split
git remote remove karen-action-repo
```

Then follow steps 3-5 from Option A.

---

## After Publishing

### Update This Repo's README

```markdown
## 🔥 Karen - Brutally Honest Code Reviews

Get AI-powered code reviews with Karen Scores. Now available as a GitHub Action!

[![Get Karen Score](https://img.shields.io/badge/Get%20Karen%20Score-GitHub%20Action-yellow?logo=github)](https://github.com/marketplace/actions/karen-code-review)

**One-Click Setup:**
```yaml
- uses: khaliqgant/karen-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

See [Karen Action](https://github.com/khaliqgant/karen-action) for details.
```

### Marketing

**Tweet:**
```
🔥 Just published Karen - brutally honest AI code reviews

Add one file to your repo, get a Karen Score (0-100) with market research

Works with Claude or GPT-4
Auto-comments on PRs
Generates shareable badges

https://github.com/marketplace/actions/karen-code-review

#GitHub #AI #CodeReview
```

**Reddit r/programming:**
```
[Show HN] Karen - Brutally Honest AI Code Reviews (GitHub Action)

I built an AI code reviewer that gives repositories a "Karen Score"
(0-100) based on 5 dimensions: over-engineering, whether it actually
works, code quality, completion honesty, and practical value (with
market research on competitors).

One workflow file gets you automated reviews on every PR.

Live example: [your repo's .karen/ review]
```

---

## Files to Include in karen-action Repo

**Required:**
- ✅ `action.yml` - Action definition
- ✅ `dist/index.js` - Compiled action (MUST be committed)
- ✅ `README.md` - Documentation
- ✅ `LICENSE` - MIT

**Optional:**
- `package.json` - For reference
- `src/` - Source code
- `.karen/config.yml` - Example config
- `examples/` - Example workflows

**DO NOT INCLUDE:**
- `node_modules/` - Too large
- Test files - Not needed for action

---

## Maintenance

### Versioning Strategy

- `v1` - Major version tag (points to latest v1.x.x)
- `v1.0.0` - Specific version
- `v1.0.1` - Patch updates

Update `v1` tag on new releases:
```bash
git tag -fa v1 -m "Update v1 to v1.1.0"
git push origin v1 --force
```

### Updates

When updating Karen:
1. Make changes in `packages/karen-action/`
2. Rebuild: `npm run build`
3. Copy to `karen-action` repo
4. Commit and create new release
5. Update v1 tag

---

## Alternative: Use as Subdirectory Action

**Less ideal but works without separate repo:**

Users reference subdirectory:
```yaml
- uses: khaliqgant/prompt-package-manager/packages/karen-action@v2
```

**Downsides:**
- Not on GitHub Marketplace
- Harder to discover
- Less professional
- Confusing path

**Use this only for testing before Marketplace publish.**

---

## Testing Before Publishing

Test in this repo:
```yaml
# .github/workflows/karen-test.yml
- uses: ./packages/karen-action  # Local test
```

Test from dedicated repo (before Marketplace):
```yaml
- uses: khaliqgant/karen-action@main  # Test from repo
```

---

## Checklist

Before publishing to Marketplace:

- [ ] Create `khaliqgant/karen-action` repo
- [ ] Copy files to root (including `dist/`)
- [ ] Update `action.yml` with proper metadata
- [ ] Create comprehensive README
- [ ] Add LICENSE (MIT)
- [ ] Test action works from repo
- [ ] Create v1.0.0 release
- [ ] Publish to Marketplace
- [ ] Test from Marketplace
- [ ] Update PRPM repo to link to action
- [ ] Announce on Twitter/Reddit

---

**Result:** Repos get Karen scores with 3 lines of YAML + 1 secret. Maximum ease of use. 🔥
