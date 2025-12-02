import { executePreloadStrategy, type PreloadTask } from '@/bootstrap/preload';

// Mock logger
vi.mock('@shared/logging', () => ({
  logger: { debug: vi.fn(), warn: vi.fn() },
}));

describe('executePreloadStrategy', () => {
  it('should execute all tasks sequentially', async () => {
    const task1Loader = vi.fn().mockResolvedValue(undefined);
    const task2Loader = vi.fn().mockResolvedValue(undefined);

    const tasks: PreloadTask[] = [
      { label: 'task1', loader: task1Loader },
      { label: 'task2', loader: task2Loader },
    ];

    const deps = { logWarn: vi.fn() };

    await executePreloadStrategy(tasks, deps);

    expect(task1Loader).toHaveBeenCalled();
    expect(task2Loader).toHaveBeenCalled();
    expect(deps.logWarn).not.toHaveBeenCalled();
  });

  it('should handle task failure gracefully and continue', async () => {
    const task1Loader = vi.fn().mockRejectedValue(new Error('fail'));
    const task2Loader = vi.fn().mockResolvedValue(undefined);

    const tasks: PreloadTask[] = [
      { label: 'task1', loader: task1Loader },
      { label: 'task2', loader: task2Loader },
    ];

    const deps = { logWarn: vi.fn() };

    await executePreloadStrategy(tasks, deps);

    expect(task1Loader).toHaveBeenCalled();
    expect(deps.logWarn).toHaveBeenCalledWith(
      expect.stringContaining('task1 preload failed'),
      expect.any(Error)
    );
    expect(task2Loader).toHaveBeenCalled();
  });

  it('should use default dependencies if none provided', async () => {
    // We can't easily spy on the default deps inside the module without exporting them or mocking the logger.
    // Since we mocked the logger, we can check if logger.warn is called when a task fails.
    const { logger } = await import('@shared/logging');

    const task1Loader = vi.fn().mockRejectedValue(new Error('fail'));
    const tasks: PreloadTask[] = [
      { label: 'task1', loader: task1Loader },
    ];

    await executePreloadStrategy(tasks);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('task1 preload failed'),
      expect.any(Error)
    );
  });
});
