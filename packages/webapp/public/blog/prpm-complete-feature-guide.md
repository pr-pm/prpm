# The Complete Guide to PRPM: Every Feature You Need to Know

**PRPM is more than a package manager—it's a complete platform for discovering, testing, publishing, and managing AI coding tools.** This guide walks through every major feature, explaining not just what each does, but why it matters and how it helps you build better software with AI.

---

## Core Features

### Universal Package Management

**The Problem:** You find a great Cursor rule on GitHub. You copy it. Create a `.cursor/rules/` file. Paste it in. Then you realize you also use Claude Code sometimes, so you need to rewrite it in their format. Repeat for Continue, Windsurf, Copilot...

**PRPM's Solution:** Install once, use anywhere.

```bash
# One package, any editor
prpm install @sanjeed5/react-best-practices

# Automatically converts to your editor's format:
# → .cursor/rules/ for Cursor
# → .claude/skills/ for Claude
# → .continue/prompts/ for Continue
# → .windsurf/rules/ for Windsurf
# → .github/copilot-instructions.md for Copilot
# → .kiro/steering/ for Kiro
```

PRPM detects which AI editor you're using (or you can specify with `--as cursor`) and converts packages on-the-fly. Authors publish once in a canonical format. Users install in any editor. No manual conversion needed.

**Why this matters:** If you work with a team where some use Copilot, others Claude, and sometimes Cursor, PRPM is the only way to keep everyone's rules consistent across the codebase.

---

### 7,500+ Packages Across All Platforms

Browse packages for:
- **Cursor rules** - Coding guidelines and patterns
- **Claude skills & agents** - Specialized AI capabilities
- **Continue prompts** - Custom development workflows
- **Windsurf rules** - Editor-specific automation
- **GitHub Copilot instructions** - Code completion rules
- **Kiro steering files** - AI behavior controls
- **MCP configs** - Model context protocols

Every package works in every editor. No "Cursor-only" or "Claude-only" limitations.

---

### Smart Search with AI

**Traditional search** (keyword-based):
```bash
prpm search "react hooks"
# Returns packages with "react" and "hooks" in name/description
```

**AI-powered search** (semantic understanding):
```bash
prpm search "help me write better React components"
# Returns:
# - @sanjeed5/react-best-practices (95% match)
# - @user/component-architecture (87% match)
# - @team/react-patterns (82% match)
```

The AI search understands **intent**, not just keywords. It analyzes:
- Package descriptions and documentation
- Use case descriptions (AI-generated)
- Similarity to other packages
- What problems each package solves

Search results show **why** each package matched your query, not just a relevance score.

---

### Quality Scores: Find the Best Packages

Every package has a quality score (0-5) based on:

**Content Quality (40%)**
- **Prompt effectiveness** (AI-evaluated using Claude)
- Prompt length and depth
- Code examples and demonstrations
- Documentation completeness

**Author Credibility (30%)**
- Verified author status
- Number of published packages
- Official package designation

**Engagement (20%)**
- Total downloads
- Star count
- User ratings

**Maintenance (10%)**
- Recent updates
- Version count
- Active maintenance

This isn't arbitrary—packages are scored using AI evaluation of actual prompt quality. A package with 1,000 downloads but poor content won't rank above a new package with excellent, well-documented prompts.

---

### Package Stars & Bookmarks

Star packages to:
- Bookmark for later installation
- Track packages you find valuable
- Help others discover quality tools

Your starred packages appear in your dashboard for quick access.

---

### Collections: Complete Setups in One Command

Collections bundle related packages for complete workflow setups:

```bash
prpm install collections/nextjs-pro
# Installs 20 packages:
# - Backend architect
# - Database architect
# - Cloud architect
# - API design patterns
# - Testing best practices
# - And 15 more...
```

Instead of manually finding and installing a dozen packages for a new Next.js project, install one collection and get everything configured.

