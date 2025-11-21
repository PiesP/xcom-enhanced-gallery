/**
 * Handles the DOM-side piece of gallery auto focus.
 */
import type { ItemCache, FocusTimerManager } from '@shared/state/focus';
import type { FocusTracking } from '@shared/state/focus';
import { updateFocusTracking } from '@shared/state/focus';

/**
 * Focus Applicator Service - Element focus application and timer management
 *
 * Implements the actual DOM focus application logic for the 3-stage focus system.
 * Handles:
 * - Auto-focus timer lifecycle management
 * - Focus element determination from cache
 * - Safe focus application with fallback mechanism
 * - Duplicate focus prevention
 * - Comprehensive error handling and logging
 *
 * **Algorithm Patterns**:
 * - Single timer management (one active "auto-focus" timer at a time)
 * - Duplicate detection via lastAppliedIndex comparison (O(1))
 * - Element connectivity validation (prevents ghost focus)
 * - Graceful fallback: preventScroll → standard focus
 *
 * **Integration Points**:
 * - Called by FocusStateManagerService via scheduled timer callback
 * - Reads from ItemCache for element lookup
 * - Updates FocusTracking state with applied indices
 * - Logs debug info for troubleshooting
 *
 * @example
 * ```typescript
 * const service = new FocusApplicatorService();
 *
 * // Typical usage flow:
 * 1. evaluateAndScheduleAutoFocus() - plan focus, schedule timer
 * 2. Timer fires → onApply callback → applyAutoFocus()
 * 3. Focus applied, tracking updated
 *
 * // Direct usage:
 * const newTracking = service.applyAutoFocus(
 *   5,                    // target index
 *   itemCache,            // element source
 *   focusTracking,        // current state
 *   'scroll-into-view'    // reason for logging
 * );
 * ```
 *
 * @since v1.0.0 - Phase 330 Focus System Implementation
 * @see {@link applyAutoFocus} for focus application details
 * @see {@link evaluateAndScheduleAutoFocus} for scheduling logic
 */
class FocusApplicatorServiceImpl {
  /**
   * Clear auto-focus timer
   *
   * Stops the currently scheduled auto-focus operation. Safe to call
   * even if no timer is active (no-op).
   *
   * **Use Cases**:
   * - Stop auto-focus when manual focus is applied
   * - Cleanup before disposal
   * - Force cancel pending focus operation
   *
   * **Performance**: O(1) - direct timer cancellation
   *
   * @param focusTimerManager - Timer manager instance
   *
   * @example
   * ```typescript
   * service.clearAutoFocusTimer(timerManager);
   * // Auto-focus timer is now cancelled
   * ```
   *
   * @internal Called by evaluateAndScheduleAutoFocus and state managers
   * @see {@link FocusTimerManager} for timer interface
   */
  clearAutoFocusTimer(focusTimerManager: FocusTimerManager): void {
    focusTimerManager.clearTimer('auto-focus');
  }

