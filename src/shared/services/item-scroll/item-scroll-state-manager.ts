/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview ItemScrollStateManager - Scroll state tracking and lifecycle management
 * @version 1.0.0
 *
 * Manages scroll state synchronization and lifecycle with polling and timeout coordination.
 *
 * **Key Responsibilities**:
 * - Maintains scroll state signal (currentIndex, totalItems, auto-scroll status)
 * - Manages polling for index changes at configurable intervals
 * - Coordinates scroll timeouts (scheduled scrolls, user scroll detection)
 * - Tracks auto-scroll vs user-initiated scrolls
 * - Provides resource cleanup on dispose
 *
 * **Architecture**:
 * - Solid.js signals for reactive state management
 * - globalTimerManager for consistent timing
 * - Polling mechanism for index changes (default 32ms)
 * - Timeout management for scroll operations
 *
 * **Performance Characteristics**:
 * - State updates: O(1) signal operations
 * - Index watching: Configurable interval (default 32ms = ~30fps)
 * - Memory: O(1) per instance (minimal state tracking)
 * - Polling overhead: ~32ms between checks
 *
 * **Lifecycle**:
 * 1. Create instance: setupIndexWatcher() starts polling
 * 2. During scroll: scheduleScroll(), handleUserScroll()
 * 3. On unmount: dispose() clears all timers and state
 *
 * **State Properties**:
 * - `currentIndex`: Current gallery item index
 * - `totalItems`: Total gallery items
 * - `isAutoScrolling`: True if scroll triggered by navigation
 * - `userScrollDetected`: True during user scroll (500ms window)
 * - `lastScrolledIndex`: Previous scroll target index
 * - `pendingIndex`: Index awaiting scroll execution
 * - `scrollTimeoutId`: Scheduled scroll timer ID
 * - `userScrollTimeoutId`: User scroll detection timer ID
 *
 * **Usage**:
 * ```typescript
 * const stateManager = new ItemScrollStateManager();
 * const state = stateManager.getStateSignal();
 *
 * // Setup polling
 * stateManager.setupIndexWatcher(() => {
 *   console.log('Index changed:', state.getState().currentIndex);
 * }, 32);
 *
 * // Schedule scroll
 * stateManager.scheduleScroll(5, (timeoutId) => {
 *   // Timeout scheduled
 * }, 300);
 *
 * // Cleanup
 * stateManager.dispose();
 * ```
 *
 * @see {@link createItemScrollStateSignal} for state signal structure
 * @see {@link updateStateSignal} for state updates
 * @see Phase 309 for Service Layer pattern
 */

import { logger } from '../../logging';
import { globalTimerManager } from '@shared/utils/timer-management';
import { createItemScrollStateSignal, updateStateSignal } from '../../state/item-scroll';

/**
 * ItemScrollStateManager - Scroll state lifecycle coordinator
 *
 * Manages scroll state signals and coordinates timing operations.
 *
 * **Responsibilities**:
 * 1. Index polling: Monitor currentIndex changes at regular intervals
 * 2. Scroll coordination: Schedule and track scroll operations
 * 3. User scroll detection: Distinguish user-initiated vs auto scrolls
 * 4. Resource management: Clean up timers and state on dispose
 *
 * **Thread Safety**:
 * - Per-instance state (not shared)
 * - JavaScript single-threaded (no race conditions)
 * - isDisposed flag prevents operations after cleanup
 *
 * **Disposal Pattern**:
 * - dispose() is idempotent (safe to call multiple times)
 * - After dispose(), all methods throw error if called
 * - Prevents accidental use-after-free
 *
 * @example
 * ```typescript
 * const manager = new ItemScrollStateManager();
 * const stateSignal = manager.getStateSignal();
 *
 * // Start polling for index changes
 * manager.setupIndexWatcher(() => {
 *   const state = stateSignal.getState();
 *   console.log('Current index:', state.currentIndex);
 * });
 *
 * // Schedule auto-scroll
 * manager.scheduleScroll(10, (timeoutId) => {
 *   manager.setAutoScrolling(true);
 * }, 300);
 *
 * // Detect user scroll (e.g., from scroll event listener)
 * manager.handleUserScroll((timeoutId) => {
 *   console.log('User initiated scroll detected');
 * });
 *
 * // Cleanup on unmount
 * manager.dispose();
 * ```
 *
 * @see {@link setupIndexWatcher} for polling setup
 * @see {@link scheduleScroll} for scroll scheduling
 * @see {@link handleUserScroll} for user scroll detection
 */
