/**
 * @fileoverview Wheel scroll guard utilities.
 * @description Helpers for controlling wheel event propagation in nested scroll containers.
 */

/**
 * Configuration options for wheel scroll guard behavior.
 *
 * @property scrollableSelector - CSS selector for finding scrollable ancestors
 * @property tolerance - Pixel tolerance for boundary checks (default: 1)
 */
export interface WheelScrollGuardOptions {
  /** Selector used to find the nearest scrollable ancestor. */
  readonly scrollableSelector: string;
  /** Pixel tolerance for boundary checks. Defaults to 1. */
  readonly tolerance?: number;
}

/**
 * Finds the nearest scrollable ancestor element matching the given selector.
 *
 * @param target - The event target or element to start searching from
 * @param scrollableSelector - CSS selector for scrollable containers
 * @returns The nearest matching HTMLElement or null if not found
 * @internal
 */
function findScrollableAncestor(
  target: EventTarget | null,
  scrollableSelector: string
): HTMLElement | null {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  return target.closest<HTMLElement>(scrollableSelector);
}

/**
 * Determines whether a scrollable element can consume a wheel scroll event.
 *
 * @param element - The scrollable element to check
 * @param deltaY - The wheel event's vertical scroll delta
 * @param tolerance - Pixel tolerance for boundary detection
 * @returns True if the element can consume the scroll in the given direction
 * @internal
 */
function canConsumeWheelEvent(
  element: HTMLElement,
  deltaY: number,
  tolerance: number = 1
): boolean {
  const overflow = element.scrollHeight - element.clientHeight;

  if (overflow <= tolerance) {
    return false;
  }

  if (deltaY < 0) {
    return element.scrollTop > tolerance;
  }

  if (deltaY > 0) {
    const maxScrollTop = overflow;
    return element.scrollTop < maxScrollTop - tolerance;
  }

  return true;
}

/**
 * Determines if the browser's default wheel behavior should be allowed
 *
 * Returns true when a nested scrollable element can consume the scroll event,
 * preventing the default browser scrolling behavior from propagating further.
 *
 * @param event - The WheelEvent to evaluate
 * @param options - Configuration for scroll guard behavior
 * @returns True if default wheel behavior should be allowed
 */
export function shouldAllowWheelDefault(
  event: WheelEvent,
  options: WheelScrollGuardOptions
): boolean {
  const scrollable = findScrollableAncestor(event.target, options.scrollableSelector);
  if (!scrollable) {
    return false;
  }

  return canConsumeWheelEvent(scrollable, event.deltaY, options.tolerance);
}
