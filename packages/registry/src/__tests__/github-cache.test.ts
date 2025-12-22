/**
 * Integration tests for GitHub cache routes
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { githubCacheRoutes } from '../routes/github-cache.js';

// Mock Redis client
const mockRedis = {
  data: new Map<string, string | Buffer>(),
  lruScores: new Map<string, number>(),

  async get(key: string): Promise<string | null> {
    const value = this.data.get(key);
    return typeof value === 'string' ? value : null;
  },

  async getBuffer(key: string): Promise<Buffer | null> {
    const value = this.data.get(key);
    return Buffer.isBuffer(value) ? value : null;
  },

  async set(key: string, value: string | Buffer): Promise<'OK'> {
    this.data.set(key, value);
    return 'OK';
  },

  async setex(key: string, _ttl: number, value: string | Buffer): Promise<'OK'> {
    this.data.set(key, value);
    return 'OK';
  },

  async exists(key: string): Promise<number> {
    return this.data.has(key) ? 1 : 0;
  },

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.data.delete(key)) count++;
    }
    return count;
  },

  async zadd(key: string, score: number, member: string): Promise<number> {
    this.lruScores.set(member, score);
    return 1;
  },

  async zcard(_key: string): Promise<number> {
    return this.lruScores.size;
  },

  async zrange(_key: string, start: number, end: number): Promise<string[]> {
    const entries = Array.from(this.lruScores.entries())
      .sort((a, b) => a[1] - b[1]);
    return entries.slice(start, end + 1).map(e => e[0]);
  },

  async zrem(_key: string, ...members: string[]): Promise<number> {
    let count = 0;
    for (const member of members) {
      if (this.lruScores.delete(member)) count++;
    }
    return count;
  },

  clear() {
    this.data.clear();
    this.lruScores.clear();
  },
};

describe('GitHub Cache Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify({ logger: false });

    // Decorate with mock redis (cast to any to avoid TypeScript strict typing)
    server.decorate('redis', mockRedis as any);

    // Register routes
    await server.register(githubCacheRoutes, { prefix: '/github-cache' });

    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    mockRedis.clear();
  });

  describe('GET /:owner/:repo/:sha', () => {
    it('returns 404 when tarball not in cache', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/github-cache/anthropics/skills/abc123',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ error: 'Not found in cache' });
    });

    it('returns cached tarball with correct headers', async () => {
      const tarballData = Buffer.from('mock tarball data');
      await mockRedis.setex('github:cache:anthropics:skills:abc123', 3600, tarballData);

      const response = await server.inject({
        method: 'GET',
        url: '/github-cache/anthropics/skills/abc123',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/gzip');
      expect(response.headers['x-cache']).toBe('HIT');
      expect(response.rawPayload).toEqual(tarballData);
    });

    it('updates LRU tracking on cache hit', async () => {
      const tarballData = Buffer.from('mock tarball data');
      await mockRedis.setex('github:cache:anthropics:skills:abc123', 3600, tarballData);

      await server.inject({
        method: 'GET',
        url: '/github-cache/anthropics/skills/abc123',
      });

      expect(mockRedis.lruScores.has('github:cache:anthropics:skills:abc123')).toBe(true);
    });
  });

  describe('POST /:owner/:repo/:sha', () => {
    it('stores tarball in cache', async () => {
      const tarballData = Buffer.from('new tarball data');

      const response = await server.inject({
        method: 'POST',
        url: '/github-cache/anthropics/skills/def456',
        headers: { 'content-type': 'application/gzip' },
        payload: tarballData,
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.size).toBe(tarballData.length);
    });

    it('returns 400 for empty body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/github-cache/anthropics/skills/def456',
        headers: { 'content-type': 'application/gzip' },
        payload: Buffer.from(''),
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ error: 'Empty body' });
    });

    it('skips storing if already cached', async () => {
      const tarballData = Buffer.from('existing tarball');
      // Use the correct key format: github:cache:owner:repo:sha
      await mockRedis.setex('github:cache:anthropics:skills:abc123', 3600, tarballData);

      const response = await server.inject({
        method: 'POST',
        url: '/github-cache/anthropics/skills/abc123',
        headers: { 'content-type': 'application/gzip' },
        payload: Buffer.from('new data'),
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.cached).toBe(false); // Already existed
    });
  });

  describe('GET /stats', () => {
    it('returns cache statistics', async () => {
      // Add some items to cache
      await mockRedis.setex('github:cache:owner1:repo1:sha1', 3600, Buffer.from('data1'));
      await mockRedis.zadd('github:cache:lru', Date.now(), 'github:cache:owner1:repo1:sha1');
      await mockRedis.setex('github:cache:owner2:repo2:sha2', 3600, Buffer.from('data2'));
      await mockRedis.zadd('github:cache:lru', Date.now(), 'github:cache:owner2:repo2:sha2');

      const response = await server.inject({
        method: 'GET',
        url: '/github-cache/stats',
      });

      expect(response.statusCode).toBe(200);
      const stats = response.json();
      expect(stats.count).toBe(2);
      expect(stats.maxItems).toBe(500);
      expect(stats.ttlSeconds).toBe(60 * 60 * 24 * 30); // 30 days
    });
  });

  describe('POST /register', () => {
    it('registers a new GitHub package', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/github-cache/register',
        headers: { 'content-type': 'application/json' },
        payload: {
          owner: 'anthropics',
          repo: 'skills',
          commitSha: 'abc123',
          name: 'agent-builder',
          format: 'claude',
          subtype: 'agent',
          sourcePath: '.claude/agents/agent-builder.md',
          contentHash: 'sha256-abc123def456',
          content: '# Agent Builder\n\nTest content',
          license: 'MIT',
          description: 'A test agent',
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(result.duplicate).toBe(false);
      expect(result.packageId).toBe('anthropics/skills-agent-builder');
    });

    it('detects duplicate content by hash', async () => {
      const contentHash = 'sha256-duplicate123';

      // First registration
      await server.inject({
        method: 'POST',
        url: '/github-cache/register',
        headers: { 'content-type': 'application/json' },
        payload: {
          owner: 'owner1',
          repo: 'repo1',
          commitSha: 'sha1',
          name: 'package1',
          format: 'cursor',
          subtype: 'rule',
          contentHash,
          content: 'duplicate content',
        },
      });

      // Second registration with same content hash
      const response = await server.inject({
        method: 'POST',
        url: '/github-cache/register',
        headers: { 'content-type': 'application/json' },
        payload: {
          owner: 'owner2',
          repo: 'repo2',
          commitSha: 'sha2',
          name: 'package2',
          format: 'cursor',
          subtype: 'rule',
          contentHash,
          content: 'duplicate content',
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json();
      expect(result.success).toBe(true);
      expect(result.created).toBe(false);
      expect(result.duplicate).toBe(true);
      expect(result.packageId).toBe('owner1/repo1-package1'); // Returns original
    });

    it('stores package metadata correctly', async () => {
      await server.inject({
        method: 'POST',
        url: '/github-cache/register',
        headers: { 'content-type': 'application/json' },
        payload: {
          owner: 'testowner',
          repo: 'testrepo',
          commitSha: 'testsha',
          name: 'testpkg',
          format: 'claude',
          subtype: 'skill',
          sourcePath: '.claude/skills/test.md',
          contentHash: 'sha256-unique',
          content: 'Test content',
          license: 'Apache-2.0',
          description: 'Test package description',
        },
      });

      // Verify metadata was stored
      const metadataKey = 'github:package:testowner/testrepo-testpkg';
      const metadata = await mockRedis.get(metadataKey);
      expect(metadata).toBeTruthy();

      const parsed = JSON.parse(metadata!);
      expect(parsed.owner).toBe('testowner');
      expect(parsed.repo).toBe('testrepo');
      expect(parsed.license).toBe('Apache-2.0');
      expect(parsed.format).toBe('claude');
      expect(parsed.subtype).toBe('skill');
    });

    it('stores package content', async () => {
      const content = '# Test Skill\n\nThis is test content.';

      await server.inject({
        method: 'POST',
        url: '/github-cache/register',
        headers: { 'content-type': 'application/json' },
        payload: {
          owner: 'contenttest',
          repo: 'repo',
          commitSha: 'sha',
          name: 'pkg',
          format: 'cursor',
          subtype: 'rule',
          contentHash: 'sha256-content',
          content,
        },
      });

      // Verify content was stored
      const contentKey = 'github:content:contenttest/repo-pkg';
      const storedContent = await mockRedis.get(contentKey);
      expect(storedContent).toBe(content);
    });
  });
});
