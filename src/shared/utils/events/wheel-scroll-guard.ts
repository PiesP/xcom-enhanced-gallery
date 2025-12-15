/**
 * @fileoverview Wheel scroll guard utilities
 *
 * Provides helpers for controlling wheel event propagation when nested scroll
 * containers exist (e.g., toolbar panels inside a gallery overlay).
 */

export interface WheelScrollGuardOptions {
  /** Selector used to find the nearest scrollable ancestor. */
  readonly scrollableSelector: string;
  /** Pixel tolerance for boundary checks. Defaults to 1. */
  readonly tolerance?: number;
}

export function findScrollableAncestor(
  target: EventTarget | null,
  scrollableSelector: string
): HTMLElement | null {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  return target.closest<HTMLElement>(scrollableSelector);
}

export function canConsumeWheelEvent(element: HTMLElement, deltaY: number, tolerance = 1): boolean {
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
 * Returns true when the browser's default wheel behavior should be allowed
 * because a nested scrollable element can consume the scroll.
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
