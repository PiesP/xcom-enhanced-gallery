/**
 * @fileoverview Keyboard debounce utilities.
 * @description Debouncing logic to throttle keyboard events by key and time interval.
 * Kept simple and dependency-free for performance-critical paths.
 */

/**
 * Internal state for keyboard debounce tracking.
 *
 * @internal
 */
interface KeyboardDebounceState {
  /** Timestamp (ms) of the last executed keyboard action */
  readonly lastExecutionTime: number;
  /** The last key that was debounced */
  readonly lastKey: string;
}

/**
 * Module-level debounce state (mutable).
 *
 * @internal
 */
let keyboardDebounceState: KeyboardDebounceState = {
  lastExecutionTime: 0,
  lastKey: '',
};

/**
 * Determines whether a keyboard action should execute based on debounce rules.
 *
 * Returns `false` if the same key was pressed within the minimum interval.
 * Otherwise, updates the state and returns `true`.
 *
 * @param key - The keyboard key identifier (e.g., 'Enter', 'ArrowUp')
 * @param minIntervalMs - Minimum time (ms) between executions of the same key
 * @returns `true` if the action should execute; `false` if debounced
 *
 * @example
 * ```typescript
 * if (shouldExecuteKeyboardAction('ArrowDown', 50)) {
 *   scrollDown();
 * }
 * ```
 */
export function shouldExecuteKeyboardAction(key: string, minIntervalMs: number): boolean {
  const now = Date.now();
  const timeSinceLastExecution = now - keyboardDebounceState.lastExecutionTime;

  // Debounce: same key within interval → reject
  if (key === keyboardDebounceState.lastKey && timeSinceLastExecution < minIntervalMs) {
    return false;
  }

  // Update state and allow execution
  keyboardDebounceState = {
    lastExecutionTime: now,
    lastKey: key,
  };
  return true;
}

/**
 * Resets the keyboard debounce state.
 *
 * Primarily used for testing to clear debounce history between test cases.
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetKeyboardDebounceState();
 * });
 * ```
 */
export function resetKeyboardDebounceState(): void {
  keyboardDebounceState = {
    lastExecutionTime: 0,
    lastKey: '',
  };
}
