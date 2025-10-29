# PRPM Ideas & Future Concepts

This document captures ideas and concepts for future PRPM features and innovations.

---

## AI-Powered Code Review Agents

**Concept**: GitHub App integration that enables AI agents with specific domain expertise to review pull requests.

### Core Approach
**Leverage existing PRPM agents + Anthropic SDK** instead of hosting AI models:
- Users bring their own Anthropic API key (or pay small markup)
- PRPM agents run via Claude API on PR diffs
- Lightweight architecture: GitHub webhook → Lambda → PRPM agent → Anthropic API → PR comment
- No infrastructure burden, scales with Anthropic

### Key Features
- **Invite-only reviews**: PR authors can request specific AI agents as reviewers
- **Domain-specific agents**: Different agents for different review types:
  - Documentation reviewer (e.g., for Nango docs)
  - Security reviewer (scans for vulnerabilities)
  - Performance reviewer (identifies optimization opportunities)
  - Accessibility reviewer (checks WCAG compliance)
  - API design reviewer (validates REST/GraphQL patterns)
- **Auto & on-demand modes**:
  - Auto: Configured agents run on every PR
  - On-demand: `/prpm review security` comment to invoke specific agent

### Implementation Ideas
- **GitHub App**: Install as a GitHub App with PR review permissions
- **Agent selection**: Use existing PRPM agent packages (no new infrastructure)
- **Agent marketplace**: Browse and select from 1,300+ existing PRPM packages
- **Review reports**: Detailed markdown reports with inline comments
- **Auto-fix PRs**: Agents can optionally create follow-up PRs with fixes

### PRPM Integration
- Agents are published as PRPM packages (new subtype: `reviewer` or `code-review-agent`)
- Install review agents: `prpm install @reviewer/docs-expert`
- Configure review rules in `prpm.json`:
  ```json
  {
    "reviewers": {
      "docs": "@reviewer/docs-expert",
      "security": "@reviewer/security-scanner",
      "auto-invoke": ["docs", "security"]
    }
  }
  ```

### Privacy & Security
- **Opt-in**: Teams explicitly enable review agents
- **Private context**: Agents only see PR diffs, not full repo (unless authorized)
- **Audit logs**: Track which agents reviewed which PRs
- **Agent reputation**: Review agents have quality scores and community feedback

### Monetization
- **Free tier**: Basic review agents
- **Premium agents**: Specialized/trained agents (e.g., $10/month for advanced security review)
- **Enterprise**: Custom-trained agents on org-specific patterns

### Example Use Cases
1. **Nango Documentation Reviews**
   - Agent trained on Nango docs patterns
   - Checks for: broken links, missing code examples, unclear instructions
   - Suggests improvements based on community feedback patterns

2. **API Design Reviews**
   - Reviews REST/GraphQL API changes
   - Checks: naming consistency, versioning, breaking changes
   - Suggests: better error messages, pagination patterns

3. **Accessibility Reviews**
   - Scans UI components for WCAG violations
   - Checks: color contrast, ARIA labels, keyboard navigation
   - Auto-generates accessibility reports

### Architecture
```
Setup Flow:
  prpm install @reviewer/docs-expert
  prpm github setup (prompts for GitHub App + Anthropic API key)

Review Flow:
  PR opened → GitHub webhook → Lambda
           → Load PRPM agent package
           → Execute via Anthropic SDK
           → Post review as GitHub comment
```

### Differentiation vs. CodeRabbit/Competitors
- **Open agent marketplace**: Not proprietary, community-driven agents
- **Bring-your-own-API-key**: Users control costs and data
- **Existing ecosystem**: Leverage 1,300+ PRPM packages
- **Consistent agents**: Same agents work in IDE and GitHub
- **Niche focus**: Best for teams who want customizable, domain-specific reviews