**Use cases:**
- **Framework stacks** (`collections/react-fullstack`, `collections/python-ml`)
- **Company standards** (your team's internal best practices)
- **Learning paths** (curated packages for learning a new framework)

---

### Format Conversion Tool

Convert packages between different AI tool formats:

```bash
# Convert a Cursor rule to Claude format
prpm convert .cursorrules --to claude --subtype skill

# Convert to Windsurf
prpm convert my-prompt.md --to windsurf --subtype rule

# Convert with custom output path
prpm convert prompt.md --to cursor --output .cursor/rules/my-rule.md
```

**Supported conversions:**
- Cursor ↔ Claude ↔ Continue ↔ Windsurf ↔ Copilot ↔ Kiro ↔ Agents.md

**Why this matters:** Migrate your existing prompts between tools without manual rewriting. Test the same prompt across multiple AI editors.

---

### Starred Packages Management

Track and manage your favorite packages:

```bash
# List all starred packages
prpm starred

# List only starred packages (not collections)
prpm starred --packages

# List only starred collections
prpm starred --collections

# Filter by format
prpm starred --format cursor
```

Your starred packages sync across devices when logged in. Quick access to packages you trust and use frequently.

---

### Credits & Billing

Monitor your playground usage:

```bash
# Check current credit balance
prpm credits

# View transaction history
prpm credits --history

# See last 20 transactions
prpm credits --history --limit 20
```

Transparent pricing with no hidden fees. Credits only cover API costs to OpenAI and Anthropic.

---

### Lock File Management

PRPM automatically maintains a `prpm.lock` file tracking:
- Exact versions of installed packages
- Installation timestamps
- Dependency resolution
- Format conversions applied

**Why lock files matter:**
- Ensures consistent installations across team members
- Enables exact reproducibility in CI/CD
- Tracks what's installed where
- Simplifies package updates and rollbacks

---

## Testing Tools: The Playground

**The Problem:** You find a package that looks promising. But will it actually work for your use case? You don't want to install it, test it, uninstall it if it doesn't fit.

**The Playground** lets you test any package before installing—no commitment required.

---

### Try Packages with Real AI Models

```bash
prpm playground --package @username/react-best-practices
# Opens browser playground at prpm.dev/playground
```

**What you can do:**
1. Select a package from 7,500+ options
2. Choose an AI model (Claude Sonnet, GPT-4, GPT-4o, Opus)
3. Enter your test input (e.g., "Create a React hook for fetching data")
4. See the AI's response using that package's prompt
5. Decide if it's worth installing

---

### Model Comparison Mode

Test the same prompt with different packages side-by-side:

**Package A:** `@sanjeed5/react-best-practices`
**Package B:** `@other/react-guide`

Run the same input through both. Compare results. Install the one that works better for your needs.

Or compare **with vs without** a package (baseline comparison):
- **Package A:** Your selected package
- **Package B:** (empty - no package)

See how much the package actually improves the AI's output.

---

### Free Credits System

- **Anonymous users:** 1 free playground run (no signup)
- **Logged-in users:** 5 free credits on signup
- **Monthly refresh:** 1,000 credits/month for all users
- **Pay-as-you-go:** Buy additional credits ($10 for 1,000 credits)

**Credit costs:**
- GPT-4o Mini: 1 credit
- Claude Sonnet: 2 credits
- GPT-4o: ~3 credits
- GPT-4 Turbo: ~4 credits
- Claude Opus: ~7 credits

Costs scale with actual API usage. We don't profit from credits—they cover our OpenAI/Anthropic costs.

---

### Playground Analytics (for Package Authors)

If you're a verified author, see how people use your packages in the playground:

- **Total runs:** How many times your package was tested
- **Model distribution:** Which AI models users prefer
- **Session data:** How many exchanges per session
- **Feedback:** User ratings on playground results
- **Comparison tracking:** How often your package was compared to others

This helps you understand if your package is useful in practice, not just in theory.

---

### Custom Prompt Testing (Verified Authors Only)

Want to test a prompt before publishing? Use the custom prompt feature:

1. Write your prompt in the playground
2. Test it with real AI models
3. Iterate based on results
4. Publish when ready

Available to verified authors to prevent abuse.

---

## For Authors: Publishing & Analytics

### Publish Once, Reach Everyone

**Traditional approach:**
- Write a Cursor rule → Share on GitHub
- Cursor users can use it
- Claude users: ❌ (different format)
- Continue users: ❌ (different format)
- Windsurf users: ❌ (different format)

**PRPM approach:**
- Write in canonical format (or any supported format)
- Publish to PRPM
- **Everyone** can install it in their preferred editor

You write once. PRPM handles conversion to all 7+ formats automatically.

**At least 4x reach** (Cursor + Claude + Continue + Windsurf users) compared to format-specific sharing.

---

### Author Verification & Invitations

**Verified authors** get:
- ✓ Verified badge on all packages
- Higher quality scores (verification = credibility)
- Access to custom prompt testing in playground
- Detailed analytics (see below)
- Priority support

**How to get verified:**
- Claim your packages via GitHub OAuth
- Link your GitHub account to prove ownership
- Publish high-quality, well-documented packages

**Author invitations:** Invite collaborators to help maintain your packages. Add team members with different permission levels.

---

### Package Analytics Dashboard

Track how your packages perform:

**Download metrics:**
- Total downloads
- Weekly downloads
- Monthly downloads
- Download trends over time

**Engagement:**
- Star count
- User ratings and reviews
- Quality score breakdown

**Format distribution:**
- How many users install as Cursor vs Claude vs Continue, etc.
- Helps you understand your audience

**Playground usage** (verified authors only):
- How many playground runs
- Model preferences
- Session data
- User feedback

---

### Author Rankings & Stats

Your author profile shows:
- Total packages published
- Combined download count
- Average package quality
- Verified status
- Top packages by downloads

Authors are ranked by:
1. Total downloads
2. Package quality
3. Number of packages
4. Community engagement

High-ranking authors get featured on the homepage and search results.

---

### Organizations Support

Create an organization for:
- **Company packages** (internal best practices shared across team)
- **Open source teams** (multiple maintainers for popular packages)
- **Framework authors** (official packages from Next.js, React, etc.)

**Organization features:**
- Shared package ownership
- Team member roles (owner, admin, maintainer, member)
- Organization-level analytics
- Custom branding (verified orgs only)
- Private packages (for internal team use)

```bash
# Create an organization
prpm org create my-company

# Add members
prpm org add-member my-company @username --role maintainer

# Publish under organization
prpm publish --org my-company
```

---

## Platform Features: Search, Quality, & More

### Hybrid Search: Keyword + AI Semantic

PRPM uses **both** traditional keyword search and AI-powered semantic search:

**Keyword search:**
- Fast full-text search using PostgreSQL
- Exact matches on package names, descriptions, tags
- Great for finding specific packages by name

**Semantic search:**
- Uses OpenAI embeddings (vector search)
- Understands query intent
- Finds conceptually similar packages even with different wording
- Explains **why** each package matched

**Hybrid mode** (default):
- Runs both searches
- Merges results with intelligent ranking
- Shows both exact matches and conceptually similar packages

---

### AI-Enhanced Package Metadata

Every package gets AI-generated enrichment:

**Use case description:**
```
"Best for: Building RESTful APIs with Express.js, implementing authentication,
error handling, and database integration following industry standards."
```

**Problem statement:**
```
"Solves: Inconsistent API structure, lack of error handling patterns,
security vulnerabilities in authentication, and poor database query organization."
```

**Similar to:**
```
["@user/node-api-patterns", "@team/express-best-practices", "@company/backend-guide"]
```

This metadata improves search and helps users understand what each package does at a glance.

---

### Package Quality Scoring Algorithm

The algorithm scores packages 0-5 based on:

**1. Content Quality (40% of score = 2.0 points)**
- Prompt content quality: **1.0 points** (AI-evaluated by Claude)
- Prompt length: 0.3 points (substantial content = higher score)
- Has examples: 0.2 points (code blocks, demonstrations)
- Has documentation: 0.2 points (external docs linked)
- Has description: 0.1 points (package description > 20 chars)
- Description quality: 0.1 points (100-300 chars = optimal)
- Has repository: 0.05 points (source code available)
- Metadata quality: 0.05 points (tags, keywords, homepage)

**2. Author Credibility (30% = 1.5 points)**
- Verified author: 0.5 points
- Author package count: 0.3 points (5+ packages)
- Official package: 0.7 points (from framework/tool authors)

**3. Engagement (20% = 1.0 points)**
- Downloads: 0.4 points (logarithmic scale to prevent runaway leaders)
- Stars: 0.3 points
- Ratings: 0.3 points (average rating with minimum count requirement)

**4. Maintenance (10% = 0.5 points)**
- Recency: 0.3 points (last 30 days = max score)
- Version count: 0.2 points (2+ versions shows active maintenance)

**Example score breakdown:**
```
Package: @sanjeed5/react-best-practices
Total Score: 4.2/5.0

Content Quality: 1.8/2.0
  - AI prompt quality: 0.9/1.0
  - Length: 0.3/0.3
  - Has examples: 0.2/0.2
  - Has docs: 0.2/0.2
  - Description: 0.1/0.1
  - Repository: 0.05/0.05
  - Metadata: 0.05/0.05

Author Credibility: 1.5/1.5
  - Verified: 0.5/0.5
  - Package count: 0.3/0.3 (8 packages)
  - Official: 0.7/0.7

Engagement: 0.7/1.0
  - Downloads: 0.4/0.4 (500+)
  - Stars: 0.2/0.3 (15 stars)
  - Ratings: 0.1/0.3 (avg 4.0, 2 ratings)

Maintenance: 0.2/0.5
  - Recency: 0.0/0.3 (120 days old)
  - Versions: 0.2/0.2 (3 versions)
```

Scores update automatically when packages are downloaded, rated, or updated.

---

### Format Conversion Engine

PRPM supports bidirectional conversion between all formats:

**Supported formats:**
- Cursor (`.cursorrules`, `.cursor/rules/*.md`)
- Claude (`.claude/skills/*.md`, `.claude/agents/*.yaml`)
- Continue (`.continue/prompts/*.md`)
- Windsurf (`.windsurf/rules/*.md`)
- Copilot (`.github/copilot-instructions.md`)
- Kiro (`.kiro/steering/*.md`)
- Agents.md (`agents.md` - universal format)
- Generic (plain text/markdown)
- MCP (Model Context Protocol configs)

**Conversion quality:**
- **Lossless** where possible (round-trip testing)
- **Intelligent** (understands format-specific features)
- **Validated** (100+ test cases across formats)

**Subtypes supported:**
- Rules (coding guidelines)
- Skills (Claude-specific capabilities)
- Agents (autonomous AI assistants)
- Slash commands (quick actions)
- Prompts (general instructions)
- Workflows (multi-step processes)
- Hooks (event-driven automation)
- Chat modes (conversation styles)

---

### Categories & Taxonomy

Packages are organized by:

**Categories:**
- Development (coding patterns, architecture)
- Testing (TDD, QA, debugging)
- Documentation (writing, technical docs)
- DevOps (CI/CD, deployment, monitoring)
- Design (UI/UX, design systems)
- Data Science (ML, analytics)
- Security (auth, encryption, vulnerabilities)

**Tags** (user-defined):
- Framework tags (react, next.js, django, etc.)
- Language tags (javascript, python, go, etc.)
- Domain tags (api, database, frontend, backend, etc.)

**AI-generated tags** (automated):
- Based on package content analysis
- Normalized and standardized
- Updated when packages change

Browse by category to find packages for specific use cases.

---

## Advanced Features

### Private Packages (Organizations)

Organizations can publish **private packages** for internal use:

```bash
# Publish private package
prpm publish --org my-company --visibility private

# Only organization members can install
prpm install @my-company/internal-standards
```

**Use cases:**
- Company coding standards
- Proprietary patterns
- Internal best practices
- Team-specific workflows

Private packages don't appear in public search. Only org members can see/install them.

---

### Package Deprecation

Mark packages as deprecated with a reason:

```bash
prpm deprecate @username/old-package --reason "Use @username/new-package instead"
```

Deprecated packages:
- Show warning when installed
- Link to replacement package
- Don't appear in top search results
- Still installable (for backwards compatibility)

---

### Version Management

PRPM supports semantic versioning:

```bash
# Install specific version
prpm install @username/react@1.2.0

# Install latest
prpm install @username/react

# Install version range
prpm install @username/react@^1.0.0
```

**Version features:**
- Changelog tracking
- Prerelease versions (`1.0.0-beta.1`)
- Deprecation per version
- Download tracking per version

### Newsletter & Updates

Subscribe to get:
- New package releases
- Popular packages each week
- Platform updates and features
- Tips for using PRPM effectively

No spam. Unsubscribe anytime.

---

### CLI-First Design

Everything works from the command line:

```bash
# Search
prpm search "react hooks"

# Info
prpm info @username/package

# Install
prpm install @username/package

# Publish
prpm publish

# Collections
prpm collections search frontend
prpm collections install collection/nextjs-pro

# Trending packages
prpm trending

# Your packages (authors)
prpm packages --mine

# Analytics (verified authors)
prpm analytics @username/package
```

The CLI is the primary interface. The web app (prpm.dev) is for discovery and playground testing.

---

### GitHub Integration

- **OAuth login:** Link your GitHub account
- **Package claiming:** Prove ownership via GitHub repos
- **Auto-sync:** Import packages from your repos (coming soon)
- **README parsing:** Automatically generate descriptions from README files

---

### Download Analytics

Track package usage over time:
- Daily/weekly/monthly download counts
- Geographic distribution (coming soon)
- Editor format breakdown
- Trending packages dashboard

Authors see detailed analytics. Users see aggregate stats on package pages.

---

### Self-Improvement (Experimental)

Let your AI editor discover and install packages itself:

```bash
# Install self-improvement package
prpm install @prpm/self-improve
```

Your AI can now:
1. Search PRPM when it encounters a problem
2. Find relevant packages
3. Ask for permission to install
4. Improve its own capabilities over time

This is experimental but shows the future: AI that improves itself by discovering better patterns and tools.

---

## Getting Started

1. **Install the CLI:**
   ```bash
   npm install -g prpm
   ```

2. **Search for packages:**
   ```bash
   prpm search "your use case"
   ```

3. **Test in playground** (optional):
   ```bash
   prpm playground --package @username/package-name
   ```

4. **Install:**
   ```bash
   prpm install @username/package-name
   ```

5. **Use in your editor** - packages automatically convert to the right format

---

## Why PRPM Matters

**For users:** Stop wasting time copying, pasting, and converting prompts. Install once, use anywhere.

**For authors:** Publish once, reach 4x+ more users across all AI editors.

**For teams:** Keep everyone's rules consistent regardless of which editor they use.

**For the community:** Build a shared knowledge base of tested, rated, high-quality AI coding tools.

PRPM is the infrastructure for distributable AI intelligence. It's npm for prompts. It's the registry the AI coding ecosystem needs.

---

## Get Involved

- **Browse packages:** [prpm.dev/search](https://prpm.dev/search)
- **Try the playground:** [prpm.dev/playground](https://prpm.dev/playground)
- **Read the docs:** [docs.prpm.dev](https://docs.prpm.dev)
- **Follow us on Twitter:** [@prpmdev](https://twitter.com/prpmdev)
- **Contribute:** [GitHub](https://github.com/pr-pm/prpm)

Questions? Feedback? [Get in touch](https://prpm.dev/contact).
