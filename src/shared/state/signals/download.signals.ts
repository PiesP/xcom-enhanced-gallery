/**
 * Download state management with signals
 *
 * Provides reactive download state management using Solid.js signals.
 * Tracks download tasks, progress, and queue processing with type-safe operations.
 *
 * @module download.signals
 */

import { getErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging/logger';
import type { MediaId, MediaInfo } from '@shared/types/media.types';
import type { Result } from '@shared/types/result.types';
import { ErrorCode, failure, success } from '@shared/types/result.types';
import { createPrefixedId } from '@shared/utils/id/create-id';
import { clamp } from '@shared/utils/types/safety';
import { createSignalSafe, type SafeSignal } from './signal-factory';

type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed';

interface DownloadTask {
  readonly id: string;
  readonly mediaId: MediaId;
  readonly mediaUrl: string;
  readonly filename: string;
  readonly status: DownloadStatus;
  readonly progress: number;
  readonly error?: string;
  readonly startedAt: number;
  readonly completedAt?: number;
}

interface DownloadState {
  readonly activeTasks: ReadonlyMap<string, DownloadTask>;
  readonly queue: readonly string[];
  readonly isProcessing: boolean;
}

const INITIAL_STATE: DownloadState = {
  activeTasks: new Map(),
  queue: [],
  isProcessing: false,
};

let downloadStateSignal: SafeSignal<DownloadState> | null = null;

const getDownloadState = (): SafeSignal<DownloadState> => {
  if (!downloadStateSignal) {
    downloadStateSignal = createSignalSafe<DownloadState>(INITIAL_STATE);
  }
  return downloadStateSignal!;
};

const setProcessingFlag = (isProcessing: boolean): void => {
  const currentState = downloadState.value;
  if (currentState.isProcessing === isProcessing) {
    return;
  }
  downloadState.value = {
    ...currentState,
    isProcessing,
  };
};

export function acquireDownloadLock(): () => void {
  setProcessingFlag(true);
  return () => {
    const { queue, activeTasks } = downloadState.value;
    if (queue.length === 0 && activeTasks.size === 0) {
      setProcessingFlag(false);
    }
  };
}

export function isDownloadLocked(): boolean {
  return downloadState.value.isProcessing;
}

export const downloadState = {
  get value(): DownloadState {
    return getDownloadState().value;
  },

  set value(newState: DownloadState) {
    getDownloadState().value = newState;
  },

  subscribe(callback: (state: DownloadState) => void): () => void {
    return getDownloadState().subscribe(callback);
  },
};

// ============================================================================
// Actions
// ============================================================================

export function createDownloadTask(mediaInfo: MediaInfo, filename?: string): Result<string> {
  try {
    const mediaId = mediaInfo.id ?? createPrefixedId('temp');
    const taskId = createPrefixedId('dl');
    const task: DownloadTask = {
      id: taskId,
      mediaId: mediaId as MediaId,
      mediaUrl: mediaInfo.url,
      filename: filename ?? mediaInfo.filename ?? `media_${mediaId}`,
      status: 'pending',
      progress: 0,
      startedAt: Date.now(),
    };

    const currentState = downloadState.value;
    const newTasks = new Map(currentState.activeTasks);
    newTasks.set(taskId, task);

    downloadState.value = {
      ...currentState,
      activeTasks: newTasks,
      queue: [...currentState.queue, taskId],
    };

    __DEV__ && logger.info(`[Download] Task created: ${taskId} - ${mediaInfo.url}`);
    return success(taskId, { mediaId, filename: task.filename });
  } catch (error) {
    const errorMessage = getErrorMessage(error) || 'Unknown error';
    logger.error('[Download] Failed to create task:', errorMessage);
    return failure(errorMessage, ErrorCode.UNKNOWN, {
      cause: error,
      meta: { mediaUrl: mediaInfo.url },
    });
  }
}

export function startDownload(taskId: string): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    logger.error('[Download] Task not found:', taskId);
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId },
    });
  }

  if (task.status !== 'pending') {
    __DEV__ && logger.warn('[Download] Task is not in pending state:', task.status);
    return failure(`Task is not pending: ${taskId}`, ErrorCode.INVALID_ELEMENT, {
      meta: { taskId, currentStatus: task.status },
    });
  }

  const updatedTask: DownloadTask = { ...task, status: 'downloading', startedAt: Date.now() };
  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);

  downloadState.value = { ...currentState, activeTasks: newTasks, isProcessing: true };

  __DEV__ && logger.info(`[Download] Download started: ${taskId}`);
  return success(undefined);
}

