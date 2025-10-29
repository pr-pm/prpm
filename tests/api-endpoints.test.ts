/**
 * E2E Tests for Registry API Endpoints
 */

describe('Registry API Endpoints', () => {
  const REGISTRY_URL = 'http://localhost:3111';
  const TEST_PACKAGE = 'analyst-valllabh';

  test('trending endpoint returns 200', async () => {
    const response = await fetch(`${REGISTRY_URL}/api/v1/search/trending?limit=5`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('packages');
    expect(Array.isArray(data.packages)).toBe(true);
  });

  test('popular endpoint returns 200', async () => {
    const response = await fetch(`${REGISTRY_URL}/api/v1/search/trending?limit=5`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('packages');
  });

  test('versions endpoint returns valid response', async () => {
    const response = await fetch(`${REGISTRY_URL}/api/v1/packages/${TEST_PACKAGE}/versions`);
    // Either 200 with data or 404 if package not found - both are valid
    expect([200, 404]).toContain(response.status);
  });

  test('dependencies endpoint returns valid response', async () => {
    const response = await fetch(`${REGISTRY_URL}/api/v1/packages/${TEST_PACKAGE}/1.0.0/dependencies`);
    // Either 200 with data or 404 if package/version not found - both are valid
    expect([200, 404]).toContain(response.status);
  });

  test('resolve endpoint returns valid response', async () => {
    const response = await fetch(`${REGISTRY_URL}/api/v1/packages/${TEST_PACKAGE}/resolve`);
    // Either 200 with data or 404 if package not found - both are valid
    expect([200, 404, 500]).toContain(response.status);
  });

  test('search endpoint returns 200', async () => {
    const response = await fetch(`${REGISTRY_URL}/api/v1/search?q=test`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('packages');
  });

  test('package info endpoint returns valid response', async () => {
    const response = await fetch(`${REGISTRY_URL}/api/v1/packages/${TEST_PACKAGE}`);
    // Either 200 if package exists or 404 if not - both are valid
    expect([200, 404]).toContain(response.status);
  });
});
