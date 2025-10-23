# Elastic Beanstalk Node.js Deployment Rules

## Official AWS Documentation
Reference: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/nodejs-platform-dependencies.html

## Dependency Installation Behavior

### When EB Runs `npm install`
Elastic Beanstalk will automatically run `npm install` when:
- A `package.json` file exists in the deployment
- NO `node_modules` directory is present

### When EB Skips `npm install`
EB will skip dependency installation if:
- A `node_modules` directory is already present in the deployment package
- Dependencies are pre-installed and bundled

**Command Used:**
- npm v6: `npm install --production`
- npm v7+: `npm install --omit=dev`

## Recommended Deployment Approaches

### Primary Method: Let EB Install Dependencies
```yaml
# GitHub Actions workflow
- name: Build application
  run: npm run build

- name: Create deployment package
  run: |
    zip -r app.zip \
      dist/ \
      package.json \
      package-lock.json \
      .ebextensions/
```

**Pros:**
- Smaller deployment packages
- Consistent with npm ecosystem
- Uses platform's npm version

**Cons:**
- Slower deployments (install on every deploy)
- Requires all packages to be in npm registry
- Can fail with network issues or registry problems

### Alternative Method: Bundle node_modules (AWS Recommended for Special Cases)

AWS officially recommends bundling `node_modules` to "bypass potential npm registry installation issues."

**When to use this approach:**
1. Packages not published to npm registry (monorepo workspace packages)
2. Private packages requiring authentication
3. Need for deployment speed/reliability
4. Network-restricted environments

```yaml
# GitHub Actions workflow
- name: Install production dependencies
  run: npm install --omit=dev

- name: Create deployment package
  run: |
    zip -r app.zip \
      dist/ \
      package.json \
      node_modules/ \
      .ebextensions/
```

**Pros:**
- Bypasses npm registry issues
- Faster deployments (no install phase)
- Works with monorepo workspace packages
- Reliable and predictable

**Cons:**
- Larger deployment packages (50-100MB typical)
- Must ensure platform-compatible binaries

## Monorepo / Workspace Package Strategy

For projects with workspace dependencies (e.g., `@prpm/types` that isn't published to npm):

### Problem
Running `npm ci --production` inside a monorepo workspace:
- Creates symlinks to workspace packages
- Doesn't copy actual package files
- Results in incomplete `node_modules` (~3MB instead of ~50MB)
- Causes "Cannot find package" errors during deployment

### Solution: Install in Clean Context

```yaml
- name: Create standalone package.json
  run: |
    mkdir -p /tmp/clean-install
    cd /tmp/clean-install

    # Copy package.json and replace workspace refs with file paths
    cp $GITHUB_WORKSPACE/packages/app/package.json .
    jq --arg workspace "$GITHUB_WORKSPACE" \
      '.dependencies["@workspace/pkg"] = "file:\($workspace)/packages/pkg"' \
      package.json > package.json.tmp
    mv package.json.tmp package.json

- name: Install dependencies (outside workspace)
  run: |
    cd /tmp/clean-install
    npm install --omit=dev --legacy-peer-deps

    # Verify critical packages
    test -d node_modules/pg || exit 1
    test -d node_modules/@workspace/pkg/dist || exit 1

- name: Copy to deployment location
  run: |
    rm -rf packages/app/node_modules
    cp -r /tmp/clean-install/node_modules packages/app/
```

**Key Points:**
1. Install outside the monorepo workspace context
2. Convert workspace dependencies to `file:` references
3. Verify all packages are actually installed (not symlinked)
4. Bundle the complete `node_modules` in deployment

## Environment Configuration

### Override Production Install Mode
Set environment variable in Beanstalk console:
```
NPM_USE_PRODUCTION=false
```

### Specify Node.js Version
In `package.json`:
```json
{
  "engines": {
    "node": "20.x"
  }
}
```

Note: Version range feature not available on Amazon Linux 2023

## Container Commands for Migrations

When bundling `node_modules`, migrations can run immediately since dependencies are present:

```yaml
# .ebextensions/migrations.config
container_commands:
  01_run_migrations:
    command: npm run migrate
    leader_only: true
```

Dependencies are available because:
- EB extracts deployment package to `/var/app/staging/`
- `node_modules/` is already present
- EB skips `npm install` step
- Migrations run with all dependencies available

## Troubleshooting

### Issue: "Cannot find package 'X'"
**Cause:** Package not installed or symlinked
**Solution:** Verify `node_modules/X` exists and isn't a symlink

### Issue: "npm install fails with workspace package not found"
**Cause:** Workspace package not in npm registry
**Solution:** Use bundled `node_modules` approach above

### Issue: Binary compatibility errors
**Cause:** Native modules compiled for wrong platform
**Solution:** Install dependencies in Linux environment or use Docker

### Issue: Deployment package too large (>500MB)
**Cause:** Dev dependencies or unnecessary files included
**Solution:**
- Use `--omit=dev` flag
- Exclude `.cache`, test files, etc. from zip
- Consider using `.ebignore` file

## Best Practices

1. **Always include package-lock.json** for reproducible builds
2. **Verify deployment package** before uploading to S3
3. **Test locally** with the bundled node_modules
4. **Monitor first deployment** closely when switching approaches
5. **Keep deployment packages** for potential rollback

## Verification Steps

Before deploying, verify:

```bash
# Check node_modules size (should be 50MB+ for typical apps)
du -sh node_modules

# Verify critical packages exist
ls -la node_modules/pg
ls -la node_modules/fastify
ls -la node_modules/@your-workspace/package

# Check for symlinks (should see real directories, not links)
file node_modules/@your-workspace/package

# Verify dist directories for workspace packages
test -d node_modules/@your-workspace/package/dist
```

## Example: PRPM Registry Deployment

This project uses the bundled `node_modules` approach because:
- `@prpm/types` is a workspace package, not published to npm
- Requires reliable deployments without registry dependencies
- Migrations need `pg` package immediately available

See `.github/workflows/deploy-registry.yml` for implementation.
