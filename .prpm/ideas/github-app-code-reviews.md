# PRPM GitHub App - AI Code Reviews with PRPM Agents

## Idea

Create a PRPM GitHub App that performs code reviews on pull requests using the PRPM agent system. Instead of generic AI reviews, use the same agents that developers already trust for development (testing-patterns, format-conversion, core-principles, etc.).

## Why This Is Cool

1. **Context-Aware Reviews** - Reviews use the same agents that helped write the code
2. **Consistent Standards** - Same quality bar across development and review
3. **Extensible** - Teams can add custom agents for domain-specific reviews
4. **Trust** - Developers already validated these agents during development
5. **Dogfooding** - PRPM reviewing PRPM code with PRPM agents

## How It Could Work

### Installation
```bash
# Install the GitHub App on your repo
# Configure which agents to use for reviews in .prpm/review-config.json
```

### Configuration
```json
{
  "agents": [
    "prpm-core-principles",
    "prpm-testing-patterns",
    "format-conversion-expert"
  ],
  "triggers": {
    "on": ["pull_request"],
    "paths": {
      "packages/cli/**": ["prpm-core-principles"],
      "packages/registry/**": ["prpm-testing-patterns"],
      "**/*.test.ts": ["prpm-testing-patterns"]
    }
  },
  "review": {
    "autoApprove": false,
    "commentStyle": "inline",
    "summaryFormat": "markdown"
  }
}
```

### Review Process

1. **PR Opened** → GitHub webhook to PRPM review service
2. **Agent Selection** → Match files changed to configured agents
3. **Parallel Review** → Each agent reviews relevant files
4. **Aggregate Results** → Combine insights from all agents
5. **Post Review** → Inline comments + summary

### Example Review Comment

```markdown
**🤖 PRPM Agent Review** (`prpm-testing-patterns`)

**Issue**: Missing test coverage for edge case

In `packages/cli/src/commands/install.ts:142-156`:

You're handling the happy path for package installation, but there's no test coverage for:
- Network failures during download
- Corrupted tar archives
- Permission errors on file write

**Suggestion**: Add tests to `install.test.ts`:

```typescript
it('should handle network failures gracefully', async () => {
  mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
  await expect(installPackage('@scope/pkg')).rejects.toThrow('Failed to download package');
});
```

**Pattern**: This follows the "test failure modes" pattern from `.claude/agents/testing-patterns.md:89-112`

---
*Reviewed by PRPM agent: `prpm-testing-patterns`*
*View agent source: `.claude/agents/testing-patterns.md`*
```

### Summary Comment

```markdown
## 🤖 PRPM Review Summary

**3 agents** reviewed **12 files** in this PR

### ✅ Approved by
- `prpm-core-principles` (8/8 files)
- `format-conversion-expert` (3/3 files)

### ⚠️ Suggestions from
- `prpm-testing-patterns` (4 suggestions)

### Files Reviewed
- `packages/cli/src/commands/install.ts` - 2 suggestions
- `packages/cli/src/__tests__/install.test.ts` - 2 suggestions
- `packages/registry/src/converters/from-copilot.ts` - ✅ looks good

### Key Insights

**Testing Coverage** (prpm-testing-patterns)
- Missing edge case tests for network failures (2 files)
- Good use of mocking patterns

**Architecture** (prpm-core-principles)
- Following universal format philosophy ✅
- Cache invalidation strategy looks solid ✅

**Format Conversion** (format-conversion-expert)
- Round-trip conversion tests present ✅
- Quality scoring implemented correctly ✅

---
*Powered by PRPM agents • [Configure reviews](.prpm/review-config.json)*
```

## Architecture

### Components

1. **GitHub App** (Node.js/Fastify)
   - Webhook receiver
   - OAuth for installation
   - Queue reviews (Bull/Redis)

2. **Review Service** (TypeScript)
   - Loads agents from `.claude/agents/`
   - Runs agents against PR diff
   - Aggregates results
   - Posts comments via GitHub API

3. **Agent Runtime** (Uses existing Claude SDK)
   - Same runtime as Claude Code
   - Agents have access to PR context
   - Can read full file contents
   - Can reference project docs

4. **Dashboard** (Optional)
   - Review history
   - Agent performance metrics
   - Configuration UI

### Tech Stack

```
GitHub App
├── Fastify server
├── Octokit (GitHub API)
├── Bull (job queue)
├── Redis (state/caching)
└── PRPM Agent Runtime
    ├── Claude SDK
    ├── Agent loader
    └── Context manager
```

## Benefits Over Generic AI Reviews

