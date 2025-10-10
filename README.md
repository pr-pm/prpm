# Prompt Package Manager (PPM)

A CLI tool for managing prompt-based files like Cursor rules and Claude sub-agents.

## Installation

### NPM (Recommended)
```bash
npm install -g prmp
```

### Homebrew (macOS)
```bash
# Add the tap
brew tap khaliqgant/homebrew-prmp

# Install prmp
brew install prmp
```

### Direct Download
Download the latest binary from [GitHub Releases](https://github.com/khaliqgant/prompt-package-manager/releases).

## Usage

### Add a prompt package

```bash
# Add a Cursor rule
prmp add https://raw.githubusercontent.com/user/repo/main/cursor-rules.md --as cursor

# Add a Claude sub-agent
prmp add https://raw.githubusercontent.com/user/repo/main/agent.md --as claude
```

### List installed packages

```bash
prmp list
```

### Remove a package

```bash
prmp remove my-cursor-rules
```

### Index existing files

```bash
# Scan existing .cursor/rules/ and .claude/agents/ directories
# and register any unregistered files
prmp index
```

## How it works

1. **Download**: Fetches files from raw GitHub URLs
2. **Save**: Places files in the correct directory:
   - `.cursor/rules/` for Cursor rules
   - `.claude/agents/` for Claude sub-agents
3. **Track**: Records installations in `.promptpm.json`

## Example

```bash
# Add a Cursor rule
prmp add https://raw.githubusercontent.com/acme/rules/main/cursor-rules.md --as cursor

# List packages
prmp list

# Remove the package
prmp remove cursor-rules

# Index existing files (if you already have prompt files)
prmp index
```

## Project Structure

After adding packages, your project will look like:

```
my-project/
├── .cursor/rules/
│   └── cursor-rules.md
├── .claude/agents/
│   └── agent.md
└── .promptpm.json
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Build binaries for distribution
npm run build:binary

# Test the CLI
npm run dev add https://raw.githubusercontent.com/user/repo/main/example.md --as cursor
```

## Testing

The project includes comprehensive testing with:

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test command workflows and CLI interactions
- **Error Handling Tests**: Test edge cases and error scenarios
- **CLI Tests**: Test full command-line interface functionality

**Test Coverage**: 91%+ statement coverage across all modules

**Test Commands**:
- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ci` - Run tests for CI/CD environments