  /**
   * Apply auto-focus to element
   *
   * Applies focus to the target element with duplicate prevention and graceful fallback.
   *
   * **Execution Steps**:
   * 1. Check if already focused on this element (via lastAppliedIndex)
   * 2. Fetch element from cache using index
   * 3. Validate element is still connected to DOM
   * 4. Check if element already has focus (optimization)
   * 5. Apply focus with fallback mechanism:
   *    - **Primary**: element.focus({ preventScroll: true })
   *    - **Fallback**: element.focus() without options
   * 6. Update tracking with new focus index
   * 7. Log result or error
   *
   * **Duplicate Prevention**:
   * - If lastAppliedIndex === index, returns null (skip)
   * - Prevents focus thrashing and improves performance
   *
   * **Element Connectivity Check**:
   * - Verifies element.isConnected property
   * - Prevents "ghost" focus on detached elements
   * - Returns null if element not connected
   *
   * **Fallback Mechanism**:
   * - Primary: Attempts with preventScroll option (CSS scroll behavior)
   * - Fallback: If primary fails, retry without options
   * - Final: Logs warning if both attempts fail
   *
   * **State Update**:
   * - Updates FocusTracking.lastAutoFocusedIndex (which item got focus)
   * - Updates FocusTracking.lastAppliedIndex (for duplicate prevention)
   *
   * @param index - Target focus index (key in itemCache)
   * @param itemCache - Cache containing element references
   * @param focusTracking - Current focus tracking state
   * @param reason - Reason for logging (e.g., 'scroll-into-view', 'manual-nav')
   * @returns Updated FocusTracking state if focus applied, null if skipped
   *
   * @example
   * ```typescript
   * // Apply focus to item at index 5
   * const updated = service.applyAutoFocus(
   *   5,
   *   itemCache,
   *   currentTracking,
   *   'keyboard-navigation'
   * );
   *
   * if (updated) {
   *   // Focus was successfully applied
   *   state.focusTracking = updated;
   * } else {
   *   // Focus was skipped (duplicate or invalid element)
   * }
   * ```
   *
   * @see {@link FocusTracking} for state structure
   * @see {@link ItemCache} for cache interface
   * @throws None (all errors caught, logged, and gracefully handled)
   */
  applyAutoFocus(
    index: number,
    itemCache: ItemCache,
    focusTracking: FocusTracking,
    _reason: string
  ): FocusTracking | null {
    // 중복 적용 방지
    if (focusTracking.lastAppliedIndex === index) {
      return null;
    }

    const item = itemCache.getItem(index);
    const element = item?.element;

    // 요소가 연결되어 있지 않으면 중단
    if (!element?.isConnected) {
      return null;
    }

    // 이미 포커스된 요소면 상태만 업데이트
    if (document.activeElement === element) {
      return updateFocusTracking(focusTracking, {
        lastAutoFocusedIndex: index,
        lastAppliedIndex: index,
      });
    }

    // 포커스 적용 시도
    try {
      element.focus({ preventScroll: true });
    } catch {
      try {
        element.focus();
      } catch {
        return null;
      }
    }

    return updateFocusTracking(focusTracking, {
      lastAutoFocusedIndex: index,
      lastAppliedIndex: index,
    });
  }

