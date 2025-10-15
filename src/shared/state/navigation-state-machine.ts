/**
 * Navigation State Machine for Gallery
 * @description 갤러리 네비게이션 상태 전환을 명시적으로 관리하는 상태 머신
 * @version 1.0.0
 * @phase Phase 77
 */

import type { NavigationSource } from './types/navigation-types';

// ============================================================================
// State Types
// ============================================================================

/**
 * Navigation state
 * 현재 네비게이션 상태를 나타냄
 */
export interface NavigationState {
  /**
   * 현재 인덱스
   */
  readonly currentIndex: number;

  /**
   * 포커스된 인덱스 (null이면 포커스 없음)
   */
  readonly focusedIndex: number | null;

  /**
   * 마지막 네비게이션 소스
   */
  readonly lastSource: NavigationSource;

  /**
   * 마지막 네비게이션 타임스탬프
   */
  readonly lastTimestamp: number;
}

/**
 * Navigation action
 * 상태 전환을 일으키는 액션
 */
export type NavigationAction =
  | {
      type: 'NAVIGATE';
      payload: {
        targetIndex: number;
        source: NavigationSource;
        trigger: 'button' | 'click' | 'keyboard';
      };
    }
  | {
      type: 'SET_FOCUS';
      payload: {
        focusIndex: number | null;
        source: NavigationSource;
      };
    }
  | {
      type: 'RESET';
    };

/**
 * State transition result
 */
export interface TransitionResult {
  /**
   * 새로운 상태
   */
  readonly newState: NavigationState;

  /**
   * 동기화 필요 여부
   */
  readonly shouldSync: boolean;

  /**
   * 중복 네비게이션 여부
   */
  readonly isDuplicate: boolean;
}

// ============================================================================
// State Machine
// ============================================================================

/**
 * Navigation State Machine
 * 순수 함수 기반 상태 전환 로직
 */
export class NavigationStateMachine {
  /**
   * 초기 상태 생성
   */
  static createInitialState(): NavigationState {
    return {
      currentIndex: 0,
      focusedIndex: null,
      lastSource: 'auto-focus',
      lastTimestamp: Date.now(),
    };
  }

  /**
   * 상태 전환
   * @param state 현재 상태
   * @param action 액션
   * @returns 전환 결과
   */
  static transition(state: NavigationState, action: NavigationAction): TransitionResult {
    switch (action.type) {
      case 'NAVIGATE':
        return this.handleNavigate(state, action.payload);
      case 'SET_FOCUS':
        return this.handleSetFocus(state, action.payload);
      case 'RESET':
        return this.handleReset();
      default:
        return {
          newState: state,
          shouldSync: false,
          isDuplicate: false,
        };
    }
  }

  /**
   * NAVIGATE 액션 처리
   */
  private static handleNavigate(
    state: NavigationState,
    payload: { targetIndex: number; source: NavigationSource; trigger: string }
  ): TransitionResult {
    const { targetIndex, source } = payload;

    // 중복 수동 네비게이션 검사
    // 조건: 같은 인덱스 + 수동 소스(button/keyboard) + 마지막도 수동
    const isDuplicateManual =
      targetIndex === state.currentIndex &&
      source !== 'auto-focus' &&
      source !== 'scroll' &&
      state.lastSource !== 'auto-focus' &&
      state.lastSource !== 'scroll';

    if (isDuplicateManual) {
      // 중복이지만 focusedIndex 동기화는 필요
      return {
        newState: {
          ...state,
          focusedIndex: targetIndex,
          lastTimestamp: Date.now(),
        },
        shouldSync: true,
        isDuplicate: true,
      };
    }

    // 정상 네비게이션
    return {
      newState: {
        currentIndex: targetIndex,
        focusedIndex: targetIndex,
        lastSource: source,
        lastTimestamp: Date.now(),
      },
      shouldSync: true,
      isDuplicate: false,
    };
  }

  /**
   * SET_FOCUS 액션 처리
   */
  private static handleSetFocus(
    state: NavigationState,
    payload: { focusIndex: number | null; source: NavigationSource }
  ): TransitionResult {
    const { focusIndex, source } = payload;

    // focusIndex가 null이면 포커스 해제
    if (focusIndex === null) {
      return {
        newState: {
          ...state,
          focusedIndex: null,
          lastSource: source,
          lastTimestamp: Date.now(),
        },
        shouldSync: false,
        isDuplicate: false,
      };
    }

    // 이미 같은 인덱스에 포커스되어 있으면 중복
    const isDuplicate = focusIndex === state.focusedIndex;

    return {
      newState: {
        ...state,
        focusedIndex: focusIndex,
        lastSource: source,
        lastTimestamp: Date.now(),
      },
      shouldSync: false,
      isDuplicate,
    };
  }

  /**
   * RESET 액션 처리
   */
  private static handleReset(): TransitionResult {
    return {
      newState: NavigationStateMachine.createInitialState(),
      shouldSync: false,
      isDuplicate: false,
    };
  }
}
