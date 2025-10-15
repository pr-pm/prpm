#!/usr/bin/env node

/**
 * Prompt Package Manager CLI entry point
 */

import { Command } from 'commander';
import { createAddCommand } from './commands/add';
import { createListCommand } from './commands/list';
import { createRemoveCommand } from './commands/remove';
import { createIndexCommand } from './commands/index';
import { createTelemetryCommand } from './commands/telemetry';
import { createPopularCommand } from './commands/popular';
import { createCreateCommand } from './commands/create';
import { createLintCommand } from './commands/lint';
import { createConvertCommand } from './commands/convert';
import { createTestCommand } from './commands/test';
import { createMCPCommand } from './commands/mcp';
import { createPublishCommand } from './commands/publish';
import { createRegistryCommand } from './commands/registry';
import { createSearchCommand } from './commands/search';
import { createInstallCommand } from './commands/install';
import { telemetry } from './core/telemetry';

const program = new Command();

program
  .name('prmp')
  .description('Universal AI Coding Prompt Manager - Federated marketplace with intelligent role-based testing for AI coding prompts')
  .version('2.3.0');

// Add commands
program.addCommand(createAddCommand());
program.addCommand(createInstallCommand());
program.addCommand(createSearchCommand());
program.addCommand(createCreateCommand());
program.addCommand(createTestCommand());
program.addCommand(createLintCommand());
program.addCommand(createConvertCommand());
program.addCommand(createMCPCommand());
program.addCommand(createPublishCommand());
program.addCommand(createRegistryCommand());
program.addCommand(createListCommand());
program.addCommand(createRemoveCommand());
program.addCommand(createIndexCommand());
program.addCommand(createTelemetryCommand());

// Parse command line arguments
program.parse();

// Cleanup telemetry on exit
process.on('exit', () => {
  telemetry.shutdown().catch(() => {
    // Silently fail
  });
});

process.on('SIGINT', () => {
  telemetry.shutdown().catch(() => {
    // Silently fail
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  telemetry.shutdown().catch(() => {
    // Silently fail
  });
  process.exit(0);
});
