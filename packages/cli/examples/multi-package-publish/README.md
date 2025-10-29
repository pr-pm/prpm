# Multi-Package Publishing Example

This example demonstrates how to publish multiple packages from a single `prpm.json` file.

## Structure

The `prpm.json` file contains a `packages` array, where each item is a complete package manifest. This allows you to:

1. Share common metadata (author, license, repository, tags) across all packages
2. Publish multiple related packages with a single command
3. Organize related packages in one place

## Features

- **Shared Defaults**: Top-level fields (author, license, repository, etc.) are inherited by all packages unless overridden
- **Individual Configuration**: Each package can override any top-level field if needed
- **Atomic Publishing**: All packages are validated before any are published

## Usage

```bash
cd packages/cli/examples/multi-package-publish
prpm publish --dry-run
```

This will validate and prepare to publish both:
- `@prpm-examples/package-one` (Cursor rules)
- `@prpm-examples/package-two` (Claude skill)