### Competitive Analysis
- **CodeRabbit**: $12-15/seat, proprietary, general-purpose
- **Sweep AI**: Focused on code generation, not just reviews
- **Codium PR-Agent**: Open source but less polished
- **PRPM approach**: Community agents + user API keys = lower cost, higher customization

### Risks & Challenges
- ⚠️ **Crowded space**: Many established players
- ⚠️ **Context limits**: Need to fetch relevant files beyond PR diff
- ⚠️ **False positives**: AI reviews can be noisy
- ⚠️ **Adoption friction**: Requires GitHub App install + API key setup

### Related Work
- GitHub Copilot for PRs (auto-generated PR descriptions)
- CodeRabbit (AI code review)
- Sourcery (Python-specific refactoring)
- DeepCode (security scanning)
- Codium PR-Agent (open source alternative)

**Status**: 💡 Idea stage
**Priority**: Medium
**Timeline**: Q3-Q4 2025
**Dependencies**: v2.0 AI infrastructure, Anthropic SDK integration
**Viability**: ⚠️ Competitive but defensible with agent marketplace niche

---

## Pre-Commit Review Hooks

**Concept**: Local pre-commit hooks that run PRPM agents before code is committed.

### Core Features
- **Local execution**: Runs on developer machine before commit
- **Fast feedback**: Catch issues before they reach GitHub
- **Agent-powered**: Use PRPM agents for consistent reviews
- **Configurable**: Choose which agents run on which file types

### Implementation
```bash
# Install pre-commit agents
prpm install @pre-commit/security-scanner
prpm install @pre-commit/linter

# Setup git hooks
prpm hooks install

# Configure which agents run
# .prpm/hooks.json
{
  "pre-commit": {
    "*.ts": ["@pre-commit/linter", "@pre-commit/security-scanner"],
    "*.md": ["@pre-commit/docs-checker"]
  }
}
```

### Execution Flow
```
git commit → pre-commit hook → PRPM CLI
          → Load configured agents
          → Run agents on staged files
          → Show issues in terminal
          → Block commit if critical issues found
          → (Optional) Auto-fix and re-stage
```

### Advantages
- **Less crowded space**: Pre-commit AI tools are underserved
- **Faster feedback**: Issues caught before push
- **No infrastructure**: Runs locally with user's API key
- **Works offline**: Can cache agent responses
- **IDE integration**: Could integrate with Cursor/Claude/etc.

### Use Cases
1. **Security scanning**: Detect secrets, vulnerabilities before commit
2. **Code style**: Enforce patterns beyond what linters catch
3. **Documentation**: Ensure JSDoc comments on new functions
4. **Test coverage**: Warn if new code lacks tests
5. **Breaking changes**: Detect API changes that need migration docs

### Configuration Example
```json
{
  "hooks": {
    "pre-commit": {
      "agents": [
        {
          "name": "@pre-commit/security-scanner",
          "files": "**/*.{js,ts,py}",
          "severity": "error",
          "auto-fix": false
        },
        {
          "name": "@pre-commit/docs-checker",
          "files": "**/*.ts",
          "severity": "warning",
          "auto-fix": true
        }
      ]
    },
    "pre-push": {
      "agents": [
        {
          "name": "@pre-commit/test-coverage",
          "severity": "warning"
        }
      ]
    }
  }
}
```

### Competitive Landscape
- **Husky + ESLint**: Traditional linting, not AI-powered
- **pre-commit framework**: Python-based, not AI-native
- **Cursor/Claude**: Can review code but not in git hooks
- **PRPM advantage**: AI agents + git hooks = new category

**Status**: 💡 Idea stage
**Priority**: High (less competitive, natural fit for PRPM)
**Timeline**: Q2 2025 (could ship before PR review)
**Dependencies**: Anthropic SDK integration, git hook system
**Viability**: ✅ Strong - clear differentiation, natural PRPM extension

---

## Other Ideas

(Add more ideas below as they come up)

---

*Last updated: January 2025*