export function updateDownloadProgress(taskId: string, progress: number): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId, requestedProgress: progress },
    });
  }

  const clampedProgress = clamp(progress, 0, 100);
  const updatedTask: DownloadTask = { ...task, progress: clampedProgress };
  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);

  downloadState.value = { ...currentState, activeTasks: newTasks };
  return success(undefined, { taskId, progress: clampedProgress });
}

export function completeDownload(taskId: string): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId },
    });
  }

  const completedAt = Date.now();
  const updatedTask: DownloadTask = {
    ...task,
    status: 'completed',
    progress: 100,
    completedAt,
  };

  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);
  const newQueue = currentState.queue.filter((id) => id !== taskId);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
    queue: newQueue,
    isProcessing: newQueue.length > 0,
  };

  __DEV__ && logger.info(`[Download] Download completed: ${taskId}`);
  return success(undefined, {
    taskId,
    mediaId: task.mediaId,
    completedAt,
    duration: completedAt - task.startedAt,
  });
}

export function failDownload(taskId: string, error: string): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId, attemptedError: error },
    });
  }

  const completedAt = Date.now();
  const updatedTask: DownloadTask = { ...task, status: 'failed', error, completedAt };
  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);
  const newQueue = currentState.queue.filter((id) => id !== taskId);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
    queue: newQueue,
    isProcessing: newQueue.length > 0,
  };

  logger.error(`[Download] download failed: ${taskId} - ${error}`);
  return success(undefined, { taskId, downloadError: error, completedAt });
}

export function removeTask(taskId: string): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId },
    });
  }

  if (task.status === 'downloading') {
    return failure(`Cannot remove active download: ${taskId}`, ErrorCode.PERMISSION_DENIED, {
      meta: { taskId, currentStatus: 'downloading' },
    });
  }

  const newTasks = new Map(currentState.activeTasks);
  newTasks.delete(taskId);

  downloadState.value = { ...currentState, activeTasks: newTasks };

  __DEV__ && logger.debug(`[Download] Task removed: ${taskId}`);
  return success(undefined);
}

export function clearCompletedTasks(): void {
  const currentState = downloadState.value;
  const newTasks = new Map<string, DownloadTask>();

  for (const [id, task] of currentState.activeTasks) {
    if (task.status === 'downloading' || task.status === 'pending') {
      newTasks.set(id, task);
    }
  }

  downloadState.value = { ...currentState, activeTasks: newTasks };
  __DEV__ && logger.info('[Download] Completed tasks cleared');
}

// ============================================================================
// Selectors
// ============================================================================

export function getDownloadTask(taskId: string): DownloadTask | null {
  return downloadState.value.activeTasks.get(taskId) ?? null;
}

export function getDownloadInfo(): {
  readonly activeTasks: number;
  readonly pendingTasks: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly queueLength: number;
  readonly isProcessing: boolean;
} {
  const state = downloadState.value;
  let activeTasks = 0;
  let pendingTasks = 0;
  let completedTasks = 0;
  let failedTasks = 0;

  for (const t of state.activeTasks.values()) {
    if (t.status === 'downloading') activeTasks++;
    else if (t.status === 'pending') pendingTasks++;
    else if (t.status === 'completed') completedTasks++;
    else if (t.status === 'failed') failedTasks++;
  }

  return {
    activeTasks,
    pendingTasks,
    completedTasks,
    failedTasks,
    queueLength: state.queue.length,
    isProcessing: state.isProcessing,
  };
}
