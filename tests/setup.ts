/**
 * Jest setup file for global test configuration
 */

import { promises as fs } from 'fs';
import path from 'path';

// Global test utilities
(global as any).testUtils = {
  /**
   * Create a temporary directory for testing
   */
  async createTempDir(): Promise<string> {
    const tempDir = path.join(__dirname, 'temp', `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  },

  /**
   * Clean up temporary directory
   */
  async cleanupTempDir(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  },

  /**
   * Create a test file with content
   */
  async createTestFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  },

  /**
   * Read a test file
   */
  async readTestFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  },

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
};

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
(global as any).console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Restore console after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Restore original console after all tests
afterAll(() => {
  (global as any).console = originalConsole;
});
