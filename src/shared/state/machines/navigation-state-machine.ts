/**
 * Navigation State Machine for Gallery
 *
 * 갤러리 네비게이션 상태 전환을 명시적으로 관리하는 상태 머신
 */

import type { NavigationSource } from '../../types/navigation.types';

// ============================================================================
// State Types
// ============================================================================

export interface NavigationState {
  readonly currentIndex: number;
  readonly focusedIndex: number | null;
  readonly lastSource: NavigationSource;
  readonly lastTimestamp: number;
}

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

export interface TransitionResult {
  readonly newState: NavigationState;
  readonly shouldSync: boolean;
  readonly isDuplicate: boolean;
}

// ============================================================================
// State Machine
// ============================================================================

export class NavigationStateMachine {
  static createInitialState(): NavigationState {
    return {
      currentIndex: 0,
      focusedIndex: null,
      lastSource: 'auto-focus',
      lastTimestamp: Date.now(),
    };
  }

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

  private static handleNavigate(
    state: NavigationState,
    payload: { targetIndex: number; source: NavigationSource; trigger: string }
  ): TransitionResult {
    const { targetIndex, source } = payload;

    // 중복 수동 네비게이션 검사
    const isDuplicateManual =
      targetIndex === state.currentIndex &&
      source !== 'auto-focus' &&
      source !== 'scroll' &&
      state.lastSource !== 'auto-focus' &&
      state.lastSource !== 'scroll';

    if (isDuplicateManual) {
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

  private static handleSetFocus(
    state: NavigationState,
    payload: { focusIndex: number | null; source: NavigationSource }
  ): TransitionResult {
    const { focusIndex, source } = payload;

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

  private static handleReset(): TransitionResult {
    return {
      newState: NavigationStateMachine.createInitialState(),
      shouldSync: false,
      isDuplicate: false,
    };
  }
}
