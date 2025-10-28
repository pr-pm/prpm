/**
 * Parallel publishing utilities with concurrency control
 * Optimizes multi-package publishing performance
 */

export interface PublishTask<T> {
  execute: () => Promise<T>;
  name: string;
}

export interface PublishResult<T> {
  success: boolean;
  name: string;
  result?: T;
  error?: Error;
  duration: number;
}

export interface ParallelPublishOptions {
  concurrency?: number;
  continueOnError?: boolean;
  onProgress?: (current: number, total: number, name: string) => void;
  onSuccess?: (name: string, result: any) => void;
  onError?: (name: string, error: Error) => void;
}

/**
 * Execute tasks in parallel with concurrency limit
 */
export async function publishInParallel<T>(
  tasks: PublishTask<T>[],
  options: ParallelPublishOptions = {}
): Promise<PublishResult<T>[]> {
  const {
    concurrency = 5,
    continueOnError = false,
    onProgress,
    onSuccess,
    onError,
  } = options;

  const results: PublishResult<T>[] = new Array(tasks.length);
  let completed = 0;
  let hasError = false;
  let taskIndex = 0;

  async function executeTask(task: PublishTask<T>, index: number): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await task.execute();
      const duration = Date.now() - startTime;

      results[index] = {
        success: true,
        name: task.name,
        result,
        duration,
      };

      completed++;
      onProgress?.(completed, tasks.length, task.name);
      onSuccess?.(task.name, result);
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      results[index] = {
        success: false,
        name: task.name,
        error: err,
        duration,
      };

      completed++;
      hasError = true;
      onProgress?.(completed, tasks.length, task.name);
      onError?.(task.name, err);

      // If not continuing on error, mark hasError to skip remaining tasks
      if (!continueOnError) {
        throw err;
      }
    }
  }

  // Execute tasks with concurrency control
  const executing = new Set<Promise<void>>();

  while (taskIndex < tasks.length || executing.size > 0) {
    // Fill up to concurrency limit
    while (taskIndex < tasks.length && executing.size < concurrency) {
      // If in strict mode and we've encountered an error, skip remaining tasks
      if (!continueOnError && hasError) {
        results[taskIndex] = {
          success: false,
          name: tasks[taskIndex].name,
          error: new Error('Skipped due to previous failure'),
          duration: 0,
        };
        taskIndex++;
        continue;
      }

      const currentIndex = taskIndex;
      const currentTask = tasks[taskIndex];
      taskIndex++;

      const promise = executeTask(currentTask, currentIndex)
        .catch(() => {
          // Errors already handled in executeTask
        })
        .finally(() => {
          executing.delete(promise);
        });

      executing.add(promise);
    }

    // Wait for at least one task to complete
    if (executing.size > 0) {
      await Promise.race(executing);
    }
  }

  return results;
}

/**
 * Retry a task with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      await sleep(delay);
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

/**
 * Calculate statistics from publish results
 */
export interface PublishStats {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  totalDuration: number;
  avgDuration: number;
  successRate: number;
}

export function calculateStats<T>(results: PublishResult<T>[]): PublishStats {
  const succeeded = results.filter(r => r.success && r.result !== undefined).length;
  const failed = results.filter(r => !r.success && r.error && r.error.message !== 'Skipped due to previous failure').length;
  const skipped = results.filter(r => r.error?.message === 'Skipped due to previous failure').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const completedCount = succeeded + failed;
  const avgDuration = completedCount > 0 ? totalDuration / completedCount : 0;

  return {
    total: results.length,
    succeeded,
    failed,
    skipped,
    totalDuration,
    avgDuration,
    successRate: results.length > 0 ? succeeded / results.length : 0,
  };
}
