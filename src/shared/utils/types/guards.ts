/**
 * Phase 135: Improve Type Safety - Type Guard functions
 * @description Replace type assertions with Type Guard functions to strengthen type safety
 * @version 2.0.0 - Phase 138.4: JSDoc standardization
 */

/**
 * Create EventListener wrapper function
 * @template T - Event type (default: Event)
 * @param handler - Typed event handler
 * @returns Function implementing EventListener interface
 * @description Ensure type safety when registering DOM event listeners
 * @example
 * ```typescript
 * const clickListener = createEventListener<MouseEvent>(e => {
 *   console.log(e.clientX, e.clientY); // Type-safe
 * });
 * element.addEventListener('click', clickListener);
 * ```
 */
export function createEventListener<T extends Event = Event>(
  handler: (event: T) => void,
): EventListener {
  return (event: Event) => {
    handler(event as T);
  };
}

/**
 * HTML element type guard
 * @param element - Value to check
 * @returns true if element is HTMLElement, false otherwise (type narrowing)
 * @example
 * ```typescript
 * const el = document.getElementById('something');
 * if (isHTMLElement(el)) {
 *   el.textContent = 'text'; // Type-safe
 * }
 * ```
 */
export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

/**
 * HTML Image Element type guard
 * @param element - Value to check
 * @returns true if element is HTMLImageElement
 */
export function isHTMLImageElement(element: unknown): element is HTMLImageElement {
  return element instanceof HTMLImageElement;
}

/**
 * HTML Video Element type guard
 * @param element - Value to check
 * @returns true if element is HTMLVideoElement
 */
export function isHTMLVideoElement(element: unknown): element is HTMLVideoElement {
  return element instanceof HTMLVideoElement;
}

/**
 * HTML Anchor Element type guard
 * @param element - Value to check
 * @returns true if element is HTMLAnchorElement
 */
export function isHTMLAnchorElement(element: unknown): element is HTMLAnchorElement {
  return element instanceof HTMLAnchorElement;
}

/**
 * Wheel Event type guard
 * @param event - Event to check
 * @returns true if event is WheelEvent (type narrowing)
 * @example
 * ```typescript
 * function handleScroll(e: Event) {
 *   if (isWheelEvent(e)) {
 *     console.log(e.deltaY, e.deltaX); // Type-safe
 *   }
 * }
 * ```
 */
export function isWheelEvent(event: Event): event is WheelEvent {
  return event instanceof WheelEvent;
}

/**
 * Keyboard Event type guard
 * @param event - Event to check
 * @returns true if event is KeyboardEvent
 */
export function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return event instanceof KeyboardEvent;
}

/**
 * Mouse Event type guard
 * @param event - Event to check
 * @returns true if event is MouseEvent
 */
export function isMouseEvent(event: Event): event is MouseEvent {
  return event instanceof MouseEvent;
}

/**
 * Element existence check and type guard
 * @template T - Expected Element type (default: Element)
 * @param element - Value to check
 * @returns true if element is an Element instance
 */
export function hasElement<T extends Element = Element>(element: unknown): element is T {
  return element instanceof Element;
}

/**
 * Array type guard (strict check)
 * @template T - Array element type
 * @param value - Value to check
 * @returns true if value is an array (type narrowing)
 * @example
 * ```typescript
 * const value: unknown = JSON.parse(data);
 * if (isArray<MyType>(value)) {
 *   value.map(item => item.id); // Type-safe
 * }
 * ```
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Record object type guard
 * @param value - Value to check
 * @returns true if value is a plain object (Record) (excludes arrays, null)
 * @example
 * ```typescript
 * if (isRecord(value)) {
 *   Object.entries(value).forEach(([key, val]) => { ... });
 * }
 * ```
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * AbortSignal type guard
 * @param value - Value to check
 * @returns true if value is AbortSignal
 */
export function isAbortSignal(value: unknown): value is AbortSignal {
  return value instanceof AbortSignal;
}

/**
 * AddEventListenerOptions object creation helper
 */
export function createAddEventListenerOptions(options?: {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}): AddEventListenerOptions {
  return (options || {}) as AddEventListenerOptions;
}

/**
 * Safely convert to Record (Use with Type Guard)
 * @description Use instead of type assertion for type safety
 * @param value - Value to convert
 * @returns Value converted to Record<string, unknown>
 * @throws Error if value is not a valid Record
 * @example
 * ```typescript
 * if (isRecord(value)) {
 *   const record = toRecord(value); // Type-safe
 * }
 * ```
 * @version 1.0.0 - Phase 192: Enhanced type safety
 */
export function toRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Value is not a valid Record<string, unknown>');
  }
  return value;
}

/**
 * Non-empty string type guard
 * @param value - Value to check
 * @returns true if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
