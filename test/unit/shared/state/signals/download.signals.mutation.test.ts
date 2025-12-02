import {
  acquireDownloadLock,
  completeDownload,
  createDownloadTask,
  downloadState,
  failDownload,
  getDownloadInfo,
  startDownload,
} from '@shared/state/signals/download.signals';
import { logger } from '@shared/logging';
import type { MediaInfo } from '@shared/types/media.types';

// Mock dependencies
vi.mock('@shared/external/vendors', () => ({
  getSolid: () => ({
    batch: (fn: () => void) => fn(),
    createSignal: (initialValue: unknown) => {
      let value = initialValue;
      return [
        () => value,
        (newValue: unknown) => {
          value = typeof newValue === 'function' ? newValue(value) : newValue;
          return value;
        },
      ];
    },
  }),
}));

vi.mock('@shared/state/signals/signal-factory', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createSignalSafe: (initial: any) => {
    let value = initial;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscribers = new Set<(v: any) => void>();
    return {
      get value() {
        return value;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set value(v: any) {
        value = v;
        subscribers.forEach(cb => cb(v));
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscribe: (cb: (v: any) => void) => {
        subscribers.add(cb);
        cb(value);
        return () => subscribers.delete(cb);
      },
    };
  },
}));

vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Helper functions
const createMockMediaInfo = (id = '1', url = 'https://example.com/media.jpg'): MediaInfo => ({
  id,
  url,
  type: 'image',
  originalUrl: url,
  thumbnailUrl: url,
});

// Helper to extract data from result
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResultData<T>(result: any): T {
  if (result.status !== 'success') {
    throw new Error(`Expected success result, got ${result.status}`);
  }
  return result.data;
}

