import {
  acquireDownloadLock,
  clearCompletedTasks,
  completeDownload,
  createDownloadTask,
  downloadState,
  failDownload,
  getDownloadInfo,
  getDownloadTask,
  isDownloadLocked,
  removeTask,
  startDownload,
  updateDownloadProgress,
} from '@shared/state/signals/download.signals';
import type { MediaInfo } from '@shared/types/media.types';
import type { Result, ResultSuccess } from '@shared/types/result.types';

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
    createEffect: (effect: () => void) => {
      effect();
      return () => {};
    },
    createRoot: (fn: (dispose: () => void) => unknown) => fn(() => {}),
  }),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Type guard for Result success
function isResultSuccess<T>(result: Result<T>): result is ResultSuccess<T> {
  return result.status === 'success';
}

// Extract data from successful result
function getResultData<T>(result: Result<T>): T {
  if (!isResultSuccess(result)) {
    throw new Error(`Expected success result, got ${result.status}`);
  }
  return result.data;
}

// Helper to reset download state
function resetDownloadState(): void {
  // Clear the state directly for testing
  downloadState.value = {
    activeTasks: new Map(),
    queue: [],
    isProcessing: false,
  };
}

describe('Download Signals', () => {
  const createMockMediaInfo = (id = '1', url = 'https://example.com/media.jpg'): MediaInfo => ({
    id,
    url,
    type: 'image',
    originalUrl: url,
    thumbnailUrl: url,
  });

  beforeEach(() => {
    resetDownloadState();
    vi.clearAllMocks();
  });

  describe('createDownloadTask', () => {
    it('should create a download task with provided media info', () => {
      const mediaInfo = createMockMediaInfo();
      const result = createDownloadTask(mediaInfo, 'test-file.jpg');

      expect(result.status).toBe('success');
      expect(getResultData(result)).toBeDefined();
      expect(typeof getResultData(result)).toBe('string');
      const data = getResultData(result);
      expect(data).toMatch(/^dl_/);
      // Validate that the task contains expected mediaId and filename
      const task = getDownloadTask(data);
      expect(task).not.toBeNull();
      expect(task?.filename).toBe('test-file.jpg');
      expect(task?.mediaId).toBe(mediaInfo.id);
    });

    it('should create a download task without explicit filename', () => {
      const mediaInfo = createMockMediaInfo();
      const result = createDownloadTask(mediaInfo);

      expect(result.status).toBe('success');
      expect(getResultData(result)).toBeDefined();
    });

    it('should add task to queue', () => {
      const mediaInfo = createMockMediaInfo();
      const result = createDownloadTask(mediaInfo);

      expect(result.status).toBe('success');
      const state = downloadState.value;
      expect(state.queue.length).toBe(1);
      expect(state.queue[0]).toBe(getResultData(result));
    });

    it('should create task with empty id', () => {
      const mediaInfo: MediaInfo = {
        id: '',
        url: 'https://example.com/media.jpg',
        type: 'image',
        originalUrl: 'https://example.com/media.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      };
      const result = createDownloadTask(mediaInfo);

      expect(result.status).toBe('success');
      expect(getResultData(result)).toBeDefined();
    });

    it('should create multiple tasks', () => {
      createDownloadTask(createMockMediaInfo('1'));
      createDownloadTask(createMockMediaInfo('2'));
      createDownloadTask(createMockMediaInfo('3'));

      const state = downloadState.value;
      expect(state.activeTasks.size).toBe(3);
      expect(state.queue.length).toBe(3);
    });

    it('should generate fallback mediaId when missing', () => {
      const stubbedNow = 1_704_000_000_000;
      const stubbedRandom = 0.123456789;
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(stubbedNow);
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(stubbedRandom);

      try {
        const baseMediaInfo = createMockMediaInfo('fallback-test');
        const mediaInfo = {
          ...baseMediaInfo,
          id: undefined as unknown as MediaInfo['id'],
        } as MediaInfo;

        const result = createDownloadTask(mediaInfo);
        expect(result.status).toBe('success');

        const taskId = getResultData(result);
        const task = getDownloadTask(taskId);
        const randomSuffix = stubbedRandom.toString(36).substring(2, 11);
        const expectedMediaId = `temp_${stubbedNow}_${randomSuffix}`;
        const expectedTaskId = `dl_${stubbedNow}_${randomSuffix}`;

        expect(taskId).toBe(expectedTaskId);
        expect(task?.mediaId).toBe(expectedMediaId);
        expect(task?.filename).toBe(`media_${expectedMediaId}`);
      } finally {
        nowSpy.mockRestore();
        randomSpy.mockRestore();
      }
    });

    it('should return failure when media info access throws', () => {
      const baseMediaInfo = createMockMediaInfo('error-test');
      let firstAccess = true;
      const faultyMediaInfo = { ...baseMediaInfo } as MediaInfo;
      Object.defineProperty(faultyMediaInfo, 'url', {
        configurable: true,
        get() {
          if (firstAccess) {
            firstAccess = false;
            throw new Error('url accessor failure');
          }
          return baseMediaInfo.url;
        },
      });

      const result = createDownloadTask(faultyMediaInfo);
      expect(result.status).toBe('error');
      expect(result.error).toContain('url accessor failure');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.mediaUrl).toBe(baseMediaInfo.url);
    });
  });

  describe('startDownload', () => {
    it('should start a pending download', () => {
      const result = createDownloadTask(createMockMediaInfo());
      expect(result.status).toBe('success');

      const startResult = startDownload(getResultData(result));
      expect(startResult.status).toBe('success');

      const task = getDownloadTask(getResultData(result));
      expect(task?.status).toBe('downloading');
    });

    it('should return failure for non-existent task', () => {
      const result = startDownload('non-existent-id');
      expect(result.status).not.toBe('success');
      expect(result.error).toContain('Task not found');
      // Ensure meta includes taskId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.taskId).toBe('non-existent-id');
    });

    it('should return failure if task is not pending', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));

      // Try to start again
      const result = startDownload(getResultData(createResult));
      expect(result.status).not.toBe('success');
      expect(result.error).toContain('not pending');
    });

    it('should set isProcessing to true', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));

      const state = downloadState.value;
      expect(state.isProcessing).toBe(true);
    });
  });

  describe('updateDownloadProgress', () => {
    it('should update progress for existing task', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));

      const result = updateDownloadProgress(getResultData(createResult), 50);
      expect(result.status).toBe('success');
      // Validate returned progress and taskId are present
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.taskId).toBe(getResultData(createResult));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.progress).toBe(50);

      const task = getDownloadTask(getResultData(createResult));
      expect(task?.progress).toBe(50);
    });

    it('should clamp progress to 0-100', () => {
      const createResult = createDownloadTask(createMockMediaInfo());

      updateDownloadProgress(getResultData(createResult), -10);
      expect(getDownloadTask(getResultData(createResult))?.progress).toBe(0);

      updateDownloadProgress(getResultData(createResult), 150);
      expect(getDownloadTask(getResultData(createResult))?.progress).toBe(100);
    });

    it('should return failure for non-existent task', () => {
      const result = updateDownloadProgress('non-existent', 50);
      expect(result.status).not.toBe('success');
      // Ensure meta includes taskId and requestedProgress
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.taskId).toBe('non-existent');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.requestedProgress).toBe(50);
    });
  });

  describe('completeDownload', () => {
    it('should complete a download task', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));

      const result = completeDownload(getResultData(createResult));
      expect(result.status).toBe('success');
      // Validate returned meta contains details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.taskId).toBe(getResultData(createResult));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.mediaId).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.completedAt).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.duration).toBeGreaterThanOrEqual(0);

      const task = getDownloadTask(getResultData(createResult));
      expect(task?.status).toBe('completed');
      expect(task?.progress).toBe(100);
      expect(task?.completedAt).toBeDefined();
    });

    it('should remove task from queue', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));

      completeDownload(getResultData(createResult));

      const state = downloadState.value;
      expect(state.queue).not.toContain(getResultData(createResult));
    });

    it('should return failure for non-existent task', () => {
      const result = completeDownload('non-existent');
      expect(result.status).not.toBe('success');
      // Ensure meta includes taskId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.taskId).toBe('non-existent');
    });
  });

  describe('failDownload', () => {
    it('should mark download as failed', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));

      const result = failDownload(getResultData(createResult), 'Network error');
      expect(result.status).toBe('success');

      const task = getDownloadTask(getResultData(createResult));
      expect(task?.status).toBe('failed');
      expect(task?.error).toBe('Network error');
      // Verify meta in the returned success
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.taskId).toBe(getResultData(createResult));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.downloadError).toBe('Network error');
    });

    it('should return failure for non-existent task', () => {
      const result = failDownload('non-existent', 'Error');
      expect(result.status).not.toBe('success');
      // Ensure meta includes taskId and attemptedError
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.taskId).toBe('non-existent');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.attemptedError).toBe('Error');
    });
  });

  describe('removeTask', () => {
    it('should remove completed task', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));
      completeDownload(getResultData(createResult));

      const result = removeTask(getResultData(createResult));
      expect(result.status).toBe('success');

      const task = getDownloadTask(getResultData(createResult));
      expect(task).toBeNull();
    });

    it('should remove failed task', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));
      failDownload(getResultData(createResult), 'Error');

      const result = removeTask(getResultData(createResult));
      expect(result.status).toBe('success');
    });

    it('should not remove actively downloading task', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));

      const result = removeTask(getResultData(createResult));
      expect(result.status).not.toBe('success');
      expect(result.error).toContain('Cannot remove active download');
      // Check that meta contains currentStatus
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.currentStatus).toBe('downloading');
    });

    it('should return failure for non-existent task', () => {
      const result = removeTask('non-existent');
      expect(result.status).not.toBe('success');
      // Ensure meta includes taskId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).meta?.taskId).toBe('non-existent');
    });
  });

  describe('clearCompletedTasks', () => {
    it('should clear completed and failed tasks', () => {
      // Create and complete a task
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      startDownload(getResultData(result1));
      completeDownload(getResultData(result1));

      // Create and fail a task
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      startDownload(getResultData(result2));
      failDownload(getResultData(result2), 'Error');

      // Create an active task
      const result3 = createDownloadTask(createMockMediaInfo('3'));
      startDownload(getResultData(result3));

      clearCompletedTasks();

      const state = downloadState.value;
      expect(state.activeTasks.size).toBe(1);
      expect(getDownloadTask(getResultData(result3))).not.toBeNull();
      expect(getDownloadTask(getResultData(result1))).toBeNull();
      expect(getDownloadTask(getResultData(result2))).toBeNull();
    });

    it('should keep pending tasks', () => {
      const result = createDownloadTask(createMockMediaInfo());

      clearCompletedTasks();

      expect(getDownloadTask(getResultData(result))).not.toBeNull();
    });
  });

  describe('getDownloadTask', () => {
    it('should return task by ID', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      const task = getDownloadTask(getResultData(createResult));

      expect(task).not.toBeNull();
      expect(task?.id).toBe(getResultData(createResult));
    });

    it('should return null for non-existent task', () => {
      const task = getDownloadTask('non-existent');
      expect(task).toBeNull();
    });
  });

  describe('getDownloadInfo', () => {
    it('should return download statistics', () => {
      // Initial state
      let info = getDownloadInfo();
      expect(info.activeTasks).toBe(0);
      expect(info.pendingTasks).toBe(0);
      expect(info.completedTasks).toBe(0);
      expect(info.failedTasks).toBe(0);
      expect(info.queueLength).toBe(0);
      expect(info.isProcessing).toBe(false);

      // Create tasks with different statuses
      const result1 = createDownloadTask(createMockMediaInfo('1'));
      const result2 = createDownloadTask(createMockMediaInfo('2'));
      const result3 = createDownloadTask(createMockMediaInfo('3'));
      createDownloadTask(createMockMediaInfo('4'));

      startDownload(getResultData(result1));
      startDownload(getResultData(result2));
      completeDownload(getResultData(result2));
      startDownload(getResultData(result3));
      failDownload(getResultData(result3), 'Error');

      info = getDownloadInfo();
      expect(info.activeTasks).toBe(1); // result1 is downloading
      expect(info.pendingTasks).toBe(1); // result4 is pending
      expect(info.completedTasks).toBe(1); // result2
      expect(info.failedTasks).toBe(1); // result3
    });
  });

  describe('Download Lock', () => {
    it('should acquire and release download lock', () => {
      expect(isDownloadLocked()).toBe(false);

      const release = acquireDownloadLock();
      expect(isDownloadLocked()).toBe(true);

      release();
      expect(isDownloadLocked()).toBe(false);
    });

    it('should prevent double release', () => {
      const release = acquireDownloadLock();

      release();
      release(); // Should not throw or cause issues

      expect(isDownloadLocked()).toBe(false);
    });

    it('should consider processing state in isDownloadLocked', () => {
      const createResult = createDownloadTask(createMockMediaInfo());
      startDownload(getResultData(createResult));

      expect(isDownloadLocked()).toBe(true);
    });
  });

  describe('downloadState.subscribe', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = downloadState.subscribe(callback);

      // Subscribe should return a function
      expect(typeof unsubscribe).toBe('function');

      // Call unsubscribe without errors
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      const unsubscribe = downloadState.subscribe(errorCallback);

      // Should not throw
      expect(() => createDownloadTask(createMockMediaInfo())).not.toThrow();

      unsubscribe();
    });
  });
});
