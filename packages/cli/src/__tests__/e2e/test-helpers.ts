/**
 * E2E Test Helpers
 * Shared utilities for end-to-end CLI testing
 */

import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Create a temporary test directory
 */
export async function createTestDir(): Promise<string> {
  const testDir = join(tmpdir(), `prpm-e2e-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });
  return testDir;
}

/**
 * Clean up test directory
 */
export async function cleanupTestDir(testDir: string): Promise<void> {
  try {
    await rm(testDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Create a mock package manifest
 */
export async function createMockPackage(
  testDir: string,
  name: string,
  type: string = 'cursor',
  version: string = '1.0.0'
): Promise<string> {
  const manifest = {
    name,
    version,
    description: `Test package ${name}`,
    type,
    author: 'test-author',
    tags: ['test', type],
  };

  const manifestPath = join(testDir, 'prpm.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  // Create a sample .cursorrules file
  const rulesPath = join(testDir, '.cursorrules');
  await writeFile(rulesPath, '# Test cursor rules\n\nAlways write tests.\n');

  return manifestPath;
}

/**
 * Create a mock collection manifest
 */
export async function createMockCollection(
  testDir: string,
  id: string,
  packages: Array<{ packageId: string; version?: string; required?: boolean }>
): Promise<string> {
  const manifest = {
    id,
    name: `Test Collection ${id}`,
    description: 'A test collection for E2E testing',
    category: 'development',
    tags: ['test', 'automation'],
    packages,
    icon: '📦',
  };

  const manifestPath = join(testDir, 'collection.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifestPath;
}

/**
 * Create a mock user config
 */
export async function createMockConfig(
  configPath: string,
  options: {
    token?: string;
    registryUrl?: string;
  }
): Promise<void> {
  const config = {
    token: options.token || 'test-token-123',
    registryUrl: options.registryUrl || 'http://localhost:3111',
  };

  await mkdir(join(configPath, '..'), { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Mock fetch response for registry API
 */
export function createMockFetch() {
  const responses = new Map<string, any>();

  const mockFetch = jest.fn(async (url: string, options?: any) => {
    const key = `${options?.method || 'GET'} ${url}`;
    const response = responses.get(key) || responses.get(url);

    if (!response) {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
      };
    }

    if (typeof response === 'function') {
      return response(url, options);
    }

    return {
      ok: true,
      status: 200,
      json: async () => response,
      arrayBuffer: async () => Buffer.from('mock-data').buffer,
    };
  });

  return {
    fetch: mockFetch,
    addResponse: (key: string, response: any) => {
      responses.set(key, response);
    },
    clear: () => {
      responses.clear();
      mockFetch.mockClear();
    },
  };
}

/**
 * Wait for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Setup global mocks for E2E tests
 */
export function setupGlobalMocks() {
  // Mock console to reduce noise
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
}

/**
 * Mock process.exit to throw instead of exiting
 */
export function mockProcessExit() {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
    throw new Error(`Process exited with code ${code}`);
  });
  return mockExit;
}
