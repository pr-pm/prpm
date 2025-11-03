# Gemini CLI Discussion Opportunity

**Thread**: https://github.com/google-gemini/gemini-cli/discussions/1471
**Topic**: "Support for agents.md?"
**Status**: Open discussion about adding agents.md support to Gemini CLI

---

## Context

There's an active GitHub discussion in the Gemini CLI repository asking about agents.md support. This is a perfect opportunity for PRPM to engage with the Gemini community and demonstrate how PRPM already supports Gemini through the agents.md format.

## Opportunity

Post in this discussion to:
1. ✅ Confirm that agents.md is supported by Google Gemini Code Assist
2. ✅ Share that PRPM has 2,100+ packages available in agents.md format
3. ✅ Offer PRPM as a distribution layer for agents.md files
4. ✅ Link to our FORMAT_COMPATIBILITY guide
5. ✅ Show Gemini community that there's already an ecosystem around agents.md

## Suggested Post

```markdown
### PRPM: Package Manager for agents.md Files

Hi! We've built [PRPM (Prompt Package Manager)](https://prpm.dev) which provides a package registry for agents.md files and other AI coding tool configurations.

**For Gemini CLI users:**

Since Gemini Code Assist has committed to supporting the agents.md open standard, you can use PRPM to discover and install agents.md files:

```bash
# Install PRPM
npm install -g prpm

# Search for packages
prpm search typescript --format agents.md

# Install as agents.md format
prpm install @sanjeed5/typescript-best-practices --format agents.md
```

**What PRPM offers:**
- 2,100+ packages available for agents.md format
- Cross-platform compatibility (works with Codex, Copilot, Gemini, etc.)
- Package versioning and updates
- Collections for bundling multiple configurations
- Format conversion between tool-specific formats and agents.md

**Resources:**
- [Homepage](https://prpm.dev)
- [Format Compatibility Guide](https://github.com/pr-pm/prpm/blob/main/docs/FORMAT_COMPATIBILITY.md)
- [agents.md Deep Dive](https://prpm.dev/blog/agents-md-deep-dive)
- [CLI Documentation](https://github.com/pr-pm/prpm)

We believe the agents.md standard is the right direction for the ecosystem, and PRPM provides the distribution layer to make these files discoverable and shareable.

If the Gemini CLI adds native agents.md support, PRPM packages will work seamlessly with it!
```

## Why This Matters

1. **Community Engagement**: Shows PRPM is actively supporting the agents.md ecosystem
2. **Gemini Visibility**: Gets PRPM in front of Gemini users early
3. **Open Standard Advocacy**: Reinforces PRPM's position as neutral infrastructure
4. **Network Effect**: If Gemini CLI adds agents.md support, PRPM benefits automatically
5. **Credibility**: Demonstrates PRPM already has working agents.md support

## Timing

- **Best time to post**: Soon, while discussion is active
- **Watch thread**: Monitor for responses and engage constructively
- **Follow-up**: If Gemini CLI team responds positively, offer to collaborate

## Tone & Approach

- ✅ Helpful and informative (not promotional)
- ✅ Emphasize open standard support
- ✅ Offer value to Gemini users immediately
- ✅ Express enthusiasm for agents.md standard
- ✅ Be collaborative, not competitive

## Related Partnerships

This is similar to our agents.md proposal strategy:
- [agents-md-proposal.md](./agents-md-proposal.md)
- [agents-md-github-issue.md](./agents-md-github-issue.md)
- [github-copilot-docs-pr.md](./github-copilot-docs-pr.md)

## Follow-Up Actions

If post generates interest:
1. Monitor thread for questions/feedback
2. Engage with Gemini CLI maintainers if they respond
3. Consider contributing to Gemini CLI if they're interested
4. Track if agents.md support gets added
5. Update PRPM docs to reference Gemini CLI once it supports agents.md

## Success Metrics

- Community reception (upvotes, positive comments)
- Whether Gemini CLI team engages
- Traffic to PRPM from the discussion
- New users trying PRPM for Gemini workflows
- Whether agents.md support gets added to Gemini CLI

---

## Notes

- This is a community discussion, not official Google channels
- Keep tone collaborative and supportive of agents.md standard
- Don't oversell - focus on helping Gemini users discover packages
- Be responsive to feedback or questions in the thread

**Updated**: 2025-10-26
**Next Review**: Check thread weekly for updates
