/**
 * @fileoverview Minimal type guards used by the runtime.
 *
 * Note: Keep this module small. Prefer inlining simple instanceof checks at call sites
 * unless a guard is used across multiple modules.
 */

/**
 * Create a typed EventListener wrapper.
 *
 * @template T - Event type to narrow to (defaults to Event)
 * @param handler - Event handler function with narrowed type
 * @returns EventListener compatible with DOM event binding
 * @example
 * ```typescript
 * const listener = createEventListener<MouseEvent>((e) => {
 *   console.log(e.clientX); // Type-safe MouseEvent
 * });
 * element.addEventListener('click', listener);
 * ```
 */
export function createEventListener<T extends Event = Event>(
  handler: (event: T) => void
): EventListener {
  return (event: Event) => {
    // Safe cast: eventListener must handle the generic type T
    handler(event as T);
  };
}

/**
 * HTML element type guard.
 *
 * @param element - Value to check
 * @returns true if element is HTMLElement, false otherwise (type narrowing)
 * @example
 * ```typescript
 * const el = document.getElementById('something');
 * if (isHTMLElement(el)) {
 *   el.textContent = 'text'; // Type-safe access to HTMLElement methods
 * }
 * ```
 */
export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

/**
 * Record object type guard.
 *
 * @param value - Value to check
 * @returns true if value is a plain object (Record), false for arrays and null
 * @example
 * ```typescript
 * if (isRecord(value)) {
 *   // value is typed as Record<string, unknown>
 *   Object.entries(value).forEach(([key, val]) => { ... });
 * }
 * ```
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
