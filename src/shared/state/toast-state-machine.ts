/**
 * @fileoverview Toast State Machine
 * @description 토스트 알림 상태를 명시적으로 관리하는 상태 머신
 * @version 1.0.0
 * @phase Phase A5.3 Step 2
 *
 * 상태 흐름:
 * idle → showing → waiting → (idle | showing)
 *           ↓ (즉시 dismiss)
 *         idle
 *
 * 설계 원칙:
 * - 순수 함수 기반 (transition 메서드는 side-effect 없음)
 * - 상태는 불변 객체
 * - FIFO 큐 기반 순차 표시
 * - 자동 dismiss 타이머는 UI 계층에서 관리
 */

// ============================================================================
// State Types
// ============================================================================

/**
 * 토스트 상태
 */
export type ToastStatus = 'idle' | 'showing' | 'waiting';

/**
 * 토스트 아이템 타입
 */
export interface ToastItem {
  readonly id: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly title: string;
  readonly message: string;
  readonly duration?: number;
  readonly actionText?: string;
  readonly onAction?: () => void;
}

/**
 * 토스트 상태
 */
export interface ToastState {
  /**
   * 현재 상태
   */
  readonly status: ToastStatus;

  /**
   * 현재 표시 중인 토스트
   */
  readonly activeToast: ToastItem | null;

  /**
   * 대기 중인 토스트 목록 (FIFO)
   */
  readonly queue: readonly ToastItem[];

  /**
   * 표시된 토스트 개수
   */
  readonly shownCount: number;

  /**
   * Dismiss된 토스트 개수
   */
  readonly dismissedCount: number;
}

// ============================================================================
// Action Types
// ============================================================================

/**
 * 토스트 액션
 */
export type ToastAction =
  | {
      type: 'ENQUEUE';
      payload: {
        toast: ToastItem;
      };
    }
  | {
      type: 'SHOWN';
    }
  | {
      type: 'DISMISS';
    }
  | {
      type: 'DISMISS_ALL';
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
  readonly newState: ToastState;

  /**
   * Signal 업데이트 필요 여부
   */
  readonly shouldSync: boolean;

  /**
   * 중복 토스트 여부
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
 * Toast State Machine
 * 순수 함수 기반 상태 전환 로직
 */
export class ToastStateMachine {
  /**
   * 초기 상태 생성
   */
  static createInitialState(): ToastState {
    return {
      status: 'idle',
      activeToast: null,
      queue: [],
      shownCount: 0,
      dismissedCount: 0,
    };
  }

  /**
   * 상태 전환
   * @param state 현재 상태
   * @param action 액션
   * @returns 전환 결과
   */
  static transition(state: ToastState, action: ToastAction): TransitionResult {
    switch (action.type) {
      case 'ENQUEUE':
        return this.handleEnqueue(state, action.payload);
      case 'SHOWN':
        return this.handleShown(state);
      case 'DISMISS':
        return this.handleDismiss(state);
      case 'DISMISS_ALL':
        return this.handleDismissAll(state);
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
   * 토스트를 queue에 추가하거나 즉시 표시
   */
  private static handleEnqueue(state: ToastState, payload: { toast: ToastItem }): TransitionResult {
    const { toast } = payload;

    // 중복 토스트 체크
    const isDuplicate =
      state.activeToast?.id === toast.id || state.queue.some(t => t.id === toast.id);

    if (isDuplicate) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: true,
        isValid: false,
      };
    }

    // 현재 표시 중인 토스트가 없으면 즉시 표시
    if (state.activeToast === null) {
      return {
        newState: {
          ...state,
          status: 'showing',
          activeToast: toast,
        },
        shouldSync: true,
        isDuplicate: false,
        isValid: true,
      };
    }

    // 현재 표시 중이면 queue에 추가
    const newQueue = [...state.queue, toast];

    return {
      newState: {
        ...state,
        queue: newQueue,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  /**
   * SHOWN 액션 처리
   * 토스트 표시 애니메이션 완료, waiting 상태로 전환
   */
  private static handleShown(state: ToastState): TransitionResult {
    if (state.status !== 'showing') {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    const newShownCount = state.shownCount + 1;

    return {
      newState: {
        ...state,
        status: 'waiting',
        shownCount: newShownCount,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  /**
   * DISMISS 액션 처리
   * 토스트 제거, 다음 토스트가 있으면 자동 표시
   */
  private static handleDismiss(state: ToastState): TransitionResult {
    if (state.activeToast === null) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    // dismiss 카운트 증가
    const newDismissedCount = state.dismissedCount + 1;

    // queue에 다음 토스트가 있는지 확인
    if (state.queue.length === 0) {
      // queue가 비어있으면 idle로 전환
      return {
        newState: {
          ...state,
          status: 'idle',
          activeToast: null,
          dismissedCount: newDismissedCount,
        },
        shouldSync: true,
        isDuplicate: false,
        isValid: true,
      };
    }

    // queue가 있으면 다음 토스트 자동 표시
    const nextToast = state.queue[0]!;
    const newQueue = state.queue.slice(1);

    return {
      newState: {
        ...state,
        status: 'showing',
        activeToast: nextToast,
        queue: newQueue,
        dismissedCount: newDismissedCount,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  /**
   * DISMISS_ALL 액션 처리
   * 모든 토스트 제거
   */
  private static handleDismissAll(state: ToastState): TransitionResult {
    if (state.activeToast === null && state.queue.length === 0) {
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
        status: 'idle',
        activeToast: null,
        queue: [],
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
      newState: ToastStateMachine.createInitialState(),
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }
}
