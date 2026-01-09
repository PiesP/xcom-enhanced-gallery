/**
 * @fileoverview Minimal type guards used by the runtime.
 * Keep this module small; prefer inlining simple instanceof checks.
 */

/**
 * Create a typed EventListener wrapper.
 * @template T - Event type to narrow to
 * @param handler - Handler with narrowed event type
 * @returns EventListener compatible with DOM event binding
 */
export function createEventListener<T extends Event = Event>(
  handler: (event: T) => void
): EventListener {
  return (event: Event) => {
    handler(event as T);
  };
}

/**
 * HTML element type guard.
 * @param element - Value to check
 * @returns True if value is HTMLElement
 */
export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

/**
 * Record object type guard.
 * @param value - Value to check
 * @returns True if value is a plain object (excludes arrays and null)
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
