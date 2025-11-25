/**
 * Download state management with signals
 */

import { logger as rootLogger, type Logger as ILogger } from "@shared/logging";
import type { MediaId, MediaInfo } from "@shared/types/media.types";
import type { Result } from "@shared/types/result.types";
import { ErrorCode, failure, success } from "@shared/types/result.types";
import { createSignalSafe, type SafeSignal } from "./signal-factory";

// Download status
export type DownloadStatus = "pending" | "downloading" | "completed" | "failed";

export interface DownloadTask {
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

export interface DownloadState {
  readonly activeTasks: ReadonlyMap<string, DownloadTask>;
  readonly queue: readonly string[];
  readonly isProcessing: boolean;
}

// Initial state
const INITIAL_STATE: DownloadState = {
  activeTasks: new Map(),
  queue: [],
  isProcessing: false,
};

// Lazy-initialized signal
let downloadStateSignal: SafeSignal<DownloadState> | null = null;

// Logger instance
const logger: ILogger = rootLogger;

// Manual processing depth to gate UI interactions during ad-hoc downloads
let manualProcessingDepth = 0;

function getDownloadState(): SafeSignal<DownloadState> {
  if (!downloadStateSignal) {
    downloadStateSignal = createSignalSafe<DownloadState>(INITIAL_STATE);
  }
  return downloadStateSignal!;
}

function setProcessingFlag(isProcessing: boolean): void {
  const currentState = downloadState.value;
  if (currentState.isProcessing === isProcessing) {
    return;
  }
  downloadState.value = {
    ...currentState,
    isProcessing,
  };
}

function releaseManualProcessing(): void {
  if (manualProcessingDepth > 0) {
    manualProcessingDepth -= 1;
  }

  if (manualProcessingDepth > 0) {
    return;
  }

  const { queue } = downloadState.value;
  setProcessingFlag(queue.length > 0);
}

export function acquireDownloadLock(): () => void {
  manualProcessingDepth += 1;
  if (manualProcessingDepth === 1) {
    setProcessingFlag(true);
  }

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    releaseManualProcessing();
  };
}

export function isDownloadLocked(): boolean {
  return manualProcessingDepth > 0 || downloadState.value.isProcessing;
}

// ============================================================================
// Download State Accessor
// ============================================================================

/**
 * Download state accessor with subscription support
 */
export const downloadState = {
  get value(): DownloadState {
    return getDownloadState().value;
  },

  set value(newState: DownloadState) {
    getDownloadState().value = newState;
  },

  subscribe(callback: (state: DownloadState) => void): () => void {
    return getDownloadState().subscribe((state) => {
      try {
        callback(state);
      } catch (error) {
        logger.warn("[Download] subscriber callback failed", { error });
      }
    });
  },
};

// ============================================================================
// Actions
// ============================================================================

/**
 * Create a download task
 */
export function createDownloadTask(
  mediaInfo: MediaInfo,
  filename?: string,
): Result<string> {
  try {
    // Generate temp ID if mediaInfo.id is missing
    const mediaId =
      mediaInfo.id ??
      `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const taskId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task: DownloadTask = {
      id: taskId,
      mediaId: mediaId as MediaId,
      mediaUrl: mediaInfo.url,
      filename: filename ?? mediaInfo.filename ?? `media_${mediaId}`,
      status: "pending",
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

    logger.info(`[Download] Task created: ${taskId} - ${mediaInfo.url}`);

    return success(taskId, { mediaId, filename: task.filename });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("[Download] Failed to create task:", errorMsg);
    return failure(errorMsg, ErrorCode.UNKNOWN, {
      cause: error,
      meta: { mediaUrl: mediaInfo.url },
    });
  }
}

/**
 * Start download
 */
export function startDownload(taskId: string): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    logger.error("[Download] Task not found:", taskId);
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId },
    });
  }

  if (task.status !== "pending") {
    logger.warn("[Download] Task is not in pending state:", task.status);
    return failure(
      `Task is not pending: ${taskId}`,
      ErrorCode.INVALID_ELEMENT,
      {
        meta: { taskId, currentStatus: task.status },
      },
    );
  }

  const updatedTask: DownloadTask = {
    ...task,
    status: "downloading",
    startedAt: Date.now(),
  };

  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
    isProcessing: true,
  };

  logger.info(`[Download] Download started: ${taskId}`);

  return success(undefined);
}

/**
 * Update download progress
 */
export function updateDownloadProgress(
  taskId: string,
  progress: number,
): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId, requestedProgress: progress },
    });
  }

  const clampedProgress = Math.max(0, Math.min(100, progress));
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
 * Mark download as completed
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
    status: "completed",
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

  logger.info(`[Download] Download completed: ${taskId}`);

  return success(undefined, {
    taskId,
    mediaId: task.mediaId,
    completedAt,
    duration: completedAt - task.startedAt,
  });
}

/**
 * Download failure
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
    status: "failed",
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
 * Remove a task (must be completed or failed)
 */
export function removeTask(taskId: string): Result<void> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    return failure(`Task not found: ${taskId}`, ErrorCode.ELEMENT_NOT_FOUND, {
      meta: { taskId },
    });
  }

  if (task.status === "downloading") {
    return failure(
      `Cannot remove active download: ${taskId}`,
      ErrorCode.PERMISSION_DENIED,
      {
        meta: { taskId, currentStatus: "downloading" },
      },
    );
  }

  const newTasks = new Map(currentState.activeTasks);
  newTasks.delete(taskId);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
  };

  logger.debug(`[Download] Task removed: ${taskId}`);

  return success(undefined);
}

/**
 * Clear completed tasks
 */
export function clearCompletedTasks(): void {
  const currentState = downloadState.value;
  const newTasks = new Map<string, DownloadTask>();

  for (const [id, task] of currentState.activeTasks) {
    if (task.status === "downloading" || task.status === "pending") {
      newTasks.set(id, task);
    }
  }

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
  };

  logger.info("[Download] Completed tasks cleared");
}

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get task by ID
 */
export function getDownloadTask(taskId: string): DownloadTask | null {
  return downloadState.value.activeTasks.get(taskId) ?? null;
}

/**
 * Get download status summary
 */
export function getDownloadInfo(): {
  isAnyDownloading: boolean;
  currentCount: number;
  totalCount: number;
  totalTasks: number;
  activeTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  queueLength: number;
  isProcessing: boolean;
} {
  const state = downloadState.value;
  const tasks = Array.from(state.activeTasks.values());

  return {
    isAnyDownloading: tasks.some((t) => t.status === "downloading"),
    currentCount: tasks.filter((t) => t.status === "downloading").length,
    totalCount: tasks.length,
    totalTasks: tasks.length,
    activeTasks: tasks.filter((t) => t.status === "downloading").length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    failedTasks: tasks.filter((t) => t.status === "failed").length,
    queueLength: state.queue.length,
    isProcessing: state.isProcessing,
  };
}
