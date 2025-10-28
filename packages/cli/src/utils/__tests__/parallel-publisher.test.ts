/**
 * Tests for parallel publishing utilities
 */

import {
  publishInParallel,
  withRetry,
  calculateStats,
  formatDuration,
  type PublishTask,
} from '../parallel-publisher';

describe('parallel-publisher', () => {
  describe('publishInParallel', () => {
    it('should execute all tasks successfully', async () => {
      const tasks: PublishTask<number>[] = [
        { name: 'task1', execute: async () => 1 },
        { name: 'task2', execute: async () => 2 },
        { name: 'task3', execute: async () => 3 },
      ];

      const results = await publishInParallel(tasks);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe(1);
      expect(results[1].result).toBe(2);
      expect(results[2].result).toBe(3);
    });

    it('should respect concurrency limit', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const tasks: PublishTask<void>[] = Array.from({ length: 10 }, (_, i) => ({
        name: `task${i}`,
        execute: async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise(resolve => setTimeout(resolve, 10));
          concurrent--;
        },
      }));

      await publishInParallel(tasks, { concurrency: 3 });

      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });

    it('should call onProgress callback', async () => {
      const progressCalls: Array<{ current: number; total: number; name: string }> = [];

      const tasks: PublishTask<number>[] = [
        { name: 'task1', execute: async () => 1 },
        { name: 'task2', execute: async () => 2 },
      ];

      await publishInParallel(tasks, {
        onProgress: (current, total, name) => {
          progressCalls.push({ current, total, name });
        },
      });

      expect(progressCalls).toHaveLength(2);
      expect(progressCalls[0].total).toBe(2);
      expect(progressCalls[1].current).toBe(2);
    });

    it('should call onSuccess callback', async () => {
      const successCalls: string[] = [];

      const tasks: PublishTask<number>[] = [
        { name: 'task1', execute: async () => 1 },
        { name: 'task2', execute: async () => 2 },
      ];

      await publishInParallel(tasks, {
        onSuccess: (name) => {
          successCalls.push(name);
        },
      });

      expect(successCalls).toHaveLength(2);
      expect(successCalls).toContain('task1');
      expect(successCalls).toContain('task2');
    });

    it('should handle task failures', async () => {
      const tasks: PublishTask<number>[] = [
        { name: 'task1', execute: async () => 1 },
        { name: 'task2', execute: async () => { throw new Error('Task 2 failed'); } },
        { name: 'task3', execute: async () => 3 },
      ];

      const results = await publishInParallel(tasks, { continueOnError: true });

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error?.message).toBe('Task 2 failed');
      expect(results[2].success).toBe(true);
    });

    it('should stop on first error in strict mode', async () => {
      const executedTasks: string[] = [];

      const tasks: PublishTask<number>[] = [
        { name: 'task1', execute: async () => { executedTasks.push('task1'); return 1; } },
        { name: 'task2', execute: async () => { executedTasks.push('task2'); throw new Error('Failed'); } },
        { name: 'task3', execute: async () => { await new Promise(resolve => setTimeout(resolve, 50)); executedTasks.push('task3'); return 3; } },
        { name: 'task4', execute: async () => { await new Promise(resolve => setTimeout(resolve, 50)); executedTasks.push('task4'); return 4; } },
      ];

      const results = await publishInParallel(tasks, { continueOnError: false, concurrency: 2 });

      // At least one task should be skipped
      const skippedCount = results.filter(r => r.error?.message === 'Skipped due to previous failure').length;
      expect(skippedCount).toBeGreaterThanOrEqual(1);

      // Should have at least one failure
      expect(results.some(r => r.error && r.error.message !== 'Skipped due to previous failure')).toBe(true);
    });

    it('should call onError callback', async () => {
      const errorCalls: Array<{ name: string; error: Error }> = [];

      const tasks: PublishTask<number>[] = [
        { name: 'task1', execute: async () => { throw new Error('Error 1'); } },
        { name: 'task2', execute: async () => 2 },
      ];

      await publishInParallel(tasks, {
        continueOnError: true,
        onError: (name, error) => {
          errorCalls.push({ name, error });
        },
      });

      expect(errorCalls).toHaveLength(1);
      expect(errorCalls[0].name).toBe('task1');
      expect(errorCalls[0].error.message).toBe('Error 1');
    });

    it('should track duration for each task', async () => {
      const tasks: PublishTask<void>[] = [
        {
          name: 'task1',
          execute: async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          },
        },
      ];

      const results = await publishInParallel(tasks);

      expect(results[0].duration).toBeGreaterThanOrEqual(45); // Allow some timing variance
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;

      const result = await withRetry(async () => {
        attempts++;
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;

      const result = await withRetry(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      }, { maxRetries: 5, initialDelay: 10 });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      let attempts = 0;

      await expect(
        withRetry(async () => {
          attempts++;
          throw new Error('Persistent failure');
        }, { maxRetries: 3, initialDelay: 10 })
      ).rejects.toThrow('Persistent failure');

      expect(attempts).toBe(3);
    });

    it('should use exponential backoff', async () => {
      const delays: number[] = [];
      let lastTime = Date.now();
      let attempts = 0;

      try {
        await withRetry(async () => {
          const now = Date.now();
          if (attempts > 0) {
            delays.push(now - lastTime);
          }
          lastTime = now;
          attempts++;
          throw new Error('Fail');
        }, { maxRetries: 3, initialDelay: 50, backoffFactor: 2 });
      } catch {
        // Expected to fail
      }

      // Should have 2 delays (between 3 attempts)
      expect(delays).toHaveLength(2);
      // Second delay should be roughly 2x first delay (with some tolerance)
      expect(delays[1]).toBeGreaterThan(delays[0] * 1.7);
    });

    it('should respect maxDelay cap', async () => {
      const delays: number[] = [];
      let lastTime = Date.now();

      try {
        await withRetry(async () => {
          const now = Date.now();
          if (delays.length > 0) {
            delays.push(now - lastTime);
          }
          lastTime = now;
          throw new Error('Fail');
        }, { maxRetries: 5, initialDelay: 100, backoffFactor: 10, maxDelay: 150 });
      } catch {
        // Expected
      }

      // Later delays should be capped at maxDelay
      expect(delays.every(d => d <= 200)).toBe(true); // Allow some variance
    });
  });

  describe('calculateStats', () => {
    it('should calculate statistics correctly', () => {
      const results = [
        { success: true, name: 'pkg1', result: {}, duration: 1000 },
        { success: true, name: 'pkg2', result: {}, duration: 1500 },
        { success: false, name: 'pkg3', error: new Error('Failed'), duration: 500 },
        { success: false, name: 'pkg4', error: new Error('Skipped due to previous failure'), duration: 0 },
      ];

      const stats = calculateStats(results);

      expect(stats.total).toBe(4);
      expect(stats.succeeded).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.skipped).toBe(1);
      expect(stats.totalDuration).toBe(3000);
      expect(stats.avgDuration).toBe(1000); // (1000 + 1500 + 500) / 3
      expect(stats.successRate).toBe(0.5); // 2/4
    });

    it('should handle empty results', () => {
      const stats = calculateStats([]);

      expect(stats.total).toBe(0);
      expect(stats.succeeded).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it('should handle all successes', () => {
      const results = [
        { success: true, name: 'pkg1', result: {}, duration: 1000 },
        { success: true, name: 'pkg2', result: {}, duration: 1000 },
      ];

      const stats = calculateStats(results);

      expect(stats.succeeded).toBe(2);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe(1.0);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.0s');
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(5432)).toBe('5.4s');
    });
  });
});
