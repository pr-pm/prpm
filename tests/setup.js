"use strict";
/**
 * Jest setup file for global test configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// Global test utilities
global.testUtils = {
    /**
     * Create a temporary directory for testing
     */
    async createTempDir() {
        const tempDir = path_1.default.join(__dirname, 'temp', `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        await fs_1.promises.mkdir(tempDir, { recursive: true });
        return tempDir;
    },
    /**
     * Clean up temporary directory
     */
    async cleanupTempDir(dir) {
        try {
            await fs_1.promises.rm(dir, { recursive: true, force: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    },
    /**
     * Create a test file with content
     */
    async createTestFile(filePath, content) {
        await fs_1.promises.mkdir(path_1.default.dirname(filePath), { recursive: true });
        await fs_1.promises.writeFile(filePath, content, 'utf-8');
    },
    /**
     * Read a test file
     */
    async readTestFile(filePath) {
        return await fs_1.promises.readFile(filePath, 'utf-8');
    },
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs_1.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
};
// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
global.console = {
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
    global.console = originalConsole;
});
//# sourceMappingURL=setup.js.map