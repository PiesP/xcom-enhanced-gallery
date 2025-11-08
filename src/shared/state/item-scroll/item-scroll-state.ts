/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll State Type Definitions
 * @description Phase 150.2: Item scroll state normalization
 *
 * Normalizes item scroll state module for individual item scrolling
 * (e.g., scrolling to a specific item in gallery).
 *
 * Key tracking items:
 * - Last scrolled item index
 * - Pending scroll requests (pendingIndex)
 * - User vs auto scroll distinction
 * - Scroll failure retry count
 * - Timer IDs (cleanup purpose)
 */

/**
 * Item scroll state interface
 *
 * Tracks the state of scrolling to individual gallery items.
 * Distinguishes between user-initiated vs automatic (focus change) scrolling.
 */
export interface ItemScrollState {
  /**
   * Index of last scrolled item (>= 0)
   * -1 if no scroll history
   */
  lastScrolledIndex: number;

  /**
   * Pending scroll index
   * Next scroll target when previous scroll has not completed
   */
  pendingIndex: number | null;

  /**
   * Whether user is manually scrolling
   * true if scrolling via user input (wheelEvent etc)
   */
  userScrollDetected: boolean;

  /**
   * Whether auto scroll (focus change based) animation is in progress
   * true if scrollIntoView() animation is ongoing
   */
  isAutoScrolling: boolean;

  /**
   * Last scroll event time (Unix ms)
   * For timeout tracking and scroll completion wait
   */
  lastScrollTime: number;

  /**
   * Last user scroll (wheel) time (Unix ms)
   * For user interaction detection and auto scroll resumption decision
   */
  lastUserScrollTime: number;

  /**
   * Scroll failure retry count
   * Incremented on scrollIntoView() failure, gives up after max attempts
   */
  retryCount: number;

  /**
   * Scroll timeout ID (cleanup purpose)
   * Must clean up this timer on component unmount
   */
  scrollTimeoutId: number | null;

  /**
   * User scroll timeout ID (cleanup purpose)
   * For recovery timer cleanup after user scroll detection
   */
  userScrollTimeoutId: number | null;

  /**
   * Index watcher timer ID (cleanup purpose)
   * For item index monitoring timer cleanup during scroll
   */
  indexWatcherId: number | null;
}

/* ============================================================================
 * Constants
 * ============================================================================ */

/**
 * Initial item scroll state
 * - No scroll history (lastScrolledIndex: -1)
 * - No pending requests
 * - No user/auto scroll in progress
 * - retry count 0
 * - All timer IDs initialized to null
 */
export const INITIAL_ITEM_SCROLL_STATE: ItemScrollState = {
  lastScrolledIndex: -1,
  pendingIndex: null,
  userScrollDetected: false,
  isAutoScrolling: false,
  lastScrollTime: 0,
  lastUserScrollTime: 0,
  retryCount: 0,
  scrollTimeoutId: null,
  userScrollTimeoutId: null,
  indexWatcherId: null,
};

/* ============================================================================
 * Factories
 * ============================================================================ */

/**
 * Item scroll state creation factory
 *
 * Overrides only optional properties from initial state.
 *
 * @param overrides - Properties to override initial values (optional)
 * @returns Created ItemScrollState object
 *
 * @example
 * const state = createItemScrollState({ lastScrolledIndex: 5 });
 */
export function createItemScrollState(overrides?: Partial<ItemScrollState>): ItemScrollState {
  return {
    ...INITIAL_ITEM_SCROLL_STATE,
    ...overrides,
  };
}

/* ============================================================================
 * Updaters
 * ============================================================================ */

/**
 * Item scroll state update
 *
 * Updates only optional properties from current state.
 *
 * @param state - Current state
 * @param updates - Properties to update
 * @returns Updated new ItemScrollState object
 *
 * @example
 * const newState = updateItemScrollState(state, { lastScrolledIndex: 10 });
 */
export function updateItemScrollState(
  state: ItemScrollState,
  updates: Partial<ItemScrollState>
): ItemScrollState {
  return {
    ...state,
    ...updates,
  };
}

/**
 * Item scroll state reset
 *
 * Fully resets state to initial value (cleanup/restart purpose).
 *
 * @param _state - Current state (unused, for compatibility)
 * @returns Reset ItemScrollState object
 */
export function resetItemScrollState(_state: ItemScrollState): ItemScrollState {
  return INITIAL_ITEM_SCROLL_STATE;
}

/**
 * Scroll timer ID cleanup
 *
 * Sets all timer IDs to null on component unmount or cleanup.
 * Caller is responsible for actual timer cleanup (clearTimeout etc).
 *
 * @param state - Current state
 * @returns ItemScrollState object with timer IDs cleaned up
 *
 * @example
 * const cleanedState = clearItemScrollTimeouts(state);
 * // Then if needed:
 * if (state.scrollTimeoutId) clearTimeout(state.scrollTimeoutId);
 */
export function clearItemScrollTimeouts(state: ItemScrollState): ItemScrollState {
  return {
    ...state,
    scrollTimeoutId: null,
    userScrollTimeoutId: null,
    indexWatcherId: null,
  };
}

/* ============================================================================
 * Comparators
 * ============================================================================ */

/**
 * Item scroll state comparison (timer IDs excluded)
 *
 * Determines if there is substantial scroll state change.
 * Timer IDs are excluded from comparison (implementation detail).
 *
 * @param stateA - First state to compare
 * @param stateB - Second state to compare
 * @returns true if states are substantially identical
 *
 * @example
 * if (isSameItemScrollState(oldState, newState)) {
 *   // No substantial changes
 * }
 */
export function isSameItemScrollState(stateA: ItemScrollState, stateB: ItemScrollState): boolean {
  return (
    stateA.lastScrolledIndex === stateB.lastScrolledIndex &&
    stateA.pendingIndex === stateB.pendingIndex &&
    stateA.userScrollDetected === stateB.userScrollDetected &&
    stateA.isAutoScrolling === stateB.isAutoScrolling &&
    stateA.retryCount === stateB.retryCount
  );
}
