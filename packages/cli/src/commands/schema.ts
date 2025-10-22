/**
 * Schema command - Export and display JSON schema
 */

import { Command } from 'commander';
import { getManifestSchema } from '../core/schema-validator';

/**
 * Handle the schema command
 */
export async function handleSchema(): Promise<void> {
  try {
    const schema = getManifestSchema();

    if (!schema) {
      console.error('❌ Schema not available');
      process.exit(1);
    }

    // Output the schema as pretty-printed JSON
    console.log(JSON.stringify(schema, null, 2));
  } catch (error) {
    console.error(`❌ Failed to export schema: ${error}`);
    process.exit(1);
  }
}

/**
 * Create the schema command
 */
export function createSchemaCommand(): Command {
  const command = new Command('schema');

  command
    .description('Display the PRPM manifest JSON schema')
    .action(handleSchema);

  return command;
}
