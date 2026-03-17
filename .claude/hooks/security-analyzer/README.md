# Security Analyzer Hook

An LLM-powered security analysis hook that uses Claude's reasoning capabilities to detect vulnerabilities in code being written.

## How It Works

Unlike command-based hooks that use regex patterns, this hook uses a **prompt hook** (`type: "prompt"`) that leverages Claude's understanding of code to detect:

- Hardcoded secrets and credentials
- SQL injection vulnerabilities
- Command injection risks
- Path traversal attacks
- Insecure deserialization
- XSS vulnerabilities

## Configuration

This hook triggers on `PreToolUse` for `Write` and `Edit` operations.

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "prompt",
        "prompt": "Analyze the code for security vulnerabilities...",
        "schema": { ... }
      }]
    }]
  }
}
```

## Schema Response

The hook returns structured output:

```json
{
  "decision": "allow" | "block",
  "issues": [
    {
      "type": "hardcoded-secret",
      "severity": "critical",
      "description": "AWS access key found on line 15",
      "line": 15
    }
  ],
  "summary": "Found 1 critical security issue"
}
```

## Trade-offs

**Advantages:**
- Understands code context (not just patterns)
- Can detect logic-based vulnerabilities
- Fewer false positives than regex
- Can explain why something is dangerous

**Disadvantages:**
- Slower (2-10 seconds per check)
- Uses additional tokens
- Requires LLM availability

## When to Use

Use this hook for:
- Security-critical codebases
- Code reviews before commit
- Learning about security issues

For fast, pattern-based checks, use the `sensitive-data-scanner` hook instead.

## Combining with Command Hooks

For best results, use both:

1. **sensitive-data-scanner** (command hook) - Fast pattern matching for known secrets
2. **security-analyzer** (prompt hook) - Deep analysis for complex vulnerabilities

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "node .claude/hooks/sensitive-data-scanner/dist/hook.js"
        },
        {
          "type": "prompt",
          "prompt": "Analyze for security vulnerabilities..."
        }
      ]
    }]
  }
}
```
