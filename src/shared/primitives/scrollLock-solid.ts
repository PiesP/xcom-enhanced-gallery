import { getSolid } from '@shared/external/vendors';
const { createEffect, onCleanup } = getSolid();
import type { Accessor } from '@shared/external/vendors';

/**
 * Scroll Lock Solid Primitive (Phase 3)
 * @description Solid.js reactive primitive for scroll locking functionality
 * @version 1.0.0 - Migrated from Preact hooks to Solid primitives
 *
 * Migration notes:
 * - Uses createEffect for reactive scroll lock management
 * - Manual lock/unlock methods for imperative control
 * - Follows external signal pattern from Focus Trap
 */

export interface ScrollLockOptions {
  reserveScrollBarGap?: boolean;
}

export interface ScrollLockResult {
  /** Manually lock scroll */
  lock: () => void;
  /** Manually unlock scroll */
  unlock: () => void;
}

/**
 * Create a scroll lock primitive (Solid.js)
 * @param enabledAccessor Reactive accessor for the enabled state
 * @param options Scroll lock options
 * @returns ScrollLockResult with manual lock/unlock methods
 */
export function createScrollLock(
  enabledAccessor: Accessor<boolean>,
  options: ScrollLockOptions = {}
): ScrollLockResult {
  let originalOverflow = '';
  let originalPaddingRight = '';
  let isLocked = false;

  /**
   * Calculate scrollbar width for gap reservation
   */
  function getScrollBarWidth(): number {
    const scrollDiv = document.createElement('div');
    scrollDiv.style.cssText =
      'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
    document.body.appendChild(scrollDiv);
    const scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollBarWidth;
  }

  /**
   * Apply scroll lock to body
   */
  function applyLock() {
    if (isLocked) return;

    // Save original styles
    const bodyStyle = window.getComputedStyle(document.body);
    originalOverflow = bodyStyle.overflow;
    originalPaddingRight = bodyStyle.paddingRight;

    // Apply scroll lock
    document.body.style.overflow = 'hidden';

    // Reserve scrollbar gap if needed
    if (options.reserveScrollBarGap) {
      const scrollBarWidth = getScrollBarWidth();
      if (scrollBarWidth > 0) {
        const currentPaddingRight = parseInt(originalPaddingRight) || 0;
        document.body.style.paddingRight = `${currentPaddingRight + scrollBarWidth}px`;
      }
    }

    isLocked = true;
  }

  /**
   * Remove scroll lock from body
   */
  function removeLock() {
    if (!isLocked) return;

    // Restore original styles
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;

    isLocked = false;
  }

  // Effect: Reactive scroll lock based on enabled signal
  createEffect(() => {
    const shouldLock = enabledAccessor();

    if (shouldLock) {
      applyLock();
    } else {
      removeLock();
    }
  });

  // Cleanup on disposal
  onCleanup(() => {
    removeLock();
  });

  return {
    lock: applyLock,
    unlock: removeLock,
  };
}
