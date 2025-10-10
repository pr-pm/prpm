"use strict";
/**
 * Integration tests for remove command
 */
Object.defineProperty(exports, "__esModule", { value: true });
const remove_1 = require("../../src/commands/remove");
// Mock the core modules
jest.mock('../../src/core/config');
jest.mock('../../src/core/filesystem');
describe('Remove Command', () => {
    const originalExit = process.exit;
    beforeEach(() => {
        process.exit = jest.fn();
    });
    afterEach(() => {
        process.exit = originalExit;
        jest.clearAllMocks();
    });
    it('should remove existing package successfully', async () => {
        const pkg = {
            id: 'test-package',
            type: 'cursor',
            url: 'https://raw.githubusercontent.com/user/repo/main/test.md',
            dest: '.cursor/rules/test.md'
        };
        const { removePackage } = require('../../src/core/config');
        const { deleteFile } = require('../../src/core/filesystem');
        removePackage.mockResolvedValue(pkg);
        deleteFile.mockResolvedValue(undefined);
        await (0, remove_1.handleRemove)('test-package');
        expect(removePackage).toHaveBeenCalledWith('test-package');
        expect(deleteFile).toHaveBeenCalledWith('.cursor/rules/test.md');
        expect(process.exit).not.toHaveBeenCalled();
    });
    it('should handle non-existent package', async () => {
        const { removePackage } = require('../../src/core/config');
        removePackage.mockResolvedValue(null);
        await (0, remove_1.handleRemove)('non-existent');
        expect(removePackage).toHaveBeenCalledWith('non-existent');
        expect(process.exit).toHaveBeenCalledWith(1);
    });
    it('should handle config errors', async () => {
        const { removePackage } = require('../../src/core/config');
        removePackage.mockRejectedValue(new Error('Config error'));
        await (0, remove_1.handleRemove)('test-package');
        expect(process.exit).toHaveBeenCalledWith(1);
    });
    it('should handle filesystem errors', async () => {
        const pkg = {
            id: 'test-package',
            type: 'cursor',
            url: 'https://raw.githubusercontent.com/user/repo/main/test.md',
            dest: '.cursor/rules/test.md'
        };
        const { removePackage } = require('../../src/core/config');
        const { deleteFile } = require('../../src/core/filesystem');
        removePackage.mockResolvedValue(pkg);
        deleteFile.mockRejectedValue(new Error('File delete failed'));
        await (0, remove_1.handleRemove)('test-package');
        expect(process.exit).toHaveBeenCalledWith(1);
    });
    it('should remove claude package successfully', async () => {
        const pkg = {
            id: 'claude-agent',
            type: 'claude',
            url: 'https://raw.githubusercontent.com/user/repo/main/agent.md',
            dest: '.claude/agents/agent.md'
        };
        const { removePackage } = require('../../src/core/config');
        const { deleteFile } = require('../../src/core/filesystem');
        removePackage.mockResolvedValue(pkg);
        deleteFile.mockResolvedValue(undefined);
        await (0, remove_1.handleRemove)('claude-agent');
        expect(removePackage).toHaveBeenCalledWith('claude-agent');
        expect(deleteFile).toHaveBeenCalledWith('.claude/agents/agent.md');
        expect(process.exit).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=remove.test.js.map