| Generic AI Review | PRPM Agent Review |
|------------------|-------------------|
| Generic coding standards | Project-specific principles |
| Doesn't know your architecture | Uses your core-principles agent |
| Misses domain logic | Custom agents for your domain |
| No context on testing strategy | Uses your testing-patterns agent |
| One-size-fits-all comments | Tailored to your codebase |
| Can't reference your docs | Agents already know your patterns |

## MVP Scope

**Phase 1: Basic Review**
- [ ] GitHub App setup (OAuth, webhooks)
- [ ] PR diff parsing
- [ ] Single agent review (prpm-core-principles)
- [ ] Inline comments
- [ ] Summary comment

**Phase 2: Multi-Agent**
- [ ] Load multiple agents
- [ ] Path-based agent selection
- [ ] Parallel agent execution
- [ ] Aggregate results

**Phase 3: Configuration**
- [ ] `.prpm/review-config.json` support
- [ ] Custom agent installation
- [ ] Review triggers (paths, labels, etc.)

**Phase 4: Polish**
- [ ] Dashboard for review history
- [ ] Agent performance metrics
- [ ] Suggested fixes (not just comments)
- [ ] Auto-approve option (with confidence threshold)

## Example Use Cases

### 1. Format Conversion PRs
Agent: `format-conversion-expert`
- Validates lossless conversion claims
- Checks quality scoring
- Verifies round-trip tests

### 2. Testing PRs
Agent: `prpm-testing-patterns`
- Coverage requirements
- Mock patterns
- Edge case detection

### 3. Architecture Changes
Agent: `prpm-core-principles`
- Universal format philosophy
- Registry-first approach
- Semantic versioning compliance

### 4. Blog Posts
Agent: `prpm-blog-writer`
- Structure checklist
- Tone consistency
- Social snippet validation

## Integration with Existing Workflow

```yaml
# .github/workflows/review.yml
name: PRPM Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: pr-pm/prpm-review-action@v1
        with:
          agents: 'prpm-core-principles,prpm-testing-patterns'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

Or just install the GitHub App and it handles everything automatically.

## Monetization - PRPM+ Subscription

**This GitHub App would be included as a premium feature for PRPM+ subscribers.**

### PRPM+ Tiers

**Free Tier**
- Public repos only
- PRPM official agents only (core-principles, testing-patterns)
- 50 reviews/month
- Community support

**PRPM+ ($29/month)**
- Private repos
- Custom agents from registry
- Unlimited reviews
- Priority support
- **Includes: PRPM GitHub App for code reviews**

**PRPM+ Team ($99/month)**
- Everything in PRPM+
- Team agent sharing
- Organization-wide configuration
- Dedicated Slack channel
- **Includes: PRPM GitHub App with team agents**

**Enterprise (Custom)**
- On-premise deployment
- Unlimited agents
- SLA guarantees
- Custom agent development
- **Includes: Self-hosted PRPM GitHub App**

### Value Proposition

Installing PRPM+ unlocks the GitHub App automatically:
1. Subscribe to PRPM+ on prpm.dev
2. Connect GitHub account via OAuth
3. Install PRPM GitHub App on repos
4. Reviews start automatically on next PR

**Positioning**: "The same agents that help you code now help you review code."

## Prior Art

- **CodeRabbit** - Generic AI reviews
- **Copilot for PRs** - GitHub's solution
- **Danger** - Scriptable reviews (not AI)
- **SonarCloud** - Static analysis

**Difference**: PRPM reviews use the same agents developers already trust. Not generic AI, but your team's specific knowledge encoded as agents.

## Open Questions

1. How to handle agent disagreements? (e.g., two agents suggest different approaches)
2. Rate limiting - how many review requests per PR?
3. Cost model - Claude API calls per review could get expensive
4. Privacy - how to handle private repos securely?
5. Agent versioning - which version of agent to use for review?

## Next Steps

1. Build proof-of-concept (single agent, single PR review)
2. Test on PRPM repo itself (dogfood)
3. Get feedback from early users
4. Decide on hosting (cloud vs GitHub Action)
5. Launch beta

## References

- GitHub Apps API: https://docs.github.com/en/apps
- Octokit: https://github.com/octokit/octokit.js
- PRPM Agents: `.claude/agents/`
- Testing Patterns Agent: `.claude/agents/testing-patterns.md`

---

**Status**: Idea
**Priority**: Nice to have
**Complexity**: Medium-High
**Value**: High (dogfooding + unique differentiator)

**Created**: 2025-10-25
**By**: User request - "code reviews using our agents that review pull requests"
