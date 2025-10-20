/**
 * Package schema validation tests
 */

import { describe, it, expect } from 'vitest';
import { PackageTypeSchema, SearchQuerySchema, PackageInfoSchema } from '../package';

describe('PackageTypeSchema', () => {
  it('should accept all valid package types', () => {
    const validTypes = [
      'cursor',
      'claude',
      'claude-skill',
      'claude-agent',
      'claude-slash-command',
      'continue',
      'windsurf',
      'generic',
      'mcp',
    ];

    validTypes.forEach(type => {
      const result = PackageTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(type);
      }
    });
  });

  it('should reject invalid package types', () => {
    const invalidTypes = [
      'invalid',
      'claude-agent-wrong',
      'slash-command',
      '',
      123,
      null,
      undefined,
    ];

    invalidTypes.forEach(type => {
      const result = PackageTypeSchema.safeParse(type);
      expect(result.success).toBe(false);
    });
  });

  it('should accept claude-agent type specifically', () => {
    const result = PackageTypeSchema.safeParse('claude-agent');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('claude-agent');
    }
  });

  it('should accept claude-slash-command type specifically', () => {
    const result = PackageTypeSchema.safeParse('claude-slash-command');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('claude-slash-command');
    }
  });
});

describe('SearchQuerySchema', () => {
  it('should accept valid search query with claude-agent type', () => {
    const query = {
      q: 'test',
      type: 'claude-agent',
      limit: 20,
      offset: 0,
    };

    const result = SearchQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('claude-agent');
    }
  });

  it('should accept valid search query with claude-slash-command type', () => {
    const query = {
      q: 'test',
      type: 'claude-slash-command',
      limit: 20,
      offset: 0,
    };

    const result = SearchQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('claude-slash-command');
    }
  });

  it('should accept search query without type filter', () => {
    const query = {
      q: 'test',
      limit: 10,
    };

    const result = SearchQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
  });

  it('should apply default values', () => {
    const query = {
      q: 'test',
    };

    const result = SearchQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('should reject invalid type in search query', () => {
    const query = {
      q: 'test',
      type: 'invalid-type',
    };

    const result = SearchQuerySchema.safeParse(query);
    expect(result.success).toBe(false);
  });
});

describe('PackageInfoSchema', () => {
  it('should accept valid package info with claude-agent type', () => {
    const packageInfo = {
      id: '@test/agent',
      description: 'Test agent',
      author_id: 'test-author',
      org_id: null,
      type: 'claude-agent',
      license: 'MIT',
      repository_url: 'https://github.com/test/agent',
      homepage_url: null,
      documentation_url: null,
      tags: ['agent', 'claude'],
      keywords: ['test', 'agent'],
      category: 'development',
      visibility: 'public',
      deprecated: false,
      deprecated_reason: null,
      verified: false,
      featured: false,
      total_downloads: 100,
      weekly_downloads: 10,
      monthly_downloads: 50,
      version_count: 1,
      quality_score: 75,
      rating_average: 4.5,
      rating_count: 10,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_published_at: '2024-01-01T00:00:00Z',
    };

    const result = PackageInfoSchema.safeParse(packageInfo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('claude-agent');
    }
  });

  it('should accept valid package info with claude-slash-command type', () => {
    const packageInfo = {
      id: '@test/command',
      description: 'Test slash command',
      author_id: 'test-author',
      org_id: null,
      type: 'claude-slash-command',
      license: 'MIT',
      repository_url: 'https://github.com/test/command',
      homepage_url: null,
      documentation_url: null,
      tags: ['slash-command', 'claude'],
      keywords: ['test', 'command'],
      category: 'utility',
      visibility: 'public',
      deprecated: false,
      deprecated_reason: null,
      verified: false,
      featured: false,
      total_downloads: 50,
      weekly_downloads: 5,
      monthly_downloads: 25,
      version_count: 1,
      quality_score: 80,
      rating_average: 4.0,
      rating_count: 5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_published_at: '2024-01-01T00:00:00Z',
    };

    const result = PackageInfoSchema.safeParse(packageInfo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('claude-slash-command');
    }
  });

  it('should accept package info with all valid types', () => {
    const types = [
      'cursor',
      'claude',
      'claude-skill',
      'claude-agent',
      'claude-slash-command',
      'continue',
      'windsurf',
      'generic',
      'mcp',
    ];

    types.forEach(type => {
      const packageInfo = {
        id: `@test/${type}`,
        description: `Test ${type}`,
        author_id: 'test-author',
        org_id: null,
        type,
        license: 'MIT',
        repository_url: 'https://github.com/test/package',
        homepage_url: null,
        documentation_url: null,
        tags: [type],
        keywords: ['test'],
        category: 'utility',
        visibility: 'public',
        deprecated: false,
        deprecated_reason: null,
        verified: false,
        featured: false,
        total_downloads: 0,
        weekly_downloads: 0,
        monthly_downloads: 0,
        version_count: 1,
        quality_score: 50,
        rating_average: null,
        rating_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_published_at: null,
      };

      const result = PackageInfoSchema.safeParse(packageInfo);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(type);
      }
    });
  });
});
