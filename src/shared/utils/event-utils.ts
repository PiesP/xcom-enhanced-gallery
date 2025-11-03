/**
 * @fileoverview Event Utilities
 * @description Safe event handling utilities for consistent event management
 * @version 1.0.0 - Phase 326
 */

/**
 * Safely prevent default and stop propagation on an event
 *
 * @description
 * Unified event handling pattern for consistent behavior across components.
 * Handles optional events gracefully (useful for handlers that can be called
 * programmatically or from DOM events).
 *
 * @param event - Optional Event object
 *
 * @example
 * ```typescript
 * const handleClick = (event?: Event) => {
 *   safeEventPrevent(event);
 *   // ... your logic
 * };
 * ```
 */
export function safeEventPrevent(event?: Event): void {
  if (!event) return;
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Safely prevent default, stop propagation, and stop immediate propagation
 *
 * @description
 * Enhanced event prevention that also stops immediate propagation.
 * Useful when multiple handlers are attached to the same element and you want
 * to ensure no other handlers execute.
 *
 * @param event - Optional Event object
 *
 * @example
 * ```typescript
 * const handleCriticalClick = (event?: Event) => {
 *   safeEventPreventAll(event);
 *   // ... critical logic that must not be interrupted
 * };
 * ```
 */
export function safeEventPreventAll(event?: Event): void {
  if (!event) return;
  event.preventDefault();
  event.stopPropagation();

  // stopImmediatePropagation may not exist on all Event types
  const eventWithImmediate = event as Event & {
    stopImmediatePropagation?: () => void;
  };
  eventWithImmediate.stopImmediatePropagation?.();
}

/**
 * Safely stop propagation only (no preventDefault)
 *
 * @description
 * Stops event bubbling without preventing default behavior.
 * Useful when you want to isolate event handling but preserve
 * native browser behaviors (e.g., form submission, link navigation).
 *
 * @param event - Optional Event object
 *
 * @example
 * ```typescript
 * const handleNavigation = (event?: Event) => {
 *   safeEventStop(event);
 *   // ... navigation logic
 * };
 * ```
 */
export function safeEventStop(event?: Event): void {
  if (!event) return;
  event.stopPropagation();
}
