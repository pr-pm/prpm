/**
 * Package routes tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { packageRoutes } from '../packages';
import { gzipSync } from 'zlib';

vi.mock('../../cache/redis.js', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDelete: vi.fn().mockResolvedValue(undefined),
  cacheDeletePattern: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../storage/s3.js', () => ({
  uploadPackage: vi.fn().mockImplementation(
    async (
      _server: FastifyInstance,
      packageName: string,
      version: string,
      tarball: Buffer,
    ) => ({
      url: `https://storage.example.test/${encodeURIComponent(packageName)}/${version}.tar.gz`,
      hash: `sha256-${version}`,
      size: tarball.length,
    }),
  ),
}));

describe('Package Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = Fastify();

    // Mock authenticate decorator
    server.decorate('authenticate', async (request: FastifyRequest) => {
      request.user = { user_id: 'test-user-id', username: 'test-user' };
    });

    // Create mock query function
    const mockQuery = async (sql: string, params?: unknown[]) => {
      // Mock package by name query (used by GET /packages/:packageName)
      if (sql.includes('SELECT * FROM packages WHERE name = $1')) {
        if (params?.[0] === 'test-package') {
          return {
            rows: [{
              id: 'test-package-uuid',
              name: 'test-package',
              description: 'A test package',
              author: 'test-author',
              downloads: 100,
              stars: 10,
              type: 'agent',
              category: 'development',
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date()
            }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: []
          };
        }
        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: []
        };
      }

      // Mock package by ID query (UUID)
      if (sql.includes('SELECT * FROM packages WHERE id = $1')) {
        if (params?.[0] === 'test-package-uuid') {
          return {
            rows: [{
              id: 'test-package-uuid',
              name: 'test-package',
              description: 'A test package',
              author: 'test-author',
              downloads: 100,
              stars: 10,
              type: 'agent',
              category: 'development',
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date()
            }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: []
          };
        }
        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: []
        };
      }

      // Mock package versions query
      if (sql.includes('SELECT * FROM package_versions')) {
        return {
          rows: [
            { version: '1.0.0', created_at: new Date() }
          ],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
      }

      // Mock COUNT query
      if (sql.includes('COUNT(*) as count FROM packages')) {
        return {
          rows: [{ count: '2' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
      }

      // Mock packages list query
      if (sql.includes('SELECT * FROM packages') && sql.includes('ORDER BY')) {
        return {
          rows: [
            {
              id: 'pkg1',
              name: 'Package 1',
              description: 'First package',
              author: 'author1',
              type: 'agent',
              downloads: 100,
              stars: 10,
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              id: 'pkg2',
              name: 'Package 2',
              description: 'Second package',
              author: 'author2',
              type: 'rule',
              downloads: 50,
              stars: 5,
              visibility: 'public',
              created_at: new Date(),
              updated_at: new Date()
            }
          ],
          command: 'SELECT',
          rowCount: 2,
          oid: 0,
          fields: []
        };
      }

      return {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: []
      };
    };

    // Mock cache functions (used by package routes)
    const mockCache = {
      get: async () => null,
      set: async () => {}
    };

    // Mock database with connect() method
    (server as any).decorate('pg', {
      query: mockQuery,
      connect: async () => ({
        query: mockQuery,
        release: () => {}
      })
    } as any);

    await server.register(packageRoutes, { prefix: '/api/v1/packages' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/v1/packages/:id', () => {
    it('should return package details', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/test-package'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('test-package-uuid');
      expect(body.name).toBe('test-package');
      expect(body.description).toBe('A test package');
    });

    it('should return 404 for non-existent package', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/does-not-exist'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/packages', () => {
    it('should list packages with pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages?limit=10&offset=0'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.total).toBeDefined();
    });

    it('should filter by type', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages?type=cursor'
      });

      expect(response.statusCode).toBe(200);
    });

    it('should filter by tags', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages?tags=typescript&tags=nodejs'
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/v1/packages - Author Scoping', () => {
    // These tests verify automatic author-scoping for package names
    // Skip these tests for now as they require full auth and S3 mocking
    it.skip('should auto-prefix unscoped package name with @username/', async () => {
      // Test that publishing "my-package" becomes "@testuser/my-package"
    });

    it.skip('should preserve existing @author/ scope', async () => {
      // Test that "@testuser/my-package" stays "@testuser/my-package"
    });

    it.skip('should use organization scope when organization is specified', async () => {
      // Test that with organization: "myorg", "my-package" becomes "@myorg/my-package"
    });

    it.skip('should prevent publishing to other authors scope', async () => {
      // Test that user "alice" cannot publish "@bob/package"
    });
  });

  describe('POST /api/v1/packages/:packageId/star', () => {
    let starredPackages: Set<string>;

    beforeEach(() => {
      starredPackages = new Set();

      // Update mock to handle star queries
      const originalMockQuery = (server as any).pg.query;
      (server as any).pg.query = async (sql: string, params?: unknown[]) => {
        // Package existence check
        if (sql.includes('SELECT id, visibility FROM packages WHERE id = $1')) {
          const packageId = params?.[0] as string;
          if (packageId === 'test-package-uuid') {
            return { rows: [{ id: packageId, visibility: 'public' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
          }
          return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] };
        }

        // Star insert
        if (sql.includes('INSERT INTO package_stars')) {
          const packageId = params?.[0] as string;
          starredPackages.add(packageId);
          return { rows: [], command: 'INSERT', rowCount: 1, oid: 0, fields: [] };
        }

        // Star delete
        if (sql.includes('DELETE FROM package_stars')) {
          const packageId = params?.[0] as string;
          starredPackages.delete(packageId);
          return { rows: [], command: 'DELETE', rowCount: 1, oid: 0, fields: [] };
        }

        // Get updated star count
        if (sql.includes('SELECT stars FROM packages WHERE id = $1')) {
          const packageId = params?.[0] as string;
          const count = packageId === 'test-package-uuid' ? (starredPackages.has(packageId) ? 11 : 10) : 0;
          return { rows: [{ stars: count }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        }

        return originalMockQuery(sql, params);
      };

    });

    it('should star a package', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/packages/test-package-uuid/star',
        headers: {
          authorization: 'Bearer test-token'
        },
        payload: {
          starred: true
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.starred).toBe(true);
      expect(body.stars).toBe(11);
    });

    it('should unstar a package', async () => {
      // First star it
      starredPackages.add('test-package-uuid');

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/packages/test-package-uuid/star',
        headers: {
          authorization: 'Bearer test-token'
        },
        payload: {
          starred: false
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.starred).toBe(false);
      expect(body.stars).toBe(10);
    });

    it('should return 404 when starring non-existent package', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/packages/non-existent-uuid/star',
        headers: {
          authorization: 'Bearer test-token'
        },
        payload: {
          starred: true
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Package not found');
    });
  });

  describe('GET /api/v1/packages/starred', () => {
    beforeEach(() => {
      // Mock starred packages query
      const originalMockQuery = (server as any).pg.query;
      (server as any).pg.query = async (sql: string, params?: unknown[]) => {
        if (sql.includes('FROM package_stars ps') && sql.includes('JOIN packages p')) {
          return {
            rows: [
              {
                id: 'starred-pkg-1',
                name: 'starred-package-1',
                description: 'First starred package',
                author: 'author1',
                stars: 15,
                total_downloads: 200,
                format: 'cursor',
                starred_at: new Date()
              },
              {
                id: 'starred-pkg-2',
                name: 'starred-package-2',
                description: 'Second starred package',
                author: 'author2',
                stars: 20,
                total_downloads: 300,
                format: 'claude',
                starred_at: new Date()
              }
            ],
            command: 'SELECT',
            rowCount: 2,
            oid: 0,
            fields: []
          };
        }

        return originalMockQuery(sql, params);
      };

    });

    it('should return starred packages', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/starred',
        headers: {
          authorization: 'Bearer test-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.packages)).toBe(true);
      expect(body.packages.length).toBe(2);
      expect(body.packages[0].name).toBe('starred-package-1');
      expect(body.total).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/packages/starred?limit=10&offset=0',
        headers: {
          authorization: 'Bearer test-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.packages).toBeDefined();
    });
  });
});

interface TestPackageRow {
  id: string;
  name: string;
  display_name: string | null;
  description: string;
  author_id: string | null;
  org_id: string | null;
  format: string;
  subtype: string;
  license: string | null;
  tags: string[];
  keywords: string[];
  language: string | null;
  framework: string | null;
  visibility: string;
  eager: boolean;
  created_at: Date;
  updated_at: Date;
  last_published_at: Date | null;
  ai_enrichment_needed: boolean;
  full_content: string | null;
}

interface TestPackageVersionRow {
  package_id: string;
  version: string;
  tarball_url: string;
  content_hash: string;
  file_size: number;
  published_at: Date;
  metadata: unknown;
  eager: boolean;
}

function createRedisMock() {
  const store = new Map<string, string>();

  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    setex: vi.fn(async (key: string, _seconds: number, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    incr: vi.fn(async (key: string) => {
      const next = Number(store.get(key) ?? '0') + 1;
      store.set(key, String(next));
      return next;
    }),
    decr: vi.fn(async (key: string) => {
      const next = Number(store.get(key) ?? '0') - 1;
      store.set(key, String(next));
      return next;
    }),
    expire: vi.fn(async () => 1),
    ttl: vi.fn(async () => 60),
    del: vi.fn(async (...keys: string[]) => {
      keys.forEach((key) => store.delete(key));
      return keys.length;
    }),
    keys: vi.fn(async () => [] as string[]),
  };
}

function buildPublishManifest(version: string, format: string) {
  return {
    name: '@ci-test/metadata-drift',
    version,
    displayName: `Metadata Drift ${version}`,
    description: `Manifest metadata for ${format}`,
    format,
    subtype: format === 'claude' ? 'agent' : 'skill',
    license: format === 'claude' ? 'Apache-2.0' : 'MIT',
    tags: [format, 'metadata'],
    keywords: [format, 'republish'],
    language: format === 'claude' ? 'typescript' : 'markdown',
    framework: format === 'claude' ? 'node' : undefined,
    eager: format === 'claude',
  };
}

function writeTarString(buffer: Buffer, offset: number, length: number, value: string) {
  buffer.write(value.slice(0, length), offset, length, 'utf8');
}

function writeTarOctal(buffer: Buffer, offset: number, length: number, value: number) {
  const octal = value.toString(8).padStart(length - 1, '0');
  buffer.write(`${octal}\0`, offset, length, 'ascii');
}

function createPrpmJsonTarballBase64(manifest: Record<string, unknown>) {
  const fileContent = Buffer.from(JSON.stringify(manifest), 'utf8');
  const header = Buffer.alloc(512, 0);

  writeTarString(header, 0, 100, 'prpm.json');
  writeTarOctal(header, 100, 8, 0o644);
  writeTarOctal(header, 108, 8, 0);
  writeTarOctal(header, 116, 8, 0);
  writeTarOctal(header, 124, 12, fileContent.length);
  writeTarOctal(header, 136, 12, 0);
  header.fill(' ', 148, 156);
  writeTarString(header, 156, 1, '0');
  writeTarString(header, 257, 6, 'ustar');
  writeTarString(header, 263, 2, '00');

  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  const checksumValue = checksum.toString(8).padStart(6, '0');
  header.write(`${checksumValue}\0 `, 148, 8, 'ascii');

  const paddingLength = (512 - (fileContent.length % 512)) % 512;
  const tarball = Buffer.concat([
    header,
    fileContent,
    Buffer.alloc(paddingLength, 0),
    Buffer.alloc(1024, 0),
  ]);

  return gzipSync(tarball).toString('base64');
}

describe('Package publish metadata republish', () => {
  let server: FastifyInstance;
  let originalCiMode: string | undefined;
  let packageRow: TestPackageRow | null;
  let versionRows: TestPackageVersionRow[];

  beforeAll(async () => {
    originalCiMode = process.env.CI_MODE;
    process.env.CI_MODE = 'true';

    packageRow = null;
    versionRows = [];
    server = Fastify();
    server.decorate('authenticate', async () => {});
    server.decorate('redis', createRedisMock() as never);

    const rowResult = <T,>(rows: T[]) => ({
      rows,
      rowCount: rows.length,
      command: 'SELECT',
      oid: 0,
      fields: [],
    });

    const queryMock = vi.fn(async (sql: string, params: unknown[] = []) => {
      const normalizedSql = sql.replace(/\s+/g, ' ').trim();

      if (normalizedSql.startsWith('SELECT * FROM packages WHERE name = $1')) {
        return rowResult(
          packageRow && packageRow.name === params[0] ? [packageRow] : [],
        );
      }

      if (normalizedSql.startsWith('SELECT version FROM package_versions')) {
        return rowResult(
          versionRows
            .filter((row) => row.package_id === params[0] && row.version === params[1])
            .map((row) => ({ version: row.version })),
        );
      }

      if (normalizedSql.startsWith('INSERT INTO packages')) {
        const now = new Date();
        packageRow = {
          id: 'pkg-metadata-drift',
          name: params[0] as string,
          display_name: params[1] as string | null,
          description: params[2] as string,
          author_id: params[3] as string | null,
          org_id: params[4] as string | null,
          format: params[5] as string,
          subtype: params[6] as string,
          license: params[7] as string | null,
          tags: params[8] as string[],
          keywords: params[9] as string[],
          language: params[10] as string | null,
          framework: params[11] as string | null,
          visibility: params[12] as string,
          eager: params[13] as boolean,
          created_at: now,
          updated_at: now,
          last_published_at: now,
          ai_enrichment_needed: true,
          full_content: null,
        };

        return rowResult([packageRow]);
      }

      if (normalizedSql.startsWith('UPDATE packages SET display_name = $1')) {
        if (!packageRow) {
          return rowResult([]);
        }

        packageRow = {
          ...packageRow,
          display_name: params[0] as string | null,
          description: params[1] as string,
          format: params[2] as string,
          subtype: params[3] as string,
          license: params[4] as string | null,
          tags: params[5] as string[],
          keywords: params[6] as string[],
          language: params[7] as string | null,
          framework: params[8] as string | null,
          eager: params[9] as boolean,
          ai_enrichment_needed: true,
          updated_at: new Date(),
        };

        return rowResult([packageRow]);
      }

      if (normalizedSql.startsWith('INSERT INTO package_versions')) {
        const row: TestPackageVersionRow = {
          package_id: params[0] as string,
          version: params[1] as string,
          tarball_url: params[2] as string,
          content_hash: params[3] as string,
          file_size: params[4] as number,
          published_at: new Date(),
          metadata: params[5],
          eager: params[6] as boolean,
        };
        versionRows.push(row);
        return rowResult([row]);
      }

      if (normalizedSql.startsWith('UPDATE packages SET last_published_at')) {
        if (packageRow) {
          packageRow = {
            ...packageRow,
            last_published_at: new Date(),
            updated_at: new Date(),
            full_content: params[1] as string | null,
            ai_enrichment_needed: true,
          };
        }
        return rowResult(packageRow ? [packageRow] : []);
      }

      if (normalizedSql.startsWith('SELECT * FROM package_versions')) {
        return rowResult(
          versionRows
            .filter((row) => row.package_id === params[0])
            .sort((a, b) => b.published_at.getTime() - a.published_at.getTime()),
        );
      }

      return rowResult([]);
    });

    server.decorate('pg', {
      query: queryMock,
      connect: async () => ({
        query: queryMock,
        release: () => {},
      }),
    } as never);

    await server.register(packageRoutes, { prefix: '/api/v1/packages' });
    await server.ready();
  });

  afterAll(async () => {
    if (originalCiMode === undefined) {
      delete process.env.CI_MODE;
    } else {
      process.env.CI_MODE = originalCiMode;
    }
    await server.close();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  async function publish(version: string, format: string) {
    const manifest = buildPublishManifest(version, format);

    return server.inject({
      method: 'POST',
      url: '/api/v1/packages',
      payload: {
        manifest,
        tarball: createPrpmJsonTarballBase64(manifest),
      },
    });
  }

  it('updates mutable package metadata from the latest manifest when republishing', async () => {
    const firstPublish = await publish('1.0.0', 'generic');
    expect(firstPublish.statusCode).toBe(200);

    const secondPublish = await publish('1.0.1', 'claude');
    expect(secondPublish.statusCode).toBe(200);

    const response = await server.inject({
      method: 'GET',
      url: `/api/v1/packages/${encodeURIComponent('@ci-test/metadata-drift')}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as TestPackageRow & {
      versions: TestPackageVersionRow[];
    };

    expect(body.format).toBe('claude');
    expect(body.subtype).toBe('agent');
    expect(body.description).toBe('Manifest metadata for claude');
    expect(body.display_name).toBe('Metadata Drift 1.0.1');
    expect(body.license).toBe('Apache-2.0');
    expect(body.tags).toEqual(['claude', 'metadata']);
    expect(body.keywords).toEqual(['claude', 'republish']);
    expect(body.language).toBe('typescript');
    expect(body.framework).toBe('node');
    expect(body.eager).toBe(true);
    expect(body.ai_enrichment_needed).toBe(true);
    expect(body.versions.map((version) => version.version)).toEqual(['1.0.1', '1.0.0']);
  });
});
