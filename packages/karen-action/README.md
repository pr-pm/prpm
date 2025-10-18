# 🔥 Karen GitHub Action

Get brutally honest, AI-powered code reviews from Karen - no BS, just reality checks.

Karen is an automated code reviewer that analyzes your entire repository and gives you a cynical, honest assessment of what's actually working and what's just wishful thinking.

**Part of [PRPM](https://github.com/khaliqgant/prompt-package-manager)** - The package manager for AI prompts. Get Karen in Claude Code, Cursor IDE, or as a CLI tool!

## Features

- **Brutally Honest Reviews** - Karen tells it like it is, backed by AI analysis
- **Karen Score (0-100)** - Quantified assessment across 5 key dimensions
- **Multiple AI Providers** - Works with Anthropic Claude OR OpenAI GPT-4
- **Auto PR Comments** - Karen roasts your PRs automatically
- **Shareable Badges** - Show off your Karen score (if you dare)
- **Historical Tracking** - Watch your score improve (or not)
- **Customizable** - Configure Karen's strictness and focus areas

## Quick Start

### 1. Create `.github/workflows/karen.yml`

```yaml
name: Karen Code Review

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  karen-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Karen Review
        uses: your-org/karen-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          post_comment: true
          generate_badge: true
          min_score: 50
```

### 2. Add API Key

Choose one of the following AI providers:

**Option A: Anthropic Claude (Recommended)**
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it as `ANTHROPIC_API_KEY` in your repository secrets

**Option B: OpenAI GPT-4**
1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Add it as `OPENAI_API_KEY` in your repository secrets

Karen will auto-detect which provider to use based on which key you provide.

### 3. (Optional) Configure Karen

Create `.karen/config.yml` in your repo:

```yaml
strictness: 8  # 1-10, how brutal Karen should be
weights:
  bullshitFactor: 0.25
  actuallyWorks: 0.25
  codeQualityReality: 0.20
  completionHonesty: 0.15
  practicalValue: 0.15
```

### 4. Get Roasted

Push code and let Karen do her thing. She'll:
- Analyze your repository
- Generate a Karen score (0-100)
- Create `.karen/review.md` with detailed feedback
- Comment on PRs with her brutally honest take
- Generate a shareable badge

---

## 💡 Want Karen in Your IDE?

**Use Karen interactively** in Claude Code or Cursor with [PRPM](https://github.com/khaliqgant/prompt-package-manager):

```bash
# Install PRPM
npm install -g prmp

# Get Karen as a Claude Skill (for Claude Code)
prmp install karen-skill

# Or get Karen as a Cursor Rule (for Cursor IDE)
prmp install karen-cursor-rule

# Or get Karen as a Claude Agent
prmp install karen-agent
```

**Why use PRPM?**
- 🤖 **Interactive reviews** - Ask Karen questions, iterate on feedback
- 🎯 **On-demand** - Run Karen anytime, not just on commits
- 📦 **250+ packages** - Access Cursor rules, Claude skills, MCP servers
- 🔄 **Ecosystem** - One package manager for all AI prompts

**[Install PRPM](https://github.com/khaliqgant/prompt-package-manager)** | **[Browse Packages](https://promptpm.dev)**

---

## Karen Score

Karen evaluates your project across 5 dimensions (each 0-20 points):

### 🎭 Bullshit Factor (0-20)
How much over-engineering and unnecessary complexity?
- 20 = Appropriately simple
- 0 = Enterprise patterns for a todo app

### ⚙️ Actually Works (0-20)
Does it do what it claims?
- 20 = Fully functional
- 0 = All mocks and TODOs

### 💎 Code Quality Reality (0-20)
Will the next dev curse you?
- 20 = Clean and maintainable
- 0 = Unmaintainable mess

### ✅ Completion Honesty (0-20)
How much is TODO vs done?
- 20 = Actually complete
- 0 = Half-baked features

### 🎯 Practical Value (0-20)
Does anyone actually need this?
- 20 = Solves real problems
- 0 = Resume-driven development

## Score Interpretation

| Score | Grade | Emoji |
|-------|-------|-------|
| 90-100 | Surprisingly legit | 🏆 |
| 70-89 | Actually decent | ✅ |
| 50-69 | Meh, it works I guess | 😐 |
| 30-49 | Needs intervention | 🚨 |
| 0-29 | Delete this and start over | 💀 |

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `anthropic_api_key` | No* | - | Anthropic API key for Claude |
| `openai_api_key` | No* | - | OpenAI API key for GPT-4 |
| `ai_provider` | No | `auto` | AI provider: `anthropic`, `openai`, or `auto` |
| `github_token` | No | `github.token` | GitHub token for PR comments |
| `mode` | No | `full` | Review mode: `full`, `pr`, or `update` |
| `post_comment` | No | `true` | Post review as PR comment |
| `generate_badge` | No | `true` | Generate Karen score badge |
| `min_score` | No | `0` | Minimum score to pass (0-100) |

*At least one API key (`anthropic_api_key` or `openai_api_key`) is required

## Outputs

| Output | Description |
|--------|-------------|
| `karen_score` | Karen score (0-100) |
| `karen_grade` | Karen grade text |
| `review_path` | Path to review markdown |
| `badge_path` | Path to badge SVG |

## Examples

### Basic Usage

```yaml
- name: Karen Review
  uses: your-org/karen-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Require Minimum Score

```yaml
- name: Karen Review
  uses: your-org/karen-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    min_score: 70  # Fail if score < 70
```

### Using OpenAI Instead

```yaml
- name: Karen Review
  uses: your-org/karen-action@v1
  with:
    openai_api_key: ${{ secrets.OPENAI_API_KEY }}
    post_comment: true
    generate_badge: true
```

### PR Comments Only

```yaml
- name: Karen Review
  uses: your-org/karen-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    post_comment: true
    generate_badge: false
```

### Custom Strictness

Create `.karen/config.yml`:

```yaml
strictness: 9  # Maximum brutality
checks:
  overEngineering: true
  missingTests: true
  incompleteTodos: true
  deadCode: true
```

## Add Badge to README

After Karen generates a badge, add it to your README:

```markdown
![Karen Score](.karen/badges/score-badge.svg)
```

## Directory Structure

After Karen runs, you'll have:

```
.karen/
├── config.yml              # Karen configuration (optional)
├── score.json              # Current score & breakdown
├── review.md               # Latest review
├── history/                # Historical reviews
│   └── 2025-10-18-12-30.md
└── badges/                 # Generated badges
    └── score-badge.svg
```

## Configuration

### `.karen/config.yml`

```yaml
# Scoring weights (must sum to 1.0)
weights:
  bullshitFactor: 0.25
  actuallyWorks: 0.25
  codeQualityReality: 0.20
  completionHonesty: 0.15
  practicalValue: 0.15

# Ignore patterns
ignore:
  - node_modules
  - dist
  - "*.lock"

# Focus on specific directories
focus:
  - src
  - lib

# Strictness (1-10)
strictness: 7

# Enable checks
checks:
  overEngineering: true
  missingTests: true
  incompleteTodos: true
  deadCode: true

# Thresholds
thresholds:
  minScore: 50
  todoLimit: 20
  complexityLimit: 15
```

## FAQ

**Q: Will Karen roast my code?**
A: Yes. That's literally her job.

**Q: Is the review accurate?**
A: Karen uses Claude (Anthropic's AI) to analyze your code. She's brutally honest, not randomly mean.

**Q: Can I configure how harsh Karen is?**
A: Yes! Set `strictness: 1-10` in `.karen/config.yml`. Default is 7.

**Q: Will this fail my CI?**
A: Only if you set `min_score` and Karen's score is below it.

**Q: Can I use this on private repos?**
A: Yes! Your code is only sent to Anthropic's API (Claude). See [Anthropic's privacy policy](https://www.anthropic.com/privacy).

**Q: How much does this cost?**
A: You need an Anthropic API key. Typical review costs ~$0.10-0.50 depending on repo size.

## Contributing

Karen is part of [PRPM (Prompt Package Manager)](https://github.com/your-org/prompt-package-manager).

## License

MIT

---

*🔥 Get roasted. Get better. - Karen*
