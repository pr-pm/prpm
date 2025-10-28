/**
 * Publish routes tests - organization publishing support
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { publishRoutes } from '../publish';
import FormData from 'form-data';
import { Readable } from 'stream';

describe('Publish Routes - Organization Support', () => {
  let server: FastifyInstance;
  const testUserId = 'test-user-id';
  const testOrgId = 'test-org-id';
  const otherOrgId = 'other-org-id';

  beforeAll(async () => {
    server = Fastify();

    // Mock authenticate decorator
    server.decorate('authenticate', async (request: any) => {
      request.user = {
        user_id: testUserId,
        username: 'testuser',
        email: 'test@example.com',
        is_admin: false,
      };
    });

    // Create mock query function
    const mockQuery = async (sql: string, params?: unknown[]) => {
      // Mock organization membership check
      if (sql.includes('SELECT role FROM organization_members')) {
        const orgId = params?.[0];
        const userId = params?.[1];

        if (orgId === testOrgId && userId === testUserId) {
          return {
            rows: [{ role: 'owner' }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          };
        }

        if (orgId === 'maintainer-org' && userId === testUserId) {
          return {
            rows: [{ role: 'maintainer' }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          };
        }

        if (orgId === 'member-org' && userId === testUserId) {
          return {
            rows: [{ role: 'member' }], // No publishing permission
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          };
        }

        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: [],
        };
      }

      // Mock package existence check
      if (sql.includes('SELECT * FROM packages WHERE id = $1')) {
        const packageName = params?.[0];

        if (packageName === 'existing-personal-package') {
          return {
            rows: [{
              id: 'existing-personal-package',
              author_id: testUserId,
              org_id: null,
            }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          };
        }

        if (packageName === 'existing-org-package') {
          return {
            rows: [{
              id: 'existing-org-package',
              author_id: null,
              org_id: testOrgId,
            }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          };
        }

        if (packageName === 'existing-other-org-package') {
          return {
            rows: [{
              id: 'existing-other-org-package',
              author_id: null,
              org_id: otherOrgId,
            }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          };
        }

        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: [],
        };
      }

      // Mock version check
      if (sql.includes('SELECT version FROM package_versions')) {
        return {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: [],
        };
      }

      // Mock package insert
      if (sql.includes('INSERT INTO packages')) {
        return {
          rows: [],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      // Mock package update
      if (sql.includes('UPDATE packages SET last_published_at')) {
        return {
          rows: [],
          command: 'UPDATE',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      // Mock version insert
      if (sql.includes('INSERT INTO package_versions')) {
        return {
          rows: [],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: [],
        };
      }

      return {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      };
    };

    // Mock database
    (server as any).decorate('pg', {
      query: mockQuery,
      connect: async () => ({
        query: mockQuery,
        release: () => {},
      }),
    } as any);

    await server.register(publishRoutes, { prefix: '/api/v1' });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  // Helper to create form data with tarball
  function createPublishFormData(manifest: any, orgId?: string) {
    const form = new FormData();
    form.append('manifest', JSON.stringify(manifest));
    if (orgId) {
      form.append('org_id', orgId);
    }

    // Create a minimal tarball
    const tarball = Buffer.from('fake-tarball-data');
    form.append('tarball', tarball, {
      filename: 'package.tar.gz',
      contentType: 'application/gzip',
    });

    return form;
  }

  describe('POST /api/v1/publish - Organization Publishing', () => {
    it('should publish new package to organization', async () => {
      const manifest = {
        name: 'new-org-package',
        version: '1.0.0',
        description: 'Test org package',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      const form = createPublishFormData(manifest, testOrgId);

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('package_id');
      expect(body).toHaveProperty('version', '1.0.0');
    });

    it('should reject publishing to organization user is not member of', async () => {
      const manifest = {
        name: 'unauthorized-org-package',
        version: '1.0.0',
        description: 'Test package',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      const form = createPublishFormData(manifest, otherOrgId);

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('not a member');
    });

    it('should reject publishing when user has insufficient role', async () => {
      const manifest = {
        name: 'member-package',
        version: '1.0.0',
        description: 'Test package',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      const form = createPublishFormData(manifest, 'member-org');

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('do not have permission');
      expect(body.error).toContain('member');
    });

    it('should allow maintainer role to publish', async () => {
      const manifest = {
        name: 'maintainer-package',
        version: '1.0.0',
        description: 'Test package',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      const form = createPublishFormData(manifest, 'maintainer-org');

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should publish to personal account when no org_id provided', async () => {
      const manifest = {
        name: 'personal-package',
        version: '1.0.0',
        description: 'Test personal package',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      const form = createPublishFormData(manifest);

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/v1/publish - Existing Package Ownership', () => {
    it('should allow updating own personal package', async () => {
      const manifest = {
        name: 'existing-personal-package',
        version: '1.1.0',
        description: 'Updated package',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      const form = createPublishFormData(manifest);

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow updating organization package when user is member', async () => {
      const manifest = {
        name: 'existing-org-package',
        version: '1.1.0',
        description: 'Updated org package',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      const form = createPublishFormData(manifest, testOrgId);

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should reject updating organization package when user is not member', async () => {
      const manifest = {
        name: 'existing-other-org-package',
        version: '1.1.0',
        description: 'Attempt to update other org package',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      const form = createPublishFormData(manifest, otherOrgId);

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(403);
    });

    it('should reject updating organization package without proper role', async () => {
      const manifest = {
        name: 'existing-org-package',
        version: '1.1.0',
        description: 'Update attempt',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      // Simulate member role (no publishing permission)
      const form = createPublishFormData(manifest, 'member-org');

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('POST /api/v1/publish - Organization Field Validation', () => {
    it('should validate org_id format', async () => {
      const manifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test package',
        format: 'cursor',
        files: ['.cursorrules'],
      };

      const form = createPublishFormData(manifest, ''); // Empty org_id

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      // Should either reject or ignore empty org_id
      expect([200, 400, 403]).toContain(response.statusCode);
    });

    it('should handle missing manifest with org_id', async () => {
      const form = new FormData();
      form.append('org_id', testOrgId);

      const tarball = Buffer.from('fake-tarball-data');
      form.append('tarball', tarball, {
        filename: 'package.tar.gz',
        contentType: 'application/gzip',
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/publish',
        headers: {
          ...form.getHeaders(),
          authorization: 'Bearer test-token',
        },
        payload: form,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('manifest');
    });
  });
});
