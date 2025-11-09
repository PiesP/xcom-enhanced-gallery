/**
 * Navigation State Machine for Gallery
 *
 * Explicitly manages gallery navigation state transitions via state machine
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

export interface NavigationTransitionResult {
  readonly newState: NavigationState;
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

  static transition(state: NavigationState, action: NavigationAction): NavigationTransitionResult {
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
          isDuplicate: false,
        };
    }
  }

  private static handleNavigate(
    state: NavigationState,
    payload: { targetIndex: number; source: NavigationSource; trigger: string }
  ): NavigationTransitionResult {
    const { targetIndex, source } = payload;
    const timestamp = Date.now();

    // Check for duplicate manual navigation
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
          lastTimestamp: timestamp,
        },
        isDuplicate: true,
      };
    }

    return {
      newState: {
        currentIndex: targetIndex,
        focusedIndex: targetIndex,
        lastSource: source,
        lastTimestamp: timestamp,
      },
      isDuplicate: false,
    };
  }

  private static handleSetFocus(
    state: NavigationState,
    payload: { focusIndex: number | null; source: NavigationSource }
  ): NavigationTransitionResult {
    const { focusIndex, source } = payload;
    const timestamp = Date.now();

    if (focusIndex === null) {
      return {
        newState: {
          ...state,
          focusedIndex: null,
          lastSource: source,
          lastTimestamp: timestamp,
        },
        isDuplicate: false,
      };
    }

    const isDuplicate = focusIndex === state.focusedIndex;

    return {
      newState: {
        ...state,
        focusedIndex: focusIndex,
        lastSource: source,
        lastTimestamp: timestamp,
      },
      isDuplicate,
    };
  }

  private static handleReset(): NavigationTransitionResult {
    return {
      newState: NavigationStateMachine.createInitialState(),
      isDuplicate: false,
    };
  }
}