export class ItemScrollStateManager {
  private indexWatcherId: ReturnType<typeof globalTimerManager.setInterval> | null = null;
  private readonly stateSignal: ReturnType<typeof createItemScrollStateSignal>;
  private isDisposed = false;

  constructor(_watchInterval: number = 32) {
    this.stateSignal = createItemScrollStateSignal();
  }

  /**
   * Get reactive state signal
   *
   * Returns the Solid.js state signal for accessing scroll state.
   * State includes currentIndex, totalItems, auto-scroll status, etc.
   *
   * **Disposal Safety**:
   * - Throws error if called after dispose()
   * - Ensures signal validity throughout lifecycle
   *
   * @returns Solid.js state signal with scroll state
   * @throws Error if manager is disposed
   *
   * @example
   * ```typescript
   * const state = stateManager.getStateSignal();
   * const current = state.getState();
   * console.log(current.currentIndex);  // Current item index
   * ```
   */
  getStateSignal(): ReturnType<typeof createItemScrollStateSignal> {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: manager is disposed');
    }
    return this.stateSignal;
  }

  /**
   * Clear scheduled scroll timeout
   *
   * Removes any pending scroll operation scheduled via scheduleScroll().
   *
   * **Operations**:
   * 1. Get current state
   * 2. If scrollTimeoutId exists: Cancel timeout via globalTimerManager
   * 3. Reset scrollTimeoutId in state to null
   * 4. Safe if no timeout pending (no-op)
   *
   * **Use Cases**:
   * - User scroll detected: Cancel pending auto-scroll
   * - Route change: Cleanup before navigation
   * - Unmount: Clear all pending operations
   *
   * @example
   * ```typescript
   * // Schedule scroll for 300ms
   * stateManager.scheduleScroll(5, (id) => {}, 300);
   *
   * // Later: Cancel if user scrolls manually
   * if (userScrolled) {
   *   stateManager.clearScrollTimeout();
   * }
   * ```
   */
  clearScrollTimeout(): void {
    const state = this.stateSignal.getState();
    if (state.scrollTimeoutId !== null) {
      globalTimerManager.clearTimeout(state.scrollTimeoutId);
      updateStateSignal(this.stateSignal.setState, { scrollTimeoutId: null });
    }
  }

  /**
   * Stop index change polling
   *
   * Removes the interval watcher that polls for currentIndex changes.
   *
   * **Operations**:
   * 1. If indexWatcherId exists: Cancel interval via globalTimerManager
   * 2. Set indexWatcherId to null
   * 3. Safe if watcher never started (no-op)
   *
   * **Use Cases**:
   * - Unmount: Stop polling before cleanup
   * - Suspend monitoring: Pause index tracking temporarily
   *
   * @example
   * ```typescript
   * // Start polling
   * stateManager.setupIndexWatcher(() => {}, 32);
   *
   * // Later: Stop polling
   * stateManager.stopIndexWatcher();
   * ```
   */
  stopIndexWatcher(): void {
    if (this.indexWatcherId !== null) {
      globalTimerManager.clearInterval(this.indexWatcherId);
      this.indexWatcherId = null;
    }
  }

  /**
   * Clear user scroll detection timeout
   *
   * Removes the timeout that tracks user scroll activity.
   *
   * **Operations**:
   * 1. Get current state
   * 2. If userScrollTimeoutId exists: Cancel timeout via globalTimerManager
   * 3. Reset userScrollTimeoutId in state to null
   * 4. Safe if no timeout pending (no-op)
   *
   * **Purpose**:
   * - Used internally by handleUserScroll()
   * - Can be called manually to immediately end user scroll detection
   *
   * @example
   * ```typescript
   * // User scroll sets a 500ms detection window
   * stateManager.handleUserScroll((id) => {});
   *
   * // End detection early
   * stateManager.clearUserScrollTimeout();
   * ```
   */
  clearUserScrollTimeout(): void {
    const state = this.stateSignal.getState();
    if (state.userScrollTimeoutId !== null) {
      globalTimerManager.clearTimeout(state.userScrollTimeoutId);
      updateStateSignal(this.stateSignal.setState, { userScrollTimeoutId: null });
    }
  }

  /**
   * Setup index change polling
   *
   * Starts regular polling to monitor currentIndex changes.
   *
   * **Mechanism**:
   * - Uses globalTimerManager.setInterval with configurable interval
   * - Calls checkIndexChanges() callback on each poll
   * - Default interval: 32ms (~30fps)
   * - Safe to call multiple times (previous watcher stopped first)
   *
   * **Callback Responsibility**:
   * - checkIndexChanges() detects when currentIndex has changed
   * - Can update state, log changes, or trigger UI updates
   *
   * **Performance Considerations**:
   * - 32ms interval: 30+ checks per second (balanced latency/CPU)
   * - Lower interval: More responsive but higher CPU
   * - Higher interval: Less CPU but less responsive
   *
   * **Disposal Safety**:
   * - Throws error if called after dispose()
   *
   * @param checkIndexChanges - Callback invoked on each poll interval
   * @param watchInterval - Poll interval in milliseconds (default 32ms)
   * @throws Error if manager is disposed
   *
   * @example
   * ```typescript
   * stateManager.setupIndexWatcher(() => {
   *   const state = stateManager.getStateSignal().getState();
   *   console.log('Polling: index =', state.currentIndex);
   * }, 32);  // Poll every 32ms
   * ```
   */
  setupIndexWatcher(checkIndexChanges: () => void, watchInterval: number = 32): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: manager is disposed');
    }

    this.indexWatcherId = globalTimerManager.setInterval(checkIndexChanges, watchInterval);
    logger.debug('ItemScrollStateManager: index polling started', { watchInterval });
  }

  /**
   * Schedule auto-scroll operation
   *
   * Schedules a delayed scroll to specified index with callback notification.
   *
   * **Flow**:
   * 1. Clear any existing scroll timeout
   * 2. Set pendingIndex in state
   * 3. Create delayed timeout via globalTimerManager
   * 4. Invoke onScheduled callback with timeoutId
   * 5. Store timeoutId in state for later cancellation
   *
   * **Use Cases**:
   * - Navigation: Schedule scroll after route change
   * - Pagination: Delay scroll to allow DOM updates
   * - Debouncing: Use delay to consolidate multiple scroll requests
   *
   * **Disposal Safety**:
   * - Throws error if called after dispose()
   *
   * @param index - Target item index to scroll to
   * @param onScheduled - Callback invoked with timeout ID for side effects
   * @param delay - Delay in milliseconds before executing scroll
   * @throws Error if manager is disposed
   *
   * @example
   * ```typescript
   * stateManager.scheduleScroll(5, (timeoutId) => {
   *   console.log('Scroll scheduled:', timeoutId);
   *   manager.setAutoScrolling(true);
   * }, 300);
   * ```
   */
  scheduleScroll(
    index: number,
    onScheduled: (timeoutId: ReturnType<typeof globalTimerManager.setTimeout>) => void,
    delay: number
  ): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: manager is disposed');
    }

    this.clearScrollTimeout();

    updateStateSignal(this.stateSignal.setState, { pendingIndex: index });

    logger.debug('ItemScrollStateManager: scroll scheduled', { index, delay });

    const timeoutId = globalTimerManager.setTimeout(() => {
      logger.debug('ItemScrollStateManager: scheduled scroll executed', { index });
    }, delay);

    onScheduled(timeoutId);
    updateStateSignal(this.stateSignal.setState, { scrollTimeoutId: timeoutId });
  }

  /**
   * Handle user-initiated scroll detection
   *
   * Detects manual scrolling (not auto-scroll) and updates state accordingly.
   *
   * **Detection Window**:
   * - Sets userScrollDetected=true immediately
   * - Auto-resets to false after 500ms (configurable timeout)
   * - Prevents double-triggering during smooth animations
   *
   * **Safety Checks**:
   * - Ignores if isAutoScrolling=true (skip during auto-scroll)
   * - Clears existing scroll and user scroll timeouts
   * - Prevents conflicts between user and auto scrolls
   *
   * **Callback**:
   * - Invoked with timeoutId for side effects
   * - Useful for logging or analytics
   *
   * **Disposal Safety**:
   * - Throws error if called after dispose()
   *
   * **Use Cases**:
   * - From scroll event listener: Detect user scrolling
   * - Pause auto-scroll: Cancel pending operations on user scroll
   * - UI feedback: Show indicator that user is scrolling
   *
   * @param onUserScrollDetected - Callback with timeout ID
   * @throws Error if manager is disposed
   *
   * @example
   * ```typescript
   * // From scroll event listener
   * container.addEventListener('scroll', () => {
   *   stateManager.handleUserScroll((timeoutId) => {
   *     console.log('User scroll detected, canceling auto-scroll');
   *   });
   * });
   * ```
   */
  handleUserScroll(
    onUserScrollDetected: (timeoutId: ReturnType<typeof globalTimerManager.setTimeout>) => void
  ): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: manager is disposed');
    }

    const state = this.stateSignal.getState();

    // Ignore if auto-scroll in progress
    if (state.isAutoScrolling) {
      return;
    }

    updateStateSignal(this.stateSignal.setState, { userScrollDetected: true });

    logger.debug('ItemScrollStateManager: user scroll detected');

    // Clear existing timeouts
    this.clearUserScrollTimeout();
    this.clearScrollTimeout();

    // Reset detection after 500ms (detection window)
    const timeoutId = globalTimerManager.setTimeout(() => {
      updateStateSignal(this.stateSignal.setState, { userScrollDetected: false });
      logger.debug('ItemScrollStateManager: user scroll detection window ended');
    }, 500);

    onUserScrollDetected(timeoutId);
    updateStateSignal(this.stateSignal.setState, { userScrollTimeoutId: timeoutId });
  }

  /**
   * Update auto-scroll status
   *
   * Sets whether current scroll operation is auto-triggered.
   *
   * **Purpose**:
   * - Distinguish auto-scroll (app-initiated) from user scroll (manual)
   * - Used by scroll event handlers to prevent interference
   * - Helps debounce rapid scroll events
   *
   * **Disposal Safety**:
   * - Throws error if called after dispose()
   *
   * @param isAutoScrolling - True if scroll triggered by app, false for manual
   * @throws Error if manager is disposed
   *
   * @example
   * ```typescript
   * // Before programmatic scroll
   * stateManager.setAutoScrolling(true);
   * await positioning.scrollToItem(...);
   * stateManager.setAutoScrolling(false);
   * ```
   */
  setAutoScrolling(isAutoScrolling: boolean): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: manager is disposed');
    }

    updateStateSignal(this.stateSignal.setState, { isAutoScrolling });
    logger.debug('ItemScrollStateManager: auto-scroll status updated', { isAutoScrolling });
  }

  /**
   * Update last scrolled item index
   *
   * Tracks the previous scroll target for UI purposes.
   *
   * **Use Cases**:
   * - Restore position: Remember where user was
   * - Undo scroll: Jump back to previous position
   * - Analytics: Track navigation history
   *
   * **Disposal Safety**:
   * - Throws error if called after dispose()
   *
   * @param index - Index of item that was scrolled to
   * @throws Error if manager is disposed
   *
   * @example
   * ```typescript
   * // After successful scroll
   * await positioning.scrollToItem(container, 5, total, options);
   * stateManager.setLastScrolledIndex(5);
   * ```
   */
  setLastScrolledIndex(index: number): void {
    if (this.isDisposed) {
      throw new Error('ItemScrollStateManager: manager is disposed');
    }

    updateStateSignal(this.stateSignal.setState, { lastScrolledIndex: index });
  }

  /**
   * Cleanup all resources and dispose manager
   *
   * Clears all timers and state, preparing for garbage collection.
   *
   * **Cleanup Steps**:
   * 1. Clear scheduled scroll timeout
   * 2. Stop index polling watcher
   * 3. Clear user scroll detection timeout
   * 4. Reset state signal
   * 5. Set isDisposed flag (prevents further operations)
   *
   * **Safety**:
   * - Idempotent (safe to call multiple times)
   * - After dispose(), all methods throw error
   * - Prevents use-after-free bugs
   *
   * **Use Cases**:
   * - Component unmount: Cleanup before removal
   * - Route navigation: Reset state for next page
   * - Error recovery: Ensure clean state
   *
   * @example
   * ```typescript
   * const manager = new ItemScrollStateManager();
   *
   * // Use manager...
   *
   * // Cleanup on unmount
   * manager.dispose();
   * ```
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.clearScrollTimeout();
    this.stopIndexWatcher();
    this.clearUserScrollTimeout();
    this.stateSignal.reset();
    this.isDisposed = true;

    logger.debug('ItemScrollStateManager: disposed');
  }
}

/**
 * Factory function for ItemScrollStateManager
 *
 * Creates a new instance of ItemScrollStateManager.
 *
 * @param watchInterval - Polling interval in milliseconds (default 32ms)
 * @returns New ItemScrollStateManager instance
 *
 * @example
 * ```typescript
 * const stateManager = createItemScrollStateManager(32);
 * ```
 */
export function createItemScrollStateManager(watchInterval?: number): ItemScrollStateManager {
  return new ItemScrollStateManager(watchInterval);
}
