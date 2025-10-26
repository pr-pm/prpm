# CLI Versioning Guide

The CLI version is dynamically read from `package.json` at runtime.

## Version Bump Workflow

### Local Development (Manual)

For local testing and development:

```bash
# Bump patch version (0.0.6 → 0.0.7)
npm run version:patch

# Bump minor version (0.0.6 → 0.1.0)
npm run version:minor

# Bump major version (0.0.6 → 1.0.0)
npm run version:major
```

These scripts will:
1. ✅ Update `package.json` version
2. ✅ Commit the change to git with message: `chore(cli): bump version to X.Y.Z`

### Production Publishing (GitHub Actions - Recommended)

For production releases, use the GitHub Actions workflow:

1. Go to **Actions** tab in GitHub
2. Select **"Publish Packages"** workflow
3. Click **"Run workflow"**
4. Configure:
   - **Version bump type**: patch, minor, or major
   - **Packages**: `cli` (or `all` for all packages)
   - **NPM tag**: `latest` (default) or `next`, `beta`, `alpha`
   - **Dry run**: Check to test without publishing

The workflow will:
1. ✅ Bump version in `package.json`
2. ✅ Build the CLI
3. ✅ Publish to NPM
4. ✅ Commit version changes
5. ✅ Create git tag
6. ✅ Create GitHub release

### Manual Publishing (Not Recommended)

Only use this if GitHub Actions is unavailable:

```bash
# 1. Bump version
npm run version:patch  # or minor/major

# 2. Build
npm run build

# 3. Publish to npm
npm publish

# 4. Tag and push
git tag v$(node -p "require('./package.json').version")
git push && git push --tags
```

## How it works

The CLI reads version from `package.json` at runtime:

```typescript
// src/index.ts
function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

program.version(getVersion());
```

## Checking Version

```bash
# After building
./dist/index.js --version

# If installed globally
prpm --version
```

## Manual Version Update

If you prefer to update manually:

1. Edit `package.json` and change the `version` field
2. Commit: `git commit -am "chore(cli): bump version to X.Y.Z"`
3. Follow the publishing workflow above
