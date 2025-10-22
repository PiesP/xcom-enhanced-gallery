/**
 * @fileoverview Download State Machine
 * @description 다운로드 작업 상태를 명시적으로 관리하는 상태 머신
 * @version 1.0.0
 * @phase Phase A5.3 Step 2
 *
 * 상태 흐름:
 * idle ←→ queued → processing → (complete|error) → idle
 *                    ↓
 *                 CANCEL → idle
 *
 * 설계 원칙:
 * - 순수 함수 기반 (transition 메서드는 side-effect 없음)
 * - 상태는 불변 객체
 * - 모든 상태 전환은 명시적 (transition 메서드 경유)
 */

// ============================================================================
// State Types
// ============================================================================

/**
 * 다운로드 작업 상태
 */
export type DownloadStatus = 'idle' | 'queued' | 'processing';

/**
 * 다운로드 상태
 */
export interface DownloadState {
  /**
   * 현재 상태
   */
  readonly status: DownloadStatus;

  /**
   * 대기 중인 작업 ID 목록
   */
  readonly queue: readonly string[];

  /**
   * 현재 처리 중인 작업 ID
   */
  readonly activeTask: string | null;

  /**
   * 완료된 작업 개수
   */
  readonly completedCount: number;

  /**
   * 실패한 작업 개수
   */
  readonly failedCount: number;

  /**
   * 마지막 에러 메시지
   */
  readonly error: string | null;
}

// ============================================================================
// Action Types
// ============================================================================

/**
 * 다운로드 액션
 */
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
      payload: {
        taskId: string;
      };
    }
  | {
      type: 'COMPLETE';
      payload: {
        taskId: string;
      };
    }
  | {
      type: 'FAIL';
      payload: {
        taskId: string;
        error: string;
      };
    }
  | {
      type: 'CANCEL';
    }
  | {
      type: 'RESET';
    };

/**
 * 상태 전환 결과
 */
export interface TransitionResult {
  /**
   * 새로운 상태
   */
  readonly newState: DownloadState;

  /**
   * Signal 업데이트 필요 여부
   */
  readonly shouldSync: boolean;

  /**
   * 중복 작업 여부
   */
  readonly isDuplicate: boolean;

  /**
   * 유효한 전환 여부
   */
  readonly isValid: boolean;
}

// ============================================================================
// State Machine
// ============================================================================

/**
 * Download State Machine
 * 순수 함수 기반 상태 전환 로직
 */
export class DownloadStateMachine {
  /**
   * 초기 상태 생성
   */
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

  /**
   * 상태 전환
   * @param state 현재 상태
   * @param action 액션
   * @returns 전환 결과
   */
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

  /**
   * ENQUEUE 액션 처리
   * queue에 작업 추가
   */
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

    // 중복 체크
    const isDuplicate = state.queue.includes(taskId) || state.activeTask === taskId;

    if (isDuplicate) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: true,
        isValid: false,
      };
    }

    // queue에 추가
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

  /**
   * START 액션 처리
   * queue에서 작업을 꺼내서 처리 시작
   */
  private static handleStart(state: DownloadState, payload: { taskId: string }): TransitionResult {
    const { taskId } = payload;

    // queue에 있는지 확인
    const taskIndex = state.queue.indexOf(taskId);
    if (taskIndex === -1) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    // queue에서 제거하고 activeTask로 설정
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

  /**
   * COMPLETE 액션 처리
   * 작업 완료, 다음 작업이 있으면 자동으로 시작
   */
  private static handleComplete(
    state: DownloadState,
    payload: { taskId: string }
  ): TransitionResult {
    const { taskId } = payload;

    // 현재 처리 중인 작업이 맞는지 확인
    if (state.activeTask !== taskId) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    // 완료 카운트 증가
    const newCompletedCount = state.completedCount + 1;

    // queue에 다음 작업이 있는지 확인
    if (state.queue.length === 0) {
      // queue가 비어있으면 idle로 전환
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

    // queue가 있으면 다음 작업 자동 시작
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

  /**
   * FAIL 액션 처리
   * 작업 실패, 다음 작업이 있으면 자동으로 시작
   */
  private static handleFail(
    state: DownloadState,
    payload: { taskId: string; error: string }
  ): TransitionResult {
    const { taskId, error } = payload;

    // 현재 처리 중인 작업이 맞는지 확인
    if (state.activeTask !== taskId) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    // 실패 카운트 증가
    const newFailedCount = state.failedCount + 1;

    // queue에 다음 작업이 있는지 확인
    if (state.queue.length === 0) {
      // queue가 비어있으면 idle로 전환
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

    // queue가 있으면 다음 작업 자동 시작
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

  /**
   * CANCEL 액션 처리
   * queue 정리, 현재 작업은 그대로 유지
   */
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

  /**
   * RESET 액션 처리
   * 초기 상태로 완전 초기화
   */
  private static handleReset(): TransitionResult {
    return {
      newState: DownloadStateMachine.createInitialState(),
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }
}
