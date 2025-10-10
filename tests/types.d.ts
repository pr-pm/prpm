/**
 * Type definitions for test utilities
 */

declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createTempDir(): Promise<string>;
        cleanupTempDir(dir: string): Promise<void>;
        createTestFile(filePath: string, content: string): Promise<void>;
        readTestFile(filePath: string): Promise<string>;
        fileExists(filePath: string): Promise<boolean>;
      };
    }
  }
}

export {};
