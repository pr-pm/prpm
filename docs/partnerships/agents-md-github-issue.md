# GitHub Issue: Proposal to Mention PRPM as Distribution Tooling

**Copy this content when creating the issue on https://github.com/openai/agents.md**

---

## 📦 Proposal: Consider mentioning PRPM as a distribution layer for agents.md files

### Summary

We've built [PRPM (Prompt Package Manager)](https://prpm.dev) with native agents.md support and believe it could help accelerate adoption of this excellent open standard. This is a humble proposal to explore a brief documentation mention.

### The Opportunity

**agents.md solves the format problem** - it gives AI coding agents a predictable, standard place to find project guidance.

**PRPM solves the distribution problem** - it makes agents.md files discoverable, installable, and shareable across the ecosystem.

### What PRPM Offers the agents.md Ecosystem

1. **Immediate content library**: 1,500+ existing AI configurations that can convert to agents.md
2. **Migration path**: Convert tool-specific formats (`.cursorrules`, `.github/copilot-instructions.md`, etc.) to agents.md
3. **Easy installation**: `prpm install nango/typescript-patterns --format agents.md`
4. **Quality validation**: Conversion scoring ensures agents.md files work well with Codex and other tools

### Example Usage

```bash
# Install PRPM
npm install -g @pr-pm/cli

# Search for patterns
prpm search typescript

# Install as agents.md format
prpm install nango/typescript-patterns --format agents.md
```

Result: An `agents.md` file is created in your project root with proven TypeScript patterns, ready to guide coding agents.

### Proposed Documentation Addition

We'd be honored if agents.md docs could include a brief mention:

> **Tooling & Distribution**
>
> - **[PRPM](https://prpm.dev)** - Package manager for AI coding configurations with native agents.md support. Install pre-written agents.md files or convert from other formats.

This could appear in the README, website, or a dedicated "Ecosystem" page.

### What We're NOT Asking

- ❌ Endorsement over other tools
- ❌ Changes to the agents.md spec
- ❌ Exclusive positioning
- ❌ Resource commitments

### Why This Matters

Converting formats is only valuable if the source content is good. Real companies have shared proven patterns:

- **Nango**: Used distributable TypeScript patterns to migrate 47 repos in 3 days
- **cursor.directory**: Community has created 1,000+ proven coding rules
- **Claude/Continue users**: Hundreds of tested skills and agents

All of this can become agents.md content, making it easier for new teams to adopt the standard instead of starting from scratch.

### Our Commitment

Regardless of this proposal's outcome:
- ✅ We'll maintain high-quality agents.md conversion
- ✅ We'll follow the spec exactly
- ✅ We're open source (MIT licensed)
- ✅ We'll promote agents.md as the open standard

### Benefits to agents.md Adoption

1. **Lower barrier to entry**: New users get working examples instantly
2. **Network effects**: More content → more adoption → more content
3. **Format migration**: Easier for teams to standardize on agents.md
4. **Open ecosystem**: PRPM is just one tool - the registry is accessible via API

### Links

- Registry: https://prpm.dev
- GitHub: https://github.com/pr-pm/prpm
- Blog: https://prpm.dev/blog/distributable-intelligence
- Format Support: https://github.com/pr-pm/prpm/pull/35

### Questions We'll Answer

- How can we better align with agents.md goals?
- What conversion quality standards should we meet?
- Would you prefer different messaging?
- How else can we support this ecosystem?

---

Thank you for creating agents.md - it's exactly the kind of open standard the AI coding ecosystem needs. We built PRPM to help distribute this kind of knowledge, and we'd be honored to help drive agents.md adoption.

**PRPM Team**
MIT Licensed • Open Source • Community-Driven