  /**
   * Evaluate and schedule auto-focus with timer
   *
   * Core orchestration method that evaluates whether auto-focus should proceed
   * and schedules the focus application via timer.
   *
   * **Evaluation Checks** (in order):
   * 1. Clear existing timer (prevent duplicate timers)
   * 2. Check if auto-focus is enabled (shouldAutoFocus flag)
   * 3. Check if manual focus is set (overrides auto-focus)
   * 4. Validate targetIndex is not null/NaN
   * 5. Fetch target element and verify connectivity
   * 6. Check if already correctly focused (optimization)
   * 7. If all checks pass, schedule timer
   *
   * **State Management**:
   * - Clears lastAppliedIndex if target index changes (forces reapplication)
   * - Preserves other tracking state
   *
   * **Timer Scheduling**:
   * - Uses autoFocusDelay parameter (default 0)
   * - Executes onApply callback when timer fires
   * - Callback triggers applyAutoFocus() with target index and reason
   *
   * **Use Cases**:
   * - After scroll/navigation to new item
   * - When scrolling stops and new item becomes visible
   * - When focus state needs refresh
   *
   * **Performance Considerations**:
   * - O(1) timer management
   * - Early returns for failed checks (no unnecessary work)
   * - Consolidated into single timer (no overlapping timers)
   *
   * @param targetIndex - Target focus index (null if no target)
   * @param manualFocusIndex - Manual focus override (null if not set)
   * @param itemCache - Cache with element references
   * @param focusTracking - Current focus tracking state
   * @param focusTimerManager - Timer manager for scheduling
   * @param shouldAutoFocus - Enable/disable auto-focus feature
   * @param autoFocusDelay - Delay before applying focus (ms)
   * @param onApply - Callback when timer fires (receives index and reason)
   * @param reason - Reason for scheduling (for logging)
   * @returns Updated FocusTracking state
   *
   * **State Update Logic**:
   * - If targetIndex changes from lastAppliedIndex → clear lastAppliedIndex
   * - If all checks pass → schedule timer (no state update yet)
   * - Actual focus applied when timer fires
   *
   * **Fallback Checks** (returns unchanged tracking if any fail):
   * - shouldAutoFocus === false → skip scheduling
   * - manualFocusIndex !== null → skip (manual override)
   * - targetIndex === null or NaN → skip (no target)
   * - Element not connected → skip (invalid element)
   * - Already correctly focused → skip (optimization)
   *
   * @example
   * ```typescript
   * // Typical integration with visibility change
   * const updated = service.evaluateAndScheduleAutoFocus(
   *   nextVisibleIndex,    // target (e.g., 3)
   *   null,                // no manual focus
   *   itemCache,
   *   focusTracking,
   *   timerManager,
   *   true,                // auto-focus enabled
   *   50,                  // wait 50ms before applying
   *   (index, reason) => {
   *     // This runs after 50ms timer
   *     const result = service.applyAutoFocus(index, itemCache, focusTracking, reason);
   *     if (result) {
   *       state.focusTracking = result;
   *     }
   *   },
   *   'visibility-change'
   * );
   * ```
   *
   * @see {@link applyAutoFocus} for actual focus application
   * @see {@link FocusTimerManager} for timer interface
   * @see Phase 340 for performance optimization context
   */
  evaluateAndScheduleAutoFocus(
    targetIndex: number | null,
    manualFocusIndex: number | null,
    itemCache: ItemCache,
    focusTracking: FocusTracking,
    focusTimerManager: FocusTimerManager,
    shouldAutoFocus: boolean,
    autoFocusDelay: number,
    onApply: (index: number, reason: string) => void,
    reason: string
  ): FocusTracking {
    // 기존 타이머 정리
    this.clearAutoFocusTimer(focusTimerManager);

    // 자동 포커스 비활성화
    if (!shouldAutoFocus) {
      return focusTracking;
    }

    // 수동 포커스가 설정되어 있으면 자동 포커스 중단
    if (manualFocusIndex !== null) {
      return focusTracking;
    }

    // 유효한 대상 없음
    if (targetIndex === null || Number.isNaN(targetIndex)) {
      return focusTracking;
    }

    const targetItem = itemCache.getItem(targetIndex);
    const targetElement = targetItem?.element;

    // 요소가 연결되어 있지 않음
    if (!targetElement?.isConnected) {
      return focusTracking;
    }

    // 이미 올바르게 포커스된 상태
    if (
      document.activeElement === targetElement &&
      focusTracking.lastAutoFocusedIndex === targetIndex
    ) {
      return focusTracking;
    }

    // lastAppliedIndex 초기화 (인덱스 변경됨)
    let updatedTracking = focusTracking;
    if (focusTracking.lastAppliedIndex !== null && focusTracking.lastAppliedIndex !== targetIndex) {
      updatedTracking = updateFocusTracking(focusTracking, {
        lastAppliedIndex: null,
      });
    }

    // 타이머 설정
    const delay = Math.max(0, autoFocusDelay);
    focusTimerManager.setTimer(
      'auto-focus',
      () => {
        onApply(targetIndex, reason);
      },
      delay
    );

    return updatedTracking;
  }
}

/**
 * Factory function for FocusApplicatorService
 *
 * Creates a new FocusApplicatorService instance. Useful for:
 * - Dependency injection
 * - Testing (allows mocking)
 * - Clean service instantiation pattern
 *
 * **Usage**:
 * ```typescript
 * const service = createFocusApplicatorService();
 * service.applyAutoFocus(index, cache, tracking, reason);
 * ```
 *
 * @returns New FocusApplicatorService instance
 *
 * @example
 * ```typescript
 * import { createFocusApplicatorService } from '@shared/services/focus';
 *
 * const applicator = createFocusApplicatorService();
 * // Use applicator...
 * ```
 *
 * @see {@link FocusApplicatorService} for API documentation
 */
export type FocusApplicatorService = FocusApplicatorServiceImpl;

export function createFocusApplicatorService(): FocusApplicatorService {
  return new FocusApplicatorServiceImpl();
}
