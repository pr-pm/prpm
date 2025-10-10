"use strict";
/**
 * CLI integration tests using child_process
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
describe('CLI Integration Tests', () => {
    let tempDir;
    const originalCwd = process.cwd();
    beforeEach(async () => {
        tempDir = await global.testUtils.createTempDir();
        process.chdir(tempDir);
    });
    afterEach(async () => {
        process.chdir(originalCwd);
        await global.testUtils.cleanupTempDir(tempDir);
    });
    const runCLI = (args) => {
        return new Promise((resolve) => {
            const child = (0, child_process_1.spawn)('node', [path_1.default.join(__dirname, '../dist/index.js'), ...args], {
                cwd: tempDir,
                stdio: 'pipe'
            });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('close', (code) => {
                resolve({
                    code: code || 0,
                    stdout,
                    stderr
                });
            });
        });
    };
    describe('Help Commands', () => {
        it('should show help for main command', async () => {
            const result = await runCLI(['--help']);
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Prompt Package Manager');
            expect(result.stdout).toContain('add');
            expect(result.stdout).toContain('list');
            expect(result.stdout).toContain('remove');
        });
        it('should show help for add command', async () => {
            const result = await runCLI(['add', '--help']);
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Add a prompt package from a URL');
            expect(result.stdout).toContain('--as');
        });
        it('should show help for list command', async () => {
            const result = await runCLI(['list', '--help']);
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('List all installed prompt packages');
        });
        it('should show help for remove command', async () => {
            const result = await runCLI(['remove', '--help']);
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Remove a prompt package');
        });
        it('should show version', async () => {
            const result = await runCLI(['--version']);
            expect(result.code).toBe(0);
            expect(result.stdout.trim()).toBe('0.1.0');
        });
    });
    describe('List Command', () => {
        it('should show empty list when no packages', async () => {
            const result = await runCLI(['list']);
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('No packages installed');
        });
    });
    describe('Add Command', () => {
        it('should fail with invalid URL', async () => {
            const result = await runCLI(['add', 'invalid-url']);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('Failed to add package');
        });
        it('should fail with invalid type', async () => {
            const result = await runCLI(['add', 'https://raw.githubusercontent.com/user/repo/main/test.md', '--as', 'invalid']);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('Type must be either "cursor" or "claude"');
        });
        it('should fail with missing URL', async () => {
            const result = await runCLI(['add']);
            expect(result.code).toBe(1);
        });
    });
    describe('Remove Command', () => {
        it('should fail with missing ID', async () => {
            const result = await runCLI(['remove']);
            expect(result.code).toBe(1);
        });
        it('should fail with non-existent package', async () => {
            const result = await runCLI(['remove', 'non-existent']);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('Package "non-existent" not found');
        });
    });
    describe('Error Handling', () => {
        it('should handle unknown command', async () => {
            const result = await runCLI(['unknown-command']);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('unknown command');
        });
        it('should handle missing arguments gracefully', async () => {
            const result = await runCLI(['add']);
            expect(result.code).toBe(1);
        });
    });
});
//# sourceMappingURL=cli.test.js.map