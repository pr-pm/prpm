# Publishing Guide for PRPM Packages

This document describes the publishing process for PRPM packages and the order in which they must be published.

## Package Dependencies

The PRPM monorepo contains the following packages with dependencies:

```
@prpm/types (no dependencies)
    ↓
@prpm/registry-client (depends on @prpm/types)
    ↓
prpm (CLI - depends on @prpm/types and @prpm/registry-client)
```

## Publishing Order

**IMPORTANT: Packages must be published in dependency order:**

1. **@prpm/types** - Must be published first
2. **@prpm/registry-client** - Depends on @prpm/types
3. **prpm** (CLI) - Depends on both @prpm/types and @prpm/registry-client

## Pre-Publishing Checklist

Before publishing any package:

1. ✅ All tests pass: `npm run test:cli`
2. ✅ All builds succeed: `npm run build`
3. ✅ No TypeScript errors: `npm run typecheck`
4. ✅ Git working directory is clean
5. ✅ You are on the correct branch (usually `main`)

## Manual Publishing

### 1. Publish @prpm/types

```bash
cd packages/types
npm version patch  # or minor, or major
npm run build
npm publish
cd ../..
git add packages/types/package.json
git commit -m "chore: publish @prpm/types v<version>"
git push
```

### 2. Publish @prpm/registry-client

```bash
# Update dependency version in package.json if @prpm/types was updated
cd packages/registry-client
# Edit package.json to update @prpm/types version if needed
npm install  # Update package-lock.json
npm version patch  # or minor, or major
npm run build
npm test
npm publish
cd ../..
git add packages/registry-client/package.json packages/registry-client/package-lock.json
git commit -m "chore: publish @prpm/registry-client v<version>"
git push
```

### 3. Publish prpm (CLI)

```bash
# Update dependency versions in package.json if needed
cd packages/cli
# Edit package.json to update @prpm/types and @prpm/registry-client versions if needed
npm install  # Update package-lock.json
npm version patch  # or minor, or major
npm run build
npm test
npm publish
cd ../..
git add packages/cli/package.json packages/cli/package-lock.json
git commit -m "chore: publish prpm v<version>"
git push
```

## Automated Publishing (GitHub Actions)

You can use the GitHub Actions workflow to publish packages:

1. Go to Actions tab in GitHub
2. Select "Publish Packages" workflow
3. Click "Run workflow"
4. Select the package to publish and version bump type
5. The workflow will:
   - Build all packages in correct order
   - Run tests
   - Publish to npm
   - Create version commits

**Note:** You must have `NPM_TOKEN` secret configured in GitHub repository settings.

## Build Order for Development

When building packages during development, always build in dependency order:

```bash
# Build all packages in correct order
npm run build --workspace=@prpm/types
npm run build --workspace=@prpm/registry-client
npm run build --workspace=prpm
npm run build --workspace=@prpm/registry
npm run build --workspace=@prpm/webapp

# Or use the convenience script
npm run build  # Builds all workspaces
```

## Verifying Package Contents

Before publishing, verify what will be included in the package:

```bash
cd packages/types
npm pack --dry-run

cd ../registry-client
npm pack --dry-run

cd ../cli
npm pack --dry-run
```

## Package Visibility

- **@prpm/types**: Public (scoped package with `publishConfig.access: "public"`)
- **@prpm/registry-client**: Public (scoped package with `publishConfig.access: "public"`)
- **prpm**: Public (unscoped package)
- **@prpm/registry**: Private (not published to npm)
- **@prpm/webapp**: Private (not published to npm)

## Version Management

Follow semantic versioning (semver):

- **Patch** (0.0.X): Bug fixes, non-breaking changes
- **Minor** (0.X.0): New features, non-breaking changes
- **Major** (X.0.0): Breaking changes

## Testing Published Packages

After publishing, test installation in a clean directory:

```bash
mkdir test-install
cd test-install
npm init -y
npm install prpm
npx prpm --version
npx prpm search react
```

## Troubleshooting

### "Package not found" after publishing

Wait a few minutes for npm registry to propagate. The package may not be immediately available.

### "Version already exists"

You cannot republish the same version. Increment the version number and publish again.

### "No permission to publish"

Ensure you are logged in to npm with the correct account:

```bash
npm whoami
npm login
```

### Dependency version mismatch

If consumers report type errors, ensure:
1. All packages use the same version of @prpm/types
2. peerDependencies are correctly specified
3. Package-lock.json is up to date

## CI/CD Integration

The GitHub Actions workflow automatically:

1. Builds packages in dependency order
2. Runs all tests
3. Performs type checking
4. Verifies package contents with `npm pack --dry-run`

On the `main` branch, all packages are built and tested on every push.
