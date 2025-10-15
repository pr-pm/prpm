/**
 * Test command - test prompts with AI tools
 */

import { Command } from 'commander';
import { PackageType } from '../types';
import { isCLIAvailable, listAvailableTools } from '../core/cli-bridge';
import { runTests, loadTestScenarios, generateTestReport } from '../core/test-runner';
import { listAvailableRoles } from '../core/role-scenarios';
import { telemetry } from '../core/telemetry';
import { promises as fs } from 'fs';

/**
 * Handle test command
 */
export async function handleTest(
  promptPath: string,
  options: {
    with: string;
    scenarios?: string;
    role?: string;
    autoDetect?: boolean;
    verbose?: boolean;
    isolated?: boolean;
  }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const tool = options.with as PackageType;

    // Validate tool
    if (!isValidPackageType(tool)) {
      console.error(`❌ Invalid tool: ${tool}`);
      console.log('\nRun "prmp test list-tools" to see available tools');
      process.exit(1);
    }

    // Check if prompt file exists
    try {
      await fs.access(promptPath);
    } catch {
      console.error(`❌ Prompt file not found: ${promptPath}`);
      process.exit(1);
    }

    // Check if tool is available
    const available = await isCLIAvailable(tool);
    if (!available) {
      console.error(`❌ CLI tool "${tool}" is not installed or not in PATH`);
      console.log(`\nPlease install the ${tool} CLI tool first.`);
      process.exit(1);
    }

    console.log(`\n🚀 Testing ${promptPath} with ${tool}...\n`);

    // Load scenarios if provided
    let scenarios;
    if (options.scenarios) {
      scenarios = await loadTestScenarios(options.scenarios);
      console.log(`📋 Loaded ${scenarios.length} custom scenarios`);
    }

    // Run tests
    const result = await runTests(promptPath, {
      tool,
      scenarios,
      role: options.role,
      autoDetectRole: options.autoDetect,
      verbose: options.verbose,
      isolated: options.isolated,
    });

    // Generate and display report
    const report = generateTestReport(promptPath, tool, result);
    console.log('\n' + report);

    success = result.passed;

    if (!result.passed) {
      process.exit(1);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`❌ Test failed: ${error}`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'test',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        promptPath: promptPath.substring(0, 100),
        tool: options.with,
        hasScenarios: !!options.scenarios,
        verbose: options.verbose,
      },
    });
  }
}

/**
 * List available AI tools
 */
async function handleListTools(): Promise<void> {
  console.log('\n🔧 Available AI Tools:\n');

  const tools = await listAvailableTools();

  for (const { tool, available, command } of tools) {
    const status = available ? '✅ Available' : '❌ Not installed';
    console.log(`  ${tool.padEnd(15)} ${status.padEnd(20)} (${command})`);
  }

  console.log('\n💡 Install missing tools to enable testing with them.');
  console.log('   For installation instructions, visit the tool\'s website.\n');
}

/**
 * List available roles with scenario counts
 */
async function handleListRoles(): Promise<void> {
  console.log('\n🎭 Available Roles with Test Scenarios:\n');

  const roles = listAvailableRoles();

  roles.forEach(({ role, scenarioCount }) => {
    console.log(`  ${role.padEnd(25)} ${scenarioCount} scenarios`);
  });

  console.log('\n💡 Use --role <name> to test with role-specific scenarios.');
  console.log('   Or use --auto-detect to automatically detect the role.\n');
}

/**
 * Validate package type
 */
function isValidPackageType(type: string): type is PackageType {
  const validTypes: PackageType[] = [
    'cursor',
    'claude',
    'windsurf',
    'continue',
    'aider',
  ];
  return validTypes.includes(type as PackageType);
}

/**
 * Create the test command
 */
export function createTestCommand(): Command {
  const command = new Command('test');

  command
    .description('Test prompts with AI tools')
    .argument('<path>', 'Path to the prompt file to test')
    .requiredOption('--with <tool>', 'AI tool to test with (cursor, claude, windsurf, continue, aider)')
    .option('--scenarios <file>', 'Path to test scenarios JSON file')
    .option('--role <role>', 'Use role-specific test scenarios (code-reviewer, security-reviewer, etc.)')
    .option('--auto-detect', 'Automatically detect role from prompt filename/content')
    .option('--verbose', 'Show detailed output')
    .option('--isolated', 'Run tests in isolated contexts')
    .action(async (path: string, options) => {
      await handleTest(path, options);
    });

  // Add subcommand for listing available tools
  const listToolsCommand = new Command('list-tools');
  listToolsCommand
    .description('List available AI tools for testing')
    .action(async () => {
      await handleListTools();
    });

  command.addCommand(listToolsCommand);

  // Add subcommand for listing available roles
  const listRolesCommand = new Command('list-roles');
  listRolesCommand
    .description('List available roles with test scenarios')
    .action(async () => {
      await handleListRoles();
    });

  command.addCommand(listRolesCommand);

  return command;
}
