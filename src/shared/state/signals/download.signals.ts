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

// ============================================================================
// Types
// ============================================================================

/**
 * Download task status
 *
 * @remarks
 * Status transitions:
 * - pending → downloading → (completed | failed)
 * - Tasks cannot be removed while in downloading state
 */
type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed';

/**
 * Download task metadata
 *
 * @property id - Unique task identifier (prefixed with 'dl-')
 * @property mediaId - Associated media item ID
 * @property mediaUrl - Source URL for download
 * @property filename - Target filename for downloaded media
 * @property status - Current task status
 * @property progress - Download progress (0-100)
 * @property error - Error message if status is 'failed'
 * @property startedAt - Timestamp when task was created (milliseconds)
 * @property completedAt - Timestamp when task finished (milliseconds)
 */
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

/**
 * Global download state
 *
 * @property activeTasks - Map of all download tasks by task ID
 * @property queue - Ordered list of pending task IDs
 * @property isProcessing - True if any downloads are active or queued
 */
interface DownloadState {
  readonly activeTasks: ReadonlyMap<string, DownloadTask>;
  readonly queue: readonly string[];
  readonly isProcessing: boolean;
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Initial download state
 *
 * @remarks
 * Starts with no active tasks, empty queue, and processing flag set to false
 */
const INITIAL_STATE: DownloadState = {
  activeTasks: new Map(),
  queue: [],
  isProcessing: false,
};

/**
 * Lazy-initialized signal for download state
 *
 * @remarks
 * Initialized on first access to avoid unnecessary signal creation
 */
let downloadStateSignal: SafeSignal<DownloadState> | null = null;

/**
 * Get or create the download state signal
 *
 * @returns SafeSignal instance containing download state
 *
 * @remarks
 * Uses lazy initialization pattern - signal is only created on first access
 */
const getDownloadState = (): SafeSignal<DownloadState> => {
  if (!downloadStateSignal) {
    downloadStateSignal = createSignalSafe<DownloadState>(INITIAL_STATE);
  }
  return downloadStateSignal!;
};

/**
 * Update the processing flag in download state
 *
 * @param isProcessing - New processing flag value
 *
 * @remarks
 * Only updates state if the value has changed to prevent unnecessary reactivity triggers
 */
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

/**
 * Acquire a download processing lock
 *
 * @returns Cleanup function to release the lock
 *
 * @remarks
 * Sets the processing flag to true and returns a cleanup function.
 * The cleanup function only releases the lock if both queue and active tasks are empty.
 * Use this to prevent concurrent download operations.
 *
 * @example
 * ```typescript
 * const release = acquireDownloadLock();
 * try {
 *   // perform download operations
 * } finally {
 *   release();
 * }
 * ```
 */
export function acquireDownloadLock(): () => void {
  setProcessingFlag(true);

  return () => {
    const { queue, activeTasks } = downloadState.value;
    if (queue.length === 0 && activeTasks.size === 0) {
      setProcessingFlag(false);
    }
  };
}

/**
 * Check if download processing is currently locked
 *
 * @returns True if downloads are being processed, false otherwise
 *
 * @remarks
 * Returns the current value of the isProcessing flag.
 * Use this to check if downloads are active before starting new operations.
 */
export function isDownloadLocked(): boolean {
  return downloadState.value.isProcessing;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Download state accessor with subscription support
 *
 * @remarks
 * Provides read/write access to download state and subscription mechanism.
 * Error handling is delegated to component-level ErrorBoundary.
 * Use this as the primary interface for accessing download state in components.
 *
 * @example
 * ```typescript
 * // Read state
 * const state = downloadState.value;
 *
 * // Subscribe to changes
 * const unsubscribe = downloadState.subscribe((newState) => {
 *   console.log('State changed:', newState);
 * });
 * ```
 */
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

/**
 * Create a new download task
 *
 * @param mediaInfo - Media information including URL and metadata
 * @param filename - Optional custom filename (uses media filename if not provided)
 * @returns Result containing task ID on success, or error on failure
 *
 * @remarks
 * - Generates a unique task ID with 'dl-' prefix
 * - Creates temporary media ID if mediaInfo.id is missing
 * - Adds task to active tasks map and queue
 * - Initial status is 'pending'
 *
 * @internal
 *
 * @example
 * ```typescript
 * const result = createDownloadTask(mediaInfo, 'custom-name.jpg');
 * if (result.ok) {
 *   console.log('Task ID:', result.value);
 * }
 * ```
 */
export function createDownloadTask(mediaInfo: MediaInfo, filename?: string): Result<string> {
  try {
    // Generate a temp ID if mediaInfo.id is missing
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

/**
 * Start a pending download task
 *
 * @param taskId - Task ID to start
 * @returns Result indicating success or failure
 *
 * @remarks
 * - Task must be in 'pending' status
 * - Changes status to 'downloading'
 * - Sets processing flag to true
 * - Updates startedAt timestamp
 *
 * @internal
 *
 * @example
 * ```typescript
 * const result = startDownload(taskId);
 * if (!result.ok) {
 *   console.error('Failed to start:', result.error);
 * }
 * ```
 */
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

  const updatedTask: DownloadTask = {
    ...task,
    status: 'downloading',
    startedAt: Date.now(),
  };

  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
    isProcessing: true,
  };

  __DEV__ && logger.info(`[Download] Download started: ${taskId}`);

  return success(undefined);
}

/**
 * Update download progress for a task
 *
 * @param taskId - Task ID to update
 * @param progress - Progress value (automatically clamped to 0-100)
 * @returns Result indicating success or failure
 *
 * @remarks
 * - Progress is automatically clamped to valid range (0-100)
 * - Task must exist in active tasks
 * - Does not change task status
 *
 * @internal
 *
 * @example
 * ```typescript
 * const result = updateDownloadProgress(taskId, 50);
 * if (result.ok) {
 *   console.log('Progress updated:', result.meta?.progress);
 * }
 * ```
 */
export function updateDownloadProgress(taskId: string, progress: number): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId, requestedProgress: progress },
    });
  }

  const clampedProgress = clamp(progress, 0, 100);
  const updatedTask: DownloadTask = {
    ...task,
    progress: clampedProgress,
  };

  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
  };

  return success(undefined, {
    taskId,
    progress: clampedProgress,
  });
}

