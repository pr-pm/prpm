# Feature: Security Scanning with Vibe-Condom Integration

**Status:** Future Enhancement
**Priority:** Medium-High
**GitHub:** https://github.com/ngmisl/vibe-condom
**Date:** 2025-11-16

## Overview

Integrate vibe-condom security scanning to detect malicious prompt injections and concealed characters in PRPM packages before publication and installation.

## What is Vibe-Condom?

A Go-based security tool that detects:
- ASCII control characters and zero-width characters
- Bidirectional text manipulations
- Unicode tag characters (U+E0000 to U+E007F)
- Base64-encoded content with injection heuristics
- Mixed script detection across writing systems

## Why This Matters for PRPM

PRPM hosts AI prompts, rules, skills, and agents that directly influence AI behavior. Malicious actors could:
- Inject hidden instructions via zero-width characters
- Use bidirectional text to obscure malicious content
- Encode prompt injections in base64
- Hide instructions using Unicode control characters

This poses security risks to:
- **Users** installing packages with hidden malicious prompts
- **AI systems** executing compromised instructions
- **PRPM platform** reputation and trust

## Integration Points

### 1. Pre-Publication Validation

**When:** During `prpm publish` workflow
**Where:** Registry API package validation endpoint

```typescript
// packages/registry/src/routes/packages.ts
async function validatePackageSecurity(packageContent: string): Promise<SecurityReport> {
  // Call vibe-condom via CLI or Go library binding
  const result = await vibecondom.scan(packageContent, {
    checkControlChars: true,
    checkBidiText: true,
    checkUnicodeTag: true,
    checkBase64: true,
    checkMixedScript: true,
  })

  return {
    passed: result.threats.length === 0,
    threats: result.threats,
    severity: calculateSeverity(result.threats),
  }
}
```

**Workflow:**
1. Author runs `prpm publish`
2. Package content scanned by vibe-condom
3. If threats detected → reject with detailed report
4. If clean → proceed with publication

### 2. Installation-Time Scanning

**When:** During `prpm install` before writing files
**Where:** CLI installation logic

```typescript
// packages/cli/src/commands/install.ts
async function scanBeforeInstall(packageContent: string): Promise<void> {
  const securityReport = await vibecondom.scan(packageContent)

  if (securityReport.threats.length > 0) {
    console.warn('⚠️  Security Warning: Potential threats detected')
    securityReport.threats.forEach(threat => {
      console.warn(`  - ${threat.type}: ${threat.description}`)
    })

    const proceed = await confirm('Continue installation anyway?')
    if (!proceed) throw new Error('Installation cancelled by user')
  }
}
```

**UX:**
- Non-blocking warnings for low-severity issues
- Blocking prompts for high-severity threats
- `--skip-security-check` flag for advanced users

### 3. Security Scoring in Package Quality

**Enhancement:** Add security dimension to quality scores

```typescript
// Current quality score: 0-5 based on content, author, engagement, maintenance
// New: Add security factor

interface QualityScore {
  content: number      // 40% (2.0 points)
  author: number       // 30% (1.5 points)
  engagement: number   // 20% (1.0 points)
  maintenance: number  // 10% (0.5 points)
  security: number     // NEW: Bonus/penalty (-0.5 to +0.5)
}
```

**Security Score Calculation:**
- **+0.5 points:** Clean scan, verified author, active maintenance
- **0.0 points:** Clean scan, standard package
- **-0.5 points:** Contains suspicious patterns (logged but not blocked)
- **Package rejection:** Critical threats detected

### 4. Automated Repository Scanning

**When:** Via GitHub Actions on package repositories
**Where:** CI/CD workflow

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install vibe-condom
        run: go install github.com/ngmisl/vibe-condom@latest
      - name: Scan for threats
        run: vibecondom scan . --extensions .md,.yaml,.json
      - name: Report findings
        if: failure()
        run: echo "Security threats detected. Review logs."
