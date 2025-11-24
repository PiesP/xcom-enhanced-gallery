/**
 * Navigation State Machine for Gallery
 *
 * Pure function collection that exposes deterministic navigation transitions.
 */

import type { NavigationSource } from "@shared/types/navigation.types";

// ============================================================================
// State Types
// ============================================================================

export interface NavigationState {
  readonly currentIndex: number;
  readonly focusedIndex: number | null;
  readonly lastSource: NavigationSource;
  readonly lastTimestamp: number;
}

export type NavigationTrigger = "button" | "click" | "keyboard" | "scroll";

export type NavigationAction =
  | {
      type: "NAVIGATE";
      payload: {
        targetIndex: number;
        source: NavigationSource;
        trigger: NavigationTrigger;
      };
    }
  | {
      type: "SET_FOCUS";
      payload: {
        focusIndex: number | null;
        source: NavigationSource;
      };
    }
  | { type: "RESET" };

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
    currentIndex: 0,
    focusedIndex: null,
    lastSource: "auto-focus",
    lastTimestamp: Date.now(),
  };
}

function transition(
  state: NavigationState,
  action: NavigationAction,
): NavigationTransitionResult {
  switch (action.type) {
    case "NAVIGATE":
      return handleNavigate(state, action.payload);
    case "SET_FOCUS":
      return handleSetFocus(state, action.payload);
    case "RESET":
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
  },
): NavigationTransitionResult {
  const { targetIndex, source } = payload;
  const timestamp = Date.now();

  const isDuplicateManual =
    targetIndex === state.currentIndex &&
    isManualSource(source) &&
    isManualSource(state.lastSource);

  if (isDuplicateManual) {
    return createResult(
      {
        ...state,
        focusedIndex: targetIndex,
        lastTimestamp: timestamp,
      },
      true,
    );
  }

  return createResult({
    currentIndex: targetIndex,
    focusedIndex: targetIndex,
    lastSource: source,
    lastTimestamp: timestamp,
  });
}

function handleSetFocus(
  state: NavigationState,
  payload: { focusIndex: number | null; source: NavigationSource },
): NavigationTransitionResult {
  const { focusIndex, source } = payload;
  const timestamp = Date.now();

  if (focusIndex === null) {
    return createResult({
      ...state,
      focusedIndex: null,
      lastSource: source,
      lastTimestamp: timestamp,
    });
  }

  const isDuplicate = focusIndex === state.focusedIndex;

  return createResult(
    {
      ...state,
      focusedIndex: focusIndex,
      lastSource: source,
      lastTimestamp: timestamp,
    },
    isDuplicate,
  );
}

function handleReset(): NavigationTransitionResult {
  return createResult(createInitialState());
}

function isManualSource(source: NavigationSource): boolean {
  return source === "button" || source === "keyboard";
}

function createResult(
  state: NavigationState,
  isDuplicate = false,
): NavigationTransitionResult {
  return {
    newState: state,
    isDuplicate,
  };
}

export {
  createInitialState as createNavigationInitialState,
  transition as transitionNavigationState,
};
