# Claude Agents Sources

Complete guide to existing Claude agent collections and how to integrate them into PRMP.

---

## Overview

There are several excellent Claude agent collections available. PRMP can help distribute these agents more widely through our package manager infrastructure.

---

## Source 1: subagents.cc

**URL**: https://subagents.cc/
**Status**: Active community site
**Agent Count**: 6+ curated agents
**Format**: Web-based, downloadable markdown

### Notable Agents

| Agent | Category | Downloads | Author |
|-------|----------|-----------|--------|
| Frontend Developer | Engineering | 656 | Michael Galpert |
| Backend Architect | Engineering | 496 | Michael Galpert |
| UI Designer | Design | 489 | Michael Galpert |
| Code Reviewer | Code Review | 384 | Anand Tyagi |
| Debugger | Debugging | 287 | Anand Tyagi |
| UX Researcher | Design | 240 | Michael Galpert |

### Integration Strategy

1. **Partnership Approach** (Recommended)
   - Contact site owner (Michael Galpert)
   - Propose integration partnership
   - PRMP acts as distribution channel
   - "Available on PRMP" badge on their site
   - Revenue sharing if monetization added

2. **Manual Curation**
   - Download top agents manually
   - Convert to PRMP format
   - Publish with full attribution
   - Mark as "unclaimed" for author to verify

3. **Web Scraping** (Last Resort)
   - Requires permission
   - Implement with puppeteer/playwright
   - Rate limiting and ethical scraping
   - Only if partnership fails

### PRMP Package Format

```json
{
  "name": "frontend-developer-subagents",
  "version": "1.0.0",
  "type": "claude",
  "displayName": "Frontend Developer (subagents.cc)",
  "description": "Building user interfaces with React/Vue/Angular",
  "author": {
    "name": "Michael Galpert",
    "url": "https://subagents.cc/"
  },
  "metadata": {
    "originalSource": "https://subagents.cc/",
    "downloads": 656,
    "category": "Engineering",
    "unclaimed": true
  }
}
```

---

## Source 2: valllabh/claude-agents

**URL**: https://github.com/valllabh/claude-agents
**Status**: Active GitHub repository
**Agent Count**: 8 specialized agents
**Format**: Markdown files in `claude/agents/` directory
**License**: Open source (check repo for specific license)

### Agents Available

1. **Analyst (Mary)** - Strategic research and brainstorming
2. **Scrum Master (Bob)** - Story creation and agile process
3. **Developer (James)** - Code implementation
4. **Product Manager (John)** - Documentation and strategy
5. **Architect (Winston)** - System design
6. **QA Engineer (Quinn)** - Testing and code review
7. **Product Owner (Sarah)** - Backlog management
8. **UX Expert (Sally)** - User experience design

### Key Features

- **Persona-based**: Each agent has a specific personality
- **Workflow-oriented**: Interactive command structures
- **Installation script**: `install-agents.sh` for easy setup
- **Full development lifecycle**: Covers all roles in software development

### Integration Strategy

1. **Fork and Attribute**
   - Fork repository
   - Convert to PRMP format
   - Maintain link to original
   - Track updates

2. **Author Contact**
   - Reach out to @valllabh
   - Invite to claim packages on PRMP
   - Offer verified creator badge
   - Collaboration on future agents

### PRPM Scraper

```bash
cd scripts/scraper
tsx claude-agents-scraper.ts
```

This will:
- Clone agent markdown files
- Extract metadata and descriptions
- Generate PRMP manifests
- Save to `scripts/scraped/claude-agents.json`

---

## Source 3: wshobson/agents

**URL**: https://github.com/wshobson/agents
**Status**: Very active, comprehensive collection
**Agent Count**: 85+ agents across 63 plugins
**Format**: Structured plugins with agents/commands/skills
**License**: Open source (check repo)

### Agent Organization

```
plugins/
├── architecture/
│   ├── agents/
│   │   ├── backend-architect.md
│   │   ├── database-architect.md
│   │   └── system-architect.md
│   ├── commands/
│   └── skills/
├── languages/
│   ├── agents/
│   │   ├── typescript-expert.md
│   │   ├── python-expert.md
│   │   └── rust-expert.md
└── ...
```

### Plugin Categories (23 total)

1. **Development** (4 plugins)
2. **Languages** (7 plugins) - TypeScript, Python, Rust, etc.
3. **Infrastructure** (5 plugins) - Kubernetes, Docker, AWS, etc.
4. **Quality** (4 plugins) - Testing, security, code review
5. **Data/AI** (4 plugins) - ML, data engineering
6. **Business** - Product, marketing, sales, SEO

### Unique Features

- **Granular Design**: Average 3.4 components per plugin
- **Single Responsibility**: Each plugin does one thing well
- **Composable**: Mix and match for complex workflows
- **Hybrid Orchestration**: Haiku (fast) + Sonnet (complex)
- **Progressive Disclosure**: Efficient token usage

### Integration Strategy

1. **Bulk Import**
   - Scrape all 85+ agents
   - Organize by category
   - Maintain plugin structure as tags
   - Full attribution to @wshobson

2. **Author Partnership**
   - Contact William Hobson (@wshobson)
   - Showcase his agents on PRPM
   - Cross-promotion opportunity
   - Potential co-marketing

3. **Category Creation**
   - Map 23 categories to PRMP tags
   - Create "collections" feature for plugin sets
   - Enable "Install full plugin" option

### PRMP Scraper

```bash
cd scripts/scraper
tsx claude-agents-scraper.ts
```

This will:
- Scan all 63 plugin directories
- Extract agents from `agents/` subdirectories
- Preserve category information
- Generate ~85+ PRMP packages

---

## Comparison Matrix

