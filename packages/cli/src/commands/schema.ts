/**
 * Schema command - Export and display JSON schema
 */

import { Command } from 'commander';
import { getManifestSchema } from '../core/schema-validator';
import { CLIError } from '../core/errors';

/**
 * Handle the schema command
 */
export async function handleSchema(): Promise<void> {
  try {
    const schema = getManifestSchema();

    if (!schema) {
      throw new CLIError('❌ Schema not available', 1);
    }

    // Output the schema as pretty-printed JSON
    console.log(JSON.stringify(schema, null, 2));
  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`❌ Failed to export schema: ${error}`, 1);
  }
}

/**
 * Create the schema command
 */
export function createSchemaCommand(): Command {
  const command = new Command('schema');

  command
    .description('Display the PRPM manifest JSON schema')
    .action(async () => {
      await handleSchema();
      // Handler completes normally = success (exit 0)
    });

  return command;
}