```

### 5. Registry Dashboard for Authors

**Feature:** Security report in package analytics

```typescript
// Show security scan history for package authors
interface SecurityHistory {
  packageId: string
  scanDate: Date
  version: string
  threatsDetected: number
  threatTypes: string[]
  status: 'clean' | 'warning' | 'blocked'
}
```

**Author dashboard shows:**
- Security scan status for all versions
- Historical threat detection trends
- Recommendations for fixing flagged content

## Implementation Phases

### Phase 1: Research & Proof of Concept (1 week)
- [ ] Test vibe-condom with sample PRPM packages
- [ ] Measure false positive rate
- [ ] Evaluate Go library vs CLI integration approach
- [ ] Document threat types most relevant to AI prompts

### Phase 2: Pre-Publication Validation (2 weeks)
- [ ] Integrate vibe-condom into registry API
- [ ] Add security validation endpoint
- [ ] Update `prpm publish` to call validation
- [ ] Design threat report UI for CLI
- [ ] Write tests for security validation flow

### Phase 3: Installation-Time Scanning (1 week)
- [ ] Add scanning to CLI install command
- [ ] Implement warning/blocking logic
- [ ] Add `--skip-security-check` flag
- [ ] Update documentation

### Phase 4: Security Scoring (2 weeks)
- [ ] Design security scoring algorithm
- [ ] Add security field to package database
- [ ] Update quality score calculation
- [ ] Backfill security scores for existing packages
- [ ] Update search ranking to include security

### Phase 5: Dashboard & Monitoring (1 week)
- [ ] Add security tab to author dashboard
- [ ] Show scan history and trends
- [ ] Email notifications for flagged packages
- [ ] Public security badge for clean packages

## Technical Considerations

### Integration Approach

**Option A: CLI Wrapper**
- Call vibe-condom binary as subprocess
- Easier to implement
- Requires Go installed on servers
- Slower (process overhead)

**Option B: Go Library Binding**
- Use cgo or create Node.js native addon
- Better performance
- More complex setup
- Tighter integration

**Recommendation:** Start with CLI wrapper (Phase 1-2), evaluate native binding later if performance matters.

### False Positive Handling

Legitimate use cases that might trigger false positives:
- Code examples showing injection techniques (educational)
- Unicode art or international text (mixed scripts)
- Base64-encoded images or data URLs

**Solution:**
- Allow authors to mark sections as safe (e.g., code blocks)
- Whitelist certain file types (e.g., images)
- Manual review queue for borderline cases

### Performance Impact

Scanning overhead per package:
- **Small package (1-5 KB):** ~10-50ms
- **Large package (100+ KB):** ~100-500ms

**Optimization:**
- Cache scan results by content hash
- Run scans asynchronously in background
- Skip re-scanning unchanged versions

## Success Metrics

- **Security Coverage:** % of packages scanned before publication
- **Threat Detection:** # of malicious packages blocked
- **False Positive Rate:** < 1% of clean packages flagged
- **User Trust:** Security concerns in support tickets ↓ 50%
- **Performance:** < 200ms scan time for 95th percentile

## Related Features

- **Package Verification:** Already verify author identity via GitHub OAuth
- **Quality Scoring:** Security adds another dimension to quality
- **Playground Testing:** Could add security warnings in playground
- **Format Conversion:** Ensure security preserved across format conversions

## Resources

- **Vibe-Condom Repo:** https://github.com/ngmisl/vibe-condom
- **Go Installation:** https://go.dev/doc/install
- **Similar Tools:** OpenAI Moderation API, prompt-injection-detector
- **Research:** OWASP Top 10 for LLM Applications

## Questions to Resolve

1. Should we block or warn for medium-severity threats?
2. Do we scan package metadata (description, tags) or just content?
3. How do we handle packages with intentional injection examples (educational)?
4. Should security scanning be opt-out for verified authors?
5. Do we need a manual review queue for borderline cases?

## Next Steps

1. **Spike:** Test vibe-condom with 100 random PRPM packages
2. **Measure:** Document false positive/negative rates
3. **Design:** Finalize integration architecture (CLI vs library)
4. **RFC:** Share proposal with team for feedback
5. **Implement:** Start with Phase 1 proof of concept

---

**Last Updated:** 2025-11-16
**Owner:** TBD
**Reviewers:** Security team, Platform team
