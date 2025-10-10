#!/usr/bin/env node

/**
 * Prompt Package Manager CLI entry point
 */

import { Command } from 'commander';
import { createAddCommand } from './commands/add';
import { createListCommand } from './commands/list';
import { createRemoveCommand } from './commands/remove';
import { createIndexCommand } from './commands/index';

const program = new Command();

program
  .name('prmp')
  .description('Prompt Package Manager - Install and manage prompt-based files')
  .version('0.1.0');

// Add commands
program.addCommand(createAddCommand());
program.addCommand(createListCommand());
program.addCommand(createRemoveCommand());
program.addCommand(createIndexCommand());

// Parse command line arguments
program.parse();
