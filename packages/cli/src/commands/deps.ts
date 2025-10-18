/**
 * Deps command - Show dependency tree for a package
 */

import { Command } from 'commander';
import { getRegistryClient } from '@prmp/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';

/**
 * Display dependency tree
 */
export async function handleDeps(packageSpec: string): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    // Parse package spec
    const [packageId, version] = packageSpec.split('@');

    console.log(`📦 Resolving dependencies for ${packageId}${version ? `@${version}` : ''}...\n`);

    const config = await getConfig();
    const client = getRegistryClient(config);

    // Resolve dependency tree
    const result = await client.resolveDependencies(packageId, version);

    if (Object.keys(result.resolved).length === 1) {
      console.log('✅ No dependencies\n');
      success = true;
      return;
    }

    // Display resolved versions
    console.log('📋 Resolved Dependencies:\n');
    for (const [pkgId, pkgVersion] of Object.entries(result.resolved)) {
      if (pkgId === packageId) continue; // Skip root package
      console.log(`   ${pkgId}@${pkgVersion}`);
    }

    console.log(`\n📊 Total: ${Object.keys(result.resolved).length - 1} dependencies\n`);

    // Display tree structure
    console.log('🌳 Dependency Tree:\n');
    printTree(result.tree, packageId, '', true);

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Failed to resolve dependencies: ${error}`);

    if (error.includes('Circular dependency')) {
      console.log(`\n💡 Tip: This package has a circular dependency which is not allowed.`);
    } else if (error.includes('not found')) {
      console.log(`\n💡 Tip: Check the package name and version are correct.`);
    }

    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'deps',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageId: packageSpec.split('@')[0],
      },
    });
  }
}

/**
 * Print dependency tree recursively
 */
function printTree(
  tree: any,
  packageId: string,
  prefix: string = '',
  isLast: boolean = true
): void {
  const node = tree[packageId];
  if (!node) return;

  const deps = node.dependencies || {};
  const depKeys = Object.keys(deps);

  console.log(`${prefix}${isLast ? '└─' : '├─'} ${packageId}@${node.version}`);

  depKeys.forEach((depId, index) => {
    const isLastDep = index === depKeys.length - 1;
    const newPrefix = prefix + (isLast ? '   ' : '│  ');
    printTree(tree, depId, newPrefix, isLastDep);
  });
}

/**
 * Create the deps command
 */
export function createDepsCommand(): Command {
  return new Command('deps')
    .description('Show dependency tree for a package')
    .argument('<package>', 'Package to analyze (e.g., react-rules or react-rules@1.2.0)')
    .action(handleDeps);
}
