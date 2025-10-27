/**
 * Toast State Machine
 *
 * 토스트 알림 상태를 명시적으로 관리하는 상태 머신
 *
 * 상태 흐름:
 * idle → showing → waiting → (idle | showing)
 *           ↓ (즉시 dismiss)
 *         idle
 */

export type ToastStatus = 'idle' | 'showing' | 'waiting';

export interface ToastItem {
  readonly id: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly title: string;
  readonly message: string;
  readonly duration?: number;
  readonly actionText?: string;
  readonly onAction?: () => void;
}

export interface ToastState {
  readonly status: ToastStatus;
  readonly activeToast: ToastItem | null;
  readonly queue: readonly ToastItem[];
  readonly shownCount: number;
  readonly dismissedCount: number;
}

export type ToastAction =
  | {
      type: 'ENQUEUE';
      payload: { toast: ToastItem };
    }
  | { type: 'SHOWN' }
  | { type: 'DISMISS' }
  | { type: 'DISMISS_ALL' }
  | { type: 'RESET' };

export interface TransitionResult {
  readonly newState: ToastState;
  readonly shouldSync: boolean;
  readonly isDuplicate: boolean;
  readonly isValid: boolean;
}

// ============================================================================

export class ToastStateMachine {
  static createInitialState(): ToastState {
    return {
      status: 'idle',
      activeToast: null,
      queue: [],
      shownCount: 0,
      dismissedCount: 0,
    };
  }

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

  private static handleEnqueue(state: ToastState, payload: { toast: ToastItem }): TransitionResult {
    const { toast } = payload;

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

  private static handleDismiss(state: ToastState): TransitionResult {
    if (state.activeToast === null) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    const newDismissedCount = state.dismissedCount + 1;

    if (state.queue.length === 0) {
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

  private static handleReset(): TransitionResult {
    return {
      newState: ToastStateMachine.createInitialState(),
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }
}
