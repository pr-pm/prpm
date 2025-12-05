#!/usr/bin/env tsx
/**
 * Build script for compiling all Claude Code hooks to standalone JavaScript bundles
 *
 * Source: packages/hooks/<name>/hook.ts
 * Output: .claude/hooks/<name>/dist/hook.js
 */

import { build, BuildOptions } from 'esbuild';
import { readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Root directory is app/ which is 2 levels up from packages/hooks/scripts/
const ROOT_DIR = join(__dirname, '../../..');
const CLAUDE_HOOKS_DIR = join(ROOT_DIR, '.claude/hooks');
const PACKAGES_HOOKS_DIR = join(__dirname, '..');

interface HookInfo {
  name: string;
  srcPath: string;
  distPath: string;
}

/**
 * Find all hooks with TypeScript source files in packages/hooks/
 */
function findHooks(): HookInfo[] {
  const hooks: HookInfo[] = [];

  if (!existsSync(PACKAGES_HOOKS_DIR)) {
    console.error(`Hooks directory not found: ${PACKAGES_HOOKS_DIR}`);
    return hooks;
  }

  const entries = readdirSync(PACKAGES_HOOKS_DIR);

  for (const entry of entries) {
    const hookPath = join(PACKAGES_HOOKS_DIR, entry);

    // Skip non-directories, special directories, and non-hook folders
    if (
      !statSync(hookPath).isDirectory() ||
      entry === 'shared' ||
      entry === 'scripts' ||
      entry === 'node_modules'
    ) {
      continue;
    }

    const srcPath = join(hookPath, 'hook.ts');
    const distPath = join(CLAUDE_HOOKS_DIR, entry, 'dist/hook.js');

    if (existsSync(srcPath)) {
      hooks.push({
        name: entry,
        srcPath,
        distPath,
      });
    }
  }

  return hooks;
}

/**
 * Build a single hook
 */
async function buildHook(hook: HookInfo): Promise<void> {
  const buildOptions: BuildOptions = {
    entryPoints: [hook.srcPath],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: hook.distPath,
    format: 'cjs',
    minify: false, // Keep readable for debugging
    sourcemap: false,
    logLevel: 'error',
    banner: {
      js: '#!/usr/bin/env node',
    },
  };

  try {
    // Ensure dist directory exists
    const distDir = dirname(hook.distPath);
    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true });
    }

    await build(buildOptions);
    console.log(`✓ Built ${hook.name}`);

    // Make the output file executable
    const { chmodSync } = await import('fs');
    chmodSync(hook.distPath, 0o755);
  } catch (error) {
    console.error(`✗ Failed to build ${hook.name}:`, error);
    throw error;
  }
}

/**
 * Build all hooks
 */
async function buildAll(watch: boolean = false): Promise<void> {
  console.log('🔨 Building PRPM Claude Code hooks...\n');

  const hooks = findHooks();

  if (hooks.length === 0) {
    console.log('No hooks found to build.');
    return;
  }

  console.log(`Found ${hooks.length} hooks:\n`);

  // Build all hooks in parallel
  try {
    await Promise.all(hooks.map(hook => buildHook(hook)));
    console.log(`\n✓ Built ${hooks.length} hooks successfully`);
  } catch (error) {
    console.error('\n✗ Build failed');
    process.exit(1);
  }

  if (watch) {
    console.log('\n👀 Watching for changes...');
    // Note: Watch mode would require additional setup with chokidar
    // For now, we'll just note that watch is not implemented
    console.log('⚠️  Watch mode not yet implemented. Run `npm run build` after changes.');
  }
}

// Parse command line args
const args = process.argv.slice(2);
const watch = args.includes('--watch') || args.includes('-w');

// Run build
buildAll(watch).catch(error => {
  console.error('Build error:', error);
  process.exit(1);
});
