# Task Completion Verifier Hook

A prompt hook that runs when Claude stops responding to verify all tasks were completed properly.

## How It Works

This hook triggers on the `Stop` event and uses LLM reasoning to verify:

- Tests were run and passed
- TypeScript types check
- No linting errors
- Original request was fully addressed
- Edge cases were considered

## Configuration

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "prompt",
        "prompt": "Before completing, verify...",
        "schema": { ... }
      }]
    }]
  }
}
```

## Schema Response

```json
{
  "verified": true,
  "checks": {
    "tests": "passed",
    "types": "passed",
    "linting": "passed",
    "task_complete": true
  },
  "issues": [],
  "summary": "All checks passed. Task completed successfully."
}
```

## Use Cases

- Ensuring code quality before finishing
- Catching forgotten test runs
- Reminding about type checking
- Verifying complete implementations

## Note

This is a non-blocking hook (Stop event cannot block). It provides information and reminders but won't prevent Claude from finishing.
