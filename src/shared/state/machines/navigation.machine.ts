/**
 * Navigation State Machine for Gallery
 *
 * Pure function collection that exposes deterministic navigation transitions.
 *
 * Note: This machine tracks navigation metadata (source, timing) but does NOT
 * manage currentIndex/focusedIndex values directly. Those are managed by
 * gallery.signals.ts to avoid duplication and maintain single source of truth.
 */

import type { NavigationSource } from '@shared/types/navigation.types';

// ============================================================================
// State Types
// ============================================================================

export interface NavigationState {
  readonly lastSource: NavigationSource;
  readonly lastTimestamp: number;
  readonly lastNavigatedIndex: number | null;
}

export type NavigationTrigger = 'button' | 'click' | 'keyboard' | 'scroll';

export type NavigationAction =
  | {
      type: 'NAVIGATE';
      payload: {
        targetIndex: number;
        source: NavigationSource;
        trigger: NavigationTrigger;
      };
    }
  | {
      type: 'SET_FOCUS';
      payload: {
        focusIndex: number | null;
        source: NavigationSource;
      };
    }
  | { type: 'RESET' };

export interface NavigationTransitionResult {
  readonly newState: NavigationState;
  readonly isDuplicate: boolean;
}

// ============================================================================
// Public API
// ============================================================================

export const NavigationStateMachine = {
  createInitialState,
  transition,
} as const;

// ============================================================================
// Implementation
// ============================================================================

function createInitialState(): NavigationState {
  return {
    lastSource: 'auto-focus',
    lastTimestamp: Date.now(),
    lastNavigatedIndex: null,
  };
}

function transition(state: NavigationState, action: NavigationAction): NavigationTransitionResult {
  switch (action.type) {
    case 'NAVIGATE':
      return handleNavigate(state, action.payload);
    case 'SET_FOCUS':
      return handleSetFocus(state, action.payload);
    case 'RESET':
      return handleReset();
    default:
      return createResult(state);
  }
}

function handleNavigate(
  state: NavigationState,
  payload: {
    targetIndex: number;
    source: NavigationSource;
    trigger: NavigationTrigger;
  }
): NavigationTransitionResult {
  const { targetIndex, source } = payload;
  const timestamp = Date.now();

  // Detect duplicate navigation: same index, both manual sources
  const isDuplicateManual =
    targetIndex === state.lastNavigatedIndex &&
    isManualSource(source) &&
    isManualSource(state.lastSource);

  if (isDuplicateManual) {
    return createResult(
      {
        ...state,
        lastTimestamp: timestamp,
      },
      true
    );
  }

  return createResult({
    lastSource: source,
    lastTimestamp: timestamp,
    lastNavigatedIndex: targetIndex,
  });
}

function handleSetFocus(
  state: NavigationState,
  payload: { focusIndex: number | null; source: NavigationSource },
): NavigationTransitionResult {
  const { source } = payload;
  const timestamp = Date.now();

  // Focus changes don't affect navigation history, just update metadata
  return createResult({
    ...state,
    lastSource: source,
    lastTimestamp: timestamp,
  });
}

function handleReset(): NavigationTransitionResult {
  return createResult(createInitialState());
}

function isManualSource(source: NavigationSource): boolean {
  return source === 'button' || source === 'keyboard';
}

function createResult(state: NavigationState, isDuplicate = false): NavigationTransitionResult {
  return {
    newState: state,
    isDuplicate,
  };
}