| Source | Agents | Format | Curation | Best For |
|--------|--------|--------|----------|----------|
| subagents.cc | 6+ | Web/MD | High | Top-quality, popular agents |
| valllabh | 8 | Markdown | Medium | Full dev lifecycle roles |
| wshobson | 85+ | Structured | High | Comprehensive, specialized |

---

## Bootstrap Strategy

### Week 1: Scraping
- [x] Research sources
- [x] Build scrapers
- [ ] Run scrapers
- [ ] Review quality
- [ ] De-duplicate

### Week 2: Conversion
- [ ] Convert to PRMP format
- [ ] Generate manifests
- [ ] Test installations
- [ ] Create categories/tags

### Week 3: Publishing
- [ ] Publish to registry
- [ ] Mark as "unclaimed"
- [ ] Add source attributions
- [ ] Test search/install

### Week 4: Author Outreach
- [ ] Contact subagents.cc owner (Michael Galpert)
- [ ] Contact valllabh
- [ ] Contact wshobson (William Hobson)
- [ ] Invite to claim packages
- [ ] Offer partnerships

---

## Partnership Opportunities

### For Source Owners

**What PRMP Offers:**
1. **Distribution**: CLI-based installation for their agents
2. **Discovery**: Search and trending pages
3. **Analytics**: Download stats and usage metrics
4. **Verification**: Verified creator badges
5. **Monetization**: Future revenue sharing (if desired)

**What They Provide:**
1. **Content**: Their existing agents
2. **Endorsement**: "Available on PRMP" badge
3. **Updates**: Keep agents current
4. **Feedback**: Help improve PRMP

### Mutual Benefits

- **Wider Reach**: More developers discover their agents
- **Easier Access**: `prpm install` vs manual download
- **Versioning**: Proper semver and updates
- **Community**: Unified ecosystem for Claude agents
- **Cross-Promotion**: Link to original sources

---

## Outreach Templates

### Template: subagents.cc (Michael Galpert)

```
Subject: Partnership Opportunity - PRMP Registry

Hi Michael,

I'm building PRMP (Prompt Package Manager) - a CLI for distributing
Claude agents, similar to npm for packages.

Love what you've built at subagents.cc! The agents are excellent and
exactly what developers need.

Would love to partner with you to make these agents available via:

prpm install frontend-developer-subagents

Benefits for you:
- Wider distribution (CLI install vs manual download)
- Download analytics
- Verified creator badge
- Future revenue sharing (if desired)

Benefits for PRMP:
- High-quality, curated agents
- Established user base
- Community trust

Interested in chatting? Happy to adapt to your preferred partnership model.

Best,
Khaliq

P.S. Already have 100+ cursor rules. Adding Claude agents is the next step.
```

### Template: valllabh

```
Subject: PRMP - Distributing Your Claude Agents

Hi @valllabh,

Impressive work on claude-agents! The persona-based approach with
Mary, Bob, James, etc. is brilliant.

Building PRMP - a package manager for Claude agents and prompts:

prpm install analyst-mary-valllabh

Would love to:
1. Distribute your agents via PRMP (with full attribution)
2. Give you verified creator access
3. Track download stats
4. Collaborate on future agents

Your agents would help bootstrap our Claude agents category.

Interested?

Best,
Khaliq
```

### Template: wshobson (William Hobson)

```
Subject: PRPM + Your Agents Repository - Partnership

Hi William,

Your agents repository is incredible - 85+ agents across 63 plugins
is the most comprehensive collection I've seen.

I'm building PRMP (Prompt Package Manager) and would love to
distribute your agents via CLI:

prpm install backend-architect-wshobson
prpm install typescript-expert-wshobson

What I'm proposing:
1. Import all your agents (with full attribution)
2. Maintain your plugin structure as collections
3. Give you verified creator account + analytics
4. Cross-promote both projects

Your work would be the cornerstone of PRMP's Claude agents category.

Want to discuss?

Best,
Khaliq

GitHub: github.com/khaliqgant/prompt-package-manager
```

---

## Legal & Ethical Notes

### Permissions Required

- **Open Source**: Check license, attribute properly
- **Website Content**: Get permission before scraping
- **Derivative Works**: Ensure license allows redistribution

### Attribution Standards

All packages must include:
```json
{
  "author": {
    "name": "Original Author",
    "url": "https://original-source.com"
  },
  "metadata": {
    "originalSource": "https://...",
    "license": "MIT", // or whatever applies
    "scrapedAt": "2025-10-18",
    "unclaimed": true
  }
}
```

### Removal Policy

If any author requests removal:
1. Remove immediately (within 24 hours)
2. Send confirmation
3. Blacklist to prevent re-scraping
4. Update scraper to exclude

---

## Next Steps

1. **Run Scrapers** (30 mins)
   ```bash
   cd scripts/scraper
   export GITHUB_TOKEN="..."
   tsx claude-agents-scraper.ts
   tsx subagents-scraper.ts
   ```

2. **Review Output** (1 hour)
   - Check quality of scraped agents
   - Remove duplicates
   - Verify attributions

3. **Convert to PRMP** (2 hours)
   - Run seed upload script
   - Test installations
   - Verify search works

4. **Contact Authors** (Week 2)
   - Send partnership emails
   - Wait for responses
   - Adapt based on feedback

---

## Success Metrics

### Month 1
- [ ] 50+ Claude agents published
- [ ] All 3 sources contacted
- [ ] 1+ partnership established

### Month 3
- [ ] 100+ Claude agents
- [ ] All sources claiming packages
- [ ] "Available on PRMP" badges on source sites

### Month 6
- [ ] 200+ Claude agents
- [ ] Cross-promotion with all sources
- [ ] PRPM becomes primary distribution channel

---

**Ready to bootstrap the Claude agents ecosystem! 🚀**
