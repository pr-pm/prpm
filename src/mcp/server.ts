/**
 * MCP Server - Expose prompts via Model Context Protocol
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { readConfig } from '../core/config';
import { Package, PackageType } from '../types';
import { getRole, listRoles, searchRoles } from '../core/roles';
import { validatePackage } from '../core/validator';
import {
  MCPServerInfo,
  MCPRequest,
  MCPResponse,
  MCPResource,
  MCPPrompt,
  MCPTool,
} from './types';
import { promises as fs } from 'fs';

export class PromptMCPServer {
  private app: Express;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[MCP] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // MCP standard endpoints
    this.app.post('/mcp', this.handleMCPRequest.bind(this));

    // Additional REST endpoints for convenience
    this.app.get('/health', this.handleHealth.bind(this));
    this.app.get('/info', this.handleInfo.bind(this));
    this.app.get('/prompts', this.handleListPrompts.bind(this));
    this.app.get('/prompts/:id', this.handleGetPrompt.bind(this));
    this.app.get('/search', this.handleSearch.bind(this));
    this.app.get('/roles', this.handleListRoles.bind(this));
  }

  /**
   * Handle MCP JSON-RPC requests
   */
  private async handleMCPRequest(req: Request, res: Response): Promise<void> {
    const mcpRequest: MCPRequest = req.body;

    if (mcpRequest.jsonrpc !== '2.0') {
      res.status(400).json({
        jsonrpc: '2.0',
        id: mcpRequest.id,
        error: {
          code: -32600,
          message: 'Invalid Request',
        },
      });
      return;
    }

    try {
      const result = await this.processMCPMethod(mcpRequest.method, mcpRequest.params || {});

      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        result,
      };

      res.json(response);
    } catch (error) {
      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      };
      res.status(500).json(response);
    }
  }

  /**
   * Process MCP method calls
   */
  private async processMCPMethod(method: string, params: Record<string, any>): Promise<any> {
    switch (method) {
      case 'initialize':
        return this.getServerInfo();

      case 'resources/list':
        return await this.listResources();

      case 'resources/read':
        return await this.readResource(params.uri);

      case 'prompts/list':
        return await this.listMCPPrompts();

      case 'prompts/get':
        return await this.getPrompt(params.name, params.arguments);

      case 'tools/list':
        return await this.listTools();

      case 'tools/call':
        return await this.callTool(params.name, params.arguments);

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  /**
   * Get server info
   */
  private getServerInfo(): MCPServerInfo {
    return {
      name: 'prmp',
      version: '2.0.0',
      protocolVersion: '2024-11-05',
      capabilities: {
        resources: { subscribe: false },
        prompts: { listChanged: true },
        tools: { listChanged: true },
      },
    };
  }

  /**
   * List all prompt resources
   */
  private async listResources(): Promise<{ resources: MCPResource[] }> {
    const config = await readConfig();
    const resources: MCPResource[] = config.sources.map((pkg: Package) => ({
      uri: `prompt://${pkg.id}`,
      name: pkg.id,
      description: pkg.metadata?.description,
      mimeType: 'text/markdown',
      metadata: {
        type: pkg.type,
        tools: pkg.tools,
        score: pkg.score,
        ...pkg.metadata,
      },
    }));

    return { resources };
  }

  /**
   * Read a specific resource
   */
  private async readResource(uri: string): Promise<{ contents: { uri: string; text: string; mimeType: string }[] }> {
    const id = uri.replace('prompt://', '');
    const config = await readConfig();
    const pkg = config.sources.find((p: Package) => p.id === id);

    if (!pkg) {
      throw new Error(`Resource not found: ${uri}`);
    }

    const content = await fs.readFile(pkg.dest, 'utf-8');

    return {
      contents: [{
        uri,
        text: content,
        mimeType: 'text/markdown',
      }],
    };
  }

  /**
   * List available MCP prompts
   */
  private async listMCPPrompts(): Promise<{ prompts: MCPPrompt[] }> {
    const config = await readConfig();
    const prompts: MCPPrompt[] = config.sources.map((pkg: Package) => ({
      name: pkg.id,
      description: pkg.metadata?.description || `${pkg.type} prompt`,
      arguments: [
        {
          name: 'context',
          description: 'Additional context for the prompt',
          required: false,
        },
      ],
    }));

    return { prompts };
  }

  /**
   * Get a specific prompt
   */
  private async getPrompt(name: string, args?: Record<string, any>): Promise<{ messages: Array<{ role: string; content: { type: string; text: string } }> }> {
    const config = await readConfig();
    const pkg = config.sources.find((p: Package) => p.id === name);

    if (!pkg) {
      throw new Error(`Prompt not found: ${name}`);
    }

    let content = await fs.readFile(pkg.dest, 'utf-8');

    // Add context if provided
    if (args?.context) {
      content += `\n\n[Context]\n${args.context}`;
    }

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: content,
          },
        },
      ],
    };
  }

  /**
   * List available tools
   */
  private async listTools(): Promise<{ tools: MCPTool[] }> {
    const tools: MCPTool[] = [
      {
        name: 'search_prompts',
        description: 'Search for prompts by keyword',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            type: {
              type: 'string',
              description: 'Filter by tool type (cursor, claude, etc.)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'validate_prompt',
        description: 'Validate and score a prompt',
        inputSchema: {
          type: 'object',
          properties: {
            promptId: {
              type: 'string',
              description: 'ID of the prompt to validate',
            },
          },
          required: ['promptId'],
        },
      },
      {
        name: 'suggest_role',
        description: 'Suggest appropriate role for a task',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'Description of the task',
            },
          },
          required: ['task'],
        },
      },
    ];

    return { tools };
  }

  /**
   * Call a tool
   */
  private async callTool(name: string, args: Record<string, any>): Promise<{ content: Array<{ type: string; text: string }> }> {
    let result: string;

    switch (name) {
      case 'search_prompts':
        result = await this.searchPrompts(args.query, args.type);
        break;

      case 'validate_prompt':
        result = await this.validatePromptById(args.promptId);
        break;

      case 'suggest_role':
        result = await this.suggestRole(args.task);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: result }],
    };
  }

  /**
   * Search prompts implementation
   */
  private async searchPrompts(query: string, type?: string): Promise<string> {
    const config = await readConfig();
    let results = config.sources;

    // Filter by type if specified
    if (type) {
      results = results.filter((pkg: Package) =>
        pkg.type === type || pkg.tools?.includes(type as PackageType)
      );
    }

    // Search in id and description
    const lowerQuery = query.toLowerCase();
    results = results.filter((pkg: Package) =>
      pkg.id.toLowerCase().includes(lowerQuery) ||
      pkg.metadata?.description?.toLowerCase().includes(lowerQuery)
    );

    return JSON.stringify(results, null, 2);
  }

  /**
   * Validate prompt by ID
   */
  private async validatePromptById(promptId: string): Promise<string> {
    const config = await readConfig();
    const pkg = config.sources.find((p: Package) => p.id === promptId);

    if (!pkg) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const result = await validatePackage(pkg.dest, pkg.type);
    return JSON.stringify(result, null, 2);
  }

  /**
   * Suggest role for a task
   */
  private async suggestRole(task: string): Promise<string> {
    const roles = searchRoles(task);

    if (roles.length === 0) {
      return 'No specific role found. Consider using a general-purpose template.';
    }

    const suggestions = roles.slice(0, 3).map((role, index) =>
      `${index + 1}. ${role.name} (${role.id})\n   ${role.description}\n   Focus: ${role.focus.join(', ')}`
    ).join('\n\n');

    return `Suggested roles for "${task}":\n\n${suggestions}`;
  }

  /**
   * Health check endpoint
   */
  private handleHealth(req: Request, res: Response): void {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  /**
   * Info endpoint
   */
  private handleInfo(req: Request, res: Response): void {
    res.json(this.getServerInfo());
  }

  /**
   * List prompts (REST endpoint)
   */
  private async handleListPrompts(req: Request, res: Response): Promise<void> {
    try {
      const config = await readConfig();
      res.json(config.sources);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list prompts' });
    }
  }

  /**
   * Get prompt (REST endpoint)
   */
  private async handleGetPrompt(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const config = await readConfig();
      const pkg = config.sources.find((p: Package) => p.id === id);

      if (!pkg) {
        res.status(404).json({ error: 'Prompt not found' });
        return;
      }

      const content = await fs.readFile(pkg.dest, 'utf-8');
      res.json({ ...pkg, content });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get prompt' });
    }
  }

  /**
   * Search prompts (REST endpoint)
   */
  private async handleSearch(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const type = req.query.type as string;

      if (!query) {
        res.status(400).json({ error: 'Query parameter required' });
        return;
      }

      const result = await this.searchPrompts(query, type);
      res.json(JSON.parse(result));
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  }

  /**
   * List roles (REST endpoint)
   */
  private handleListRoles(req: Request, res: Response): void {
    const roles = listRoles();
    res.json(roles);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`\n🚀 MCP Server running on port ${this.port}`);
        console.log(`\nMCP Endpoint:      http://localhost:${this.port}/mcp`);
        console.log(`Health Check:      http://localhost:${this.port}/health`);
        console.log(`Server Info:       http://localhost:${this.port}/info`);
        console.log(`List Prompts:      http://localhost:${this.port}/prompts`);
        console.log(`Search:            http://localhost:${this.port}/search?q=<query>`);
        console.log(`\n💡 AI tools can now discover and use your prompts via MCP!\n`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  public async stop(): Promise<void> {
    // Express doesn't have a built-in stop method, we would need to keep track of the server instance
    console.log('Server stopped');
  }
}