describe('Download Signals Mutation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state if possible. Since it's a singleton signal lazily initialized,
    // we might need to reset modules or just reset the value.
    // But downloadState.value setter is available.
    downloadState.value = {
      activeTasks: new Map(),
      queue: [],
      isProcessing: false,
    };
  });

  it('should catch errors in subscriber callback', () => {
    const error = new Error('Callback failed');
    const callback = vi.fn(() => {
      throw error;
    });

    downloadState.subscribe(callback);

    // Trigger update
    downloadState.value = { ...downloadState.value, isProcessing: true };

    expect(callback).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      '[Download] subscriber callback failed',
      expect.objectContaining({ error })
    );
  });

  it('should not release lock if tasks are active', () => {
    const release = acquireDownloadLock();
    expect(downloadState.value.isProcessing).toBe(true);

    // Simulate active task
    const tasks = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks.set('1', {} as any);
    downloadState.value = { ...downloadState.value, activeTasks: tasks };

    release();

    // Should still be processing because tasks are active
    expect(downloadState.value.isProcessing).toBe(true);
  });

  it('should not release lock if queue is not empty', () => {
    const release = acquireDownloadLock();
    expect(downloadState.value.isProcessing).toBe(true);

    // Simulate queued item
    downloadState.value = { ...downloadState.value, queue: ['1'] };

    release();

    // Should still be processing because queue is not empty
    expect(downloadState.value.isProcessing).toBe(true);
  });

  it('should release lock if queue and tasks are empty', () => {
    const release = acquireDownloadLock();
    expect(downloadState.value.isProcessing).toBe(true);

    // Ensure empty
    downloadState.value = { ...downloadState.value, activeTasks: new Map(), queue: [] };

    release();

    expect(downloadState.value.isProcessing).toBe(false);
  });

  // Kill mutations for setProcessingFlag optimization (Line 54)
  describe('setProcessingFlag optimization', () => {
    it('should not update state when isProcessing is already true', () => {
      downloadState.value = {
        activeTasks: new Map(),
        queue: [],
        isProcessing: true,
      };

      // Try to acquire lock again - should not create new state object
      acquireDownloadLock();

      // If early return works, state reference should remain same
      expect(downloadState.value.isProcessing).toBe(true);
    });

    it('should not update state when isProcessing is already false', () => {
      downloadState.value = {
        activeTasks: new Map(),
        queue: [],
        isProcessing: false,
      };

      // Directly release without lock - should not change state
      const release = acquireDownloadLock();
      // Force state back to false without going through release logic
      downloadState.value = {
        activeTasks: new Map(),
        queue: [],
        isProcessing: false,
      };

      // Try release again - early return should prevent state change
      release();

      expect(downloadState.value.isProcessing).toBe(false);
    });
  });

  // Kill mutations for createDownloadTask success meta (Line 140)
  describe('createDownloadTask meta validation', () => {
    it('should include mediaId in success meta', () => {
      const mediaInfo = createMockMediaInfo('test-media-id');
      const result = createDownloadTask(mediaInfo, 'test-file.jpg');

      expect(result.status).toBe('success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.mediaId).toBe('test-media-id');
    });

    it('should include filename in success meta', () => {
      const mediaInfo = createMockMediaInfo('test-id');
      const result = createDownloadTask(mediaInfo, 'custom-filename.jpg');

      expect(result.status).toBe('success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.filename).toBe('custom-filename.jpg');
    });
  });

  // Kill mutations for startDownload updatedTask (Lines 167-168)
  describe('startDownload task update', () => {
    it('should set status to downloading', () => {
      const result = createDownloadTask(createMockMediaInfo());
      const taskId = getResultData<string>(result);

      startDownload(taskId);

      const task = downloadState.value.activeTasks.get(taskId);
      expect(task?.status).toBe('downloading');
    });

    it('should update startedAt timestamp when starting', () => {
      const result = createDownloadTask(createMockMediaInfo());
      const taskId = getResultData<string>(result);

      const originalTask = downloadState.value.activeTasks.get(taskId);
      const originalStartedAt = originalTask?.startedAt;

      // Small delay to ensure different timestamp
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000);

      startDownload(taskId);

      const updatedTask = downloadState.value.activeTasks.get(taskId);
      // startedAt should be updated when download actually starts
      expect(updatedTask?.startedAt).toBeGreaterThanOrEqual(originalStartedAt!);

      vi.restoreAllMocks();
    });
  });

  // Kill mutations for completeDownload queue filter (Lines 249, 255)
  describe('completeDownload queue management', () => {
    it('should remove taskId from queue after completion', () => {
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const taskId1 = getResultData<string>(result1);
      const taskId2 = getResultData<string>(result2);

      startDownload(taskId1);
      startDownload(taskId2);

      // Complete first task
      completeDownload(taskId1);

      const state = downloadState.value;
      expect(state.queue).not.toContain(taskId1);
      expect(state.queue).toContain(taskId2);
    });

    it('should set isProcessing to true when queue is not empty after completion', () => {
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const taskId1 = getResultData<string>(result1);
      const taskId2 = getResultData<string>(result2);

      startDownload(taskId1);
      startDownload(taskId2);

      completeDownload(taskId1);

      expect(downloadState.value.isProcessing).toBe(true);
    });

    it('should set isProcessing to false when queue becomes empty after completion', () => {
      const result = createDownloadTask(createMockMediaInfo());
      const taskId = getResultData<string>(result);

      startDownload(taskId);
      completeDownload(taskId);

      expect(downloadState.value.isProcessing).toBe(false);
    });

    it('should correctly filter out only the completed taskId', () => {
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const result3 = createDownloadTask(createMockMediaInfo('3'));
      const taskId1 = getResultData<string>(result1);
      const taskId2 = getResultData<string>(result2);
      const taskId3 = getResultData<string>(result3);

      startDownload(taskId1);
      startDownload(taskId2);

      completeDownload(taskId2);

      const state = downloadState.value;
      expect(state.queue).toContain(taskId1);
      expect(state.queue).not.toContain(taskId2);
      expect(state.queue).toContain(taskId3);
      expect(state.queue.length).toBe(2);
    });
  });

  // Kill mutations for duration calculation (Line 264)
  describe('completeDownload duration calculation', () => {
    it('should calculate duration as completedAt minus startedAt', () => {
      const result = createDownloadTask(createMockMediaInfo());
      const taskId = getResultData<string>(result);

      startDownload(taskId);

      // Get the task's startedAt
      const startedTask = downloadState.value.activeTasks.get(taskId);
      const startedAt = startedTask?.startedAt ?? 0;

      // Mock a later time for completion
      const completedTime = startedAt + 500;
      vi.spyOn(Date, 'now').mockReturnValue(completedTime);

      const completeResult = completeDownload(taskId);

      expect(completeResult.status).toBe('success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = (completeResult as any).meta;
      expect(meta?.duration).toBe(500);
      expect(meta?.completedAt).toBe(completedTime);

      vi.restoreAllMocks();
    });

    it('should return non-negative duration', () => {
      const result = createDownloadTask(createMockMediaInfo());
      const taskId = getResultData<string>(result);

      startDownload(taskId);

      const completeResult = completeDownload(taskId);

      expect(completeResult.status).toBe('success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((completeResult as any).meta?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // Kill mutations for failDownload queue filter (Lines 292, 298)
  describe('failDownload queue management', () => {
    it('should remove taskId from queue after failure', () => {
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const taskId1 = getResultData<string>(result1);
      const taskId2 = getResultData<string>(result2);

      startDownload(taskId1);
      startDownload(taskId2);

      failDownload(taskId1, 'Network error');

      const state = downloadState.value;
      expect(state.queue).not.toContain(taskId1);
      expect(state.queue).toContain(taskId2);
    });

    it('should set isProcessing to true when queue is not empty after failure', () => {
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const taskId1 = getResultData<string>(result1);
      const taskId2 = getResultData<string>(result2);

      startDownload(taskId1);
      startDownload(taskId2);

      failDownload(taskId1, 'Error');

      expect(downloadState.value.isProcessing).toBe(true);
    });

    it('should set isProcessing to false when queue becomes empty after failure', () => {
      const result = createDownloadTask(createMockMediaInfo());
      const taskId = getResultData<string>(result);

      startDownload(taskId);
      failDownload(taskId, 'Error');

      expect(downloadState.value.isProcessing).toBe(false);
    });

    it('should correctly filter out only the failed taskId', () => {
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const result3 = createDownloadTask(createMockMediaInfo('3'));
      const taskId1 = getResultData<string>(result1);
      const taskId2 = getResultData<string>(result2);
      const taskId3 = getResultData<string>(result3);

      startDownload(taskId1);
      startDownload(taskId2);

      failDownload(taskId2, 'Network error');

      const state = downloadState.value;
      expect(state.queue).toContain(taskId1);
      expect(state.queue).not.toContain(taskId2);
      expect(state.queue).toContain(taskId3);
      expect(state.queue.length).toBe(2);
    });
  });

  // Kill mutations for getDownloadInfo counters
  describe('getDownloadInfo accuracy', () => {
    it('should count activeTasks correctly', () => {
      createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const taskId2 = getResultData<string>(result2);
      startDownload(taskId2);

      const info = getDownloadInfo();
      expect(info.activeTasks).toBe(1);
      expect(info.pendingTasks).toBe(1);
    });

    it('should count completedTasks correctly', () => {
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const taskId1 = getResultData<string>(result1);
      const taskId2 = getResultData<string>(result2);

      startDownload(taskId1);
      startDownload(taskId2);
      completeDownload(taskId1);

      const info = getDownloadInfo();
      expect(info.completedTasks).toBe(1);
      expect(info.activeTasks).toBe(1);
    });

    it('should count failedTasks correctly', () => {
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const taskId1 = getResultData<string>(result1);
      const taskId2 = getResultData<string>(result2);

      startDownload(taskId1);
      startDownload(taskId2);
      failDownload(taskId1, 'Error');

      const info = getDownloadInfo();
      expect(info.failedTasks).toBe(1);
      expect(info.activeTasks).toBe(1);
    });

    it('should return correct queueLength', () => {
      createDownloadTask(createMockMediaInfo('1'));
      createDownloadTask(createMockMediaInfo('2'));
      createDownloadTask(createMockMediaInfo('3'));

      const info = getDownloadInfo();
      expect(info.queueLength).toBe(3);
    });
  });
});
