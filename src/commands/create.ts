/**
 * Create command - scaffold new packages from templates
 */

import { Command } from 'commander';
import { getTemplatesForType, getTemplate, generateFromTemplate } from '../core/templates';
import { getDestinationDir, saveFile, getFileExtension, getSpecialFilename } from '../core/filesystem';
import { telemetry } from '../core/telemetry';
import { PackageType } from '../types';
import { getRole, listRoles, getRolesByCategory } from '../core/roles';

/**
 * Handle create command
 */
export async function handleCreate(
  name: string,
  options: {
    type: string;
    template?: string;
    description?: string;
    author?: string;
    list?: boolean;
    role?: string;
    listRoles?: boolean;
  }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const type = options.type as PackageType;

    // Validate type
    if (!isValidPackageType(type)) {
      console.error(
        '❌ Invalid type. Must be one of: cursor, claude, windsurf, continue, aider, copilot, copilot-instructions, copilot-path'
      );
      process.exit(1);
    }

    // List available templates if requested
    if (options.list) {
      listTemplates(type);
      success = true;
      return;
    }

    // List available roles if requested
    if (options.listRoles) {
      listAvailableRoles();
      success = true;
      return;
    }

    // Validate role if provided
    if (options.role) {
      const role = getRole(options.role);
      if (!role) {
        console.error(`❌ Role "${options.role}" not found`);
        console.log('\nRun "prmp create --list-roles" to see available roles');
        process.exit(1);
      }
    }

    // Get template
    const templateName = options.template || 'basic';
    const template = getTemplate(type, templateName);

    if (!template) {
      console.error(`❌ Template "${templateName}" not found for type "${type}"`);
      console.log('\nAvailable templates:');
      listTemplates(type);
      process.exit(1);
    }

    console.log(`📝 Creating ${type} package: ${name}`);
    console.log(`   Template: ${template.name}`);

    // Generate content
    const content = generateFromTemplate(template, {
      name,
      description: options.description || `${name} package`,
      author: options.author || 'Unknown',
      role: options.role,
    });

    // Determine filename and destination
    const specialFilename = getSpecialFilename(type);
    const extension = getFileExtension(type);
    const filename = specialFilename || `${name}${extension}`;
    const destDir = getDestinationDir(type);
    const destPath = `${destDir}/${filename}`;

    // Save the file
    await saveFile(destPath, content);

    console.log(`✅ Successfully created package`);
    console.log(`   📁 Location: ${destPath}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Edit the file to customize it for your needs`);
    console.log(`   2. Run 'prmp lint ${destPath}' to validate`);
    console.log(`   3. Use the package with your AI coding tool`);

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`❌ Failed to create package: ${error}`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'create',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        name,
        type: options.type,
        template: options.template,
      },
    });
  }
}

/**
 * List available templates for a type
 */
function listTemplates(type: PackageType): void {
  const templates = getTemplatesForType(type);
  console.log(`\nAvailable templates for ${type}:`);
  templates.forEach((template) => {
    const roleInfo = template.role ? ` [Role: ${template.role}]` : '';
    console.log(`  - ${template.name}: ${template.description}${roleInfo}`);
  });
}

/**
 * List available roles
 */
function listAvailableRoles(): void {
  console.log('\n🎭 Available Roles:\n');

  const rolesByCategory = getRolesByCategory();
  rolesByCategory.forEach((category) => {
    console.log(`\n${category.category}:`);
    category.roles.forEach((role) => {
      console.log(`  - ${role.id.padEnd(25)} ${role.name}`);
      console.log(`    ${role.description}`);
    });
  });

  console.log('\n💡 Use --role <role-id> with create command');
  console.log('   Example: prmp create my-reviewer --type claude --role code-reviewer\n');
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
    'copilot',
    'copilot-instructions',
    'copilot-path',
  ];
  return validTypes.includes(type as PackageType);
}

/**
 * Create the create command
 */
export function createCreateCommand(): Command {
  const command = new Command('create');

  command
    .description('Create a new package from a template')
    .argument('<name>', 'Package name')
    .requiredOption('--type <type>', 'Package type (cursor, claude, etc.)')
    .option('--template <template>', 'Template to use (default: basic)')
    .option('--role <role>', 'Specialized role (code-reviewer, planner, debugger, etc.)')
    .option('--description <description>', 'Package description')
    .option('--author <author>', 'Package author')
    .option('--list', 'List available templates for the type')
    .option('--list-roles', 'List all available roles')
    .action(async (name: string, options) => {
      await handleCreate(name, options);
    });

  return command;
}
