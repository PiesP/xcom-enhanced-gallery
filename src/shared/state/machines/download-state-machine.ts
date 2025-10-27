/**
 * Download State Machine
 *
 * 다운로드 작업 상태를 명시적으로 관리하는 상태 머신
 *
 * 상태 흐름:
 * idle ←→ queued → processing → (complete|error) → idle
 *                    ↓
 *                 CANCEL → idle
 */

export type DownloadStatus = 'idle' | 'queued' | 'processing';

export interface DownloadState {
  readonly status: DownloadStatus;
  readonly queue: readonly string[];
  readonly activeTask: string | null;
  readonly completedCount: number;
  readonly failedCount: number;
  readonly error: string | null;
}

export type DownloadAction =
  | {
      type: 'ENQUEUE';
      payload: {
        taskId: string;
        mediaId: string;
        filename: string;
        mediaUrl: string;
      };
    }
  | {
      type: 'START';
      payload: { taskId: string };
    }
  | {
      type: 'COMPLETE';
      payload: { taskId: string };
    }
  | {
      type: 'FAIL';
      payload: { taskId: string; error: string };
    }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

export interface TransitionResult {
  readonly newState: DownloadState;
  readonly shouldSync: boolean;
  readonly isDuplicate: boolean;
  readonly isValid: boolean;
}

// ============================================================================

export class DownloadStateMachine {
  static createInitialState(): DownloadState {
    return {
      status: 'idle',
      queue: [],
      activeTask: null,
      completedCount: 0,
      failedCount: 0,
      error: null,
    };
  }

  static transition(state: DownloadState, action: DownloadAction): TransitionResult {
    switch (action.type) {
      case 'ENQUEUE':
        return this.handleEnqueue(state, action.payload);
      case 'START':
        return this.handleStart(state, action.payload);
      case 'COMPLETE':
        return this.handleComplete(state, action.payload);
      case 'FAIL':
        return this.handleFail(state, action.payload);
      case 'CANCEL':
        return this.handleCancel(state);
      case 'RESET':
        return this.handleReset();
      default:
        return {
          newState: state,
          shouldSync: false,
          isDuplicate: false,
          isValid: false,
        };
    }
  }

  private static handleEnqueue(
    state: DownloadState,
    payload: {
      taskId: string;
      mediaId: string;
      filename: string;
      mediaUrl: string;
    }
  ): TransitionResult {
    const { taskId } = payload;
    const isDuplicate = state.queue.includes(taskId) || state.activeTask === taskId;

    if (isDuplicate) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: true,
        isValid: false,
      };
    }

    const newQueue = [...state.queue, taskId];
    const newStatus: DownloadStatus = newQueue.length > 0 ? 'queued' : 'idle';

    return {
      newState: {
        ...state,
        status: newStatus,
        queue: newQueue,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleStart(state: DownloadState, payload: { taskId: string }): TransitionResult {
    const { taskId } = payload;
    const taskIndex = state.queue.indexOf(taskId);

    if (taskIndex === -1) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    const newQueue = state.queue.filter((_, i) => i !== taskIndex);

    return {
      newState: {
        ...state,
        status: 'processing',
        activeTask: taskId,
        queue: newQueue,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleComplete(
    state: DownloadState,
    payload: { taskId: string }
  ): TransitionResult {
    const { taskId } = payload;

    if (state.activeTask !== taskId) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    const newCompletedCount = state.completedCount + 1;

    if (state.queue.length === 0) {
      return {
        newState: {
          ...state,
          status: 'idle',
          activeTask: null,
          completedCount: newCompletedCount,
          error: null,
        },
        shouldSync: true,
        isDuplicate: false,
        isValid: true,
      };
    }

    const nextTaskId = state.queue[0]!;
    const newQueue = state.queue.slice(1);

    return {
      newState: {
        ...state,
        status: 'processing',
        activeTask: nextTaskId,
        queue: newQueue,
        completedCount: newCompletedCount,
        error: null,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleFail(
    state: DownloadState,
    payload: { taskId: string; error: string }
  ): TransitionResult {
    const { taskId, error } = payload;

    if (state.activeTask !== taskId) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    const newFailedCount = state.failedCount + 1;

    if (state.queue.length === 0) {
      return {
        newState: {
          ...state,
          status: 'idle',
          activeTask: null,
          failedCount: newFailedCount,
          error,
        },
        shouldSync: true,
        isDuplicate: false,
        isValid: true,
      };
    }

    const nextTaskId = state.queue[0]!;
    const newQueue = state.queue.slice(1);

    return {
      newState: {
        ...state,
        status: 'processing',
        activeTask: nextTaskId,
        queue: newQueue,
        failedCount: newFailedCount,
        error,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleCancel(state: DownloadState): TransitionResult {
    if (state.queue.length === 0) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    return {
      newState: {
        ...state,
        queue: [],
        status: state.activeTask ? 'processing' : 'idle',
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  private static handleReset(): TransitionResult {
    return {
      newState: DownloadStateMachine.createInitialState(),
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }
}
