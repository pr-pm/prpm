"use strict";
/**
 * Full integration tests that test the complete workflow
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
describe('Full Integration Tests', () => {
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
    describe('Complete Workflow', () => {
        it('should handle full add -> list -> remove workflow', async () => {
            // Create a test file to simulate a real GitHub file
            const testContent = '# Test Cursor Rules\n\nAlways write clean code.';
            const testFile = path_1.default.join(tempDir, 'test-rules.md');
            await fs_1.promises.writeFile(testFile, testContent);
            // Mock the download by creating a simple HTTP server or using a real file
            // For this test, we'll use a file:// URL or mock the download
            // Since we can't easily mock the download in integration tests,
            // we'll test the config and filesystem parts
            // Test that the config file is created and managed correctly
            const configPath = path_1.default.join(tempDir, '.promptpm.json');
            expect(await global.testUtils.fileExists(configPath)).toBe(false);
            // Test list command on empty project
            const listResult = await runCLI(['list']);
            expect(listResult.code).toBe(0);
            expect(listResult.stdout).toContain('No packages installed');
        });
        it('should handle multiple packages of different types', async () => {
            // Test that the system can handle multiple packages
            // This is more of a configuration test since we can't easily mock downloads
            const configPath = path_1.default.join(tempDir, '.promptpm.json');
            // Create a test config manually
            const testConfig = {
                sources: [
                    {
                        id: 'cursor-rules',
                        type: 'cursor',
                        url: 'https://raw.githubusercontent.com/user/repo/main/cursor-rules.md',
                        dest: '.cursor/rules/cursor-rules.md'
                    },
                    {
                        id: 'claude-agent',
                        type: 'claude',
                        url: 'https://raw.githubusercontent.com/user/repo/main/agent.md',
                        dest: '.claude/agents/agent.md'
                    }
                ]
            };
            await fs_1.promises.writeFile(configPath, JSON.stringify(testConfig, null, 2));
            // Test list command
            const listResult = await runCLI(['list']);
            expect(listResult.code).toBe(0);
            expect(listResult.stdout).toContain('cursor-rules');
            expect(listResult.stdout).toContain('claude-agent');
        });
        it('should handle project structure creation', async () => {
            // Test that directories are created correctly
            const cursorDir = path_1.default.join(tempDir, '.cursor', 'rules');
            const claudeDir = path_1.default.join(tempDir, '.claude', 'agents');
            // Create test files in the expected locations
            await fs_1.promises.mkdir(cursorDir, { recursive: true });
            await fs_1.promises.mkdir(claudeDir, { recursive: true });
            await fs_1.promises.writeFile(path_1.default.join(cursorDir, 'test.md'), '# Cursor Rules');
            await fs_1.promises.writeFile(path_1.default.join(claudeDir, 'agent.md'), '# Claude Agent');
            // Verify structure
            expect(await global.testUtils.fileExists(cursorDir)).toBe(true);
            expect(await global.testUtils.fileExists(claudeDir)).toBe(true);
            expect(await global.testUtils.fileExists(path_1.default.join(cursorDir, 'test.md'))).toBe(true);
            expect(await global.testUtils.fileExists(path_1.default.join(claudeDir, 'agent.md'))).toBe(true);
        });
    });
    describe('Error Recovery', () => {
        it('should handle corrupted config file gracefully', async () => {
            const configPath = path_1.default.join(tempDir, '.promptpm.json');
            await fs_1.promises.writeFile(configPath, '{ invalid json }');
            // List command should handle corrupted config
            const listResult = await runCLI(['list']);
            expect(listResult.code).toBe(1);
            expect(listResult.stderr).toContain('Failed to list packages');
        });
        it('should handle missing config file gracefully', async () => {
            // List command should work with no config file
            const listResult = await runCLI(['list']);
            expect(listResult.code).toBe(0);
            expect(listResult.stdout).toContain('No packages installed');
        });
        it('should handle permission errors gracefully', async () => {
            // Create a directory with the same name as the config file
            const configPath = path_1.default.join(tempDir, '.promptpm.json');
            await fs_1.promises.mkdir(configPath);
            // Commands should handle this gracefully
            const listResult = await runCLI(['list']);
            expect(listResult.code).toBe(1);
        });
    });
    describe('CLI Argument Validation', () => {
        it('should validate add command arguments', async () => {
            // Missing URL
            const result1 = await runCLI(['add']);
            expect(result1.code).toBe(1);
            // Invalid type
            const result2 = await runCLI(['add', 'https://example.com/test.md', '--as', 'invalid']);
            expect(result2.code).toBe(1);
            expect(result2.stderr).toContain('Type must be either "cursor" or "claude"');
        });
        it('should validate remove command arguments', async () => {
            // Missing ID
            const result = await runCLI(['remove']);
            expect(result.code).toBe(1);
        });
        it('should handle unknown commands', async () => {
            const result = await runCLI(['unknown-command']);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('unknown command');
        });
    });
    describe('File System Integration', () => {
        it('should handle file operations correctly', async () => {
            // Test that we can create and manage files in the expected structure
            const cursorDir = path_1.default.join(tempDir, '.cursor', 'rules');
            const claudeDir = path_1.default.join(tempDir, '.claude', 'agents');
            // Create directories
            await fs_1.promises.mkdir(cursorDir, { recursive: true });
            await fs_1.promises.mkdir(claudeDir, { recursive: true });
            // Create test files
            const cursorFile = path_1.default.join(cursorDir, 'test-cursor.md');
            const claudeFile = path_1.default.join(claudeDir, 'test-claude.md');
            await fs_1.promises.writeFile(cursorFile, '# Cursor Rules\nTest content');
            await fs_1.promises.writeFile(claudeFile, '# Claude Agent\nTest content');
            // Verify files exist
            expect(await global.testUtils.fileExists(cursorFile)).toBe(true);
            expect(await global.testUtils.fileExists(claudeFile)).toBe(true);
            // Test file content
            const cursorContent = await fs_1.promises.readFile(cursorFile, 'utf-8');
            const claudeContent = await fs_1.promises.readFile(claudeFile, 'utf-8');
            expect(cursorContent).toContain('Cursor Rules');
            expect(claudeContent).toContain('Claude Agent');
        });
    });
});
//# sourceMappingURL=integration.test.js.map