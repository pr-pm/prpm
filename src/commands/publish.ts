/**
 * Publish command - Publish packages to a registry
 */

import { Command } from 'commander';
import { promises as fs } from 'fs';
import { readConfig } from '../core/config';
import { validatePackage } from '../core/validator';
import { PackageType } from '../types';
import path from 'path';

interface PublishOptions {
  registry?: string;
  name?: string;
  version?: string;
  description?: string;
  tags?: string;
  tools?: string;
  roles?: string;
  author?: string;
  license?: string;
  repository?: string;
  skipValidation?: boolean;
}

interface PublishPayload {
  name: string;
  version: string;
  content: string;
  description?: string;
  tags?: string[];
  tools?: string[];
  roles?: string[];
  author?: string;
  license?: string;
  repository?: string;
}

const DEFAULT_REGISTRY = 'https://registry.prmp.dev';

export function createPublishCommand(): Command {
  const command = new Command('publish');

  command
    .description('Publish a package to a registry')
    .argument('<path>', 'Path to package file to publish')
    .option('--registry <url>', 'Registry URL', DEFAULT_REGISTRY)
    .option('--name <name>', 'Package name (defaults to filename)')
    .option('--version <version>', 'Version (semver)', '1.0.0')
    .option('--description <desc>', 'Package description')
    .option('--tags <tags>', 'Comma-separated tags (e.g., "react,typescript,testing")')
    .option('--tools <tools>', 'Comma-separated compatible tools (e.g., "cursor,claude")')
    .option('--roles <roles>', 'Comma-separated roles (e.g., "code-reviewer,tester")')
    .option('--author <author>', 'Author name or email')
    .option('--license <license>', 'License', 'MIT')
    .option('--repository <url>', 'Repository URL (GitHub, GitLab, etc.)')
    .option('--skip-validation', 'Skip quality validation (not recommended)')
    .action(publishPackage);

  return command;
}

async function publishPackage(filePath: string, options: PublishOptions): Promise<void> {
  try {
    console.log(`\n📦 Publishing ${filePath}...\n`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    // Read package content
    const content = await fs.readFile(filePath, 'utf-8');

    // Determine package type from path
    const packageType = detectPackageType(filePath);

    // Validate package quality
    if (!options.skipValidation) {
      console.log('🔍 Validating package quality...');
      const validation = await validatePackage(filePath, packageType);

      console.log(`   Quality Score: ${validation.score}/100`);

      if (validation.score < 50) {
        console.error('\n❌ Package quality too low (score < 50)');
        console.error('   Run: prmp lint ' + filePath);
        console.error('   Or use --skip-validation to publish anyway (not recommended)\n');
        process.exit(1);
      }

      if (validation.score < 70) {
        console.log('   ⚠️  Warning: Score < 70. Consider improving quality before publishing.');
      } else {
        console.log('   ✅ Quality check passed!\n');
      }
    }

    // Get API key
    const apiKey = await getAPIKey();

    if (!apiKey) {
      console.error('❌ API key not found.');
      console.error('   Set environment variable: export PRMP_API_KEY=your_key_here');
      console.error('   Or add to config: prmp config set apiKey your_key_here\n');
      process.exit(1);
    }

    // Prepare payload
    const packageName = options.name || path.basename(filePath, path.extname(filePath));

    const payload: PublishPayload = {
      name: packageName,
      version: options.version || '1.0.0',
      content,
      description: options.description,
      tags: options.tags?.split(',').map((t) => t.trim()),
      tools: options.tools?.split(',').map((t) => t.trim()) || [packageType],
      roles: options.roles?.split(',').map((r) => r.trim()),
      author: options.author,
      license: options.license || 'MIT',
      repository: options.repository,
    };

    console.log('📤 Publishing to registry...');
    console.log(`   Registry: ${options.registry}`);
    console.log(`   Package:  ${payload.name}@${payload.version}`);

    // Publish to registry
    const result = await publishToRegistry(
      options.registry || DEFAULT_REGISTRY,
      apiKey,
      payload
    );

    console.log('\n✅ Package published successfully!\n');
    console.log(`📦 ${result.package.name}@${result.package.version}`);
    if (result.url) {
      console.log(`🔗 ${result.url}`);
    }
    console.log('');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Publish failed: ${error.message}\n`);
    } else {
      console.error('\n❌ Publish failed with unknown error\n');
    }
    process.exit(1);
  }
}

/**
 * Detect package type from file path
 */
function detectPackageType(filePath: string): PackageType {
  if (filePath.includes('.cursor/rules')) return 'cursor';
  if (filePath.includes('.claude/agents')) return 'claude';
  if (filePath.includes('.windsurf/rules')) return 'windsurf';
  if (filePath.includes('.continue/prompts')) return 'continue';
  if (filePath.includes('.aider')) return 'aider';
  if (filePath.includes('.github/copilot-instructions')) return 'copilot';
  return 'cursor'; // default
}

/**
 * Get API key from environment or config
 */
async function getAPIKey(): Promise<string | undefined> {
  // Check environment variable first
  if (process.env.PRMP_API_KEY) {
    return process.env.PRMP_API_KEY;
  }

  // Check config file
  try {
    const config = await readConfig();
    return config.apiKey;
  } catch {
    return undefined;
  }
}

/**
 * Publish package to registry
 */
async function publishToRegistry(
  registryUrl: string,
  apiKey: string,
  payload: PublishPayload
): Promise<any> {
  // For now, this is a placeholder. In production, this would use fetch/axios
  // to POST to the registry API

  // Remove trailing slash from registry URL
  const baseUrl = registryUrl.replace(/\/$/, '');

  // In a real implementation:
  // const response = await fetch(`${baseUrl}/packages`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${apiKey}`,
  //   },
  //   body: JSON.stringify(payload),
  // });
  //
  // if (!response.ok) {
  //   const error = await response.json();
  //   throw new Error(error.error || 'Publish failed');
  // }
  //
  // return await response.json();

  // Placeholder response for now
  console.log('   ⚠️  Note: Registry server not yet deployed. This is a dry run.');

  return {
    package: {
      id: 'mock-id',
      name: payload.name,
      version: payload.version,
    },
    url: `${baseUrl}/packages/${payload.name}/${payload.version}`,
  };
}
