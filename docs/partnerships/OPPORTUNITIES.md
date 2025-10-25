# Partnership Opportunities

This document tracks potential partnership opportunities for PRPM (Prompt Package Manager) with organizations and projects in the AI coding assistant ecosystem.

## OpenAI - agents.md

**Repository:** https://github.com/openai/agents.md
**Website:** https://agents.md/
**License:** MIT
**Status:** Active open-source project

### What is agents.md?

agents.md is OpenAI's standardized format for guiding AI coding agents. Think of it as a "README for agents" - a dedicated, predictable place to provide context and instructions to help AI coding agents work on your project.

**Key Features:**
- Simple, structured markdown file for project-specific instructions
- Sections for dev environment tips, testing instructions, PR guidelines
- Standardized approach to communicating project requirements to AI assistants
- Sample templates demonstrating how to structure agent instructions

**Tech Stack:**
- TypeScript (94.2%)
- Next.js website
- MIT licensed

### Partnership Opportunity

**Alignment with PRPM:**
- **Complementary Goals**: agents.md focuses on project-level AI guidance, PRPM focuses on distributable, reusable AI knowledge packages
- **Standardization**: Both aim to standardize how AI assistants receive instructions
- **Universal Format**: Both support cross-platform AI assistants

**Potential Collaboration:**

1. **AGENTS.md → PRPM Integration**
   - agents.md files could reference PRPM packages for common patterns
   - Example: `AGENTS.md` could specify "Install @framework/migration-patterns via PRPM"
   - PRPM packages complement project-specific AGENTS.md instructions

2. **Format Conversion**
   - PRPM could support agents.md as an input/output format
   - Convert agents.md instructions to PRPM packages for distribution
   - Allow projects to "export" their AGENTS.md as a PRPM package

3. **Registry Integration**
   - PRPM registry could host agents.md-compatible packages
   - agents.md format as a PRPM package type/subtype
   - Cross-promotion: agents.md site links to PRPM registry

4. **Specification Alignment**
   - Collaborate on universal format that works for both
   - PRPM's canonical format could support agents.md structure
   - Shared taxonomy for instructions vs. executable knowledge

**Value Proposition for OpenAI:**
- PRPM provides distribution mechanism for agents.md instructions
- Package versioning for agents.md files
- Community-contributed agents.md templates via PRPM registry
- Format conversion (agents.md ↔ Cursor/Claude/Continue formats)

**Value Proposition for PRPM:**
- Association with OpenAI lends credibility
- Access to OpenAI's developer ecosystem
- agents.md as a well-designed format to support
- Potential for OpenAI to recommend PRPM as distribution layer

### Technical Integration Points

**Option 1: PRPM as agents.md Distribution Layer**
```bash
# Install an agents.md template
$ prpm install @openai/nextjs-agents-template --format agents.md
✓ Installed to AGENTS.md

# Publish your agents.md configuration
$ prpm publish @yourorg/project-agents-config --format agents.md
```

**Option 2: agents.md References PRPM Packages**
```markdown
# AGENTS.md

## Dependencies
This project uses PRPM packages for AI guidance:
- `@react/hooks-migration` - React hooks migration patterns
- `@typescript/strict-mode` - TypeScript strict mode rules

Install via:
$ prpm install @react/hooks-migration @typescript/strict-mode

## Development
See installed PRPM packages in .cursor/rules/ for coding standards.
```

**Option 3: Hybrid Format**
- PRPM supports agents.md frontmatter
- Packages can target agents.md as output format
- agents.md files can import PRPM packages

### Next Steps

1. **Outreach**
   - Contact OpenAI agents.md maintainers
   - Introduce PRPM concept and alignment
   - Propose informal collaboration

2. **Technical Proof of Concept**
   - Add agents.md as a PRPM format
   - Build converter: agents.md ↔ PRPM canonical format
   - Demonstrate PRPM packages working with agents.md

3. **Community Engagement**
   - Create sample agents.md templates as PRPM packages
   - Publish to PRPM registry
   - Blog post: "Using PRPM with agents.md"

4. **Formal Partnership Discussion**
   - After POC, propose formal integration
   - Discuss co-marketing opportunities
   - Explore OpenAI recommendation/endorsement

### Risks & Considerations

**Risks:**
- OpenAI may prefer standalone agents.md ecosystem
- Potential format conflicts (agents.md vs. PRPM canonical)
- Timing: agents.md is still early, may not want external dependencies

**Mitigations:**
- Position PRPM as complementary, not competitive
- Support agents.md format regardless of partnership
- Focus on value-add (distribution, versioning, discovery)
- Keep integration lightweight and optional

### Status

- [ ] Initial research complete
- [ ] Outreach email drafted
- [ ] POC: agents.md format support in PRPM
- [ ] Sample packages published
- [ ] First contact with agents.md maintainers
- [ ] Partnership discussion initiated
- [ ] Technical integration agreed
- [ ] Co-marketing launched

---

**Created:** 2025-10-25
**Last Updated:** 2025-10-25
**Owner:** PRPM Team
**Priority:** High (strategic alignment with OpenAI)

## Other Potential Partnerships

### Cursor

**Status:** Existing format support
**Opportunity:** Official Cursor integration, featured in marketplace
**Next Steps:** Reach out to Cursor team about partnership

### Anthropic (Claude)

**Status:** Existing format support
**Opportunity:** Claude Marketplace integration, official recommendation
**Next Steps:** Leverage existing relationship, propose registry integration

### Continue.dev

**Status:** Existing format support
**Opportunity:** Default package manager for Continue
**Next Steps:** Open discussion with Continue maintainers

### Windsurf (Codeium)

**Status:** Existing format support
**Opportunity:** Integration with Windsurf's cascade feature
**Next Steps:** Explore technical integration points

### GitHub Copilot

**Status:** Existing format support
**Opportunity:** Official GitHub/Microsoft partnership
**Next Steps:** Research GitHub Copilot extensibility model

### Kiro

**Status:** Existing format support
**Opportunity:** Early-stage project, easier partnership
**Next Steps:** Contact Kiro maintainers

---

**Note:** This is a living document. Update as partnerships progress.
