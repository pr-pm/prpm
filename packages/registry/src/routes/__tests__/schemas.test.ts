import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { schemaRoutes } from '../schemas.js';

describe('Schema Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();
    await server.register(schemaRoutes);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /', () => {
    it('should list all available schemas', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('schemas');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('formats');
      expect(Array.isArray(body.schemas)).toBe(true);
      expect(Array.isArray(body.formats)).toBe(true);
      expect(body.total).toBeGreaterThan(0);
    });

    it('should include schema metadata (description and title)', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      const body = JSON.parse(response.body);
      const firstSchema = body.schemas[0];

      expect(firstSchema).toHaveProperty('name');
      expect(firstSchema).toHaveProperty('url');
      expect(firstSchema).toHaveProperty('format');
      expect(firstSchema).toHaveProperty('subtype');
      expect(firstSchema).toHaveProperty('description');
      expect(firstSchema).toHaveProperty('title');
    });

    it('should filter schemas by format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/?format=claude'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.schemas.length).toBeGreaterThan(0);
      expect(body.schemas.every((s: any) => s.format === 'claude')).toBe(true);
    });

    it('should return grouped schemas when grouped=true', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/?grouped=true'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('grouped');
      expect(typeof body.grouped).toBe('object');
      expect(Object.keys(body.grouped).length).toBeGreaterThan(0);

      // Check structure of grouped data
      const firstFormat = Object.keys(body.grouped)[0];
      const formatData = body.grouped[firstFormat];

      expect(formatData).toHaveProperty('format');
      expect(formatData).toHaveProperty('base');
      expect(formatData).toHaveProperty('subtypes');
      expect(Array.isArray(formatData.subtypes)).toBe(true);
    });

    it('should group claude schemas correctly', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/?grouped=true'
      });

      const body = JSON.parse(response.body);
      const claudeGroup = body.grouped.claude;

      expect(claudeGroup).toBeDefined();
      expect(claudeGroup.format).toBe('claude');
      expect(claudeGroup.base).toBeDefined();
      expect(claudeGroup.base.name).toBe('claude.schema.json');
      expect(claudeGroup.subtypes.length).toBeGreaterThan(0);

      // Check that subtypes include agent, skill, etc.
      const subtypeNames = claudeGroup.subtypes.map((s: any) => s.subtype);
      expect(subtypeNames).toContain('agent');
      expect(subtypeNames).toContain('skill');
    });

    it('should include base schemas without subtypes', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      const body = JSON.parse(response.body);
      const baseSchemas = body.schemas.filter((s: any) => s.subtype === null);

      expect(baseSchemas.length).toBeGreaterThan(0);

      // Check for known base schemas
      const schemaNames = baseSchemas.map((s: any) => s.name);
      expect(schemaNames).toContain('cursor.schema.json');
      expect(schemaNames).toContain('claude.schema.json');
      expect(schemaNames).toContain('droid.schema.json');
      expect(schemaNames).toContain('opencode.schema.json');
    });

    it('should include subtype schemas with correct format and subtype', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      const body = JSON.parse(response.body);
      const subtypeSchemas = body.schemas.filter((s: any) => s.subtype !== null);

      expect(subtypeSchemas.length).toBeGreaterThan(0);

      // Check Claude subtypes
      const claudeAgent = subtypeSchemas.find((s: any) => s.name === 'claude-agent.schema.json');
      expect(claudeAgent).toBeDefined();
      expect(claudeAgent.format).toBe('claude');
      expect(claudeAgent.subtype).toBe('agent');
      expect(claudeAgent.url).toContain('/api/v1/schemas/claude/agent.json');

      // Check Droid subtypes with multi-word subtype
      const droidSlashCommand = subtypeSchemas.find((s: any) => s.name === 'droid-slash-command.schema.json');
      expect(droidSlashCommand).toBeDefined();
      expect(droidSlashCommand.format).toBe('droid');
      expect(droidSlashCommand.subtype).toBe('slash-command');
      expect(droidSlashCommand.url).toContain('/api/v1/schemas/droid/slash-command.json');

      // Check OpenCode subtype
      const opencodeSlashCommand = subtypeSchemas.find((s: any) => s.name === 'opencode-slash-command.schema.json');
      expect(opencodeSlashCommand).toBeDefined();
      expect(opencodeSlashCommand.format).toBe('opencode');
      expect(opencodeSlashCommand.subtype).toBe('slash-command');
      expect(opencodeSlashCommand.url).toContain('/api/v1/schemas/opencode/slash-command.json');
    });

    it('should use new URL structure for base and subtype schemas', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      const body = JSON.parse(response.body);

      // Check base schema URL format
      const cursorBase = body.schemas.find((s: any) => s.name === 'cursor.schema.json');
      expect(cursorBase.url).toContain('/api/v1/schemas/cursor.json');

      // Check subtype schema URL format
      const claudeAgent = body.schemas.find((s: any) => s.name === 'claude-agent.schema.json');
      expect(claudeAgent.url).toContain('/api/v1/schemas/claude/agent.json');
    });
  });

  describe('GET /:format.json (base format schemas)', () => {
    it('should return a valid base format schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/cursor.json'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/schema+json');

      const schema = JSON.parse(response.body);
      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('title');
      expect(schema).toHaveProperty('description');
    });

    it('should return 404 for non-existent format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/nonexistent.json'
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('available');
    });

    it('should cache base format schemas', async () => {
      // First request
      const response1 = await server.inject({
        method: 'GET',
        url: '/claude.json'
      });

      expect(response1.statusCode).toBe(200);
      expect(response1.headers['cache-control']).toContain('max-age=3600');

      // Second request (should hit cache)
      const response2 = await server.inject({
        method: 'GET',
        url: '/claude.json'
      });

      expect(response2.statusCode).toBe(200);
      expect(response2.body).toBe(response1.body);
    });
  });

  describe('GET /:format/:subtype.json (subtype schemas)', () => {
    it('should return a valid subtype schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/claude/agent.json'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/schema+json');

      const schema = JSON.parse(response.body);
      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('title');
      expect(schema).toHaveProperty('description');
    });

    it('should handle multi-word subtype (slash-command)', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/droid/slash-command.json'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/schema+json');

      const schema = JSON.parse(response.body);
      expect(schema).toHaveProperty('$schema');
    });

    it('should return 404 for non-existent subtype', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/claude/nonexistent.json'
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Schema not found');
    });

    it('should cache subtype schemas', async () => {
      // First request
      const response1 = await server.inject({
        method: 'GET',
        url: '/opencode/slash-command.json'
      });

      expect(response1.statusCode).toBe(200);
      expect(response1.headers['cache-control']).toContain('max-age=3600');

      // Second request (should hit cache)
      const response2 = await server.inject({
        method: 'GET',
        url: '/opencode/slash-command.json'
      });

      expect(response2.statusCode).toBe(200);
      expect(response2.body).toBe(response1.body);
    });
  });
});
