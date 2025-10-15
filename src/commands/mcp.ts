/**
 * MCP command - start Model Context Protocol server
 */

import { Command } from 'commander';
import { PromptMCPServer } from '../mcp/server';
import { telemetry } from '../core/telemetry';

/**
 * Handle MCP start command
 */
export async function handleMCPStart(options: { port?: string }): Promise<void> {
  const startTime = Date.now();

  try {
    const port = options.port ? parseInt(options.port, 10) : 3000;

    console.log('🌐 Starting MCP Server...\n');
    console.log('Model Context Protocol (MCP) allows AI tools to discover');
    console.log('and use your prompts dynamically at runtime.\n');

    const server = new PromptMCPServer(port);
    await server.start();

    // Track telemetry
    await telemetry.track({
      command: 'mcp-start',
      success: true,
      duration: Date.now() - startTime,
      data: {
        port,
      },
    });

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n\n👋 Shutting down MCP server...');
      await server.stop();
      await telemetry.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await server.stop();
      await telemetry.shutdown();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);

    await telemetry.track({
      command: 'mcp-start',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    process.exit(1);
  }
}

/**
 * Show MCP usage examples
 */
function handleMCPInfo(): void {
  console.log('\n📖 MCP Server Information\n');
  console.log('The Model Context Protocol (MCP) server exposes your prompts');
  console.log('so AI tools can discover and use them at runtime.\n');

  console.log('🔗 Available Endpoints:\n');
  console.log('  POST /mcp                  JSON-RPC MCP endpoint');
  console.log('  GET  /health               Health check');
  console.log('  GET  /info                 Server information');
  console.log('  GET  /prompts              List all prompts');
  console.log('  GET  /prompts/:id          Get specific prompt');
  console.log('  GET  /search?q=<query>     Search prompts');
  console.log('  GET  /roles                List available roles\n');

  console.log('📝 MCP Methods:\n');
  console.log('  initialize                 Get server capabilities');
  console.log('  resources/list             List all prompt resources');
  console.log('  resources/read             Read a specific prompt');
  console.log('  prompts/list               List available prompts');
  console.log('  prompts/get                Get prompt with arguments');
  console.log('  tools/list                 List available tools');
  console.log('  tools/call                 Call a tool\n');

  console.log('🛠️  Available Tools:\n');
  console.log('  search_prompts             Search for prompts by keyword');
  console.log('  validate_prompt            Validate and score a prompt');
  console.log('  suggest_role               Suggest role for a task\n');

  console.log('💡 Usage Examples:\n');
  console.log('  # Start server on default port (3000)');
  console.log('  prmp mcp start\n');
  console.log('  # Start on custom port');
  console.log('  prmp mcp start --port 8080\n');
  console.log('  # Test with curl');
  console.log('  curl http://localhost:3000/prompts\n');
  console.log('  # Search prompts');
  console.log('  curl "http://localhost:3000/search?q=react"\n');
  console.log('  # MCP JSON-RPC request');
  console.log('  curl -X POST http://localhost:3000/mcp \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"jsonrpc":"2.0","id":1,"method":"prompts/list"}\'\n');
}

/**
 * Create the MCP command
 */
export function createMCPCommand(): Command {
  const command = new Command('mcp');

  command.description('Model Context Protocol server');

  // Start subcommand
  const startCommand = new Command('start');
  startCommand
    .description('Start the MCP server')
    .option('--port <port>', 'Port to run the server on (default: 3000)')
    .action(async (options) => {
      await handleMCPStart(options);
    });

  command.addCommand(startCommand);

  // Info subcommand
  const infoCommand = new Command('info');
  infoCommand
    .description('Show MCP server information and examples')
    .action(() => {
      handleMCPInfo();
    });

  command.addCommand(infoCommand);

  return command;
}
