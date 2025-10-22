/**
 * @fileoverview Settings State Machine
 * @description 설정 패널 모달 상태를 명시적으로 관리하는 상태 머신
 * @version 1.0.0
 * @phase Phase A5.3 Step 2
 *
 * 상태 흐름:
 * closed ←→ opening → open → closing → closed
 *  ↑↓ (force close 가능)
 *
 * 설계 원칙:
 * - 순수 함수 기반 (transition 메서드는 side-effect 없음)
 * - 상태는 불변 객체
 * - 애니메이션 상태 명시적 관리 (isAnimating)
 * - 강제 닫기로 모든 상태에서 복구 가능
 */

// ============================================================================
// State Types
// ============================================================================

/**
 * 설정 패널 상태
 */
export type SettingsStatus = 'closed' | 'opening' | 'open' | 'closing';

/**
 * 설정 상태
 */
export interface SettingsState {
  /**
   * 현재 상태
   */
  readonly status: SettingsStatus;

  /**
   * 애니메이션 진행 중 여부
   */
  readonly isAnimating: boolean;

  /**
   * 패널이 열린 횟수
   */
  readonly openCount: number;

  /**
   * 패널이 닫힌 횟수
   */
  readonly closeCount: number;
}

// ============================================================================
// Action Types
// ============================================================================

/**
 * 설정 액션
 */
export type SettingsAction =
  | {
      type: 'OPEN';
    }
  | {
      type: 'OPEN_COMPLETE';
    }
  | {
      type: 'CLOSE';
    }
  | {
      type: 'CLOSE_COMPLETE';
    }
  | {
      type: 'FORCE_CLOSE';
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
  readonly newState: SettingsState;

  /**
   * Signal 업데이트 필요 여부
   */
  readonly shouldSync: boolean;

  /**
   * 중복 액션 여부
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
 * Settings State Machine
 * 순수 함수 기반 상태 전환 로직
 */
export class SettingsStateMachine {
  /**
   * 초기 상태 생성
   */
  static createInitialState(): SettingsState {
    return {
      status: 'closed',
      isAnimating: false,
      openCount: 0,
      closeCount: 0,
    };
  }

  /**
   * 상태 전환
   * @param state 현재 상태
   * @param action 액션
   * @returns 전환 결과
   */
  static transition(state: SettingsState, action: SettingsAction): TransitionResult {
    switch (action.type) {
      case 'OPEN':
        return this.handleOpen(state);
      case 'OPEN_COMPLETE':
        return this.handleOpenComplete(state);
      case 'CLOSE':
        return this.handleClose(state);
      case 'CLOSE_COMPLETE':
        return this.handleCloseComplete(state);
      case 'FORCE_CLOSE':
        return this.handleForceClose(state);
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
   * OPEN 액션 처리
   * closed 상태에서 opening 상태로 전환
   */
  private static handleOpen(state: SettingsState): TransitionResult {
    // 이미 열려있거나 애니메이션 중이면 무시
    if (state.status !== 'closed') {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: true,
        isValid: false,
      };
    }

    return {
      newState: {
        ...state,
        status: 'opening',
        isAnimating: true,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  /**
   * OPEN_COMPLETE 액션 처리
   * opening 상태에서 open 상태로 전환
   */
  private static handleOpenComplete(state: SettingsState): TransitionResult {
    if (state.status !== 'opening') {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    const newOpenCount = state.openCount + 1;

    return {
      newState: {
        ...state,
        status: 'open',
        isAnimating: false,
        openCount: newOpenCount,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  /**
   * CLOSE 액션 처리
   * open 또는 opening 상태에서 closing 상태로 전환
   */
  private static handleClose(state: SettingsState): TransitionResult {
    // open이나 opening 상태에서만 닫을 수 있음
    if (state.status !== 'open' && state.status !== 'opening') {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: true,
        isValid: false,
      };
    }

    return {
      newState: {
        ...state,
        status: 'closing',
        isAnimating: true,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  /**
   * CLOSE_COMPLETE 액션 처리
   * closing 상태에서 closed 상태로 전환
   */
  private static handleCloseComplete(state: SettingsState): TransitionResult {
    if (state.status !== 'closing') {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: false,
        isValid: false,
      };
    }

    const newCloseCount = state.closeCount + 1;

    return {
      newState: {
        ...state,
        status: 'closed',
        isAnimating: false,
        closeCount: newCloseCount,
      },
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }

  /**
   * FORCE_CLOSE 액션 처리
   * 모든 상태에서 즉시 closed로 전환 (에러 복구용)
   */
  private static handleForceClose(state: SettingsState): TransitionResult {
    if (state.status === 'closed' && !state.isAnimating) {
      return {
        newState: state,
        shouldSync: false,
        isDuplicate: true,
        isValid: false,
      };
    }

    return {
      newState: {
        ...state,
        status: 'closed',
        isAnimating: false,
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
      newState: SettingsStateMachine.createInitialState(),
      shouldSync: true,
      isDuplicate: false,
      isValid: true,
    };
  }
}
