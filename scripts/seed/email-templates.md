# Author Outreach Email Templates

Templates for reaching out to original package authors to claim ownership.

## Template 1: GitHub Issue (Preferred)

**Title:** Your cursor rules are now on PRMP Registry - Claim Your Package

**Body:**
```markdown
Hi @{username}! 👋

We're building [PRMP (Prompt Package Manager)](https://github.com/pr-pm/prpm) - a CLI tool for managing AI prompts, similar to npm but for cursor rules, Claude agents, and other AI prompt files.

**Your cursor rules are now available on our registry!** 🎉

📦 **Package:** [{package-name}](https://registry.prpm.dev/packages/{package-name})
⭐ **Your Stars:** {stars}
📥 **Install:** `prpm install {package-name}`

### Why we published your rules

To bootstrap our registry with high-quality content, we've published popular cursor rules with full attribution to original authors. Your package includes:
- Link to your original repository
- Your GitHub username and profile
- Original star count and metadata
- Clear indication that you're the original author

### Claim your package

You can claim ownership and verify your package by:

1. Visiting: https://registry.prpm.dev/claim/{package-name}
2. Logging in with GitHub (OAuth)
3. Getting a verified ✓ badge on your package

**Benefits of claiming:**
- ✅ Verified badge on your package
- 📊 Analytics dashboard (downloads, trends)
- 🚀 Ability to publish updates
- 🎯 Priority support for verified authors
- 🌟 Featured in our "Verified Creators" showcase

### What if I don't want my package published?

No problem! Just let us know and we'll remove it immediately. We respect your wishes.

### Learn more

- [Project Repo](https://github.com/pr-pm/prpm)
- [Documentation](https://docs.prpm.dev)
- [How it Works](https://docs.prpm.dev/how-it-works)

Thanks for creating awesome cursor rules! 🙏

---
*This is a one-time notification. We published your rules to help bootstrap the ecosystem and showcase quality content.*
```

## Template 2: Twitter/X DM

```
Hey! We published your cursor rules on PRMP Registry (npm for AI prompts).

📦 {package-name}
📥 prpm install {package-name}

Claim your package & get verified: https://registry.prpm.dev/claim/{package-name}

Full attribution + benefits for verified authors. LMK if you have questions!
```

## Template 3: Email (if available)

**Subject:** Your cursor rules are on PRMP Registry - Claim Verification

**Body:**
```
Hi {name},

I'm building PRMP (Prompt Package Manager) - a CLI tool for managing AI prompts,
similar to npm but for cursor rules and Claude agents.

I published your cursor rules from {github-url} on our registry to help bootstrap
the ecosystem with quality content. Your package has full attribution and links
back to your repo.

📦 Package: {package-name}
📥 Install: prpm install {package-name}
🔗 View: https://registry.prpm.dev/packages/{package-name}

Would love for you to claim ownership and get verified! It takes 30 seconds:
→ https://registry.prpm.dev/claim/{package-name}

Benefits:
✅ Verified badge
📊 Analytics dashboard
🚀 Publish updates
🌟 Featured placement

If you'd prefer I remove your package, just reply and I'll take it down immediately.

Thanks for making great cursor rules!

Khaliq
Founder, PRMP
https://github.com/pr-pm/prpm
```

## Template 4: Reddit/Forum Post

**Title:** Published your cursor rules on PRMP - Claim your package

**Body:**
```
Hey folks!

I'm building PRMP (Prompt Package Manager) - a CLI for managing AI prompts.

To bootstrap the registry, I've published popular cursor rules with full attribution.
If you're a cursor rules author, you can now:

1. Find your package: https://registry.prpm.dev/search?q={your-username}
2. Claim ownership: Log in with GitHub
3. Get verified: Add ✓ badge and analytics

Example install:
```
prpm install react-cursor-rules
```

Full list of published packages: https://registry.prpm.dev/explore

All packages include original author attribution, repo links, and star counts.
If you want your package removed, just let me know.

Project repo: https://github.com/pr-pm/prpm

Feedback welcome!
```

## Template 5: Mass Email (Newsletter)

**Subject:** 100+ Cursor Rules Now Available via CLI

**Body:**
```html
<h2>Your Cursor Rules Are Now Installable via CLI</h2>

<p>We've published <strong>100+ popular cursor rules</strong> on PRMP Registry
with full attribution to original authors.</p>

<h3>Install Any Package:</h3>
<pre>prpm install react-rules</pre>

<h3>For Authors:</h3>
<ul>
  <li>✅ Claim your package & get verified</li>
  <li>📊 Access download analytics</li>
  <li>🚀 Publish updates directly</li>
  <li>🌟 Featured creator placement</li>
</ul>

<a href="https://registry.prpm.dev/explore">Browse All Packages →</a>

<p>If you're a cursor rules author, check if your rules are published
and claim verification at: <a href="https://registry.prpm.dev/claim">
registry.prpm.dev/claim</a></p>

<h3>What is PRMP?</h3>
<p>PRMP (Prompt Package Manager) is like npm but for AI prompts - cursor rules,
Claude agents, Continue configs, etc. It provides a unified CLI for discovering,
installing, and managing AI prompt files.</p>

<a href="https://github.com/pr-pm/prpm">Learn More →</a>

<p><small>Don't want your package published? Reply to opt-out.</small></p>
```

## Outreach Strategy

### Week 1: Top Creators (High Priority)
- Authors with 100+ stars
- Active maintainers (updated <3 months ago)
- GitHub Issues + Twitter DMs
- Target: 20-30 claims

### Week 2: Medium Tier
- Authors with 50-100 stars
- GitHub Issues only
- Target: 30-50 claims

### Week 3: Long Tail
- All remaining authors
- Batch email via newsletter
- Target: 50-100 claims

### Week 4: Community Launch
- Product Hunt launch
- Hacker News post
- Dev.to / Hashnode articles
- Twitter announcement thread

## Metrics to Track

- **Open Rate**: % of contacted authors who read message
- **Claim Rate**: % who complete claiming process
- **Response Rate**: % who reply (positive or negative)
- **Removal Requests**: % who ask for removal (<5% expected)
- **Time to Claim**: How quickly authors claim after contact

## Legal/Ethical Notes

✅ **Allowed:**
- Publishing public open-source cursor rules
- Attributing to original authors
- Providing claiming mechanism
- Removing upon request

❌ **Not Allowed:**
- Publishing proprietary/licensed content
- Claiming authorship
- Monetizing without permission
- Ignoring removal requests

All packages include prominent "This package was curated. Claim ownership →" notice.

---

## Special: Simon Willison Outreach

See dedicated strategy: `scripts/outreach/simon-willison.md`

**Quick Template for Simon**:

```
Subject: PRMP - Making Claude Skills as Easy as npm install

Hi Simon,

Just read your excellent piece on Claude Skills. Built exactly what you describe:

prpm install react-expert-skill

Like npm, but for Claude skills and prompts. Launching next week with 100+ packages.

Would love your feedback: github.com/pr-pm/prpm

Best,
Khaliq
```