/**
 * Mark a download task as completed
 *
 * @param taskId - Task ID to mark as completed
 * @returns Result indicating success or failure
 *
 * @remarks
 * - Changes status to 'completed'
 * - Sets progress to 100
 * - Records completion timestamp
 * - Removes task from queue
 * - Updates processing flag based on remaining queue
 *
 * @internal
 *
 * @example
 * ```typescript
 * const result = completeDownload(taskId);
 * if (result.ok) {
 *   console.log('Duration:', result.meta?.duration);
 * }
 * ```
 */
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

/**
 * Mark a download task as failed
 *
 * @param taskId - Task ID to mark as failed
 * @param error - Error message describing the failure
 * @returns Result indicating success or failure
 *
 * @remarks
 * - Changes status to 'failed'
 * - Stores error message
 * - Records completion timestamp
 * - Removes task from queue
 * - Updates processing flag based on remaining queue
 * - Logs error message
 *
 * @internal
 *
 * @example
 * ```typescript
 * const result = failDownload(taskId, 'Network error');
 * if (result.ok) {
 *   console.log('Task failed at:', result.meta?.completedAt);
 * }
 * ```
 */
export function failDownload(taskId: string, error: string): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId, attemptedError: error },
    });
  }

  const completedAt = Date.now();
  const updatedTask: DownloadTask = {
    ...task,
    status: 'failed',
    error,
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

  logger.error(`[Download] download failed: ${taskId} - ${error}`);

  return success(undefined, {
    taskId,
    downloadError: error,
    completedAt,
  });
}

/**
 * Remove a download task from active tasks
 *
 * @param taskId - Task ID to remove
 * @returns Result indicating success or failure
 *
 * @remarks
 * - Task must NOT be in 'downloading' status
 * - Can only remove completed, failed, or pending tasks
 * - Removes task from active tasks map
 * - Does not affect queue
 *
 * @internal
 *
 * @example
 * ```typescript
 * const result = removeTask(taskId);
 * if (!result.ok) {
 *   console.error('Cannot remove:', result.error);
 * }
 * ```
 */
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

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
  };

  __DEV__ && logger.debug(`[Download] Task removed: ${taskId}`);

  return success(undefined);
}

/**
 * Clear all completed and failed tasks from active tasks
 *
 * @remarks
 * - Removes tasks with 'completed' or 'failed' status
 * - Keeps tasks with 'downloading' or 'pending' status
 * - Does not affect queue
 * - Does not affect processing flag
 *
 * @internal
 *
 * @example
 * ```typescript
 * clearCompletedTasks();
 * console.log('Completed tasks cleared');
 * ```
 */
export function clearCompletedTasks(): void {
  const currentState = downloadState.value;
  const newTasks = new Map<string, DownloadTask>();

  for (const [id, task] of currentState.activeTasks) {
    if (task.status === 'downloading' || task.status === 'pending') {
      newTasks.set(id, task);
    }
  }

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
  };

  __DEV__ && logger.info('[Download] Completed tasks cleared');
}

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get a download task by ID
 *
 * @param taskId - Task ID to retrieve
 * @returns Download task if found, null otherwise
 *
 * @remarks
 * Returns null if task does not exist in active tasks map.
 * Does not throw errors for missing tasks.
 *
 * @internal
 *
 * @example
 * ```typescript
 * const task = getDownloadTask(taskId);
 * if (task) {
 *   console.log('Status:', task.status);
 * }
 * ```
 */
export function getDownloadTask(taskId: string): DownloadTask | null {
  return downloadState.value.activeTasks.get(taskId) ?? null;
}

/**
 * Get download status summary
 *
 * @returns Object containing task counts and processing status
 *
 * @remarks
 * Provides aggregated statistics about all download tasks:
 * - activeTasks: Count of tasks in 'downloading' status
 * - pendingTasks: Count of tasks in 'pending' status
 * - completedTasks: Count of tasks in 'completed' status
 * - failedTasks: Count of tasks in 'failed' status
 * - queueLength: Number of tasks waiting in queue
 * - isProcessing: Current processing flag value
 *
 * @internal
 *
 * @example
 * ```typescript
 * const info = getDownloadInfo();
 * console.log(`Active: ${info.activeTasks}, Pending: ${info.pendingTasks}`);
 * ```
 */
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
