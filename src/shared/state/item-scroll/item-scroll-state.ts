/** Item scroll state representation for gallery bookkeeping. */

/** Tracks the current scroll bookkeeping for gallery items. */
export interface ItemScrollState {
  /** Index of the last item we scrolled to. */
  lastScrolledIndex: number;
  /** Item index waiting to be scrolled next. */
  pendingIndex: number | null;
  /** Guard that suppresses auto scroll while the user is interacting. */
  userScrollDetected: boolean;
  /** Flags a programmatic scroll currently running. */
  isAutoScrolling: boolean;
  /** Timeout id used to cancel delayed auto scroll work. */
  scrollTimeoutId: number | null;
  /** Timeout id used to clear the user scroll guard. */
  userScrollTimeoutId: number | null;
  /** Interval id that observes index changes for delayed updates. */
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
 * - All timer IDs initialized to null
 */
export const INITIAL_ITEM_SCROLL_STATE: ItemScrollState = {
  lastScrolledIndex: -1,
  pendingIndex: null,
  userScrollDetected: false,
  isAutoScrolling: false,
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
 * Scroll timer ID cleanup
 *
 * Sets all timer IDs to null on component unmount or cleanup.
 * Caller is responsible for actual timer cleanup (clearTimeout etc).
 *
 * @param state - Current state
 * @returns ItemScrollState object with timer IDs cleaned up
 */
export function clearItemScrollTimeouts(state: ItemScrollState): ItemScrollState {
  return {
    ...state,
    scrollTimeoutId: null,
    userScrollTimeoutId: null,
    indexWatcherId: null,
  };
}
